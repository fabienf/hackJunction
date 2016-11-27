
//=========================================================
// IMPORT
//=========================================================

var restify = require('restify');
var builder = require('../../core/');
var calling = require('../../calling/');
var prompts = require('./prompts');
var PythonShell = require('python-shell');
var JSON5 = require('json5');
var fs = require('fs');



//=========================================================
// Global paths and URLs
//=========================================================

var PATH_GMAIL_SCRIPT = '../../../../gmail/query_gmail.py'
var PATH_DIALOG_TO_TEXT = 'dialog_to_text.py'
var PATH_DROPBOX_UPDATE = 'DropboxUpdate.py'
var LUIS_URL = 'https://api.projectoxford.ai/luis/v2.0/apps/10fd6035-60aa-43e6-a12d-46646014f80a?subscription-key=776ae07c681943d9a0d41f306973163a&verbose=true'



//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat bot
var chatConnector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var chatBot = new builder.UniversalBot(chatConnector);
server.post('/api/messages', chatConnector.listen());

// Create calling bot
var connector = new calling.CallConnector({
    callbackUrl: process.env.CALLBACK_URL,
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new calling.UniversalCallBot(connector);
server.post('/api/calls', connector.listen());



//=========================================================
// Chat Dialogs
//=========================================================

server.post('/api/messages', function (req, res) {
    var members = req.body.members;
    console.log("[HA]:",members);
    // Process posted notification
    var msg = new builder.Message()
        .text("dgocat");
    bot.send(msg, function (err) {
        // Return success/failure
        res.status(err ? 500 : 200);
        res.end();
    });
});
// server.post('/api/messages', connector.listen());



//=========================================================
// Calling Dialogs
//=========================================================

// just so that we can msg to brocolli
chatBot.dialog('/', [
    function(){},
    function(){}
]); 


var lastSaid = "empty"
function stt(session, audio_data) {
    var pyshell = new PythonShell(PATH_DIALOG_TO_TEXT);
    
    log("[INFO]: ", "sending started")
    var stringifiedAudioData = JSON5.stringify(audio_data);
    var target = audio_data.recordedAudio;
    var jsonObj = JSON5.stringify(target);

    pyshell.send(jsonObj);
    log("[INFO]: ","SENT MSG");
    pyshell.on('message', function (message) {
        var key = "#135246#"
        console.log(message.substring(0, key.length));
        console.log(message.substring(0, key.length).indexOf(key));
        // Speech msg recieved here (content)
        if (message.substring(0, key.length).indexOf(key) >= 0){
            var content = message.substring(key.length);
            log('SAY', content);
            lastSaid = content;
            analyzeContent(session, content);
            sendMessage(session, content, 'highlight');
            session.replaceDialog('/', { full: false });
        } else {
            console.log("M: ", message);
        }
        
    });
    
    pyshell.end(function (err) {
        if (err) {
            console.error('PYSHELL error occured: ' + err);
        }
        
        console.log('PYSHELL finished');
    });
}

var started = false;
function initiateRecord(session) {
    var options = {
        playBeep: false,
        RecordingFormat: "wav",
        initialSilenceTimeoutInSeconds: 0 
    }
    
    if(!started){
        // sendMessage(session, "Conversation started.");
        calling.Prompts.record(session, "Hi I am brocoli, here to aid your conference", options);
        started = true;
    }
    else{
          calling.Prompts.record(session, null, options);
          lastSaid = "Interesting...";
    }
   
}


bot.dialog('/', [
    function (session) {
        // sendMessage(session, 'Test message', 'highlight');
        log('SESSION', 'started');
        initiateRecord(session);
    },

    function (session, results) {
        console.log('got to results');
        
        if (results.error) {
            log('Record error:', results.error);
            return;
        }
        
        if (results.response !== true && results.response !== undefined) {
            log("Response", "OK");
            stt(session, results.response);

            log("[INFO]: ", "SENT");
            
        } else {
            log("Response", "No audio to send");
            
        }
        session.replaceDialog('/', { full: false });
    },
    
    function (session, results) {
        // The menu runs a loop until the user chooses to quit.
        session.replaceDialog('/', { full: false });
    }
]);

function log(status, logMsg) {
    console.log(status, logMsg);
}

function sendMessage(session, text, info) {
    var address = session.message.address;
    
    if (info && info == 'highlight') {
        // text = "<span style=\"background-color:blue;\">" + text + "</span>";
        text = "**[SPEECH]: **"+"<i>" + text + "</i>";
        console.log(text);
    }
    
    var oldId = address.user['id'];
    if (address.threadId) {
        address.user['id'] = address.threadId;
    }
    
    delete address.conversation;

    var msg = new builder.Message(session)
        .text(text);
        
    chatBot.send(msg, function (err) {
        address.user['id'] = oldId;
        log("sendMessage Error", err);
    });
  
}



//=========================================================
// Analyze Content
//=========================================================

function analyzeContent(session, content) {
    // EVERYTHING THAT USES SPEECH TEXT GOES HERE - content is the recognized text
    // 'Do you remember the photo of a car I sent you today?'
    builder.LuisRecognizer.recognize(content, LUIS_URL, function (err, intents, entities) {
        if (err) {
            console.log("LUIS ERROR: ", err);
        }
        
        console.log(intents);
        
        var intent = intents[0]['intent'];
        console.log("intent: ", intent);
        if (intent == 'ShowImage') 
            intentReadGmail(session, entities);
        else if (intent == 'ReadMail')
            intentReadMail(session, entities);
        else if (intent == 'OpenCalendar')
            intentOpenCalendar(session);
    });

}



//=========================================================
// Intent dialog
//=========================================================

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
// var model = LUIS_URL;
// var recognizer = new builder.LuisRecognizer(model);
// var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

// chatBot.dialog('/m',dialog);
// dialog.matches('ReadMail', [
//     function (session, args, next) {
//         // Resolve entities passed from LUIS.
//         session.send("I understand it's about emails");
//         session.send("entities I can see" + args.entities);
//         var title;
//         var entDate = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');
//         if (entDate) {
//             session.send("I found time " + entDate.entity);
//         }
//         var contType = ''
//         if (builder.EntityRecognizer.findEntity(args.entities, 'sports')) 
//             contType = 'sports'
//         if (builder.EntityRecognizer.findEntity(args.entities, 'politics')) 
//             contType = 'politics'
//         if (builder.EntityRecognizer.findEntity(args.entities, 'finance')) 
//             contType = 'finance'
//         if (contType)
//             session.send("I found type " + entDate.entity);

//         callGmailScript(session,entDate.resolution.date,contType);
//     }
// ]);

// dialog.matches('ShowImage', [
//     function (session, args, next) {
//         // Resolve entities passed from LUIS.
//         session.send("I understand it's about photos");
//         session.send("entities I can see" + args.entities);
//         var contType = builder.EntityRecognizer.findEntity(args.entities, 'content')
//         if (contType)
//             session.send("I found type " + contType.entity);
//         if (contType.entity == 'car')
//             callDriveScript('trans_car',session);


//     }
// ]);




//=========================================================
// Gmail
//=========================================================

function sendGmailMessage(session, content) {
    // Delete conversation field from address to trigger starting a new conversation.
    var address = session.message.address;
    
    var oldId = address.user['id'];
    if (address.threadId) {
        address.user['id'] = address.threadId;
    }
    
    delete address.conversation;
    
    console.log("Creating GMAIL message");
    // Create a new chat message and pass it callers address
    var msg = new builder.Message()
        .address(address)
        .attachments([
            new builder.HeroCard(session)
                .title("Email")
                .text(content)
                .images([
                    builder.CardImage.create(session, "https://cdn4.iconfinder.com/data/icons/free-colorful-icons/360/gmail.png")
                ])
                .tap(builder.CardAction.openUrl(session, "https://www.gmail.com"))
        ]);
    
    console.log("Sending GMAIL message");
    chatBot.send(msg, function (err) {
        if (err) {
            log("sendGmailMessage Error", err);
        }
        
        address.user['id'] = oldId;
    });
}

function callGmailScript(session, date, categories) {
        var pyshellGmail = new PythonShell(PATH_GMAIL_SCRIPT, { mode: 'json'});
        console.log('Gmail Start');

        if (date & categories)
            pyshellGmail.send({"date":date, "categories":[categories]}); // put here json object with the query inputs
        else if (date)
                pyshellGmail.send({"date":date, "categories":[categories]}); // put here json object with the query inputs
        else if (categories)
                pyshellGmail.send({"categories":[categories]}); // put here json object with the query inputs
        else 
                pyshellGmail.send({}); // put here json object with the query inputs


        pyshellGmail.on('message', function (message) {
          // received a message sent from the Python script (a simple "print" statement)
          console.log("MSG: ", message);
          var extracted = JSON5.stringify(message[0][1]);
        //   sendMessage(session, extracted);
          sendGmailMessage(session, extracted);
        });

        // end the input stream and allow the process to exit
        pyshellGmail.end(function (err) {
            if (err) {
                console.log("GMAIL ERROR", err);
            }
            console.log('Gmail finished');
        });
}

function intentReadGmail(session,entities) {
    // Resolve entities passed from LUIS.
    console.log("I understand it's about photos");
    console.log("entities: ", entities);
    var contType = builder.EntityRecognizer.findEntity(entities, 'content');
    console.log("contentType: ", contType);
    
    if (contType && contType.entity) {
        if (contType)
            session.send("I found type " + contType.entity);
        if (contType.entity =='car')
            callDriveScript('trans_car',session);
    } else {
        callDriveScript('trans_car', session);
    }

}

function intentReadMail(session,entities) {
    session.send("I understand it's about emails");
        session.send("entities I can see" + entities);
        var title;
        var entDate = builder.EntityRecognizer.findEntity(entities, 'builtin.datetime.date');
        if (entDate) {
            if (entDate.entity) {
                session.send("I found time " + entDate.entity);
            } else {
                console.log("ERROR: missing entity. ", entDate);
            }
        }
        
        var contType = ''
        if (builder.EntityRecognizer.findEntity(entities, 'sports')) 
            contType = 'sports'
        if (builder.EntityRecognizer.findEntity(entities, 'politics')) 
            contType = 'politics'
        if (builder.EntityRecognizer.findEntity(entities, 'finance')) 
            contType = 'finance'
        if (contType)
            session.send("I found type " + entDate.entity);

        if (entDate.resolution) {
            callGmailScript(session, entDate.resolution.date, contType);
        } else {
            console.log("ERROR: Resolution not found :(");
        }
        
}

function intentOpenCalendar(session, entities) {
    console.log('SEND CALENDAR');
    sendMessage(session, "https://calendar.google.com/calendar/render#main_7");
}



//=========================================================
// One Drive
//=========================================================

function sendDriveMessage(session, link) {
    // Delete conversation field from address to trigger starting a new conversation.
    var address = session.message.address;
    
    var oldId = address.user['id'];
    if (address.threadId) {
        address.user['id'] = address.threadId;
    }
    
    
    delete address.conversation;

    // Create a new chat message and pass it callers address
    var msg = new builder.Message()
        .address(address)
        .attachments([
            new builder.HeroCard()
                .title("Cloud drive image link")
                .images([
                    builder.CardImage.create(session, 'http://blog.caranddriver.com/wp-content/uploads/2016/01/BMW-i8-Mirrorless-cameras-101-876x535.jpg')
                ])
                .tap(builder.CardAction.openUrl(session, link))
        ]);

    chatBot.send(msg, function (err) {
        address.user['id'] = oldId;
        log("sendMessage Error", err);
    });
    
}

function callDriveScript(args, session) {
        console.log('DRIVER');
        var pyshellDrive = new PythonShell(PATH_DROPBOX_UPDATE);

        console.log('Drive Start!');

        pyshellDrive.send(args); // put here json object with the query inputs

        pyshellDrive.on('message', function (message) {
          // received a message sent from the Python script (a simple "print" statement)
          console.log(message);
          sendDriveMessage(session, message);

        });

        // end the input stream and allow the process to exit
        pyshellDrive.end(function (err) {
            if (err) {
                console.log("DRIVE ERROR", err);
            };
            console.log('Drive finished');
        });
}

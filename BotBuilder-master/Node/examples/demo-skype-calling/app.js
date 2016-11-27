
var restify = require('restify');
var builder = require('../../core/');
var calling = require('../../calling/');
var prompts = require('./prompts');
var PythonShell = require('python-shell');
var JSON5 = require('json5');
var fs = require('fs');


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


var lastSaid = "empty"
function stt(session, audio_data) {
    var pyshell = new PythonShell('dialog_to_text.py');
    
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
        if (message.substring(0, key.length).indexOf(key) >= 0){
            var content = message.substring(key.length);
            log('SAY', content);
            lastSaid = content;
            sendMessage(session, content);
            session.replaceDialog('/', { full: false });
        }
        console.log(message);
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

function sendMessage(session, msg) {
    var address = session.message.address;
    
    
    var oldId = address.user['id'];
    if (address.threadId) {
        address.user['id'] = address.threadId;
    }
    
    // console.log('start');
    // console.log(address);
    // console.log('end');
    
    delete address.conversation;

    var msg = new builder.Message(session)
        .text(msg);
        
    chatBot.send(msg, function (err) {
        address.user['id'] = oldId;
        log("sendMessage Error", err);
    });
  
}

/*-----------------------------------------------------------------------------
This Bot is a sample calling bot for Skype.  It's designed to showcase whats 
possible on Skype using the BotBuilder SDK. The demo shows how to create a 
looping menu, recognize speech & DTMF, record messages, play multiple prompts,
and even send a caller a chat message.

# RUN THE BOT: https://ccd2ef93.ngrok.io

    You can run the bot locally using ngrok found at https://ngrok.com/.

    * Install and run ngrok in a console window using "ngrok http 3978".
    * Create a bot on https://dev.botframework.com and follow the steps to setup
      a Skype channel. Ensure that you enable calling support for your bots skype
      channel. 
    * For the messaging endpoint in the Details for your Bot at dev.botframework.com,
      ensure you enter the https link from ngrok setup and set
      "<ngrok link>/api/messages" as your bots calling endpoint.
    * For the calling endpoint you setup on dev.botframework.com, copy the https 
      link from ngrok setup and set "<ngrok link>/api/calls" as your bots calling 
      endpoint.
    * Next you need to configure your bots CALLBACK_URL, MICROSOFT_APP_ID, and
      MICROSOFT_APP_PASSWORD environment variables. If you're running VSCode you 
      can add these variables to your the bots launch.json file. If you're not 
      using VSCode you'll need to setup these variables in a console window.
      - CALLBACK_URL: This should be the same endpoint you set as your calling
             endpoint in the developer portal.
      - MICROSOFT_APP_ID: This is the App ID assigned when you created your bot.
      - MICROSOFT_APP_PASSWORD: This was also assigned when you created your bot.
    * To use the bot you'll need to click the join link in the portal which will
      add it as a contact to your skype account. When you click on the bot in 
      your skype client you should see an option to call your bot. If you're 
      adding calling to an existing bot can take up to 24 hours for the calling 
      option to show up.
    * You can run the bot by launching it from VSCode or running "node app.js"
      from a console window.  Then call your bot from a skype client to start
      the demo. 

-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('../../core/');
var calling = require('../../calling/');
var prompts = require('./prompts');
var PythonShell = require('python-shell');
var pyshell = new PythonShell('dialog_to_text_test.py');
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
    // Process posted notification
    var msg = new builder.Message()
        .text("dgocat");
    bot.send(msg, function (err) {
        // Return success/failure
        res.status(err ? 500 : 200);
        res.end();
    });
});

  
//=========================================================
// Calling Dialogs
//=========================================================


function stt(audio_data) {
    var stringifiedAudioData = JSON5.stringify(audio_data);
    var target = audio_data.recordedAudio;
    var jsonObj = JSON5.stringify(target);

    pyshell.send(jsonObj);
    pyshell.on('message', function (message) {
      console.log(message);
    });
    
    // pyshell.end(function (err) {
    //   console.log('PYSHELL finished');
    // });
}

var started = false;
function initiateRecord(session) {
    if(!started){
         calling.Prompts.record(session, "Hi I am brocoli, here to aid your conference", { playBeep: false, RecordingFormat: "wav" });
    }
    else{
          calling.Prompts.record(session, "Interesting...", { playBeep: false, RecordingFormat: "wav" });
    }
   
}


bot.dialog('/', [
    function (session) {
        log('SESSION', 'started');
        initiateRecord(session);
    },

    function (session, results) {
        console.log('got to results');
        console.log(typeof results.response);
        console.log(results.response.recordedAudio);
        
        if (results.error) {
            log('Record error:', results.error);
            return;
        }
        
        if (results.response !== true && results.response !== undefined) {
            log("Response", "OK");
            stt(results.response);
            
            // session.endDialog(prompts.record.result, results.response.lengthOfRecordingInSecs);
        } else {
            log("Response", "No audio to send");
        }
    },
    
    function (session, results) {
        // The menu runs a loop until the user chooses to quit.
        started = true;
        session.replaceDialog('/', { full: false });
    }
]);


function log(status, logMsg) {
    console.log(status, logMsg);
}
var restify = require('restify');
var calling = require('botbuilder-calling');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create calling bot
var connector = new calling.CallConnector({
    callbackUrl: 'https://bottestservice.azurewebsites.net/api/calls',
    appId: '0cf64a0b-a0a7-4bd2-bae8-2f699d042816',
    appPassword: '2x7ATThoGeJfNvjSdixxvk1'
});
var bot = new calling.UniversalCallBot(connector);
server.post('/api/calls', connector.listen());

// Add root dialog
bot.dialog('/', function (session) {
    session.send('Watson... come here!');
});
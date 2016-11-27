

var PythonShell = require('python-shell'); //../BotBuilder-master/Node/node_modules/
var pyshell = new PythonShell('query_gmail.py', { mode: 'json'} );



pyshell.send( {"date":"2016/11/27"});//{"from_address":"ludanev", "categories":"sports"}); // put here json object with the query inputs

pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);

});


// end the input stream and allow the process to exit
pyshell.end(function (err) {
  if (err) {
    console.log("CALL_QUERY_GMAIL error: ", err);
  }
  console.log('finished');
});
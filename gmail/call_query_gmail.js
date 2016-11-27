

var PythonShell = require('python-shell');
var pyshell = new PythonShell('query_gmail.py'
	, { mode: 'json'}
);



pyshell.send( {"from_address":"ludanev", "categories":"sports"}); // put here json object with the query inputs

pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);

});


// end the input stream and allow the process to exit
pyshell.end(function (err) {
  if (err) throw err;
  console.log('finished');
});
var PythonShell = require('python-shell');
var pyshell = new PythonShell('speech_test.py');
var fs = require('fs');


fs.readFile('eric.wav', function(err, waveData) {
console.log(waveData);
if(err) return console.log(err);
// sends a message to the Python script via stdin
pyshell.send('as');

pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);
});

// end the input stream and allow the process to exit
pyshell.end(function (err) {
  if (err) throw err;
  console.log('finished');
});
});
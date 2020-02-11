const fork = require('child_process').fork;
const path = require('path');
var exec = require('child_process').exec;

const program = path.resolve('child.js');
const parameters = ['hello', 'world'];
const options = {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
};

const child = fork(program, parameters, options);
child.send('Hi');

child.on('message', message => {
    console.log('message from child:', message);
    // child.send('Hi');
});



var blContainerTempName = 'bl-1114';

// setTimeout(function() {
//     var cmd2 = 'docker rm $(docker stop ' + blContainerTempName + ')';
//     var cmd2 = 'docker stop ' + blContainerTempName;
//     var runCmd2 = exec(cmd2);
//     // runCmd2.stdout.on('data', function(data) {
//     // console.log('stop bl cmd :' + data);

//     // });
//     child.kill('SIGHUP');

// }, 10000);
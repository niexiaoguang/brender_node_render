var blendProjectFilePath = 'test_small_cycles_cpu.blend';

var blendExecPath = '/home/pata/blender/blender-2.81a-linux-glibc217-x86_64/blender';

var localPath = '/home/pata/brender_dev/brender_node_render/blmedia/';
var containerPath = '/media/';
var containerOutputPath = '/media/';
var outputLogPath = localPath + 'output.log';
var engine = "CYCLES";
var samples = 64;
var frame = 2;
var w = 1920;
var h = 1080;
var scene = 'Scene';
var containerTempName;

var exec = require('child_process').exec;



var cmdReadLogOutput = 'tail -n 1 ' + outputLogPath;


// console.log(cmdRunBl1);
// console.log(cmdReadLogOutput);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

var status;
// const { exec } = require('child_process');

const checkLog = () => {

    exec(cmdReadLogOutput, (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            return;
        }

        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        if (stdout.indexOf('Blender quit') > -1) {
            return;
        }
    });

}

const stop = async () => {

    await sleep(3000);

    var cmd2 = 'docker rm $(docker stop ' + containerTempName + ')';
    var runCmd2 = await exec(cmd2);
    runCmd2.stdout.on('data', function(data) {
        console.log(data);

    });
};
const run = async () => {


    containerTempName = 'bl-' + new Date().getTime();
    var blImageName = 'bl281a';
    var blPyScriptName = 'prepare.py';
    // var runCmd = exec('docker run -i --log-driver=none -a stdin -a stdout -a stderr -v /home/pata/brender_dev/brender_node_render/blmedia/:/media/ --name bl281name2 bl281a -b /media/test_small_cycles_cpu.blend -P /media/prepare.py -- engine CYCLES samples 64 scene Scene frame 2 w 640 h 480 outputpath /media/');
    var cmd1 = 'docker run -i --log-driver=none -a stdin -a stdout -a stderr -v ' +
        localPath + ':' + containerPath +
        ' --name ' + containerTempName + ' ' + blImageName +
        ' -b ' + containerPath + blendProjectFilePath +
        ' -P ' + containerPath + blPyScriptName +
        ' --' + ' engine ' + engine +
        ' samples ' + samples +
        ' scene ' + scene +
        ' frame ' + frame +
        ' w ' + w +
        ' h ' + h +
        ' outputpath ' + containerOutputPath;


    console.log(cmd1);

    var runCmd = await exec(cmd1);
    runCmd.stdout.on('data', function(data) {
        // console.log(data);
        var mark1 = data.indexOf('Rendered');
        var mark2 = data.indexOf('Tiles');
        if (mark1 > -1 && mark2 > -1) {
            // 'Rendered 79/80 ' like 
            // var str1 = data.substing(mark1, mark2);
            // quick handle 
            var str = data.substring(mark1 + 9, mark2 - 1);

            var done = parseInt(str.split('/')[0]);
            var all = parseInt(str.split('/')[1]);
            var proc = 100 * done / all + '%';
            console.log(proc);

        }
    });

    // const spawn = require('child_process').spawn;

    // var cmd = spawn('docker' ['run', '-i', '--log-driver=none', '-a', 'stdin', '-a', 'stdout', '-a', 'stderr', '-v', '/home/pata/brender_dev/brender_node_master/task/blmedia/:/media/', 'bl281a', '-b', '/media/test_small_cycles_cpu.blend', '-P', '/media/prepare.py', '--', 'engine', 'CYCLES', 'samples', '64', 'scene', 'Scene', 'frame', '2', 'w', '1920', 'h', '1080', 'outputpath', '/media/']);


    // cmd.stdout.on('data', function(data) {
    //     console.log('stdout: ' + data.toString());
    // });

    // cmd.stderr.on('data', function(data) {
    //     console.log('stderr: ' + data.toString());
    // });

    // cmd.on('exit', function(code) {
    //     console.log('child process exited with code ' + code.toString());
    // });




    // exec(cmdRunBl, (err, stdout, stderr) => {
    //     if (err) {
    //         //some err occurred
    //         console.error(err)
    //     } else {
    //         // the *entire* stdout and stderr (buffered)
    //         console.log(`blender stdout: ${stdout}`);
    //         status = stdout;
    //         console.log(`blender stderr: ${stderr}`);

    //     }
    // });

    // setInterval(checkLog, 1000);
};

run();
stop();
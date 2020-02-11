var exec = require('child_process').exec;


var blContainerTempName = ''; // global var need to give value
var cmdReadLogOutput = 'tail -n 1 ' + outputLogPath;

var gProgress = '';
var blStdout = '';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};


const getProgress = (output) => {
    var proc = '';
    var mark1 = output.indexOf('Rendered');
    var mark2 = output.indexOf('Tiles');
    if (mark1 > -1 && mark2 > -1) {
        // 'Rendered 79/80 ' like 
        // var str1 = output.substing(mark1, mark2);
        // quick handle 
        var str = output.substring(mark1 + 9, mark2 - 1);

        var done = parseInt(str.split('/')[0]);
        var all = parseInt(str.split('/')[1]);
        proc = 100 * done / all + '%'; // TODO remove digit
        // console.log(proc);
    }
    return proc;
};


// task job data format --------------------------------

// {
//     name: 'fuid',
//     opts: { jobId: 'fuid' + 'frame' + ts },
//     data: {
//         uuid: 'uuid',
//         fuid: 'fuid',
//         job: {
//             workernum: 5, // number of workers at a time 
//             frame: 3, // current rendering frame

//         },
//         opts: {
//             scene:'Scene',
//             resolution: [1920, 1080],
//             engine: 'CYCLES' / 'BLENDER_EEVEE',
//             samples: 200,
//             frames: [1, 250],
//             step: 1,

//         }
//     }
// }
const render_frame = async (job) => {
    var jobData = job.data;
    var uuid = jobData.uuid;
    var fuid = jobData.fuid;
    var blendProjectFilePath = config.userFileRootPath + uuid + '/' + fuid + '.blend';

    var localPath = config.localPath;
    var containerPath = config.containerPath;
    var containerOutputPath = config.containerOutputPath;
    var outputLogPath = config.outputLogPath;
    var engine = jobData.opts.engine;
    var samples = jobData.opts.samples;
    var frame = jobData.job.frame;
    var w = jobData.opts.resolution[0];
    var h = jobData.opts.resolution[1];
    var scene = jobData.opts.scene;

    blContainerTempName = 'bl-' + new Date().getTime();

    var cmdRender = 'docker run -i --log-driver=none -a stdin -a stdout -a stderr -v ' +
        localPath + ':' + containerPath +
        ' --name ' + blContainerTempName + ' ' + config.blImageName +
        ' -b ' + containerPath + blendProjectFilePath +
        ' -P ' + containerPath + config.blPyScriptName +
        ' --' + ' engine ' + engine +
        ' samples ' + samples +
        ' scene ' + scene +
        ' frame ' + frame +
        ' w ' + w +
        ' h ' + h +
        ' outputpath ' + containerOutputPath;


    console.log(cmdRender);

    var runCmdRender = exec(cmdRender);
    runCmdRender.stdout.on('data', function(data) {
        // console.log(data);
        var mark1 = data.indexOf('Rendered');
        var mark2 = data.indexOf('Tiles');
        if (mark1 > -1 && mark2 > -1) {
            blStdout = data;
            gProgress = getProgress(data);

        }
    });

    intoLoop();
};
const render = async (job) => {
    return await render_frame(job); // TODO other render task in the future
};

exports.render = render;















// const checkLog = () => {

//     exec(cmdReadLogOutput, (err, stdout, stderr) => {
//         if (err) {
//             // node couldn't execute the command
//             return;
//         }

//         // the *entire* stdout and stderr (buffered)
//         console.log(`stdout: ${stdout}`);
//         console.log(`stderr: ${stderr}`);

//         if (stdout.indexOf('Blender quit') > -1) {
//             return;
//         }
//     });

// }

// const stop = async () => {

//     await sleep(3000);

//     var cmd2 = 'docker rm $(docker stop ' + containerTempName + ')';
//     var runCmd2 = await exec(cmd2);
//     runCmd2.stdout.on('data', function(data) {
//         console.log(data);

//     });
// };

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


// var blendProjectFilePath = 'test_small_cycles_cpu.blend';

// var blendExecPath = '/home/pata/blender/blender-2.81a-linux-glibc217-x86_64/blender';

// var localPath = '/home/pata/brender_dev/brender_node_render/blmedia/';
// var containerPath = '/media/';
// var containerOutputPath = '/media/';
// var outputLogPath = localPath + 'output.log';
// var engine = "CYCLES";
// var samples = 64;
// var frame = 2;
// var w = 1920;
// var h = 1080;
// var scene = 'Scene';
// var containerTempName;



// const run = async () => {


//     containerTempName = 'bl-' + new Date().getTime();
//     var blImageName = 'bl281a';
//     var blPyScriptName = 'prepare.py';
//     // var runCmd = exec('docker run -i --log-driver=none -a stdin -a stdout -a stderr -v /home/pata/brender_dev/brender_node_render/blmedia/:/media/ --name bl281name2 bl281a -b /media/test_small_cycles_cpu.blend -P /media/prepare.py -- engine CYCLES samples 64 scene Scene frame 2 w 640 h 480 outputpath /media/');
//     var cmd1 = 'docker run -i --log-driver=none -a stdin -a stdout -a stderr -v ' +
//         localPath + ':' + containerPath +
//         ' --name ' + containerTempName + ' ' + blImageName +
//         ' -b ' + containerPath + blendProjectFilePath +
//         ' -P ' + containerPath + blPyScriptName +
//         ' --' + ' engine ' + engine +
//         ' samples ' + samples +
//         ' scene ' + scene +
//         ' frame ' + frame +
//         ' w ' + w +
//         ' h ' + h +
//         ' outputpath ' + containerOutputPath;


//     console.log(cmd1);

//     var runCmd = await exec(cmd1);
//     runCmd.stdout.on('data', function(data) {
//         // console.log(data);
//         gProcess = getProgress(data);
//     });


// };
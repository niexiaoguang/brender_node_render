var exec = require('child_process').exec;

var config = {};

config.blenderExecPath = '/usr/local/blender/blender';
config.BlenderQuitStr = 'Blender quit';

const get_progress = (message) => {
    var proc = null;
    var mark1 = message.indexOf('Rendered');
    var mark2 = message.indexOf('Tiles');
    if (mark1 > -1 && mark2 > -1) {
        // 'Rendered 79/80 ' like 
        // var str1 = message.substing(mark1, mark2);
        // quick handle 
        var str = message.substring(mark1 + 9, mark2 - 1);

        var done = parseInt(str.split('/')[0]);
        var all = parseInt(str.split('/')[1]);
        proc = 100 * done / all; // bull queue job use 0 - 100 for progress
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
const render = () => {
    console.log('=====================  rendering ====================');
    console.log('got parameters fuid : ' + process.env.fuid);
    const fuid = process.env.fuid;
    const uuid = process.env.uuid;
    const engine = process.env.engine;
    const scene = process.env.scene;
    const frame = process.env.frame;
    const samples = process.env.samples;
    const w = process.env.w;
    const h = process.env.h;
    const ts = process.env.ts;
    const scriptPath = process.env.scriptPath;
    const rootPath = process.env.outputRootpath;


    const blendProjectFilePath = rootPath +
        uuid + '/' +
        fuid + '/' +
        fuid + '.blend'; // use fuid as blender project file name , and with mutable utf8 name insde config.js under fuid path TODO
    const blPyScriptPath = scriptPath;
    const blenderExecPath = config.blenderExecPath;
    const outputPath = rootPath +
        uuid + '/' +
        fuid + '/' +
        ts + '/';

    const logFilePath = rootPath +
        uuid + '/' +
        fuid + '/' +
        ts + '/log/' +
        frame + '.log'; // need node master to create all the path TODO



    // maybe better python args parse in future TODO
    // from python script
    //     print(argv)
    // myRenderSetting = {}
    // myRenderSetting['engine']       = argv[1]
    // myRenderSetting['samples']      = argv[3]
    // myRenderSetting['scene']        = argv[5]
    // myRenderSetting['frame']        = argv[7]
    // myRenderSetting['w']            = argv[9]
    // myRenderSetting['h']            = argv[11]
    // myRenderSetting['outputPath']   = argv[13]


    const cmdRender = blenderExecPath +
        ' -b ' + blendProjectFilePath +
        ' -P ' + blPyScriptPath +
        ' --' + ' engine ' + engine +
        ' samples ' + samples +
        ' scene ' + scene +
        ' frame ' + frame +
        ' w ' + w +
        ' h ' + h +
        ' outputpath ' + outputPath +
        ' 2>&1 | tee ' + // output sdtout and stderr to log file
        logFilePath;


    console.log('render with cmd : ' + cmdRender);

    const runCmdRender = exec(cmdRender);
    runCmdRender.stdout.on('data', function(data) {
        if (process.send) {
            if (data !== config.BlenderQuitStr) {
                data = get_progress(data); // make progress number string
                if (data) {
                    process.send(data);

                }
            } else {
                process.send(data); // send 'Blender quit'
            }

        }
    });

};
// const render = async (data) => {
//     return await render_frame(data); // TODO other render task in the future
// };

render();
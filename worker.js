const Queue = require('bull');

const config = require('./config.js');

const { logger } = require('./logger.js');

const DB = require('./db.js');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

// const fork = require('child_process').fork;

// const path = require('path');


const fs = require('fs')

const {
    setIntervalAsync,
    clearIntervalAsync
} = require('set-interval-async/dynamic')

const sleep = (mil) => new Promise((res, rej) => setTimeout(res, mil));


var wQ; // global variable for queue


var gDevice = '';

var gRootPath;






const handle_db_connection_err = (data) => {
    logger.log('error', 'db connection broken with %s', JSON.stringify(data));
    process.exit(1);
};



// =============================================================
const get_task_state = async (tuid) => {
    var queryResp = await DB.get_task_state(tuid);
    if (queryResp !== config.DBErrCode) {
        return queryResp[0].state;

    } else {
        handle_db_connection_err();

    }
};

// =============================================================

const mayAddNextJobs = async (job) => {

    // check if task still as 'started' by db query
    var tuid = job.data.job.tuid;
    var state = await get_task_state(tuid);
    if (state == config.DBStateCodeStarted) {

        var data = job.data;

        var sframe = data.opts.frames[0];
        var eframe = data.opts.frames[1];
        var frame = data.job.frame;
        var workernum = data.job.workernum;
        var step = data.opts.step;

        var fuid = data.fuid;
        var nextFrame = frame + workernum * step;
        if (nextFrame <= eframe) {
            data.job.frame = nextFrame;
            var ts = new Date().getTime();
            var jobId = fuid + config.Seperator + nextFrame + config.Seperator + ts;
            var name = fuid;
            var opts = { jobId: jobId };

            wQ.add(name, data, opts);
        }
    } else {
        return job;
    }

};

// {
//     data: {
//         uuid: 'uuid',
//         fuid: 'fuid',
//         job: {
//             workernum: 2, // number of workers at a time 
//             frame: 3, // current rendering frame
//             tuid: 'tuid',
//             ts:'ts',
//             script:'prepare.py',
//             jobid: 'tuid' + frame,
//         },
//          opts: { engine: 'engine', 
//             scene: 'Scene', 
//             frames: [1, 250], 
//             step: 1, 
//             resolution: [1920, 1080], 
//             samples: 64 }
//         }
//     }
// }

const prepare_cmd = (jobData) => {
    const fuid = jobData.fuid;
    const uuid = jobData.uuid;
    const engine = jobData.opts.engine;
    const scene = jobData.opts.scene;
    const frame = jobData.job.frame;
    const samples = jobData.opts.samples;
    const w = jobData.opts.resolution[0];
    const h = jobData.opts.resolution[1];
    const ts = jobData.job.ts;
    const scriptPath = jobData.job.script;
    const rootPath = gRootPath;


    const blendProjectFilePath = rootPath +
        uuid + '/' +
        fuid + '/' +
        fuid + '.blend'; // use fuid as blender project file name , and with mutable utf8 name insde config.js under fuid path TODO
    const blPyScriptPath = rootPath + 'scripts/' + scriptPath;
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

    // '/usr/local/blender/blender -b /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8.blend -P /home/pata/brender_dev/brender_data/media/scripts/prepare.py -- engine CYCLES samples 128 scene Scene frame 23 w 640 h 480 outputpath /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/1581839590572/ 2>&1 | tee /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/1581839590572/log/23.log';
    const cmd = blenderExecPath + ' ' +
        '-b' + ' ' +
        blendProjectFilePath + ' ' +
        '-P' + ' ' +
        blPyScriptPath + ' ' +
        '--' + ' ' +
        'engine' + ' ' + engine + ' ' +
        'samples' + ' ' + samples + ' ' +
        'scene' + ' ' + scene + ' ' +
        'frame' + ' ' + frame + ' ' +
        'w' + ' ' + w + ' ' +
        'h' + ' ' + h + ' ' +
        'outputpath' + ' ' + outputPath + ' ' +
        '2>&1 | tee ' + logFilePath;

    logger.info('prepared cmd is ' + cmd);
    return cmd;

}

const save_result_to_db = async (job, code) => {

    job.data.job.device = gDevice; // add device info
    var res = await DB.insert_jobs_table(job, code);
    if (res !== config.DBErrCode) {
        return res;
    } else {
        handle_db_connection_err();
    }


}

const handle_cmd_failed_job = (job) => {
    // record all job info for the fatal error
    logger.info('error', 'fatal error:cmd render failed', JSON.stringify(job));
    process.exit(1);
};

const handle_failed_job = async (job) => {
    var res = await save_result_to_db(job, config.DBStateCodeFailed);
    return res;
};

const handle_stopped_job = async (job) => {
    var res = await save_result_to_db(job, config.DBStateCodeStopped);
    return res;
};

const handle_finished_job = async (job) => {
    // check result image

    var res = await save_result_to_db(job, config.DBStateCodeFinished);
    res = await mayAddNextJobs(job);
    return job.data;

};





// {
//     data: {
//         uuid: 'uuid',
//         fuid: 'fuid',
//         job: {
//             workernum: 2, // number of workers at a time 
//             frame: 3, // current rendering frame
//             tuid: 'tuid',
//             ts:'ts',
//             script:'prepare.py',
//             jobid: 'tuid' + frame,
//         },
//          opts: { engine: 'engine', 
//             scene: 'Scene', 
//             frames: [1, 250], 
//             step: 1, 
//             resolution: [1920, 1080], 
//             samples: 64 }
//         }
//     }
// }
// =============================================================
const worker = async (job) => {
    logger.info('worker got job : ' + JSON.stringify(job));
    var res = await get_task_state(job.data.job.tuid);
    // waiting for db response
    await sleep(3000);
    logger.info('waiting to check db res');
    if (res == config.DBStateCodeStarted) {

        var jobData = job.data;
        var uuid = jobData.uuid;
        var fuid = jobData.fuid;
        var ts = jobData.job.ts;
        var fileName = fuid + '.blend';


        // check path and file

        var targetBlenderFilePath = gRootPath + uuid + '/' + fuid + '/' + fileName;

        try {
            if (fs.existsSync(targetBlenderFilePath)) {
                //file exists
                logger.info('blender file checked : ' + targetBlenderFilePath);
            }
        } catch (err) {
            logger.error(err);
            return config.TaskErrCodeFileNotExist;
        }


        // all ready , add start ts mark into job
        // add job do start ts for rendering
        job.data.job.job_start_ts = new Date().getTime();




        logger.info('do start loop and rendering');



        var intervalId = setIntervalAsync(
            async (job) => {
                    var res = await get_task_state(job.data.job.tuid);

                    // logger.info('loop check db : ' + JSON.stringify(res));
                    if (res !== config.DBStateCodeStarted) {
                        logger.info('task stopped by user');
                        clearIntervalAsync(intervalId);
                        var res = await handle_stopped_job(job);
                        logger.info('job stopped : ' + JSON.stringify(job));
                        process.exit(1); // =============  just stop this process and let docker reload it , maybe better handle in next version  FIXME
                    }
                },
                3000, job
        )

        var stdOtp;
        var stdErr;

        const cmd = prepare_cmd(jobData);
        logger.info('start rendering with cmd : ' + cmd);
        try {
            const { stdout, stderr } = await exec(cmd);
            stdOtp = stdout;
            stdErr = stderr;
            // console.log('stdout:', stdout);
            // console.log('stderr:', stderr);
        } catch (e) {
            logger.error(e); // should contain code (exit code) and signal (that caused the termination).
            handle_cmd_failed_job(job);
        }


        if (stdOtp.indexOf('Saved:') > -1) {
            logger.info('saved a pic');
            clearIntervalAsync(intervalId);
            return await handle_finished_job(job);

        } else {
            return await handle_failed_job(job);
        }






    } else if (type(res) == undefined) {
        logger.error('db connection timeout');
        return config.DBErrCode;
    } else {
        logger.info('job stopped : ' + JSON.stringify(job));
        // handle_db_connection_err(job);
        return config.TaskErrCodeDbNoRecord;
    }




};

const get_system_device = () => {
    return ''; // TODO  exec  'lshw -C display' to check system info
};

// =============================================================

const init = (redisHost, redisPort, redisPass, queueName) => {

    gRootPath = process.env.rootpath;
    // init queue
    gDevice = get_system_device();

    wQ = new Queue(queueName, {
        redis: {
            port: redisPort,
            host: redisHost,
            password: redisPass
        }
    }); // Specify Redis connection using object

    var queueReady = false;
    wQ.getJobCounts().then(res => {
        logger.info('task queue init with job Count: ' + res);
        queueReady = true;
    });

    setTimeout(function() {
        if (!(queueReady)) {
            logger.error('failed to init task queue name : ' + queueName);
            process.exit(1);
        }
    }, 3000);


    wQ.process('*', async (job) => {
        return await worker(job);
    });

    // wQ.on('completed', async (job, result) => {
    //     if (result == config.TaskErrCodeDbNoRecord) {
    //         return;
    //     } else if (result == config.TaskErrCodeFileNotExist) {
    //         return;
    //     } else {
    //         return await mayAddNextJobs(job); // like process ?? TODO

    //     }


    // });

};

exports.init = init;
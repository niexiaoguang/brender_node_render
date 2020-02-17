const Queue = require('bull');

const config = require('./config.js');

const Blender = require('./node_docker_blender.js');

const { logger } = require('./logger.js');

const DB = require('./db.js');

const fork = require('child_process').fork;

const path = require('path');

const blprogram = path.resolve('node_docker_blender.js');

const fs = require('fs')


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

    return queryResp[0].state;
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
const prepare_params = (jobData) => {
    var uuid = jobData.uuid;
    var fuid = jobData.fuid;

    var frame = jobData.job.frame;

    var engine = jobData.opts.engine;
    var w = jobData.opts.resolution[0];
    var h = jobData.opts.resolution[1];
    var scene = jobData.opts.scene;
    var samples = jobData.opts.samples;
    var script = jobData.job.script;
    var scriptPath = gRootPath + 'scripts/' + script; // better handle TODO
    var ts = jobData.job.ts;
    var tuid = jobData.job.tuid;
    var outputRootpath = gRootPath;
    // var resp = [
    //     fuid,
    //     uuid,
    //     engine,
    //     scene,
    //     frame,
    //     samples,
    //     w,
    //     h,
    //     ts,
    //     scriptPath,
    //     outputRootpath
    // ].join(' ');

    var data = {};
    data.fuid = fuid;
    data.uuid = uuid;
    data.engine = engine;
    data.scene = scene;
    data.frame = frame;
    data.samples = samples;
    data.w = w;
    data.h = h;
    data.ts = ts;
    data.scriptPath = scriptPath;
    data.outputRootpath = outputRootpath;


    return { env: data };
};


// const fuid = data.fuid;
// const uuid = data.uuid;
// const startTs = data.start;
// const code = data.code;

const save_result_to_db = async (job, code) => {

    job.data.job.device = gDevice; // add device info
    var res = await DB.insert_jobs_table(job, code);
    return res;

}

const handle_failed_job = (job) => {
    save_result_to_db(job, config.DBStateCodeFailed);

};

const handle_stopped_job = (job) => {
    save_result_to_db(job, config.DBStateCodeStopped);
};

const handle_finished_job = (job) => {
    // check result image
    var uuid = job.data.uuid;
    var fuid = job.data.fuid;
    var ts = job.data.ts;
    var fram = job.data.job.frame;
    var checkImageFilePath = gRootPath +
        uuid + '/' +
        fuid + '/' +
        ts + '/' +
        frame + '.png';

    var logFilePath =
        gRootPath +
        uuid + '/' +
        fuid + '/' +
        ts + '/log/' +
        frame + '.log';
    try {
        if (fs.existsSync(checkImageFilePath)) {
            //file exists
            logger.info('rendered image file checked : ' + checkImageFilePath);
            save_result_to_db(job, config.DBStateCodeFinished);
            if (fs.existsSync(logFilePath)) {
                //file exists
                logger.info('remove log file : ' + logFilePath);
                save_result_to_db(job, config.DBStateCodeFinished);
                return;
            }

            return;
        }


    } catch (err) {
        logger.error(err);
        handle_failed_job(job);
    }

};

const check_result = async (job) => {
    // check if image existed
    // save reslut to db
    var fuid = job.data.fuid;
    var uuid = job.data.uuid;
    var ts = job.data.job.ts;
    var frame = job.data.job.frame;
    var targetResultImagePath = gRootPath + '/' +
        uuid + '/' +
        fuid + '/' +
        ts + '/' +
        frame + '.png';

    try {
        if (fs.existsSync(targetResultImagePath)) {
            //file exists
            logger.info('rendered file checked : ' + targetResultImagePath);
            handle_finished_job(job);
        }
    } catch (err) {
        // rendered image not existed , failed
        logger.error(err);
        handle_failed_job(job);

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
// =============================================================
const worker = async (job) => {
    logger.info('worker got job : ' + JSON.stringify(job));
    var res = await get_task_state(job.data.job.tuid);
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
        job.data.job.startTs = new Date().getTime();


        // set up child blender 
        const parameters = prepare_params(jobData);
        const options = {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        };

        const child = fork('./node_docker_blender.js', parameters, options);


        child.on('message', message => {
            logger.info('rendering info : ' + message);
            if (message == config.BlenderQuitStr) {
                gStopMarker = true;
                check_result(job);
            } else {
                // update progress
                job.progress(parseInt(message));
            }
        });

        child.on('exit', result => {
            logger.info('exit with : ' + result);
            mayAddNextJobs(job);


        })
        // //into loop
        // var gStopMarker = false;
        // let intervalid;
        // async function testFunction() {
        //     intervalid = setInterval(() => {
        //         // I use axios like: axios.get('/user?ID=12345').then
        //         new Promise(function(resolve, reject) {
        //             // resolve('something')
        //             logger.info('in loop : ' + new Date().getTime());
        //         }).then(res => {
        //             if (condition) {
        //                 // do something 
        //             } else {
        //                 clearInterval(intervalid)
        //             }
        //         })
        //     }, config.TaskSateCheckFreq)
        // }
        // // you can use this function like
        // var res = await testFunction();
        // var refreshId = setInterval(function(job) {

        //     if (gStopMarker) {
        //         // child finished
        //         clearInterval(refreshId);
        //         handle_finished_job(job);

        //     } else {
        //         logger.info("looping");
        //         // var state = await get_task_state(jobData.job.tuid);
        //         // if (state !== config.DBStateCodeStarted) {
        //         //     // kill child 
        //         //     child.kill('SIGHUP');
        //         //     clearInterval(refreshId);
        //         //     handle_stopped_job(job);

        //         // }
        //     }

        // }, config.TaskSateCheckFreq); // set interval better TODO

    } else {

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

    wQ.on('completed', async (job, result) => {
        if (result == config.TaskErrCodeDbNoRecord) {
            return;
        } else if (result == config.TaskErrCodeFileNotExist) {
            return;
        } else {
            return await mayAddNextJobs(job); // like process ?? TODO

        }


    });

};

exports.init = init;
const Queue = require('bull');

const config = require('./config.js');

const Blender = require('./node_docker_blender.js');

const { logger } = require('./logger.js');

const DB = require('./db.js');

const fork = require('child_process').fork;

const path = require('path');

const blprogram = path.resolve('node_docker_blender.js');

const fs = require('fs')




// set stop marker for parent worker process as false
var gStopMarker = false;

var gDevice = '';

const handle_db_connection_err = (data) => {
    logger.log('error', 'db connection broken with %s', JSON.stringify(data));
    process.exit(1);
};



// =============================================================
const get_task_state = async (tuid) => {
    var queryResp = await DB.get_task_state(tuid);

    return queryResp.state;
};

// =============================================================

const mayAddNextJobs = async (job) => {

    // check if task still as 'started' by db query
    var fuid = job.data.fuid;
    var state = await getTaskState(fuid);
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

// -----------  TODO
// {
//     data: {
//         uuid: 'uuid',
//         fuid: 'fuid',
//         job: {
//             workernum: 5, // number of workers at a time 
//             frame: 3, // current rendering frame
//             device:'',

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
const prepare_params = (jobData) => {
    var uuid = jobData.uuid;
    var fuid = jobData.fuid;

    var frame = jobData.job.frame;
    var device = jobData.job.device;

    var engine = jobData.opts.engine;
    var w = jobData.opts.resolution[0];
    var h = jobData.opts.resolution[1];
    var scene = jobData.opts.scene;
    var samples = jobData.opts.samples;


    var resp = [
        fuid,
        uuid,
        engine,
        scene,
        frame,
        samples,
        w,
        h,
        device
    ].join(' ');
    return resp;
};


// const fuid = data.fuid;
// const uuid = data.uuid;
// const startTs = data.start;
// const code = data.code;

const save_result_to_db = async (job, code) => {
    var data = {};
    data.tuid = job.data.tuid;
    data.uuid = job.data.uuid;
    data.frame = job.data.job.frame;
    data.code = code;
    data.device = gDevice; // add into all job data TODO
    data.startTs = job.data.job.startTs; // TODO
    var res = await DB.insert_jobs_table(data);
    return res;

}

const check_result = async (job) => {
    // check if image existed
    // save reslut to db
    var res = await save_result_to_db(config.DBStateCodeFinished, job);
    return res;
};


const handle_finished_job = (job) => {
    // check result image
    var uuid = job.data.uuid;
    var fuid = job.data.fuid;
    var ts = job.data.ts;
    var fram = job.data.job.frame;
    var checkImageFilePath = config.rootPath +
        uuid + '/' +
        fuid + '/' +
        ts + '/rendered/' +
        frame + '.png';

    var logFilePath =
        const.rootPath +
        uuid + '/' +
        fuid + '/' +
        ts + '/log/' +
        frame + '.log';
    try {
        if (fs.existsSync(checkImageFilePath)) {
            //file exists
            logger.info('blender file checked : ' + checkImageFilePath);
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

const handle_failed_job = (job) => {
    save_result_to_db(job, config.DBStateCodeFailed);

};

const handle_stopped_job = (job) => {
    save_result_to_db(job, config.DBStateCodeStopped);
};


// =============================================================
const worker = async (job) => {

    var res = await get_task_state(job.data.tuid);
    if (res.state == config.DBStateCodeStarted) {

        var jobData = job.data;
        var uuid = jobData.uuid;
        var fuid = jobData.fuid;
        var ts = jobData.ts;
        var fileName = jobData.opts.name;


        // check path and file

        var targetBlenderFilePath = config.rootPath + uuid + '/' + fuid + '/' + ts + '/' + fileName;

        try {
            if (fs.existsSync(targetBlenderFilePath)) {
                //file exists
                logger.info('blender file checked : ' + targetBlenderFilePath);
            }
        } catch (err) {
            logger.error(err);
            return config.TaskErrCodeFileNotExist;
        }



        // set up child blender 
        const parameters = prepare_params(jobData);
        const options = {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        };

        const child = fork(program, parameters, options);


        child.on('message', message => {
            if (message == config.BlenderQuitStr) {
                gStopMarker = true;
                check_result(job);
            } else {
                // update progress
                job.progress(parseInt(message));
            }
        });


        // into loop
        var refreshId = setInterval(async function(job) {

            if (gStopMarker) {
                // child finished
                clearInterval(refreshId);
                handle_finished_job(job);

            } else {
                var state = await get_task_state(jobData.tuid);
                if (state !== config.DBStateCodeStarted) {
                    // kill child 
                    child.kill('SIGHUP');
                    clearInterval(refreshId);
                    handle_stopped_job(job);

                }
            }

        }, TaskSateCheckFreq); // set interval better TODO


    } else {

        // handle_db_connection_err(job);
        return config.TaskErrCodeDbNoRecord;
    }




};

const get_system_device = () => {
    return ''; // TODO  exec  'lshw -C display' to check system info
};

// =============================================================

const init = (queueName) => {


    // init queue
    gDevice = get_system_device();

    const wQ = new Queue(queueName);

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
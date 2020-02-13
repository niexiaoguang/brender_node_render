const Queue = require('bull');

const config = require('./config.js');

const Blender = require('./node_docker_blender.js');

const logger = require('./logger.js');

const DB = require('./db.js');

const fork = require('child_process').fork;

const path = require('path');

const blprogram = path.resolve('node_docker_blender.js');


var myData = {};


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

// =============================================================

const cleanJob = async (job) => {
    // console.log('clean for job : ' + JSON.stringify(job));

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
        proc = 100 * done / all + '%'; // TODO remove digit
        // console.log(proc);
    }
    return proc;

};


// const fuid = data.fuid;
// const uuid = data.uuid;
// const startTs = data.start;
// const code = data.code;

const save_result_to_db = async (code, job) => {
    var data = {};
    data.tuid = job.data.tuid;
    data.uuid = job.data.uuid;
    data.code = code;
    data.device = job.data.device; // add into all job data TODO
    data.startTs = 'start'; // TODO
    var res = await DB.insert_jobs_table(data);
    return res;

}

const check_result = async (job) => {
    // check if image existed
    // save reslut to db
    var res = await save_result_to_db(config.DBStateCodeFinished, job);
    return res;
};
// =============================================================
const worker = async (job) => {

    var res = await get_task_state(job.data.fuid);
    if (res == config.DBStateCodeStarted) {
        // set up child blender 
        var jobData = job.data;
        const parameters = prepare_params(jobData);
        const options = {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        };

        const child = fork(program, parameters, options);


        child.on('message', message => {
            var prog = get_progress(message);
            if (prog) {
                job.progress(prog);
            }
            if (porg == 'Blender quit') {
                check_result(job);
                return jobData; // success here
            }
        });


        // into loop
        var refreshId = setInterval(function() {
            var state = get_task_state(jobData.tuid);
            if (state !== config.DBStateCodeStarted) {
                // kill child 
                child.kill('SIGHUP');
                clearInterval(refreshId);

            }
        }, 5000); // set interval better TODO
        var res = await save_result_to_db(config.DBStateCodeStopped, job);

        return job.data; // how works after setinterval ?? FIXME 

    } else {
        return job.data; // do nothing , back
    }




};


// =============================================================

const init = (queueName) => {


    // init queue

    const wQ = new Queue(queueName);

    if (!(wQ)) {
        logger.error('init queue failed');
        return;
    }
    wQ.process('*', async (job) => {
        return await worker(job);
    });

    wQ.on('completed', async (job, result) => {

        console.log('completed job : ' + JSON.stringify(job));
        await mayAddNextJobs(job);
        await updateDB(job);
        await cleanJob(job);

    });

};

exports.init = init;
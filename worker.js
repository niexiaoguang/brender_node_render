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
const get_task_state(fuid) = async (fuid) => {
    var queryResp = await DB.query_task(fuid);

    return queryResp.state;
};

// =============================================================

const mayAddNextJobs = async (job) => {

    // check if task still as 'started' by db query
    var fuid = job.data.fuid;
    var state = await getTaskState(fuid);
    if (state == config.TaskStateCodeStarted) {

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

const updateDB = async (job) => {
    // console.log('updateDB for job : ' + JSON.stringify(job));
    var query = '';

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
    data.fuid = job.data.fuid;
    data.uuid = job.data.uuid;
    data.code = code;
    data.device = job.data.device; // add into all job data TODO
    data.memo = '';
    const res = DB.insert_jobs_table(data);
    return res;

}


// =============================================================
const worker = async (job) => {

    var res = await get_task_state(job.data.fuid);
    if (res == config.TaskStateCodeStarted) {
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

                await save_result_to_db(config.TaskStateCodeFinished, job);
                return jobData; // success here
            }
        });


        // into loop
        var refreshId = setInterval(function() {
            var state = await get_task_state(jobData.fuid);
            if (state !== config.TaskStateCodeStarted) {
                // kill child 
                child.kill('SIGHUP');
                var res = save_result_to_db(config.TaskStateCodeStopped, job);
                clearInterval(refreshId);

            }
        }, 5000); // set interval better TODO
        return job.data; // how works after setinterval ?? FIXME 

    } else {
        return job.data; // do nothing , back
    }




};


// =============================================================

const init = (argv) => {

    myData.queueName = argv[0];
    myData.queueServerPort = argv[1];
    myData.queueServerPort = argv[2];
    myData.dbHost = argv[3]
    myData.dbPort = argv[4];
    myData.dbUser = argv[5];
    myData.dbPass = argv[6];
    myData.dbName = argv[7];

    // init db
    if (DB.init([myData.dbHost,
            myData.dbPort,
            myData.dbUser,
            myData.dbPass,
            myData.dbName
        ]) == config.DBErrCode) {

        logger.error('init db failed');
        return;
    }


    // init queue

    const wQ = new Queue(myData.queueName);

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
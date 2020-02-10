const Queue = require('bull');
const config = require('../config.js');

const wQ = new Queue(config.JobsQueueName);


const mayAddNextJobs = async (job) => {
    console.log('global completed : ', JSON.stringify(job));
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
};

const updateDB = async (job) => {
    // console.log('updateDB for job : ' + JSON.stringify(job));
};

const cleanJob = async (job) => {
    // console.log('clean for job : ' + JSON.stringify(job));

};

wQ.on('global:completed', async (jobId) => {
    console.log('global completed job id : ' + jobId);

    var completedJobs = await wQ.getCompleted(0, 0);
    // console.log(completedJobs);
    var job = completedJobs[0];
    // console.log(JSON.stringify(job));
    await mayAddNextJobs(job);
    await updateDB(job);
    await cleanJob(job);

});

// wQ.on('completed', async (job, result) => {
//     console.log('completed job : ' + JSON.stringify(job));
//     await mayAddNextJobs(job);
//     await updateDB(job);
//     await cleanJob(job);

// });
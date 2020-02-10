const Queue = require('bull');
const config = require('../config.js');

const wQ = new Queue('brender_render_job_queue8');

const Blender = require('./node_docker_blender.js');

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

wQ.on('completed', async (job, result) => {

    console.log('completed job : ' + JSON.stringify(job));
    await mayAddNextJobs(job);
    await updateDB(job);
    await cleanJob(job);

});


function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


const worker = async (jobData) => {
    // console.log(jobData);
    // await sleep(3000);
    // console.log('-------------------------' + new Date().getTime());
    // return jobData;
    var res = Blender.render_frame(jobData);
    if (res == 'ok') {
        return jobData;
    } else {
        return 'error'; // TODO error handle 
    }


};


wQ.process('*', async (job) => {
    return await worker(job.data);
});
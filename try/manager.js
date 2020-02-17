const Queue = require('bull');

const util = require('util');
const exec = util.promisify(require('child_process').exec);
// var exec = require('child_process').exec;
const mariadb = require('mariadb');


const {
    setIntervalAsync,
    clearIntervalAsync
} = require('set-interval-async/dynamic')

const sleep = (mil) => new Promise((res, rej) => setTimeout(res, mil));


const asyncQuery = async (query) => {

    var resp;
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: '127.0.0.1',
            port: '3307',
            user: 'pata',
            password: 'papatata',
            database: 'brender'
        });

        resp = await conn.query(query);
        console.log(resp);
    } catch (err) {
        // throw err;

        resp = config.DBErrCode;


    } finally {
        if (conn) conn.end();

        return resp;

    }
};


const wQ = new Queue('brender_task_queue1', {
    redis: {
        port: '6379',
        host: '127.0.0.1',
        password: 'myredispass'
    }
}); // Specify Redis connection using object
const cmd = '/usr/local/blender/blender -b /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8.blend -P /home/pata/brender_dev/brender_data/media/scripts/prepare.py -- engine CYCLES samples 128 scene Scene frame 23 w 640 h 480 outputpath /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/1581839590572/ 2>&1 | tee /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/1581839590572/log/23.log';

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

const worker = async (job) => {
    console.log('job data inside promise exec : ' + job.data);

    var stdOtp;
    var stdErr;
    var startTs = new Date().getTime();

    var tk = 0;


    var dbres = await asyncQuery('select * from fuid where fuid = "991c0c294192af14cc202587920f17b8"');
    console.log('db res is : ' + JSON.stringify(dbres));

    await sleep(5000);

    if (dbres[0].uuid == 'a8fc0c294192af14cc202587920f1b8') {
        console.log('set loop to check db');
        var intervalId = setIntervalAsync(
            async () => {
                    console.log('looop query db');
                    var res = await asyncQuery('select now()');
                    console.log('loop query db resp : ' + JSON.stringify(res));
                },
                3000
        )

        console.log('start rendering');
        try {
            const { stdout, stderr } = await exec(cmd);
            stdOtp = stdout;
            stdErr = stderr;
            // console.log('stdout:', stdout);
            // console.log('stderr:', stderr);
        } catch (e) {
            console.error(e); // should contain code (exit code) and signal (that caused the termination).
        }

        var endTs = new Date().getTime();
        // console.log('after cmd : ' + stdOtp);
        console.log('startTs ' + startTs);
        console.log('endTs ' + endTs);
        if (stdOtp.indexOf('Saved:') > -1) {
            console.log('saved a pic');
            clearIntervalAsync(intervalId);
        }

        console.log('stderr : ' + stdErr);
        return stdOtp;
    } else {
        console.log('not start worker');
        return 'no worker';
    }


    // return execp(cmd, {
    //     stdout: process.stdout,
    //     stderr: process.stderr
    // }).then(() => {

    //     console.log('done!')
    //     return job.data;
    // });

    // console.log('out of execp not called');

}

wQ.process('*', async (job) => {
    return await worker(job);
});
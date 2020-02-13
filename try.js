const Queue = require('bull');

var q = new Queue('notexist');

// var queueReady = false;
// q.getJobCounts().then(res => {
//     console.log('Job Count:\n', res)
//     queueReady = true;
// });// setTimeout(function() {
//     if (!(queueReady)) {
//         console.log('no redis connection');
//         process.exit(1);
//     }
// }, 3000);

const tryawait = async () => {
    var res = await q.getJobCounts();
    console.log(res);
}
tryawait()
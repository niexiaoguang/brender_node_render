const staticRootPath = '/home/pata/nginx/html/static/upload/blend/';

const JobsQueueName = 'brender_render_job_queue8';

// -------------------------------------------------------------


const OkResp = JSON.stringify({
    status: 'ok'
});
// error response 


const TaskUserNotMatchErrCode = 4004;
const TaskUserNotMatchErrResp = JSON.stringify({
    status: "error",
    info: "task user not match"
});


const DBErrCode = 4100;
const DBErrResp = 'db error';



const Seperator = '-';

// most numbbet of worker at a time for a task , fixed only dev  TODO 
const ConWorkersNum = 2;


const DBHost = '127.0.0.1:32773'; //TODO
const DBUser = 'root';

const DBTaskTabName = 'task';
const DBTaskTabStateColName = 'state';
const TaskStateCodeFailed = 4;
const TaskStateCodeFinished = 3;
const TaskStateCodeStopped = 2;
const TaskStateCodeStarted = 1;
const TaskStateCodeUploaded = 0;


const blImageName = 'bl281a';
const blPyScriptName = 'prepare.py';

const userFileRootPath = '/';
const localPath = '/home/pata/brender_dev/brender_node_render/blmedia/'; // TODO
const containerPath = '/media/';
const containerOutputPath = '/media/';
const outputLogPath = localPath + 'output.log';
// -------------------------------------------------------------
// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -
exports.TaskStateCodeFailed = TaskStateCodeFailed;
exports.TaskStateCodeFinished = TaskStateCodeFinished;
exports.TaskStateCodeStopped = TaskStateCodeStopped;
exports.TaskStateCodeStarted = TaskStateCodeStarted;
exports.TaskStateCodeUploaded = TaskStateCodeUploaded;


exports.staticRootPath = staticRootPath;

exports.JobsQueueName = JobsQueueName;

exports.OkResp = OkResp;

exports.TaskUserNotMatchErrResp = TaskUserNotMatchErrResp;
exports.TaskUserNotMatchErrCode = TaskUserNotMatchErrCode;

exports.DBErrCode = DBErrCode;
exports.DBErrResp = DBErrResp;

exports.ConWorkersNum = ConWorkersNum;
exports.Seperator = Seperator;

exports.DBHost = DBHost;
exports.DBUser = DBUser;
exports.DBTaskTabName = DBTaskTabName;
exports.DBTaskTabStateColName = DBTaskTabStateColName;


exports.userFileRootPath = userFileRootPath;
exports.localPath = localPath;
exports.containerPath = containerPath;
exports.containerOutputPath = containerOutputPath;
exports.outputLogPath = outputLogPath;

exports.blImageName = blImageName;
exports.blPyScriptName = blPyScriptName;
// task request data format --------------------------- 
// {
//     uuid: 'uuid',
//     fuid: 'fuid',
//     opts: {
//         scene:'Scene',
//         resolution: [1920, 1080],
//         engine: 'CYCLES' / 'BLENDER_EEVEE',
//         samples: 200,
//         frames: [1, 250],
//         step:1
//     }
// }




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
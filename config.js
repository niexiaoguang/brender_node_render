const staticRootPath = '/home/pata/nginx/html/static/upload/blend/';

const JobsQueueName = 'brender_render_job_queue8';

// -------------------------------------------------------------


const OkResp = JSON.stringify({
    status: 'ok'
});
// error response 

const AuthCheckErrResp = JSON.stringify({
    status: "error",
    info: "auth check failed"
});
const AuthCheckErrCode = 4003;

const TaskExistedErrResp = JSON.stringify({
    status: "error",
    info: "fuid render task already existed"
});
const TaskExistedErrCode = 4000;

const TaskExistedErrResp = JSON.stringify({
    status: "error",
    info: "fuid render task already existed"
});
const TaskExistedErrCode = 4000;


const StopNotExistTaskErrResp = JSON.stringify({
    status: "error",
    info: "task not existed or finished"
});
const StopNotExistTaskErrCode = 4001;


const StartExistingTaskErrResp = JSON.stringify({
    status: "error",
    info: "task already existed"
});
const StartExistingTaskErrCode = 4002;


const TaskUserNotMatchErrCode = 4004;
const TaskUserNotMatchErrResp = JSON.stringify({
    status: "error";
    info: "task user not match"
});


const DBErrCode = 4100;
const DBErrResp = 'db error';



const Seperator = '-';

// most numbbet of worker at a time for a task , fixed only dev  TODO 
const ConWorkersNum = 2;


const DBHost = '127.0.0.1:32679'; //TODO
const DBUser = '';

const DBTaskTabName = 'task';
const DBTaskTabStateColName = 'state';
const TaskStateCodeFailed = 4;
const TaskStateCodeFinished = 3;
const TaskStateCodeStopped = 2;
const TaskStateCodeStarted = 1;
const TaskStateCodeUploaded = 0;
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
exports.TaskExistedErrResp = TaskExistedErrResp;
exports.TaskExistedErrCode = TaskExistedErrCode;

exports.StopNotExistTaskErrResp = StopNotExistTaskErrResp;
exports.StopNotExistTaskErrCode = StopNotExistTaskErrCode;

exports.StartExistingTaskErrResp = StartExistingTaskErrResp;
exports.StartExistingTaskErrCode = StartExistingTaskErrCode;

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
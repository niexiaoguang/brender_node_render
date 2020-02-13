const rootPath = '/media/';
const logPath = './log/';
const blenderScriptPath = rootPath + '/scripts/prepare.py';
const blenderExecPath = '/usr/local/blender/blender';
const Seperator = '-';

// most numbbet of worker at a time for a task , fixed only dev  TODO 
const ConWorkersNum = 2;


const blImageName = 'bl281a';
const blPyScriptName = 'prepare.py';

const DBErrCode = 4100;
const DBErrResp = 'db error';

// ----------------------------------------------------
// ----------------------------------------------------
const DBTabNameTask = 'tuid';
const DBTabNameJobs = 'jobs';
const DBTabNameFiles = 'fuid';

const DBColNameFuid = 'fuid';
const DBColNameUuid = 'uuid';
const DBColNameTuid = 'tuid';
const DBColNameStart = 'start';
const DBColNameEnd = 'end';
const DBColNameState = 'state';
const DBColNameUpdateTs = 'update_ts';
const DBColNameDevice = 'device';
const DBColNameId = 'id';
const DBColNameSuid = 'suid';
const DBColNameFrame = 'frame';


const DBStateCodeStopped = 'stp';
const DBStateCodeStarted = 'sta';
const DBStateCodeFinished = 'fin';
const DBStateCodeFailed = 'fai';


const TaskSateCheckFreq = 10000; //10 sec

const TaskErrCodeDbNoRecord = 4400;

const TaskErrCodeFileNotExist = 4500;


const BlenderQuitStr = 'Blender quit';


// ======================================

exports.rootPath = rootPath;
exports.logPath = logPath;

exports.blenderExecPath = blenderExecPath;
exports.blenderScriptPath = blenderScriptPath;

exports.TaskSateCheckFreq = TaskSateCheckFreq;
exports.BlenderQuitStr = BlenderQuitStr;

exports.TaskErrCodeFileNotExist = TaskErrCodeFileNotExist;
exports.TaskErrCodeDbNoRecord = TaskErrCodeDbNoRecord;

exports.DBErrCode = DBErrCode;
exports.DBErrResp = DBErrResp;



exports.ConWorkersNum = ConWorkersNum;
exports.Seperator = Seperator;



exports.DBTabNameTask = DBTabNameTask;
exports.DBTabNameJobs = DBTabNameJobs;
exports.DBTabNameFiles = DBTabNameFiles;

exports.DBColNameFuid = DBColNameFuid;
exports.DBColNameUuid = DBColNameUuid;
exports.DBColNameTuid = DBColNameTuid;
exports.DBColNameStart = DBColNameStart;
exports.DBColNameEnd = DBColNameEnd;
exports.DBColNameState = DBColNameState;
exports.DBColNameUpdateTs = DBColNameUpdateTs;
exports.DBColNameDevice = DBColNameDevice;
exports.DBColNameId = DBColNameId;
exports.DBColNameSuid = DBColNameSuid;
exports.DBColNameFrame = DBColNameFrame;


exports.DBStateCodeStopped = DBStateCodeStopped;
exports.DBStateCodeStarted = DBStateCodeStarted;
exports.DBStateCodeFinished = DBStateCodeFinished;
exports.DBStateCodeFailed = DBStateCodeFailed;
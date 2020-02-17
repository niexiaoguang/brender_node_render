const config = require('./config.js');
const mariadb = require('mariadb');
// const pool = mariadb.createPool({ config.DBHost, user: config.DBUser, connectionLimit: 5 });
const { logger } = require('./logger.js');


var gHost;
var gPort;
var gUser;
var gPass;
var gDatabase;

const make_timestamp_for_mysql = (ts) => {
    var date = new Date();
    date.setTime(ts);
    var yyyy = date.getFullYear();
    var mm = date.getMonth() + 1;
    var dd = date.getDate();
    var hh = date.getHours();
    var min = date.getMinutes();
    var ss = date.getSeconds();

    var mysqlDateTime = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ':' + ss;

    return mysqlDateTime;
};


const asyncQuery = async (query) => {
    logger.log('info', 'db query %s', query);
    var resp;
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: gHost,
            port: gPort,
            user: gUser,
            password: gPass,
            database: gDatabase
        });

        resp = await conn.query(query);

    } catch (err) {
        // throw err;
        logger.log('error', 'db error', new Error(err));
        resp = config.DBErrCode;


    } finally {
        if (conn) conn.end();
        logger.info('db resp : ' + JSON.stringify(resp));
        return resp;

    }
};


const get_task_state = async (tuid) => {
    var query = 'SELECT * FROM ' +
        config.DBTabNameTask +
        ' WHERE ' + config.DBColNameTuid + ' = ' +
        '"' + tuid + '"';
    var resp = await asyncQuery(query);

    return resp;
};

// insert into user_table (user_id, ip, partial_ip, source, user_edit_date, username) values 
// (default, '39.48.49.126', null, 'user signup page', now(), 'newUser');



// {
//     data: {
//         uuid: 'uuid',
//         fuid: 'fuid',
//         job: {
//             workernum: 2, // number of workers at a time 
//             frame: 3, // current rendering frame
//             tuid: 'tuid',
//             ts:'ts',
//             script:'prepare.py',
//             jobid: 'tuid' + frame,
//             startTs: ts,
//             device:'device'
//         },
//          opts: { engine: 'engine', 
//             scene: 'Scene', 
//             frames: [1, 250], 
//             step: 1, 
//             resolution: [1920, 1080], 
//             samples: 64 }
//         }
//     }
// }
const insert_jobs_table = async (job, code) => {
    const tuid = job.data.job.tuid;
    const uuid = job.data.uuid;
    const frame = job.data.job.frame;
    const startTs = job.data.startTs;
    const device = job.data.job.device;
    const suid = '';

    const query = 'INSERT INTO ' + config.DBTabNameJobs +
        ' (' +
        config.DBColNameId + ',' +
        config.DBColNameTuid + ',' +
        config.DBColNameUuid + ',' +
        config.DBColNameFrame + ',' +
        config.DBColNameStart + ',' +
        config.DBColNameEnd + ',' +
        config.DBColNameState + ',' +
        config.DBColNameDevice + ',' +
        config.DBColNameSuid + ',' +
        ')' +
        ' VALUES ' +
        '(' +
        'default' + ',' +
        '"' + tuid + '"' + ',' +
        '"' + uuid + '"' + ',' +
        '"' + make_timestamp_for_mysql(startTs) + '"' + ',' +
        'now()' + ',' +
        '"' + code + '"' + ',' +
        '"' + frame + '"' + ',' +
        '"' + device + '"' + ',' +
        '"' + suid + '"' +
        ')';
    var resp = await asyncQuery(query);
    return resp;
};


const init = async (host, port, user, pass, dbName) => {
    gHost = host;
    gPort = port;
    gUser = user;
    gPass = pass;
    gDatabase = dbName;

    var resp = await asyncQuery('select now()');
    return resp;
};


exports.init = init;
exports.insert_jobs_table = insert_jobs_table;
exports.get_task_state = get_task_state;
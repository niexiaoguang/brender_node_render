const config = require('./config.js');
const mariadb = require('mariadb');
// const pool = mariadb.createPool({ config.DBHost, user: config.DBUser, connectionLimit: 5 });
const { logger } = require('./logger.js');

var conn;

var gHost;
var gPort;
var gUser;
var gPass;
var gDatabase;

const asyncQuery = async (query) => {
    logger.log('info', 'db query', query);
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

        resp = conn.query(query);

    } catch (err) {
        // throw err;
        logger.log('error', 'db error', new Error(err));
        resp = config.DBErrCode;


    } finally {
        if (conn) conn.release(); //release to pool
        return resp;

    }
};


const get_task_state = async (fuid) => {
    var query = 'SELECT * FROM ' +
        config.DBTaskTabName +
        ' WHERE fuid = ' +
        fuid;
    var resp = asyncQuery(query);
    return resp;
};

// insert into user_table (user_id, ip, partial_ip, source, user_edit_date, username) values 
// (default, '39.48.49.126', null, 'user signup page', now(), 'newUser');
const insert_jobs_table = async (data) => {
    const fuid = data.fuid;
    const uuid = data.uuid;
    const startTs = data.start;
    const code = data.code;
    const memo = data.memo;

    const query = 'INSERT INTO ' + config.DBJobsTableName +
        ' (' +
        config.DBJobsTabIdColName + ',' +
        config.DBJobsTabFuidColName + ',' +
        config.DBJobsTabUuidColName + ',' +
        config.DBJobsTabStartColName + ',' +
        config.DBJobsTabEndColName + ',' +
        config.DBJobsTabDeviceColName + ',' +
        config.DBJobsTabResColName + ',' +
        config.DBJobsTabMemoColName + ',' +
        ')' +
        ' VALUES ' +
        '(' +
        'default' + ',' +
        fuid + ',' +
        uuid + ',' +
        startTs + ',' +
        'now()' + ',' +
        code + ',' +
        memo +
        ')';
    var resp = asyncQuery(query);
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
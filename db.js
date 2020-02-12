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

const check_fuid_uuid = async (fuid, uuid) => {
    var query = 'SELECT * FROM ' +
        config.DBTaskTabName +
        ' WHERE fuid = ' +
        fuid;
    var resp = await asyncQuery(query);
    return resp.uuid == uuid;
};

const query_all_task = async (uuid) => {
    const query = 'SELECT * FROM ' +
        config.DBTaskTabName +
        ' WHERE uuid = ' +
        uuid;

    var resp = await asyncQuery(query);

    return resp;

};

const update_task_state = async (fuid, code) => {
    var query = 'UPDATE ' + config.DBTaskTabName +
        ' SET ' + config.DBActionColName + ' = ' +
        code +
        ' WHERE ' + config.DBFuidColName +
        ' = ' +
        fuid;


    var resp = await asyncQuery(query);

    //logger.info(resp);
    return resp;


};

const query_task = async (fuid) => {
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

const trydb = async () => {
    var resp = await asyncQuery('select now()');
    logger.info('init db with ' + resp);
};



// trydb();

const init = (params) => {
    gHost = params[0];
    gPort = params[1];
    gUser = params[2];
    gPass = params[3];
    gDatabase = params[4];
    var resp = await trydb();
    return resp;
};

exports.init = init;
exports.insert_jobs_table = insert_jobs_table;
exports.query_task = query_task;
const config = require('./config.js');
const mariadb = require('mariadb');
// const pool = mariadb.createPool({ config.DBHost, user: config.DBUser, connectionLimit: 5 });
const { logger } = require('./logger.js');


var gHost;
var gPort;
var gUser;
var gPass;
var gDatabase;

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
        return resp;

    }
};


const get_task_state = async (tuid) => {
    var query = 'SELECT * FROM ' +
        config.DBTabNameTask +
        ' WHERE ' + config.DBColNameTuid + ' = ' +
        tuid;
    var resp = await asyncQuery(query);
    return resp;
};

// insert into user_table (user_id, ip, partial_ip, source, user_edit_date, username) values 
// (default, '39.48.49.126', null, 'user signup page', now(), 'newUser');
const insert_jobs_table = async (data) => {
    const tuid = data.fuid;
    const uuid = data.uuid;
    const startTs = data.start;
    const code = data.code;
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
        tuid + ',' +
        uuid + ',' +
        startTs + ',' +
        'now()' + ',' +
        code + ',' +
        suid +
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
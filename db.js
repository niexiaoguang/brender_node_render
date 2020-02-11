const config = require.('./config.js');
const mariadb = require('mariadb');
const pool = mariadb.createPool({ config.DBHost, user: config.DBUser, connectionLimit: 5 });
const logger = require('./logger.js');





const asyncQuery = (query) => {
    logger.log('info', 'db query', query);
    let conn;
    var resp;
    try {

        conn = await pool.getConnection();
        resp = await conn.query(query);

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

    logger.info(resp);

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

    logger.info(resp);
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





exports.query_task = query_task;
exports.update_for_start_task = update_for_start_task;
exports.query_all_task = query_all_task;
exports.check_fuid_uuid = check_fuid_uuid;
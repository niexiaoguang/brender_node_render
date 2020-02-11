const config = require('./config.js');
const mariadb = require('mariadb');
// const pool = mariadb.createPool({ config.DBHost, user: config.DBUser, connectionLimit: 5 });
// const logger = require('./logger.js');


const asyncQuery = async (query) => {
    //logger.log('info', 'db query', query);
    let conn;
    var resp;
    try {


        // only for dev ============   FIXME
        // conn = await mariadb.createConnection({ host: '0.0.0.0:32774', user: 'root', password: 'mariamaria' });
        conn = await mariadb.createConnection({
            host: '0.0.0.0',
            port: 32781,
            user: 'root',
            password: 'mymaria',
            database: 'BRENDER'
        });

        // conn = await mariadb
        //     .createConnection({
        //         host: '0.0.0.0',
        //         port: 32774,

        //         ssl: {
        //             rejectUnauthorized: false
        //         },
        //         user: 'root',
        //         password: 'mariamaria',
        //     });

        resp = conn.query(query);

    } catch (err) {
        // throw err;
        //logger.log('error', 'db error', new Error(err));
        console.log(err);
        resp = config.DBErrCode;


    } finally {
        // if (conn) conn.release(); //release to pool
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

    //logger.info(resp);

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



const trydb = async () => {
    var resp = await asyncQuery('select now()');
    console.log(resp);
};



trydb();
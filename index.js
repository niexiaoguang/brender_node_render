const config = require('./config.js');
const pkgjson = require('./package.json');

const { logger } = require('./logger.js'); // require module as logger not the object inside which required by {logger}


const worker = require('./worker.js');

const DB = require('./db.js');

const do_init = async () => {

    // process.env.NODE_ENV = 'production';  // set by docker
    var version = pkgjson.version;
    logger.info('node app version : ' + version);


    var myid = process.env.nodeid;
    logger.info('my id : ' + myid);


    var redisHost = process.env.redishost;
    var redisPort = process.env.redisport;
    var redisPass = process.env.redispass;

    var queueName = process.env.queuename;
    worker.init(redisHost, redisPort, redisPass, queueName);



    var dbHost = process.env.dbhost;
    var dbPort = process.env.dbport;
    var dbUser = process.env.dbuser;
    var dbPass = process.env.dbpass;
    var dbName = process.env.dbname;
    var resp = await DB.init(dbHost, dbPort, dbUser, dbPass, dbName);
    logger.info(JSON.stringify(resp));

    return resp;

};
const start = () => {
    logger.info('init done , start');

};


const init = async () => {
    var res = await do_init(process.env);
    logger.info('init with : ' + JSON.stringify(res));
    start();
}

init();
const config = require('./config.js');

const { logger } = require('./logger.js'); // require module as logger not the object inside which required by {logger}

// console.log(process.argv);
const worker = require('./worker.js');

const DB = require('./db.js');

var argv = process.argv.slice(2);

const do_init = async (argv) => {

    // process.env.NODE_ENV = 'production';

    var myid = argv[0];
    logger.info('my id : ' + myid);

    var queueName = argv[6];
    worker.init_queue_name(queueName);

    var dbHost = argv[1];
    var dbPort = argv[2];
    var dbUser = argv[3];
    var dbPass = argv[4];
    var dbName = argv[5];
    var resp = await DB.init(dbHost, dbPort, dbUser, dbPass, dbName);
    logger.info(JSON.stringify(resp));

    return resp;

};
const start = () => {
    logger.info('init done , start');

};


const init = async () => {
    var res = await do_init(argv);
    logger.info('init with : ' + JSON.stringify(res));
    start();
}

init();
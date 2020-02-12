const config = require('./config.js');

const { logger } = require('./logger.js');

// console.log(process.argv);
cosnt worker = require('./worker.js');

var argv = process.argv.slice(2);

var paramName = argv[0];
var queueName = argv[1];

var queueServerHost = argv[3];
var queueServerPort = argv[5];
var dbHost = argv[7];
var dbPort = argv[9];
var dbUser = argv[11];
var dbPass = argv[13];
var dbName = argv[15];



if (paramName !== 'queue') { // check other param names TODO
    logger.error('bad init args : ' + process.argv);
} else {
    logger.info('start a node app with args : ' + process.argv);
    worker.init([queueName, queueServerHost, queueServerPort, dbHost, dbPort, dbUser, dbPass, dbName]);

}
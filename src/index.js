'use strict';
const config = require('./config.js');

const { logger } = require('./utils/logger.js'); // require module as logger not the object inside which required by {logger}

// const DB = require('./utils/db.js');
const test_amqp = require('./test_amqp.js');
const test_dockerode = require('./test_dockerode.js');

const init = async () => {
    var res;
    // var res = await do_init();
    logger.info('node dev init with : ' + JSON.stringify(res));
    test_amqp.test();

    // test_dockerode.test();
}

init();
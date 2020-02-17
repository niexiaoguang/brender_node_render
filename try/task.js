const Queue = require('bull');
const wQ = new Queue('brender_task_queue1', {
    redis: {
        port: '6379',
        host: '127.0.0.1',
        password: 'myredispass'
    }
}); // Specify Redis connection using object


const job = wQ.add({
    foo: 'bar1'
});
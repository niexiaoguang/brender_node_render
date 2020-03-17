const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
// console.log(docker);
// var docker = new Docker({ host: '172.18.0.1', port: 3000 }); //defaults to http

const test = () => {


    console.log(docker);

    docker.listContainers(function(err, containers) {
    	console.log(containers);
        containers.forEach(function(containerInfo) {
        	console.log('containers');
            console.log(containerInfo);
        });
    });

}

exports.test = test;
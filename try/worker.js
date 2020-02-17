const cmd = '/usr/local/blender/blender -b /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8.blend -P /home/pata/brender_dev/brender_data/media/scripts/prepare.py -- engine CYCLES samples 128 scene Scene frame 23 w 640 h 480 outputpath /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/1581839590572/ 2>&1 | tee /home/pata/brender_dev/brender_data/media/a8fc0c294192af14cc202587920f17b8/991c0c294192af14cc202587920f17b8/1581839590572/log/23.log';


// var exec = require('child_process').exec;

const exec = util.promisify(require('child_process').exec);


const render = () => {
    console.log('=====================  rendering ====================');
    console.log('run with cmd : ' + cmd);
    const runCmdRender = exec(cmd);
    runCmdRender.stdout.on('data', function(data) {
        if (process.send) {
            process.send(data); // send 'Blender quit'

        }
    });

};
// const render = async (data) => {
//     return await render_frame(data); // TODO other render task in the future
// };

render();
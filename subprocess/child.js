console.log('child got : ' + process.argv);


if (process.send) {
    process.send("Hello");
    process.send(process.argv);
}

process.on('message', message => {
    console.log('message from parent:', message);
    // process.exit();
    // process.send('echo ' + message);

});



var exec = require('child_process').exec;
const getProgress = (output) => {
    var proc = '';
    var mark1 = output.indexOf('Rendered');
    var mark2 = output.indexOf('Tiles');
    if (mark1 > -1 && mark2 > -1) {
        // 'Rendered 79/80 ' like 
        // var str1 = output.substing(mark1, mark2);
        // quick handle 
        var str = output.substring(mark1 + 9, mark2 - 1);

        var done = parseInt(str.split('/')[0]);
        var all = parseInt(str.split('/')[1]);
        proc = 100 * done / all + '%'; // TODO remove digit
        // console.log(proc);
    }
    return proc;
};

var blStdout = '';
var blStdout1 = '';
var blContainerTempName = 'bl-' + new Date().getTime();
// var blContainerTempName = 'bl-1114';
var interval;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};



const test = async () => {

    var cmd = 'docker run -i --log-driver=none -a stdin -a stdout -a stderr -v /home/pata/brender_dev/brender_node_render/blmedia/:/media/ --name ' + blContainerTempName + ' bl281a -b /media/test_small_cycles_cpu.blend -P /media/prepare.py -- engine CYCLES samples 12 scene Scene frame 4 w 640 h 480 outputpath /media/'
    console.log(cmd);

    var runCmd = exec(cmd);
    runCmd.stdout.on('data', function(data) {
        // console.log(data);
        blStdout = data;
        process.send(getProgress(blStdout));

        if (blStdout.indexOf('Blender quit') > -1) {
            process.send('done');
        }
        // blStdout = getProgress(data);
        // console.log(blStdout);


    });

}
test();
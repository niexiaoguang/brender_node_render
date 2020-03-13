
var fs = require('fs');
const path = require('path');

var opts = {
  cert: fs.readFileSync(path.resolve(__dirname, './ssl/brender-rabbit-client.cert.pem')),      // client cert
  key: fs.readFileSync(path.resolve(__dirname, './ssl/brender-rabbit-client.key.pem')),        // client key
  passphrase: 'PLE427VKgNSpqEXN', // passphrase for key
  ca: [fs.readFileSync(path.resolve(__dirname, './ssl/cacert.pem'))],           // array of trusted CA certs
  rejectUnauthorized: false
};

const test = () => {
    console.log('test amqp');
    // var amqp = require('amqplib');
    


    var open = require('amqplib').connect('amqps://pata:pprabbit@amqp.brender.cn', opts);
    open.then(function(conn) {

      console.log('inside open');
      // ... go to town
      conn.createChannel().then(function(ch){
        var q = 'hello';
        var msg = 'Hello Brender from render hahahah!';
    
        var ok = ch.assertQueue(q, {durable: false});
        return ok.then(function(_qok) {
          // NB: `sentToQueue` and `publish` both return a boolean
          // indicating whether it's OK to send again straight away, or
          // (when `false`) that you should wait for the event `'drain'`
          // to fire before writing again. We're just doing the one write,
          // so we'll ignore it.
            ch.sendToQueue(q, Buffer.from(msg));
            console.log(" [x] Sent '%s'", msg);
            return ch.close();
            });

      });

    }).then(null, console.warn);

}

exports.test = test;
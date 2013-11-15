// node-smpp-splitter
// github.com/jbuchbinder/node-smpp-splitter
//
// Provides functionality to split an SMPP bind.

var argv = require('optimist')
    .usage('Usage: $0 -bindHost [host] -bindPort [port] -bindSystemId [systemid] -bindPassword [password] -listenPort [port]')
    .demand(['bindHost', 'bindPort', 'bindSystemId', 'bindPassword', 'listenPort'])
    .argv;
var smpp = require('smpp');

var bind = smpp.connect(argv.bindHost, argv.bindPort);
bind.bind_transceiver({
    system_id: argv.bindSystemId,
    password: argv.bindPassword
}, function(pdu) {
    if (pdu.command_status == 0) {
        // Successfully bound
        console.log("Successfully bound to " + argv.bindHost + ":" + argv.bindPort);
    } else {
        console.log("Failed to bind to " + argv.bindHost + ":" + argv.bindPort);
    }
});
var server = smpp.createServer(function(session) {
    session.on('bind_transceiver', function(pdu) {
        // We don't authenticate, because ... we don't care.
        session.pause();
        session.send(pdu.response());
        session.resume();
    });
    session.on('pdu', function(msg) {
        // Receive message, retransmit on bind
        console.log("Received message to " + msg.destination_addr);
        bind.submit_sm({
            destination_addr: msg.destination_addr,
            short_message: msg.short_message
        }, function(pdu) {
            if (pdu.command_status == 0) {
                // Message successfully sent
                console.log(pdu.message_id);
            }
        });
    });
});
console.log("Binding to port " + argv.listenPort);
server.listen(argv.listenPort);

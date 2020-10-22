const fs = require('fs');
const properties = JSON.parse(require('./env.js')(fs).readEnv());
const options = {
    key: fs.readFileSync(properties.serverkey),
    cert: fs.readFileSync(properties.servercert),
    requestCert: true,
    rejectUnauthorized: false
};

server = require('./build/webrtcdevelopmentServer.js');
var rserver = null;
server.realtimecomm(properties, options, null, function (socket) {
    try {
        rserver = socket;
        console.log("BEFORE");
    } catch (e) {
        console.error(e);
    }
});

// rserver.on('close', () => {
//     console.log('AFTER');
// });
//
// rserver.close(() => {
//     console.log('CLOSING');
//     rserver.unref();
//     //process.exit(); //Uncomment if your process is not stopped naturally
// });




// const WebSocket = require('ws');
//
// let wsClient = new WebSocket('wss://localhost:8083/');
//
// wsClient.on('open', () => console.log('Client connected'));
// wsClient.emit('PING', '');
// wsClient.on('error', (err) => {
//     console.error(err);
// });
// wsClient.on('PONG', (data) => {
//     console.log(`${data}`);
// });
// wsClient.on('close', (reason) =>{
//     console.log("clear", reason);
// });


var io = require("socket.io-client");
client = io.connect('http://localhost:8083', {
    'reconnection delay' : 0,
    'reopen delay' : 0 ,
    forceNew: true,
    transports: ['websocket']
});
client.on("connect", function() {
    console.log(" ok");
});
client.on('disconnect', function() {
    console.log('disconnected...');
});
client.on("error",(err)=>{
    console.log(err);
});
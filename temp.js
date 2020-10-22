const fs = require('fs');
const properties = JSON.parse(require('./env.js')(fs).readEnv());
const options = {
    key: fs.readFileSync(properties.serverkey),
    cert: fs.readFileSync(properties.servercert),
    requestCert: true,
    rejectUnauthorized: false
};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const realtimecomm = require('./build/webrtcdevelopmentServer.js').realtimecomm(properties, options, null);




const io = require("socket.io-client");
client = io("wss://localhost:8083",{
    ca: options.cert,
    rejectUnauthorized: false
    // 'reconnection delay' : 0,
    // 'reopen delay' : 0 ,
    // forceNew: true,
    // transports: ['websocket']
});
client.on("connect", function() {
    console.log(" ok", client.id);
    client.emit("ping");
});
client.on("pong",(data)=>{
    console.log(data);
});
client.on('disconnect', function() {
    console.log('disconnected...');
});
client.on("error",(err)=>{
    console.log(err);
});





//
// const WebSocket = require('ws');
// let wsClient = new WebSocket('ws://localhost:8083/');
//
// console.log('wsClient state' , wsClient.readyState, " isopen " , wsClient.readyState === WebSocket.OPEN);
//
// wsClient.onopen = ()=>{
//     console.log('Client connected');
//     wsClient.emit('PING', '');
// };
//
// wsClient.onerror =  (event)=>{
//     console.log(event.error , '  state: ' + wsClient.readyState);
// };
//
// wsClient.on('PONG', (data) => {
//     console.log(`${data}`);
// });
// wsClient.on('close', (reason) =>{
//     console.log("clear", reason);
// });
//



// this.timeout(10000);
// var WebSocket = require('ws');
// const wsClient = new WebSocket('wss://localhost:8083/',{
//     protocolVersion: 8,
//     origin: 'https://localhost:8083',
//     rejectUnauthorized: false
// });
// wsClient.on('open', () => {
//     console.log('Client open');
//     wsClient.emit('PING', '');
// });
// wsClient.on('connection', () => {
//     console.log('Client connected');
//     wsClient.emit('PING', '');
// });
// wsClient.on('error', (err) => {
//     console.log("err");
//     done(err);
// });
// wsClient.on('PONG', (data) => {
//     console.log(`${data}`);
//     done();
// });
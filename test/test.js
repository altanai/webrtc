const expect = require('chai').expect;
const http = require('http');

describe('Websocket server tests', function () {
    var rserver = null;

    before(function (done) {
        const fs = require('fs');
        const properties = JSON.parse(require('./../env.js')(fs).readEnv());
        const options = {
            key: fs.readFileSync(properties.serverkey),
            cert: fs.readFileSync(properties.servercert),
            requestCert: true,
            rejectUnauthorized: false
        };
        const server = require('./../build/webrtcdevelopmentServer.js');

        server.realtimecomm(properties, options, null, function (socket) {
            try {
                console.log("BEFORE");
                rserver = socket;
                done();
            } catch (e) {
                console.error(e);
                done(e);
            }
        });
    });

    after(function (done) {
        if (rserver) {
            rserver.on('close', () => {
                console.log('AFTER');
                done();
            });
            rserver.close(() => {
                console.log('CLOSING');
                rserver.unref();
                //process.exit(); //Uncomment if your process is not stopped naturally
            });
        }
    });

    it('PING Test', function (done) {

        // this.timeout(10000);
        var WebSocket = require('ws');
        const wsClient = new WebSocket('wss://localhost:8083/',{
            protocolVersion: 8,
            origin: 'https://localhost:8083',
            rejectUnauthorized: false
        });
        wsClient.on('open', () => {
            console.log('Client open');
            wsClient.emit('PING', '');
        });
        wsClient.on('connection', () => {
            console.log('Client connected');
            wsClient.emit('PING', '');
        });
        wsClient.on('error', (err) => {
            console.log("err");
            done(err);
        });
        wsClient.on('PONG', (data) => {
            console.log(`${data}`);
            done();
        });
    });
});
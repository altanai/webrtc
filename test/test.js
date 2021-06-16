const expect = require('chai').expect;
const http = require('http');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

console.log('.env.' + process.env.NODE_ENV);
console.log(`Your serverkey is ${process.env.key}`);

describe('Websocket server tests', function () {
    var server = null;
    var client = null;

    const fs = require('fs');

    const options = {
        key: fs.readFileSync(process.env.key),
        cert: fs.readFileSync(process.env.cert),
        requestCert: true,
        rejectUnauthorized: false
    };
    var wssPort= process.env.wssPort;
    before( (done) => {
        try {
            server = require('./../build/webrtcdevelopmentServer_min.js').realtimecomm(process.env, options, null);
            console.log("BEFORE");
            done();
        } catch (e) {
            console.error(e);
            done(e);
        }
    });

    after( (done)=> {
        if (server) {
            console.log("AFTER");
            client.disconnect();
            done();
        }else{
            console.warn(" server is not conneted ");
        }
    });

    it('PING Test',  (done)=> {
        this.timeout(10000);
        const io = require("socket.io-client");
        client = io("wss://localhost:"+wssPort,{
            ca: options.cert,
            rejectUnauthorized: false
            // 'reconnection delay' : 0,
            // 'reopen delay' : 0 ,
            // forceNew: true,
            // transports: ['websocket']
        });
        client.on("connect", () =>{
            console.log(" ok", client.id);
            client.emit("ping-webrtcdev");
        });
        client.on("pong-webrtcdev",(data)=>{
            console.log("pong received ");
            console.log(data);
            // expect(data).to.equal(2);
            // console.log("All " , server.getAll());
            done();
        });
        client.on('disconnect', function() {
            console.log('disconnected...');
        });
        client.on("error",(err)=>{
            console.error(err);
            done(err);
        });

    });

    it('OPEN Room Test',  (done)=> {
        this.timeout(10000);
        const io = require("socket.io-client");
        client = io("wss://localhost:"+wssPort,{
            ca: options.cert,
            rejectUnauthorized: false
        });
        client.on("connect", () =>{
            console.log(" ok", client.id);
            client.emit("open-channel", {
                channel:"testchannsl",
                sender:"423",
                maxAllowed:2
            });
        });
        client.on("open-channel-resp",(data)=>{
            console.log("open-channel-resp received ");
            console.log(data);
            done();
        });
        client.on('disconnect', function() {
            console.log('disconnected...');
        });
        client.on("error",(err)=>{
            console.error(err);
            done(err);
        });

    });

    it('JOIN Room Test',  (done)=> {
        this.timeout(10000);
        const io = require("socket.io-client");
        client = io("wss://localhost:"+wssPort,{
            ca: options.cert,
            rejectUnauthorized: false
        });
        client.on("connect", () =>{
            console.log(" ok", client.id);
            client.emit("join-channel", {
                channel:"testchannsl",
                sender:"423"
            });
        });
        client.on("join-channel-resp",(data)=>{
            console.log("open-channel-resp received ");
            console.log(data);
            done();
        });
        client.on('disconnect', function() {
            console.log('disconnected...');
        });
        client.on("error",(err)=>{
            console.error(err);
            done(err);
        });

    });

});

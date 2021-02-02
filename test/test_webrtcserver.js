
console.log("Test WebRTC Server");

var fs = require('fs');
var _static = require('node-static');
// var http = require('http');
// var https = require('https');
var http2 = require('http2');
var Log = require('log')
    , log = new Log('info');

// -------------------- Read properties -----------------
var _properties = require('./env.js')(fs).readEnv();
var properties = JSON.parse(_properties);
console.log("Properties ", properties);


// -------------------- set folder path -----------------
var folderPath = "./";
console.log("Folder Path for this environnment ", folderPath);

var file = new _static.Server(folderPath, {
    cache: 3600,
    gzip: true,
    indexFile: properties.landingpage
});

// ------------------- set secure options-----------------
var options, app;
if (properties.secure) {
    options = {
        key: fs.readFileSync(properties.serverkey),
        cert: fs.readFileSync(properties.servercert),
        requestCert: true,
        rejectUnauthorized: false
    };
    // -------------------- Http2 Sever start -----------------

    // compatibility layer approach
    app = http2.createSecureServer(options, (req, res) => {
            req.addListener('end', function () {
                file.serve(req, res);
            }).resume();
        });
} else {
    app = https.createServer(options, (request, response) => {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    });
}
app.listen(properties.http2Port);


console.log("< ------------------------ HTTPS Server -------------------> ");
console.log(" Web server env => " + properties.enviornment + " running at " + properties.http2Port);
console.log(" Web server Landing page - https://localhost:" + properties.http2Port + "/" + properties.landingpage);

// stream handler approach
// const server = http2.createSecureServer(options);
// server.on('stream', (stream, requestHeaders) => {
//     // stream.respond();
//     // stream.end('secured hello world!');
// });
// server.listen(properties.http2Port, () => {
//     console.log("http2 server started on port", properties.http2Port);
// });

// -------------------- Redis Sever start -----------------

var rclient;
var _redisobj = require('./build/webrtcdevelopmentServer.js').redisscipts;
redisobj = new _redisobj();
redisobj.startServer();

rclient = redisobj.startclient();
rclient.set("session", "webrtcdevelopment");

// -------------------- Session manager server   -----------------

const realtimecomm = require('./build/webrtcdevelopmentServer.js').realtimecomm(properties, options, log);
var socket = realtimecomm.socket;

try {
    let params = socket.handshake.query;
    console.log("[Realtime conn] params", params);

    if (rclient)
        rclient.hmset(params.t, params, function (err) {
            console.error(err);
        });

    if (!params.socketCustomEvent)
        params.socketCustomEvent = 'custom-message';

    socket.on(params.socketCustomEvent, function (message) {
        try {
            socket.broadcast.emit(params.socketCustomEvent, message);
        } catch (e) {
            console.error(e);
        }
    });
} catch (e) {
    console.error(e);
}

// -------------------- REST Api Sever  -----------------

var restapi = require('./build/webrtcdevelopmentServer.js').restapi(realtimecomm, options, app, properties);



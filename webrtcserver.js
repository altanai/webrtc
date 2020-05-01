var fs = require('fs');
var _static = require('node-static');
var http = require('http');
var https = require('https');
var http2 = require('http2');
var Log = require('log')
    , log = new Log('info');


// -------------------- Read properties -----------------
var _properties = require('./env.js')(fs).readEnv();
var properties = JSON.parse(_properties);
console.log(properties);


// -------------------- set folder path -----------------
var folderPath = "./";
console.log("Folder Path for this environnment ", folderPath);

var file = new _static.Server(folderPath, {
    cache: 3600,
    gzip: true,
    indexFile: properties.landingpage
});

// ------------------- set secure options-----------------
var options;
if (properties.secure) {
    options = {
        key: fs.readFileSync(properties.serverkey),
        cert: fs.readFileSync(properties.servercert),
        requestCert: true,
        rejectUnauthorized: false
    };
}

// -------------------- Http2 Sever start -----------------

// compatibility layer approach
var app = http2
    .createSecureServer(options, (req, res) => {
        req.addListener('end', function () {
            file.serve(req, res);
        }).resume();
    })
    .listen(properties.http2Port);


// steam handler  approach
// const server = http2.createSecureServer(options);
// server.on('stream', (stream, requestHeaders) => {
//     // stream.respond();
//     // stream.end('secured hello world!');
// });
// server.listen(properties.http2Port, () => {
//     console.log("http2 server started on port", properties.http2Port);
// });


// auto push approach - tbd
// http2
//     .createSecureServer(options, http2Handlers)
//     .listen(properties.http2Port, () => {
//         console.log("http2 server started on port", properties.http2Port);
//     });


// -------------------- HTTPS Sever start for WSS -----------------

// var app = https.createServer(options, function (request, response) {
//     console.log("[HTTPS server] Referer :", request.headers.referer);
//     request.addListener('end', function () {
//         file.serve(request, response);
//     }).resume();
// });
//
// app.listen(properties.httpPort);

// -------------------- Redis Sever start -----------------

var rclient;
var _redisobj = require('./build/webrtcdevelopmentServer.js').redisscipts;
redisobj = new _redisobj();
redisobj.startServer();

rclient = redisobj.startclient();
rclient.set("session", "webrtcdevelopment");

// -------------------- Session manager server   -----------------

var _realtimecomm = require('./build/webrtcdevelopmentServer.js').realtimecomm;
var realtimecomm = _realtimecomm(app, properties, log, rclient || null, function (socket) {
    try {
        var params = socket.handshake.query;
        console.log("[Realtime conn] params", params);

        if (rclient)
            rclient.hmset(params.t, params, function (err) {
                console.error(err);
            });

        if (!params.socketCustomEvent) {
            params.socketCustomEvent = 'custom-message';
        }

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
});

// -------------------- REST Api Sever  -----------------

var _restapi = require('./build/webrtcdevelopmentServer.js').restapi;
var restapi = _restapi(realtimecomm, options, app, properties);



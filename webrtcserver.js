var fs = require('fs');
var _static = require('node-static');
var https = require('https');
var http = require('https');
var Log = require('log')
    , log = new Log('info');

var _properties = require('./env.js')(fs).readEnv();
var properties = JSON.parse(_properties);
console.log(properties);

var folderPath = "", file = "";

if (properties.enviornment == "production") {
    folderPath = './client/prod';
} else if (properties.enviornment == "test") {
    folderPath = './client/tests';
} else {
    folderPath = './client';
}

console.log("Folder Path for this enviornment ", folderPath);

file = new _static.Server(folderPath, {
    cache: 3600,
    gzip: true,
    indexFile: "home.html"
});

// -------------------- Http Sever start -----------------
var app;
if (properties.secure) {
    var options = {
        key: fs.readFileSync('ssl_certs/server.key'),
        cert: fs.readFileSync('ssl_certs/server.crt'),
        requestCert: true,
        rejectUnauthorized: false
    };

    app = https.createServer(options, function (request, response) {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    });
} else {
    app = http.createServer(function (request, response) {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    });
}
app.listen(properties.httpPort);

// -------------------- Redis Sever start -----------------
var _redisserver = require('./build/webrtcdevelopmentServer.js').redisserver;
_redisserver();

// -------------------- Session manager server   -----------------

var _realtimecomm = require('./build/webrtcdevelopmentServer.js').realtimecomm;
var realtimecomm = _realtimecomm(app, properties, log, function (socket) {
    try {
        var params = socket.handshake.query;

        if (!params.socketCustomEvent) {
            params.socketCustomEvent = 'custom-message';
        }

        socket.on(params.socketCustomEvent, function (message) {
            try {
                socket.broadcast.emit(params.socketCustomEvent, message);
            } catch (e) {
            }
        });
    } catch (e) {
        console.error(e);
    }
});

// -------------------- REST Api Sever  -----------------

var _restapi = require('./build/webrtcdevelopmentServer.js').restapi;
var restapi = _restapi(realtimecomm, options, app, properties);

console.log("< ------------------------ HTTPS Server -------------------> ");

console.log(" WebRTC server env => " + properties.enviornment + " running at\n " + properties.httpPort + "/\nCTRL + C to shutdown");


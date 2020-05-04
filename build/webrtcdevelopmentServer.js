/* Generated on:Mon May 04 2020 11:51:36 GMT+0530 (India Standard Time) || version: 5.3.2 - Altanai (@altanai)  , License : MIT  */exports.redisscipts = function () {

    const redis = require("redis");
    const RedisServer = require('redis-server');

    module.startServer = function () {

        const REDIS_PORT = process.env.REDIS_PORT || 6379;
        // Simply pass the port that you want a Redis server to listen on.
        const server = new RedisServer(REDIS_PORT);

        server.open((err) => {
            if (err === null) {
                console.log("----------------Redis----------------------");
                console.log("[Redis] Redis server started");
            }
        });

        // server.close().then(() => {
        //     // The associated Redis server is now closed.
        //     console.log("[Redis] Redis server closed");
        // });
    };

    module.startclient = function () {

        const client = redis.createClient();

        client.on("error", function (error) {
            console.error(error);
        });

        client.set("key", "value", redis.print);
        client.get("key", redis.print);

        return client;
    };

    return module;
};


/* Generated on:Mon May 04 2020 11:51:36 GMT+0530 (India Standard Time) || version: 5.3.2 - Altanai (@altanai)  , License : MIT  *//**
 * handled on connection of socket for every new connection
 * @method
 * @name realtimecomm
 * @param {json} properties
 * @param {json} options
 * @param {file} log external log file
 * @param {cache} cache like redis
 * @param {function} socketCallback
 */
exports.realtimecomm = function (properties, options, log, cache, socketCallback) {

    var listOfUsers = {};
    var shiftedModerationControls = {};
    var ScalableBroadcast;

    var webrtcdevchannels = {};
    var channels = [];
    var users = {};
    var sessions = {};

    // console.log("[RealtimeComm]  properties for webrtc server " , properties, options) ;

    // http2
    // const server = require('http2').createSecureServer(options);

    //https 1.1
    const server = require('https').createServer(options);

    // socketio
    const io = require('socket.io')(server, {
        origins: "*:*",
        pingTimeout: 15000,
        pingInterval: 30000
    });
    // io.use((socket, next) => {
    //     let token = socket.handshake.query.token;
    //     if (isValid(token)) {
    //         return next();
    //     }
    //     return next(new Error('authentication error'));
    // });
    io.on('connection', onConnection)
    io.on('disconnect', () => {
        console.error("disconnected ");
    });

    // io.serveClient(false);
    // secure: true,
    // serveClient: false,
    // io.attach(server, {
    //     pingInterval: 10000,
    //     pingTimeout: 5000,
    //     cookie: false
    // });
    // io.origins('*:*');

    server.listen(properties.wss2Port);
    console.log("[RealtimeComm]  server state ", server.readyState); // WebSocket.OPEN)

    /* transport options
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
        'polling'
    */

    /**
     * append user to list of user
     * @method
     * @name appendUser
     * @param {socket} socket
     */
    async function appendUser(socket) {
        try {
            var alreadyExists = listOfUsers[socket.userid];
            var extra = {};

            if (alreadyExists && alreadyExists.extra) {
                extra = alreadyExists.extra;
            }

            let userdata = {
                socket: socket,
                connectedWith: {},
                isPublic: false, // means: isPublicModerator
                extra: extra || {}
            };
            if (cache) {
                const result = await cache.hset(socket.userid, "data", userdata);
                console.log(result);
            } else {
                listOfUsers[socket.userid] = userdata;
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * handled on connection of socket for every new connection
     * @method
     * @name onConnection
     * @param {socket} socket
     */
    function onConnection(socket) {
        console.log("[RealtimeComm] ----------------realtimecomm----------------------");
        console.log("[RealtimeComm] socket state ", socket);
        console.log("[RealtimeComm] Socket.io env => " + properties.enviornment + " running at " + properties.wss2Port);

        let params = socket.handshake.query;
        console.log("[RealtimeComm] Querry : ", params);
        var socketMessageEvent = params.msgEvent || 'RTCMultiConnection-Message';

        if (params.enableScalableBroadcast) {
            if (!ScalableBroadcast) {
                ScalableBroadcast = require('./Scalable-Broadcast.js');
            }
            ScalableBroadcast(socket, params.maxRelayLimitPerUser);
        }

        // temporarily disabled
        if (false && !!listOfUsers[params.userid]) {
            params.dontUpdateUserId = true;

            var useridAlreadyTaken = params.userid;
            params.userid = (Math.random() * 1000).toString().replace('.', '');
            socket.emit('userid-already-taken', useridAlreadyTaken, params.userid);
        }

        socket.userid = params.userid;
        appendUser(socket);

        socket.on('extra-data-updated', function (extra) {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].extra = extra;

                for (var user in listOfUsers[socket.userid].connectedWith) {
                    listOfUsers[user].socket.emit('extra-data-updated', socket.userid, extra);
                }
            } catch (e) {
                console.error('extra-data-updated', e);
            }
        });

        /*
        socket.on('become-a-public-moderator', function() {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].isPublic = true;
            } catch (e) {
                console.error('become-a-public-moderator', e);
            }
        });

        socket.on('dont-make-me-moderator', function() {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].isPublic = false;
            } catch (e) {
                console.error('dont-make-me-moderator', e);
            }
        });

        socket.on('get-public-moderators', function(userIdStartsWith, callback) {
            try {
                userIdStartsWith = userIdStartsWith || '';
                var allPublicModerators = [];
                for (var moderatorId in listOfUsers) {
                    if (listOfUsers[moderatorId].isPublic && moderatorId.indexOf(userIdStartsWith) === 0 && moderatorId !== socket.userid) {
                        var moderator = listOfUsers[moderatorId];
                        allPublicModerators.push({
                            userid: moderatorId,
                            extra: moderator.extra
                        });
                    }
                }

                callback(allPublicModerators);
            } catch (e) {
                console.error('get-public-moderators', e);
            }
        });
        */

        socket.on('changed-uuid', function (newUserId, callback) {
            callback = callback || function () {
            };

            if (params.dontUpdateUserId) {
                delete params.dontUpdateUserId;
                return;
            }

            try {
                if (listOfUsers[socket.userid] && listOfUsers[socket.userid].socket.id == socket.userid) {
                    if (newUserId === socket.userid) return;

                    var oldUserId = socket.userid;
                    listOfUsers[newUserId] = listOfUsers[oldUserId];
                    listOfUsers[newUserId].socket.userid = socket.userid = newUserId;
                    delete listOfUsers[oldUserId];

                    callback();
                    return;
                }

                socket.userid = newUserId;
                appendUser(socket);

                callback();
            } catch (e) {
                console.error('changed-uuid', e);
            }
        });

        socket.on('set-password', function (password) {
            try {
                if (listOfUsers[socket.userid]) {
                    listOfUsers[socket.userid].password = password;
                }
            } catch (e) {
                console.error('set-password', e);
            }
        });

        socket.on('disconnect-with', function (remoteUserId, callback) {
            try {
                if (listOfUsers[socket.userid] && listOfUsers[socket.userid].connectedWith[remoteUserId]) {
                    delete listOfUsers[socket.userid].connectedWith[remoteUserId];
                    socket.emit('user-disconnected', remoteUserId);
                }

                if (!listOfUsers[remoteUserId]) return callback();

                if (listOfUsers[remoteUserId].connectedWith[socket.userid]) {
                    delete listOfUsers[remoteUserId].connectedWith[socket.userid];
                    listOfUsers[remoteUserId].socket.emit('user-disconnected', socket.userid);
                }
                callback();
            } catch (e) {
                console.error('disconnect-with', e);
            }
        });

        socket.on('close-entire-session', function (callback) {
            try {
                var connectedWith = listOfUsers[socket.userid].connectedWith;
                Object.keys(connectedWith).forEach(function (key) {
                    if (connectedWith[key] && connectedWith[key].emit) {
                        try {
                            connectedWith[key].emit('closed-entire-session', socket.userid, listOfUsers[socket.userid].extra);
                        } catch (e) {
                        }
                    }
                });

                delete shiftedModerationControls[socket.userid];
                callback();
            } catch (e) {
                console.error('close-entire-session', e);
            }
        });

        socket.on('check-presence', function (userid, callback) {
            if (userid === socket.userid && !!listOfUsers[userid]) {
                callback(false, socket.userid, listOfUsers[userid].extra);
                return;
            }

            var extra = {};
            if (listOfUsers[userid]) {
                extra = listOfUsers[userid].extra;
            }

            callback(!!listOfUsers[userid], userid, extra);
        });

        socket.on('open-channel', function (data) {
            console.log("------------open channel------------- ", data.channel, " by ", data.sender);

            var newchannel = null;

            if (data.channel) {
                newchannel = data.channel;
            } else {
                console.log(" Err :  channel is empty");
            }

            if (channels.indexOf(newchannel) < 0) {
                channels.push(newchannel);
                console.log("registered new in channels ", channels);
            } else {
                console.log("channel already exists channels ", channels);
            }

            try {
                webrtcdevchannels[newchannel] = {
                    channel: newchannel,
                    timestamp: new Date().toLocaleString(),
                    maxAllowed: data.maxAllowed,
                    users: [data.sender],
                    status: "waiting",
                    endtimestamp: 0,
                    log: [new Date().toLocaleString() + ":-channel created . User " + data.sender + " waiting "]
                };
                console.log("information added to channel", webrtcdevchannels);
            } catch (e) {
                console.error(" Err : info couldnt be added to channel ", e);
            }

            //send back the resposne to web client 
            var oevent = {
                status: true,
                channel: newchannel
            };
            socket.emit("open-channel-resp", oevent);
        });

        socket.on('open-channel-screenshare', function (data) {
            console.log("------------open channel screenshare------------- ", data.channel, " by ", data.sender);
            var oevent = {
                status: true,
                channel: data.channel
            };
            socket.emit("open-channel-screenshare-resp", oevent);
        });

        socket.on('join-channel', function (data) {
            var isallowed = false;
            var channel = data.channel;
            if (webrtcdevchannels[data.channel].users.length < webrtcdevchannels[data.channel].maxAllowed ||
                webrtcdevchannels[data.channel].maxAllowed == "unlimited")
                isallowed = true;

            console.log("------------join channel------------- ", data.channel, " by ", data.sender, " isallowed ", isallowed);

            if (isallowed) {
                webrtcdevchannels[data.channel].users.push(data.sender);
                webrtcdevchannels[data.channel].status = webrtcdevchannels[data.channel].users.length + " active members";
                webrtcdevchannels[data.channel].log.push(new Date().toLocaleString() + ":-User " + data.sender + " joined the channel ");

                // send back the join response to webclient
                var jevent = {
                    status: true,
                    channel: data.channel,
                    users: webrtcdevchannels[data.channel].users
                };
                socket.emit("join-channel-resp", jevent);

                var cevent = {
                    status: true,
                    type: "new-join",
                    msgtype: "success",
                    data: data
                };
                socket.broadcast.emit('channel-event', cevent);
            } else {

                console.warn(" Not aloowed to join channel , maxAllowed : ", webrtcdevchannels[data.channel].maxAllowed,
                    " current-users : ", webrtcdevchannels[data.channel].users.length);

                var jevent = {
                    status: false,
                    msgtype: "error",
                    msg: "Sorry cant join this channel"
                };
                socket.emit("join-channel-resp", jevent);

                var cevent = {
                    status: true,
                    type: "new-join",
                    msgtype: "error",
                    msg: "Another user is trying to join this channel but max count [ " + webrtcdevchannels[data.channel].maxAllowed + " ] is reached"
                };
                socket.broadcast.emit('channel-event', cevent);
            }
        });

        socket.on('update-channel', function (data) {
            console.log("------------update channel------------- ", data.channel, " by ", data.sender, " -> ", data);
            switch (data.type) {
                case "change-userid":
                    var index = webrtcdevchannels[data.channel].users.indexOf(data.extra.old);
                    console.log("old userid", webrtcdevchannels[data.channel].users[index]);
                    webrtcdevchannels[data.channel].users[index] = data.extra.new;
                    console.log("changed userid", webrtcdevchannels[data.channel].users);
                    break;
                default:
                    console.log("do nothing ");
            }
        });

        socket.on('presence', function (data, callback) {
            var presence = (webrtcdevchannels[data.channel] ? true : false);
            console.log(" Presence Check index of ", data.channel, " is ", presence);
            socket.emit("presence", presence);
        });

        // Supports Admin functioality on channel
        socket.on("admin_enquire", function (data) {
            switch (data.ask) {
                case "channels":
                    if (data.find) {
                        socket.emit('response_to_admin_enquire', module.getChannel(data.find, data.format));
                    } else {
                        socket.emit('response_to_admin_enquire', module.getAllChannels(data.format));
                    }
                    break;
                case "users":
                    socket.emit('response_to_admin_enquire', module.getAllActiveUsers(data.format));
                    break;
                case "channel_clients":
                    socket.emit('response_to_admin_enquire', module.getChannelClients(data.channel));
                    break;
                default :
                    socket.emit('response_to_admin_enquire', "no case matched ");
            }
        });

        function onMessageCallback(message) {
            try {
                if (!listOfUsers[message.sender]) {
                    socket.emit('user-not-found', message.sender);
                    return;
                }

                if (!message.message.userLeft && !listOfUsers[message.sender].connectedWith[message.remoteUserId] && !!listOfUsers[message.remoteUserId]) {
                    listOfUsers[message.sender].connectedWith[message.remoteUserId] = listOfUsers[message.remoteUserId].socket;
                    listOfUsers[message.sender].socket.emit('user-connected', message.remoteUserId);

                    if (!listOfUsers[message.remoteUserId]) {
                        listOfUsers[message.remoteUserId] = {
                            socket: null,
                            connectedWith: {},
                            isPublic: false,
                            extra: {}
                        };
                    }

                    listOfUsers[message.remoteUserId].connectedWith[message.sender] = socket;

                    if (listOfUsers[message.remoteUserId].socket) {
                        listOfUsers[message.remoteUserId].socket.emit('user-connected', message.sender);
                    }
                }

                if (listOfUsers[message.sender].connectedWith[message.remoteUserId] && listOfUsers[socket.userid]) {
                    message.extra = listOfUsers[socket.userid].extra;
                    listOfUsers[message.sender].connectedWith[message.remoteUserId].emit(socketMessageEvent, message);
                }
            } catch (e) {
                console.error('onMessageCallback', e);
            }
        }

        var numberOfPasswordTries = 0;
        socket.on(socketMessageEvent, function (message, callback) {
            if (message.remoteUserId && message.remoteUserId === socket.userid) {
                // remoteUserId MUST be unique
                return;
            }

            try {
                if (message.remoteUserId && message.remoteUserId != 'system' && message.message.newParticipationRequest) {
                    if (listOfUsers[message.remoteUserId] && listOfUsers[message.remoteUserId].password) {
                        if (numberOfPasswordTries > 3) {
                            socket.emit('password-max-tries-over', message.remoteUserId);
                            return;
                        }

                        if (!message.password) {
                            numberOfPasswordTries++;
                            socket.emit('join-with-password', message.remoteUserId);
                            return;
                        }

                        if (message.password != listOfUsers[message.remoteUserId].password) {
                            numberOfPasswordTries++;
                            socket.emit('invalid-password', message.remoteUserId, message.password);
                            return;
                        }
                    }
                }

                if (message.message.shiftedModerationControl) {
                    if (!message.message.firedOnLeave) {
                        onMessageCallback(message);
                        return;
                    }
                    shiftedModerationControls[message.sender] = message;
                    return;
                }

                // for v3 backward compatibility; >v3.3.3 no more uses below block
                if (message.remoteUserId == 'system') {
                    if (message.message.detectPresence) {
                        if (message.message.userid === socket.userid) {
                            callback(false, socket.userid);
                            return;
                        }

                        callback(!!listOfUsers[message.message.userid], message.message.userid);
                        return;
                    }
                }

                if (!listOfUsers[message.sender]) {
                    listOfUsers[message.sender] = {
                        socket: socket,
                        connectedWith: {},
                        isPublic: false,
                        extra: {}
                    };
                }

                // if someone tries to join a person who is absent
                if (message.message.newParticipationRequest) {
                    var waitFor = 120; // 2 minutes
                    var invokedTimes = 0;
                    (function repeater() {
                        invokedTimes++;
                        if (invokedTimes > waitFor) {
                            socket.emit('user-not-found', message.remoteUserId);
                            return;
                        }

                        if (listOfUsers[message.remoteUserId] && listOfUsers[message.remoteUserId].socket) {
                            onMessageCallback(message);
                            return;
                        }

                        setTimeout(repeater, 1000);
                    })();

                    return;
                }

                onMessageCallback(message);
            } catch (e) {
                console.error('on-socketMessageEvent', e);
            }
        });

        socket.on('disconnect', function () {
            console.log("[RealtimeComm] disconnect");
            try {
                if (socket.namespace)
                    delete socket.namespace.sockets[this.id];
            } catch (e) {
                console.error('disconnect', e);
            }

            try {
                var message = shiftedModerationControls[socket.userid];

                if (message) {
                    delete shiftedModerationControls[message.userid];
                    onMessageCallback(message);
                }
            } catch (e) {
                console.error('disconnect', e);
            }

            try {
                // inform all connected users
                if (listOfUsers[socket.userid]) {
                    for (var s in listOfUsers[socket.userid].connectedWith) {
                        listOfUsers[socket.userid].connectedWith[s].emit('user-disconnected', socket.userid);

                        if (listOfUsers[s] && listOfUsers[s].connectedWith[socket.userid]) {
                            delete listOfUsers[s].connectedWith[socket.userid];
                            listOfUsers[s].socket.emit('user-disconnected', socket.userid);
                        }
                    }
                }
            } catch (e) {
                console.error('disconnect', e);
            }

            delete listOfUsers[socket.userid];
        });

        if (socketCallback) {
            console.log("[RealtimeComm] callback");
            socketCallback(socket);
        }
    }

    module.getAll = function (format) {
        var channels = [];
        for (i in webrtcdevchannels) {
            channels.push(webrtcdevchannels[i]);
        }
        var output = {
            response: 'channels',
            channels: channels,
            format: format
        };
        return output;
    };

    module.getAllChannels = function (format) {
        var sessions = [];
        for (i in Object.keys(webrtcdevchannels)) {
            sessions.push(Object.keys(webrtcdevchannels)[i]);
        }
        var output = {
            response: 'all',
            channelinfo: sessions,
            format: format
        };
        return output;
    };

    module.getChannel = function (channelid, format) {

        var output = {
            response: 'channel',
            channelinfo: webrtcdevchannels[channelid] ? webrtcdevchannels[channelid] : null,
            format: format
        };
        return output;
    };

    module.getAllActiveUsers = function (format) {
        var users = [];
        for (i in Object.keys(webrtcdevchannels)) {
            var key = Object.keys(webrtcdevchannels)[i];
            for (j in webrtcdevchannels[key].users) {
                users.push(webrtcdevchannels[key].users[j]);
            }
        }

        var output = {
            response: 'users',
            users: users,
            format: format
        };
        return output;
    };

    module.getUser = function (userid, format) {

        var output = {
            response: 'users',
            users: (users[userid] ? users[userid] : "notfound"),
            format: format
        };
        return output;
    };

    module.getChannelClients = function (channel) {

        var output = {
            response: 'users',
            clients: io.of('/' + channel).clients(),
            format: data.format
        };
        return output;
    };

    return module;
};

// function console.error() {
//     if (!enableLogs) return;
//
//     var logsFile = process.cwd() + '/logs.json';
//
//     var utcDateString = (new Date).toUTCString().replace(/ |-|,|:|\./g, '');
//
//     // uncache to fetch recent (up-to-dated)
//     uncache(logsFile);
//
//     var logs = {};
//
//     try {
//         logs = require(logsFile);
//     } catch (e) {
//     }
//
//     if (arguments[1] && arguments[1].stack) {
//         arguments[1] = arguments[1].stack;
//     }
//
//     try {
//         logs[utcDateString] = JSON.stringify(arguments, null, '\t');
//         fs.writeFileSync(logsFile, JSON.stringify(logs, null, '\t'));
//     } catch (e) {
//         logs[utcDateString] = arguments.toString();
//     }
// }
/* Generated on:Mon May 04 2020 11:51:36 GMT+0530 (India Standard Time) || version: 5.3.2 - Altanai (@altanai)  , License : MIT  */exports.restapi = function(realtimecomm, options , app, properties) {

    var restify = require('restify');
    var server = restify.createServer(options);

    server.use(
      function crossOrigin(req,res,next){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
      }
    );

    function extracter(mixObj){
        console.log(mixObj);

        var keys = [];
        for(var k in mixObj) {
            keys.push(k);
        }
        return JSON.parse(keys);
    }

    /**
     * @api {get} /webrtc/details Get the session details 
     *
     * @apiName webrtc details
     * @apiGroup WebRTC
     *
     * @apiParam {String} version This is for getting the version of project 
     *
     * @apiSampleRequest https://localhost:8087/webrtc/details
     */
    function getWebRTCdetails(req, res, callback){
        console.log("params----------" , req.params);
        res.json({ type:true , data : req.params.version });
    }


    /**
      * @api {get} /session/all-sessions All Sessions  
      *
      * @apiName Get All sessions 
      * @apiGroup Session
      * @apiDescription 
      * get all session details 
      *
      * @apiSampleRequest https://localhost:8087/session/all-sessions
      *
     */
    function getAllSessions(req, res, callback) {
        var result = realtimecomm.getAllChannels('json');
        res.json({ type:true , data : result });
    }

    /**
     * @api {get} /session/getsession Get the session details 
     *
     * @apiName GetSession
     * @apiGroup Session
     *
     * @apiParam {String} channelid This is for getting the unique channel 
     *
     * @apiSampleRequest https://localhost:8087/session/getsession
     * example : https://localhost:8087/session/getsession
     */
    function getSession(req, res, callback) { 

        console.log(" [ Rest api - getSession ]  logs for " , req.params.channelid  );

        if(!req.params.channelid){
            res.json({ 
                type: true, 
                data: "channelid is required" 
            });
            return ;
        }

        var result = realtimecomm.getChannel(req.params.channelid, 'json');
        res.json({ 
            type : true , 
            data : result 
        });
    }

    /**
      * @api {get} /user/all-users All users details  
      *
      * @apiName Get user
      * @apiGroup User
      * @apiDescription 
      * get all users details 
      *
      * @apiSampleRequest https://localhost:8087/user/all-users
      *
     */
    function getAllUsers(req, res, callback) {
        var result =realtimecomm.getAllActiveUsers('json');
        res.json({ type:true , data : result });
    }


    /**
     * @api {get} /user/getuser Get user details 
     *
     * @apiName Get User
     * @apiGroup User
     * @apiDescription 
     * get user details based on userid
     * @apiParam {String} userid  The id of user 
     *
     * @apiSampleRequest https://localhost:8087/user/getuser
     *
     */
    function getUser(req, res, callback) { 

        console.log(" [ Rest api - getUser ]  logs for " , req.params.userid  );

        if(!req.params.userid){
            res.json({ 
                type: true, 
                data: "userid is required" 
            });
            return;
        }

        var result =realtimecomm.getUser(req.params.userid, 'json');
        res.json({ type:true , data : result });
    }



    function getSessionClients(req, res, callback) {
        var result = realtimecomm.getChannelClients('json');
        res.json({ type:true , data : result });
    }


    server.use(restify.plugins.acceptParser(server.acceptable));
    /*server.use(restify.authorizationParser());*/
    server.use(restify.plugins.dateParser());
    server.use(restify.plugins.queryParser());
    /*server.use(restify.jsonp());*/
  /*  server.use(restify.plugins.CORS());*/
    /*server.use(restify.fullResponse());*/
    server.use(restify.plugins.bodyParser({ mapParams: true }));
    /*server.use(restify.bodyParser());*/
    /*server.use(restify.bodyParser({ mapParams: false }));*/

    server.get('/webrtc/details',getWebRTCdetails);

    server.get('/session/all-sessions',getAllSessions);
    server.get('/session/getsession/:channelid',getSession);
    server.get('/session/clients',getSessionClients);

    server.get('/user/all-users',getAllUsers);
    server.get('/user/getuser/:userid',getUser);

    function unknownMethodHandler(req, res) {
      if (req.method.toLowerCase() === 'options') {

        var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With']; // added Origin & X-Requested-With

        if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');

        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
        res.header('Access-Control-Allow-Methods', res.methods.join(', '));
        res.header('Access-Control-Allow-Origin', req.headers.origin);

        return res.send(204);
      }
      else
        return res.send(new restify.MethodNotAllowedError());
    }

    server.on('MethodNotAllowed', unknownMethodHandler);

    server.listen(properties.restPort, function() {
      console.log('%s listening at %s', server.name, server.url);
    });

    console.log("----------------------REST APIs ----------------");
    console.log(" REST server env => "+ properties.enviornment+ " running at\n "+properties.restPort);

    return module;
};



// function handleError(error) {
//   if (error.name === 'ConstraintNotSatisfiedError') {
//     let v = constraints.video;
//     webrtcdev.error(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
//   } else if (error.name === 'PermissionDeniedError') {
//     webrtcdev.error('Permissions have not been granted to use your camera and ' +
//       'microphone, you need to allow the page access to your devices in ' +
//       'order for the demo to work.');
//   }
//   webrtcdev.error(`getUserMedia error: ${error.name}`, error);
//   outgoingVideo = false;
// }

// -------------------------------------------- Communication with Web Sever -----------------------------------
/**
 * Open a WebRTC socket channel
 * @method
 * @name opneWebRTC
 * @param {string} channel
 * @param {string} userid
 */
var openWebRTC = function (channel, userid, maxallowed) {
    webrtcdev.info("[sessionmanager] - openWebRTC channel: ", channel);

    socket.emit("open-channel", {
        channel: channel,
        sender: userid,
        maxAllowed: maxallowed
    });

    shownotification(" Making a new session ");
};


/**
 * function to join a webrtc socket channel
 * @method
 * @name joinWebRTC
 * @param {string} channel
 * @param {string} userid
 */
var joinWebRTC = function (channel, userid) {
    shownotification("Joining an existing session " + channel);
    webrtcdev.info(" [sessionmanager] joinWebRTC channel: ", channel);

    if (debug) showUserStats();

    socket.emit("join-channel", {
        channel: channel,
        sender: userid,
        extra: {
            userid: userid,
            name: selfusername || "",
            color: selfcolor || "",
            email: selfemail || "",
            role: role || "participant"
        }
    });
};


/**
 * function to start session with socket
 * @method
 * @name startSocketSession
 * @param {object} rtcConn rtc connection object
 * @param {string} socketAddr
 * @param {id} sessionid
 */
function startSocketSession(rtcConn, socketAddr, sessionid) {
    webrtcdev.log("[sessionmanager] startSocketSession , set selfuserid ", rtcConn.userid);
    if (!selfuserid)
        selfuserid = rtcConn.userid;

    try {
        webrtcdev.log("[sessionmanager] StartSession" + sessionid, " on address ", socketAddr);
        socket = io.connect(socketAddr);
        console.log(" socket ", socket);
    } catch (err) {
        webrtcdev.error(" problem in socket connection", err);
        throw (" problem in socket connection");
    }

    if (!sessionid) {
        shownotification("Invalid session");
        webrtcdev.error("[sessionmanager] Session id undefined ");
        return;
    }

    // Socket Listeners
    socket.on("connect", function (e) {
        webrtcdev.log("[sessionmanager] connected to signaller ", e);

        socket.emit("presence", {
            channel: sessionid
        });

        socket.on('disconnected', function (reason) {
            webrtcdev.error("[sessionmanager] Disconnected from signaller ", reason);
            shownotification("Disconnected from signaller ");
            if (reason === 'io server disconnect') {
                webrtcdev.error("[sessionmanager] Disconnected initiated by signaller , attempt to re-connect ");
                // the disconnection was initiated by the server, you need to reconnect manually
                socket.connect();
            }
        });

    });

    socket.on("presence", function (channelpresence) {
        //If debug mode is on , show user details at top under mainDiv
        if (debug) showUserStats();
        webrtcdev.log("[sessionmanager] ======================= presence for sessionid ==================", channelpresence);
        if (channelpresence) joinWebRTC(sessionid, selfuserid);
        else openWebRTC(sessionid, selfuserid, remoteobj.maxAllowed || 10);
    });

    socket.on("open-channel-resp", function (event) {
        webrtcdev.log("[sessionmanager] --------------open-channel-resp---------------------  ", event);
        if (event.status && event.channel == sessionid) {

            webrtcdev.log("[sessionmanager] open-channel-resp - ",
                " Session video:", outgoingVideo,
                " audio: ", outgoingAudio,
                " data: ", outgoingData,
                " OfferToReceiveAudio: ", incomingAudio,
                " OfferToReceiveVideo: ", incomingVideo
            );

            new Promise(function (resolve, reject) {
                getCamMedia(rtcConn, outgoingVideo, outgoingAudio);
                setTimeout(resolve, 3000, "");
            })
                .then(_ => {
                    let sessionid = event.channel;
                    rtcConn.openOrJoin(sessionid, function (res) {
                        webrtcdev.log(" [sessionmanager] open-channel-resp - openOrJoin session id  ", sessionid, "response ", res);
                        if (res) {
                            webrtcdev.info(" [sessionmanager] open-channel-resp - openOrJoin ok,  userid ", selfuserid, " with role ", role);
                            updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local");
                        } else {
                            webrtcdev.error(" [sessionmanager] open-channel-resp Errored from signaller ");
                        }
                    });
                    // rtcConn.open(event.channel, function (res) {
                    //     webrtcdev.info(" [sessionmanager] open-channel-resp - Open ok,  userid ", selfuserid, " with role ", role);
                    //     updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local");
                    // });
                }).catch(reason => {
                webrtcdev.error(' [sessionmanager] Handle rejected promise (' + reason + ')');
            });

        } else {
            // signaller doesnt allow channel open
            alert("Could not open this channel, Server refused");
            webrtcdev.error(" [sessionmanager] Could not open this channel, Server refused");
        }
        if (event.message)
            shownotification(event.msgtype + " : " + event.message);
    });

    socket.on("join-channel-resp", function (event) {
        webrtcdev.log("[sessionmanager] --------------join-channel-resp---------------------  ", event);

        if (event.status && event.channel == sessionid) {

            webrtcdev.log(" [ join-channel-resp ] ",
                " Session video:", outgoingVideo,
                " audio: ", outgoingAudio,
                " data: ", outgoingData,
                " OfferToReceiveAudio: ", incomingAudio,
                " OfferToReceiveVideo: ", incomingVideo
            );

            new Promise(function (resolve, reject) {
                getCamMedia(rtcConn, outgoingVideo, outgoingAudio);
                setTimeout(resolve, 3000, "");
            }).then(_ => {
                let sessionid = event.channel;
                rtcConn.openOrJoin(sessionid, function (res) {
                    webrtcdev.info("[sessionmanager] join-channel-resp - openOrJoin session ", sessionid, " response - ", res);
                    if (res) {
                        webrtcdev.info(" [sessionmanager] join-channel-resp - openOrJoin ok,  userid ", selfuserid, " with role ", role);
                        // for a new joiner , update his local peerinfo
                        updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local");
                    } else {
                        webrtcdev.error(" [sessionmanager] join-channel-resp -  openOrJoin  Errored from signaller ");
                    }
                });
                // rtcConn.join(sessionid, function (res) {
                //     webrtcdev.info(" [sessionmanager] join-channel-resp - Join ok,  userid ", selfuserid, " with role ", role);
                //     updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local");
                // });
            }).catch((reason) => {
                webrtcdev.error('[sessionmanager] join-channel-resp - Handle rejected promise (' + reason + ')');
            });

            if (event.message)
                shownotification(event.msgtype + " : " + event.message);
        } else {
            // signaller doesnt allow channel Join
            webrtcdev.error("[sessionmanager] Could not join this channel, Server refused");
            alert("Could not join this channel, Server refused. Please end this session and create another session");
        }
    });

    socket.on("channel-event", function (event) {
        webrtcdev.log("[sessionmanager] channel-event---------------------  ", event);
        if (event.type == "new-join" && event.msgtype != "error") {
            webrtcdev.log("[session manager] - new-join-channel ");
        } else {
            webrtcdev.warn("[session manager] - unhandled channel event ");
        }
    });

    socket.on('event', function (data) {
        console.log("event", data);
    });

    socket.on('disconnect', function () {
        console.error("disconnected ");
    });
}

// -------------------------------------------- End of Communication with Web Sever -----------------------------------


/*
 * set Real Time Communication connection
 * @method
 * @name setRtcConn
 * @param {int} sessionid
*/
var setRtcConn = function (sessionid, sessionobj) {

    webrtcdev.log("[sessionmanager] setRtcConn - initiating RtcConn with signaller ", sessionobj);

    rtcConn = new RTCMultiConnection(),

        rtcConn.channel = this.sessionid,

        rtcConn.socketURL = sessionobj.signaller, // location for the SDP offer/answer signaller

        rtcConn.iceServers = sessionobj.turn.iceServers, // || rtcConn.getIceServers()

        rtcConn.iceTransportPolicy = "all" , // all , relay
        rtcConn.bundlePolicy = "balanced",
        rtcConn.rtcpMuxPolicy = "require",
        rtcConn.iceCandidatePoolSize = 0,
        rtcConn.sdpSemantics = "unified-plan",

        // rtcConn.optionalArgument = {
        //     optional: [{
        //         DtlsSrtpKeyAgreement: true
        //     }, {
        //         googImprovedWifiBwe: true
        //     }, {
        //         googScreencastMinBitrate: 300
        //     }, {
        //         googIPv6: true
        //     }, {
        //         googDscp: true
        //     }, {
        //         googCpuUnderuseThreshold: 55
        //     }, {
        //         googCpuOveruseThreshold: 85
        //     }, {
        //         googSuspendBelowMinBitrate: true
        //     }, {
        //         googCpuOveruseDetection: true
        //     }],
        //     mandatory: {}
        // },
        // rtcConn.optionalArgument = {},
        //
        rtcConn.sdpConstraints = {
            mandatory: {
                OfferToReceiveAudio: incomingAudio ,
                OfferToReceiveVideo: incomingVideo
            },
            optional: [{
                VoiceActivityDetection: false
            }]
        },

        rtcConn.candidates = {
            host: true,
            stun: true,
            turn: true
        },

        rtcConn.session = {
            video: outgoingVideo || true,
            audio: outgoingAudio || true,
            data: outgoingData || true
        },

        rtcConn.direction = 'many-to-many', // other options 'one-way'

        rtcConn.dontCaptureUserMedia = !outgoingVideo || false,
        rtcConn.dontGetRemoteStream = !outgoingVideo || false,
        rtcConn.dontAttachStream = !outgoingVideo || false,

        // Bandwidth Optimization
        rtcConn.isLowBandwidth = navigator.connection.downlink < 1,

        // To limit bandwidth
        rtcConn.bandwidth = {
            screen: true,
            audio: true,
            video: true
        },

        rtcConn.codecs = {
            audio: 'opus',
            video: 'VP9'
        },

        rtcConn.version = '@@version',

        // rtcConn.onNewParticipant = function (participantId, userPreferences) {
        //     webrtcdev.log("[sartjs] rtcconn onNewParticipant, participantId -  ", participantId, " , userPreferences - ", userPreferences);
        //     //shownotification("[sartjs] onNewParticipant userPreferences.connectionDescription.sender : " + participantId + " name : "+ remoteusername + " requests new participation ");
        //     rtcConn.acceptParticipationRequest(participantId, userPreferences);
        // },

        rtcConn.onopen = function (event) {

            webrtcdev.log("[sessionmanager] onopen - event ", event);

            try {
                shownotification(event.extra.name + " joined session ", "info");
                showdesktopnotification(document.title, event.extra.name + " joined session ");

                if (event.userid == selfuserid) {
                    webrtcdev.log("[sessionmanager] onopen - selfuserid ", selfuserid, " joined the session ");

                    // event emitter for app client
                    webrtcdev.log("[sessionmanager] onopen - dispatch onLocalConnect");
                    window.dispatchEvent(new CustomEvent('webrtcdev', {
                        detail: {
                            servicetype: "session",
                            action: "onLocalConnect"
                        },
                    }));

                } else {
                    // Add remote peer userid to remoteUsers
                    // remoteUsers = rtcConn.peers.getAllParticipants();
                    // webrtcdev.log(" [sessionmanager] onopen by remote suers - Collecting remote peers", remoteUsers);

                    //  add new peers
                    // for (x in remoteUsers) {
                    //     webrtcdev.log(" [sessionmanager] join-channel. Adding remote peer ", remoteUsers[x]);
                    //     if (remoteUsers[x] == event.userid) {
                    // .... update remote peerinfo
                    //     }
                    //     webrtcdev.log(" [sessionmanager onopen] created/updated local peerinfo for open-channel ");
                    // }

                    // Remove Duplicates from remote
                    // remoteUsers = remoteUsers.filter(function (elem, index, self) {
                    //     return index == self.indexOf(elem);
                    // });

                    webrtcdev.log(" SDP", findPeerInfoSDP(event.userid));

                    // check if maxAllowed capacity of the session isnot reached before updating peer info, else return
                    if (remoteobj.maxAllowed != "unlimited" && webcallpeers.length <= remoteobj.maxAllowed) {
                        webrtcdev.log("[sessionmanager] onopen: peer length " + webcallpeers.length + " is less than max capacity of session  of the session " + remoteobj.maxAllowed);
                        let peerinfo = findPeerInfo(event.userid);
                        let name = event.extra.name,
                            color = event.extra.color,
                            email = event.extra.email,
                            role = event.extra.role;
                        if (!peerinfo) {
                            webrtcdev.log("[sessionmanager] onopen - create new peerinfo");
                            // If peerinfo is not present for new participant , treat him as Remote
                            if (name == "LOCAL") {
                                name = "REMOTE";
                            }
                            updatePeerInfo(event.userid, name, color, email, role, "remote");
                            shownotification(event.extra.role + "  " + event.type);
                            peerinfo = findPeerInfo(event.userid);
                        } else {
                            // Peer was already present, this is s rejoin
                            webrtcdev.log("[sessionmanager] onopen - PeerInfo was already present, this is s rejoin, update the peerinfo ");
                            updatePeerInfo(event.userid, name, color, email, role, "remote");
                            shownotification(event.extra.role + " " + event.type);
                        }
                        // peerinfo.stream = "";
                        // peerinfo.streamid = "";
                        updateWebCallView(peerinfo);

                    } else {
                        // max capacity of session is reached
                        webrtcdev.error("[sessionmanager] onopen - max capacity of session is reached ", remoteobj.maxAllowed);
                        shownotificationWarning("Another user is trying to join this channel but max count [ " + remoteobj.maxAllowed + " ] is reached");
                    }

                    webrtcdev.log("[sessionmanager] onopen - dispatch onSessionConnect");
                    window.dispatchEvent(new CustomEvent('webrtcdev', {
                        detail: {
                            servicetype: "session",
                            action: "onSessionConnect"
                        }
                    }));
                }

                // In debug mode let the users create multiple user session in same browser ,
                // do not use localstorage values to get old userid for resuse
                // setting local caches
                if (!debug) {
                    if (!localStorage.getItem("userid"))
                        localStorage.setItem("userid", selfuserid);

                    // if (!localStorage.getItem("remoteUsers"))
                    //     localStorage.setItem("remoteUsers", remoteUsers);

                    if (!localStorage.getItem("channel"))
                        localStorage.setItem("channel", sessionid);
                }

            } catch (err) {
                shownotification("problem in session open ", "warning");
                webrtcdev.error("[sessionmanager] onopen - problem in session open", err);
            }
        },

        rtcConn.onMediaError = function (error, constraints) {
            webrtcdev.error("[sessionmanager] onMediaError - ", error, " constraints ", constraints);

            // Join without stream
            webrtcdev.warn("[sessionmanager] onMediaError - Joining without camera Stream for userid : ", selfuserid);
            shownotification(error.name + " Joining without camera Stream ", "warning");
            localVideoStreaming = false;
            // For local Peer , if camera is not allowed or not connected then put null in video containers
            // if (!selfuserid) {
            //     webrtcdev.warn("selfuserid undefiend , seeting iut t webcallpeers index 0", webcallpeers[0]);
            //     selfuserid = webcallpeers[0].user;
            // }
            // let peerinfo = findPeerInfo(selfuserid);
            // peerinfo.type = "Local";
            // peerinfo.stream = "";
            // peerinfo.streamid = "";
            // updateWebCallView(peerinfo);
        },

        rtcConn.onstream = function (event) {
            webrtcdev.log("[sessionmanager] onstream - event ", event);
            if (event.type == "local") localVideoStreaming = true;

            var userid = event.userid;
            if(!userid){
                console.error("no userid found onstream ");
            }

            var peerinfo = findPeerInfo(userid);
            if (!peerinfo) {
                webrtcdev.warn("[sessionmanager] onstream - PeerInfo not present in webcallpeers " + userid + " creating it now ");
                //create peerinfo with userid, username, usecolor, useremail, userrole, type
                var p1 = new Promise((resolve, reject) => {
                    updatePeerInfo(userid, event.extra.name, event.extra.color, event.extra.email, event.extra.role, event.type);
                    resolve('Success!');
                });
                p1.then( appendToPeerValue(userid, "stream", event.stream))
                    .then( appendToPeerValue(userid, "streamid", event.stream.streamid));

                // update webcallview with newly created peerinfo
                peerinfo = findPeerInfo(userid);
                updateWebCallView(peerinfo);
                webrtcdev.log(" [sessionmanager] onstream - updated webcallview for ", userid);

            } else if (role == "inspector" && event.type == "local") {
                // ignore any incoming stream from inspector
                webrtcdev.warn("[sessionmanager] onstream - ignore any incoming stream from inspector");
                updateWebCallView(peerinfo);

            } else {
                webrtcdev.log("[sessionmanager] onstream - update PeerInfo with incoming stream and streamId ");
                var p2 = new Promise((resolve, reject) => {
                    appendToPeerValue(userid, "type", event.type);
                    resolve('Success!');
                });
                p2.then( appendToPeerValue(userid, "stream", event.stream))
                    .then( appendToPeerValue(userid, "streamid", event.stream.streamid));

                peerinfo = findPeerInfo(userid);
                updateWebCallView(peerinfo);
                webrtcdev.log(" [sessionmanager] onstream - updated webcallview for ", peerinfo.userid);
            }
        },

        rtcConn.onstreamended = function (event) {
            webrtcdev.warn("[sessionmanager] On streamEnded event ", event);
            let mediaElement = document.getElementById(event.streamid);
            if (mediaElement) {
                mediaElement.parentNode.removeChild(mediaElement);
            }
        },

        rtcConn.chunkSize = 50 * 1000,

        rtcConn.onmessage = function (msg) {
            webrtcdev.log("[sessionmanager] onmessage ", msg);

            // Typing Update
            if (msg.data.typing) {
                // updateWhotyping(msg.extra.name + " is typing ...");
            } else if (msg.data.stoppedTyping) {
                // updateWhotyping("");

            } else {
                var msgpeerinfo = findPeerInfo(msg.userid);
                switch (msg.data.type) {
                    case "screenshare":
                        if (msg.data.message == "startscreenshare") {
                            let scrroomid = msg.data.screenid;
                            shownotification("Starting screen share ", scrroomid);
                            //createScreenViewButton();
                            let button = document.getElementById(screenshareobj.button.shareButton.id);
                            button.className = screenshareobj.button.shareButton.class_busy;
                            button.innerHTML = screenshareobj.button.shareButton.html_busy;
                            button.disabled = true;
                            connectScrWebRTC("join", scrroomid);
                        } else if (msg.data.message == "screenshareStartedViewing") {
                            screenshareNotification("", "screenshareStartedViewing");
                        } else if (msg.data.message == "stoppedscreenshare") {
                            shownotification("Screenshare has stopped : " + msg.data.screenStreamid);
                            //createScreenViewButton();
                            let button = document.getElementById(screenshareobj.button.shareButton.id);
                            button.className = screenshareobj.button.shareButton.class_off;
                            button.innerHTML = screenshareobj.button.shareButton.html_off;
                            button.disabled = false;
                            webrtcdevCleanShareScreen(e.data.screenStreamid);
                        } else {
                            webrtcdev.warn("[sessionmanager] unrecognized screen-share message ", msg.data.message);
                        }
                        break;

                    case "chat":
                        // updateWhotyping(msg.extra.name + " has send chat ");
                        addNewMessage({
                            header: msg.extra.name,
                            message: msg.data.message,
                            userinfo: msg.data.userinfo,
                            color: msg.extra.color
                        });
                        window.dispatchEvent(new CustomEvent('webrtcdev', {
                            detail: {
                                servicetype: "chat",
                                action: "onchat"
                            }
                        }));
                        break;

                    case "mute":
                        // let mutearr=["videomute","videounmute","audiomute","audiounmute"];
                        // if(mutearr.includes(message.data.message) ){
                        //     window.dispatchEvent(new CustomEvent('webrtcdev', {
                        //         detail: {
                        //             servicetype: "mute",
                        //             action: message.data.message
                        //         }
                        //     }));
                        // }
                        let videoButton = document.getElementById(msgpeerinfo.controlBarName+"videoButton");
                        let audioButton = document.getElementById(msgpeerinfo.controlBarName+"audioButton");

                        switch (msg.data.message) {
                            case "videomute":
                                videoButton.innerHTML = muteobj.video.button.html_off;
                                videoButton.className = muteobj.video.button.class_off;
                                console.log("video mute");
                                break;
                            case "videounmute":
                                videoButton.innerHTML = muteobj.video.button.html_on;
                                videoButton.className = muteobj.video.button.class_on;
                                break;
                            case "audiomute":
                                audioButton.className = muteobj.audio.button.class_off;
                                audioButton.innerHTML = muteobj.audio.button.html_off;
                                console.log("audio mute");
                                break;
                            case "audiounmute":
                                audioButton.className = muteobj.audio.button.class_on;
                                audioButton.innerHTML = muteobj.audio.button.html_on;
                                break;
                            default:
                                webrtcdev.error("unmatched mut case transmitted by peer");
                                break;
                        }
                        break;

                    case "imagesnapshot":
                        displayList(null, msgpeerinfo, msg.data.message, msg.data.name, "imagesnapshot");
                        displayFile(null, msgpeerinfo, msg.data.message, msg.data.name, "imagesnapshot");
                        break;

                    case "videoRecording":
                        displayList(null, msgpeerinfo, msg.data.message, msg.data.name, "videoRecording");
                        displayFile(null, msgpeerinfo, msg.data.message, msg.data.name, "videoRecording");
                        break;

                    case "videoScreenRecording":
                        displayList(null, msgpeerinfo, msg.data.message, msg.data.name, "videoScreenRecording");
                        displayFile(null, msgpeerinfo, msg.data.message, msg.data.name, "videoScreenRecording");
                        break;

                    case "file":
                        addNewMessage({
                            header: msg.extra.name,
                            message: msg.data.message,
                            userinfo: getUserinfo(rtcConn.blobURLs[msg.userid], "chat-message.png"),
                            color: msg.extra.color
                        });
                        break;

                    case "canvas":
                        if (msg.data.draw) {
                            CanvasDesigner.syncData(msg.data.draw);
                        } else if (msg.data.board) {
                            webrtcdev.log("[sessionmanager] Canvas : ", msg.data);
                            if (msg.data.board.from == "remote") {
                                if (msg.data.board.event == "open" && isDrawOpened != true)
                                    syncDrawBoard(msg.data.board);
                                else if (msg.data.board.event == "close" && isDrawOpened == true)
                                    syncDrawBoard(msg.data.board);
                            }
                        } else {
                            //empty canvas data
                            webrtcdev.warn(" Board data mismatch", msg.data);
                        }
                        break;

                    case "texteditor":
                        receiveWebrtcdevTexteditorSync(msg.data.data);
                        break;

                    case "codeeditor":
                        receiveWebrtcdevCodeeditorSync(msg.data.data);
                        break;

                    case "pointer":
                        var elem = document.getElementById("cursor2");
                        if (elem) {
                            if (e.data.action == "startCursor") {
                                elem.setAttribute("style", "display:block");
                                placeCursor(elem, msg.data.corX, msg.data.corY);
                            } else if (msg.data.action == "stopCursor") {
                                elem.setAttribute("style", "display:none");
                            }
                        } else {
                            alert(" Cursor for remote is not present ");
                        }
                        break;

                    case "timer":
                        if (msgpeerinfo) {
                            //check if the peer has stored zone and time info
                            if (!msgpeerinfo.time) {
                                msgpeerinfo.time = msg.data.time;
                            }
                            if (!msgpeerinfo.zone) {
                                msgpeerinfo.zone = msg.data.zone;
                            }
                            webrtcdev.log("[sessionmanager] webcallpeers appended with zone and datetime ", msgpeerinfo);
                        }
                        webrtcdev.log("[sessionmanager] peerTimerStarted, start peerTimeZone and startPeersTime");
                        peerTimeZone(msg.data.zone, msg.userid);
                        startPeersTime(msg.data.time, msg.data.zone, msg.userid);
                        break;

                    case "buttonclick":
                        var buttonElement = getElementById(msg.data.buttonName);
                        if (buttonElement.getAttribute("lastClickedBy") != rtcConn.userid) {
                            buttonElement.setAttribute("lastClickedBy", msg.userid);
                            buttonElement.click();
                        }
                        break;

                    case "syncOldFiles":
                        sendOldFiles();
                        break;

                    case "shareFileRemove":
                        webrtcdev.log(" [sessionmanager] shareFileRemove - remove file : ", msg.data._filename);
                        var progressdiv = msg.data._element;
                        var filename = msg.data._filename;
                        let removeButton = "removeButton" + progressdiv;

                        if (document.getElementById("display" + filename))
                            hideelem("display" + filename);

                        if (document.getElementById(progressdiv)) {
                            hideelem(progressdiv);
                            removeFile(progressdiv);
                            webrtcdev.log(" [sessionmanager] shareFileRemove done");
                        } else {
                            webrtcdev.log(" [sessionmanager] shareFileRemove already done since ", progressdiv, "element doesnt exist ");
                            // already removed
                            return;
                        }
                        document.getElementById(removeButton).click();
                        hideelem(removeButton);
                        break;

                    case "shareFileStopUpload":
                        var progressid = msg.data._element;
                        webrtcdev.log(" [sessionmanager] shareFileStopUpload", progressid);
                        // var filename = msg.data._filename;

                        for (x in webcallpeers) {
                            for (y in webcallpeers[x].filearray) {
                                if (webcallpeers[x].filearray[y].pid == progressid) {
                                    webrtcdev.log("[ sessionmanager ] shareFileStopUpload -  filepid ", webcallpeers[x].filearray[y].pid, " | status ", webcallpeers[x].filearray[y].status);
                                    webcallpeers[x].filearray[y].status = "stopped";
                                    hideFile(progressid);
                                    removeFile(progressid);
                                    return;
                                }
                            }
                        }
                        // let stopuploadButton = "stopuploadButton"+filename;
                        // document.getElementById(stopuploadButton).hidden = true;
                        break;

                    case "sendstats":
                        sendWebrtcdevStats();
                        break;

                    case "receivedstats":
                        onreceivedWebrtcdevStats(msg.userid, msg.data.message);
                        break;

                    default:
                        webrtcdev.warn("[sessionmanager] unrecognizable message from peer  ", msg);
                        break;
                }
            }
        },

        rtcConn.sendMessage = function (event) {
            webrtcdev.log("[session manager] sendMessage ", event);
            event.userid = rtcConn.userid;
            event.extra = rtcConn.extra;
            rtcConn.sendCustomMessage(event);
        },

        rtcConn.onleave = function (e) {
            webrtcdev.log("[session manager] onleav -  ", e);
            webrtcdev.warn("[session manager] onleave - userid left ", e.userid);

            var peerinfo = findPeerInfo(e.userid);

            if (!peerinfo) return;

            if (peerinfo.name) {
                shownotification(peerinfo.name + " left the conversation.");
                webrtcdev.log("[session manager] onleave - name ", peerinfo.name);
            }
            /*
            addNewMessage({
                header: e.extra.name,
                message: e.extra.name + " left session.",
                userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "info.png"),
                color: e.extra.color
            }), */

            webrtcdev.warn("[session manager]  onleave -  remove peerinfo ", peerinfo, " from webcallpeers ", webcallpeers);
            //rtcConn.playRoleOfInitiator()

            destroyWebCallView(peerinfo);
            removePeerInfo(e.userid);
        },

        rtcConn.onclose = function (e) {
            webrtcdev.warn("[session manager] RTCConn on close  ", e);
        },

        rtcConn.onEntireSessionClosed = function (e) {
            webrtcdev.warn("[session manager]  on Entire sesion closed ", e);
            rtcConn.attachStreams.forEach(function (stream) {
                stream.stop();
            });
            shownotification("Session Disconnected");
            //eventEmitter.emit('sessiondisconnected', '');
        },

        rtcConn.onFileStart = function (file) {
            webrtcdev.log("[sessionmanager] onFileStart", file);
            fileSharingStarted(file);
        },

        rtcConn.onFileProgress = function (event) {
            fileSharingInprogress(event);
        },

        rtcConn.onFileEnd = function (file) {
            fileSharingEnded(file);
        },

        rtcConn.takeSnapshot = function (userid, callback) {
            takeSnapshot({
                userid: userid,
                connection: connection,
                callback: callback
            });
        },

        rtcConn.connectionType = null,
        rtcConn.remoteUsers = [],

        rtcConn.extra = {
            uuid: rtcConn.userid,
            name: selfusername || "",
            // color: selfcolor || "", // user rmeote color do that joining parties can take it correctly
            color: (typeof remoteobj.userdetails === 'undefined') ? "" : remoteobj.userdetails.usercolor,
            email: selfemail || "",
            role: role || "participant"
        },

        rtcConn.socketMessageEvent = 'RTCMultiConnection-Message',
        rtcConn.socketCustomEvent = 'RTCMultiConnection-Custom-Message',

        rtcConn.enableFileSharing = true,
        rtcConn.filesContainer = document.body || document.documentElement,

        rtcConn.onSocketDisconnect = function (e) {
            webrtcdev.error("[sesionmanager ] on Socket Disconnected ", e);
            // re-establish socket connection
            webrtcdev.log("[sesionmanager ] re-establish socket connection  with SDP ");
            rtcConn.rejoin(rtcConn.connectionDescription);
        },

        rtcConn.onSocketError = function (e) {
            webrtcdev.error("[sesionmanager ] on Socket Error ", e);
        },

        webrtcdev.log("[sessionmanager] rtcConn : ", rtcConn);

    return rtcConn;
};

/**
 * Support Session Refresh
 * @method
 * @name supportSessionRefresh
 */
function supportSessionRefresh() {
    //alert(" old Userid " + localStorage.getItem("userid") + " | old channel  "+ localStorage.getItem("channel") );
    webrtcdev.log(" [sessionmanager ] check for session refresh/user refreshed",
        " Channel in local stoarge - ", localStorage.getItem("channel"),
        " Current Channel  - ", rtcConn.channel,
        " match ", localStorage.getItem("channel") == rtcConn.channel);

    if (localStorage.getItem("channel") == rtcConn.channel && localStorage.getItem("userid")) {
        webrtcdev.log(" [sessionmanager ] supportSessionRefresh - rejoining with old user id " + localStorage.getItem("userid"));
        selfuserid = localStorage.getItem("userid");
        shownotification("Refreshing the Session");
        return selfuserid;
    }
    //return Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
    return rtcConn.userid;
}

/**
 * connect to a webrtc socket channel
 * @method
 * @name setupCallView
 * @param {string} type
 * @param {string} channel
 * @param {string} userid
 */
var setupCallView = function (type, channel, userid) {
    // update web call view for Self
    var peerinfo = findPeerInfo(userid);
    if (peerinfo.setup == "done'") {
        webrtcdev.info(" [sessionmanager] setupCallView is laready done for peer", peerinfo);
        return;
    }

    updateLocalWebCallView(peerinfo);

    if (debug) showUserStats();

    // if the Listenin is active then freeze the screen
    if (listeninobj.active && role == "inspector") {
        webrtcdev.info(" [sessionmanage] freezing screen for role inspector ");
        freezescreen();
    }

    /*void(document.title = channel);*/
    // File share object
    if (fileshareobj.active) {

        // Create File Sharing Div
        if (fileshareobj.props.fileShare == "single") {
            createFileSharingDiv(peerinfo);

            //max display the local / single fileshare
            if (getElementById(peerinfo.fileShare.outerbox))
                getElementById(peerinfo.fileShare.outerbox).style.width = "100%";

        } else if (fileshareobj.props.fileShare == "divided") {

            // create local File sharing window
            // Do not create file share and file viewer for inspector's own session
            if (role != "inspector") {
                webrtcdev.log(" [sessionmanager] creating local file sharing");
                createFileSharingDiv(peerinfo);
            } else {
                webrtcdev.log("[sessionmanager] Since it is an inspector's own session , not creating local File viewer and list");
            }

            // create remotes File sharing window
            for (x in webcallpeers) {
                if (webcallpeers[x].userid != selfuserid && webcallpeers[x].role != "inspector") {
                    webrtcdev.log("[sessionmanager] setupCallView - creating remote file sharing ");
                    createFileSharingDiv(webcallpeers[x]);
                }
            }

            // on connect webrtc request old file from peerconnection session
            if (fileshareobj.sendOldFiles) {
                requestOldFiles();
            }

        } else {
            webrtcdev.error("[sessionmanager] fileshareobj.props.fileShare undefined ");
        }

        // Creating File listing div
        if (fileshareobj.props.fileList == "single") {
            document.getElementById(peerinfo.fileList.outerbox).style.width = "100%";
        } else if (fileshareobj.props.fileShare != "single") {
            webrtcdev.log("No Separate div created for this peer since fileshare container is single");
        } else {
            webrtcdev.error("fileshareobj.props.fileShare undefined ");
        }
    }

    // stats widget
    if (statisticsobj && statisticsobj.active) {
        // populate RTP stats
        getWebrtcdevStats();
    }

    // kickstart the timer
    if (timerobj && timerobj.active) {
        //s ession timer
        startsessionTimer(timerobj);
        // share time with peer
        shareTimePeer();
        // self time
        startTime();
        showTimeZone();
    }

    // appendToPeerValue(selfuserid, "setup", "done");
};

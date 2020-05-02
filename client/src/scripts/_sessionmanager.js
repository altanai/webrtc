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
        let addr = "/";
        if (socketAddr != "/") {
            addr = socketAddr;
        }
        webrtcdev.log("[sessionmanager] StartSession" + sessionid, " on address ", addr);
        // socket = io.connect(addr, {
        //     transports: ['websocket']
        // });
        socket = io.connect(addr);
        // socket.set('log level', 3);
    } catch (err) {
        webrtcdev.error(" problem in socket connnection", err);
        throw (" problem in socket connection");
    }

    if (!sessionid) {
        shownotification("Invalid session");
        webrtcdev.error("[sessionmanager] Session id undefined ");
        return;
    }

    // Socket Listeners
    socket.on("connect", function () {
        webrtcdev.log("[sessionmanager] connected to signaller ");

        socket.emit("presence", {
            channel: sessionid
        });

        socket.on('disconnected', function (reason) {
            webrtcdev.error("[sessionmanager] Disconnected from signaller  ");
            shownotification("Disconnected from signaller ");
            if (reason === 'io server disconnect') {
                webrtcdev.error("[sessionmanager] Disconnected initiated by signaller , attempt to re-connect ");
                // the disconnection was initiated by the server, you need to reconnect manually
                socket.connect();
            }
        });

        // socket.on('connect_error', (error) => {
        //     webrtcdev.error("[sessionmanager] connect_error from signaller ", error );
        // });
        //
        // socket.on('connect_timeout', (timeout) => {
        //     webrtcdev.error("[sessionmanager] connect_timeout from signaller ", timeout);
        // });
        //
        // socket.on('error', (error) => {
        //     webrtcdev.error("[sessionmanager] error from signaller  ", error);
        // });
        //
        // socket.on('reconnect', (attemptNumber) => {
        //     webrtcdev.log("[sessionmanager] Reconnect ", attemptNumber, " from signaller  ");
        // });
        //
        // socket.on('reconnect_attempt', (attemptNumber) => {
        //     webrtcdev.log("[sessionmanager] Reconnect attempt ", attemptNumber, " from signaller  ");
        // });
        //
        // socket.on('reconnecting', (attemptNumber) => {
        //     webrtcdev.log("[sessionmanager] Reconnecting from signaller  ");
        // });
        //
        // socket.on('reconnect_error', (error) => {
        //     webrtcdev.error("[sessionmanager] reconnect_error from signaller  ", error);
        // });
        //
        // socket.on('reconnect_failed', () => {
        //     webrtcdev.error("[sessionmanager] Reconnect failed from signaller  ");
        // });

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

            let promise = new Promise(function (resolve) {
                webrtcdev.log("[sessionmanager] open-channel-resp - ",
                    " Session video:", outgoingVideo,
                    " audio: ", outgoingAudio,
                    " data: ", outgoingData,
                    " OfferToReceiveAudio: ", incomingAudio,
                    " OfferToReceiveVideo: ", incomingVideo
                );

                rtcConn.connectionType = "open";

                let sessionid = event.channel;
                // rtcConn.openOrJoin(sessionid, function (res) {
                // resolve("ok");
                //     webrtcdev.log(" [sessionmanager] open-channel-resp - openOrJoin offer/answer webrtc ", selfuserid, " with role ", role, " responese ", res);
                // });
                rtcConn.open(event.channel, function (res) {
                    webrtcdev.log(" [sessionmanager] offer/answer webrtc with role ", role, " responese ", res);
                    resolve("ok");
                });
            });

            promise.then(_ => {
                updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local");
            }).then(_ => {
                getCamMedia(rtcConn, outgoingVideo, outgoingAudio);
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

            let promise = new Promise(function (resolve, reject) {
                rtcConn.connectionType = "join",
                    rtcConn.remoteUsers = event.users;
                // rtcConn.connectionDescription = rtcConn.join(event.channel); gives session not avaible as session in not present in list of rooms
                let sessionid = event.channel;
                rtcConn.openOrJoin(sessionid, function (res) {
                    webrtcdev.log(" [sessionmanager] open-channel-resp - openOrJoin offer/answer webrtc with role ", role, " responese ", res);
                    resolve("ok");
                });
            });

            promise.then(_ => {
                // rtcConn.connectionDescription = rtcConn.openOrJoin(event.channel);
                webrtcdev.info(" [sessionmanager] rtcConn.connectionDescription  ", rtcConn.connectionDescription);
                webrtcdev.info(" [sessionmanager] offer/answer webrtc  ", selfuserid, " with role ", role);
                // for a new joiner , update his local info
                updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local");
            }).then(_ => {
                getCamMedia(rtcConn, outgoingVideo, outgoingAudio);
            }).catch((reason) => {
                webrtcdev.error('[sessionmanager] join channel response -  Handle rejected promise (' + reason + ')');
            });

            if (event.message)
                shownotification(event.msgtype + " : " + event.message);
        } else {
            // signaller doesnt allow channel Join
            webrtcdev.error(" [sessionmanager] Could not join this channel, Server refused");
            alert("Could not join this channel, Server refused. Please end this session and create another session");
        }
    });

    socket.on("channel-event", function (event) {
        webrtcdev.log("[sessionmanager] --------------channel-event---------------------  ", event);
        if (event.type == "new-join" && event.msgtype != "error") {
            webrtcdev.log("[session manager ] - new-join-channel ");

            // check if maxAllowed capacity of the session isnot reached before updating peer info, else return
            if (remoteobj.maxAllowed != "unlimited" && webcallpeers.length <= remoteobj.maxAllowed) {
                webrtcdev.log("[sessionmanager] channel-event : peer length " + webcallpeers.length + " is less than max capacity of session  of the session " + remoteobj.maxAllowed);
                let participantId = event.data.sender;
                if (!participantId) {
                    webrtcdev.error("[sessionmanager] channel-event : userid not present in channel-event:" + event.type);
                    reject("userid not found");
                }
                let peerinfo = findPeerInfo(participantId);
                let name = event.data.extra.name,
                    color = event.data.extra.color,
                    email = event.data.extra.email,
                    role = event.data.extra.role;
                if (!peerinfo) {
                    webrtcdev.log("[sessionmanager] channel-event : PeerInfo not already present, create new peerinfo");
                    // If peerinfo is not present for new participant , treat him as Remote
                    if (name == "LOCAL") {
                        name = "REMOTE";
                    }
                    updatePeerInfo(participantId, name, color, email, role, "remote");
                    shownotification(event.data.extra.role + "  " + event.type);
                } else {
                    // Peer was already present, this is s rejoin
                    webrtcdev.log("[sessionmanager] channel-event : PeerInfo was already present, this is s rejoin, update the peerinfo ");
                    updatePeerInfo(participantId, name, color, email, role, "remote");
                    shownotification(event.data.extra.role + " " + event.type);
                }

                if (!peerinfo) {
                    peerinfo = findPeerInfo(participantId)
                }
                peerinfo.type = "remote";
                peerinfo.stream = "";
                peerinfo.streamid = "";
                updateWebCallView(peerinfo);

                // event emitter for local connect
                // window.dispatchEvent(new CustomEvent('webrtcdev', {
                //     detail: {
                //         servicetype: "session",
                //         action: "onLocalConnect"
                //     },
                // }));

            } else {
                // max capacity of session is reached
                webrtcdev.error("[sessionmanager] channel-event : max capacity of session is reached ", remoteobj.maxAllowed);
                shownotificationWarning("Another user is trying to join this channel but max count [ " + remoteobj.maxAllowed + " ] is reached");
            }

        } else {
            webrtcdev.warn("unhandled channel event ");
        }
    });
}


/*
 * set Real Time Communication connection
 * @method
 * @name setRtcConn
 * @param {int} sessionid
*/
var setRtcConn = function (sessionid, sessionobj) {

    webrtcdev.log("[sessionmanager] setRtcConn - initiating RtcConn");

    rtcConn = new RTCMultiConnection(),

        rtcConn.channel = this.sessionid,
        rtcConn.socketURL = location.hostname + ":8085/",
        // rtcConn.iceServers = sessionobj.turn.iceservers || rtcConn.getIceServers() ,

        // turn off media till connection happens
        webrtcdev.log("[sessionmanager] set dontAttachStream , dontCaptureUserMedia , dontGetRemoteStream as true "),

        rtcConn.session = {
            video: outgoingVideo || true,
            audio: outgoingAudio || true,
            data: outgoingData || true
        },
        rtcConn.sdpConstraints.mandatory = {
            OfferToReceiveAudio: incomingAudio || true,
            OfferToReceiveVideo: incomingVideo || true
        },

        rtcConn.dontCaptureUserMedia = !outgoingVideo || false,
        rtcConn.dontGetRemoteStream = !outgoingVideo || false,
        rtcConn.dontAttachStream = !outgoingVideo || false,

        rtcConn.onNewParticipant = function (participantId, userPreferences) {
            webrtcdev.log("[sartjs] rtcconn onNewParticipant, participantId -  ", participantId, " , userPreferences - ", userPreferences);
            //shownotification("[sartjs] onNewParticipant userPreferences.connectionDescription.sender : " + participantId + " name : "+ remoteusername + " requests new participation ");
            rtcConn.acceptParticipationRequest(participantId, userPreferences);
        },

        rtcConn.onopen = function (event) {
            webrtcdev.log("[sessionmanager] rtconn onopen - by ", event.userid, event);
            try {

                shownotification(event.extra.name + " joined session ", "info");
                showdesktopnotification(document.title, event.extra.name + " joined session ");

                if (event.userid == selfuserid) {
                    webrtcdev.log("[sessionmanager] onopen selfuserid ", selfuserid, " joined the session ");

                    // event emitter for app client
                    window.dispatchEvent(new CustomEvent('webrtcdev', {
                        detail: {
                            servicetype: "session",
                            action: "onLocalConnect"
                        },
                    }));

                } else {
                    // Add remote peer userid to remoteUsers
                    remoteUsers = rtcConn.peers.getAllParticipants();
                    webrtcdev.log(" [sessionmanager] onopen- Collecting remote peers", remoteUsers);

                    // add new peers
                    for (x in remoteUsers) {
                        webrtcdev.log(" [sessionmanager] join-channel. Adding remote peer ", remoteUsers[x]);
                        if (remoteUsers[x] == event.userid) {
                            let remoterole = event.extra.role || "participant", // will fail in case of 2 listeners
                                remotecolor = event.extra.color,
                                remoteemail = event.extra.email,
                                remoteusername = (event.extra.name == "LOCAL" ? "REMOTE" : event.extra.name);

                            updatePeerInfo(remoteUsers[x], remoteusername, remotecolor, remoteemail, remoterole, "remote");
                            if (remoterole == "inspector") {
                                shownotificationWarning("This session is being inspected ");
                            }
                            break;
                        }
                        webrtcdev.log(" [sessionmanager onopen] created/updated local peerinfo for open-channel ");
                    }

                    // Remove Duplicates from remote
                    // remoteUsers = remoteUsers.filter(function (elem, index, self) {
                    //     return index == self.indexOf(elem);
                    // });

                    window.dispatchEvent(new CustomEvent('webrtcdev', {
                        detail: {
                            servicetype: "session",
                            action: "onSessionConnect"
                        }
                    }));
                }

                // setting local caches
                webrtcdev.log(" [sessionmanager onopen] setting cache - channel " + sessionid + " with self-userid " + selfuserid + " and remoteUsers " + remoteUsers);

                // In debug mode let the users create multiple user session in same browser ,
                // do not use localstoarge values to get old userid for resuse
                // if (!debug) {
                //     if (!localStorage.getItem("userid"))
                //         localStorage.setItem("userid", selfuserid);
                //
                //     if (!localStorage.getItem("remoteUsers"))
                //         localStorage.setItem("remoteUsers", remoteUsers);
                //
                //     if (!localStorage.getItem("channel"))
                //         localStorage.setItem("channel", sessionid);
                // }

                // stats widget
                if (statisticsobj && statisticsobj.active) {
                    //populate RTP stats
                    showRtpstats();
                }

                // Connect to webrtc
                if (rtcConn.connectionType == "open") {
                    connectWebRTC("open", sessionid, selfuserid, []);
                } else if (rtcConn.connectionType == "join") {
                    connectWebRTC("join", sessionid, selfuserid, remoteUsers);
                } else {
                    shownotification("Connection type is neither open nor join", "warning");
                }

                if (timerobj && timerobj.active) {
                    startsessionTimer(timerobj);
                    shareTimePeer();
                }

            } catch (err) {
                shownotification("problem in session open ", "warning");
                webrtcdev.error("[sessionmanager] onopen - problem in session open", err);
            }
        },

        rtcConn.onMediaError = function (error, constraints) {
            webrtcdev.error("[sessionmanager] onMediaError - ", error, " constraints ", constraints);

            // Join without stream
            webrtcdev.warn("[sessionmanager] onMediaError- Joining without camera Stream");
            shownotification(error.name + " Joining without camera Stream ", "warning");
            localVideoStreaming = false;
            // For local Peer , if camera is not allowed or not connected then put null in video containers
            let peerinfo = webcallpeers[0];
            peerinfo.type = "Local";
            peerinfo.stream = "";
            peerinfo.streamid = "";
            updateWebCallView(peerinfo);

        },

        rtcConn.onstream = function (event) {
            webrtcdev.log("[sessionmanager] onstream - event ", event);
            if (event.type == "local") localVideoStreaming = true;

            var peerinfo = findPeerInfo(event.userid);
            if (!peerinfo) {
                webrtcdev.error("[sessionmanager] onstream - PeerInfo not present in webcallpeers ", event.userid, " creating it now ");
                //userid, username, usecolor, useremail, userrole, type
                updatePeerInfo(event.userid, event.extra.name, event.extra.color, event.extra.email, event.extra.role, event.type);
                webrtcdev.log(" [sessionmanager] onstream - updated local peerinfo for open-channel ");
                appendToPeerValue(event.userid, "stream", event.stream);
                appendToPeerValue(event.userid, "streamid", event.streamid);
                updateWebCallView(findPeerInfo(event.userid));
            } else if (role == "inspector" && event.type == "local") {
                // ignore any incoming stream from inspector
                webrtcdev.info("[sessionmanager] onstream - ignore any incoming stream from inspector");
                updateWebCallView(peerinfo);
            } else {
                peerinfo.type = event.type;
                peerinfo.stream = event.stream;
                peerinfo.streamid = event.stream.streamid;
                updateWebCallView(peerinfo);
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

        rtcConn.onmessage = function (e) {
            webrtcdev.log("[sessionmanager] on message ", e);
            if (e.data.typing) {
                updateWhotyping(e.extra.name + " is typing ...");
            } else if (e.data.stoppedTyping) {
                updateWhotyping("");
            } else {
                let msgpeerinfo = findPeerInfo(e.userid);
                switch (e.data.type) {
                    case "screenshare":
                        if (e.data.message == "startscreenshare") {
                            let scrroomid = e.data.screenid;
                            shownotification("Starting screen share ", scrroomid);
                            //createScreenViewButton();
                            let button = document.getElementById(screenshareobj.button.shareButton.id);
                            button.className = screenshareobj.button.shareButton.class_busy;
                            button.innerHTML = screenshareobj.button.shareButton.html_busy;
                            button.disabled = true;
                            connectScrWebRTC("join", scrroomid);
                        } else if (e.data.message == "screenshareStartedViewing") {
                            screenshareNotification("", "screenshareStartedViewing");
                        } else if (e.data.message == "stoppedscreenshare") {
                            shownotification("Screenshare has stopped : " + e.data.screenStreamid);
                            //createScreenViewButton();
                            let button = document.getElementById(screenshareobj.button.shareButton.id);
                            button.className = screenshareobj.button.shareButton.class_off;
                            button.innerHTML = screenshareobj.button.shareButton.html_off;
                            button.disabled = false;
                            webrtcdevCleanShareScreen(e.data.screenStreamid);
                        } else {
                            webrtcdev.warn(" unrecognized screenshare message ", e.data.message);
                        }
                        break;
                    case "chat":
                        updateWhotyping(e.extra.name + " has send message");
                        addNewMessage({
                            header: e.extra.name,
                            message: e.data.message,
                            userinfo: e.data.userinfo,
                            color: e.extra.color
                        });
                        window.dispatchEvent(new CustomEvent('webrtcdev', {
                            detail: {
                                servicetype: "chat",
                                action: "onchat"
                            }
                        }));
                        break;
                    case "imagesnapshot":
                        displayList(null, msgpeerinfo, e.data.message, e.data.name, "imagesnapshot");
                        displayFile(null, msgpeerinfo, e.data.message, e.data.name, "imagesnapshot");
                        break;
                    case "videoRecording":
                        displayList(null, msgpeerinfo, e.data.message, e.data.name, "videoRecording");
                        displayFile(null, msgpeerinfo, e.data.message, e.data.name, "videoRecording");
                        break;
                    case "videoScreenRecording":
                        displayList(null, msgpeerinfo, e.data.message, e.data.name, "videoScreenRecording");
                        displayFile(null, msgpeerinfo, e.data.message, e.data.name, "videoScreenRecording");
                        break;
                    case "file":
                        addNewMessage({
                            header: e.extra.name,
                            message: e.data.message,
                            userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "chat-message.png"),
                            color: e.extra.color
                        });
                        break;
                    case "canvas":
                        if (e.data.draw) {
                            CanvasDesigner.syncData(e.data.draw);
                        } else if (e.data.board) {
                            webrtcdev.log(" Canvas : ", e.data);
                            if (e.data.board.from == "remote") {
                                if (e.data.board.event == "open" && isDrawOpened != true)
                                    syncDrawBoard(e.data.board);
                                else if (e.data.board.event == "close" && isDrawOpened == true)
                                    syncDrawBoard(e.data.board);
                            }
                        } else {
                            webrtcdev.warn(" Board data mismatch", e.data);
                        }
                        break;
                    case "texteditor":
                        receiveWebrtcdevTexteditorSync(e.data.data);
                        break;
                    case "codeeditor":
                        receiveWebrtcdevCodeeditorSync(e.data.data);
                        break;
                    case "pointer":
                        var elem = document.getElementById("cursor2");
                        if (elem) {
                            if (e.data.action == "startCursor") {
                                elem.setAttribute("style", "display:block");
                                placeCursor(elem, e.data.corX, e.data.corY);
                            } else if (e.data.action == "stopCursor") {
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
                                msgpeerinfo.time = e.data.time;
                            }
                            if (!msgpeerinfo.zone) {
                                msgpeerinfo.zone = e.data.zone;
                            }
                            webrtcdev.log("[sessionmanager] webcallpeers appended with zone and datetime ", msgpeerinfo);
                        }
                        webrtcdev.log("[sessionmanager] peerTimerStarted, start peerTimeZone and startPeersTime");
                        peerTimeZone(e.data.zone, e.userid);
                        startPeersTime(e.data.time, e.data.zone, e.userid);
                        break;
                    case "buttonclick":
                        var buttonElement = getElementById(e.data.buttonName);
                        if (buttonElement.getAttribute("lastClickedBy") != rtcConn.userid) {
                            buttonElement.setAttribute("lastClickedBy", e.userid);
                            buttonElement.click();
                        }
                        break;
                    case "syncOldFiles":
                        sendOldFiles();
                        break;
                    case "shareFileRemove":
                        webrtcdev.log(" [sessionmanager] shareFileRemove - remove file : ", e.data._filename);
                        var progressdiv = e.data._element;
                        var filename = e.data._filename;
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
                        var progressid = e.data._element;
                        webrtcdev.log(" [sessionmanager] shareFileStopUpload", progressid);
                        // var filename = e.data._filename;

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
                        onreceivedWebrtcdevStats(e.userid, e.data.message);
                        break;
                    default:
                        webrtcdev.warn("[sessionmanager] unrecognizable message from peer  ", e);
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
            webrtcdev.log("[session manager] onleave -  ", e);
            webrtcdev.warn("[session manager] onleave - userid left ", e.userid)

            var peerinfo = findPeerInfo(e.userid);

            if (!peerinfo) return;

            if (peerinfo.name) {
                shownotification(peerinfo.name + " left the conversation.");
                webrtcdev.log("[session manager] onleave - name ",peerinfo.name);
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
            removePeerInfo(peerinfo.userid);
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
 * connect to a webrtc socket channel
 * @method
 * @name connectWebRTC
 * @param {string} type
 * @param {string} channel
 * @param {string} userid
 * @param {string} remoteUsers
 */
var connectWebRTC = function (type, channel, selfuserid, remoteUsers) {
    webrtcdev.info(" [sessionmanager] ConnectWebRTC type : ", type, " , Channel :", channel,
        " , self-Userid : ", selfuserid, " , and remote users : ", remoteUsers);
    if (debug) showUserStats();

    // if the Listene is active then freeze the screen
    if (listeninobj.active && role == "inspector") {
        webrtcdev.info(" [sessionmanage] freezing screen for role inspector ");
        freezescreen();
    }

    /*void(document.title = channel);*/
    // File share object
    if (fileshareobj.active) {

        try {
            var _peerinfo = findPeerInfo(selfuserid);
            if (!_peerinfo) throw "self peerinfo missing in webcallpeers for " + selfuserid;

            // Create File Sharing Div
            if (fileshareobj.props.fileShare == "single") {
                createFileSharingDiv(_peerinfo);
                //max display the local / single fileshare
                getElementById(_peerinfo.fileShare.outerbox).style.width = "100%";

            } else if (fileshareobj.props.fileShare == "divided") {

                // create local File sharing window
                // Do not create file share and file viewer for inspector's own session
                if (role != "inspector") {
                    webrtcdev.log(" [sessionmanager] creating local file sharing");
                    createFileSharingDiv(_peerinfo);
                } else {
                    webrtcdev.log("[sessionmanager] Since it is an inspector's own session , not creating local File viewer and list");
                }

                // create remotes File sharing window
                for (x in webcallpeers) {
                    if (webcallpeers[x].userid != selfuserid && webcallpeers[x].role != "inspector") {
                        webrtcdev.log(" [start connectWebRTC] creating remote file sharing ");
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
                document.getElementById(_peerinfo.fileList.outerbox).style.width = "100%";
            } else if (fileshareobj.props.fileShare != "single") {
                webrtcdev.log("No Seprate div created for this peer since fileshare container is single");
            } else {
                webrtcdev.error("fileshareobj.props.fileShare undefined ");
            }

        } catch (err) {
            webrtcdev.error("[sessionmanager] connectwebrtc -", err)
        }
    }

    // kick start the timer
    if (timerobj && timerobj.active) {
        startTime();
        showTimeZone();
    }
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


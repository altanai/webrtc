/**************************************************************
 Screenshare
 ****************************************************************/
var scrConn = null;
var screen_constraints, screenStreamId;

var screenCallback;
var signaler, screen, screenRoomid;
var screenShareStreamLocal = null;

/**
 * function set up Screenshare session RTC peer connection
 * @method
 * @name webrtcdevPrepareScreenShare
 * @param {function} callback
 */
function webrtcdevPrepareScreenShare(screenRoomid, sessionobj) {

    localStorage.setItem("screenRoomid ", screenRoomid);
    webrtcdev.log("[screenshare JS] webrtcdevPrepareScreenShare - screenRoomid : ", screenRoomid);
    webrtcdev.log("[screenshare JS] webrtcdevPrepareScreenShare  with sessionnobj : ", sessionobj, " config ", config);

    scrConn = new RTCMultiConnection(),

        scrConn.channel = screenRoomid,

        scrConn.socketURL = sessionobj.signaller, // location for the SDP offer/answer signaller

        scrConn.iceServers = sessionobj.turn.iceServers, // || rtcConn.getIceServers()

        scrConn.candidates = {
            host: true,
            stun: true,
            turn: true
        },

        scrConn.session = {
            screen: true,
            oneway: true
        },

        scrConn.direction = 'one-way', // other options 'many-to-many'

        scrConn.sdpConstraints.mandatory = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: true
        },

        scrConn.mediaConstraints = {
            audio: false,
            video: {
                frameRate: 20,
                height: 240,
                width: 320,
            }
        },

        scrConn.dontCaptureUserMedia = false,
        scrConn.dontGetRemoteStream = false,
        scrConn.dontAttachStream = false,

        scrConn.codecs = {
            audio: 'opus',
            video: 'VP9'
        },

        scrConn.onMediaError = function (error, constraints) {
            webrtcdev.error("[screenshareJS] onMediaError in _screenshare :", error, constraints);
            shownotificationWarning(error.name);
        },

        scrConn.onstream = function (event) {
            webrtcdev.log("[screenshareJS] onstream in _screenshare :", event);

            if (debug) {
                let nameBox = document.createElement("span");
                nameBox.innerHTML = "<br/>" + screenRoomid + "<br/>";
                getElementById(screenshareobj.screenshareContainer).appendChild(nameBox);
            }

            if (event.type == "remote" && event.type != "local") {
                // Remote got screen share stream
                shownotificationWarning("started streaming remote's screen");
                webrtcdev.log("[screensharejs] on stream remote ");

                if (event.stream.streamid) {
                    webrtcdev.log("[screensharejs] remote screen event.stream.streamId " + event.stream.streamId);
                    screenStreamId = event.stream.streamid;
                } else if (event.streamid) {
                    webrtcdev.log("[screensharejs] remote screen event.streamid " + event.streamid);
                    screenStreamId = event.streamid;
                }

                let svideos = document.getElementById(screenshareobj.screenshareContainer).querySelectorAll("video");
                for (x in svideos) {
                    if (!svideos[x].playing) {
                        svideos[x].hidden = true;
                    }
                }

                let video = document.createElement('video');
                video.muted = true;
                //video.control = true;
                video.id = "video_" + screenRoomid;
                // video.addEventListener("stalled ", function () {
                //     alert(" video is stalled ");
                // }, true);
                //
                // video.addEventListener("seeked", function () {
                //     alert(" video is seeked ");
                // }, true);
                //
                // video.addEventListener("emptied", function () {
                //     alert(" video is emptied ");
                // }, true);
                //
                // video.addEventListener("ended", function () {
                //     alert(" video is ended ");
                // }, true);

                let stream = event.stream;
                attachMediaStream(video, stream).then(_ => {
                    getElementById(screenshareobj.screenshareContainer).appendChild(video);
                });

                showelem(screenshareobj.screenshareContainer);
                rtcConn.send({
                    type: "screenshare",
                    screenid: screenRoomid,
                    message: "screenshareStartedViewing"
                });

                // Event Listener for Screen share stream started
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "screenshare",
                        action: "onScreenShareStarted",
                        type: "remote"
                    }
                }));

            } else {
                // Local got screen share stream
                shownotificationWarning("started streaming local screen");
                webrtcdev.log("[screenshareJS] onstream local , send message to remote to connect to scr room");
                rtcConn.send({
                    type: "screenshare",
                    screenid: screenRoomid,
                    screenStreamid: screenStreamId,
                    message: "startscreenshare"
                });

                // Event Listener for Screen share stream started
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "screenshare",
                        action: "onScreenShareStarted",
                        type: "local"
                    }
                }));

            }

            //createScreenViewButton();
        },

        scrConn.onstreamended = function (event) {
            if (event)
                webrtcdev.log("[screenshare JS] onstreamended -", event);

            let screenShareButton = screenshareobj.button.shareButton.id;
            if (screenShareButton && document.getElementById(screenShareButton)) {
                document.getElementById(screenShareButton).className = screenshareobj.button.shareButton.class_off;
                document.getElementById(screenShareButton).innerHTML = screenshareobj.button.shareButton.html_off;
            }
            //removeScreenViewButton();

            // event listener for Screen share stream ended
            window.dispatchEvent(new CustomEvent('webrtcdev', {
                detail: {
                    servicetype: "screenshare",
                    action: "onScreenShareEnded"
                }
            }));
        },

        scrConn.onopen = function (event) {
            webrtcdev.log("[screensharejs] scrConn onopen - ", scrConn.connectionType);
        },

        scrConn.onerror = function (err) {
            webrtcdev.error("[screensharejs] scrConn error - ", err);
        },

        scrConn.onEntireSessionClosed = function (event) {
            webrtcdev.log("[screensharejs] scrConn onEntireSessionClosed - ", event);
        },

        scrConn.socketMessageEvent = 'scrRTCMultiConnection-Message',
        scrConn.socketCustomEvent = 'scrRTCMultiConnection-Custom-Message',

        scrConn.enableFileSharing = false;

    return scrConn;
}

/**
 * Prepares screenshare , send open channel and handled open channel response ,calls getusermedia in callback
 * @method
 * @name webrtcdevSharescreen
 */
function webrtcdevSharescreen(scrroomid) {
    webrtcdev.log("[screenshareJS] webrtcdevSharescreen, preparing screen-share by initiating ScrConn , scrroomid - ", scrroomid);
    webrtcdev.log("[screenshareJS] webrtcdevSharescreen, sessionobj - ", sessionobj);

    return new Promise((resolve, reject) => {
        scrConn = webrtcdevPrepareScreenShare(scrroomid, sessionobj);
        resolve(scrroomid);
    })
        .then(function (scrroomid) {
            if (socket) {
                webrtcdev.log("[screenshare JS] open-channel-screenshare on - ", socket.io.uri);
                socket.emit("open-channel-screenshare", {
                    channel: scrroomid,
                    sender: selfuserid,
                    maxAllowed: 100
                });
                shownotification("Making a new session for screenshare" + scrroomid);
            } else {
                webrtcdev.error("[screenshare JS] parent socket doesnt exist ");
            }

            socket.on("open-channel-screenshare-resp", function (event) {
                webrtcdev.log("[screenshare JS] open-channel-screenshare-response -", event);
                if (event.status && event.channel == scrroomid) {
                    scrConn.open(scrroomid, function () {
                        webrtcdev.log("[screenshare JS] webrtcdevSharescreen, opened up room for screen share ");
                    });
                }
            });
        });
}

/**
 * update info about a peer in list of peers (webcallpeers)
 * @method
 * @name updatePeerInfo
 * @param {string} userid
 * @param {string} username
 * @param {string} usercolor
 * @param {string} type
 */
function connectScrWebRTC(type, scrroomid) {
    webrtcdev.log("[screenshareJS] connectScrWebRTC, first preparing screenshare by initiating ScrConn , scrroomid - ", scrroomid);
    webrtcdev.log("[screenshareJS] webrtcdevSharescreen, sessionobj - ", sessionobj);

    return new Promise((resolve, reject) => {
        webrtcdevPrepareScreenShare(scrroomid, sessionobj);
        resolve(scrroomid);
    })
        .then(function (scrroomid) {
            webrtcdev.log("[screenshare JS] connectScrWebRTC -> ", type, scrroomid);
            if (type == "join") {
                scrConn.join(scrroomid);
                shownotification("Connected with existing Screenshare channel " + scrroomid);
            } else {
                shownotification("Connection type not found for Screenshare ");
                webrtcdev.error("[screenshare JS] connectScrWebRTC - Connection type not found for Screenshare ");
            }
        });
}

/**
 * view screen being shared
 * @method
 * @name webrtcdevViewscreen
 * @param {string} roomid
 */
function webrtcdevViewscreen(roomid) {
    scrConn.join(roomid);
}

/**
 * function stop screen share session RTC peer connection
 * @method
 * @name webrtcdevStopShareScreen
 */
function webrtcdevStopShareScreen() {
    try {
        rtcConn.send({
            type: "screenshare",
            message: "stoppedscreenshare"
        });

        scrConn.closeEntireSession();
        webrtcdev.log("[screenshare JS] Sender stopped: screenRoomid ", screenRoomid,
            "| Screen stopped ", scrConn,
            "| container ", getElementById(screenshareobj.screenshareContainer));

        if (screenShareStreamLocal) {
            screenShareStreamLocal.stop();
            screenShareStreamLocal = null;
        }

        let stream1 = scrConn.streamEvents.selectFirst();
        if (stream1) {
            webrtcdev.error("[screensharejs] webrtcdevStopShareScreen - stoppping the stream");
            stream1.stream.getTracks().forEach(track => track.stop());
        }
        webrtcdevCleanShareScreen();
    } catch (err) {
        webrtcdev.error("[screensharejs] webrtcdevStopShareScreen - ", err);
    }
}

/**
 * function clear screen share session RTC peer connection
 * @method
 * @name webrtcdevCleanShareScreen
 */
function webrtcdevCleanShareScreen(streamid) {
    try {
        scrConn.onstreamended();
        scrConn.removeStream(streamid);
        scrConn.close();
        scrConn = null;


        let svideos = document.getElementById(screenshareobj.screenshareContainer).querySelectorAll("video");
        for (x in svideos) {
            if (!svideos[x].playing) {
                svideos[x].hidden = true;
            }
        }

        if (screenshareobj.screenshareContainer && getElementById(screenshareobj.screenshareContainer)) {
            getElementById(screenshareobj.screenshareContainer).innerHTML = "";
        }

    } catch (err) {
        webrtcdev.error("[screensharejs] webrtcdevStopShareScreen - ", err);
    }
}

/*
 * shows screenscre rtc conn of ongoing webrtc call 
 * @method
 * @name showScrConn
 */
this.showScrConn = function () {
    if (scrConn) {
        webrtcdev.info(" =========================================================================");
        webrtcdev.info(" srcConn : ", scrConn);
        webrtcdev.info(" srcConn.peers.getAllParticipants() : ", scrConn.peers.getAllParticipants());
        webrtcdev.info(" =========================================================================");
    } else {
        webrtcdev.debug(" Screen share is not active ");
    }
};


/**
 * Alert boxes for user if screen share isnt working
 * @method
 * @name screenshareNotification
 */
function resetAlertBox() {
    getElementById("alertBox").hidden = false;
    getElementById("alertBox").innerHTML = "";
}
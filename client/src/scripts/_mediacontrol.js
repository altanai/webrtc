/************************************
 webrtc get media
 ***********************************/

/**
 * get Video and micrpphone stream media
 * @method
 * @name getCamMedia
 * @param {json} rtcConn
 */
function getCamMedia(rtcConn) {
    rtcConn.dontAttachStream = false,
        rtcConn.dontGetRemoteStream = false;

    webrtcdev.log(" [startJS] getCamMedia  role :", role);

    webrtcdev.log(" start getusermedia - outgoingVideo " + outgoingVideo + " outgoingAudio " + outgoingAudio);
    return new Promise(function (resolve, reject) {
        if (role == "inspector") {
            rtcConn.dontCaptureUserMedia = true;
            console.log("[_mediacontrol.js] getCamMedia  - Joining as inspector without camera Video");
        } else if (outgoingVideo && outgoingAudio) {
            rtcConn.dontCaptureUserMedia = false;
            webrtcdev.log("[_mediacontrol.js] getCamMedia  - Capture Media ");
            rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error 
        } else if (!outgoingVideo && outgoingAudio) {
            rtcConn.dontCaptureUserMedia = false;
            // alert(" start  getCamMedia  - Dont Capture Webcam, only Mic");
            webrtcdev.warn("[_mediacontrol.js] getCamMedia  - Dont Capture Webcam only Mic ");
            rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error
        } else {
            rtcConn.dontCaptureUserMedia = true;
            webrtcdev.error(" [_mediacontrol.js] getCamMedia - dont Capture outgoing video ", outgoingVideo);
            window.dispatchEvent(new CustomEvent('webrtcdev', {
                detail: {
                    servicetype: "session",
                    action: "onNoCameraCard"
                }
            }));
        }
        resolve("success");
    }).catch(
        (reason) => {
            webrtcdev.error('[_mediacontrol.js] getCamMedia  - rejected promise (' + reason + ')');
        });
}

function waitForRemoteVideo(_remoteStream, _remoteVideo, _localVideo, _miniVideo) {
    var videoTracks = _remoteStream.getVideoTracks();
    if (videoTracks.length === 0 || _remoteVideo.currentTime > 0) {
        transitionToActive(_remoteVideo, _localVideo, _miniVideo);
    } else {
        setTimeout(function () {
            waitForRemoteVideo(_remoteStream, _remoteVideo, _localVideo, _miniVideo)
        }, 100);
    }
}

function transitionToActive(_remoteVideo, _localVideo, _miniVideo) {
    _remoteVideo.style.opacity = 1;
    if (localVideo != null) {
        setTimeout(function () {
            _localVideo.src = '';
        }, 500);
    }
    if (miniVideo != null) {
        setTimeout(function () {
            _miniVideo.style.opacity = 1;
        }, 1000);
    }
}

function transitionToWaiting() {
    card.style.webkitTransform = 'rotateY(0deg)';
    setTimeout(function () {
        localVideo.src = miniVideo.src;
        localVideo.muted = true;
        miniVideo.src = '';
        remoteVideo.src = '';
        localVideo.style.opacity = 1;
    }, 500);
    miniVideo.style.opacity = 0;
    remoteVideo.style.opacity = 0;
}

/**
 * attach media stream to dom element
 * @method
 * @name attachMediaStream
 * @param {string} remvid
 * @param {stream} stream
 */
function attachMediaStream(remvid, stream) {
    try {
        var element = "";
        webrtcdev.log("[ Mediacontrol - attachMediaStream ] element ", remvid);
        if ((document.getElementsByName(remvid)).length > 0) {
            element = document.getElementsByName(remvid)[0];
        } else if (remvid.video) {
            element = remvid.video;
        } else if (remvid.nodeName == "VIDEO") {
            element = remvid;
        } else {
            return new Promise(function (resolve, reject) {
                reject(1);
            });
        }

        webrtcdev.log("[ Mediacontrol - attachMediaStream ] stream ", stream);
        if (stream) {
            let pr = new Promise(function (resolve, reject) {
                element.srcObject = stream;
                webrtcdev.log(' ========================================= [  Mediacontrol - attachMediaStream  ] added src object for valid stream ', element, stream);
                element.play().then(
                    resolve(1)
                );
            });
            return pr;
        } else {
            let pr = new Promise(function (resolve, reject) {
                if ('srcObject' in element) {
                    element.srcObject = null;
                } else {
                    // Avoid using this in new browsers, as it is going away.
                    element.src = null;
                }
                webrtcdev.warn("[ Mediacontrol - attachMediaStream ] Media Stream empty '' attached to ", element, " as stream is not valid ", stream);
                resolve(1);
            });
            return pr;
        }

    } catch (err) {
        webrtcdev.error(" [ Mediacontrol - attachMediaStream ]  error", err);
        return new Promise(function (resolve, reject) {
            reject(1);
        });
    }
}

function reattachMediaStream(to, from) {
    try {
        let pr = new Promise(function (resolve, reject) {
            to.srcObject = from.srcObject;
            webrtcdev.log(' [  Mediacontrol] reattachMediaStream - added src object for valid stream ', to);
            to.play().then(
                resolve(1)
            );
        });
        return pr;

    } catch (err) {
        webrtcdev.error("[media control] reattachMediaStream err ", err)
    }
}
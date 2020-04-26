/**----------------------------------
 webrtc get media
 ------------------------------------*/

/**
 * Detect if webcam is accessible by browser
 * @method
 * @name detectWebcam
 * @param {function} callback
 */
function detectWebcam() {
    return new Promise(function (resolve, reject) {
        let md = navigator.mediaDevices;
        if (!md || !md.enumerateDevices) {
            webrtcdev.warn(" detectwebcam cant detect devices ");
            resolve(false);
        }
        webrtcdev.log(" detectwebcam mediaDevices object - ", md);
        md.enumerateDevices().then(devices => {
            webrtcdev.log(" detectwebcam individual devices - ", devices);
            resolve(devices.some(device => 'videoinput' === device.kind));
        });
    });
}

/**
 * Detect if Mic is accessible by browser
 * @method
 * @name detectMic
 * @param {function} callback
 */
function detectMic(callback) {
    return new Promise(function (resolve, reject) {
        let md = navigator.mediaDevices;
        if (!md || !md.enumerateDevices) {
            resolve(false);
        }

        md.enumerateDevices().then(devices => {
            resolve(devices.some(device => 'audioinput' === device.kind));
        });
    });
}

/**
 * get Video and micrpphone stream media
 * @method
 * @name getCamMedia
 * @param {json} rtcConn
 * @param {booolean} outgoingVideo
 * @param {booolean} outgoingAudio
 */
function getCamMedia(rtcConn, outgoingVideo, outgoingAudio) {

    webrtcdev.log("[startJS] getCamMedia - role :", role);
    webrtcdev.log("[startJS] getCamMedia   - outgoingVideo " + outgoingVideo + " outgoingAudio " + outgoingAudio);

    if (role == "inspector") {

        rtcConn.dontCaptureUserMedia = true;
        webrtcdev.log("[_mediacontrol.js] getCamMedia  - Joining as inspector without camera Video");

    } else if (outgoingVideo && outgoingAudio) {

        webrtcdev.log("[_mediacontrol.js] getCamMedia  - Capture Media ");
        rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error

    } else if (!outgoingVideo && outgoingAudio) {

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
}

// /**
//  * get Video and micrpphone stream media
//  * @method
//  * @name getCamMedia
//  * @param {json} rtcConn
//  */
// function waitForRemoteVideo(_remoteStream, _remoteVideo, _localVideo, _miniVideo) {
//     var videoTracks = _remoteStream.getVideoTracks();
//     if (videoTracks.length === 0 || _remoteVideo.currentTime > 0) {
//         transitionToActive(_remoteVideo, _localVideo, _miniVideo);
//     } else {
//         setTimeout(function () {
//             waitForRemoteVideo(_remoteStream, _remoteVideo, _localVideo, _miniVideo)
//         }, 100);
//     }
// }
//
// /**
//  * transition To Active
//  * @method
//  * @name transitionToActive
//  */
// function transitionToActive(_remoteVideo, _localVideo, _miniVideo) {
//     _remoteVideo.style.opacity = 1;
//     if (localVideo != null) {
//         setTimeout(function () {
//             _localVideo.src = '';
//         }, 500);
//     }
//     if (miniVideo != null) {
//         setTimeout(function () {
//             _miniVideo.style.opacity = 1;
//         }, 1000);
//     }
// }
//
// /**
//  * transition To Waiting
//  * @method
//  * @name transitionToWaiting
//  */
// function transitionToWaiting(localVideo , miniVideo) {
//     setTimeout(function () {
//         localVideo.srcObject = miniVideo.srcObject;
//         localVideo.muted = true;
//         miniVideo.srcObject = null;
//         remoteVideo.srcObject = null;
//     }, 500);
// }

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

        // If stream is present , attach the stream  and play
        if (stream) {
            let pr = new Promise(function (resolve, reject) {
                element.srcObject = stream;
                webrtcdev.log("[  Mediacontrol - attachMediaStream  ] added src object for valid stream ", element, stream);
                var playPromise = element.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        resolve(1);
                    })
                        .catch(error => {
                            webrtcdev.error("[ Mediacontrol - attachMediaStream ] error ", error);
                            if (error.name == "NotAllowedError" && error.message.includes("play() failed")) {
                                alert(" play failed due to auto play policy, please wait ");
                            } else if (error.name == "NotAllowedError" && error.message.includes("The play() request was interrupted by a call to pause()")) {
                                alert(" play failed, video was pause  ");
                            }
                            resolve(1);
                        });
                }
            });
            return pr;
        } else {
            // If no stream , just attach the src as null , do not play
            let pr = new Promise(function (resolve, reject) {
                element.srcObject = null;
                webrtcdev.warn("[ Mediacontrol - attachMediaStream ] Media Stream empty '' attached to ", element, " as stream is not valid ", stream);
                resolve();
            });
            return pr;
        }

    } catch (err) {
        let pr = new Promise(function (resolve, reject) {
            webrtcdev.error(" [ Mediacontrol - attachMediaStream ]  error", err);
            reject();
        });
        return pr;
    }
}

/**
 * Re attach media stream from one dom to another dom element
 * @method
 * @name reattachMediaStream
 * @param {dom} to
 * @param {dom} from
 */
function reattachMediaStream(to, from) {
    try {
        // If stream is present , attach the stream and play
        let pr = new Promise(function (resolve, reject) {
            to.srcObject = from.srcObject;
            webrtcdev.log('[ Mediacontrol] reattachMediaStream - added src object for valid stream ', to);
            var playPromise = to.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    resolve(1);
                })
                    .catch(error => {
                        webrtcdev.error("[ Mediacontrol ] attachMediaStream - error ", error);
                        reject(1);
                    });
            }
        });
        return pr;
    } catch (err) {
        webrtcdev.error("[media control] reattachMediaStream err ", err);
    }
}
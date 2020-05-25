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

    webrtcdev.log("[mediacontrol js] getCamMedia - role :", role);
    webrtcdev.log("[mediacontrol js] getCamMedia - outgoingVideo " + outgoingVideo + " outgoingAudio " + outgoingAudio);

    var mediaConstraints = {
        audio: {
            mandatory: {},
            optional: []
        },
        video: {
            mandatory: {},
            optional: [{
                height: 480,
                width: 640,
                facingMode: 'user'
            }]
        }
    };
    if (role == "inspector") {

        rtcConn.dontCaptureUserMedia = true;
        webrtcdev.warn("[_mediacontrol.js] getCamMedia  - Joining as inspector without camera Video");
    } else if (outgoingVideo && outgoingAudio) {
        webrtcdev.log("[startJS] getCamMedia - default mediaConstraints :", rtcConn.mediaConstraints);
        webrtcdev.log("[mediacontrol.js] getCamMedia  - Capture Full Media ");
        rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error
    } else if (!outgoingVideo && outgoingAudio) {
        mediaConstraints.video = false;
        rtcConn.mediaConstraints = mediaConstraints;
        webrtcdev.log("[startJS] getCamMedia - default mediaConstraints :", rtcConn.mediaConstraints);
        // alert(" start  getCamMedia  - Dont Capture Webcam, only Mic");
        webrtcdev.warn("[mediacontrol.js] getCamMedia  - Dont Capture Webcam only Mic ");
        rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error

    } else if (outgoingVideo && !outgoingAudio) {
        mediaConstraints.audio = false;
        rtcConn.mediaConstraints = mediaConstraints;
        webrtcdev.log("[startJS] getCamMedia - default mediaConstraints :", rtcConn.mediaConstraints);
        // alert(" start  getCamMedia  - Dont Capture Miv, only webcam");
        webrtcdev.warn("[_mediacontrol.js] getCamMedia  - Dont Capture Mic only webcam ");
        rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error

    } else if (!outgoingVideo && !outgoingAudio) {
        mediaConstraints.video = false;
        mediaConstraints.audio = false;
        rtcConn.mediaConstraints = mediaConstraints;
        rtcConn.dontCaptureUserMedia = true;
        webrtcdev.error(" [_mediacontrol.js] getCamMedia - dont Capture outgoing video ", outgoingVideo, " and outgoung Audio ", outgoingAudio);
        webrtcdev.log("[startJS] getCamMedia - default mediaConstraints :", rtcConn.mediaConstraints);
        // call media error handler to attach null in video
        rtcConn.onMediaError("onNoCameraCard", "");
        window.dispatchEvent(new CustomEvent('webrtcdev', {
            detail: {
                servicetype: "session",
                action: "onNoCameraCard"
            }
        }));
    }
}

// /**
//  * get Video and microphone stream media
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
        webrtcdev.log("[Mediacontrol] attachMediaStream - remvid ", remvid);
        // Set the remote video element
        var element = "";
        if ((document.getElementsByName(remvid)).length > 0) {
            element = document.getElementsByName(remvid)[0];
        } else if (remvid.video) {
            element = remvid.video;
        } else if (remvid.nodeName == "VIDEO") {
            element = remvid;
        } else {
            return new Promise(function (resolve, reject) {
                webrtcdev.error("[ Mediacontrol] attachMediaStream - element  not found");
                reject(1);
            });
        }
        webrtcdev.log("[Mediacontrol] attachMediaStream - element ", element);

        // If stream is present , attach the stream  and play
        webrtcdev.log("[Mediacontrol] attachMediaStream - stream ", stream);
        if (stream && (stream.isVideo || stream.isScreen)) {
            //element.srcObject = stream; // src(undefined) error after refresh sometimes
            // Older browsers may not have srcObject
            try {
                element.srcObject = stream;
            } catch (err) {
                webrtcdev.error("[Mediacontrol] attachMediaStream - ", err);
                element.src = URL.createObjectURL(stream);
            } finally {
                webrtcdev.info("[Mediacontrol] attachMediaStream - added srcObject for ", stream.type, " valid stream ", stream.streamid, " to element ", element);
                // element.onloadedmetadata = function (e) {
                return element.play().then(_ => {
                    webrtcdev.log("[Mediacontrol] attachMediaStream - element started playing ", element);
                }).catch(error => {
                    webrtcdev.error("[Mediacontrol] attachMediaStream - video play error ", error);
                    if (error.name == "NotAllowedError" && error.message.includes("play() failed")) {
                        let r = confirm("Play failed due to auto play policy, starting video on mute, click on video to unmute");
                        if (r || !r) {
                            // whether uer clicks ok or cancel
                            element.muted = true;
                            element.autoplay = true;
                            element.addEventListener("click", function () {
                                element.muted = false;
                            });
                            element.play();
                        }
                    } else if (error.name == "NotAllowedError" && error.message.includes("The play() request was interrupted by a call to pause()")) {
                        alert("Play failed, video was paused ");
                    }
                });
                // };
            }

        } else if (stream == "") {
            // If no stream , just attach the src as null
            element.srcObject = null;
            webrtcdev.warn("[ Mediacontrol - attachMediaStream ] Media Stream empty '' attached to ", element, " as stream is not valid ", stream);
            return element.play();
        } else {
            webrtcdev.error("[Mediacontrol] attachMediaStream - stream is not recognized ", stream);
            throw "unrecognized media stream";
        }

    } catch (err) {
        webrtcdev.error("[Mediacontrol] attachMediaStream - error", err);
        return Promise.reject(new Error('attachMediaStream failed'));
    }
}

/**
 * Re attach media stream from one dom to another dom element
 * @method
 * @name reattachMediaStream
 * @param {video dom} element
 * @param {video dom} from
 */
function reattachMediaStream(element, from) {
    try {
        // If stream is present , attach the stream and play

        if (element.srcObject && element.srcObject.active) {
            webrtcdev.log("[Mediacontrol] reattachMediaStream - element has srcObject and is active ");
            return Promise.resolve(1);
        } else {
            element.srcObject = from.srcObject;
            webrtcdev.log("[Mediacontrol] reattachMediaStream - added src object for valid stream ", element);

            return element.play().then(_ => {
                webrtcdev.log("[Mediacontrol] reattachMediaStream - element started playing ", element);
            }).catch(error => {
                webrtcdev.error("[Mediacontrol] reattachMediaStream - video play error ", error);
                if (error.name == "NotAllowedError" && error.message.includes("play() failed")) {
                    let r = confirm("Play failed due to auto play policy, starting video on mute, click on video to unmute");
                    if (r || !r) {
                        // whether uer clicks ok or cancel
                        element.muted = true;
                        element.autoplay = true;
                        element.addEventListener("click", function () {
                            element.muted = false;
                        });
                        element.play();
                    }
                } else if (error.name == "NotAllowedError" && error.message.includes("The play() request was interrupted by a call to pause()")) {
                    alert("Play failed, video was paused ");
                }
            });
        }
    } catch (err) {
        webrtcdev.error("[media control] reattachMediaStream err ", err);
        return Promise.reject(new Error('reattachMediaStream failed'));
    }
}

/**
 * Dettach media stream from dom
 * @method
 * @name detachMediaStream
 * @param {video dom} vid
 */
function detachMediaStream(vid) {
    webrtcdev.warn("[ Mediacontrol] dettachMediaStream  on vid ", vid);
    try {
        if ('srcObject' in vid) {
            const stream = vid.srcObject;
            if (stream && stream != "") {
                const tracks = stream.getTracks();
                tracks.forEach(function (track) {
                    track.stop();
                });
                // vid.stream = null;
                vid.srcObject = null;
            } else {
                webrtcdev.warn("[ Mediacontrol] dettachMediaStream  no stream present on remote's video");
            }
        } else {
            vid.src = "";
        }
    } catch (e) {
        webrtcdev.error("[ Mediacontrol] dettachMediaStream  error ", e);
    } finally {
        vid.id = null;
    }
}
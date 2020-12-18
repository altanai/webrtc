/***************************************************
 video handling
 *********************************************************/

/**
 * function to Create a video container and attach it to remote obj
 * @method
 * @name createVideoContainer
 * @param {e} event
 * @param {css} style
 */
function appendVideo(e, style) {

    createVideoContainer(e, style, function (div) {
        let video = document.createElement('video');
        video.className = style;
        video.controls = false;
        video.id = e.userid;
        video.srcObject = URL.createObjectURL(e.stream);
        div.appendChild(video);
        webrtcdev.log("[_media_dommodifier ] appendVideo", video);
        var promise = video.play();
        if (promise !== undefined) {
            promise.then(_ => {
                // Autoplay started!
            }).catch(error => {
                // Autoplay was prevented.
                // Show a "Play" button so that user can start playback.
                alert("video autoplay failed");
            });
        }
    });
}

/**
 * function to create empty container
 * @method
 * @name createVideoContainer
 * @param {e} event
 * @param {css} style
 * @param {function} callback
 */
function createVideoContainer(e, style, callback) {
    let div = document.createElement('div');
    div.setAttribute('style', style || 'float:left;opacity: 1;width: 32%;');
    remote.insertBefore(div, remote.firstChild);
    if (callback) callback(div);
}

/****************************************************
 control Buttons attachment to Video Element
 *********************************************************/

/**
 * function to attach control bar to video for minmax , record  , snapshot , cursor , mute/unmute etc
 * @method
 * @name attachControlButtons
 * @param {dom} vid Video DOM element
 * @param {json} peerinfo
 */
this.attachControlButtons = attachControlButtons = function (vid, peerinfo) {

    let stream = peerinfo.stream || vid.srcObject || null;
    let streamid = peerinfo.streamid || vid.srcObject.id || null;
    let controlBarName = peerinfo.controlBarName;
    let snapshotViewer = peerinfo.fileSharingContainer;

    // Preventing multiple control bars
    let parentNode = vid.parentNode;
    webrtcdev.log(" [media dom modifier] attachControlButtons to the parent Node of video  ", parentNode);
    if (parentNode) {
        let c = parentNode.childNodes;
        for (let i in c) {
            let cc = c[i];
            if (cc.nodeName == "DIV" && cc.id) {
                if (cc.id.indexOf("control") > -1) {
                    webrtcdev.warn("[media dom modifier] control bar exists already, delete the previous one before adding new one", cc);
                    parentNode.removeChild(cc);
                }
            }
        }
    }

    // Control bar holds media control elements like , mute unmute , fullscreen , record , snapshot
    let controlBar = document.createElement("div");
    controlBar.id = controlBarName;

    if (peerinfo.type == "local")
        controlBar.className = "localVideoControlBarClass";
    else
        controlBar.className = "remoteVideoControlBarClass";

    if (debug) {
        let nameBox = document.createElement("div");
        nameBox.innerHTML = vid.id;
        controlBar.appendChild(nameBox);
    }

    if (muteobj.active) {
        if (muteobj.audio.active) {
            controlBar.appendChild(createAudioMuteButton(muteobj, controlBarName, peerinfo));
        }
        if (muteobj.video.active) {
            controlBar.appendChild(createVideoMuteButton(muteobj, controlBarName, peerinfo));
        }
    }

    if (snapshotobj.active) {
        controlBar.appendChild(createSnapshotButton(controlBarName, peerinfo));
    }

    if (videoRecordobj.active) {
        controlBar.appendChild(createRecordButton(videoRecordobj, controlBarName, peerinfo));
    }

    if (cursorobj.active) {
        //assignButtonCursor(cursorobj.button.id);
        controlBar.appendChild(createCursorButton(controlBarName, peerinfo));
    }

    if (minmaxobj.active) {
        controlBar.appendChild(createFullScreenButton(minmaxobj, controlBarName, peerinfo, streamid, stream));
        // controlBar.appendChild(createMinimizeVideoButton(minmaxobj , controlBarName, peerinfo, streamid, stream));

        // attach minimize button to header instead of widgets in footer
        nameBoxid = "#videoheaders" + peerinfo.userid;
        let nameBox = document.querySelectorAll(nameBoxid);
        for (let n in nameBox) {
            // webrtcdev.log("[_media_dommodifier ] attachControlButtons - nameBox " , nameBox[n]);
            if (nameBox[n].appendChild)
                nameBox[n].appendChild(createMinimizeVideoButton(minmaxobj, controlBarName, peerinfo, streamid, stream));
        }
    }

    parentNode.appendChild(controlBar);
};

/**
 * function to createFullScreenButton
 * @method
 * @name createFullScreenButton
 * @return {json} minmaxobj
 * @param {string} controlBarName
 * @param {json} peerinfo
 */
function createFullScreenButton(minmaxobj, controlBarName, peerinfo) {
    let button = document.createElement("span");
    button.id = controlBarName + "fullscreeButton";
    button.setAttribute("title", "Full Screen");
    button.className = minmaxobj.max.button.class_off;
    button.innerHTML = minmaxobj.max.button.html_off;
    button.onclick = function () {
        if (button.className == minmaxobj.max.button.class_off) {
            let vid = peerinfo.videoContainer;
            vid.webkitEnterFullScreen();
            button.className = minmaxobj.max.button.class_on;
            button.innerHTML = minmaxobj.max.button.html_on;
        } else {
            button.className = minmaxobj.max.button.class_off;
            button.innerHTML = minmaxobj.max.button.html_off;
        }
        //syncButton(audioButton.id);
    };
    return button;
}

/**
 * function to createMinimizeVideoButton
 * @method
 * @name createMinimizeVideoButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createMinimizeVideoButton(minmaxobj, controlBarName, peerinfo) {
    var button = document.createElement("span");
    button.id = controlBarName + "minmizevideoButton";
    button.setAttribute("title", "Minimize Video");
    button.className = minmaxobj.min.button.class_off;
    button.innerHTML = minmaxobj.min.button.html_off;
    var vid = document.getElementById(peerinfo.videoContainer);
    button.onclick = function () {
        if (button.className == minmaxobj.min.button.class_off) {
            hideelem(vid);
            button.className = minmaxobj.min.button.class_on;
            button.innerHTML = minmaxobj.min.button.html_on;
        } else {
            showelem(vid);
            button.className = minmaxobj.min.button.class_off;
            button.innerHTML = minmaxobj.min.button.html_off;
        }
        //syncButton(audioButton.id);
    };
    webrtcdev.log("[_media_dommodifier ] createMinimizeVideoButton - button", button, " vid ", vid);
    return button;
}

/**
 * function to createAudioMuteButton
 * @method
 * @name createAudioMuteButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createAudioMuteButton(muteobj, controlBarName, peerinfo) {
    let audioButton = document.createElement("span");
    audioButton.id = controlBarName + "audioButton";
    audioButton.setAttribute("data-val", "mute");
    audioButton.setAttribute("title", "Toggle Audio");
    audioButton.className = muteobj.audio.button.class_on;
    audioButton.innerHTML = muteobj.audio.button.html_on;
    audioButton.onclick = function () {
        if (audioButton.className == muteobj.audio.button.class_on) {

            try {
                peerinfo.stream.mute({
                    audio: !0
                });
            } catch (err) {
                peerinfo.stream.getAudioTracks()[0].enabled = false;
            }finally{
                webrtcdev.log("[media_dommanager] audio mute ");
                // Dispatch Event for muteaudio
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "mute",
                        action: "muteaudio",
                        type: peerinfo.type
                    }
                }));
            }
            syncMute("audiomute", "mute" );
            audioButton.className = muteobj.audio.button.class_off;
            audioButton.innerHTML = muteobj.audio.button.html_off;
        } else {
            try {
                peerinfo.stream.unmute({
                    audio: !0
                });
            } catch (e) {
                peerinfo.stream.getAudioTracks()[0].enabled = true;
            }finally{
                webrtcdev.log("[media_dommanager] audio un mute ");
                // Dispatch Event for muteaudio
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "mute",
                        action: "unmuteaudio",
                        type: peerinfo.type
                    }
                }));
            }
            // rtcConn.streamEvents.selectFirst('local').mediaElement.muted = true;
            syncMute("audiounmute", "mute" );
            audioButton.className = muteobj.audio.button.class_on;
            audioButton.innerHTML = muteobj.audio.button.html_on;
        }
        syncButton(audioButton.id);
    };
    return audioButton;
}

/**
 * function to createVideoMuteButton
 * @method
 * @name createVideoMuteButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createVideoMuteButton(muteobj, controlBarName, peerinfo) {
    let videoButton = document.createElement("span");
    videoButton.id = controlBarName + "videoButton";
    videoButton.setAttribute("title", "Toggle Video");
    videoButton.setAttribute("data-container", "body");
    videoButton.className = muteobj.video.button.class_on;
    videoButton.innerHTML = muteobj.video.button.html_on;
    videoButton.onclick = function (event) {
        if (videoButton.className == muteobj.video.button.class_on) {
            try {
                peerinfo.stream.mute({
                    video: !0
                });
            } catch (err) {
                peerinfo.stream.getVideoTracks()[0].enabled = false;
            }finally{
                webrtcdev.log("[media_dommanager] video mute ");
                // Dispatch Event for mutevideo
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "mute",
                        action: "mutevideo",
                        type: peerinfo.type
                    }
                }));
            }
            syncMute("videomute", "mute" );
            videoButton.innerHTML = muteobj.video.button.html_off;
            videoButton.className = muteobj.video.button.class_off;
        } else {
            try {
                peerinfo.stream.unmute({
                    video: !0
                });
            } catch (err) {
                peerinfo.stream.getVideoTracks()[0].enabled = true;
            }finally{
                webrtcdev.log("[media_dommanager] video un mute ");
                // Dispatch Event for unmutevideo
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "mute",
                        action: "unmutevideo",
                        type: peerinfo.type
                    }
                }));
            }
            syncMute("videounmute", "mute" );
            videoButton.innerHTML = muteobj.video.button.html_on;
            videoButton.className = muteobj.video.button.class_on;
        }
        syncButton(videoButton.id);
    };
    return videoButton;
}


/**********************************************
 User Detail attachment to Video Element
 *******************************************/

/**
 * function to attach user details header on top of video
 * @method
 * @name attachUserDetails
 * @param {dom} vid
 * @param {json} peerinfo
 */
this.attachUserDetails = attachUserDetails = function (vid, peerinfo) {
    webrtcdev.log("[media_dommanager] attachUserDetails - ", peerinfo.userid, ":", peerinfo.type, " to video DOM ", vid);

    // remove existing video header
    if (vid.parentNode.querySelectorAll('.videoHeaderClass').length > 0) {
        webrtcdev.warn("[media_dommanager] attachUserDetails - video header already present ", vid.parentNode.querySelectorAll('.videoHeaderClass'), " remove it before re-setting");
        if ((vid.parentNode.querySelectorAll("videoheaders" + peerinfo.userid)).length > 0) {
            webrtcdev.warn("[media_dommanager] user's video header already present ", "videoheaders" + peerinfo.userid);
            return;
        } else {
            webrtcdev.warn("[media_dommanager] attachUserDetails - video header already present for diff user , overwrite with ", "videoheaders" + peerinfo.userid);
            let vidheader = vid.parentNode.querySelectorAll('.videoHeaderClass')[0];
            vidheader.remove();
        }
    }

    // create new video header
    let nameBox = document.createElement("div");
    // nameBox.setAttribute("style", "background-color:" + peerinfo.color),
    nameBox.className = "videoHeaderClass",
        nameBox.innerHTML = peerinfo.name ,
        nameBox.id = "videoheaders" + peerinfo.userid;

    // add after video
    vid.parentNode.appendChild(nameBox);

    // Add beforre video
    // vid.parentNode.insertBefore(nameBox, vid.parentNode.firstChild);
};

/**
 * function to attach user's meta details header on top of video
 * @method
 * @name attachMetaUserDetails
 * @param {dom} vid
 * @param {json} peerinfo
 */
function attachMetaUserDetails(vid, peerinfo) {
    webrtcdev.log("[media_dommanager] attachMetaUserDetails - ", peerinfo.userid, ":", peerinfo.type);
    let detailsbox = document.createElement("span");
    detailsbox.setAttribute("style", "background-color:" + peerinfo.color);
    detailsbox.innerHTML = peerinfo.userid + ":" + peerinfo.type + "<br/>";
    vid.parentNode.insertBefore(detailsbox, vid.parentNode.firstChild);
}


/**
 * Create Snapshot Button to take snpshot of video
 * @method
 * @name createSnapshotButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 */
function createSnapshotButton(controlBarName, peerinfo) {
    var snapshotButton = document.createElement("div");
    snapshotButton.id = controlBarName + "snapshotButton";
    snapshotButton.setAttribute("title", "Snapshot");
    snapshotButton.className = snapshotobj.button.class_on;
    snapshotButton.innerHTML = snapshotobj.button.html_on;
    snapshotButton.onclick = function () {
        /*rtcMultiConnection.streams[streamid].takeSnapshot(function(datasnapshot) {*/
        takeSnapshot(peerinfo, function (datasnapshot) {
            let snapshotname = "snapshot" + new Date().getTime();

            var peerinfo;
            if (selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);

            peerinfo.filearray.push(snapshotname);
            // var numFile = document.createElement("div");
            // numFile.value = peerinfo.filearray.length;

            if (fileshareobj.active) {
                syncSnapshot(datasnapshot, "imagesnapshot", snapshotname);
                displayList(peerinfo.uuid, peerinfo, datasnapshot, snapshotname, "imagesnapshot");
                displayFile(peerinfo.uuid, peerinfo, datasnapshot, snapshotname, "imagesnapshot");
            } else {
                displayFile(peerinfo.uuid, peerinfo, datasnapshot, snapshotname, "imagesnapshot");
            }
        });
    };
    return snapshotButton;
}

/**
 * Create Record Button to call start and stop recoriding functions
 * @method
 * @name createRecordButton
 * @param {json} videoRecordobj
 * @param {string} controlBarName
 * @param {json} peerinfo
 */
function createRecordButton(videoRecordobj, controlBarName, peerinfo) {

    let recordButton = document.createElement("div");
    recordButton.id = controlBarName + "recordButton";
    recordButton.setAttribute("title", "Record");
    recordButton.className = videoRecordobj.button.class_off;
    recordButton.innerHTML = videoRecordobj.button.html_off;
    recordButton.onclick = function (e) {
        if (recordButton.className == videoRecordobj.button.class_on) {
            recordButton.className = videoRecordobj.button.class_off;
            recordButton.innerHTML = videoRecordobj.button.html_off;
            stopRecord(peerinfo);
        } else if (recordButton.className == videoRecordobj.button.class_off) {
            recordButton.className = videoRecordobj.button.class_on;
            recordButton.innerHTML = videoRecordobj.button.html_on;
            startRecord(peerinfo);
        }
    };
    return recordButton;
}
/*-----------------------------------------------------------------------------------*/
/*                    Global Init JS                                                 */
/*-----------------------------------------------------------------------------------*/
var channelpresence = false;
var localVideoStreaming = null;
var turn = "none";
var sessionobj = {}, localobj = {}, remoteobj = {};
var pendingFileTransfer = [];
var connectionStatus = null;

this.connectionStatus = connectionStatus;
this.version = '@@version';

/**
 * creates sessionid
 * @method
 * @name makesessionid
 * @param {string} autoload
 * @return {string} sessionid
 */
this.makesessionid = function (autoload) {
    let sessionid = "";
    webrtcdev.log("[Init] Location  ", location.href);
    webrtcdev.log("[Init] Existing charecters after # ", location.href.replace('#', '').length);

    if (location.href.replace('#', '').length) {
        // When Session should have a session name
        if (location.href.indexOf('?') > -1) {
            sessionid = (location.hash.substring(0, location.hash.indexOf('?'))).replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('');
        } else {
            sessionid = location.hash.replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('');
        }
        if (sessionid)
            return sessionid;
    }

    webrtcdev.log("Session id not Found in URL ,  Check for auto - reload if  ", autoload);

    if (autoload == "reload" && !location.hash.replace('#', '').length) {
        // When Session should auto-generate ssid and locationbar doesnt have a session name
        location.href = location.href.split('#')[0] + '#' + (Math.random() * 100).toString().replace('.', '');
        location.reload();
    } else {
        // if reload is false , ask the user for session ID
        sessionid = prompt("Enter session ", "");
        return sessionid;
    }
};

function isData(session) {
    return !session.audio && !session.video && !session.screen && session.data;
}

function isNull(obj) {
    return typeof obj == 'undefined';
}

function isString(obj) {
    return typeof obj == 'string';
}

function isEmpty(session) {
    var length = 0;
    for (var s in session) {
        length++;
    }
    return length == 0;
}

// this method converts array-buffer into string
function ab2str(buf) {
    var result = '';
    try {
        result = String.fromCharCode.apply(null, new Uint16Array(buf));
    } catch (e) {
    }
    return result;
}

// this method converts string into array-buffer
function str2ab(str) {
    if (!isString(str)) str = JSON.stringify(str);

    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}


function getLength(obj) {
    var length = 0;
    for (var o in obj)
        if (o) length++;
    return length;
}


function getRandomColor() {
    for (var e = "0123456789ABCDEF".split(""), t = "#", n = 0; 6 > n; n++) t += e[Math.round(15 * Math.random())];
    return t
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}


function getUserinfo(e, t) {
    return e ? '<video src="' + e + '" autoplay></vide>' : '<img src="' + t + '">';
}

function fireClickEvent(e) {
    var t = new MouseEvent("click", {
        view: window,
        bubbles: !0,
        cancelable: !0
    });
    e.dispatchEvent(t)
}

function bytesToSize(e) {
    var t = ["Bytes", "KB", "MB", "GB", "TB"];
    if (0 == e) return "0 Bytes";
    var n = parseInt(Math.floor(Math.log(e) / Math.log(1024)));
    return Math.round(e / Math.pow(1024, n), 2) + " " + t[n]
}

this.issafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/************************************************
 scripts or stylesheets load unloading
 ********************************************/

function loadjscssfile(filename, filetype) {
    let fileref;
    if (filetype == "js") { //if filename is a external JavaScript file
        fileref = document.createElement('script');
        fileref.setAttribute("type", "text/javascript");
        fileref.setAttribute("src", filename)
    } else if (filetype == "css") { //if filename is an external CSS file
        fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref != "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

function loadScript(src, onload) {
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.documentElement.appendChild(script);
}

async function getVideoPermission() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
        if (stream.getVideoTracks().length > 0) {
            //code for when none of the devices are available
            webrtcdev.log("--------------------------------- Video Permission obtained ");
            outgoingVideo = true;
            return;
        }
    } catch (err) {
        webrtcdev.error(err.name + ": " + err.message);
    }
    outgoingVideo = false;

}


async function getAudioPermission() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
        if (stream.getAudioTracks().length > 0) {
            //code for when none of the devices are available
            webrtcdev.log("--------------------------------- Audio Permission obtained ");
            outgoingAudio = true;
            return;
        }
    } catch (err) {
        webrtcdev.error(err.name + ": " + err.message);
    }
    outgoingAudio = false;

}


/**
 * Assigns session variables, ICE gateways and widgets
 * @constructor
 * @param {json} _localObj - local object.
 * @param {json} _remoteObj - remote object.
 * @param {json} incoming - incoming media stream attributes
 * @param {json} outgoing - outgoing media stream attributes
 * @param {json} sessionobj - session object
 * @param {json} widgets - widgets object
 */
this.setsession = function (_localobj, _remoteobj, incoming, outgoing, _sessionobj, widgets) {

    webrtcdev.log("[ initjs ] : setsession - sessionobj : ", _sessionobj);

    this.sessionid = sessionid = session.sessionid;

    sessionobj = _sessionobj;
    if (sessionobj.socketAddr) {
        config.socketAddr = sessionobj.socketAddr;
    }
    if (sessionobj.signaller) {
        config.signaller = sessionobj.signaller;
    }

    localobj = _localobj;
    remoteobj = _remoteobj;

    turn = session.turn;
    // if (turn && turn != "none") {
    //     if (turn.active && turn.iceServers) {
    //         webrtcdevIceServers = turn.iceServers;
    //     } else {
    //         getICEServer();
    //         // getICEServer( turn.username ,turn.secretkey , turn.domain,
    //         //                 turn.application , turn.room , turn.secure);
    //     }
    // }

    if (widgets) {

        if (widgets.debug) debug = widgets.debug || false;

        if (widgets.chat) chatobj = widgets.chat || null;

        if (widgets.fileShare) fileshareobj = widgets.fileShare || null;

        if (widgets.screenrecord) screenrecordobj = widgets.screenrecord || null;

        if (widgets.screenshare) screenshareobj = widgets.screenshare || null;

        if (widgets.snapshot) snapshotobj = widgets.snapshot || null;

        if (widgets.videoRecord) videoRecordobj = widgets.videoRecord || null;

        if (widgets.reconnect) reconnectobj = widgets.reconnect || null;

        if (widgets.drawCanvas) drawCanvasobj = widgets.drawCanvas || null;

        if (widgets.texteditor) texteditorobj = widgets.texteditor || null;

        if (widgets.codeeditor) codeeditorobj = widgets.codeeditor || null;

        if (widgets.mute) muteobj = widgets.mute || null;

        if (widgets.timer) timerobj = widgets.timer || null;

        if (widgets.listenin) listeninobj = widgets.listenin || null;

        if (widgets.cursor) cursorobj = widgets.cursor || null;

        if (widgets.minmax) minmaxobj = widgets.minmax || null;

        if (widgets.help) helpobj = widgets.help || null;

        if (widgets.statistics) statisticsobj = widgets.statistics || null;
    }

    return {
        sessionid: sessionid,
        outgoing: outgoing,
        incoming: incoming,
        socketAddr: config.socketAddr,
        signaller: config.signaller,
        // sessionobj: sessionobj,
        localobj: localobj,
        remoteobj: remoteobj,
        turn: turn,
        widgets: widgets
    };
};

/**
 * function to return chain of promises for webrtc session to start
 * @method
 * @name funcStartWebrtcdev
 */
this.startCall = function (sessionobj) {

    if (!sessionobj) {
        webrtcdev.error("[ initjs ] : Cannot initiate startcall without session object ");
        return;
    }

    // sessionobj is ready
    webrtcdev.log("[ initjs ] startwebrtcdev begin processing with ", sessionobj);

    webrtcdev.log("[ initjs ] : incoming ", sessionobj.incoming);
    webrtcdev.log("[ initjs ] : outgoing ", sessionobj.outgoing);

    if (sessionobj.incoming) {
        incomingAudio = sessionobj.incoming.audio;
        incomingVideo = sessionobj.incoming.video;
        incomingData = sessionobj.incoming.data;
    }
    if (sessionobj.outgoing) {
        outgoingAudio = sessionobj.outgoing.audio;
        outgoingVideo = sessionobj.outgoing.video;
        outgoingData = sessionobj.outgoing.data;
    }

    webrtcdev.log(" [ initjs  ] : role ", role);


    let sessionid = sessionobj.sessionid;

    webrtcdev.log("[ initjs ] : sessionid : " + sessionid + " and localStorage  ", localStorage);

    if (localStorage.length >= 1 && localStorage.getItem("channel") !== sessionid) {
        webrtcdev.log("[ intijs ] : Current Session ID " + sessionid + " doesnt match cached channel id " + localStorage.getItem("channel") + "-> clearCaches()");
        clearCaches();
    } else {
        webrtcdev.log("[ initjs ] : no action taken on localStorage");
    }

    webrtcdev.log("[ initjs ] : localobj ", localobj);
    webrtcdev.log("[ initjs ] : remoteobj ", remoteobj);

    /* When user is single */
    localVideo = localobj.video;

    /* when user is in conference */
    let remotearr = remoteobj.videoarr;
    /* first video container in remotearr belongs to user */
    if (outgoingVideo) {
        selfVideo = remotearr[0];
    }
    /* create arr for remote peers videos */
    if (!remoteobj.dynamicVideos) {
        for (let x = 1; x < remotearr.length; x++) {
            remoteVideos.push(remotearr[x]);
        }
    }

    //* set self global variables  */
    if (localobj.hasOwnProperty('userdetails')) {
        let obj = localobj.userdetails;
        webrtcdev.info("[init JS] localobj userdetails ", obj);
        selfusername = obj.username || "LOCAL";
        selfcolor = obj.usercolor || "";
        selfemail = obj.useremail || "";
        role = obj.role || "participant";
    } else {
        webrtcdev.warn("localobj has no userdetails ");
    }

    if (role == "inspector") {
        resolve("done");
    }

    return new Promise((resolve, reject) => {
        detectWebcam().then(hasWebcam => {
            webrtcdev.log('Has Webcam: ' + (hasWebcam ? 'yes' : 'no'));
            if (!hasWebcam) {
                webrtcdev.error(" dont have access to webcam  ");
                alert(" you dont have access to webcam ");
                outgoingVideo = false;
            }

            if (outgoingVideo) {
                webrtcdev.log(" get permission for video Access ");
                getVideoPermission();
            }
        }).catch(err => {
            webrtcdev.error(" dont have access to webcam  ", err);
        });

        detectMic().then(hasMic => {
            webrtcdev.log('Has Mic: ' + (hasMic ? 'yes' : 'no'));
            if (!hasMic) {
                webrtcdev.error(" dont have access to mic  ");
                alert(" you dont have access to Mic ");
                outgoingAudio = false;
            }

            // Try getting permission again and ask your to restart
            if (outgoingAudio) {
                webrtcdev.log(" get permission for audio access ");
                getAudioPermission();
            }
        }).catch(err => {
            webrtcdev.error(" dont have access to mic  ", err);
        });

        // Permission to show desktop notifications
        getNotficationPermission();

        resolve(sessionid);

    }).then(sessionid => {
        setRtcConn(sessionid, sessionobj);
    }).then(_ => {
        setWidgets(rtcConn, sessionobj.widgets);
    }).then(_ => {
        startSocketSession(rtcConn, sessionobj.socketAddr, sessionobj.sessionid);
        connectionStatus = "started";
    }).catch((err) => {
        webrtcdev.error(" [ initjs ] : Promise rejected ", err);
    });

};


/**********************************************************************************
 Session call and Updating Peer Info
 ************************************************************************************/
/**
 * stops a call and removes loalstorage items
 * @method
 * @name stopCall
 */
this.stopCall = stopCall = function () {
    webrtcdev.log(" stopCall ");
    rtcConn.closeEntireSession();

    if (!localStorage.getItem("channel"))
        localStorage.removeItem("channel");

    if (!localStorage.getItem("userid"))
        localStorage.removeItem("userid");

    if (!localStorage.getItem("remoteUsers"))
        localStorage.removeItem("remoteUsers");

    this.connectionStatus = "closed";
};
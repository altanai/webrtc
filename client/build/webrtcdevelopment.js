/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */
/********************************************************************
  global variables
**********************************************************************/

var t = "";
var e = null;
var n = "";
var rtcConn ;
var selfuserid=null , remoteUserId=null;
var containerDiv;
var webcallpeers=[];
var sessions = {};
var repeatFlagShowButton =null, repeatFlagHideButton =null, repeatFlagRemoveButton=null ;

/* DOM objects for single user video , user in conf and all other users*/
var localVideo=null, selfVideo=null, remoteVideos=[];
var localobj , remoteobj;

var selfusername="" , selfemail="" , selfcolor="" ;
var remoteusername="" , remoteemail="" , remotecolor="" ;

var latitude="" , longitude="" , operatingsystem="";

/* webrtc session intilization */
var autoload = true;
var sessionid = null, socketAddr = "/", turn = null , webrtcdevIceServers;
var localStream , localStreamId, remoteStream , remoteStreamId;

/* incoming and outgoing call params */
var incomingAudio =true , incomingVideo =true , incomingData = true;
var outgoingAudio =true , outgoingVideo =true , outgoingData = true;

var debug=false;

var timerobj =false;

var chatobj=false , chatContainer= null;

var fileshareobj=false ;

var screenrecordobj =false ;

var snapshotobj=false ;

var videoRecordobj=false , videoRecordContainer=null;

var drawCanvasobj=false ;

var texteditorobj= false;

var codeeditorobj=false, editor=null;

var reconnectobj=false;

var cursorobj=false;

var muteobj=false;

var minmaxobj=false;

var listeninobj=false;

var screenshareobj=false;

var helpobj=false;

var statisticsobj=false;

var screen, isScreenOn = 0,  chromeMediaSourceId = null;
var screen_roomid , screen_userid;

var role="participant";

function init( autoload , callback ){

  if(autoload && !location.hash.replace('#', '').length) {
    // When Session should autogenerate ssid and locationbar doesnt have a session name
    location.href = location.href.split('#')[0] + '#' + (Math.random() * 100).toString().replace('.', '');
    location.reload();
  }else if(autoload && location.href.replace('#', '').length){
    // When Session should autogenerate ssid and locationbar doesnt have a session name
    if(location.href.indexOf('?')>-1){
      sessionid = (location.hash.substring(0,location.hash.indexOf('?'))).replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('');
    }else{
      sessionid = location.hash.replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('');
    }
    callback(sessionid);

  }else{
    sessionid = prompt("Enter session ", "");
    callback(sessionid);
  }
}


function loadjscssfile(filename, filetype){
  if (filetype=="js"){ //if filename is a external JavaScript file
    var fileref=document.createElement('script')
    fileref.setAttribute("type","text/javascript")
    fileref.setAttribute("src", filename)
  }
  else if (filetype=="css"){ //if filename is an external CSS file
    var fileref=document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")
    fileref.setAttribute("href", filename)
  }
  if (typeof fileref!="undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref)
}

function loadScript(src, onload) {
  var script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.documentElement.appendChild(script);
}

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
  } catch (e) {}
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

function toStr(obj) {
  try{
      return JSON.stringify(obj, function(key, value) {
      if (value && value.sdp) {
        log(value.sdp.type, '\t', value.sdp.sdp);
        return '';
      } else return value;
    }, '\t');
  }catch(e){
    return obj; // in case the obj is non valid json or just a string 
  }
}

function getLength(obj) {
  var length = 0;
  for (var o in obj)
    if (o) length++;
  return length;
}

function getArgsJson(arguments){
  let str="";
  for (i = 0; i < arguments.length; i++) {
    if (arguments[i]) {
      str += toStr(arguments[i]);
    }
  }
  return str;
}

function isJSON(text){
    if (typeof text!=="string"){
        return false;
    }
    try{
        JSON.parse(text);
        return true;
    }
    catch (error){
        return false;
    }
}

var webrtcdev = {};

webrtcdev.log = function(){
  // let arg = getArgsJson(arguments);
  // document.getElementById("help-view-body").innerHTML += '[-]' + arg + "<br/>";
  if(isJSON(arguments)){
    let arg = JSON.stringify(arguments, undefined, 2);
    document.getElementById("help-view-body").innerHTML += "<pre style='color:grey'>[-]" + arg + "</pre>";
  }else{
    let arg = getArgsJson(arguments);
    document.getElementById("help-view-body").innerHTML += "<p style='color:grey'>[-]" + arg + "</p>";
  }
  console.log(arguments);
};

webrtcdev.info= function(){
  let arg = getArgsJson(arguments);
  document.getElementById("help-view-body").innerHTML += "<p style='color:blue'>[INFO]" + arg + "</p>";
  console.info(arguments);
};

 webrtcdev.debug= function(){
  if(isJSON(arguments)){
    let arg = JSON.stringify(arguments, undefined, 2);
    document.getElementById("help-view-body").innerHTML += "<pre style='color:green'>[DDEBUG]" + arg + "</pre>";
  }else{
    let arg = getArgsJson(arguments);
    document.getElementById("help-view-body").innerHTML += "<p style='color:green'>[DDEBUG]" + arg + "</p>";
  }
  console.debug(arguments);
};

webrtcdev.warn= function(){
  let arg = getArgsJson(arguments);
  document.getElementById("help-view-body").innerHTML += "<p style='color:yellow'>[WARN]" + arg + "</p>";
  console.warn(arguments);
};

webrtcdev.error= function(){
  let arg = getArgsJson(arguments);
  document.getElementById("help-view-body").innerHTML +=  "<p style='color:red'>[ERROR]"+ arg + "</p>";
  console.error(arguments);
};



// function log(arg , type) {
//   document.getElementById("network-stats-body").innerHTML = arg;
//   if(type=="info"){
//       webrtcdev.log(arg);
//   }else if ( type=="error"){
//       webrtcdev.error(arg);
//   }else if ( type=="warn"){
//       webrtcdev.warn(arg);
//   }
// }


function getElement(e) {
    return document.querySelector(e)
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
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//**
 * function to show bootstrap based notification to client
 * @constructor
 * @param {string} message - message passed inside the notification 
 * @param {string} type - type of message passed inside the notification 
 */
function shownotification(message , type){

  if(document.getElementById("alertBox")){
    var alertDiv =document.createElement("div");
    if(type=="warning")
      alertDiv.className="alert alert-warning fade in";
    else if (type=="crtical")
      alertDiv.className="alert alert-crtical";
    else
      alertDiv.className="alert alert-success fade in";
    
    alertDiv.innerHTML='<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+ message;

    document.getElementById("alertBox").hidden=false;
    // document.getElementById("alertBox").innerHTML="";
    document.getElementById("alertBox").appendChild(alertDiv);

    setTimeout(function() {
      document.getElementById("alertBox").hidden=true;
    }, 3000);
  }else{
    alert(message);
  }

}

function shownotificationWarning(message){

  if(document.getElementById("alertBox")){
    var alertDiv =document.createElement("div");
    alertDiv.className="alert alert-warning fade in";
    alertDiv.innerHTML='<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+ message;

    document.getElementById("alertBox").hidden=false;
    document.getElementById("alertBox").innerHTML="";
    document.getElementById("alertBox").appendChild(alertDiv);

    setTimeout(function() {
      document.getElementById("alertBox").hidden=true;
    }, 3000);
  }else{
    alert(message);
  }

}

function showdesktopnotification() {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
     alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
     // If it's okay let's create a notification
      var options = {
          body: "The remote has joined the session"
          /*icon: "images/villagexpertslogo2.png"*/
      };

     var notification = new Notification("Vilageexperts" , options);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification("villageexpsrts");
      }

    });

  }

  // At last, if the user has denied notifications, and you 
  // want to be respectful there is no need to bother them any more.
}

Notification.requestPermission().then(function(result) {
  webrtcdev.log(result);
});

function spawnNotification(theBody,theIcon,theTitle) {
  var options = {
    body: theBody,
    icon: theIcon
  }
  var n = new Notification(theTitle,options);
}



/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */// Last time updated: 2016-08-12 5:21:05 AM UTC
// _____________________
// RTCMultiConnection-v3
// Open-Sourced: https://github.com/muaz-khan/RTCMultiConnection
// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------
'use strict';
"use strict";
!function() {
    function RTCMultiConnection(roomid, forceOptions) {
        function onUserLeft(remoteUserId) {
            connection.deletePeer(remoteUserId)
        }
        function connectSocket(connectCallback) {
            if (connection.socketAutoReConnect = !0,
            connection.socket)
                return void (connectCallback && connectCallback(connection.socket));
            if ("undefined" == typeof SocketConnection)
                if ("undefined" != typeof FirebaseConnection)
                    window.SocketConnection = FirebaseConnection;
                else {
                    if ("undefined" == typeof PubNubConnection)
                        throw "SocketConnection.js seems missed.";
                    window.SocketConnection = PubNubConnection
                }
            new SocketConnection(connection,function(s) {
                connectCallback && connectCallback(connection.socket)
            }
            )
        }
        function beforeUnload(shiftModerationControlOnLeave, dontCloseSocket) {
            connection.closeBeforeUnload && (connection.isInitiator === !0 && connection.dontMakeMeModerator(),
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    userLeft: !0
                }, participant),
                connection.peers[participant] && connection.peers[participant].peer && connection.peers[participant].peer.close(),
                delete connection.peers[participant]
            }),
            dontCloseSocket || connection.closeSocket(),
            connection.broadcasters = [],
            connection.isInitiator = !1)
        }
        function applyConstraints(stream, mediaConstraints) {
            return stream ? (mediaConstraints.audio && stream.getAudioTracks().forEach(function(track) {
                track.applyConstraints(mediaConstraints.audio)
            }),
            void (mediaConstraints.video && stream.getVideoTracks().forEach(function(track) {
                track.applyConstraints(mediaConstraints.video)
            }))) : void (connection.enableLogs && webrtcdev.error("No stream to applyConstraints."))
        }
        function replaceTrack(track, remoteUserId, isVideoTrack) {
            return remoteUserId ? void mPeer.replaceTrack(track, remoteUserId, isVideoTrack) : void connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.replaceTrack(track, participant, isVideoTrack)
            })
        }
        function keepNextBroadcasterOnServer() {
            if (connection.isInitiator && !connection.session.oneway && !connection.session.broadcast && "many-to-many" === connection.direction) {
                var firstBroadcaster = connection.broadcasters[0]
                  , otherBroadcasters = [];
                connection.broadcasters.forEach(function(broadcaster) {
                    broadcaster !== firstBroadcaster && otherBroadcasters.push(broadcaster)
                }),
                connection.autoCloseEntireSession || connection.shiftModerationControl(firstBroadcaster, otherBroadcasters, !0)
            }
        }
        forceOptions = forceOptions || {
            useDefaultDevices: !0
        };
        var connection = this;
        connection.channel = connection.sessionid = (roomid || location.href.replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, "").split("\n").join("").split("\r").join("")) + "";
        var mPeer = new MultiPeers(connection);
        mPeer.onGettingLocalMedia = function(stream) {
            stream.type = "local",
            connection.setStreamEndHandler(stream),
            getRMCMediaElement(stream, function(mediaElement) {
                mediaElement.id = stream.streamid,
                mediaElement.muted = !0,
                mediaElement.volume = 0,
                -1 === connection.attachStreams.indexOf(stream) && connection.attachStreams.push(stream),
                "undefined" != typeof StreamsHandler && StreamsHandler.setHandlers(stream, !0, connection),
                connection.streamEvents[stream.streamid] = {
                    stream: stream,
                    type: "local",
                    mediaElement: mediaElement,
                    userid: connection.userid,
                    extra: connection.extra,
                    streamid: stream.streamid,
                    blobURL: mediaElement.src || URL.createObjectURL(stream),
                    isAudioMuted: !0
                },
                setHarkEvents(connection, connection.streamEvents[stream.streamid]),
                setMuteHandlers(connection, connection.streamEvents[stream.streamid]),
                connection.onstream(connection.streamEvents[stream.streamid])
            }, connection)
        }
        ,
        mPeer.onGettingRemoteMedia = function(stream, remoteUserId) {
            stream.type = "remote",
            connection.setStreamEndHandler(stream, "remote-stream"),
            getRMCMediaElement(stream, function(mediaElement) {
                mediaElement.id = stream.streamid,
                "undefined" != typeof StreamsHandler && StreamsHandler.setHandlers(stream, !1, connection),
                connection.streamEvents[stream.streamid] = {
                    stream: stream,
                    type: "remote",
                    userid: remoteUserId,
                    extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                    mediaElement: mediaElement,
                    streamid: stream.streamid,
                    blobURL: mediaElement.src || URL.createObjectURL(stream)
                },
                setMuteHandlers(connection, connection.streamEvents[stream.streamid]),
                connection.onstream(connection.streamEvents[stream.streamid])
            }, connection)
        }
        ,
        mPeer.onRemovingRemoteMedia = function(stream, remoteUserId) {
            var streamEvent = connection.streamEvents[stream.streamid];
            streamEvent || (streamEvent = {
                stream: stream,
                type: "remote",
                userid: remoteUserId,
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                streamid: stream.streamid,
                mediaElement: connection.streamEvents[stream.streamid] ? connection.streamEvents[stream.streamid].mediaElement : null
            }),
            connection.onstreamended(streamEvent),
            delete connection.streamEvents[stream.streamid]
        }
        ,
        mPeer.onNegotiationNeeded = function(message, remoteUserId, callback) {
            connectSocket(function() {
                connection.socket.emit(connection.socketMessageEvent, "password"in message ? message : {
                    remoteUserId: message.remoteUserId || remoteUserId,
                    message: message,
                    sender: connection.userid
                }, callback || function() {}
                )
            })
        }
        ,
        mPeer.onUserLeft = onUserLeft,
        mPeer.disconnectWith = function(remoteUserId, callback) {
            connection.socket && connection.socket.emit("disconnect-with", remoteUserId, callback || function() {}
            ),
            connection.deletePeer(remoteUserId)
        }
        ,
        connection.broadcasters = [],
        connection.socketOptions = {
            transport: "polling"
        },
        connection.openOrJoin = function(localUserid, password) {
            connection.checkPresence(localUserid, function(isRoomExists, roomid) {
                if ("function" == typeof password && (password(isRoomExists, roomid),
                password = null ),
                isRoomExists) {
                    connection.sessionid = roomid;
                    var localPeerSdpConstraints = !1
                      , remotePeerSdpConstraints = !1
                      , isOneWay = !!connection.session.oneway
                      , isDataOnly = isData(connection.session);
                    remotePeerSdpConstraints = {
                        OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                    },
                    localPeerSdpConstraints = {
                        OfferToReceiveAudio: isOneWay ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: isOneWay ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                    };
                    var connectionDescription = {
                        remoteUserId: connection.sessionid,
                        message: {
                            newParticipationRequest: !0,
                            isOneWay: isOneWay,
                            isDataOnly: isDataOnly,
                            localPeerSdpConstraints: localPeerSdpConstraints,
                            remotePeerSdpConstraints: remotePeerSdpConstraints
                        },
                        sender: connection.userid,
                        password: password || !1
                    };
                    return void mPeer.onNegotiationNeeded(connectionDescription)
                }
                connection.userid;
                connection.userid = connection.sessionid = localUserid || connection.sessionid,
                connection.userid += "",
                connection.socket.emit("changed-uuid", connection.userid),
                password && connection.socket.emit("set-password", password),
                connection.isInitiator = !0,
                isData(connection.session) || connection.captureUserMedia()
            })
        }
        ,
        connection.open = function(localUserid, isPublicModerator) {
            connection.userid;
            return connection.userid = connection.sessionid = localUserid || connection.sessionid,
            connection.userid += "",
            connection.isInitiator = !0,
            connectSocket(function() {
                connection.socket.emit("changed-uuid", connection.userid),
                1 == isPublicModerator && connection.becomePublicModerator()
            }),
            isData(connection.session) ? void ("function" == typeof isPublicModerator && isPublicModerator()) : void connection.captureUserMedia("function" == typeof isPublicModerator ? isPublicModerator : null )
        }
        ,
        connection.becomePublicModerator = function() {
            connection.isInitiator && connection.socket.emit("become-a-public-moderator")
        }
        ,
        connection.dontMakeMeModerator = function() {
            connection.socket.emit("dont-make-me-moderator")
        }
        ,
        connection.deletePeer = function(remoteUserId) {
            if (remoteUserId) {
                if (connection.onleave({
                    userid: remoteUserId,
                    extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {}
                }),
                connection.peers[remoteUserId]) {
                    connection.peers[remoteUserId].streams.forEach(function(stream) {
                        stream.stop()
                    });
                    var peer = connection.peers[remoteUserId].peer;
                    if (peer && "closed" !== peer.iceConnectionState)
                        try {
                            peer.close()
                        } catch (e) {}
                    connection.peers[remoteUserId] && (connection.peers[remoteUserId].peer = null ,
                    delete connection.peers[remoteUserId])
                }
                if (-1 !== connection.broadcasters.indexOf(remoteUserId)) {
                    var newArray = [];
                    connection.broadcasters.forEach(function(broadcaster) {
                        broadcaster !== remoteUserId && newArray.push(broadcaster)
                    }),
                    connection.broadcasters = newArray,
                    keepNextBroadcasterOnServer()
                }
            }
        }
        ,
        connection.rejoin = function(connectionDescription) {
            if (!connection.isInitiator && connectionDescription && Object.keys(connectionDescription).length) {
                var extra = {};
                connection.peers[connectionDescription.remoteUserId] && (extra = connection.peers[connectionDescription.remoteUserId].extra,
                connection.deletePeer(connectionDescription.remoteUserId)),
                connectionDescription && connectionDescription.remoteUserId && (connection.join(connectionDescription.remoteUserId),
                connection.onReConnecting({
                    userid: connectionDescription.remoteUserId,
                    extra: extra
                }))
            }
        }
        ,
        connection.join = connection.connect = function(remoteUserId, options) {
            connection.sessionid = (remoteUserId ? remoteUserId.sessionid || remoteUserId.remoteUserId || remoteUserId : !1) || connection.sessionid,
            connection.sessionid += "";
            var localPeerSdpConstraints = !1
              , remotePeerSdpConstraints = !1
              , isOneWay = !1
              , isDataOnly = !1;
            if (remoteUserId && remoteUserId.session || !remoteUserId || "string" == typeof remoteUserId) {
                var session = remoteUserId ? remoteUserId.session || connection.session : connection.session;
                isOneWay = !!session.oneway,
                isDataOnly = isData(session),
                remotePeerSdpConstraints = {
                    OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                },
                localPeerSdpConstraints = {
                    OfferToReceiveAudio: isOneWay ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: isOneWay ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                }
            }
            options = options || {};
            var cb = function() {}
            ;
            "function" == typeof options && (cb = options,
            options = {}),
            "undefined" != typeof options.localPeerSdpConstraints && (localPeerSdpConstraints = options.localPeerSdpConstraints),
            "undefined" != typeof options.remotePeerSdpConstraints && (remotePeerSdpConstraints = options.remotePeerSdpConstraints),
            "undefined" != typeof options.isOneWay && (isOneWay = options.isOneWay),
            "undefined" != typeof options.isDataOnly && (isDataOnly = options.isDataOnly);
            var connectionDescription = {
                remoteUserId: connection.sessionid,
                message: {
                    newParticipationRequest: !0,
                    isOneWay: isOneWay,
                    isDataOnly: isDataOnly,
                    localPeerSdpConstraints: localPeerSdpConstraints,
                    remotePeerSdpConstraints: remotePeerSdpConstraints
                },
                sender: connection.userid,
                password: !1
            };
            return connectSocket(function() {
                connection.peers[connection.sessionid] || (mPeer.onNegotiationNeeded(connectionDescription),
                cb())
            }),
            connectionDescription
        }
        ,
        connection.connectWithAllParticipants = function(remoteUserId) {
            mPeer.onNegotiationNeeded("connectWithAllParticipants", remoteUserId || connection.sessionid)
        }
        ,
        connection.removeFromBroadcastersList = function(remoteUserId) {
            mPeer.onNegotiationNeeded("removeFromBroadcastersList", remoteUserId || connection.sessionid),
            connection.peers.getAllParticipants(remoteUserId || connection.sessionid).forEach(function(participant) {
                mPeer.onNegotiationNeeded("dropPeerConnection", participant),
                connection.deletePeer(participant)
            }),
            connection.attachStreams.forEach(function(stream) {
                stream.stop()
            })
        }
        ,
        connection.getUserMedia = connection.captureUserMedia = function(callback, sessionForced) {
            callback = callback || function() {};
            var session = sessionForced || connection.session;
            return connection.dontCaptureUserMedia || isData(session) ? void callback() : void ((session.audio || session.video || session.screen) && (session.screen ? connection.getScreenConstraints(function(error, screen_constraints) {
                if (error)
                    throw error;
                connection.invokeGetUserMedia({
                    audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : !1,
                    video: screen_constraints,
                    isScreen: !0
                }, function(stream) {
                    if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                        var nonScreenSession = {};
                        for (var s in session)
                            "screen" !== s && (nonScreenSession[s] = session[s]);
                        return void connection.invokeGetUserMedia(sessionForced, callback, nonScreenSession)
                    }
                    callback(stream)
                })
            }) : (session.audio || session.video) && connection.invokeGetUserMedia(sessionForced, callback, session)))
        }
        ,
        connection.closeBeforeUnload = !0,
        window.addEventListener("beforeunload", beforeUnload, !1),
        connection.userid = getRandomString(),
        connection.changeUserId = function(newUserId, callback) {
            connection.userid = newUserId || getRandomString(),
            connection.socket.emit("changed-uuid", connection.userid, callback || function() {}
            )
        }
        ,
        connection.extra = {},
        connection.attachStreams = [],
        connection.session = {
            audio: !0,
            video: !0
        },
        connection.enableFileSharing = !1,
        connection.bandwidth = {
            screen: 512,
            audio: 128,
            video: 512
        },
        connection.codecs = {
            audio: "opus",
            video: "VP9"
        },
        connection.processSdp = function(sdp) {
            return isMobileDevice || isFirefox ? sdp : (sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, connection.bandwidth, !!connection.session.screen),
            sdp = CodecsHandler.setVideoBitrates(sdp, {
                min: 8 * connection.bandwidth.video * 1024,
                max: 8 * connection.bandwidth.video * 1024
            }),
            sdp = CodecsHandler.setOpusAttributes(sdp, {
                maxaveragebitrate: 8 * connection.bandwidth.audio * 1024,
                maxplaybackrate: 8 * connection.bandwidth.audio * 1024,
                stereo: 1,
                maxptime: 3
            }),
            "VP9" === connection.codecs.video && (sdp = CodecsHandler.preferVP9(sdp)),
            "H264" === connection.codecs.video && (sdp = CodecsHandler.removeVPX(sdp)),
            "G722" === connection.codecs.audio && (sdp = CodecsHandler.removeNonG722(sdp)),
            sdp)
        }
        ,
        "undefined" != typeof CodecsHandler && (connection.BandwidthHandler = connection.CodecsHandler = CodecsHandler),
        connection.mediaConstraints = {
            audio: {
                mandatory: {},
                optional: [{
                    bandwidth: 8 * connection.bandwidth.audio * 1024 || 1048576
                }]
            },
            video: {
                mandatory: {},
                optional: [{
                    bandwidth: 8 * connection.bandwidth.video * 1024 || 1048576
                }, {
                    facingMode: "user"
                }]
            }
        },
        isFirefox && (connection.mediaConstraints = {
            audio: !0,
            video: !0
        }),
        forceOptions.useDefaultDevices || isMobileDevice || DetectRTC.load(function() {
            var lastAudioDevice, lastVideoDevice;
            if (DetectRTC.MediaDevices.forEach(function(device) {
                "audioinput" === device.kind && connection.mediaConstraints.audio !== !1 && (lastAudioDevice = device),
                "videoinput" === device.kind && connection.mediaConstraints.video !== !1 && (lastVideoDevice = device)
            }),
            lastAudioDevice) {
                if (isFirefox)
                    return void (connection.mediaConstraints.audio !== !0 ? connection.mediaConstraints.audio.deviceId = lastAudioDevice.id : connection.mediaConstraints.audio = {
                        deviceId: lastAudioDevice.id
                    });
                1 == connection.mediaConstraints.audio && (connection.mediaConstraints.audio = {
                    mandatory: {},
                    optional: []
                }),
                connection.mediaConstraints.audio.optional || (connection.mediaConstraints.audio.optional = []);
                var optional = [{
                    sourceId: lastAudioDevice.id
                }];
                connection.mediaConstraints.audio.optional = optional.concat(connection.mediaConstraints.audio.optional)
            }
            if (lastVideoDevice) {
                if (isFirefox)
                    return void (connection.mediaConstraints.video !== !0 ? connection.mediaConstraints.video.deviceId = lastVideoDevice.id : connection.mediaConstraints.video = {
                        deviceId: lastVideoDevice.id
                    });
                1 == connection.mediaConstraints.video && (connection.mediaConstraints.video = {
                    mandatory: {},
                    optional: []
                }),
                connection.mediaConstraints.video.optional || (connection.mediaConstraints.video.optional = []);
                var optional = [{
                    sourceId: lastVideoDevice.id
                }];
                connection.mediaConstraints.video.optional = optional.concat(connection.mediaConstraints.video.optional)
            }
        }),
        connection.sdpConstraints = {
            mandatory: {
                OfferToReceiveAudio: !0,
                OfferToReceiveVideo: !0
            },
            optional: [{
                VoiceActivityDetection: !1
            }]
        },
        connection.optionalArgument = {
            optional: [{
                DtlsSrtpKeyAgreement: !0
            }, {
                googImprovedWifiBwe: !0
            }, {
                googScreencastMinBitrate: 300
            }, {
                googIPv6: !0
            }, {
                googDscp: !0
            }, {
                googCpuUnderuseThreshold: 55
            }, {
                googCpuOveruseThreshold: 85
            }, {
                googSuspendBelowMinBitrate: !0
            }, {
                googCpuOveruseDetection: !0
            }],
            mandatory: {}
        },
        connection.iceServers = IceServersHandler.getIceServers(connection),
        connection.candidates = {
            host: !0,
            stun: !0,
            turn: !0
        },
        connection.iceProtocols = {
            tcp: !0,
            udp: !0
        },
        connection.onopen = function(event) {
            connection.enableLogs && webrtcdev.info("Data connection has been opened between you & ", event.userid)
        }
        ,
        connection.onclose = function(event) {
            connection.enableLogs && webrtcdev.warn("Data connection has been closed between you & ", event.userid)
        }
        ,
        connection.onerror = function(error) {
            webrtcdev.log("========================" , error);
            connection.enableLogs && webrtcdev.error(error.userid, "data-error", error)
        }
        ,
        connection.onmessage = function(event) {
            connection.enableLogs && webrtcdev.debug("data-message", event.userid, event.data)
        }
        ,
        connection.send = function(data, remoteUserId) {
            webrtcdev.log("connection send -> connection.peers" , connection.peers);
            connection.peers.send(data, remoteUserId)
        }
        ,
        connection.close = connection.disconnect = connection.leave = function() {
            beforeUnload(!1, !0)
        }
        ,
        connection.closeEntireSession = function(callback) {
            callback = callback || function() {}
            ,
            connection.socket.emit("close-entire-session", function looper() {
                return connection.getAllParticipants().length ? void setTimeout(looper, 100) : (connection.onEntireSessionClosed({
                    sessionid: connection.sessionid,
                    userid: connection.userid,
                    extra: connection.extra
                }),
                void connection.changeUserId(null , function() {
                    connection.close(),
                    callback()
                }))
            })
        }
        ,
        connection.onEntireSessionClosed = function(event) {
            connection.enableLogs && webrtcdev.info("Entire session is closed: ", event.sessionid, event.extra)
        }
        ,
        connection.onstream = function(e) {
            var parentNode = connection.videosContainer;
            parentNode.insertBefore(e.mediaElement, parentNode.firstChild),
            e.mediaElement.play(),
            setTimeout(function() {
                e.mediaElement.play()
            }, 5e3)
        }
        ,
        connection.onstreamended = function(e) {
            e.mediaElement || (e.mediaElement = document.getElementById(e.streamid)),
            e.mediaElement && e.mediaElement.parentNode && e.mediaElement.parentNode.removeChild(e.mediaElement)
        }
        ,
        connection.direction = "many-to-many",
        connection.removeStream = function(streamid) {
            var stream;
            return connection.attachStreams.forEach(function(localStream) {
                localStream.id === streamid && (stream = localStream)
            }),
            stream ? (connection.peers.getAllParticipants().forEach(function(participant) {
                var user = connection.peers[participant];
                try {
                    user.peer.removeStream(stream)
                } catch (e) {}
            }),
            void connection.renegotiate()) : void webrtcdev.warn("No such stream exists.", streamid)
        }
        ,
        connection.addStream = function(session, remoteUserId) {
            function gumCallback(stream) {
                session.streamCallback && session.streamCallback(stream),
                connection.renegotiate(remoteUserId)
            }
            return session.getAudioTracks ? (-1 === connection.attachStreams.indexOf(session) && (session.streamid || (session.streamid = session.id),
            connection.attachStreams.push(session)),
            void connection.renegotiate(remoteUserId)) : isData(session) ? void connection.renegotiate(remoteUserId) : void ((session.audio || session.video || session.screen) && (session.screen ? connection.getScreenConstraints(function(error, screen_constraints) {
                return error ? alert(error) : void connection.invokeGetUserMedia({
                    audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : !1,
                    video: screen_constraints,
                    isScreen: !0
                }, !session.audio && !session.video || isAudioPlusTab(connection) ? gumCallback : connection.invokeGetUserMedia(null , gumCallback))
            }) : (session.audio || session.video) && connection.invokeGetUserMedia(null , gumCallback)))
        }
        ,
        connection.invokeGetUserMedia = function(localMediaConstraints, callback, session) {
            session || (session = connection.session),
            localMediaConstraints || (localMediaConstraints = connection.mediaConstraints),
            getUserMediaHandler({
                onGettingLocalMedia: function(stream) {
                    var videoConstraints = localMediaConstraints.video;
                    videoConstraints && (videoConstraints.mediaSource || videoConstraints.mozMediaSource ? stream.isScreen = !0 : videoConstraints.mandatory && videoConstraints.mandatory.chromeMediaSource && (stream.isScreen = !0)),
                    stream.isScreen || (stream.isVideo = stream.getVideoTracks().length,
                    stream.isAudio = !stream.isVideo && stream.getAudioTracks().length),
                    mPeer.onGettingLocalMedia(stream),
                    callback && callback(stream)
                },
                onLocalMediaError: function(error, constraints) {
                    mPeer.onLocalMediaError(error, constraints)
                },
                localMediaConstraints: localMediaConstraints || {
                    audio: session.audio ? localMediaConstraints.audio : !1,
                    video: session.video ? localMediaConstraints.video : !1
                }
            })
        }
        ,
        connection.applyConstraints = function(mediaConstraints, streamid) {
            if (!MediaStreamTrack || !MediaStreamTrack.prototype.applyConstraints)
                return void alert("track.applyConstraints is NOT supported in your browser.");
            if (streamid) {
                var stream;
                return connection.streamEvents[streamid] && (stream = connection.streamEvents[streamid].stream),
                void applyConstraints(stream, mediaConstraints)
            }
            connection.attachStreams.forEach(function(stream) {
                applyConstraints(stream, mediaConstraints)
            })
        }
        ,
        connection.replaceTrack = function(session, remoteUserId, isVideoTrack) {
            function gumCallback(stream) {
                connection.replaceTrack(stream, remoteUserId, isVideoTrack || session.video || session.screen)
            }
            if (session = session || {},
            !RTCPeerConnection.prototype.getSenders)
                return void connection.addStream(session);
            if (session instanceof MediaStreamTrack)
                return void replaceTrack(session, remoteUserId, isVideoTrack);
            if (session instanceof MediaStream)
                return session.getVideoTracks().length && replaceTrack(session.getVideoTracks()[0], remoteUserId, !0),
                void (session.getAudioTracks().length && replaceTrack(session.getAudioTracks()[0], remoteUserId, !1));
            if (isData(session))
                throw "connection.replaceTrack requires audio and/or video and/or screen.";
            (session.audio || session.video || session.screen) && (session.screen ? connection.getScreenConstraints(function(error, screen_constraints) {
                return error ? alert(error) : void connection.invokeGetUserMedia({
                    audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : !1,
                    video: screen_constraints,
                    isScreen: !0
                }, !session.audio && !session.video || isAudioPlusTab(connection) ? gumCallback : connection.invokeGetUserMedia(null , gumCallback))
            }) : (session.audio || session.video) && connection.invokeGetUserMedia(null , gumCallback))
        }
        ,
        connection.resetTrack = function(remoteUsersIds, isVideoTrack) {
            remoteUsersIds || (remoteUsersIds = connection.getAllParticipants()),
            "string" == typeof remoteUsersIds && (remoteUsersIds = [remoteUsersIds]),
            remoteUsersIds.forEach(function(participant) {
                var peer = connection.peers[participant].peer;
                "undefined" != typeof isVideoTrack && isVideoTrack !== !0 || !peer.lastVideoTrack || connection.replaceTrack(peer.lastVideoTrack, participant, !0),
                "undefined" != typeof isVideoTrack && isVideoTrack !== !1 || !peer.lastAudioTrack || connection.replaceTrack(peer.lastAudioTrack, participant, !1)
            })
        }
        ,
        connection.renegotiate = function(remoteUserId) {
            return remoteUserId ? void mPeer.renegotiatePeer(remoteUserId) : void connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.renegotiatePeer(participant)
            })
        }
        ,
        connection.setStreamEndHandler = function(stream, isRemote) {
            stream && stream.addEventListener && (isRemote = !!isRemote,
            stream.alreadySetEndHandler || (stream.alreadySetEndHandler = !0,
            stream.addEventListener("ended", function() {
                stream.idInstance && currentUserMediaRequest.remove(stream.idInstance),
                isRemote || delete connection.attachStreams[connection.attachStreams.indexOf(stream)];
                var streamEvent = connection.streamEvents[stream.streamid];
                streamEvent || (streamEvent = {
                    stream: stream,
                    streamid: stream.streamid,
                    type: isRemote ? "remote" : "local",
                    userid: connection.userid,
                    extra: connection.extra,
                    mediaElement: connection.streamEvents[stream.streamid] ? connection.streamEvents[stream.streamid].mediaElement : null
                }),
                (streamEvent.userid !== connection.userid || "remote" !== streamEvent.type) && (connection.onstreamended(streamEvent),
                delete connection.streamEvents[stream.streamid])
            }, !1)))
        }
        ,
        connection.onMediaError = function(error, constraints) {
            connection.enableLogs && webrtcdev.error(error, constraints)
        }
        ,
        connection.addNewBroadcaster = function(broadcasterId, userPreferences) {
            connection.broadcasters.length && setTimeout(function() {
                mPeer.connectNewParticipantWithAllBroadcasters(broadcasterId, userPreferences, connection.broadcasters.join("|-,-|"))
            }, 1e4),
            connection.session.oneway || connection.session.broadcast || "many-to-many" !== connection.direction || -1 !== connection.broadcasters.indexOf(broadcasterId) || (connection.broadcasters.push(broadcasterId),
            keepNextBroadcasterOnServer())
        }
        ,
        connection.autoCloseEntireSession = !1,
        connection.filesContainer = connection.videosContainer = document.body || document.documentElement,
        connection.isInitiator = !1,
        connection.shareFile = mPeer.shareFile,
        "undefined" != typeof FileProgressBarHandler && FileProgressBarHandler.handle(connection),
        "undefined" != typeof TranslationHandler && TranslationHandler.handle(connection),
        connection.token = getRandomString,
        connection.onNewParticipant = function(participantId, userPreferences) {
            connection.acceptParticipationRequest(participantId, userPreferences)
        }
        ,
        connection.acceptParticipationRequest = function(participantId, userPreferences) {
            userPreferences.successCallback && (userPreferences.successCallback(),
            delete userPreferences.successCallback),
            mPeer.createNewPeer(participantId, userPreferences)
        }
        ,
        connection.onShiftedModerationControl = function(sender, existingBroadcasters) {
            connection.acceptModerationControl(sender, existingBroadcasters)
        }
        ,
        connection.acceptModerationControl = function(sender, existingBroadcasters) {
            connection.isInitiator = !0,
            connection.broadcasters = existingBroadcasters,
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    changedUUID: sender,
                    oldUUID: connection.userid,
                    newUUID: sender
                }, participant)
            }),
            connection.userid = sender,
            connection.socket.emit("changed-uuid", connection.userid)
        }
        ,
        connection.shiftModerationControl = function(remoteUserId, existingBroadcasters, firedOnLeave) {
            mPeer.onNegotiationNeeded({
                shiftedModerationControl: !0,
                broadcasters: existingBroadcasters,
                firedOnLeave: !!firedOnLeave
            }, remoteUserId)
        }
        ,
        "undefined" != typeof StreamsHandler && (connection.StreamsHandler = StreamsHandler),
        connection.onleave = function(userid) {}
        ,
        connection.invokeSelectFileDialog = function(callback) {
            var selector = new FileSelector;
            selector.selectSingleFile(callback)
        }
        ,
        connection.getPublicModerators = function(userIdStartsWith, callback) {
            "function" == typeof userIdStartsWith && (callback = userIdStartsWith),
            connectSocket(function() {
                connection.socket.emit("get-public-moderators", "string" == typeof userIdStartsWith ? userIdStartsWith : "", callback)
            })
        }
        ,
        connection.onmute = function(e) {
            e && e.mediaElement && ("both" === e.muteType || "video" === e.muteType ? (e.mediaElement.src = null ,
            e.mediaElement.pause(),
            e.mediaElement.poster = e.snapshot || "https://cdn.webrtc-experiment.com/images/muted.png") : "audio" === e.muteType && (e.mediaElement.muted = !0))
        }
        ,
        connection.onunmute = function(e) {
            e && e.mediaElement && e.stream && ("both" === e.unmuteType || "video" === e.unmuteType ? (e.mediaElement.poster = null ,
            e.mediaElement.src = URL.createObjectURL(e.stream),
            e.mediaElement.play()) : "audio" === e.unmuteType && (e.mediaElement.muted = !1))
        }
        ,
        connection.onExtraDataUpdated = function(event) {
            event.status = "online",
            connection.onUserStatusChanged(event, !0)
        }
        ,
        connection.onJoinWithPassword = function(remoteUserId) {
            webrtcdev.warn(remoteUserId, "is password protected. Please join with password.")
        }
        ,
        connection.onInvalidPassword = function(remoteUserId, oldPassword) {
            webrtcdev.warn(remoteUserId, "is password protected. Please join with valid password. Your old password", oldPassword, "is wrong.")
        }
        ,
        connection.onPasswordMaxTriesOver = function(remoteUserId) {
            webrtcdev.warn(remoteUserId, "is password protected. Your max password tries exceeded the limit.")
        }
        ,
        connection.getAllParticipants = function(sender) {
            return connection.peers.getAllParticipants(sender)
        }
        ,
        "undefined" != typeof StreamsHandler && (StreamsHandler.onSyncNeeded = function(streamid, action, type) {
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    streamid: streamid,
                    action: action,
                    streamSyncNeeded: !0,
                    type: type || "both"
                }, participant)
            })
        }
        ),
        connection.connectSocket = function(callback) {
            connectSocket(callback)
        }
        ,
        connection.socketAutoReConnect = !0,
        connection.closeSocket = function() {
            try {
                io.sockets = {}
            } catch (e) {}
            connection.socket && (connection.socketAutoReConnect = !1,
            "function" == typeof connection.socket.disconnect && connection.socket.disconnect(),
            connection.socket = null )
        }
        ,
        connection.getSocket = function(callback) {
            return connection.socket ? callback && callback(connection.socket) : connectSocket(callback),
            connection.socket
        }
        ,
        connection.getRemoteStreams = mPeer.getRemoteStreams;
        var skipStreams = ["selectFirst", "selectAll", "forEach"];
        if (connection.streamEvents = {
            selectFirst: function(options) {
                if (!options) {
                    var firstStream;
                    for (var str in connection.streamEvents)
                        -1 !== skipStreams.indexOf(str) || firstStream || (firstStream = connection.streamEvents[str]);
                    return firstStream
                }
            },
            selectAll: function() {}
        },
        connection.socketURL = "/",
        connection.socketMessageEvent = "RTCMultiConnection-Message",
        connection.socketCustomEvent = "RTCMultiConnection-Custom-Message",
        connection.DetectRTC = DetectRTC,
        connection.setCustomSocketEvent = function(customEvent) {
            customEvent && (connection.socketCustomEvent = customEvent),
            connection.socket && connection.socket.emit("set-custom-socket-event-listener", connection.socketCustomEvent)
        }
        ,
        connection.getNumberOfBroadcastViewers = function(broadcastId, callback) {
            connection.socket && broadcastId && callback && connection.socket.emit("get-number-of-users-in-specific-broadcast", broadcastId, callback)
        }
        ,
        connection.onNumberOfBroadcastViewersUpdated = function(event) {
            connection.enableLogs && connection.isInitiator && webrtcdev.info("Number of broadcast (", event.broadcastId, ") viewers", event.numberOfBroadcastViewers)
        }
        ,
        connection.onUserStatusChanged = function(event, dontWriteLogs) {
            connection.enableLogs && !dontWriteLogs && webrtcdev.info(event.userid, event.status)
        }
        ,
        connection.getUserMediaHandler = getUserMediaHandler,
        connection.multiPeersHandler = mPeer,
        connection.enableLogs = !0,
        connection.setCustomSocketHandler = function(customSocketHandler) {
            "undefined" != typeof SocketConnection && (SocketConnection = customSocketHandler)
        }
        ,
        connection.chunkSize = 65 * 1000,
        connection.maxParticipantsAllowed = 50,
        connection.disconnectWith = mPeer.disconnectWith,
        connection.checkPresence = function(remoteUserId, callback) {
            return connection.socket ? void connection.socket.emit("check-presence", (remoteUserId || connection.sessionid) + "", callback) : void connection.connectSocket(function() {
                connection.checkPresence(remoteUserId, callback)
            })
        }
        ,
        connection.onReadyForOffer = function(remoteUserId, userPreferences) {
            connection.multiPeersHandler.createNewPeer(remoteUserId, userPreferences)
        }
        ,
        connection.setUserPreferences = function(userPreferences) {
            return connection.dontAttachStream && (userPreferences.dontAttachLocalStream = !0),
            connection.dontGetRemoteStream && (userPreferences.dontGetRemoteStream = !0),
            userPreferences
        }
        ,
        connection.updateExtraData = function() {
            connection.socket.emit("extra-data-updated", connection.extra)
        }
        ,
        connection.enableScalableBroadcast = !1,
        connection.maxRelayLimitPerUser = 3,
        connection.dontCaptureUserMedia = !1,
        connection.dontAttachStream = !1,
        connection.dontGetRemoteStream = !1,
        connection.onReConnecting = function(event) {
            connection.enableLogs && webrtcdev.info("ReConnecting with", event.userid, "...")
        }
        ,
        connection.beforeAddingStream = function(stream) {
            return stream
        }
        ,
        connection.beforeRemovingStream = function(stream) {
            return stream
        }
        ,
        "undefined" != typeof isChromeExtensionAvailable && (connection.checkIfChromeExtensionAvailable = isChromeExtensionAvailable),
        "undefined" != typeof isFirefoxExtensionAvailable && (connection.checkIfChromeExtensionAvailable = isFirefoxExtensionAvailable),
        "undefined" != typeof getChromeExtensionStatus && (connection.getChromeExtensionStatus = getChromeExtensionStatus),
        connection.getScreenConstraints = function(callback, audioPlusTab) {
            isAudioPlusTab(connection, audioPlusTab) && (audioPlusTab = !0),
            getScreenConstraints(function(error, screen_constraints) {
                error || (screen_constraints = connection.modifyScreenConstraints(screen_constraints),
                callback(error, screen_constraints))
            }, audioPlusTab)
        }
        ,
        connection.modifyScreenConstraints = function(screen_constraints) {
            return screen_constraints
        }
        ,
        connection.onPeerStateChanged = function(state) {
            connection.enableLogs && -1 !== state.iceConnectionState.search(/closed|failed/gi) && webrtcdev.error("Peer connection is closed between you & ", state.userid, state.extra, "state:", state.iceConnectionState)
        }
        ,
        connection.isOnline = !0,
        listenEventHandler("online", function() {
            connection.isOnline = !0
        }),
        listenEventHandler("offline", function() {
            connection.isOnline = !1
        }),
        connection.isLowBandwidth = !1,
        navigator && navigator.connection && navigator.connection.type && (connection.isLowBandwidth = -1 !== navigator.connection.type.toString().toLowerCase().search(/wifi|cell/g),
        connection.isLowBandwidth)) {
            if (connection.bandwidth = {
                audio: 30,
                video: 30,
                screen: 30
            },
            connection.mediaConstraints.audio && connection.mediaConstraints.audio.optional && connection.mediaConstraints.audio.optional.length) {
                var newArray = [];
                connection.mediaConstraints.audio.optional.forEach(function(opt) {
                    "undefined" == typeof opt.bandwidth && newArray.push(opt)
                }),
                connection.mediaConstraints.audio.optional = newArray
            }
            if (connection.mediaConstraints.video && connection.mediaConstraints.video.optional && connection.mediaConstraints.video.optional.length) {
                var newArray = [];
                connection.mediaConstraints.video.optional.forEach(function(opt) {
                    "undefined" == typeof opt.bandwidth && newArray.push(opt)
                }),
                connection.mediaConstraints.video.optional = newArray
            }
        }
        connection.getExtraData = function(remoteUserId) {
            if (!remoteUserId)
                throw "remoteUserId is required.";
            return connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {}
        }
        ,
        forceOptions.autoOpenOrJoin && connection.openOrJoin(connection.sessionid),
        connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
            connection.enableLogs && webrtcdev.warn("Userid already taken.", useridAlreadyTaken, "Your new userid:", yourNewUserId),
            connection.join(useridAlreadyTaken)
        }
        ,
        connection.trickleIce = !0,
        connection.onSettingLocalDescription = function(event) {
            if (connection.enableLogs) {
                webrtcdev.info('Set local description for remote user', event.userid);
            }
        };
    }
    function SocketConnection(connection, connectCallback) {
        var parameters = "";
        parameters += "?userid=" + connection.userid,
        parameters += "&msgEvent=" + connection.socketMessageEvent,
        parameters += "&socketCustomEvent=" + connection.socketCustomEvent,
        connection.enableScalableBroadcast && (parameters += "&enableScalableBroadcast=true",
        parameters += "&maxRelayLimitPerUser=" + (connection.maxRelayLimitPerUser || 2)),
        connection.socketCustomParameters && (parameters += connection.socketCustomParameters);
        try {
            io.sockets = {}
        } catch (e) {}
        try {
            connection.socket = io((connection.socketURL || "/") + parameters)
        } catch (e) {
            connection.socket = io.connect((connection.socketURL || "/") + parameters, connection.socketOptions)
        }
        var mPeer = connection.multiPeersHandler;
        connection.socket.on("extra-data-updated", function(remoteUserId, extra) {
            connection.peers[remoteUserId] && (connection.peers[remoteUserId].extra = extra,
            connection.onExtraDataUpdated({
                userid: remoteUserId,
                extra: extra
            }))
        }),
        connection.socket.on(connection.socketMessageEvent, function(message) {
            if (message.remoteUserId == connection.userid) {
                if (connection.peers[message.sender] && connection.peers[message.sender].extra != message.message.extra && (connection.peers[message.sender].extra = message.extra,
                connection.onExtraDataUpdated({
                    userid: message.sender,
                    extra: message.extra
                })),
                message.message.streamSyncNeeded && connection.peers[message.sender]) {
                    var stream = connection.streamEvents[message.message.streamid];
                    if (!stream || !stream.stream)
                        return;
                    var action = message.message.action;
                    if ("ended" === action || "stream-removed" === action)
                        return void connection.onstreamended(stream);
                    var type = "both" != message.message.type ? message.message.type : null ;
                    return void stream.stream[action](type)
                }
                if ("connectWithAllParticipants" === message.message)
                    return -1 === connection.broadcasters.indexOf(message.sender) && connection.broadcasters.push(message.sender),
                    void mPeer.onNegotiationNeeded({
                        allParticipants: connection.getAllParticipants(message.sender)
                    }, message.sender);
                if ("removeFromBroadcastersList" === message.message)
                    return void (-1 !== connection.broadcasters.indexOf(message.sender) && (delete connection.broadcasters[connection.broadcasters.indexOf(message.sender)],
                    connection.broadcasters = removeNullEntries(connection.broadcasters)));
                if ("dropPeerConnection" === message.message)
                    return void connection.deletePeer(message.sender);
                if (message.message.allParticipants)
                    return -1 === message.message.allParticipants.indexOf(message.sender) && message.message.allParticipants.push(message.sender),
                    void message.message.allParticipants.forEach(function(participant) {
                        mPeer[connection.peers[participant] ? "renegotiatePeer" : "createNewPeer"](participant, {
                            localPeerSdpConstraints: {
                                OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                                OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                            },
                            remotePeerSdpConstraints: {
                                OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                                OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                            },
                            isOneWay: !!connection.session.oneway || "one-way" === connection.direction,
                            isDataOnly: isData(connection.session)
                        })
                    });
                if (message.message.newParticipant) {
                    if (message.message.newParticipant == connection.userid)
                        return;
                    if (connection.peers[message.message.newParticipant])
                        return;
                    return void mPeer.createNewPeer(message.message.newParticipant, message.message.userPreferences || {
                        localPeerSdpConstraints: {
                            OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        remotePeerSdpConstraints: {
                            OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        isOneWay: !!connection.session.oneway || "one-way" === connection.direction,
                        isDataOnly: isData(connection.session)
                    })
                }
                if ((message.message.readyForOffer || message.message.addMeAsBroadcaster) && connection.addNewBroadcaster(message.sender),
                message.message.newParticipationRequest && message.sender !== connection.userid) {
                    connection.peers[message.sender] && connection.deletePeer(message.sender);
                    var userPreferences = {
                        extra: message.extra || {},
                        localPeerSdpConstraints: message.message.remotePeerSdpConstraints || {
                            OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        remotePeerSdpConstraints: message.message.localPeerSdpConstraints || {
                            OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        isOneWay: "undefined" != typeof message.message.isOneWay ? message.message.isOneWay : !!connection.session.oneway || "one-way" === connection.direction,
                        isDataOnly: "undefined" != typeof message.message.isDataOnly ? message.message.isDataOnly : isData(connection.session),
                        dontGetRemoteStream: "undefined" != typeof message.message.isOneWay ? message.message.isOneWay : !!connection.session.oneway || "one-way" === connection.direction,
                        dontAttachLocalStream: !!message.message.dontGetRemoteStream,
                        connectionDescription: message,
                        successCallback: function() {
                            ("undefined" != typeof message.message.isOneWay ? message.message.isOneWay : !!connection.session.oneway || "one-way" === connection.direction) && connection.addNewBroadcaster(message.sender, userPreferences),
                            (connection.session.oneway || "one-way" === connection.direction || isData(connection.session)) && connection.addNewBroadcaster(message.sender, userPreferences)
                        }
                    };
                    return void connection.onNewParticipant(message.sender, userPreferences)
                }
                return message.message.shiftedModerationControl ? void connection.onShiftedModerationControl(message.sender, message.message.broadcasters) : (message.message.changedUUID && connection.peers[message.message.oldUUID] && (connection.peers[message.message.newUUID] = connection.peers[message.message.oldUUID],
                delete connection.peers[message.message.oldUUID]),
                message.message.userLeft ? (mPeer.onUserLeft(message.sender),
                void (message.message.autoCloseEntireSession && connection.leave())) : void mPeer.addNegotiatedMessage(message.message, message.sender))
            }
        }),
        connection.socket.on("user-left", function(userid) {
            onUserLeft(userid),
            connection.onUserStatusChanged({
                userid: userid,
                status: "offline",
                extra: connection.peers[userid] ? connection.peers[userid].extra || {} : {}
            }),
            connection.onleave({
                userid: userid,
                extra: {}
            })
        }),
        connection.socket.on("connect", function() {
            return connection.socketAutoReConnect ? (connection.enableLogs && webrtcdev.info("socket.io connection is opened."),
            connection.socket.emit("extra-data-updated", connection.extra),
            void (connectCallback && connectCallback(connection.socket))) : void (connection.socket = null )
        }),
        connection.socket.on("disconnect", function() {
            return connection.socketAutoReConnect ? void (connection.enableLogs && (webrtcdev.info("socket.io connection is closed"),
            webrtcdev.warn("socket.io reconnecting"))) : void (connection.socket = null )
        }),
        connection.socket.on("join-with-password", function(remoteUserId) {
            connection.onJoinWithPassword(remoteUserId)
        }),
        connection.socket.on("invalid-password", function(remoteUserId, oldPassword) {
            connection.onInvalidPassword(remoteUserId, oldPassword)
        }),
        connection.socket.on("password-max-tries-over", function(remoteUserId) {
            connection.onPasswordMaxTriesOver(remoteUserId)
        }),
        connection.socket.on("user-disconnected", function(remoteUserId) {
            remoteUserId !== connection.userid && (connection.onUserStatusChanged({
                userid: remoteUserId,
                status: "offline",
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra || {} : {}
            }),
            connection.deletePeer(remoteUserId))
        }),
        connection.socket.on("user-connected", function(userid) {
            userid !== connection.userid && connection.onUserStatusChanged({
                userid: userid,
                status: "online",
                extra: connection.peers[userid] ? connection.peers[userid].extra || {} : {}
            })
        }),
        connection.socket.on("closed-entire-session", function(sessionid, extra) {
            connection.leave(),
            connection.onEntireSessionClosed({
                sessionid: sessionid,
                userid: sessionid,
                extra: extra
            })
        }),
        connection.socket.on("userid-already-taken", function(useridAlreadyTaken, yourNewUserId) {
            connection.isInitiator = !1,
            connection.userid = yourNewUserId,
            connection.onUserIdAlreadyTaken(useridAlreadyTaken, yourNewUserId)
        }),
        connection.socket.on("logs", function(log) {
            connection.enableLogs && webrtcdev.debug("server-logs", log)
        }),
        connection.socket.on("number-of-broadcast-viewers-updated", function(data) {
            connection.onNumberOfBroadcastViewersUpdated(data)
        })
    }
    function MultiPeers(connection) {
        function gumCallback(stream, message, remoteUserId) {
            var streamsToShare = {};
            connection.attachStreams.forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                }
            }),
            message.userPreferences.streamsToShare = streamsToShare,
            self.onNegotiationNeeded({
                readyForOffer: !0,
                userPreferences: message.userPreferences
            }, remoteUserId)
        }
        function initFileBufferReader() {
            connection.fbr = new FileBufferReader,
            connection.fbr.onProgress = function(chunk) {
                connection.onFileProgress(chunk)
            }
            ,
            connection.fbr.onBegin = function(file) {
                connection.onFileStart(file)
            }
            ,
            connection.fbr.onEnd = function(file) {
                connection.onFileEnd(file)
            }
        }
        var self = this
          , skipPeers = ["getAllParticipants", "getLength", "selectFirst", "streams", "send", "forEach"];
        connection.peers = {
            getLength: function() {
                var numberOfPeers = 0;
                for (var peer in this) {
                    if (skipPeers.indexOf(peer) == -1) {
                        numberOfPeers++;
                    }
                }
                return numberOfPeers;
            },
            selectFirst: function() {
                var firstPeer;
                for (var peer in this) {
                    if (skipPeers.indexOf(peer) == -1) {
                        firstPeer = this[peer];
                    }
                }
                return firstPeer;
            },
            getAllParticipants: function(sender) {
                var allPeers = [];
                for (var peer in this) {
                    if (skipPeers.indexOf(peer) == -1 && peer != sender) {
                        allPeers.push(peer);
                    }
                }
                return allPeers;
            },
            forEach: function(callbcak) {
                this.getAllParticipants().forEach(function(participant) {
                    callbcak(connection.peers[participant]);
                });
            },
            send: function(data, remoteUserId) {
                var that = this;

                if (!isNull(data.size) && !isNull(data.type)) {
                    self.shareFile(data, remoteUserId);
                    return;
                }

                if (data.type !== 'text' && !(data instanceof ArrayBuffer) && !(data instanceof DataView)) {
                    TextSender.send({
                        text: data,
                        channel: this,
                        connection: connection,
                        remoteUserId: remoteUserId
                    });
                    return;
                }

                if (data.type === 'text') {
                    data = JSON.stringify(data);
                }

                if (remoteUserId) {
                    var remoteUser = connection.peers[remoteUserId];
                    if (remoteUser) {
                        if (!remoteUser.channels.length) {
                            connection.peers[remoteUserId].createDataChannel();
                            connection.renegotiate(remoteUserId);
                            setTimeout(function() {
                                that.send(data, remoteUserId);
                            }, 3000);
                            return;
                        }

                        remoteUser.channels.forEach(function(channel) {
                            channel.send(data);
                        });
                        return;
                    }
                }

                this.getAllParticipants().forEach(function(participant) {
                    if (!that[participant].channels.length) {
                        connection.peers[participant].createDataChannel();
                        connection.renegotiate(participant);
                        setTimeout(function() {
                            that[participant].channels.forEach(function(channel) {
                                channel.send(data);
                            });
                        }, 3000);
                        return;
                    }

                    that[participant].channels.forEach(function(channel) {
                        channel.send(data);
                    });
                });
            }
        };

        this.uuid = connection.userid,
        this.getLocalConfig = function(remoteSdp, remoteUserId, userPreferences) {
            if (!userPreferences) {
                userPreferences = {};
            }

            return {
                streamsToShare: userPreferences.streamsToShare || {},
                rtcMultiConnection: connection,
                connectionDescription: userPreferences.connectionDescription,
                userid: remoteUserId,
                localPeerSdpConstraints: userPreferences.localPeerSdpConstraints,
                remotePeerSdpConstraints: userPreferences.remotePeerSdpConstraints,
                dontGetRemoteStream: !!userPreferences.dontGetRemoteStream,
                dontAttachLocalStream: !!userPreferences.dontAttachLocalStream,
                renegotiatingPeer: !!userPreferences.renegotiatingPeer,
                peerRef: userPreferences.peerRef,
                channels: userPreferences.channels || [],
                onLocalSdp: function(localSdp) {
                    self.onNegotiationNeeded(localSdp, remoteUserId);
                },
                onLocalCandidate: function(localCandidate) {
                    localCandidate = OnIceCandidateHandler.processCandidates(connection, localCandidate)
                    if (localCandidate) {
                        self.onNegotiationNeeded(localCandidate, remoteUserId);
                    }
                },
                remoteSdp: remoteSdp,
                onDataChannelMessage: function(message) {

                    if (!fbr && connection.enableFileSharing) initFileBufferReader();

                    if (typeof message == 'string' || !connection.enableFileSharing) {
                        self.onDataChannelMessage(message, remoteUserId);
                        return;
                    }

                    var that = this;

                    if (message instanceof ArrayBuffer || message instanceof DataView) {
                        fbr.convertToObject(message, function(object) {
                            that.onDataChannelMessage(object);
                        });
                        return;
                    }

                    if (message.readyForNextChunk) {
                        fbr.getNextChunk(message.uuid, function(nextChunk, isLastChunk) {
                            connection.peers[remoteUserId].channels.forEach(function(channel) {
                                channel.send(nextChunk);
                            });
                        }, remoteUserId);
                        return;
                    }

                    fbr.addChunk(message, function(promptNextChunk) {
                        connection.peers[remoteUserId].peer.channel.send(promptNextChunk);
                    });
                },
                onDataChannelError: function(error) {
                    self.onDataChannelError(error, remoteUserId);
                },
                onDataChannelOpened: function(channel) {
                    self.onDataChannelOpened(channel, remoteUserId);
                },
                onDataChannelClosed: function(event) {
                    self.onDataChannelClosed(event, remoteUserId);
                },
                onRemoteStream: function(stream) {
                    connection.peers[remoteUserId].streams.push(stream);

                    if (isPluginRTC && window.PluginRTC) {
                        var mediaElement = document.createElement('video');
                        var body = connection.videosContainer;
                        body.insertBefore(mediaElement, body.firstChild);
                        setTimeout(function() {
                            window.PluginRTC.attachMediaStream(mediaElement, stream);
                        }, 3000);
                        return;
                    }

                    self.onGettingRemoteMedia(stream, remoteUserId);
                },
                onRemoteStreamRemoved: function(stream) {
                    self.onRemovingRemoteMedia(stream, remoteUserId);
                },
                onPeerStateChanged: function(states) {
                    self.onPeerStateChanged(states);

                    if (states.iceConnectionState === 'new') {
                        self.onNegotiationStarted(remoteUserId, states);
                    }

                    if (states.iceConnectionState === 'connected') {
                        self.onNegotiationCompleted(remoteUserId, states);
                    }

                    if (states.iceConnectionState.search(/closed|failed/gi) !== -1) {
                        self.onUserLeft(remoteUserId);
                        self.disconnectWith(remoteUserId);
                    }
                }
            };
        };

        this.createNewPeer = function(remoteUserId, userPreferences) {
            if (connection.maxParticipantsAllowed <= connection.getAllParticipants().length) {
                return;
            }

            userPreferences = userPreferences || {};

            if (connection.isInitiator && !!connection.session.audio && connection.session.audio === 'two-way' && !userPreferences.streamsToShare) {
                userPreferences.isOneWay = false;
                userPreferences.isDataOnly = false;
                userPreferences.session = connection.session;
            }

            if (!userPreferences.isOneWay && !userPreferences.isDataOnly) {
                userPreferences.isOneWay = true;
                this.onNegotiationNeeded({
                    enableMedia: true,
                    userPreferences: userPreferences
                }, remoteUserId);
                return;
            }

            userPreferences = connection.setUserPreferences(userPreferences, remoteUserId);

            var localConfig = this.getLocalConfig(null, remoteUserId, userPreferences);
            connection.peers[remoteUserId] = new PeerInitiator(localConfig);
        };

        this.createAnsweringPeer = function(remoteSdp, remoteUserId, userPreferences) {
            userPreferences = connection.setUserPreferences(userPreferences || {}, remoteUserId);

            var localConfig = this.getLocalConfig(remoteSdp, remoteUserId, userPreferences);
            connection.peers[remoteUserId] = new PeerInitiator(localConfig);
        };

        this.renegotiatePeer = function(remoteUserId, userPreferences, remoteSdp) {
            if (!connection.peers[remoteUserId]) {
                if (connection.enableLogs) {
                    webrtcdev.error('This peer (' + remoteUserId + ') does not exists. Renegotiation skipped.');
                }
                return;
            }

            if (!userPreferences) {
                userPreferences = {};
            }

            userPreferences.renegotiatingPeer = true;
            userPreferences.peerRef = connection.peers[remoteUserId].peer;
            userPreferences.channels = connection.peers[remoteUserId].channels;

            var localConfig = this.getLocalConfig(remoteSdp, remoteUserId, userPreferences);

            connection.peers[remoteUserId] = new PeerInitiator(localConfig);
        };

        this.replaceTrack = function(track, remoteUserId, isVideoTrack) {
            if (!connection.peers[remoteUserId]) {
                throw 'This peer (' + remoteUserId + ') does not exists.';
            }

            var peer = connection.peers[remoteUserId].peer;

            if (!!peer.getSenders && typeof peer.getSenders === 'function' && peer.getSenders().length) {
                peer.getSenders().forEach(function(rtpSender) {
                    if (isVideoTrack && rtpSender.track instanceof VideoStreamTrack) {
                        connection.peers[remoteUserId].peer.lastVideoTrack = rtpSender.track;
                        rtpSender.replaceTrack(track);
                    }

                    if (!isVideoTrack && rtpSender.track instanceof AudioStreamTrack) {
                        connection.peers[remoteUserId].peer.lastAudioTrack = rtpSender.track;
                        rtpSender.replaceTrack(track);
                    }
                });
                return;
            }

            webrtcdev.warn('RTPSender.replaceTrack is NOT supported.');
            this.renegotiatePeer(remoteUserId);
        };

        this.onNegotiationNeeded = function(message, remoteUserId) {};
        this.addNegotiatedMessage = function(message, remoteUserId) {
            if (message.type && message.sdp) {
                if (message.type == 'answer') {
                    if (connection.peers[remoteUserId]) {
                        connection.peers[remoteUserId].addRemoteSdp(message);
                    }
                }

                if (message.type == 'offer') {
                    if (message.renegotiatingPeer) {
                        this.renegotiatePeer(remoteUserId, null, message);
                    } else {
                        this.createAnsweringPeer(message, remoteUserId);
                    }
                }

                if (connection.enableLogs) {
                    webrtcdev.log('Remote peer\'s sdp:', message.sdp);
                }
                return;
            }

            if (message.candidate) {
                if (connection.peers[remoteUserId]) {
                    connection.peers[remoteUserId].addRemoteCandidate(message);
                }

                if (connection.enableLogs) {
                    webrtcdev.log('Remote peer\'s candidate pairs:', message.candidate);
                }
                return;
            }

            if (message.enableMedia) {
                if (connection.attachStreams.length || connection.dontCaptureUserMedia) {
                    var streamsToShare = {};
                    connection.attachStreams.forEach(function(stream) {
                        streamsToShare[stream.streamid] = {
                            isAudio: !!stream.isAudio,
                            isVideo: !!stream.isVideo,
                            isScreen: !!stream.isScreen
                        };
                    });
                    message.userPreferences.streamsToShare = streamsToShare;

                    self.onNegotiationNeeded({
                        readyForOffer: true,
                        userPreferences: message.userPreferences
                    }, remoteUserId);
                    return;
                }

                var localMediaConstraints = {};
                var userPreferences = message.userPreferences;
                if (userPreferences.localPeerSdpConstraints.OfferToReceiveAudio) {
                    localMediaConstraints.audio = connection.mediaConstraints.audio;
                }

                if (userPreferences.localPeerSdpConstraints.OfferToReceiveVideo) {
                    localMediaConstraints.video = connection.mediaConstraints.video;
                }

                var session = userPreferences.session || connection.session;

                if (session.oneway && session.audio && session.audio === 'two-way') {
                    session = {
                        audio: true
                    };
                }

                if (session.audio || session.video || session.screen) {
                    if (session.screen) {
                        connection.getScreenConstraints(function(error, screen_constraints) {
                            connection.invokeGetUserMedia({
                                audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : false,
                                video: screen_constraints,
                                isScreen: true
                            }, (session.audio || session.video) && !isAudioPlusTab(connection) ? connection.invokeGetUserMedia(null, cb) : cb);
                        });
                    } else if (session.audio || session.video) {
                        connection.invokeGetUserMedia(null, cb, session);
                    }
                }
            }

            if (message.readyForOffer) {
                connection.onReadyForOffer(remoteUserId, message.userPreferences);
            }

            function cb(stream) {
                gumCallback(stream, message, remoteUserId);
            }
        };

        function gumCallback(stream, message, remoteUserId) {
            var streamsToShare = {};
            connection.attachStreams.forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                };
            });
            message.userPreferences.streamsToShare = streamsToShare;

            self.onNegotiationNeeded({
                readyForOffer: true,
                userPreferences: message.userPreferences
            }, remoteUserId);
        }

        this.connectNewParticipantWithAllBroadcasters = function(newParticipantId, userPreferences, broadcastersList) {
            broadcastersList = broadcastersList.split('|-,-|');
            if (!broadcastersList.length) {
                return;
            }

            var firstBroadcaster = broadcastersList[0];

            self.onNegotiationNeeded({
                newParticipant: newParticipantId,
                userPreferences: userPreferences || false
            }, firstBroadcaster);

            delete broadcastersList[0];

            var array = [];
            broadcastersList.forEach(function(broadcaster) {
                if (broadcaster) {
                    array.push(broadcaster);
                }
            });

            setTimeout(function() {
                self.connectNewParticipantWithAllBroadcasters(newParticipantId, userPreferences, array.join('|-,-|'));
            }, 10 * 1000);
        };

        this.onGettingRemoteMedia = function(stream, remoteUserId) {};
        this.onRemovingRemoteMedia = function(stream, remoteUserId) {};
        this.onGettingLocalMedia = function(localStream) {};
        this.onLocalMediaError = function(error, constraints) {
            connection.onMediaError(error, constraints);
        };

        var fbr;

        function initFileBufferReader() {
            fbr = new FileBufferReader();
            fbr.onProgress = function(chunk) {
                connection.onFileProgress(chunk);
            };
            fbr.onBegin = function(file) {
                connection.onFileStart(file);
            };
            fbr.onEnd = function(file) {
                connection.onFileEnd(file);
            };
        }

        this.shareFile = function(file, remoteUserId) {
            if (!connection.enableFileSharing) {
                throw '"connection.enableFileSharing" is false.';
            }

            initFileBufferReader();
            fbr.readAsArrayBuffer(file, function(uuid) {
                var arrayOfUsers = connection.getAllParticipants();

                if (remoteUserId) {
                    arrayOfUsers = [remoteUserId];
                }

                arrayOfUsers.forEach(function(participant) {
                    fbr.getNextChunk(uuid, function(nextChunk) {
                        connection.peers[participant].channels.forEach(function(channel) {
                            channel.send(nextChunk);
                        });
                    }, participant);
                });
            }, {
                userid: connection.userid,
                // extra: connection.extra,
                chunkSize: isFirefox ? 15 * 1000 : connection.chunkSize || 0
            });
        };

        if (typeof 'TextReceiver' !== 'undefined') {
            var textReceiver = new TextReceiver(connection);
        }

        this.onDataChannelMessage = function(message, remoteUserId) {
            textReceiver.receive(JSON.parse(message), remoteUserId, connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {});
        };

        this.onDataChannelClosed = function(event, remoteUserId) {
            event.userid = remoteUserId;
            event.extra = connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {};
            connection.onclose(event);
        };

        this.onDataChannelError = function(error, remoteUserId) {
            error.userid = remoteUserId;
            event.extra = connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {};
            connection.onerror(error);
        };

        this.onDataChannelOpened = function(channel, remoteUserId) {
            // keep last channel only; we are not expecting parallel/channels channels
            if (connection.peers[remoteUserId].channels.length) {
                connection.peers[remoteUserId].channels = [channel];
                return;
            }

            connection.peers[remoteUserId].channels.push(channel);
            connection.onopen({
                userid: remoteUserId,
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                channel: channel
            });
        };

        this.onPeerStateChanged = function(state) {
            connection.onPeerStateChanged(state);
        };

        this.onNegotiationStarted = function(remoteUserId, states) {};
        this.onNegotiationCompleted = function(remoteUserId, states) {};

        this.getRemoteStreams = function(remoteUserId) {
            remoteUserId = remoteUserId || connection.peers.getAllParticipants()[0];
            return connection.peers[remoteUserId] ? connection.peers[remoteUserId].streams : [];
        };

        this.isPluginRTC = connection.isPluginRTC = isPluginRTC
    }
    function fireEvent(obj, eventName, args) {
        if ("undefined" != typeof CustomEvent) {
            var eventDetail = {
                arguments: args,
                __exposedProps__: args
            }
              , event = new CustomEvent(eventName,eventDetail);
            obj.dispatchEvent(event)
        }
    }
    function setHarkEvents(connection, streamEvent) {
        if (!connection || !streamEvent)
            throw "Both arguments are required.";
        if (connection.onspeaking && connection.onsilence) {
            if ("undefined" == typeof hark)
                throw "hark.js not found.";
            hark(streamEvent.stream, {
                onspeaking: function() {
                    connection.onspeaking(streamEvent)
                },
                onsilence: function() {
                    connection.onsilence(streamEvent)
                },
                onvolumechange: function(volume, threshold) {
                    connection.onvolumechange && connection.onvolumechange(merge({
                        volume: volume,
                        threshold: threshold
                    }, streamEvent))
                }
            })
        }
    }
    function setMuteHandlers(connection, streamEvent) {
        streamEvent.stream && streamEvent.stream && streamEvent.stream.addEventListener && (streamEvent.stream.addEventListener("mute", function(event) {
            event = connection.streamEvents[streamEvent.streamid],
            event.session = {
                audio: "audio" === event.muteType,
                video: "video" === event.muteType
            },
            connection.onmute(event)
        }, !1),
        streamEvent.stream.addEventListener("unmute", function(event) {
            event = connection.streamEvents[streamEvent.streamid],
            event.session = {
                audio: "audio" === event.unmuteType,
                video: "video" === event.unmuteType
            },
            connection.onunmute(event)
        }, !1))
    }
    function getRandomString() {
        if (window.crypto && window.crypto.getRandomValues && -1 === navigator.userAgent.indexOf("Safari")) {
            for (var a = window.crypto.getRandomValues(new Uint32Array(3)), token = "", i = 0, l = a.length; l > i; i++)
                token += a[i].toString(36);
            return token
        }
        return (Math.random() * (new Date).getTime()).toString(36).replace(/\./g, "")
    }
    function getRMCMediaElement(stream, callback, connection) {
        var isAudioOnly = !1;
        stream.getVideoTracks && !stream.getVideoTracks().length && (isAudioOnly = !0);
        var mediaElement = document.createElement(isAudioOnly ? "audio" : "video");
        return isPluginRTC && window.PluginRTC ? (connection.videosContainer.insertBefore(mediaElement, connection.videosContainer.firstChild),
        void setTimeout(function() {
            window.PluginRTC.attachMediaStream(mediaElement, stream),
            callback(mediaElement)
        }, 1e3)) : (mediaElement[isFirefox ? "mozSrcObject" : "src"] = isFirefox ? stream : window.URL.createObjectURL(stream),
        mediaElement.controls = !0,
        isFirefox && mediaElement.addEventListener("ended", function() {
            if (currentUserMediaRequest.remove(stream.idInstance),
            "local" === stream.type) {
                StreamsHandler.onSyncNeeded(stream.streamid, "ended"),
                connection.attachStreams.forEach(function(aStream, idx) {
                    stream.streamid === aStream.streamid && delete connection.attachStreams[idx]
                });
                var newStreamsArray = [];
                connection.attachStreams.forEach(function(aStream) {
                    aStream && newStreamsArray.push(aStream)
                }),
                connection.attachStreams = newStreamsArray;
                var streamEvent = connection.streamEvents[stream.streamid];
                if (streamEvent)
                    return void connection.onstreamended(streamEvent);
                this.parentNode && this.parentNode.removeChild(this)
            }
        }, !1),
        mediaElement.play(),
        void callback(mediaElement))
    }
    function listenEventHandler(eventName, eventHandler) {
        window.removeEventListener(eventName, eventHandler),
        window.addEventListener(eventName, eventHandler, !1)
    }
    function removeNullEntries(array) {
        var newArray = [];
        return array.forEach(function(item) {
            item && newArray.push(item)
        }),
        newArray
    }
    function isData(session) {
        return !session.audio && !session.video && !session.screen && session.data
    }
    function isNull(obj) {
        return "undefined" == typeof obj
    }
    function isString(obj) {
        return "string" == typeof obj
    }
    function isAudioPlusTab(connection, audioPlusTab) {
        return connection.session.audio && "two-way" === connection.session.audio ? !1 : isFirefox && audioPlusTab !== !1 ? !0 : !isChrome || 50 > chromeVersion ? !1 : typeof audioPlusTab === !0 ? !0 : "undefined" == typeof audioPlusTab && connection.session.audio && connection.session.screen && !connection.session.video ? (audioPlusTab = !0,
        !0) : !1
    }
    function getAudioScreenConstraints(screen_constraints) {
        return isFirefox ? !0 : isChrome ? {
            mandatory: {
                chromeMediaSource: screen_constraints.mandatory.chromeMediaSource,
                chromeMediaSourceId: screen_constraints.mandatory.chromeMediaSourceId
            }
        } : !1
    }
    function setCordovaAPIs() {
        if ("iOS" === DetectRTC.osName && "undefined" != typeof cordova && "undefined" != typeof cordova.plugins && "undefined" != typeof cordova.plugins.iosrtc) {
            var iosrtc = cordova.plugins.iosrtc;
            window.webkitRTCPeerConnection = iosrtc.RTCPeerConnection,
            window.RTCSessionDescription = iosrtc.RTCSessionDescription,
            window.RTCIceCandidate = iosrtc.RTCIceCandidate,
            window.MediaStream = iosrtc.MediaStream,
            window.MediaStreamTrack = iosrtc.MediaStreamTrack,
            navigator.getUserMedia = navigator.webkitGetUserMedia = iosrtc.getUserMedia,
            iosrtc.debug.enable("iosrtc*"),
            iosrtc.registerGlobals()
        }
    }
    function setSdpConstraints(config) {
        var sdpConstraints, sdpConstraints_mandatory = {
            OfferToReceiveAudio: !!config.OfferToReceiveAudio,
            OfferToReceiveVideo: !!config.OfferToReceiveVideo
        };
        return sdpConstraints = {
            mandatory: sdpConstraints_mandatory,
            optional: [{
                VoiceActivityDetection: !1
            }]
        },
        navigator.mozGetUserMedia && firefoxVersion > 34 && (sdpConstraints = {
            OfferToReceiveAudio: !!config.OfferToReceiveAudio,
            OfferToReceiveVideo: !!config.OfferToReceiveVideo
        }),
        sdpConstraints
    }
    function PeerInitiator(config) {
        if (!RTCPeerConnection) {
            throw 'WebRTC 1.0 (RTCPeerConnection) API are NOT available in this browser.';
        }

        var connection = config.rtcMultiConnection;

        this.extra = config.remoteSdp ? config.remoteSdp.extra : connection.extra;
        this.userid = config.userid;
        this.streams = [];
        this.channels = config.channels || [];
        this.connectionDescription = config.connectionDescription;

        var self = this;

        if (config.remoteSdp) {
            this.connectionDescription = config.remoteSdp.connectionDescription;
        }

        var allRemoteStreams = {};

        defaults.sdpConstraints = setSdpConstraints({
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        });

        var peer;

        var renegotiatingPeer = !!config.renegotiatingPeer;
        if (config.remoteSdp) {
            renegotiatingPeer = !!config.remoteSdp.renegotiatingPeer;
        }

        var localStreams = [];
        connection.attachStreams.forEach(function(stream) {
            if (!!stream) {
                localStreams.push(stream);
            }
        });

        if (!renegotiatingPeer) {
            var iceTransports = 'all';
            if (connection.candidates.turn || connection.candidates.relay) {
                if (!connection.candidates.stun && !connection.candidates.reflexive && !connection.candidates.host) {
                    iceTransports = 'relay';
                }
            }

            peer = new RTCPeerConnection(navigator.onLine ? {
                iceServers: connection.iceServers,
                iceTransportPolicy: connection.iceTransportPolicy || iceTransports,
               /* rtcpMuxPolicy: connection.rtcpMuxPolicy || 'negotiate'*/
            } : null, window.PluginRTC ? null : connection.optionalArgument);

            if (!connection.iceServers.length) {
                peer = new RTCPeerConnection(null, null);
            }
        } else {
            peer = config.peerRef;
        }

        function getLocalStreams() {
            // if-block is temporarily disabled
            if (false && 'getSenders' in peer && typeof peer.getSenders === 'function') {
                var streamObject2 = new MediaStream();
                peer.getSenders().forEach(function(sender) {
                    streamObject2.addTrack(sender.track);
                });
                return streamObject2;
            }
            return peer.getLocalStreams();
        }

        peer.onicecandidate = function(event) {
            if (!event.candidate) {
                if (!connection.trickleIce) {
                    var localSdp = peer.localDescription;
                    config.onLocalSdp({
                        type: localSdp.type,
                        sdp: localSdp.sdp,
                        remotePeerSdpConstraints: config.remotePeerSdpConstraints || false,
                        renegotiatingPeer: !!config.renegotiatingPeer || false,
                        connectionDescription: self.connectionDescription,
                        dontGetRemoteStream: !!config.dontGetRemoteStream,
                        extra: connection ? connection.extra : {},
                        streamsToShare: streamsToShare,
                        isFirefoxOffered: isFirefox
                    });
                }
                return;
            }

            if (!connection.trickleIce) return;
            config.onLocalCandidate({
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
            });
        };

        var isFirefoxOffered = !isFirefox;
        if (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.isFirefoxOffered) {
            isFirefoxOffered = true;
        }

        localStreams.forEach(function(localStream) {
            if (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.dontGetRemoteStream) {
                return;
            }

            if (config.dontAttachLocalStream) {
                return;
            }

            localStream = connection.beforeAddingStream(localStream);

            if (!localStream) return;

            if (getLocalStreams().forEach) {
                getLocalStreams().forEach(function(stream) {
                    if (localStream && stream.id == localStream.id) {
                        localStream = null;
                    }
                });
            }

            if (localStream) {
                peer.addStream(localStream);
            }
        });

        peer.oniceconnectionstatechange = peer.onsignalingstatechange = function() {
            var extra = self.extra;
            if (connection.peers[self.userid]) {
                extra = connection.peers[self.userid].extra || extra;
            }

            if (!peer) {
                return;
            }

            config.onPeerStateChanged({
                iceConnectionState: peer.iceConnectionState,
                iceGatheringState: peer.iceGatheringState,
                signalingState: peer.signalingState,
                extra: extra,
                userid: self.userid
            });
        };

        var sdpConstraints = {
            OfferToReceiveAudio: !!localStreams.length,
            OfferToReceiveVideo: !!localStreams.length
        };

        if (config.localPeerSdpConstraints) sdpConstraints = config.localPeerSdpConstraints;

        defaults.sdpConstraints = setSdpConstraints(sdpConstraints);

        var remoteStreamAddEvent = 'addstream';
        if ('ontrack' in peer) {
            // temporarily disabled
            // remoteStreamAddEvent = 'track';
        }

        var streamObject;
        peer.addEventListener(remoteStreamAddEvent, function(event) {
            if (!event) return;
            if (event.streams && event.streams.length && !event.stream) {
                if (!streamObject) {
                    streamObject = new MediaStream();
                    return;
                }

                event.streams.forEach(function(stream) {
                    if (stream.getVideoTracks().length) {
                        streamObject.addTrack(stream.getVideoTracks()[0]);
                    }
                    if (stream.getAudioTracks().length) {
                        streamObject.addTrack(stream.getAudioTracks()[0]);
                    }
                });
                event.stream = streamObject;

                if (connection.session.audio && connection.session.video && (!streamObject.getVideoTracks().length || !streamObject.getAudioTracks().length)) {
                    return;
                }

                streamObject = null;
            }

            var streamsToShare = {};
            if (config.remoteSdp && config.remoteSdp.streamsToShare) {
                streamsToShare = config.remoteSdp.streamsToShare;
            } else if (config.streamsToShare) {
                streamsToShare = config.streamsToShare;
            }

            var streamToShare = streamsToShare[event.stream.id];
            if (streamToShare) {
                event.stream.isAudio = streamToShare.isAudio;
                event.stream.isVideo = streamToShare.isVideo;
                event.stream.isScreen = streamToShare.isScreen;
            }
            event.stream.streamid = event.stream.id;
            if (!event.stream.stop) {
                event.stream.stop = function() {
                    if (isFirefox) {
                        var streamEndedEvent = 'ended';

                        if ('oninactive' in event.stream) {
                            streamEndedEvent = 'inactive';
                        }
                        fireEvent(event.stream, streamEndedEvent);
                    }
                };
            }
            allRemoteStreams[event.stream.id] = event.stream;
            config.onRemoteStream(event.stream);
        }, false);

        peer.onremovestream = function(event) {
            event.stream.streamid = event.stream.id;

            if (allRemoteStreams[event.stream.id]) {
                delete allRemoteStreams[event.stream.id];
            }

            config.onRemoteStreamRemoved(event.stream);
        };

        this.addRemoteCandidate = function(remoteCandidate) {
            peer.addIceCandidate(new RTCIceCandidate(remoteCandidate));
        };

        this.addRemoteSdp = function(remoteSdp, cb) {
            remoteSdp.sdp = connection.processSdp(remoteSdp.sdp);
            peer.setRemoteDescription(new RTCSessionDescription(remoteSdp), cb || function() {}, function(error) {
                if (!!connection.enableLogs) {
                    webrtcdev.error(JSON.stringify(error, null, '\t'), '\n', remoteSdp.type, remoteSdp.sdp);
                }
            });
        };

        var isOfferer = true;

        if (config.remoteSdp) {
            isOfferer = false;
        }

        this.createDataChannel = function() {
            var channel = peer.createDataChannel('sctp', {});
            setChannelEvents(channel);
        };

        if (connection.session.data === true && !renegotiatingPeer) {
            if (!isOfferer) {
                peer.ondatachannel = function(event) {
                    var channel = event.channel;
                    setChannelEvents(channel);
                };
            } else {
                this.createDataChannel();
            }
        }

        if (config.remoteSdp) {
            if (config.remoteSdp.remotePeerSdpConstraints) {
                sdpConstraints = config.remoteSdp.remotePeerSdpConstraints;
            }
            defaults.sdpConstraints = setSdpConstraints(sdpConstraints);
            this.addRemoteSdp(config.remoteSdp, function() {
                createOfferOrAnswer('createAnswer');
            });
        }

        function setChannelEvents(channel) {
            // force ArrayBuffer in Firefox; which uses "Blob" by default.
            channel.binaryType = 'arraybuffer';

            channel.onmessage = function(event) {
                config.onDataChannelMessage(event.data);
            };

            channel.onopen = function() {
                config.onDataChannelOpened(channel);
            };

            channel.onerror = function(error) {
                config.onDataChannelError(error);
            };

            channel.onclose = function(event) {
                config.onDataChannelClosed(event);
            };

            channel.internalSend = channel.send;
            channel.send = function(data) {
                if (channel.readyState !== 'open') {
                    return;
                }

                channel.internalSend(data);
            };

            peer.channel = channel;
        }

        if (connection.session.audio == 'two-way' || connection.session.video == 'two-way' || connection.session.screen == 'two-way') {
            defaults.sdpConstraints = setSdpConstraints({
                OfferToReceiveAudio: connection.session.audio == 'two-way' || (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.OfferToReceiveAudio),
                OfferToReceiveVideo: connection.session.video == 'two-way' || connection.session.screen == 'two-way' || (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.OfferToReceiveAudio)
            });
        }

        var streamsToShare = {};
        if (getLocalStreams().forEach) {
            getLocalStreams().forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                };
            });
        }

        function createOfferOrAnswer(_method) {
            peer[_method](function(localSdp) {
                localSdp.sdp = connection.processSdp(localSdp.sdp);
                peer.setLocalDescription(localSdp, function() {
                    if (!connection.trickleIce) return;
                    config.onLocalSdp({
                        type: localSdp.type,
                        sdp: localSdp.sdp,
                        remotePeerSdpConstraints: config.remotePeerSdpConstraints || false,
                        renegotiatingPeer: !!config.renegotiatingPeer || false,
                        connectionDescription: self.connectionDescription,
                        dontGetRemoteStream: !!config.dontGetRemoteStream,
                        extra: connection ? connection.extra : {},
                        streamsToShare: streamsToShare,
                        isFirefoxOffered: isFirefox
                    });

                    connection.onSettingLocalDescription(self);
                }, function(error) {
                    if (!connection.enableLogs) return;
                    webrtcdev.error('setLocalDescription error', error);
                });
            }, function(error) {
                if (!!connection.enableLogs) {
                    webrtcdev.error('sdp-error', error);
                }
            }, defaults.sdpConstraints);
        }

        if (isOfferer) {
            createOfferOrAnswer('createOffer');
        }

        peer.nativeClose = peer.close;
        peer.close = function() {
            if (!peer) {
                return;
            }

            try {
                if (peer.iceConnectionState.search(/closed|failed/gi) === -1) {
                    peer.getRemoteStreams().forEach(function(stream) {
                        stream.stop();
                    });
                }
                peer.nativeClose();
            } catch (e) {}

            peer = null;
            self.peer = null;
        };

        this.peer = peer;
    }
    function loadIceFrame(callback, skip) {
        if (!loadedIceFrame) {
            if (!skip)
                return loadIceFrame(callback, !0);
            loadedIceFrame = !0;
            var iframe = document.createElement("iframe");
            iframe.onload = function() {
                function iFrameLoaderCallback(event) {
                    event.data && event.data.iceServers && (callback(event.data.iceServers),
                    window.removeEventListener("message", iFrameLoaderCallback))
                }
                iframe.isLoaded = !0,
                listenEventHandler("message", iFrameLoaderCallback),
                iframe.contentWindow.postMessage("get-ice-servers", "*")
            }
            ,
            iframe.src = "https://cdn.webrtc-experiment.com/getIceServers/",
            iframe.style.display = "none",
            (document.body || document.documentElement).appendChild(iframe)
        }
    }
    function getSTUNObj(stunStr) {
        var urlsParam = "urls";
        isPluginRTC && (urlsParam = "url");
        var obj = {};
        return obj[urlsParam] = stunStr,
        obj
    }
    function getTURNObj(turnStr, username, credential) {
        var urlsParam = "urls";
        isPluginRTC && (urlsParam = "url");
        var obj = {
            username: username,
            credential: credential
        };
        return obj[urlsParam] = turnStr,
        obj
    }
    function getExtenralIceFormatted() {
        var iceServers = [];
        return window.RMCExternalIceServers.forEach(function(ice) {
            ice.urls || (ice.urls = ice.url),
            -1 !== ice.urls.search("stun|stuns") && iceServers.push(getSTUNObj(ice.urls)),
            -1 !== ice.urls.search("turn|turns") && iceServers.push(getTURNObj(ice.urls, ice.username, ice.credential))
        }),
        iceServers
    }
    function setStreamType(constraints, stream) {
        constraints.mandatory && constraints.mandatory.chromeMediaSource ? stream.isScreen = !0 : constraints.mozMediaSource || constraints.mediaSource ? stream.isScreen = !0 : constraints.video ? stream.isVideo = !0 : constraints.audio && (stream.isAudio = !0)
    }
    function getUserMediaHandler(options) {
        function streaming(stream, returnBack) {
            setStreamType(options.localMediaConstraints, stream),
            options.onGettingLocalMedia(stream, returnBack),
            stream.addEventListener("ended", function() {
                delete currentUserMediaRequest.streams[idInstance],
                currentUserMediaRequest.mutex = !1,
                currentUserMediaRequest.queueRequests.indexOf(options) && (delete currentUserMediaRequest.queueRequests[currentUserMediaRequest.queueRequests.indexOf(options)],
                currentUserMediaRequest.queueRequests = removeNullEntries(currentUserMediaRequest.queueRequests))
            }, !1),
            currentUserMediaRequest.streams[idInstance] = {
                stream: stream
            },
            currentUserMediaRequest.mutex = !1,
            currentUserMediaRequest.queueRequests.length && getUserMediaHandler(currentUserMediaRequest.queueRequests.shift())
        }
        if (currentUserMediaRequest.mutex === !0)
            return void currentUserMediaRequest.queueRequests.push(options);
        currentUserMediaRequest.mutex = !0;
        var idInstance = JSON.stringify(options.localMediaConstraints);
        if (currentUserMediaRequest.streams[idInstance])
            streaming(currentUserMediaRequest.streams[idInstance].stream, !0);
        else {
            if (isPluginRTC && window.PluginRTC) {
                document.createElement("video");
                return void window.PluginRTC.getUserMedia({
                    audio: !0,
                    video: !0
                }, function(stream) {
                    stream.streamid = stream.id || getRandomString(),
                    streaming(stream)
                }, function(error) {})
            }
            var isBlackBerry = !!/BB10|BlackBerry/i.test(navigator.userAgent || "");
            if (isBlackBerry || "undefined" == typeof navigator.mediaDevices || "function" != typeof navigator.mediaDevices.getUserMedia)
                return navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia,
                void navigator.getUserMedia(options.localMediaConstraints, function(stream) {
                    stream.streamid = stream.streamid || stream.id || getRandomString(),
                    stream.idInstance = idInstance,
                    streaming(stream)
                }, function(error) {
                    options.onLocalMediaError(error, options.localMediaConstraints)
                });
            navigator.mediaDevices.getUserMedia(options.localMediaConstraints).then(function(stream) {
                stream.streamid = stream.streamid || stream.id || getRandomString(),
                stream.idInstance = idInstance,
                streaming(stream)
            })["catch"](function(error) {
                options.onLocalMediaError(error, options.localMediaConstraints)
            })
        }
    }
    function onMessageCallback(data) {
        if ("PermissionDeniedError" == data) {
            if (chromeMediaSource = "PermissionDeniedError",
            screenCallback)
                return screenCallback("PermissionDeniedError");
            throw new Error("PermissionDeniedError")
        }
        "rtcmulticonnection-extension-loaded" == data && (chromeMediaSource = "desktop"),
        data.sourceId && screenCallback && screenCallback(sourceId = data.sourceId)
    }
    function isChromeExtensionAvailable(callback) {
        if (callback) {
            if (isFirefox)
                return isFirefoxExtensionAvailable(callback);
            if ("desktop" == chromeMediaSource)
                return callback(!0);
            //window.postMessage("are-you-there", "*"),
            window.postMessage("webrtcdev-extension-presence", "*"),
            setTimeout(function() {
                callback("screen" == chromeMediaSource ? !1 : !0)
            }, 2e3)
        }
    }
    function isFirefoxExtensionAvailable(callback) {
        function messageCallback(event) {
            var addonMessage = event.data;
            addonMessage && "undefined" != typeof addonMessage.isScreenCapturingEnabled && (isFirefoxAddonResponded = !0,
            callback(addonMessage.isScreenCapturingEnabled === !0 ? !0 : !1),
            window.removeEventListener("message", messageCallback, !1))
        }
        if (callback) {
            if (!isFirefox)
                return isChromeExtensionAvailable(callback);
            var isFirefoxAddonResponded = !1;
            window.addEventListener("message", messageCallback, !1),
            window.postMessage({
                checkIfScreenCapturingEnabled: !0,
                domains: [document.domain]
            }, "*"),
            setTimeout(function() {
                isFirefoxAddonResponded || callback(!0)
            }, 2e3)
        }
    }
/*  function getSourceId(callback, audioPlusTab) {
        alert(" rtc getSourceId");
        if (!callback)
            throw '"callback" parameter is mandatory.';
        return sourceId ? (callback(sourceId),
        void (sourceId = null )) : (screenCallback = callback,
        audioPlusTab ? void window.postMessage("audio-plus-tab", "*") : void window.postMessage("get-sourceId", "*"))
    }*/
    function getChromeExtensionStatus(extensionid, callback) {
        if (2 != arguments.length && (callback = extensionid,
        extensionid = window.RMCExtensionID || "ajhifddimkapgcifgcodmmfdlknahffk"),
        isFirefox)
            return callback("not-chrome");
        var image = document.createElement("img");
        image.src = "chrome-extension://" + extensionid + "/icon.png",
        image.onload = function() {
            chromeMediaSource = "screen",
            window.postMessage("are-you-there", "*"),
            setTimeout(function() {
                callback("screen" == chromeMediaSource ? extensionid == extensionid ? "installed-enabled" : "installed-disabled" : "installed-enabled")
            }, 2e3)
        }
        ,
        image.onerror = function() {
            callback("not-installed")
        }
    }
    function getScreenConstraints(callback, audioPlusTab) {
        var firefoxScreenConstraints = {
            mozMediaSource: "window",
            mediaSource: "window",
            width: 29999,
            height: 8640
        };
        return isFirefox ? callback(null , firefoxScreenConstraints) : void isChromeExtensionAvailable(function(isAvailable) {
            var screen_constraints = {
                mandatory: {
                    chromeMediaSource: chromeMediaSource,
                    maxWidth: 29999,
                    maxHeight: 8640,
                    minFrameRate: 30,
                    maxFrameRate: 128,
                    minAspectRatio: 1.77
                },
                optional: []
            };
            return "desktop" != chromeMediaSource || sourceId ? ("desktop" == chromeMediaSource && (screen_constraints.mandatory.chromeMediaSourceId = sourceId),
            void callback(null , screen_constraints)) : void getSourceId(function() {
                screen_constraints.mandatory.chromeMediaSourceId = sourceId,
                callback("PermissionDeniedError" == sourceId ? sourceId : null , screen_constraints),
                sourceId = null
            }, audioPlusTab)
        })
    }

    function TextReceiver(connection) {
        var content = {};

        function receive(data, userid, extra) {
            // uuid is used to uniquely identify sending instance
            var uuid = data.uuid;
            if (!content[uuid]) {
                content[uuid] = [];
            }

            content[uuid].push(data.message);

            if (data.last) {
                var message = content[uuid].join('');
                if (data.isobject) {
                    message = JSON.parse(message);
                }

                // latency detection
                var receivingTime = new Date().getTime();
                var latency = receivingTime - data.sendingTime;

                var e = {
                    data: message,
                    userid: userid,
                    extra: extra,
                    latency: latency
                };

                if (connection.autoTranslateText) {
                    e.original = e.data;
                    connection.Translator.TranslateText(e.data, function(translatedText) {
                        e.data = translatedText;
                        connection.onmessage(e);
                    });
                } else {
                    connection.onmessage(e);
                }

                delete content[uuid];
            }
        }

        return {
            receive: receive
        };
    }

    var isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0
      , isFirefox = "undefined" != typeof window.InstallTrigger
      , isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0
      , isChrome = !!window.chrome && !isOpera
      , isIE = !!document.documentMode
      , isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);
    "undefined" != typeof cordova && (isMobileDevice = !0,
    isChrome = !0),
    navigator && navigator.userAgent && -1 !== navigator.userAgent.indexOf("Crosswalk") && (isMobileDevice = !0,
    isChrome = !0);
    var isPluginRTC = !isMobileDevice && (isSafari || isIE);
    isPluginRTC && "undefined" != typeof URL && (URL.createObjectURL = function() {}
    );
    var chromeVersion = (!!(window.process && "object" == typeof window.process && window.process.versions && window.process.versions["node-webkit"]),
    50)
      , matchArray = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    isChrome && matchArray && matchArray[2] && (chromeVersion = parseInt(matchArray[2], 10));
    var firefoxVersion = 50;
    matchArray = navigator.userAgent.match(/Firefox\/(.*)/),
    isFirefox && matchArray && matchArray[1] && (firefoxVersion = parseInt(matchArray[1], 10)),
    window.addEventListener || (window.addEventListener = function(el, eventName, eventHandler) {
        el.attachEvent && el.attachEvent("on" + eventName, eventHandler)
    }
    ),
    window.attachEventListener = function(video, type, listener, useCapture) {
        video.addEventListener(type, listener, useCapture)
    }
    ;
    var MediaStream = window.MediaStream;
    "undefined" == typeof MediaStream && "undefined" != typeof webkitMediaStream && (MediaStream = webkitMediaStream),
    "undefined" != typeof MediaStream && ("getVideoTracks"in MediaStream.prototype || (MediaStream.prototype.getVideoTracks = function() {
        if (!this.getTracks)
            return [];
        var tracks = [];
        return this.getTracks.forEach(function(track) {
            -1 !== track.kind.toString().indexOf("video") && tracks.push(track)
        }),
        tracks
    }
    ,
    MediaStream.prototype.getAudioTracks = function() {
        if (!this.getTracks)
            return [];
        var tracks = [];
        return this.getTracks.forEach(function(track) {
            -1 !== track.kind.toString().indexOf("audio") && tracks.push(track)
        }),
        tracks
    }
    ),
    "stop"in MediaStream.prototype || (MediaStream.prototype.stop = function() {
        this.getAudioTracks().forEach(function(track) {
            track.stop && track.stop()
        }),
        this.getVideoTracks().forEach(function(track) {
            track.stop && track.stop()
        })
    }
    )),
    function() {
        function getBrowserInfo() {
            var nameOffset, verOffset, ix, nAgt = (navigator.appVersion,
            navigator.userAgent), browserName = navigator.appName, fullVersion = "" + parseFloat(navigator.appVersion), majorVersion = parseInt(navigator.appVersion, 10);
            if (isOpera) {
                browserName = "Opera";
                try {
                    fullVersion = navigator.userAgent.split("OPR/")[1].split(" ")[0],
                    majorVersion = fullVersion.split(".")[0]
                } catch (e) {
                    fullVersion = "0.0.0.0",
                    majorVersion = 0
                }
            } else
                isIE ? (verOffset = nAgt.indexOf("MSIE"),
                browserName = "IE",
                fullVersion = nAgt.substring(verOffset + 5)) : isChrome ? (verOffset = nAgt.indexOf("Chrome"),
                browserName = "Chrome",
                fullVersion = nAgt.substring(verOffset + 7)) : isSafari ? (verOffset = nAgt.indexOf("Safari"),
                browserName = "Safari",
                fullVersion = nAgt.substring(verOffset + 7),
                -1 !== (verOffset = nAgt.indexOf("Version")) && (fullVersion = nAgt.substring(verOffset + 8))) : isFirefox ? (verOffset = nAgt.indexOf("Firefox"),
                browserName = "Firefox",
                fullVersion = nAgt.substring(verOffset + 8)) : (nameOffset = nAgt.lastIndexOf(" ") + 1) < (verOffset = nAgt.lastIndexOf("/")) && (browserName = nAgt.substring(nameOffset, verOffset),
                fullVersion = nAgt.substring(verOffset + 1),
                browserName.toLowerCase() === browserName.toUpperCase() && (browserName = navigator.appName));
            return isEdge && (browserName = "Edge",
            fullVersion = parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10).toString()),
            -1 !== (ix = fullVersion.indexOf(";")) && (fullVersion = fullVersion.substring(0, ix)),
            -1 !== (ix = fullVersion.indexOf(" ")) && (fullVersion = fullVersion.substring(0, ix)),
            majorVersion = parseInt("" + fullVersion, 10),
            isNaN(majorVersion) && (fullVersion = "" + parseFloat(navigator.appVersion),
            majorVersion = parseInt(navigator.appVersion, 10)),
            {
                fullVersion: fullVersion,
                version: majorVersion,
                name: browserName,
                isPrivateBrowsing: !1
            }
        }
        function retry(isDone, next) {
            var currentTrial = 0
              , maxRetry = 50
              , isTimeout = !1
              , id = window.setInterval(function() {
                isDone() && (window.clearInterval(id),
                next(isTimeout)),
                currentTrial++ > maxRetry && (window.clearInterval(id),
                isTimeout = !0,
                next(isTimeout))
            }, 10)
        }
        function isIE10OrLater(userAgent) {
            var ua = userAgent.toLowerCase();
            if (0 === ua.indexOf("msie") && 0 === ua.indexOf("trident"))
                return !1;
            var match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
            return match && parseInt(match[1], 10) >= 10 ? !0 : !1
        }
        function detectPrivateMode(callback) {
            var isPrivate;
            if (window.webkitRequestFileSystem)
                window.webkitRequestFileSystem(window.TEMPORARY, 1, function() {
                    isPrivate = !1
                }, function(e) {
                    webrtcdev.log(e),
                    isPrivate = !0
                });
            else if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
                var db;
                try {
                    db = window.indexedDB.open("test")
                } catch (e) {
                    isPrivate = !0
                }
                "undefined" == typeof isPrivate && retry(function() {
                    return "done" === db.readyState ? !0 : !1
                }, function(isTimeout) {
                    isTimeout || (isPrivate = db.result ? !1 : !0)
                })
            } else if (isIE10OrLater(window.navigator.userAgent)) {
                isPrivate = !1;
                try {
                    window.indexedDB || (isPrivate = !0)
                } catch (e) {
                    isPrivate = !0
                }
            } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
                try {
                    window.localStorage.setItem("test", 1)
                } catch (e) {
                    isPrivate = !0
                }
                "undefined" == typeof isPrivate && (isPrivate = !1,
                window.localStorage.removeItem("test"))
            }
            retry(function() {
                return "undefined" != typeof isPrivate ? !0 : !1
            }, function(isTimeout) {
                callback(isPrivate)
            })
        }
        function detectDesktopOS() {
            var unknown = "-"
              , nVer = navigator.appVersion
              , nAgt = navigator.userAgent
              , os = unknown
              , clientStrings = [{
                s: "Windows 10",
                r: /(Windows 10.0|Windows NT 10.0)/
            }, {
                s: "Windows 8.1",
                r: /(Windows 8.1|Windows NT 6.3)/
            }, {
                s: "Windows 8",
                r: /(Windows 8|Windows NT 6.2)/
            }, {
                s: "Windows 7",
                r: /(Windows 7|Windows NT 6.1)/
            }, {
                s: "Windows Vista",
                r: /Windows NT 6.0/
            }, {
                s: "Windows Server 2003",
                r: /Windows NT 5.2/
            }, {
                s: "Windows XP",
                r: /(Windows NT 5.1|Windows XP)/
            }, {
                s: "Windows 2000",
                r: /(Windows NT 5.0|Windows 2000)/
            }, {
                s: "Windows ME",
                r: /(Win 9x 4.90|Windows ME)/
            }, {
                s: "Windows 98",
                r: /(Windows 98|Win98)/
            }, {
                s: "Windows 95",
                r: /(Windows 95|Win95|Windows_95)/
            }, {
                s: "Windows NT 4.0",
                r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
            }, {
                s: "Windows CE",
                r: /Windows CE/
            }, {
                s: "Windows 3.11",
                r: /Win16/
            }, {
                s: "Android",
                r: /Android/
            }, {
                s: "Open BSD",
                r: /OpenBSD/
            }, {
                s: "Sun OS",
                r: /SunOS/
            }, {
                s: "Linux",
                r: /(Linux|X11)/
            }, {
                s: "iOS",
                r: /(iPhone|iPad|iPod)/
            }, {
                s: "Mac OS X",
                r: /Mac OS X/
            }, {
                s: "Mac OS",
                r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
            }, {
                s: "QNX",
                r: /QNX/
            }, {
                s: "UNIX",
                r: /UNIX/
            }, {
                s: "BeOS",
                r: /BeOS/
            }, {
                s: "OS/2",
                r: /OS\/2/
            }, {
                s: "Search Bot",
                r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
            }];
            for (var id in clientStrings) {
                var cs = clientStrings[id];
                if (cs.r.test(nAgt)) {
                    os = cs.s;
                    break
                }
            }
            var osVersion = unknown;
            switch (/Windows/.test(os) && (/Windows (.*)/.test(os) && (osVersion = /Windows (.*)/.exec(os)[1]),
            os = "Windows"),
            os) {
            case "Mac OS X":
                /Mac OS X (10[\.\_\d]+)/.test(nAgt) && (osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1]);
                break;
            case "Android":
                /Android ([\.\_\d]+)/.test(nAgt) && (osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1]);
                break;
            case "iOS":
                /OS (\d+)_(\d+)_?(\d+)?/.test(nAgt) && (osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer),
                osVersion = osVersion[1] + "." + osVersion[2] + "." + (0 | osVersion[3]))
            }
            return {
                osName: os,
                osVersion: osVersion
            }
        }
        function DetectLocalIPAddress(callback) {
            DetectRTC.isWebRTCSupported && (DetectRTC.isORTCSupported || getIPs(function(ip) {
                callback(ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/) ? "Local: " + ip : "Public: " + ip)
            }))
        }
        function getIPs(callback) {
            function handleCandidate(candidate) {
                var ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
                  , match = ipRegex.exec(candidate);
                if (!match)
                    return void webrtcdev.warn("Could not match IP address in", candidate);
                var ipAddress = match[1];
                void 0 === ipDuplicates[ipAddress] && callback(ipAddress),
                ipDuplicates[ipAddress] = !0
            }
            var ipDuplicates = {}
              , RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
              , useWebKit = !!window.webkitRTCPeerConnection;
            if (!RTCPeerConnection) {
                var iframe = document.getElementById("iframe");
                if (!iframe)
                    throw "NOTE: you need to have an iframe in the page right above the script tag.";
                var win = iframe.contentWindow;
                RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection,
                useWebKit = !!win.webkitRTCPeerConnection
            }
            if (RTCPeerConnection) {
                var servers, mediaConstraints = {
                    optional: [{
                        RtpDataChannels: !0
                    }]
                };
                useWebKit && (servers = {
                    iceServers: [{
                        urls: "stun:stun.services.mozilla.com"
                    }]
                },
                "undefined" != typeof DetectRTC && DetectRTC.browser.isFirefox && DetectRTC.browser.version <= 38 && (servers[0] = {
                    url: servers[0].urls
                }));
                var pc = new RTCPeerConnection(servers,mediaConstraints);
                pc.onicecandidate = function(ice) {
                    ice.candidate && handleCandidate(ice.candidate.candidate)
                }
                ,
                pc.createDataChannel(""),
                pc.createOffer(function(result) {
                    pc.setLocalDescription(result, function() {}, function() {})
                }, function() {}),
                setTimeout(function() {
                    var lines = pc.localDescription.sdp.split("\n");
                    lines.forEach(function(line) {
                        0 === line.indexOf("a=candidate:") && handleCandidate(line)
                    })
                }, 1e3)
            }
        }
        function checkDeviceSupport(callback) {
            return canEnumerate ? (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources && (navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack)),
            !navigator.enumerateDevices && navigator.enumerateDevices && (navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator)),
            navigator.enumerateDevices ? (MediaDevices = [],
            audioInputDevices = [],
            audioOutputDevices = [],
            videoInputDevices = [],
            void navigator.enumerateDevices(function(devices) {
                devices.forEach(function(_device) {
                    var device = {};
                    for (var d in _device)
                        device[d] = _device[d];
                    "audio" === device.kind && (device.kind = "audioinput"),
                    "video" === device.kind && (device.kind = "videoinput");
                    var skip;
                    MediaDevices.forEach(function(d) {
                        d.id === device.id && d.kind === device.kind && (skip = !0)
                    }),
                    skip || (device.deviceId || (device.deviceId = device.id),
                    device.id || (device.id = device.deviceId),
                    device.label ? ("videoinput" !== device.kind || isWebsiteHasWebcamPermissions || (isWebsiteHasWebcamPermissions = !0),
                    "audioinput" !== device.kind || isWebsiteHasMicrophonePermissions || (isWebsiteHasMicrophonePermissions = !0)) : (device.label = "Please invoke getUserMedia once.",
                    "https:" !== location.protocol && document.domain.search && -1 === document.domain.search(/localhost|127.0./g) && (device.label = "HTTPs is required to get label of this " + device.kind + " device.")),
                    "audioinput" === device.kind && (hasMicrophone = !0,
                    -1 === audioInputDevices.indexOf(device) && audioInputDevices.push(device)),
                    "audiooutput" === device.kind && (hasSpeakers = !0,
                    -1 === audioOutputDevices.indexOf(device) && audioOutputDevices.push(device)),
                    "videoinput" === device.kind && (hasWebcam = !0,
                    -1 === videoInputDevices.indexOf(device) && videoInputDevices.push(device)),
                    -1 === MediaDevices.indexOf(device) && MediaDevices.push(device))
                }),
                "undefined" != typeof DetectRTC && (DetectRTC.MediaDevices = MediaDevices,
                DetectRTC.hasMicrophone = hasMicrophone,
                DetectRTC.hasSpeakers = hasSpeakers,
                DetectRTC.hasWebcam = hasWebcam,
                DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions,
                DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions,
                DetectRTC.audioInputDevices = audioInputDevices,
                DetectRTC.audioOutputDevices = audioOutputDevices,
                DetectRTC.videoInputDevices = videoInputDevices),
                callback && callback()
            })) : void (callback && callback())) : void (callback && callback())
        }
        var browserFakeUserAgent = "Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45";
        !function(that) {
            "undefined" == typeof window && ("undefined" == typeof window && "undefined" != typeof global ? (global.navigator = {
                userAgent: browserFakeUserAgent,
                getUserMedia: function() {}
            },
            that.window = global) : "undefined" == typeof window,
            "undefined" == typeof document && (that.document = {},
            document.createElement = document.captureStream = document.mozCaptureStream = function() {
                return {}
            }
            ),
            "undefined" == typeof location && (that.location = {
                protocol: "file:",
                href: "",
                hash: ""
            }),
            "undefined" == typeof screen && (that.screen = {
                width: 0,
                height: 0
            }))
        }("undefined" != typeof global ? global : window);
        var navigator = window.navigator;
        "undefined" != typeof navigator ? ("undefined" != typeof navigator.webkitGetUserMedia && (navigator.getUserMedia = navigator.webkitGetUserMedia),
        "undefined" != typeof navigator.mozGetUserMedia && (navigator.getUserMedia = navigator.mozGetUserMedia)) : navigator = {
            getUserMedia: function() {},
            userAgent: browserFakeUserAgent
        };
        var isMobileDevice = !!/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent || "")
          , isEdge = !(-1 === navigator.userAgent.indexOf("Edge") || !navigator.msSaveOrOpenBlob && !navigator.msSaveBlob)
          , isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0
          , isFirefox = "undefined" != typeof window.InstallTrigger
          , isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0
          , isChrome = !!window.chrome && !isOpera
          , isIE = !!document.documentMode && !isEdge
          , isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i)
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry|BB10/i)
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i)
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i)
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i)
            },
            any: function() {
                return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()
            },
            getOsName: function() {
                var osName = "Unknown OS";
                return isMobile.Android() && (osName = "Android"),
                isMobile.BlackBerry() && (osName = "BlackBerry"),
                isMobile.iOS() && (osName = "iOS"),
                isMobile.Opera() && (osName = "Opera Mini"),
                isMobile.Windows() && (osName = "Windows"),
                osName
            }
        }
          , osName = "Unknown OS"
          , osVersion = "Unknown OS Version";
        if (isMobile.any())
            osName = isMobile.getOsName();
        else {
            var osInfo = detectDesktopOS();
            osName = osInfo.osName,
            osVersion = osInfo.osVersion
        }
        var isCanvasSupportsStreamCapturing = !1
          , isVideoSupportsStreamCapturing = !1;
        ["captureStream", "mozCaptureStream", "webkitCaptureStream"].forEach(function(item) {
            !isCanvasSupportsStreamCapturing && item in document.createElement("canvas") && (isCanvasSupportsStreamCapturing = !0),
            !isVideoSupportsStreamCapturing && item in document.createElement("video") && (isVideoSupportsStreamCapturing = !0)
        });
        var MediaDevices = []
          , audioInputDevices = []
          , audioOutputDevices = []
          , videoInputDevices = [];
        navigator.mediaDevices && navigator.mediaDevices.enumerateDevices && (navigator.enumerateDevices = function(callback) {
            navigator.mediaDevices.enumerateDevices().then(callback)["catch"](function() {
                callback([])
            })
        }
        );
        var canEnumerate = !1;
        "undefined" != typeof MediaStreamTrack && "getSources"in MediaStreamTrack ? canEnumerate = !0 : navigator.mediaDevices && navigator.mediaDevices.enumerateDevices && (canEnumerate = !0);
        var hasMicrophone = !1
          , hasSpeakers = !1
          , hasWebcam = !1
          , isWebsiteHasMicrophonePermissions = !1
          , isWebsiteHasWebcamPermissions = !1;
        checkDeviceSupport();
        var DetectRTC = window.DetectRTC || {};
        DetectRTC.browser = getBrowserInfo(),
        detectPrivateMode(function(isPrivateBrowsing) {
            DetectRTC.browser.isPrivateBrowsing = !!isPrivateBrowsing
        }),
        DetectRTC.browser["is" + DetectRTC.browser.name] = !0;
        var isWebRTCSupported = (!!(window.process && "object" == typeof window.process && window.process.versions && window.process.versions["node-webkit"]),
        !1);
        ["RTCPeerConnection", "webkitRTCPeerConnection", "mozRTCPeerConnection", "RTCIceGatherer"].forEach(function(item) {
            isWebRTCSupported || item in window && (isWebRTCSupported = !0)
        }),
        DetectRTC.isWebRTCSupported = isWebRTCSupported,
        DetectRTC.isORTCSupported = "undefined" != typeof RTCIceGatherer;
        var isScreenCapturingSupported = !1;
        DetectRTC.browser.isChrome && DetectRTC.browser.version >= 35 ? isScreenCapturingSupported = !0 : DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 34 && (isScreenCapturingSupported = !0),
        "https:" !== location.protocol && (isScreenCapturingSupported = !1),
        DetectRTC.isScreenCapturingSupported = isScreenCapturingSupported;
        var webAudio = {
            isSupported: !1,
            isCreateMediaStreamSourceSupported: !1
        };
        ["AudioContext", "webkitAudioContext", "mozAudioContext", "msAudioContext"].forEach(function(item) {
            webAudio.isSupported || item in window && (webAudio.isSupported = !0,
            "createMediaStreamSource"in window[item].prototype && (webAudio.isCreateMediaStreamSourceSupported = !0))
        }),
        DetectRTC.isAudioContextSupported = webAudio.isSupported,
        DetectRTC.isCreateMediaStreamSourceSupported = webAudio.isCreateMediaStreamSourceSupported;
        var isRtpDataChannelsSupported = !1;
        DetectRTC.browser.isChrome && DetectRTC.browser.version > 31 && (isRtpDataChannelsSupported = !0),
        DetectRTC.isRtpDataChannelsSupported = isRtpDataChannelsSupported;
        var isSCTPSupportd = !1;
        DetectRTC.browser.isFirefox && DetectRTC.browser.version > 28 ? isSCTPSupportd = !0 : DetectRTC.browser.isChrome && DetectRTC.browser.version > 25 ? isSCTPSupportd = !0 : DetectRTC.browser.isOpera && DetectRTC.browser.version >= 11 && (isSCTPSupportd = !0),
        DetectRTC.isSctpDataChannelsSupported = isSCTPSupportd,
        DetectRTC.isMobileDevice = isMobileDevice;
        var isGetUserMediaSupported = !1;
        navigator.getUserMedia ? isGetUserMediaSupported = !0 : navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (isGetUserMediaSupported = !0),
        DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && "https:" !== location.protocol && (DetectRTC.isGetUserMediaSupported = "Requires HTTPs"),
        DetectRTC.isGetUserMediaSupported = isGetUserMediaSupported,
        DetectRTC.osName = osName,
        DetectRTC.osVersion = osVersion;
        var displayResolution = "";
        if (screen.width) {
            var width = screen.width ? screen.width : ""
              , height = screen.height ? screen.height : "";
            displayResolution += "" + width + " x " + height
        }
        DetectRTC.displayResolution = displayResolution,
        DetectRTC.isCanvasSupportsStreamCapturing = isCanvasSupportsStreamCapturing,
        DetectRTC.isVideoSupportsStreamCapturing = isVideoSupportsStreamCapturing,
        DetectRTC.DetectLocalIPAddress = DetectLocalIPAddress,
        DetectRTC.isWebSocketsSupported = "WebSocket"in window && 2 === window.WebSocket.CLOSING,
        DetectRTC.isWebSocketsBlocked = !DetectRTC.isWebSocketsSupported,
        DetectRTC.checkWebSocketsSupport = function(callback) {
            callback = callback || function() {}
            ;
            try {
                var websocket = new WebSocket("wss://echo.websocket.org:443/");
                websocket.onopen = function() {
                    DetectRTC.isWebSocketsBlocked = !1,
                    callback(),
                    websocket.close(),
                    websocket = null
                }
                ,
                websocket.onerror = function() {
                    DetectRTC.isWebSocketsBlocked = !0,
                    callback()
                }
            } catch (e) {
                DetectRTC.isWebSocketsBlocked = !0,
                callback()
            }
        }
        ,
        DetectRTC.load = function(callback) {
            callback = callback || function() {}
            ,
            checkDeviceSupport(callback)
        }
        ,
        DetectRTC.MediaDevices = MediaDevices,
        DetectRTC.hasMicrophone = hasMicrophone,
        DetectRTC.hasSpeakers = hasSpeakers,
        DetectRTC.hasWebcam = hasWebcam,
        DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions,
        DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions,
        DetectRTC.audioInputDevices = audioInputDevices,
        DetectRTC.audioOutputDevices = audioOutputDevices,
        DetectRTC.videoInputDevices = videoInputDevices;
        var isSetSinkIdSupported = !1;
        "setSinkId"in document.createElement("video") && (isSetSinkIdSupported = !0),
        DetectRTC.isSetSinkIdSupported = isSetSinkIdSupported;
        var isRTPSenderReplaceTracksSupported = !1;
        DetectRTC.browser.isFirefox && "undefined" != typeof mozRTCPeerConnection ? "getSenders"in mozRTCPeerConnection.prototype && (isRTPSenderReplaceTracksSupported = !0) : DetectRTC.browser.isChrome && "undefined" != typeof webkitRTCPeerConnection && "getSenders"in webkitRTCPeerConnection.prototype && (isRTPSenderReplaceTracksSupported = !0),
        DetectRTC.isRTPSenderReplaceTracksSupported = isRTPSenderReplaceTracksSupported;
        var isRemoteStreamProcessingSupported = !1;
        DetectRTC.browser.isFirefox && DetectRTC.browser.version > 38 && (isRemoteStreamProcessingSupported = !0),
        DetectRTC.isRemoteStreamProcessingSupported = isRemoteStreamProcessingSupported;
        var isApplyConstraintsSupported = !1;
        "undefined" != typeof MediaStreamTrack && "applyConstraints"in MediaStreamTrack.prototype && (isApplyConstraintsSupported = !0),
        DetectRTC.isApplyConstraintsSupported = isApplyConstraintsSupported;
        var isMultiMonitorScreenCapturingSupported = !1;
        DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 43 && (isMultiMonitorScreenCapturingSupported = !0),
        DetectRTC.isMultiMonitorScreenCapturingSupported = isMultiMonitorScreenCapturingSupported,
        DetectRTC.isPromisesSupported = !!("Promise"in window),
        "undefined" == typeof DetectRTC && (window.DetectRTC = {});
        var MediaStream = window.MediaStream;
        "undefined" == typeof MediaStream && "undefined" != typeof webkitMediaStream && (MediaStream = webkitMediaStream),
        "undefined" != typeof MediaStream ? DetectRTC.MediaStream = Object.keys(MediaStream.prototype) : DetectRTC.MediaStream = !1,
        "undefined" != typeof MediaStreamTrack ? DetectRTC.MediaStreamTrack = Object.keys(MediaStreamTrack.prototype) : DetectRTC.MediaStreamTrack = !1;
        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        "undefined" != typeof RTCPeerConnection ? DetectRTC.RTCPeerConnection = Object.keys(RTCPeerConnection.prototype) : DetectRTC.RTCPeerConnection = !1,
        window.DetectRTC = DetectRTC,
        "undefined" != typeof module && (module.exports = DetectRTC),
        "function" == typeof define && define.amd && define("DetectRTC", [], function() {
            return DetectRTC
        })
    }(),
    document.addEventListener("deviceready", setCordovaAPIs, !1),
    setCordovaAPIs();
    var RTCPeerConnection, defaults = {};
    "undefined" != typeof mozRTCPeerConnection ? RTCPeerConnection = mozRTCPeerConnection : "undefined" != typeof webkitRTCPeerConnection ? RTCPeerConnection = webkitRTCPeerConnection : "undefined" != typeof window.RTCPeerConnection && (RTCPeerConnection = window.RTCPeerConnection);
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription
      , RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate
      , MediaStreamTrack = window.MediaStreamTrack;
    window.onPluginRTCInitialized = function() {
        MediaStreamTrack = window.PluginRTC.MediaStreamTrack,
        RTCPeerConnection = window.PluginRTC.RTCPeerConnection,
        RTCIceCandidate = window.PluginRTC.RTCIceCandidate,
        RTCSessionDescription = window.PluginRTC.RTCSessionDescription
    }
    ,
    "undefined" != typeof window.PluginRTC && window.onPluginRTCInitialized();
    var CodecsHandler = function() {
        function removeVPX(sdp) {
            if (!sdp || "string" != typeof sdp)
                throw "Invalid arguments.";
            return sdp = sdp.replace("a=rtpmap:100 VP8/90000\r\n", ""),
            sdp = sdp.replace("a=rtpmap:101 VP9/90000\r\n", ""),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 100/g, "m=video $1 RTP/SAVPF $2"),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 101/g, "m=video $1 RTP/SAVPF $2"),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF 100([0-9 ]*)/g, "m=video $1 RTP/SAVPF$2"),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF 101([0-9 ]*)/g, "m=video $1 RTP/SAVPF$2"),
            sdp = sdp.replace("a=rtcp-fb:120 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:120 nack pli\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:120 ccm fir\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:101 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:101 nack pli\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:101 ccm fir\r\n", "")
        }
        function disableNACK(sdp) {
            if (!sdp || "string" != typeof sdp)
                throw "Invalid arguments.";
            return sdp = sdp.replace("a=rtcp-fb:126 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:126 nack pli\r\n", "a=rtcp-fb:126 pli\r\n"),
            sdp = sdp.replace("a=rtcp-fb:97 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:97 nack pli\r\n", "a=rtcp-fb:97 pli\r\n")
        }
        function prioritize(codecMimeType, peer) {
            if (peer && peer.getSenders && peer.getSenders().length) {
                if (!codecMimeType || "string" != typeof codecMimeType)
                    throw "Invalid arguments.";
                peer.getSenders().forEach(function(sender) {
                    for (var params = sender.getParameters(), i = 0; i < params.codecs.length; i++)
                        if (params.codecs[i].mimeType == codecMimeType) {
                            params.codecs.unshift(params.codecs.splice(i, 1));
                            break
                        }
                    sender.setParameters(params)
                })
            }
        }
        function removeNonG722(sdp) {
            return sdp.replace(/m=audio ([0-9]+) RTP\/SAVPF ([0-9 ]*)/g, "m=audio $1 RTP/SAVPF 9")
        }
        function setBAS(sdp, bandwidth, isScreen) {
            return bandwidth ? "undefined" != typeof isFirefox && isFirefox ? sdp : isMobileDevice ? sdp : (isScreen && (bandwidth.screen ? bandwidth.screen < 300 && webrtcdev.warn("It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.") : webrtcdev.warn("It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.")),
            bandwidth.screen && isScreen && (sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, ""),
            sdp = sdp.replace(/a=mid:video\r\n/g, "a=mid:video\r\nb=AS:" + bandwidth.screen + "\r\n")),
            (bandwidth.audio || bandwidth.video || bandwidth.data) && (sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "")),
            bandwidth.audio && (sdp = sdp.replace(/a=mid:audio\r\n/g, "a=mid:audio\r\nb=AS:" + bandwidth.audio + "\r\n")),
            bandwidth.video && (sdp = sdp.replace(/a=mid:video\r\n/g, "a=mid:video\r\nb=AS:" + (isScreen ? bandwidth.screen : bandwidth.video) + "\r\n")),
            sdp) : sdp
        }
        function findLine(sdpLines, prefix, substr) {
            return findLineInRange(sdpLines, 0, -1, prefix, substr)
        }
        function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
            for (var realEndLine = -1 !== endLine ? endLine : sdpLines.length, i = startLine; realEndLine > i; ++i)
                if (0 === sdpLines[i].indexOf(prefix) && (!substr || -1 !== sdpLines[i].toLowerCase().indexOf(substr.toLowerCase())))
                    return i;
            return null
        }
        function getCodecPayloadType(sdpLine) {
            var pattern = new RegExp("a=rtpmap:(\\d+) \\w+\\/\\d+")
              , result = sdpLine.match(pattern);
            return result && 2 === result.length ? result[1] : null
        }
        function setVideoBitrates(sdp, params) {
            if (isMobileDevice)
                return sdp;
            params = params || {};
            var vp8Payload, xgoogle_min_bitrate = params.min, xgoogle_max_bitrate = params.max, sdpLines = sdp.split("\r\n"), vp8Index = findLine(sdpLines, "a=rtpmap", "VP8/90000");
            if (vp8Index && (vp8Payload = getCodecPayloadType(sdpLines[vp8Index])),
            !vp8Payload)
                return sdp;
            var rtxPayload, rtxIndex = findLine(sdpLines, "a=rtpmap", "rtx/90000");
            if (rtxIndex && (rtxPayload = getCodecPayloadType(sdpLines[rtxIndex])),
            !rtxIndex)
                return sdp;
            var rtxFmtpLineIndex = findLine(sdpLines, "a=fmtp:" + rtxPayload.toString());
            if (null !== rtxFmtpLineIndex) {
                var appendrtxNext = "\r\n";
                appendrtxNext += "a=fmtp:" + vp8Payload + " x-google-min-bitrate=" + (xgoogle_min_bitrate || "228") + "; x-google-max-bitrate=" + (xgoogle_max_bitrate || "228"),
                sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext),
                sdp = sdpLines.join("\r\n")
            }
            return sdp
        }
        function setOpusAttributes(sdp, params) {
            if (isMobileDevice)
                return sdp;
            params = params || {};
            var opusPayload, sdpLines = sdp.split("\r\n"), opusIndex = findLine(sdpLines, "a=rtpmap", "opus/48000");
            if (opusIndex && (opusPayload = getCodecPayloadType(sdpLines[opusIndex])),
            !opusPayload)
                return sdp;
            var opusFmtpLineIndex = findLine(sdpLines, "a=fmtp:" + opusPayload.toString());
            if (null === opusFmtpLineIndex)
                return sdp;
            var appendOpusNext = "";
            return appendOpusNext += "; stereo=" + ("undefined" != typeof params.stereo ? params.stereo : "1"),
            appendOpusNext += "; sprop-stereo=" + ("undefined" != typeof params["sprop-stereo"] ? params["sprop-stereo"] : "1"),
            "undefined" != typeof params.maxaveragebitrate && (appendOpusNext += "; maxaveragebitrate=" + (params.maxaveragebitrate || 1048576)),
            "undefined" != typeof params.maxplaybackrate && (appendOpusNext += "; maxplaybackrate=" + (params.maxplaybackrate || 1048576)),
            "undefined" != typeof params.cbr && (appendOpusNext += "; cbr=" + ("undefined" != typeof params.cbr ? params.cbr : "1")),
            "undefined" != typeof params.useinbandfec && (appendOpusNext += "; useinbandfec=" + params.useinbandfec),
            "undefined" != typeof params.usedtx && (appendOpusNext += "; usedtx=" + params.usedtx),
            "undefined" != typeof params.maxptime && (appendOpusNext += "\r\na=maxptime:" + params.maxptime),
            sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext),
            sdp = sdpLines.join("\r\n")
        }
        function preferVP9(sdp) {
            return -1 === sdp.indexOf("SAVPF 100 101") || -1 === sdp.indexOf("VP9/90000") ? sdp : sdp.replace("SAVPF 100 101", "SAVPF 101 100")
        }
        function forceStereoAudio(sdp) {
            for (var sdpLines = sdp.split("\r\n"), fmtpLineIndex = null , i = 0; i < sdpLines.length; i++)
                if (-1 !== sdpLines[i].search("opus/48000")) {
                    var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
                    break
                }
            for (var i = 0; i < sdpLines.length; i++)
                if (-1 !== sdpLines[i].search("a=fmtp")) {
                    var payload = extractSdp(sdpLines[i], /a=fmtp:(\d+)/);
                    if (payload === opusPayload) {
                        fmtpLineIndex = i;
                        break
                    }
                }
            return null === fmtpLineIndex ? sdp : (sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat("; stereo=1; sprop-stereo=1"),
            sdp = sdpLines.join("\r\n"))
        }
        var isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);
        return "undefined" != typeof cordova && (isMobileDevice = !0),
        navigator && navigator.userAgent && -1 !== navigator.userAgent.indexOf("Crosswalk") && (isMobileDevice = !0),
        {
            removeVPX: removeVPX,
            disableNACK: disableNACK,
            prioritize: prioritize,
            removeNonG722: removeNonG722,
            setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
                return setBAS(sdp, bandwidth, isScreen)
            },
            setVideoBitrates: function(sdp, params) {
                return setVideoBitrates(sdp, params)
            },
            setOpusAttributes: function(sdp, params) {
                return setOpusAttributes(sdp, params)
            },
            preferVP9: preferVP9,
            forceStereoAudio: forceStereoAudio
        }
    }();
    window.BandwidthHandler = CodecsHandler;
    var loadedIceFrame, OnIceCandidateHandler = function() {
        function processCandidates(connection, icePair) {
            var candidate = icePair.candidate
              , iceRestrictions = connection.candidates
              , stun = iceRestrictions.stun
              , turn = iceRestrictions.turn;
            if (isNull(iceRestrictions.reflexive) || (stun = iceRestrictions.reflexive),
            isNull(iceRestrictions.relay) || (turn = iceRestrictions.relay),
            (iceRestrictions.host || !candidate.match(/typ host/g)) && (turn || !candidate.match(/typ relay/g)) && (stun || !candidate.match(/typ srflx/g))) {
                var protocol = connection.iceProtocols;
                if ((protocol.udp || !candidate.match(/ udp /g)) && (protocol.tcp || !candidate.match(/ tcp /g)))
                    return connection.enableLogs && webrtcdev.debug("Your candidate pairs:", candidate),
                    {
                        candidate: candidate,
                        sdpMid: icePair.sdpMid,
                        sdpMLineIndex: icePair.sdpMLineIndex
                    }
            }
        }
        return {
            processCandidates: processCandidates
        }
    }();
    "undefined" != typeof window.getExternalIceServers && 1 == window.getExternalIceServers && loadIceFrame(function(externalIceServers) {
        externalIceServers && externalIceServers.length && (window.RMCExternalIceServers = externalIceServers,
        window.iceServersLoadCallback && "function" == typeof window.iceServersLoadCallback && window.iceServersLoadCallback(externalIceServers))
    });
    var IceServersHandler = function() {
        function getIceServers(connection) {
            var iceServers = [];
            return iceServers.push(getSTUNObj("stun:stun.l.google.com:19302")),
            iceServers.push(getTURNObj("turn:webrtcweb.com:80", "muazkh", "muazkh")),
            iceServers.push(getTURNObj("turn:webrtcweb.com:443", "muazkh", "muazkh")),
            window.RMCExternalIceServers ? iceServers = iceServers.concat(getExtenralIceFormatted()) : "undefined" != typeof window.getExternalIceServers && 1 == window.getExternalIceServers && (connection.iceServers = iceServers,
            window.iceServersLoadCallback = function() {
                connection.iceServers = connection.iceServers.concat(getExtenralIceFormatted())
            }
            ),
            iceServers
        }
        return {
            getIceServers: getIceServers
        }
    }()
      , currentUserMediaRequest = {
        streams: [],
        mutex: !1,
        queueRequests: [],
        remove: function(idInstance) {
            this.mutex = !1;
            var stream = this.streams[idInstance];
            if (stream) {
                stream = stream.stream;
                var options = stream.currentUserMediaRequestOptions;
                this.queueRequests.indexOf(options) && (delete this.queueRequests[this.queueRequests.indexOf(options)],
                this.queueRequests = removeNullEntries(this.queueRequests)),
                this.streams[idInstance].stream = null ,
                delete this.streams[idInstance]
            }
        }
    }
      , StreamsHandler = function() {
        function handleType(type) {
            return type ? "string" == typeof type || "undefined" == typeof type ? type : type.audio && type.video ? null : type.audio ? "audio" : type.video ? "video" : void 0 : void 0
        }
        function setHandlers(stream, syncAction, connection) {
            function graduallyIncreaseVolume() {
                if (connection.streamEvents[stream.streamid].mediaElement) {
                    var mediaElement = connection.streamEvents[stream.streamid].mediaElement;
                    mediaElement.volume = 0,
                    afterEach(200, 5, function() {
                        mediaElement.volume += .2
                    })
                }
            }
            stream && stream.addEventListener && (("undefined" == typeof syncAction || 1 == syncAction) && stream.addEventListener("ended", function() {
                StreamsHandler.onSyncNeeded(this.streamid, "ended")
            }, !1),
            stream.mute = function(type, isSyncAction) {
                type = handleType(type),
                "undefined" != typeof isSyncAction && (syncAction = isSyncAction),
                ("undefined" == typeof type || "audio" == type) && stream.getAudioTracks().forEach(function(track) {
                    track.enabled = !1,
                    connection.streamEvents[stream.streamid].isAudioMuted = !0
                }),
                ("undefined" == typeof type || "video" == type) && stream.getVideoTracks().forEach(function(track) {
                    track.enabled = !1
                }),
                ("undefined" == typeof syncAction || 1 == syncAction) && StreamsHandler.onSyncNeeded(stream.streamid, "mute", type),
                connection.streamEvents[stream.streamid].muteType = type || "both",
                fireEvent(stream, "mute", type)
            }
            ,
            stream.unmute = function(type, isSyncAction) {
                type = handleType(type),
                "undefined" != typeof isSyncAction && (syncAction = isSyncAction),
                graduallyIncreaseVolume(),
                ("undefined" == typeof type || "audio" == type) && stream.getAudioTracks().forEach(function(track) {
                    track.enabled = !0,
                    connection.streamEvents[stream.streamid].isAudioMuted = !1
                }),
                ("undefined" == typeof type || "video" == type) && (stream.getVideoTracks().forEach(function(track) {
                    track.enabled = !0
                }),
                "undefined" != typeof type && "video" == type && connection.streamEvents[stream.streamid].isAudioMuted && !function looper(times) {
                    times || (times = 0),
                    times++,
                    100 > times && connection.streamEvents[stream.streamid].isAudioMuted && (stream.mute("audio"),
                    setTimeout(function() {
                        looper(times)
                    }, 50))
                }()),
                ("undefined" == typeof syncAction || 1 == syncAction) && StreamsHandler.onSyncNeeded(stream.streamid, "unmute", type),
                connection.streamEvents[stream.streamid].unmuteType = type || "both",
                fireEvent(stream, "unmute", type)
            }
            )
        }
        function afterEach(setTimeoutInteval, numberOfTimes, callback, startedTimes) {
            startedTimes = (startedTimes || 0) + 1,
            startedTimes >= numberOfTimes || setTimeout(function() {
                callback(),
                afterEach(setTimeoutInteval, numberOfTimes, callback, startedTimes)
            }, setTimeoutInteval)
        }
        return {
            setHandlers: setHandlers,
            onSyncNeeded: function(streamid, action, type) {}
        }
    }();
    window.addEventListener("message", function(event) {
        event.origin == window.location.origin && onMessageCallback(event.data)
    });
    var sourceId, screenCallback, chromeMediaSource = "screen";
    var TextSender = {
        send: function(config) {
            var connection = config.connection;

            var channel = config.channel,
                remoteUserId = config.remoteUserId,
                initialText = config.text,
                packetSize = connection.chunkSize || 1000,
                textToTransfer = '',
                isobject = false;

            if (!isString(initialText)) {
                isobject = true;
                initialText = JSON.stringify(initialText);
            }

            // uuid is used to uniquely identify sending instance
            var uuid = getRandomString();
            var sendingTime = new Date().getTime();

            sendText(initialText);

            function sendText(textMessage, text) {
                var data = {
                    type: 'text',
                    uuid: uuid,
                    sendingTime: sendingTime
                };

                if (textMessage) {
                    text = textMessage;
                    data.packets = parseInt(text.length / packetSize);
                }

                if (text.length > packetSize) {
                    data.message = text.slice(0, packetSize);
                } else {
                    data.message = text;
                    data.last = true;
                    data.isobject = isobject;
                }

                channel.send(data, remoteUserId);

                textToTransfer = text.slice(data.message.length);

                if (textToTransfer.length) {
                    setTimeout(function() {
                        sendText(null, textToTransfer);
                    }, connection.chunkInterval || 100);
                }
            }
        }
    },
    FileProgressBarHandler = function() {
        function handle(connection) {
            function updateLabel(progress, label) {
                if (-1 !== progress.position) {
                    var position = +progress.position.toFixed(2).split(".")[1] || 100;
                    label.innerHTML = position + "%"
                }
            }
            var progressHelper = {};
            connection.onFileStart = function(file) {
                var div = document.createElement("div");
                return div.title = file.name,
                div.innerHTML = "<label>0%</label> <progress></progress>",
                file.remoteUserId && (div.innerHTML += " (Sharing with:" + file.remoteUserId + ")"),
                connection.filesContainer || (connection.filesContainer = document.body || document.documentElement),
                connection.filesContainer.insertBefore(div, connection.filesContainer.firstChild),
                file.remoteUserId ? (progressHelper[file.uuid] || (progressHelper[file.uuid] = {}),
                progressHelper[file.uuid][file.remoteUserId] = {
                    div: div,
                    progress: div.querySelector("progress"),
                    label: div.querySelector("label")
                },
                void (progressHelper[file.uuid][file.remoteUserId].progress.max = file.maxChunks)) : (progressHelper[file.uuid] = {
                    div: div,
                    progress: div.querySelector("progress"),
                    label: div.querySelector("label")
                },
                void (progressHelper[file.uuid].progress.max = file.maxChunks))
            }
            ,
            connection.onFileProgress = function(chunk) {
                var helper = progressHelper[chunk.uuid];
                helper && (!chunk.remoteUserId || (helper = progressHelper[chunk.uuid][chunk.remoteUserId])) && (helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max,
                updateLabel(helper.progress, helper.label))
            }
            ,
            connection.onFileEnd = function(file) {
                var helper = progressHelper[file.uuid];
                if (!helper)
                    return void webrtcdev.error("No such progress-helper element exists.", file);
                if (!file.remoteUserId || (helper = progressHelper[file.uuid][file.remoteUserId])) {
                    var div = helper.div;
                    -1 != file.type.indexOf("image") ? div.innerHTML = '<a href="' + file.url + '" download="' + file.name + '">Download <strong style="color:red;">' + file.name + '</strong> </a><br /><img src="' + file.url + '" title="' + file.name + '" style="max-width: 80%;">' : div.innerHTML = '<a href="' + file.url + '" download="' + file.name + '">Download <strong style="color:red;">' + file.name + '</strong> </a><br /><iframe src="' + file.url + '" title="' + file.name + '" style="width: 80%;border: 0;height: inherit;margin-top:1em;"></iframe>'
                }
            }
        }
        return {
            handle: handle
        }
    }(), 
    TranslationHandler = function() {
        function handle(connection) {
            connection.autoTranslateText = !1,
            connection.language = "en",
            connection.googKey = "AIzaSyCgB5hmFY74WYB-EoWkhr9cAGr6TiTHrEE",
            connection.Translator = {
                TranslateText: function(text, callback) {
                    var newScript = document.createElement("script");
                    newScript.type = "text/javascript";
                    var sourceText = encodeURIComponent(text)
                      , randomNumber = "method" + connection.token();
                    window[randomNumber] = function(response) {
                        response.data && response.data.translations[0] && callback && callback(response.data.translations[0].translatedText),
                        response.error && "Daily Limit Exceeded" === response.error.message && (warn('Text translation failed. Error message: "Daily Limit Exceeded."'),
                        callback(text))
                    }
                    ;
                    var source = "https://www.googleapis.com/language/translate/v2?key=" + connection.googKey + "&target=" + (connection.language || "en-US") + "&callback=window." + randomNumber + "&q=" + sourceText;
                    newScript.src = source,
                    document.getElementsByTagName("head")[0].appendChild(newScript)
                }
            }
        }
        return {
            handle: handle
        }
    }();
    window.RTCMultiConnection = RTCMultiConnection
}();

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//**************************************************************
Screenshare 
****************************************************************/
'use strict';
"use strict";
var chromeMediaSource = 'screen';
var sourceId , screen_constraints , screenStreamId;
var isFirefox = typeof window.InstallTrigger !== 'undefined';
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isChrome = !!window.chrome && !isOpera;
var isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);

var scrConn, screenCallback ;
var iceServers=[];
var signaler,screen,screenRoomid;
var screenShareButton ;

var screenShareStreamLocal = null;

/**
 * function to get the sourceID from chorme extension 
 * @method
 * @name getSourceId
 * @param {function} callback
 * @param {string} audioPlusTab
 */
/* getsourceID in RTCmtulconn has been commented to make the below one active */
function getSourceId(callback, audioPlusTab) {
    if (!callback)
        throw '"callback" parameter is mandatory.';

    window.postMessage("webrtcdev-extension-getsourceId", "*");
}

/**
 * function to get the sourceID from chorme extension 
 * @method
 * @name getSourceId
 * @param {function} callback
 * @param {string} audioPlusTab
 */
function getChromeExtensionStatus(extensionid, callback) {
    if (2 != arguments.length && (callback = extensionid, extensionid = window.RMCExtensionID || "ajhifddimkapgcifgcodmmfdlknahffk"), isFirefox)
        return callback("not-chrome");
    
    if(!extensionid)
        return callback("Null extensionID");

    try{
        var image = document.createElement("img");
        image.src = "chrome-extension://" + extensionid + "/icon.png",
        image.onload = function() {
            webrtcdev.info("screenshare extension " , image.src);
            chromeMediaSource = "screen",
            window.postMessage("webrtcdev-extension-presence", "*"),
            setTimeout(function() {
                callback("screen" == chromeMediaSource ? extensionid == extensionid ? "installed-enabled" : "installed-disabled" : "installed-enabled")
            }, 2e3);
        },
        image.onerror = function() {
            webrtcdev.error("No screenshare extension " , image.src);
            callback("not-installed");
        }
    }catch(e){
        webrtcdev.error("Screenshare extension image not found chrome-extension://" , extensionid , "/icon.png" , e)
        callback("not-installed");
    }
}

/**
 * function to find if chromeMedia source is desktop or screen
 * @method
 * @name isChromeExtensionAvailable
 * @param {function} callback
 */
function isChromeExtensionAvailable(callback) {
    if (callback) {
        if (isFirefox)
            return isFirefoxExtensionAvailable(callback);
        if ("desktop" == chromeMediaSource)
            return callback(!0);
        window.postMessage("webrtcdev-extension-presence", "*"),
        setTimeout(function() {
            callback("screen" == chromeMediaSource ? !1 : !0)
        }, 2e3)
    }
}

/**
 * function to find if chromeMedia source is desktop or screen
 * @method
 * @name isChromeExtensionAvailable
 * @param {function} callback
 */
function webrtcdevPrepareScreenShare(callback){
    var time            = new Date().getUTCMilliseconds(); 
    if(screenRoomid == null)
        screenRoomid    = "screenshare"+"_"+sessionid+"_"+time;

    webrtcdev.log(" webrtcdevPrepareScreenShare" + screenRoomid);
    webrtcdev.log(" Screenshare ||  filling up iceServers " , turn , webrtcdevIceServers);

    scrConn  = new RTCMultiConnection();
    if(turn && turn!='none'){
        if(!webrtcdevIceServers) {
            alert("ICE server not found yet in screenshare session ");
        }
        scrConn.iceServers  = webrtcdevIceServers;      
    }  
    
    scrConn.channel     = screenRoomid,
    scrConn.socketURL   = socketAddr,
    scrConn.session = {
        screen: true,
        oneway: true
    },
    scrConn.sdpConstraints.mandatory = {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: true
    },
    scrConn.dontCaptureUserMedia = false,

    scrConn.onMediaError = function(error, constraints) {
        webrtcdev.error(error, constraints);
        shownotificationWarning(error.name);
    },

    scrConn.onstream = function(event) {
        webrtcdev.log(" on stream in _screenshare :" , event);
        //if(event.stream.isScreen){
            if(event.type=="remote" && event.type!="local"){
                //alert("started streaming remote's screen");

                var userid=event.userid;
                var type=event.type;
                var stream=event.stream;
                if(event.stream.streamid){
                    webrtcdev.log("remote screen event.stream.streamId " + event.stream.streamId);
                    screenStreamId=event.stream.streamid;                    
                }else if(event.streamid){
                    webrtcdev.log("remote screen event.streamid " + event.streamid);
                    screenStreamId=event.streamid;  
                }

                var video = document.createElement('video');
                //video.autoplay="autoplay";
                attachMediaStream(video, stream);
                //video.id = peerInfo.videoContainer;
                document.getElementById(screenshareobj.screenshareContainer).appendChild(video);
                document.getElementById(screenshareobj.screenshareContainer).hidden=false;
                rtcConn.send({
                    type:"screenshare", 
                    screenid: screenRoomid,
                    message:"screenshareStartedViewing"
                });

            }else{
                webrtcdev.log("started streaming local screen");

                //screenshareNotification("","screenshareBegin"); 
                rtcConn.send({
                    type:"screenshare", 
                    screenid: screenRoomid,
                    screenStreamid: screenStreamId,
                    message:"startscreenshare"
                });

            }

            //createScreenViewButton();

            /*scrConn.videosContainer.appendChild(event.mediaElement);
            event.mediaElement.play();
            setTimeout(function() {
                event.mediaElement.play();
            }, 5000);*/
        //}
    },

    scrConn.onstreamended = function(event) {
        if(event)
            webrtcdev.log(" onstreamended in _screenshare :" , event);
    
        if(document.getElementById(screenshareobj.screenshareContainer)){
            document.getElementById(screenshareobj.screenshareContainer).innerHTML="";
        }

        scrConn.removeStream(screenStreamId);
        if(screenShareButton){
            screenShareButton.className = screenshareobj.button.shareButton.class_off;
            screenShareButton.innerHTML = screenshareobj.button.shareButton.html_off;
        }
        //removeScreenViewButton();
    };

    webrtcdev.log(" webrtcdevscreenshare calling callback for socket.io operations");
    alert(" Preparing Screenshare "+ screenRoomid);
    setTimeout(callback(screenRoomid), 3000);
}

function webrtcdevSharescreen() {
    webrtcdev.log("webrtcdevSharescreen . screenRoomid = " , screenRoomid );

    webrtcdevPrepareScreenShare(function(screenRoomid){

        var selfuserid="temp_"+(new Date().getUTCMilliseconds());
        scrConn.dontCaptureUserMedia = false,
        //scrConn.captureUserMedia();
        //scrConn.getUserMedia();
        scrConn.open(screenRoomid, function() {
            webrtcdev.log("Event : open-channel-screenshare" );
            socket.emit("open-channel-screenshare", {
                channel    : screenRoomid,
                sender     : selfuserid,
                maxAllowed : 6
            });

            shownotification(" Making a new session for screenshare"+screenRoomid);
        });

        socket.on("open-channel-screenshare-resp",function(event) {
            webrtcdev.log("Event Handler : open-channel-screenshare" , event);
            if(event) connectScrWebRTC("open" , screenRoomid, selfuserid, []); 
        });
    });
    /*    
    if(Object.keys(scrConn.streamEvents).length>2){   
        scrConn.addStream({
            screen: true,
            oneway: true
        });
        shownotification(" ReStarting Screenshare session "+roomid);
        rtcMultiConnection.send({
            type:"screenshare", 
            message:roomid
        });
        return ;
    }*/

    webrtcdev.log("webrtcdevscreenshare . srcConn = " , scrConn , " | rtcConn = " ,  rtcConn);
}

function connectScrWebRTC(type, channel , userid , remoteUsers){
    webrtcdev.log("connectScrWebRTC -> " , type, channel , userid , remoteUsers);
    if(type=="open"){
        scrConn.connect(screenRoomid);
        shownotification("Connected to "+ screenRoomid + " for screenshare ");
    }else if(type=="join"){
        scrConn.join(screenRoomid);
        shownotification("Connected with existing Screenshare channel "+ screenRoomid);
    }else{
        shownotification("Connection type not found for Screenshare ");
    }
}

function webrtcdevScreenConstraints(chromeMediaSourceId) {
    webrtcdev.log(" webrtcdevScreenConstraints  - chromeMediaSourceId: ", chromeMediaSourceId);
    screen_constraints = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: chromeMediaSourceId,
                        maxWidth: window.screen.width > 1920 ? window.screen.width : 1920,
                        maxHeight: window.screen.height > 1080 ? window.screen.height : 1080
                    },
                    optional: []
                }
            };
    
    /*    
    scrConn.getScreenConstraints = function(callback) {
        alert("getScreenConstraints");
        screen_constraints = scrConn.modifyScreenConstraints(screen_constraints);
        webrtcdev.log("screen_constraints", screen_constraints);
        callback(false, screen_constraints);
        return;
    };*/
    try {
        webrtcdev.log(" screen getusermedia ");
        navigator.getUserMedia(screen_constraints ,
            function stream(event) {
                webrtcdev.log("screen stream "  , event , screenshareobj.screenshareContainer);
                //scrConn.onstream(event);
                //screenStreamId = event.streamid;
                //var videosContainer = document.createElement("video");
                //videosContainer.src = window.URL.createObjectURL(event);
                //container.appendChild(videosContainer);
                //videosContainer.appendChild(event.mediaElement);
                var stream = event;
                screenShareStreamLocal = event;
                webrtcdev.log("Stream from getUserMedia" , stream);
                stream.type = "local",
                //scrConn.setStreamEndHandler(stream),
                getRMCMediaElement(stream, function(mediaElement) {
                    webrtcdev.log(" getRMCMediaElement Callback function --> " + stream.streamid +" .. " + stream.id);
                    if(stream.streamid){
                        webrtcdev.log("using streamid");
                        mediaElement.id = stream.streamid,
                        mediaElement.muted = !0,
                        mediaElement.volume = 0,
                        -1 === scrConn.attachStreams.indexOf(stream) && scrConn.attachStreams.push(stream),
                        "undefined" != typeof StreamsHandler && StreamsHandler.setHandlers(stream, !0, scrConn),
                        scrConn.streamEvents[stream.streamid] = {
                            stream: stream,
                            type: "local",
                            mediaElement: mediaElement,
                            userid: scrConn.userid,
                            extra: scrConn.extra,
                            streamid: stream.streamid,
                            blobURL: mediaElement.src || URL.createObjectURL(stream),
                            /*blobURL: mediaElement.src || mediaElement.srcObject ,*/
                            isAudioMuted: !0
                        };
                        scrConn.onstream(scrConn.streamEvents[stream.streamid])
                    }else if(stream.id){
                        webrtcdev.log("using id");
                        mediaElement.id = stream.id,
                        mediaElement.muted = !0,
                        mediaElement.volume = 0,
                        -1 === scrConn.attachStreams.indexOf(stream) && scrConn.attachStreams.push(stream),
                        "undefined" != typeof StreamsHandler && StreamsHandler.setHandlers(stream, !0, scrConn),
                        scrConn.streamEvents[stream.id] = {
                            stream: stream,
                            type: "local",
                            mediaElement: mediaElement,
                            userid: scrConn.userid,
                            extra: scrConn.extra,
                            streamid: stream.id,
                            blobURL: mediaElement.src || URL.createObjectURL(stream),
                            /*blobURL: mediaElement.src || mediaElement.srcObject ,*/
                            isAudioMuted: !0
                        };
                        webrtcdev.log(scrConn.streamEvents[stream.id]);
                        /*setHarkEvents(scrConn, scrConn.streamEvents[stream.streamid]),*/
                        /*setMuteHandlers(scrConn, scrConn.streamEvents[stream.streamid]),*/
                        scrConn.onstream(scrConn.streamEvents[stream.id])
                    }else{
                        alert("screenshare has neither streamid not id");
                    }
                }, scrConn);

            },
            function error(err) {
                webrtcdev.error(" Error in webrtcdevScreenConstraints " , err);
                if (isChrome && location.protocol === 'http:') {
                    alert('Please test this WebRTC experiment on HTTPS.');
                } else if(isChrome) {
                    alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
                } else if(!!navigator.mozGetUserMedia) {
                    alert(Firefox_Screen_Capturing_Warning);
                }
            }
        );
   }catch(e){
        webrtcdev.log(" Error in webrtcdevScreenConstraints " , err);
   }

}

function getRMCMediaElement(stream, callback, connection) {
    webrtcdev.log(" getRMCMediaElement "  , stream , connection);
    var isAudioOnly = !1;
    stream.getVideoTracks && !stream.getVideoTracks().length && (isAudioOnly = !0);
    var mediaElement = document.createElement(isAudioOnly ? "audio" : "video");
    /*        
    mediaElement[isFirefox ? "mozSrcObject" : "src"] = isFirefox ? stream : window.URL.createObjectURL(stream),
        [Deprecation] URL.createObjectURL with media streams is deprecated and will be removed in M68, around July 2018. 
        Please use HTMLMediaElement.srcObject instead. 
        See https://www.chromestatus.com/features/5618491470118912 for more details.*/

    return  ( 
        mediaElement["src"] = stream,
        mediaElement.controls = !0,
        isFirefox && mediaElement.addEventListener("ended", function() {
            if (currentUserMediaRequest.remove(stream.idInstance), "local" === stream.type) {
                StreamsHandler.onSyncNeeded(stream.streamid, "ended"),
                connection.attachStreams.forEach(function(aStream, idx) {
                    stream.streamid === aStream.streamid && delete connection.attachStreams[idx]
                });
                var newStreamsArray = [];
                connection.attachStreams.forEach(function(aStream) {
                    aStream && newStreamsArray.push(aStream)
                }),
                connection.attachStreams = newStreamsArray;
                var streamEvent = connection.streamEvents[stream.streamid];
                if (streamEvent)
                    return void connection.onstreamended(streamEvent);
                this.parentNode && this.parentNode.removeChild(this)
            }
        }, !1),
    mediaElement.play(),
    void callback(mediaElement))
}

function webrtcdevViewscreen(roomid){
    scrConn.join(roomid);
}

function webrtcdevStopShareScreen(){
    try{
        /*
        scrConn.removeStream({
            screen: true,  // it will remove all screen streams
            stop: true     // ask to stop old stream
        });*/
        if(screenshareobj.screenshareContainer)
            document.getElementById(screenshareobj.screenshareContainer).innerHTML="";

        rtcConn.send({
            type:"screenshare", 
            screenid: screenRoomid,
            screenStreamid:screenStreamId,
            message:"stoppedscreenshare"
        });

        window.postMessage("webrtcdev-extension-stopsource", "*");
        scrConn.onstreamended();
        scrConn.close();
        scrConn.closeEntireSession();
        webrtcdev.log("Sender stopped: screenRoomid "+ screenRoomid +" || Screen stoppped "  , scrConn , document.getElementById(screenshareobj.screenshareContainer));
        
        if(screenShareStreamLocal){
            screenShareStreamLocal.stop();
            screenShareStreamLocal=null;        
        }
        //scrConn.videosContainer.hidden=true;
        /*scrConn.leave();*/
        //removeScreenViewButton();

    }catch(e){
        webrtcdev.error(e);
    }
}

function createOrAssignScreenviewButton(){
    if(screenshareobj.button.viewButton.id && document.getElementById(screenshareobj.button.viewButton.id)) 
        assignScreenViewButton();
    else
        createScreenViewButton();
}

function createScreenViewButton(){
    if(document.getElementById("viewScreenShareButton"))
        return;
    var viewScreenShareButton= document.createElement("span");
    viewScreenShareButton.className=screenshareobj.button.viewButton.class_off;
    viewScreenShareButton.innerHTML=screenshareobj.button.viewButton.html_off;
    viewScreenShareButton.id="viewScreenShareButton";
    webrtcdevViewscreen(screenRoomid);
    viewScreenShareButton.onclick = function() {
        if(viewScreenShareButton.className==screenshareobj.button.viewButton.class_off){
            document.getElementById(screenshareobj.screenshareContainer).hidden=false;
            viewScreenShareButton.className=screenshareobj.button.viewButton.class_on;
            viewScreenShareButton.innerHTML=screenshareobj.button.viewButton.html_on;
        }else if(viewScreenShareButton.className==screenshareobj.button.viewButton.class_on){
            document.getElementById(screenshareobj.screenshareContainer).hidden=true;
            viewScreenShareButton.className=screenshareobj.button.viewButton.class_off;
            viewScreenShareButton.innerHTML=screenshareobj.button.viewButton.html_off;
        }
    };

    if(document.getElementById("topIconHolder_ul")){
        var li =document.createElement("li");
        li.appendChild(viewScreenShareButton);
        document.getElementById("topIconHolder_ul").appendChild(li);
    }
}

function assignScreenViewButton(){
    /*    
    if(document.getElementById(screenshareobj.button.viewButton.id))
        return;*/
    var button =document.getElementById(screenshareobj.button.viewButton.id);
    webrtcdevViewscreen(screenRoomid);
    button.onclick = function() {
        if(button.className==screenshareobj.button.viewButton.class_off){
            document.getElementById(screenshareobj.screenshareContainer).hidden=false;
            button.className=screenshareobj.button.viewButton.class_on;
            button.innerHTML=screenshareobj.button.viewButton.html_on;
        }else if(button.className==screenshareobj.button.viewButton.class_on){
            document.getElementById(screenshareobj.screenshareContainer).hidden=true;
            button.className=screenshareobj.button.viewButton.class_off;
            button.innerHTML=screenshareobj.button.viewButton.html_off;
        }
    };
}

function removeScreenViewButton(){
    if(document.getElementById("viewScreenShareButton")){
        var elem = document.getElementById("viewScreenShareButton");
        elem.parentElement.removeChild(elem);
    }
    return;
}

function createScreenInstallButton(extensionID){
    var button= document.createElement("span");
    button.className = screenshareobj.button.installButton.class_off;
    button.innerHTML = screenshareobj.button.installButton.html_off;
    button.id="screeninstallButton";
    button.onclick = function(e) {    
        chrome.webstore.install("https://chrome.google.com/webstore/detail/"+extensionID,
        function(){
            webrtcdev.log("Chrome extension inline installation - success . createOrAssignScreenshareButton with " , screenshareobj);
            button.hidden = true;
            getSourceId(function () { }, true);
            createOrAssignScreenshareButton(screenshareobj);

        },function (err){
            webrtcdev.log("Chrome extension inline installation - fail " , err);
        });
        // Prevent the opening of the Web Store page
        e.preventDefault();
    };
    var li =document.createElement("li");
    li.appendChild(button);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

function assignScreenInstallButton(extensionID) {
    var button = document.getElementById(screenshareobj.button.installButton.id);
    button.onclick= function(e) {    
        chrome.webstore.install("https://chrome.google.com/webstore/detail/"+extensionID,
            function(){
                webrtcdev.log("Chrome extension inline installation - success from assignScreenInstallButton . Now  createOrAssignScreenshareButton with " , screenshareobj);
                button.hidden = true;
                getSourceId(function () { }, true);
                createOrAssignScreenshareButton(screenshareobj);
            },function (e){
                webrtcdev.error("Chrome extension inline installation - fail " , e);
            });
        // Prevent the opening of the Web Store page
        e.preventDefault();
    }
}

function hideScreenInstallButton(){
    var button=document.getElementById(screenshareobj.button.installButton.id);
    button.hidden=true;
    button.setAttribute("style","display:none");
}

function createOrAssignScreenshareButton(screenshareobj){
    if(screenshareobj.button.shareButton.id && document.getElementById(screenshareobj.button.shareButton.id)) {
        assignScreenShareButton();
        hideScreenInstallButton();
        showScreenShareButton();
    }    
    else{
        createScreenShareButton();
    }
}

function createScreenshareButton(){
    screenShareButton= document.createElement("span");
    screenShareButton.className = screenshareobj.button.shareButton.class_off;
    screenShareButton.innerHTML = screenshareobj.button.shareButton.html_off;
    screenShareButton.id="screenShareButton";
    screenShareButton.onclick = function(event) {    
        if(screenShareButton.className==screenshareobj.button.shareButton.class_off){
            webrtcdevSharescreen();
            screenShareButton.className=screenshareobj.button.shareButton.class_on;
            screenShareButton.innerHTML=screenshareobj.button.shareButton.html_on;
        }else if(screenShareButton.className==screenshareobj.button.shareButton.class_on){
            screenShareButton.className=screenshareobj.button.shareButton.class_off;
            screenShareButton.innerHTML=screenshareobj.button.shareButton.html_off;
            webrtcdevStopShareScreen();
        }
    };
    var li =document.createElement("li");
    li.appendChild(screenShareButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
    return screenShareButton;
}

function assignScreenShareButton(){
    var button = document.getElementById(screenshareobj.button.shareButton.id);
    button.onclick = function(event) {
        if(button.className == screenshareobj.button.shareButton.class_off){
            webrtcdevSharescreen();
            button.className = screenshareobj.button.shareButton.class_on;
            button.innerHTML = screenshareobj.button.shareButton.html_on;
        }else{
            button.className = screenshareobj.button.shareButton.class_off;
            button.innerHTML = screenshareobj.button.shareButton.html_off;
            webrtcdevStopShareScreen();
        }
    }
    return button;
}

function hideScreenShareButton(){
    var button=document.getElementById(screenshareobj.button.shareButton.id);
    button.hidden=true;
    button.setAttribute("style","display:none");
}

function showScreenShareButton(){
    var button=document.getElementById(screenshareobj.button.shareButton.id);
    button.removeAttribute("hidden");
    button.setAttribute("style","display:block");
}

/*
//shifted to start.js
window.addEventListener('message', onScreenshareExtensionCallback);*/

function onScreenshareExtensionCallback(event){
    webrtcdev.log("onScreenshareExtensionCallback" , event);

    if (event.data.chromeExtensionStatus) {
       webrtcdev.log(event.data.chromeExtensionStatus);
    }

    if (event.data.sourceId) {
        if (event.data.sourceId === 'PermissionDeniedError') {
            webrtcdev.error('permission-denied');
        } else{
            webrtcdevScreenConstraints(event.data.sourceId);
        }
    }
}

function detectExtension(extensionID , callback){
    webrtcdev.log("detectExtension  ", extensionID);
    getChromeExtensionStatus(extensionID, function (status) {  
        //log sttaus 
        webrtcdev.log("status extension ", status);
        //reset extension's local storage objects 
        webrtcdev.log("reset extension ", extensionID);
        if (status !="not-installed")
            window.postMessage("reset-webrtcdev-extension", "*");
        callback(status);
    });
}


function showSrcConn(){
    webrtcdev.log(" srcConn : "  , srcConn);
    webrtcdev.log(" srcConn.peers.getAllParticipants() : " , srcConn.peers.getAllParticipants());
}


var counterBeforeFailureNotice=0;
function screenshareNotification(message , type){

    if(document.getElementById("alertBox")){
        
        document.getElementById("alertBox").innerHTML="";

        if(type=="screenshareBegin"){

            var alertDiv =document.createElement("div");
            document.getElementById("alertBox").hidden=false;
            document.getElementById("alertBox").innerHTML="";
            alertDiv.className="alert alert-info";
            alertDiv.innerHTML='<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+ "You have begun sharing screen , waiting for peer to view";
            document.getElementById("alertBox").appendChild(alertDiv);

            setTimeout(function() {
                var alertDiv = document.createElement("div");
                document.getElementById("alertBox").hidden=false;
                document.getElementById("alertBox").innerHTML="";
                alertDiv.className="alert alert-danger";
                alertDiv.innerHTML='<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+ "Peer was not able to view screen , please retry";
                document.getElementById("alertBox").appendChild(alertDiv);
            }, 20000);

        }else if(type=="screenshareStartedViewing"){
                
            var alertDiv =document.createElement("div");
            document.getElementById("alertBox").hidden=false;
            document.getElementById("alertBox").innerHTML="";
            alertDiv.className="alert alert-success";
            alertDiv.innerHTML='<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+ "Peer has started viewing screen ";        
            document.getElementById("alertBox").appendChild(alertDiv);

        }else if(type=="screenshareError"){

            var alertDiv = document.createElement("div");
            document.getElementById("alertBox").hidden=false;
            document.getElementById("alertBox").innerHTML="";
            alertDiv.className="alert alert-danger";
            alertDiv.innerHTML='<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+ "There was a error while sharing screen , please contact support ";
            document.getElementById("alertBox").appendChild(alertDiv);

        }else{
            // Handle these msgs too : TBD
        }

    }else{
        alert(message);
    }

}

function createExtensionInstallWindow (){
    try{
        var modalBox = document.createElement("div");
        modalBox.className = "modal fade";
        modalBox.setAttribute("role", "dialog");
        modalBox.id = "screensharedialog";

        var modalinnerBox = document.createElement("div");
        modalinnerBox.className = "modal-dialog";

        var modal = document.createElement("div");
        modal.className = "modal-content";

        var modalheader = document.createElement("div");
        modalheader.className = "modal-header";

        var closeButton = document.createElement("button");
        closeButton.className = "close";
        closeButton.setAttribute("data-dismiss", "modal");
        closeButton.innerHTML = "&times;";

        var title = document.createElement("h4");
        title.className = "modal-title";
        title.innerHTML = "Install extension";

        modalheader.appendChild(title);
        modalheader.appendChild(closeButton);


        var modalbody = document.createElement("div");
        modalbody.className = "modal-body";

        var div = document.createElement("div");
        div.innerHTML = "install screen share extension ";

        var button = document.createElement("button");
        button.innerHTML = " Install ";
        button.onclick = function (e) {
            chrome.webstore.install("https://chrome.google.com/webstore/detail/" + screenshareobj.extensionID,
                function () {
                    webrtcdev.log("Chrome extension inline installation - success from assignScreenInstallButton . Now  createOrAssignScreenshareButton with ", screenshareobj);
                    window.location.reload();
                }, function (e) {
                    webrtcdev.error("Chrome extension inline installation - fail ", e);
                });
            // Prevent the opening of the Web Store page
            e.preventDefault();
        };

        modalbody.appendChild(div);
        modalbody.appendChild(button);

        modal.appendChild(modalheader);
        modal.appendChild(modalbody);

        modalinnerBox.appendChild(modal);
        modalBox.appendChild(modalinnerBox);

        if(document.getElementById("mainDiv")){
            var mainDiv = document.getElementById("mainDiv");
            mainDiv.appendChild(modalBox);

            //document.getElementById("screensharedialog").showModal();
            $("#screensharedialog").modal("show");            
        }

    }catch(e){
        webrtcdev.error("[ createExtensionInstallWindow - Screenshare.js]" , e); 
    }
                                
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */var WebRTCdetect=function() {

    'use strict';

    var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

    (function(that) {
        if (typeof window !== 'undefined') {
            return;
        }

        if (typeof window === 'undefined' && typeof global !== 'undefined') {
            global.navigator = {
                userAgent: browserFakeUserAgent,
                getUserMedia: function() {}
            };

            /*global window:true */
            that.window = global;
        } else if (typeof window === 'undefined') {
            // window = this;
        }

        if (typeof document === 'undefined') {
            /*global document:true */
            that.document = {};

            document.createElement = document.captureStream = document.mozCaptureStream = function() {
                return {};
            };
        }

        if (typeof location === 'undefined') {
            /*global location:true */
            that.location = {
                protocol: 'file:',
                href: '',
                hash: ''
            };
        }

        if (typeof screen === 'undefined') {
            /*global screen:true */
            that.screen = {
                width: 0,
                height: 0
            };
        }
    })(typeof global !== 'undefined' ? global : window);

    /*global navigator:true */
    var navigator = window.navigator;

    if (typeof navigator !== 'undefined') {
        if (typeof navigator.webkitGetUserMedia !== 'undefined') {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
        }

        if (typeof navigator.mozGetUserMedia !== 'undefined') {
            navigator.getUserMedia = navigator.mozGetUserMedia;
        }
    } else {
        navigator = {
            getUserMedia: function() {},
            userAgent: browserFakeUserAgent
        };
    }

    var isMobileDevice = !!(/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent || ''));

    var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);

    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof window.InstallTrigger !== 'undefined';
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    var isChrome = !!window.chrome && !isOpera;
    var isIE = !!document.documentMode && !isEdge;

    // this one can also be used:
    // https://www.websocket.org/js/stuff.js (DetectBrowser.js)

    function getBrowserInfo() {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // In Opera, the true version is after 'Opera' or after 'Version'
        if (isOpera) {
            browserName = 'Opera';
            try {
                fullVersion = navigator.userAgent.split('OPR/')[1].split(' ')[0];
                majorVersion = fullVersion.split('.')[0];
            } catch (e) {
                fullVersion = '0.0.0.0';
                majorVersion = 0;
            }
        }
        // In MSIE, the true version is after 'MSIE' in userAgent
        else if (isIE) {
            verOffset = nAgt.indexOf('MSIE');
            browserName = 'IE';
            fullVersion = nAgt.substring(verOffset + 5);
        }
        // In Chrome, the true version is after 'Chrome' 
        else if (isChrome) {
            verOffset = nAgt.indexOf('Chrome');
            browserName = 'Chrome';
            fullVersion = nAgt.substring(verOffset + 7);
        }
        // In Safari, the true version is after 'Safari' or after 'Version' 
        else if (isSafari) {
            verOffset = nAgt.indexOf('Safari');
            browserName = 'Safari';
            fullVersion = nAgt.substring(verOffset + 7);

            if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }
        }
        // In Firefox, the true version is after 'Firefox' 
        else if (isFirefox) {
            verOffset = nAgt.indexOf('Firefox');
            browserName = 'Firefox';
            fullVersion = nAgt.substring(verOffset + 8);
        }

        // In most other browsers, 'name/version' is at the end of userAgent 
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);

            if (browserName.toLowerCase() === browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }

        if (isEdge) {
            browserName = 'Edge';
            // fullVersion = navigator.userAgent.split('Edge/')[1];
            fullVersion = parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10).toString();
        }

        // trim the fullVersion string at semicolon/space if present
        if ((ix = fullVersion.indexOf(';')) !== -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        if ((ix = fullVersion.indexOf(' ')) !== -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt('' + fullVersion, 10);

        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        return {
            fullVersion: fullVersion,
            version: majorVersion,
            name: browserName,
            isPrivateBrowsing: false
        };
    }

    // via: https://gist.github.com/cou929/7973956

    function retry(isDone, next) {
        var currentTrial = 0,
            maxRetry = 50,
            interval = 10,
            isTimeout = false;
        var id = window.setInterval(
            function() {
                if (isDone()) {
                    window.clearInterval(id);
                    next(isTimeout);
                }
                if (currentTrial++ > maxRetry) {
                    window.clearInterval(id);
                    isTimeout = true;
                    next(isTimeout);
                }
            },
            10
        );
    }

    function isIE10OrLater(userAgent) {
        var ua = userAgent.toLowerCase();
        if (ua.indexOf('msie') === 0 && ua.indexOf('trident') === 0) {
            return false;
        }
        var match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
        if (match && parseInt(match[1], 10) >= 10) {
            return true;
        }
        return false;
    }

    function detectPrivateMode(callback) {
        var isPrivate;

        if (window.webkitRequestFileSystem) {
            window.webkitRequestFileSystem(
                window.TEMPORARY, 1,
                function() {
                    isPrivate = false;
                },
                function(e) {
                    webrtcdev.log(e);
                    isPrivate = true;
                }
            );
        } else if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
            var db;
            try {
                db = window.indexedDB.open('test');
            } catch (e) {
                isPrivate = true;
            }

            if (typeof isPrivate === 'undefined') {
                retry(
                    function isDone() {
                        return db.readyState === 'done' ? true : false;
                    },
                    function next(isTimeout) {
                        if (!isTimeout) {
                            isPrivate = db.result ? false : true;
                        }
                    }
                );
            }
        } else if (isIE10OrLater(window.navigator.userAgent)) {
            isPrivate = false;
            try {
                if (!window.indexedDB) {
                    isPrivate = true;
                }
            } catch (e) {
                isPrivate = true;
            }
        } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
            try {
                window.localStorage.setItem('test', 1);
            } catch (e) {
                isPrivate = true;
            }

            if (typeof isPrivate === 'undefined') {
                isPrivate = false;
                window.localStorage.removeItem('test');
            }
        }

        retry(
            function isDone() {
                return typeof isPrivate !== 'undefined' ? true : false;
            },
            function next(isTimeout) {
                callback(isPrivate);
            }
        );
    }

    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry|BB10/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        },
        getOsName: function() {
            var osName = 'Unknown OS';
            if (isMobile.Android()) {
                osName = 'Android';
            }

            if (isMobile.BlackBerry()) {
                osName = 'BlackBerry';
            }

            if (isMobile.iOS()) {
                osName = 'iOS';
            }

            if (isMobile.Opera()) {
                osName = 'Opera Mini';
            }

            if (isMobile.Windows()) {
                osName = 'Windows';
            }

            return osName;
        }
    };

    // via: http://jsfiddle.net/ChristianL/AVyND/
    function detectDesktopOS() {
        var unknown = '-';

        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;

        var os = unknown;
        var clientStrings = [{
            s: 'Windows 10',
            r: /(Windows 10.0|Windows NT 10.0)/
        }, {
            s: 'Windows 8.1',
            r: /(Windows 8.1|Windows NT 6.3)/
        }, {
            s: 'Windows 8',
            r: /(Windows 8|Windows NT 6.2)/
        }, {
            s: 'Windows 7',
            r: /(Windows 7|Windows NT 6.1)/
        }, {
            s: 'Windows Vista',
            r: /Windows NT 6.0/
        }, {
            s: 'Windows Server 2003',
            r: /Windows NT 5.2/
        }, {
            s: 'Windows XP',
            r: /(Windows NT 5.1|Windows XP)/
        }, {
            s: 'Windows 2000',
            r: /(Windows NT 5.0|Windows 2000)/
        }, {
            s: 'Windows ME',
            r: /(Win 9x 4.90|Windows ME)/
        }, {
            s: 'Windows 98',
            r: /(Windows 98|Win98)/
        }, {
            s: 'Windows 95',
            r: /(Windows 95|Win95|Windows_95)/
        }, {
            s: 'Windows NT 4.0',
            r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
        }, {
            s: 'Windows CE',
            r: /Windows CE/
        }, {
            s: 'Windows 3.11',
            r: /Win16/
        }, {
            s: 'Android',
            r: /Android/
        }, {
            s: 'Open BSD',
            r: /OpenBSD/
        }, {
            s: 'Sun OS',
            r: /SunOS/
        }, {
            s: 'Linux',
            r: /(Linux|X11)/
        }, {
            s: 'iOS',
            r: /(iPhone|iPad|iPod)/
        }, {
            s: 'Mac OS X',
            r: /Mac OS X/
        }, {
            s: 'Mac OS',
            r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
        }, {
            s: 'QNX',
            r: /QNX/
        }, {
            s: 'UNIX',
            r: /UNIX/
        }, {
            s: 'BeOS',
            r: /BeOS/
        }, {
            s: 'OS/2',
            r: /OS\/2/
        }, {
            s: 'Search Bot',
            r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
        }];
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            if (/Windows (.*)/.test(os)) {
                osVersion = /Windows (.*)/.exec(os)[1];
            }
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS X':
                if (/Mac OS X (10[\.\_\d]+)/.test(nAgt)) {
                    osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                }
                break;
            case 'Android':
                if (/Android ([\.\_\d]+)/.test(nAgt)) {
                    osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                }
                break;
            case 'iOS':
                if (/OS (\d+)_(\d+)_?(\d+)?/.test(nAgt)) {
                    osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                    osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                }
                break;
        }

        return {
            osName: os,
            osVersion: osVersion
        };
    }

    var osName = 'Unknown OS';
    var osVersion = 'Unknown OS Version';

    if (isMobile.any()) {
        osName = isMobile.getOsName();
    } else {
        var osInfo = detectDesktopOS();
        osName = osInfo.osName;
        osVersion = osInfo.osVersion;
    }

    var isCanvasSupportsStreamCapturing = false;
    var isVideoSupportsStreamCapturing = false;
    ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].forEach(function(item) {
        if (!isCanvasSupportsStreamCapturing && item in document.createElement('canvas')) {
            isCanvasSupportsStreamCapturing = true;
        }

        if (!isVideoSupportsStreamCapturing && item in document.createElement('video')) {
            isVideoSupportsStreamCapturing = true;
        }
    });

    // via: https://github.com/diafygi/webrtc-ips
    function DetectLocalIPAddress(callback) {
        if (!DetectRTC.isWebRTCSupported) {
            return;
        }

        if (DetectRTC.isORTCSupported) {
            return;
        }

        getIPs(function(ip) {
            //local IPs
            if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)) {
                callback('Local: ' + ip);
            }

            //assume the rest are public IPs
            else {
                callback('Public: ' + ip);
            }
        });
    }

    //get the IP addresses associated with an account
    function getIPs(callback) {
        var ipDuplicates = {};

        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        // bypass naive webrtc blocking using an iframe
        if (!RTCPeerConnection) {
            var iframe = document.getElementById('iframe');
            if (!iframe) {
                //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
                throw 'NOTE: you need to have an iframe in the page right above the script tag.';
            }
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        // if still no RTCPeerConnection then it is not supported by the browser so just return
        if (!RTCPeerConnection) {
            return;
        }

        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{
                RtpDataChannels: true
            }]
        };

        //firefox already has a default stun server in about:config
        //    media.peerconnection.default_iceservers =
        //    [{"url": "stun:stun.services.mozilla.com"}]
        var servers;

        //add same stun server for chrome
        if (useWebKit) {
            servers = {
                iceServers: [{
                    urls: 'stun:stun.services.mozilla.com'
                }]
            };

            if (typeof DetectRTC !== 'undefined' && DetectRTC.browser.isFirefox && DetectRTC.browser.version <= 38) {
                servers[0] = {
                    url: servers[0].urls
                };
            }
        }

        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate) {
            //match just the IP address
            var ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
            var match = ipRegex.exec(candidate);
            if (!match) {
                webrtcdev.warn('Could not match IP address in', candidate);
                return;
            }
            var ipAddress = match[1];

            //remove duplicates
            if (ipDuplicates[ipAddress] === undefined) {
                callback(ipAddress);
            }

            ipDuplicates[ipAddress] = true;
        }

        //listen for candidate events
        pc.onicecandidate = function(ice) {
            //skip non-candidate events
            if (ice.candidate) {
                handleCandidate(ice.candidate.candidate);
            }
        };

        //create a bogus data channel
        pc.createDataChannel('');

        //create an offer sdp
        pc.createOffer(function(result) {

            //trigger the stun server request
            pc.setLocalDescription(result, function() {}, function() {});

        }, function() {});

        //wait for a while to let everything done
        setTimeout(function() {
            //read candidate info from local description
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function(line) {
                if (line.indexOf('a=candidate:') === 0) {
                    handleCandidate(line);
                }
            });
        }, 1000);
    }

    var MediaDevices = [];

    var audioInputDevices = [];
    var audioOutputDevices = [];
    var videoInputDevices = [];

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // Firefox 38+ seems having support of enumerateDevices
        // Thanks @xdumaine/enumerateDevices
        navigator.enumerateDevices = function(callback) {
            navigator.mediaDevices.enumerateDevices().then(callback).catch(function() {
                callback([]);
            });
        };
    }

    // Media Devices detection
    var canEnumerate = false;

    /*global MediaStreamTrack:true */
    if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
        canEnumerate = true;
    } else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
        canEnumerate = true;
    }

    var hasMicrophone = false;
    var hasSpeakers = false;
    var hasWebcam = false;

    var isWebsiteHasMicrophonePermissions = false;
    var isWebsiteHasWebcamPermissions = false;

    // http://dev.w3.org/2011/webrtc/editor/getusermedia.html#mediadevices
    function checkDeviceSupport(callback) {
        if (!canEnumerate) {
            if (callback) {
                callback();
            }
            return;
        }

        if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
            navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
        }

        if (!navigator.enumerateDevices && navigator.enumerateDevices) {
            navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
        }

        if (!navigator.enumerateDevices) {
            if (callback) {
                callback();
            }
            return;
        }

        MediaDevices = [];

        audioInputDevices = [];
        audioOutputDevices = [];
        videoInputDevices = [];

        navigator.enumerateDevices(function(devices) {
            devices.forEach(function(_device) {
                var device = {};
                for (var d in _device) {
                    device[d] = _device[d];
                }

                // if it is MediaStreamTrack.getSources
                if (device.kind === 'audio') {
                    device.kind = 'audioinput';
                }

                if (device.kind === 'video') {
                    device.kind = 'videoinput';
                }

                var skip;
                MediaDevices.forEach(function(d) {
                    if (d.id === device.id && d.kind === device.kind) {
                        skip = true;
                    }
                });

                if (skip) {
                    return;
                }

                if (!device.deviceId) {
                    device.deviceId = device.id;
                }

                if (!device.id) {
                    device.id = device.deviceId;
                }

                if (!device.label) {
                    device.label = 'Please invoke getUserMedia once.';
                    if (location.protocol !== 'https:') {
                        if (document.domain.search && document.domain.search(/localhost|127.0./g) === -1) {
                            device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
                        }
                    }
                } else {
                    if (device.kind === 'videoinput' && !isWebsiteHasWebcamPermissions) {
                        isWebsiteHasWebcamPermissions = true;
                    }

                    if (device.kind === 'audioinput' && !isWebsiteHasMicrophonePermissions) {
                        isWebsiteHasMicrophonePermissions = true;
                    }
                }

                if (device.kind === 'audioinput') {
                    hasMicrophone = true;

                    if (audioInputDevices.indexOf(device) === -1) {
                        audioInputDevices.push(device);
                    }
                }

                if (device.kind === 'audiooutput') {
                    hasSpeakers = true;

                    if (audioOutputDevices.indexOf(device) === -1) {
                        audioOutputDevices.push(device);
                    }
                }

                if (device.kind === 'videoinput') {
                    hasWebcam = true;

                    if (videoInputDevices.indexOf(device) === -1) {
                        videoInputDevices.push(device);
                    }
                }

                // there is no 'videoouput' in the spec.

                if (MediaDevices.indexOf(device) === -1) {
                    MediaDevices.push(device);
                }
            });

            if (typeof DetectRTC !== 'undefined') {
                // to sync latest outputs
                DetectRTC.MediaDevices = MediaDevices;
                DetectRTC.hasMicrophone = hasMicrophone;
                DetectRTC.hasSpeakers = hasSpeakers;
                DetectRTC.hasWebcam = hasWebcam;

                DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
                DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

                DetectRTC.audioInputDevices = audioInputDevices;
                DetectRTC.audioOutputDevices = audioOutputDevices;
                DetectRTC.videoInputDevices = videoInputDevices;
            }

            if (callback) {
                callback();
            }
        });
    }

    // check for microphone/camera support!
    checkDeviceSupport();

    var DetectRTC = window.DetectRTC || {};

    // ----------
    // DetectRTC.browser.name || DetectRTC.browser.version || DetectRTC.browser.fullVersion
    DetectRTC.browser = getBrowserInfo();

    detectPrivateMode(function(isPrivateBrowsing) {
        DetectRTC.browser.isPrivateBrowsing = !!isPrivateBrowsing;
    });

    // DetectRTC.isChrome || DetectRTC.isFirefox || DetectRTC.isEdge
    DetectRTC.browser['is' + DetectRTC.browser.name] = true;

    var isNodeWebkit = !!(window.process && (typeof window.process === 'object') && window.process.versions && window.process.versions['node-webkit']);

    // --------- Detect if system supports WebRTC 1.0 or WebRTC 1.1.
    var isWebRTCSupported = false;
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function(item) {
        if (isWebRTCSupported) {
            return;
        }

        if (item in window) {
            isWebRTCSupported = true;
        }
    });
    DetectRTC.isWebRTCSupported = isWebRTCSupported;

    //-------
    DetectRTC.isORTCSupported = typeof RTCIceGatherer !== 'undefined';

    // --------- Detect if system supports screen capturing API
    var isScreenCapturingSupported = false;
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version >= 35) {
        isScreenCapturingSupported = true;
    } else if (DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 34) {
        isScreenCapturingSupported = true;
    }

    if (location.protocol !== 'https:') {
        isScreenCapturingSupported = false;
    }
    DetectRTC.isScreenCapturingSupported = isScreenCapturingSupported;

    // --------- Detect if WebAudio API are supported
    var webAudio = {
        isSupported: false,
        isCreateMediaStreamSourceSupported: false
    };

    ['AudioContext', 'webkitAudioContext', 'mozAudioContext', 'msAudioContext'].forEach(function(item) {
        if (webAudio.isSupported) {
            return;
        }

        if (item in window) {
            webAudio.isSupported = true;

            if ('createMediaStreamSource' in window[item].prototype) {
                webAudio.isCreateMediaStreamSourceSupported = true;
            }
        }
    });
    DetectRTC.isAudioContextSupported = webAudio.isSupported;
    DetectRTC.isCreateMediaStreamSourceSupported = webAudio.isCreateMediaStreamSourceSupported;

    // ---------- Detect if SCTP/RTP channels are supported.

    var isRtpDataChannelsSupported = false;
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version > 31) {
        isRtpDataChannelsSupported = true;
    }
    DetectRTC.isRtpDataChannelsSupported = isRtpDataChannelsSupported;

    var isSCTPSupportd = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version > 28) {
        isSCTPSupportd = true;
    } else if (DetectRTC.browser.isChrome && DetectRTC.browser.version > 25) {
        isSCTPSupportd = true;
    } else if (DetectRTC.browser.isOpera && DetectRTC.browser.version >= 11) {
        isSCTPSupportd = true;
    }
    DetectRTC.isSctpDataChannelsSupported = isSCTPSupportd;

    // ---------

    DetectRTC.isMobileDevice = isMobileDevice; // "isMobileDevice" boolean is defined in "getBrowserInfo.js"

    // ------
    var isGetUserMediaSupported = false;
    if (navigator.getUserMedia) {
        isGetUserMediaSupported = true;
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        isGetUserMediaSupported = true;
    }
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && location.protocol !== 'https:') {
        DetectRTC.isGetUserMediaSupported = 'Requires HTTPs';
    }
    DetectRTC.isGetUserMediaSupported = isGetUserMediaSupported;

    // -----------
    DetectRTC.osName = osName;
    DetectRTC.osVersion = osVersion;

    var displayResolution = '';
    if (screen.width) {
        var width = (screen.width) ? screen.width : '';
        var height = (screen.height) ? screen.height : '';
        displayResolution += '' + width + ' x ' + height;
    }
    DetectRTC.displayResolution = displayResolution;

    // ----------
    DetectRTC.isCanvasSupportsStreamCapturing = isCanvasSupportsStreamCapturing;
    DetectRTC.isVideoSupportsStreamCapturing = isVideoSupportsStreamCapturing;

    // ------
    DetectRTC.DetectLocalIPAddress = DetectLocalIPAddress;

    DetectRTC.isWebSocketsSupported = 'WebSocket' in window && 2 === window.WebSocket.CLOSING;
    DetectRTC.isWebSocketsBlocked = !DetectRTC.isWebSocketsSupported;

    DetectRTC.checkWebSocketsSupport = function(callback) {
        callback = callback || function() {};
        try {
            var websocket = new WebSocket('wss://echo.websocket.org:443/');
            websocket.onopen = function() {
                DetectRTC.isWebSocketsBlocked = false;
                callback();
                websocket.close();
                websocket = null;
            };
            websocket.onerror = function() {
                DetectRTC.isWebSocketsBlocked = true;
                callback();
            };
        } catch (e) {
            DetectRTC.isWebSocketsBlocked = true;
            callback();
        }
    };

    // -------
    DetectRTC.load = function(callback) {
        callback = callback || function() {};
        checkDeviceSupport(callback);
    };

    DetectRTC.MediaDevices = MediaDevices;
    DetectRTC.hasMicrophone = hasMicrophone;
    DetectRTC.hasSpeakers = hasSpeakers;
    DetectRTC.hasWebcam = hasWebcam;

    DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
    DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

    DetectRTC.audioInputDevices = audioInputDevices;
    DetectRTC.audioOutputDevices = audioOutputDevices;
    DetectRTC.videoInputDevices = videoInputDevices;

    // ------
    var isSetSinkIdSupported = false;
    if ('setSinkId' in document.createElement('video')) {
        isSetSinkIdSupported = true;
    }
    DetectRTC.isSetSinkIdSupported = isSetSinkIdSupported;

    // -----
    var isRTPSenderReplaceTracksSupported = false;
    if (DetectRTC.browser.isFirefox && typeof mozRTCPeerConnection !== 'undefined' /*&& DetectRTC.browser.version > 39*/ ) {
        /*global mozRTCPeerConnection:true */
        if ('getSenders' in mozRTCPeerConnection.prototype) {
            isRTPSenderReplaceTracksSupported = true;
        }
    } else if (DetectRTC.browser.isChrome && typeof webkitRTCPeerConnection !== 'undefined') {
        /*global webkitRTCPeerConnection:true */
        if ('getSenders' in webkitRTCPeerConnection.prototype) {
            isRTPSenderReplaceTracksSupported = true;
        }
    }
    DetectRTC.isRTPSenderReplaceTracksSupported = isRTPSenderReplaceTracksSupported;

    //------
    var isRemoteStreamProcessingSupported = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version > 38) {
        isRemoteStreamProcessingSupported = true;
    }
    DetectRTC.isRemoteStreamProcessingSupported = isRemoteStreamProcessingSupported;

    //-------
    var isApplyConstraintsSupported = false;

    /*global MediaStreamTrack:true */
    if (typeof MediaStreamTrack !== 'undefined' && 'applyConstraints' in MediaStreamTrack.prototype) {
        isApplyConstraintsSupported = true;
    }
    DetectRTC.isApplyConstraintsSupported = isApplyConstraintsSupported;

    //-------
    var isMultiMonitorScreenCapturingSupported = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 43) {
        // version 43 merely supports platforms for multi-monitors
        // version 44 will support exact multi-monitor selection i.e. you can select any monitor for screen capturing.
        isMultiMonitorScreenCapturingSupported = true;
    }
    DetectRTC.isMultiMonitorScreenCapturingSupported = isMultiMonitorScreenCapturingSupported;

    DetectRTC.isPromisesSupported = !!('Promise' in window);

    if (typeof DetectRTC === 'undefined') {
        window.DetectRTC = {};
    }

    var MediaStream = window.MediaStream;

    if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
        MediaStream = webkitMediaStream;
    }

    if (typeof MediaStream !== 'undefined') {
        DetectRTC.MediaStream = Object.keys(MediaStream.prototype);
    } else DetectRTC.MediaStream = false;

    if (typeof MediaStreamTrack !== 'undefined') {
        DetectRTC.MediaStreamTrack = Object.keys(MediaStreamTrack.prototype);
    } else DetectRTC.MediaStreamTrack = false;

    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    if (typeof RTCPeerConnection !== 'undefined') {
        DetectRTC.RTCPeerConnection = Object.keys(RTCPeerConnection.prototype);
    } else DetectRTC.RTCPeerConnection = false;

    window.DetectRTC = DetectRTC;

    if (typeof module !== 'undefined' /* && !!module.exports*/ ) {
        module.exports = DetectRTC;
    }

    if (typeof define === 'function' && define.amd) {
        define('DetectRTC', [], function() {
            return DetectRTC;
        });
    }
};
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//**
 * function to check devices like speakers , webcam ,  microphone etc
 * @method
 * @name checkDevices
 * @param {object} connection
 */
function checkDevices(obj){

    if(obj.hasMicrophone) {
        // seems current system has at least one audio input device
        webrtcdev.log("has Microphone");
    }else{
        webrtcdev.log("doesnt have  hasMicrophone");
    }

    if(obj.hasSpeakers) {
        webrtcdev.log("has Speakers");
        // seems current system has at least one audio output device
    }else{
        webrtcdev.log("doesnt have  Speakers");
    }

    if(obj.hasWebcam) {
        webrtcdev.log("has Webcam");
        // seems current system has at least one video input device
    }else{
        webrtcdev.log("doesnt have Webcam");
    }
}

/**
 * function to check browser support for webrtc apis
 * @name checkWebRTCSupport
 * @param {object} connection
 */
function checkWebRTCSupport(obj){

    webrtcdev.log(" Browser " , obj.browser.name + obj.browser.fullVersion );

    if(obj.isWebRTCSupported) {
    // seems WebRTC compatible client
    }

    if(obj.isAudioContextSupported) {
        // seems Web-Audio compatible client
    }

    if(obj.isScreenCapturingSupported) {
        // seems WebRTC screen capturing feature is supported on this client
    }

    if(obj.isSctpDataChannelsSupported) {
        // seems WebRTC SCTP data channels feature are supported on this client
    }

    if(obj.isRtpDataChannelsSupported) {
        // seems WebRTC (old-fashioned) RTP data channels feature are supported on this client
    }


        webrtcdev.log(" Audio Input Device " );
        // for( x in detectRTC.audioInputDevices) 
        console.log(obj.audioInputDevices);

        webrtcdev.log(" Audio Output Device " );
        for( x in obj.audioOutputDevices) webrtcdev.log(x);        

        webrtcdev.log(" Video Input Device " );
        for( x in obj.videoInputDevices) webrtcdev.log(x);  

        webrtcdev.log(" Screen Device " + obj.displayResolution); 
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//* ***********************************************
settings
*********************************************/

function setSettingsAttributes(){
    
    $("#channelname").val(rtcConn.channel);
    $("#userid").val(rtcConn.userid);

    /*$("#inAudio").val(incomingAudio);*/
    $("#inAudio").prop('checked', incomingAudio);
    $("#inVideo").prop('checked',incomingVideo);
    $("#inData").prop('checked',incomingData);

    $("#outAudio").prop('checked',outgoingAudio);
    $("#outVideo").prop('checked',outgoingVideo);
    $("#outData").prop('checked',outgoingData);

    $("#role").val(role);

    $("#btnGetPeers").click(function(){
       // $("#alllpeerinfo").html(JSON.stringify(webcallpeers,null,6));
       $("#alllpeerinfo").empty();
        /*   
        for(x in webcallpeers){
            $("#allpeerinfo").append( webcallpeers[x].userid+" "+webcallpeers[x].videoContainer)
            $("#allpeerinfo").append('<br/>');
        }*/
       $('#allpeerinfo').append('<pre contenteditable>'+JSON.stringify(webcallpeers, null, 2)+'<pre>');
    });

    $("#btnDebug").click(function(){
        //window.open().document.write('<pre>'+rtcMultiConnection+'<pre>');
        $("#allwebrtcdevinfo").empty();
        $('#allwebrtcdevinfo').append('<pre contenteditable>'+rtcConn+'<pre>');
        webrtcdev.info(rtcConn);
    });
}

function createSession(){
    var role = $("#roleMakeSession").val();
    var appname = $("#appnameMakeSession").val();
    var username = $("#userNameMakeSession").val();
    var sessionname = $("#sessionNameMakeSession").val();
    var sessionlink = "https://"+window.location.host+window.location.pathname+"#"+sessionname+"?"+"appname="+appname+"&role="+role+"&audio="+1+"&video="+1+"&name="+username;
/*    if(sessionlink.){
        sessionlinkstr.replace("make", "index");
    }*/
    $("#sessionlink").val(sessionlink);
    $("#sessionlinkGo").click(function(){
        window.open($("#sessionlink").val())
    });
    /*$("#sessionlink").val(window.location+'?appname=webrtcwebcall&role=peer&audio=1&video=1&name='+$("#partnername").val());*/
}

function AddPartner(){
    var role= $("#roleMakeSession").val();
    var appname= $("#appnameMakeSession").val();
    var username= $("#partnername").val();
    var sessionname = $("#sessionNameMakeSession").val();
    var sessionlink = "https://"+window.location.host+window.location.pathname+"#"+sessionname+"?"+"appname="+appname+"&role="+role+"&audio="+1+"&video="+1+"&name="+username;
    $("#partnerlink").val(sessionlink);
    /*$("#partnerlink").val(window.location+'?appname=webrtcwebcall&role=peer&audio=1&video=1&name='+$("#partnername").val());*/
}

function EmailPartnerLink(){
    var sessionname = $("#sessionNameMakeSession").val();
    var sessionlink = $("#partnerlink").val();
    window.open('mailto:test@example.com?subject='+'join Session '+ sessionname+'&body='+ sessionlink);
}
/******************* help and settings ***********************/


function getAllPeerInfo(){
    webrtcdev.info(webcallpeers);
}

$("#SettingsButton").click(function() {
    
    webrtcdev.info(localobj.userdetails);

    if(localobj.userdisplay.latitude){
        /*$('#'+localobj.userdisplay.latitude).val(latitude);*/
        localobj.userdisplay.latitude.value=latitude;
    }

    if(localobj.userdisplay.longitude){
        localobj.userdisplay.longitude.value=longitude;
    }
    
    if(localobj.userdisplay.operatingsystem){
        localobj.userdisplay.operatingsystem.value=operatingsystem;
        /*$('#'+localobj.userdisplay.operatingsystem).val(operatingsystem);*/
    }
});
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */// Last time updated: 2016-11-04 7:11:11 AM UTC

// ________________
// FileBufferReader

'use strict';

(function() {

    function FileBufferReader() {
        var fbr = this;
        var fbrHelper = new FileBufferReaderHelper();

        fbr.chunks = {};
        fbr.users = {};

        fbr.readAsArrayBuffer = function(file, callback, extra) {
            var options = {
                file: file,
                earlyCallback: function(chunk) {
                    callback(fbrClone(chunk, {
                        currentPosition: -1
                    }));
                },
                extra: extra || {
                    userid: 0
                }
            };

            fbrHelper.readAsArrayBuffer(fbr, options);
        };

        fbr.getNextChunk = function(fileUUID, callback, userid) {
            var currentPosition;

            if (typeof fileUUID.currentPosition !== 'undefined') {
                currentPosition = fileUUID.currentPosition;
                fileUUID = fileUUID.uuid;
            }

            var allFileChunks = fbr.chunks[fileUUID];
            if (!allFileChunks) {
                return;
            }

            if (typeof userid !== 'undefined') {
                if (!fbr.users[userid + '']) {
                    fbr.users[userid + ''] = {
                        fileUUID: fileUUID,
                        userid: userid,
                        currentPosition: -1
                    };
                }

                if (typeof currentPosition !== 'undefined') {
                    fbr.users[userid + ''].currentPosition = currentPosition;
                }

                fbr.users[userid + ''].currentPosition++;
                currentPosition = fbr.users[userid + ''].currentPosition;
            } else {
                if (typeof currentPosition !== 'undefined') {
                    fbr.chunks[fileUUID].currentPosition = currentPosition;
                }

                fbr.chunks[fileUUID].currentPosition++;
                currentPosition = fbr.chunks[fileUUID].currentPosition;
            }

            var nextChunk = allFileChunks[currentPosition];
            if (!nextChunk) {
                delete fbr.chunks[fileUUID];
                fbr.convertToArrayBuffer({
                    chunkMissing: true,
                    currentPosition: currentPosition,
                    uuid: fileUUID
                }, callback);
                return;
            }

            nextChunk = fbrClone(nextChunk);

            if (typeof userid !== 'undefined') {
                nextChunk.remoteUserId = userid + '';
            }

            if (!!nextChunk.start) {
                fbr.onBegin(nextChunk);
            }

            if (!!nextChunk.end) {
                fbr.onEnd(nextChunk);
            }

            fbr.onProgress(nextChunk);

            fbr.convertToArrayBuffer(nextChunk, function(buffer) {
                if (nextChunk.currentPosition == nextChunk.maxChunks) {
                    callback(buffer, true);
                    return;
                }

                callback(buffer, false);
            });
        };

        var fbReceiver = new FileBufferReceiver(fbr);

        fbr.addChunk = function(chunk, callback) {
            if (!chunk) {
                return;
            }

            fbReceiver.receive(chunk, function(chunk) {
                fbr.convertToArrayBuffer({
                    readyForNextChunk: true,
                    currentPosition: chunk.currentPosition,
                    uuid: chunk.uuid
                }, callback);
            });
        };

        fbr.chunkMissing = function(chunk) {
            delete fbReceiver.chunks[chunk.uuid];
            delete fbReceiver.chunksWaiters[chunk.uuid];
        };

        fbr.onBegin = function() {};
        fbr.onEnd = function() {};
        fbr.onProgress = function() {};

        fbr.convertToObject = FileConverter.ConvertToObject;
        fbr.convertToArrayBuffer = FileConverter.ConvertToArrayBuffer

        // for backward compatibility----it is redundant.
        fbr.setMultipleUsers = function() {};

        // extends 'from' object with members from 'to'. If 'to' is null, a deep clone of 'from' is returned
        function fbrClone(from, to) {
            if (from == null || typeof from != "object") return from;
            if (from.constructor != Object && from.constructor != Array) return from;
            if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
                from.constructor == String || from.constructor == Number || from.constructor == Boolean)
                return new from.constructor(from);

            to = to || new from.constructor();

            for (var name in from) {
                to[name] = typeof to[name] == "undefined" ? fbrClone(from[name], null) : to[name];
            }

            return to;
        }
    }

    function FileBufferReaderHelper() {
        var fbrHelper = this;

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            return worker;
        }

        fbrHelper.readAsArrayBuffer = function(fbr, options) {
            var earlyCallback = options.earlyCallback;
            delete options.earlyCallback;

            function processChunk(chunk) {
                if (!fbr.chunks[chunk.uuid]) {
                    fbr.chunks[chunk.uuid] = {
                        currentPosition: -1
                    };
                }

                options.extra = options.extra || {
                    userid: 0
                };

                chunk.userid = options.userid || options.extra.userid || 0;
                chunk.extra = options.extra;

                fbr.chunks[chunk.uuid][chunk.currentPosition] = chunk;

                if (chunk.end && earlyCallback) {
                    earlyCallback(chunk.uuid);
                    earlyCallback = null;
                }

                // for huge files
                if ((chunk.maxChunks > 200 && chunk.currentPosition == 200) && earlyCallback) {
                    earlyCallback(chunk.uuid);
                    earlyCallback = null;
                }
            }
            if (false && typeof Worker !== 'undefined') {
                var webWorker = processInWebWorker(fileReaderWrapper);

                webWorker.onmessage = function(event) {
                    processChunk(event.data);
                };

                webWorker.postMessage(options);
            } else {
                fileReaderWrapper(options, processChunk);
            }
        };

        function fileReaderWrapper(options, callback) {
            callback = callback || function(chunk) {
                postMessage(chunk);
            };

            var file = options.file;
            if (!file.uuid) {
                file.uuid = (Math.random() * 100).toString().replace(/\./g, '');
            }

            var chunkSize = options.chunkSize || 15 * 1000;
            if (options.extra && options.extra.chunkSize) {
                chunkSize = options.extra.chunkSize;
            }

            var sliceId = 0;
            var cacheSize = chunkSize;

            var chunksPerSlice = Math.floor(Math.min(100000000, cacheSize) / chunkSize);
            var sliceSize = chunksPerSlice * chunkSize;
            var maxChunks = Math.ceil(file.size / chunkSize);

            file.maxChunks = maxChunks;

            var numOfChunksInSlice;
            var currentPosition = 0;
            var hasEntireFile;
            var chunks = [];

            callback({
                currentPosition: currentPosition,
                uuid: file.uuid,
                maxChunks: maxChunks,
                size: file.size,
                name: file.name,
                type: file.type,
                lastModifiedDate: file.lastModifiedDate.toString(),
                start: true
            });

            var blob, reader = new FileReader();

            reader.onloadend = function(evt) {
                if (evt.target.readyState == FileReader.DONE) {
                    addChunks(file.name, evt.target.result, function() {
                        sliceId++;
                        if ((sliceId + 1) * sliceSize < file.size) {
                            blob = file.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize);
                            reader.readAsArrayBuffer(blob);
                        } else if (sliceId * sliceSize < file.size) {
                            blob = file.slice(sliceId * sliceSize, file.size);
                            reader.readAsArrayBuffer(blob);
                        } else {
                            file.url = URL.createObjectURL(file);
                            callback({
                                currentPosition: currentPosition,
                                uuid: file.uuid,
                                maxChunks: maxChunks,
                                size: file.size,
                                name: file.name,
                                lastModifiedDate: file.lastModifiedDate.toString(),
                                url: URL.createObjectURL(file),
                                type: file.type,
                                end: true
                            });
                        }
                    });
                }
            };

            currentPosition += 1;

            blob = file.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize);
            reader.readAsArrayBuffer(blob);

            function addChunks(fileName, binarySlice, addChunkCallback) {
                numOfChunksInSlice = Math.ceil(binarySlice.byteLength / chunkSize);
                for (var i = 0; i < numOfChunksInSlice; i++) {
                    var start = i * chunkSize;
                    chunks[currentPosition] = binarySlice.slice(start, Math.min(start + chunkSize, binarySlice.byteLength));

                    callback({
                        uuid: file.uuid,
                        buffer: chunks[currentPosition],
                        currentPosition: currentPosition,
                        maxChunks: maxChunks,

                        size: file.size,
                        name: file.name,
                        lastModifiedDate: file.lastModifiedDate.toString(),
                        type: file.type
                    });

                    currentPosition++;
                }

                if (currentPosition == maxChunks) {
                    hasEntireFile = true;
                }

                addChunkCallback();
            }
        }
    }

    function FileSelector() {
        var selector = this;

        selector.selectSingleFile = selectFile;
        selector.selectMultipleFiles = function(callback) {
            selectFile(callback, true);
        };

        selector.accept = '*.*';

        function selectFile(callback, multiple) {
            var file = document.createElement('input');
            file.type = 'file';

            if (multiple) {
                file.multiple = true;
            }

            file.accept = selector.accept;

            file.onchange = function() {
                if (multiple) {
                    if (!file.files.length) {
                        webrtcdev.error('No file selected.');
                        return;
                    }
                    callback(file.files);
                    return;
                }

                if (!file.files[0]) {
                    webrtcdev.error('No file selected.');
                    return;
                }

                callback(file.files[0]);

                file.parentNode.removeChild(file);
            };
            file.style.display = 'none';
            (document.body || document.documentElement).appendChild(file);
            fireClickEvent(file);
        }

        function fireClickEvent(element) {
            var evt = new window.MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                button: 0,
                buttons: 0,
                mozInputSource: 1
            });

            var fired = element.dispatchEvent(evt);
        }
    }

    function FileBufferReceiver(fbr) {
        var fbReceiver = this;

        fbReceiver.chunks = {};
        fbReceiver.chunksWaiters = {};

        function receive(chunk, callback) {
            if (!chunk.uuid) {
                fbr.convertToObject(chunk, function(object) {
                    receive(object);
                });
                return;
            }

            if (chunk.start && !fbReceiver.chunks[chunk.uuid]) {
                fbReceiver.chunks[chunk.uuid] = {};
                if (fbr.onBegin) fbr.onBegin(chunk);
            }

            if (!chunk.end && chunk.buffer) {
                fbReceiver.chunks[chunk.uuid][chunk.currentPosition] = chunk.buffer;
            }

            if (chunk.end) {
                var chunksObject = fbReceiver.chunks[chunk.uuid];
                var chunksArray = [];
                Object.keys(chunksObject).forEach(function(item, idx) {
                    chunksArray.push(chunksObject[item]);
                });

                var blob = new Blob(chunksArray, {
                    type: chunk.type
                });
                blob = merge(blob, chunk);
                blob.url = URL.createObjectURL(blob);
                blob.uuid = chunk.uuid;

                if (!blob.size) webrtcdev.error('Something went wrong. Blob Size is 0.');

                if (fbr.onEnd) fbr.onEnd(blob);

                // clear system memory
                delete fbReceiver.chunks[chunk.uuid];
                delete fbReceiver.chunksWaiters[chunk.uuid];
            }

            if (chunk.buffer && fbr.onProgress) fbr.onProgress(chunk);

            if (!chunk.end) {
                callback(chunk);

                fbReceiver.chunksWaiters[chunk.uuid] = function() {
                    function looper() {
                        if (!chunk.buffer) {
                            return;
                        }

                        if (!fbReceiver.chunks[chunk.uuid]) {
                            return;
                        }

                        if (chunk.currentPosition != chunk.maxChunks && !fbReceiver.chunks[chunk.uuid][chunk.currentPosition]) {
                            callback(chunk);
                            setTimeout(looper, 5000);
                        }
                    }
                    setTimeout(looper, 5000);
                };

                fbReceiver.chunksWaiters[chunk.uuid]();
            }
        }

        fbReceiver.receive = receive;
    }

    var FileConverter = {
        ConvertToArrayBuffer: function(object, callback) {
            binarize.pack(object, function(dataView) {
                callback(dataView.buffer);
            });
        },
        ConvertToObject: function(buffer, callback) {
            binarize.unpack(buffer, callback);
        }
    };

    function merge(mergein, mergeto) {
        if (!mergein) mergein = {};
        if (!mergeto) return mergein;

        for (var item in mergeto) {
            try {
                mergein[item] = mergeto[item];
            } catch (e) {}
        }
        return mergein;
    }

    var debug = false;

    var BIG_ENDIAN = false,
        LITTLE_ENDIAN = true,
        TYPE_LENGTH = Uint8Array.BYTES_PER_ELEMENT,
        LENGTH_LENGTH = Uint16Array.BYTES_PER_ELEMENT,
        BYTES_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

    var Types = {
        NULL: 0,
        UNDEFINED: 1,
        STRING: 2,
        NUMBER: 3,
        BOOLEAN: 4,
        ARRAY: 5,
        OBJECT: 6,
        INT8ARRAY: 7,
        INT16ARRAY: 8,
        INT32ARRAY: 9,
        UINT8ARRAY: 10,
        UINT16ARRAY: 11,
        UINT32ARRAY: 12,
        FLOAT32ARRAY: 13,
        FLOAT64ARRAY: 14,
        ARRAYBUFFER: 15,
        BLOB: 16,
        FILE: 16,
        BUFFER: 17 // Special type for node.js
    };

    if (debug) {
        var TypeNames = [
            'NULL',
            'UNDEFINED',
            'STRING',
            'NUMBER',
            'BOOLEAN',
            'ARRAY',
            'OBJECT',
            'INT8ARRAY',
            'INT16ARRAY',
            'INT32ARRAY',
            'UINT8ARRAY',
            'UINT16ARRAY',
            'UINT32ARRAY',
            'FLOAT32ARRAY',
            'FLOAT64ARRAY',
            'ARRAYBUFFER',
            'BLOB',
            'BUFFER'
        ];
    }

    var Length = [
        null, // Types.NULL
        null, // Types.UNDEFINED
        'Uint16', // Types.STRING
        'Float64', // Types.NUMBER
        'Uint8', // Types.BOOLEAN
        null, // Types.ARRAY
        null, // Types.OBJECT
        'Int8', // Types.INT8ARRAY
        'Int16', // Types.INT16ARRAY
        'Int32', // Types.INT32ARRAY
        'Uint8', // Types.UINT8ARRAY
        'Uint16', // Types.UINT16ARRAY
        'Uint32', // Types.UINT32ARRAY
        'Float32', // Types.FLOAT32ARRAY
        'Float64', // Types.FLOAT64ARRAY
        'Uint8', // Types.ARRAYBUFFER
        'Uint8', // Types.BLOB, Types.FILE
        'Uint8' // Types.BUFFER
    ];

    var binary_dump = function(view, start, length) {
        var table = [],
            endianness = BIG_ENDIAN,
            ROW_LENGTH = 40;
        table[0] = [];
        for (var i = 0; i < ROW_LENGTH; i++) {
            table[0][i] = i < 10 ? '0' + i.toString(10) : i.toString(10);
        }
        for (i = 0; i < length; i++) {
            var code = view.getUint8(start + i, endianness);
            var index = ~~(i / ROW_LENGTH) + 1;
            if (typeof table[index] === 'undefined') table[index] = [];
            table[index][i % ROW_LENGTH] = code < 16 ? '0' + code.toString(16) : code.toString(16);
        }
        webrtcdev.log('%c' + table[0].join(' '), 'font-weight: bold;');
        for (i = 1; i < table.length; i++) {
            webrtcdev.log(table[i].join(' '));
        }
    };

    var find_type = function(obj) {
        var type = undefined;

        if (obj === undefined) {
            type = Types.UNDEFINED;

        } else if (obj === null) {
            type = Types.NULL;

        } else {
            var const_name = obj.constructor.name;
            if (const_name !== undefined) {
                // return type by .constructor.name if possible
                type = Types[const_name.toUpperCase()];

            } else {
                // Work around when constructor.name is not defined
                switch (typeof obj) {
                    case 'string':
                        type = Types.STRING;
                        break;

                    case 'number':
                        type = Types.NUMBER;
                        break;

                    case 'boolean':
                        type = Types.BOOLEAN;
                        break;

                    case 'object':
                        if (obj instanceof Array) {
                            type = Types.ARRAY;

                        } else if (obj instanceof Int8Array) {
                            type = Types.INT8ARRAY;

                        } else if (obj instanceof Int16Array) {
                            type = Types.INT16ARRAY;

                        } else if (obj instanceof Int32Array) {
                            type = Types.INT32ARRAY;

                        } else if (obj instanceof Uint8Array) {
                            type = Types.UINT8ARRAY;

                        } else if (obj instanceof Uint16Array) {
                            type = Types.UINT16ARRAY;

                        } else if (obj instanceof Uint32Array) {
                            type = Types.UINT32ARRAY;

                        } else if (obj instanceof Float32Array) {
                            type = Types.FLOAT32ARRAY;

                        } else if (obj instanceof Float64Array) {
                            type = Types.FLOAT64ARRAY;

                        } else if (obj instanceof ArrayBuffer) {
                            type = Types.ARRAYBUFFER;

                        } else if (obj instanceof Blob) { // including File
                            type = Types.BLOB;

                        } else if (obj instanceof Buffer) { // node.js only
                            type = Types.BUFFER;

                        } else if (obj instanceof Object) {
                            type = Types.OBJECT;

                        }
                        break;

                    default:
                        break;
                }
            }
        }
        return type;
    };

    var utf16_utf8 = function(string) {
        return unescape(encodeURIComponent(string));
    };

    var utf8_utf16 = function(bytes) {
        return decodeURIComponent(escape(bytes));
    };

    /**
     * packs seriarized elements array into a packed ArrayBuffer
     * @param  {Array} serialized Serialized array of elements.
     * @return {DataView} view of packed binary
     */
    var pack = function(serialized) {
        var cursor = 0,
            i = 0,
            j = 0,
            endianness = BIG_ENDIAN;

        var ab = new ArrayBuffer(serialized[0].byte_length + serialized[0].header_size);
        var view = new DataView(ab);

        for (i = 0; i < serialized.length; i++) {
            var start = cursor,
                header_size = serialized[i].header_size,
                type = serialized[i].type,
                length = serialized[i].length,
                value = serialized[i].value,
                byte_length = serialized[i].byte_length,
                type_name = Length[type],
                unit = type_name === null ? 0 : window[type_name + 'Array'].BYTES_PER_ELEMENT;

            // Set type
            if (type === Types.BUFFER) {
                // on node.js Blob is emulated using Buffer type
                view.setUint8(cursor, Types.BLOB, endianness);
            } else {
                view.setUint8(cursor, type, endianness);
            }
            cursor += TYPE_LENGTH;

            if (debug) {
                webrtcdev.info('Packing', type, TypeNames[type]);
            }

            // Set length if required
            if (type === Types.ARRAY || type === Types.OBJECT) {
                view.setUint16(cursor, length, endianness);
                cursor += LENGTH_LENGTH;

                if (debug) {
                    webrtcdev.info('Content Length', length);
                }
            }

            // Set byte length
            view.setUint32(cursor, byte_length, endianness);
            cursor += BYTES_LENGTH;

            if (debug) {
                webrtcdev.info('Header Size', header_size, 'bytes');
                webrtcdev.info('Byte Length', byte_length, 'bytes');
            }

            switch (type) {
                case Types.NULL:
                case Types.UNDEFINED:
                    // NULL and UNDEFINED doesn't have any payload
                    break;

                case Types.STRING:
                    if (debug) {
                        webrtcdev.info('Actual Content %c"' + value + '"', 'font-weight:bold;');
                    }
                    for (j = 0; j < length; j++, cursor += unit) {
                        view.setUint16(cursor, value.charCodeAt(j), endianness);
                    }
                    break;

                case Types.NUMBER:
                case Types.BOOLEAN:
                    if (debug) {
                        webrtcdev.info('%c' + value.toString(), 'font-weight:bold;');
                    }
                    view['set' + type_name](cursor, value, endianness);
                    cursor += unit;
                    break;

                case Types.INT8ARRAY:
                case Types.INT16ARRAY:
                case Types.INT32ARRAY:
                case Types.UINT8ARRAY:
                case Types.UINT16ARRAY:
                case Types.UINT32ARRAY:
                case Types.FLOAT32ARRAY:
                case Types.FLOAT64ARRAY:
                    var _view = new Uint8Array(view.buffer, cursor, byte_length);
                    _view.set(new Uint8Array(value.buffer));
                    cursor += byte_length;
                    break;

                case Types.ARRAYBUFFER:
                case Types.BUFFER:
                    var _view = new Uint8Array(view.buffer, cursor, byte_length);
                    _view.set(new Uint8Array(value));
                    cursor += byte_length;
                    break;

                case Types.BLOB:
                case Types.ARRAY:
                case Types.OBJECT:
                    break;

                default:
                    throw 'TypeError: Unexpected type found.';
            }

            if (debug) {
                binary_dump(view, start, cursor - start);
            }
        }

        return view;
    };

    /**
     * Unpack binary data into an object with value and cursor
     * @param  {DataView} view [description]
     * @param  {Number} cursor [description]
     * @return {Object}
     */
    var unpack = function(view, cursor) {
        var i = 0,
            endianness = BIG_ENDIAN,
            start = cursor;
        var type, length, byte_length, value, elem;

        // Retrieve "type"
        type = view.getUint8(cursor, endianness);
        cursor += TYPE_LENGTH;

        if (debug) {
            webrtcdev.info('Unpacking', type, TypeNames[type]);
        }

        // Retrieve "length"
        if (type === Types.ARRAY || type === Types.OBJECT) {
            length = view.getUint16(cursor, endianness);
            cursor += LENGTH_LENGTH;

            if (debug) {
                webrtcdev.info('Content Length', length);
            }
        }

        // Retrieve "byte_length"
        byte_length = view.getUint32(cursor, endianness);
        cursor += BYTES_LENGTH;

        if (debug) {
            webrtcdev.info('Byte Length', byte_length, 'bytes');
        }

        var type_name = Length[type];
        var unit = type_name === null ? 0 : window[type_name + 'Array'].BYTES_PER_ELEMENT;

        switch (type) {
            case Types.NULL:
            case Types.UNDEFINED:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                // NULL and UNDEFINED doesn't have any octet
                value = null;
                break;

            case Types.STRING:
                length = byte_length / unit;
                var string = [];
                for (i = 0; i < length; i++) {
                    var code = view.getUint16(cursor, endianness);
                    cursor += unit;
                    string.push(String.fromCharCode(code));
                }
                value = string.join('');
                if (debug) {
                    webrtcdev.info('Actual Content %c"' + value + '"', 'font-weight:bold;');
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.NUMBER:
                value = view.getFloat64(cursor, endianness);
                cursor += unit;
                if (debug) {
                    webrtcdev.info('Actual Content %c"' + value.toString() + '"', 'font-weight:bold;');
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.BOOLEAN:
                value = view.getUint8(cursor, endianness) === 1 ? true : false;
                cursor += unit;
                if (debug) {
                    webrtcdev.info('Actual Content %c"' + value.toString() + '"', 'font-weight:bold;');
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.INT8ARRAY:
            case Types.INT16ARRAY:
            case Types.INT32ARRAY:
            case Types.UINT8ARRAY:
            case Types.UINT16ARRAY:
            case Types.UINT32ARRAY:
            case Types.FLOAT32ARRAY:
            case Types.FLOAT64ARRAY:
            case Types.ARRAYBUFFER:
                elem = view.buffer.slice(cursor, cursor + byte_length);
                cursor += byte_length;

                // If ArrayBuffer
                if (type === Types.ARRAYBUFFER) {
                    value = elem;

                    // If other TypedArray
                } else {
                    value = new window[type_name + 'Array'](elem);
                }

                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.BLOB:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                // If Blob is available (on browser)
                if (window.Blob) {
                    var mime = unpack(view, cursor);
                    var buffer = unpack(view, mime.cursor);
                    cursor = buffer.cursor;
                    value = new Blob([buffer.value], {
                        type: mime.value
                    });
                } else {
                    // node.js implementation goes here
                    elem = view.buffer.slice(cursor, cursor + byte_length);
                    cursor += byte_length;
                    // node.js implementatino uses Buffer to help Blob
                    value = new Buffer(elem);
                }
                break;

            case Types.ARRAY:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                value = [];
                for (i = 0; i < length; i++) {
                    // Retrieve array element
                    elem = unpack(view, cursor);
                    cursor = elem.cursor;
                    value.push(elem.value);
                }
                break;

            case Types.OBJECT:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                value = {};
                for (i = 0; i < length; i++) {
                    // Retrieve object key and value in sequence
                    var key = unpack(view, cursor);
                    var val = unpack(view, key.cursor);
                    cursor = val.cursor;
                    value[key.value] = val.value;
                }
                break;

            default:
                throw 'TypeError: Type not supported.';
        }
        return {
            value: value,
            cursor: cursor
        };
    };

    /**
     * deferred function to process multiple serialization in order
     * @param  {array}   array    [description]
     * @param  {Function} callback [description]
     * @return {void} no return value
     */
    var deferredSerialize = function(array, callback) {
        var length = array.length,
            results = [],
            count = 0,
            byte_length = 0;
        for (var i = 0; i < array.length; i++) {
            (function(index) {
                serialize(array[index], function(result) {
                    // store results in order
                    results[index] = result;
                    // count byte length
                    byte_length += result[0].header_size + result[0].byte_length;
                    // when all results are on table
                    if (++count === length) {
                        // finally concatenate all reuslts into a single array in order
                        var array = [];
                        for (var j = 0; j < results.length; j++) {
                            array = array.concat(results[j]);
                        }
                        callback(array, byte_length);
                    }
                });
            })(i);
        }
    };

    /**
     * Serializes object and return byte_length
     * @param  {mixed} obj JavaScript object you want to serialize
     * @return {Array} Serialized array object
     */
    var serialize = function(obj, callback) {
        var subarray = [],
            unit = 1,
            header_size = TYPE_LENGTH + BYTES_LENGTH,
            type, byte_length = 0,
            length = 0,
            value = obj;

        type = find_type(obj);

        unit = Length[type] === undefined || Length[type] === null ? 0 :
            window[Length[type] + 'Array'].BYTES_PER_ELEMENT;

        switch (type) {
            case Types.UNDEFINED:
            case Types.NULL:
                break;

            case Types.NUMBER:
            case Types.BOOLEAN:
                byte_length = unit;
                break;

            case Types.STRING:
                length = obj.length;
                byte_length += length * unit;
                break;

            case Types.INT8ARRAY:
            case Types.INT16ARRAY:
            case Types.INT32ARRAY:
            case Types.UINT8ARRAY:
            case Types.UINT16ARRAY:
            case Types.UINT32ARRAY:
            case Types.FLOAT32ARRAY:
            case Types.FLOAT64ARRAY:
                length = obj.length;
                byte_length += length * unit;
                break;

            case Types.ARRAY:
                deferredSerialize(obj, function(subarray, byte_length) {
                    callback([{
                        type: type,
                        length: obj.length,
                        header_size: header_size + LENGTH_LENGTH,
                        byte_length: byte_length,
                        value: null
                    }].concat(subarray));
                });
                return;

            case Types.OBJECT:
                var deferred = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        deferred.push(key);
                        deferred.push(obj[key]);
                        length++;
                    }
                }
                deferredSerialize(deferred, function(subarray, byte_length) {
                    callback([{
                        type: type,
                        length: length,
                        header_size: header_size + LENGTH_LENGTH,
                        byte_length: byte_length,
                        value: null
                    }].concat(subarray));
                });
                return;

            case Types.ARRAYBUFFER:
                byte_length += obj.byteLength;
                break;

            case Types.BLOB:
                var mime_type = obj.type;
                var reader = new FileReader();
                reader.onload = function(e) {
                    deferredSerialize([mime_type, e.target.result], function(subarray, byte_length) {
                        callback([{
                            type: type,
                            length: length,
                            header_size: header_size,
                            byte_length: byte_length,
                            value: null
                        }].concat(subarray));
                    });
                };
                reader.onerror = function(e) {
                    throw 'FileReader Error: ' + e;
                };
                reader.readAsArrayBuffer(obj);
                return;

            case Types.BUFFER:
                byte_length += obj.length;
                break;

            default:
                throw 'TypeError: Type "' + obj.constructor.name + '" not supported.';
        }

        callback([{
            type: type,
            length: length,
            header_size: header_size,
            byte_length: byte_length,
            value: value
        }].concat(subarray));
    };

    /**
     * Deserialize binary and return JavaScript object
     * @param  ArrayBuffer buffer ArrayBuffer you want to deserialize
     * @return mixed              Retrieved JavaScript object
     */
    var deserialize = function(buffer, callback) {
        var view = buffer instanceof DataView ? buffer : new DataView(buffer);
        var result = unpack(view, 0);
        return result.value;
    };

    if (debug) {
        window.Test = {
            BIG_ENDIAN: BIG_ENDIAN,
            LITTLE_ENDIAN: LITTLE_ENDIAN,
            Types: Types,
            pack: pack,
            unpack: unpack,
            serialize: serialize,
            deserialize: deserialize
        };
    }

    var binarize = {
        pack: function(obj, callback) {
            try {
                if (debug) webrtcdev.info('%cPacking Start', 'font-weight: bold; color: red;', obj);
                serialize(obj, function(array) {
                    if (debug) webrtcdev.info('Serialized Object', array);
                    callback(pack(array));
                });
            } catch (e) {
                throw e;
            }
        },
        unpack: function(buffer, callback) {
            try {
                if (debug) webrtcdev.info('%cUnpacking Start', 'font-weight: bold; color: red;', buffer);
                var result = deserialize(buffer);
                if (debug) webrtcdev.info('Deserialized Object', result);
                callback(result);
            } catch (e) {
                throw e;
            }
        }
    };

    window.FileConverter = FileConverter;
    window.FileSelector = FileSelector;
    window.FileBufferReader = FileBufferReader;
})();

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.webrtc-experiment.com/licence
// Documentation - github.com/streamproc/MediaStreamRecorder
// ______________________
// MediaStreamRecorder.js

function MediaStreamRecorder(mediaStream) {
    if (!mediaStream) throw 'MediaStream is mandatory.';

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        // Media Stream Recording API has not been implemented in chrome yet;
        // That's why using WebAudio API to record stereo audio in WAV format
        var Recorder = IsChrome ? window.StereoRecorder : window.MediaRecorderWrapper;

        // video recorder (in WebM format)
        if (this.mimeType.indexOf('video') != -1) {
            Recorder = IsChrome ? window.WhammyRecorder : window.MediaRecorderWrapper;
        }

        // video recorder (in GIF format)
        if (this.mimeType === 'image/gif') Recorder = window.GifRecorder;

        mediaRecorder = new Recorder(mediaStream);
        mediaRecorder.ondataavailable = this.ondataavailable;
        mediaRecorder.onstop = this.onstop;
        mediaRecorder.onStartedDrawingNonBlankFrames = this.onStartedDrawingNonBlankFrames;

        // Merge all data-types except "function"
        mediaRecorder = mergeProps(mediaRecorder, this);

        mediaRecorder.start(timeSlice);
    };

    this.onStartedDrawingNonBlankFrames = function() {};
    this.clearOldRecordedFrames = function() {
        if (!mediaRecorder) return;
        mediaRecorder.clearOldRecordedFrames();
    };

    this.stop = function() {
        if (mediaRecorder) mediaRecorder.stop();
    };

    this.ondataavailable = function(blob) {
        webrtcdev.log('ondataavailable..', blob);
    };

    this.onstop = function(error) {
        webrtcdev.warn('stopped..', error);
    };

    // Reference to "MediaRecorder.js"
    var mediaRecorder;
}

// below scripts are used to auto-load required files.

function loadScript(src, onload) {
    var root = window.MediaStreamRecorderScriptsDir;

    var script = document.createElement('script');
    script.src = root + src;
    script.onload = onload || function() {};
    document.documentElement.appendChild(script);
}

// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.webrtc-experiment.com/licence
// Documentation - github.com/streamproc/MediaStreamRecorder

// _____________________________
// Cross-Browser-Declarations.js

// animation-frame used in WebM recording
if (!window.requestAnimationFrame) {
    requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
}

if (!window.cancelAnimationFrame) {
    cancelAnimationFrame = window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
}

// WebAudio API representer
if (!window.AudioContext) {
    window.AudioContext = window.webkitAudioContext || window.mozAudioContext;
}

URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

if (window.webkitMediaStream) window.MediaStream = window.webkitMediaStream;

IsChrome = !!navigator.webkitGetUserMedia;

// Merge all other data-types except "function"

function mergeProps(mergein, mergeto) {
    mergeto = reformatProps(mergeto);
    for (var t in mergeto) {
        if (typeof mergeto[t] !== 'function') {
            mergein[t] = mergeto[t];
        }
    }
    return mergein;
}

function reformatProps(obj) {
    var output = {};
    for (var o in obj) {
        if (o.indexOf('-') != -1) {
            var splitted = o.split('-');
            var name = splitted[0] + splitted[1].split('')[0].toUpperCase() + splitted[1].substr(1);
            output[name] = obj[o];
        } else output[o] = obj[o];
    }
    return output;
}

// ______________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// ObjectStore.js
var ObjectStore = {
    AudioContext: window.AudioContext || window.webkitAudioContext
};

// ================
// MediaRecorder.js

/**
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

function MediaRecorderWrapper(mediaStream) {
    // if user chosen only audio option; and he tried to pass MediaStream with
    // both audio and video tracks;
    // using a dirty workaround to generate audio-only stream so that we can get audio/ogg output.
    if (this.type == 'audio' && mediaStream.getVideoTracks && mediaStream.getVideoTracks().length && !navigator.mozGetUserMedia) {
        var context = new AudioContext();
        var mediaStreamSource = context.createMediaStreamSource(mediaStream);

        var destination = context.createMediaStreamDestination();
        mediaStreamSource.connect(destination);

        mediaStream = destination.stream;
    }

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"

    // starting a recording session; which will initiate "Reading Thread"
    // "Reading Thread" are used to prevent main-thread blocking scenarios
    this.start = function(mTimeSlice) {
        mTimeSlice = mTimeSlice || 1000;
        isStopRecording = false;

        function startRecording() {
            if (isStopRecording) return;

            mediaRecorder = new MediaRecorder(mediaStream);

            mediaRecorder.ondataavailable = function(e) {
                webrtcdev.log('ondataavailable', e.data.type, e.data.size, e.data);
                // mediaRecorder.state == 'recording' means that media recorder is associated with "session"
                // mediaRecorder.state == 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

                if (!e.data.size) {
                    webrtcdev.warn('Recording of', e.data.type, 'failed.');
                    return;
                }

                // at this stage, Firefox MediaRecorder API doesn't allow to choose the output mimeType format!
                var blob = new window.Blob([e.data], {
                    type: e.data.type || self.mimeType || 'audio/ogg' // It specifies the container format as well as the audio and video capture formats.
                });

                // Dispatching OnDataAvailable Handler
                self.ondataavailable(blob);
            };

            mediaRecorder.onstop = function(error) {
                // for video recording on Firefox, it will be fired quickly.
                // because work on VideoFrameContainer is still in progress
                // https://wiki.mozilla.org/Gecko:MediaRecorder

                // self.onstop(error);
            };

            // http://www.w3.org/TR/2012/WD-dom-20121206/#error-names-table
            // showBrowserSpecificIndicator: got neither video nor audio access
            // "VideoFrameContainer" can't be accessed directly; unable to find any wrapper using it.
            // that's why there is no video recording support on firefox

            // video recording fails because there is no encoder available there
            // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp#317

            // Maybe "Read Thread" doesn't fire video-track read notification;
            // that's why shutdown notification is received; and "Read Thread" is stopped.

            // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html#error-handling
            mediaRecorder.onerror = function(error) {
                webrtcdev.error(error);
                self.start(mTimeSlice);
            };

            mediaRecorder.onwarning = function(warning) {
                webrtcdev.warn(warning);
            };

            // void start(optional long mTimeSlice)
            // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
            // handler. "mTimeSlice < 0" means Session object does not push encoded data to
            // onDataAvailable, instead, it passive wait the client side pull encoded data
            // by calling requestData API.
            mediaRecorder.start(0);

            // Start recording. If timeSlice has been provided, mediaRecorder will
            // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
            // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.

            setTimeout(function() {
                mediaRecorder.stop();
                startRecording();
            }, mTimeSlice);
        }

        // dirty workaround to fix Firefox 2nd+ intervals
        startRecording();
    };

    var isStopRecording = false;

    this.stop = function() {
        isStopRecording = true;

        if (self.onstop) {
            self.onstop({});
        }
    };

    this.ondataavailable = this.onstop = function() {};

    // Reference to itself
    var self = this;

    if (!self.mimeType && !!mediaStream.getAudioTracks) {
        self.mimeType = mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length ? 'video/webm' : 'audio/ogg';
    }

    // Reference to "MediaRecorderWrapper" object
    var mediaRecorder;
}

// =================
// StereoRecorder.js

function StereoRecorder(mediaStream) {
    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        mediaRecorder = new StereoAudioRecorder(mediaStream, this);

        mediaRecorder.record();

        timeout = setInterval(function() {
            mediaRecorder.requestData();
        }, timeSlice);
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            clearTimeout(timeout);
        }
    };

    this.ondataavailable = function() {};

    // Reference to "StereoAudioRecorder" object
    var mediaRecorder;
    var timeout;
}

// ======================
// StereoAudioRecorder.js

// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js

function StereoAudioRecorder(mediaStream, root) {
    // variables
    var leftchannel = [];
    var rightchannel = [];
    var scriptprocessornode;
    var recording = false;
    var recordingLength = 0;
    var volume;
    var audioInput;
    var sampleRate = 44100;
    var audioContext;
    var context;

    var numChannels = root.mono ? 1 : 2;

    this.record = function() {
        recording = true;
        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;
    };

    this.requestData = function() {
        if (recordingLength == 0) {
            requestDataInvoked = false;
            return;
        }

        requestDataInvoked = true;
        // clone stuff
        var internal_leftchannel = leftchannel.slice(0);
        var internal_rightchannel = rightchannel.slice(0);
        var internal_recordingLength = recordingLength;

        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = [];
        recordingLength = 0;
        requestDataInvoked = false;

        // we flat the left and right channels down
        var leftBuffer = mergeBuffers(internal_leftchannel, internal_recordingLength);
        var rightBuffer = mergeBuffers(internal_leftchannel, internal_recordingLength);

        // we interleave both channels together
        if (numChannels === 2) {
            var interleaved = interleave(leftBuffer, rightBuffer);
        } else {
            var interleaved = leftBuffer;
        }

        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++) {
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }

        // our final binary blob
        var blob = new Blob([view], {
            type: 'audio/wav'
        });

        webrtcdev.debug('audio recorded blob size:', bytesToSize(blob.size));

        root.ondataavailable(blob);
    };

    this.stop = function() {
        // we stop recording
        recording = false;
        this.requestData();
    };

    function interleave(leftChannel, rightChannel) {
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);

        var inputIndex = 0;

        for (var index = 0; index < length;) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    function mergeBuffers(channelBuffer, recordingLength) {
        var result = new Float32Array(recordingLength);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++) {
            var buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // creates the audio context

    // creates the audio context
    var audioContext = ObjectStore.AudioContext;

    if (!ObjectStore.AudioContextConstructor)
        ObjectStore.AudioContextConstructor = new audioContext();

    var context = ObjectStore.AudioContextConstructor;

    // creates a gain node
    if (!ObjectStore.VolumeGainNode)
        ObjectStore.VolumeGainNode = context.createGain();

    var volume = ObjectStore.VolumeGainNode;

    // creates an audio node from the microphone incoming stream
    if (!ObjectStore.AudioInput)
        ObjectStore.AudioInput = context.createMediaStreamSource(mediaStream);

    // creates an audio node from the microphone incoming stream
    var audioInput = ObjectStore.AudioInput;

    // connect the stream to the gain node
    audioInput.connect(volume);

    /* From the spec: This value controls how frequently the audioprocess event is
    dispatched and how many sample-frames need to be processed each call.
    Lower values for buffer size will result in a lower (better) latency.
    Higher values will be necessary to avoid audio breakup and glitches 
    Legal values are 256, 512, 1024, 2048, 4096, 8192, and 16384.*/
    var bufferSize = root.bufferSize || 2048;
    if (root.bufferSize == 0) bufferSize = 0;

    if (context.createJavaScriptNode) {
        scriptprocessornode = context.createJavaScriptNode(bufferSize, numChannels, numChannels);
    } else if (context.createScriptProcessor) {
        scriptprocessornode = context.createScriptProcessor(bufferSize, numChannels, numChannels);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    bufferSize = scriptprocessornode.bufferSize;

    webrtcdev.debug('using audio buffer-size:', bufferSize);

    var requestDataInvoked = false;

    // sometimes "scriptprocessornode" disconnects from he destination-node
    // and there is no exception thrown in this case.
    // and obviously no further "ondataavailable" events will be emitted.
    // below global-scope variable is added to debug such unexpected but "rare" cases.
    window.scriptprocessornode = scriptprocessornode;

    if (numChannels == 1) {
        webrtcdev.debug('It seems mono audio. All right-channels are skipped.');
    }

    // http://webaudio.github.io/web-audio-api/#the-scriptprocessornode-interface
    scriptprocessornode.onaudioprocess = function(e) {
        if (!recording || requestDataInvoked) return;

        var left = e.inputBuffer.getChannelData(0);
        leftchannel.push(new Float32Array(left));

        if (numChannels == 2) {
            var right = e.inputBuffer.getChannelData(1);
            rightchannel.push(new Float32Array(right));
        }
        recordingLength += bufferSize;
    };

    volume.connect(scriptprocessornode);
    scriptprocessornode.connect(context.destination);
}

// =======================
// WhammyRecorderHelper.js

function WhammyRecorderHelper(mediaStream, root) {
    this.record = function(timeSlice) {
        if (!this.width) this.width = 320;
        if (!this.height) this.height = 240;

        if (this.video && this.video instanceof HTMLVideoElement) {
            if (!this.width) this.width = video.videoWidth || 320;
            if (!this.height) this.height = video.videoHeight || 240;
        }

        if (!this.video) {
            this.video = {
                width: this.width,
                height: this.height
            };
        }

        if (!this.canvas) {
            this.canvas = {
                width: this.width,
                height: this.height
            };
        }

        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        // setting defaults
        if (this.video && this.video instanceof HTMLVideoElement) {
            video = this.video.cloneNode();
        } else {
            video = document.createElement('video');
            video.src = URL.createObjectURL(mediaStream);

            video.width = this.video.width;
            video.height = this.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video();

        webrtcdev.log('canvas resolutions', canvas.width, '*', canvas.height);
        webrtcdev.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);

        drawFrames();
    };

    this.clearOldRecordedFrames = function() {
        frames = [];
    };

    var requestDataInvoked = false;
    this.requestData = function() {
        if (!frames.length) {
            requestDataInvoked = false;
            return;
        }

        requestDataInvoked = true;
        // clone stuff
        var internal_frames = frames.slice(0);

        // reset the frames for the new recording
        frames = [];

        whammy.frames = dropBlackFrames(internal_frames, -1);

        var WebM_Blob = whammy.compile();
        root.ondataavailable(WebM_Blob);

        webrtcdev.debug('video recorded blob size:', bytesToSize(WebM_Blob.size));

        requestDataInvoked = false;
    };

    var frames = [];

    var isOnStartedDrawingNonBlankFramesInvoked = false;

    function drawFrames() {
        if (isStopDrawing) return;

        if (requestDataInvoked) return setTimeout(drawFrames, 100);

        var duration = new Date().getTime() - lastTime;
        if (!duration) return drawFrames();

        // via webrtc-experiment#206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        !isStopDrawing && frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });

        if (!isOnStartedDrawingNonBlankFramesInvoked && !isBlankFrame(frames[frames.length - 1])) {
            isOnStartedDrawingNonBlankFramesInvoked = true;
            root.onStartedDrawingNonBlankFrames();
        }

        setTimeout(drawFrames, 10);
    }

    var isStopDrawing = false;

    this.stop = function() {
        isStopDrawing = true;
        this.requestData();
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;

    var self = this;

    function isBlankFrame(frame, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');

        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;

        var matchPixCount, endPixCheck, maxPixCount;

        var image = new Image();
        image.src = frame.image;
        context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
        var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
        matchPixCount = 0;
        endPixCheck = imageData.data.length;
        maxPixCount = imageData.data.length / 4;

        for (var pix = 0; pix < endPixCheck; pix += 4) {
            var currentColor = {
                r: imageData.data[pix],
                g: imageData.data[pix + 1],
                b: imageData.data[pix + 2]
            };
            var colorDifference = Math.sqrt(
                Math.pow(currentColor.r - sampleColor.r, 2) +
                Math.pow(currentColor.g - sampleColor.g, 2) +
                Math.pow(currentColor.b - sampleColor.b, 2)
            );
            // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
            if (colorDifference <= maxColorDifference * pixTolerance) {
                matchPixCount++;
            }
        }

        if (maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
            return false;
        } else {
            return true;
        }
    }

    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        for (var f = 0; f < endCheckFrame; f++) {
            var matchPixCount, endPixCheck, maxPixCount;

            if (!doNotCheckNext) {
                var image = new Image();
                image.src = _frames[f].image;
                context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                matchPixCount = 0;
                endPixCheck = imageData.data.length;
                maxPixCount = imageData.data.length / 4;

                for (var pix = 0; pix < endPixCheck; pix += 4) {
                    var currentColor = {
                        r: imageData.data[pix],
                        g: imageData.data[pix + 1],
                        b: imageData.data[pix + 2]
                    };
                    var colorDifference = Math.sqrt(
                        Math.pow(currentColor.r - sampleColor.r, 2) +
                        Math.pow(currentColor.g - sampleColor.g, 2) +
                        Math.pow(currentColor.b - sampleColor.b, 2)
                    );
                    // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                    if (colorDifference <= maxColorDifference * pixTolerance) {
                        matchPixCount++;
                    }
                }
            }

            if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
                // webrtcdev.log('removed black frame : ' + f + ' ; frame duration ' + _frames[f].duration);
            } else {
                // webrtcdev.log('frame is passed : ' + f);
                if (checkUntilNotBlack) {
                    doNotCheckNext = true;
                }
                resultFrames.push(_frames[f]);
            }
        }

        resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

        if (resultFrames.length <= 0) {
            // at least one last frame should be available for next manipulation
            // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
            resultFrames.push(_frames[_frames.length - 1]);
        }

        return resultFrames;
    }
}

// =================
// WhammyRecorder.js

function WhammyRecorder(mediaStream) {
    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        mediaRecorder = new WhammyRecorderHelper(mediaStream, this);

        for (var prop in this) {
            if (typeof this[prop] !== 'function') {
                mediaRecorder[prop] = this[prop];
            }
        }

        mediaRecorder.record();

        timeout = setInterval(function() {
            mediaRecorder.requestData();
        }, timeSlice);
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            clearTimeout(timeout);
        }
    };

    this.clearOldRecordedFrames = function() {
        if (mediaRecorder) {
            mediaRecorder.clearOldRecordedFrames();
        }
    };

    this.ondataavailable = function() {};

    // Reference to "WhammyRecorder" object
    var mediaRecorder;
    var timeout;
}


// Muaz Khan     - https://github.com/muaz-khan 
// neizerth      - https://github.com/neizerth
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/streamproc/MediaStreamRecorder

// Note:
// ==========================================================
// whammy.js is an "external library" 
// and has its own copyrights. Taken from "Whammy" project.


// https://github.com/antimatter15/whammy/blob/master/LICENSE
// =========
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

var Whammy = (function() {

    function toWebM(frames) {
        var info = checkFrames(frames);

        var CLUSTER_MAX_DURATION = 30000;

        var EBML = [{
            "id": 0x1a45dfa3, // EBML
            "data": [{
                "data": 1,
                "id": 0x4286 // EBMLVersion
            }, {
                "data": 1,
                "id": 0x42f7 // EBMLReadVersion
            }, {
                "data": 4,
                "id": 0x42f2 // EBMLMaxIDLength
            }, {
                "data": 8,
                "id": 0x42f3 // EBMLMaxSizeLength
            }, {
                "data": "webm",
                "id": 0x4282 // DocType
            }, {
                "data": 2,
                "id": 0x4287 // DocTypeVersion
            }, {
                "data": 2,
                "id": 0x4285 // DocTypeReadVersion
            }]
        }, {
            "id": 0x18538067, // Segment
            "data": [{
                "id": 0x1549a966, // Info
                "data": [{
                    "data": 1e6, //do things in millisecs (num of nanosecs for duration scale)
                    "id": 0x2ad7b1 // TimecodeScale
                }, {
                    "data": "whammy",
                    "id": 0x4d80 // MuxingApp
                }, {
                    "data": "whammy",
                    "id": 0x5741 // WritingApp
                }, {
                    "data": doubleToString(info.duration),
                    "id": 0x4489 // Duration
                }]
            }, {
                "id": 0x1654ae6b, // Tracks
                "data": [{
                    "id": 0xae, // TrackEntry
                    "data": [{
                        "data": 1,
                        "id": 0xd7 // TrackNumber
                    }, {
                        "data": 1,
                        "id": 0x63c5 // TrackUID
                    }, {
                        "data": 0,
                        "id": 0x9c // FlagLacing
                    }, {
                        "data": "und",
                        "id": 0x22b59c // Language
                    }, {
                        "data": "V_VP8",
                        "id": 0x86 // CodecID
                    }, {
                        "data": "VP8",
                        "id": 0x258688 // CodecName
                    }, {
                        "data": 1,
                        "id": 0x83 // TrackType
                    }, {
                        "id": 0xe0, // Video
                        "data": [{
                            "data": info.width,
                            "id": 0xb0 // PixelWidth
                        }, {
                            "data": info.height,
                            "id": 0xba // PixelHeight
                        }]
                    }]
                }]
            }]
        }];

        //Generate clusters (max duration)
        var frameNumber = 0;
        var clusterTimecode = 0;
        while (frameNumber < frames.length) {

            var clusterFrames = [];
            var clusterDuration = 0;
            do {
                clusterFrames.push(frames[frameNumber]);
                clusterDuration += frames[frameNumber].duration;
                frameNumber++;
            } while (frameNumber < frames.length && clusterDuration < CLUSTER_MAX_DURATION);

            var clusterCounter = 0;
            var cluster = {
                "id": 0x1f43b675, // Cluster
                "data": [{
                    "data": clusterTimecode,
                    "id": 0xe7 // Timecode
                }].concat(clusterFrames.map(function(webp) {
                    var block = makeSimpleBlock({
                        discardable: 0,
                        frame: webp.data.slice(4),
                        invisible: 0,
                        keyframe: 1,
                        lacing: 0,
                        trackNum: 1,
                        timecode: Math.round(clusterCounter)
                    });
                    clusterCounter += webp.duration;
                    return {
                        data: block,
                        id: 0xa3
                    };
                }))
            }; //Add cluster to segment
            EBML[1].data.push(cluster);
            clusterTimecode += clusterDuration;
        }

        return generateEBML(EBML);
    }

    // sums the lengths of all the frames and gets the duration

    function checkFrames(frames) {
        if (!frames[0]) {
            webrtcdev.warn('Something went wrong. Maybe WebP format is not supported in the current browser.');
            return;
        }

        var width = frames[0].width,
            height = frames[0].height,
            duration = frames[0].duration;

        for (var i = 1; i < frames.length; i++) {
            duration += frames[i].duration;
        }
        return {
            duration: duration,
            width: width,
            height: height
        };
    }

    function numToBuffer(num) {
        var parts = [];
        while (num > 0) {
            parts.push(num & 0xff);
            num = num >> 8;
        }
        return new Uint8Array(parts.reverse());
    }

    function strToBuffer(str) {
        return new Uint8Array(str.split('').map(function(e) {
            return e.charCodeAt(0);
        }));
    }

    function bitsToBuffer(bits) {
        var data = [];
        var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
        bits = pad + bits;
        for (var i = 0; i < bits.length; i += 8) {
            data.push(parseInt(bits.substr(i, 8), 2));
        }
        return new Uint8Array(data);
    }

    function generateEBML(json) {
        var ebml = [];
        for (var i = 0; i < json.length; i++) {
            var data = json[i].data;
            if (typeof data == 'object') data = generateEBML(data);
            if (typeof data == 'number') data = bitsToBuffer(data.toString(2));
            if (typeof data == 'string') data = strToBuffer(data);

            var len = data.size || data.byteLength || data.length;
            var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
            var size_str = len.toString(2);
            var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
            var size = (new Array(zeroes)).join('0') + '1' + padded;

            ebml.push(numToBuffer(json[i].id));
            ebml.push(bitsToBuffer(size));
            ebml.push(data);
        }

        return new Blob(ebml, {
            type: "video/webm"
        });
    }

    function toBinStr_old(bits) {
        var data = '';
        var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
        bits = pad + bits;
        for (var i = 0; i < bits.length; i += 8) {
            data += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
        }
        return data;
    }

    function generateEBML_old(json) {
        var ebml = '';
        for (var i = 0; i < json.length; i++) {
            var data = json[i].data;
            if (typeof data == 'object') data = generateEBML_old(data);
            if (typeof data == 'number') data = toBinStr_old(data.toString(2));

            var len = data.length;
            var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
            var size_str = len.toString(2);
            var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
            var size = (new Array(zeroes)).join('0') + '1' + padded;

            ebml += toBinStr_old(json[i].id.toString(2)) + toBinStr_old(size) + data;

        }
        return ebml;
    }

    function makeSimpleBlock(data) {
        var flags = 0;
        if (data.keyframe) flags |= 128;
        if (data.invisible) flags |= 8;
        if (data.lacing) flags |= (data.lacing << 1);
        if (data.discardable) flags |= 1;
        if (data.trackNum > 127) {
            throw "TrackNumber > 127 not supported";
        }
        var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
            return String.fromCharCode(e);
        }).join('') + data.frame;

        return out;
    }

    function parseWebP(riff) {
        var VP8 = riff.RIFF[0].WEBP[0];

        var frame_start = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
        for (var i = 0, c = []; i < 4; i++) c[i] = VP8.charCodeAt(frame_start + 3 + i);

        var width, height, tmp;

        //the code below is literally copied verbatim from the bitstream spec
        tmp = (c[1] << 8) | c[0];
        width = tmp & 0x3FFF;
        tmp = (c[3] << 8) | c[2];
        height = tmp & 0x3FFF;
        return {
            width: width,
            height: height,
            data: VP8,
            riff: riff
        };
    }

    function parseRIFF(string) {
        var offset = 0;
        var chunks = {};

        while (offset < string.length) {
            var id = string.substr(offset, 4);
            var len = parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
                var unpadded = i.charCodeAt(0).toString(2);
                return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
            }).join(''), 2);
            var data = string.substr(offset + 4 + 4, len);
            offset += 4 + 4 + len;
            chunks[id] = chunks[id] || [];

            if (id == 'RIFF' || id == 'LIST') {
                chunks[id].push(parseRIFF(data));
            } else {
                chunks[id].push(data);
            }
        }
        return chunks;
    }

    function doubleToString(num) {
        return [].slice.call(
            new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
            return String.fromCharCode(e);
        }).reverse().join('');
    }

    // a more abstract-ish API

    function WhammyVideo(duration) {
        this.frames = [];
        this.duration = duration || 1;
        this.quality = 100;
    }

    WhammyVideo.prototype.add = function(frame, duration) {
        if ('canvas' in frame) { //CanvasRenderingContext2D
            frame = frame.canvas;
        }

        if ('toDataURL' in frame) {
            frame = frame.toDataURL('image/webp', this.quality);
        }

        if (!(/^data:image\/webp;base64,/ig).test(frame)) {
            throw "Input must be formatted properly as a base64 encoded DataURI of type image/webp";
        }
        this.frames.push({
            image: frame,
            duration: duration || this.duration
        });
    };
    WhammyVideo.prototype.compile = function() {
        return new toWebM(this.frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
        }));
    };
    return {
        Video: WhammyVideo,
        toWebM: toWebM
    };
})();

// Muaz Khan     - https://github.com/muaz-khan 
// neizerth      - https://github.com/neizerth
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/streamproc/MediaStreamRecorder
// ==========================================================
// GifRecorder.js

function GifRecorder(mediaStream) {
    if (!window.GIFEncoder) {
        throw 'Please link: https://cdn.webrtc-experiment.com/gif-recorder.js';
    }

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        var imageWidth = this.videoWidth || 320;
        var imageHeight = this.videoHeight || 240;

        canvas.width = video.width = imageWidth;
        canvas.height = video.height = imageHeight;

        // external library to record as GIF images
        gifEncoder = new GIFEncoder();

        // void setRepeat(int iter)
        // Sets the number of times the set of GIF frames should be played.
        // Default is 1; 0 means play indefinitely.
        gifEncoder.setRepeat(0);

        // void setFrameRate(Number fps)
        // Sets frame rate in frames per second.
        // Equivalent to setDelay(1000/fps).
        // Using "setDelay" instead of "setFrameRate"
        gifEncoder.setDelay(this.frameRate || 200);

        // void setQuality(int quality)
        // Sets quality of color quantization (conversion of images to the
        // maximum 256 colors allowed by the GIF specification).
        // Lower values (minimum = 1) produce better colors,
        // but slow processing significantly. 10 is the default,
        // and produces good color mapping at reasonable speeds.
        // Values greater than 20 do not yield significant improvements in speed.
        gifEncoder.setQuality(this.quality || 1);

        // Boolean start()
        // This writes the GIF Header and returns false if it fails.
        gifEncoder.start();

        startTime = Date.now();

        function drawVideoFrame(time) {
            lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

            if (typeof lastFrameTime === undefined) {
                lastFrameTime = time;
            }

            // ~10 fps
            if (time - lastFrameTime < 90) return;

            context.drawImage(video, 0, 0, imageWidth, imageHeight);

            gifEncoder.addFrame(context);

            // webrtcdev.log('Recording...' + Math.round((Date.now() - startTime) / 1000) + 's');
            // webrtcdev.log("fps: ", 1000 / (time - lastFrameTime));

            lastFrameTime = time;
        }

        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

        timeout = setTimeout(doneRecording, timeSlice);
    };

    function doneRecording() {
        endTime = Date.now();

        var gifBlob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: 'image/gif'
        });
        self.ondataavailable(gifBlob);

        // todo: find a way to clear old recorded blobs
        gifEncoder.stream().bin = [];
    };

    this.stop = function() {
        if (lastAnimationFrame) {
            cancelAnimationFrame(lastAnimationFrame);
            clearTimeout(timeout);
            doneRecording();
        }
    };

    this.ondataavailable = function() {};
    this.onstop = function() {};

    // Reference to itself
    var self = this;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.src = URL.createObjectURL(mediaStream);
    video.play();

    var lastAnimationFrame = null;
    var startTime, endTime, lastFrameTime;

    var gifEncoder;
    var timeout;
}

// ______________________
// MultiStreamRecorder.js

function MultiStreamRecorder(mediaStream) {
    if (!mediaStream) throw 'MediaStream is mandatory.';

    var self = this;
    var isFirefox = !!navigator.mozGetUserMedia;

    this.stream = mediaStream;

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        audioRecorder = new MediaStreamRecorder(mediaStream);
        videoRecorder = new MediaStreamRecorder(mediaStream);

        audioRecorder.mimeType = 'audio/ogg';
        videoRecorder.mimeType = 'video/webm';

        for (var prop in this) {
            if (typeof this[prop] !== 'function') {
                audioRecorder[prop] = videoRecorder[prop] = this[prop];
            }
        }

        audioRecorder.ondataavailable = function(blob) {
            if (!audioVideoBlobs[recordingInterval]) {
                audioVideoBlobs[recordingInterval] = {};
            }

            audioVideoBlobs[recordingInterval].audio = blob;

            if (audioVideoBlobs[recordingInterval].video && !audioVideoBlobs[recordingInterval].posted) {
                audioVideoBlobs[recordingInterval].posted = true;
                onDataAvailableInvoked(audioVideoBlobs[recordingInterval]);
            }
        };

        videoRecorder.ondataavailable = function(blob) {
            if (isFirefox) {
                return self.ondataavailable({
                    video: blob,
                    audio: blob
                });
            }

            if (!audioVideoBlobs[recordingInterval]) {
                audioVideoBlobs[recordingInterval] = {};
            }

            audioVideoBlobs[recordingInterval].video = blob;

            if (audioVideoBlobs[recordingInterval].audio && !audioVideoBlobs[recordingInterval].invokedOnce) {
                audioVideoBlobs[recordingInterval].invokedOnce = true;
                onDataAvailableInvoked(audioVideoBlobs[recordingInterval]);
            }
        };

        function onDataAvailableInvoked(blobs) {
            recordingInterval++;
            self.ondataavailable(blobs);
        }

        videoRecorder.onstop = audioRecorder.onstop = function(error) {
            self.onstop(error);
        };

        if (!isFirefox) {
            // to make sure both audio/video are synced.
            videoRecorder.onStartedDrawingNonBlankFrames = function() {
                webrtcdev.debug('Fired: onStartedDrawingNonBlankFrames');
                videoRecorder.clearOldRecordedFrames();
                audioRecorder.start(timeSlice);
            };
            videoRecorder.start(timeSlice);
        } else {
            videoRecorder.start(timeSlice);
        }
    };

    this.stop = function() {
        if (audioRecorder) audioRecorder.stop();
        if (videoRecorder) videoRecorder.stop();
    };

    this.ondataavailable = function(blob) {
        webrtcdev.log('ondataavailable..', blob);
    };

    this.onstop = function(error) {
        webrtcdev.warn('stopped..', error);
    };

    var audioRecorder;
    var videoRecorder;

    var audioVideoBlobs = {};
    var recordingInterval = 0;
}

function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function SaveToDisk(blobOrFile, fileName) {
    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(blobOrFile);
    hyperlink.target = '_blank';
    hyperlink.download = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + blobOrFile.type.split('/')[1];

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */'use strict';

// Last time updated: 2016-10-21 11:04:26 AM UTC

// Open-Sourced: https://github.com/muaz-khan/RecordRTC

//--------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
//--------------------------------------------------

// ____________
// RecordRTC.js

/**
 * {@link https://github.com/muaz-khan/RecordRTC|RecordRTC} is a JavaScript-based media-recording library for modern web-browsers (supporting WebRTC getUserMedia API). It is optimized for different devices and browsers to bring all client-side (pluginfree) recording solutions in single place.
 * @summary JavaScript audio/video recording library runs top over WebRTC getUserMedia API.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef RecordRTC
 * @class
 * @example
 * var recordRTC = RecordRTC(mediaStream, {
 *     type: 'video' // audio or video or gif or canvas
 * });
 *
 * // or, you can also use the "new" keyword
 * var recordRTC = new RecordRTC(mediaStream[, config]);
 * @see For further information:
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, etc.}
 */

function RecordRTC(mediaStream, config) {
    if (!mediaStream) {
        throw 'MediaStream is mandatory.';
    }

    config = config || {
        type: 'video'
    };

    config = new RecordRTCConfiguration(mediaStream, config);

    // a reference to user's recordRTC object
    var self = this;

    function startRecording() {
        if (!config.disableLogs) {
            webrtcdev.debug('started recording ' + config.type + ' stream.');
        }

        if (mediaRecorder) {
            mediaRecorder.clearRecordedData();
            mediaRecorder.resume();

            if (self.recordingDuration) {
                handleRecordingDuration();
            }
            return self;
        }

        initRecorder(function() {
            if (self.recordingDuration) {
                handleRecordingDuration();
            }
        });

        return self;
    }

    function initRecorder(initCallback) {
        if (initCallback) {
            config.initCallback = function() {
                initCallback();
                initCallback = config.initCallback = null; // recordRTC.initRecorder should be call-backed once.
            };
        }

        var Recorder = new GetRecorderType(mediaStream, config);

        mediaRecorder = new Recorder(mediaStream, config);
        mediaRecorder.record();

        if (!config.disableLogs) {
            webrtcdev.debug('Initialized recorderType:', mediaRecorder.constructor.name, 'for output-type:', config.type);
        }
    }

    function stopRecording(callback) {
        if (!mediaRecorder) {
            return webrtcdev.warn(WARNING);
        }

        /*jshint validthis:true */
        var recordRTC = this;

        if (!config.disableLogs) {
            webrtcdev.warn('Stopped recording ' + config.type + ' stream.');
        }

        if (config.type !== 'gif') {
            mediaRecorder.stop(_callback);
        } else {
            mediaRecorder.stop();
            _callback();
        }

        function _callback(__blob) {
            for (var item in mediaRecorder) {
                if (self) {
                    self[item] = mediaRecorder[item];
                }

                if (recordRTC) {
                    recordRTC[item] = mediaRecorder[item];
                }
            }

            var blob = mediaRecorder.blob;

            if (!blob) {
                if (__blob) {
                    mediaRecorder.blob = blob = __blob;
                } else {
                    throw 'Recording failed.';
                }
            }

            if (callback) {
                var url = URL.createObjectURL(blob);
                callback(url);
            }

            if (blob && !config.disableLogs) {
                webrtcdev.debug(blob.type, '->', bytesToSize(blob.size));
            }

            if (!config.autoWriteToDisk) {
                return;
            }

            getDataURL(function(dataURL) {
                var parameter = {};
                parameter[config.type + 'Blob'] = dataURL;
                DiskStorage.Store(parameter);
            });
        }
    }

    function pauseRecording() {
        if (!mediaRecorder) {
            return webrtcdev.warn(WARNING);
        }

        mediaRecorder.pause();

        if (!config.disableLogs) {
            webrtcdev.debug('Paused recording.');
        }
    }

    function resumeRecording() {
        if (!mediaRecorder) {
            return webrtcdev.warn(WARNING);
        }

        // not all libs have this method yet
        mediaRecorder.resume();

        if (!config.disableLogs) {
            webrtcdev.debug('Resumed recording.');
        }
    }

    function readFile(_blob) {
        postMessage(new FileReaderSync().readAsDataURL(_blob));
    }

    function getDataURL(callback, _mediaRecorder) {
        if (!callback) {
            throw 'Pass a callback function over getDataURL.';
        }

        var blob = _mediaRecorder ? _mediaRecorder.blob : (mediaRecorder || {}).blob;

        if (!blob) {
            if (!config.disableLogs) {
                webrtcdev.warn('Blob encoder did not finish its job yet.');
            }

            setTimeout(function() {
                getDataURL(callback, _mediaRecorder);
            }, 1000);
            return;
        }

        if (typeof Worker !== 'undefined' && !navigator.mozGetUserMedia) {
            var webWorker = processInWebWorker(readFile);

            webWorker.onmessage = function(event) {
                callback(event.data);
            };

            webWorker.postMessage(blob);
        } else {
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function(event) {
                callback(event.target.result);
            };
        }

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            URL.revokeObjectURL(blob);
            return worker;
        }
    }

    function handleRecordingDuration() {
        setTimeout(function() {
            stopRecording(self.onRecordingStopped);
        }, self.recordingDuration);
    }

    var WARNING = 'It seems that "startRecording" is not invoked for ' + config.type + ' recorder.';

    var mediaRecorder;

    var returnObject = {
        /**
         * This method starts recording. It doesn't take any arguments.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.startRecording();
         */
        startRecording: startRecording,

        /**
         * This method stops recording. It takes a single "callback" argument. It is suggested to get blob or URI in the callback to make sure all encoders finished their jobs.
         * @param {function} callback - This callback function is invoked after completion of all encoding jobs.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function(videoURL) {
         *     video.src = videoURL;
         *     recordRTC.blob; recordRTC.buffer;
         * });
         */
        stopRecording: stopRecording,

        /**
         * This method pauses the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.pauseRecording();
         */
        pauseRecording: pauseRecording,

        /**
         * This method resumes the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.resumeRecording();
         */
        resumeRecording: resumeRecording,

        /**
         * This method initializes the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.initRecorder();
         */
        initRecorder: initRecorder,

        /**
         * This method sets the recording duration.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.setRecordingDuration();
         */
        setRecordingDuration: function(milliseconds, callback) {
            if (typeof milliseconds === 'undefined') {
                throw 'milliseconds is required.';
            }

            if (typeof milliseconds !== 'number') {
                throw 'milliseconds must be a number.';
            }

            self.recordingDuration = milliseconds;
            self.onRecordingStopped = callback || function() {};

            return {
                onRecordingStopped: function(callback) {
                    self.onRecordingStopped = callback;
                }
            };
        },

        /**
         * This method can be used to clear/reset all the recorded data.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.clearRecordedData();
         */
        clearRecordedData: function() {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            mediaRecorder.clearRecordedData();

            if (!config.disableLogs) {
                webrtcdev.debug('Cleared old recorded data.');
            }
        },

        /**
         * It is equivalent to <code class="str">"recordRTC.blob"</code> property.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var blob = recordRTC.getBlob();
         *
         *     // equivalent to: recordRTC.blob property
         *     var blob = recordRTC.blob;
         * });
         */
        getBlob: function() {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            return mediaRecorder.blob;
        },

        /**
         * This method returns the DataURL. It takes a single "callback" argument.
         * @param {function} callback - DataURL is passed back over this callback.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     recordRTC.getDataURL(function(dataURL) {
         *         video.src = dataURL;
         *     });
         * });
         */
        getDataURL: getDataURL,

        /**
         * This method returns the Virutal/Blob URL. It doesn't take any arguments.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     video.src = recordRTC.toURL();
         * });
         */
        toURL: function() {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            return URL.createObjectURL(mediaRecorder.blob);
        },

        /**
         * This method saves the blob/file to disk (by invoking save-as dialog). It takes a single (optional) argument i.e. FileName
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     recordRTC.save('file-name');
         * });
         */
        save: function(fileName) {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            invokeSaveAsDialog(mediaRecorder.blob, fileName);
        },

        /**
         * This method gets a blob from indexed-DB storage. It takes a single "callback" argument.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.getFromDisk(function(dataURL) {
         *     video.src = dataURL;
         * });
         */
        getFromDisk: function(callback) {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            RecordRTC.getFromDisk(config.type, callback);
        },

        /**
         * This method appends an array of webp images to the recorded video-blob. It takes an "array" object.
         * @type {Array.<Array>}
         * @param {Array} arrayOfWebPImages - Array of webp images.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * var arrayOfWebPImages = [];
         * arrayOfWebPImages.push({
         *     duration: index,
         *     image: 'data:image/webp;base64,...'
         * });
         * recordRTC.setAdvertisementArray(arrayOfWebPImages);
         */
        setAdvertisementArray: function(arrayOfWebPImages) {
            config.advertisement = [];

            var length = arrayOfWebPImages.length;
            for (var i = 0; i < length; i++) {
                config.advertisement.push({
                    duration: i,
                    image: arrayOfWebPImages[i]
                });
            }
        },

        /**
         * It is equivalent to <code class="str">"recordRTC.getBlob()"</code> method.
         * @property {Blob} blob - Recorded Blob can be accessed using this property.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var blob = recordRTC.blob;
         *
         *     // equivalent to: recordRTC.getBlob() method
         *     var blob = recordRTC.getBlob();
         * });
         */
        blob: null,

        /**
         * @todo Add descriptions.
         * @property {number} bufferSize - Either audio device's default buffer-size, or your custom value.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var bufferSize = recordRTC.bufferSize;
         * });
         */
        bufferSize: 0,

        /**
         * @todo Add descriptions.
         * @property {number} sampleRate - Audio device's default sample rates.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var sampleRate = recordRTC.sampleRate;
         * });
         */
        sampleRate: 0,

        /**
         * @todo Add descriptions.
         * @property {ArrayBuffer} buffer - Audio ArrayBuffer, supported only in Chrome.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var buffer = recordRTC.buffer;
         * });
         */
        buffer: null,

        /**
         * @todo Add descriptions.
         * @property {DataView} view - Audio DataView, supported only in Chrome.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var dataView = recordRTC.view;
         * });
         */
        view: null
    };

    if (!this) {
        self = returnObject;
        return returnObject;
    }

    // if someone wants to use RecordRTC with the "new" keyword.
    for (var prop in returnObject) {
        this[prop] = returnObject[prop];
    }

    self = this;

    return returnObject;
}

/**
 * This method can be used to get all recorded blobs from IndexedDB storage.
 * @param {string} type - 'all' or 'audio' or 'video' or 'gif'
 * @param {function} callback - Callback function to get all stored blobs.
 * @method
 * @memberof RecordRTC
 * @example
 * RecordRTC.getFromDisk('all', function(dataURL, type){
 *     if(type === 'audio') { }
 *     if(type === 'video') { }
 *     if(type === 'gif')   { }
 * });
 */
RecordRTC.getFromDisk = function(type, callback) {
    if (!callback) {
        throw 'callback is mandatory.';
    }

    webrtcdev.log('Getting recorded ' + (type === 'all' ? 'blobs' : type + ' blob ') + ' from disk!');
    DiskStorage.Fetch(function(dataURL, _type) {
        if (type !== 'all' && _type === type + 'Blob' && callback) {
            callback(dataURL);
        }

        if (type === 'all' && callback) {
            callback(dataURL, _type.replace('Blob', ''));
        }
    });
};

/**
 * This method can be used to store recorded blobs into IndexedDB storage.
 * @param {object} options - {audio: Blob, video: Blob, gif: Blob}
 * @method
 * @memberof RecordRTC
 * @example
 * RecordRTC.writeToDisk({
 *     audio: audioBlob,
 *     video: videoBlob,
 *     gif  : gifBlob
 * });
 */
RecordRTC.writeToDisk = function(options) {
    webrtcdev.log('Writing recorded blob(s) to disk!');
    options = options || {};
    if (options.audio && options.video && options.gif) {
        options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
                options.gif.getDataURL(function(gifDataURL) {
                    DiskStorage.Store({
                        audioBlob: audioDataURL,
                        videoBlob: videoDataURL,
                        gifBlob: gifDataURL
                    });
                });
            });
        });
    } else if (options.audio && options.video) {
        options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
                DiskStorage.Store({
                    audioBlob: audioDataURL,
                    videoBlob: videoDataURL
                });
            });
        });
    } else if (options.audio && options.gif) {
        options.audio.getDataURL(function(audioDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                    audioBlob: audioDataURL,
                    gifBlob: gifDataURL
                });
            });
        });
    } else if (options.video && options.gif) {
        options.video.getDataURL(function(videoDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                    videoBlob: videoDataURL,
                    gifBlob: gifDataURL
                });
            });
        });
    } else if (options.audio) {
        options.audio.getDataURL(function(audioDataURL) {
            DiskStorage.Store({
                audioBlob: audioDataURL
            });
        });
    } else if (options.video) {
        options.video.getDataURL(function(videoDataURL) {
            DiskStorage.Store({
                videoBlob: videoDataURL
            });
        });
    } else if (options.gif) {
        options.gif.getDataURL(function(gifDataURL) {
            DiskStorage.Store({
                gifBlob: gifDataURL
            });
        });
    }
};

if (typeof module !== 'undefined' /* && !!module.exports*/ ) {
    module.exports = RecordRTC;
}

if (typeof define === 'function' && define.amd) {
    define('RecordRTC', [], function() {
        return RecordRTC;
    });
}

// __________________________
// RecordRTC-Configuration.js

/**
 * {@link RecordRTCConfiguration} is an inner/private helper for {@link RecordRTC}.
 * @summary It configures the 2nd parameter passed over {@link RecordRTC} and returns a valid "config" object.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef RecordRTCConfiguration
 * @class
 * @example
 * var options = RecordRTCConfiguration(mediaStream, options);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, getNativeBlob:true, etc.}
 */

function RecordRTCConfiguration(mediaStream, config) {
    if (config.recorderType && !config.type) {
        if (config.recorderType === WhammyRecorder || config.recorderType === CanvasRecorder) {
            config.type = 'video';
        } else if (config.recorderType === GifRecorder) {
            config.type = 'gif';
        } else if (config.recorderType === StereoAudioRecorder) {
            config.type = 'audio';
        } else if (config.recorderType === MediaStreamRecorder) {
            if (mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length) {
                config.type = 'video';
            } else if (mediaStream.getAudioTracks().length && !mediaStream.getVideoTracks().length) {
                config.type = 'audio';
            } else if (!mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length) {
                config.type = 'audio';
            } else {
                // config.type = 'UnKnown';
            }
        }
    }

    if (typeof MediaStreamRecorder !== 'undefined' && typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype) {
        if (!config.mimeType) {
            config.mimeType = 'video/webm';
        }

        if (!config.type) {
            config.type = config.mimeType.split('/')[0];
        }

        if (!config.bitsPerSecond) {
            // config.bitsPerSecond = 128000;
        }
    }

    // consider default type=audio
    if (!config.type) {
        if (config.mimeType) {
            config.type = config.mimeType.split('/')[0];
        }
        if (!config.type) {
            config.type = 'audio';
        }
    }

    return config;
}

// __________________
// GetRecorderType.js

/**
 * {@link GetRecorderType} is an inner/private helper for {@link RecordRTC}.
 * @summary It returns best recorder-type available for your browser.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef GetRecorderType
 * @class
 * @example
 * var RecorderType = GetRecorderType(options);
 * var recorder = new RecorderType(options);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, etc.}
 */

function GetRecorderType(mediaStream, config) {
    var recorder;

    // StereoAudioRecorder can work with all three: Edge, Firefox and Chrome
    // todo: detect if it is Edge, then auto use: StereoAudioRecorder
    if (isChrome || isEdge || isOpera) {
        // Media Stream Recording API has not been implemented in chrome yet;
        // That's why using WebAudio API to record stereo audio in WAV format
        recorder = StereoAudioRecorder;
    }

    if (typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype && !isChrome) {
        recorder = MediaStreamRecorder;
    }

    // video recorder (in WebM format)
    if (config.type === 'video' && (isChrome || isOpera)) {
        recorder = WhammyRecorder;
    }

    // video recorder (in Gif format)
    if (config.type === 'gif') {
        recorder = GifRecorder;
    }

    // html2canvas recording!
    if (config.type === 'canvas') {
        recorder = CanvasRecorder;
    }

    if (isMediaRecorderCompatible() && recorder !== CanvasRecorder && recorder !== GifRecorder && typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype) {
        if (mediaStream.getVideoTracks().length) {
            recorder = MediaStreamRecorder;
        }
    }

    if (config.recorderType) {
        recorder = config.recorderType;
    }

    if (!config.disableLogs && !!recorder && !!recorder.name) {
        webrtcdev.debug('Using recorderType:', recorder.name || recorder.constructor.name);
    }

    return recorder;
}

// _____________
// MRecordRTC.js

/**
 * MRecordRTC runs on top of {@link RecordRTC} to bring multiple recordings in a single place, by providing simple API.
 * @summary MRecordRTC stands for "Multiple-RecordRTC".
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef MRecordRTC
 * @class
 * @example
 * var recorder = new MRecordRTC();
 * recorder.addStream(MediaStream);
 * recorder.mediaType = {
 *     audio: true, // or StereoAudioRecorder or MediaStreamRecorder
 *     video: true, // or WhammyRecorder or MediaStreamRecorder
 *     gif: true    // or GifRecorder
 * };
 * // mimeType is optional and should be set only in advance cases.
 * recorder.mimeType = {
 *     audio: 'audio/wav',
 *     video: 'video/webm',
 *     gif:   'image/gif'
 * };
 * recorder.startRecording();
 * @see For further information:
 * @see {@link https://github.com/muaz-khan/RecordRTC/tree/master/MRecordRTC|MRecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

function MRecordRTC(mediaStream) {

    /**
     * This method attaches MediaStream object to {@link MRecordRTC}.
     * @param {MediaStream} mediaStream - A MediaStream object, either fetched using getUserMedia API, or generated using captureStreamUntilEnded or WebAudio API.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.addStream(MediaStream);
     */
    this.addStream = function(_mediaStream) {
        if (_mediaStream) {
            mediaStream = _mediaStream;
        }
    };

    /**
     * This property can be used to set the recording type e.g. audio, or video, or gif, or canvas.
     * @property {object} mediaType - {audio: true, video: true, gif: true}
     * @memberof MRecordRTC
     * @example
     * var recorder = new MRecordRTC();
     * recorder.mediaType = {
     *     audio: true, // TRUE or StereoAudioRecorder or MediaStreamRecorder
     *     video: true, // TRUE or WhammyRecorder or MediaStreamRecorder
     *     gif  : true  // TRUE or GifRecorder
     * };
     */
    this.mediaType = {
        audio: true,
        video: true
    };

    /**
     * This method starts recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.startRecording();
     */
    this.startRecording = function() {
        var mediaType = this.mediaType;
        var recorderType;
        var mimeType = this.mimeType || {
            audio: null,
            video: null,
            gif: null
        };

        if (typeof mediaType.audio !== 'function' && isMediaRecorderCompatible() && mediaStream.getAudioTracks && !mediaStream.getAudioTracks().length) {
            // Firefox supports both audio/video in single blob
            mediaType.audio = false;
        }

        if (typeof mediaType.video !== 'function' && isMediaRecorderCompatible() && mediaStream.getVideoTracks && !mediaStream.getVideoTracks().length) {
            // Firefox supports both audio/video in single blob
            mediaType.video = false;
        }

        if (!mediaType.audio && !mediaType.video) {
            throw 'MediaStream must have either audio or video tracks.';
        }

        if (!!mediaType.audio) {
            recorderType = null;
            if (typeof mediaType.audio === 'function') {
                recorderType = mediaType.audio;
            }

            this.audioRecorder = new RecordRTC(mediaStream, {
                type: 'audio',
                bufferSize: this.bufferSize,
                sampleRate: this.sampleRate,
                numberOfAudioChannels: this.numberOfAudioChannels || 2,
                disableLogs: this.disableLogs,
                recorderType: recorderType,
                mimeType: mimeType.audio
            });

            if (!mediaType.video) {
                this.audioRecorder.startRecording();
            }
        }

        if (!!mediaType.video) {
            recorderType = null;
            if (typeof mediaType.video === 'function') {
                recorderType = mediaType.video;
            }

            var newStream = mediaStream;

            if (isMediaRecorderCompatible() && !!mediaType.audio && typeof mediaType.audio === 'function') {
                var videoTrack = mediaStream.getVideoTracks()[0];

                if (!!navigator.mozGetUserMedia) {
                    newStream = new MediaStream();
                    newStream.addTrack(videoTrack);

                    if (recorderType && recorderType === WhammyRecorder) {
                        // Firefox does NOT support webp-encoding yet
                        recorderType = MediaStreamRecorder;
                    }
                } else {
                    newStream = new MediaStream([videoTrack]);
                }
            }

            this.videoRecorder = new RecordRTC(newStream, {
                type: 'video',
                video: this.video,
                canvas: this.canvas,
                frameInterval: this.frameInterval || 10,
                disableLogs: this.disableLogs,
                recorderType: recorderType,
                mimeType: mimeType.video
            });

            if (!mediaType.audio) {
                this.videoRecorder.startRecording();
            }
        }

        if (!!mediaType.audio && !!mediaType.video) {
            var self = this;
            if (isMediaRecorderCompatible()) {
                self.audioRecorder = null;
                self.videoRecorder.startRecording();
            } else {
                self.videoRecorder.initRecorder(function() {
                    self.audioRecorder.initRecorder(function() {
                        // Both recorders are ready to record things accurately
                        self.videoRecorder.startRecording();
                        self.audioRecorder.startRecording();
                    });
                });
            }
        }

        if (!!mediaType.gif) {
            recorderType = null;
            if (typeof mediaType.gif === 'function') {
                recorderType = mediaType.gif;
            }
            this.gifRecorder = new RecordRTC(mediaStream, {
                type: 'gif',
                frameRate: this.frameRate || 200,
                quality: this.quality || 10,
                disableLogs: this.disableLogs,
                recorderType: recorderType,
                mimeType: mimeType.gif
            });
            this.gifRecorder.startRecording();
        }
    };

    /**
     * This method stops recording.
     * @param {function} callback - Callback function is invoked when all encoders finished their jobs.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.stopRecording(function(recording){
     *     var audioBlob = recording.audio;
     *     var videoBlob = recording.video;
     *     var gifBlob   = recording.gif;
     * });
     */
    this.stopRecording = function(callback) {
        callback = callback || function() {};

        if (this.audioRecorder) {
            this.audioRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'audio');
            });
        }

        if (this.videoRecorder) {
            this.videoRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'video');
            });
        }

        if (this.gifRecorder) {
            this.gifRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'gif');
            });
        }
    };

    /**
     * This method pauses recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.pauseRecording();
     */
    this.pauseRecording = function() {
        if (this.audioRecorder) {
            this.audioRecorder.pauseRecording();
        }

        if (this.videoRecorder) {
            this.videoRecorder.pauseRecording();
        }

        if (this.gifRecorder) {
            this.gifRecorder.pauseRecording();
        }
    };

    /**
     * This method resumes recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.resumeRecording();
     */
    this.resumeRecording = function() {
        if (this.audioRecorder) {
            this.audioRecorder.resumeRecording();
        }

        if (this.videoRecorder) {
            this.videoRecorder.resumeRecording();
        }

        if (this.gifRecorder) {
            this.gifRecorder.resumeRecording();
        }
    };

    /**
     * This method can be used to manually get all recorded blobs.
     * @param {function} callback - All recorded blobs are passed back to the "callback" function.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.getBlob(function(recording){
     *     var audioBlob = recording.audio;
     *     var videoBlob = recording.video;
     *     var gifBlob   = recording.gif;
     * });
     * // or
     * var audioBlob = recorder.getBlob().audio;
     * var videoBlob = recorder.getBlob().video;
     */
    this.getBlob = function(callback) {
        var output = {};

        if (this.audioRecorder) {
            output.audio = this.audioRecorder.getBlob();
        }

        if (this.videoRecorder) {
            output.video = this.videoRecorder.getBlob();
        }

        if (this.gifRecorder) {
            output.gif = this.gifRecorder.getBlob();
        }

        if (callback) {
            callback(output);
        }

        return output;
    };

    /**
     * This method can be used to manually get all recorded blobs' DataURLs.
     * @param {function} callback - All recorded blobs' DataURLs are passed back to the "callback" function.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.getDataURL(function(recording){
     *     var audioDataURL = recording.audio;
     *     var videoDataURL = recording.video;
     *     var gifDataURL   = recording.gif;
     * });
     */
    this.getDataURL = function(callback) {
        this.getBlob(function(blob) {
            if(blob.audio && blob.video) {
                getDataURL(blob.audio, function(_audioDataURL) {
                    getDataURL(blob.video, function(_videoDataURL) {
                        callback({
                            audio: _audioDataURL,
                            video: _videoDataURL
                        });
                    });
                });
          }
          else if(blob.audio) {
              getDataURL(blob.audio, function(_audioDataURL) {
                  callback({
                      audio: _audioDataURL
                  });
              });
          }
          else if(blob.video) {
              getDataURL(blob.video, function(_videoDataURL) {
                  callback({
                      video: _videoDataURL
                  });
              });
          }
        });

        function getDataURL(blob, callback00) {
            if (typeof Worker !== 'undefined') {
                var webWorker = processInWebWorker(function readFile(_blob) {
                    postMessage(new FileReaderSync().readAsDataURL(_blob));
                });

                webWorker.onmessage = function(event) {
                    callback00(event.data);
                };

                webWorker.postMessage(blob);
            } else {
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = function(event) {
                    callback00(event.target.result);
                };
            }
        }

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            var url;
            if (typeof URL !== 'undefined') {
                url = URL;
            } else if (typeof webkitURL !== 'undefined') {
                url = webkitURL;
            } else {
                throw 'Neither URL nor webkitURL detected.';
            }
            url.revokeObjectURL(blob);
            return worker;
        }
    };

    /**
     * This method can be used to ask {@link MRecordRTC} to write all recorded blobs into IndexedDB storage.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.writeToDisk();
     */
    this.writeToDisk = function() {
        RecordRTC.writeToDisk({
            audio: this.audioRecorder,
            video: this.videoRecorder,
            gif: this.gifRecorder
        });
    };

    /**
     * This method can be used to invoke a save-as dialog for all recorded blobs.
     * @param {object} args - {audio: 'audio-name', video: 'video-name', gif: 'gif-name'}
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.save({
     *     audio: 'audio-file-name',
     *     video: 'video-file-name',
     *     gif  : 'gif-file-name'
     * });
     */
    this.save = function(args) {
        args = args || {
            audio: true,
            video: true,
            gif: true
        };

        if (!!args.audio && this.audioRecorder) {
            this.audioRecorder.save(typeof args.audio === 'string' ? args.audio : '');
        }

        if (!!args.video && this.videoRecorder) {
            this.videoRecorder.save(typeof args.video === 'string' ? args.video : '');
        }
        if (!!args.gif && this.gifRecorder) {
            this.gifRecorder.save(typeof args.gif === 'string' ? args.gif : '');
        }
    };
}

/**
 * This method can be used to get all recorded blobs from IndexedDB storage.
 * @param {string} type - 'all' or 'audio' or 'video' or 'gif'
 * @param {function} callback - Callback function to get all stored blobs.
 * @method
 * @memberof MRecordRTC
 * @example
 * MRecordRTC.getFromDisk('all', function(dataURL, type){
 *     if(type === 'audio') { }
 *     if(type === 'video') { }
 *     if(type === 'gif')   { }
 * });
 */
MRecordRTC.getFromDisk = RecordRTC.getFromDisk;

/**
 * This method can be used to store recorded blobs into IndexedDB storage.
 * @param {object} options - {audio: Blob, video: Blob, gif: Blob}
 * @method
 * @memberof MRecordRTC
 * @example
 * MRecordRTC.writeToDisk({
 *     audio: audioBlob,
 *     video: videoBlob,
 *     gif  : gifBlob
 * });
 */
MRecordRTC.writeToDisk = RecordRTC.writeToDisk;

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.MRecordRTC = MRecordRTC;
}

var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

(function(that) {
    if (!that) {
        return;
    }

    if (typeof window !== 'undefined') {
        return;
    }

    if (typeof global === 'undefined') {
        return;
    }

    global.navigator = {
        userAgent: browserFakeUserAgent,
        getUserMedia: function() {}
    };

    if (!global.webrtcdev) {
        global.webrtcdev = {};
    }

    if (typeof global.webrtcdev.debug === 'undefined') {
        global.webrtcdev.debug = global.webrtcdev.info = global.webrtcdev.error = global.webrtcdev.log = global.webrtcdev.log || function() {
            webrtcdev.log(arguments);
        };
    }

    if (typeof document === 'undefined') {
        /*global document:true */
        that.document = {};

        document.createElement = document.captureStream = document.mozCaptureStream = function() {
            var obj = {
                getContext: function() {
                    return obj;
                },
                play: function() {},
                pause: function() {},
                drawImage: function() {},
                toDataURL: function() {
                    return '';
                }
            };
            return obj;
        };

        that.HTMLVideoElement = function() {};
    }

    if (typeof location === 'undefined') {
        /*global location:true */
        that.location = {
            protocol: 'file:',
            href: '',
            hash: ''
        };
    }

    if (typeof screen === 'undefined') {
        /*global screen:true */
        that.screen = {
            width: 0,
            height: 0
        };
    }

    if (typeof URL === 'undefined') {
        /*global screen:true */
        that.URL = {
            createObjectURL: function() {
                return '';
            },
            revokeObjectURL: function() {
                return '';
            }
        };
    }

    /*global window:true */
    that.window = global;
})(typeof global !== 'undefined' ? global : null);

// _____________________________
// Cross-Browser-Declarations.js

// animation-frame used in WebM recording

/*jshint -W079 */
var requestAnimationFrame = window.requestAnimationFrame;
if (typeof requestAnimationFrame === 'undefined') {
    if (typeof webkitRequestAnimationFrame !== 'undefined') {
        /*global requestAnimationFrame:true */
        requestAnimationFrame = webkitRequestAnimationFrame;
    }

    if (typeof mozRequestAnimationFrame !== 'undefined') {
        /*global requestAnimationFrame:true */
        requestAnimationFrame = mozRequestAnimationFrame;
    }
}

/*jshint -W079 */
var cancelAnimationFrame = window.cancelAnimationFrame;
if (typeof cancelAnimationFrame === 'undefined') {
    if (typeof webkitCancelAnimationFrame !== 'undefined') {
        /*global cancelAnimationFrame:true */
        cancelAnimationFrame = webkitCancelAnimationFrame;
    }

    if (typeof mozCancelAnimationFrame !== 'undefined') {
        /*global cancelAnimationFrame:true */
        cancelAnimationFrame = mozCancelAnimationFrame;
    }
}

// WebAudio API representer
var AudioContext = window.AudioContext;

if (typeof AudioContext === 'undefined') {
    if (typeof webkitAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = webkitAudioContext;
    }

    if (typeof mozAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = mozAudioContext;
    }
}

/*jshint -W079 */
var URL = window.URL;

if (typeof URL === 'undefined' && typeof webkitURL !== 'undefined') {
    /*global URL:true */
    URL = webkitURL;
}

if (typeof navigator !== 'undefined' && typeof navigator.getUserMedia === 'undefined') { // maybe window.navigator?
    if (typeof navigator.webkitGetUserMedia !== 'undefined') {
        navigator.getUserMedia = navigator.webkitGetUserMedia;
    }

    if (typeof navigator.mozGetUserMedia !== 'undefined') {
        navigator.getUserMedia = navigator.mozGetUserMedia;
    }
}

var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveBlob || !!navigator.msSaveOrOpenBlob);
var isOpera = !!window.opera || navigator.userAgent.indexOf('OPR/') !== -1;
var isChrome = !isOpera && !isEdge && !!navigator.webkitGetUserMedia;

var MediaStream = window.MediaStream;

if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
}

/*global MediaStream:true */
if (typeof MediaStream !== 'undefined') {
    if (!('getVideoTracks' in MediaStream.prototype)) {
        MediaStream.prototype.getVideoTracks = function() {
            if (!this.getTracks) {
                return [];
            }

            var tracks = [];
            this.getTracks.forEach(function(track) {
                if (track.kind.toString().indexOf('video') !== -1) {
                    tracks.push(track);
                }
            });
            return tracks;
        };

        MediaStream.prototype.getAudioTracks = function() {
            if (!this.getTracks) {
                return [];
            }

            var tracks = [];
            this.getTracks.forEach(function(track) {
                if (track.kind.toString().indexOf('audio') !== -1) {
                    tracks.push(track);
                }
            });
            return tracks;
        };
    }

    if (!('stop' in MediaStream.prototype)) {
        MediaStream.prototype.stop = function() {
            this.getAudioTracks().forEach(function(track) {
                if (!!track.stop) {
                    track.stop();
                }
            });

            this.getVideoTracks().forEach(function(track) {
                if (!!track.stop) {
                    track.stop();
                }
            });
        };
    }
}

// below function via: http://goo.gl/B3ae8c
/**
 * @param {number} bytes - Pass bytes and get formafted string.
 * @returns {string} - formafted string
 * @example
 * bytesToSize(1024*1024*5) === '5 GB'
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */
function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

/**
 * @param {Blob} file - File or Blob object. This parameter is required.
 * @param {string} fileName - Optional file name e.g. "Recorded-Video.webm"
 * @example
 * invokeSaveAsDialog(blob or file, [optional] fileName);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */
function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        try {
            file.type = 'video/webm';
        } catch (e) {}
    }

    var fileExtension = (file.type || 'video/webm').split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}

// __________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// Storage.js

/**
 * Storage is a standalone object used by {@link RecordRTC} to store reusable objects e.g. "new AudioContext".
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @example
 * Storage.AudioContext === webkitAudioContext
 * @property {webkitAudioContext} AudioContext - Keeps a reference to AudioContext object.
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */

var Storage = {};

if (typeof AudioContext !== 'undefined') {
    Storage.AudioContext = AudioContext;
} else if (typeof webkitAudioContext !== 'undefined') {
    Storage.AudioContext = webkitAudioContext;
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.Storage = Storage;
}

function isMediaRecorderCompatible() {
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isChrome = !!window.chrome && !isOpera;
    var isFirefox = typeof window.InstallTrigger !== 'undefined';

    if (isFirefox) {
        return true;
    }

    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

    if (isChrome || isOpera) {
        verOffset = nAgt.indexOf('Chrome');
        fullVersion = nAgt.substring(verOffset + 7);
    }

    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(';')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    if ((ix = fullVersion.indexOf(' ')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return majorVersion >= 49;
}

// ______________________
// MediaStreamRecorder.js

// todo: need to show alert boxes for incompatible cases
// encoder only supports 48k/16k mono audio channel

/*
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

/**
 * MediaStreamRecorder is an abstraction layer for "MediaRecorder API". It is used by {@link RecordRTC} to record MediaStream(s) in Firefox.
 * @summary Runs top over MediaRecorder API.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef MediaStreamRecorder
 * @class
 * @example
 * var options = {
 *     mimeType: 'video/mp4', // audio/ogg or video/webm
 *     audioBitsPerSecond : 256 * 8 * 1024,
 *     videoBitsPerSecond : 256 * 8 * 1024,
 *     bitsPerSecond: 256 * 8 * 1024,  // if this is provided, skip above two
 *     getNativeBlob: true // by default it is false
 * }
 * var recorder = new MediaStreamRecorder(MediaStream, options);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 *
 *     // or
 *     var blob = recorder.blob;
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {disableLogs:true, initCallback: function, mimeType: "video/webm", onAudioProcessStarted: function}
 */

function MediaStreamRecorder(mediaStream, config) {
    var self = this;

    config = config || {
        // bitsPerSecond: 256 * 8 * 1024,
        mimeType: 'video/webm'
    };

    if (config.type === 'audio') {
        if (mediaStream.getVideoTracks().length && mediaStream.getAudioTracks().length) {
            var stream;
            if (!!navigator.mozGetUserMedia) {
                stream = new MediaStream();
                stream.addTrack(mediaStream.getAudioTracks()[0]);
            } else {
                // webkitMediaStream
                stream = new MediaStream(mediaStream.getAudioTracks());
            }
            mediaStream = stream;
        }

        if (!config.mimeType || config.mimeType.toString().toLowerCase().indexOf('audio') === -1) {
            config.mimeType = isChrome ? 'audio/webm' : 'audio/ogg';
        }

        if (config.mimeType && config.mimeType.toString().toLowerCase() !== 'audio/ogg' && !!navigator.mozGetUserMedia) {
            // forcing better codecs on Firefox (via #166)
            config.mimeType = 'audio/ogg';
        }
    }

    /**
     * This method records MediaStream.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        self.blob = null;

        var recorderHints = config;

        if (!config.disableLogs) {
            webrtcdev.log('Passing following config over MediaRecorder API.', recorderHints);
        }

        if (mediaRecorder) {
            // mandatory to make sure Firefox doesn't fails to record streams 3-4 times without reloading the page.
            mediaRecorder = null;
        }

        if (isChrome && !isMediaRecorderCompatible()) {
            // to support video-only recording on stable
            recorderHints = 'video/vp8';
        }

        // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp
        // https://wiki.mozilla.org/Gecko:MediaRecorder
        // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html

        // starting a recording session; which will initiate "Reading Thread"
        // "Reading Thread" are used to prevent main-thread blocking scenarios
        try {
            mediaRecorder = new MediaRecorder(mediaStream, recorderHints);
        } catch (e) {
            mediaRecorder = new MediaRecorder(mediaStream);
        }

        if ('canRecordMimeType' in mediaRecorder && mediaRecorder.canRecordMimeType(config.mimeType) === false) {
            if (!config.disableLogs) {
                webrtcdev.warn('MediaRecorder API seems unable to record mimeType:', config.mimeType);
            }
        }

        // i.e. stop recording when <video> is paused by the user; and auto restart recording 
        // when video is resumed. E.g. yourStream.getVideoTracks()[0].muted = true; // it will auto-stop recording.
        mediaRecorder.ignoreMutedMedia = config.ignoreMutedMedia || false;

        // Dispatching OnDataAvailable Handler
        mediaRecorder.ondataavailable = function(e) {
            if (self.dontFireOnDataAvailableEvent) {
                return;
            }

            if (!e.data || !e.data.size || e.data.size < 100 || self.blob) {
                return;
            }

            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof MediaStreamRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            self.blob = config.getNativeBlob ? e.data : new Blob([e.data], {
                type: config.mimeType || 'video/webm'
            });

            if (self.recordingCallback) {
                self.recordingCallback(self.blob);
                self.recordingCallback = null;
            }
        };

        mediaRecorder.onerror = function(error) {
            if (!config.disableLogs) {
                if (error.name === 'InvalidState') {
                    webrtcdev.error('The MediaRecorder is not in a state in which the proposed operation is allowed to be executed.');
                } else if (error.name === 'OutOfMemory') {
                    webrtcdev.error('The UA has exhaused the available memory. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'IllegalStreamModification') {
                    webrtcdev.error('A modification to the stream has occurred that makes it impossible to continue recording. An example would be the addition of a Track while recording is occurring. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'OtherRecordingError') {
                    webrtcdev.error('Used for an fatal error other than those listed above. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'GenericError') {
                    webrtcdev.error('The UA cannot provide the codec or recording option that has been requested.', error);
                } else {
                    webrtcdev.error('MediaRecorder Error', error);
                }
            }

            // When the stream is "ended" set recording to 'inactive' 
            // and stop gathering data. Callers should not rely on 
            // exactness of the timeSlice value, especially 
            // if the timeSlice value is small. Callers should 
            // consider timeSlice as a minimum value

            if (mediaRecorder.state !== 'inactive' && mediaRecorder.state !== 'stopped') {
                mediaRecorder.stop();
            }
        };

        // void start(optional long mTimeSlice)
        // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
        // handler. "mTimeSlice < 0" means Session object does not push encoded data to
        // onDataAvailable, instead, it passive wait the client side pull encoded data
        // by calling requestData API.
        mediaRecorder.start(3.6e+6);

        // Start recording. If timeSlice has been provided, mediaRecorder will
        // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
        // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.

        if (config.onAudioProcessStarted) {
            config.onAudioProcessStarted();
        }

        if (config.initCallback) {
            config.initCallback();
        }
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }
        this.recordingCallback = function(blob) {
            mediaRecorder = null;

            if (callback) {
                callback(blob);
            }
        };

        // mediaRecorder.state === 'recording' means that media recorder is associated with "session"
        // mediaRecorder.state === 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

        if (mediaRecorder.state === 'recording') {
            // "stop" method auto invokes "requestData"!
            // mediaRecorder.requestData();
            mediaRecorder.stop();
        }
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (this.dontFireOnDataAvailableEvent) {
            this.dontFireOnDataAvailableEvent = false;

            var disableLogs = config.disableLogs;
            config.disableLogs = true;
            this.record();
            config.disableLogs = disableLogs;
            return;
        }

        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        if (!mediaRecorder) {
            return;
        }

        this.pause();

        this.dontFireOnDataAvailableEvent = true;
        this.stop();
    };

    // Reference to "MediaRecorder" object
    var mediaRecorder;

    function isMediaStreamActive() {
        if ('active' in mediaStream) {
            if (!mediaStream.active) {
                return false;
            }
        } else if ('ended' in mediaStream) { // old hack
            if (mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

    var self = this;

    // this method checks if media stream is stopped
    // or any track is ended.
    (function looper() {
        if (!mediaRecorder) {
            return;
        }

        if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
                webrtcdev.log('MediaStream seems stopped.');
            }
            self.stop();
            return;
        }

        setTimeout(looper, 1000); // check every second
    })();
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.MediaStreamRecorder = MediaStreamRecorder;
}

// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js
// https://github.com/mattdiamond/Recorderjs#license-mit
// ______________________
// StereoAudioRecorder.js

/**
 * StereoAudioRecorder is a standalone class used by {@link RecordRTC} to bring "stereo" audio-recording in chrome.
 * @summary JavaScript standalone object for stereo audio recording.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef StereoAudioRecorder
 * @class
 * @example
 * var recorder = new StereoAudioRecorder(MediaStream, {
 *     sampleRate: 44100,
 *     bufferSize: 4096
 * });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {sampleRate: 44100, bufferSize: 4096, numberOfAudioChannels: 1, etc.}
 */

function StereoAudioRecorder(mediaStream, config) {
    if (!mediaStream.getAudioTracks().length) {
        throw 'Your stream has no audio tracks.';
    }

    config = config || {};

    var self = this;

    // variables
    var leftchannel = [];
    var rightchannel = [];
    var recording = false;
    var recordingLength = 0;
    var jsAudioNode;

    var numberOfAudioChannels = 2;

    // backward compatibility
    if (config.leftChannel === true) {
        numberOfAudioChannels = 1;
    }

    if (config.numberOfAudioChannels === 1) {
        numberOfAudioChannels = 1;
    }

    if (!config.disableLogs) {
        webrtcdev.debug('StereoAudioRecorder is set to record number of channels: ', numberOfAudioChannels);
    }

    function isMediaStreamActive() {
        if ('active' in mediaStream) {
            if (!mediaStream.active) {
                return false;
            }
        } else if ('ended' in mediaStream) { // old hack
            if (mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

    /**
     * This method records MediaStream.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (isMediaStreamActive() === false) {
            throw 'Please make sure MediaStream is active.';
        }

        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;

        if (audioInput) {
            audioInput.connect(jsAudioNode);
        }

        // to prevent self audio to be connected with speakers
        // jsAudioNode.connect(context.destination);

        isAudioProcessStarted = isPaused = false;
        recording = true;
    };

    function mergeLeftRightBuffers(config, callback) {
        function mergeAudioBuffers(config, cb) {
            var numberOfAudioChannels = config.numberOfAudioChannels;

            // todo: "slice(0)" --- is it causes loop? Should be removed?
            var leftBuffers = config.leftBuffers.slice(0);
            var rightBuffers = config.rightBuffers.slice(0);
            var sampleRate = config.sampleRate;
            var internalInterleavedLength = config.internalInterleavedLength;

            if (numberOfAudioChannels === 2) {
                leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
                rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength);
            }

            if (numberOfAudioChannels === 1) {
                leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
            }

            function mergeBuffers(channelBuffer, rLength) {
                var result = new Float64Array(rLength);
                var offset = 0;
                var lng = channelBuffer.length;

                for (var i = 0; i < lng; i++) {
                    var buffer = channelBuffer[i];
                    result.set(buffer, offset);
                    offset += buffer.length;
                }

                return result;
            }

            function interleave(leftChannel, rightChannel) {
                var length = leftChannel.length + rightChannel.length;

                var result = new Float64Array(length);

                var inputIndex = 0;

                for (var index = 0; index < length;) {
                    result[index++] = leftChannel[inputIndex];
                    result[index++] = rightChannel[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function writeUTFBytes(view, offset, string) {
                var lng = string.length;
                for (var i = 0; i < lng; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            // interleave both channels together
            var interleaved;

            if (numberOfAudioChannels === 2) {
                interleaved = interleave(leftBuffers, rightBuffers);
            }

            if (numberOfAudioChannels === 1) {
                interleaved = leftBuffers;
            }

            var interleavedLength = interleaved.length;

            // create wav file
            var resultingBufferLength = 44 + interleavedLength * 2;

            var buffer = new ArrayBuffer(resultingBufferLength);

            var view = new DataView(buffer);

            // RIFF chunk descriptor/identifier 
            writeUTFBytes(view, 0, 'RIFF');

            // RIFF chunk length
            view.setUint32(4, 44 + interleavedLength * 2, true);

            // RIFF type 
            writeUTFBytes(view, 8, 'WAVE');

            // format chunk identifier 
            // FMT sub-chunk
            writeUTFBytes(view, 12, 'fmt ');

            // format chunk length 
            view.setUint32(16, 16, true);

            // sample format (raw)
            view.setUint16(20, 1, true);

            // stereo (2 channels)
            view.setUint16(22, numberOfAudioChannels, true);

            // sample rate 
            view.setUint32(24, sampleRate, true);

            // byte rate (sample rate * block align)
            view.setUint32(28, sampleRate * 2, true);

            // block align (channel count * bytes per sample) 
            view.setUint16(32, numberOfAudioChannels * 2, true);

            // bits per sample 
            view.setUint16(34, 16, true);

            // data sub-chunk
            // data chunk identifier 
            writeUTFBytes(view, 36, 'data');

            // data chunk length 
            view.setUint32(40, interleavedLength * 2, true);

            // write the PCM samples
            var lng = interleavedLength;
            var index = 44;
            var volume = 1;
            for (var i = 0; i < lng; i++) {
                view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
                index += 2;
            }

            if (cb) {
                return cb({
                    buffer: buffer,
                    view: view
                });
            }

            postMessage({
                buffer: buffer,
                view: view
            });
        }

        if (!isChrome) {
            // its Microsoft Edge
            mergeAudioBuffers(config, function(data) {
                callback(data.buffer, data.view);
            });
            return;
        }


        var webWorker = processInWebWorker(mergeAudioBuffers);

        webWorker.onmessage = function(event) {
            callback(event.data.buffer, event.data.view);

            // release memory
            URL.revokeObjectURL(webWorker.workerURL);
        };

        webWorker.postMessage(config);
    }

    function processInWebWorker(_function) {
        var workerURL = URL.createObjectURL(new Blob([_function.toString(),
            ';this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(workerURL);
        worker.workerURL = workerURL;
        return worker;
    }

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        // stop recording
        recording = false;

        // to make sure onaudioprocess stops firing
        // audioInput.disconnect();

        mergeLeftRightBuffers({
            sampleRate: sampleRate,
            numberOfAudioChannels: numberOfAudioChannels,
            internalInterleavedLength: recordingLength,
            leftBuffers: leftchannel,
            rightBuffers: numberOfAudioChannels === 1 ? [] : rightchannel
        }, function(buffer, view) {
            /**
             * @property {Blob} blob - The recorded blob object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var blob = recorder.blob;
             * });
             */
            self.blob = new Blob([view], {
                type: 'audio/wav'
            });

            /**
             * @property {ArrayBuffer} buffer - The recorded buffer object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var buffer = recorder.buffer;
             * });
             */
            self.buffer = new ArrayBuffer(view.buffer.byteLength);

            /**
             * @property {DataView} view - The recorded data-view object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var view = recorder.view;
             * });
             */
            self.view = view;

            self.sampleRate = sampleRate;
            self.bufferSize = bufferSize;

            // recorded audio length
            self.length = recordingLength;

            if (callback) {
                callback();
            }

            isAudioProcessStarted = false;
        });
    };

    if (!Storage.AudioContextConstructor) {
        Storage.AudioContextConstructor = new Storage.AudioContext();
    }

    var context = Storage.AudioContextConstructor;

    // creates an audio node from the microphone incoming stream
    var audioInput = context.createMediaStreamSource(mediaStream);

    var legalBufferValues = [0, 256, 512, 1024, 2048, 4096, 8192, 16384];

    /**
     * From the spec: This value controls how frequently the audioprocess event is
     * dispatched and how many sample-frames need to be processed each call.
     * Lower values for buffer size will result in a lower (better) latency.
     * Higher values will be necessary to avoid audio breakup and glitches
     * The size of the buffer (in sample-frames) which needs to
     * be processed each time onprocessaudio is called.
     * Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
     * @property {number} bufferSize - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     bufferSize: 4096
     * });
     */

    // "0" means, let chrome decide the most accurate buffer-size for current platform.
    var bufferSize = typeof config.bufferSize === 'undefined' ? 4096 : config.bufferSize;

    if (legalBufferValues.indexOf(bufferSize) === -1) {
        if (!config.disableLogs) {
            webrtcdev.warn('Legal values for buffer-size are ' + JSON.stringify(legalBufferValues, null, '\t'));
        }
    }

    if (context.createJavaScriptNode) {
        jsAudioNode = context.createJavaScriptNode(bufferSize, numberOfAudioChannels, numberOfAudioChannels);
    } else if (context.createScriptProcessor) {
        jsAudioNode = context.createScriptProcessor(bufferSize, numberOfAudioChannels, numberOfAudioChannels);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    // connect the stream to the gain node
    audioInput.connect(jsAudioNode);

    if (!config.bufferSize) {
        bufferSize = jsAudioNode.bufferSize; // device buffer-size
    }

    /**
     * The sample rate (in sample-frames per second) at which the
     * AudioContext handles audio. It is assumed that all AudioNodes
     * in the context run at this rate. In making this assumption,
     * sample-rate converters or "varispeed" processors are not supported
     * in real-time processing.
     * The sampleRate parameter describes the sample-rate of the
     * linear PCM audio data in the buffer in sample-frames per second.
     * An implementation must support sample-rates in at least
     * the range 22050 to 96000.
     * @property {number} sampleRate - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     sampleRate: 44100
     * });
     */
    var sampleRate = typeof config.sampleRate !== 'undefined' ? config.sampleRate : context.sampleRate || 44100;

    if (sampleRate < 22050 || sampleRate > 96000) {
        // Ref: http://stackoverflow.com/a/26303918/552182
        if (!config.disableLogs) {
            webrtcdev.warn('sample-rate must be under range 22050 and 96000.');
        }
    }

    if (!config.disableLogs) {
        webrtcdev.log('sample-rate', sampleRate);
        webrtcdev.log('buffer-size', bufferSize);
    }

    var isPaused = false;
    /**
     * This method pauses the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPaused = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (isMediaStreamActive() === false) {
            throw 'Please make sure MediaStream is active.';
        }

        if (!recording) {
            if (!config.disableLogs) {
                webrtcdev.info('Seems recording has been restarted.');
            }
            this.record();
            return;
        }

        isPaused = false;
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        this.pause();

        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;
    };

    var isAudioProcessStarted = false;

    function onAudioProcessDataAvailable(e) {
        if (isPaused) {
            return;
        }

        if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
                webrtcdev.log('MediaStream seems stopped.');
            }
            jsAudioNode.disconnect();
            recording = false;
        }

        if (!recording) {
            audioInput.disconnect();
            return;
        }

        /**
         * This method is called on "onaudioprocess" event's first invocation.
         * @method {function} onAudioProcessStarted
         * @memberof StereoAudioRecorder
         * @example
         * recorder.onAudioProcessStarted: function() { };
         */
        if (!isAudioProcessStarted) {
            isAudioProcessStarted = true;
            if (config.onAudioProcessStarted) {
                config.onAudioProcessStarted();
            }

            if (config.initCallback) {
                config.initCallback();
            }
        }

        var left = e.inputBuffer.getChannelData(0);

        // we clone the samples
        leftchannel.push(new Float32Array(left));

        if (numberOfAudioChannels === 2) {
            var right = e.inputBuffer.getChannelData(1);
            rightchannel.push(new Float32Array(right));
        }

        recordingLength += bufferSize;
    }

    jsAudioNode.onaudioprocess = onAudioProcessDataAvailable;

    // to prevent self audio to be connected with speakers
    jsAudioNode.connect(context.destination);
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.StereoAudioRecorder = StereoAudioRecorder;
}

// _________________
// CanvasRecorder.js

/**
 * CanvasRecorder is a standalone class used by {@link RecordRTC} to bring HTML5-Canvas recording into video WebM. It uses HTML2Canvas library and runs top over {@link Whammy}.
 * @summary HTML2Canvas recording into video WebM.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef CanvasRecorder
 * @class
 * @example
 * var recorder = new CanvasRecorder(htmlElement, { disableLogs: true });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {HTMLElement} htmlElement - querySelector/getElementById/getElementsByTagName[0]/etc.
 * @param {object} config - {disableLogs:true, initCallback: function}
 */

function CanvasRecorder(htmlElement, config) {
    if (typeof html2canvas === 'undefined' && htmlElement.nodeName.toLowerCase() !== 'canvas') {
        throw 'Please link: https://cdn.webrtc-experiment.com/screenshot.js';
    }

    config = config || {};
    if (!config.frameInterval) {
        config.frameInterval = 10;
    }

    // via DetectRTC.js
    var isCanvasSupportsStreamCapturing = false;
    ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].forEach(function(item) {
        if (item in document.createElement('canvas')) {
            isCanvasSupportsStreamCapturing = true;
        }
    });

    var _isChrome = (!!window.webkitRTCPeerConnection || !!window.webkitGetUserMedia) && !!window.chrome;

    var chromeVersion = 50;
    var matchArray = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    if (_isChrome && matchArray && matchArray[2]) {
        chromeVersion = parseInt(matchArray[2], 10);
    }

    if (_isChrome && chromeVersion < 52) {
        isCanvasSupportsStreamCapturing = false;
    }

    var globalCanvas, mediaStreamRecorder;

    if (isCanvasSupportsStreamCapturing) {
        if (!config.disableLogs) {
            webrtcdev.debug('Your browser supports both MediRecorder API and canvas.captureStream!');
        }

        if (htmlElement instanceof HTMLCanvasElement) {
            globalCanvas = htmlElement;
        } else if (htmlElement instanceof CanvasRenderingContext2D) {
            globalCanvas = htmlElement.canvas;
        } else {
            throw 'Please pass either HTMLCanvasElement or CanvasRenderingContext2D.';
        }
    } else if (!!navigator.mozGetUserMedia) {
        if (!config.disableLogs) {
            webrtcdev.error('Canvas recording is NOT supported in Firefox.');
        }
    }

    var isRecording;

    /**
     * This method records Canvas.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        isRecording = true;

        if (isCanvasSupportsStreamCapturing) {
            // CanvasCaptureMediaStream
            var canvasMediaStream;
            if ('captureStream' in globalCanvas) {
                canvasMediaStream = globalCanvas.captureStream(25); // 25 FPS
            } else if ('mozCaptureStream' in globalCanvas) {
                canvasMediaStream = globalCanvas.mozCaptureStream(25);
            } else if ('webkitCaptureStream' in globalCanvas) {
                canvasMediaStream = globalCanvas.webkitCaptureStream(25);
            }

            try {
                var mdStream = new MediaStream();
                mdStream.addTrack(canvasMediaStream.getVideoTracks()[0]);
                canvasMediaStream = mdStream;
            } catch (e) {}

            if (!canvasMediaStream) {
                throw 'captureStream API are NOT available.';
            }

            // Note: Jan 18, 2016 status is that, 
            // Firefox MediaRecorder API can't record CanvasCaptureMediaStream object.
            mediaStreamRecorder = new MediaStreamRecorder(canvasMediaStream, {
                mimeType: 'video/webm'
            });
            mediaStreamRecorder.record();
        } else {
            whammy.frames = [];
            lastTime = new Date().getTime();
            drawCanvasFrame();
        }

        if (config.initCallback) {
            config.initCallback();
        }
    };

    this.getWebPImages = function(callback) {
        if (htmlElement.nodeName.toLowerCase() !== 'canvas') {
            callback();
            return;
        }

        var framesLength = whammy.frames.length;
        whammy.frames.forEach(function(frame, idx) {
            var framesRemaining = framesLength - idx;
            if (!config.disableLogs) {
                webrtcdev.debug(framesRemaining + '/' + framesLength + ' frames remaining');
            }

            if (config.onEncodingCallback) {
                config.onEncodingCallback(framesRemaining, framesLength);
            }

            var webp = frame.image.toDataURL('image/webp', 1);
            whammy.frames[idx].image = webp;
        });

        if (!config.disableLogs) {
            webrtcdev.debug('Generating WebM');
        }

        callback();
    };

    /**
     * This method stops recording Canvas.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isRecording = false;

        var that = this;

        if (isCanvasSupportsStreamCapturing && mediaStreamRecorder) {
            mediaStreamRecorder.stop(callback);
            return;
        }

        this.getWebPImages(function() {
            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof CanvasRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            whammy.compile(function(blob) {
                if (!config.disableLogs) {
                    webrtcdev.debug('Recording finished!');
                }

                that.blob = blob;

                if (that.blob.forEach) {
                    that.blob = new Blob([], {
                        type: 'video/webm'
                    });
                }

                if (callback) {
                    callback(that.blob);
                }

                whammy.frames = [];
            });
        });
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (!isRecording) {
            this.record();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        this.pause();
        whammy.frames = [];
    };

    function cloneCanvas() {
        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = htmlElement.width;
        newCanvas.height = htmlElement.height;

        //apply the old canvas to the new one
        context.drawImage(htmlElement, 0, 0);

        //return the new canvas
        return newCanvas;
    }

    function drawCanvasFrame() {
        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawCanvasFrame, 500);
        }

        if (htmlElement.nodeName.toLowerCase() === 'canvas') {
            var duration = new Date().getTime() - lastTime;
            // via #206, by Jack i.e. @Seymourr
            lastTime = new Date().getTime();

            whammy.frames.push({
                image: cloneCanvas(),
                duration: duration
            });

            if (isRecording) {
                setTimeout(drawCanvasFrame, config.frameInterval);
            }
            return;
        }

        html2canvas(htmlElement, {
            grabMouse: typeof config.showMousePointer === 'undefined' || config.showMousePointer,
            onrendered: function(canvas) {
                var duration = new Date().getTime() - lastTime;
                if (!duration) {
                    return setTimeout(drawCanvasFrame, config.frameInterval);
                }

                // via #206, by Jack i.e. @Seymourr
                lastTime = new Date().getTime();

                whammy.frames.push({
                    image: canvas.toDataURL('image/webp', 1),
                    duration: duration
                });

                if (isRecording) {
                    setTimeout(drawCanvasFrame, config.frameInterval);
                }
            }
        });
    }

    var lastTime = new Date().getTime();

    var whammy = new Whammy.Video(100);
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.CanvasRecorder = CanvasRecorder;
}

// _________________
// WhammyRecorder.js

/**
 * WhammyRecorder is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It runs top over {@link Whammy}.
 * @summary Video recording feature in Chrome.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef WhammyRecorder
 * @class
 * @example
 * var recorder = new WhammyRecorder(mediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {disableLogs: true, initCallback: function, video: HTMLVideoElement, etc.}
 */

function WhammyRecorder(mediaStream, config) {

    config = config || {};

    if (!config.frameInterval) {
        config.frameInterval = 10;
    }

    if (!config.disableLogs) {
        webrtcdev.log('Using frames-interval:', config.frameInterval);
    }

    /**
     * This method records video.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!config.width) {
            config.width = 320;
        }

        if (!config.height) {
            config.height = 240;
        }

        if (!config.video) {
            config.video = {
                width: config.width,
                height: config.height
            };
        }

        if (!config.canvas) {
            config.canvas = {
                width: config.width,
                height: config.height
            };
        }

        canvas.width = config.canvas.width;
        canvas.height = config.canvas.height;

        context = canvas.getContext('2d');

        // setting defaults
        if (config.video && config.video instanceof HTMLVideoElement) {
            video = config.video.cloneNode();

            if (config.initCallback) {
                config.initCallback();
            }
        } else {
            video = document.createElement('video');

            if (typeof video.srcObject !== 'undefined') {
                video.srcObject = mediaStream;
            } else {
                video.src = URL.createObjectURL(mediaStream);
            }

            video.onloadedmetadata = function() { // "onloadedmetadata" may NOT work in FF?
                if (config.initCallback) {
                    config.initCallback();
                }
            };

            video.width = config.video.width;
            video.height = config.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video();

        if (!config.disableLogs) {
            webrtcdev.log('canvas resolutions', canvas.width, '*', canvas.height);
            webrtcdev.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);
        }

        drawFrames(config.frameInterval);
    };

    /**
     * Draw and push frames to Whammy
     * @param {integer} frameInterval - set minimum interval (in milliseconds) between each time we push a frame to Whammy
     */
    function drawFrames(frameInterval) {
        frameInterval = typeof frameInterval !== 'undefined' ? frameInterval : 10;

        var duration = new Date().getTime() - lastTime;
        if (!duration) {
            return setTimeout(drawFrames, frameInterval, frameInterval);
        }

        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawFrames, 100);
        }

        // via #206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        if (video.paused) {
            // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
            // Tweak for Android Chrome
            video.play();
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        whammy.frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });

        if (!isStopDrawing) {
            setTimeout(drawFrames, frameInterval, frameInterval);
        }
    }

    function asyncLoop(o) {
        var i = -1,
            length = o.length;

        var loop = function() {
            i++;
            if (i === length) {
                o.callback();
                return;
            }
            o.functionToLoop(loop, i);
        };
        loop(); //init
    }


    /**
     * remove black frames from the beginning to the specified frame
     * @param {Array} _frames - array of frames to be checked
     * @param {number} _framesToCheck - number of frame until check will be executed (-1 - will drop all frames until frame not matched will be found)
     * @param {number} _pixTolerance - 0 - very strict (only black pixel color) ; 1 - all
     * @param {number} _frameTolerance - 0 - very strict (only black frame color) ; 1 - all
     * @returns {Array} - array of frames
     */
    // pull#293 by @volodalexey
    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance, callback) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        asyncLoop({
            length: endCheckFrame,
            functionToLoop: function(loop, f) {
                var matchPixCount, endPixCheck, maxPixCount;

                var finishImage = function() {
                    if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
                        // webrtcdev.log('removed black frame : ' + f + ' ; frame duration ' + _frames[f].duration);
                    } else {
                        // webrtcdev.log('frame is passed : ' + f);
                        if (checkUntilNotBlack) {
                            doNotCheckNext = true;
                        }
                        resultFrames.push(_frames[f]);
                    }
                    loop();
                };

                if (!doNotCheckNext) {
                    var image = new Image();
                    image.onload = function() {
                        context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                        var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                        matchPixCount = 0;
                        endPixCheck = imageData.data.length;
                        maxPixCount = imageData.data.length / 4;

                        for (var pix = 0; pix < endPixCheck; pix += 4) {
                            var currentColor = {
                                r: imageData.data[pix],
                                g: imageData.data[pix + 1],
                                b: imageData.data[pix + 2]
                            };
                            var colorDifference = Math.sqrt(
                                Math.pow(currentColor.r - sampleColor.r, 2) +
                                Math.pow(currentColor.g - sampleColor.g, 2) +
                                Math.pow(currentColor.b - sampleColor.b, 2)
                            );
                            // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                            if (colorDifference <= maxColorDifference * pixTolerance) {
                                matchPixCount++;
                            }
                        }
                        finishImage();
                    };
                    image.src = _frames[f].image;
                } else {
                    finishImage();
                }
            },
            callback: function() {
                resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

                if (resultFrames.length <= 0) {
                    // at least one last frame should be available for next manipulation
                    // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
                    resultFrames.push(_frames[_frames.length - 1]);
                }
                callback(resultFrames);
            }
        });
    }

    var isStopDrawing = false;

    /**
     * This method stops recording video.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isStopDrawing = true;

        var _this = this;
        // analyse of all frames takes some time!
        setTimeout(function() {
            // e.g. dropBlackFrames(frames, 10, 1, 1) - will cut all 10 frames
            // e.g. dropBlackFrames(frames, 10, 0.5, 0.5) - will analyse 10 frames
            // e.g. dropBlackFrames(frames, 10) === dropBlackFrames(frames, 10, 0, 0) - will analyse 10 frames with strict black color
            dropBlackFrames(whammy.frames, -1, null, null, function(frames) {
                whammy.frames = frames;

                // to display advertisement images!
                if (config.advertisement && config.advertisement.length) {
                    whammy.frames = config.advertisement.concat(whammy.frames);
                }

                /**
                 * @property {Blob} blob - Recorded frames in video/webm blob.
                 * @memberof WhammyRecorder
                 * @example
                 * recorder.stop(function() {
                 *     var blob = recorder.blob;
                 * });
                 */
                whammy.compile(function(blob) {
                    _this.blob = blob;

                    if (_this.blob.forEach) {
                        _this.blob = new Blob([], {
                            type: 'video/webm'
                        });
                    }

                    if (callback) {
                        callback(_this.blob);
                    }
                });
            });
        }, 10);
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (isStopDrawing) {
            this.record();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        this.pause();
        whammy.frames = [];
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.WhammyRecorder = WhammyRecorder;
}

// https://github.com/antimatter15/whammy/blob/master/LICENSE
// _________
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

/**
 * Whammy is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It is written by {@link https://github.com/antimatter15|antimatter15}
 * @summary A real time javascript webm encoder based on a canvas hack.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef Whammy
 * @class
 * @example
 * var recorder = new Whammy().Video(15);
 * recorder.add(context || canvas || dataURL);
 * var output = recorder.compile();
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */

var Whammy = (function() {
    // a more abstract-ish API

    function WhammyVideo(duration) {
        this.frames = [];
        this.duration = duration || 1;
        this.quality = 0.8;
    }

    /**
     * Pass Canvas or Context or image/webp(string) to {@link Whammy} encoder.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.add(canvas || context || 'image/webp');
     * @param {string} frame - Canvas || Context || image/webp
     * @param {number} duration - Stick a duration (in milliseconds)
     */
    WhammyVideo.prototype.add = function(frame, duration) {
        if ('canvas' in frame) { //CanvasRenderingContext2D
            frame = frame.canvas;
        }

        if ('toDataURL' in frame) {
            frame = frame.toDataURL('image/webp', this.quality);
        }

        if (!(/^data:image\/webp;base64,/ig).test(frame)) {
            throw 'Input must be formatted properly as a base64 encoded DataURI of type image/webp';
        }
        this.frames.push({
            image: frame,
            duration: duration || this.duration
        });
    };

    function processInWebWorker(_function) {
        var blob = URL.createObjectURL(new Blob([_function.toString(),
            'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(blob);
        URL.revokeObjectURL(blob);
        return worker;
    }

    function whammyInWebWorker(frames) {
        function ArrayToWebM(frames) {
            var info = checkFrames(frames);
            if (!info) {
                return [];
            }

            var clusterMaxDuration = 30000;

            var EBML = [{
                'id': 0x1a45dfa3, // EBML
                'data': [{
                    'data': 1,
                    'id': 0x4286 // EBMLVersion
                }, {
                    'data': 1,
                    'id': 0x42f7 // EBMLReadVersion
                }, {
                    'data': 4,
                    'id': 0x42f2 // EBMLMaxIDLength
                }, {
                    'data': 8,
                    'id': 0x42f3 // EBMLMaxSizeLength
                }, {
                    'data': 'webm',
                    'id': 0x4282 // DocType
                }, {
                    'data': 2,
                    'id': 0x4287 // DocTypeVersion
                }, {
                    'data': 2,
                    'id': 0x4285 // DocTypeReadVersion
                }]
            }, {
                'id': 0x18538067, // Segment
                'data': [{
                    'id': 0x1549a966, // Info
                    'data': [{
                        'data': 1e6, //do things in millisecs (num of nanosecs for duration scale)
                        'id': 0x2ad7b1 // TimecodeScale
                    }, {
                        'data': 'whammy',
                        'id': 0x4d80 // MuxingApp
                    }, {
                        'data': 'whammy',
                        'id': 0x5741 // WritingApp
                    }, {
                        'data': doubleToString(info.duration),
                        'id': 0x4489 // Duration
                    }]
                }, {
                    'id': 0x1654ae6b, // Tracks
                    'data': [{
                        'id': 0xae, // TrackEntry
                        'data': [{
                            'data': 1,
                            'id': 0xd7 // TrackNumber
                        }, {
                            'data': 1,
                            'id': 0x73c5 // TrackUID
                        }, {
                            'data': 0,
                            'id': 0x9c // FlagLacing
                        }, {
                            'data': 'und',
                            'id': 0x22b59c // Language
                        }, {
                            'data': 'V_VP8',
                            'id': 0x86 // CodecID
                        }, {
                            'data': 'VP8',
                            'id': 0x258688 // CodecName
                        }, {
                            'data': 1,
                            'id': 0x83 // TrackType
                        }, {
                            'id': 0xe0, // Video
                            'data': [{
                                'data': info.width,
                                'id': 0xb0 // PixelWidth
                            }, {
                                'data': info.height,
                                'id': 0xba // PixelHeight
                            }]
                        }]
                    }]
                }]
            }];

            //Generate clusters (max duration)
            var frameNumber = 0;
            var clusterTimecode = 0;
            while (frameNumber < frames.length) {

                var clusterFrames = [];
                var clusterDuration = 0;
                do {
                    clusterFrames.push(frames[frameNumber]);
                    clusterDuration += frames[frameNumber].duration;
                    frameNumber++;
                } while (frameNumber < frames.length && clusterDuration < clusterMaxDuration);

                var clusterCounter = 0;
                var cluster = {
                    'id': 0x1f43b675, // Cluster
                    'data': getClusterData(clusterTimecode, clusterCounter, clusterFrames)
                }; //Add cluster to segment
                EBML[1].data.push(cluster);
                clusterTimecode += clusterDuration;
            }

            return generateEBML(EBML);
        }

        function getClusterData(clusterTimecode, clusterCounter, clusterFrames) {
            return [{
                'data': clusterTimecode,
                'id': 0xe7 // Timecode
            }].concat(clusterFrames.map(function(webp) {
                var block = makeSimpleBlock({
                    discardable: 0,
                    frame: webp.data.slice(4),
                    invisible: 0,
                    keyframe: 1,
                    lacing: 0,
                    trackNum: 1,
                    timecode: Math.round(clusterCounter)
                });
                clusterCounter += webp.duration;
                return {
                    data: block,
                    id: 0xa3
                };
            }));
        }

        // sums the lengths of all the frames and gets the duration

        function checkFrames(frames) {
            if (!frames[0]) {
                postMessage({
                    error: 'Something went wrong. Maybe WebP format is not supported in the current browser.'
                });
                return;
            }

            var width = frames[0].width,
                height = frames[0].height,
                duration = frames[0].duration;

            for (var i = 1; i < frames.length; i++) {
                duration += frames[i].duration;
            }
            return {
                duration: duration,
                width: width,
                height: height
            };
        }

        function numToBuffer(num) {
            var parts = [];
            while (num > 0) {
                parts.push(num & 0xff);
                num = num >> 8;
            }
            return new Uint8Array(parts.reverse());
        }

        function strToBuffer(str) {
            return new Uint8Array(str.split('').map(function(e) {
                return e.charCodeAt(0);
            }));
        }

        function bitsToBuffer(bits) {
            var data = [];
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data.push(parseInt(bits.substr(i, 8), 2));
            }
            return new Uint8Array(data);
        }

        function generateEBML(json) {
            var ebml = [];
            for (var i = 0; i < json.length; i++) {
                var data = json[i].data;

                if (typeof data === 'object') {
                    data = generateEBML(data);
                }

                if (typeof data === 'number') {
                    data = bitsToBuffer(data.toString(2));
                }

                if (typeof data === 'string') {
                    data = strToBuffer(data);
                }

                var len = data.size || data.byteLength || data.length;
                var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
                var sizeToString = len.toString(2);
                var padded = (new Array((zeroes * 7 + 7 + 1) - sizeToString.length)).join('0') + sizeToString;
                var size = (new Array(zeroes)).join('0') + '1' + padded;

                ebml.push(numToBuffer(json[i].id));
                ebml.push(bitsToBuffer(size));
                ebml.push(data);
            }

            return new Blob(ebml, {
                type: 'video/webm'
            });
        }

        function toBinStrOld(bits) {
            var data = '';
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
            }
            return data;
        }

        function makeSimpleBlock(data) {
            var flags = 0;

            if (data.keyframe) {
                flags |= 128;
            }

            if (data.invisible) {
                flags |= 8;
            }

            if (data.lacing) {
                flags |= (data.lacing << 1);
            }

            if (data.discardable) {
                flags |= 1;
            }

            if (data.trackNum > 127) {
                throw 'TrackNumber > 127 not supported';
            }

            var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
                return String.fromCharCode(e);
            }).join('') + data.frame;

            return out;
        }

        function parseWebP(riff) {
            var VP8 = riff.RIFF[0].WEBP[0];

            var frameStart = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
            for (var i = 0, c = []; i < 4; i++) {
                c[i] = VP8.charCodeAt(frameStart + 3 + i);
            }

            var width, height, tmp;

            //the code below is literally copied verbatim from the bitstream spec
            tmp = (c[1] << 8) | c[0];
            width = tmp & 0x3FFF;
            tmp = (c[3] << 8) | c[2];
            height = tmp & 0x3FFF;
            return {
                width: width,
                height: height,
                data: VP8,
                riff: riff
            };
        }

        function getStrLength(string, offset) {
            return parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
                var unpadded = i.charCodeAt(0).toString(2);
                return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
            }).join(''), 2);
        }

        function parseRIFF(string) {
            var offset = 0;
            var chunks = {};

            while (offset < string.length) {
                var id = string.substr(offset, 4);
                var len = getStrLength(string, offset);
                var data = string.substr(offset + 4 + 4, len);
                offset += 4 + 4 + len;
                chunks[id] = chunks[id] || [];

                if (id === 'RIFF' || id === 'LIST') {
                    chunks[id].push(parseRIFF(data));
                } else {
                    chunks[id].push(data);
                }
            }
            return chunks;
        }

        function doubleToString(num) {
            return [].slice.call(
                new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
                return String.fromCharCode(e);
            }).reverse().join('');
        }

        var webm = new ArrayToWebM(frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
        }));

        postMessage(webm);
    }

    /**
     * Encodes frames in WebM container. It uses WebWorkinvoke to invoke 'ArrayToWebM' method.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.compile(function(blob) {
     *    // blob.size - blob.type
     * });
     */
    WhammyVideo.prototype.compile = function(callback) {
        var webWorker = processInWebWorker(whammyInWebWorker);

        webWorker.onmessage = function(event) {
            if (event.data.error) {
                webrtcdev.error(event.data.error);
                return;
            }
            callback(event.data);
        };

        webWorker.postMessage(this.frames);
    };

    return {
        /**
         * A more abstract-ish API.
         * @method
         * @memberof Whammy
         * @example
         * recorder = new Whammy().Video(0.8, 100);
         * @param {?number} speed - 0.8
         * @param {?number} quality - 100
         */
        Video: WhammyVideo
    };
})();

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.Whammy = Whammy;
}

// ______________ (indexed-db)
// DiskStorage.js

/**
 * DiskStorage is a standalone object used by {@link RecordRTC} to store recorded blobs in IndexedDB storage.
 * @summary Writing blobs into IndexedDB.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @example
 * DiskStorage.Store({
 *     audioBlob: yourAudioBlob,
 *     videoBlob: yourVideoBlob,
 *     gifBlob  : yourGifBlob
 * });
 * DiskStorage.Fetch(function(dataURL, type) {
 *     if(type === 'audioBlob') { }
 *     if(type === 'videoBlob') { }
 *     if(type === 'gifBlob')   { }
 * });
 * // DiskStorage.dataStoreName = 'recordRTC';
 * // DiskStorage.onError = function(error) { };
 * @property {function} init - This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
 * @property {function} Fetch - This method fetches stored blobs from IndexedDB.
 * @property {function} Store - This method stores blobs in IndexedDB.
 * @property {function} onError - This function is invoked for any known/unknown error.
 * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */


var DiskStorage = {
    /**
     * This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.init();
     */
    init: function() {
        var self = this;

        if (typeof indexedDB === 'undefined' || typeof indexedDB.open === 'undefined') {
            webrtcdev.error('IndexedDB API are not available in this browser.');
            return;
        }

        var dbVersion = 1;
        var dbName = this.dbName || location.href.replace(/\/|:|#|%|\.|\[|\]/g, ''),
            db;
        var request = indexedDB.open(dbName, dbVersion);

        function createObjectStore(dataBase) {
            dataBase.createObjectStore(self.dataStoreName);
        }

        function putInDB() {
            var transaction = db.transaction([self.dataStoreName], 'readwrite');

            if (self.videoBlob) {
                transaction.objectStore(self.dataStoreName).put(self.videoBlob, 'videoBlob');
            }

            if (self.gifBlob) {
                transaction.objectStore(self.dataStoreName).put(self.gifBlob, 'gifBlob');
            }

            if (self.audioBlob) {
                transaction.objectStore(self.dataStoreName).put(self.audioBlob, 'audioBlob');
            }

            function getFromStore(portionName) {
                transaction.objectStore(self.dataStoreName).get(portionName).onsuccess = function(event) {
                    if (self.callback) {
                        self.callback(event.target.result, portionName);
                    }
                };
            }

            getFromStore('audioBlob');
            getFromStore('videoBlob');
            getFromStore('gifBlob');
        }

        request.onerror = self.onError;

        request.onsuccess = function() {
            db = request.result;
            db.onerror = self.onError;

            if (db.setVersion) {
                if (db.version !== dbVersion) {
                    var setVersion = db.setVersion(dbVersion);
                    setVersion.onsuccess = function() {
                        createObjectStore(db);
                        putInDB();
                    };
                } else {
                    putInDB();
                }
            } else {
                putInDB();
            }
        };
        request.onupgradeneeded = function(event) {
            createObjectStore(event.target.result);
        };
    },
    /**
     * This method fetches stored blobs from IndexedDB.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.Fetch(function(dataURL, type) {
     *     if(type === 'audioBlob') { }
     *     if(type === 'videoBlob') { }
     *     if(type === 'gifBlob')   { }
     * });
     */
    Fetch: function(callback) {
        this.callback = callback;
        this.init();

        return this;
    },
    /**
     * This method stores blobs in IndexedDB.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.Store({
     *     audioBlob: yourAudioBlob,
     *     videoBlob: yourVideoBlob,
     *     gifBlob  : yourGifBlob
     * });
     */
    Store: function(config) {
        this.audioBlob = config.audioBlob;
        this.videoBlob = config.videoBlob;
        this.gifBlob = config.gifBlob;

        this.init();

        return this;
    },
    /**
     * This function is invoked for any known/unknown error.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.onError = function(error){
     *     alerot( JSON.stringify(error) );
     * };
     */
    onError: function(error) {
        webrtcdev.error(JSON.stringify(error, null, '\t'));
    },

    /**
     * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.dataStoreName = 'recordRTC';
     */
    dataStoreName: 'recordRTC',
    dbName: null
};

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.DiskStorage = DiskStorage;
}

// ______________
// GifRecorder.js

/**
 * GifRecorder is standalone calss used by {@link RecordRTC} to record video or canvas into animated gif.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef GifRecorder
 * @class
 * @example
 * var recorder = new GifRecorder(mediaStream || canvas || context, { width: 1280, height: 720, frameRate: 200, quality: 10 });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     img.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object or HTMLCanvasElement or CanvasRenderingContext2D.
 * @param {object} config - {disableLogs:true, initCallback: function, width: 320, height: 240, frameRate: 200, quality: 10}
 */

function GifRecorder(mediaStream, config) {
    if (typeof GIFEncoder === 'undefined') {
        throw 'Please link: https://cdn.webrtc-experiment.com/gif-recorder.js';
    }

    config = config || {};

    var isHTMLObject = mediaStream instanceof CanvasRenderingContext2D || mediaStream instanceof HTMLCanvasElement;

    /**
     * This method records MediaStream.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!isHTMLObject) {
            if (!config.width) {
                config.width = video.offsetWidth || 320;
            }

            if (!this.height) {
                config.height = video.offsetHeight || 240;
            }

            if (!config.video) {
                config.video = {
                    width: config.width,
                    height: config.height
                };
            }

            if (!config.canvas) {
                config.canvas = {
                    width: config.width,
                    height: config.height
                };
            }

            canvas.width = config.canvas.width;
            canvas.height = config.canvas.height;

            video.width = config.video.width;
            video.height = config.video.height;
        }

        // external library to record as GIF images
        gifEncoder = new GIFEncoder();

        // void setRepeat(int iter) 
        // Sets the number of times the set of GIF frames should be played. 
        // Default is 1; 0 means play indefinitely.
        gifEncoder.setRepeat(0);

        // void setFrameRate(Number fps) 
        // Sets frame rate in frames per second. 
        // Equivalent to setDelay(1000/fps).
        // Using "setDelay" instead of "setFrameRate"
        gifEncoder.setDelay(config.frameRate || 200);

        // void setQuality(int quality) 
        // Sets quality of color quantization (conversion of images to the 
        // maximum 256 colors allowed by the GIF specification). 
        // Lower values (minimum = 1) produce better colors, 
        // but slow processing significantly. 10 is the default, 
        // and produces good color mapping at reasonable speeds. 
        // Values greater than 20 do not yield significant improvements in speed.
        gifEncoder.setQuality(config.quality || 10);

        // Boolean start() 
        // This writes the GIF Header and returns false if it fails.
        gifEncoder.start();

        startTime = Date.now();

        var self = this;

        function drawVideoFrame(time) {
            if (isPausedRecording) {
                return setTimeout(function() {
                    drawVideoFrame(time);
                }, 100);
            }

            lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

            if (typeof lastFrameTime === undefined) {
                lastFrameTime = time;
            }

            // ~10 fps
            if (time - lastFrameTime < 90) {
                return;
            }

            if (!isHTMLObject && video.paused) {
                // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
                // Tweak for Android Chrome
                video.play();
            }

            if (!isHTMLObject) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            if (config.onGifPreview) {
                config.onGifPreview(canvas.toDataURL('image/png'));
            }

            gifEncoder.addFrame(context);
            lastFrameTime = time;
        }

        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

        if (config.initCallback) {
            config.initCallback();
        }
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.stop(function(blob) {
     *     img.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function() {
        if (lastAnimationFrame) {
            cancelAnimationFrame(lastAnimationFrame);
        }

        endTime = Date.now();

        /**
         * @property {Blob} blob - The recorded blob object.
         * @memberof GifRecorder
         * @example
         * recorder.stop(function(){
         *     var blob = recorder.blob;
         * });
         */
        this.blob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: 'image/gif'
        });

        // bug: find a way to clear old recorded blobs
        gifEncoder.stream().bin = [];
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        if (!gifEncoder) {
            return;
        }

        this.pause();

        gifEncoder.stream().bin = [];
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    if (isHTMLObject) {
        if (mediaStream instanceof CanvasRenderingContext2D) {
            context = mediaStream;
            canvas = context.canvas;
        } else if (mediaStream instanceof HTMLCanvasElement) {
            context = mediaStream.getContext('2d');
            canvas = mediaStream;
        }
    }

    if (!isHTMLObject) {
        var video = document.createElement('video');
        video.muted = true;
        video.autoplay = true;

        if (typeof video.srcObject !== 'undefined') {
            video.srcObject = mediaStream;
        } else {
            video.src = URL.createObjectURL(mediaStream);
        }

        video.play();
    }

    var lastAnimationFrame = null;
    var startTime, endTime, lastFrameTime;

    var gifEncoder;
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.GifRecorder = GifRecorder;
}

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */// Note: All libraries listed in this file are "external libraries" 
// ----  and has their own copyrights. Taken from "html2canvas" project.
"use strict";

function h2clog(e) {
    if (_html2canvas.logging && window.webrtcdev && window.webrtcdev.log) {
        window.webrtcdev.log(e)
    }
}

function backgroundBoundsFactory(e, t, n, r, i, s) {
    var o = _html2canvas.Util.getCSS(t, e, i),
        u, a, f, l;
    if (o.length === 1) {
        l = o[0];
        o = [];
        o[0] = l;
        o[1] = l
    }
    if (o[0].toString().indexOf("%") !== -1) {
        f = parseFloat(o[0]) / 100;
        a = n.width * f;
        if (e !== "backgroundSize") {
            a -= (s || r).width * f
        }
    } else {
        if (e === "backgroundSize") {
            if (o[0] === "auto") {
                a = r.width
            } else {
                if (o[0].match(/contain|cover/)) {
                    var c = _html2canvas.Util.resizeBounds(r.width, r.height, n.width, n.height, o[0]);
                    a = c.width;
                    u = c.height
                } else {
                    a = parseInt(o[0], 10)
                }
            }
        } else {
            a = parseInt(o[0], 10)
        }
    }
    if (o[1] === "auto") {
        u = a / r.width * r.height
    } else if (o[1].toString().indexOf("%") !== -1) {
        f = parseFloat(o[1]) / 100;
        u = n.height * f;
        if (e !== "backgroundSize") {
            u -= (s || r).height * f
        }
    } else {
        u = parseInt(o[1], 10)
    }
    return [a, u]
}

function h2czContext(e) {
    return {
        zindex: e,
        children: []
    }
}

function h2cRenderContext(e, t) {
    var n = [];
    return {
        storage: n,
        width: e,
        height: t,
        clip: function() {
            n.push({
                type: "function",
                name: "clip",
                arguments: arguments
            })
        },
        translate: function() {
            n.push({
                type: "function",
                name: "translate",
                arguments: arguments
            })
        },
        fill: function() {
            n.push({
                type: "function",
                name: "fill",
                arguments: arguments
            })
        },
        save: function() {
            n.push({
                type: "function",
                name: "save",
                arguments: arguments
            })
        },
        restore: function() {
            n.push({
                type: "function",
                name: "restore",
                arguments: arguments
            })
        },
        fillRect: function() {
            n.push({
                type: "function",
                name: "fillRect",
                arguments: arguments
            })
        },
        createPattern: function() {
            n.push({
                type: "function",
                name: "createPattern",
                arguments: arguments
            })
        },
        drawShape: function() {
            var e = [];
            n.push({
                type: "function",
                name: "drawShape",
                arguments: e
            });
            return {
                moveTo: function() {
                    e.push({
                        name: "moveTo",
                        arguments: arguments
                    })
                },
                lineTo: function() {
                    e.push({
                        name: "lineTo",
                        arguments: arguments
                    })
                },
                arcTo: function() {
                    e.push({
                        name: "arcTo",
                        arguments: arguments
                    })
                },
                bezierCurveTo: function() {
                    e.push({
                        name: "bezierCurveTo",
                        arguments: arguments
                    })
                },
                quadraticCurveTo: function() {
                    e.push({
                        name: "quadraticCurveTo",
                        arguments: arguments
                    })
                }
            }
        },
        drawImage: function() {
            n.push({
                type: "function",
                name: "drawImage",
                arguments: arguments
            })
        },
        fillText: function() {
            n.push({
                type: "function",
                name: "fillText",
                arguments: arguments
            })
        },
        setVariable: function(e, t) {
            n.push({
                type: "variable",
                name: e,
                arguments: t
            })
        }
    }
}

function getMouseXY(e) {
    if (IE) {
        coordX = event.clientX + document.body.scrollLeft;
        coordY = event.clientY + document.body.scrollTop
    } else {
        coordX = e.pageX;
        coordY = e.pageY
    }
    if (coordX < 0) {
        coordX = 0
    }
    if (coordY < 0) {
        coordY = 0
    }
    return true
}
var _html2canvas = {},
    previousElement, computedCSS, html2canvas;
_html2canvas.Util = {};
_html2canvas.Util.trimText = function(e) {
    return function(t) {
        if (e) {
            return e.apply(t)
        } else {
            return ((t || "") + "").replace(/^\s+|\s+$/g, "")
        }
    }
}(String.prototype.trim);
_html2canvas.Util.parseBackgroundImage = function(e) {
    var t = " \r\n	",
        n, r, i, s, o, u = [],
        a, f = 0,
        l = 0,
        c, h;
    var p = function() {
        if (n) {
            if (r.substr(0, 1) === '"') {
                r = r.substr(1, r.length - 2)
            }
            if (r) {
                h.push(r)
            }
            if (n.substr(0, 1) === "-" && (s = n.indexOf("-", 1) + 1) > 0) {
                i = n.substr(0, s);
                n = n.substr(s)
            }
            u.push({
                prefix: i,
                method: n.toLowerCase(),
                value: o,
                args: h
            })
        }
        h = [];
        n = i = r = o = ""
    };
    p();
    for (var d = 0, v = e.length; d < v; d++) {
        a = e[d];
        if (f === 0 && t.indexOf(a) > -1) {
            continue
        }
        switch (a) {
            case '"':
                if (!c) {
                    c = a
                } else if (c === a) {
                    c = null
                }
                break;
            case "(":
                if (c) {
                    break
                } else if (f === 0) {
                    f = 1;
                    o += a;
                    continue
                } else {
                    l++
                }
                break;
            case ")":
                if (c) {
                    break
                } else if (f === 1) {
                    if (l === 0) {
                        f = 0;
                        o += a;
                        p();
                        continue
                    } else {
                        l--
                    }
                }
                break;
            case ",":
                if (c) {
                    break
                } else if (f === 0) {
                    p();
                    continue
                } else if (f === 1) {
                    if (l === 0 && !n.match(/^url$/i)) {
                        h.push(r);
                        r = "";
                        o += a;
                        continue
                    }
                }
                break
        }
        o += a;
        if (f === 0) {
            n += a
        } else {
            r += a
        }
    }
    p();
    return u
};
_html2canvas.Util.Bounds = function(t) {
    var n, r = {};
    if (t.getBoundingClientRect) {
        n = t.getBoundingClientRect();
        r.top = n.top;
        r.bottom = n.bottom || n.top + n.height;
        r.left = n.left;
        r.width = n.width || n.right - n.left;
        r.height = n.height || n.bottom - n.top;
        return r
    }
};
_html2canvas.Util.getCSS = function(e, t, n) {
    function s(t, n) {
        var r = e.runtimeStyle && e.runtimeStyle[t],
            i, s = e.style;
        if (!/^-?[0-9]+\.?[0-9]*(?:px)?$/i.test(n) && /^-?\d/.test(n)) {
            i = s.left;
            if (r) {
                e.runtimeStyle.left = e.currentStyle.left
            }
            s.left = t === "fontSize" ? "1em" : n || 0;
            n = s.pixelLeft + "px";
            s.left = i;
            if (r) {
                e.runtimeStyle.left = r
            }
        }
        if (!/^(thin|medium|thick)$/i.test(n)) {
            return Math.round(parseFloat(n)) + "px"
        }
        return n
    }
    var r, i = t.match(/^background(Size|Position)$/);
    if (previousElement !== e) {
        computedCSS = document.defaultView.getComputedStyle(e, null)
    }
    r = computedCSS[t];
    if (i) {
        r = (r || "").split(",");
        r = r[n || 0] || r[0] || "auto";
        r = _html2canvas.Util.trimText(r).split(" ");
        if (t === "backgroundSize" && (!r[0] || r[0].match(/cover|contain|auto/))) {} else {
            r[0] = r[0].indexOf("%") === -1 ? s(t + "X", r[0]) : r[0];
            if (r[1] === undefined) {
                if (t === "backgroundSize") {
                    r[1] = "auto";
                    return r
                } else {
                    r[1] = r[0]
                }
            }
            r[1] = r[1].indexOf("%") === -1 ? s(t + "Y", r[1]) : r[1]
        }
    } else if (/border(Top|Bottom)(Left|Right)Radius/.test(t)) {
        var o = r.split(" ");
        if (o.length <= 1) {
            o[1] = o[0]
        }
        o[0] = parseInt(o[0], 10);
        o[1] = parseInt(o[1], 10);
        r = o
    }
    return r
};
_html2canvas.Util.resizeBounds = function(e, t, n, r, i) {
    var s = n / r,
        o = e / t,
        u, a;
    if (!i || i === "auto") {
        u = n;
        a = r
    } else {
        if (s < o ^ i === "contain") {
            a = r;
            u = r * o
        } else {
            u = n;
            a = n / o
        }
    }
    return {
        width: u,
        height: a
    }
};
_html2canvas.Util.BackgroundPosition = function(e, t, n, r, i) {
    var s = backgroundBoundsFactory("backgroundPosition", e, t, n, r, i);
    return {
        left: s[0],
        top: s[1]
    }
};
_html2canvas.Util.BackgroundSize = function(e, t, n, r) {
    var i = backgroundBoundsFactory("backgroundSize", e, t, n, r);
    return {
        width: i[0],
        height: i[1]
    }
};
_html2canvas.Util.Extend = function(e, t) {
    for (var n in e) {
        if (e.hasOwnProperty(n)) {
            t[n] = e[n]
        }
    }
    return t
};
_html2canvas.Util.Children = function(e) {
    var t;
    try {
        t = e.nodeName && e.nodeName.toUpperCase() === "IFRAME" ? e.contentDocument || e.contentWindow.document : function(e) {
            var t = [];
            if (e !== null) {
                (function(e, t) {
                    var n = e.length,
                        r = 0;
                    if (typeof t.length === "number") {
                        for (var i = t.length; r < i; r++) {
                            e[n++] = t[r]
                        }
                    } else {
                        while (t[r] !== undefined) {
                            e[n++] = t[r++]
                        }
                    }
                    e.length = n;
                    return e
                })(t, e)
            }
            return t
        }(e.childNodes)
    } catch (n) {
        h2clog("html2canvas.Util.Children failed with exception: " + n.message);
        t = []
    }
    return t
};
_html2canvas.Util.Font = function() {
    var e = {};
    return function(t, n, r) {
        if (e[t + "-" + n] !== undefined) {
            return e[t + "-" + n]
        }
        var i = r.createElement("div"),
            s = r.createElement("img"),
            o = r.createElement("span"),
            u = "Hidden Text",
            a, f, l;
        i.style.visibility = "hidden";
        i.style.fontFamily = t;
        i.style.fontSize = n;
        i.style.margin = 0;
        i.style.padding = 0;
        r.body.appendChild(i);
        s.src = "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=";
        s.width = 1;
        s.height = 1;
        s.style.margin = 0;
        s.style.padding = 0;
        s.style.verticalAlign = "baseline";
        o.style.fontFamily = t;
        o.style.fontSize = n;
        o.style.margin = 0;
        o.style.padding = 0;
        o.appendChild(r.createTextNode(u));
        i.appendChild(o);
        i.appendChild(s);
        a = s.offsetTop - o.offsetTop + 1;
        i.removeChild(o);
        i.appendChild(r.createTextNode(u));
        i.style.lineHeight = "normal";
        s.style.verticalAlign = "super";
        f = s.offsetTop - i.offsetTop + 1;
        l = {
            baseline: a,
            lineWidth: 1,
            middle: f
        };
        e[t + "-" + n] = l;
        r.body.removeChild(i);
        return l
    }
}();
(function() {
    _html2canvas.Generate = {};
    var e = [/^(-webkit-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/, /^(-o-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/, /^(-webkit-gradient)\((linear|radial),\s((?:\d{1,3}%?)\s(?:\d{1,3}%?),\s(?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)\-]+)\)$/, /^(-moz-linear-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)]+)\)$/, /^(-webkit-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/, /^(-moz-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s?([a-z\-]*)([\w\d\.\s,%\(\)]+)\)$/, /^(-o-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/];
    _html2canvas.Generate.parseGradient = function(t, n) {
        var r, i, s = e.length,
            o, u, a, f, l, c, h, p, d, v;
        for (i = 0; i < s; i += 1) {
            o = t.match(e[i]);
            if (o) {
                break
            }
        }
        if (o) {
            switch (o[1]) {
                case "-webkit-linear-gradient":
                case "-o-linear-gradient":
                    r = {
                        type: "linear",
                        x0: null,
                        y0: null,
                        x1: null,
                        y1: null,
                        colorStops: []
                    };
                    a = o[2].match(/\w+/g);
                    if (a) {
                        f = a.length;
                        for (i = 0; i < f; i += 1) {
                            switch (a[i]) {
                                case "top":
                                    r.y0 = 0;
                                    r.y1 = n.height;
                                    break;
                                case "right":
                                    r.x0 = n.width;
                                    r.x1 = 0;
                                    break;
                                case "bottom":
                                    r.y0 = n.height;
                                    r.y1 = 0;
                                    break;
                                case "left":
                                    r.x0 = 0;
                                    r.x1 = n.width;
                                    break
                            }
                        }
                    }
                    if (r.x0 === null && r.x1 === null) {
                        r.x0 = r.x1 = n.width / 2
                    }
                    if (r.y0 === null && r.y1 === null) {
                        r.y0 = r.y1 = n.height / 2
                    }
                    a = o[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g);
                    if (a) {
                        f = a.length;
                        l = 1 / Math.max(f - 1, 1);
                        for (i = 0; i < f; i += 1) {
                            c = a[i].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/);
                            if (c[2]) {
                                u = parseFloat(c[2]);
                                if (c[3] === "%") {
                                    u /= 100
                                } else {
                                    u /= n.width
                                }
                            } else {
                                u = i * l
                            }
                            r.colorStops.push({
                                color: c[1],
                                stop: u
                            })
                        }
                    }
                    break;
                case "-webkit-gradient":
                    r = {
                        type: o[2] === "radial" ? "circle" : o[2],
                        x0: 0,
                        y0: 0,
                        x1: 0,
                        y1: 0,
                        colorStops: []
                    };
                    a = o[3].match(/(\d{1,3})%?\s(\d{1,3})%?,\s(\d{1,3})%?\s(\d{1,3})%?/);
                    if (a) {
                        r.x0 = a[1] * n.width / 100;
                        r.y0 = a[2] * n.height / 100;
                        r.x1 = a[3] * n.width / 100;
                        r.y1 = a[4] * n.height / 100
                    }
                    a = o[4].match(/((?:from|to|color-stop)\((?:[0-9\.]+,\s)?(?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)\))+/g);
                    if (a) {
                        f = a.length;
                        for (i = 0; i < f; i += 1) {
                            c = a[i].match(/(from|to|color-stop)\(([0-9\.]+)?(?:,\s)?((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\)/);
                            u = parseFloat(c[2]);
                            if (c[1] === "from") {
                                u = 0
                            }
                            if (c[1] === "to") {
                                u = 1
                            }
                            r.colorStops.push({
                                color: c[3],
                                stop: u
                            })
                        }
                    }
                    break;
                case "-moz-linear-gradient":
                    r = {
                        type: "linear",
                        x0: 0,
                        y0: 0,
                        x1: 0,
                        y1: 0,
                        colorStops: []
                    };
                    a = o[2].match(/(\d{1,3})%?\s(\d{1,3})%?/);
                    if (a) {
                        r.x0 = a[1] * n.width / 100;
                        r.y0 = a[2] * n.height / 100;
                        r.x1 = n.width - r.x0;
                        r.y1 = n.height - r.y0
                    }
                    a = o[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}%)?)+/g);
                    if (a) {
                        f = a.length;
                        l = 1 / Math.max(f - 1, 1);
                        for (i = 0; i < f; i += 1) {
                            c = a[i].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%)?/);
                            if (c[2]) {
                                u = parseFloat(c[2]);
                                if (c[3]) {
                                    u /= 100
                                }
                            } else {
                                u = i * l
                            }
                            r.colorStops.push({
                                color: c[1],
                                stop: u
                            })
                        }
                    }
                    break;
                case "-webkit-radial-gradient":
                case "-moz-radial-gradient":
                case "-o-radial-gradient":
                    r = {
                        type: "circle",
                        x0: 0,
                        y0: 0,
                        x1: n.width,
                        y1: n.height,
                        cx: 0,
                        cy: 0,
                        rx: 0,
                        ry: 0,
                        colorStops: []
                    };
                    a = o[2].match(/(\d{1,3})%?\s(\d{1,3})%?/);
                    if (a) {
                        r.cx = a[1] * n.width / 100;
                        r.cy = a[2] * n.height / 100
                    }
                    a = o[3].match(/\w+/);
                    c = o[4].match(/[a-z\-]*/);
                    if (a && c) {
                        switch (c[0]) {
                            case "farthest-corner":
                            case "cover":
                            case "":
                                h = Math.sqrt(Math.pow(r.cx, 2) + Math.pow(r.cy, 2));
                                p = Math.sqrt(Math.pow(r.cx, 2) + Math.pow(r.y1 - r.cy, 2));
                                d = Math.sqrt(Math.pow(r.x1 - r.cx, 2) + Math.pow(r.y1 - r.cy, 2));
                                v = Math.sqrt(Math.pow(r.x1 - r.cx, 2) + Math.pow(r.cy, 2));
                                r.rx = r.ry = Math.max(h, p, d, v);
                                break;
                            case "closest-corner":
                                h = Math.sqrt(Math.pow(r.cx, 2) + Math.pow(r.cy, 2));
                                p = Math.sqrt(Math.pow(r.cx, 2) + Math.pow(r.y1 - r.cy, 2));
                                d = Math.sqrt(Math.pow(r.x1 - r.cx, 2) + Math.pow(r.y1 - r.cy, 2));
                                v = Math.sqrt(Math.pow(r.x1 - r.cx, 2) + Math.pow(r.cy, 2));
                                r.rx = r.ry = Math.min(h, p, d, v);
                                break;
                            case "farthest-side":
                                if (a[0] === "circle") {
                                    r.rx = r.ry = Math.max(r.cx, r.cy, r.x1 - r.cx, r.y1 - r.cy)
                                } else {
                                    r.type = a[0];
                                    r.rx = Math.max(r.cx, r.x1 - r.cx);
                                    r.ry = Math.max(r.cy, r.y1 - r.cy)
                                }
                                break;
                            case "closest-side":
                            case "contain":
                                if (a[0] === "circle") {
                                    r.rx = r.ry = Math.min(r.cx, r.cy, r.x1 - r.cx, r.y1 - r.cy)
                                } else {
                                    r.type = a[0];
                                    r.rx = Math.min(r.cx, r.x1 - r.cx);
                                    r.ry = Math.min(r.cy, r.y1 - r.cy)
                                }
                                break
                        }
                    }
                    a = o[5].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g);
                    if (a) {
                        f = a.length;
                        l = 1 / Math.max(f - 1, 1);
                        for (i = 0; i < f; i += 1) {
                            c = a[i].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/);
                            if (c[2]) {
                                u = parseFloat(c[2]);
                                if (c[3] === "%") {
                                    u /= 100
                                } else {
                                    u /= n.width
                                }
                            } else {
                                u = i * l
                            }
                            r.colorStops.push({
                                color: c[1],
                                stop: u
                            })
                        }
                    }
                    break
            }
        }
        return r
    };
    _html2canvas.Generate.Gradient = function(e, t) {
        if (t.width === 0 || t.height === 0) {
            return
        }
        var n = document.createElement("canvas"),
            r = n.getContext("2d"),
            i, s, o, u;
        n.width = t.width;
        n.height = t.height;
        i = _html2canvas.Generate.parseGradient(e, t);
        if (i) {
            if (i.type === "linear") {
                s = r.createLinearGradient(i.x0, i.y0, i.x1, i.y1);
                for (o = 0, u = i.colorStops.length; o < u; o += 1) {
                    try {
                        s.addColorStop(i.colorStops[o].stop, i.colorStops[o].color)
                    } catch (a) {
                        h2clog(["failed to add color stop: ", a, "; tried to add: ", i.colorStops[o], "; stop: ", o, "; in: ", e])
                    }
                }
                r.fillStyle = s;
                r.fillRect(0, 0, t.width, t.height)
            } else if (i.type === "circle") {
                s = r.createRadialGradient(i.cx, i.cy, 0, i.cx, i.cy, i.rx);
                for (o = 0, u = i.colorStops.length; o < u; o += 1) {
                    try {
                        s.addColorStop(i.colorStops[o].stop, i.colorStops[o].color)
                    } catch (a) {
                        h2clog(["failed to add color stop: ", a, "; tried to add: ", i.colorStops[o], "; stop: ", o, "; in: ", e])
                    }
                }
                r.fillStyle = s;
                r.fillRect(0, 0, t.width, t.height)
            } else if (i.type === "ellipse") {
                var f = document.createElement("canvas"),
                    l = f.getContext("2d"),
                    c = Math.max(i.rx, i.ry),
                    h = c * 2,
                    p;
                f.width = f.height = h;
                s = l.createRadialGradient(i.rx, i.ry, 0, i.rx, i.ry, c);
                for (o = 0, u = i.colorStops.length; o < u; o += 1) {
                    try {
                        s.addColorStop(i.colorStops[o].stop, i.colorStops[o].color)
                    } catch (a) {
                        h2clog(["failed to add color stop: ", a, "; tried to add: ", i.colorStops[o], "; stop: ", o, "; in: ", e])
                    }
                }
                l.fillStyle = s;
                l.fillRect(0, 0, h, h);
                r.fillStyle = i.colorStops[o - 1].color;
                r.fillRect(0, 0, n.width, n.height);
                r.drawImage(f, i.cx - i.rx, i.cy - i.ry, 2 * i.rx, 2 * i.ry)
            }
        }
        return n
    };
    _html2canvas.Generate.ListAlpha = function(e) {
        var t = "",
            n;
        do {
            n = e % 26;
            t = String.fromCharCode(n + 64) + t;
            e = e / 26
        } while (e * 26 > 26);
        return t
    };
    _html2canvas.Generate.ListRoman = function(e) {
        var t = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"],
            n = [1e3, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
            r = "",
            i, s = t.length;
        if (e <= 0 || e >= 4e3) {
            return e
        }
        for (i = 0; i < s; i += 1) {
            while (e >= n[i]) {
                e -= n[i];
                r += t[i]
            }
        }
        return r
    }
})();
_html2canvas.Parse = function(e, t) {
    function c() {
        return Math.max(Math.max(i.body.scrollWidth, i.documentElement.scrollWidth), Math.max(i.body.offsetWidth, i.documentElement.offsetWidth), Math.max(i.body.clientWidth, i.documentElement.clientWidth))
    }

    function h() {
        return Math.max(Math.max(i.body.scrollHeight, i.documentElement.scrollHeight), Math.max(i.body.offsetHeight, i.documentElement.offsetHeight), Math.max(i.body.clientHeight, i.documentElement.clientHeight))
    }

    function p(e, t) {
        var n = parseInt(a(e, t), 10);
        return isNaN(n) ? 0 : n
    }

    function d(e, t, n, i, s, o) {
        if (o !== "transparent") {
            e.setVariable("fillStyle", o);
            e.fillRect(t, n, i, s);
            r += 1
        }
    }

    function v(e, t) {
        switch (t) {
            case "lowercase":
                return e.toLowerCase();
            case "capitalize":
                return e.replace(/(^|\s|:|-|\(|\))([a-z])/g, function(e, t, n) {
                    if (e.length > 0) {
                        return t + n.toUpperCase()
                    }
                });
            case "uppercase":
                return e.toUpperCase();
            default:
                return e
        }
    }

    function m(e) {
        return /^(normal|none|0px)$/.test(e)
    }

    function g(e, t, n, i) {
        if (e !== null && _html2canvas.Util.trimText(e).length > 0) {
            i.fillText(e, t, n);
            r += 1
        }
    }

    function y(e, t, n, r) {
        var s = false,
            o = a(t, "fontWeight"),
            u = a(t, "fontFamily"),
            f = a(t, "fontSize");
        switch (parseInt(o, 10)) {
            case 401:
                o = "bold";
                break;
            case 400:
                o = "normal";
                break
        }
        e.setVariable("fillStyle", r);
        e.setVariable("font", [a(t, "fontStyle"), a(t, "fontVariant"), o, f, u].join(" "));
        e.setVariable("textAlign", s ? "right" : "left");
        if (n !== "none") {
            return _html2canvas.Util.Font(u, f, i)
        }
    }

    function b(e, t, n, r, i) {
        switch (t) {
            case "underline":
                d(e, n.left, Math.round(n.top + r.baseline + r.lineWidth), n.width, 1, i);
                break;
            case "overline":
                d(e, n.left, Math.round(n.top), n.width, 1, i);
                break;
            case "line-through":
                d(e, n.left, Math.ceil(n.top + r.middle + r.lineWidth), n.width, 1, i);
                break
        }
    }

    function w(e, t, n, r) {
        var i;
        if (s.rangeBounds) {
            if (n !== "none" || _html2canvas.Util.trimText(t).length !== 0) {
                i = E(t, e.node, e.textOffset)
            }
            e.textOffset += t.length
        } else if (e.node && typeof e.node.nodeValue === "string") {
            var o = r ? e.node.splitText(t.length) : null;
            i = S(e.node);
            e.node = o
        }
        return i
    }

    function E(e, t, n) {
        var r = i.createRange();
        r.setStart(t, n);
        r.setEnd(t, n + e.length);
        return r.getBoundingClientRect()
    }

    function S(e) {
        var t = e.parentNode,
            n = i.createElement("wrapper"),
            r = e.cloneNode(true);
        n.appendChild(e.cloneNode(true));
        t.replaceChild(n, e);
        var s = _html2canvas.Util.Bounds(n);
        t.replaceChild(r, n);
        return s
    }

    function x(e, n, r) {
        var i = r.ctx,
            s = a(e, "color"),
            o = a(e, "textDecoration"),
            u = a(e, "textAlign"),
            f, l, c = {
                node: n,
                textOffset: 0
            };
        if (_html2canvas.Util.trimText(n.nodeValue).length > 0) {
            n.nodeValue = v(n.nodeValue, a(e, "textTransform"));
            u = u.replace(["-webkit-auto"], ["auto"]);
            l = !t.letterRendering && /^(left|right|justify|auto)$/.test(u) && m(a(e, "letterSpacing")) ? n.nodeValue.split(/(\b| )/) : n.nodeValue.split("");
            f = y(i, e, o, s);
            if (t.chinese) {
                l.forEach(function(e, t) {
                    if (/.*[\u4E00-\u9FA5].*$/.test(e)) {
                        e = e.split("");
                        e.unshift(t, 1);
                        l.splice.apply(l, e)
                    }
                })
            }
            l.forEach(function(e, t) {
                var n = w(c, e, o, t < l.length - 1);
                if (n) {
                    g(e, n.left, n.bottom, i);
                    b(i, o, n, f, s)
                }
            })
        }
    }

    function T(e, t) {
        var n = i.createElement("boundelement"),
            r, s;
        n.style.display = "inline";
        r = e.style.listStyleType;
        e.style.listStyleType = "none";
        n.appendChild(i.createTextNode(t));
        e.insertBefore(n, e.firstChild);
        s = _html2canvas.Util.Bounds(n);
        e.removeChild(n);
        e.style.listStyleType = r;
        return s
    }

    function N(e) {
        var t = -1,
            n = 1,
            r = e.parentNode.childNodes;
        if (e.parentNode) {
            while (r[++t] !== e) {
                if (r[t].nodeType === 1) {
                    n++
                }
            }
            return n
        } else {
            return -1
        }
    }

    function C(e, t) {
        var n = N(e),
            r;
        switch (t) {
            case "decimal":
                r = n;
                break;
            case "decimal-leading-zero":
                r = n.toString().length === 1 ? n = "0" + n.toString() : n.toString();
                break;
            case "upper-roman":
                r = _html2canvas.Generate.ListRoman(n);
                break;
            case "lower-roman":
                r = _html2canvas.Generate.ListRoman(n).toLowerCase();
                break;
            case "lower-alpha":
                r = _html2canvas.Generate.ListAlpha(n).toLowerCase();
                break;
            case "upper-alpha":
                r = _html2canvas.Generate.ListAlpha(n);
                break
        }
        r += ". ";
        return r
    }

    function k(e, t, n) {
        var r, i, s = t.ctx,
            o = a(e, "listStyleType"),
            u;
        if (/^(decimal|decimal-leading-zero|upper-alpha|upper-latin|upper-roman|lower-alpha|lower-greek|lower-latin|lower-roman)$/i.test(o)) {
            i = C(e, o);
            u = T(e, i);
            y(s, e, "none", a(e, "color"));
            if (a(e, "listStylePosition") === "inside") {
                s.setVariable("textAlign", "left");
                r = n.left
            } else {
                return
            }
            g(i, r, u.bottom, s)
        }
    }

    function L(t) {
        var n = e[t];
        if (n && n.succeeded === true) {
            return n.img
        } else {
            return false
        }
    }

    function A(e, t) {
        var n = Math.max(e.left, t.left),
            r = Math.max(e.top, t.top),
            i = Math.min(e.left + e.width, t.left + t.width),
            s = Math.min(e.top + e.height, t.top + t.height);
        return {
            left: n,
            top: r,
            width: i - n,
            height: s - r
        }
    }

    function O(e, t) {
        var n;
        if (!t) {
            n = h2czContext(0);
            return n
        }
        if (e !== "auto") {
            n = h2czContext(e);
            t.children.push(n);
            return n
        }
        return t
    }

    function M(e, t, n, r, i) {
        var s = p(t, "paddingLeft"),
            o = p(t, "paddingTop"),
            u = p(t, "paddingRight"),
            a = p(t, "paddingBottom");
        W(e, n, 0, 0, n.width, n.height, r.left + s + i[3].width, r.top + o + i[0].width, r.width - (i[1].width + i[3].width + s + u), r.height - (i[0].width + i[2].width + o + a))
    }

    function _(e) {
        return ["Top", "Right", "Bottom", "Left"].map(function(t) {
            return {
                width: p(e, "border" + t + "Width"),
                color: a(e, "border" + t + "Color")
            }
        })
    }

    function D(e) {
        return ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map(function(t) {
            return a(e, "border" + t + "Radius")
        })
    }

    function H(e, t, n, r) {
        var i = function(e, t, n) {
            return {
                x: e.x + (t.x - e.x) * n,
                y: e.y + (t.y - e.y) * n
            }
        };
        return {
            start: e,
            startControl: t,
            endControl: n,
            end: r,
            subdivide: function(s) {
                var o = i(e, t, s),
                    u = i(t, n, s),
                    a = i(n, r, s),
                    f = i(o, u, s),
                    l = i(u, a, s),
                    c = i(f, l, s);
                return [H(e, o, f, c), H(c, l, a, r)]
            },
            curveTo: function(e) {
                e.push(["bezierCurve", t.x, t.y, n.x, n.y, r.x, r.y])
            },
            curveToReversed: function(r) {
                r.push(["bezierCurve", n.x, n.y, t.x, t.y, e.x, e.y])
            }
        }
    }

    function B(e, t, n, r, i, s, o) {
        if (t[0] > 0 || t[1] > 0) {
            e.push(["line", r[0].start.x, r[0].start.y]);
            r[0].curveTo(e);
            r[1].curveTo(e)
        } else {
            e.push(["line", s, o])
        }
        if (n[0] > 0 || n[1] > 0) {
            e.push(["line", i[0].start.x, i[0].start.y])
        }
    }

    function j(e, t, n, r, i, s, o) {
        var u = [];
        if (t[0] > 0 || t[1] > 0) {
            u.push(["line", r[1].start.x, r[1].start.y]);
            r[1].curveTo(u)
        } else {
            u.push(["line", e.c1[0], e.c1[1]])
        }
        if (n[0] > 0 || n[1] > 0) {
            u.push(["line", s[0].start.x, s[0].start.y]);
            s[0].curveTo(u);
            u.push(["line", o[0].end.x, o[0].end.y]);
            o[0].curveToReversed(u)
        } else {
            u.push(["line", e.c2[0], e.c2[1]]);
            u.push(["line", e.c3[0], e.c3[1]])
        }
        if (t[0] > 0 || t[1] > 0) {
            u.push(["line", i[1].end.x, i[1].end.y]);
            i[1].curveToReversed(u)
        } else {
            u.push(["line", e.c4[0], e.c4[1]])
        }
        return u
    }

    function F(e, t, n) {
        var r = e.left,
            i = e.top,
            s = e.width,
            o = e.height,
            u = t[0][0],
            a = t[0][1],
            f = t[1][0],
            l = t[1][1],
            c = t[2][0],
            h = t[2][1],
            p = t[3][0],
            d = t[3][1],
            v = s - f,
            m = o - c,
            g = s - h,
            y = o - d;
        return {
            topLeftOuter: P(r, i, u, a).topLeft.subdivide(.5),
            topLeftInner: P(r + n[3].width, i + n[0].width, Math.max(0, u - n[3].width), Math.max(0, a - n[0].width)).topLeft.subdivide(.5),
            topRightOuter: P(r + v, i, f, l).topRight.subdivide(.5),
            topRightInner: P(r + Math.min(v, s + n[3].width), i + n[0].width, v > s + n[3].width ? 0 : f - n[3].width, l - n[0].width).topRight.subdivide(.5),
            bottomRightOuter: P(r + g, i + m, h, c).bottomRight.subdivide(.5),
            bottomRightInner: P(r + Math.min(g, s + n[3].width), i + Math.min(m, o + n[0].width), Math.max(0, h - n[1].width), Math.max(0, c - n[2].width)).bottomRight.subdivide(.5),
            bottomLeftOuter: P(r, i + y, p, d).bottomLeft.subdivide(.5),
            bottomLeftInner: P(r + n[3].width, i + y, Math.max(0, p - n[3].width), Math.max(0, d - n[2].width)).bottomLeft.subdivide(.5)
        }
    }

    function I(e, t, n, r, i) {
        var s = a(e, "backgroundClip"),
            o = [];
        switch (s) {
            case "content-box":
            case "padding-box":
                B(o, r[0], r[1], t.topLeftInner, t.topRightInner, i.left + n[3].width, i.top + n[0].width);
                B(o, r[1], r[2], t.topRightInner, t.bottomRightInner, i.left + i.width - n[1].width, i.top + n[0].width);
                B(o, r[2], r[3], t.bottomRightInner, t.bottomLeftInner, i.left + i.width - n[1].width, i.top + i.height - n[2].width);
                B(o, r[3], r[0], t.bottomLeftInner, t.topLeftInner, i.left + n[3].width, i.top + i.height - n[2].width);
                break;
            default:
                B(o, r[0], r[1], t.topLeftOuter, t.topRightOuter, i.left, i.top);
                B(o, r[1], r[2], t.topRightOuter, t.bottomRightOuter, i.left + i.width, i.top);
                B(o, r[2], r[3], t.bottomRightOuter, t.bottomLeftOuter, i.left + i.width, i.top + i.height);
                B(o, r[3], r[0], t.bottomLeftOuter, t.topLeftOuter, i.left, i.top + i.height);
                break
        }
        return o
    }

    function q(e, t, n) {
        var r = t.left,
            i = t.top,
            s = t.width,
            o = t.height,
            u, a, f, l, c, h, p = D(e),
            d = F(t, p, n),
            v = {
                clip: I(e, d, n, p, t),
                borders: []
            };
        for (u = 0; u < 4; u++) {
            if (n[u].width > 0) {
                a = r;
                f = i;
                l = s;
                c = o - n[2].width;
                switch (u) {
                    case 0:
                        c = n[0].width;
                        h = j({
                            c1: [a, f],
                            c2: [a + l, f],
                            c3: [a + l - n[1].width, f + c],
                            c4: [a + n[3].width, f + c]
                        }, p[0], p[1], d.topLeftOuter, d.topLeftInner, d.topRightOuter, d.topRightInner);
                        break;
                    case 1:
                        a = r + s - n[1].width;
                        l = n[1].width;
                        h = j({
                            c1: [a + l, f],
                            c2: [a + l, f + c + n[2].width],
                            c3: [a, f + c],
                            c4: [a, f + n[0].width]
                        }, p[1], p[2], d.topRightOuter, d.topRightInner, d.bottomRightOuter, d.bottomRightInner);
                        break;
                    case 2:
                        f = f + o - n[2].width;
                        c = n[2].width;
                        h = j({
                            c1: [a + l, f + c],
                            c2: [a, f + c],
                            c3: [a + n[3].width, f],
                            c4: [a + l - n[2].width, f]
                        }, p[2], p[3], d.bottomRightOuter, d.bottomRightInner, d.bottomLeftOuter, d.bottomLeftInner);
                        break;
                    case 3:
                        l = n[3].width;
                        h = j({
                            c1: [a, f + c + n[2].width],
                            c2: [a, f],
                            c3: [a + l, f + n[0].width],
                            c4: [a + l, f + c]
                        }, p[3], p[0], d.bottomLeftOuter, d.bottomLeftInner, d.topLeftOuter, d.topLeftInner);
                        break
                }
                v.borders.push({
                    args: h,
                    color: n[u].color
                })
            }
        }
        return v
    }

    function R(e, t) {
        var n = e.drawShape();
        t.forEach(function(e, t) {
            n[t === 0 ? "moveTo" : e[0] + "To"].apply(null, e.slice(1))
        });
        return n
    }

    function U(e, t, n) {
        if (n !== "transparent") {
            e.setVariable("fillStyle", n);
            R(e, t);
            e.fill();
            r += 1
        }
    }

    function z(e, t, n) {
        var r = i.createElement("valuewrap"),
            s = ["lineHeight", "textAlign", "fontFamily", "color", "fontSize", "paddingLeft", "paddingTop", "width", "height", "border", "borderLeftWidth", "borderTopWidth"],
            o, f;
        s.forEach(function(t) {
            try {
                r.style[t] = a(e, t)
            } catch (n) {
                h2clog("html2canvas: Parse: Exception caught in renderFormValue: " + n.message)
            }
        });
        r.style.borderColor = "black";
        r.style.borderStyle = "solid";
        r.style.display = "block";
        r.style.position = "absolute";
        if (/^(submit|reset|button|text|password)$/.test(e.type) || e.nodeName === "SELECT") {
            r.style.lineHeight = a(e, "height")
        }
        r.style.top = t.top + "px";
        r.style.left = t.left + "px";
        o = e.nodeName === "SELECT" ? (e.options[e.selectedIndex] || 0).text : e.value;
        if (!o) {
            o = e.placeholder
        }
        f = i.createTextNode(o);
        r.appendChild(f);
        u.appendChild(r);
        x(e, f, n);
        u.removeChild(r)
    }

    function W(e) {
        e.drawImage.apply(e, Array.prototype.slice.call(arguments, 1));
        r += 1
    }

    function X(e, t) {
        var n = window.getComputedStyle(e, t);
        if (!n || !n.content || n.content === "none" || n.content === "-moz-alt-content") {
            return
        }
        var r = n.content + "",
            i = r.substr(0, 1);
        if (i === r.substr(r.length - 1) && i.match(/'|"/)) {
            r = r.substr(1, r.length - 2)
        }
        var s = r.substr(0, 3) === "url",
            o = document.createElement(s ? "img" : "span");
        o.className = f + "-before " + f + "-after";
        Object.keys(n).filter(V).forEach(function(e) {
            o.style[e] = n[e]
        });
        if (s) {
            o.src = _html2canvas.Util.parseBackgroundImage(r)[0].args[0]
        } else {
            o.innerHTML = r
        }
        return o
    }

    function V(e) {
        return isNaN(window.parseInt(e, 10))
    }

    function $(e, t) {
        var n = X(e, ":before"),
            r = X(e, ":after");
        if (!n && !r) {
            return
        }
        if (n) {
            e.className += " " + f + "-before";
            e.parentNode.insertBefore(n, e);
            st(n, t, true);
            e.parentNode.removeChild(n);
            e.className = e.className.replace(f + "-before", "").trim()
        }
        if (r) {
            e.className += " " + f + "-after";
            e.appendChild(r);
            st(r, t, true);
            e.removeChild(r);
            e.className = e.className.replace(f + "-after", "").trim()
        }
    }

    function J(e, t, n, r) {
        var i = Math.round(r.left + n.left),
            s = Math.round(r.top + n.top);
        e.createPattern(t);
        e.translate(i, s);
        e.fill();
        e.translate(-i, -s)
    }

    function K(e, t, n, r, i, s, o, u) {
        var a = [];
        a.push(["line", Math.round(i), Math.round(s)]);
        a.push(["line", Math.round(i + o), Math.round(s)]);
        a.push(["line", Math.round(i + o), Math.round(u + s)]);
        a.push(["line", Math.round(i), Math.round(u + s)]);
        R(e, a);
        e.save();
        e.clip();
        J(e, t, n, r);
        e.restore()
    }

    function Q(e, t, n) {
        d(e, t.left, t.top, t.width, t.height, n)
    }

    function G(e, t, n, r, i) {
        var s = _html2canvas.Util.BackgroundSize(e, t, r, i),
            o = _html2canvas.Util.BackgroundPosition(e, t, r, i, s),
            u = a(e, "backgroundRepeat").split(",").map(function(e) {
                return e.trim()
            });
        r = Z(r, s);
        u = u[i] || u[0];
        switch (u) {
            case "repeat-x":
                K(n, r, o, t, t.left, t.top + o.top, 99999, r.height);
                break;
            case "repeat-y":
                K(n, r, o, t, t.left + o.left, t.top, r.width, 99999);
                break;
            case "no-repeat":
                K(n, r, o, t, t.left + o.left, t.top + o.top, r.width, r.height);
                break;
            default:
                J(n, r, o, {
                    top: t.top,
                    left: t.left,
                    width: r.width,
                    height: r.height
                });
                break
        }
    }

    function Y(e, t, n) {
        var r = a(e, "backgroundImage"),
            i = _html2canvas.Util.parseBackgroundImage(r),
            s, o = i.length;
        while (o--) {
            r = i[o];
            if (!r.args || r.args.length === 0) {
                continue
            }
            var u = r.method === "url" ? r.args[0] : r.value;
            s = L(u);
            if (s) {
                G(e, t, n, s, o)
            } else {
                h2clog("html2canvas: Error loading background:", r)
            }
        }
    }

    function Z(e, t) {
        if (e.width === t.width && e.height === t.height) {
            return e
        }
        var n, r = i.createElement("canvas");
        r.width = t.width;
        r.height = t.height;
        n = r.getContext("2d");
        W(n, e, 0, 0, e.width, e.height, 0, 0, t.width, t.height);
        return r
    }

    function et(e, t, n) {
        var r = a(t, "opacity") * (n ? n.opacity : 1);
        e.setVariable("globalAlpha", r);
        return r
    }

    function tt(e, n, r) {
        var i = h2cRenderContext(!n ? c() : r.width, !n ? h() : r.height),
            s = {
                ctx: i,
                zIndex: O(a(e, "zIndex"), n ? n.zIndex : null),
                opacity: et(i, e, n),
                cssPosition: a(e, "position"),
                borders: _(e),
                clip: n && n.clip ? _html2canvas.Util.Extend({}, n.clip) : null
            };
        if (t.useOverflow === true && /(hidden|scroll|auto)/.test(a(e, "overflow")) === true && /(BODY)/i.test(e.nodeName) === false) {
            s.clip = s.clip ? A(s.clip, r) : r
        }
        s.zIndex.children.push(s);
        return s
    }

    function nt(e, t, n) {
        var r = {
            left: t.left + e[3].width,
            top: t.top + e[0].width,
            width: t.width - (e[1].width + e[3].width),
            height: t.height - (e[0].width + e[2].width)
        };
        if (n) {
            r = A(r, n)
        }
        return r
    }

    function rt(e, t, n) {
        var r = _html2canvas.Util.Bounds(e),
            i, s = o.test(e.nodeName) ? "#efefef" : a(e, "backgroundColor"),
            u = tt(e, t, r),
            f = u.borders,
            l = u.ctx,
            c = nt(f, r, u.clip),
            h = q(e, r, f);
        R(l, h.clip);
        l.save();
        l.clip();
        if (c.height > 0 && c.width > 0) {
            Q(l, r, s);
            Y(e, c, l)
        }
        l.restore();
        h.borders.forEach(function(e) {
            U(l, e.args, e.color)
        });
        if (!n) {
            $(e, u)
        }
        switch (e.nodeName) {
            case "IMG":
                if (i = L(e.getAttribute("src"))) {
                    M(l, e, i, r, f)
                } else {
                    h2clog("html2canvas: Error loading <img>:" + e.getAttribute("src"))
                }
                break;
            case "INPUT":
                if (/^(text|url|email|submit|button|reset)$/.test(e.type) && (e.value || e.placeholder).length > 0) {
                    z(e, r, u)
                }
                break;
            case "TEXTAREA":
                if ((e.value || e.placeholder || "").length > 0) {
                    z(e, r, u)
                }
                break;
            case "SELECT":
                if ((e.options || e.placeholder || "").length > 0) {
                    z(e, r, u)
                }
                break;
            case "LI":
                k(e, u, c);
                break;
            case "VIDEO":
                var p = document.createElement("canvas");
                p.width = e.videoWidth || e.clientWidth || 320;
                p.height = e.videoHeight || e.clientHeight || 240;
                var d = p.getContext("2d");
                d.drawImage(e, 0, 0, p.width, p.height);
                M(l, p, p, r, f);
                break;
            case "CANVAS":
                M(l, e, e, r, f);
                break
        }
        return u
    }

    function it(e) {
        return a(e, "display") !== "none" && a(e, "visibility") !== "hidden" && !e.hasAttribute("data-html2canvas-ignore")
    }

    function st(e, t, n) {
        if (it(e)) {
            t = rt(e, t, n) || t;
            if (!o.test(e.nodeName)) {
                if (e.tagName == "IFRAME") e = e.contentDocument;
                _html2canvas.Util.Children(e).forEach(function(r) {
                    if (r.nodeType === 1) {
                        st(r, t, n)
                    } else if (r.nodeType === 3) {
                        x(e, r, t)
                    }
                })
            }
        }
    }

    function ot(e, t) {
        function o(e) {
            var t = _html2canvas.Util.Children(e),
                n = t.length,
                r, i, u, a, f;
            for (f = 0; f < n; f += 1) {
                a = t[f];
                if (a.nodeType === 3) {
                    s += a.nodeValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")
                } else if (a.nodeType === 1) {
                    if (!/^(script|meta|title)$/.test(a.nodeName.toLowerCase())) {
                        s += "<" + a.nodeName.toLowerCase();
                        if (a.hasAttributes()) {
                            r = a.attributes;
                            u = r.length;
                            for (i = 0; i < u; i += 1) {
                                s += " " + r[i].name + '="' + r[i].value + '"'
                            }
                        }
                        s += ">";
                        o(a);
                        s += "</" + a.nodeName.toLowerCase() + ">"
                    }
                }
            }
        }
        var n = new Image,
            r = c(),
            i = h(),
            s = "";
        o(e);
        n.src = ["data:image/svg+xml,", "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='" + r + "' height='" + i + "'>", "<foreignObject width='" + r + "' height='" + i + "'>", "<html xmlns='http://www.w3.org/1999/xhtml' style='margin:0;'>", s.replace(/\#/g, "%23"), "</html>", "</foreignObject>", "</svg>"].join("");
        n.onload = function() {
            t.svgRender = n
        }
    }

    function ut() {
        var e = rt(n, null);
        if (s.svgRendering) {
            ot(document.documentElement, e)
        }
        Array.prototype.slice.call(n.children, 0).forEach(function(t) {
            st(t, e)
        });
        e.backgroundColor = a(document.documentElement, "backgroundColor");
        u.removeChild(l);
        return e
    }
    var n = t.elements === undefined ? document.body : t.elements[0],
        r = 0,
        i = n.ownerDocument,
        s = _html2canvas.Util.Support(t, i),
        o = new RegExp("(" + t.ignoreElements + ")"),
        u = i.body,
        a = _html2canvas.Util.getCSS,
        f = "___html2canvas___pseudoelement",
        l = i.createElement("style");
    l.innerHTML = "." + f + '-before:before { content: "" !important; display: none !important; }' + "." + f + '-after:after { content: "" !important; display: none !important; }';
    u.appendChild(l);
    e = e || {};
    var P = function(e) {
        return function(t, n, r, i) {
            var s = r * e,
                o = i * e,
                u = t + r,
                a = n + i;
            return {
                topLeft: H({
                    x: t,
                    y: a
                }, {
                    x: t,
                    y: a - o
                }, {
                    x: u - s,
                    y: n
                }, {
                    x: u,
                    y: n
                }),
                topRight: H({
                    x: t,
                    y: n
                }, {
                    x: t + s,
                    y: n
                }, {
                    x: u,
                    y: a - o
                }, {
                    x: u,
                    y: a
                }),
                bottomRight: H({
                    x: u,
                    y: n
                }, {
                    x: u,
                    y: n + o
                }, {
                    x: t + s,
                    y: a
                }, {
                    x: t,
                    y: a
                }),
                bottomLeft: H({
                    x: u,
                    y: a
                }, {
                    x: u - s,
                    y: a
                }, {
                    x: t,
                    y: n + o
                }, {
                    x: t,
                    y: n
                })
            }
        }
    }(4 * ((Math.sqrt(2) - 1) / 3));
    return ut()
};
_html2canvas.Preload = function(e) {
    function p(e) {
        l.href = e;
        l.href = l.href;
        var t = l.protocol + l.host;
        return t === n
    }

    function d() {
        h2clog("html2canvas: start: images: " + t.numLoaded + " / " + t.numTotal + " (failed: " + t.numFailed + ")");
        if (!t.firstRun && t.numLoaded >= t.numTotal) {
            h2clog("Finished loading images: # " + t.numTotal + " (failed: " + t.numFailed + ")");
            if (typeof e.complete === "function") {
                e.complete(t)
            }
        }
    }

    function v(n, r, i) {
        var o, a = e.proxy,
            f;
        l.href = n;
        n = l.href;
        o = "html2canvas_" + s++;
        i.callbackname = o;
        if (a.indexOf("?") > -1) {
            a += "&"
        } else {
            a += "?"
        }
        a += "url=" + encodeURIComponent(n) + "&callback=" + o;
        f = u.createElement("script");
        window[o] = function(e) {
            if (e.substring(0, 6) === "error:") {
                i.succeeded = false;
                t.numLoaded++;
                t.numFailed++;
                d()
            } else {
                S(r, i);
                r.src = e
            }
            window[o] = undefined;
            try {
                delete window[o]
            } catch (n) {}
            f.parentNode.removeChild(f);
            f = null;
            delete i.script;
            delete i.callbackname
        };
        f.setAttribute("type", "text/javascript");
        f.setAttribute("src", a);
        i.script = f;
        window.document.body.appendChild(f)
    }

    function m(e, t) {
        var n = window.getComputedStyle(e, t),
            i = n.content;
        if (i.substr(0, 3) === "url") {
            r.loadImage(_html2canvas.Util.parseBackgroundImage(i)[0].args[0])
        }
        w(n.backgroundImage, e)
    }

    function g(e) {
        m(e, ":before");
        m(e, ":after")
    }

    function y(e, n) {
        var r = _html2canvas.Generate.Gradient(e, n);
        if (r !== undefined) {
            t[e] = {
                img: r,
                succeeded: true
            };
            t.numTotal++;
            t.numLoaded++;
            d()
        }
    }

    function b(e) {
        return e && e.method && e.args && e.args.length > 0
    }

    function w(e, t) {
        var n;
        _html2canvas.Util.parseBackgroundImage(e).filter(b).forEach(function(e) {
            if (e.method === "url") {
                r.loadImage(e.args[0])
            } else if (e.method.match(/\-?gradient$/)) {
                if (n === undefined) {
                    n = _html2canvas.Util.Bounds(t)
                }
                y(e.value, n)
            }
        })
    }

    function E(e) {
        var t = false;
        try {
            _html2canvas.Util.Children(e).forEach(function(e) {
                E(e)
            })
        } catch (n) {}
        try {
            t = e.nodeType
        } catch (r) {
            t = false;
            h2clog("html2canvas: failed to access some element's nodeType - Exception: " + r.message)
        }
        if (t === 1 || t === undefined) {
            g(e);
            try {
                w(_html2canvas.Util.getCSS(e, "backgroundImage"), e)
            } catch (n) {
                h2clog("html2canvas: failed to get background-image - Exception: " + n.message)
            }
            w(e)
        }
    }

    function S(n, r) {
        n.onload = function() {
            if (r.timer !== undefined) {
                window.clearTimeout(r.timer)
            }
            t.numLoaded++;
            r.succeeded = true;
            n.onerror = n.onload = null;
            d()
        };
        n.onerror = function() {
            if (n.crossOrigin === "anonymous") {
                window.clearTimeout(r.timer);
                if (e.proxy) {
                    var i = n.src;
                    n = new Image;
                    r.img = n;
                    n.src = i;
                    v(n.src, n, r);
                    return
                }
            }
            t.numLoaded++;
            t.numFailed++;
            r.succeeded = false;
            n.onerror = n.onload = null;
            d()
        }
    }
    var t = {
            numLoaded: 0,
            numFailed: 0,
            numTotal: 0,
            cleanupDone: false
        },
        n, r, i, s = 0,
        o = e.elements[0] || document.body,
        u = o.ownerDocument,
        a = u.images,
        f = a.length,
        l = u.createElement("a"),
        c = function(e) {
            return e.crossOrigin !== undefined
        }(new Image),
        h;
    l.href = window.location.href;
    n = l.protocol + l.host;
    r = {
        loadImage: function(n) {
            var r, i;
            if (n && t[n] === undefined) {
                r = new Image;
                if (n.match(/data:image\/.*;base64,/i)) {
                    r.src = n.replace(/url\(['"]{0,}|['"]{0,}\)$/ig, "");
                    i = t[n] = {
                        img: r
                    };
                    t.numTotal++;
                    S(r, i)
                } else if (p(n) || e.allowTaint === true) {
                    i = t[n] = {
                        img: r
                    };
                    t.numTotal++;
                    S(r, i);
                    r.src = n
                } else if (c && !e.allowTaint && e.useCORS) {
                    r.crossOrigin = "anonymous";
                    i = t[n] = {
                        img: r
                    };
                    t.numTotal++;
                    S(r, i);
                    r.src = n;
                    r.customComplete = function() {
                        if (!this.img.complete) {
                            this.timer = window.setTimeout(this.img.customComplete, 100)
                        } else {
                            this.img.onerror()
                        }
                    }.bind(i);
                    r.customComplete()
                } else if (e.proxy) {
                    i = t[n] = {
                        img: r
                    };
                    t.numTotal++;
                    v(n, r, i)
                }
            }
        },
        cleanupDOM: function(n) {
            var r, i;
            if (!t.cleanupDone) {
                if (n && typeof n === "string") {
                    h2clog("html2canvas: Cleanup because: " + n)
                } else {
                    h2clog("html2canvas: Cleanup after timeout: " + e.timeout + " ms.")
                }
                for (i in t) {
                    if (t.hasOwnProperty(i)) {
                        r = t[i];
                        if (typeof r === "object" && r.callbackname && r.succeeded === undefined) {
                            window[r.callbackname] = undefined;
                            try {
                                delete window[r.callbackname]
                            } catch (s) {}
                            if (r.script && r.script.parentNode) {
                                r.script.setAttribute("src", "about:blank");
                                r.script.parentNode.removeChild(r.script)
                            }
                            t.numLoaded++;
                            t.numFailed++;
                            h2clog("html2canvas: Cleaned up failed img: '" + i + "' Steps: " + t.numLoaded + " / " + t.numTotal)
                        }
                    }
                }
                if (window.stop !== undefined) {
                    window.stop()
                } else if (document.execCommand !== undefined) {
                    document.execCommand("Stop", false)
                }
                if (document.close !== undefined) {
                    document.close()
                }
                t.cleanupDone = true;
                if (!(n && typeof n === "string")) {
                    d()
                }
            }
        },
        renderingDone: function() {
            if (h) {
                window.clearTimeout(h)
            }
        }
    };
    if (e.timeout > 0) {
        h = window.setTimeout(r.cleanupDOM, e.timeout)
    }
    h2clog("html2canvas: Preload starts: finding background-images");
    t.firstRun = true;
    E(o);
    h2clog("html2canvas: Preload: Finding images");
    for (i = 0; i < f; i += 1) {
        r.loadImage(a[i].getAttribute("src"))
    }
    t.firstRun = false;
    h2clog("html2canvas: Preload: Done.");
    if (t.numTotal === t.numLoaded) {
        d()
    }
    return r
};
_html2canvas.Renderer = function(e, t) {
    function n(e) {
        var t = [];
        var n = function(e) {
            var r = [],
                i = [];
            e.children.forEach(function(e) {
                if (e.children && e.children.length > 0) {
                    r.push(e);
                    i.push(e.zindex)
                } else {
                    t.push(e)
                }
            });
            i.sort(function(e, t) {
                return e - t
            });
            i.forEach(function(e) {
                var t;
                r.some(function(n, r) {
                    t = r;
                    return n.zindex === e
                });
                n(r.splice(t, 1)[0])
            })
        };
        n(e.zIndex);
        return t
    }

    function r(e) {
        var n;
        if (typeof t.renderer === "string" && _html2canvas.Renderer[e] !== undefined) {
            n = _html2canvas.Renderer[e](t)
        } else if (typeof e === "function") {
            n = e(t)
        } else {
            throw new Error("Unknown renderer")
        }
        if (typeof n !== "function") {
            throw new Error("Invalid renderer defined")
        }
        return n
    }
    return r(t.renderer)(e, t, document, n(e), _html2canvas)
};
_html2canvas.Util.Support = function(e, t) {
    function n() {
        var e = new Image,
            n = t.createElement("canvas"),
            r = n.getContext === undefined ? false : n.getContext("2d");
        if (r === false) {
            return false
        }
        n.width = n.height = 10;
        e.src = ["data:image/svg+xml,", "<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'>", "<foreignObject width='10' height='10'>", "<div xmlns='http://www.w3.org/1999/xhtml' style='width:10;height:10;'>", "sup", "</div>", "</foreignObject>", "</svg>"].join("");
        try {
            r.drawImage(e, 0, 0);
            n.toDataURL()
        } catch (i) {
            return false
        }
        h2clog("html2canvas: Parse: SVG powered rendering available");
        return true
    }

    function r() {
        var e, n, r, i, s = false;
        if (t.createRange) {
            e = t.createRange();
            if (e.getBoundingClientRect) {
                n = t.createElement("boundtest");
                n.style.height = "123px";
                n.style.display = "block";
                t.body.appendChild(n);
                e.selectNode(n);
                r = e.getBoundingClientRect();
                i = r.height;
                if (i === 123) {
                    s = true
                }
                t.body.removeChild(n)
            }
        }
        return s
    }
    return {
        rangeBounds: r(),
        svgRendering: e.svgRendering && n()
    }
};
window.html2canvas = function(e, t) {
    e = e.length ? e : [e];
    var n, r, i = {
        logging: false,
        elements: e,
        background: "#fff",
        proxy: null,
        timeout: 0,
        useCORS: false,
        allowTaint: false,
        svgRendering: false,
        ignoreElements: "IFRAME|OBJECT|PARAM",
        useOverflow: true,
        letterRendering: false,
        chinese: false,
        width: null,
        height: null,
        taintTest: true,
        renderer: "Canvas"
    };
    i = _html2canvas.Util.Extend(t, i);
    _html2canvas.logging = i.logging;
    i.complete = function(e) {
        if (typeof i.onpreloaded === "function") {
            if (i.onpreloaded(e) === false) {
                return
            }
        }
        n = _html2canvas.Parse(e, i);
        if (typeof i.onparsed === "function") {
            if (i.onparsed(n) === false) {
                return
            }
        }
        r = _html2canvas.Renderer(n, i);
        if (typeof i.onrendered === "function") {
            if (typeof i.grabMouse != "undefined" && !i.grabMouse) {
                i.onrendered(r)
            } else {
                var t = new Image(25, 25);
                t.onload = function() {
                    r.getContext("2d").drawImage(t, coordX, coordY, 25, 25);
                    i.onrendered(r)
                };
                t.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAZCAYAAAAxFw7TAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAzZJREFUSEut1EtME1EUANBiTTFaivRDKbaFFgiILgxx0bQllYItYKFIgEYoC2oEwqeCC4gG1xg2dmEwEQMJujIxwQ24wA2uCFAB3SBBfqWuyqd/CuV634QSPgOFxElu+mZye+a++948BgAw/mccYAwGIyY7O1vR3NzSiuMLX5GiDoO8tLQ0QzAYDLW1tT2/qEgHJslk8rKtLU9odzcMTU3N7RdB6UBhRkZG6fz8QrCuzgJutwfq6xtazovSgunp6SUOhzPI5XJBr9fD9nYojHjDeVA6MJH0EMGARCIBRKC8vJygO2ZzrSUaSgumpqY+cDjWAlJpCgWSMJlMiO6EqqpMtWehtKBUKi1eXV3zI3wAEhQrJJUGseJHp6G0IE61CKfsl8lkR0CCWiyPAXeU32AwVNChdKAAwUIEfXK5/ARI0IaGRkS3vXp9ofE4SguKxWL92tpfH642LUjQ1lYr+P0Bt1abX3wYPQv04n48FSRoe/sz8Pn8G7m5uboISgfyk5OT72OF3szMzBMgk8k88qyjowPW1zddCoVCS1BaUCQSEdCTlZV18GcOh0ONq6trYGbmJ0xMTO3Z7dMwPj4B4XAYXC7XhkqlKqAFBQJBAS6KB08dClEqlTA8/JUak5cEAkHo6nppMxqN7ZWVVZ0GQ0lnRUXlC6VSVXoamI+gm/RQKEyChYU/u5gYUqvVFDo09AVsNttrHMdh3MAQYyRhxNIeX3y+QLu0tLKlVufC5OQU9Pa+/TgwMPCpv7+fAouKigG/pFX81qV4H4PBwrh8Wg95eOUtLi5vLi+v4FSHRzExRafTNZJ7NptNobOzs2C1Wp+eZx/yEhIS8jwer99ut//icOJvk+mwWCzF3NzvebPZTIF4+ILd/mMcx1ei7UOeUCjUjY19n8YvRYPJVzG4GGk9PT3vRkZGKJDH44PT6STTfxgNjGez4+4idg8Tr+8nx+KvNCcnx4y926mpMUNf33vY2wPo7n71JhpImszer4x5KFmE4zujo98m3W6ve3Dww2eNRvMEW3GLrG4kj26Vj/c5ch+Pg5t4ApXhopFWSDASMcjzg+siIKmWVJm839Nr+Hvp+Nsj4D+5Hdf43ZzjNQAAAABJRU5ErkJggg=="
            }
        }
    };
    window.setTimeout(function() {
        _html2canvas.Preload(i)
    }, 0);
    return {
        render: function(e, t) {
            return _html2canvas.Renderer(e, _html2canvas.Util.Extend(t, i))
        },
        parse: function(e, t) {
            return _html2canvas.Parse(e, _html2canvas.Util.Extend(t, i))
        },
        preload: function(e) {
            return _html2canvas.Preload(_html2canvas.Util.Extend(e, i))
        },
        log: h2clog
    }
};
window.html2canvas.log = h2clog;
window.html2canvas.Renderer = {
    Canvas: undefined
};
_html2canvas.Renderer.Canvas = function(e) {
    function o(e, t) {
        e.beginPath();
        t.forEach(function(t) {
            e[t.name].apply(e, t["arguments"])
        });
        e.closePath()
    }

    function u(e) {
        if (n.indexOf(e["arguments"][0].src) === -1) {
            i.drawImage(e["arguments"][0], 0, 0);
            try {
                i.getImageData(0, 0, 1, 1)
            } catch (s) {
                r = t.createElement("canvas");
                i = r.getContext("2d");
                return false
            }
            n.push(e["arguments"][0].src)
        }
        return true
    }

    function a(e) {
        return e === "transparent" || e === "rgba(0, 0, 0, 0)"
    }

    function f(t, n) {
        switch (n.type) {
            case "variable":
                t[n.name] = n["arguments"];
                break;
            case "function":
                if (n.name === "createPattern") {
                    if (n["arguments"][0].width > 0 && n["arguments"][0].height > 0) {
                        try {
                            t.fillStyle = t.createPattern(n["arguments"][0], "repeat")
                        } catch (r) {
                            h2clog("html2canvas: Renderer: Error creating pattern", r.message)
                        }
                    }
                } else if (n.name === "drawShape") {
                    o(t, n["arguments"])
                } else if (n.name === "drawImage") {
                    if (n["arguments"][8] > 0 && n["arguments"][7] > 0) {
                        if (!e.taintTest || e.taintTest && u(n)) {
                            t.drawImage.apply(t, n["arguments"])
                        }
                    }
                } else {
                    t[n.name].apply(t, n["arguments"])
                }
                break
        }
    }
    e = e || {};
    var t = document,
        n = [],
        r = document.createElement("canvas"),
        i = r.getContext("2d"),
        s = e.canvas || t.createElement("canvas");
    return function(e, t, n, r, i) {
        var o = s.getContext("2d"),
            u, l, c, h, p, d;
        s.width = s.style.width = t.width || e.ctx.width;
        s.height = s.style.height = t.height || e.ctx.height;
        d = o.fillStyle;
        o.fillStyle = a(e.backgroundColor) && t.background !== undefined ? t.background : e.backgroundColor;
        o.fillRect(0, 0, s.width, s.height);
        o.fillStyle = d;
        if (t.svgRendering && e.svgRender !== undefined) {
            o.drawImage(e.svgRender, 0, 0)
        } else {
            for (l = 0, c = r.length; l < c; l += 1) {
                u = r.splice(0, 1)[0];
                u.canvasPosition = u.canvasPosition || {};
                o.textBaseline = "bottom";
                if (u.clip) {
                    o.save();
                    o.beginPath();
                    o.rect(u.clip.left, u.clip.top, u.clip.width, u.clip.height);
                    o.clip()
                }
                if (u.ctx.storage) {
                    u.ctx.storage.forEach(f.bind(null, o))
                }
                if (u.clip) {
                    o.restore()
                }
            }
        }
        h2clog("html2canvas: Renderer: Canvas renderer done - returning canvas obj");
        c = t.elements.length;
        if (c === 1) {
            if (typeof t.elements[0] === "object" && t.elements[0].nodeName !== "BODY") {
                p = i.Util.Bounds(t.elements[0]);
                h = n.createElement("canvas");
                h.width = p.width;
                h.height = p.height;
                o = h.getContext("2d");
                o.drawImage(s, p.left, p.top, p.width, p.height, 0, 0, p.width, p.height);
                s = null;
                return h
            }
        }
        return s
    }
};
(function() {
    var e = 0,
        t = ["ms", "moz", "webkit", "o"];
    for (var n = 0; n < t.length && !window.requestAnimationFrame; ++n) {
        window.requestAnimationFrame = window[t[n] + "RequestAnimationFrame"];
        window.cancelAnimationFrame = window[t[n] + "CancelAnimationFrame"] || window[t[n] + "RequestCancelAnimationFrame"]
    }
    if (!window.requestAnimationFrame) window.requestAnimationFrame = function(t, n) {
        var r = (new Date).getTime();
        var i = Math.max(0, 16 - (r - e));
        var s = window.setTimeout(function() {
            t(r + i)
        }, i);
        e = r + i;
        return s
    };
    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(e) {
        clearTimeout(e)
    }
})();
var IE = document.all ? true : false;
if (!IE) document.captureEvents(Event.MOUSEMOVE);
document.addEventListener("mousemove", getMouseXY, false);
var coordX = 0;
var coordY = 0
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */function createSnapshotButton(controlBarName , peerinfo){
    var snapshotButton=document.createElement("div");
    snapshotButton.id=controlBarName+"snapshotButton";
    snapshotButton.setAttribute("title", "Snapshot");
    snapshotButton.setAttribute("data-placement", "bottom");
    snapshotButton.setAttribute("data-toggle", "tooltip");
    snapshotButton.setAttribute("data-container", "body");
    snapshotButton.className=snapshotobj.button.class_on;
    snapshotButton.innerHTML=snapshotobj.button.html_on;
    snapshotButton.onclick = function() {
        /*rtcMultiConnection.streams[streamid].takeSnapshot(function(datasnapshot) {*/
        /*
        for(i in webcallpeers ){
            if(webcallpeers[i].userid==rtcMultiConnection.userid){
            }
        }*/

        takeSnapshot(peerinfo, function(datasnapshot) {    
            var snapshotname = "snapshot"+ new Date().getTime();
        
            var peerinfo;
            if(selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);

            peerinfo.filearray.push(snapshotname);
            var numFile= document.createElement("div");
            numFile.value= peerinfo.filearray.length;

            if(fileshareobj.active){
                syncSnapshot(datasnapshot , "imagesnapshot" , snapshotname );
                displayList(peerinfo.uuid , peerinfo , datasnapshot , snapshotname, "imagesnapshot");
                displayFile(peerinfo.uuid , peerinfo , datasnapshot , snapshotname, "imagesnapshot");
            }else{
                displayFile(peerinfo.uuid , peerinfo , datasnapshot , snapshotname, "imagesnapshot");
            } 
        });         
    };
    return snapshotButton;
}

/* *************************************
Snapshot
************************************************/
function takeSnapshot(peerinfo , callback) {
    try{

        function _takeSnapshot(video) {

            if(video){
                var canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || video.clientWidth;
                canvas.height = video.videoHeight || video.clientHeight;

                var context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                /*
                connection.snapshots[userid] = canvas.toDataURL('image/png');
                args.callback && args.callback(connection.snapshots[userid]);*/
            
                callback(canvas.toDataURL('image/png'));
            }else{
                callback("");
            }

        }

        if (peerinfo.videoContainer) return _takeSnapshot(document.getElementById(peerinfo.videoContainer));
        else return "empty";
    }catch(e){
        webrtcdev.error(" [Snapshot - take snapshot] " , e);
    }
    /*
    var userid = args.userid;
    var connection = args.connection;*/

    /*
    for (var stream in connection.streams) {
        stream = connection.streams[stream];
        if (stream.userid == userid && stream.stream && stream.stream.getVideoTracks && stream.stream.getVideoTracks().length) {
            _takeSnapshot(stream.mediaElement);
            continue;
        }
    }*/
}
    
function syncSnapshot(datasnapshot , datatype , dataname ){
    rtcConn.send({
        type:datatype, 
        message:datasnapshot, 
        name : dataname
    });
}

/*function displaySnapshot(snapshotViewer , datasnapshot){
    var snaspshot=document.createElement("img");
    snaspshot.src = datasnapshot;
    document.getElementById(snapshotViewer).appendChild(snaspshot);
    webrtcdev.log("snaspshot ",datasnapshot);
}*/

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//* ***********************************************
geolocation
*********************************************/

if (navigator.geolocation) {
    /*webrtcdev.log(navigator);*/
    operatingsystem= navigator.platform;
    navigator.geolocation.getCurrentPosition(showPosition, showError);
} else {
    x.innerHTML = "Geolocation is not supported by this browser.";
}

/**
 * shows position from lat and long 
 * @method
 * @name showPosition
 * @param {object} position
 */
function showPosition(position) {
    webrtcdev.log("Latitude: " + position.coords.latitude +
    "<br>Longitude: " + position.coords.longitude);
    latitude=position.coords.latitude;
    longitude=position.coords.longitude;
    /*return position;*/
}

/**
 * This method handles erro in position data
 * @method
 * @name showError
 * @param {object} error
 */
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            shownotification("User denied the request for Geolocation.")
            break;
        case error.POSITION_UNAVAILABLE:
            shownotification("Location information is unavailable.")
            break;
        case error.TIMEOUT:
            shownotification("The request to get user location timed out.")
            break;
        case error.UNKNOWN_ERROR:
            shownotification("An unknown error occurred.")
            break;
    }
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//********************************************************************************8
        Chat
**************************************************************************************/
function createChatButton(obj){
    var button= document.createElement("span");
    button.className= chatobj.button.class_on;
    button.innerHTML= chatobj.button.html_on;
    button.onclick = function() {
        if(button.className==chatobj.button.class_off){
            document.getElementById(chatobj.container.id).hidden=true;
            button.className=chatobj.button.class_on;
            button.innerHTML= chatobj.button.html_on;
        }else if(button.className==chatobj.button.class_on){
            document.getElementById(chatobj.container.id).hidden=false;
            button.className=chatobj.button.class_off;
            button.innerHTML= chatobj.button.html_off;
        }
    };

    var li =document.createElement("li");
    li.appendChild(button);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/*function assignChatButton(chatobj){
    var button= document.getElementById(chatobj.button.id);
    button.onclick = function() {
        if(button.className==chatobj.button.class_off){
            document.getElementById(chatobj.chatContainer).hidden=true;
            button.className=chatobj.button.class_on;
            button.innerHTML= chatobj.button.html_on;
        }else if(button.className==chatobj.button.class_on){
            document.getElementById(chatobj.chatContainer).hidden=false;
            button.className=chatobj.button.class_off;
            button.innerHTML= chatobj.button.html_off;
        }
    };
}*/

function createChatBox(obj){

    var mainInputBox=document.createElement("div");

    var chatInput= document.createElement("input");
    chatInput.setAttribute("type", "text");
    chatInput.className= "form-control chatInputClass";
    chatInput.id="chatInput";
    chatInput.onkeypress=function(e){
        if (e.keyCode == 13) {
            sendChatMessage(chatInput.value);
            chatInput.value = "";
        }
    };

    var chatButton= document.createElement("span");
    chatButton.className= "btn btn-primary";
    chatButton.innerHTML= "Enter";
    chatButton.onclick=function(){
        var chatInput=document.getElementById("chatInput");
        sendChatMessage(chatInput.value);
        chatInput.value = "";
    }
    
    var whoTyping= document.createElement("div");
    whoTyping.className= "whoTypingClass";
    whoTyping.id="whoTyping";

    mainInputBox.appendChild(chatInput);
    mainInputBox.appendChild(chatButton);
    mainInputBox.appendChild(whoTyping);
    document.getElementById(chatobj.container.id).appendChild(mainInputBox);

    var chatBoard=document.createElement("div");
    chatBoard.className="chatMessagesClass";
    chatBoard.setAttribute("contenteditable",true);
    chatBoard.id=chatobj.chatBox.id;
    document.getElementById(chatobj.container.id).appendChild(chatBoard);
}

function assignChatBox(obj){

    var chatInput = document.getElementById(chatobj.inputBox.text_id);
    chatInput.onkeypress=function(e){
        if (e.keyCode == 13) {
            var peerinfo = findPeerInfo( selfuserid );
            webrtcdev.log(" chat " , selfuserid , peerinfo);
            sendChatMessage(chatInput.value , peerinfo);
            chatInput.value = "";
        }
    };

    if(document.getElementById(chatobj.inputBox.sendbutton_id)){
        var chatButton= document.getElementById(chatobj.inputBox.sendbutton_id);
        chatButton.onclick=function(e){

            var peerinfo = findPeerInfo( selfuserid );
            var chatInput=document.getElementById(chatobj.inputBox.text_id);
            sendChatMessage(chatInput.value , peerinfo);
            chatInput.value = "";
        }  
    }

    if(document.getElementById(chatobj.inputBox.minbutton_id)){
        var button= document.getElementById(chatobj.inputBox.minbutton_id);
        button.onclick=function(e){
            if(document.getElementById(chatobj.container.id).hidden)
                document.getElementById(chatobj.container.id).hidden=false;
            else
                document.getElementById(chatobj.container.id).hidden=true;
        }  
    }
}

function updateWhotyping(data){
    document.getElementById("whoTyping").innerHTML=data;
}

function sendChatMessage(msg,  peerinfo){
    /*var userinfo;*/
    /*try{
        userinfo = getUserinfo(rtcConn.blobURLs[rtcConn.userid], "chat-message.png");
    }catch(e){
        userinfo = "empty";
    }*/
    addNewMessagelocal({
        header: rtcConn.extra.username,
        message: msg,
        userinfo: peerinfo,
        color: rtcConn.extra.color
    });

    rtcConn.send({
        type:"chat", 
        userinfo: peerinfo,
        message: msg 
    });
}


function replaceURLWithHTMLLinks(text) {
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(exp,"<a href='$1'>$1</a>"); 
}

function addNewMessagelocal(e ) {
    if ("" != e.message && " " != e.message) {
        addMessageSnapshotFormat("user-activity user-activity-right localMessageClass" , e.userinfo , e.message , chatobj.chatBox.id);
    }
}

function addNewMessage(e) {
    if ("" != e.message && " " != e.message) {
        addMessageSnapshotFormat("user-activity user-activity-right remoteMessageClass" , e.userinfo , e.message , chatobj.chatBox.id);
    }
}

function addMessageSnapshotFormat(messageDivclass, userinfo , message , parent){
    var n = document.createElement("div");
    n.className = messageDivclass; 
    webrtcdev.log("addNewMessagelocal" , userinfo);

      takeSnapshot(userinfo, function(datasnapshot) {    
            var image= document.createElement("img");
            image.src= datasnapshot;
            image.style.height="40px";

            var t = document.createElement("span");
            t.innerHTML =  replaceURLWithHTMLLinks(message);

            n.appendChild(image) ;
            n.appendChild(t);
            //n.innerHTML = image +" : "+ replaceURLWithHTMLLinks(message);
               // displayFile(peerinfo.uuid , peerinfo, datasnapshot , snapshotname, "imagesnapshot");

        });       

    document.getElementById(parent).insertBefore(n, document.getElementById(parent).firstChild);
}

function addMessageLineformat(messageDivclass, messageheader , message , parent){
    var n = document.createElement("div");
    n.className = messageDivclass; 
    if(messageheader){
        n.innerHTML = messageheader +" : "+ replaceURLWithHTMLLinks(message);
    }else{
        n.innerHTML = replaceURLWithHTMLLinks(message);
    }
    
    document.getElementById(parent).insertBefore(n, document.getElementById(parent).firstChild);
}

function addMessageBlockFormat(messageheaderDivclass , messageheader ,messageDivclass, message , parent){
    
    var t = document.createElement("div");
    t.className = messageheaderDivclass, 
    t.innerHTML = '<div class="chatusername">' + messageheader + "</div>";

    var n = document.createElement("div");
    n.className = messageDivclass,
    n.innerHTML= message,

    t.appendChild(n),  
    $("#"+parent).append(n);
    /* $("#all-messages").scrollTop($("#all-messages")[0].scrollHeight) */
}

/*$("#chatInput").keypress(function(e) {
    if (e.keyCode == 13) {
        sendChatMessage();
    }
})*/

/*$('#send').click( function() {
    sendChatMessage();
    return false; 
});*/

//$('#chatbox').height($( "#leftVideo" ).height());
$('#chatbox').css('max-height', $( "#leftVideo" ).height()+ 80);
$('#chatBoard').css('max-height', $( "#leftVideo" ).height());
$("#chatBoard").css("overflow-y" , "scroll");
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//***************************************************
video handling 
*********************************************************/

function appendVideo(e, style) {
    createVideoContainer(e, style, function(div) {
        var video = document.createElement('video');
        video.className = style;
        video.setAttribute('style', 'height:auto;opacity:1;');
        video.controls=false;
        video.id = e.userid;
        video.src = URL.createObjectURL(e.stream);
        viden.hidden=false;
        var remote = document.getElementById('remote');
        div.appendChild(video);
        video.play();
    });
}

function createVideoContainer(e, style, callback) {
    var div = document.createElement('div');
    div.setAttribute('style', style || 'float:left;opacity: 1;width: 32%;');
    remote.insertBefore(div, remote.firstChild);
    if (callback) callback(div);
}

/************************************
       User Detail attchmenet to Video Element
*******************************************/
function attachUserDetails(vid , peerinfo){
    var nameBox=document.createElement("div");
    nameBox.setAttribute("style","background-color:"+ peerinfo.color);
    nameBox.className = "videoHeaderClass";
    nameBox.innerHTML = peerinfo.name+"<br/>";
    // vid.parentNode.appendChild(nameBox); 
    vid.parentNode.insertBefore(nameBox, vid.parentNode.firstChild);
}

function attachMetaUserDetails(vid , peerinfo){
    webrtcdev.log(peerinfo.userid+ ":" + peerinfo.type);
    var detailsbox = document.createElement("span");
    detailsbox.setAttribute("style","background-color:"+ peerinfo.color);
    detailsbox.innerHTML = peerinfo.userid+ ":" + peerinfo.type+"<br/>";
    vid.parentNode.insertBefore(detailsbox, vid.parentNode.firstChild);
}

function attachControlButtons( vid ,  peerinfo){

    var stream = peerinfo.stream;
    var streamid = peerinfo.streamid;
    var controlBarName =  peerinfo.controlBarName;
    var snapshotViewer =  peerinfo.fileSharingContainer ;

    //Preventing multple control bars 
    var c = vid.parentNode.childNodes;
    for (i = 0; i < c.length; i++) {
        webrtcdev.log("ChildNode of video Parent " , c[i]);
        if(c[i].nodeName=="DIV" && c[i].id!=undefined){
            if( c[i].id.indexOf("control")>-1 ){
                webrtcdev.log("control bar exists already  , delete the previous one before adding new one");
                vid.parentNode.removeChild(c[i]);
            }
        }
    }

    // Conyrol bar holds media control elements like , mute unmute , fillscreen ,. recird , snapshot
    var controlBar= document.createElement("div");
    controlBar.id = controlBarName;

    if(peerinfo.type=="local")
        controlBar.className= "localVideoControlBarClass";
    else
        controlBar.className= "remoteVideoControlBarClass";

    if(muteobj.active){
        if(muteobj.audio.active){
            controlBar.appendChild(createAudioMuteButton(controlBarName , peerinfo));
        }
        if(muteobj.video.active){
            controlBar.appendChild(createVideoMuteButton(controlBarName , peerinfo));        
        }
    }
    
    if(snapshotobj.active){
        controlBar.appendChild(createSnapshotButton(controlBarName , peerinfo));
    }

    if(videoRecordobj.active){
        controlBar.appendChild(createRecordButton(controlBarName, peerinfo, streamid, stream ));
    }

    if(cursorobj.active){
        //assignButtonCursor(cursorobj.button.id);
        controlBar.appendChild(createCursorButton(controlBarName, peerinfo ));
    }

    if(minmaxobj.active){
        controlBar.appendChild(createFullScreenButton(controlBarName, peerinfo, streamid, stream ));
        controlBar.appendChild(createMinimizeVideoButton(controlBarName, peerinfo, streamid, stream ));
    }

    if(debug){
        var nameBox=document.createElement("span");
        nameBox.innerHTML=vid.id;
        controlBar.appendChild(nameBox);  
    }

    vid.parentNode.appendChild(controlBar);        
}

/************************************
        control Buttons attchmenet to Video Element
*******************************************/
function createFullScreenButton(controlBarName, peerinfo, streamid, stream ){
    var button = document.createElement("span");
    button.id = controlBarName+"fullscreeButton";
    button.className = minmaxobj.max.button.class_off;
    button.innerHTML = minmaxobj.max.button.html_off;
    button.onclick = function() {
        if(button.className == minmaxobj.max.button.class_off){
            var vid = document.getElementById(peerinfo.videoContainer);
            vid.webkitRequestFullScreen();
            button.className=minmaxobj.max.button.class_on;
            button.innerHTML=minmaxobj.max.button.html_on;
        } 
        else{            
            button.className=minmaxobj.max.button.class_off;
            button.innerHTML=minmaxobj.max.button.html_off;
        }     
        //syncButton(audioButton.id);        
    };
    return button;
}


function createMinimizeVideoButton(controlBarName, peerinfo, streamid, stream){
    var button = document.createElement("span");
    button.id = controlBarName+"minmizevideoButton";
    button.className = minmaxobj.min.button.class_off;
    button.innerHTML = minmaxobj.min.button.html_off;
    var vid=document.getElementById(peerinfo.videoContainer);
    button.onclick = function() {
        if(button.className == minmaxobj.min.button.class_off){
            vid.hidden = true;
            button.className=minmaxobj.min.button.class_on;
            button.innerHTML=minmaxobj.min.button.html_on;
        } 
        else{ 
            vid.hidden = false;           
            button.className=minmaxobj.min.button.class_off;
            button.innerHTML=minmaxobj.min.button.html_off;
        }     
        //syncButton(audioButton.id);        
    };
    return button;
}


function createAudioMuteButton(controlBarName , peerinfo){
    var audioButton=document.createElement("span");
    audioButton.id=controlBarName+"audioButton";
    audioButton.setAttribute("data-val","mute");
    audioButton.setAttribute("title", "Toggle Audio");
    audioButton.setAttribute("data-placement", "bottom");
    audioButton.setAttribute("data-toggle", "tooltip");
    audioButton.setAttribute("data-container", "body");
    audioButton.className=muteobj.audio.button.class_on;
    audioButton.innerHTML=muteobj.audio.button.html_on;
    audioButton.onclick = function() {
        if(audioButton.className == muteobj.audio.button.class_on ){
            peerinfo.stream.mute({
                audio: !0
            });
            audioButton.className=muteobj.audio.button.class_off;
            audioButton.innerHTML=muteobj.audio.button.html_off;
        } 
        else{            
            peerinfo.stream.unmute({
                audio: !0
            });
            audioButton.className=muteobj.audio.button.class_on;
            audioButton.innerHTML=muteobj.audio.button.html_on;
        }     
        syncButton(audioButton.id);        
    };
    return audioButton;
}

function createVideoMuteButton(controlBarName , peerinfo){
    var videoButton=document.createElement("span");
    videoButton.id=controlBarName+"videoButton";
    videoButton.setAttribute("title", "Toggle Video");
    videoButton.setAttribute("data-container", "body");
    videoButton.className=muteobj.video.button.class_on;   
    videoButton.innerHTML=muteobj.video.button.html_on;     
    videoButton.onclick= function(event) {
        if(videoButton.className == muteobj.video.button.class_on ){
            peerinfo.stream.mute({
                video: !0
            });
            videoButton.innerHTML=muteobj.video.button.html_off;
            videoButton.className=muteobj.video.button.class_off;   
        } 
        else{ 
            peerinfo.stream.unmute({
                video: !0
            });
            videoButton.innerHTML=muteobj.video.button.html_on;
            videoButton.className=muteobj.video.button.class_on; 
        }  
        syncButton(videoButton.id);
    }; 
    return videoButton;
}


function waitForRemoteVideo(_remoteStream , _remoteVideo , _localVideo  , _miniVideo ) {
    var videoTracks = _remoteStream.getVideoTracks();

    if(statistics.active){
        getStats(videoTracks , function(result) {
            document.getElementById("network-stats-body").innerHTML= result;        
        } , 2000);
    }
    
    if (videoTracks.length === 0 || _remoteVideo.currentTime > 0) {
        transitionToActive(_remoteVideo ,_localVideo ,  _miniVideo);
    } else {
        setTimeout(function(){
            waitForRemoteVideo(_remoteStream , _remoteVideo , _localVideo  , _miniVideo )
        }, 100);
    }
}

function transitionToActive(_remoteVideo ,_localVideo ,  _miniVideo) {
    _remoteVideo.style.opacity = 1;
    if(localVideo!=null){
        setTimeout(function() {
            _localVideo.src = '';
        }, 500); 
    }
    if(miniVideo!=null){
        setTimeout(function() {
            _miniVideo.style.opacity = 1;
        }, 1000); 
    }
}

function transitionToWaiting() {
    card.style.webkitTransform = 'rotateY(0deg)';
    setTimeout(function() {
        localVideo.src = miniVideo.src;
        localVideo.muted = true;
        miniVideo.src = '';
        remoteVideo.src = '';
        localVideo.style.opacity = 1;
    }, 500);
    miniVideo.style.opacity = 0;
    remoteVideo.style.opacity = 0;
}

function attachMediaStream(element, stream) {
    try{
        webrtcdev.log("[ Mediacontrol - attachMediaStream ] element.src", typeof element.src ,typeof element.srcObject , " || stream " + stream );
        
        if(stream){
            if (typeof element.src == 'string') {
                element.src = URL.createObjectURL(stream);
            }else if (typeof element.srcObject == 'object') {
                element.srcObject = stream;
            }else{
                webrtcdev.log('Error attaching stream to element.' , element , stream);
            }

            if(element.hidden){
                webrtcdev.log('Video Element was hidden making it appear');
                element.hidden=false;
            }
            element.play();

            webrtcdev.log(" Media Stream attached to " , element , " succesfuly");
        }else{
            element.src = "";
        }

    }catch(e){
        webrtcdev.error(" [ Mediacontrol - attachMediaStream ]  error" , e);
    }

}

function reattachMediaStream(to, from) {
    to.src = from.src;
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//* ***********************************************
Record
*********************************************/

function createRecordButton(controlBarName, peerinfo, streamid, stream){
    var recordButton=document.createElement("div");
    recordButton.id=controlBarName+"recordButton";
    recordButton.setAttribute("title", "Record");
    recordButton.setAttribute("data-placement", "bottom");
    recordButton.setAttribute("data-toggle", "tooltip");
    recordButton.setAttribute("data-container", "body");
    recordButton.className=videoRecordobj.button.class_off;
    recordButton.innerHTML=videoRecordobj.button.html_off;
    recordButton.onclick = function(e) {
        if(recordButton.className==videoRecordobj.button.class_on){
            recordButton.className=videoRecordobj.button.class_off;
            recordButton.innerHTML=videoRecordobj.button.html_off;
            stopRecord(peerinfo, streamid, stream);
        }else if(recordButton.className==videoRecordobj.button.class_off){
            recordButton.className=videoRecordobj.button.class_on;
            recordButton.innerHTML=videoRecordobj.button.html_on;
            startRecord(peerinfo, streamid, stream);
        }
    };  

    return recordButton;
}


var listOfRecorders = {};

function startRecord(peerinfo , streamid, stream){
    var recorder = RecordRTC(stream, {
        type: 'video'  , 
        recorderType: MediaStreamRecorder,
    });
    recorder.startRecording();
    listOfRecorders[streamid] = recorder;
}

function stopRecord(peerinfo , streamid , stream){
    /*var streamid = prompt('Enter stream-id');*/

    if(!listOfRecorders[streamid]) {
        /*throw 'Wrong stream-id';*/
        webrtcdev.log("wrong stream id ");
    }
    var recorder = listOfRecorders[streamid];
    recorder.stopRecording(function() {
        var blob = recorder.getBlob();
        if(!peerinfo){
            if(selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);
        }

        /*        
        window.open( URL.createObjectURL(blob) );
        // or upload to server
        var formData = new FormData();
        formData.append('file', blob);
        $.post('/server-address', formData, serverCallback);*/
    
        var recordVideoname = "recordedvideo"+ new Date().getTime();
        peerinfo.filearray.push(recordVideoname);
        var numFile= document.createElement("div");
        numFile.value= peerinfo.filearray.length;
        var fileurl=URL.createObjectURL(blob);

        displayList(peerinfo.uuid , peerinfo  ,fileurl , recordVideoname , "videoRecording");
        displayFile(peerinfo.uuid , peerinfo , fileurl , recordVideoname , "videoRecording");
    });
}


function stopSessionRecord(peerinfo , scrrecordStreamid, scrrecordStream , scrrecordAudioStreamid, scrrecordAudioStream){
    /*var streamid = prompt('Enter stream-id');*/

    if(!listOfRecorders[scrrecordStreamid]) {
        /*throw 'Wrong stream-id';*/
        webrtcdev.log("wrong stream id scrrecordStreamid");
    }

    if(!listOfRecorders[scrrecordAudioStreamid]) {
        /*throw 'Wrong stream-id';*/
        webrtcdev.log("wrong stream id scrrecordAudioStreamid");
    }

    var recorder = listOfRecorders[scrrecordStreamid];
    recorder.stopRecording(function() {
        var blob = recorder.getBlob();
        webrtcdev.log(" scrrecordStreamid stopped recoridng blob is " , blob);
    });

    var recorder2 = listOfRecorders[scrrecordAudioStreamid];
    recorder2.stopRecording(function() {
        var blob = recorder2.getBlob();
        webrtcdev.log(" scrrecordStreamid stopped recoridng blob is " , blob);
    });

}

/*function startRecord(){
    rtcMultiConnection.streams[streamid].startRecording({
        audio: true,
        video: true
    });
}

function stopRecord(){
    rtcMultiConnection.streams[streamid].stopRecording(function (dataRecordedVideo) {
        for(i in webcallpeers ){
            if(webcallpeers[i].userid==rtcMultiConnection.userid){
                var recordVideoname = "recordedvideo"+ new Date().getTime();
                webcallpeers[i].filearray.push(recordVideoname);
                var numFile= document.createElement("div");
                numFile.value= webcallpeers[i].filearray.length;
                var fileurl=URL.createObjectURL(dataRecordedVideo.video);
                if(fileshareobj.active){
                    syncSnapshot(fileurl , "videoRecording" , recordVideoname );
                    displayList(rtcMultiConnection.uuid , rtcMultiConnection.userid  ,fileurl , recordVideoname , "videoRecording");
                    displayFile(rtcMultiConnection.uuid , rtcMultiConnection.userid , fileurl , recordVideoname , "videoRecording");
                }else{
                    displayFile(rtcMultiConnection.uuid , rtcMultiConnection.userid , fileurl , recordVideoname , "videoRecording");
                }
            }
        }
    }, {audio:true, video:true} );
}*/

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */
/************************************************************************
Canvas Record 
*************************************************************************/
var scrrecordStream = null , scrrecordStreamid = null;
var scrrecordAudioStream = null , scrrecordAudioStreamid = null;

function syncVideoScreenRecording(data , datatype , dataname ){
    rtcMultiConnection.send({type:datatype, message:data  , name : dataname});
}

function autorecordScreenVideo(){

}


function assignScreenRecordButton(){

    var recordButton = document.getElementById(screenrecordobj.button.id);

    recordButton.onclick = function() {
        if(recordButton.className==screenrecordobj.button.class_off){

            recordButton.className= screenrecordobj.button.class_on ;
            recordButton.innerHTML= screenrecordobj.button.html_on;
            webrtcdevRecordScreen();

        }else if(recordButton.className==screenrecordobj.button.class_on){

            var peerinfo;
            if(selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);

            recordButton.className= screenrecordobj.button.class_off ;
            recordButton.innerHTML= screenrecordobj.button.html_off;
            webrtcdevStopRecordScreen();

            stopRecord(peerinfo , scrrecordStreamid, scrrecordStream , scrrecordAudioStreamid, scrrecordAudioStream);
            
            var scrrecordStreamBlob;
            var scrrecordAudioStreamBlob;

            var recorder1 = listOfRecorders[scrrecordStreamid];
            recorder1.stopRecording(function() {
                scrrecordStreamBlob = recorder1.getBlob();
            });

            var recorder2 = listOfRecorders[scrrecordAudioStreamid];
            recorder2.stopRecording(function() {
                scrrecordAudioStreamBlob = recorder2.getBlob();
            });

            
            setTimeout(function(){ 

                webrtcdev.log(" ===2 blobs====", scrrecordStreamBlob , scrrecordAudioStreamBlob); 
                mergeStreams(scrrecordStreamBlob , scrrecordAudioStreamBlob);
                //convertStreams(scrrecordStreamBlob , scrrecordAudioStreamBlob);
                
                scrrecordStreamid = null;
                scrrecordStream = null ;

                scrrecordAudioStreamid = null;
                scrrecordAudioStream = null ;

             }, 5000);

        }
    };
}

/*function assignScreenRecordButton(){

    var recordButton = document.getElementById(screenrecordobj.button.id);
    webrtcdev.log(" -------recordButton---------" , recordButton);
    recordButton.onclick = function() {
        if(recordButton.className==screenrecordobj.button.class_off){
            alert(" start recording screen + audio ");

            var elementToShare = document.getElementById("parentDiv");

            var canvas2d = document.createElement('canvas');
            canvas2d.setAttribute("style","z-index:-1");
            canvas2d.id="screenrecordCanvas";

            var context = canvas2d.getContext('2d');

            canvas2d.width = elementToShare.clientWidth;
            canvas2d.height = elementToShare.clientHeight;

            canvas2d.style.top = 0;
            canvas2d.style.left = 0;

            (document.body || document.documentElement).appendChild(canvas2d);

            var isRecordingStarted = false;
            var isStoppedRecording = false;

            (function looper() {
                if(!isRecordingStarted) {
                    return setTimeout(looper, 500);
                }

                html2canvas(elementToShare, {
                    grabMouse: true,
                    onrendered: function(canvas) {
                        context.clearRect(0, 0, canvas2d.width, canvas2d.height);
                        context.drawImage(canvas, 0, 0, canvas2d.width, canvas2d.height);

                        if(isStoppedRecording) {
                            return;
                        }

                        setTimeout(looper, 1);
                    }
                });
            })();

            recorder = RecordRTC(canvas2d, {
                type: 'canvas'
            });

            recordButton.className= screenrecordobj.button.class_on ;
            recordButton.innerHTML= screenrecordobj.button.html_on;
            
            recorder.startRecording();
        
            isStoppedRecording = false;
            isRecordingStarted = true;

        }else if(recordButton.className==screenrecordobj.button.class_on){
            alert(" stoppped recording screen + audio ");

            var elem = document.getElementById("screenrecordCanvas");
            elem.parentNode.removeChild(elem);

            recordButton.className= screenrecordobj.button.class_off ;
            recordButton.innerHTML= screenrecordobj.button.html_off;
            
            isStoppedRecoridng = true;

            recorder.stopRecording(function() {
                var blob = recorder.getBlob();
                var videoURL=URL.createObjectURL(blob);
                var uuid= guid();
                var recordVideoname= "screenrecorded"+ Math.floor(new Date() / 1000);
                var peerinfo=findPeerInfo( selfuserid);
                displayList(uuid , peerinfo , videoURL, recordVideoname , "videoScreenRecording");
                displayFile(uuid , peerinfo , videoURL, recordVideoname , "videoScreenRecording");
            });
  
        }
    };
}*/

/*function createScreenRecordButton(){

    var recordButton= document.createElement("span");
    recordButton.className= screenrecordobj.button.class_off ;
    recordButton.innerHTML= screenrecordobj.button.html_off;
    recordButton.onclick = function() {
        if(recordButton.className==screenrecordobj.button.class_off){

            var element = document.body;  
            recorder = RecordRTC(element, {
                type: 'canvas',
                showMousePointer: true
            });

            var canvas2d = document.createElement('canvas');
            canvas2d.id="screenrecordCanvas";
            canvas2d.setAttribute("style","z-index:-1");
            var context = canvas2d.getContext('2d');

            canvas2d.style.top = 0;
            canvas2d.style.left = 0;

            (document.body || document.documentElement).appendChild(canvas2d);

            var isRecordingStarted = false;
            var isStoppedRecording = false;

            (function looper() {
                if(!isRecordingStarted) {
                    return setTimeout(looper, 500);
                }

                html2canvas(elementToShare, {
                    grabMouse: true,
                    onrendered: function(canvas) {
                        context.clearRect(0, 0, canvas2d.width, canvas2d.height);
                        context.drawImage(canvas, 0, 0, canvas2d.width, canvas2d.height);

                        if(isStoppedRecording) {
                            return;
                        }

                        setTimeout(looper, 1);
                    }
                });
            })();

            recorder = RecordRTC(canvas2d, {
                type: 'canvas'
            });

            recordButton.className= screenrecordobj.button.class_on ;
            recordButton.innerHTML= screenrecordobj.button.html_on;
            recorder.startRecording();

            isStoppedRecording = false;
            isRecordingStarted = true;

            setTimeout(function() {
                recordButton.disabled = false;
            }, 500);

        }else if(recordButton.className==screenrecordobj.button.class_on){
            recordButton.className= screenrecordobj.button.class_off ;
            recordButton.innerHTML= screenrecordobj.button.html_off;
            
            isStoppedRecoridng = true;

            recorder.stopRecording(function() {
                var elem = document.getElementById("screenrecordCanvas");
                elem.parentNode.removeChild(elem);

                var blob = recorder.getBlob();
                var video = document.createElement('video');
                video.src = URL.createObjectURL(blob);
                video.setAttribute('style', 'height: 100%; position: absolute; top:0;');
                document.body.appendChild(video);
                video.controls = true;
                video.play();
            });
  
        }
    };

    //webrtcUtils.enableLogs = false;

    var li =document.createElement("li");
    li.appendChild(recordButton);
    document.getElementById("topIconHolder_ul").appendChild(li);       
}*/

//call with getSourceIdScreenrecord(function(){} , true)
function getSourceIdScreenrecord(callback, audioPlusTab) {
    if (!callback)
        throw '"callback" parameter is mandatory.';

    window.postMessage("webrtcdev-extension-getsourceId-audio-plus-tab", "*");
};

function onScreenrecordExtensionCallback(event){
    webrtcdev.log("onScreenrecordExtensionCallback" , event);

    if (event.data.chromeExtensionStatus) {
       webrtcdev.log(event.data.chromeExtensionStatus);
    }

    if (event.data.sourceId) {
        if (event.data.sourceId === 'PermissionDeniedError') {
            webrtcdev.log('permission-denied');
        } else{
            webrtcdevScreenRecordConstraints(event.data.sourceId);
        }
    }
}

function webrtcdevScreenRecordConstraints(chromeMediaSourceId){
    webrtcdev.log(" webrtcdevScreenRecordConstraints :" + chromeMediaSourceId);
    
    navigator.getUserMedia(
        {
            audio: true,
            video: false
        },
        function stream(event) {

            var peerinfo;
            if(selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);

            scrrecordAudioStreamid = event.id ;
            scrrecordAudioStream = event ;
            startRecord(peerinfo ,  scrrecordAudioStreamid , scrrecordAudioStream);
        },
        function error(err) {
            webrtcdev.log(" Error in webrtcdevScreenRecordConstraints "  , err);
            if (isChrome && location.protocol === 'http:') {
                alert('Please test this WebRTC experiment on HTTPS.');
            } else if(isChrome) {
                alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
            } else if(!!navigator.mozGetUserMedia) {
                alert(Firefox_Screen_Capturing_Warning);
            }
        }
    );

    navigator.getUserMedia(
        {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: chromeMediaSourceId,
                    maxWidth: window.screen.width > 1920 ? window.screen.width : 1920,
                    maxHeight: window.screen.height > 1080 ? window.screen.height : 1080
                },
                optional: []
            }
        },
        function stream(event) {

            //var container = document.getElementById(screenshareobj.screenshareContainer);
            //var videosContainer = document.createElement("video");
            //videosContainer.src = window.URL.createObjectURL(event);
            //container.appendChild(videosContainer);

            var peerinfo;
            if(selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);

            scrrecordStreamid = event.id ;
            scrrecordStream = event ;
            startRecord(peerinfo ,  scrrecordStreamid , scrrecordStream);
        },
        function error(err) {
            webrtcdev.log(" Error in webrtcdevScreenRecordConstraints "  , err);
            if (isChrome && location.protocol === 'http:') {
                alert('Please test this WebRTC experiment on HTTPS.');
            } else if(isChrome) {
                alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
            } else if(!!navigator.mozGetUserMedia) {
                alert(Firefox_Screen_Capturing_Warning);
            }
        }
    );

}

function webrtcdevRecordScreen() {
    webrtcdev.log("webrtcdevRecordScreen");
    getSourceIdScreenrecord(function(){} , true);
}

function webrtcdevStopRecordScreen(){
    webrtcdev.log("webrtcdevStopRecordScreen screenRoomid");
    window.postMessage("webrtcdev-extension-stopsource-screenrecord", "*");

    if(scrrecordStream)scrrecordStream.stop();
    else alert(" screen video recoridng was not succesfull");

    if(scrrecordAudioStream)scrrecordAudioStream.stop();
    else alert(" screen audio recording was not successfull");
}

// Using ffmpeg concept and merging it together

var workerPath = 'https://archive.org/download/ffmpeg_asm/ffmpeg_asm.js';

function processInWebWorker() {
    var blob = URL.createObjectURL(new Blob(['importScripts("' + workerPath + '");var now = Date.now;function print(text) {postMessage({"type" : "stdout","data" : text});};onmessage = function(event) {var message = event.data;if (message.type === "command") {var Module = {print: print,printErr: print,files: message.files || [],arguments: message.arguments || [],TOTAL_MEMORY: message.TOTAL_MEMORY || false};postMessage({"type" : "start","data" : Module.arguments.join(" ")});postMessage({"type" : "stdout","data" : "Received command: " +Module.arguments.join(" ") +((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")});var time = now();var result = ffmpeg_run(Module);var totalTime = now() - time;postMessage({"type" : "stdout","data" : "Finished processing (took " + totalTime + "ms)"});postMessage({"type" : "done","data" : result,"time" : totalTime});}};postMessage({"type" : "ready"});'], {
        type: 'application/javascript'
    }));

    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}

var worker;
var videoFile = !!navigator.mozGetUserMedia ? 'video.gif' : 'video.webm';

function mergeStreams(videoBlob, audioBlob) {
    var peerinfo;
    if(selfuserid){
        peerinfo = findPeerInfo(selfuserid);
    }else{
        peerinfo = findPeerInfo(rtcConn.userid);
    }

    var recordVideoname = "recordedvideo"+ new Date().getTime();
    peerinfo.filearray.push(recordVideoname);
    var numFile= document.createElement("div");
    numFile.value= peerinfo.filearray.length;
    var fileurl=URL.createObjectURL(videoBlob);

    var recordAudioname = "recordedaudio"+ new Date().getTime();
    peerinfo.filearray.push(recordAudioname);
    var numFile2= document.createElement("div");
    numFile2.value= peerinfo.filearray.length;
    var fileurl2=URL.createObjectURL(audioBlob);

    var sessionRecordfileurl={
        videofileurl: fileurl,
        audiofileurl: fileurl2
    };

    var sessionRecordName={
        videoname: recordVideoname,
        audioname: recordAudioname
    };

   displayList(peerinfo.uuid , peerinfo , sessionRecordfileurl , sessionRecordName , "sessionRecording");
   displayFile(peerinfo.uuid , peerinfo , sessionRecordfileurl , sessionRecordName , "sessionRecording"); 

}

function convertStreams(videoBlob, audioBlob) {
    var vab;
    var aab;
    var buffersReady;
    var workerReady;
    var posted = false;

    var fileReader1 = new FileReader();
    fileReader1.onload = function() {
        vab = this.result;

        if (aab) buffersReady = true;

        if (buffersReady && workerReady && !posted) postMessage();
    };

    var fileReader2 = new FileReader();
    fileReader2.onload = function() {
        aab = this.result;

        if (vab) buffersReady = true;

        if (buffersReady && workerReady && !posted) postMessage();
    };

    webrtcdev.log("videoBlob ", videoBlob);
    webrtcdev.log("audioBlob ", audioBlob);

    fileReader1.readAsArrayBuffer(videoBlob);
    fileReader2.readAsArrayBuffer(audioBlob);

    if (!worker) {
        worker = processInWebWorker();
    }

    worker.onmessage = function(event) {
        var message = event.data;
        if (message.type == "ready") {
            webrtcdev.log('<a href="'+ workerPath +'" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file has been loaded.');
            workerReady = true;
            if (buffersReady)
                postMessage();
        } else if (message.type == "stdout") {
            webrtcdev.log(message.data);
        } else if (message.type == "start") {
            webrtcdev.log('<a href="'+ workerPath +'" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file received ffmpeg command.');
        } else if (message.type == "done") {
            webrtcdev.log(JSON.stringify(message));

            var result = message.data[0];
            webrtcdev.log(JSON.stringify(result));

            var blob = new Blob([result.data], {
                type: 'video/mp4'
            });

            webrtcdev.log(JSON.stringify(blob));

            PostBlob(blob);
        }
    };

    var postMessage = function() {
        posted = true;

        worker.postMessage({
            type: 'command',
            arguments: [
                '-i', videoFile,
                '-i', 'audio.wav',
                '-c:v', 'mpeg4',
                '-c:a', 'vorbis',
                '-b:v', '6400k',
                '-b:a', '4800k',
                '-strict', 'experimental', 'output.mp4'
            ],
            files: [
                {
                    data: new Uint8Array(vab),
                    name: videoFile
                },
                {
                    data: new Uint8Array(aab),
                    name: "audio.wav"
                }
            ]
        });
    };
}

function PostBlob(blob) {

    var peerinfo;
    if(selfuserid){
        peerinfo = findPeerInfo(selfuserid);
    }else{
        peerinfo = findPeerInfo(rtcConn.userid);
    }

    var recordVideoname = "recordedvideo"+ new Date().getTime();
    peerinfo.filearray.push(recordVideoname);
    var numFile= document.createElement("div");
    numFile.value= peerinfo.filearray.length;
    var fileurl=URL.createObjectURL(blob);

   // displayList(peerinfo.uuid , peerinfo  ,fileurl , recordVideoname , "videoRecording");
   // displayFile(peerinfo.uuid , peerinfo , fileurl , recordVideoname , "videoRecording");
   
    var video = document.createElement('video');
    video.controls = true;
    var source = document.createElement('source');
    source.src = URL.createObjectURL(blob);
    source.type = 'video/mp4; codecs=mpeg4';
    video.appendChild(source);
    video.download = 'Play mp4 in VLC Player.mp4';
    
    document.body.appendChild(video);
    /*    
    var h2 = document.createElement('h2');
    h2.innerHTML = '<a href="' + source.src + '" target="_blank" download="Play mp4 in VLC Player.mp4">Download Converted mp4 and play in VLC player!</a>';
    inner.appendChild(h2);
    h2.style.display = 'block';
    inner.appendChild(video);*/

    video.tabIndex = 0;
    video.focus();
    video.play();
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//***************************************************************88
File sharing 
******************************************************************/

var progressHelper = {};

/**
 * Create File share button
 * @method
 * @name createFileShareButton
 * @param {json} fileshareobj
 */
function createFileShareButton(fileshareobj){
    widgetholder= "topIconHolder_ul";

    var button= document.createElement("span");
    button.setAttribute("data-provides","fileinput");
    button.className= fileshareobj.button.class;
    button.innerHTML= fileshareobj.button.html;
    button.onclick = function() {
        var fileSelector = new FileSelector();
        fileSelector.selectSingleFile(function(file) {
            sendFile(file);
        });
    };
    var li =document.createElement("li");
    li.appendChild(button);
    document.getElementById(widgetholder).appendChild(li);
}

/**
 * Assign File share button
 * @method
 * @name assignFileShareButton
 * @param {json} fileshareobj
 */
function assignFileShareButton(fileshareobj){
    var button= document.getElementById(fileshareobj.button.id);
    button.onclick = function() {
        var fileSelector = new FileSelector();
        fileSelector.selectSingleFile(function(file) {
            sendFile(file);
        });
    };
}

/**
 * Send File 
 * @method
 * @name sendFile
 * @param {json} file
 */
function sendFile(file){
    webrtcdev.log(" [filehsraing js] Send file - " , file );
    rtcConn.send(file);
}

/**
 * Send Old Files
 * @method
 * @name sendFile
 * @param {json} files
 */
function addProgressHelper(uuid , peerinfo , filename , fileSize,  progressHelperclassName ){
    try{
        if(!peerinfo){
            webrtcdev.error(" [filehsraingJs]Progress helpler cannot be added for one peer as its absent")
            return;
        }else if(!peerinfo.fileList.container || !document.getElementById(peerinfo.fileList.container)){
            webrtcdev.error(" [filehsraingJs] Progress helpler cannot be added , missing fileListcontainer ")
            return;
        }

        if(!document.getElementById(filename)){
            webrtcdev.log(" [filehsraingJs] progresshelper " , uuid , peerinfo , filename , fileSize,  progressHelperclassName );
            var progressDiv = document.createElement("div");
            progressDiv.id = filename,
            progressDiv.title = uuid + filename,
            progressDiv.setAttribute("class", progressHelperclassName),
            progressDiv.innerHTML = "<label>0%</label><progress></progress>", 
            document.getElementById(peerinfo.fileList.container).appendChild(progressDiv),              
            progressHelper[uuid] = {
                div: progressDiv,
                progress: progressDiv.querySelector("progress"),
                label: progressDiv.querySelector("label")
            }, 
            progressHelper[uuid].progress.max = fileSize;
        }else{
            webrtcdev.log(" Not creating progress bar div as it already exists ");
        }

    }catch(e){
        webrtcdev.error(" [filehsraingJs] problem in progress helper " , e);
    }
}

/**
 * REquest Old Files
 * @method
 * @name sendFile
 * @param {json} files
 */
function requestOldFiles(){
    try{
        var msg={
            type:"syncOldFiles"
        };
        rtcConn.send(msg);
    }catch(e){
        webrtcdev.error("[filesharing js ] syncOldFiles" , e);   
    }
}

/**
 * Send Old Files
 * @method
 * @name sendFile
 * @param {json} files
 */
function sendOldFiles(){

    // Sync old files
    var oldfilesList = [];
    for(x in webcallpeers){
        webrtcdev.log(" Checking Old Files in index " , x);
        var user = webcallpeers[x];
        if(user.filearray && user.filearray.length >0 ){
            for( y in user.filearray){
                // chking is file is already present in old file list 
                for(o in oldfilesList){
                    if(oldfilesList[o].name == user.filearray[y].name) break;
                }
                webrtcdev.log(" ======== user.filearray[y]" , user.filearray[y])
                oldfilesList.push(user.filearray[y]);
            } 
        }
    }

    setTimeout(function(){
        if(oldfilesList.length >0 ){
            webrtcdev.log(" [filehsraing js] sendOldFiles " , oldfilesList );
            for( f in oldfilesList ){
                sendFile(oldfilesList[f]);
            }
        }
    } , 20000);

}

/**
 * add New File Local
 * @method
 * @name addNewFileLocal
 * @param {json} files
 */
function addNewFileLocal(e) {
    webrtcdev.log("addNewFileLocal message ", e);
    if ("" != e.message && " " != e.message) {
        webrtcdev.log("addNewFileLocal");
    }
}

/**
 * add New File Remote
 * @method
 * @name addNewFileRemote
 * @param {json} files
 */
function addNewFileRemote(e) {
    webrtcdev.log("addNewFileRemote message ", e);
    if ("" != e.message && " " != e.message) {
        webrtcdev.log("addNewFileRemote");
    }
}

function updateLabel(e, r) {
    if (-1 != e.position) {
        var n = +e.position.toFixed(2).split(".")[1] || 100;
        r.innerHTML = n + "%"
    }
}

function simulateClick(buttonName){
    document.getElementById(buttonName).click(); 
    webrtcdev.log("simulateClick on "+buttonName);
    return true;
}

function displayList(uuid , peerinfo , fileurl , filename , filetype ){
    try{

        webrtcdev.log("DisplayList peerinfo->", peerinfo, fileurl, filename, filetype);
        var showDownloadButton = true , showRemoveButton=true; 

        var elementList = peerinfo.fileList.container;
        var elementDisplay = peerinfo.fileShare.container;
        var listlength = peerinfo.filearray.length;

        /*  
        if(peerinfo.name=="localVideo"){
            showRemoveButton=false;
        }else{
            showRemoveButton=false;
        }*/
        var _filename=null;
        if (filetype =="sessionRecording"){
            filename = filename.videoname+"_"+filename.audioname;
            _filename = filename;
        }

        var name = document.createElement("div");
        /*name.innerHTML = listlength +"   " + filename ;*/
        name.innerHTML = filename ;
        name.title = filetype +" shared by " +peerinfo.name ;  
        name.className = "filenameClass";
        name.id = "name"+filename;

        var downloadButton = document.createElement("div");
        downloadButton.id = "downloadButton"+filename;
        downloadButton.style.float="right";
        if (fileshareobj.filelist.saveicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.filelist.downloadicon;
            downloadButton.appendChild(img);
        } else {
            downloadButton.innerHTML = '<i class="fa fa-download" style=" color: #615aa8;padding: 10px; font-size: larger;"></i>';
        }
        downloadButton.onclick = function () {
            downloadFile(uuid , elementDisplay , fileurl , _filename , filetype);
        };

        var saveButton = document.createElement("div");
        saveButton.id= "saveButton"+filename;
        saveButton.style.float="right";
        saveButton.setAttribute("data-toggle","modal");
        saveButton.setAttribute("data-target", "#saveModal");
        if (fileshareobj.filelist.saveicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.filelist.saveicon;
            saveButton.appendChild(img);
        } else {
            saveButton.innerHTML = '<i class="fa fa-floppy-o" style="color: #615aa8;padding: 10px; font-size: larger;"></i>';
        }
        saveButton.onclick=function(){ 
            createModalPopup(filetype);
        };

        var showButton = document.createElement("div");
        showButton.id= "showButton"+filename;
        showButton.style.float="right";
        if (fileshareobj.filelist.saveicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.filelist.showicon;
            showButton.appendChild(img);
        } else {
            showButton.innerHTML = '<i class="fa fa-eye-slash" style="color: #615aa8;padding: 10px; font-size: larger;"></i>';
        }
        var countClicks=0;
        repeatFlagHideButton = filename;
        repeatFlagShowButton = "";
        showButton.onclick = function () {
            countClicks++;
            showHideFile(uuid , elementDisplay , fileurl , filename , filetype , showButton , countClicks );
        };

        /*
        var hideButton = document.createElement("div");
        hideButton.id= "hideButton"+filename;
        hideButton.style.float="right";
           
        //hideButton.setAttribute("class" , "btn btn-primary");
        //hideButton.innerHTML='hide';
        //hideButton.innerHTML='<i class="fa fa-eye-slash" style="font-size: 25px;"></i>';
        hideButton.onclick=function(event){
            if(repeatFlagHideButton != filename){
                hideFile(uuid , elementDisplay , fileurl , filename , filetype);
                rtcConn.send({
                    type:"shareFileHide", 
                    _uuid: uuid , 
                    _element: elementDisplay,
                    _fileurl : fileurl, 
                    _filename : filename, 
                    _filetype : filetype
                });
                repeatFlagHideButton= filename;
            }else if(repeatFlagHideButton == filename){
                repeatFlagHideButton= "";
            }
        };
        */

        var removeButton = document.createElement("div");
        removeButton.id= "removeButton"+filename;
        removeButton.style.float="right";
        removeButton.innerHTML ='<i class="fa fa-trash-o" style="color: #615aa8;padding: 10px; font-size: larger;"></i>';
        removeButton.onclick=function(event){
            if(repeatFlagRemoveButton != filename){
                hideFile( elementDisplay , filename );
                //var tobeHiddenElement = event.target.parentNode.id;
                var tobeHiddenElement = filename;
                rtcConn.send({
                    type:"shareFileRemove", 
                    _element: tobeHiddenElement,
                    _filename : filename
                });  
                removeFile(tobeHiddenElement);
                repeatFlagRemoveButton=filename;
            }else if(repeatFlagRemoveButton == filename){
                repeatFlagRemoveButton= "";
            }  
        };

        var parentdom , filedom ;
        if(document.getElementById(filename)){
            filedom = document.getElementById(filename);
        }else{
            /* if the progress bar area does not exist */
            if(document.getElementById(elementList)){
                parentdom = document.getElementById(elementList);
                filedom = document.createElement("div") ;
            }else{
                parentdom = document.body;
                filedom = document.createElement("div") ;
            }
        }

        if(fileshareobj.active){
            filedom.id=filename;
            filedom.innerHTML="";
            filedom.className="row";
            filedom.appendChild(name);
            if(showDownloadButton) 
                filedom.appendChild(downloadButton);
            filedom.appendChild(showButton);
            filedom.appendChild(saveButton);
            //filedom.appendChild(hideButton);
            if(showRemoveButton) 
                filedom.appendChild(removeButton);
        }

        if(parentdom)
            parentdom.appendChild(filedom); 

    }catch(e){
        webrtcdev.error(" [filesharing ] Display list exception " , e);
    }
}


function getFileElementDisplayByType(filetype , fileurl , filename){
    var elementDisplay;
    
    if(filetype.indexOf("msword")>-1 || filetype.indexOf("officedocument")>-1) {
        var divNitofcation= document.createElement("div");
        divNitofcation.className="alert alert-warning";
        divNitofcation.innerHTML= "Microsoft and Libra word file cannot be opened in browser. " +
        "Click bottom DOWNLOAD in UF box . File shows up below the UF box. Click arrow on right, then select OPEN  . File Opens in New Window, then 'Save As'.";
        elementDisplay=divNitofcation;

    }else if(filetype.indexOf("image")>-1){
        var image= document.createElement("img");
        image.src= fileurl;
        image.style.width="100%";
        image.title=filename;
        image.id= "display"+filename; 
        elementDisplay=image;

    }else if (filetype == "sessionRecording") {

        alert(" Session Reording");
        var filename = filename.videoname+"_"+filename.audioname;
        var div =  document.createElement("div");
        div.setAttribute("background-color","black");
        div.id= "display"+filename; 
        div.title=  filename; 

        var video = document.createElement('video');
        video.src = fileurl.videofileurl;
        //video.type = "video/webm";
        video.setAttribute("type", "audvideo/webm");
        video.setAttribute("name", "videofile");
        video.controls = "controls";
        video.title = filename.videoname + ".webm";

        var audio = document.createElement('audio');
        audio.src = fileurl.audiofileurl;
        audio.setAttribute("type" , "audio/wav");
        audio.controls = "controls";
        audio.title = filename.videoname + ".wav";
    
        //audio.hidden=true;

        div.appendChild(video);
        div.appendChild(audio);

        elementDisplay  = div;

        video.play();
        audio.play();

    }else if(filetype.indexOf("videoScreenRecording")>-1){
        webrtcdev.log("videoScreenRecording " , fileurl);
        var video = document.createElement("video");
        video.src = fileurl; 
        video.setAttribute("controls","controls");  
        video.style.width="100%";
        video.title=filename;
        video.id= "display"+filename; 
        elementDisplay=video;

    }else if(filetype.indexOf("video")>-1){
        webrtcdev.log("videoRecording " , fileurl);
        var video = document.createElement("video");
        video.src=fileurl;
        /*            
        try{
            if(fileurl.video!=undefined ){
                video.src = URL.createObjectURL(fileurl.video); 
            }else{
                video.src = URL.createObjectURL(fileurl); 
            }
        }catch(e){
            video.src=fileurl;
        }*/

        video.setAttribute("controls","controls");  
        video.style.width="100%";
        video.title=filename;
        video.id= "display"+filename; 
        elementDisplay=video;

    }else{
        var iframe= document.createElement("iframe");
        iframe.style.width="100%";
        iframe.src= fileurl;
        iframe.className= "viewerIframeClass";
        iframe.title= filename;
        iframe.id= "display"+filename;
        elementDisplay=iframe;
    }
    return  elementDisplay
}

function displayFile( uuid , peerinfo , _fileurl , _filename , _filetype ){

    try{

        if(!peerinfo || !peerinfo.fileShare) return;

        var parentdom =  document.getElementById(peerinfo.fileShare.container);
        var filedom = getFileElementDisplayByType(_filetype , _fileurl , _filename);
        
        if(parentdom){
            parentdom.innerHTML="";
            parentdom.appendChild(filedom);
        }else if(role=="inspector"){
            for( r in webcallpeers){
                var i = ++r;
                if(document.getElementById(webcallpeers[i].fileShare.container)){
                    parentdom =  document.getElementById(webcallpeers[i].fileShare.container);
                    parentdom.innerHTML="";
                    parentdom.appendChild(filedom);
                    break;
                }
            }
        }else{
            document.body.appendChild(filedom);
        } 
    }catch(e){
        webrtcdev.error("[filehsaring js] displayFile " , e)
    }

    /*
    if($('#'+ parentdom).length > 0)
        $("#"+element).html(getFileElementDisplayByType(_filetype , _fileurl , _filename));
    else
        $("body").append(getFileElementDisplayByType(_filetype , _fileurl , _filename));*/
}

function syncButton(buttonId){
    var buttonElement= document.getElementById(buttonId);

    for(x in webcallpeers){
        if(buttonElement.getAttribute("lastClickedBy")==webcallpeers[x].userid){
            buttonElement.setAttribute("lastClickedBy" , '');
            return;
        }
    }

    if(buttonElement.getAttribute("lastClickedBy")==''){
        buttonElement.setAttribute("lastClickedBy" , rtcConn.userid);
        rtcConn.send({
                type:"buttonclick", 
                buttonName: buttonId
        });
    }
}

/* ************* file Listing container button functions --------------- */

/**
* Shows or hides file and sync activity with peers 
* @method
* @name showHideFile
* @param {id} uuid - unique universal id for the file 
* @param {dom} element - name of dom element
* @param {bloburl} fileurl - blob of the file 
* @param {string} filename - name for file 
* @param {string} filetype - type of  file 
*/
function showHideFile(uuid , elementDisplay , fileurl , filename , filetype , showHideButton ,countClicks ){
    webrtcdev.log(" filehsare - show/hide button ",  filename , " || ", countClicks);
    if (countClicks%2==1 ){
        showFile( elementDisplay , fileurl , filename , filetype );
        /*rtcConn.send({
            type:"shareFileShow", 
            _uuid: uuid ,
            _element: elementDisplay,
            _fileurl : fileurl, 
            _filename : filename, 
            _filetype : filetype
        }); */
        showHideButton.innerHTML = '<i class="fa fa-eye-slash" style="color: #615aa8;padding: 10px; font-size: larger;"></i>';
        webrtcdev.log(" Executed script to show the file");
    } else if (countClicks%2==0 ){
        hideFile( elementDisplay, filename );
        /*rtcConn.send({
            type: "shareFileHide",
            _uuid: uuid,
            _element: elementDisplay,
            _fileurl: fileurl,
            _filename: filename,
            _filetype: filetype
        });*/
        showHideButton.innerHTML = '<i class="fa fa-eye" style="color: #615aa8;padding: 10px; font-size: larger;"></i>';
        webrtcdev.log(" Executed script to hide the file ");
    }
}

function showFile( element , fileurl , filename , filetype ){
    $("#"+element).html( getFileElementDisplayByType(filetype , fileurl , filename));
}

function hideFile( element ,filename ){
    if($("#"+element).has("#display"+filename)){
        webrtcdev.log("hidefile " ,filename , " from " , element);
        document.getElementById(element).innerHTML="";
    }else{
        webrtcdev.log(" file is not displayed to hide  ");
    }
}

function removeFile(element){
    document.getElementById(element).hidden=true;
}


function downloadFile(uuid , element , fileurl , _filename , filetype){
    webrtcdev.log(" downloadButton _filename ", _filename , "  filetype ", filetype);
    if (filetype =="sessionRecording"){
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = fileurl.audiofileurl;
        //a.download = _filename.audioname+".wav";
        a.download = peerinfo.filearray[0] + ".wav";
        a.click();
        window.URL.revokeObjectURL(fileurl.audiofileurl);

        var v = document.createElement("a");
        document.body.appendChild(v);
        v.style = "display: none";
        v.href = fileurl.videofileurl;
        //v.download = _filename.videoname+".webm";
        v.download = peerinfo.filearray[1] + ".webm";
        v.click();
        window.URL.revokeObjectURL(fileurl.videofileurl);

        /*window.open(fileurl.audiofileurl , filename.audioname+".wav");
        window.open(fileurl.videofileurl , filename.videoname+".webm");*/
        /*         
        var zip = new JSZip();
        zip.file(filename.videoname , filename.videofileurl);
        var audio = zip.folder("audio");
        audio.file(filename.audioname, fileurl.audiofileurl);
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            // see FileSaver.js
            //saveAs(content, "sessionRecording.zip");
            window.open(content , "sessionRecording.zip");
        });*/
    }else{ 
        window.open(fileurl , "downloadedDocument");
    }
}

/**
* Creates container for file sharing
* @method
* @name createFileSharingBox
* @param {object} peerinfo - single object peerinfo from webcallpeers
* @param {dom} parent - name of dom element parent
*/
function createFileSharingBox(peerinfo, parent){
    try {
        webrtcdev.log(" [ filehsreing js ]  createFileSharingBox " , peerinfo, parent);
        if (document.getElementById(peerinfo.fileShare.outerbox))
            return;

        var fileSharingBox = document.createElement("div");

        if(fileshareobj.props.fileList =="single"){
            fileSharingBox.className = "col-md-12 fileviewing-box";
        }else {
            fileSharingBox.className = "col-md-6 fileviewing-box";            
        }
        fileSharingBox.setAttribute("style", "background-color:" + peerinfo.color);
        fileSharingBox.id = peerinfo.fileShare.outerbox;

        /*--------------------------------add for File Share control Bar--------------------*/
        /*    
        <div class="button-corner">
            <span data-placement="bottom" data-toggle="tooltip" title="" data-original-title="minimize"><i class="fa fa-minus-square"></i></span>
            <span data-placement="bottom" data-toggle="tooltip" title="" data-original-title="maxsimize"><i class="fa fa-external-link-square"></i></span>
            <span data-placement="bottom" data-toggle="tooltip" title="" data-original-title="close"><i class="fa fa-times-circle"></i></span>        
        </div>*/

        var fileControlBar = document.createElement("p");
        fileControlBar.id = peerinfo.fileShare.container + "controlBar";
        fileControlBar.appendChild(document.createTextNode( peerinfo.name));
        //fileControlBar.appendChild(document.createTextNode("File Viewer " + peerinfo.name));

        // Minimize the File viewer box 
        var minButton = document.createElement("span");
        /*    minButton.className="btn btn-default glyphicon glyphicon-import closeButton";
        minButton.innerHTML="Minimize";*/
        if (fileshareobj.fileshare.minicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.fileshare.minicon;
            minButton.appendChild(img);
        } else {
            minButton.innerHTML = '<i class="fa fa-minus-square" style="font-size: 25px;"></i>';
        }
        minButton.id = peerinfo.fileShare.minButton;
        minButton.style.float = "right";
        minButton.style.display = "none";
        minButton.setAttribute("lastClickedBy", '');
        minButton.onclick = function () {
            resizeFV(peerinfo.userid, minButton.id, peerinfo.fileShare.outerbox);
            minButton.style.display = "none";
            maxButton.style.display = "block";
        }

        // Mximize the file viewer box
        var maxButton = document.createElement("span");
        /*    maxButton.className= "btn btn-default glyphicon glyphicon-export closeButton";
        maxButton.innerHTML="Maximize";*/
        if (fileshareobj.fileshare.minicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.fileshare.maxicon;
            maxButton.appendChild(img);
        } else {
            maxButton.innerHTML = '<i class="fa fa-external-link-square" style="font-size: 25px;"></i>';
        }
        maxButton.id = peerinfo.fileShare.maxButton;
        maxButton.style.float = "right";
        maxButton.style.display = "block";
        maxButton.setAttribute("lastClickedBy", '');
        maxButton.onclick = function () {
            maxFV(peerinfo.userid, maxButton.id, peerinfo.fileShare.outerbox);
            maxButton.style.display = "none";
            minButton.style.display = "block";
        }

        // close the file viewer box
        var closeButton = document.createElement("span");
        /* closeButton.className="btn btn-default glyphicon glyphicon-remove closeButton";
        closeButton.innerHTML="Close";*/
        if (fileshareobj.fileshare.closeicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.fileshare.closeicon;
            closeButton.appendChild(img);
        } else {
            closeButton.innerHTML = '<i class="fa fa-times-circle" style="font-size: 25px;"></i>';
        }
        closeButton.id = peerinfo.fileShare.closeButton;
        closeButton.style.float = "right";
        closeButton.setAttribute("lastClickedBy", '');
        closeButton.onclick = function () {
            closeFV(peerinfo.userid, closeButton.id, peerinfo.fileShare.container);
        }

        // rotate the content of file viewer box
        var angle = 0;
        var rotateButton = document.createElement("span");
        if (fileshareobj.fileshare.rotateicon) {
            var img = document.createElement("img");
            img.src = fileshareobj.fileshare.rotateicon;
            rotateButton.appendChild(img);
        } else {
            rotateButton.innerHTML = '<i class="fa fa-mail-forward" style="font-size: 25px;"></i>';
        }
        rotateButton.id = "btnRotate";
        rotateButton.style.float = "right";
        rotateButton.onclick = function () {
            var img = document.getElementById(peerinfo.fileShare.container).firstChild;
            angle = (angle + 90) % 360;
            img.className = "rotate" + angle;
        }

        fileControlBar.appendChild(rotateButton);
        fileControlBar.appendChild(minButton);
        fileControlBar.appendChild(maxButton);
        fileControlBar.appendChild(closeButton);

        /*--------------------------------add for File Share Container--------------------*/
        var fileShareContainer = document.createElement("div");
        fileShareContainer.className = "filesharingWidget";
        fileShareContainer.id = peerinfo.fileShare.container;

        var fillerArea = document.createElement("p");
        fillerArea.className = "filler";

        if (debug) {
            var nameBox = document.createElement("span");
            nameBox.innerHTML = "<br/>" + fileShareContainer.id + "<br/>";
            fileSharingBox.appendChild(nameBox);
        }

        linebreak = document.createElement("br");

        fileSharingBox.appendChild(fileControlBar);
        fileSharingBox.appendChild(linebreak);
        fileSharingBox.appendChild(linebreak);
        fileSharingBox.appendChild(fileShareContainer);
        fileSharingBox.appendChild(fillerArea);

        parent.appendChild(fileSharingBox);
    } catch (e) {
        webrtcdev.error(" createFileSharingBox ", e);
    }
}

/**
* Creates container for file listing
* @method
* @name createFileListingBox
* @param {object} peerinfo - single object peerinfo from webcallpeers
* @param {dom} parent - name of dom element parent
*/
function createFileListingBox(peerinfo, parent){

    try {
        if (document.getElementById(peerinfo.fileList.outerbox))
            return;

        var fileListingBox = document.createElement("div");

        if(fileshareobj.props.fileList =="single"){
            fileListingBox.className = "col-sm-12 filesharing-box";
        }else {
            fileListingBox.className = "col-sm-6 filesharing-box";            
        }

        fileListingBox.id = peerinfo.fileList.outerbox;
        //fileListingBox.setAttribute("style", "background-color:" + peerinfo.color);

        /*--------------------------------add for File List control Bar--------------------*/

        var fileListControlBar = document.createElement("p");
        //fileListControlBar.appendChild(document.createTextNode(peerinfo.name + "     "));
        //fileListControlBar.appendChild(document.createTextNode("Uploaded Files " + peerinfo.name + "     "));

        /*
        var fileHelpButton= document.createElement("span");s
        fileHelpButton.className="btn btn-default glyphicon glyphicon-question-sign closeButton";
        fileHelpButton.innerHTML="Help";
        /*fileListControlBar.appendChild(fileHelpButton);*/

        var minButton = document.createElement("span");
        minButton.innerHTML = '<i class="fa fa-minus-square" style="font-size: 20px;></i>';
        minButton.id = peerinfo.fileShare.minButton;
        minButton.setAttribute("lastClickedBy", '');
        minButton.onclick = function () {
            resizeFV(peerinfo.userid, minButton.id, peerinfo.fileShare.outerbox);
        }

        var maxButton = document.createElement("span");
        maxButton.innerHTML = '<i class="fa fa-external-link-square" style="font-size: 20px;></i>';
        maxButton.id = peerinfo.fileShare.maxButton;
        maxButton.setAttribute("lastClickedBy", '');
        maxButton.onclick = function () {
            maxFV(peerinfo.userid, maxButton.id, peerinfo.fileShare.outerbox);
        }

        var closeButton = document.createElement("span");
        closeButton.innerHTML = '<i class="fa fa-times-circle" style="font-size: 20px;></i>';
        closeButton.id = peerinfo.fileShare.closeButton;
        closeButton.setAttribute("lastClickedBy", '');
        closeButton.onclick = function () {
            closeFV(peerinfo.userid, closeButton.id, peerinfo.fileShare.container);
        }

        fileListControlBar.appendChild(minButton);
        fileListControlBar.appendChild(maxButton);
        fileListControlBar.appendChild(closeButton);


        /*--------------------------------add for File List Container--------------------*/
        var fileListContainer = document.createElement("div");
        fileListContainer.id = peerinfo.fileList.container;

        var fileProgress = document.createElement("div");

        if (debug) {
            var nameBox = document.createElement("span");
            nameBox.innerHTML = fileListContainer.id;
            fileListingBox.appendChild(nameBox);
        }

        fileListingBox.appendChild(fileListControlBar);
        fileListingBox.appendChild(fileListContainer);
        fileListingBox.appendChild(fileProgress);

        parent.appendChild(fileListingBox);
    } catch (e) {
        webrtcdev.error(" createFileListingBox ", e);
    }
}

// __________________
// createFileSharingDiv.js

/**
 * {@link createFileSharingDiv} is an inner/private helper for {@link RecordRTC}.
 * @summary It returns dom for Filesharing conatiner.
 * @license {@link https://github.com/altanai/webrtc#license|MIT}
 * @author {@link http://www.altanai.com|Altanai}
 * @typedef createFileSharingDiv
 * @class
 * @example
 * createFileSharingDiv(peerinfo)
 * @see {@link https://github.com/altanai/webrtc|webrtc Source Code}
 * @param {object} config - {
color :"#a69afe"
controlBarName : "control-video4wm0h338u9p"
email : "abc@gmail.com"
fileList : {
    outerbox: "widget-filelisting-box4wm0h338u9p", 
    container: "widget-filelisting-container4wm0h338u9p"
}
fileShare : {
    outerbox: "widget-filesharing-box4wm0h338u9p", 
    container: "widget-filesharing-container4wm0h338u9p", 
    minButton: "widget-filesharing-minbutton4wm0h338u9p", 
    maxButton: "widget-filesharing-maxbutton4wm0h338u9p", 
    closeButton: "widget-filesharing-closebutton4wm0h338u9p"
}
filearray : []
name : "REMOTE"
role : "participant"
stream : MediaStream {isAudio: false, isVideo: true, isScreen: false, streamid: "aXSL939WBQZwTpytTnOMR9wnzZJQT8VGT8hF", type: "remote", …}
streamid : "aXSL939WBQZwTpytTnOMR9wnzZJQT8VGT8hF"
type : "remote"
userid : "4wm0h338u9p"
vid : "videoremote_4wm0h338u9p"
videoClassName : null
videoContainer : "video4wm0h338u9p"
videoHeight : null
}
 */
function createFileSharingDiv(peerinfo){
    webrtcdev.log(" -------createFileSharingDiv  " , peerinfo);

    // When the peerinfo role is inspctor but self role is not inspector only then exit 
    if(peerinfo.role =="inspector" && role !="inspector") return;

    if (!document.getElementById(peerinfo.fileShare.outerbox)){
        var parentFileShareContainer = document.getElementById(fileshareobj.fileShareContainer);
        createFileSharingBox(peerinfo , parentFileShareContainer);
    }

    if(!document.getElementById(peerinfo.fileList.outerbox)){
        var parentFileListContainer = document.getElementById(fileshareobj.fileListContainer);
        createFileListingBox(peerinfo , parentFileListContainer);
    }
}

/* ************* file sharing container button functions --------------- */
function closeFV(userid,  buttonId , selectedFileSharingBox){
    document.getElementById(selectedFileSharingBox).innerHTML="";
    /*syncButton(buttonId);*/
}

function resizeFV(userid,  buttonId , selectedFileSharingBox){
    for(x in webcallpeers){
        if(webcallpeers[x].fileShare.outerbox==selectedFileSharingBox) {
            document.getElementById(selectedFileSharingBox).hidden=false;
            document.getElementById(selectedFileSharingBox).style.width="50%";
        }else{
            document.getElementById(webcallpeers[x].fileShare.outerbox).hidden=false;
            document.getElementById(webcallpeers[x].fileShare.outerbox).style.width="50%";
        }
    }
    /*  
    document.getElementById(selectedFileSharingBox).hidden=false;
    document.getElementById(selectedFileSharingBox).style.width="50%";   
    syncButton(buttonId);*/
}

function minFV(userid, buttonId , selectedFileSharingBox){
    document.getElementById(selectedFileSharingBox).hidden=false;
    document.getElementById(selectedFileSharingBox).style.width="50%";
    document.getElementById(selectedFileSharingBox).style.height="10%";
    
    /*syncButton(buttonId);*/
}

function maxFV(userid,  buttonId ,  selectedFileSharingBox){
    for(x in webcallpeers){
        if(webcallpeers[x].fileShare.outerbox==selectedFileSharingBox) {
            document.getElementById(selectedFileSharingBox).hidden=false;
            document.getElementById(selectedFileSharingBox).style.width="100%";
        }else{
            document.getElementById(webcallpeers[x].fileShare.outerbox).hidden=true;
            document.getElementById(webcallpeers[x].fileShare.outerbox).style.width="0%";
        }
    }
    /*syncButton(buttonId);  */
}

/**
 * Save File Modal Popup
 * @method
 * @name createModalPopup
 * @param {string} filetype
 */
function createModalPopup(filetype ){
    webrtcdev.log( " create Modal popup for filetype " , filetype);

    var mainDiv= document.getElementById("mainDiv");

    if(document.getElementById("saveModal")){
        mainDiv.removeChild(document.getElementById("saveModal"));
    }

    var modalBox=document.createElement("div");
    modalBox.className="modal fade";
    modalBox.setAttribute("role" , "dialog");
    modalBox.id="saveModal";

    var modalinnerBox=document.createElement("div");
    modalinnerBox.className="modal-dialog";

    var modal=document.createElement("div");
    modal.className = "modal-content";

    var modalheader= document.createElement("div");
    modalheader.className = "modal-header";

    var closeButton= document.createElement("button");
    closeButton.className="close";
    closeButton.setAttribute("data-dismiss", "modal");
    closeButton.innerHTML="&times;";

    var title=document.createElement("h4");
    title.className="modal-title";
    title.innerHTML="Save File";   
    title.setAttribute("float" ,  "left");
    modalheader.appendChild(title);
    modalheader.appendChild(closeButton);

    var modalbody = document.createElement("div");
    modalbody.className = "modal-body";
    modalbody.innerHTML = "";

    var body=document.createElement("div");
    switch(filetype){
        case  "blobcanvas":
            title.innerHTML="Save Drawing";  
            var d1=document.createElement("div");
            d1.innerHTML= "Right Click on Save, pop up window gives following info: Right Click on Draw image, Click Save As when window opens up.";
            body.appendChild(d1);
            break;
        case "application/pdf":
            title.innerHTML="Save PDF"; 
            var d1= document.createElement("div");
            d1.innerHTML='Click DOWNLOAD on top of the doc . Click SAVE AS when window opens up';
            var i1 = document.createElement("img");
            i1.src= "images/savefile.PNG";
            body.appendChild(d1);
            body.appendChild(i1);
            break; 
        // browser supported formats 
        case "image/jpeg":
        case "image/png":
        case "video/mov": 
        case "video/webm":
        case "imagesnapshot":
            title.innerHTML="Save Picture / Video"; 
            var d1=document.createElement("div");
            d1.innerHTML='Right Click on the FILE . Click SAVE AS when window opens up';
            body.appendChild(d1);
            break; 
        // browser supported audio formats    
        case "audio/mp3":
            title.innerHTML="Save Music File"; 
            var d1= document.createElement("div");
            d1.innerHTML="Right Click on the FILE (play display line). Click SAVE AS when window opens up";
            body.appendChild(d1);
            break;
        // propertiary stuff that will not open in browser 
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        case "application/vnd.ms-excel":
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 
        case "video/x-ms-wmv":
            title.innerHTML="Save Microsoft Office / Libra / Open Office Documents"; 
            var d1= document.createElement("div");
            d1.innerHTML="Click bottom DOWNLOAD in Uploaded Files box . File shows up below the Uploaded Files box. Click arrow on right, then select OPEN  . File Opens in New Window, then 'Save As'.";
            body.appendChild(d1);
            break; 
        case "sessionRecording":
            title.innerHTML="Save Session Recording";
            var d1=document.createElement("div");
            d1.innerHTML='Extract the video and audio recording from the dowloaded compresed file and play together ';
            body.appendChild(d1);
            break;
        default :
            var d1=document.createElement("div");
            d1.innerHTML='Document is Unrecognizable, cannot be saved, but can be shared with Remote. Use/Click Screen Share for Remote to view your screen. Then open the document on your screen.';
            body.appendChild(d1);
            break;
    }

    modalbody.appendChild(body);
    modal.appendChild(modalheader);
    modal.appendChild(modalbody);

    modalinnerBox.appendChild(modal);
    modalBox.appendChild(modalinnerBox);

    mainDiv.appendChild(modalBox);
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//**************************************************************************8
draw 
******************************************************************************/
var CanvasDesigner;
var isDrawOpened = false ;

function webrtcdevCanvasDesigner(drawCanvasobj){

    if(document.getElementById(drawCanvasobj.drawCanvasContainer).innerHTML.indexOf("iframe")<0){
        try{
            CanvasDesigner.addSyncListener(function(data) {
                rtcConn.send({type:"canvas", draw:data});
            });

            CanvasDesigner.setSelected('pencil');

            CanvasDesigner.setTools({
                pencil: true,
                eraser: true
            });

            CanvasDesigner.appendTo(document.getElementById(drawCanvasobj.drawCanvasContainer));
        }catch(e){
            webrtcdev.error(" Canvas drawing not supported " , e);
        }
    }else{
        webrtcdev.log("CanvasDesigner already started .iframe is attached ");
    }

}

function syncDrawBoard(bdata){
    if(document.getElementById(bdata.button.id)){
        document.getElementById(bdata.button.id).click();
    }else{
        webrtcdev.error(" Receieved sync board evenet but no button id found");
    }
}

function createdrawButton(drawCanvasobj){
    var drawButton= document.createElement("span");
    drawButton.className=drawCanvasobj.button.class_off ;
    drawButton.innerHTML=drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className==drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            alert(" Draw Board Opened ");
            drawButton.className= drawCanvasobj.button.class_on ;
            drawButton.innerHTML= drawCanvasobj.button.html_on;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=false;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");
            
            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=false;
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                var bdata={
                    event : "open",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:bdata});
            }else{
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
            webrtcdevCanvasDesigner(drawCanvasobj);

        }else if(drawButton.className==drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=true;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");
            
            if(document.getElementById(drawCanvasobj.drawCanvasContainer))
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=true;
            else
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");


        }
    };
    var li =document.createElement("li");
    li.appendChild(drawButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

function assigndrawButton(drawCanvasobj){
    drawButton = document.getElementById(drawCanvasobj.button.id);
    drawButton.className= drawCanvasobj.button.class_off;
    drawButton.innerHTML= drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className==drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            //alert(" Draw Board Opened ");
            drawButton.className= drawCanvasobj.button.class_on ;
            drawButton.innerHTML= drawCanvasobj.button.html_on;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=false;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");
            
            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=false;
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                isDrawOpened = true;
                var bdata={
                    event : "open",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:bdata});
            }else{
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
            webrtcdevCanvasDesigner(drawCanvasobj);

        }else if(drawButton.className==drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=true;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");
            
            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=true;
                isDrawOpened = false ;
                var bdata={
                    event : "close",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:bdata});
            }else
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
        }
    };
}


var saveButtonCanvas = document.createElement("div");
saveButtonCanvas.id = "saveButtonCanvasDraw";
saveButtonCanvas.setAttribute("data-toggle","modal");
saveButtonCanvas.setAttribute("data-target","#saveModal");
saveButtonCanvas.onclick=function(){
   createModalPopup( "blobcanvas" );
};
document.body.appendChild(saveButtonCanvas);
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//**********************************
Reconnect 
****************************************/
/*
add code hetre for redial 
*/

function createButtonRedial(){
    var reconnectButton= document.createElement("span");
    reconnectButton.className= reconnectobj.button.class;
    reconnectButton.innerHTML= reconnectobj.button.html;
    reconnectButton.onclick=function(){
        var r = confirm("Do you want to reconnet ?");
        if (r == true) {
          //location.reload();

          $(this).html('<img src="http://www.bba-reman.com/images/fbloader.gif" />');
           setTimeout(function(){ 
            $(this).html(reconnectobj.button.html )
          }, 3000);

        } else {
           //do nothing
        }
    };
    var li =document.createElement("li");
    li.appendChild(reconnectButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

function assignButtonRedial(id){
    document.getElementById(id).onclick=function(){
        var r = confirm("Do you want to reconnect ?");
        if (r == true) {

            //rtcConn.rejoin(rtcConn.connectionDescription);
            if (!rtcConn.peers[rtcConn.connectionDescription.remoteUserId]) return;
            rtcConn.peers[rtcConn.connectionDescription.remoteUserId].peer.close();

            rtcConn.rejoin(rtcConn.connectionDescription);

            $(this).html('<img src="http://www.bba-reman.com/images/fbloader.gif" />');
            setTimeout(function(){ 
            
            document.getElementById(id).innerHTML= reconnectobj.button.html ;
          }, 3000);

           //location.reload();
        } else {
           //do nothing
        }
    };
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//* **********************************************
Listen -In
*************************************************/

if(document.getElementById("ListenInButton")){

	var listeninLink = window.location+'?appname=webrtcwebcall&role=inspector&audio=0&video=0';
  	
  	var modalBox=document.createElement("div");
  	modalBox.className="modal fade";
  	modalBox.setAttribute("role" , "dialog");
  	modalBox.id="myModal";

  	var modalinnerBox=document.createElement("div");
  	modalinnerBox.className="modal-dialog";

	var modal=document.createElement("div");
	modal.className = "modal-content";

	var modalheader= document.createElement("div");
	modalheader.className = "modal-header";

	var closeButton= document.createElement("button");
	closeButton.className="close";
	closeButton.setAttribute("data-dismiss", "modal");
	closeButton.innerHTML="&times;";

	var title=document.createElement("h4");
	title.className="modal-title";
	title.innerHTML="Listen-In Link";	

	modalheader.appendChild(title);
	modalheader.appendChild(closeButton);


	var modalbody = document.createElement("div");
	modalbody.className="modal-body";

	var link = document.createElement("div");
	link.innerHTML = window.location+'?appname=webrtcwebcall&role=inspector&audio=0&video=0';

	var mail=document.createElement("div");
	mail.innerHTML='<a href="mailto:?Subject=Hello%20again" target="_top">Send Mail</a>';

	modalbody.appendChild(link);
	modalbody.appendChild(mail);

	modal.appendChild(modalheader);
	modal.appendChild(modalbody);

	modalinnerBox.appendChild(modal);
	modalBox.appendChild(modalinnerBox);

	var mainDiv= document.getElementById("mainDiv");
	mainDiv.appendChild(modalBox);

	webrtcdev.log(" -----------------sppenedd modal dialog ListenIn" , modalBox);
	//document.body.appendChild(modalBox);

	/*document.getElementById("ListenInButton").onclick=function(){
		//alert(window.location+'?appname=webrtcwebcall&role=inspector&audio=0&video=0');
	}*/
}

if(document.getElementById('listenInLink')){
	try{
		var currSession =  window.location.href;
		webrtcdev.log(" Current Session ", currSession);
	
		var listeninSession = currSession+'?appname=webrtcwebcall&role=inspector&audio=0&video=0';
		webrtcdev.log(" Inspector Link " , listeninSession);

		document.getElementById("listenInLink").value = listeninSession;
	}catch(e){
		webrtcdev.error(" Listen In :". e);
	}

}

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//***************************************************************************
cursor sharing 
***************************************************************************/

var cursorX;
var cursorY;
var cursorinterval;

function placeCursor(element , x_pos, y_pos) {
  element.style.position = "absolute";
/*element.style.left = '100px';
  element.style.top = '100px';*/
  element.style.left = x_pos+'px';
  element.style.top = y_pos+'px';
}

function startShareCursor(){
  document.getElementById("cursor1").setAttribute("style","display:block");
  document.onmousemove = function(e){
    cursorX = e.pageX + 10 ;
    cursorY = e.pageY;
  }
  cursorinterval = setInterval(shareCursor, 500);
}

function stopShareCursor(){
    document.getElementById("cursor1").setAttribute("style","display:none");
    rtcConn.send({
        type: "pointer", 
        action : "stopCursor"
    });
   clearInterval(cursorinterval);
}
/*function assignButtonCursor(bid){
  var button =document.getElementById(bid);
  button.onclick=function(){
    startShareCursor();
  }
}*/

function shareCursor(){
    var element = document.getElementById("cursor1");
    element.hidden=false;

    placeCursor( element, cursorX, cursorY );

    rtcConn.send({
        type:"pointer", 
        action : "startCursor",
        corX: cursorX , 
        corY: cursorY
    });
}

function createCursorButton(controlBarName, peerinfo, streamid, stream ){
    var button=document.createElement("span");
    button.id = controlBarName+"cursorButton";
    button.setAttribute("data-val","mute");
    button.setAttribute("title", "Pointer");
    button.className=cursorobj.button.class_on;
    button.innerHTML=cursorobj.button.html_on;
    button.onclick = function() {
        var btnid = button.id;
        var peerinfo ;
        if(selfuserid)
            peerinfo = findPeerInfo(selfuserid);
        else
            peerinfo = findPeerInfo(rtcConn.userid);


        if(btnid.indexOf(peerinfo.controlBarName)>-1){
            if(button.className == cursorobj.button.class_on ){
                startShareCursor();
                button.className=cursorobj.button.class_off;
                button.innerHTML=cursorobj.button.html_off;
            }else if (button.className == cursorobj.button.class_off ){            
                stopShareCursor();
                button.className=cursorobj.button.class_on;
                button.innerHTML=cursorobj.button.html_on;
            }     
            //syncButton(audioButton.id);   
        }else{
            alert(" Use Local Pointer button ");
        }

             
    };
    return button;
}


 // ............................Cursors resting position .................. 
/*
    <div id="cursor1" class="fa fa-hand-o-up" style="width:0"></div>
    <div id="cursor2" class="fa fa-hand-o-up" style="width:0"></div>*/
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */function createCodeEditorButton(){
    var codeeditorButton= document.createElement("span");
    codeeditorButton.className=codeeditorobj.button.class_off ;
    codeeditorButton.innerHTML=codeeditorobj.button.html_off;
    for( x in codeeditorobj.languages)
        document.getElementById("CodeStyles").innerHTML=document.getElementById("CodeStyles").innerHTML+codeeditorobj.languages[x];

    var codeArea= document.getElementById("codeArea").value;
    var modeVal="text/javascript"; 

    editor = CodeMirror.fromTextArea(document.getElementById("codeArea"), {
         mode: modeVal,
         styleActiveLine: true,
         lineNumbers: false,
         lineWrapping: true
    });
    editor.setOption('theme', 'mdn-like');

    codeeditorButton.onclick=function(){
        if(codeeditorButton.className==codeeditorobj.button.class_off){
            codeeditorButton.className= codeeditorobj.button.class_on ;
            codeeditorButton.innerHTML= codeeditorobj.button.html_on;
            startWebrtcdevcodeeditorSync();
            document.getElementById(codeeditorobj.codeeditorContainer).hidden=false;
        }else if(codeeditorButton.className==codeeditorobj.button.class_on){
            codeeditorButton.className= codeeditorobj.button.class_off ;
            codeeditorButton.innerHTML= codeeditorobj.button.html_off;
            stopWebrtcdevcodeeditorSync();
            document.getElementById(codeeditorobj.codeeditorContainer).hidden=true;
        }
    };

    var li =document.createElement("li");
    li.appendChild(codeeditorButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/*************************************************************************
code Editor
******************************************************************************/
function sendWebrtcdevCodeeditorSync(evt){
    if(evt.which ==  37 || evt.which ==  38 || evt.which ==  39 || evt.which ==  40  || evt.which==17 || evt.which == 18|| evt.which == 16){
        return true; 
    }

    var tobj ={
        "option" : "text",
        "codeContent": editor.getValue()
    }
    webrtcdev.log(" sending " , tobj);
    rtcMultiConnection.send({
            type: "codeeditor", 
            data: tobj
    });
}

function sendWebrtcdevCodeeditorStyleSync(evt){
    $("#CodeStyles option:selected").each(function() {
      var info = CodeMirror.findModeByMIME( $( this ).attr('mime')); 
      if (info) {
        mode = info.mode;
        spec = $( this ).attr('mime');
        editor.setOption("mode", spec);
        CodeMirror.autoLoadMode(editor, mode);
        //webrtcdev.log(info + " "+ mode+ " "+ spec + " "+ editor);
      }
    });

    var tobj ={
        "option" : "menu",
        "codeMode":mode,
        "codeSpec":spec
    }

    webrtcdev.log(" sending " , tobj);
    rtcMultiConnection.send({
            type: "codeeditor", 
            data: tobj
    });
}

function receiveWebrtcdevCodeeditorSync(data){
    webrtcdev.log("codeeditor " , data);
    if(data.option=="text"){
        var pos = editor.getCursor();
        editor.setValue(data.codeContent);
        editor.setCursor(pos);
    }else if(data.option=="menu"){
        editor.setOption("mode", evt.data.codeSpec);
        CodeMirror.autoLoadMode(editor, evt.data.codeMode);
    }
}

function startWebrtcdevcodeeditorSync(){
    document.getElementById(codeeditorobj.codeeditorContainer).addEventListener("keyup", sendWebrtcdevCodeeditorSync, false);
     document.getElementById("CodeStyles").addEventListener("change", sendWebrtcdevCodeeditorStyleSync, false);
}

function stopWebrtcdevcodeeditorSync(){
    document.getElementById(codeeditorobj.codeeditorContainer).removeEventListener("keyup", sendWebrtcdevCodeeditorSync, false);
}

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */function createTextEditorButton(){
    var texteditorButton= document.createElement("span");
    texteditorButton.className=texteditorobj.button.class_off ;
    texteditorButton.innerHTML=texteditorobj.button.html_off;

    texteditorButton.onclick=function(){
        if(texteditorButton.className==texteditorobj.button.class_off){
            texteditorButton.className= texteditorobj.button.class_on ;
            texteditorButton.innerHTML= texteditorobj.button.html_on;
            startWebrtcdevTexteditorSync();
            document.getElementById(texteditorobj.texteditorContainer).hidden=false;
        }else if(texteditorButton.className==texteditorobj.button.class_on){
            texteditorButton.className= texteditorobj.button.class_off ;
            texteditorButton.innerHTML= texteditorobj.button.html_off;
            stopWebrtcdevTexteditorSync();
            document.getElementById(texteditorobj.texteditorContainer).hidden=true;
        }
    };
    var li =document.createElement("li");
    li.appendChild(texteditorButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}
        
/*************************************************************************
Text Editor
******************************************************************************/

function sendWebrtcdevTexteditorSync(evt){
    // Left: 37 Up: 38 Right: 39 Down: 40 Esc: 27 SpaceBar: 32 Ctrl: 17 Alt: 18 Shift: 16 Enter: 13
    if(evt.which ==  37 || evt.which ==  38 || evt.which ==  39 || evt.which ==  40  || evt.which==17 || evt.which == 18|| evt.which == 16){
        return true; // handle left up right down  control alt shift
    }

    var tobj ={
        "option" : "text",
        "content": document.getElementById(texteditorobj.texteditorContainer).value
    }
    webrtcdev.log(" sending " , document.getElementById(texteditorobj.texteditorContainer).value);
    rtcMultiConnection.send({
            type: "texteditor", 
            data: tobj
    });
}

function receiveWebrtcdevTexteditorSync(data){
    webrtcdev.log("texteditor " , data);
    if(data.option=="text"){
        document.getElementById(texteditorobj.texteditorContainer).value=data.content;
    }
}

function startWebrtcdevTexteditorSync(){
    document.getElementById(texteditorobj.texteditorContainer).addEventListener("keyup", sendWebrtcdevTexteditorSync, false);
}

function stopWebrtcdevTexteditorSync(){
    document.getElementById(texteditorobj.texteditorContainer).removeEventListener("keyup", sendWebrtcdevTexteditorSync, false);
}

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//*********************************************
ICE
**************************************************/
/**
 * {@link https://github.com/altanai/webrtc/blob/master/client/build/scripts/_turn.js|TURN} 
 * @summary JavaScript audio/video recording library runs top over WebRTC getUserMedia API.
 * @author {@link https://telecom.altanai.com/about-me/|Altanai}
 * @typedef _turn.js
 * @function
 * @example
 *  turn    = (session.hasOwnProperty('turn')?session.turn:null);
 *  if(turn!=null ){
 *       getICEServer( turn.username ,turn.secretkey , turn.domain,
 *                      turn.application , turn.room , turn.secure); 
 *   }
 */

var iceServers=[];
function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}

function getICEServer(username , secretkey , domain , appname , roomname , secure){
    var url = 'https://service.xirsys.com/ice';
    var xhr = createCORSRequest('POST', url);
    xhr.onload = function () {
        webrtcdev.log(xhr.responseText);
        if(JSON.parse(xhr.responseText).d==null){
            webrtcdevIceServers = "err";
            shownotification(" media not able to pass through "+ JSON.parse(xhr.responseText).e);
        }else{
            webrtcdevIceServers = JSON.parse(xhr.responseText).d.iceServers;
            webrtcdev.log(" otained iceServers" , webrtcdevIceServers);
        }
    };
    xhr.onerror = function () {
        webrtcdev.error('Woops, there was an error making xhr request.');
    };
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send('ident='+username+'&secret='+secretkey +
        '&domain='+domain +'&application='+appname+
        '&room='+ roomname+'&secure='+secure);
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//**************************************************8
Timer 
***************************************************/
var hours,mins,secs;
var today = new Date();
var zone="";

function startsessionTimer(timerobj){

    if(timerobj.counter.hours && timerobj.counter.minutes && timerobj.counter.seconds ){
        hours = document.getElementById(timerobj.counter.hours);
        mins = document.getElementById(timerobj.counter.minutes);
        secs = document.getElementById(timerobj.counter.seconds);

        if(timerobj.type=="forward"){
            startForwardTimer();
            hours.innerHTML=0;
            mins.innerHTML=0;
            secs.innerHTML=0;

        }else if (timerobj.type=="backward"){
            hours.innerHTML=0;
            mins.innerHTML=3;
            secs.innerHTML=0;
            startBackwardTimer();
        }
    }else{
        webrtcdev.error(" timerobj.counter DOM elemnts not found ");
    }

}

function startBackwardTimer(){
    webrtcdev.log("startBackwardTimer", hours ,mins , secs);
    var cd = secs;
    var cdm = mins;
    var c = parseInt(cd.innerHTML,10);
    var m =  parseInt(cdm.innerHTML,10);
    //alert(" Time for session validy is "+m +" minutes :"+ c+ " seconds");
    btimer(cd , c , cdm ,  m);  
}

function startForwardTimer(){
    webrtcdev.log("forward vtime started ");
    var cd = secs;
    var cdm = mins;
    var c = parseInt(cd.innerHTML,10);
    var m =  parseInt(cdm.innerHTML,10);
    //alert(" Time for session validy is "+m +" minutes :"+ c+ " seconds");
    ftimer(cd , c , cdm ,  m); 
}

function ftimer(cd , c , cdm , m ){
    var interv = setInterval(function() {
        c++;
        secs.innerHTML= c;

        if (c == 60) {
            c = 0;
            m++;  
            mins.innerHTML = m;                    
        }
    }, 1000);
}

function btimer(cd , c , cdm , m ){
    var interv = setInterval(function() {
        c--;
        secs.innerHTML= c;

        if (c == 0) {
            c = 60;
            m--;  
            mins.innerHTML=m;
            if(m<0)  {
                clearInterval(interv); 
                //alert("time over");
            }                     
        }
    }, 1000);
}

function getDate(){
    var now = new Date();
    return now;
}

function prepareTime(){

}



function startTime() {
    try{
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        m = checkTime(m);
        s = checkTime(s);

        if(timerobj.span.currentTime_id && document.getElementById(timerobj.span.currentTime_id)){
            var timerspan = document.getElementById(timerobj.span.currentTime_id);
            timerspan.innerHTML =   h + ":" + m + ":" + s;
            var t = setTimeout(startTime, 500);
        }else{
            webrtcdev.error(" No place for timerobj.span.currentTime_id");
        }
    }catch(e){
        webrtcdev.error(e);
    }
    //webrtcdev.log(" localdate :" , today);


}

function timeZone(){
    try{
        if(timerobj.span.currentTimeZone_id && document.getElementById(timerobj.span.currentTimeZone_id)){
            zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
            var timerspan=document.getElementById(timerobj.span.currentTimeZone_id);
            timerspan.innerHTML = zone;
        }else{
            webrtcdev.error(" timerobj.span.currentTimeZone_id DOM doesnt exist ");
        }
    }catch(e){
        webrtcdev.error(e);
    }

}

function shareTimePeer(){
    try{
        var msg={
            type:"timer", 
            time: (today).toJSON() , 
            zone: zone
        };
        rtcConn.send(msg);
    }catch(e){
        webrtcdev.error(e);   
    }

}

function startPeersTime(date,zone){
    
    try{
        /*    
        var smday = new Date();
        smday.setHours(h);
        smday.setMinutes(m);
        smday.setSeconds(s);*/
        webrtcdev.log(" startPeersTime " , date , zone);

        if(timerobj.span.remoteTimeZone_id && document.getElementById(timerobj.span.remoteTimeZone_id)){
            var timerspan = document.getElementById(timerobj.span.remoteTimeZone_id);
            timerspan.innerHTML = zone;
        }else{
            webrtcdev.error("timerobj.span.remoteTimeZone_id DOM doesnt exist ");
        }
        

        if(timerobj.span.remoteTime_id && document.getElementById(timerobj.span.remoteTime_id)){
            var remotedate = new Date(date);
            //var remotedate = new Date().toLocaleString('en-US', { timeZone: zone });
            webrtcdev.log(" remotedate :" , remotedate);
            var h = remotedate.getHours();
            var m = remotedate.getMinutes();
            var s = remotedate.getSeconds();

            h = checkTime(h);
            m = checkTime(m);
            s = checkTime(s);
            var timerspan=document.getElementById(timerobj.span.remoteTime_id);
            timerspan.innerHTML =   h + ":" + m + ":" + s;
            var t = setTimeout(startTime, 500);
        }else{
            webrtcdev.error(" timerobj.span.remoteTime_id DOM does not exist");
        }
    }catch(e){
        webrtcdev.error(e);   
    }
}

function activateBttons(timerobj){
    if(timerobj.container.minbutton_id && document.getElementById(timerobj.container.minbutton_id)){
        var button= document.getElementById(timerobj.container.minbutton_id);
        button.onclick=function(e){
            if(document.getElementById(timerobj.container.id).hidden)
                document.getElementById(timerobj.container.id).hidden=false;
            else
                document.getElementById(timerobj.container.id).hidden=true;
        }  
    }
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */// ___________
// getStats.js
// an abstraction layer runs top over RTCPeerConnection.getStats API
// cross-browser compatible solution
// http://dev.w3.org/2011/webrtc/editor/webrtc.html#dom-peerconnection-getstats
/*
getStats(rtcPeerConnection, function(result) {
    result.connectionType.remote.ipAddress
    result.connectionType.remote.candidateType
    result.connectionType.transport
});
*/

function getStats(mediaStreamTrack, callback, interval) {
    var peer = this;
    //webrtcdev.log("----getStats-----", arguments[0] , arguments[1] ,arguments[2] , arguments[3])
    if (arguments[0] instanceof RTCMultiConnection) {
        peer = arguments[0];
        
        if(!!navigator.mozGetUserMedia) {
            mediaStreamTrack = arguments[1];
            callback = arguments[2];
            interval = arguments[3];
        }

        if (!(mediaStreamTrack instanceof MediaStreamTrack) && !!navigator.mozGetUserMedia) {
            throw '2nd argument is not instance of MediaStreamTrack.';
        }
    } else if (!(mediaStreamTrack instanceof MediaStreamTrack) && !!navigator.mozGetUserMedia) {
        throw '1st argument is not instance of MediaStreamTrack.';
    }

    var globalObject = {
        audio: {},
        video: {}
    };

    var nomore = false;

    (function getPrivateStats() {
        _getStats(function(results) {
            var result = {
                audio: {},
                video: {},
                results: results,
                nomore: function() {
                    nomore = true;
                }
            };

            for (var i = 0; i < results.length; ++i) {
                var res = results[i];

                if(res.datachannelid && res.type === 'datachannel') {
                    result.datachannel = {
                        state: res.state // open or connecting
                    }
                }

                if(res.type === 'googLibjingleSession') {
                    result.isOfferer = res.googInitiator;
                }

                if(res.type == 'googCertificate') {
                    result.encryption = res.googFingerprintAlgorithm;
                }

                if (res.googCodecName == 'opus' && res.bytesSent) {
                    var kilobytes = 0;
                    if(!!res.bytesSent) {
                        if (!globalObject.audio.prevBytesSent) {
                            globalObject.audio.prevBytesSent = res.bytesSent;
                        }

                        var bytes = res.bytesSent - globalObject.audio.prevBytesSent;
                        globalObject.audio.prevBytesSent = res.bytesSent;

                        kilobytes = bytes / 1024;
                    }

                    if(!result.audio) {
                        result.audio = res;
                    }
                    
                    result.audio.availableBandwidth = kilobytes.toFixed(1);
                }

                if (res.googCodecName == 'VP8') {
                    // if(!globalObject.)
                    // bytesReceived
                    // packetsReceived
                    // timestamp
                    var kilobytes = 0;
                    if(!!res.bytesSent) {
                        if (!globalObject.video.prevBytesSent) {
                            globalObject.video.prevBytesSent = res.bytesSent;
                        }

                        var bytes = res.bytesSent - globalObject.video.prevBytesSent;
                        globalObject.video.prevBytesSent = res.bytesSent;

                        kilobytes = bytes / 1024;
                    }

                    if(!result.video) {
                        result.video = res;
                    }

                    result.video.availableBandwidth = kilobytes.toFixed(1);

                    if(res.googFrameHeightReceived && res.googFrameWidthReceived) {
                        result.resolutions = {
                            width: res.googFrameWidthReceived,
                            height: res.googFrameHeightReceived
                        };
                    }
                }

                if (res.type == 'VideoBwe') {
                    result.video.bandwidth = {
                        googActualEncBitrate: res.googActualEncBitrate,
                        googAvailableSendBandwidth: res.googAvailableSendBandwidth,
                        googAvailableReceiveBandwidth: res.googAvailableReceiveBandwidth,
                        googRetransmitBitrate: res.googRetransmitBitrate,
                        googTargetEncBitrate: res.googTargetEncBitrate,
                        googBucketDelay: res.googBucketDelay,
                        googTransmitBitrate: res.googTransmitBitrate
                    };
                }

                // res.googActiveConnection means either STUN or TURN is used.

                if (res.type == 'googCandidatePair' && res.googActiveConnection == 'true') {
                    result.connectionType = {
                        local: {
                            candidateType: res.googLocalCandidateType,
                            ipAddress: res.googLocalAddress
                        },
                        remote: {
                            candidateType: res.googRemoteCandidateType,
                            ipAddress: res.googRemoteAddress
                        },
                        transport: res.googTransportType
                    };
                }

                var systemNetworkType = ((navigator.connection || {}).type || 'unknown').toString().toLowerCase();

                if(res.type === 'localcandidate') {
                    if(!result.connectionType) {
                        result.connectionType = {};
                    }

                    result.connectionType.local = {
                        candidateType: res.candidateType,
                        ipAddress: res.ipAddress + ':' + res.portNumber,
                        networkType: res.networkType/* || systemNetworkType */ || 'unknown',
                        transport: res.transport
                    }
                }

                if(res.type === 'remotecandidate') {
                    if(!result.connectionType) {
                        result.connectionType = {};
                    }
                    
                    result.connectionType.local = {
                        candidateType: res.candidateType,
                        ipAddress: res.ipAddress + ':' + res.portNumber,
                        networkType: res.networkType || systemNetworkType,
                        transport: res.transport
                    }
                }
            }

            try {
                if(peer.iceConnectionState.search(/failed|closed/gi) !== -1) {
                    nomore = true;
                }
            }
            catch(e) {
                nomore = true;
            }

            if(nomore === true) {
                if(result.datachannel) {
                    result.datachannel.state = 'close';
                }
                result.ended = true;
            }

            callback(result);

            // second argument checks to see, if target-user is still connected.
            if (!nomore) {
                typeof interval != undefined && interval && setTimeout(getPrivateStats, interval || 1000);
            }
        });
    })();

// a wrapper around getStats which hides the differences (where possible)
// following code-snippet is taken from somewhere on the github
function _getStats(cb) {
    // if !peer or peer.signalingState == 'closed' then return;
    webrtcdev.log( "peer " , peer);
    if(!peer.getStats()) return;

    if (!!navigator.mozGetUserMedia) {
        peer.getStats(
            mediaStreamTrack,
            function(res) {
                var items = [];
                res.forEach(function(result) {
                    items.push(result);
                });
                cb(items);
            },
            cb
        );
    } else {
        peer.getStats(function(res) {
            var items = [];
            res.result().forEach(function(result) {
                var item = {};
                result.names().forEach(function(name) {
                    item[name] = result.stat(name);
                });
                item.id = result.id;
                item.type = result.type;
                item.timestamp = result.timestamp;
                items.push(item);
            });
            cb(items);
        });
    }
};
}

function merge(mergein, mergeto) {
    if (!mergein) mergein = {};
    if (!mergeto) return mergein;

    for (var item in mergeto) {
        mergein[item] = mergeto[item];
    }
    return mergein;
}

if (typeof module !== 'undefined'/* && !!module.exports*/) {
    module.exports = getStats;
}

if(typeof window !== 'undefined') {
    window.getStats = getStats;
}



function activateBandwidthButtons(timerobj){
    if(document.getElementById("minimizeBandwidthButton")){
        var button= document.getElementById("minimizeBandwidthButton");
        button.onclick=function(e){
            if(document.getElementById("bandwidthContainer").hidden)
                document.getElementById("bandwidthContainer").hidden=false;
            else
                document.getElementById("bandwidthContainer").hidden=true;
        }  
    }
}

/**
 * shows status of ongoing webrtc call
 * @method
 * @name showStatus
 * @param {obj} conn
 */
function showStatus(conn){

    getStats(rtcConn, function(result) {
        alert("getstats Result");
        webrtcdev.log(result.connectionType.remote.ipAddress);
        webrtcdev.log(result.connectionType.remote.candidateType);
        webrtcdev.log(result.connectionType.transport);
    });

    alert( "got stats " , result.connectionType.transport);
    webrtcdev.log("WebcallPeers " , webcallpeers);
}


function rtpstats(){
    for( x in rtcConn.peers.getAllParticipants){
        let arg = JSON.stringify(rtcConn.peer[x], undefined, 2);
        document.getElementById("network-stats-body").innerHTML += "<pre >"+ arg + "</pre>";        
    }

}

function showRtcConn(){
    webrtcdev.log(" rtcConn : "  , rtcConn);
    webrtcdev.log(" rtcConn.peers.getAllParticipants() : " , rtcConn.peers.getAllParticipants());
}

/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  */'use strict';

// var inherits = require('util').inherits;
// var EventEmitter = require('events').EventEmitter;

/**************************************************************************************
        peerconnection 
****************************************************************************/

try{

    var RTCPeerConnection = null;
    var webrtcDetectedBrowser = null;
    var webrtcDetectedVersion = null;
    /*var usersList       = document.getElementById("userslist");
    var numbersOfUsers  = document.getElementById("numbersofusers");
    var usersContainer  = document.getElementById("usersContainer");*/
    var tempuserid ;
    var sessions = {};

    //instantiates event emitter
    // EventEmitter.call(this);

    /**
     * Represents a webrtc dom startup.
     * @constructor
     * @param {json} _localObj - local object.
     * @param {json} _remoteObj - remote object.
     * @param {json} incoming - incoming media stream.
     * @param {json} outgoing - outgoing media stream.
     */
    var WebRTCdom= function(  _localObj , _remoteObj , incoming, outgoing){

        if(incoming){
            incomingAudio = incoming.audio ; 
            incomingVideo = incoming.video ; 
            incomingData  = incoming.data  ;  
        }

        var detectRTC = DetectRTC;
        webrtcdev.log(" [ startJS webrtcdom ] : DetectRTC " , detectRTC);
        
        checkDevices(detectRTC);
        checkWebRTCSupport(detectRTC);

        // Cases around webcam malfunctiojn or absense 
        if(!detectRTC.hasWebcam){
            shownotification(" Your browser doesnt have webcam" , "warning");
            outgoing.video = false;
        }
        if(!detectRTC.isWebsiteHasWebcamPermissions){
            shownotification(" Your browser doesnt have permission for accessing webcam", "warning");
            outgoing.video = false;
        }
        
        //Cases around Miceohone malfunction or absense 
        if(!detectRTC.hasMicrophone){
            shownotification(" Your browser doesnt have microphone", "warning");   
            outgoing.audio = false ;
        }
        
        if(!DetectRTC.isWebsiteHasMicrophonePermissions){
            shownotification(" Your browser doesnt have permission for accessing microphone", "warning");
            outgoing.audio = false;
        }
        
        if(!DetectRTC.hasSpeakers){
            shownotification(" Your browser doesnt have speakers", "warning");      
        }

        if(outgoing){
            outgoingAudio = outgoing.audio ; 
            outgoingVideo = outgoing.video ; 
            outgoingData  = outgoing.data ;
        }

        /* When user is single */
        localobj=_localObj;
        localVideo = localobj.video;

        /* when user is in conference */
        remoteobj=_remoteObj;
        var _remotearr=_remoteObj.videoarr;

        /* first video container in remotearr belonsg to user */
        if(outgoingVideo){
            selfVideo = _remotearr[0];
        }

        /* create arr for remote peers videos */
        if(!remoteobj.dynamicVideos){
            for(var x=1;x<_remotearr.length;x++){
                remoteVideos.push(_remotearr[x]);    
            }
        }

        if(localobj.hasOwnProperty('userdetails')){
            webrtcdev.info("localobj userdetails " , localobj.userdetails);
            selfusername = (localobj.userdetails.username  == undefined ? "LOCAL": localobj.userdetails.username);
            selfcolor    = (localobj.userdetails.usercolor == undefined ? "orange": localobj.userdetails.usercolor);
            selfemail    = (localobj.userdetails.useremail == undefined ? "unknown": localobj.userdetails.useremail);
            role         = (localobj.userdetails.role  == undefined ? "participant": localobj.userdetails.role);
        }

        if(remoteobj.hasOwnProperty('userdetails')){
            webrtcdev.info("remoteobj userdetails " , remoteobj.userdetails);
            remoteusername = (remoteobj.userdetails.username  == undefined ? "REMOTE": remoteobj.userdetails.username);
            remotecolor    = (remoteobj.userdetails.usercolor == undefined ? "orange": remoteobj.userdetails.usercolor);
            remoteemail    = (remoteobj.userdetails.useremail == undefined ? "unknown": remoteobj.userdetails.useremail);
        }

    };

    /**
     * Assigns ICE gateways and  widgets 
     * @constructor
     * @param {json} session - session object.
     * @param {json} widgets - widgets object.
     */
    var WebRTCdev= function(session, widgets){
        try{
            sessionid  = session.sessionid;
            socketAddr = session.socketAddr;
            webrtcdev.log("WebRTCdev --> widgets ", widgets , " || Session " , session);
        }catch(e){
            webrtcdev.error(e);
            alert(" Session object doesnt have all parameters ");
        }

        try{
            turn    = (session.hasOwnProperty('turn')?session.turn:null);
            if(turn!=null && turn !="none"){
                getICEServer( turn.username ,turn.secretkey , turn.domain,
                                turn.application , turn.room , turn.secure); 
            }
        }catch(e){
            webrtcdev.error(e);
            alert(" cannot get TURN ");
        }

        if(widgets){

            if(widgets.debug)           debug           = widgets.debug || false;

            if(widgets.chat)            chatobj         = widgets.chat || null;

            if(widgets.fileShare)       fileshareobj    = widgets.fileShare || null;

            if(widgets.screenrecord)    screenrecordobj = widgets.screenrecord || null;

            if(widgets.screenshare)     screenshareobj  = widgets.screenshare || null;

            if(widgets.snapshot)        snapshotobj     = widgets.snapshot || null;

            if(widgets.videoRecord)     videoRecordobj  = widgets.videoRecord || null;

            if(widgets.reconnect)       reconnectobj    = widgets.reconnect || null;

            if(widgets.drawCanvas)      drawCanvasobj   = widgets.drawCanvas || null;

            if(widgets.texteditor)      texteditorobj   = widgets.texteditor || null;

            if(widgets.codeeditor)      codeeditorobj   = widgets.codeeditor || null;

            if(widgets.mute)            muteobj         = widgets.mute || null;

            if(widgets.timer)           timerobj        = widgets.timer || null;

            if(widgets.listenin)        listeninobj     = widgets.listenin || null;

            if(widgets.cursor)          cursorobj       = widgets.cursor || null;

            if(widgets.minmax)          minmaxobj       = widgets.minmax || null;

            if(widgets.help)            helpobj          = widgets.help || null;

            if(widgets.statistics)      statisticsobj     = widgets.statistics || null;
        }

        return {
            sessionid : sessionid,
            socketAddr: socketAddr,
            turn : turn,
            widgets  : widgets,
            startwebrtcdev: function (widgets) {
                var p = new Promise(function (resolve, reject) {
                    rtcConn = new RTCMultiConnection();

                    if (turn != 'none') {
                        if (!webrtcdevIceServers) {
                            return;
                        }
                        webrtcdev.info(" WebRTC dev ICE servers ", webrtcdevIceServers);
                        rtcConn.iceServers = webrtcdevIceServers;
                        window.clearInterval(repeatInitilization);
                    }

                    tempuserid = rtcConn.userid;
                })
                .then(setRtcConn())
                .then(
                    detectExtension(screenshareobj.extensionID, function (status) {
                        extensioninstalled = status;
                        webrtcdev.log("is extension installed  ? ", extensioninstalled);

                        if (extensioninstalled == 'not-installed') {
                            createExtensionInstallWindow();
                        }
                        setWidgets();
                        startSession(rtcConn, socketAddr,  sessionid);
                    })
                )
                .catch(function (err) {
                    webrtcdev.error(" Promise rejected " , err);
                });
            },
            rtcConn : rtcConn
        };
    };

    /*
    set Rtc connection
    */
    var setRtcConn = function () {
        return new Promise(function (resolve, reject) {

            rtcConn.connectionType = null,
                rtcConn.remoteUsers = [],

                rtcConn.extra = {
                    uuid: tempuserid,
                    name: localobj.userdetails.username,
                    color: localobj.userdetails.usercolor,
                    email: localobj.userdetails.useremail
                },

                rtcConn.channel = sessionid,
                rtcConn.socketURL = "/",
                rtcConn.socketMessageEvent = 'RTCMultiConnection-Message',
                rtcConn.socketCustomEvent = 'RTCMultiConnection-Custom-Message',

                rtcConn.enableFileSharing = true,
                rtcConn.filesContainer = document.body || document.documentElement,

                rtcConn.dontCaptureUserMedia = true,

                rtcConn.onNewParticipant = function (participantId, userPreferences) {
                    webrtcdev.log("onNewParticipant", participantId, userPreferences);
                    shownotification(remoteusername + " requests new participantion ");
                    if (webcallpeers.length <= remoteobj.maxAllowed) {
                        updatePeerInfo(participantId, remoteusername, remotecolor, "", "role", "remote");
                    } else {
                        shownotification("Another user is trying to join this channel but max count [ " + remoteobj.maxAllowed + " ] is reached", "warning");
                    }
                    rtcConn.acceptParticipationRequest(participantId, userPreferences);
                },

                rtcConn.onopen = function (event) {
                    webrtcdev.log("rtcconn oopen " + rtcConn.connectionType);
                    try {
                        if (rtcConn.connectionType == "open")
                            connectWebRTC("open", sessionid, selfuserid, []);
                        else if (rtcConn.connectionType == "join")
                            connectWebRTC("join", sessionid, selfuserid, rtcConn.remoteUsers);
                        else
                            shownotification("connnection type is neither open nor join", "warning");

                        if (timerobj && timerobj.active) {
                            startsessionTimer(timerobj);
                            shareTimePeer();
                        }
                        shownotification(event.extra.name + " joined session ", "info");
                        showdesktopnotification();
                        
                        onSessionConnect();
                        //eventEmitter.emit('sessionconnected');        // Call Function just in case the client is implementing this
                    } catch (e) {
                        shownotification("problem in on session open "+ e.message, "warning");
                        webrtcdev.error("problem in on session open", e);
                    }
                },

                rtcConn.onMediaError = function (error, constraints) {
                    webrtcdev.error("[startJS onMediaError] ", error, constraints);
                    shownotification(error.name + " Joining without camera Stream ", "warning");

                    // For local Peer , if cemars is nott allowed or not connected then put null in video containers 
                    //for(x in webcallpeers){
                        //if(!webcallpeers[x].stream &&  !webcallpeers[x].streamid){
                            var peerinfo = webcallpeers[0];
                            peerinfo.type = "Local";
                            peerinfo.stream = null;
                            peerinfo.streamid = "nothing01";
                            updateWebCallView(peerinfo);
                        //}
                    //}
                },

                rtcConn.onstream = function (event) {
                    webrtcdev.log("[startJs on stream ] on stream Started event ", event);
                    /*                  
                    var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
                    var mediaElement = getMediaElement(event.mediaElement, {
                        title: event.userid,
                        buttons: ['full-screen'],
                        width: width,
                        showOnMouseEnter: false
                    });
                    connection.videosContainer.appendChild(mediaElement);
                    setTimeout(function() {
                        mediaElement.media.play(); 
                    }, 5000);
                    mediaElement.id = event.streamid;*/
                    var peerinfo = findPeerInfo(event.userid);
                    if (!peerinfo) {
                        webrtcdev.error(" PeerInfo not present in webcallpeers ", event.userid, rtcConn);
                        shownotification(" Cannot create session for Peer", "critical");
                    } else {
                        peerinfo.type = event.type;
                        peerinfo.stream = event.stream;
                        peerinfo.streamid = event.stream.streamid;
                        updateWebCallView(peerinfo);
                        webrtcdev.log(" On streamEnded event ", event.stream.getVideoTracks()  , event.stream.getAudioTracks());
                        // alert( "Media stream tracks " , webcallpeers[0].stream.getVideoTracks());
                    }

                    rtpstats();
                },

                rtcConn.onstreamended = function (event) {
                    webrtcdev.log(" On streamEnded event ", event);
                    var mediaElement = document.getElementById(event.streamid);
                    if (mediaElement) {
                        mediaElement.parentNode.removeChild(mediaElement);
                    }
                },

                rtcConn.chunkSize = 50 * 1000,

                rtcConn.onmessage = function (e) {
                    webrtcdev.log(" on message ", e);
                    if (e.data.typing) {
                        updateWhotyping(e.extra.name + " is typing ...");
                    } else if (e.data.stoppedTyping) {
                        updateWhotyping("");
                    } else {
                        switch (e.data.type) {
                            case "screenshare":

                                if (e.data.message == "stoppedscreenshare") {
                                    shownotification("Screenshare has stopped : " + e.data.screenStreamid);
                                    //createScreenViewButton();
                                    var button = document.getElementById(screenshareobj.button.shareButton.id);
                                    button.className = screenshareobj.button.shareButton.class_off;
                                    button.innerHTML = screenshareobj.button.shareButton.html_off;
                                    button.disabled = false;

                                    scrConn.onstreamended();
                                    scrConn.removeStream(e.data.screenStreamid);
                                    scrConn.close();
                                } else if (e.data.message == "screenshareStartedViewing") {
                                    screenshareNotification("", "screenshareStartedViewing");
                                } else {
                                    shownotification("screen is getting shared " + e.data.screenid);
                                    //createScreenViewButton();
                                    var button = document.getElementById(screenshareobj.button.shareButton.id);
                                    button.className = screenshareobj.button.shareButton.class_busy;
                                    button.innerHTML = screenshareobj.button.shareButton.html_busy;
                                    button.disabled = true;

                                    screenRoomid = e.data.screenid;
                                    var selfuserid = "temp_" + (new Date().getUTCMilliseconds());
                                    webrtcdevPrepareScreenShare(function (screenRoomid) {
                                        //scrConn.join(screenRoomid);  
                                        connectScrWebRTC("join", screenRoomid, selfuserid, []);
                                    });
                                }

                                break;
                            case "chat":
                                updateWhotyping(e.extra.name + " has send message");
                                /*var userinfo;
                                try{
                                    userinfo=getUserinfo(rtcConn.blobURLs[e.userid], "chat-message.png");
                                }catch(e){
                                    userinfo="empty";
                                }*/
                                addNewMessage({
                                    header: e.extra.name,
                                    message: e.data.message,
                                    userinfo: e.data.userinfo,
                                    color: e.extra.color
                                });
                                break;
                            case "imagesnapshot":
                                var peerinfo = findPeerInfo(e.userid);
                                displayList(null, peerinfo, e.data.message, e.data.name, "imagesnapshot");
                                displayFile(null, peerinfo, e.data.message, e.data.name, "imagesnapshot");
                                break;
                            case "videoRecording":
                                var peerinfo = findPeerInfo(e.userid);
                                displayList(null, peerinfo, e.data.message, e.data.name, "videoRecording");
                                displayFile(null, peerinfo, e.data.message, e.data.name, "videoRecording");
                                break;
                            case "videoScreenRecording":
                                var peerinfo = findPeerInfo(e.userid);
                                displayList(null, peerinfo, e.data.message, e.data.name, "videoScreenRecording");
                                displayFile(null, peerinfo, e.data.message, e.data.name, "videoScreenRecording");
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
                                startPeersTime(e.data.time, e.data.zone);
                                break;
                            case "buttonclick":
                                var buttonElement = document.getElementById(e.data.buttonName);
                                if (buttonElement.getAttribute("lastClickedBy") != rtcConn.userid) {
                                    buttonElement.setAttribute("lastClickedBy", e.userid);
                                    buttonElement.click();
                                }
                                break;
                            case "syncOldFiles":
                                sendOldFiles();
                                break;
                            default:
                                webrtcdev.warn(" unrecognizable message from peer  ", e);
                                break;
                        }
                    }
                    return;
                },

                rtcConn.sendMessage = function (event) {
                    webrtcdev.log(" sendMessage ", event);
                    event.userid = rtcConn.userid,
                    event.extra = rtcConn.extra,
                    rtcConn.sendCustomMessage(event)
                },

                rtcConn.onleave = function (e) {
                    /*
                    addNewMessage({
                        header: e.extra.name,
                        message: e.extra.name + " left session.",
                        userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "info.png"),
                        color: e.extra.color
                    }), */

                    var peerinfo = findPeerInfo(e.userid) ;

                    webrtcdev.log(" RTCConn onleave user", e , " his peerinfo " , peerinfo , " rom webcallpeers " , webcallpeers );
                    if (e.extra.name != "undefined")
                        shownotification(e.extra.name + "  left the conversation.");
                    //rtcConn.playRoleOfInitiator()
                    
                    /*if(peerinfo){
                        destroyWebCallView(peerinfo, function (result) {
                            if (result)
                                removePeerInfo(e.userid);
                        });
                    }*/
                    //eventEmitter.emit('sessiondisconnected', peerinfo);
                },

                rtcConn.onclose = function (e) {
                    webrtcdev.log(" RTCConn on close conversation ", e);
                    /*alert(e.extra.name + "closed ");*/
                },

                rtcConn.onEntireSessionClosed = function (event) {
                    rtcConn.attachStreams.forEach(function (stream) {
                        stream.stop();
                    });
                    alert(" Entire Session Disconneted ");
                    //eventEmitter.emit('sessiondisconnected', '');
                },

                rtcConn.onFileStart = function (file) {
                    webrtcdev.log("[start] on File start " + file.name);
                    webrtcdev.log("file description ", file);

                    var peerinfo = findPeerInfo(file.userid);
                    if(peerinfo && peerinfo.role =="inspector") return;
                    addProgressHelper(file.uuid, peerinfo, file.name, file.maxChunks, "fileBoxClass");
                },

                rtcConn.onFileProgress = function (e) {
                    webrtcdev.log("[start] on File progress ", e);
                    try{
                        var r = progressHelper[e.uuid];
                        r && (r.progress.value = e.currentPosition || e.maxChunks || r.progress.max, updateLabel(r.progress, r.label));
                    }catch(e){
                        webrtcdev.error(" Prolem in progressHelper " , e);
                    }
                },

                rtcConn.onFileEnd = function (file) {
                    var filename = file.name
                    webrtcdev.log("[start] On file End " + filename);

                    //find duplicate file
                    for(x in webcallpeers){
                        for (y in webcallpeers[x].filearray){
                            webrtcdev.log(" Duplicate find , Files shared  so far " , webcallpeers[x].filearray[y].name);

                            if(webcallpeers[x].filearray[y].name==filename){
                                //discard file as duplicate
                                webrtcdev.error("duplicate file shared ");
                                return;
                            }
                        }
                    }

                    var peerinfo = findPeerInfo(file.userid);
                    if (peerinfo != null)  peerinfo.filearray.push(file);
                    displayFile(file.uuid, peerinfo, file.url, filename, file.type);
                    displayList(file.uuid, peerinfo, file.url, filename, file.type);
                },

                rtcConn.takeSnapshot = function (userid, callback) {
                    takeSnapshot({
                        userid: userid,
                        connection: connection,
                        callback: callback
                    });
                };
                webrtcdev.log(" RTCConn : ", rtcConn);
                resolve("success");
            });
    }

    /**
     * set Widgets.
     */
    var setWidgets = function () {

            var widgetsinstalled = false;

            if (chatobj.active) {

                if (chatobj.inputBox && chatobj.inputBox.text_id && document.getElementById(chatobj.inputBox.text_id)) {
                    webrtcdev.log("Assign chat Box ");
                    assignChatBox(chatobj);
                } else {
                    webrtcdev.log("Create chat Box ");
                    createChatBox(chatobj);
                }
                webrtcdev.log("chat widget loaded ");
            } else {
                webrtcdev.log(" chat widget not loaded ");
            }

            if (screenrecordobj && screenrecordobj.active) {

                if (extensioninstalled == 'installed-enabled') {
                    if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                        webrtcdev.log("Assign Record Button ");
                        assignScreenRecordButton(screenrecordobj);
                    } else {
                        webrtcdev.log("Create Record Button ");
                        createScreenRecordButton(screenrecordobj);
                    }
                }

                if (extensioninstalled == 'installed-disabled') {
                    shownotification("chrome extension is installed but disabled." , "warning");
                    if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                        assignScreenRecordButton(screenrecordobj);
                        webrtcdev.log("Assign Record Button ");
                    } else {
                        webrtcdev.log("Create Record Button ");
                        createScreenRecordButton(screenrecordobj);
                    }
                }

                if (extensioninstalled == 'not-installed') {
                    //nor installed show installation button 
                    shownotification(" Sessions recoridng cannot start as there is not extension installed ", "warning");
                }

                if (extensioninstalled == 'not-chrome') {
                    // using non-chrome browser
                }
                webrtcdev.log(" screen record widget loaded ");
            } else if (screenrecordobj && !screenrecordobj.active) {
                if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                    document.getElementById(screenrecordobj.button.id).className = "inactiveButton";
                }
                webrtcdev.log(" screen record widget not loaded ");
            }

            if (screenshareobj.active) {

                if (extensioninstalled == 'installed-enabled') {
                    var screenShareButton = createOrAssignScreenshareButton(screenshareobj);
                    hideScreenInstallButton();
                }

                if (status == 'installed-disabled') {
                    shownotification("chrome extension is installed but disabled.");
                    var screenShareButton = createOrAssignScreenshareButton(screenshareobj);
                    hideScreenInstallButton();
                }

                if (status == 'not-installed') {

                    //document.getElementById("screensharedialog").showModal();
                    $("#screensharedialog").modal("show");

                    hideScreenShareButton();

                    if (screenshareobj.button.installButton.id && document.getElementById(screenshareobj.button.installButton.id)) {
                        assignScreenInstallButton(screenshareobj.extensionID);
                    } else {
                        createScreenInstallButton(screenshareobj.extensionID);
                    }
                }

                if (status == 'not-chrome') {
                    // using non-chrome browser
                    alert(" Screen share extension only works in Chrome for now ");
                }

                webrtcdev.log(" screen share widget loaded ");
            } else {
                webrtcdev.log(" screen share widget not loaded ");
            }

            if (reconnectobj && reconnectobj.active) {
                if (reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                    webrtcdev.log("Rconnect Button Assigned");
                    assignButtonRedial(reconnectobj.button.id);
                } else {
                    webrtcdev.log("Rconnect Button created");
                    createButtonRedial(reconnectobj);
                }
                webrtcdev.log(" reconnect widget loacded ");
            } else if (reconnectobj && !reconnectobj.active) {
                if (reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                    document.getElementById(reconnectobj.button.id).className = "inactiveButton";
                }
                webrtcdev.log(" reconnect widget not loaded ");
            }

            if (cursorobj.active) {
                document.getElementById("cursor1").setAttribute("style", "display:none");
                document.getElementById("cursor2").setAttribute("style", "display:none");
            }

            if (listeninobj && listeninobj.active) {
                if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                    //assignButtonRedial(reconnectobj.button.id);
                } else {
                    //createButtonRedial();
                }
                webrtcdev.log(" listen in widget loaded ");
            } else if (listeninobj && !listeninobj.active) {
                if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                    document.getElementById(listeninobj.button.id).className = "inactiveButton";
                }
                webrtcdev.log(" listenein widget not loaded ");
            }

            if (timerobj && timerobj.active) {
                //startTime();
                timeZone();
                activateBttons(timerobj);
                document.getElementById(timerobj.container.id).hidden = true;
            } else if (timerobj && !timerobj.active) {
                if (timerobj.button.id && document.getElementById(timerobj.button.id)) {
                    document.getElementById(timerobj.button.id).className = "inactiveButton";
                }
            }

            if (drawCanvasobj && drawCanvasobj.active) {
                if (drawCanvasobj.container && drawCanvasobj.container.id && document.getElementById(drawCanvasobj.container.id)) {
                    document.getElementById(drawCanvasobj.container.id).hidden = true;
                }
                if (drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                    assigndrawButton(drawCanvasobj);
                } else {
                    createdrawButton(drawCanvasobj);
                }

                CanvasDesigner = (function () {
                    var iframe;
                    var tools = {
                        line: true,
                        pencil: true,
                        dragSingle: true,
                        dragMultiple: true,
                        eraser: true,
                        rectangle: true,
                        arc: true,
                        bezier: true,
                        quadratic: true,
                        text: true
                    };

                    var selectedIcon = 'pencil';

                    function syncData(data) {
                        if (!iframe) return;

                        iframe.contentWindow.postMessage({
                            canvasDesignerSyncData: data
                        }, '*');
                    }

                    var syncDataListener = function (data) {
                        webrtcdev.log("syncDataListener", data);
                    };

                    function onMessage() {
                        if (!event.data || !event.data.canvasDesignerSyncData) return;
                        syncDataListener(event.data.canvasDesignerSyncData);
                    }

                    /*window.addEventListener('message', onMessage, false);*/

                    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                    var eventer = window[eventMethod];
                    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                    // Listen to message from child window
                    eventer(messageEvent, function (e) {
                        webrtcdev.log("CanvasDesigner parent received message : ", e.data);

                        if (e.data.modalpopup) {
                            saveButtonCanvas.click();
                            return;

                        } else if (e.data || e.data.canvasDesignerSyncData) {
                            syncDataListener(e.data.canvasDesignerSyncData);
                        }

                        if (!e.data || !e.data.canvasDesignerSyncData) {
                            webrtcdev.log("parent received unexpected message");
                            return;
                        }


                    }, false);

                    return {
                        appendTo: function (parentNode) {
                            iframe = document.createElement('iframe');
                            iframe.id = "drawboard";
                            iframe.src = 'widget.html?tools=' + JSON.stringify(tools) + '&selectedIcon=' + selectedIcon;
                            iframe.style.width = "100%";
                            iframe.style.height = "100%";
                            iframe.style.border = 0;
                            parentNode.appendChild(iframe);
                        },
                        destroy: function () {
                            if (iframe) {
                                iframe.parentNode.removeChild(iframe);
                            }
                            window.removeEventListener('message', onMessage);
                        },
                        addSyncListener: function (callback) {
                            syncDataListener = callback;
                        },
                        syncData: syncData,
                        setTools: function (_tools) {
                            tools = _tools;
                        },
                        setSelected: function (icon) {
                            if (typeof tools[icon] !== 'undefined') {
                                selectedIcon = icon;
                            }
                        }
                    };
                })();
                webrtcdev.log(" draw widget loaded ");
            } else if (drawCanvasobj && !drawCanvasobj.active) {
                if (drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                    document.getElementById(drawCanvasobj.button.id).className = "inactiveButton";
                }
                webrtcdev.log(" draw widget not loaded ");
            }

            if (texteditorobj.active) {
                createTextEditorButton();
            }

            if (codeeditorobj.active) {
                createCodeEditorButton();
            }

            if (fileshareobj.active) {
                rtcConn.enableFileSharing = true;
                //rtcConn.filesContainer = document.body || document.documentElement;
                /*setFileProgressBarHandlers(rtcConn);*/
                rtcConn.filesContainer = document.getElementById(fileshareobj.fileShareContainer);
                if (fileshareobj.button.id && document.getElementById(fileshareobj.button.id)) {
                    assignFileShareButton(fileshareobj);
                } else {
                    createFileShareButton(fileshareobj);
                }
                webrtcdev.log(" File sharing widget loaded ");
            } else {
                webrtcdev.log(" File sharing widget not loaded ");
            }

            if(statisticsobj && statisticsobj.active){
                try{
                    document.getElementById(statisticsobj.statsConainer).innerHTML="";
                }catch(e){
                    webrtcdev.error(" statisticsobj statsConainer not found" , e );
                }
            }
            
            if(helpobj && helpobj.active){
                try{
                    document.getElementById(helpobj.helpContainer).innerHTML="";
                }catch(e){
                    webrtcdev.error(" helpobj helpContainer not found" , e );
                }
            }

            widgetsinstalled = true;
            
            return widgetsinstalled;
    }


    /**
     * function to start session with socket
     * @method
     * @name startSession
     * @param {object} connection
     */
    function startSession(rtcConn , socketAddr , sessionid){

            webrtcdev.log("========== startSession" + sessionid);

            try {
                var addr = "/";
                if (socketAddr != "/") {
                    addr = socketAddr;
                }
                socket = io.connect(addr ,{
                                          transports: ['websocket']
                } );
               // socket.set('log level', 3);

            } catch (e) {
                webrtcdev.error(" problem in socket connnection", e);
                alert(" problem in socket connnection");
            }

            if (sessionid){
                shownotification(" Checking status of  : " + sessionid);
                socket.emit("presence", {
                    channel: sessionid
                });

            } else{
                webrtcdev.error(" Session Id undefined ");
                alert("rtcCon channel / session id undefined ");
                return; 
            }

            socket.on("connect", function () {
                socket.on('disconnected', function () {
                    shownotification("Disconnected from signaller ");
                });
            });

            socket.on("presence", function (event) {
                webrtcdev.log("PRESENCE -----------> ", event);
                event ? joinWebRTC(sessionid, selfuserid) : openWebRTC(sessionid, selfuserid);
            });

            socket.on("open-channel-resp", function (event) {
                webrtcdev.log("========================== opened-channel", event, event.status, event.channel == sessionid);
                if (event.status && event.channel == sessionid) {
                    try {

                        webrtcdev.log(" [open-channel-resp ] Session video:" ,  outgoingVideo,
                            " audio: " , outgoingAudio ,
                            " data: " , outgoingData , 
                            " OfferToReceiveAudio: " , incomingAudio,
                            " OfferToReceiveVideo: " , incomingVideo
                        );

                        rtcConn.connectionType = "open",

                        rtcConn.session = {
                            video: outgoingVideo,
                            audio: outgoingAudio,
                            data: outgoingData
                        },

                        rtcConn.sdpConstraints.mandatory = {
                            OfferToReceiveAudio: incomingAudio,
                            OfferToReceiveVideo: incomingVideo
                        },

                        rtcConn.open(event.channel, function () {

                            if (selfuserid == null) {
                                selfuserid = rtcConn.userid;

                                if (tempuserid != selfuserid)
                                    socket.emit("update-channel", {
                                        type: "change-userid",
                                        channel: rtcConn.channel,
                                        sender: selfuserid,
                                        extra: {
                                            old: tempuserid,
                                            new: selfuserid
                                        }
                                    });
                            }

                            updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, "role" , "local");
                            webrtcdev.info(" Trying to open a channel on WebRTC SDP ");
                            if(outgoingVideo){
                                rtcConn.dontCaptureUserMedia = false,
                                rtcConn.getUserMedia();
                            }else{
                                webrtcdev.error(" [startJS open-channel-resp] dont Capture outgoing video " , outgoingVideo);
                            }
                        });
                    } catch (e) {
                        webrtcdev.error(e);
                    }

                } else {
                    alert(" signaller doesnt allow channel open");
                }
            });

            socket.on("join-channel-resp", function (event) {
                webrtcdev.log("=========================== joined-channel", event);
                if (event.status && event.channel == sessionid) {
                    
                    webrtcdev.log(" [ join-channel-resp ] Session video:" ,  outgoingVideo,
                        " audio: " , outgoingAudio ,
                        " data: " , outgoingData , 
                        " OfferToReceiveAudio: " , incomingAudio,
                        " OfferToReceiveVideo: " , incomingVideo
                    ); 

                    rtcConn.connectionType = "join",
                    rtcConn.session = {
                        video: outgoingVideo,
                        audio: outgoingAudio,
                        data: outgoingData
                    },
                    rtcConn.sdpConstraints.mandatory = {
                        OfferToReceiveAudio: incomingAudio,
                        OfferToReceiveVideo: incomingVideo
                    },
                    rtcConn.remoteUsers = event.users,
                    updatePeerInfo(rtcConn.userid, selfusername, selfcolor, selfemail, role, "local"); 

                    for (x in rtcConn.remoteUsers) {
                        updatePeerInfo(rtcConn.remoteUsers[x], remoteusername, remotecolor, remoteemail, "participant" , "remote");
                        if (role == "inspector") shownotificationWarning("This session is being inspected ");
                    }

                    rtcConn.connectionDescription = rtcConn.join(event.channel);

                    webrtcdev.log(" Trying to join a channel on WebRTC SDP ");

                    if(role != "inspector" && outgoingVideo){
                        rtcConn.dontCaptureUserMedia = false,
                        rtcConn.getUserMedia();
                    }else{
                        webrtcdev.error(" [startJS join-channel-resp] dont Capture outgoing video " , outgoingVideo);
                    }
                    
                } else {
                    shownotification(event.msgtype + " : " + event.message);
                }
            });

            socket.on("channel-event", function (event) {
                webrtcdev.log("channel-event", event);
                if (event.type == "new-join") {
                    if (event.status) {
                        var peerinfo = findPeerInfo(event.data.sender);
                        if (!peerinfo) {
                            if (event.data.extra.name == "LOCAL") {
                                event.data.extra.name = "REMOTE";
                                event.data.extra.color = remotecolor;
                            }
                            updatePeerInfo(event.data.sender, event.data.extra.name, event.data.extra.color, event.data.extra.email, event.data.extra.role , "remote");
                            shownotification( event.data.extra.role  + "  " +event.type);
                        }
                    } else {
                        shownotification(event.msgtype + " : " + event.message);
                    }
                }
            });
    }


    /**
     * Update local cache of user sesssion based object called peerinfo
     * @method
     * @name updateWebCallView
     * @param {json} peerInfo
     */
    function updateWebCallView(peerInfo){
        webrtcdev.log("updateWebCallView - start with peerInfo" , peerInfo , " || role is ", role , " ||  indexOf ", peerInfo.vid.indexOf("videoundefined") );
        try{
            switch(role){
                case "inspector":
                    var vi=0;
                    for(var v=0; v<remoteVideos.length; v++){
                        webrtcdev.log("Remote Video index array " , v , " || ", remoteVideos[v] , 
                            document.getElementsByName(remoteVideos[v])  , 
                            document.getElementsByName(remoteVideos[v]).src);
                        if(remoteVideos[v].src){
                            vi++;
                        }
                    }

                    var remvid;
                    var video = document.createElement('video');
                    //video.autoplay = "autoplay";
                    remoteVideos[vi] = video;
                    document.getElementById(remoteobj.videoContainer).appendChild(video);
                    remvid = remoteVideos[vi];

                    webrtcdev.log(" [start.js - updateWebCallView] inspector role , attaching stream" , remvid, peerInfo.stream );
                    attachMediaStream(remvid, peerInfo.stream);
                    if(remvid.hidden) removid.hidden = false;
                    remvid.id = peerInfo.videoContainer;
                    remvid.className = remoteobj.videoClass;
                    attachControlButtons(remvid, peerInfo); 

                    if(remoteobj.userDisplay && peerInfo.name ){
                        attachUserDetails( remvid, peerInfo); 
                    }
                    
                    if(remoteobj.userMetaDisplay && peerInfo.userid){
                        attachMetaUserDetails( remvid, peerInfo ); 
                    }

                    //Hide the unsed video for Remote
                    var _templ=document.getElementsByName(localVideo)[0];
                    _templ.setAttribute("style","display:none");
                    var _templ2=document.getElementsByName(selfVideo)[0];
                    _templ2.setAttribute("style","display:none");
                break;

                case "user":
                case "participant":

                    if(peerInfo.vid.indexOf("videolocal") > -1 ){
                        webrtcdev.info(" PeerInfo Vid is Local");

                        // when video is local

                        // hide the remote video conatiner and show the local video container
                        // as the user is single in room 
                        document.getElementById(localobj.videoContainer).style.display= null;
                        document.getElementById(remoteobj.videoContainer).style.display= "none";

                        if(localVideo && document.getElementsByName(localVideo)[0]){
                            var vid = document.getElementsByName(localVideo)[0];
                            vid.muted = true;
                            vid.className = localobj.videoClass;
                            attachMediaStream(vid, peerInfo.stream);

                            if(localobj.userDisplay && peerInfo.name)
                                attachUserDetails( vid, peerInfo ); 
                            
                            if(localobj.userMetaDisplay && peerInfo.userid)
                                attachMetaUserDetails( vid , peerInfo ); 

                            webrtcdev.info(" User is alone in the session  , hiding remote video container" , 
                            "showing users single video conrainer and attaching attachMediaStream and attachUserDetails ");

                        }else{
                            alert(" Please Add a video container in config for single");
                            webrtcdev.error(" No local video conatainer in localobj -> " , localobj);
                        }

                    } else if(peerInfo.vid.indexOf("videoremote") > -1) {
                        //when video is remote 
                        // hide the local video conagineer and how the remote video container
                        // user is joined with othe peers 
                        document.getElementById(localobj.videoContainer).style.display= "none";
                        document.getElementById(remoteobj.videoContainer).style.display= null;


                        /* handling local video transistion to active */
                        if( outgoingVideo && localVideo && selfVideo ){
                            /*chk if local video is added to conf , else adding local video to index 0 */
                            //localvid : video container before p2p session 
                            var localvid = document.getElementsByName(localVideo)[0];
                            // selfvid : local video in a p2p session
                            var selfvid = document.getElementsByName(selfVideo)[0];
                            
                            if(selfvid.played.length==0){
                                if(localvid.played.lebth>0){
                                    reattachMediaStream(selfvid, localvid);
                                }else{
                                    attachMediaStream(selfvid, webcallpeers[0].stream);
                                }
                                selfvid.id = webcallpeers[0].videoContainer;
                                selfvid.className = remoteobj.videoClass;
                                selfvid.muted = true;
                                attachControlButtons( selfvid, webcallpeers[0]); 

                                if(localobj.userDisplay && webcallpeers[0].name){
                                    attachUserDetails( selfvid, webcallpeers[0] );
                                } 

                                if(localobj.userMetaDisplay && webcallpeers[0].userid){
                                    attachMetaUserDetails( selfvid, webcallpeers[0] ); 
                                }
                            }else{
                                webrtcdev.log(" not uppdating self video as it is already playing ");
                            }

                            webrtcdev.info(" User is joined by a remote peer , hiding local video container" , 
                            "showing users conf video container and attaching attachMediaStream and attachUserDetails ");

                        }else if(!outgoingVideo){
                            webrtcdev.error(" Outgoing Local video is " , outgoingVideo);
                        }else{
                            alert(" Please Add a video container in config for video call ");
                            webrtcdev.error(" Local video container not defined ");
                        }


                        // handling remote video addition 
                        if(remoteVideos){

                            /*get the next empty index of video and pointer in remote video array */
                            var vi=0;
                            for(var v=0; v<remoteVideos.length; v++){
                                webrtcdev.log("Remote Video index array " , v , " || ", remoteVideos[v] , 
                                    document.getElementsByName(remoteVideos[v]),  document.getElementsByName(remoteVideos[v]).src);
                                if(document.getElementsByName(remoteVideos[v])[0] && document.getElementsByName(remoteVideos[v])[0].src){
                                    vi++;
                                }else if(remoteVideos[v].video && remoteVideos[v].video){
                                    vi++;
                                }
                            }

                            try{

                                if(remoteobj.maxAllowed=="unlimited"){
                                    webrtcdev.log("remote video is unlimited , creating video for remoteVideos array ");
                                    var video = document.createElement('video');
                                    //video.autoplay = "autoplay";
                                    remoteVideos[vi] = {
                                        "userid": peerInfo.userid, 
                                        "video" : video
                                    };
                                    document.getElementById(remoteobj.dynamicVideos.videoContainer).appendChild(video);
                                }else{
                                    webrtcdev.log("remote video is limited to size maxAllowed , current index ", vi);
                                    webrtcdev.log("searching for video with index ", vi , " in remote video : " , document.getElementsByName(remoteVideos[vi])[0] );
                                    if(document.getElementsByName(remoteVideos[vi])[0]){
                                        remoteVideos[vi] = { 
                                            "userid": peerInfo.userid, 
                                            "video" : document.getElementsByName(remoteVideos[vi])[0] 
                                        };
                                    }else{
                                        webrtcdev.error(" document.getElementsByName(remoteVideos[vi])[0] doest exist for vi " , vi);
                                    }
                                }

                                attachMediaStream(remoteVideos[vi].video, peerInfo.stream);
                                if(remoteVideos[vi].video.hidden) remoteVideos[vi].video.hidden = false;
                                remoteVideos[vi].video.id = peerInfo.videoContainer;
                                remoteVideos[vi].video.className = remoteobj.videoClass;
                                attachControlButtons(remoteVideos[vi].video, peerInfo); 

                                if(remoteobj.userDisplay && peerInfo.name ) {
                                    attachUserDetails( remoteVideos[vi].video, peerInfo); 
                                }
                                
                                if(remoteobj.userMetaDisplay && peerInfo.userid) {
                                    attachMetaUserDetails( remoteVideos[vi].video, peerInfo ); 
                                }
                            
                            }catch(e){
                                webrtcdev.error(e);
                            }

                        }else{
                            alert("remote Video containers not defined");
                        }
                    
                    } else {
                        webrtcdev.error(" PeerInfo vid didnt match either case ");
                    }
                break;

                default:
                    webrtcdev.log(" Switch default case");
            }


        }catch(e){
            webrtcdev.error("[ start.js - update call view ]" , e);
        }

        // Update Stats if active
        if(statisticsobj && statisticsobj.active){
            // getStats(event.stream.getVideoTracks() , function(result) {
            //     document.getElementById("network-stats-body").innerHTML = result;        
            // } , 20000);
            console.log(" ============= detect RTC" , detectRTC);
            document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(detectRTC); 
            document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(rtcconn.bandwidth);
            document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(rtcconn.codecs); 

            alert("detect RTC appended ");
        }

        webrtcdev.log(" updateWebCallView - finish");
    }
  
    /********************************************************************************** 
            Session call and Updating Peer Info
    ************************************************************************************/
    var repeatInitilization = null;

    /**
     * find information about a peer form array of peers basedon userid
     * @method
     * @name findPeerInfo
     * @param {string} userid
     */
    function startCall(obj){
        if(turn=='none'){
            obj.startwebrtcdev();
        }else if(turn!=null){
            repeatInitilization = window.setInterval(obj.startwebrtcdev, 2000);     
        }

        return;
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
    function updatePeerInfo(userid , username , usecolor , useremail, userrole ,  type ){
        webrtcdev.log("updating peerInfo: " , userid , username , usecolor , useremail, userrole ,  type);
        for(x in webcallpeers){
            if(webcallpeers[x].userid==userid) {
                webrtcdev.log("UserID is already existing , webcallpeers");
                return;
            }
        }

        peerInfo={ 
            videoContainer : "video"+userid,
            videoHeight : null,
            videoClassName: null,
            userid : userid , 
            name  :  username,
            color : usecolor,
            email : useremail,
            role : userrole,
            controlBarName: "control-video"+userid,
            filearray : [],
            vid : "video"+type+"_"+userid
        };
     
        if(fileshareobj.active ){

            if(fileshareobj.props.fileShare=="single"){
                peerInfo.fileShare={
                    outerbox: "widget-filesharing-box",
                    container : "widget-filesharing-container",
                    minButton: "widget-filesharing-minbutton",
                    maxButton: "widget-filesharing-maxbutton",
                    closeButton: "widget-filesharing-closebutton"
                };
            }else{
                peerInfo.fileShare={
                    outerbox: "widget-filesharing-box"+userid,
                    container : "widget-filesharing-container"+userid,
                    minButton: "widget-filesharing-minbutton"+userid,
                    maxButton: "widget-filesharing-maxbutton"+userid,
                    closeButton: "widget-filesharing-closebutton"+userid
                };
            }

            if(fileshareobj.props.fileList=="single"){
                peerInfo.fileList={
                    outerbox: "widget-filelisting-box",
                    container : "widget-filelisting-container"
                };
            }else{
                peerInfo.fileList={
                    outerbox: "widget-filelisting-box"+userid,
                    container : "widget-filelisting-container"+userid
                };
            }

        }
        webrtcdev.log("updated peerInfo: " ,peerInfo);
        webcallpeers.push(peerInfo);

        // Update the web call view 
        // updateWebCallView(peerInfo);
    }

    /**
     * update info about a peer in list of peers (webcallpeers)
     * @method
     * @name removePeerInfo
     * @param {string} userid
     * @param {string} usernamess
     * @param {string} usercolor
     * @param {string} type
     */
    function removePeerInfo(userid){
        webrtcdev.log(" [removePeerInfo] Before  " , webcallpeers);
        webrtcdev.log(" [removePeerInfo] Removing peerInfo: " , userid);
        webcallpeers.splice(userid, 1);
        webrtcdev.log(" [removePeerInfo] After removing peerInfo" , webcallpeers);
    }

    function destroyWebCallView(peerInfo , callback){
        webrtcdev.log(" [destroyWebCallView] peerInfo" , peerInfo);
        if( peerInfo.videoContainer && document.getElementById(peerInfo.videoContainer))
            document.getElementById(peerInfo.videoContainer).src="";
        
        /*if(fileshareobj.active){
            if(fileshareobj.props.fileShare){
                if(fileshareobj.props.fileShare=="divided")
                    webrtcdev.log("dont remove it now ");
                    //createFileSharingDiv(peerInfo);
                else if(fileshareobj.props.fileShare=="single")
                    webrtcdev.log("No Seprate div created for this peer  s fileshare container is single");
                else
                    webrtcdev.log("props undefined ");
            }
        }*/

        callback(true);
    }

    /**
     * find information about a peer form array of peers basedon userid
     * @method
     * @name findPeerInfo
     * @param {string} userid
     */
    findPeerInfo = function (userid){
        var peerInfo;
        /*    
        if(rtcConn.userid==userid){
            webrtcdev.log("PeerInfo is found for initiator", webcallpeers[0]);
            return webcallpeers[0];
        }
        */
        for(x in webcallpeers){
            if(webcallpeers[x].userid==userid) {
                return webcallpeers[x];
            }
        }
        return null;
    }


    /**
     * Open a WebRTC socket channel
     * @method
     * @name opneWebRTC
     * @param {string} channel
     * @param {string} userid
     */
    openWebRTC=function(channel , userid){
         socket.emit("open-channel", {
            channel    : channel,
            sender     : tempuserid,
            maxAllowed : remoteobj.maxAllowed
        });
        
        shownotification(" Making a new session ");
    }


    /**
     * connect to a webrtc socket channel
     * @method
     * @name connectWebRTC
     * @param {string} type
     * @param {string} channel
     * @param {string} userid
     * @param {string} remoteUsers
     */
    connectWebRTC=function(type, channel, userid ,remoteUsers){
        webrtcdev.info(" [start ConnectWebRTC ] type : " , type , " , Channel :" , channel , 
                                        " , Userid : " ,  userid , " , remote users : " , remoteUsers);
        /*void(document.title = channel);*/
        if(fileshareobj.active){
            
            //Do not create file share and file viewer for inspector's own session 
            var selfpeerinfo = findPeerInfo(userid);

            if(fileshareobj.props.fileShare=="single"){
                createFileSharingDiv(selfpeerinfo);
                document.getElementById(peerInfo.fileShare.outerbox).style.width="100%";
            } else if(fileshareobj.props.fileShare=="divided"){
                
                // create local File sharing window 
                if(role!="inspector") {
                    webrtcdev.log(" [start connectWebRTC] creating local file sharing");
                    createFileSharingDiv(selfpeerinfo);
                }else{
                    webrtcdev.log(" [start] Since it is an inspectors own session , not creating local File viewer and list");
                }
                
                // create remotes File sharing window 
                for(x in webcallpeers){
                    if(webcallpeers[x].userid != userid && webcallpeers[x].role != "inspector"){
                        webrtcdev.log(" [start connectWebRTC] creating remote file sharing ");
                        createFileSharingDiv(webcallpeers[x]);
                    }
                }
                requestOldFiles();

            }else{
                webrtcdev.error("fileshareobj.props.fileShare undefined ");
            }
            

            if(fileshareobj.props.fileList=="single"){
                document.getElementById(peerInfo.fileList.outerbox).style.width="100%";
            }else if(fileshareobj.props.fileShare!="single"){
                webrtcdev.log("No Seprate div created for this peer since fileshare container is single");
            }else{
                webrtcdev.error("fileshareobj.props.fileShare undefined ");
            }

        }
        /*localStorage.setItem("channel", channel);
        localStorage.setItem("userid", userid);
        localStorage.setItem("remoteUsers", remoteUsers);*/
    }


    /**
     * function to join w webrtc socket channel
     * @method
     * @name joinWebRTC
     * @param {string} channel
     * @param {string} userid
     */
    joinWebRTC=function(channel , userid){
        shownotification("Joining an existing session "+channel+ " selfuserid "+ selfuserid);
        webrtcdev.log("Joining an existing session "+channel+ " selfuserid "+ selfuserid);
        
        if (selfuserid==null)
            selfuserid=tempuserid;

        socket.emit("join-channel", {
            channel: channel,
            sender: selfuserid,
            extra: {
                userid:selfuserid,
                name:selfusername,
                color:selfcolor,
                email:selfemail,
                role: role
            }
        });
    }

    /**
     * function to leave a webrtc socket channel
     * @method
     * @name leaveWebRTC
     */
    leaveWebRTC=function(){
        shownotification("Leaving the session ");
    }

    /*window.onload=function(){
        webrtcdev.log( "Local Storage Channel " ,   localStorage.getItem("channel"));
    };
    */
    window.onunload=function(){
        webrtcdev.log( localStorage.getItem("channel"));
        alert(" Refreshing the Page will loose the session data");
    };

    /**
     * function to interact with background script of chrome extension
     * @call
     * @name addeventlistener
     */
    window.addEventListener('message', function(event){
        webrtcdev.log("------ message from Extension " , event);
        if (event.data.type) {
            if(event.data.type=="screenshare"){
                onScreenshareExtensionCallback(event);
            }else if(event.data.type=="screenrecord"){
                onScreenrecordExtensionCallback(event);
            }
        }else if(event.data=="webrtcdev-extension-getsourceId-audio-plus-tab"){
            onScreenrecordExtensionCallback(event);
        }else{
            onScreenshareExtensionCallback(event);
        }

    }); 

}catch(e){
    webrtcdev.log("exception in start " , e);
}
/* Generated on:Tue Jun 19 2018 23:00:45 GMT+0530 (IST) || version: 1.6.514 - Altanai , License : MIT  *//* ***************************************************************
Admin
******************************************************************/

var socket ;
var webrtcdevDataObj;
var usersDataObj;
var channelsFeed= document.getElementById("channelsFeed");

var WebRTCdevadmin= function(signaller){
    socket= io.connect(signaller);
    socket.on('response_to_admin_enquire', function(message) {

        switch (message.response){
            case "channels":
                webrtcdevDataObj=message.channels;
                if(message.format=="list"){
                    clearList("channellistArea");
                    for (i in Object.keys(webrtcdevDataObj)) { 
                        /*drawList("channellistArea" , Object.keys(webrtcdevDataObj)[i]);*/
                        drawList("channellistArea" , webrtcdevDataObj[i]);
                    }
                }else if(message.format=="table"){
                    drawTable("webrtcdevTableBody",webrtcdevDataObj);
                }else{
                    webrtcdev.error("format not specified ");
                }
            break;
        
            case "users":
                usersDataObj=message.users;
                if(message.format=="list"){
                    clearList("userslistArea");
                    for (i in usersDataObj) { 
                        drawList("userslistArea" , usersDataObj[i]);
                    }
                }
            break;

            case "all":
                channelsFeed.innerHTML=JSON.stringify(message.channels, null, 4);
            break;

            default :
                webrtcdev.log("unrecognizable response from signaller " , message);
        }
    });
};

function onLoadAdmin(){
    socket.emit('admin_enquire', {
        ask:'channels',
        format: 'list'
    });
}

$('#channels_list').click(function () {
    socket.emit('admin_enquire', {
        ask:'channels',
        format: 'list'
    });
});

$("#channelFindBtn").click(function(){
    socket.emit('admin_enquire', {
        ask:'channels',
        find: $("#channelFindInput").val(),
        format: 'list'
    });
});

$('#users_list').click(function () {
    socket.emit('admin_enquire', {
        ask:'users',
        format: 'list'
    });
});

$('#channels_table').click(function () {
    socket.emit('admin_enquire', {
        ask:'channels',
        format: 'table'
    });
});

$('#channels_json').click(function () {
    socket.emit('admin_enquire', {
        ask:'all',
        format: 'json'
    });
});

$('#channel_clients').click(function () {
    socket.emit('admin_enquire', 
        {
            ask:'channel_clients',
            channel: 'https172162010780841524489749781952'
        });
});

function clearList(element){
    $("#"+element).empty();
}

function drawList(element , listitem){
    $("#"+element).append("<li class='list-group-item'>"+listitem+"</li>");
}

function drawTable(tablebody , data) {
    for (i in Object.keys(data)) { 
        var key=Object.keys(data)[i];
        
        drawTableRow(tablebody ,i , data[key].channel , data[key].timestamp, data[key].users , 
            data[key].status , data[key].endtimestamp , 0 );
        /*                    
        for (j in data[key].users) {
            users.push(data[key].users[j]);
        }*/
    }
}

function drawTableRow(tablebody ,i ,  channel , timestamp , users , 
    status , endtimestamp , duration) {

    var row = $("<tr class='success' />");
    row.append($("<td>" + i + "</td>"));
    row.append($("<td>" + channel + "</td>"));
    row.append($("<td>" + timestamp + "</td>"));
    row.append($("<td>" + JSON.stringify(users, null, 4) + "</td>"));
    row.append($("<td>" + status + "</td>"));
    row.append($("<td>" + endtimestamp + "</td>"));
    row.append($("<td>" + duration + "</td>"));
    $("#"+tablebody).append(row);
    /*row.append($("<td id='usersRow'>" + drawUsersTable("usersRow" , rowData.users) + "</td>"));*/
}

function drawUsersTable(users) {
    var usersTable=document.createElement("table");
    $("#usersRow").append(usersTable);
    for (var i = 0; i < users.length; i++) {
        drawUsersRow(usersTable , data[i]);
    }
}

function drawUsersRow(userData) {
    var row = $("<tr />")
    $("#table").append(row);
    row.append($("<td>" + userData + "</td>"));
}
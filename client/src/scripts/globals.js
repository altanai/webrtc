
/*********** global Params ****************/
var t = "";
var e = null;
var n = "";
var rtcConn = null;
var scrConn = null;
var selfuserid = null, remoteUserId = null;
var containerDiv;
var webcallpeers = [];
var sessions = {};
var repeatFlagShowButton = null, repeatFlagHideButton = null, repeatFlagRemoveButton = null,
    repeatFlagStopuploadButton = null;

/* DOM objects for single user video , user in conf and all other users*/
var localVideo = null, selfVideo = null, remoteVideos = [];

var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
/*var usersList     = document.getElementById("userslist");
var numbersOfUsers  = document.getElementById("numbersofusers");
var usersContainer  = document.getElementById("usersContainer");*/
var tempuserid;
var sessions = {};

var selfusername = "", selfemail = "", selfcolor = "";
var remoteusername = "", remoteemail = "", remotecolor = "";

var latitude = "", longitude = "", operatingsystem = "";

/* webrtc session intilization */
var autoload = true;
var sessionid = null, socketAddr = "/", webrtcdevIceServers = [];
var localStream, localStreamId, remoteStream, remoteStreamId;

/* incoming and outgoing call params */
var incomingAudio = true, incomingVideo = true, incomingData = true;
var outgoingAudio = true, outgoingVideo = true, outgoingData = true;

var debug = false;

var timerobj = false;
var peerTimerStarted = false;

var chatobj = false, chatContainer = null;

var fileshareobj = false;
var pendingFileTransferlimit = 3;

var screenrecordobj = false;

var snapshotobj = false;

var videoRecordobj = false, videoRecordContainer = null;

var drawCanvasobj = false;

var texteditorobj = false;

var codeeditorobj = false, editor = null;

var reconnectobj = false;

var cursorobj = false;

var muteobj = false;

var minmaxobj = false;

var listeninobj = false;

var screenshareobj = false;

var helpobj = false;

var statisticsobj = false;

var screen, isScreenOn = 0, chromeMediaSourceId = null, extensioninstalled;
var screen_roomid, screen_userid;

var role = "participant";

let webrtcdev = webrtcdevlogger;

this.sessionid = "";

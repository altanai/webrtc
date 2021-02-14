/*********** global Params ****************/

var rtcConn = null;
var selfuserid = null, remoteUserId = null;

var webcallpeers = this.webcallpeers = [];

var repeatFlagShowButton = null, repeatFlagHideButton = null, repeatFlagRemoveButton = null,
    repeatFlagStopuploadButton = null;

var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;

var tempuserid;
var selfusername = "", selfemail = "", selfcolor = "";
var remoteusername = "", remoteemail = "", remotecolor = "";

var latitude = "", longitude = "", operatingsystem = "";

/* webrtc session intialization */
var autoload = true;
var sessionid = this.sessionid = "";
var localStream, localStreamId, remoteStream, remoteStreamId;
var config = {
    socketAddr: location.hostname + ":8083/",
    signaller: location.hostname + ":8085/"
};

/* turn*/

var turn = [];

/* incoming and outgoing call params */
var incomingAudio = true, incomingVideo = true, incomingData = true;
var outgoingAudio = true, outgoingVideo = true, outgoingData = true;

/* DOM objects for single user video , user in conf and all other users*/
var localVideo = null, selfVideo = null, remoteVideos;

// global remoteVideos to be access from client
this.remoteVideos = remoteVideos = [];

/* widget objects */
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

var screen, isScreenOn = 0, chromeMediaSourceId = null;
var screen_roomid, screen_userid;

var role = "participant";


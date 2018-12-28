/*********************************************
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

//function getICEServer(username , secretkey , domain , appname , roomname , secure){
function getICEServer(){
    var url = 'https://global.xirsys.net/_turn/Amplechat/';
    var xhr = createCORSRequest('PUT', url);
    xhr.onload = function () {
        webrtcdev.log("[turn Js] Response from Xirsys " , xhr.responseText);
        if(JSON.parse(xhr.responseText).v==null){
            webrtcdevIceServers = "err";
            shownotification("Media will not able to pass through "+ JSON.parse(xhr.responseText).e);
        }else{
            webrtcdevIceServers = JSON.parse(xhr.responseText).v.iceServers;
            webrtcdev.log("Obtained iceServers" , webrtcdevIceServers);
        }
    };
    xhr.onerror = function () {
        webrtcdev.error('Woops, there was an error making xhr request.');
    };
    xhr.setRequestHeader("Authorization", "Basic " + btoa("farookafsari:e35af4d2-dbd5-11e7-b927-0c3f27cba33f"));
    xhr.send();
}
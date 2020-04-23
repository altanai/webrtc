/**
 * function to leave a webrtc socket channel
 * @method
 * @name leaveWebRTC
 */
var leaveWebRTC = function () {
    shownotification("Leaving the session ");
};

/*window.onload=function(){
    webrtcdev.log( "Local Storage Channel " ,  localStorage.getItem("channel"));
};
*/
window.onunload = function () {
    webrtcdev.log("[startjs] onunload ", localStorage.getItem("channel"));
    alert(" Refreshing the Page will loose the session data");
};

/**
 * cleares local storage varibles
 * @method
 * @name clearCaches
 */
this.clearCaches = clearCaches = function () {
    localStorage.clear();
};

function refreshSession(){
    stopCall();
    clearCaches();
    location.reload();
}
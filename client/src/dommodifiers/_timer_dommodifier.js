
/**
 * creates and appends remotetimecontainer belonging to userid to parentTimecontainer
 * @method
 * @name createRemotetimeArea
 */
function createRemotetimeArea(userid) {
    let remotetimecontainer = document.createElement("ul");
    remotetimecontainer.id = "remoteTimerArea_" + userid;
    var peerinfo = findPeerInfo(userid);
    if (getElementById(peerinfo.videoContainer)) {
        var parentTimecontainer = getElementById(peerinfo.videoContainer).parentNode;
        parentTimecontainer.appendChild(remotetimecontainer);
        return remotetimecontainer;
    } else {
        return null;
    }
}


/**
 * function to activateButtons
 * @name activateButtons
 */
function activateButtons(timerobj) {
    if (timerobj.container.minbutton_id && getElementById(timerobj.container.minbutton_id)) {
        var button = getElementById(timerobj.container.minbutton_id);
        button.onclick = function (e) {
            if (getElementById(timerobj.container.id).hidden)
                getElementById(timerobj.container.id).hidden = false;
            else
                getElementById(timerobj.container.id).hidden = true;
        }
    }
}
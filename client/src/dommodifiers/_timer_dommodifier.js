
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


/**
 * function to start forward increasing session timer
 * @method
 * @name startForwardTimer
 */
function startForwardTimer() {
    webrtcdev.log("[timerjs] startForwardTimer");
    var cd = secs;
    var cdm = mins;
    var c = parseInt(cd.innerHTML, 10);
    var m = parseInt(cdm.innerHTML, 10);
    ftimer(cd, c, cdm, m);
}

/**
 * function to start backward decreasing session timer
 * @method
 * @name startBackwardTimer
 */
function startBackwardTimer() {
    webrtcdev.log("[timerjs] startBackwardTimer", hours, mins, secs);
    let cd = secs;
    let cdm = mins;
    let c = parseInt(cd.innerHTML, 10);
    let m = parseInt(cdm.innerHTML, 10);
    //alert(" Time for session validy is "+m +" minutes :"+ c+ " seconds");
    btimer(cd, c, cdm, m);
}

/**
 * function to start backward decreasing session timer
 * @method
 * @name Timer
 * @param {cd} timerobj
 * @param {c} timerobj
 * @param {cdm} timerobj
 * @param {m} timerobj
 */
function ftimer(cd, c, cdm, m) {
    var interv = setInterval(function () {
        c++;
        secs.innerHTML = c;

        if (c == 60) {
            c = 0;
            m++;
            mins.innerHTML = m;
        }
    }, 1000);
}

function btimer(cd, c, cdm, m) {
    var interv = setInterval(function () {
        c--;
        secs.innerHTML = c;

        if (c == 0) {
            c = 60;
            m--;
            mins.innerHTML = m;
            if (m < 0) {
                clearInterval(interv);
                //alert("time over");
            }
        }
    }, 1000);
}

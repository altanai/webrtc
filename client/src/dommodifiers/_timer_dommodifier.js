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

/**
 * function to show time zone at local time zone area
 * @method
 * @name showTimeZone
 */
function showTimeZone() {
    if (timerobj.span.currentTimeZone && getElementByName(timerobj.span.currentTimeZone)) {
        let timerzonelocal = getElementByName(timerobj.span.currentTimeZone);
        timerzonelocal.innerHTML = timeZone();
    } else {
        webrtcdev.error(" [timer js ] timerobj.span.currentTimeZone DOM doesnt exist ");
    }
}


/**
 * function to show time zone at local time zone area
 * @method
 * @name showTimeZone
 */
function showRemoteTimeZone(peerinfo) {
    if (getElementById("remoteTimeZone_" + peerinfo.userid))
        return;

    let timerspanpeer;
    if (timerobj.span.remoteTimeZone[x]) {
        webrtcdev.info(" [timer js] startPeersTime -timerobj.span.remoteTimeZone", timerobj.span.remoteTimeZone[x], " exist for remote");
        timerspanpeer = getElementByName(timerobj.span.remoteTimeZone[x]);
    } else {
        webrtcdev.info(" [timer js] startPeersTime -timerobj.span.remoteTimeZone getting crated for local and remotes");
        timerspanpeer = document.createElement("li");
    }
    timerspanpeer.id = "remoteTimeZone_" + peerinfo.userid;
    timerspanpeer.innerHTML = peerinfo.zone + " , ";
}

/**
 * function to start local peers time based on locally captured time zone
 * @method
 * @name startTime
 */
function startTime() {
    try {
        if (timerobj.span.currentTime && getElementByName(timerobj.span.currentTime)) {
            let timerspanlocal = getElementByName(timerobj.span.currentTime);
            timerspanlocal.innerHTML = new Date().toLocaleTimeString();
            var t = setTimeout(startTime, 1000);
        } else {
            webrtcdev.error("[timer js ] startTime - No place for timerobj.span.currentTime_id");
        }
    } catch (err) {
        webrtcdev.error("[timer js ]", err);
    }
}

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
 * creates and appends remotetimespan
 * @method
 * @name showRemoteTimer
 */
function showRemoteTimer(peerinfo) {
    let options = {
        // year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
        timeZone: peerinfo.zone
    };

    let timerspanpeer;

    if (timerobj.span.remoteTime[x]) {
        webrtcdev.info(" [timer js] startPeersTime - timerobj.span.remoteTime dom ", timerobj.span.remoteTime[x], " exist for remotes");
        timerspanpeer = getElementByName(timerobj.span.remoteTime[x]);
        timerspanpeer.id = "remoteTime_" + peerinfo.userid;
        timerspanpeer.innerHTML = new Date().toLocaleString('en-US', options);

    } else {
        // create the timer for p2p and conferences
        webrtcdev.info(" timerobj.span.remoteTime - timerobj.span.remoteTime dom  ", timerobj.span.remoteTime[x], " does not exist, creating it");

        if (getElementById("remoteTimeDate_" + peerinfo.userid))
            return;

        timerspanpeer = document.createElement("span");
        timerspanpeer.id = "remoteTime_" + peerinfo.userid;
        timerspanpeer.innerHTML = new Date().toLocaleString('en-US', options);

        var remotetimecontainer;
        if (!getElementById("remoteTimerArea_" + peerinfo.userid)) {
            remotetimecontainer = createRemotetimeArea(peerinfo.userid);
        } else {
            remotetimecontainer = getElementById("remoteTimerArea_" + peerinfo.userid);
        }
        remotetimecontainer.appendChild(timerspanpeer);
    }
}
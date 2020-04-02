/*-----------------------------------------------------------------------------------*/
/*                        timer JS                                                   */
/*-----------------------------------------------------------------------------------*/
/**
 * {@link https://github.com/altanai/webrtc/blob/master/client/build/scripts/_timer.js|TIMER}
 * @summary Takes local and remote peers time , localtion and show and shows timer for session
 * @author {@link https://telecom.altanai.com/about-me/|Altanai}
 * @typedef _turn.js
 * @function
 */

var hours, mins, secs;
var zone = "";
var t;
var worker = null;


////////////////////////////////////////// self ////////////////////////////////
/**
 * function to start session timer with timerobj
 * @method
 * @name startsessionTimer
 * @param {json} timerobj
 */
function startsessionTimer(timerobj) {

    webrtcdev.log("[ timerobj] startsessionTimer ", timerobj);
    if (timerobj.counter.hours && timerobj.counter.minutes && timerobj.counter.seconds) {
        hours = getElementById(timerobj.counter.hours);
        mins = getElementById(timerobj.counter.minutes);
        secs = getElementById(timerobj.counter.seconds);

        if (timerobj.type == "forward") {
            startForwardTimer();
            hours.innerHTML = 0;
            mins.innerHTML = 0;
            secs.innerHTML = 0;

        } else if (timerobj.type == "backward") {
            hours.innerHTML = 0;
            mins.innerHTML = 3;
            secs.innerHTML = 0;
            startBackwardTimer();
        }
    } else {
        webrtcdev.error(" [timerobj] counter DOM elemnents not found ");
    }
}

/**
 * function to fetch and show local peers time zone based on locally captured values
 * @method
 * @name timeZone
 */
function timeZone() {
    try {
        zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        webcallpeers[0].zone = zone;
        return zone;
    } catch (err) {
        webrtcdev.error("[timer js ]", err);
    }
}

/**
 * function to share local time and zone to other peer
 * @name shareTimePeer
 */
function shareTimePeer() {
    try {
        var msg = {
            type: "timer",
            userid: webcallpeers[0].userid,
            time: (new Date()).toJSON(),
            zone: webcallpeers[0].zone
        };
        webrtcdev.log("[timerjs] shareTimePeer ", msg);
        rtcConn.send(msg);
    } catch (e) {
        webrtcdev.error(e);
    }
}

/////////////////////////////////////////// peer ///////////////////////////////////////////

try {
    // event listener for web workers
    worker = new Worker('js/timekeeper.js');
    worker.addEventListener('message', function (e) {
        webrtcdev.log("[timerjs] webworker message ", e.data);
        let timerspanpeer = getElementById(e.data.remotetime);
        if (e.data.remotetime && timerspanpeer) {
            timerspanpeer.innerHTML = e.data.time;
        }
    }, false);
} catch (err) {
    webrtcdev.error("[timerjs]", err);
}

/**
 * function to fetch and show Peers peers time based on onmessage val
 * @name startPeersTime
 * @param {date} date
 * @param {str} zone
 * @param {id} userid
 */

var startPeersTime = function (date, zone, userid) {

    try {
        var tobj = [];

        // Starting peer timer for all peers
        for (x in webcallpeers) {
            let peerinfo = webcallpeers[Number(x) + 1];
            if (!peerinfo) break;

            webrtcdev.debug(" [timer js] startPeersTime for ", peerinfo.userid);
            showRemoteTimer(peerinfo);

            // send to webworkers
            tobj.push({
                zone: peerinfo.zone,
                userid: peerinfo.userid,
                remotetime: timerspanpeer.id
            });
            peerTimerStarted = true;
        }

        webrtcdev.info("[timerjs] Final tobj ", tobj);
        if (tobj.length > 0) {
            worker.postMessage(tobj);
        }

    } catch (e) {
        webrtcdev.error(e);
    }
}


/**
 * function to fetch and show local peers time zone based on locally captured values
 * @method
 * @name peertimeZone
 * @param {str} zone
 * @param {id} userid
 */
function peerTimeZone(zone, userid) {

    try {
        // set peers zone in webcallpeers
        appendToPeerValue(userid , "zone" ,  zone);

        // Starting peer timer for all peers
        var peerinfo = findPeerInfo(userid);
        showRemoteTimeZone(peerinfo);
    } catch (err) {
        webrtcdev.error("[timerjs] ", err);
    }
}


function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }
    ;  // add zero in front of numbers < 10
    return i;
}

/*-----------------------------------------------------------------------------------*/
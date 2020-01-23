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
var today = new Date();
var zone = "";
var t;
var worker = null;

try {
    // event listener for web workers
    worker = new Worker('js/timekeeper.js');
    worker.addEventListener('message', function(e) {
        webrtcdev.log(" webworker message " , e.data );
        if(e.data.remotetime){
            let timerspanpeer = getElementById(e.data.remotetime);
            timerspanpeer.innerHTML = e.data.time;
        }
    }, false);
} catch (e) {
    webrtcdev.error("[Timer]", e);
}

/**
 * function to share local time and zone to other peer
 * @name shareTimePeer
 */
function shareTimePeer() {
    try {
        var msg = {
            type: "timer",
            time: (today).toJSON(),
            zone: zone
        };
        webrtcdev.log("[ timerobj] shareTimePeer ", msg);
        rtcConn.send(msg);
    } catch (e) {
        webrtcdev.error(e);
    }
}


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
    } catch(err) {
        webrtcdev.error("[timer js ]",err);
    }
}

/**
 * function to fetch and show local peers time zone based on locally captured values
 * @method
 * @name timeZone
 */
function timeZone() {
    try {
        if (timerobj.span.currentTimeZone && getElementByName(timerobj.span.currentTimeZone)) {
            zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let timerzonelocal = getElementByName(timerobj.span.currentTimeZone);
            timerzonelocal.innerHTML = zone;
        } else {
            webrtcdev.error(" [timer js ] timerobj.span.currentTimeZone DOM doesnt exist ");
        }
    } catch (err) {
        webrtcdev.error("[timer js ]",err);
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
        var tobj = [];

        // Starting peer timer for all peers
        for ( x in webcallpeers) {
            let peerinfo = webcallpeers[x];

            if (getElementById("remoteTimeZone_" + peerinfo.userid))
                return;

            let timerspanpeer;
            if (timerobj.span.remoteTimeZone[x]) {
                webrtcdev.info(" [timer js] startPeersTime -timerobj.span.remoteTimeZone exist for local and remotes");
                timerspanpeer = getElementByName(timerobj.span.remoteTimeZone[x]);
                timerspanpeer.id = "remoteTimeZone_" + peerinfo.userid;
                timerspanpeer.innerHTML = zone + " , ";

            } else {
                webrtcdev.info(" [timer js] startPeersTime -timerobj.span.remoteTimeZone getting crated  for local and remotes");
                timerspanpeer = document.createElement("li");
                timerspanpeer.id = "remoteTimeZone_" + peerinfo.userid;
                timerspanpeer.innerHTML = zone + " , ";

            }
        }
    } catch (err) {
        webrtcdev.error("[timerjs] ",err);
    }
}


/**
 * function to fetch and show Peers peers time based on onmesaage val
 * @name startPeersTime
 * @param {date} date
 * @param {str} zone
 * @param {id} userid
 */

var startPeersTime = function (date, zone, userid) {

    try {
        var tobj = [];

        // Starting peer timer for all peers
        for ( x in webcallpeers) {

            let peerinfo = webcallpeers[x];
            let options = {
                // year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
                hour12: false,
                timeZone: peerinfo.zone
            };

            webrtcdev.debug(" [timer js] startPeersTime for ", peerinfo.userid);
            let timerspanpeer;
            if (timerobj.span.remoteTime[x]) {
                webrtcdev.info(" [timer js] startPeersTime -timerobj.span.remoteTime exist for local and remotes");
                timerspanpeer = getElementByName(timerobj.span.remoteTime[x]);
                timerspanpeer.id = "remoteTime_" + peerinfo.userid;
                timerspanpeer.innerHTML = new Date().toLocaleString('en-US', options);

            } else {
                // create the timer for p2p and conferences
                webrtcdev.info(" timerobj.span.remoteTime_id DOM does not exist, creating it",
                    timerobj.span.remoteTime, getElementById(timerobj.span.remoteTime));

                if (getElementById("remoteTimeDate_" + peerinfo.userid))
                    return;

                timerspanpeer = document.createElement("span");
                timerspanpeer.id = "remoteTime_" + userid;
                timerspanpeer.innerHTML = new Date().toLocaleString('en-US', options);

                var remotetimecontainer;
                if (!getElementById("remoteTimerArea_" + peerinfo.userid)) {
                    remotetimecontainer = createRemotetimeArea(peerinfo.userid);
                } else {
                    remotetimecontainer = getElementById("remoteTimerArea_" + peerinfo.userid);
                }
                remotetimecontainer.appendChild(timerspanpeer);

                var t = setTimeout(startPeersTime, 5000);
            }

            // send to webworkers
            tobj.push({
                zone : peerinfo.zone,
                userid : peerinfo.userid,
                remotetime : timerspanpeer.id
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




function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }
    ;  // add zero in front of numbers < 10
    return i;
}

/*-----------------------------------------------------------------------------------*/
/**
 * find information about a peer form array of peers based on userid
 * @method
 * @name findPeerInfo
 * @param {string} userid
 */
var findPeerInfo = function (userid) {
    /* find selfuser id faster which is index 0 of webcallpeers
    if(rtcConn.userid == userid){
        webrtcdev.log("PeerInfo is found for initiator", webcallpeers[0]);
        return webcallpeers[0];
    }
    */
    for (x in webcallpeers) {
        if (webcallpeers[x].userid == userid) {
            return webcallpeers[x];
        }
    }
    return null;
};

/**
 * find index of peerinfo in webcall peers based on userid
 * @method
 * @name findPeerInfoIndex
 * @param {string} userid
 */
var findPeerInfoIndex = function (userid) {
    for (x in webcallpeers) {
        if (webcallpeers[x].userid == userid) {
            return x;
        }
    }
    return null;
};

/**
 * get All Active Peers
 * @method
 * @name getAllActivePeers
 */
function getAllActivePeers() {
    return rtcConn.peers.getAllParticipants();
}

/**
 * find information about a peer form array of peers based on userid
 * @method
 * @name findPeerInfo
 * @param {string} userid
 */
var findPeerInfoSDP = function (userid) {
    webrtcdev.log("peerinfomanager] find perinfo SDP ", userid);
    for (x in rtcConn.peers) {
        if (rtcConn.peers[x].userid == userid) {
            webrtcdev.log("peerinfomanager] PeerInfo Remote ", rtcConn.peers[x]);
            let offer = rtcConn.peers[x].peer.currentRemoteDescription;
            webrtcdev.log("peerinfomanager] PeerInfo Remote SDP ", offer.type, offer.sdp);

            let lines = offer.sdp.split('\n')
                .map(l => l.trim()); // split and remove trailing CR
            lines.forEach(function (line) {

                if (line.indexOf('a=fingerprint:') === 0) {
                    let parts = line.substr(14).split(' ');
                    console.log('algorithm - ', parts[0]);
                    console.log('fingerprint - ', parts[1]);
                }

                if (line.indexOf('m=audio') === 0) {
                    let parts = line.substr(8).split(' ');
                    console.log('Audio codecs - ', parts);
                }

                if (line.indexOf('m=video') === 0) {
                    let parts = line.substr(8).split(' ');
                    console.log('Video codecs - ', parts);
                }

                if (line.indexOf('c=IN IP4') === 0) {
                    let parts = line.substr(9).split(' ');
                    console.log('Contact line - ', parts);
                }

            });

        }
    }
    return null;
};

/**
 * update already existing webcallpeers obj by appending a value
 * @method
 * @name appendToPeerValue
 * @param {string} userid
 * @param {json} key
 * @param {json} value
 */
this.appendToPeerValue = appendToPeerValue = function(userid, key, value) {
    try {
        if (!key || !value) return;

        let peerInfo = findPeerInfo(userid);
        if(peerInfo[key] || peerInfo.hasOwnProperty(key) ) {
            removefromPeerValue(userid, key);
        }

        peerInfo[key] = value;
        let pindex = findPeerInfoIndex(peerInfo.userid);
        webcallpeers[pindex] = peerInfo;
        webrtcdev.log("[peerinfomanager] appendToPeerValue - update webcallpeers index " + pindex, webcallpeers[pindex]);
    } catch (err) {
        webrtcdev.error("[peerinfomanager] appendToPeerValue errorr - ", err);
    }
};

/**
 * remove from already existing webcallpeers obj by key
 * @method
 * @name removefromPeerValue
 * @param {string} userid
 * @param {json} key
 */
this.removefromPeerValue = removefromPeerValue = function(userid, key) {
    webrtcdev.log("[peerinfomanager] removefromPeerValue " + userid + " key " + key);
    let peerInfo = findPeerInfo(userid);
    return delete peerInfo[key];
};


/**
 * remove info about a peer in list of peers (webcallpeers)
 * @method
 * @name removePeerInfo
 * @param {id} userid
 */
function removePeerInfo(userid) {
    try {
        webrtcdev.log("[peerinfomanager] removePeerInfo - remove userid: ", userid);
        for (x in webcallpeers) {
            if (webcallpeers[x].userid == userid) {
                webcallpeers.splice(x, 1);
                return;
            }
        }
    } catch (err) {
        webrtcdev.error("[peerinfomanager] removePeerInfo errorr - ", err);
    }

}

/**
 * update info about a peer in list of peers (webcallpeers)
 * @method
 * @name updatePeerInfo
 * @param {string} userid
 * @param {string} username
 * @param {string} usercolor unique color associated with this peer for easy identification
 * @param {string} useremail
 * @param {string} userrole particant , host , guests , inspector
 * @param {string} type
 */
function updatePeerInfo(userid, username, usecolor, useremail, userrole, type) {
    webrtcdev.log("[peerinfomanager] updatePeerInfo-  " + userid + username + usecolor + useremail + userrole + type);

    // if userid deosnt exist , exit
    if (!userid) {
        webrtcdev.error("[peerinfomanager] updatePeerInfo - userid is null / undefined, cannot create PeerInfo");
        return;
    }

    // if userid is already present in webcallpeers , update only
    let peerInfo = findPeerInfo(userid);
    if (peerInfo) {
        webrtcdev.log("[peerinfomanager] updatePeerInfo - UserID is already existing in webcallpeers, update the fields only ");

        peerInfo.videoContainer = peerInfo.videoContainer || "video" + userid;
        peerInfo.videoHeight = peerInfo.videoHeight || null;
        peerInfo.videoClassName = peerInfo.videoClassName || null;
        peerInfo.userid = peerInfo.userid || userid;
        peerInfo.name = peerInfo.name || username;
        peerInfo.color = peerInfo.color || usecolor;
        peerInfo.email = peerInfo.email || useremail;
        peerInfo.role = peerInfo.role || userrole || "participant";
        peerInfo.type = peerInfo.type || type;
        peerInfo.controlBarName = peerInfo.controlBarName || "control-video" + userid;
        peerInfo.filearray = peerInfo.filearray || [];
        peerInfo.vid = peerInfo.vid || "video" + type + "_" + userid;

    } else {
        peerInfo = {
            videoContainer: "video" + userid,
            videoHeight: null,
            videoClassName: null,
            userid: userid,
            name: username,
            color: usecolor,
            email: useremail,
            role: userrole || "participant",
            type: type,
            controlBarName: "control-video" + userid,
            filearray: [],
            vid: "video" + type + "_" + userid
        };
        webcallpeers.push(peerInfo);
        webrtcdev.log("[peerinfomanager] updatedPeerInfo -  newly created peerinfo");
    }

    if (fileshareobj.active) {
        if (fileshareobj.props.fileShare == "single") {
            peerInfo.fileShare = {
                outerbox: "widget-filesharing-box",
                container: "widget-filesharing-container",
                minButton: "widget-filesharing-minbutton",
                maxButton: "widget-filesharing-maxbutton",
                rotateButton: "widget-filesharing-rotatebutton",
                closeButton: "widget-filesharing-closebutton"
            };
        } else {
            peerInfo.fileShare = {
                outerbox: "widget-filesharing-box" + userid,
                container: "widget-filesharing-container" + userid,
                minButton: "widget-filesharing-minbutton" + userid,
                maxButton: "widget-filesharing-maxbutton" + userid,
                rotateButton: "widget-filesharing-rotatebutton" + userid,
                closeButton: "widget-filesharing-closebutton" + userid
            };
        }

        if (fileshareobj.props.fileList == "single") {
            peerInfo.fileList = {
                outerbox: "widget-filelisting-box",
                container: "widget-filelisting-container"
            };
        } else {
            peerInfo.fileList = {
                outerbox: "widget-filelisting-box" + userid,
                container: "widget-filelisting-container" + userid
            };
        }
    }

    let pindex = findPeerInfoIndex(peerInfo.userid);
    webcallpeers[pindex] = peerInfo;
    webrtcdev.log("[peerinfomanager] updatePeerInfo " + pindex, webcallpeers[pindex]);
}

/**
 * getwebcallpeers
 * @method
 * @name getwebcallpeers
 */
this.getwebcallpeers = function () {
    return webcallpeers;
};

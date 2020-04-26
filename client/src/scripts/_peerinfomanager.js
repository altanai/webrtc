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
 * update already existing webcallpeers obj by appending a value , mostly used for timer zone
 * @method
 * @name appendToPeerValue
 * @param {string} userid
 * @param {json} key
 * @param {json} value
 */
function appendToPeerValue(userid, key, value) {
    for (x in webcallpeers) {
        if (webcallpeers[x].userid == userid) {
            webcallpeers[x][key]= value;
            webrtcdev.log(" updated peerValue key ", key, " with value ", value);
            return ;
        }
    }
}

/**
 * remove info about a peer in list of peers (webcallpeers)
 * @method
 * @name removePeerInfo
 * @param {id} userid
 */
function removePeerInfo(userid) {
    webrtcdev.log(" [peerinfomanager] removePeerInfo - remove userid: ", userid);
    for (x in webcallpeers) {
        if (webcallpeers[x].userid == userid) {
            webcallpeers.splice(x, 1);
            return;
        }
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
    webrtcdev.log("[peerinfomanager] updatePeerInfo-  ", userid, username, usecolor, useremail, userrole, type);

    // if userid deosnt exist , exit
    if (!userid) {
        webrtcdev.error("[peerinfomanager] updatePeerInfo - userid is null / undefined, cannot create PeerInfo");
        return;
    }

    let peerInfo = {
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

    // if userid is already present in webcallpeers , update only
    let isexistingpeerinfo = findPeerInfo(userid);
    if (isexistingpeerinfo) {
        webrtcdev.log("[peerinfomanager] updatePeerInfo - UserID is already existing in webcallpeers, update the fields only ");
        let x = findPeerInfoIndex(userid);
        webcallpeers[x] = peerInfo;
        webrtcdev.log("[peerinfomanager] updated peerInfo: ", peerInfo);
    } else {
        webcallpeers.push(peerInfo);
        webrtcdev.log("[peerinfomanager] newly created peerInfo: ", peerInfo);
    }
}

/**
 * getwebcallpeers
 * @method
 * @name getwebcallpeers
 */
this.getwebcallpeers = function () {
    return webcallpeers;
};

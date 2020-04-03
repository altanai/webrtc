/*-----------------------------------------------------------------------------------*/
/*                    File JS                                                   */
/*-----------------------------------------------------------------------------------*/

var progressHelper = {};

function fileSharingStarted(file) {
    webrtcdev.log("[flesharing JS] on File start ", file);
    webrtcdev.log("[flesharing JS] on File start description  , name :", file.name, " from -> ", file.userid, " to ->", file.remoteUserId);

    let progressid = file.uuid + "_" + file.userid + "_" + file.remoteUserId;
    let peerinfo = findPeerInfo(file.userid);
    // check if not already present ,
    // done to include one entry even if same file is being sent to multiple participants
    if (!peerinfo.filearray.includes("name : file.name")) {
        // add to peerinfo file array
        peerinfo.filearray.push({
            "pid": progressid,
            "name": file.name,
            "status": "progress",
            "from": file.userid,
            "to": file.remoteUserId
        });

        // create multiple instances  , also pass file from and file to for the progress bars
        addProgressHelper(file.uuid, peerinfo, file.name, file.maxChunks, file, "fileBoxClass", file.userid, file.remoteUserId);
    }
    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "file",
            action: "onFileShareStart"
        }
    }));
}

function fileSharingInprogress(e) {
    //webrtcdev.log("[start] on File progress uuid : ", e.uuid , " , name :", e.name ," from -> ", e.userid , " to ->" , e.remoteUserId);
    try {
        // if the file has already recahed max chunks then exit
        if (e.currentPosition > e.maxChunks) return;

        let progressid = e.uuid + "_" + e.userid + "_" + e.remoteUserId;
        let ph = progressHelper[progressid];
        // webrtcdev.log("[start] on File progress ",
        //     "progresshelper id - " , progressid ,
        //     "currentPosition - " , e.currentPosition ,
        //     "maxchunks - ", e.maxChunks ,
        //     "progress.max - " , r.progress.max);

        ph && (ph.progress.value = e.currentPosition || e.maxChunks || ph.progress.max, updateLabel(ph.progress, ph.label));
    } catch (err) {
        webrtcdev.error("[flesharing JS] Problem in onFileProgress ", err);
    }
}

function fileSharingEnded(file) {
    webrtcdev.log("[flesharing JS] On file End description , file :", file, " from -> ", file.userid, " to ->", file.remoteUserId);

    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "file",
            action: "onFileShareEnded"
        }
    }));

    let progressid = file.uuid + "_" + file.userid + "_" + file.remoteUserId;
    let filename = file.name;

    // find duplicate file
    // for(x in webcallpeers){
    //     for (y in webcallpeers[x].filearray){
    //         webrtcdev.log(" Duplicate find , Files shared  so far " , webcallpeers[x].filearray[y].name);
    //         if(webcallpeers[x].filearray[y].name==filename){
    //             //discard file as duplicate
    //             webrtcdev.error("duplicate file shared ");
    //             return;
    //         }
    //     }
    // }

    // push to peerinfo's file array
    var peerinfo = findPeerInfo(file.userid);
    if (peerinfo != null) {
        for (x in peerinfo.filearray)
            if (peerinfo.filearray[x].name == filename && peerinfo.filearray[x].pid == progressid) {
                //update filearray status to finished
                peerinfo.filearray[x].status = "finished";

                // Hide the stop upload button for this file
                hideelem("stopuploadButton" + progressid);
            }
    }

    // Display on File Viewer and List
    webrtcdev.log("[flesharing JS] onFileEnd - Display on File Viewer and List -", file.url, filename, file.type);
    displayFile(file.uuid, peerinfo, file.url, filename, file.type);

    webrtcdev.log("[flesharing JS] onFileEnd - Display List -", filename + file.uuid, document.getElementById(filename + file.uuid));
    // if the file is from me ( orignal share ) then diaply listing in viewbox just one
    if (selfuserid == file.userid && document.getElementById(filename + file.uuid)) {
        return;
    }
    displayList(file.uuid, peerinfo, file.url, filename, file.type);
    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "file",
            action: "onFileShareEnded"
        }
    }));

    // console.log(" ----------------------- pendingFileTransfer ", pendingFileTransfer , pendingFileTransfer.length , pendingFileTransferlimit);
    // //start the pending transfer from pendingFileTransfer.push(file);
    // //if (pendingFileTransfer.length >= pendingFileTransferlimit) {
    //     webrtcdev.log("[flesharing JS] resuming pending/paused file ", pendingFileTransfer[0]);
    //     hideelem(pendingFileTransfer[0].name);
    //     sendFile(pendingFileTransfer[0]);
    //     pendingFileTransfer.pop();
    // //}
}

/**
 * Send File
 * @method
 * @name sendFile
 * @param {json} file
 */
function sendFile(file) {
    webrtcdev.log(" [filehsraing js] Send file - ", file);
    // for (let x in webcallpeers) {
    //     for (let y in webcallpeers[x].filearray) {
    //         if (webcallpeers[x].filearray[y].status == "progress") {
    //             webrtcdev.log("[flesharing JS] A file is already in progress , add the new file " + file.name + " to queue");
    //             //alert("Allow current file to complete uploading, before selecting the next file share upload");
    //             pendingFileTransfer.push(file);
    //             addstaticProgressHelper(file.uuid, findPeerInfo(selfuserid), file.name, file.maxChunks, file, "fileBoxClass", selfuserid, "");
    //             return;
    //         }
    //     }
    // }
    rtcConn.send(file);
}


/**
 * Stop Sending File
 * @method
 * @name stop sending files and remove them form filearray
 * @param {json} file
 */
function stopSendFile(progressid, filename, file, fileto, filefrom) {
    webrtcdev.log(" [filehsraing js] Stop Sending file - ", file);
    var peerinfo = findPeerInfo(file.userid);
    for (y in peerinfo.filearray) {
        if (peerinfo.filearray[y].pid == progressid) {
            //alert(" stop senidng file progressid "+ progressid);
            peerinfo.filearray[y].status = "stop";
            webrtcdev.log(" [filesharing js ] stopSendFile - filename ", peerinfo.filearray[y].name, " | status ", peerinfo.filearray[y].status);
            //peerinfo.filearray.splice(y,1);
        }
    }
}


/**
 * Request Old Files
 * @method
 * @name requestOldFiles
 * @param {json} files
 */
function requestOldFiles() {
    try {
        var msg = {
            type: "syncOldFiles"
        };
        rtcConn.send(msg);
    } catch (e) {
        webrtcdev.error("[filesharing js ] syncOldFiles", e);
    }
}

/**
 * Send Old Files
 * @method
 * @name sendOldFiles
 * @param {json} files
 */
function sendOldFiles() {
    // Sync old files
    var oldfilesList = [];
    for (x in webcallpeers) {
        webrtcdev.log("[flesharing JS] Checking Old Files in index ", x);
        var user = webcallpeers[x];
        if (user.filearray && user.filearray.length > 0) {
            for (y in user.filearray) {
                // chking is file is already present in old file list 
                for (o in oldfilesList) {
                    if (oldfilesList[o].name == user.filearray[y].name) break;
                }
                webrtcdev.log("[filehsraing js] user.filearray[y]", user.filearray[y])
                oldfilesList.push(user.filearray[y]);
            }
        }
    }

    setTimeout(function () {
        if (oldfilesList.length > 0) {
            webrtcdev.log("[filehsraing js] sendOldFiles ", oldfilesList);
            for (f in oldfilesList) {
                sendFile(oldfilesList[f]);
            }
        }
    }, 20000);

}

/**
 * add New File Local
 * @method
 * @name addNewFileLocal
 * @param {json} files
 */
function addNewFileLocal(e) {
    webrtcdev.log("[flesharing JS] addNewFileLocal message ", e);
    if ("" != e.message && " " != e.message) {
        webrtcdev.log("addNewFileLocal");
    }
}

/**
 * add New File Remote
 * @method
 * @name addNewFileRemote
 * @param {json} files
 */
function addNewFileRemote(e) {
    webrtcdev.log("[flesharing JS] addNewFileRemote message ", e);
    if ("" != e.message && " " != e.message) {
        webrtcdev.log("addNewFileRemote");
    }
}

/*-----------------------------------------------------------------------------------*/
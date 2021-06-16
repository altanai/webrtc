/* *************************************
Snapshot
************************************************/

/*
 * Take snapshot from peerinfo video container
 * @method
 * @name takeSnapshot
 * @param {int} peerinfo
 * @param {callback} callback
*/



function takeSnapshot(peerinfo, callback) {
    try {
        function _takeSnapshot(video) {
            if (video) {
                let canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || video.clientWidth;
                canvas.height = video.videoHeight || video.clientHeight;
                let context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                callback(canvas.toDataURL('image/png'));
            } else {
                callback("");
            }
        }
        if (peerinfo.videoContainer.nodeName =="VIDEO") {
            let video = peerinfo.videoContainer;
            return _takeSnapshot(video);
        }else if(document.getElementById(peerinfo.videoContainer).nodeName =="VIDEO"){
            let video = document.getElementById(peerinfo.videoContainer);
            return _takeSnapshot(video);
        }else{
            webrtcdev.error("[snapshot] videocontainer missing in peerinfo", peerinfo.videoContainer);
            return "empty";
        }
    } catch (err) {
        webrtcdev.error("[Snapshot] ", err);
    }
}

function syncSnapshot(datasnapshot, datatype, dataname) {
    rtcConn.send({
        type: datatype,
        message: datasnapshot,
        name: dataname
    });
}


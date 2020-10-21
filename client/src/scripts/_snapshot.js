/* *************************************
Snapshot
************************************************/
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

        if (peerinfo.videoContainer)
            return _takeSnapshot(peerinfo.videoContainer);
        else
            webrtcdev.error("[snapshot] videocontainer missing in peerinfo", peerinfo);
            return "empty";
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


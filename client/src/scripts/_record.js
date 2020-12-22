/*-----------------------------------------------------------------------------------*/
/*                       Record JS                                                   */
/*-----------------------------------------------------------------------------------*/

var listOfRecorders = {};


/**
 * start Recording the stream using recordRTC
 * @method
 * @name startRecord
 * @param {json} peerinfo
 */
function startRecord(peerinfo) {
    let streamid = peerinfo.streamid;
    let stream = peerinfo.stream;

    if (!stream) {
        webrtcdev.error("[recordjs] startRecord - stream is missing for peer ", peerinfo);
    }

    webrtcdev.log("[recordjs] stop - stream", stream);
    let recorder = RecordRTC(stream, {
        type: 'video',
        recorderType: MediaStreamRecorder,
    });
    recorder.startRecording();
    listOfRecorders[streamid] = recorder;
}

/**
 * stop Recording the stream using recordRTC
 * @method
 * @name stopRecord
 * @param {json} peerinfo
 */
function stopRecord(peerinfo) {
    let streamid = peerinfo.streamid;
    let stream = peerinfo.stream;
    if (!stream) {
        webrtcdev.error("[recordjs] stopRecord - stream is missing for peer ", peerinfo);
    }

    webrtcdev.log("[recordjs] stop - stream", stream);
    if (!listOfRecorders[streamid]) {
        webrtcdev.log("wrong stream id ");
    }
    let recorder = listOfRecorders[streamid];
    recorder.stopRecording(function (url) {
        let blob = recorder.getBlob();

        /*        
        window.open( URL.createObjectURL(blob) );
        // or upload to server
        var formData = new FormData();
        formData.append('file', blob);
        $.post('/server-address', formData, serverCallback);*/

        let recordVideoname = "recordedvideo" + new Date().getTime();
        var _peerinfo;
        if(selfuserid)
            _peerinfo = findPeerInfo(selfuserid);
        else
            _peerinfo = findPeerInfo(rtcConn.userid);
        _peerinfo.filearray.push(recordVideoname);

        let numFile = document.createElement("div");
        numFile.value = _peerinfo.filearray.length;
        let fileurl = URL.createObjectURL(blob);

        if(fileshareobj.active) {
            displayList(_peerinfo.uuid, _peerinfo, fileurl, recordVideoname, "videoRecording");
            displayFile(_peerinfo.uuid, _peerinfo, fileurl, recordVideoname, "videoRecording");
        }else{
            displayFile(_peerinfo.uuid, _peerinfo, fileurl, recordVideoname, "videoRecording");
        }
    });
}

/**
 * stopping session Record
 * @method
 * @name stopSessionRecord
 * @param {json} peerinfo
 * @param {string} scrrecordStreamid
 * @param {blob} scrrecordStream
 * @param {string} scrrecordAudioStreamid
 * @param {blob} scrrecordAudioStream
 */
function stopSessionRecord(peerinfo, scrrecordStreamid, scrrecordStream, scrrecordAudioStreamid, scrrecordAudioStream) {
    /*var streamid = prompt('Enter stream-id');*/

    if (!listOfRecorders[scrrecordStreamid]) {
        /*throw 'Wrong stream-id';*/
        webrtcdev.log("wrong stream id scrrecordStreamid");
    }

    if (!listOfRecorders[scrrecordAudioStreamid]) {
        /*throw 'Wrong stream-id';*/
        webrtcdev.log("wrong stream id scrrecordAudioStreamid");
    }

    var recorder = listOfRecorders[scrrecordStreamid];
    recorder.stopRecording(function () {
        let blob = recorder.getBlob();
        webrtcdev.log("scrrecordStreamid stopped recording blob is ", blob);
    });

    var recorder2 = listOfRecorders[scrrecordAudioStreamid];
    recorder2.stopRecording(function () {
        let blob = recorder2.getBlob();
        webrtcdev.log("scrrecordStreamid stopped recording blob is ", blob);
    });

}

/*function startRecord(){
    rtcMultiConnection.streams[streamid].startRecording({
        audio: true,
        video: true
    });
}

function stopRecord(){
    rtcMultiConnection.streams[streamid].stopRecording(function (dataRecordedVideo) {
        for(i in webcallpeers ){
            if(webcallpeers[i].userid==rtcMultiConnection.userid){
                var recordVideoname = "recordedvideo"+ new Date().getTime();
                webcallpeers[i].filearray.push(recordVideoname);
                var numFile= document.createElement("div");
                numFile.value= webcallpeers[i].filearray.length;
                var fileurl=URL.createObjectURL(dataRecordedVideo.video);
                if(fileshareobj.active){
                    syncSnapshot(fileurl , "videoRecording" , recordVideoname );
                    displayList(rtcMultiConnection.uuid , rtcMultiConnection.userid  ,fileurl , recordVideoname , "videoRecording");
                    displayFile(rtcMultiConnection.uuid , rtcMultiConnection.userid , fileurl , recordVideoname , "videoRecording");
                }else{
                    displayFile(rtcMultiConnection.uuid , rtcMultiConnection.userid , fileurl , recordVideoname , "videoRecording");
                }
            }
        }
    }, {audio:true, video:true} );
}*/

/*-----------------------------------------------------------------------------------*/
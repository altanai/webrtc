/*-----------------------------------------------------------------------------------*/
/*                        stats JS                                                   */
/*-----------------------------------------------------------------------------------*/

/**
 * function to updateStats
 * @method
 * @name getWebrtcdevStats
 */
this.getWebrtcdevStats = getWebrtcdevStats = function () {

    webrtcdev.info(" URL  : ", window.location.href);

    webrtcdev.info(" Browser  : ", rtcConn.DetectRTC.browser);

    webrtcdev.info(" Network connection downlink : ", navigator.connection.downlink);
    webrtcdev.info(" Network connection effectiveType : ", navigator.connection.effectiveType);
    webrtcdev.info(" Network connection rtt : ", navigator.connection.rtt);
    webrtcdev.info(" Bandwidth  : ", rtcConn.bandwidth);

    webrtcdev.info(" All active participants  : ", getAllActivePeers());

    showCodecs();

    for (let x in webcallpeers) {
        webrtcdev.info(" Peer   : ", x, " - ", webcallpeers[x]);
    }

    return new Promise(function (resolve, reject) {
        for (let y in rtcConn.peers) {
            if (rtcConn.peers[y].userid) {
                let conn = rtcConn.peers[y].peer;
                webrtcdev.log(conn);
                conn.getStats(null).then(stats => {
                    let statsOutput = "";

                    stats.forEach(report => {
                        statsOutput += "Report:" + report.type + " <br/> " + "ID:" + report.id + " <br/>" + "Timestamp:" + report.timestamp + " <br/> ";
                        Object.keys(report).forEach(statName => {
                            if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                                statsOutput += statName + " : " + report[statName] + " <br/> ";
                            }
                        });
                    });
                    webrtcdev.info("[stats] getWebrtcdevStats - self  ", selfuserid, statsOutput);
                    resolve(statsOutput);
                });
            }
        }
    });

    // for (let y in  rtcConn.peers){
    //     if(rtcConn.peers[y].userid) {
    //         let conn = rtcConn.peers[y].peer;
    //         webrtcdev.log(conn);
    //         conn.getStats(null).then(stats => {
    //             let statsOutput = "";
    //
    //             stats.forEach(report => {
    //                 statsOutput += `<h2>Report: ${report.type}</h3>\n<strong>ID:</strong> ${report.id}<br>\n` +
    //                     `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
    //
    //                 // Now the statistics for this report; we intentially drop the ones we
    //                 // sorted to the top above
    //
    //                 Object.keys(report).forEach(statName => {
    //                     if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
    //                         statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
    //                     }
    //                 });
    //             });
    //            webrtcdev.info("[stats]",statsOutput);
    //         });
    //     }
    // }

};

/**
 * function to send webrtc stats
 * @method
 * @name getWebrtcdevStats
 * @param {object} mediaStreamTrack
 * @param {function} callback
 */
function sendWebrtcdevStats() {
    getWebrtcdevStats.then(stats => {
        rtcConn.send({
            type: "stats",
            message: stats
        });
    });
}

/*
onreceivedWebrtcdevStats
 */
function onreceivedWebrtcdevStats(userid, stats) {
    webrtcdev.info("[stats] getWebrtcdevStats - remote userid ", userid, stats);
}

this.oldgetStats = function (mediaStreamTrack, callback, interval) {
    var peer = this;
    if (arguments[0] instanceof RTCMultiConnection) {
        peer = arguments[0];

        if (!!navigator.mozGetUserMedia) {
            mediaStreamTrack = arguments[1];
            callback = arguments[2];
            interval = arguments[3];
        }

        if (!(mediaStreamTrack instanceof MediaStreamTrack) && !!navigator.mozGetUserMedia) {
            throw '2nd argument is not instance of MediaStreamTrack.';
        }
    } else if (!(mediaStreamTrack instanceof MediaStreamTrack) && !!navigator.mozGetUserMedia) {
        throw '1st argument is not instance of MediaStreamTrack.';
    }

    var globalObject = {
        audio: {},
        video: {}
    };

    var nomore = false;

    (function getPrivateStats() {
        _getStats(function (results) {
            var result = {
                audio: {},
                video: {},
                results: results,
                nomore: function () {
                    nomore = true;
                }
            };

            for (var i = 0; i < results.length; ++i) {
                var res = results[i];

                if (res.datachannelid && res.type === 'datachannel') {
                    result.datachannel = {
                        state: res.state // open or connecting
                    };
                }

                if (res.type === 'googLibjingleSession') {
                    result.isOfferer = res.googInitiator;
                }

                if (res.type == 'googCertificate') {
                    result.encryption = res.googFingerprintAlgorithm;
                }

                if (res.googCodecName == 'opus' && res.bytesSent) {
                    var kilobytes = 0;
                    if (!!res.bytesSent) {
                        if (!globalObject.audio.prevBytesSent) {
                            globalObject.audio.prevBytesSent = res.bytesSent;
                        }

                        var bytes = res.bytesSent - globalObject.audio.prevBytesSent;
                        globalObject.audio.prevBytesSent = res.bytesSent;

                        kilobytes = bytes / 1024;
                    }

                    if (!result.audio) {
                        result.audio = res;
                    }

                    result.audio.availableBandwidth = kilobytes.toFixed(1);
                }

                if (res.googCodecName == 'VP8') {
                    // if(!globalObject.)
                    // bytesReceived
                    // packetsReceived
                    // timestamp
                    var kilobytes = 0;
                    if (!!res.bytesSent) {
                        if (!globalObject.video.prevBytesSent) {
                            globalObject.video.prevBytesSent = res.bytesSent;
                        }

                        var bytes = res.bytesSent - globalObject.video.prevBytesSent;
                        globalObject.video.prevBytesSent = res.bytesSent;

                        kilobytes = bytes / 1024;
                    }

                    if (!result.video) {
                        result.video = res;
                    }

                    result.video.availableBandwidth = kilobytes.toFixed(1);

                    if (res.googFrameHeightReceived && res.googFrameWidthReceived) {
                        result.resolutions = {
                            width: res.googFrameWidthReceived,
                            height: res.googFrameHeightReceived
                        };
                    }
                }

                if (res.type == 'VideoBwe') {
                    result.video.bandwidth = {
                        googActualEncBitrate: res.googActualEncBitrate,
                        googAvailableSendBandwidth: res.googAvailableSendBandwidth,
                        googAvailableReceiveBandwidth: res.googAvailableReceiveBandwidth,
                        googRetransmitBitrate: res.googRetransmitBitrate,
                        googTargetEncBitrate: res.googTargetEncBitrate,
                        googBucketDelay: res.googBucketDelay,
                        googTransmitBitrate: res.googTransmitBitrate
                    };
                }

                // res.googActiveConnection means either STUN or TURN is used.

                if (res.type == 'googCandidatePair' && res.googActiveConnection == 'true') {
                    result.connectionType = {
                        local: {
                            candidateType: res.googLocalCandidateType,
                            ipAddress: res.googLocalAddress
                        },
                        remote: {
                            candidateType: res.googRemoteCandidateType,
                            ipAddress: res.googRemoteAddress
                        },
                        transport: res.googTransportType
                    };
                }

                var systemNetworkType = ((navigator.connection || {}).type || 'unknown').toString().toLowerCase();

                if (res.type === 'localcandidate') {
                    if (!result.connectionType) {
                        result.connectionType = {};
                    }

                    result.connectionType.local = {
                        candidateType: res.candidateType,
                        ipAddress: res.ipAddress + ':' + res.portNumber,
                        networkType: res.networkType/* || systemNetworkType */ || 'unknown',
                        transport: res.transport
                    }
                }

                if (res.type === 'remotecandidate') {
                    if (!result.connectionType) {
                        result.connectionType = {};
                    }

                    result.connectionType.local = {
                        candidateType: res.candidateType,
                        ipAddress: res.ipAddress + ':' + res.portNumber,
                        networkType: res.networkType || systemNetworkType,
                        transport: res.transport
                    };
                }
            }

            try {
                if (peer.iceConnectionState.search(/failed|closed/gi) !== -1) {
                    nomore = true;
                }
            } catch (e) {
                nomore = true;
            }

            if (nomore === true) {
                if (result.datachannel) {
                    result.datachannel.state = 'close';
                }
                result.ended = true;
            }

            callback(result);

            // second argument checks to see, if target-user is still connected.
            if (!nomore) {
                typeof interval != undefined && interval && setTimeout(getPrivateStats, interval || 1000);
            }
        });
    })();

    // a wrapper around getStats which hides the differences (where possible)
    // following code-snippet is taken from somewhere on the github
    function _getStats(cb) {
        // if !peer or peer.signalingState == 'closed' then return;
        webrtcdev.log("peer ", peer);
        if (!peer.getStats()) return;

        if (!!navigator.mozGetUserMedia) {
            peer.getStats(
                mediaStreamTrack,
                function (res) {
                    var items = [];
                    res.forEach(function (result) {
                        items.push(result);
                    });
                    cb(items);
                },
                cb
            );
        } else {
            peer.getStats(function (res) {
                var items = [];
                res.result().forEach(function (result) {
                    var item = {};
                    result.names().forEach(function (name) {
                        item[name] = result.stat(name);
                    });
                    item.id = result.id;
                    item.type = result.type;
                    item.timestamp = result.timestamp;
                    items.push(item);
                });
                cb(items);
            });
        }
    }
};

function merge(mergein, mergeto) {
    if (!mergein) mergein = {};
    if (!mergeto) return mergein;

    for (var item in mergeto) {
        mergein[item] = mergeto[item];
    }
    return mergein;
}

if (typeof module !== 'undefined'/* && !!module.exports*/) {
    module.exports = getStats;
}

// if (typeof window !== 'undefined') {
//     window.getStats = getStats;
// }


function activateBandwidthButtons(timerobj) {
    if (document.getElementById("minimizeBandwidthButton")) {
        var button = document.getElementById("minimizeBandwidthButton");
        button.onclick = function (e) {
            if (document.getElementById("bandwidthContainer").hidden)
                document.getElementById("bandwidthContainer").hidden = false;
            else
                document.getElementById("bandwidthContainer").hidden = true;
        }
    }
}

/**
 * shows status of ongoing webrtc call
 * @method
 * @name showStatus
 * @param {obj} conn
 */
function showStatus() {
    getStats(rtcConn, function (result) {
        webrtcdev.info("[stats]", result.connectionType.remote.ipAddress);
        webrtcdev.info("[stats]", result.connectionType.remote.candidateType);
        webrtcdev.info("[stats]", result.connectionType.transport);
    }, 10000);
    webrtcdev.info("[stats] WebcallPeers ", webcallpeers);
}

/**
 * shows status of ongoing webrtc call
 * @method
 * @name showStatus
 * @param {obj} conn
 */
function showCodecs() {
    webrtcdev.info("[stats] codec Audio ", rtcConn.codecs.audio);
    webrtcdev.info("[stats] Codec Video ", rtcConn.codecs.video);
}


// /**
//  * shows stats of ongoing webrtc call
//  * @method
//  * @name showStatus
//  * @param {obj} conn
//  */
// function showRtpstats() {
//     try {
//         for (x = 0; x < rtcConn.peers.getLength(); x++) {
//             var pid = rtcConn.peers.getAllParticipants()[x];
//             var arg = JSON.stringify(rtcConn.peers[pid], undefined, 2);
//             document.getElementById(statisticsobj.statsConainer).innerHTML += "<pre >" + arg + "</pre>";
//         }
//     } catch (e) {
//         webrtcdev.error("[stats] rtpstats", e);
//     }
// }

/*
 * shows rtc conn of ongoing webrtc call 
 * @method
 * @name showRtcConn
 */
this.showRtcConn = function () {
    if (rtcConn) {
        webrtcdev.info(" =========================================================================");
        // webrtcdev.info("[stats] rtcConn : ", JSON.stringify(rtcConn));
        webrtcdev.info("[stats] rtcConn : ", rtcConn);
        webrtcdev.info(" =========================================================================");
    } else {
        webrtcdev.warn(" rtcConn doesnt exist ");
    }

    return rtcConn;
};

/*
 * shows rtcp capabilities of transceivers webrtc call 
 * @method
 * @name showRTCPcapabilities
 * @param {obj} conn
 */
function showRTCPcapabilities() {
    let str = "";
    str += RTCRtpSender.getCapabilities('audio');
    str += RTCRtpSender.getCapabilities('video');
    webrtcdev.info("[stats] rtcConn : ", JSON.stringify(str));
    // document.getElementById(statisticsobj.statsConainer).innerHTML += "<pre >" + str + "</pre>";
}

/**
 * function to updateStats
 * @method
 * @name updateStats
 * @param {object} connection
 */
this.updateStats = function () {
    webrtcdev.info(" ============================ get Stats  ==========================================");

    // Update Stats if active
    if (statisticsobj && statisticsobj.active) {
        getStats(event.stream.getVideoTracks(), function (result) {
            document.getElementById("network-stats-body").innerHTML = result;
        }, 20000);
        document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(statisticsobj);
        document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(statisticsobj.bandwidth);
        document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(statisticsobj.codecs);
    }
};

/**
 * function to check browser support for webrtc apis
 * @name checkWebRTCSupport
 * @param {object} connection
 */
function checkWebRTCSupport(obj) {

    webrtcdev.info(" Browser ", obj.browser.name + obj.browser.fullVersion);

    if (obj.isWebRTCSupported) {
        // seems WebRTC compatible client
    } else {

    }

    if (obj.isAudioContextSupported) {
        // seems Web-Audio compatible client
    }

    if (obj.isScreenCapturingSupported) {
        // seems WebRTC screen capturing feature is supported on this client
    }

    if (obj.isSctpDataChannelsSupported) {
        // seems WebRTC SCTP data channels feature are supported on this client
    }

    if (obj.isRtpDataChannelsSupported) {
        // seems WebRTC (old-fashioned) RTP data channels feature are supported on this client
    }

}

function getConnectedDevices(type, callback) {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const filtered = devices.filter(device => device.kind === type);
            callback(filtered);
        });
}

function listDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        webrtcdev.warn("enumerateDevices() not supported.");
        return;
    }
    //List cameras and microphones.
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                webrtcdev.log("[sessionmanager] checkDevices ", device.kind, ": ", device.label, " id = ", device.deviceId);
            });
        })
        .catch(function (err) {
            webrtcdev.error('[sessionmanager] checkDevices ', err.name, ": ", err.message);
        });
}

/*
check MediaStreamTrack
    MediaTrackSupportedConstraints,
    MediaTrackCapabilities,
    MediaTrackConstraints
    MediaTrackSettings
*/
function getMediaDevicesConstraints() {
    return navigator.mediaDevices.getSupportedConstraints();
}

/*-----------------------------------------------------------------------------------*/
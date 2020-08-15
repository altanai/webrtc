// RTCPeerConnection.js

var defaults = {};

function setSdpConstraints(config) {
    var sdpConstraints = {
        OfferToReceiveAudio: !!config.OfferToReceiveAudio,
        OfferToReceiveVideo: !!config.OfferToReceiveVideo
    };

    return sdpConstraints;
}

// var RTCPeerConnection;
// if (typeof window.RTCPeerConnection !== 'undefined') {
//     console.log(" >>> window RTCPeerConnection");
//     RTCPeerConnection = window.RTCPeerConnection;
// } else if (typeof mozRTCPeerConnection !== 'undefined') {
//     console.log(" >>> moz RTCPeerConnection");
//     RTCPeerConnection = mozRTCPeerConnection;
// } else if (typeof webkitRTCPeerConnection !== 'undefined') {
//     console.log(" >>> chrome RTCPeerConnection");
//     RTCPeerConnection = webkitRTCPeerConnection;
// } else {
//     console.warn(" >>> RTCPeerConnection not found  ")
// }

var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
var MediaStreamTrack = window.MediaStreamTrack;


/**
 * Handles all peer ide activities like setting media setting policies , SDP constraints , creating offer answer , handling stream
 * @method
 * @name PeerInitiator
 * @param {json} config - configuration json for SDP and RTC
 */
function PeerInitiator(config) {

    // navigator.mediaDevices.getUserMedia({
    //     audio: true,
    //     video: true
    // });

    if (!RTCPeerConnection) {
        throw 'WebRTC 1.0 (RTCPeerConnection) API are NOT available in this browser.';
    }
    webrtcdev.log(" [PeerInitiator] RTCPeerConnection - ", RTCPeerConnection);

    var connection = config.rtcMultiConnection;

    this.extra = config.remoteSdp ? config.remoteSdp.extra : connection.extra;
    this.userid = config.userid;
    this.streams = [];
    this.channels = config.channels || [];
    this.connectionDescription = config.connectionDescription;

    this.addStream = function (session) {
        connection.addStream(session, self.userid);
    };

    this.removeStream = function (streamid) {
        connection.removeStream(streamid, self.userid);
    };

    var self = this;

    if (config.remoteSdp) {
        this.connectionDescription = config.remoteSdp.connectionDescription;
    }

    var allRemoteStreams = {};

    defaults.sdpConstraints = setSdpConstraints({
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    });

    var peer;

    var renegotiatingPeer = !!config.renegotiatingPeer;
    if (config.remoteSdp) {
        renegotiatingPeer = !!config.remoteSdp.renegotiatingPeer;
    }

    var localStreams = [];
    connection.attachStreams.forEach(function (stream) {
        if (!!stream) {
            localStreams.push(stream);
        }
    });

    if (!renegotiatingPeer) {
        var iceTransports = 'all';
        if (connection.candidates.turn || connection.candidates.relay) {
            if (!connection.candidates.stun && !connection.candidates.reflexive && !connection.candidates.host) {
                iceTransports = 'relay';
            }
        }

        try {
            // ref: developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
            var params = {
                iceServers: connection.iceServers,
                iceTransportPolicy: connection.iceTransportPolicy || iceTransports
            };

            if (typeof connection.iceCandidatePoolSize !== 'undefined') {
                params.iceCandidatePoolSize = connection.iceCandidatePoolSize;
            }

            if (typeof connection.bundlePolicy !== 'undefined') {
                params.bundlePolicy = connection.bundlePolicy;
            }

            if (typeof connection.rtcpMuxPolicy !== 'undefined') {
                params.rtcpMuxPolicy = connection.rtcpMuxPolicy;
            }

            if (!!connection.sdpSemantics) {
                params.sdpSemantics = connection.sdpSemantics || 'unified-plan';
            }

            if (!connection.iceServers || !connection.iceServers.length) {
                params = null;
                connection.optionalArgument = null;
            }

            webrtcdev.log("[PeerInitiator] RTCPeerConnection params - ", params, " connection.optionalArgument ", connection.optionalArgument);
            peer = new RTCPeerConnection(params, connection.optionalArgument);

        } catch (e) {
            // Todo : bundle policy will come null here and throw null exception . Need to fix
            webrtcdev.error("[RTC PC ] PeerInitiator -  error ", e, " try making peerconnection without optional arguments , just with params like iceservers");
            try {
                var params = {
                    iceServers: connection.iceServers
                };
                peer = new RTCPeerConnection(params);
            } catch (e) {
                peer = new RTCPeerConnection();
                webrtcdev.error("[RTC PC ] PeerInitiator - error again ", e, " create empty RTC Peerconnection without params or optional arguments  ");
            }
        }
    } else {
        peer = config.peerRef;
    }

    // Codec Preference
    // let codec_audio = [];
    // const transceiver_audio = peer.addTransceiver('audio');
    // const audiocapabilities = RTCRtpSender.getCapabilities('audio');
    // webrtcdev.log("[PeerInitiator ] Audio Capabilities ", audiocapabilities);
    // codec_audio.push(audiocapabilities.codecs[0]);
    // transceiver_audio.setCodecPreferences(codec_audio);

    // let codec_video = [];
    // const transceiver = peer.addTransceiver('video');
    // const videocapabilities = RTCRtpSender.getCapabilities('video');
    // webrtcdev.log("[PeerInitiator ] Video Capabilities ", videocapabilities);
    // codec_video.push(videocapabilities.codecs[0]);
    // codec_video.push(videocapabilities.codecs[1]);
    // transceiver.setCodecPreferences(codec_video);

    if (!peer.getRemoteStreams && peer.getReceivers) {
        peer.getRemoteStreams = function () {
            var stream = new MediaStream();
            peer.getReceivers().forEach(function (receiver) {
                stream.addTrack(receiver.track);
                webrtcdev.log("[PeerInitiator] RTCPeerConnection - getReceivers and addTrack ");
            });
            return [stream];
        };
    }

    webrtcdev.log("[PeerInitiator ] peer.getSenders ", peer.getSenders());
    if (!peer.getLocalStreams && peer.getSenders) {
        peer.getLocalStreams = function () {
            var stream = new MediaStream();
            peer.getSenders().forEach(function (sender) {
                stream.addTrack(sender.track);
                webrtcdev.log("[PeerInitiator] RTCPeerConnection - getSenders and addTrack ");
            });
            return [stream];
        };
    }

    peer.onicecandidate = function (event) {
        webrtcdev.log("[PeerInitiator ] peer.onicecandidate  ", event);

        //end-of-candidate
        if (!event.candidate) {
            if (!connection.trickleIce) {
                var localSdp = peer.localDescription;
                config.onLocalSdp({
                    type: localSdp.type,
                    sdp: localSdp.sdp,
                    remotePeerSdpConstraints: config.remotePeerSdpConstraints || false,
                    renegotiatingPeer: !!config.renegotiatingPeer || false,
                    connectionDescription: self.connectionDescription,
                    dontGetRemoteStream: !!config.dontGetRemoteStream,
                    extra: connection ? connection.extra : {},
                    streamsToShare: streamsToShare
                });
            }
            webrtcdev.log("[PeerInitiator ] peer.onicecandidate - end-of-candidate , return with local description ");
            return;
        }

        if (!connection.trickleIce) {
            webrtcdev.error("[PeerInitiator] onicecandidate - trickleIce not set ");
            return;
        }

        //add candidate for messaging to remote

        // add_MCU_Icecandidate
        // let mcucandidate_audio = {
        //     sdpMid: 0,
        //     sdpMLineIndex: 0,
        //     candidate: "candidate:1 1 udp 2015363327 54.193.51.199 43865 typ host"
        // };
        // peer.addIceCandidate(mcucandidate_audio)
        //     .then(_ => {
        //         console.log("[RTC PC] createOfferOrAnswer addIceCandidate() - Added MCU ICE ");
        //         //end-of-cadidate
        //         let iceCandidate = new RTCIceCandidate(mcucandidate_audio);
        //         peer.addIceCandidate(iceCandidate);
        //     })
        //     .catch(e => {
        //         console.error("[RTC PC ] createOfferOrAnswer - Failure during addIceCandidate(): " + e.name);
        //     });

        // let mcucandidate_video = {
        //     sdpMid: 1,
        //     sdpMLineIndex: 1,
        //     candidate: "candidate:1 1 udp 2015363327 54.193.51.199 43865 typ host"
        // };
        // peer.addIceCandidate(mcucandidate_video)
        //     .then(_ => {
        //         console.log("[RTC PC ] createOfferOrAnswer  addIceCandidate() - Added MCU ICE ");
        //         //end-of-cadidate
        //         peer.addIceCandidate({candidate: ''});
        //     })
        //     .catch(e => {
        //         console.error("[RTC PC ] createOfferOrAnswer - Failure during addIceCandidate(): " + e.name);
        //     });

        // original
        config.onLocalCandidate({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
        });

        // Force candidate for MCU host
        // config.onLocalCandidate({
        //     candidate: "candidate:1 1 udp 2015363327 54.193.51.199 43865 typ host",
        //     sdpMid: event.candidate.sdpMid,
        //     sdpMLineIndex: event.candidate.sdpMLineIndex
        // });

        webrtcdev.log("[PeerInitiator] onicecandidate - update local SDP with ", event.candidate.candidate);
    };

    localStreams.forEach(function (localStream) {
        if (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.dontGetRemoteStream) {
            webrtcdev.warn("[RTC PC ] PeerInitiator - localStreams remotePeerSdpConstraints.dontGetRemoteStream ", config.remoteSdp.remotePeerSdpConstraints.dontGetRemoteStream);
            return;
        }

        if (config.dontAttachLocalStream) {
            webrtcdev.warn("[RTC PC ] PeerInitiator - localStreams dontAttachLocalStream", config.dontAttachLocalStream);
            return;
        }

        localStream = connection.beforeAddingStream(localStream, self);

        if (!localStream) return;

        peer.getLocalStreams().forEach(function (stream) {
            if (localStream && stream.id == localStream.id) {
                localStream = null;
            }
        });

        if (localStream && localStream.getTracks) {
            localStream.getTracks().forEach(function (track) {
                try {
                    // last parameter is redundant for unified-plan
                    // starting from chrome version 72
                    peer.addTrack(track, localStream);
                } catch (e) {
                }
            });
        }
    });

    // peer.onicegatheringstatechange = ev => {
    //     let connection = ev.target;
    //     webrtcdev.log("[RTC PC] onicegatheringstatechange -", connection.iceGatheringState );
    //     switch (connection.iceGatheringState) {
    //         case "gathering":
    //             /* collection of candidates has begun */
    //             webrtcdev.log("[RTC PC] onicegatheringstatechange - gathering ");
    //             break;
    //         case "complete":
    //             /* collection of candidates is finished */
    //             webrtcdev.log("[RTC PC] onicegatheringstatechange - complete ");
    //             break;
    //     }
    // };

    peer.oniceconnectionstatechange = peer.onsignalingstatechange = function (ev) {

        // webrtcdev.log("[RTC PC] ontrack event - onsignalingstatechange " , peer.signalingState);
        var extra = self.extra;
        if (connection.peers[self.userid]) {
            extra = connection.peers[self.userid].extra || extra;
        }

        if (!peer) {
            return;
        }

        if (peer.iceConnectionState === "failed" ||
            peer.iceConnectionState === "disconnected" ||
            peer.iceConnectionState === "closed") {
            // Handle the failure
            webrtcdev.log("[RTC PC] ontrack event - oniceconnectionstatechange ", peer.iceConnectionState );
        }

        config.onPeerStateChanged({
            iceConnectionState: peer.iceConnectionState,
            iceGatheringState: peer.iceGatheringState,
            signalingState: peer.signalingState,
            extra: extra,
            userid: self.userid
        });

        if (peer && peer.iceConnectionState && peer.iceConnectionState.search(/closed|failed/gi) !== -1 && self.streams instanceof Array) {
            self.streams.forEach(function (stream) {
                var streamEvent = connection.streamEvents[stream.id] || {
                    streamid: stream.id,
                    stream: stream,
                    type: 'remote'
                };

                connection.onstreamended(streamEvent);
            });
        }
    };

    var sdpConstraints = {
        OfferToReceiveAudio: !!localStreams.length,
        OfferToReceiveVideo: !!localStreams.length
    };

    if (config.localPeerSdpConstraints) sdpConstraints = config.localPeerSdpConstraints;

    defaults.sdpConstraints = setSdpConstraints(sdpConstraints);

    var streamObject;
    var dontDuplicate = {};

    peer.ontrack = function (event) {

        webrtcdev.log("[RTC PC] ontrack event - ", event);
        if (!event || event.type !== 'track') return;

        // if (!event.stream) return;

        event.stream = event.streams[event.streams.length - 1];

        if (!event.stream.id) {
            event.stream.id = event.track.id;
        }

        if (dontDuplicate[event.stream.id] && DetectRTC.browser.name !== 'Safari') {
            if (event.track) {
                event.track.onended = function () { // event.track.onmute =
                    peer && peer.onremovestream(event);
                };
            }
            return;
        }

        dontDuplicate[event.stream.id] = event.stream.id;

        var streamsToShare = {};
        if (config.remoteSdp && config.remoteSdp.streamsToShare) {
            streamsToShare = config.remoteSdp.streamsToShare;
        } else if (config.streamsToShare) {
            streamsToShare = config.streamsToShare;
        }

        var streamToShare = streamsToShare[event.stream.id];
        if (streamToShare) {
            event.stream.isAudio = streamToShare.isAudio;
            event.stream.isVideo = streamToShare.isVideo;
            event.stream.isScreen = streamToShare.isScreen;
        } else {
            event.stream.isVideo = !!getTracks(event.stream, 'video').length;
            event.stream.isAudio = !event.stream.isVideo;
            event.stream.isScreen = false;
        }

        event.stream.streamid = event.stream.id;

        allRemoteStreams[event.stream.id] = event.stream;
        config.onRemoteStream(event.stream);

        event.stream.getTracks().forEach(function (track) {
            track.onended = function () { // track.onmute =
                peer && peer.onremovestream(event);
            };
        });

        event.stream.onremovetrack = function () {
            peer && peer.onremovestream(event);
        };
    };

    peer.onremovestream = function (event) {
        // this event doesn't works anymore
        event.stream.streamid = event.stream.id;

        if (allRemoteStreams[event.stream.id]) {
            delete allRemoteStreams[event.stream.id];
        }

        config.onRemoteStreamRemoved(event.stream);
    };

    if (typeof peer.removeStream !== 'function') {
        // removeStream backward compatibility
        peer.removeStream = function (stream) {
            stream.getTracks().forEach(function (track) {
                peer.removeTrack(track, stream);
            });
        };
    }

    this.addRemoteCandidate = function (remoteCandidate) {
        webrtcdev.log("[RTC PC] addRemoteCandidate - remoteCandidate ", remoteCandidate);

        // addMCUICecandidate
        // let mcucandidate = {candidate: "candidate:1 1 udp 2015363327 54.193.51.199 43865 typ host"};
        // peer.addIceCandidate(mcucandidate)
        //     .then(_ => {
        //         console.log(" Added MCU ICE ");
        //     })
        //     .catch(e => {
        //         console.error("Failure during addIceCandidate(): " + e.name);
        //     });

        //end-of-cadidate
        // peer.addIceCandidate({candidate: ''});

        let iceCandidate = new RTCIceCandidate(remoteCandidate);
        webrtcdev.log("[RTC PC] addRemoteCandidate - RTCIceCandidate " ,iceCandidate );
        peer.addIceCandidate(iceCandidate);
    };

    function oldAddRemoteSdp(remoteSdp, cb) {
        cb = cb || function () {
        };

        if (DetectRTC.browser.name !== 'Safari') {
            remoteSdp.sdp = connection.processSdp(remoteSdp.sdp);
        }
        peer.setRemoteDescription(new RTCSessionDescription(remoteSdp), cb, function (error) {
            if (!!connection.enableLogs) {
                webrtcdev.error('setRemoteDescription failed', '\n', error, '\n', remoteSdp.sdp);
            }

            cb();
        });
    }

    this.addRemoteSdp = function (remoteSdp, cb) {
        cb = cb || function () {
        };

        if (DetectRTC.browser.name !== 'Safari') {
            webrtcdev.log("[RTC PC] addRemoteSdp - modify the SDP before setting remote Description");
            remoteSdp.sdp = connection.processSdp(remoteSdp.sdp);

            // webrtcdev.log("[RTC PC] addRemoteSdp ---- modify the SDP with MCU media gateway before setting remote Description");
            // remoteSdp.sdp = connection.processMcuSdp(remoteSdp.sdp);
        }

        peer.setRemoteDescription(new RTCSessionDescription(remoteSdp))
            .then(cb, function (error) {
                webrtcdev.error('[RTC PC] setRemoteDescription failed', '\n', error, '\n', remoteSdp.sdp);
                cb();
            }).catch(function (error) {
            webrtcdev.error('[RTC PC] setRemoteDescription failed', '\n', error, '\n', remoteSdp.sdp);
            cb();
        });
    };

    var isOfferer = true;

    if (config.remoteSdp) {
        isOfferer = false;
    }

    this.createDataChannel = function () {
        var channel = peer.createDataChannel('sctp', {});
        setChannelEvents(channel);
    };

    if (connection.session.data === true && !renegotiatingPeer) {
        if (!isOfferer) {
            peer.ondatachannel = function (event) {
                var channel = event.channel;
                setChannelEvents(channel);
            };
        } else {
            this.createDataChannel();
        }
    }

    this.enableDisableVideoEncoding = function (enable) {
        var rtcp;
        peer.getSenders().forEach(function (sender) {
            if (!rtcp && sender.track.kind === 'video') {
                rtcp = sender;
            }
        });

        if (!rtcp || !rtcp.getParameters) return;

        var parameters = rtcp.getParameters();
        parameters.encodings[1] && (parameters.encodings[1].active = !!enable);
        parameters.encodings[2] && (parameters.encodings[2].active = !!enable);
        rtcp.setParameters(parameters);
    };

    if (config.remoteSdp) {
        if (config.remoteSdp.remotePeerSdpConstraints) {
            sdpConstraints = config.remoteSdp.remotePeerSdpConstraints;
        }
        defaults.sdpConstraints = setSdpConstraints(sdpConstraints);
        this.addRemoteSdp(config.remoteSdp, function () {
            createOfferOrAnswer('createAnswer');
        });
    }

    function setChannelEvents(channel) {
        // force ArrayBuffer in Firefox; which uses "Blob" by default.
        channel.binaryType = 'arraybuffer';

        channel.onmessage = function (event) {
            config.onDataChannelMessage(event.data);
        };

        channel.onopen = function () {
            config.onDataChannelOpened(channel);
        };

        channel.onerror = function (error) {
            config.onDataChannelError(error);
        };

        channel.onclose = function (event) {
            config.onDataChannelClosed(event);
        };

        channel.internalSend = channel.send;
        channel.send = function (data) {
            if (channel.readyState !== 'open') {
                return;
            }

            channel.internalSend(data);
        };

        peer.channel = channel;
    }

    if (connection.session.audio == 'two-way' || connection.session.video == 'two-way' || connection.session.screen == 'two-way') {
        defaults.sdpConstraints = setSdpConstraints({
            OfferToReceiveAudio: connection.session.audio == 'two-way' || (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.OfferToReceiveAudio),
            OfferToReceiveVideo: connection.session.video == 'two-way' || connection.session.screen == 'two-way' || (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.OfferToReceiveAudio)
        });
    }

    var streamsToShare = {};
    peer.getLocalStreams().forEach(function (stream) {
        streamsToShare[stream.streamid] = {
            isAudio: !!stream.isAudio,
            isVideo: !!stream.isVideo,
            isScreen: !!stream.isScreen
        };
    });

    /**
     * create Offer Or Answer
     * @method
     * @name createOfferOrAnswer
     * @param {string} _method createOffer or createAnswer
     * @return {RTCPeerconnection} peer
     */
    function createOfferOrAnswer(_method) {
        webrtcdev.log("[RTC PC] createOfferOrAnswer ", _method, " , defaults.sdpConstraints ", defaults.sdpConstraints);
        peer[_method](defaults.sdpConstraints).then(function (localSdp) {
            if (DetectRTC.browser.name !== 'Safari') {
                localSdp.sdp = connection.processSdp(localSdp.sdp);
            }

            peer.setLocalDescription(localSdp).then(function () {

                webrtcdev.log("[RTC PC] createOfferOrAnswer - connection ", connection);
                webrtcdev.log("[RTC PC] createOfferOrAnswer - localSDP ", localSdp.type, localSdp.sdp);

                if (!connection.trickleIce) {
                    webrtcdev.error("[RTC PC] not trickleICE ");
                    return;
                }

                // if (_method == "createOffer") {
                //     webrtcdev.log("[RTC PC] created Offered - modify the SDP with MCU media gateway before setting local Description");
                //     localSdp.sdp = connection.processMcuSdp(localSdp.sdp, "localSdp");
                // } else if (_method == "createAnswer") {
                //     webrtcdev.log("[RTC PC] created Answer - modify the SDP with MCU media gateway before setting local Description");
                //     localSdp.sdp = connection.processMcuSdp(localSdp.sdp, "localSdp");
                // }

                config.onLocalSdp({
                    type: localSdp.type,
                    sdp: localSdp.sdp,
                    remotePeerSdpConstraints: config.remotePeerSdpConstraints || false,
                    renegotiatingPeer: !!config.renegotiatingPeer || false,
                    connectionDescription: self.connectionDescription,
                    dontGetRemoteStream: !!config.dontGetRemoteStream,
                    extra: connection ? connection.extra : {},
                    streamsToShare: streamsToShare
                });

                connection.onSettingLocalDescription(self);
            }, function (error) {
                webrtcdev.error('[RTC PC] setLocalDescription error', error);
            });
        }, function (error) {
            webrtcdev.error('[RTC PC] setLocalDescription sdp-error', error);
        });
    }

    if (isOfferer) {
        createOfferOrAnswer('createOffer');
    }

    peer.nativeClose = peer.close;
    peer.close = function () {
        if (!peer) {
            return;
        }

        try {
            if (peer.nativeClose !== peer.close) {
                peer.nativeClose();
            }
        } catch (e) {
            webrtcdev.error("[RTCPeerocnnection ] peer onclose error ", e);
        }

        peer = null;
        self.peer = null;
    };

    this.peer = peer;
}
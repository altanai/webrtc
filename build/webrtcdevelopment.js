/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */// '';

var RTCMultiConnection = function(roomid, forceOptions) {

var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

(function(that) {
    if (!that) {
        return;
    }

    if (typeof window !== 'undefined') {
        return;
    }

    if (typeof global === 'undefined') {
        return;
    }

    global.navigator = {
        userAgent: browserFakeUserAgent,
        getUserMedia: function() {}
    };

    if (!global.console) {
        global.console = {};
    }

    if (typeof global.console.debug === 'undefined') {
        global.console.debug = global.console.info = global.console.error = global.console.log = global.console.log || function() {
            console.log(arguments);
        };
    }

    if (typeof document === 'undefined') {
        /*global document:true */
        that.document = {};

        document.createElement = document.captureStream = document.mozCaptureStream = function() {
            var obj = {
                getContext: function() {
                    return obj;
                },
                play: function() {},
                pause: function() {},
                drawImage: function() {},
                toDataURL: function() {
                    return '';
                }
            };
            return obj;
        };

        document.addEventListener = document.removeEventListener = that.addEventListener = that.removeEventListener = function() {};

        that.HTMLVideoElement = that.HTMLMediaElement = function() {};
    }

    if (typeof io === 'undefined') {
        that.io = function() {
            return {
                on: function(eventName, callback) {
                    callback = callback || function() {};

                    if (eventName === 'connect') {
                        callback();
                    }
                },
                emit: function(eventName, data, callback) {
                    callback = callback || function() {};
                    if (eventName === 'open-room' || eventName === 'join-room') {
                        callback(true, data.sessionid, null);
                    }
                }
            };
        };
    }

    if (typeof location === 'undefined') {
        /*global location:true */
        that.location = {
            protocol: 'file:',
            href: '',
            hash: '',
            origin: 'self'
        };
    }

    if (typeof screen === 'undefined') {
        /*global screen:true */
        that.screen = {
            width: 0,
            height: 0
        };
    }

    if (typeof URL === 'undefined') {
        /*global screen:true */
        that.URL = {
            createObjectURL: function() {
                return '';
            },
            revokeObjectURL: function() {
                return '';
            }
        };
    }

    /*global window:true */
    that.window = global;
})(typeof global !== 'undefined' ? global : null);

function SocketConnection(connection, connectCallback) {

    console.log(" >>>>s  SocketConnection ", connection);

    function isData(session) {
        return !session.audio && !session.video && !session.screen && session.data;
    }

    var parameters = '';

    parameters += '?userid=' + connection.userid;
    parameters += '&sessionid=' + connection.sessionid;
    parameters += '&msgEvent=' + connection.socketMessageEvent;
    parameters += '&socketCustomEvent=' + connection.socketCustomEvent;
    parameters += '&autoCloseEntireSession=' + !!connection.autoCloseEntireSession;

    if (connection.session.broadcast === true) {
        parameters += '&oneToMany=true';
    }

    parameters += '&maxParticipantsAllowed=' + connection.maxParticipantsAllowed;

    if (connection.enableScalableBroadcast) {
        parameters += '&enableScalableBroadcast=true';
        parameters += '&maxRelayLimitPerUser=' + (connection.maxRelayLimitPerUser || 2);
    }

    parameters += '&extra=' + JSON.stringify(connection.extra || {});

    if (connection.socketCustomParameters) {
        parameters += connection.socketCustomParameters;
    }

    try {
        io.sockets = {};
    } catch (e) {};

    if (!connection.socketURL) {
        console.log(" >>>>s  socket.io url is missing , using / ");
        connection.socketURL = '/';
    }

    if (connection.socketURL.substr(connection.socketURL.length - 1, 1) != '/') {
        // connection.socketURL = 'https://domain.com:9001/';
        throw '"socketURL" MUST end with a slash.';
    }

    if (connection.enableLogs) {
        if (connection.socketURL == '/') {
            console.info('socket.io url is: ', location.origin + '/');
        } else {
            console.info('socket.io url is: ', connection.socketURL);
        }
    }

    try {
        connection.socket = io(connection.socketURL + parameters);
    } catch (e) {
        connection.socket = io.connect(connection.socketURL + parameters, connection.socketOptions);
    }

    var mPeer = connection.multiPeersHandler;

    connection.socket.on('extra-data-updated', function(remoteUserId, extra) {
        if (!connection.peers[remoteUserId]) return;
        connection.peers[remoteUserId].extra = extra;

        connection.onExtraDataUpdated({
            userid: remoteUserId,
            extra: extra
        });

        updateExtraBackup(remoteUserId, extra);
    });

    function updateExtraBackup(remoteUserId, extra) {
        if (!connection.peersBackup[remoteUserId]) {
            connection.peersBackup[remoteUserId] = {
                userid: remoteUserId,
                extra: {}
            };
        }

        connection.peersBackup[remoteUserId].extra = extra;
    }

    function onMessageEvent(message) {
        if (message.remoteUserId != connection.userid) return;

        if (connection.peers[message.sender] && connection.peers[message.sender].extra != message.message.extra) {
            connection.peers[message.sender].extra = message.extra;
            connection.onExtraDataUpdated({
                userid: message.sender,
                extra: message.extra
            });

            updateExtraBackup(message.sender, message.extra);
        }

        if (message.message.streamSyncNeeded && connection.peers[message.sender]) {
            var stream = connection.streamEvents[message.message.streamid];
            if (!stream || !stream.stream) {
                return;
            }

            var action = message.message.action;

            if (action === 'ended' || action === 'inactive' || action === 'stream-removed') {
                if (connection.peersBackup[stream.userid]) {
                    stream.extra = connection.peersBackup[stream.userid].extra;
                }
                connection.onstreamended(stream);
                return;
            }

            var type = message.message.type != 'both' ? message.message.type : null;

            if (typeof stream.stream[action] == 'function') {
                stream.stream[action](type);
            }
            return;
        }

        if (message.message === 'dropPeerConnection') {
            connection.deletePeer(message.sender);
            return;
        }

        if (message.message.allParticipants) {
            if (message.message.allParticipants.indexOf(message.sender) === -1) {
                message.message.allParticipants.push(message.sender);
            }

            message.message.allParticipants.forEach(function(participant) {
                mPeer[!connection.peers[participant] ? 'createNewPeer' : 'renegotiatePeer'](participant, {
                    localPeerSdpConstraints: {
                        OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                    },
                    remotePeerSdpConstraints: {
                        OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                    },
                    isOneWay: !!connection.session.oneway || connection.direction === 'one-way',
                    isDataOnly: isData(connection.session)
                });
            });
            return;
        }

        if (message.message.newParticipant) {
            if (message.message.newParticipant == connection.userid) return;
            if (!!connection.peers[message.message.newParticipant]) return;

            mPeer.createNewPeer(message.message.newParticipant, message.message.userPreferences || {
                localPeerSdpConstraints: {
                    OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                },
                remotePeerSdpConstraints: {
                    OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                },
                isOneWay: !!connection.session.oneway || connection.direction === 'one-way',
                isDataOnly: isData(connection.session)
            });
            return;
        }

        if (message.message.readyForOffer) {
            if (connection.attachStreams.length) {
                connection.waitingForLocalMedia = false;
            }

            if (connection.waitingForLocalMedia) {
                // if someone is waiting to join you
                // make sure that we've local media before making a handshake
                setTimeout(function() {
                    onMessageEvent(message);
                }, 1);
                return;
            }
        }

        if (message.message.newParticipationRequest && message.sender !== connection.userid) {
            if (connection.peers[message.sender]) {
                connection.deletePeer(message.sender);
            }

            var userPreferences = {
                extra: message.extra || {},
                localPeerSdpConstraints: message.message.remotePeerSdpConstraints || {
                    OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                },
                remotePeerSdpConstraints: message.message.localPeerSdpConstraints || {
                    OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                },
                isOneWay: typeof message.message.isOneWay !== 'undefined' ? message.message.isOneWay : !!connection.session.oneway || connection.direction === 'one-way',
                isDataOnly: typeof message.message.isDataOnly !== 'undefined' ? message.message.isDataOnly : isData(connection.session),
                dontGetRemoteStream: typeof message.message.isOneWay !== 'undefined' ? message.message.isOneWay : !!connection.session.oneway || connection.direction === 'one-way',
                dontAttachLocalStream: !!message.message.dontGetRemoteStream,
                connectionDescription: message,
                successCallback: function() {}
            };

            connection.onNewParticipant(message.sender, userPreferences);
            return;
        }

        if (message.message.changedUUID) {
            if (connection.peers[message.message.oldUUID]) {
                connection.peers[message.message.newUUID] = connection.peers[message.message.oldUUID];
                delete connection.peers[message.message.oldUUID];
            }
        }

        if (message.message.userLeft) {
            mPeer.onUserLeft(message.sender);

            if (!!message.message.autoCloseEntireSession) {
                connection.leave();
            }

            return;
        }

        mPeer.addNegotiatedMessage(message.message, message.sender);
    }

    connection.socket.on(connection.socketMessageEvent, onMessageEvent);

    var alreadyConnected = false;

    connection.socket.resetProps = function() {
        alreadyConnected = false;
    };

    connection.socket.on('connect', function() {
        if (alreadyConnected) {
            return;
        }
        alreadyConnected = true;

        if (connection.enableLogs) {
            console.info('socket.io connection is opened.');
        }

        setTimeout(function() {
            connection.socket.emit('extra-data-updated', connection.extra);
        }, 1000);

        if (connectCallback) {
            connectCallback(connection.socket);
        }
    });

    connection.socket.on('disconnect', function(event) {
        connection.onSocketDisconnect(event);
    });

    connection.socket.on('error', function(event) {
        connection.onSocketError(event);
    });

    connection.socket.on('user-disconnected', function(remoteUserId) {
        if (remoteUserId === connection.userid) {
            return;
        }

        connection.onUserStatusChanged({
            userid: remoteUserId,
            status: 'offline',
            extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra || {} : {}
        });

        connection.deletePeer(remoteUserId);
    });

    connection.socket.on('user-connected', function(userid) {
        if (userid === connection.userid) {
            return;
        }

        connection.onUserStatusChanged({
            userid: userid,
            status: 'online',
            extra: connection.peers[userid] ? connection.peers[userid].extra || {} : {}
        });
    });

    connection.socket.on('closed-entire-session', function(sessionid, extra) {
        connection.leave();
        connection.onEntireSessionClosed({
            sessionid: sessionid,
            userid: sessionid,
            extra: extra
        });
    });

    connection.socket.on('userid-already-taken', function(useridAlreadyTaken, yourNewUserId) {
        connection.onUserIdAlreadyTaken(useridAlreadyTaken, yourNewUserId);
    });

    connection.socket.on('logs', function(log) {
        if (!connection.enableLogs) return;
        console.debug('server-logs', log);
    });

    connection.socket.on('number-of-broadcast-viewers-updated', function(data) {
        connection.onNumberOfBroadcastViewersUpdated(data);
    });

    connection.socket.on('set-isInitiator-true', function(sessionid) {
        if (sessionid != connection.sessionid) return;
        connection.isInitiator = true;
    });
}

function MultiPeers(connection) {
    var self = this;

    var skipPeers = ['getAllParticipants', 'getLength', 'selectFirst', 'streams', 'send', 'forEach'];
    connection.peers = {
        getLength: function() {
            var numberOfPeers = 0;
            for (var peer in this) {
                if (skipPeers.indexOf(peer) == -1) {
                    numberOfPeers++;
                }
            }
            return numberOfPeers;
        },
        selectFirst: function() {
            var firstPeer;
            for (var peer in this) {
                if (skipPeers.indexOf(peer) == -1) {
                    firstPeer = this[peer];
                }
            }
            return firstPeer;
        },
        getAllParticipants: function(sender) {
            var allPeers = [];
            for (var peer in this) {
                if (skipPeers.indexOf(peer) == -1 && peer != sender) {
                    allPeers.push(peer);
                }
            }
            return allPeers;
        },
        forEach: function(callbcak) {
            this.getAllParticipants().forEach(function(participant) {
                callbcak(connection.peers[participant]);
            });
        },
        send: function(data, remoteUserId) {
            var that = this;

            if (!isNull(data.size) && !isNull(data.type)) {
                if (connection.enableFileSharing) {
                    self.shareFile(data, remoteUserId);
                    return;
                }

                if (typeof data !== 'string') {
                    data = JSON.stringify(data);
                }
            }

            if (data.type !== 'text' && !(data instanceof ArrayBuffer) && !(data instanceof DataView)) {
                TextSender.send({
                    text: data,
                    channel: this,
                    connection: connection,
                    remoteUserId: remoteUserId
                });
                return;
            }

            if (data.type === 'text') {
                data = JSON.stringify(data);
            }

            if (remoteUserId) {
                var remoteUser = connection.peers[remoteUserId];
                if (remoteUser) {
                    if (!remoteUser.channels.length) {
                        connection.peers[remoteUserId].createDataChannel();
                        connection.renegotiate(remoteUserId);
                        setTimeout(function() {
                            that.send(data, remoteUserId);
                        }, 3000);
                        return;
                    }

                    remoteUser.channels.forEach(function(channel) {
                        channel.send(data);
                    });
                    return;
                }
            }

            this.getAllParticipants().forEach(function(participant) {
                if (!that[participant].channels.length) {
                    connection.peers[participant].createDataChannel();
                    connection.renegotiate(participant);
                    setTimeout(function() {
                        that[participant].channels.forEach(function(channel) {
                            channel.send(data);
                        });
                    }, 3000);
                    return;
                }

                that[participant].channels.forEach(function(channel) {
                    channel.send(data);
                });
            });
        }
    };

    this.uuid = connection.userid;

    this.getLocalConfig = function(remoteSdp, remoteUserId, userPreferences) {
        if (!userPreferences) {
            userPreferences = {};
        }

        return {
            streamsToShare: userPreferences.streamsToShare || {},
            rtcMultiConnection: connection,
            connectionDescription: userPreferences.connectionDescription,
            userid: remoteUserId,
            localPeerSdpConstraints: userPreferences.localPeerSdpConstraints,
            remotePeerSdpConstraints: userPreferences.remotePeerSdpConstraints,
            dontGetRemoteStream: !!userPreferences.dontGetRemoteStream,
            dontAttachLocalStream: !!userPreferences.dontAttachLocalStream,
            renegotiatingPeer: !!userPreferences.renegotiatingPeer,
            peerRef: userPreferences.peerRef,
            channels: userPreferences.channels || [],
            onLocalSdp: function(localSdp) {
                self.onNegotiationNeeded(localSdp, remoteUserId);
            },
            onLocalCandidate: function(localCandidate) {
                localCandidate = OnIceCandidateHandler.processCandidates(connection, localCandidate)
                if (localCandidate) {
                    self.onNegotiationNeeded(localCandidate, remoteUserId);
                }
            },
            remoteSdp: remoteSdp,
            onDataChannelMessage: function(message) {
                if (!connection.fbr && connection.enableFileSharing) initFileBufferReader();

                if (typeof message == 'string' || !connection.enableFileSharing) {
                    self.onDataChannelMessage(message, remoteUserId);
                    return;
                }

                var that = this;

                if (message instanceof ArrayBuffer || message instanceof DataView) {
                    connection.fbr.convertToObject(message, function(object) {
                        that.onDataChannelMessage(object);
                    });
                    return;
                }

                if (message.readyForNextChunk) {
                    connection.fbr.getNextChunk(message, function(nextChunk, isLastChunk) {
                        connection.peers[remoteUserId].channels.forEach(function(channel) {
                            channel.send(nextChunk);
                        });
                    }, remoteUserId);
                    return;
                }

                if (message.chunkMissing) {
                    connection.fbr.chunkMissing(message);
                    return;
                }

                connection.fbr.addChunk(message, function(promptNextChunk) {
                    connection.peers[remoteUserId].peer.channel.send(promptNextChunk);
                });
            },
            onDataChannelError: function(error) {
                self.onDataChannelError(error, remoteUserId);
            },
            onDataChannelOpened: function(channel) {
                self.onDataChannelOpened(channel, remoteUserId);
            },
            onDataChannelClosed: function(event) {
                self.onDataChannelClosed(event, remoteUserId);
            },
            onRemoteStream: function(stream) {
                if (connection.peers[remoteUserId]) {
                    connection.peers[remoteUserId].streams.push(stream);
                }

                self.onGettingRemoteMedia(stream, remoteUserId);
            },
            onRemoteStreamRemoved: function(stream) {
                self.onRemovingRemoteMedia(stream, remoteUserId);
            },
            onPeerStateChanged: function(states) {
                self.onPeerStateChanged(states);

                if (states.iceConnectionState === 'new') {
                    self.onNegotiationStarted(remoteUserId, states);
                }

                if (states.iceConnectionState === 'connected') {
                    self.onNegotiationCompleted(remoteUserId, states);
                }

                if (states.iceConnectionState.search(/closed|failed/gi) !== -1) {
                    self.onUserLeft(remoteUserId);
                    self.disconnectWith(remoteUserId);
                }
            }
        };
    };

    this.createNewPeer = function(remoteUserId, userPreferences) {
        if (connection.maxParticipantsAllowed <= connection.getAllParticipants().length) {
            return;
        }

        userPreferences = userPreferences || {};

        if (connection.isInitiator && !!connection.session.audio && connection.session.audio === 'two-way' && !userPreferences.streamsToShare) {
            userPreferences.isOneWay = false;
            userPreferences.isDataOnly = false;
            userPreferences.session = connection.session;
        }

        if (!userPreferences.isOneWay && !userPreferences.isDataOnly) {
            userPreferences.isOneWay = true;
            this.onNegotiationNeeded({
                enableMedia: true,
                userPreferences: userPreferences
            }, remoteUserId);
            return;
        }

        userPreferences = connection.setUserPreferences(userPreferences, remoteUserId);
        var localConfig = this.getLocalConfig(null, remoteUserId, userPreferences);
        connection.peers[remoteUserId] = new PeerInitiator(localConfig);
    };

    this.createAnsweringPeer = function(remoteSdp, remoteUserId, userPreferences) {
        userPreferences = connection.setUserPreferences(userPreferences || {}, remoteUserId);

        var localConfig = this.getLocalConfig(remoteSdp, remoteUserId, userPreferences);
        connection.peers[remoteUserId] = new PeerInitiator(localConfig);
    };

    this.renegotiatePeer = function(remoteUserId, userPreferences, remoteSdp) {
        if (!connection.peers[remoteUserId]) {
            if (connection.enableLogs) {
                console.error('Peer (' + remoteUserId + ') does not exist. Renegotiation skipped.');
            }
            return;
        }

        if (!userPreferences) {
            userPreferences = {};
        }

        userPreferences.renegotiatingPeer = true;
        userPreferences.peerRef = connection.peers[remoteUserId].peer;
        userPreferences.channels = connection.peers[remoteUserId].channels;

        var localConfig = this.getLocalConfig(remoteSdp, remoteUserId, userPreferences);

        connection.peers[remoteUserId] = new PeerInitiator(localConfig);
    };

    this.replaceTrack = function(track, remoteUserId, isVideoTrack) {
        if (!connection.peers[remoteUserId]) {
            throw 'This peer (' + remoteUserId + ') does not exist.';
        }

        var peer = connection.peers[remoteUserId].peer;

        if (!!peer.getSenders && typeof peer.getSenders === 'function' && peer.getSenders().length) {
            peer.getSenders().forEach(function(rtpSender) {
                if (isVideoTrack && rtpSender.track.kind === 'video') {
                    connection.peers[remoteUserId].peer.lastVideoTrack = rtpSender.track;
                    rtpSender.replaceTrack(track);
                }

                if (!isVideoTrack && rtpSender.track.kind === 'audio') {
                    connection.peers[remoteUserId].peer.lastAudioTrack = rtpSender.track;
                    rtpSender.replaceTrack(track);
                }
            });
            return;
        }

        console.warn('RTPSender.replaceTrack is NOT supported.');
        this.renegotiatePeer(remoteUserId);
    };

    this.onNegotiationNeeded = function(message, remoteUserId) {};
    this.addNegotiatedMessage = function(message, remoteUserId) {
        if (message.type && message.sdp) {
            if (message.type == 'answer') {
                if (connection.peers[remoteUserId]) {
                    connection.peers[remoteUserId].addRemoteSdp(message);
                }
            }

            if (message.type == 'offer') {
                if (message.renegotiatingPeer) {
                    this.renegotiatePeer(remoteUserId, null, message);
                } else {
                    this.createAnsweringPeer(message, remoteUserId);
                }
            }

            if (connection.enableLogs) {
                console.log('Remote peer\'s sdp:', message.sdp);
            }
            return;
        }

        if (message.candidate) {
            if (connection.peers[remoteUserId]) {
                connection.peers[remoteUserId].addRemoteCandidate(message);
            }

            if (connection.enableLogs) {
                console.log('Remote peer\'s candidate pairs:', message.candidate);
            }
            return;
        }

        if (message.enableMedia) {
            connection.session = message.userPreferences.session || connection.session;

            if (connection.session.oneway && connection.attachStreams.length) {
                connection.attachStreams = [];
            }

            if (message.userPreferences.isDataOnly && connection.attachStreams.length) {
                connection.attachStreams.length = [];
            }

            var streamsToShare = {};
            connection.attachStreams.forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                };
            });
            message.userPreferences.streamsToShare = streamsToShare;

            self.onNegotiationNeeded({
                readyForOffer: true,
                userPreferences: message.userPreferences
            }, remoteUserId);
        }

        if (message.readyForOffer) {
            connection.onReadyForOffer(remoteUserId, message.userPreferences);
        }

        function cb(stream) {
            gumCallback(stream, message, remoteUserId);
        }
    };

    function gumCallback(stream, message, remoteUserId) {
        var streamsToShare = {};
        connection.attachStreams.forEach(function(stream) {
            streamsToShare[stream.streamid] = {
                isAudio: !!stream.isAudio,
                isVideo: !!stream.isVideo,
                isScreen: !!stream.isScreen
            };
        });
        message.userPreferences.streamsToShare = streamsToShare;

        self.onNegotiationNeeded({
            readyForOffer: true,
            userPreferences: message.userPreferences
        }, remoteUserId);
    }

    this.onGettingRemoteMedia = function(stream, remoteUserId) {};
    this.onRemovingRemoteMedia = function(stream, remoteUserId) {};
    this.onGettingLocalMedia = function(localStream) {};
    this.onLocalMediaError = function(error, constraints) {
        connection.onMediaError(error, constraints);
    };

    function initFileBufferReader() {
        connection.fbr = new FileBufferReader();
        connection.fbr.onProgress = function(chunk) {
            connection.onFileProgress(chunk);
        };
        connection.fbr.onBegin = function(file) {
            connection.onFileStart(file);
        };
        connection.fbr.onEnd = function(file) {
            connection.onFileEnd(file);
        };
    }

    this.shareFile = function(file, remoteUserId) {
        initFileBufferReader();

        connection.fbr.readAsArrayBuffer(file, function(uuid) {
            var arrayOfUsers = connection.getAllParticipants();

            if (remoteUserId) {
                arrayOfUsers = [remoteUserId];
            }

            arrayOfUsers.forEach(function(participant) {
                connection.fbr.getNextChunk(uuid, function(nextChunk) {
                    connection.peers[participant].channels.forEach(function(channel) {
                        channel.send(nextChunk);
                    });
                }, participant);
            });
        }, {
            userid: connection.userid,
            // extra: connection.extra,
            chunkSize: DetectRTC.browser.name === 'Firefox' ? 15 * 1000 : connection.chunkSize || 0
        });
    };

    if (typeof 'TextReceiver' !== 'undefined') {
        var textReceiver = new TextReceiver(connection);
    }

    this.onDataChannelMessage = function(message, remoteUserId) {
        textReceiver.receive(JSON.parse(message), remoteUserId, connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {});
    };

    this.onDataChannelClosed = function(event, remoteUserId) {
        event.userid = remoteUserId;
        event.extra = connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {};
        connection.onclose(event);
    };

    this.onDataChannelError = function(error, remoteUserId) {
        error.userid = remoteUserId;
        event.extra = connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {};
        connection.onerror(error);
    };

    this.onDataChannelOpened = function(channel, remoteUserId) {
        // keep last channel only; we are not expecting parallel/channels channels
        if (connection.peers[remoteUserId].channels.length) {
            connection.peers[remoteUserId].channels = [channel];
            return;
        }

        connection.peers[remoteUserId].channels.push(channel);
        connection.onopen({
            userid: remoteUserId,
            extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
            channel: channel
        });
    };

    this.onPeerStateChanged = function(state) {
        connection.onPeerStateChanged(state);
    };

    this.onNegotiationStarted = function(remoteUserId, states) {};
    this.onNegotiationCompleted = function(remoteUserId, states) {};

    this.getRemoteStreams = function(remoteUserId) {
        remoteUserId = remoteUserId || connection.peers.getAllParticipants()[0];
        return connection.peers[remoteUserId] ? connection.peers[remoteUserId].streams : [];
    };
}

'';

// Last Updated On: 2019-01-10 5:32:55 AM UTC

// ________________
// DetectRTC v1.3.9

// Open-Sourced: https://github.com/muaz-khan/DetectRTC

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

(function() {

    var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

    var isNodejs = typeof process === 'object' && typeof process.versions === 'object' && process.versions.node && /*node-process*/ !process.browser;
    if (isNodejs) {
        var version = process.versions.node.toString().replace('v', '');
        browserFakeUserAgent = 'Nodejs/' + version + ' (NodeOS) AppleWebKit/' + version + ' (KHTML, like Gecko) Nodejs/' + version + ' Nodejs/' + version
    }

    (function(that) {
        if (typeof window !== 'undefined') {
            return;
        }

        if (typeof window === 'undefined' && typeof global !== 'undefined') {
            global.navigator = {
                userAgent: browserFakeUserAgent,
                getUserMedia: function() {}
            };

            /*global window:true */
            that.window = global;
        } else if (typeof window === 'undefined') {
            // window = this;
        }

        if (typeof location === 'undefined') {
            /*global location:true */
            that.location = {
                protocol: 'file:',
                href: '',
                hash: ''
            };
        }

        if (typeof screen === 'undefined') {
            /*global screen:true */
            that.screen = {
                width: 0,
                height: 0
            };
        }
    })(typeof global !== 'undefined' ? global : window);

    /*global navigator:true */
    var navigator = window.navigator;

    if (typeof navigator !== 'undefined') {
        if (typeof navigator.webkitGetUserMedia !== 'undefined') {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
        }

        if (typeof navigator.mozGetUserMedia !== 'undefined') {
            navigator.getUserMedia = navigator.mozGetUserMedia;
        }
    } else {
        navigator = {
            getUserMedia: function() {},
            userAgent: browserFakeUserAgent
        };
    }

    var isMobileDevice = !!(/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent || ''));

    var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);

    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof window.InstallTrigger !== 'undefined';
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isChrome = !!window.chrome && !isOpera;
    var isIE = typeof document !== 'undefined' && !!document.documentMode && !isEdge;

    // this one can also be used:
    // https://www.websocket.org/js/stuff.js (DetectBrowser.js)

    function getBrowserInfo() {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // both and safri and chrome has same userAgent
        if (isSafari && !isChrome && nAgt.indexOf('CriOS') !== -1) {
            isSafari = false;
            isChrome = true;
        }

        // In Opera, the true version is after 'Opera' or after 'Version'
        if (isOpera) {
            browserName = 'Opera';
            try {
                fullVersion = navigator.userAgent.split('OPR/')[1].split(' ')[0];
                majorVersion = fullVersion.split('.')[0];
            } catch (e) {
                fullVersion = '0.0.0.0';
                majorVersion = 0;
            }
        }
        // In MSIE version <=10, the true version is after 'MSIE' in userAgent
        // In IE 11, look for the string after 'rv:'
        else if (isIE) {
            verOffset = nAgt.indexOf('rv:');
            if (verOffset > 0) { //IE 11
                fullVersion = nAgt.substring(verOffset + 3);
            } else { //IE 10 or earlier
                verOffset = nAgt.indexOf('MSIE');
                fullVersion = nAgt.substring(verOffset + 5);
            }
            browserName = 'IE';
        }
        // In Chrome, the true version is after 'Chrome' 
        else if (isChrome) {
            verOffset = nAgt.indexOf('Chrome');
            browserName = 'Chrome';
            fullVersion = nAgt.substring(verOffset + 7);
        }
        // In Safari, the true version is after 'Safari' or after 'Version' 
        else if (isSafari) {
            verOffset = nAgt.indexOf('Safari');

            browserName = 'Safari';
            fullVersion = nAgt.substring(verOffset + 7);

            if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }

            if (navigator.userAgent.indexOf('Version/') !== -1) {
                fullVersion = navigator.userAgent.split('Version/')[1].split(' ')[0];
            }
        }
        // In Firefox, the true version is after 'Firefox' 
        else if (isFirefox) {
            verOffset = nAgt.indexOf('Firefox');
            browserName = 'Firefox';
            fullVersion = nAgt.substring(verOffset + 8);
        }

        // In most other browsers, 'name/version' is at the end of userAgent 
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);

            if (browserName.toLowerCase() === browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }

        if (isEdge) {
            browserName = 'Edge';
            fullVersion = navigator.userAgent.split('Edge/')[1];
            // fullVersion = parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10).toString();
        }

        // trim the fullVersion string at semicolon/space/bracket if present
        if ((ix = fullVersion.search(/[; \)]/)) !== -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt('' + fullVersion, 10);

        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        return {
            fullVersion: fullVersion,
            version: majorVersion,
            name: browserName,
            isPrivateBrowsing: false
        };
    }

    // via: https://gist.github.com/cou929/7973956

    function retry(isDone, next) {
        var currentTrial = 0,
            maxRetry = 50,
            interval = 10,
            isTimeout = false;
        var id = window.setInterval(
            function() {
                if (isDone()) {
                    window.clearInterval(id);
                    next(isTimeout);
                }
                if (currentTrial++ > maxRetry) {
                    window.clearInterval(id);
                    isTimeout = true;
                    next(isTimeout);
                }
            },
            10
        );
    }

    function isIE10OrLater(userAgent) {
        var ua = userAgent.toLowerCase();
        if (ua.indexOf('msie') === 0 && ua.indexOf('trident') === 0) {
            return false;
        }
        var match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
        if (match && parseInt(match[1], 10) >= 10) {
            return true;
        }
        return false;
    }

    function detectPrivateMode(callback) {
        var isPrivate;

        try {

            if (window.webkitRequestFileSystem) {
                window.webkitRequestFileSystem(
                    window.TEMPORARY, 1,
                    function() {
                        isPrivate = false;
                    },
                    function(e) {
                        isPrivate = true;
                    }
                );
            } else if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
                var db;
                try {
                    db = window.indexedDB.open('test');
                    db.onerror = function() {
                        return true;
                    };
                } catch (e) {
                    isPrivate = true;
                }

                if (typeof isPrivate === 'undefined') {
                    retry(
                        function isDone() {
                            return db.readyState === 'done' ? true : false;
                        },
                        function next(isTimeout) {
                            if (!isTimeout) {
                                isPrivate = db.result ? false : true;
                            }
                        }
                    );
                }
            } else if (isIE10OrLater(window.navigator.userAgent)) {
                isPrivate = false;
                try {
                    if (!window.indexedDB) {
                        isPrivate = true;
                    }
                } catch (e) {
                    isPrivate = true;
                }
            } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
                try {
                    window.localStorage.setItem('test', 1);
                } catch (e) {
                    isPrivate = true;
                }

                if (typeof isPrivate === 'undefined') {
                    isPrivate = false;
                    window.localStorage.removeItem('test');
                }
            }

        } catch (e) {
            isPrivate = false;
        }

        retry(
            function isDone() {
                return typeof isPrivate !== 'undefined' ? true : false;
            },
            function next(isTimeout) {
                callback(isPrivate);
            }
        );
    }

    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry|BB10/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        },
        getOsName: function() {
            var osName = 'Unknown OS';
            if (isMobile.Android()) {
                osName = 'Android';
            }

            if (isMobile.BlackBerry()) {
                osName = 'BlackBerry';
            }

            if (isMobile.iOS()) {
                osName = 'iOS';
            }

            if (isMobile.Opera()) {
                osName = 'Opera Mini';
            }

            if (isMobile.Windows()) {
                osName = 'Windows';
            }

            return osName;
        }
    };

    // via: http://jsfiddle.net/ChristianL/AVyND/
    function detectDesktopOS() {
        var unknown = '-';

        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;

        var os = unknown;
        var clientStrings = [{
            s: 'Windows 10',
            r: /(Windows 10.0|Windows NT 10.0)/
        }, {
            s: 'Windows 8.1',
            r: /(Windows 8.1|Windows NT 6.3)/
        }, {
            s: 'Windows 8',
            r: /(Windows 8|Windows NT 6.2)/
        }, {
            s: 'Windows 7',
            r: /(Windows 7|Windows NT 6.1)/
        }, {
            s: 'Windows Vista',
            r: /Windows NT 6.0/
        }, {
            s: 'Windows Server 2003',
            r: /Windows NT 5.2/
        }, {
            s: 'Windows XP',
            r: /(Windows NT 5.1|Windows XP)/
        }, {
            s: 'Windows 2000',
            r: /(Windows NT 5.0|Windows 2000)/
        }, {
            s: 'Windows ME',
            r: /(Win 9x 4.90|Windows ME)/
        }, {
            s: 'Windows 98',
            r: /(Windows 98|Win98)/
        }, {
            s: 'Windows 95',
            r: /(Windows 95|Win95|Windows_95)/
        }, {
            s: 'Windows NT 4.0',
            r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
        }, {
            s: 'Windows CE',
            r: /Windows CE/
        }, {
            s: 'Windows 3.11',
            r: /Win16/
        }, {
            s: 'Android',
            r: /Android/
        }, {
            s: 'Open BSD',
            r: /OpenBSD/
        }, {
            s: 'Sun OS',
            r: /SunOS/
        }, {
            s: 'Linux',
            r: /(Linux|X11)/
        }, {
            s: 'iOS',
            r: /(iPhone|iPad|iPod)/
        }, {
            s: 'Mac OS X',
            r: /Mac OS X/
        }, {
            s: 'Mac OS',
            r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
        }, {
            s: 'QNX',
            r: /QNX/
        }, {
            s: 'UNIX',
            r: /UNIX/
        }, {
            s: 'BeOS',
            r: /BeOS/
        }, {
            s: 'OS/2',
            r: /OS\/2/
        }, {
            s: 'Search Bot',
            r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
        }];
        for (var i = 0, cs; cs = clientStrings[i]; i++) {
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            if (/Windows (.*)/.test(os)) {
                osVersion = /Windows (.*)/.exec(os)[1];
            }
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS X':
                if (/Mac OS X (10[\.\_\d]+)/.test(nAgt)) {
                    osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                }
                break;
            case 'Android':
                if (/Android ([\.\_\d]+)/.test(nAgt)) {
                    osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                }
                break;
            case 'iOS':
                if (/OS (\d+)_(\d+)_?(\d+)?/.test(nAgt)) {
                    osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                    osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                }
                break;
        }

        return {
            osName: os,
            osVersion: osVersion
        };
    }

    var osName = 'Unknown OS';
    var osVersion = 'Unknown OS Version';

    function getAndroidVersion(ua) {
        ua = (ua || navigator.userAgent).toLowerCase();
        var match = ua.match(/android\s([0-9\.]*)/);
        return match ? match[1] : false;
    }

    var osInfo = detectDesktopOS();

    if (osInfo && osInfo.osName && osInfo.osName != '-') {
        osName = osInfo.osName;
        osVersion = osInfo.osVersion;
    } else if (isMobile.any()) {
        osName = isMobile.getOsName();

        if (osName == 'Android') {
            osVersion = getAndroidVersion();
        }
    }

    var isNodejs = typeof process === 'object' && typeof process.versions === 'object' && process.versions.node;

    if (osName === 'Unknown OS' && isNodejs) {
        osName = 'Nodejs';
        osVersion = process.versions.node.toString().replace('v', '');
    }

    var isCanvasSupportsStreamCapturing = false;
    var isVideoSupportsStreamCapturing = false;
    ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].forEach(function(item) {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
            return;
        }

        if (!isCanvasSupportsStreamCapturing && item in document.createElement('canvas')) {
            isCanvasSupportsStreamCapturing = true;
        }

        if (!isVideoSupportsStreamCapturing && item in document.createElement('video')) {
            isVideoSupportsStreamCapturing = true;
        }
    });

    var regexIpv4Local = /^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/,
        regexIpv4 = /([0-9]{1,3}(\.[0-9]{1,3}){3})/,
        regexIpv6 = /[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}/;

    // via: https://github.com/diafygi/webrtc-ips
    function DetectLocalIPAddress(callback, stream) {
        if (!DetectRTC.isWebRTCSupported) {
            return;
        }

        var isPublic = true,
            isIpv4 = true;
        getIPs(function(ip) {
            if (!ip) {
                callback(); // Pass nothing to tell that ICE-gathering-ended
            } else if (ip.match(regexIpv4Local)) {
                isPublic = false;
                callback('Local: ' + ip, isPublic, isIpv4);
            } else if (ip.match(regexIpv6)) { //via https://ourcodeworld.com/articles/read/257/how-to-get-the-client-ip-address-with-javascript-only
                isIpv4 = false;
                callback('Public: ' + ip, isPublic, isIpv4);
            } else {
                callback('Public: ' + ip, isPublic, isIpv4);
            }
        }, stream);
    }

    function getIPs(callback, stream) {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function') {
            return;
        }

        var ipDuplicates = {};

        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

        if (!RTCPeerConnection) {
            var iframe = document.getElementById('iframe');
            if (!iframe) {
                return;
            }
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection;
        }

        if (!RTCPeerConnection) {
            return;
        }

        var peerConfig = null;

        if (DetectRTC.browser === 'Chrome' && DetectRTC.browser.version < 58) {
            // todo: add support for older Opera
            peerConfig = {
                optional: [{
                    RtpDataChannels: true
                }]
            };
        }

        var servers = {
            iceServers: [{
                urls: 'stun:stun.l.google.com:19302'
            }]
        };

        var pc = new RTCPeerConnection(servers, peerConfig);

        if (stream) {
            if (pc.addStream) {
                pc.addStream(stream);
            } else if (pc.addTrack && stream.getTracks()[0]) {
                pc.addTrack(stream.getTracks()[0], stream);
            }
        }

        function handleCandidate(candidate) {
            if (!candidate) {
                callback(); // Pass nothing to tell that ICE-gathering-ended
                return;
            }

            var match = regexIpv4.exec(candidate);
            if (!match) {
                return;
            }
            var ipAddress = match[1];
            var isPublic = (candidate.match(regexIpv4Local)),
                isIpv4 = true;

            if (ipDuplicates[ipAddress] === undefined) {
                callback(ipAddress, isPublic, isIpv4);
            }

            ipDuplicates[ipAddress] = true;
        }

        // listen for candidate events
        pc.onicecandidate = function(event) {
            if (event.candidate && event.candidate.candidate) {
                handleCandidate(event.candidate.candidate);
            } else {
                handleCandidate(); // Pass nothing to tell that ICE-gathering-ended
            }
        };

        // create data channel
        if (!stream) {
            try {
                pc.createDataChannel('sctp', {});
            } catch (e) {}
        }

        // create an offer sdp
        if (DetectRTC.isPromisesSupported) {
            pc.createOffer().then(function(result) {
                pc.setLocalDescription(result).then(afterCreateOffer);
            });
        } else {
            pc.createOffer(function(result) {
                pc.setLocalDescription(result, afterCreateOffer, function() {});
            }, function() {});
        }

        function afterCreateOffer() {
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function(line) {
                if (line && line.indexOf('a=candidate:') === 0) {
                    handleCandidate(line);
                }
            });
        }
    }

    var MediaDevices = [];

    var audioInputDevices = [];
    var audioOutputDevices = [];
    var videoInputDevices = [];

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // Firefox 38+ seems having support of enumerateDevices
        // Thanks @xdumaine/enumerateDevices
        navigator.enumerateDevices = function(callback) {
            var enumerateDevices = navigator.mediaDevices.enumerateDevices();
            if (enumerateDevices && enumerateDevices.then) {
                navigator.mediaDevices.enumerateDevices().then(callback).catch(function() {
                    callback([]);
                });
            } else {
                callback([]);
            }
        };
    }

    // Media Devices detection
    var canEnumerate = false;

    /*global MediaStreamTrack:true */
    if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
        canEnumerate = true;
    } else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
        canEnumerate = true;
    }

    var hasMicrophone = false;
    var hasSpeakers = false;
    var hasWebcam = false;

    var isWebsiteHasMicrophonePermissions = false;
    var isWebsiteHasWebcamPermissions = false;

    // http://dev.w3.org/2011/webrtc/editor/getusermedia.html#mediadevices
    function checkDeviceSupport(callback) {
        if (!canEnumerate) {
            if (callback) {
                callback();
            }
            return;
        }

        if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
            navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
        }

        if (!navigator.enumerateDevices && navigator.enumerateDevices) {
            navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
        }

        if (!navigator.enumerateDevices) {
            if (callback) {
                callback();
            }
            return;
        }

        MediaDevices = [];

        audioInputDevices = [];
        audioOutputDevices = [];
        videoInputDevices = [];

        hasMicrophone = false;
        hasSpeakers = false;
        hasWebcam = false;

        isWebsiteHasMicrophonePermissions = false;
        isWebsiteHasWebcamPermissions = false;

        // to prevent duplication
        var alreadyUsedDevices = {};

        navigator.enumerateDevices(function(devices) {
            devices.forEach(function(_device) {
                var device = {};
                for (var d in _device) {
                    try {
                        if (typeof _device[d] !== 'function') {
                            device[d] = _device[d];
                        }
                    } catch (e) {}
                }

                if (alreadyUsedDevices[device.deviceId + device.label + device.kind]) {
                    return;
                }

                // if it is MediaStreamTrack.getSources
                if (device.kind === 'audio') {
                    device.kind = 'audioinput';
                }

                if (device.kind === 'video') {
                    device.kind = 'videoinput';
                }

                if (!device.deviceId) {
                    device.deviceId = device.id;
                }

                if (!device.id) {
                    device.id = device.deviceId;
                }

                if (!device.label) {
                    device.isCustomLabel = true;

                    if (device.kind === 'videoinput') {
                        device.label = 'Camera ' + (videoInputDevices.length + 1);
                    } else if (device.kind === 'audioinput') {
                        device.label = 'Microphone ' + (audioInputDevices.length + 1);
                    } else if (device.kind === 'audiooutput') {
                        device.label = 'Speaker ' + (audioOutputDevices.length + 1);
                    } else {
                        device.label = 'Please invoke getUserMedia once.';
                    }

                    if (typeof DetectRTC !== 'undefined' && DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && !/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
                        if (typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1) {
                            device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
                        }
                    }
                } else {
                    // Firefox on Android still returns empty label
                    if (device.kind === 'videoinput' && !isWebsiteHasWebcamPermissions) {
                        isWebsiteHasWebcamPermissions = true;
                    }

                    if (device.kind === 'audioinput' && !isWebsiteHasMicrophonePermissions) {
                        isWebsiteHasMicrophonePermissions = true;
                    }
                }

                if (device.kind === 'audioinput') {
                    hasMicrophone = true;

                    if (audioInputDevices.indexOf(device) === -1) {
                        audioInputDevices.push(device);
                    }
                }

                if (device.kind === 'audiooutput') {
                    hasSpeakers = true;

                    if (audioOutputDevices.indexOf(device) === -1) {
                        audioOutputDevices.push(device);
                    }
                }

                if (device.kind === 'videoinput') {
                    hasWebcam = true;

                    if (videoInputDevices.indexOf(device) === -1) {
                        videoInputDevices.push(device);
                    }
                }

                // there is no 'videoouput' in the spec.
                MediaDevices.push(device);

                alreadyUsedDevices[device.deviceId + device.label + device.kind] = device;
            });

            if (typeof DetectRTC !== 'undefined') {
                // to sync latest outputs
                DetectRTC.MediaDevices = MediaDevices;
                DetectRTC.hasMicrophone = hasMicrophone;
                DetectRTC.hasSpeakers = hasSpeakers;
                DetectRTC.hasWebcam = hasWebcam;

                DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
                DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

                DetectRTC.audioInputDevices = audioInputDevices;
                DetectRTC.audioOutputDevices = audioOutputDevices;
                DetectRTC.videoInputDevices = videoInputDevices;
            }

            if (callback) {
                callback();
            }
        });
    }

    var DetectRTC = window.DetectRTC || {};

    // ----------
    // DetectRTC.browser.name || DetectRTC.browser.version || DetectRTC.browser.fullVersion
    DetectRTC.browser = getBrowserInfo();

    detectPrivateMode(function(isPrivateBrowsing) {
        DetectRTC.browser.isPrivateBrowsing = !!isPrivateBrowsing;
    });

    // DetectRTC.isChrome || DetectRTC.isFirefox || DetectRTC.isEdge
    DetectRTC.browser['is' + DetectRTC.browser.name] = true;

    // -----------
    DetectRTC.osName = osName;
    DetectRTC.osVersion = osVersion;

    var isNodeWebkit = typeof process === 'object' && typeof process.versions === 'object' && process.versions['node-webkit'];

    // --------- Detect if system supports WebRTC 1.0 or WebRTC 1.1.
    var isWebRTCSupported = false;
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function(item) {
        if (isWebRTCSupported) {
            return;
        }

        if (item in window) {
            isWebRTCSupported = true;
        }
    });
    DetectRTC.isWebRTCSupported = isWebRTCSupported;

    //-------
    DetectRTC.isORTCSupported = typeof RTCIceGatherer !== 'undefined';

    // --------- Detect if system supports screen capturing API
    var isScreenCapturingSupported = false;
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version >= 35) {
        isScreenCapturingSupported = true;
    } else if (DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 34) {
        isScreenCapturingSupported = true;
    } else if (DetectRTC.browser.isEdge && DetectRTC.browser.version >= 17) {
        isScreenCapturingSupported = true; // navigator.getDisplayMedia
    } else if (DetectRTC.osName === 'Android' && DetectRTC.browser.isChrome) {
        isScreenCapturingSupported = true;
    }

    if (!/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
        var isNonLocalHost = typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1;
        if (isNonLocalHost && (DetectRTC.browser.isChrome || DetectRTC.browser.isEdge || DetectRTC.browser.isOpera)) {
            isScreenCapturingSupported = false;
        } else if (DetectRTC.browser.isFirefox) {
            isScreenCapturingSupported = false;
        }
    }
    DetectRTC.isScreenCapturingSupported = isScreenCapturingSupported;

    // --------- Detect if WebAudio API are supported
    var webAudio = {
        isSupported: false,
        isCreateMediaStreamSourceSupported: false
    };

    ['AudioContext', 'webkitAudioContext', 'mozAudioContext', 'msAudioContext'].forEach(function(item) {
        if (webAudio.isSupported) {
            return;
        }

        if (item in window) {
            webAudio.isSupported = true;

            if (window[item] && 'createMediaStreamSource' in window[item].prototype) {
                webAudio.isCreateMediaStreamSourceSupported = true;
            }
        }
    });
    DetectRTC.isAudioContextSupported = webAudio.isSupported;
    DetectRTC.isCreateMediaStreamSourceSupported = webAudio.isCreateMediaStreamSourceSupported;

    // ---------- Detect if SCTP/RTP channels are supported.

    var isRtpDataChannelsSupported = false;
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version > 31) {
        isRtpDataChannelsSupported = true;
    }
    DetectRTC.isRtpDataChannelsSupported = isRtpDataChannelsSupported;

    var isSCTPSupportd = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version > 28) {
        isSCTPSupportd = true;
    } else if (DetectRTC.browser.isChrome && DetectRTC.browser.version > 25) {
        isSCTPSupportd = true;
    } else if (DetectRTC.browser.isOpera && DetectRTC.browser.version >= 11) {
        isSCTPSupportd = true;
    }
    DetectRTC.isSctpDataChannelsSupported = isSCTPSupportd;

    // ---------

    DetectRTC.isMobileDevice = isMobileDevice; // "isMobileDevice" boolean is defined in "getBrowserInfo.js"

    // ------
    var isGetUserMediaSupported = false;
    if (navigator.getUserMedia) {
        isGetUserMediaSupported = true;
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        isGetUserMediaSupported = true;
    }

    if (DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && !/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
        if (typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1) {
            isGetUserMediaSupported = 'Requires HTTPs';
        }
    }

    if (DetectRTC.osName === 'Nodejs') {
        isGetUserMediaSupported = false;
    }
    DetectRTC.isGetUserMediaSupported = isGetUserMediaSupported;

    // var displayResolution = '';
    // if (screen.width) {
    //     var width = (screen.width) ? screen.width : '';
    //     var height = (screen.height) ? screen.height : '';
    //     displayResolution += '' + width + ' x ' + height;
    // }
    // DetectRTC.displayResolution = displayResolution;

    // function getAspectRatio(w, h) {
    //     function gcd(a, b) {
    //         return (b == 0) ? a : gcd(b, a % b);
    //     }
    //     var r = gcd(w, h);
    //     return (w / r) / (h / r);
    // }

    // DetectRTC.displayAspectRatio = getAspectRatio(screen.width, screen.height).toFixed(2);

    // ----------
    DetectRTC.isCanvasSupportsStreamCapturing = isCanvasSupportsStreamCapturing;
    DetectRTC.isVideoSupportsStreamCapturing = isVideoSupportsStreamCapturing;

    if (DetectRTC.browser.name == 'Chrome' && DetectRTC.browser.version >= 53) {
        if (!DetectRTC.isCanvasSupportsStreamCapturing) {
            DetectRTC.isCanvasSupportsStreamCapturing = 'Requires chrome flag: enable-experimental-web-platform-features';
        }

        if (!DetectRTC.isVideoSupportsStreamCapturing) {
            DetectRTC.isVideoSupportsStreamCapturing = 'Requires chrome flag: enable-experimental-web-platform-features';
        }
    }

    // ------
    DetectRTC.DetectLocalIPAddress = DetectLocalIPAddress;

    DetectRTC.isWebSocketsSupported = 'WebSocket' in window && 2 === window.WebSocket.CLOSING;
    DetectRTC.isWebSocketsBlocked = !DetectRTC.isWebSocketsSupported;

    if (DetectRTC.osName === 'Nodejs') {
        DetectRTC.isWebSocketsSupported = true;
        DetectRTC.isWebSocketsBlocked = false;
    }

    DetectRTC.checkWebSocketsSupport = function(callback) {
        callback = callback || function() {};
        try {
            var starttime;
            var websocket = new WebSocket('wss://echo.websocket.org:443/');
            websocket.onopen = function() {
                DetectRTC.isWebSocketsBlocked = false;
                starttime = (new Date).getTime();
                websocket.send('ping');
            };
            websocket.onmessage = function() {
                DetectRTC.WebsocketLatency = (new Date).getTime() - starttime + 'ms';
                callback();
                websocket.close();
                websocket = null;
            };
            websocket.onerror = function() {
                DetectRTC.isWebSocketsBlocked = true;
                callback();
            };
        } catch (e) {
            DetectRTC.isWebSocketsBlocked = true;
            callback();
        }
    };

    // -------
    DetectRTC.load = function(callback) {
        callback = callback || function() {};
        checkDeviceSupport(callback);
    };

    // check for microphone/camera support!
    if (typeof checkDeviceSupport === 'function') {
        // checkDeviceSupport();
    }

    if (typeof MediaDevices !== 'undefined') {
        DetectRTC.MediaDevices = MediaDevices;
    } else {
        DetectRTC.MediaDevices = [];
    }

    DetectRTC.hasMicrophone = hasMicrophone;
    DetectRTC.hasSpeakers = hasSpeakers;
    DetectRTC.hasWebcam = hasWebcam;

    DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
    DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

    DetectRTC.audioInputDevices = audioInputDevices;
    DetectRTC.audioOutputDevices = audioOutputDevices;
    DetectRTC.videoInputDevices = videoInputDevices;

    // ------
    var isSetSinkIdSupported = false;
    if (typeof document !== 'undefined' && typeof document.createElement === 'function' && 'setSinkId' in document.createElement('video')) {
        isSetSinkIdSupported = true;
    }
    DetectRTC.isSetSinkIdSupported = isSetSinkIdSupported;

    // -----
    var isRTPSenderReplaceTracksSupported = false;
    if (DetectRTC.browser.isFirefox && typeof mozRTCPeerConnection !== 'undefined' /*&& DetectRTC.browser.version > 39*/ ) {
        /*global mozRTCPeerConnection:true */
        if ('getSenders' in mozRTCPeerConnection.prototype) {
            isRTPSenderReplaceTracksSupported = true;
        }
    } else if (DetectRTC.browser.isChrome && typeof webkitRTCPeerConnection !== 'undefined') {
        /*global webkitRTCPeerConnection:true */
        if ('getSenders' in webkitRTCPeerConnection.prototype) {
            isRTPSenderReplaceTracksSupported = true;
        }
    }
    DetectRTC.isRTPSenderReplaceTracksSupported = isRTPSenderReplaceTracksSupported;

    //------
    var isRemoteStreamProcessingSupported = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version > 38) {
        isRemoteStreamProcessingSupported = true;
    }
    DetectRTC.isRemoteStreamProcessingSupported = isRemoteStreamProcessingSupported;

    //-------
    var isApplyConstraintsSupported = false;

    /*global MediaStreamTrack:true */
    if (typeof MediaStreamTrack !== 'undefined' && 'applyConstraints' in MediaStreamTrack.prototype) {
        isApplyConstraintsSupported = true;
    }
    DetectRTC.isApplyConstraintsSupported = isApplyConstraintsSupported;

    //-------
    var isMultiMonitorScreenCapturingSupported = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 43) {
        // version 43 merely supports platforms for multi-monitors
        // version 44 will support exact multi-monitor selection i.e. you can select any monitor for screen capturing.
        isMultiMonitorScreenCapturingSupported = true;
    }
    DetectRTC.isMultiMonitorScreenCapturingSupported = isMultiMonitorScreenCapturingSupported;

    DetectRTC.isPromisesSupported = !!('Promise' in window);

    // version is generated by "grunt"
    DetectRTC.version = '1.3.9';

    if (typeof DetectRTC === 'undefined') {
        window.DetectRTC = {};
    }

    var MediaStream = window.MediaStream;

    if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
        MediaStream = webkitMediaStream;
    }

    if (typeof MediaStream !== 'undefined' && typeof MediaStream === 'function') {
        DetectRTC.MediaStream = Object.keys(MediaStream.prototype);
    } else DetectRTC.MediaStream = false;

    if (typeof MediaStreamTrack !== 'undefined') {
        DetectRTC.MediaStreamTrack = Object.keys(MediaStreamTrack.prototype);
    } else DetectRTC.MediaStreamTrack = false;

    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    if (typeof RTCPeerConnection !== 'undefined') {
        DetectRTC.RTCPeerConnection = Object.keys(RTCPeerConnection.prototype);
    } else DetectRTC.RTCPeerConnection = false;

    window.DetectRTC = DetectRTC;

    if (typeof module !== 'undefined' /* && !!module.exports*/ ) {
        module.exports = DetectRTC;
    }

    if (typeof define === 'function' && define.amd) {
        define('DetectRTC', [], function() {
            return DetectRTC;
        });
    }
})();

// globals.js

if (typeof cordova !== 'undefined') {
    DetectRTC.isMobileDevice = true;
    DetectRTC.browser.name = 'Chrome';
}

if (navigator && navigator.userAgent && navigator.userAgent.indexOf('Crosswalk') !== -1) {
    DetectRTC.isMobileDevice = true;
    DetectRTC.browser.name = 'Chrome';
}

function fireEvent(obj, eventName, args) {
    if (typeof CustomEvent === 'undefined') {
        return;
    }

    var eventDetail = {
        arguments: args,
        __exposedProps__: args
    };

    var event = new CustomEvent(eventName, eventDetail);
    obj.dispatchEvent(event);
}

function setHarkEvents(connection, streamEvent) {
    if (!streamEvent.stream || !getTracks(streamEvent.stream, 'audio').length) return;

    if (!connection || !streamEvent) {
        throw 'Both arguments are required.';
    }

    if (!connection.onspeaking || !connection.onsilence) {
        return;
    }

    if (typeof hark === 'undefined') {
        throw 'hark.js not found.';
    }

    hark(streamEvent.stream, {
        onspeaking: function() {
            connection.onspeaking(streamEvent);
        },
        onsilence: function() {
            connection.onsilence(streamEvent);
        },
        onvolumechange: function(volume, threshold) {
            if (!connection.onvolumechange) {
                return;
            }
            connection.onvolumechange(merge({
                volume: volume,
                threshold: threshold
            }, streamEvent));
        }
    });
}

function setMuteHandlers(connection, streamEvent) {
    if (!streamEvent.stream || !streamEvent.stream || !streamEvent.stream.addEventListener) return;

    streamEvent.stream.addEventListener('mute', function(event) {
        event = connection.streamEvents[streamEvent.streamid];

        event.session = {
            audio: event.muteType === 'audio',
            video: event.muteType === 'video'
        };

        connection.onmute(event);
    }, false);

    streamEvent.stream.addEventListener('unmute', function(event) {
        event = connection.streamEvents[streamEvent.streamid];

        event.session = {
            audio: event.unmuteType === 'audio',
            video: event.unmuteType === 'video'
        };

        connection.onunmute(event);
    }, false);
}

function getRandomString() {
    if (window.crypto && window.crypto.getRandomValues && navigator.userAgent.indexOf('Safari') === -1) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) {
            token += a[i].toString(36);
        }
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
}

// Get HTMLAudioElement/HTMLVideoElement accordingly
// todo: add API documentation for connection.autoCreateMediaElement

function getRMCMediaElement(stream, callback, connection) {
    if (!connection.autoCreateMediaElement) {
        callback({});
        return;
    }

    var isAudioOnly = false;
    if (!getTracks(stream, 'video').length && !stream.isVideo && !stream.isScreen) {
        isAudioOnly = true;
    }

    if (DetectRTC.browser.name === 'Firefox') {
        if (connection.session.video || connection.session.screen) {
            isAudioOnly = false;
        }
    }

    var mediaElement = document.createElement(isAudioOnly ? 'audio' : 'video');

    mediaElement.srcObject = stream;

    mediaElement.setAttribute('autoplay', true);
    mediaElement.setAttribute('playsinline', true);
    mediaElement.setAttribute('controls', true);
    mediaElement.setAttribute('muted', false);
    mediaElement.setAttribute('volume', 1);

    // http://goo.gl/WZ5nFl
    // Firefox don't yet support onended for any stream (remote/local)
    if (DetectRTC.browser.name === 'Firefox') {
        var streamEndedEvent = 'ended';

        if ('oninactive' in mediaElement) {
            streamEndedEvent = 'inactive';
        }

        mediaElement.addEventListener(streamEndedEvent, function() {
            // fireEvent(stream, streamEndedEvent, stream);
            currentUserMediaRequest.remove(stream.idInstance);

            if (stream.type === 'local') {
                streamEndedEvent = 'ended';

                if ('oninactive' in stream) {
                    streamEndedEvent = 'inactive';
                }

                StreamsHandler.onSyncNeeded(stream.streamid, streamEndedEvent);

                connection.attachStreams.forEach(function(aStream, idx) {
                    if (stream.streamid === aStream.streamid) {
                        delete connection.attachStreams[idx];
                    }
                });

                var newStreamsArray = [];
                connection.attachStreams.forEach(function(aStream) {
                    if (aStream) {
                        newStreamsArray.push(aStream);
                    }
                });
                connection.attachStreams = newStreamsArray;

                var streamEvent = connection.streamEvents[stream.streamid];

                if (streamEvent) {
                    connection.onstreamended(streamEvent);
                    return;
                }
                if (this.parentNode) {
                    this.parentNode.removeChild(this);
                }
            }
        }, false);
    }

    var played = mediaElement.play();
    if (typeof played !== 'undefined') {
        var cbFired = false;
        setTimeout(function() {
            if (!cbFired) {
                cbFired = true;
                callback(mediaElement);
            }
        }, 1000);
        played.then(function() {
            if (cbFired) return;
            cbFired = true;
            callback(mediaElement);
        }).catch(function(error) {
            if (cbFired) return;
            cbFired = true;
            callback(mediaElement);
        });
    } else {
        callback(mediaElement);
    }
}

// if IE
if (!window.addEventListener) {
    window.addEventListener = function(el, eventName, eventHandler) {
        if (!el.attachEvent) {
            return;
        }
        el.attachEvent('on' + eventName, eventHandler);
    };
}

function listenEventHandler(eventName, eventHandler) {
    window.removeEventListener(eventName, eventHandler);
    window.addEventListener(eventName, eventHandler, false);
}

window.attachEventListener = function(video, type, listener, useCapture) {
    video.addEventListener(type, listener, useCapture);
};

function removeNullEntries(array) {
    var newArray = [];
    array.forEach(function(item) {
        if (item) {
            newArray.push(item);
        }
    });
    return newArray;
}


function isData(session) {
    return !session.audio && !session.video && !session.screen && session.data;
}

function isNull(obj) {
    return typeof obj === 'undefined';
}

function isString(obj) {
    return typeof obj === 'string';
}

var MediaStream = window.MediaStream;

if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
}

/*global MediaStream:true */
if (typeof MediaStream !== 'undefined') {
    if (!('stop' in MediaStream.prototype)) {
        MediaStream.prototype.stop = function() {
            this.getTracks().forEach(function(track) {
                track.stop();
            });
        };
    }
}

function isAudioPlusTab(connection, audioPlusTab) {
    if (connection.session.audio && connection.session.audio === 'two-way') {
        return false;
    }

    if (DetectRTC.browser.name === 'Firefox' && audioPlusTab !== false) {
        return true;
    }

    if (DetectRTC.browser.name !== 'Chrome' || DetectRTC.browser.version < 50) return false;

    if (typeof audioPlusTab === true) {
        return true;
    }

    if (typeof audioPlusTab === 'undefined' && connection.session.audio && connection.session.screen && !connection.session.video) {
        audioPlusTab = true;
        return true;
    }

    return false;
}

function getAudioScreenConstraints(screen_constraints) {
    if (DetectRTC.browser.name === 'Firefox') {
        return true;
    }

    if (DetectRTC.browser.name !== 'Chrome') return false;

    return {
        mandatory: {
            chromeMediaSource: screen_constraints.mandatory.chromeMediaSource,
            chromeMediaSourceId: screen_constraints.mandatory.chromeMediaSourceId
        }
    };
}

window.iOSDefaultAudioOutputDevice = window.iOSDefaultAudioOutputDevice || 'speaker'; // earpiece or speaker

function getTracks(stream, kind) {
    if (!stream || !stream.getTracks) {
        return [];
    }

    return stream.getTracks().filter(function(t) {
        return t.kind === (kind || 'audio');
    });
}

function isUnifiedPlanSupportedDefault() {
    var canAddTransceiver = false;

    try {
        if (typeof RTCRtpTransceiver === 'undefined') return false;
        if (!('currentDirection' in RTCRtpTransceiver.prototype)) return false;

        var tempPc = new RTCPeerConnection();

        try {
            tempPc.addTransceiver('audio');
            canAddTransceiver = true;
        } catch (e) {}

        tempPc.close();
    } catch (e) {
        canAddTransceiver = false;
    }

    return canAddTransceiver && isUnifiedPlanSuppored();
}

function isUnifiedPlanSuppored() {
    var isUnifiedPlanSupported = false;

    try {
        var pc = new RTCPeerConnection({
            sdpSemantics: 'unified-plan'
        });

        try {
            var config = pc.getConfiguration();
            if (config.sdpSemantics == 'unified-plan')
                isUnifiedPlanSupported = true;
            else if (config.sdpSemantics == 'plan-b')
                isUnifiedPlanSupported = false;
            else
                isUnifiedPlanSupported = false;
        } catch (e) {
            isUnifiedPlanSupported = false;
        }
    } catch (e) {
        isUnifiedPlanSupported = false;
    }

    return isUnifiedPlanSupported;
}

// ios-hacks.js

function setCordovaAPIs() {
    // if (DetectRTC.osName !== 'iOS') return;
    if (typeof cordova === 'undefined' || typeof cordova.plugins === 'undefined' || typeof cordova.plugins.iosrtc === 'undefined') return;

    var iosrtc = cordova.plugins.iosrtc;
    window.webkitRTCPeerConnection = iosrtc.RTCPeerConnection;
    window.RTCSessionDescription = iosrtc.RTCSessionDescription;
    window.RTCIceCandidate = iosrtc.RTCIceCandidate;
    window.MediaStream = iosrtc.MediaStream;
    window.MediaStreamTrack = iosrtc.MediaStreamTrack;
    navigator.getUserMedia = navigator.webkitGetUserMedia = iosrtc.getUserMedia;

    iosrtc.debug.enable('iosrtc*');
    if (typeof iosrtc.selectAudioOutput == 'function') {
        iosrtc.selectAudioOutput(window.iOSDefaultAudioOutputDevice || 'speaker'); // earpiece or speaker
    }
    iosrtc.registerGlobals();
}

document.addEventListener('deviceready', setCordovaAPIs, false);
setCordovaAPIs();

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

// console.log(" >>> RTC global varaibles ", RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStreamTrack);

function PeerInitiator(config) {

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    });

    if (!RTCPeerConnection) {
        throw 'WebRTC 1.0 (RTCPeerConnection) API are NOT available in this browser.';
    }
    console.log(" ---------- RTCPeerConnection after -------------- ", RTCPeerConnection);

    var connection = config.rtcMultiConnection;

    this.extra = config.remoteSdp ? config.remoteSdp.extra : connection.extra;
    this.userid = config.userid;
    this.streams = [];
    this.channels = config.channels || [];
    this.connectionDescription = config.connectionDescription;

    this.addStream = function(session) {
        connection.addStream(session, self.userid);
    };

    this.removeStream = function(streamid) {
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
    connection.attachStreams.forEach(function(stream) {
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

            console.log(" ==================== RTCPeerConnection params ", params, " connection.optionalArgument ", connection.optionalArgument);
            peer = new RTCPeerConnection(params, connection.optionalArgument);
        } catch (e) {
            try {
                var params = {
                    iceServers: connection.iceServers
                };

                peer = new RTCPeerConnection(params);
            } catch (e) {
                peer = new RTCPeerConnection();
            }
        }
    } else {
        peer = config.peerRef;
    }

    if (!peer.getRemoteStreams && peer.getReceivers) {
        peer.getRemoteStreams = function() {
            var stream = new MediaStream();
            peer.getReceivers().forEach(function(receiver) {
                stream.addTrack(receiver.track);
            });
            return [stream];
        };
    }

    if (!peer.getLocalStreams && peer.getSenders) {
        peer.getLocalStreams = function() {
            var stream = new MediaStream();
            peer.getSenders().forEach(function(sender) {
                stream.addTrack(sender.track);
            });
            return [stream];
        };
    }

    peer.onicecandidate = function(event) {
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
            return;
        }

        if (!connection.trickleIce) return;
        config.onLocalCandidate({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
        });
    };

    localStreams.forEach(function(localStream) {
        if (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.dontGetRemoteStream) {
            return;
        }

        if (config.dontAttachLocalStream) {
            return;
        }

        localStream = connection.beforeAddingStream(localStream, self);

        if (!localStream) return;

        peer.getLocalStreams().forEach(function(stream) {
            if (localStream && stream.id == localStream.id) {
                localStream = null;
            }
        });

        if (localStream && localStream.getTracks) {
            localStream.getTracks().forEach(function(track) {
                try {
                    // last parameter is redundant for unified-plan
                    // starting from chrome version 72
                    peer.addTrack(track, localStream);
                } catch (e) {}
            });
        }
    });

    peer.oniceconnectionstatechange = peer.onsignalingstatechange = function() {
        var extra = self.extra;
        if (connection.peers[self.userid]) {
            extra = connection.peers[self.userid].extra || extra;
        }

        if (!peer) {
            return;
        }

        config.onPeerStateChanged({
            iceConnectionState: peer.iceConnectionState,
            iceGatheringState: peer.iceGatheringState,
            signalingState: peer.signalingState,
            extra: extra,
            userid: self.userid
        });

        if (peer && peer.iceConnectionState && peer.iceConnectionState.search(/closed|failed/gi) !== -1 && self.streams instanceof Array) {
            self.streams.forEach(function(stream) {
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

    peer.ontrack = function(event) {
        if (!event || event.type !== 'track') return;

        event.stream = event.streams[event.streams.length - 1];

        if (!event.stream.id) {
            event.stream.id = event.track.id;
        }

        if (dontDuplicate[event.stream.id] && DetectRTC.browser.name !== 'Safari') {
            if (event.track) {
                event.track.onended = function() { // event.track.onmute = 
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

        event.stream.getTracks().forEach(function(track) {
            track.onended = function() { // track.onmute = 
                peer && peer.onremovestream(event);
            };
        });

        event.stream.onremovetrack = function() {
            peer && peer.onremovestream(event);
        };
    };

    peer.onremovestream = function(event) {
        // this event doesn't works anymore
        event.stream.streamid = event.stream.id;

        if (allRemoteStreams[event.stream.id]) {
            delete allRemoteStreams[event.stream.id];
        }

        config.onRemoteStreamRemoved(event.stream);
    };

    if (typeof peer.removeStream !== 'function') {
        // removeStream backward compatibility
        peer.removeStream = function(stream) {
            stream.getTracks().forEach(function(track) {
                peer.removeTrack(track, stream);
            });
        };
    }

    this.addRemoteCandidate = function(remoteCandidate) {
        peer.addIceCandidate(new RTCIceCandidate(remoteCandidate));
    };

    function oldAddRemoteSdp(remoteSdp, cb) {
        cb = cb || function() {};

        if (DetectRTC.browser.name !== 'Safari') {
            remoteSdp.sdp = connection.processSdp(remoteSdp.sdp);
        }
        peer.setRemoteDescription(new RTCSessionDescription(remoteSdp), cb, function(error) {
            if (!!connection.enableLogs) {
                console.error('setRemoteDescription failed', '\n', error, '\n', remoteSdp.sdp);
            }

            cb();
        });
    }

    this.addRemoteSdp = function(remoteSdp, cb) {
        cb = cb || function() {};

        if (DetectRTC.browser.name !== 'Safari') {
            remoteSdp.sdp = connection.processSdp(remoteSdp.sdp);
        }

        peer.setRemoteDescription(new RTCSessionDescription(remoteSdp)).then(cb, function(error) {
            if (!!connection.enableLogs) {
                console.error('setRemoteDescription failed', '\n', error, '\n', remoteSdp.sdp);
            }

            cb();
        }).catch(function(error) {
            if (!!connection.enableLogs) {
                console.error('setRemoteDescription failed', '\n', error, '\n', remoteSdp.sdp);
            }

            cb();
        });
    };

    var isOfferer = true;

    if (config.remoteSdp) {
        isOfferer = false;
    }

    this.createDataChannel = function() {
        var channel = peer.createDataChannel('sctp', {});
        setChannelEvents(channel);
    };

    if (connection.session.data === true && !renegotiatingPeer) {
        if (!isOfferer) {
            peer.ondatachannel = function(event) {
                var channel = event.channel;
                setChannelEvents(channel);
            };
        } else {
            this.createDataChannel();
        }
    }

    this.enableDisableVideoEncoding = function(enable) {
        var rtcp;
        peer.getSenders().forEach(function(sender) {
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
        this.addRemoteSdp(config.remoteSdp, function() {
            createOfferOrAnswer('createAnswer');
        });
    }

    function setChannelEvents(channel) {
        // force ArrayBuffer in Firefox; which uses "Blob" by default.
        channel.binaryType = 'arraybuffer';

        channel.onmessage = function(event) {
            config.onDataChannelMessage(event.data);
        };

        channel.onopen = function() {
            config.onDataChannelOpened(channel);
        };

        channel.onerror = function(error) {
            config.onDataChannelError(error);
        };

        channel.onclose = function(event) {
            config.onDataChannelClosed(event);
        };

        channel.internalSend = channel.send;
        channel.send = function(data) {
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
    peer.getLocalStreams().forEach(function(stream) {
        streamsToShare[stream.streamid] = {
            isAudio: !!stream.isAudio,
            isVideo: !!stream.isVideo,
            isScreen: !!stream.isScreen
        };
    });

    function oldCreateOfferOrAnswer(_method) {
        peer[_method](function(localSdp) {
            if (DetectRTC.browser.name !== 'Safari') {
                localSdp.sdp = connection.processSdp(localSdp.sdp);
            }
            peer.setLocalDescription(localSdp, function() {
                if (!connection.trickleIce) return;

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
            }, function(error) {
                if (!!connection.enableLogs) {
                    console.error('setLocalDescription-error', error);
                }
            });
        }, function(error) {
            if (!!connection.enableLogs) {
                console.error('sdp-' + _method + '-error', error);
            }
        }, defaults.sdpConstraints);
    }

    function createOfferOrAnswer(_method) {
        peer[_method](defaults.sdpConstraints).then(function(localSdp) {
            if (DetectRTC.browser.name !== 'Safari') {
                localSdp.sdp = connection.processSdp(localSdp.sdp);
            }
            peer.setLocalDescription(localSdp).then(function() {
                if (!connection.trickleIce) return;

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
            }, function(error) {
                if (!connection.enableLogs) return;
                console.error('setLocalDescription error', error);
            });
        }, function(error) {
            if (!!connection.enableLogs) {
                console.error('sdp-error', error);
            }
        });
    }

    if (isOfferer) {
        createOfferOrAnswer('createOffer');
    }

    peer.nativeClose = peer.close;
    peer.close = function() {
        if (!peer) {
            return;
        }

        try {
            if (peer.nativeClose !== peer.close) {
                peer.nativeClose();
            }
        } catch (e) {}

        peer = null;
        self.peer = null;
    };

    this.peer = peer;
}

// CodecsHandler.js

var CodecsHandler = (function() {
    function preferCodec(sdp, codecName) {
        var info = splitLines(sdp);

        if (!info.videoCodecNumbers) {
            return sdp;
        }

        if (codecName === 'vp8' && info.vp8LineNumber === info.videoCodecNumbers[0]) {
            return sdp;
        }

        if (codecName === 'vp9' && info.vp9LineNumber === info.videoCodecNumbers[0]) {
            return sdp;
        }

        if (codecName === 'h264' && info.h264LineNumber === info.videoCodecNumbers[0]) {
            return sdp;
        }

        sdp = preferCodecHelper(sdp, codecName, info);

        return sdp;
    }

    function preferCodecHelper(sdp, codec, info, ignore) {
        var preferCodecNumber = '';

        if (codec === 'vp8') {
            if (!info.vp8LineNumber) {
                return sdp;
            }
            preferCodecNumber = info.vp8LineNumber;
        }

        if (codec === 'vp9') {
            if (!info.vp9LineNumber) {
                return sdp;
            }
            preferCodecNumber = info.vp9LineNumber;
        }

        if (codec === 'h264') {
            if (!info.h264LineNumber) {
                return sdp;
            }

            preferCodecNumber = info.h264LineNumber;
        }

        var newLine = info.videoCodecNumbersOriginal.split('SAVPF')[0] + 'SAVPF ';

        var newOrder = [preferCodecNumber];

        if (ignore) {
            newOrder = [];
        }

        info.videoCodecNumbers.forEach(function(codecNumber) {
            if (codecNumber === preferCodecNumber) return;
            newOrder.push(codecNumber);
        });

        newLine += newOrder.join(' ');

        sdp = sdp.replace(info.videoCodecNumbersOriginal, newLine);
        return sdp;
    }

    function splitLines(sdp) {
        var info = {};
        sdp.split('\n').forEach(function(line) {
            if (line.indexOf('m=video') === 0) {
                info.videoCodecNumbers = [];
                line.split('SAVPF')[1].split(' ').forEach(function(codecNumber) {
                    codecNumber = codecNumber.trim();
                    if (!codecNumber || !codecNumber.length) return;
                    info.videoCodecNumbers.push(codecNumber);
                    info.videoCodecNumbersOriginal = line;
                });
            }

            if (line.indexOf('VP8/90000') !== -1 && !info.vp8LineNumber) {
                info.vp8LineNumber = line.replace('a=rtpmap:', '').split(' ')[0];
            }

            if (line.indexOf('VP9/90000') !== -1 && !info.vp9LineNumber) {
                info.vp9LineNumber = line.replace('a=rtpmap:', '').split(' ')[0];
            }

            if (line.indexOf('H264/90000') !== -1 && !info.h264LineNumber) {
                info.h264LineNumber = line.replace('a=rtpmap:', '').split(' ')[0];
            }
        });

        return info;
    }

    function removeVPX(sdp) {
        var info = splitLines(sdp);

        // last parameter below means: ignore these codecs
        sdp = preferCodecHelper(sdp, 'vp9', info, true);
        sdp = preferCodecHelper(sdp, 'vp8', info, true);

        return sdp;
    }

    function disableNACK(sdp) {
        if (!sdp || typeof sdp !== 'string') {
            throw 'Invalid arguments.';
        }

        sdp = sdp.replace('a=rtcp-fb:126 nack\r\n', '');
        sdp = sdp.replace('a=rtcp-fb:126 nack pli\r\n', 'a=rtcp-fb:126 pli\r\n');
        sdp = sdp.replace('a=rtcp-fb:97 nack\r\n', '');
        sdp = sdp.replace('a=rtcp-fb:97 nack pli\r\n', 'a=rtcp-fb:97 pli\r\n');

        return sdp;
    }

    function prioritize(codecMimeType, peer) {
        if (!peer || !peer.getSenders || !peer.getSenders().length) {
            return;
        }

        if (!codecMimeType || typeof codecMimeType !== 'string') {
            throw 'Invalid arguments.';
        }

        peer.getSenders().forEach(function(sender) {
            var params = sender.getParameters();
            for (var i = 0; i < params.codecs.length; i++) {
                if (params.codecs[i].mimeType == codecMimeType) {
                    params.codecs.unshift(params.codecs.splice(i, 1));
                    break;
                }
            }
            sender.setParameters(params);
        });
    }

    function removeNonG722(sdp) {
        return sdp.replace(/m=audio ([0-9]+) RTP\/SAVPF ([0-9 ]*)/g, 'm=audio $1 RTP\/SAVPF 9');
    }

    function setBAS(sdp, bandwidth, isScreen) {
        if (!bandwidth) {
            return sdp;
        }

        if (typeof isFirefox !== 'undefined' && isFirefox) {
            return sdp;
        }

        if (isScreen) {
            if (!bandwidth.screen) {
                console.warn('It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.');
            } else if (bandwidth.screen < 300) {
                console.warn('It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.');
            }
        }

        // if screen; must use at least 300kbs
        if (bandwidth.screen && isScreen) {
            sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + bandwidth.screen + '\r\n');
        }

        // remove existing bandwidth lines
        if (bandwidth.audio || bandwidth.video) {
            sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
        }

        if (bandwidth.audio) {
            sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
        }

        if (bandwidth.screen) {
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + bandwidth.screen + '\r\n');
        } else if (bandwidth.video) {
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + bandwidth.video + '\r\n');
        }

        return sdp;
    }

    // Find the line in sdpLines that starts with |prefix|, and, if specified,
    // contains |substr| (case-insensitive search).
    function findLine(sdpLines, prefix, substr) {
        return findLineInRange(sdpLines, 0, -1, prefix, substr);
    }

    // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
    // and, if specified, contains |substr| (case-insensitive search).
    function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
        var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
        for (var i = startLine; i < realEndLine; ++i) {
            if (sdpLines[i].indexOf(prefix) === 0) {
                if (!substr ||
                    sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                    return i;
                }
            }
        }
        return null;
    }

    // Gets the codec payload type from an a=rtpmap:X line.
    function getCodecPayloadType(sdpLine) {
        var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
        var result = sdpLine.match(pattern);
        return (result && result.length === 2) ? result[1] : null;
    }

    function setVideoBitrates(sdp, params) {
        params = params || {};
        var xgoogle_min_bitrate = params.min;
        var xgoogle_max_bitrate = params.max;

        var sdpLines = sdp.split('\r\n');

        // VP8
        var vp8Index = findLine(sdpLines, 'a=rtpmap', 'VP8/90000');
        var vp8Payload;
        if (vp8Index) {
            vp8Payload = getCodecPayloadType(sdpLines[vp8Index]);
        }

        if (!vp8Payload) {
            return sdp;
        }

        var rtxIndex = findLine(sdpLines, 'a=rtpmap', 'rtx/90000');
        var rtxPayload;
        if (rtxIndex) {
            rtxPayload = getCodecPayloadType(sdpLines[rtxIndex]);
        }

        if (!rtxIndex) {
            return sdp;
        }

        var rtxFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + rtxPayload.toString());
        if (rtxFmtpLineIndex !== null) {
            var appendrtxNext = '\r\n';
            appendrtxNext += 'a=fmtp:' + vp8Payload + ' x-google-min-bitrate=' + (xgoogle_min_bitrate || '228') + '; x-google-max-bitrate=' + (xgoogle_max_bitrate || '228');
            sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext);
            sdp = sdpLines.join('\r\n');
        }

        return sdp;
    }

    function setOpusAttributes(sdp, params) {
        params = params || {};

        var sdpLines = sdp.split('\r\n');

        // Opus
        var opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
        var opusPayload;
        if (opusIndex) {
            opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
        }

        if (!opusPayload) {
            return sdp;
        }

        var opusFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());
        if (opusFmtpLineIndex === null) {
            return sdp;
        }

        var appendOpusNext = '';
        appendOpusNext += '; stereo=' + (typeof params.stereo != 'undefined' ? params.stereo : '1');
        appendOpusNext += '; sprop-stereo=' + (typeof params['sprop-stereo'] != 'undefined' ? params['sprop-stereo'] : '1');

        if (typeof params.maxaveragebitrate != 'undefined') {
            appendOpusNext += '; maxaveragebitrate=' + (params.maxaveragebitrate || 128 * 1024 * 8);
        }

        if (typeof params.maxplaybackrate != 'undefined') {
            appendOpusNext += '; maxplaybackrate=' + (params.maxplaybackrate || 128 * 1024 * 8);
        }

        if (typeof params.cbr != 'undefined') {
            appendOpusNext += '; cbr=' + (typeof params.cbr != 'undefined' ? params.cbr : '1');
        }

        if (typeof params.useinbandfec != 'undefined') {
            appendOpusNext += '; useinbandfec=' + params.useinbandfec;
        }

        if (typeof params.usedtx != 'undefined') {
            appendOpusNext += '; usedtx=' + params.usedtx;
        }

        if (typeof params.maxptime != 'undefined') {
            appendOpusNext += '\r\na=maxptime:' + params.maxptime;
        }

        sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext);

        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    // forceStereoAudio => via webrtcexample.com
    // requires getUserMedia => echoCancellation:false
    function forceStereoAudio(sdp) {
        var sdpLines = sdp.split('\r\n');
        var fmtpLineIndex = null;
        for (var i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('opus/48000') !== -1) {
                var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
                break;
            }
        }
        for (var i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('a=fmtp') !== -1) {
                var payload = extractSdp(sdpLines[i], /a=fmtp:(\d+)/);
                if (payload === opusPayload) {
                    fmtpLineIndex = i;
                    break;
                }
            }
        }
        if (fmtpLineIndex === null) return sdp;
        sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat('; stereo=1; sprop-stereo=1');
        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    return {
        removeVPX: removeVPX,
        disableNACK: disableNACK,
        prioritize: prioritize,
        removeNonG722: removeNonG722,
        setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
            return setBAS(sdp, bandwidth, isScreen);
        },
        setVideoBitrates: function(sdp, params) {
            return setVideoBitrates(sdp, params);
        },
        setOpusAttributes: function(sdp, params) {
            return setOpusAttributes(sdp, params);
        },
        preferVP9: function(sdp) {
            return preferCodec(sdp, 'vp9');
        },
        preferCodec: preferCodec,
        forceStereoAudio: forceStereoAudio
    };
})();

// backward compatibility
window.BandwidthHandler = CodecsHandler;

// OnIceCandidateHandler.js

var OnIceCandidateHandler = (function() {
    function processCandidates(connection, icePair) {
        var candidate = icePair.candidate;

        var iceRestrictions = connection.candidates;
        var stun = iceRestrictions.stun;
        var turn = iceRestrictions.turn;

        if (!isNull(iceRestrictions.reflexive)) {
            stun = iceRestrictions.reflexive;
        }

        if (!isNull(iceRestrictions.relay)) {
            turn = iceRestrictions.relay;
        }

        if (!iceRestrictions.host && !!candidate.match(/typ host/g)) {
            return;
        }

        if (!turn && !!candidate.match(/typ relay/g)) {
            return;
        }

        if (!stun && !!candidate.match(/typ srflx/g)) {
            return;
        }

        var protocol = connection.iceProtocols;

        if (!protocol.udp && !!candidate.match(/ udp /g)) {
            return;
        }

        if (!protocol.tcp && !!candidate.match(/ tcp /g)) {
            return;
        }

        if (connection.enableLogs) {
            console.debug('Your candidate pairs:', candidate);
        }

        return {
            candidate: candidate,
            sdpMid: icePair.sdpMid,
            sdpMLineIndex: icePair.sdpMLineIndex
        };
    }

    return {
        processCandidates: processCandidates
    };
})();

// IceServersHandler.js

var IceServersHandler = (function() {
    function getIceServers(connection) {
        // resiprocate: 3344+4433
        // pions: 7575
        var iceServers = [{
            'urls': [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun.l.google.com:19302?transport=udp',
            ]
        }];

        return iceServers;
    }

    return {
        getIceServers: getIceServers
    };
})();

// getUserMediaHandler.js

function setStreamType(constraints, stream) {
    if (constraints.mandatory && constraints.mandatory.chromeMediaSource) {
        stream.isScreen = true;
    } else if (constraints.mozMediaSource || constraints.mediaSource) {
        stream.isScreen = true;
    } else if (constraints.video) {
        stream.isVideo = true;
    } else if (constraints.audio) {
        stream.isAudio = true;
    }
}

// allow users to manage this object (to support re-capturing of screen/etc.)
window.currentUserMediaRequest = {
    streams: [],
    mutex: false,
    queueRequests: [],
    remove: function(idInstance) {
        this.mutex = false;

        var stream = this.streams[idInstance];
        if (!stream) {
            return;
        }

        stream = stream.stream;

        var options = stream.currentUserMediaRequestOptions;

        if (this.queueRequests.indexOf(options)) {
            delete this.queueRequests[this.queueRequests.indexOf(options)];
            this.queueRequests = removeNullEntries(this.queueRequests);
        }

        this.streams[idInstance].stream = null;
        delete this.streams[idInstance];
    }
};

function getUserMediaHandler(options) {
    if (currentUserMediaRequest.mutex === true) {
        currentUserMediaRequest.queueRequests.push(options);
        return;
    }
    currentUserMediaRequest.mutex = true;

    // easy way to match
    var idInstance = JSON.stringify(options.localMediaConstraints);

    function streaming(stream, returnBack) {
        setStreamType(options.localMediaConstraints, stream);

        var streamEndedEvent = 'ended';

        if ('oninactive' in stream) {
            streamEndedEvent = 'inactive';
        }
        stream.addEventListener(streamEndedEvent, function() {
            delete currentUserMediaRequest.streams[idInstance];

            currentUserMediaRequest.mutex = false;
            if (currentUserMediaRequest.queueRequests.indexOf(options)) {
                delete currentUserMediaRequest.queueRequests[currentUserMediaRequest.queueRequests.indexOf(options)];
                currentUserMediaRequest.queueRequests = removeNullEntries(currentUserMediaRequest.queueRequests);
            }
        }, false);

        currentUserMediaRequest.streams[idInstance] = {
            stream: stream
        };
        currentUserMediaRequest.mutex = false;

        if (currentUserMediaRequest.queueRequests.length) {
            getUserMediaHandler(currentUserMediaRequest.queueRequests.shift());
        }

        // callback
        options.onGettingLocalMedia(stream, returnBack);
    }

    if (currentUserMediaRequest.streams[idInstance]) {
        streaming(currentUserMediaRequest.streams[idInstance].stream, true);
    } else {
        var isBlackBerry = !!(/BB10|BlackBerry/i.test(navigator.userAgent || ''));
        if (isBlackBerry || typeof navigator.mediaDevices === 'undefined' || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            navigator.getUserMedia(options.localMediaConstraints, function(stream) {
                stream.streamid = stream.streamid || stream.id || getRandomString();
                stream.idInstance = idInstance;
                streaming(stream);
            }, function(error) {
                options.onLocalMediaError(error, options.localMediaConstraints);
            });
            return;
        }

        if (typeof navigator.mediaDevices === 'undefined') {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            var getUserMediaSuccess = function() {};
            var getUserMediaFailure = function() {};

            var getUserMediaStream, getUserMediaError;
            navigator.mediaDevices = {
                getUserMedia: function(hints) {
                    navigator.getUserMedia(hints, function(getUserMediaSuccess) {
                        getUserMediaSuccess(stream);
                        getUserMediaStream = stream;
                    }, function(error) {
                        getUserMediaFailure(error);
                        getUserMediaError = error;
                    });

                    return {
                        then: function(successCB) {
                            if (getUserMediaStream) {
                                successCB(getUserMediaStream);
                                return;
                            }

                            getUserMediaSuccess = successCB;

                            return {
                                then: function(failureCB) {
                                    if (getUserMediaError) {
                                        failureCB(getUserMediaError);
                                        return;
                                    }

                                    getUserMediaFailure = failureCB;
                                }
                            }
                        }
                    }
                }
            };
        }

        if (options.localMediaConstraints.isScreen === true) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia(options.localMediaConstraints).then(function(stream) {
                    stream.streamid = stream.streamid || stream.id || getRandomString();
                    stream.idInstance = idInstance;

                    streaming(stream);
                }).catch(function(error) {
                    options.onLocalMediaError(error, options.localMediaConstraints);
                });
            } else if (navigator.getDisplayMedia) {
                navigator.getDisplayMedia(options.localMediaConstraints).then(function(stream) {
                    stream.streamid = stream.streamid || stream.id || getRandomString();
                    stream.idInstance = idInstance;

                    streaming(stream);
                }).catch(function(error) {
                    options.onLocalMediaError(error, options.localMediaConstraints);
                });
            } else {
                throw new Error('getDisplayMedia API is not availabe in this browser.');
            }
            return;
        }

        console.log("localMediaConstraints : ", options.localMediaConstraints );

        navigator.mediaDevices.getUserMedia(options.localMediaConstraints).then(function(stream) {
            stream.streamid = stream.streamid || stream.id || getRandomString();
            stream.idInstance = idInstance;

            streaming(stream);
        }).catch(function(error) {
            options.onLocalMediaError(error, options.localMediaConstraints);
        });
    }
}

// StreamsHandler.js

var StreamsHandler = (function() {
    function handleType(type) {
        if (!type) {
            return;
        }

        if (typeof type === 'string' || typeof type === 'undefined') {
            return type;
        }

        if (type.audio && type.video) {
            return null;
        }

        if (type.audio) {
            return 'audio';
        }

        if (type.video) {
            return 'video';
        }

        return;
    }

    function setHandlers(stream, syncAction, connection) {
        if (!stream || !stream.addEventListener) return;

        if (typeof syncAction == 'undefined' || syncAction == true) {
            var streamEndedEvent = 'ended';

            if ('oninactive' in stream) {
                streamEndedEvent = 'inactive';
            }

            stream.addEventListener(streamEndedEvent, function() {
                StreamsHandler.onSyncNeeded(this.streamid, streamEndedEvent);
            }, false);
        }

        stream.mute = function(type, isSyncAction) {
            type = handleType(type);

            if (typeof isSyncAction !== 'undefined') {
                syncAction = isSyncAction;
            }

            if (typeof type == 'undefined' || type == 'audio') {
                getTracks(stream, 'audio').forEach(function(track) {
                    track.enabled = false;
                    connection.streamEvents[stream.streamid].isAudioMuted = true;
                });
            }

            if (typeof type == 'undefined' || type == 'video') {
                getTracks(stream, 'video').forEach(function(track) {
                    track.enabled = false;
                });
            }

            if (typeof syncAction == 'undefined' || syncAction == true) {
                StreamsHandler.onSyncNeeded(stream.streamid, 'mute', type);
            }

            connection.streamEvents[stream.streamid].muteType = type || 'both';

            fireEvent(stream, 'mute', type);
        };

        stream.unmute = function(type, isSyncAction) {
            type = handleType(type);

            if (typeof isSyncAction !== 'undefined') {
                syncAction = isSyncAction;
            }

            graduallyIncreaseVolume();

            if (typeof type == 'undefined' || type == 'audio') {
                getTracks(stream, 'audio').forEach(function(track) {
                    track.enabled = true;
                    connection.streamEvents[stream.streamid].isAudioMuted = false;
                });
            }

            if (typeof type == 'undefined' || type == 'video') {
                getTracks(stream, 'video').forEach(function(track) {
                    track.enabled = true;
                });

                // make sure that video unmute doesn't affects audio
                if (typeof type !== 'undefined' && type == 'video' && connection.streamEvents[stream.streamid].isAudioMuted) {
                    (function looper(times) {
                        if (!times) {
                            times = 0;
                        }

                        times++;

                        // check until five-seconds
                        if (times < 100 && connection.streamEvents[stream.streamid].isAudioMuted) {
                            stream.mute('audio');

                            setTimeout(function() {
                                looper(times);
                            }, 50);
                        }
                    })();
                }
            }

            if (typeof syncAction == 'undefined' || syncAction == true) {
                StreamsHandler.onSyncNeeded(stream.streamid, 'unmute', type);
            }

            connection.streamEvents[stream.streamid].unmuteType = type || 'both';

            fireEvent(stream, 'unmute', type);
        };

        function graduallyIncreaseVolume() {
            if (!connection.streamEvents[stream.streamid].mediaElement) {
                return;
            }

            var mediaElement = connection.streamEvents[stream.streamid].mediaElement;
            mediaElement.volume = 0;
            afterEach(200, 5, function() {
                try {
                    mediaElement.volume += .20;
                } catch (e) {
                    mediaElement.volume = 1;
                }
            });
        }
    }

    function afterEach(setTimeoutInteval, numberOfTimes, callback, startedTimes) {
        startedTimes = (startedTimes || 0) + 1;
        if (startedTimes >= numberOfTimes) return;

        setTimeout(function() {
            callback();
            afterEach(setTimeoutInteval, numberOfTimes, callback, startedTimes);
        }, setTimeoutInteval);
    }

    return {
        setHandlers: setHandlers,
        onSyncNeeded: function(streamid, action, type) {}
    };
})();

// TextReceiver.js & TextSender.js

function TextReceiver(connection) {
    var content = {};

    function receive(data, userid, extra) {
        // uuid is used to uniquely identify sending instance
        var uuid = data.uuid;
        if (!content[uuid]) {
            content[uuid] = [];
        }

        content[uuid].push(data.message);

        if (data.last) {
            var message = content[uuid].join('');
            if (data.isobject) {
                message = JSON.parse(message);
            }

            // latency detection
            var receivingTime = new Date().getTime();
            var latency = receivingTime - data.sendingTime;

            var e = {
                data: message,
                userid: userid,
                extra: extra,
                latency: latency
            };

            if (connection.autoTranslateText) {
                e.original = e.data;
                connection.Translator.TranslateText(e.data, function(translatedText) {
                    e.data = translatedText;
                    connection.onmessage(e);
                });
            } else {
                connection.onmessage(e);
            }

            delete content[uuid];
        }
    }

    return {
        receive: receive
    };
}

// TextSender.js
var TextSender = {
    send: function(config) {
        var connection = config.connection;

        var channel = config.channel,
            remoteUserId = config.remoteUserId,
            initialText = config.text,
            packetSize = connection.chunkSize || 1000,
            textToTransfer = '',
            isobject = false;

        if (!isString(initialText)) {
            isobject = true;
            initialText = JSON.stringify(initialText);
        }

        // uuid is used to uniquely identify sending instance
        var uuid = getRandomString();
        var sendingTime = new Date().getTime();

        sendText(initialText);

        function sendText(textMessage, text) {
            var data = {
                type: 'text',
                uuid: uuid,
                sendingTime: sendingTime
            };

            if (textMessage) {
                text = textMessage;
                data.packets = parseInt(text.length / packetSize);
            }

            if (text.length > packetSize) {
                data.message = text.slice(0, packetSize);
            } else {
                data.message = text;
                data.last = true;
                data.isobject = isobject;
            }

            channel.send(data, remoteUserId);

            textToTransfer = text.slice(data.message.length);

            if (textToTransfer.length) {
                setTimeout(function() {
                    sendText(null, textToTransfer);
                }, connection.chunkInterval || 100);
            }
        }
    }
};

// FileProgressBarHandler.js

var FileProgressBarHandler = (function() {
    function handle(connection) {
        var progressHelper = {};

        // www.RTCMultiConnection.org/docs/onFileStart/
        connection.onFileStart = function(file) {
            var div = document.createElement('div');
            div.title = file.name;
            div.innerHTML = '<label>0%</label> <progress></progress>';

            if (file.remoteUserId) {
                div.innerHTML += ' (Sharing with:' + file.remoteUserId + ')';
            }

            if (!connection.filesContainer) {
                connection.filesContainer = document.body || document.documentElement;
            }

            connection.filesContainer.insertBefore(div, connection.filesContainer.firstChild);

            if (!file.remoteUserId) {
                progressHelper[file.uuid] = {
                    div: div,
                    progress: div.querySelector('progress'),
                    label: div.querySelector('label')
                };
                progressHelper[file.uuid].progress.max = file.maxChunks;
                return;
            }

            if (!progressHelper[file.uuid]) {
                progressHelper[file.uuid] = {};
            }

            progressHelper[file.uuid][file.remoteUserId] = {
                div: div,
                progress: div.querySelector('progress'),
                label: div.querySelector('label')
            };
            progressHelper[file.uuid][file.remoteUserId].progress.max = file.maxChunks;
        };

        // www.RTCMultiConnection.org/docs/onFileProgress/
        connection.onFileProgress = function(chunk) {
            var helper = progressHelper[chunk.uuid];
            if (!helper) {
                return;
            }
            if (chunk.remoteUserId) {
                helper = progressHelper[chunk.uuid][chunk.remoteUserId];
                if (!helper) {
                    return;
                }
            }

            helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
            updateLabel(helper.progress, helper.label);
        };

        // www.RTCMultiConnection.org/docs/onFileEnd/
        connection.onFileEnd = function(file) {
            var helper = progressHelper[file.uuid];
            if (!helper) {
                console.error('No such progress-helper element exist.', file);
                return;
            }

            if (file.remoteUserId) {
                helper = progressHelper[file.uuid][file.remoteUserId];
                if (!helper) {
                    return;
                }
            }

            var div = helper.div;
            if (file.type.indexOf('image') != -1) {
                div.innerHTML = '<a href="' + file.url + '" download="' + file.name + '">Download <strong style="color:red;">' + file.name + '</strong> </a><br /><img src="' + file.url + '" title="' + file.name + '" style="max-width: 80%;">';
            } else {
                div.innerHTML = '<a href="' + file.url + '" download="' + file.name + '">Download <strong style="color:red;">' + file.name + '</strong> </a><br /><iframe src="' + file.url + '" title="' + file.name + '" style="width: 80%;border: 0;height: inherit;margin-top:1em;"></iframe>';
            }
        };

        function updateLabel(progress, label) {
            if (progress.position === -1) {
                return;
            }

            var position = +progress.position.toFixed(2).split('.')[1] || 100;
            label.innerHTML = position + '%';
        }
    }

    return {
        handle: handle
    };
})();

// TranslationHandler.js

var TranslationHandler = (function() {
    function handle(connection) {
        connection.autoTranslateText = false;
        connection.language = 'en';
        connection.googKey = 'AIzaSyCgB5hmFY74WYB-EoWkhr9cAGr6TiTHrEE';

        // www.RTCMultiConnection.org/docs/Translator/
        connection.Translator = {
            TranslateText: function(text, callback) {
                // if(location.protocol === 'https:') return callback(text);

                var newScript = document.createElement('script');
                newScript.type = 'text/javascript';

                var sourceText = encodeURIComponent(text); // escape

                var randomNumber = 'method' + connection.token();
                window[randomNumber] = function(response) {
                    if (response.data && response.data.translations[0] && callback) {
                        callback(response.data.translations[0].translatedText);
                        return;
                    }

                    if (response.error && response.error.message === 'Daily Limit Exceeded') {
                        console.error('Text translation failed. Error message: "Daily Limit Exceeded."');
                        return;
                    }

                    if (response.error) {
                        console.error(response.error.message);
                        return;
                    }

                    console.error(response);
                };

                var source = 'https://www.googleapis.com/language/translate/v2?key=' + connection.googKey + '&target=' + (connection.language || 'en-US') + '&callback=window.' + randomNumber + '&q=' + sourceText;
                newScript.src = source;
                document.getElementsByTagName('head')[0].appendChild(newScript);
            },
            getListOfLanguages: function(callback) {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == XMLHttpRequest.DONE) {
                        var response = JSON.parse(xhr.responseText);

                        if (response && response.data && response.data.languages) {
                            callback(response.data.languages);
                            return;
                        }

                        if (response.error && response.error.message === 'Daily Limit Exceeded') {
                            console.error('Text translation failed. Error message: "Daily Limit Exceeded."');
                            return;
                        }

                        if (response.error) {
                            console.error(response.error.message);
                            return;
                        }

                        console.error(response);
                    }
                }
                var url = 'https://www.googleapis.com/language/translate/v2/languages?key=' + connection.googKey + '&target=en';
                xhr.open('GET', url, true);
                xhr.send(null);
            }
        };
    }

    return {
        handle: handle
    };
})();

// _____________________
// RTCMultiConnection.js

(function(connection) {
    forceOptions = forceOptions || {
        useDefaultDevices: true
    };

    connection.channel = connection.sessionid = (roomid || location.href.replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('')) + '';
    connection.socketURL = connection.socketURL || "/";

    console.log(" >>>> connection channel ", connection.channel);

    var mPeer = new MultiPeers(connection);

    var preventDuplicateOnStreamEvents = {};
    mPeer.onGettingLocalMedia = function(stream, callback) {
        callback = callback || function() {};

        if (preventDuplicateOnStreamEvents[stream.streamid]) {
            callback();
            return;
        }
        preventDuplicateOnStreamEvents[stream.streamid] = true;

        try {
            stream.type = 'local';
        } catch (e) {}

        connection.setStreamEndHandler(stream);

        getRMCMediaElement(stream, function(mediaElement) {
            mediaElement.id = stream.streamid;
            mediaElement.muted = true;
            mediaElement.volume = 0;

            if (connection.attachStreams.indexOf(stream) === -1) {
                connection.attachStreams.push(stream);
            }

            if (typeof StreamsHandler !== 'undefined') {
                StreamsHandler.setHandlers(stream, true, connection);
            }

            connection.streamEvents[stream.streamid] = {
                stream: stream,
                type: 'local',
                mediaElement: mediaElement,
                userid: connection.userid,
                extra: connection.extra,
                streamid: stream.streamid,
                isAudioMuted: true
            };

            try {
                setHarkEvents(connection, connection.streamEvents[stream.streamid]);
                setMuteHandlers(connection, connection.streamEvents[stream.streamid]);

                connection.onstream(connection.streamEvents[stream.streamid]);
            } catch (e) {
                //
            }

            callback();
        }, connection);
    };

    mPeer.onGettingRemoteMedia = function(stream, remoteUserId) {
        try {
            stream.type = 'remote';
        } catch (e) {}

        connection.setStreamEndHandler(stream, 'remote-stream');

        getRMCMediaElement(stream, function(mediaElement) {
            mediaElement.id = stream.streamid;

            if (typeof StreamsHandler !== 'undefined') {
                StreamsHandler.setHandlers(stream, false, connection);
            }

            connection.streamEvents[stream.streamid] = {
                stream: stream,
                type: 'remote',
                userid: remoteUserId,
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                mediaElement: mediaElement,
                streamid: stream.streamid
            };

            setMuteHandlers(connection, connection.streamEvents[stream.streamid]);

            connection.onstream(connection.streamEvents[stream.streamid]);
        }, connection);
    };

    mPeer.onRemovingRemoteMedia = function(stream, remoteUserId) {
        var streamEvent = connection.streamEvents[stream.streamid];
        if (!streamEvent) {
            streamEvent = {
                stream: stream,
                type: 'remote',
                userid: remoteUserId,
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                streamid: stream.streamid,
                mediaElement: connection.streamEvents[stream.streamid] ? connection.streamEvents[stream.streamid].mediaElement : null
            };
        }

        if (connection.peersBackup[streamEvent.userid]) {
            streamEvent.extra = connection.peersBackup[streamEvent.userid].extra;
        }

        connection.onstreamended(streamEvent);

        delete connection.streamEvents[stream.streamid];
    };

    mPeer.onNegotiationNeeded = function(message, remoteUserId, callback) {
        callback = callback || function() {};

        remoteUserId = remoteUserId || message.remoteUserId;
        message = message || '';

        // usually a message looks like this
        var messageToDeliver = {
            remoteUserId: remoteUserId,
            message: message,
            sender: connection.userid
        };

        if (message.remoteUserId && message.message && message.sender) {
            // if a code is manually passing required data
            messageToDeliver = message;
        }

        connectSocket(function() {
            connection.socket.emit(connection.socketMessageEvent, messageToDeliver, callback);
        });
    };

    function onUserLeft(remoteUserId) {
        connection.deletePeer(remoteUserId);
    }

    mPeer.onUserLeft = onUserLeft;
    mPeer.disconnectWith = function(remoteUserId, callback) {
        if (connection.socket) {
            connection.socket.emit('disconnect-with', remoteUserId, callback || function() {});
        }

        connection.deletePeer(remoteUserId);
    };

    connection.socketOptions = {
        // 'force new connection': true, // For SocketIO version < 1.0
        // 'forceNew': true, // For SocketIO version >= 1.0
        'transport': 'polling' // fixing transport:unknown issues
    };

    function connectSocket(connectCallback) {
        connection.socketAutoReConnect = true;

        if (connection.socket) { // todo: check here readySate/etc. to make sure socket is still opened
            if (connectCallback) {
                connectCallback(connection.socket);
            }
            return;
        }

        if (typeof SocketConnection === 'undefined') {
            if (typeof FirebaseConnection !== 'undefined') {
                window.SocketConnection = FirebaseConnection;
            } else if (typeof PubNubConnection !== 'undefined') {
                window.SocketConnection = PubNubConnection;
            } else {
                throw 'SocketConnection.js seems missed.';
            }
        }

        new SocketConnection(connection, function(s) {
            if (connectCallback) {
                connectCallback(connection.socket);
            }
        });
    }

    // 1st paramter is roomid
    // 2rd paramter is a callback function
    connection.openOrJoin = function(roomid, callback) {
        callback = callback || function() {};

        connection.checkPresence(roomid, function(isRoomExist, roomid) {
            if (isRoomExist) {
                connection.sessionid = roomid;

                var localPeerSdpConstraints = false;
                var remotePeerSdpConstraints = false;
                var isOneWay = !!connection.session.oneway;
                var isDataOnly = isData(connection.session);

                remotePeerSdpConstraints = {
                    OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                }

                localPeerSdpConstraints = {
                    OfferToReceiveAudio: isOneWay ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: isOneWay ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                }

                var connectionDescription = {
                    remoteUserId: connection.sessionid,
                    message: {
                        newParticipationRequest: true,
                        isOneWay: isOneWay,
                        isDataOnly: isDataOnly,
                        localPeerSdpConstraints: localPeerSdpConstraints,
                        remotePeerSdpConstraints: remotePeerSdpConstraints
                    },
                    sender: connection.userid
                };

                beforeJoin(connectionDescription.message, function() {
                    joinRoom(connectionDescription, callback);
                });
                return;
            }

            connection.waitingForLocalMedia = true;
            connection.isInitiator = true;

            connection.sessionid = roomid || connection.sessionid;

            if (isData(connection.session)) {
                openRoom(callback);
                return;
            }

            connection.captureUserMedia(function() {
                openRoom(callback);
            });
        });
    };

    // don't allow someone to join this person until he has the media
    connection.waitingForLocalMedia = false;

    connection.open = function(roomid, callback) {
        callback = callback || function() {};

        connection.waitingForLocalMedia = true;
        connection.isInitiator = true;

        connection.sessionid = roomid || connection.sessionid;

        connectSocket(function() {
            if (isData(connection.session)) {
                openRoom(callback);
                return;
            }

            connection.captureUserMedia(function() {
                openRoom(callback);
            });
        });
    };

    // this object keeps extra-data records for all connected users
    // this object is never cleared so you can always access extra-data even if a user left
    connection.peersBackup = {};

    connection.deletePeer = function(remoteUserId) {
        if (!remoteUserId || !connection.peers[remoteUserId]) {
            return;
        }

        var eventObject = {
            userid: remoteUserId,
            extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {}
        };

        if (connection.peersBackup[eventObject.userid]) {
            eventObject.extra = connection.peersBackup[eventObject.userid].extra;
        }

        connection.onleave(eventObject);

        if (!!connection.peers[remoteUserId]) {
            connection.peers[remoteUserId].streams.forEach(function(stream) {
                stream.stop();
            });

            var peer = connection.peers[remoteUserId].peer;
            if (peer && peer.iceConnectionState !== 'closed') {
                try {
                    peer.close();
                } catch (e) {}
            }

            if (connection.peers[remoteUserId]) {
                connection.peers[remoteUserId].peer = null;
                delete connection.peers[remoteUserId];
            }
        }
    }

    connection.rejoin = function(connectionDescription) {
        if (connection.isInitiator || !connectionDescription || !Object.keys(connectionDescription).length) {
            return;
        }

        var extra = {};

        if (connection.peers[connectionDescription.remoteUserId]) {
            extra = connection.peers[connectionDescription.remoteUserId].extra;
            connection.deletePeer(connectionDescription.remoteUserId);
        }

        if (connectionDescription && connectionDescription.remoteUserId) {
            connection.join(connectionDescription.remoteUserId);

            connection.onReConnecting({
                userid: connectionDescription.remoteUserId,
                extra: extra
            });
        }
    };

    connection.join = function(remoteUserId, options) {
        connection.sessionid = (remoteUserId ? remoteUserId.sessionid || remoteUserId.remoteUserId || remoteUserId : false) || connection.sessionid;
        connection.sessionid += '';

        var localPeerSdpConstraints = false;
        var remotePeerSdpConstraints = false;
        var isOneWay = false;
        var isDataOnly = false;

        if ((remoteUserId && remoteUserId.session) || !remoteUserId || typeof remoteUserId === 'string') {
            var session = remoteUserId ? remoteUserId.session || connection.session : connection.session;

            isOneWay = !!session.oneway;
            isDataOnly = isData(session);

            remotePeerSdpConstraints = {
                OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
            };

            localPeerSdpConstraints = {
                OfferToReceiveAudio: isOneWay ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                OfferToReceiveVideo: isOneWay ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
            };
        }

        options = options || {};

        var cb = function() {};
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }

        if (typeof options.localPeerSdpConstraints !== 'undefined') {
            localPeerSdpConstraints = options.localPeerSdpConstraints;
        }

        if (typeof options.remotePeerSdpConstraints !== 'undefined') {
            remotePeerSdpConstraints = options.remotePeerSdpConstraints;
        }

        if (typeof options.isOneWay !== 'undefined') {
            isOneWay = options.isOneWay;
        }

        if (typeof options.isDataOnly !== 'undefined') {
            isDataOnly = options.isDataOnly;
        }

        var connectionDescription = {
            remoteUserId: connection.sessionid,
            message: {
                newParticipationRequest: true,
                isOneWay: isOneWay,
                isDataOnly: isDataOnly,
                localPeerSdpConstraints: localPeerSdpConstraints,
                remotePeerSdpConstraints: remotePeerSdpConstraints
            },
            sender: connection.userid
        };

        beforeJoin(connectionDescription.message, function() {
            connectSocket(function() {
                joinRoom(connectionDescription, cb);
            });
        });
        return connectionDescription;
    };

    function joinRoom(connectionDescription, cb) {
        connection.socket.emit('join-room', {
            sessionid: connection.sessionid,
            session: connection.session,
            mediaConstraints: connection.mediaConstraints,
            sdpConstraints: connection.sdpConstraints,
            streams: getStreamInfoForAdmin(),
            extra: connection.extra,
            password: typeof connection.password !== 'undefined' && typeof connection.password !== 'object' ? connection.password : ''
        }, function(isRoomJoined, error) {
            if (isRoomJoined === true) {
                if (connection.enableLogs) {
                    console.log('isRoomJoined: ', isRoomJoined, ' roomid: ', connection.sessionid);
                }

                if (!!connection.peers[connection.sessionid]) {
                    // on socket disconnect & reconnect
                    return;
                }

                mPeer.onNegotiationNeeded(connectionDescription);
            }

            if (isRoomJoined === false) {
                if (connection.enableLogs) {
                    console.warn('isRoomJoined: ', error, ' roomid: ', connection.sessionid);
                }

                // [disabled] retry after 3 seconds
                false && setTimeout(function() {
                    joinRoom(connectionDescription, cb);
                }, 3000);
            }

            cb(isRoomJoined, connection.sessionid, error);
        });
    }

    connection.publicRoomIdentifier = '';

    function openRoom(callback) {
        if (connection.enableLogs) {
            console.log('Sending open-room signal to socket.io');
        }

        connection.waitingForLocalMedia = false;
        connection.socket.emit('open-room', {
            sessionid: connection.sessionid,
            session: connection.session,
            mediaConstraints: connection.mediaConstraints,
            sdpConstraints: connection.sdpConstraints,
            streams: getStreamInfoForAdmin(),
            extra: connection.extra,
            identifier: connection.publicRoomIdentifier,
            password: typeof connection.password !== 'undefined' && typeof connection.password !== 'object' ? connection.password : ''
        }, function(isRoomOpened, error) {
            if (isRoomOpened === true) {
                if (connection.enableLogs) {
                    console.log('isRoomOpened: ', isRoomOpened, ' roomid: ', connection.sessionid);
                }
                callback(isRoomOpened, connection.sessionid);
            }

            if (isRoomOpened === false) {
                if (connection.enableLogs) {
                    console.warn('isRoomOpened: ', error, ' roomid: ', connection.sessionid);
                }

                callback(isRoomOpened, connection.sessionid, error);
            }
        });
    }

    function getStreamInfoForAdmin() {
        try {
            return connection.streamEvents.selectAll('local').map(function(event) {
                return {
                    streamid: event.streamid,
                    tracks: event.stream.getTracks().length
                };
            });
        } catch (e) {
            return [];
        }
    }

    function beforeJoin(userPreferences, callback) {
        if (connection.dontCaptureUserMedia || userPreferences.isDataOnly) {
            callback();
            return;
        }

        var localMediaConstraints = {};

        if (userPreferences.localPeerSdpConstraints.OfferToReceiveAudio) {
            localMediaConstraints.audio = connection.mediaConstraints.audio;
        }

        if (userPreferences.localPeerSdpConstraints.OfferToReceiveVideo) {
            localMediaConstraints.video = connection.mediaConstraints.video;
        }

        var session = userPreferences.session || connection.session;

        if (session.oneway && session.audio !== 'two-way' && session.video !== 'two-way' && session.screen !== 'two-way') {
            callback();
            return;
        }

        if (session.oneway && session.audio && session.audio === 'two-way') {
            session = {
                audio: true
            };
        }

        if (session.audio || session.video || session.screen) {
            if (session.screen) {
                if (DetectRTC.browser.name === 'Edge') {
                    navigator.getDisplayMedia({
                        video: true,
                        audio: isAudioPlusTab(connection)
                    }).then(function(screen) {
                        screen.isScreen = true;
                        mPeer.onGettingLocalMedia(screen);

                        if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                            connection.invokeGetUserMedia(null, callback);
                        } else {
                            callback(screen);
                        }
                    }, function(error) {
                        console.error('Unable to capture screen on Edge. HTTPs and version 17+ is required.');
                    });
                } else {
                    connection.invokeGetUserMedia({
                        audio: isAudioPlusTab(connection),
                        video: true,
                        isScreen: true
                    }, (session.audio || session.video) && !isAudioPlusTab(connection) ? connection.invokeGetUserMedia(null, callback) : callback);
                }
            } else if (session.audio || session.video) {
                connection.invokeGetUserMedia(null, callback, session);
            }
        }
    }

    connection.getUserMedia = connection.captureUserMedia = function(callback, sessionForced) {
        callback = callback || function() {};
        var session = sessionForced || connection.session;

        if (connection.dontCaptureUserMedia || isData(session)) {
            callback();
            return;
        }

        if (session.audio || session.video || session.screen) {
            if (session.screen) {
                if (DetectRTC.browser.name === 'Edge') {
                    navigator.getDisplayMedia({
                        video: true,
                        audio: isAudioPlusTab(connection)
                    }).then(function(screen) {
                        screen.isScreen = true;
                        mPeer.onGettingLocalMedia(screen);

                        if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                            var nonScreenSession = {};
                            for (var s in session) {
                                if (s !== 'screen') {
                                    nonScreenSession[s] = session[s];
                                }
                            }
                            connection.invokeGetUserMedia(sessionForced, callback, nonScreenSession);
                            return;
                        }
                        callback(screen);
                    }, function(error) {
                        console.error('Unable to capture screen on Edge. HTTPs and version 17+ is required.');
                    });
                } else {
                    connection.invokeGetUserMedia({
                        audio: isAudioPlusTab(connection),
                        video: true,
                        isScreen: true
                    }, function(stream) {
                        if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                            var nonScreenSession = {};
                            for (var s in session) {
                                if (s !== 'screen') {
                                    nonScreenSession[s] = session[s];
                                }
                            }
                            connection.invokeGetUserMedia(sessionForced, callback, nonScreenSession);
                            return;
                        }
                        callback(stream);
                    });
                }
            } else if (session.audio || session.video) {
                connection.invokeGetUserMedia(sessionForced, callback, session);
            }
        }
    };

    connection.onbeforeunload = function(arg1, dontCloseSocket) {
        if (!connection.closeBeforeUnload) {
            return;
        }

        connection.peers.getAllParticipants().forEach(function(participant) {
            mPeer.onNegotiationNeeded({
                userLeft: true
            }, participant);

            if (connection.peers[participant] && connection.peers[participant].peer) {
                connection.peers[participant].peer.close();
            }

            delete connection.peers[participant];
        });

        if (!dontCloseSocket) {
            connection.closeSocket();
        }

        connection.isInitiator = false;
    };

    if (!window.ignoreBeforeUnload) {
        // user can implement its own version of window.onbeforeunload
        connection.closeBeforeUnload = true;
        window.addEventListener('beforeunload', connection.onbeforeunload, false);
    } else {
        connection.closeBeforeUnload = false;
    }

    connection.userid = getRandomString();
    connection.changeUserId = function(newUserId, callback) {
        callback = callback || function() {};
        connection.userid = newUserId || getRandomString();
        connection.socket.emit('changed-uuid', connection.userid, callback);
    };

    connection.extra = {};
    connection.attachStreams = [];

    connection.session = {
        audio: true,
        video: true
    };

    connection.enableFileSharing = false;

    // all values in kbps
    connection.bandwidth = {
        screen: false,
        audio: false,
        video: false
    };

    connection.codecs = {
        audio: 'opus',
        video: 'VP9'
    };

    connection.processSdp = function(sdp) {
        // ignore SDP modification if unified-pan is supported
        if (isUnifiedPlanSupportedDefault()) {
            return sdp;
        }

        if (DetectRTC.browser.name === 'Safari') {
            return sdp;
        }

        if (connection.codecs.video.toUpperCase() === 'VP8') {
            sdp = CodecsHandler.preferCodec(sdp, 'vp8');
        }

        if (connection.codecs.video.toUpperCase() === 'VP9') {
            sdp = CodecsHandler.preferCodec(sdp, 'vp9');
        }

        if (connection.codecs.video.toUpperCase() === 'H264') {
            sdp = CodecsHandler.preferCodec(sdp, 'h264');
        }

        if (connection.codecs.audio === 'G722') {
            sdp = CodecsHandler.removeNonG722(sdp);
        }

        if (DetectRTC.browser.name === 'Firefox') {
            return sdp;
        }

        if (connection.bandwidth.video || connection.bandwidth.screen) {
            sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, connection.bandwidth, !!connection.session.screen);
        }

        if (connection.bandwidth.video) {
            sdp = CodecsHandler.setVideoBitrates(sdp, {
                min: connection.bandwidth.video * 8 * 1024,
                max: connection.bandwidth.video * 8 * 1024
            });
        }

        if (connection.bandwidth.audio) {
            sdp = CodecsHandler.setOpusAttributes(sdp, {
                maxaveragebitrate: connection.bandwidth.audio * 8 * 1024,
                maxplaybackrate: connection.bandwidth.audio * 8 * 1024,
                stereo: 1,
                maxptime: 3
            });
        }

        return sdp;
    };

    if (typeof CodecsHandler !== 'undefined') {
        connection.BandwidthHandler = connection.CodecsHandler = CodecsHandler;
    }

    connection.mediaConstraints = {
        audio: {
            mandatory: {},
            optional: connection.bandwidth.audio ? [{
                bandwidth: connection.bandwidth.audio * 8 * 1024 || 128 * 8 * 1024
            }] : []
        },
        video: {
            mandatory: {},
            optional: connection.bandwidth.video ? [{
                bandwidth: connection.bandwidth.video * 8 * 1024 || 128 * 8 * 1024
            }, {
                facingMode: 'user'
            }] : [{
                facingMode: 'user'
            }]
        }
    };

    if (DetectRTC.browser.name === 'Firefox') {
        connection.mediaConstraints = {
            audio: true,
            video: true
        };
    }

    if (!forceOptions.useDefaultDevices && !DetectRTC.isMobileDevice) {
        DetectRTC.load(function() {
            var lastAudioDevice, lastVideoDevice;
            // it will force RTCMultiConnection to capture last-devices
            // i.e. if external microphone is attached to system, we should prefer it over built-in devices.
            DetectRTC.MediaDevices.forEach(function(device) {
                if (device.kind === 'audioinput' && connection.mediaConstraints.audio !== false) {
                    lastAudioDevice = device;
                }

                if (device.kind === 'videoinput' && connection.mediaConstraints.video !== false) {
                    lastVideoDevice = device;
                }
            });

            if (lastAudioDevice) {
                if (DetectRTC.browser.name === 'Firefox') {
                    if (connection.mediaConstraints.audio !== true) {
                        connection.mediaConstraints.audio.deviceId = lastAudioDevice.id;
                    } else {
                        connection.mediaConstraints.audio = {
                            deviceId: lastAudioDevice.id
                        }
                    }
                    return;
                }

                if (connection.mediaConstraints.audio == true) {
                    connection.mediaConstraints.audio = {
                        mandatory: {},
                        optional: []
                    }
                }

                if (!connection.mediaConstraints.audio.optional) {
                    connection.mediaConstraints.audio.optional = [];
                }

                var optional = [{
                    sourceId: lastAudioDevice.id
                }];

                connection.mediaConstraints.audio.optional = optional.concat(connection.mediaConstraints.audio.optional);
            }

            if (lastVideoDevice) {
                if (DetectRTC.browser.name === 'Firefox') {
                    if (connection.mediaConstraints.video !== true) {
                        connection.mediaConstraints.video.deviceId = lastVideoDevice.id;
                    } else {
                        connection.mediaConstraints.video = {
                            deviceId: lastVideoDevice.id
                        }
                    }
                    return;
                }

                if (connection.mediaConstraints.video == true) {
                    connection.mediaConstraints.video = {
                        mandatory: {},
                        optional: []
                    }
                }

                if (!connection.mediaConstraints.video.optional) {
                    connection.mediaConstraints.video.optional = [];
                }

                var optional = [{
                    sourceId: lastVideoDevice.id
                }];

                connection.mediaConstraints.video.optional = optional.concat(connection.mediaConstraints.video.optional);
            }
        });
    }

    connection.sdpConstraints = {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        },
        optional: [{
            VoiceActivityDetection: false
        }]
    };

    connection.sdpSemantics = null; // "unified-plan" or "plan-b", ref: webrtc.org/web-apis/chrome/unified-plan/
    connection.iceCandidatePoolSize = null; // 0
    connection.bundlePolicy = null; // max-bundle
    connection.rtcpMuxPolicy = null; // "require" or "negotiate"
    connection.iceTransportPolicy = null; // "relay" or "all"
    connection.optionalArgument = {
        optional: [{
            DtlsSrtpKeyAgreement: true
        }, {
            googImprovedWifiBwe: true
        }, {
            googScreencastMinBitrate: 300
        }, {
            googIPv6: true
        }, {
            googDscp: true
        }, {
            googCpuUnderuseThreshold: 55
        }, {
            googCpuOveruseThreshold: 85
        }, {
            googSuspendBelowMinBitrate: true
        }, {
            googCpuOveruseDetection: true
        }],
        mandatory: {}
    };

    connection.iceServers = IceServersHandler.getIceServers(connection);

    connection.candidates = {
        host: true,
        stun: true,
        turn: true
    };

    connection.iceProtocols = {
        tcp: true,
        udp: true
    };

    // EVENTs
    connection.onopen = function(event) {
        if (!!connection.enableLogs) {
            console.info('Data connection has been opened between you & ', event.userid);
        }
    };

    connection.onclose = function(event) {
        if (!!connection.enableLogs) {
            console.warn('Data connection has been closed between you & ', event.userid);
        }
    };

    connection.onerror = function(error) {
        if (!!connection.enableLogs) {
            console.error(error.userid, 'data-error', error);
        }
    };

    connection.onmessage = function(event) {
        if (!!connection.enableLogs) {
            console.debug('data-message', event.userid, event.data);
        }
    };

    connection.send = function(data, remoteUserId) {
        connection.peers.send(data, remoteUserId);
    };

    connection.close = connection.disconnect = connection.leave = function() {
        connection.onbeforeunload(false, true);
    };

    connection.closeEntireSession = function(callback) {
        callback = callback || function() {};
        connection.socket.emit('close-entire-session', function looper() {
            if (connection.getAllParticipants().length) {
                setTimeout(looper, 100);
                return;
            }

            connection.onEntireSessionClosed({
                sessionid: connection.sessionid,
                userid: connection.userid,
                extra: connection.extra
            });

            connection.changeUserId(null, function() {
                connection.close();
                callback();
            });
        });
    };

    connection.onEntireSessionClosed = function(event) {
        if (!connection.enableLogs) return;
        console.info('Entire session is closed: ', event.sessionid, event.extra);
    };

    connection.onstream = function(e) {
        var parentNode = connection.videosContainer;
        parentNode.insertBefore(e.mediaElement, parentNode.firstChild);
        var played = e.mediaElement.play();

        if (typeof played !== 'undefined') {
            played.catch(function() {
                /*** iOS 11 doesn't allow automatic play and rejects ***/
            }).then(function() {
                setTimeout(function() {
                    e.mediaElement.play();
                }, 2000);
            });
            return;
        }

        setTimeout(function() {
            e.mediaElement.play();
        }, 2000);
    };

    connection.onstreamended = function(e) {
        if (!e.mediaElement) {
            e.mediaElement = document.getElementById(e.streamid);
        }

        if (!e.mediaElement || !e.mediaElement.parentNode) {
            return;
        }

        e.mediaElement.parentNode.removeChild(e.mediaElement);
    };

    connection.direction = 'many-to-many';

    connection.removeStream = function(streamid, remoteUserId) {
        var stream;
        connection.attachStreams.forEach(function(localStream) {
            if (localStream.id === streamid) {
                stream = localStream;
            }
        });

        if (!stream) {
            console.warn('No such stream exist.', streamid);
            return;
        }

        connection.peers.getAllParticipants().forEach(function(participant) {
            if (remoteUserId && participant !== remoteUserId) {
                return;
            }

            var user = connection.peers[participant];
            try {
                user.peer.removeStream(stream);
            } catch (e) {}
        });

        connection.renegotiate();
    };

    connection.addStream = function(session, remoteUserId) {
        if (!!session.getTracks) {
            if (connection.attachStreams.indexOf(session) === -1) {
                if (!session.streamid) {
                    session.streamid = session.id;
                }

                connection.attachStreams.push(session);
            }
            connection.renegotiate(remoteUserId);
            return;
        }

        if (isData(session)) {
            connection.renegotiate(remoteUserId);
            return;
        }

        if (session.audio || session.video || session.screen) {
            if (session.screen) {
                if (DetectRTC.browser.name === 'Edge') {
                    navigator.getDisplayMedia({
                        video: true,
                        audio: isAudioPlusTab(connection)
                    }).then(function(screen) {
                        screen.isScreen = true;
                        mPeer.onGettingLocalMedia(screen);

                        if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                            connection.invokeGetUserMedia(null, function(stream) {
                                gumCallback(stream);
                            });
                        } else {
                            gumCallback(screen);
                        }
                    }, function(error) {
                        console.error('Unable to capture screen on Edge. HTTPs and version 17+ is required.');
                    });
                } else {
                    connection.invokeGetUserMedia({
                        audio: isAudioPlusTab(connection),
                        video: true,
                        isScreen: true
                    }, function(stream) {
                        if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                            connection.invokeGetUserMedia(null, function(stream) {
                                gumCallback(stream);
                            });
                        } else {
                            gumCallback(stream);
                        }
                    });
                }
            } else if (session.audio || session.video) {
                connection.invokeGetUserMedia(null, gumCallback);
            }
        }

        function gumCallback(stream) {
            if (session.streamCallback) {
                session.streamCallback(stream);
            }

            connection.renegotiate(remoteUserId);
        }
    };
    var IsChrome = !!navigator.webkitGetUserMedia;
    connection.invokeGetUserMedia = function(localMediaConstraints, callback, session) {
        if (!session) {
            session = connection.session;
        }

        if (!localMediaConstraints) {
            localMediaConstraints = connection.mediaConstraints;
        }

        console.log(" ======================= invokeGetUserMedia ============= ", session.audio , session.video , localMediaConstraints);
        if(localMediaConstraints.isScreen){
            // For ScreenShare
            getUserMediaHandler({
                onGettingLocalMedia: function(stream) {
                    var videoConstraints = localMediaConstraints.video;
                    if (videoConstraints) {
                        if (videoConstraints.mediaSource || videoConstraints.mozMediaSource) {
                            stream.isScreen = true;
                        } else if (videoConstraints.mandatory && videoConstraints.mandatory.chromeMediaSource) {
                            stream.isScreen = true;
                        }
                    }

                    if (!stream.isScreen) {
                        stream.isVideo = !!getTracks(stream, 'video').length;
                        stream.isAudio = !stream.isVideo && getTracks(stream, 'audio').length;
                    }

                    mPeer.onGettingLocalMedia(stream, function() {
                        if (typeof callback === 'function') {
                            callback(stream);
                        }
                    });
                },
                onLocalMediaError: function(error, constraints) {
                    mPeer.onLocalMediaError(error, constraints);
                },
                localMediaConstraints: localMediaConstraints
            });
        }else{
            // For regular Call Audio / Video
            getUserMediaHandler({
                onGettingLocalMedia: function(stream) {
                    var videoConstraints = localMediaConstraints.video;
                    if (videoConstraints) {
                        if (videoConstraints.mediaSource || videoConstraints.mozMediaSource) {
                            stream.isScreen = true;
                        } else if (videoConstraints.mandatory && videoConstraints.mandatory.chromeMediaSource) {
                            stream.isScreen = true;
                        }
                    }

                    if (!stream.isScreen) {
                        stream.isVideo = !!getTracks(stream, 'video').length;
                        stream.isAudio = !stream.isVideo && getTracks(stream, 'audio').length;
                    }

                    mPeer.onGettingLocalMedia(stream, function() {
                        if (typeof callback === 'function') {
                            callback(stream);
                        }
                    });
                },
                onLocalMediaError: function(error, constraints) {
                    mPeer.onLocalMediaError(error, constraints);
                },
                // localMediaConstraints: localMediaConstraints || {
                //     audio: session.audio ? localMediaConstraints.audio : false,
                //     video: session.video ? localMediaConstraints.video : false
                // }
                localMediaConstraints:  {
                    audio: session.audio ? localMediaConstraints.audio : false,
                    video: session.video ? localMediaConstraints.video : false
                }
            });
        }
    };

    function applyConstraints(stream, mediaConstraints) {
        if (!stream) {
            if (!!connection.enableLogs) {
                console.error('No stream to applyConstraints.');
            }
            return;
        }

        if (mediaConstraints.audio) {
            getTracks(stream, 'audio').forEach(function(track) {
                track.applyConstraints(mediaConstraints.audio);
            });
        }

        if (mediaConstraints.video) {
            getTracks(stream, 'video').forEach(function(track) {
                track.applyConstraints(mediaConstraints.video);
            });
        }
    }

    connection.applyConstraints = function(mediaConstraints, streamid) {
        if (!MediaStreamTrack || !MediaStreamTrack.prototype.applyConstraints) {
            alert('track.applyConstraints is NOT supported in your browser.');
            return;
        }

        if (streamid) {
            var stream;
            if (connection.streamEvents[streamid]) {
                stream = connection.streamEvents[streamid].stream;
            }
            applyConstraints(stream, mediaConstraints);
            return;
        }

        connection.attachStreams.forEach(function(stream) {
            applyConstraints(stream, mediaConstraints);
        });
    };

    function replaceTrack(track, remoteUserId, isVideoTrack) {
        if (remoteUserId) {
            mPeer.replaceTrack(track, remoteUserId, isVideoTrack);
            return;
        }

        connection.peers.getAllParticipants().forEach(function(participant) {
            mPeer.replaceTrack(track, participant, isVideoTrack);
        });
    }

    connection.replaceTrack = function(session, remoteUserId, isVideoTrack) {
        session = session || {};

        if (!RTCPeerConnection.prototype.getSenders) {
            connection.addStream(session);
            return;
        }

        if (session instanceof MediaStreamTrack) {
            replaceTrack(session, remoteUserId, isVideoTrack);
            return;
        }

        if (session instanceof MediaStream) {
            if (getTracks(session, 'video').length) {
                replaceTrack(getTracks(session, 'video')[0], remoteUserId, true);
            }

            if (getTracks(session, 'audio').length) {
                replaceTrack(getTracks(session, 'audio')[0], remoteUserId, false);
            }
            return;
        }

        if (isData(session)) {
            throw 'connection.replaceTrack requires audio and/or video and/or screen.';
            return;
        }

        if (session.audio || session.video || session.screen) {
            if (session.screen) {
                if (DetectRTC.browser.name === 'Edge') {
                    navigator.getDisplayMedia({
                        video: true,
                        audio: isAudioPlusTab(connection)
                    }).then(function(screen) {
                        screen.isScreen = true;
                        mPeer.onGettingLocalMedia(screen);

                        if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                            connection.invokeGetUserMedia(null, gumCallback);
                        } else {
                            gumCallback(screen);
                        }
                    }, function(error) {
                        console.error('Unable to capture screen on Edge. HTTPs and version 17+ is required.');
                    });
                } else {
                    connection.invokeGetUserMedia({
                        audio: isAudioPlusTab(connection),
                        video: true,
                        isScreen: true
                    }, (session.audio || session.video) && !isAudioPlusTab(connection) ? connection.invokeGetUserMedia(null, gumCallback) : gumCallback);
                }
            } else if (session.audio || session.video) {
                connection.invokeGetUserMedia(null, gumCallback);
            }
        }

        function gumCallback(stream) {
            connection.replaceTrack(stream, remoteUserId, isVideoTrack || session.video || session.screen);
        }
    };

    connection.resetTrack = function(remoteUsersIds, isVideoTrack) {
        if (!remoteUsersIds) {
            remoteUsersIds = connection.getAllParticipants();
        }

        if (typeof remoteUsersIds == 'string') {
            remoteUsersIds = [remoteUsersIds];
        }

        remoteUsersIds.forEach(function(participant) {
            var peer = connection.peers[participant].peer;

            if ((typeof isVideoTrack === 'undefined' || isVideoTrack === true) && peer.lastVideoTrack) {
                connection.replaceTrack(peer.lastVideoTrack, participant, true);
            }

            if ((typeof isVideoTrack === 'undefined' || isVideoTrack === false) && peer.lastAudioTrack) {
                connection.replaceTrack(peer.lastAudioTrack, participant, false);
            }
        });
    };

    connection.renegotiate = function(remoteUserId) {
        if (remoteUserId) {
            mPeer.renegotiatePeer(remoteUserId);
            return;
        }

        connection.peers.getAllParticipants().forEach(function(participant) {
            mPeer.renegotiatePeer(participant);
        });
    };

    connection.setStreamEndHandler = function(stream, isRemote) {
        if (!stream || !stream.addEventListener) return;

        isRemote = !!isRemote;

        if (stream.alreadySetEndHandler) {
            return;
        }
        stream.alreadySetEndHandler = true;

        var streamEndedEvent = 'ended';

        if ('oninactive' in stream) {
            streamEndedEvent = 'inactive';
        }

        stream.addEventListener(streamEndedEvent, function() {
            if (stream.idInstance) {
                currentUserMediaRequest.remove(stream.idInstance);
            }

            if (!isRemote) {
                // reset attachStreams
                var streams = [];
                connection.attachStreams.forEach(function(s) {
                    if (s.id != stream.id) {
                        streams.push(s);
                    }
                });
                connection.attachStreams = streams;
            }

            // connection.renegotiate();

            var streamEvent = connection.streamEvents[stream.streamid];
            if (!streamEvent) {
                streamEvent = {
                    stream: stream,
                    streamid: stream.streamid,
                    type: isRemote ? 'remote' : 'local',
                    userid: connection.userid,
                    extra: connection.extra,
                    mediaElement: connection.streamEvents[stream.streamid] ? connection.streamEvents[stream.streamid].mediaElement : null
                };
            }

            if (isRemote && connection.peers[streamEvent.userid]) {
                // reset remote "streams"
                var peer = connection.peers[streamEvent.userid].peer;
                var streams = [];
                peer.getRemoteStreams().forEach(function(s) {
                    if (s.id != stream.id) {
                        streams.push(s);
                    }
                });
                connection.peers[streamEvent.userid].streams = streams;
            }

            if (streamEvent.userid === connection.userid && streamEvent.type === 'remote') {
                return;
            }

            if (connection.peersBackup[streamEvent.userid]) {
                streamEvent.extra = connection.peersBackup[streamEvent.userid].extra;
            }

            connection.onstreamended(streamEvent);

            delete connection.streamEvents[stream.streamid];
        }, false);
    };

    connection.onMediaError = function(error, constraints) {
        if (!!connection.enableLogs) {
            console.error(error, constraints);
        }
    };

    connection.autoCloseEntireSession = false;

    connection.filesContainer = connection.videosContainer = document.body || document.documentElement;
    connection.isInitiator = false;

    connection.shareFile = mPeer.shareFile;
    if (typeof FileProgressBarHandler !== 'undefined') {
        FileProgressBarHandler.handle(connection);
    }

    if (typeof TranslationHandler !== 'undefined') {
        TranslationHandler.handle(connection);
    }

    connection.token = getRandomString;

    connection.onNewParticipant = function(participantId, userPreferences) {
        connection.acceptParticipationRequest(participantId, userPreferences);
    };

    connection.acceptParticipationRequest = function(participantId, userPreferences) {
        if (userPreferences.successCallback) {
            userPreferences.successCallback();
            delete userPreferences.successCallback;
        }

        mPeer.createNewPeer(participantId, userPreferences);
    };

    if (typeof StreamsHandler !== 'undefined') {
        connection.StreamsHandler = StreamsHandler;
    }

    connection.onleave = function(userid) {};

    connection.invokeSelectFileDialog = function(callback) {
        var selector = new FileSelector();
        selector.accept = '*.*';
        selector.selectSingleFile(callback);
    };

    connection.onmute = function(e) {
        if (!e || !e.mediaElement) {
            return;
        }

        if (e.muteType === 'both' || e.muteType === 'video') {
            e.mediaElement.src = null;
            var paused = e.mediaElement.pause();
            if (typeof paused !== 'undefined') {
                paused.then(function() {
                    e.mediaElement.poster = e.snapshot || 'https://cdn.webrtc-experiment.com/images/muted.png';
                });
            } else {
                e.mediaElement.poster = e.snapshot || 'https://cdn.webrtc-experiment.com/images/muted.png';
            }
        } else if (e.muteType === 'audio') {
            e.mediaElement.muted = true;
        }
    };

    connection.onunmute = function(e) {
        if (!e || !e.mediaElement || !e.stream) {
            return;
        }

        if (e.unmuteType === 'both' || e.unmuteType === 'video') {
            e.mediaElement.poster = null;
            e.mediaElement.srcObject = e.stream;
            e.mediaElement.play();
        } else if (e.unmuteType === 'audio') {
            e.mediaElement.muted = false;
        }
    };

    connection.onExtraDataUpdated = function(event) {
        event.status = 'online';
        connection.onUserStatusChanged(event, true);
    };

    connection.getAllParticipants = function(sender) {
        return connection.peers.getAllParticipants(sender);
    };

    if (typeof StreamsHandler !== 'undefined') {
        StreamsHandler.onSyncNeeded = function(streamid, action, type) {
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    streamid: streamid,
                    action: action,
                    streamSyncNeeded: true,
                    type: type || 'both'
                }, participant);
            });
        };
    }

    connection.connectSocket = function(callback) {
        connectSocket(callback);
    };

    connection.closeSocket = function() {
        try {
            io.sockets = {};
        } catch (e) {};

        if (!connection.socket) return;

        if (typeof connection.socket.disconnect === 'function') {
            connection.socket.disconnect();
        }

        if (typeof connection.socket.resetProps === 'function') {
            connection.socket.resetProps();
        }

        connection.socket = null;
    };

    connection.getSocket = function(callback) {
        if (!callback && connection.enableLogs) {
            console.warn('getSocket.callback paramter is required.');
        }

        callback = callback || function() {};

        if (!connection.socket) {
            connectSocket(function() {
                callback(connection.socket);
            });
        } else {
            callback(connection.socket);
        }

        return connection.socket; // callback is preferred over return-statement
    };

    connection.getRemoteStreams = mPeer.getRemoteStreams;

    var skipStreams = ['selectFirst', 'selectAll', 'forEach'];

    connection.streamEvents = {
        selectFirst: function(options) {
            return connection.streamEvents.selectAll(options)[0];
        },
        selectAll: function(options) {
            if (!options) {
                // default will always be all streams
                options = {
                    local: true,
                    remote: true,
                    isScreen: true,
                    isAudio: true,
                    isVideo: true
                };
            }

            if (options == 'local') {
                options = {
                    local: true
                };
            }

            if (options == 'remote') {
                options = {
                    remote: true
                };
            }

            if (options == 'screen') {
                options = {
                    isScreen: true
                };
            }

            if (options == 'audio') {
                options = {
                    isAudio: true
                };
            }

            if (options == 'video') {
                options = {
                    isVideo: true
                };
            }

            var streams = [];
            Object.keys(connection.streamEvents).forEach(function(key) {
                var event = connection.streamEvents[key];

                if (skipStreams.indexOf(key) !== -1) return;
                var ignore = true;

                if (options.local && event.type === 'local') {
                    ignore = false;
                }

                if (options.remote && event.type === 'remote') {
                    ignore = false;
                }

                if (options.isScreen && event.stream.isScreen) {
                    ignore = false;
                }

                if (options.isVideo && event.stream.isVideo) {
                    ignore = false;
                }

                if (options.isAudio && event.stream.isAudio) {
                    ignore = false;
                }

                if (options.userid && event.userid === options.userid) {
                    ignore = false;
                }

                if (ignore === false) {
                    streams.push(event);
                }
            });

            return streams;
        }
    };

    //connection.socketURL = '@@socketURL'; // generated via config.json
    connection.socketMessageEvent = '@@socketMessageEvent'; // generated via config.json
    connection.socketCustomEvent = '@@socketCustomEvent'; // generated via config.json
    connection.DetectRTC = DetectRTC;

    connection.setCustomSocketEvent = function(customEvent) {
        if (customEvent) {
            connection.socketCustomEvent = customEvent;
        }

        if (!connection.socket) {
            return;
        }

        connection.socket.emit('set-custom-socket-event-listener', connection.socketCustomEvent);
    };

    connection.getNumberOfBroadcastViewers = function(broadcastId, callback) {
        if (!connection.socket || !broadcastId || !callback) return;

        connection.socket.emit('get-number-of-users-in-specific-broadcast', broadcastId, callback);
    };

    connection.onNumberOfBroadcastViewersUpdated = function(event) {
        if (!connection.enableLogs || !connection.isInitiator) return;
        console.info('Number of broadcast (', event.broadcastId, ') viewers', event.numberOfBroadcastViewers);
    };

    connection.onUserStatusChanged = function(event, dontWriteLogs) {
        if (!!connection.enableLogs && !dontWriteLogs) {
            console.info(event.userid, event.status);
        }
    };

    connection.getUserMediaHandler = getUserMediaHandler;
    connection.multiPeersHandler = mPeer;
    connection.enableLogs = true;
    connection.setCustomSocketHandler = function(customSocketHandler) {
        if (typeof SocketConnection !== 'undefined') {
            SocketConnection = customSocketHandler;
        }
    };

    // default value should be 15k because [old]Firefox's receiving limit is 16k!
    // however 64k works chrome-to-chrome
    connection.chunkSize = 40 * 1000;

    connection.maxParticipantsAllowed = 1000;

    // eject or leave single user
    connection.disconnectWith = mPeer.disconnectWith;

    // check if room exist on server
    // we will pass roomid to the server and wait for callback (i.e. server's response)
    connection.checkPresence = function(roomid, callback) {
        roomid = roomid || connection.sessionid;

        if (SocketConnection.name === 'SSEConnection') {
            SSEConnection.checkPresence(roomid, function(isRoomExist, _roomid, extra) {
                if (!connection.socket) {
                    if (!isRoomExist) {
                        connection.userid = _roomid;
                    }

                    connection.connectSocket(function() {
                        callback(isRoomExist, _roomid, extra);
                    });
                    return;
                }
                callback(isRoomExist, _roomid);
            });
            return;
        }

        if (!connection.socket) {
            connection.connectSocket(function() {
                connection.checkPresence(roomid, callback);
            });
            return;
        }

        connection.socket.emit('check-presence', roomid + '', function(isRoomExist, _roomid, extra) {
            if (connection.enableLogs) {
                console.log('checkPresence.isRoomExist: ', isRoomExist, ' roomid: ', _roomid);
            }
            callback(isRoomExist, _roomid, extra);
        });
    };

    connection.onReadyForOffer = function(remoteUserId, userPreferences) {
        connection.multiPeersHandler.createNewPeer(remoteUserId, userPreferences);
    };

    connection.setUserPreferences = function(userPreferences) {
        if (connection.dontAttachStream) {
            userPreferences.dontAttachLocalStream = true;
        }

        if (connection.dontGetRemoteStream) {
            userPreferences.dontGetRemoteStream = true;
        }

        return userPreferences;
    };

    connection.updateExtraData = function() {
        connection.socket.emit('extra-data-updated', connection.extra);
    };

    connection.enableScalableBroadcast = false;
    connection.maxRelayLimitPerUser = 3; // each broadcast should serve only 3 users

    connection.dontCaptureUserMedia = false;
    connection.dontAttachStream = false;
    connection.dontGetRemoteStream = false;

    connection.onReConnecting = function(event) {
        if (connection.enableLogs) {
            console.info('ReConnecting with', event.userid, '...');
        }
    };

    connection.beforeAddingStream = function(stream) {
        return stream;
    };

    connection.beforeRemovingStream = function(stream) {
        return stream;
    };

    if (typeof isChromeExtensionAvailable !== 'undefined') {
        connection.checkIfChromeExtensionAvailable = isChromeExtensionAvailable;
    }

    if (typeof isFirefoxExtensionAvailable !== 'undefined') {
        connection.checkIfChromeExtensionAvailable = isFirefoxExtensionAvailable;
    }

    if (typeof getChromeExtensionStatus !== 'undefined') {
        connection.getChromeExtensionStatus = getChromeExtensionStatus;
    }

    connection.modifyScreenConstraints = function(screen_constraints) {
        return screen_constraints;
    };

    connection.onPeerStateChanged = function(state) {
        if (connection.enableLogs) {
            if (state.iceConnectionState.search(/closed|failed/gi) !== -1) {
                console.error('Peer connection is closed between you & ', state.userid, state.extra, 'state:', state.iceConnectionState);
            }
        }
    };

    connection.isOnline = true;

    listenEventHandler('online', function() {
        connection.isOnline = true;
    });

    listenEventHandler('offline', function() {
        connection.isOnline = false;
    });

    connection.isLowBandwidth = false;
    if (navigator && navigator.connection && navigator.connection.type) {
        connection.isLowBandwidth = navigator.connection.type.toString().toLowerCase().search(/wifi|cell/g) !== -1;
        if (connection.isLowBandwidth) {
            connection.bandwidth = {
                audio: false,
                video: false,
                screen: false
            };

            if (connection.mediaConstraints.audio && connection.mediaConstraints.audio.optional && connection.mediaConstraints.audio.optional.length) {
                var newArray = [];
                connection.mediaConstraints.audio.optional.forEach(function(opt) {
                    if (typeof opt.bandwidth === 'undefined') {
                        newArray.push(opt);
                    }
                });
                connection.mediaConstraints.audio.optional = newArray;
            }

            if (connection.mediaConstraints.video && connection.mediaConstraints.video.optional && connection.mediaConstraints.video.optional.length) {
                var newArray = [];
                connection.mediaConstraints.video.optional.forEach(function(opt) {
                    if (typeof opt.bandwidth === 'undefined') {
                        newArray.push(opt);
                    }
                });
                connection.mediaConstraints.video.optional = newArray;
            }
        }
    }

    connection.getExtraData = function(remoteUserId, callback) {
        if (!remoteUserId) throw 'remoteUserId is required.';

        if (typeof callback === 'function') {
            connection.socket.emit('get-remote-user-extra-data', remoteUserId, function(extra, remoteUserId, error) {
                callback(extra, remoteUserId, error);
            });
            return;
        }

        if (!connection.peers[remoteUserId]) {
            if (connection.peersBackup[remoteUserId]) {
                return connection.peersBackup[remoteUserId].extra;
            }
            return {};
        }

        return connection.peers[remoteUserId].extra;
    };

    if (!!forceOptions.autoOpenOrJoin) {
        connection.openOrJoin(connection.sessionid);
    }

    connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
        // via #683
        connection.close();
        connection.closeSocket();

        connection.isInitiator = false;
        connection.userid = connection.token();

        connection.join(connection.sessionid);

        if (connection.enableLogs) {
            console.warn('Userid already taken.', useridAlreadyTaken, 'Your new userid:', connection.userid);
        }
    };

    connection.trickleIce = true;
    connection.version = '@@version';

    connection.onSettingLocalDescription = function(event) {
        if (connection.enableLogs) {
            console.info('Set local description for remote user', event.userid);
        }
    };

    connection.resetScreen = function() {
        sourceId = null;
        if (DetectRTC && DetectRTC.screen) {
            delete DetectRTC.screen.sourceId;
        }

        currentUserMediaRequest = {
            streams: [],
            mutex: false,
            queueRequests: []
        };
    };

    // if disabled, "event.mediaElement" for "onstream" will be NULL
    connection.autoCreateMediaElement = true;

    // set password
    connection.password = null;

    // set password
    connection.setPassword = function(password, callback) {
        callback = callback || function() {};
        if (connection.socket) {
            connection.socket.emit('set-password', password, callback);
        } else {
            connection.password = password;
            callback(true, connection.sessionid, null);
        }
    };

    connection.onSocketDisconnect = function(event) {
        if (connection.enableLogs) {
            console.warn('socket.io connection is closed');
        }
    };

    connection.onSocketError = function(event) {
        if (connection.enableLogs) {
            console.warn('socket.io connection is failed');
        }
    };

    // error messages
    connection.errors = {
        ROOM_NOT_AVAILABLE: 'Room not available',
        INVALID_PASSWORD: 'Invalid password',
        USERID_NOT_AVAILABLE: 'User ID does not exist',
        ROOM_PERMISSION_DENIED: 'Room permission denied',
        ROOM_FULL: 'Room full',
        DID_NOT_JOIN_ANY_ROOM: 'Did not join any room yet',
        INVALID_SOCKET: 'Invalid socket',
        PUBLIC_IDENTIFIER_MISSING: 'publicRoomIdentifier is required',
        INVALID_ADMIN_CREDENTIAL: 'Invalid username or password attempted'
    };
})(this);

};

if (typeof module !== 'undefined' /* && !!module.exports*/ ) {
    module.exports = exports = RTCMultiConnection;
}

if (typeof define === 'function' && define.amd) {
    define('RTCMultiConnection', [], function() {
        return RTCMultiConnection;
    });
}

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*********************************************************
 webdev Logger
 *******************************************************/
var webrtcdevlogs = [];

/**
 * is this json
 * @method
 * @name isJSON
 * @return {str}text
 */
function isJSON(text) {
    if (typeof text !== "string") {
        return false;
    }
    try {
        var json = JSON.parse(text);
        return (typeof json === 'object');
    } catch (error) {
        return false;
    }
}

/**
 * convert to str
 * @method
 * @name toStr
 * @return {json}obj
 */
function toStr(obj) {
    try {
        return JSON.stringify(obj, function (key, value) {
            if (value && value.sdp) {
                log(value.sdp.type, '\t', value.sdp.sdp);
                return '';
            } else return value;
        }, '\t');
    } catch (e) {
        return obj; // in case the obj is non valid json or just a string
    }
}

/**
 * ger args json
 * @method
 * @name getArgsJson
 * @return {array}arg
 */
function getArgsJson(arg) {
    var str = "";
    for (i in arg) {
        if (arg[i]) {
            str += toStr(arg[i]);
        }
    }
    return str;
}


var webrtcdevlogger = {
    // if(debug){
    // log: console.log,
    // info: console.info,
    // debug: console.debug,
    // warn: console.warn,
    // error: console.error
    // }else{

    log: function () {

        var arg = "";
        if (isJSON(arguments)) {
            arg = JSON.stringify(arguments, undefined, 2);
            webrtcdevlogs.push("<pre style='color:grey'>[LOG]" + arg + "</pre>")
        } else {
            arg = getArgsJson(arguments);
            webrtcdevlogs.push("<p style='color:grey'>[LOG]" + arg + "</p>");
        }
        // console.log(arguments);
    },

    info: function () {
        var arg = "";
        if (isJSON(arguments)) {
            arg = JSON.stringify(arguments, undefined, 2);
            webrtcdevlogs.push("<pre style='color:blue'>[INFO]" + arg + "</pre>");
        } else {
            arg = getArgsJson(arguments);
            webrtcdevlogs.push("<p style='color:blue'>[INFO]" + arg + "</p>");
        }
        console.info(arguments);
    },

    debug: function () {
        var arg = "";
        if (isJSON(arguments)) {
            arg = JSON.stringify(arguments, undefined, 2);
            webrtcdevlogs.push("<pre style='color:green'>[DEBUG]" + arg + "</pre>");
        } else {
            arg = getArgsJson(arguments);
            webrtcdevlogs.push("<p style='color:green'>[DEBUG]" + arg + "</p>");
        }
        console.debug(arguments);
    },

    warn: function () {
        var arg = "";
        if (isJSON(arguments)) {
            arg = JSON.stringify(arguments, undefined, 2);
            webrtcdevlogs.push("<pre style='color:orange'>[WARN]" + arg + "</pre>");
        } else {
            arg = getArgsJson(arguments);
            webrtcdevlogs.push("<p style='color:orange'>[WARN]" + arg + "</p>");
        }
        console.warn(arguments);
    },

    error: function () {
        var arg = "";
        if (isJSON(arguments)) {
            arg = JSON.stringify(arguments, undefined, 2);
            webrtcdevlogs.push("<pre style='color:red'>[ERROR]" + arg + "</pre>");
        } else {
            arg = getArgsJson(arguments);
            webrtcdevlogs.push("<p style='color:red'>[ERROR]" + arg + "</p>");
        }
        console.error(arguments);
    }

    // }

};
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */var webrtcdevcon = function () {


/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */
/*********** global Params ****************/
var t = "";
var e = null;
var n = "";
var rtcConn = null;
var scrConn = null;
var selfuserid = null, remoteUserId = null;
var containerDiv;
var webcallpeers = [];
var sessions = {};
var repeatFlagShowButton = null, repeatFlagHideButton = null, repeatFlagRemoveButton = null,
    repeatFlagStopuploadButton = null;

/* DOM objects for single user video , user in conf and all other users*/
var localVideo = null, selfVideo = null, remoteVideos = [];

var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
/*var usersList     = document.getElementById("userslist");
var numbersOfUsers  = document.getElementById("numbersofusers");
var usersContainer  = document.getElementById("usersContainer");*/
var tempuserid;
var sessions = {};

var selfusername = "", selfemail = "", selfcolor = "";
var remoteusername = "", remoteemail = "", remotecolor = "";

var latitude = "", longitude = "", operatingsystem = "";

/* webrtc session intilization */
var autoload = true;
var sessionid = null, socketAddr = "/", webrtcdevIceServers = [];
var localStream, localStreamId, remoteStream, remoteStreamId;

/* incoming and outgoing call params */
var incomingAudio = true, incomingVideo = true, incomingData = true;
var outgoingAudio = true, outgoingVideo = true, outgoingData = true;

var debug = false;

var timerobj = false;
var peerTimerStarted = false;

var chatobj = false, chatContainer = null;

var fileshareobj = false;
var pendingFileTransferlimit = 3;

var screenrecordobj = false;

var snapshotobj = false;

var videoRecordobj = false, videoRecordContainer = null;

var drawCanvasobj = false;

var texteditorobj = false;

var codeeditorobj = false, editor = null;

var reconnectobj = false;

var cursorobj = false;

var muteobj = false;

var minmaxobj = false;

var listeninobj = false;

var screenshareobj = false;

var helpobj = false;

var statisticsobj = false;

var screen, isScreenOn = 0, chromeMediaSourceId = null, extensioninstalled;
var screen_roomid, screen_userid;

var role = "participant";

var webrtcdev = webrtcdevlogger;

this.sessionid = "";

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                    Global Init JS                                                 */
/*-----------------------------------------------------------------------------------*/

/**
 * creates sessionid
 * @method
 * @name makesessionid
 * @param {string} autoload
 * @return {string}sessionid
 */
this.makesessionid = function (autoload, callback) {
    if (autoload && !location.hash.replace('#', '').length) {
        // When Session should autogenerate ssid and locationbar doesnt have a session name
        location.href = location.href.split('#')[0] + '#' + (Math.random() * 100).toString().replace('.', '');
        location.reload();
    } else if (autoload && location.href.replace('#', '').length) {
        // When Session should autogenerate ssid and locationbar doesnt have a session name
        if (location.href.indexOf('?') > -1) {
            sessionid = (location.hash.substring(0, location.hash.indexOf('?'))).replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('');
        } else {
            sessionid = location.hash.replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, '').split('\n').join('').split('\r').join('');
        }
        callback(sessionid);
    } else {
        sessionid = prompt("Enter session ", "");
        callback(sessionid);
    }
};

/**************************************************************************************
 peerconnection
 ****************************************************************************/

var channelpresence = false;
var localVideoStreaming = null;
var turn = "none";
var localobj = {}, remoteobj = {};
var pendingFileTransfer = [];
var connectionStatus = null;

this.connectionStatus = connectionStatus;

function isData(session) {
    return !session.audio && !session.video && !session.screen && session.data;
}

function isNull(obj) {
    return typeof obj == 'undefined';
}

function isString(obj) {
    return typeof obj == 'string';
}

function isEmpty(session) {
    var length = 0;
    for (var s in session) {
        length++;
    }
    return length == 0;
}

// this method converts array-buffer into string
function ab2str(buf) {
    var result = '';
    try {
        result = String.fromCharCode.apply(null, new Uint16Array(buf));
    } catch (e) {
    }
    return result;
}

// this method converts string into array-buffer
function str2ab(str) {
    if (!isString(str)) str = JSON.stringify(str);

    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}


function getLength(obj) {
    var length = 0;
    for (var o in obj)
        if (o) length++;
    return length;
}


function getRandomColor() {
    for (var e = "0123456789ABCDEF".split(""), t = "#", n = 0; 6 > n; n++) t += e[Math.round(15 * Math.random())];
    return t
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}


function getUserinfo(e, t) {
    return e ? '<video src="' + e + '" autoplay></vide>' : '<img src="' + t + '">';
}

function fireClickEvent(e) {
    var t = new MouseEvent("click", {
        view: window,
        bubbles: !0,
        cancelable: !0
    });
    e.dispatchEvent(t)
}

function bytesToSize(e) {
    var t = ["Bytes", "KB", "MB", "GB", "TB"];
    if (0 == e) return "0 Bytes";
    var n = parseInt(Math.floor(Math.log(e) / Math.log(1024)));
    return Math.round(e / Math.pow(1024, n), 2) + " " + t[n]
}


/************************************************
 scripts or stylesheets load unloading
 ********************************************/
function loadjscssfile(filename, filetype) {
    if (filetype == "js") { //if filename is a external JavaScript file
        var fileref = document.createElement('script');
        fileref.setAttribute("type", "text/javascript");
        fileref.setAttribute("src", filename)
    } else if (filetype == "css") { //if filename is an external CSS file
        var fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref != "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

function loadScript(src, onload) {
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.documentElement.appendChild(script);
}


/*-----------------------------------------------------------------------------------*/


/**
 * Assigns session varables, ICE gateways and widgets
 * @constructor
 * @param {json} _localObj - local object.
 * @param {json} _remoteObj - remote object.
 * @param {json} incoming - incoming media stream attributes
 * @param {json} outgoing - outgoing media stream attributes
 * @param {json} session - session object.
 * @param {json} widgets - widgets object.
 */
this.setsession = function (_localobj, _remoteobj, incoming, outgoing, session, widgets) {
    //try{
    this.sessionid = sessionid = session.sessionid;
    socketAddr = session.socketAddr;
    localobj = _localobj;
    remoteobj = _remoteobj;
    webrtcdev.log("[startjs] WebRTCdev Session - ", session);
    // }catch(e){
    //     webrtcdev.error(e);
    //     alert(" Session object doesnt have all parameters ");
    // }

    turn = (session.hasOwnProperty('turn') ? session.turn : null);
    webrtcdev.log("[ startjs] WebRTCdev TURN - ", turn);
    if (turn && turn != "none") {
        if (turn.active && turn.iceServers) {
            webrtcdev.log("WebRTCdev - Getting preset static ICE servers ", turn.iceServers);
            webrtcdevIceServers = turn.iceServers;
        } else {
            webrtcdev.info("WebRTCdev - Calling API to fetch dynamic ICE servers ");
            getICEServer();
            // getICEServer( turn.username ,turn.secretkey , turn.domain,
            //                 turn.application , turn.room , turn.secure);                
        }
    } else {
        webrtcdev.log("WebRTCdev - TURN not applied ");
    }

    if (widgets) {

        webrtcdev.log(" WebRTCdev - widgets  ", widgets);

        if (widgets.debug) debug = widgets.debug || false;

        if (widgets.chat) chatobj = widgets.chat || null;

        if (widgets.fileShare) fileshareobj = widgets.fileShare || null;

        if (widgets.screenrecord) screenrecordobj = widgets.screenrecord || null;

        if (widgets.screenshare) screenshareobj = widgets.screenshare || null;

        if (widgets.snapshot) snapshotobj = widgets.snapshot || null;

        if (widgets.videoRecord) videoRecordobj = widgets.videoRecord || null;

        if (widgets.reconnect) reconnectobj = widgets.reconnect || null;

        if (widgets.drawCanvas) drawCanvasobj = widgets.drawCanvas || null;

        if (widgets.texteditor) texteditorobj = widgets.texteditor || null;

        if (widgets.codeeditor) codeeditorobj = widgets.codeeditor || null;

        if (widgets.mute) muteobj = widgets.mute || null;

        if (widgets.timer) timerobj = widgets.timer || null;

        if (widgets.listenin) listeninobj = widgets.listenin || null;

        if (widgets.cursor) cursorobj = widgets.cursor || null;

        if (widgets.minmax) minmaxobj = widgets.minmax || null;

        if (widgets.help) helpobj = widgets.help || null;

        if (widgets.statistics) statisticsobj = widgets.statistics || null;
    }

    return {
        sessionid: sessionid,
        socketAddr: socketAddr,
        turn: turn,
        widgets: widgets,
        startwebrtcdev: funcStartWebrtcdev,
        rtcConn: rtcConn
    };
};

/**
 * function to return chain of promises for webrtc session to start
 * @method
 * @name funcStartWebrtcdev
 */
function funcStartWebrtcdev() {
    console.log(" [initjs] funcStartWebrtcdev - webrtcdev", webrtcdev);

    return new Promise(function (resolve, reject) {
        webrtcdev.log(" [ startJS webrtcdom ] : begin  checkDevices for outgoing and incoming");
        listDevices();

        webrtcdev.log(" [ startJS webrtcdom ] : incoming ", incoming);
        webrtcdev.log(" [ startJS webrtcdom ] : outgoing ", outgoing);
        if (incoming) {
            incomingAudio = incoming.audio;
            incomingVideo = incoming.video;
            incomingData = incoming.data;
        }
        if (outgoing) {
            outgoingAudio = outgoing.audio;
            outgoingVideo = outgoing.video;
            outgoingData = outgoing.data;
        }

        if (role != "inspector") {

            detectWebcam(function (hasWebcam) {
                console.log('Has Webcam: ' + (hasWebcam ? 'yes' : 'no'));
                if (!hasWebcam) {
                    alert(" you dont have access to webcam ");
                    outgoingVideo = false;
                }
                detectMic(function (hasMic) {
                    console.log('Has Mic: ' + (hasMic ? 'yes' : 'no'));
                    if (!hasMic) {
                        alert(" you dont have access to Mic ");
                        outgoingAudio = false;
                    }

                    // Try getting permission again and ask your to restart
                    if (outgoingAudio) getAudioPermission();
                    if (outgoingVideo) getVideoPermission();

                    setTimeout(function () {
                        webrtcdev.log(" outgoingAudio ", outgoingAudio, " outgoingVideo ", outgoingVideo);
                        resolve("done");
                    }, 2000);
                });
            });
        } else {
            resolve("done");
        }

    }).then((res) => {

        webrtcdev.log(" [ startJS webrtcdom ] : sessionid : " + sessionid + " and localStorage  ", localStorage);

        return new Promise(function (resolve, reject) {
            if (localStorage.length >= 1 && localStorage.getItem("channel") != sessionid) {
                webrtcdev.log("[startjs] Current Session ID " + sessionid + " doesnt match cached channel id " + localStorage.getItem("channel") + "-> clearCaches()");
                clearCaches();
            } else {
                webrtcdev.log(" no action taken on localStorage");
            }
            resolve("done");
        });

    }).then((res) => {

        webrtcdev.log(" [ startJS webrtcdom ] : localobj ", localobj);
        webrtcdev.log(" [ startJS webrtcdom ] : remoteobj ", remoteobj);

        return new Promise(function (resolve, reject) {
            /* When user is single */
            localVideo = localobj.video;

            /* when user is in conference */
            var remotearr = remoteobj.videoarr;
            /* first video container in remotearr belongs to user */
            if (outgoingVideo) {
                selfVideo = remotearr[0];
            }
            /* create arr for remote peers videos */
            if (!remoteobj.dynamicVideos) {
                for (let x = 1; x < remotearr.length; x++) {
                    remoteVideos.push(remotearr[x]);
                }
            }
            resolve("done");
        });
    }).then((res) => {
        return new Promise(function (resolve, reject) {

            if (localobj.hasOwnProperty('userdetails')) {
                let obj = localobj.userdetails;
                webrtcdev.info("localobj userdetails ", obj);
                selfusername = obj.username || "LOCAL";
                selfcolor = obj.usercolor || "";
                selfemail = obj.useremail || "";
                role = obj.role || "participant";
            } else {
                webrtcdev.warn("localobj has no userdetails ");
            }
            resolve("done");
        });
    }).then(() => setRtcConn(sessionid)
    ).then((result) => setWidgets(rtcConn)
    ).then((result) => startSocketSession(rtcConn, socketAddr, sessionid)
    ).catch((err) => {
        webrtcdev.error(" Promise rejected ", err);
    });
}

this.issafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
/**********************************************************************************
 Session call and Updating Peer Info
 ************************************************************************************/
/**
 * starts a call
 * @method
 * @name startCall
 * @param {json} obj
 */
this.startCall = function (obj) {
    webrtcdev.log(" startCall obj", obj);
    webrtcdev.log(" TURN ", turn);
    //if(turn=='none'){
    obj.startwebrtcdev();
    // }else if(turn!=null){
    //     repeatInitilization = window.setInterval(obj.startwebrtcdev, 2000);     
    // }

};

/**
 * stops a call and removes loalstorage items
 * @method
 * @name stopCall
 */
this.stopCall = function () {
    webrtcdev.log(" stopCall ");
    rtcConn.closeEntireSession();

    if (!localStorage.getItem("channel"))
        localStorage.removeItem("channel");

    if (!localStorage.getItem("userid"))
        localStorage.removeItem("userid");

    if (!localStorage.getItem("remoteUsers"))
        localStorage.removeItem("remoteUsers");

    this.connectionStatus = "closed";


};


/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */function getElement(e) {
    return document.querySelector(e)
}

function getElementById(elem) {
    try {
        return document.getElementById(elem);
    } catch (e) {
        webrtcdev.error(e);
        return "";
    }
}

function getElementByName(elem) {
    try {
        if (document.getElementsByName(elem))
            return document.getElementsByName(elem)[0];
    } catch (e) {
        webrtcdev.error(e);
        return "";
    }
}

function isHTML(str) {
    var a = document.createElement('div');
    a.innerHTML = str;

    for (var c = a.childNodes, i = c.length; i--;) {
        if (c[i].nodeType == 1) return true;
    }

    return false;
}


/* ********************************************************
UI / DOM related functions
****************************************************** */

Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

// function showElement(elem){
//     if(elem.vide) elem.video.hidden = false;
//     elem.removeAttribute("hidden");
//     elem.setAttribute("style","display:block!important");
// }

/**
 * function to show an elemnt by id or dom
 * @method
 * @name showelem
 * @param {dom} elem
 */
function showelem(elem) {
    if (!elem) {
        webrtcdev.error("show elem undefined");
        return;
    }
    try {

        webrtcdev.log(" [init] show elem", elem, " , type ", typeof elem, " , nodetype ", elem.nodeType);
        if (typeof elem === 'object' && elem.nodeType !== undefined) {
            // validate its is a dom node
            elem.removeAttribute("hidden");
            elem.setAttribute("style", "display:block!important");
        } else if (getElementById(elem)) {
            // search by ID
            elem = getElementById(elem);
            elem.removeAttribute("hidden");
            elem.setAttribute("style", "display:block");
        } else if (getElementByName(elem)) {
            // search by name
            elem = getElementByName(elem);
            elem[0].removeAttribute("hidden");
            elem[0].setAttribute("style", "display:block");
        } else {
            // not found
            webrtcdev.warn("elem not found ", elem);
        }
    } catch (err) {
        webrtcdev.error("showeleem", err);
    }
}

/**
 * function to hide an Element by id of dom
 * @method
 * @name hideelem
 * @param {dom} elem
 */
function hideelem(elem) {
    try {
        if (typeof elem === 'object' && elem.nodeType !== undefined) {
            elem.setAttribute("hidden", true);
            elem.setAttribute("style", "display:none!important");
        } else if (getElementById(elem)) {
            getElementById(elem).setAttribute("hidden", true);
            getElementById(elem).setAttribute("style", "display:none");
        }
    } catch (err) {
        webrtcdev.error(elem, err)
    }
}


function existselem(elem) {
    return getElementById(elem) ? true : false;
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * Update local cache of user sesssion based object called peerinfo
 * @method
 * @name updateWebCallView
 * @param {json} peerInfo
 */
function updateWebCallView(peerinfo) {
    let myrole = role;
    webrtcdev.log("[webcallviewmanager] - updateWebCallView start with ",
        " peerinfo", peerinfo,
        " | myrole :", myrole,
        " | video indexOf : ", peerinfo.vid.indexOf("videoundefined"));

    switch (myrole) {

        case "inspector":
            var emptyvideoindex = 0;
            for (var v = 0; v < remoteVideos.length; v++) {
                webrtcdev.log(" [webcallviewmanager] Remote Video index array ", v, " || ", remoteVideos[v],
                    document.getElementsByName(remoteVideos[v]),
                    document.getElementsByName(remoteVideos[v]).src);
                if (remoteVideos[v].src) {
                    emptyvideoindex++;
                }
            }

            let video = document.createElement('video');
            remoteVideos[emptyvideoindex] = video;
            document.getElementById(remoteobj.videoContainer).appendChild(video);

            let remvid = remoteVideos[emptyvideoindex];
            webrtcdev.log(" [webcallviewmanager] updateWebCallView role-inspector , attaching stream", remvid, peerinfo.stream);
            attachMediaStream(remvid, peerinfo.stream);
            if (remvid.hidden) removid.hidden = false;
            remvid.id = peerinfo.videoContainer;
            remvid.className = remoteobj.videoClass;
            //attachControlButtons(remvid, peerInfo);

            if (remoteobj.userDisplay && peerinfo.name) {
                attachUserDetails(remvid, peerinfo);
            }
            if (remoteobj.userMetaDisplay && peerinfo.userid) {
                attachMetaUserDetails(remvid, peerinfo);
            }
            // Hide the unsed video for Local
            var _templ = document.getElementsByName(localVideo)[0];
            if (_templ) _templ.hidden = true;

            for (v in remoteobj.videoarr) {
                var _templ2 = document.getElementsByName(remoteobj.videoarr[v])[0];
                if (_templ2) _templ2.setAttribute("style", "display:none");
            }

            for (let t in document.getElementsByClassName("timeBox")) {
                document.getElementsByClassName("timeBox")[t].hidden = true;
            }
            break;

        case "participant":
        case "host":
        case "guest":
            if (peerinfo.vid.indexOf("videolocal") > -1) {

                // when video is local
                webrtcdev.info(" [start.js - updateWebCallView] role-participant , peerinfo Vid is Local");

                if (localVideo && document.getElementsByName(localVideo)[0]) {
                    let vid = document.getElementsByName(localVideo)[0];
                    vid.muted = true;
                    vid.className = localobj.videoClass;
                    attachMediaStream(vid, peerinfo.stream);

                    // if(localobj.userDisplay && peerInfo.name)
                    //     attachUserDetails( vid, peerInfo );

                    if (localobj.userDisplay && peerinfo.name)
                        attachUserDetails(vid, peerinfo);

                    if (localobj.userMetaDisplay && peerinfo.userid)
                        attachMetaUserDetails(vid, peerinfo);

                    webrtcdev.info(" User is alone in the session  , hiding remote video container",
                        "showing users single video container and attaching attachMediaStream and attachUserDetails ");

                } else {
                    //alert(" Please Add a video container in config for single");
                    webrtcdev.error(" No local video container in localobj -> ", localobj);
                }

            } else if (peerinfo.vid.indexOf("videoremote") > -1) {

                //when video is remote
                webrtcdev.info(" [start.js - updateWebCallView] role-participant , peerinfo Vid is Remote");

                // handling local video transition to active
                if (outgoingVideo && localVideo && selfVideo) {
                    /*chk if local video is added to conf , else adding local video to index 0 */
                    //localvid : video container before p2p session
                    var localvid = document.getElementsByName(localVideo)[0];
                    // selfvid : local video in a p2p session
                    var selfvid = document.getElementsByName(selfVideo)[0];

                    if (selfvid.played.length == 0) {
                        if (localvid.played.lebth > 0) {
                            reattachMediaStream(selfvid, localvid);
                        } else {
                            attachMediaStream(selfvid, webcallpeers[0].stream);
                        }

                        if (localobj.userDisplay && webcallpeers[0].name) {
                            attachUserDetails(selfvid, webcallpeers[0]);
                        }

                        if (localobj.userMetaDisplay && webcallpeers[0].userid) {
                            attachMetaUserDetails(selfvid, webcallpeers[0]);
                        }

                        selfvid.id = webcallpeers[0].videoContainer;
                        selfvid.className = remoteobj.videoClass;
                        selfvid.muted = true;
                        attachControlButtons(selfvid, webcallpeers[0]);

                    } else {
                        webrtcdev.log(" not updating self video as it is already playing ");
                    }

                    webrtcdev.info(" User is joined by a remote peer , hiding local video container",
                        "showing users conf video container and attaching attachMediaStream and attachUserDetails ");

                } else if (!outgoingVideo) {
                    webrtcdev.error(" Outgoing Local video is ", outgoingVideo);
                } else {
                    //alert(" Please Add a video container in config for video call ");
                    webrtcdev.error(" Local video container not defined ");
                }

                // handling remote video addition
                if (remoteVideos) {

                    let emptyvideoindex = findEmptyRemoteVideoIndex(peerinfo, remoteVideos);

                    updateRemoteVideos(peerinfo, remoteVideos, emptyvideoindex);

                    attachMediaStream(remoteVideos[emptyvideoindex], peerinfo.stream);
                    //if(remoteVideos[vi].video.hidden) remoteVideos[vi].video.hidden = false;
                    showelem(remoteVideos[emptyvideoindex].video);

                    if (remoteobj.userDisplay && peerinfo.name) {
                        attachUserDetails(remoteVideos[emptyvideoindex].video, peerinfo);
                    }

                    if (remoteobj.userMetaDisplay && peerinfo.userid) {
                        attachMetaUserDetails(remoteVideos[emptyvideoindex].video, peerInfo);
                    }

                    remoteVideos[emptyvideoindex].video.id = peerinfo.videoContainer;
                    remoteVideos[emptyvideoindex].video.className = remoteobj.videoClass;
                    attachControlButtons(remoteVideos[emptyvideoindex].video, peerinfo);

                } else {
                    alert("remote Video containers not defined");
                }

            } else {
                webrtcdev.error("[webcallviewdevmanager]  PeerInfo vid didnt match either case ");
            }
            break;

        default:
            webrtcdev.log("[start.js - updateWebCallView] Switch default case");
    }

    webrtcdev.log(" [start.js - updateWebCallView] - finish");
}


/**
 * destroy users webcall view
 * @method
 * @name destroyWebCallView
 * @param {json} peerInfo
 * @param {function} callback
 */
function destroyWebCallView(peerInfo, callback) {
    webrtcdev.log(" [starjs] destroyWebCallView peerInfo", peerInfo);
    if (peerInfo.videoContainer && document.getElementById(peerInfo.videoContainer))
        document.getElementById(peerInfo.videoContainer).src = "";

    /*if(fileshareobj.active){
        if(fileshareobj.props.fileShare){
            if(fileshareobj.props.fileShare=="divided")
                webrtcdev.log("dont remove it now ");
                //createFileSharingDiv(peerInfo);
            else if(fileshareobj.props.fileShare=="single")
                webrtcdev.log("No Seprate div created for this peer  s fileshare container is single");
            else
                webrtcdev.log("props undefined ");
        }
    }*/
    callback(true);
}


/**
 * update Remote Video array of json objects
 * @method
 * @name updateRemoteVideos
 * @param {json} peerinfo
 * @param {json} remoteVideos
 * @param {int} emptyvideoindex
 */
function updateRemoteVideos(peerinfo, remoteVideos, emptyvideoindex) {
    webrtcdev.log("[webcallviewmanager updateRemoteVideos ] emptyvideoindex - ", emptyvideoindex);

    if (!emptyvideoindex) return;

    try {

        if (remoteobj.maxAllowed == "unlimited") {
            // unlimitted video can be added dynamically
            webrtcdev.log("[webcallviewmanager updateRemoteVideos ] remote video is unlimited , creating video for remoteVideos array ");
            let video = document.createElement('video');
            //  added  new video element to remoteVideos at current index
            remoteVideos[emptyvideoindex] = {
                "userid": peerinfo.userid,
                "stream": peerinfo.stream,
                "video": video
            };
            document.getElementById(remoteobj.dynamicVideos.videoContainer).appendChild(video);

        } else {

            webrtcdev.log("[webcallviewmanager updateRemoteVideos ] Remote video is limited to size maxAllowed , current index ", emptyvideoindex);
            //remote video is limited to size maxAllowed
            let remVideoHolder = document.getElementsByName(remoteVideos[emptyvideoindex]);
            webrtcdev.log("[webcallviewmanager updateRemoteVideos ] searching for video with index ", emptyvideoindex, " in remote video : ", remVideoHolder);
            if (remVideoHolder.length >= 0) {
                if (remVideoHolder[0]) {
                    // since remvideo holder exist at current index , add video element to remoteVideos
                    remoteVideos[emptyvideoindex] = {
                        "userid": peerinfo.userid,
                        "stream": peerinfo.stream,
                        "video": remVideoHolder[0]
                    };
                    webrtcdev.log("[webcallviewmanager updateRemoteVideos ] RemoteVideos[" + emptyvideoindex + "] updated ", remoteVideos[emptyvideoindex], peerinfo.stream);
                }

            } else if (remoteVideos[emptyvideoindex].userid == peerinfo.userid && remoteVideos[emptyvideoindex].stream == "") {
                // pre-existing video with stream ="" , update stream
                webrtcdev.warn("[webcallviewmanager updateRemoteVideos] since remvideo holder doesnt exist with '' stream just overwrite the stream ");
                remoteVideos[emptyvideoindex].stream = peerinfo.stream;

            } else {
                webrtcdev.warn("[webcallviewmanager updateRemoteVideos] since remvideo holder doesnt exist just overwrite the last remote with the video ");
                // since remvideo holder doesnt exist just overwrite the last remote with the video
                remoteVideos[remoteVideos.length - 1] = {
                    "userid": peerinfo.userid,
                    "stream": peerinfo.stream,
                    "video": remVideoHolder[0]
                };
                webrtcdev.log("[webcallviewmanager updateRemoteVideos ] RemoteVideos[" + remoteVideos.length - 1 + "] updated ", remoteVideos[emptyvideoindex]);
            }
        }
    } catch (err) {
        webrtcdev.error(err);
    }
    webrtcdev.log("[webcallviewmanager updateRemoteVideos ] remoteVideos before updating ", remoteVideos[emptyvideoindex])

}


/**
 * find empty remote video index
 * @method
 * @name findEmptyRemoteVideoIndex
 * @param {json} remoteobj
 * @param {json} remoteVideos
 * @return {int} emptyvideoindex
 */
function findEmptyRemoteVideoIndex(peerinfo, remoteVideos) {
    /* get the next empty index of video and pointer in remote video array */
    let emptyvideoindex = 0;
    for (v in remoteVideos) {
        webrtcdev.log("[webcallviewdevmanager] Remote Video index array ", v, " || ", remoteVideos[v]);

        /* find of the video container of peer is already present in remoteVideos */
        if (remoteVideos[v].userid == peerinfo.userid && remoteVideos[v].stream == "" && !!remoteVideos[v].video) {
            webrtcdev.log("[webcallviewdevmanager] Remote Video dom exist already for the userid, checking for srcobject ");
            if (!remoteVideos[v].video.srcObject) {
                webrtcdev.log("[webcallviewdevmanager] Remote Video dom exist already but without stream", remoteVideos[v].video);
                emptyvideoindex = v;
                break;
            }
        }

        let vids = document.getElementsByName(remoteVideos[v]);

        /* video container of peer is not present in remoteVideos yet */
        if (!remoteVideos[v].video) {
            webrtcdev.log("[webcallviewdevmanager] ] Remote Video is not appended by json ", vids);
            if (vids.length <= 0) {
                webrtcdev.log("[webcallviewdevmanager] Remote video space is empty ");
                emptyvideoindex = v;
                break;
            } else {
                webrtcdev.log("[webcallviewdevmanager] Remote video space exists ", vids[0]);
                vids = vids[0];
            }
        } else {
            webrtcdev.log("[webcallviewdevmanager] ] Remote Video has json appended ", remoteVideos[v]);
            vids = remoteVideos[v].video;
        }

        console.log(" [webcallviewdevmanager] ] vids.src ", vids.src,
            " , vids.srcObject ", vids.srcObject,
            " , vids.readyState ", vids.readyState,
            " , vids.played.length ", vids.played.length);
        if (vids && vids.srcObject) {
            if (vids.srcObject.active) {
                webrtcdev.log("[webcallviewdevmanager] video is already appended and playing ", vids,
                    " vids.srcObject.active ", vids.srcObject.active, " move to next iteration");
                emptyvideoindex++;
            } else {
                webrtcdev.log("[webcallviewdevmanager] video is already appended , but not playing ", vids,
                    " vids.srcObject.active ", vids.srcObject.active, " use this index");
                emptyvideoindex = v;
                break;
            }
        } else if (vids && !vids.srcObject) {
            webrtcdev.log("[webcallviewdevmanager] video is not played ", vids, "use this index ");
            emptyvideoindex = v;
            break;
        } else {
            webrtcdev.warn("[webcallviewdevmanager] Not sure whats up with the video ", vids, " move to next iteration")
            emptyvideoindex++;
        }
    }

    webrtcdev.log("[webcallviewmanager - findEmptyRemoteVideoIndex] emptyvideoindex ", emptyvideoindex, remoteVideos[emptyvideoindex]);
    return emptyvideoindex;
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * Create File share button
 * @method
 * @name createFileShareButton
 * @param {json} fileshareobj
 */
function createFileShareButton(fileshareobj) {
    widgetholder = "topIconHolder_ul";

    const button = document.createElement("span");
    button.setAttribute("data-provides", "fileinput");
    button.className = fileshareobj.button.class;
    button.innerHTML = fileshareobj.button.html;
    button.onclick = function () {
        const fileSelector = new FileSelector();
        fileSelector.selectSingleFile(function (file) {
            sendFile(file);
        });
    };
    const li = document.createElement("li");
    li.appendChild(button);
    document.getElementById(widgetholder).appendChild(li);
}

/**
 * Assign File share button
 * @method
 * @name assignFileShareButton
 * @param {json} fileshareobj
 */
function assignFileShareButton(fileshareobj) {
    let button = document.getElementById(fileshareobj.button.id);
    button.onclick = function () {
        const fileSelector = new FileSelector();
        fileSelector.selectSingleFile(function (file) {
            sendFile(file);
        });
    };
}


/**
 * addstaticProgressHelper for queues files
 * @method
 * @name addstaticProgressHelper
 * @param {id} uuid
 * @param {json} peerinfo
 * @param {string} filename
 * @param {int} fileSize
 * @param {string} progressHelperclassName
 */
function addstaticProgressHelper(uuid, peerinfo, filename, fileSize, file, progressHelperclassName, filefrom, fileto) {
    try {
        if (!peerinfo) {
            webrtcdev.error(" [filehsraingJs] Progress helpler cannot be added for one peer as its absent");
            return;
        } else if (!peerinfo.fileList.container || !document.getElementById(peerinfo.fileList.container)) {
            webrtcdev.error(" [filehsraingJs] Progress helpler cannot be added , missing fileListcontainer ");
            return;
        }

        //if(!document.getElementById(filename)){
        webrtcdev.log(" [filehsraingJs] addstaticProgressHelper -  attributes : uuid -", uuid,
            "peerinfo - ", peerinfo,
            "filename - ", filename, "file size - ", fileSize,
            "progress helper class - ", progressHelperclassName);

        let progressid = uuid + "_" + filefrom + "_" + fileto;
        webrtcdev.log(" [startjs] addstaticProgressHelper - progressid ", progressid);

        let progressul = document.createElement("ul");
        //progressul.id = progressid,
        progressul.setAttribute("class", "row"),
            progressul.id = filename,
            progressul.title = filename + " size - " + file.size + " type - " + file.type + " last modified on -" + file.lastModifiedDate;

        if (debug) {
            const progressDebug = document.createElement("li");
            progressDebug.innerHTML = filename + " size - " + file.size + " type - " + file.type + " last modified on -" + file.lastModifiedDate
                + " from :" + filefrom + " --> to :" + fileto;
            progressul.appendChild(progressDebug);
        }

        let progressDiv = document.createElement("li");
        progressDiv.id = progressid,
            progressDiv.title = "paused " + filename + " size - " + file.size + " type - " + file.type + " last modified on -" + file.lastModifiedDate,
            progressDiv.setAttribute("class", progressHelperclassName),
            progressDiv.setAttribute("type", "progressbar"),
            progressDiv.innerHTML = "<label>Paused</label><progress></progress>",
            progressul.appendChild(progressDiv);
        //progressHelper[uuid].label = filename + " "+ fileSize;

        let stopuploadButton = document.createElement("li");
        stopuploadButton.id = "stopuploadButton" + filename;
        stopuploadButton.innerHTML = '<i class="fa fa-trash-o" style="color: #615aa8;padding: 10px; font-size: larger;"></i>';
        stopuploadButton.onclick = function (event) {
            webrtcdev.log("Remove evenet.target ", event.target);
            if (repeatFlagStopuploadButton != filename) {
                hideFile(progressid);
                //var tobeHiddenElement = event.target.parentNode.id;
                removeFile(progressid);
                repeatFlagStopuploadButton = filename;
            } else if (repeatFlagStopuploadButton == filename) {
                repeatFlagStopuploadButton = "";
            }
            //Once the button is clicked , remove the button
            event.target.remove();
            for (x in pendingFileTransfer) {
                if (pendingFileTransfer[x].name == filename) {
                    webrtcdev.log(" removing pendingFileTransfer element ", pendingFileTransfer[x]);
                    pendingFileTransfer.splice(x, 1);
                }
            }
        },
            progressul.appendChild(stopuploadButton);

        //document.getElementById(peerinfo.fileList.container).appendChild(progressul);
        parentDom = document.getElementById(peerinfo.fileList.container);
        parentDom.insertBefore(progressul, parentDom.firstChild);

        // }else{
        //     webrtcdev.log(" Not creating progress bar div as it already exists ");
        // }

    } catch (e) {
        webrtcdev.error(" [filehsraingJs] problem in addstaticProgressHelper  ", e);
    }
}


/**
 * Add progress bar for files sharing in progress
 * @method
 * @name addProgressHelper
 * @param {id} uuid
 * @param {json} peerinfo
 * @param {string} filename
 * @param {int} fileSize
 * @param {string} progressHelperclassName
 */
function addProgressHelper(uuid, peerinfo, filename, fileSize, file, progressHelperclassName, filefrom, fileto) {
    try {
        if (!peerinfo) {
            webrtcdev.error(" [filehsraingJs] Progress helpler cannot be added for one peer as its absent");
            return;
        } else if (!peerinfo.fileList.container || !document.getElementById(peerinfo.fileList.container)) {
            webrtcdev.error(" [filehsraingJs] Progress helpler cannot be added , missing fileListcontainer ");
            return;
        }

        //if(!document.getElementById(filename)){
        webrtcdev.log(" [filehsraingJs] progress helper attributes  attributes : uuid -", uuid,
            "peerinfo - ", peerinfo,
            "filename - ", filename, "file size - ", fileSize,
            "progress helper class - ", progressHelperclassName,
            "file to - ", fileto,
            "file from - ", filefrom);

        let progressid = uuid + "_" + filefrom + "_" + fileto;
        webrtcdev.log(" [startjs] addProgressHelper - progressid ", progressid);

        let progressul = document.createElement("ul");
        progressul.id = progressid,
            progressul.title = filename + " size - " + file.size + " type - " + file.type + " last modified on -" + file.lastModifiedDate,
            progressul.setAttribute("type", "progressbar"),
            progressul.setAttribute("class", "row");
        if (debug) {
            const progressDebug = document.createElement("li");
            progressDebug.innerHTML = filename + "size - " + file.size + " type - " + file.type + " last modified on -" + file.lastModifiedDate
                + " from :" + filefrom + " --> to :" + fileto + "</br>";
            progressul.appendChild(progressDebug);
        }

        let progressDiv = document.createElement("li");
        progressDiv.setAttribute("class", progressHelperclassName),
            //progressDiv.setAttribute("filefor", ),
            progressDiv.innerHTML = "<label>0%</label><progress></progress>",
            progressul.appendChild(progressDiv),
            progressHelper[progressid] = {
                div: progressDiv,
                progress: progressDiv.querySelector("progress"),
                label: progressDiv.querySelector("label")
            },
            progressHelper[progressid].progress.max = fileSize;
        //progressHelper[uuid].label = filename + " "+ fileSize;

        let stopuploadButton = document.createElement("li");
        stopuploadButton.id = "stopuploadButton" + progressid;
        stopuploadButton.innerHTML = '<i class="fa fa-trash-o"></i>';
        stopuploadButton.onclick = function (event) {
            webrtcdev.log(" [startjs] addProgressHelper - remove progressid ", progressid, " dom : ", document.getElementById(progressid));
            hideFile(progressid);
            stopSendFile(progressid, filename, file, fileto, filefrom);
            //Once the button is clicked , remove the button
            event.target.remove();
            removeFile(progressid);

            // If file has been hidden already then stop sending the message shareFileStopUpload
            if (repeatFlagStopuploadButton != filename) {
                //var tobeHiddenElement = event.target.parentNode.id;
                rtcConn.send({
                    type: "shareFileStopUpload",
                    _element: progressid,
                    _filename: filename
                });

                repeatFlagStopuploadButton = filename;
            } else if (repeatFlagStopuploadButton == filename) {
                repeatFlagStopuploadButton = "";
            }

        },
            progressul.appendChild(stopuploadButton);

        parentDom = document.getElementById(peerinfo.fileList.container);
        parentDom.insertBefore(progressul, parentDom.firstChild);

        // }else{
        //     webrtcdev.log(" Not creating progress bar div as it already exists ");
        // }

    } catch (e) {
        webrtcdev.error(" [filehsraingJs] problem in addProgressHelper  ", e);
    }
}

function updateLabel(e, r) {
    if (-1 != e.position) {
        const n = +e.position.toFixed(2).split(".")[1] || 100;
        r.innerHTML = n + "%"
    }
}

function simulateClick(buttonName) {
    document.getElementById(buttonName).click();
    webrtcdev.log("simulateClick on " + buttonName);
    return true;
}

/*
 * Display list and file list box button
 * @method
 * @name displayList
 * @param {id} file uuid
 * @param {json} peerinfo
 * @param {string} fileurl
 * @param {string} filename
 * @param {string} filetype
 */
function displayList(uuid, peerinfo, fileurl, filename, filetype) {

    //get parent DOM and remove progress bar
    let parentdom;
    const elementDisplay = peerinfo.fileShare.container;
    const elementList = peerinfo.fileList.container;
    let showdownbtn = true;
    let showdelbtn = true;

    try {
        if (!fileshareobj.active) return;

        webrtcdev.log("[filesharing js] displayList - uuid: ", uuid, " peerinfo :", peerinfo,
            "file url : ", fileurl, " file name : ", filename, " file type :", filetype);

        let _filename = null;
        if (filetype == "sessionRecording") {
            filename = filename.videoname + "_" + filename.audioname;
            _filename = filename;
        }
        let fileprogress = document.querySelectorAll('ul[id^="' + uuid + '"]');

        if (fileprogress.length > 0) {
            for (x in fileprogress) {
                webrtcdev.log("[filesharing js] displayList remove progress bar index - ", x, " file dom - ", fileprogress[x]);
                if ((typeof fileprogress[x]) == "object" &&
                    (fileprogress[x].type == "progressbar" || fileprogress[x].indexOf("progressbar") > -1)) {
                    // if the progress bar exist , remove the progress bar div and create the ul
                    // fileprogress[x].getAttribute("type")=="progressbar" /removed due to not a function error
                    if (peerinfo.fileList.container && document.getElementById(peerinfo.fileList.container)) {
                        parentdom = document.getElementById(peerinfo.fileList.container);
                        webrtcdev.log("[ filesharing js ] displayList, set up parent dom ", parentdom);
                        parentdom.removeChild(fileprogress[x]);
                    } else {
                        webrtcdev.log("[ filesharing js ] displayList, Not sure what does this do ", fileprogress[x]);
                        parentdom = fileprogress[x].parentNode.parentNode;
                        //parentdom.removeChild(fileprogress[x].parentNode);
                    }
                } else {
                    console.log("[filesharing js] displayList - cannot remove since , elem is not of type progressbar  ", fileprogress[x]);
                }
            }
        } else {
            // if the progress bar area does not exist
            parentdom = document.getElementById(elementList) || document.body;
            webrtcdev.warn("[ filesharing js ] displayList , progress bar area doesnt exist, set parent dom to ", elementList, document.getElementById(elementList), " or to document body")
        }

    } catch (e) {
        webrtcdev.error(" [filesharing js ] Display list exception ", e);
    }

    //append progress bar to parent dom
    webrtcdev.log(" [filesharing js] displayList set up parent dom  ", parentdom);

    let filedom = document.createElement("ul");
    filedom.id = filename + uuid;
    filedom.type = peerinfo.type;  // local or remote ,
    filedom.innerHTML = "";
    filedom.className = "row";
    // filedom.setAttribute("style","float: left; width: 98%; margin-left: 2%;");

    let name = document.createElement("li");
    /*name.innerHTML = listlength +"   " + filename ;*/
    name.innerHTML = filename;
    name.title = filetype + " shared by " + peerinfo.name;
    name.className = "filenameClass";
    name.id = "name" + filename + uuid;

    // Download Button
    let downloadButton = document.createElement("li");
    downloadButton.id = "downloadButton" + filename + uuid;
    downloadButton.title = "Download";
    if (fileshareobj.filelist.saveicon) {
        let img = document.createElement("img");
        img.src = fileshareobj.filelist.downloadicon;
        downloadButton.appendChild(img);
    } else {
        downloadButton.innerHTML = '<i class="fa fa-download"></i>';
    }
    downloadButton.onclick = function () {
        downloadFile(uuid, elementDisplay, fileurl, _filename, filetype);
    };

    //Save Button
    let saveButton = document.createElement("li");
    saveButton.id = "saveButton" + filename + uuid;
    saveButton.title = "Save";
    saveButton.setAttribute("data-toggle", "modal");
    saveButton.setAttribute("data-target", "#saveModal");
    if (fileshareobj.filelist.saveicon) {
        let img = document.createElement("img");
        img.src = fileshareobj.filelist.saveicon;
        saveButton.appendChild(img);
    } else {
        saveButton.innerHTML = '<i class="fa fa-floppy-o"></i>';
    }
    saveButton.onclick = function () {
        createModalPopup(filetype);
    };

    // Show Button
    let showButton = document.createElement("li");
    showButton.id = "showButton" + filename + uuid;
    showButton.title = "Show";
    if (fileshareobj.filelist.saveicon) {
        let img = document.createElement("img");
        img.src = fileshareobj.filelist.showicon;
        showButton.appendChild(img);
    } else {
        showButton.innerHTML = '<i class="fa fa-eye-slash"></i>';
    }
    let countClicks = 0;
    repeatFlagHideButton = filename;
    repeatFlagShowButton = "";
    showButton.onclick = function () {
        countClicks++;
        showHideFile(uuid, elementDisplay, fileurl, filename, filetype, showButton, countClicks);
    };

    /*
    hide button
    var hideButton = document.createElement("div");
    hideButton.id= "hideButton"+filename;
    hideButton.style.float="right";

    //hideButton.setAttribute("class" , "btn btn-primary");
    //hideButton.innerHTML='hide';
    //hideButton.innerHTML='<i class="fa fa-eye-slash" style="font-size: 25px;"></i>';
    hideButton.onclick=function(event){
        if(repeatFlagHideButton != filename){
            hideFile(uuid , elementDisplay , fileurl , filename , filetype);
            rtcConn.send({
                type:"shareFileHide",
                _uuid: uuid ,
                _element: elementDisplay,
                _fileurl : fileurl,
                _filename : filename,
                _filetype : filetype
            });
            repeatFlagHideButton= filename;
        }else if(repeatFlagHideButton == filename){
            repeatFlagHideButton= "";
        }
    };
    */

    //Remove Button
    let removeButton = document.createElement("li");
    removeButton.id = "removeButton" + filename + uuid;
    removeButton.title = "Remove";
    removeButton.innerHTML = '<i class="fa fa-trash-o"></i>';
    removeButton.onclick = function (event) {
        if (repeatFlagRemoveButton != filename) {
            //var tobeHiddenElement = event.target.parentNode.id;
            const tobeHiddenElement = filename + uuid;
            hideFile(elementDisplay, filename);
            rtcConn.send({
                type: "shareFileRemove",
                _element: tobeHiddenElement,
                _filename: filename
            });
            removeFile(tobeHiddenElement);
            repeatFlagRemoveButton = filename;
            webrtcdev.log("[startjs] filedom to be hidden : ", filedom);
            // filedom.hidden = true;
            filedom.setAttribute("style", "display:none!important");
        } else if (repeatFlagRemoveButton == filename) {
            repeatFlagRemoveButton = "";
        }
    };
    if (peerinfo.userid != selfuserid) {
        hideelem(removeButton);
    }

    if (role == "inspector") {
        showdownbtn.hidden = true;
        showButton.hidden = true;
        saveButton.hidden = true;
        filedom.appendChild(name);
        removeButton.hidden = true;
    }

    //Append all of the above components into file list view
    filedom.appendChild(name);
    if (showdownbtn)
        filedom.appendChild(downloadButton);
    filedom.appendChild(showButton);
    filedom.appendChild(saveButton);
    //filedom.appendChild(hideButton);
    if (showdelbtn)
        filedom.appendChild(removeButton);

    webrtcdev.log("[filesharing dom modifier JS ] filedom ", filedom, " | parentdom ", parentdom);

    if (parentdom) {
        // parentDom2 = parentdom.parentNode;
        // parentDom2.insertBefore(filedom , parentDom2.firstChild);
        parentdom.appendChild(filedom);
        window.dispatchEvent(new CustomEvent('webrtcdev', {
            detail: {
                servicetype: "file",
                action: "onFileListed"
            },
        }));
    } else {
        webrtcdev.error("[filesharing dom modifier JS ] filedom's parent dom not found ");
    }
}


/*
 * Display file by type
 * @method
 * @name getFileElementDisplayByType
 * @param {string} fileurl
 * @param {string} filename
 * @param {string} filetype
 */
function getFileElementDisplayByType(filetype, fileurl, filename) {

    webrtcdev.log(" [filehsaring js]  - getFileElementDisplayByType ",
        "file type :", filetype, "file url : ", fileurl, ", file name : ", filename);
    let elementDisplay;

    if (filetype.indexOf("msword") > -1 || filetype.indexOf("officedocument") > -1) {
        let divNitofcation = document.createElement("div");
        divNitofcation.className = "alert alert-warning";
        divNitofcation.innerHTML = "Microsoft and Libra word file cannot be opened in browser. " +
            "Click bottom DOWNLOAD in UF box . File shows up below the UF box. Click arrow on right, then select OPEN  . File Opens in New Window, then 'Save As'.";
        elementDisplay = divNitofcation;

    } else if (filetype.indexOf("image") > -1) {
        let image = document.createElement("img");
        image.src = fileurl;
        image.style.width = "100%";
        image.style.height = "100%";
        image.title = filename;
        image.id = "display" + filename;
        elementDisplay = image;

    } else if (filetype == "sessionRecording") {

        let filename = filename.videoname + "_" + filename.audioname;
        const div = document.createElement("div");
        div.setAttribute("background-color", "black");
        div.id = "display" + filename;
        div.title = filename;

        let video = document.createElement('video');
        video.src = fileurl.videofileurl;
        //video.type = "video/webm";
        video.setAttribute("type", "audvideo/webm");
        video.setAttribute("name", "videofile");
        video.controls = "controls";
        video.title = filename.videoname + ".webm";

        let audio = document.createElement('audio');
        audio.src = fileurl.audiofileurl;
        audio.setAttribute("type", "audio/wav");
        audio.controls = "controls";
        audio.title = filename.videoname + ".wav";

        //audio.hidden=true;

        div.appendChild(video);
        div.appendChild(audio);

        elementDisplay = div;

        video.play();
        audio.play();

    } else if (filetype.indexOf("videoScreenRecording") > -1) {
        webrtcdev.log("videoScreenRecording ", fileurl);
        let video = document.createElement("video");
        video.src = fileurl;
        video.setAttribute("controls", "controls");
        video.style.width = "100%";
        video.title = filename;
        video.id = "display" + filename;
        elementDisplay = video;

    } else if (filetype.indexOf("video") > -1) {
        webrtcdev.log("videoRecording ", fileurl);
        let video = document.createElement("video");
        video.src = fileurl;
        /*
        try{
            if(fileurl.video!=undefined ){
                video.src = URL.createObjectURL(fileurl.video);
            }else{
                video.src = URL.createObjectURL(fileurl);
            }
        }catch(e){
            video.src=fileurl;
        }*/

        video.setAttribute("controls", "controls");
        video.style.width = "100%";
        video.title = filename;
        video.id = "display" + filename;
        elementDisplay = video;

    } else {
        let iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.src = fileurl;
        iframe.className = "viewerIframeClass";
        iframe.title = filename;
        iframe.id = "display" + filename;
        elementDisplay = iframe;
    }
    return elementDisplay;
}

function displayFile(uuid, peerinfo, fileurl, filename, filetype) {

    webrtcdev.log(" [filehsaring js]  - displayFile  - uuid: ", uuid, " peerinfo :", peerinfo,
        "file url : ", fileurl, " file name : ", filename, " file type :", filetype);
    try {

        if (!peerinfo || !peerinfo.fileShare) return;

        let parentdom = document.getElementById(peerinfo.fileShare.container);
        let filedom = getFileElementDisplayByType(filetype, fileurl, filename);

        if (parentdom) {
            showFile(peerinfo.fileShare.container, fileurl, filename, filetype);

        } else if (role == "inspector") {
            for (peer in webcallpeers) {
                const i = ++peer;
                const parentdominspector = document.getElementById(webcallpeers[i].fileShare.container);
                if (parentdominspector) {
                    showFile(webcallpeers[i].fileShare.container, fileurl, filename, filetype);
                    break;
                }
            }
        } else {
            document.body.appendChild(filedom);
        }
    } catch (err) {
        webrtcdev.error("[filehsaring js] displayFile  has a problem ", err);
    }

    /*
    if($('#'+ parentdom).length > 0)
        $("#"+element).html(getFileElementDisplayByType(_filetype , _fileurl , _filename));
    else
        $("body").append(getFileElementDisplayByType(_filetype , _fileurl , _filename));*/
}

function syncButton(buttonId) {
    const buttonElement = document.getElementById(buttonId);

    for (x in webcallpeers) {
        if (buttonElement.getAttribute("lastClickedBy") == webcallpeers[x].userid) {
            buttonElement.setAttribute("lastClickedBy", '');
            return;
        }
    }

    if (buttonElement.getAttribute("lastClickedBy") == '') {
        buttonElement.setAttribute("lastClickedBy", rtcConn.userid);
        rtcConn.send({
            type: "buttonclick",
            buttonName: buttonId
        });
    }
}

/* ************* file Listing container button functions --------------- */

/**
 * Shows or hides file and sync activity with peers
 * @method
 * @name showHideFile
 * @param {id} uuid - unique universal id for the file
 * @param {dom} element - name of dom element
 * @param {bloburl} fileurl - blob of the file
 * @param {string} filename - name for file
 * @param {string} filetype - type of  file
 */
function showHideFile(uuid, elementDisplay, fileurl, filename, filetype, showHideButton, countClicks) {
    webrtcdev.log(" [filehsaring js]  - show/hide elementDisplay ", elementDisplay);
    webrtcdev.log(" [filehsaring js]  - show/hide button ", filename, " || ", countClicks);
    if (countClicks % 2 == 1) {
        showFile(elementDisplay, fileurl, filename, filetype);
        /*rtcConn.send({
            type:"shareFileShow",
            _uuid: uuid ,
            _element: elementDisplay,
            _fileurl : fileurl,
            _filename : filename,
            _filetype : filetype
        }); */
        showHideButton.innerHTML = '<i class="fa fa-eye-slash"></i>';
        webrtcdev.log(" [filehsaring js]  Executed script to show the file");
    } else if (countClicks % 2 == 0) {
        hideFile(elementDisplay, filename);
        /*rtcConn.send({
            type: "shareFileHide",
            _uuid: uuid,
            _element: elementDisplay,
            _fileurl: fileurl,
            _filename: filename,
            _filetype: filetype
        });*/
        showHideButton.innerHTML = '<i class="fa fa-eye"></i>';
        webrtcdev.log(" [filehsaring js]  Executed script to hide the file ");
    }
}

function showFile(element, fileurl, filename, filetype) {
    webrtcdev.log("[filehsaring js]  showFile container - ", element, document.getElementById(element));
    const filedom = getFileElementDisplayByType(filetype, fileurl, filename);
    webrtcdev.log("[filehsaring js]  showFile  filedom - ", filedom);
    if (existselem(element)) {
        document.getElementById(element).innerHTML = "";
        showelem(element);
        document.getElementById(element).appendChild(filedom);
    } else {
        webrtcdev.warn(" [filehsaring js] cant show file as parent DOM fir fileDisplay container doesnt exist ");
    }
}

function hideFile(element) {
    webrtcdev.log("[filehsaring js]  hidefile ", element);
    //if(document.getElementById(element) && $("#"+element).has("#display"+filename)){
    if (existselem(element)) {
        document.getElementById(element).innerHTML = "";
        hideelem(element);
        webrtcdev.log("[filehsaring js] hidefile done");
    } else {
        webrtcdev.warn(" [filehsaring js]  file is not displayed to hide  ");
    }
}

function removeFile(element) {
    webrtcdev.log("[filehsaring js]  removeFile ", element);
    document.getElementById(element).remove();
}


/**
 * Creates container for file sharing
 * @method
 * @name downloadFile
 * @param {id} uuid - uniwue identifier for file
 * @param {element} parent -
 * @param {url} fileurl
 * @param {str} filename
 * ffiletype {str}
 */
function downloadFile(uuid, element, fileurl, _filename, filetype) {
    webrtcdev.log(" downloadButton _filename ", _filename, "  filetype ", filetype);
    if (filetype == "sessionRecording") {
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = fileurl.audiofileurl;
        //a.download = _filename.audioname+".wav";
        a.download = peerinfo.filearray[0] + ".wav";
        a.click();
        window.URL.revokeObjectURL(fileurl.audiofileurl);

        const v = document.createElement("a");
        document.body.appendChild(v);
        v.style = "display: none";
        v.href = fileurl.videofileurl;
        //v.download = _filename.videoname+".webm";
        v.download = peerinfo.filearray[1] + ".webm";
        v.click();
        window.URL.revokeObjectURL(fileurl.videofileurl);

        /*window.open(fileurl.audiofileurl , filename.audioname+".wav");
        window.open(fileurl.videofileurl , filename.videoname+".webm");*/
        /*
        var zip = new JSZip();
        zip.file(filename.videoname , filename.videofileurl);
        var audio = zip.folder("audio");
        audio.file(filename.audioname, fileurl.audiofileurl);
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            // see FileSaver.js
            //saveAs(content, "sessionRecording.zip");
            window.open(content , "sessionRecording.zip");
        });*/
    } else {
        window.open(fileurl, "downloadedDocument");
    }
}

/**
 * Creates container for file sharing
 * @method
 * @name createFileSharingBox
 * @param {object} peerinfo - single object peerinfo from webcallpeers
 * @param {dom} parent - name of dom element parent
 */
function createFileSharingBox(peerinfo, parent) {
    try {
        webrtcdev.log(" [ filehsreing js ]  createFileSharingBox ", peerinfo, parent);
        if (document.getElementById(peerinfo.fileShare.outerbox))
            return;

        const fileSharingBox = document.createElement("div");

        if (fileshareobj.props.fileList == "single") {
            fileSharingBox.className = "col-md-12 fileviewing-box";
        } else {
            fileSharingBox.className = "fileviewing-box";
        }
        // fileSharingBox.setAttribute("style", "background-color:" + peerinfo.color);
        fileSharingBox.id = peerinfo.fileShare.outerbox;

        /*-------------------------------- add for File Share control Bar --------------------*/
        let minButton, maxButton;

        let fileControlBar = document.createElement("p");
        fileControlBar.id = peerinfo.fileShare.container + "controlBar";
        // show name only in  non sinhle file share object view
        if (fileshareobj.props.fileList != "single") {
            fileControlBar.appendChild(document.createTextNode(peerinfo.name));
            // fileControlBar.appendChild(document.createTextNode("File Viewer " + peerinfo.name));
        }

        if (fileshareobj.fileshare.minicon != "none") {
            // Minimize the File viewer box
            minButton = document.createElement("span");
            if (fileshareobj.fileshare.minicon) {
                let minicon = fileshareobj.fileshare.minicon;
                webrtcdev.log(" [fileShare JS ] creating custom minicon", minicon);
                let img = document.createElement("img");
                img.src = minicon;
                minButton.appendChild(img);
            } else {
                let minicon = '<i class="fa fa-minus-square"></i>';
                minicon.innerHTML = minicon;
                webrtcdev.log(" [fileShare JS ] creating default minicon ", minicon);
            }
            minButton.id = peerinfo.fileShare.minButton;
            minButton.title = "Minimize";
            minButton.style.display = "none";
            minButton.setAttribute("lastClickedBy", '');
            minButton.onclick = function () {
                resizeFV(peerinfo.userid, minButton.id, peerinfo.fileShare.outerbox);
                hideelem(minButton);
                showelem(maxButton);
            };
            fileControlBar.appendChild(minButton);
        } else {
            webrtcdev.warn(" [fileShare JS ] minicon is none");
        }

        if (fileshareobj.fileshare.maxicon != "none") {
            // Maximize the file viewer box
            maxButton = document.createElement("span");
            if (fileshareobj.fileshare.maxicon) {
                let maxicon = fileshareobj.fileshare.maxicon;
                webrtcdev.log(" [fileShare JS ] creating custom maxicon", maxicon);
                let img = document.createElement("img");
                img.src = maxicon;
                maxButton.appendChild(img);
            } else {
                let maxicon = '<i class="fa fa-external-link-square"></i>';
                maxButton.innerHTML = maxicon;
                webrtcdev.log(" [fileShare JS ] creating default maxicon", maxicon);
            }
            maxButton.id = peerinfo.fileShare.maxButton;
            maxButton.title = "Maximize";
            maxButton.style.display = "block";
            maxButton.setAttribute("lastClickedBy", '');
            maxButton.onclick = function () {
                maxFV(peerinfo.userid, maxButton.id, peerinfo.fileShare.outerbox);
                if (fileshareobj.props.fileList != "single") {
                    for (let x in webcallpeers) {
                        if (webcallpeers[x].userid != peerinfo.userid)
                            minFV(webcallpeers[x].userid, "", webcallpeers[x].fileShare.outerbox);
                    }
                }
                hideelem(maxButton);
                showelem(minButton);
            };
            fileControlBar.appendChild(maxButton);
        } else {
            webrtcdev.warn(" [fileShare JS ] maxicon is none");
        }

        // close the file viewer box
        let closeButton = document.createElement("span");
        if (fileshareobj.fileshare.closeicon) {
            let img = document.createElement("img");
            img.src = fileshareobj.fileshare.closeicon;
            closeButton.appendChild(img);
        } else {
            closeButton.innerHTML = '<i class="fa fa-times-circle"></i>';
        }
        closeButton.id = peerinfo.fileShare.closeButton;
        closeButton.title = "Close";
        closeButton.setAttribute("lastClickedBy", '');
        closeButton.onclick = function () {
            closeFV(peerinfo.userid, closeButton.id, peerinfo.fileShare.container);
        };
        fileControlBar.appendChild(closeButton);

        // rotate the content of file viewer box
        let angle = 0;
        const orientation = null;
        let rotateButton = document.createElement("span");
        if (fileshareobj.fileshare.rotateicon) {
            let img = document.createElement("img");
            img.src = fileshareobj.fileshare.rotateicon;
            rotateButton.appendChild(img);
        } else {
            rotateButton.innerHTML = '<i class="fa fa-mail-forward"></i>';
        }
        rotateButton.id = peerinfo.fileShare.rotateButton;
        rotateButton.title = "Rotate";
        rotateButton.onclick = function () {
            let domparent = document.getElementById(peerinfo.fileShare.container);
            let dom = domparent.firstChild;
            webrtcdev.log(" [filehsraing ] rotateButton dom ", dom, dom.nodeName, "dom parent ", domparent);

            angle = (angle + 90) % 360;
            dom.setAttribute("angle", angle);

            if (dom) {
                //alert(" dom type " + dom.nodeName);
                if (dom.nodeName == "VIDEO") {
                    rescaleVideo(dom, domparent);

                } else if (dom.nodeName == "IMG") {
                    rescaleImage(dom, domparent);

                } else if (dom.nodeName == "IFRAME") {
                    rescaleIFrame(dom, domparent);

                } else {
                    // do not allow rotate
                    dom.setAttribute("orientation", "");
                }
            } else {
                webrtcdev.error(" [filehsraing ] rotateButton  , dom doesnt exist");
            }
            // dom.className = "col rotate" + angle + dom.getAttribute("orientation");
        };

        fileControlBar.appendChild(rotateButton);


        /*--------------------------------add for File Share Container--------------------*/
        let fileShareContainer = document.createElement("div");
        fileShareContainer.className = "filesharingWidget";
        fileShareContainer.id = peerinfo.fileShare.container;

        // let fillerArea = document.createElement("p");
        // fillerArea.className = "filler";

        if (debug) {
            let nameBox = document.createElement("span");
            nameBox.innerHTML = "<br/>" + fileShareContainer.id + "<br/>";
            fileSharingBox.appendChild(nameBox);
        }

        // linebreak = document.createElement("br");

        fileSharingBox.appendChild(fileControlBar);
        // fileSharingBox.appendChild(linebreak);
        // fileSharingBox.appendChild(linebreak);
        fileSharingBox.appendChild(fileShareContainer);
        // fileSharingBox.appendChild(fillerArea);

        parent.appendChild(fileSharingBox);
    } catch (e) {
        webrtcdev.error(" createFileSharingBox ", e);
    }
}


function rescaleVideo(dom, domparent) {
    const angle = dom.getAttribute("angle") || 0;

    if (dom.videoWidth > dom.videoHeight) {
        dom.setAttribute("style", "height:" + domparent.clientWidth + "px;margin-left: 0px");
        orientation = "landscape";
    } else {
        orientation = "portrait";
    }
    dom.setAttribute("orientation", orientation);
    dom.className = "col rotate" + angle + dom.getAttribute("orientation");


}


function rescaleIFrame(dom, domparent) {
    const angle = dom.getAttribute("angle") || 0;

    dom.setAttribute("style", "height:" + domparent.clientWidth + "px !important;width:100%");
    dom.setAttribute("orientation", "portrait");
    // }else if (dom.nodeName == "VIDEO"){
    //     dom.setAttribute("style","height:"+domparent.clientWidth +"px;margin-left: 0px");
    //     dom.setAttribute("orientation",  "landscape");
    dom.className = "col rotate" + angle + dom.getAttribute("orientation");


}


function rescaleImage(dom, domparent) {

    let orientation;
    const angle = dom.getAttribute("angle") || 0;

    if (dom.width > dom.height) {
        orientation = "landscape";

        if (angle == "90" || angle == "270") {
            // new width / new height  = old width/old height
            // thus new width = old width / old height * new height
            newwidth = (dom.width / dom.height) * domparent.clientWidth;
            dom.setAttribute("style", "width:" + newwidth + "px; height:" + domparent.clientWidth + "px");
        }
        // if(angle =="180" || angle == "0"){
        //     dom.setAttribute("style","width:100%; height:100%");
        // }

    } else {
        orientation = "portrait";

        if (angle == "90" || angle == "270") {
            // old width/old height = new width / new height
            // thus new width = old width / old height * new height
            newwidth = (dom.width / dom.height) * domparent.clientWidth;
            dom.setAttribute("style", "height:" + domparent.clientWidth + "px; max-width:" + newwidth + "px;");
        }
        // if(angle =="180" || angle == "0"){
        //     dom.setAttribute("style","width:100%; height:100%");
        // }

    }

    dom.setAttribute("orientation", orientation);
    dom.className = "col rotate" + angle + dom.getAttribute("orientation");


}

/**
 * Creates container for file listing
 * @method
 * @name createFileListingBox
 * @param {object} peerinfo - single object peerinfo from webcallpeers
 * @param {dom} parent - name of dom element parent
 */
function createFileListingBox(peerinfo, parent) {

    try {
        if (getElementById(peerinfo.fileList.outerbox))
            return;

        const fileListingBox = document.createElement("div");

        if (fileshareobj.props.fileList == "single") {
            fileListingBox.className = "col-sm-12 filesharing-box";
        } else {
            fileListingBox.className = "col-sm-6 filesharing-box";
        }

        fileListingBox.id = peerinfo.fileList.outerbox;
        //fileListingBox.setAttribute("style", "background-color:" + peerinfo.color);

        /*--------------------------------add for File List control Bar--------------------*/

        let fileListControlBar = document.createElement("div");
        fileListControlBar.id = "widget-filelisting-container-header";
        fileListControlBar.setAttribute("style", "background-color:" + peerinfo.color);

        //Show name in file list conrol bar when view id not single
        if (fileshareobj.props.fileList != "single") {
            fileListControlBar.appendChild(document.createTextNode(peerinfo.name + "     "));
            //fileListControlBar.appendChild(document.createTextNode("Uploaded Files " + peerinfo.name + "     "));
        }

        /*
        var fileHelpButton= document.createElement("span");s
        fileHelpButton.className="btn btn-default glyphicon glyphicon-question-sign closeButton";
        fileHelpButton.innerHTML="Help";
        /*fileListControlBar.appendChild(fileHelpButton);*/
        let minButton, maxButton;

        if (fileshareobj.filelist.minicon != "none") {
            minButton = document.createElement("span");
            minButton.innerHTML = '<i class="fa fa-minus" ></i>';
            minButton.id = peerinfo.fileShare.minButton;
            minButton.setAttribute("lastClickedBy", '');
            minButton.onclick = function () {
                minFV(peerinfo.userid, minButton.id, peerinfo.fileList.container);
                hideelem(minButton);
                showelem(maxButton);
            };
            fileListControlBar.appendChild(minButton);
        }

        if (fileshareobj.filelist.maxicon != "none") {
            maxButton = document.createElement("span");
            maxButton.innerHTML = '<i class="fa fa-plus" ></i>';
            maxButton.id = peerinfo.fileShare.maxButton;
            maxButton.setAttribute("lastClickedBy", '');
            maxButton.onclick = function () {
                maxFV(peerinfo.userid, maxButton.id, peerinfo.fileList.container);
                hideelem(maxButton);
                showelem(minButton);
            };
            fileListControlBar.appendChild(maxButton);
            hideelem(maxButton);
        }

        // let closeButton = document.createElement("span");
        // closeButton.innerHTML = '<i class="fa fa-times"></i>';
        // closeButton.id = peerinfo.fileShare.closeButton;
        // closeButton.setAttribute("lastClickedBy", '');
        // closeButton.onclick = function () {
        //     closeFV(peerinfo.userid, closeButton.id, peerinfo.fileList.container);
        // };
        // fileListControlBar.appendChild(closeButton);

        /*-------------------------------- add for File List Container--------------------*/
        const fileListContainer = document.createElement("div");
        fileListContainer.id = peerinfo.fileList.container;

        /*-------------------------------- add for File progress bar --------------------*/
        let fileProgress = document.createElement("div");

        if (debug) {
            let nameBox = document.createElement("span");
            nameBox.innerHTML = fileListContainer.id;
            fileListingBox.appendChild(nameBox);
        }

        fileListingBox.appendChild(fileListControlBar);
        fileListingBox.appendChild(fileListContainer);
        fileListingBox.appendChild(fileProgress);

        parent.appendChild(fileListingBox);
    } catch (err) {
        webrtcdev.error("[filesharing dom modifier] createFileListingBox ", err);
    }
}


function createFileSharingDiv(peerinfo) {
    webrtcdev.log("[filesharing dom modifier] createFileSharingDiv  ", peerinfo);

    // When the peerinfo role is inspctor but self role is not inspector only then exit
    if (peerinfo.role == "inspector" && role != "inspector") return;

    if (fileshareobj.props.fileList != "single") {

        // list of all active user ids
        let activeRemotepeerids = "";
        for (i in webcallpeers) {
            if (webcallpeers[i].type == "remote")
                activeRemotepeerids += webcapppeers[i].userid;
        }

        // if it is p2p session and only 2 File Listing boxes are already present remove the already existing remote file listing box
        if (document.getElementById("fileListingRow").childElementCount >= 2) {
            webrtcdev.warn("more than 1 file listing rows prresent , remove the ones for peers that are no longer in session  ");
            let filelistingrow = document.getElementById("fileListingRow");
            let filelistingboxes = filelistingrow.childNodes;

            for (x in filelistingboxes) {
                webrtcdev.log(" check if this dom by id is required .  filelistingboxes[x].id ", filelistingboxes[x]);
                if (!filelistingboxes[x].id) break;
                fid = filelistingboxes[x].id.split("widget-filelisting-box");
                if (!activeRemotepeerids.includes(fid[1])) {
                    webrtcdev.warn(" File list boxes belonging to userid ", fid[1], " need to be removed  ");
                    filelistingrow.removeChild(filelistingboxes[x]);
                }
            }
        }

        // if it is p2p session and only 2 File sharing boxes are already present remove the already existing remote file sharing box
        if (document.getElementById("fileSharingRow").childElementCount >= 2) {
            webrtcdev.warn("more than 1 file listing rows present , remove the ones for peers that are no longer in session  ");
            let fileSharingrow = document.getElementById("fileSharingRow");
            let fileSharingboxes = fileSharingrow.childNodes;

            for (x in fileSharingboxes) {
                webrtcdev.log(" check if this dom by id is required .filelistingboxes[x].id ", fileSharingboxes[x]);
                if (!fileSharingboxes[x].id) break;
                fid = fileSharingboxes[x].id.split("widget-sharing-box");
                if (!activeRemotepeerids.includes(fid[1])) {
                    webrtcdev.warn(" File list boxes belonging to userid ", fid[1], " need to be removed  ");
                    fileSharingrow.removeChild(fileSharingboxes[x]);
                }
            }
        }

    }

    if (!getElementById(peerinfo.fileShare.outerbox)) {
        let parentFileShareContainer = getElementById(fileshareobj.fileShareContainer);
        createFileSharingBox(peerinfo, parentFileShareContainer);
    }

    if (!getElementById(peerinfo.fileList.outerbox)) {
        let parentFileListContainer = getElementById(fileshareobj.fileListContainer);
        createFileListingBox(peerinfo, parentFileListContainer);
    }
}

/* --------------- file sharing container button functions --------------- */

function closeFV(userid, buttonId, selectedFileSharingBox) {
    getElementById(selectedFileSharingBox).innerHTML = "";
    /*syncButton(buttonId);*/
}

function resizeFV(userid, buttonId, selectedFileSharingBox) {
    for (x in webcallpeers) {
        if (webcallpeers[x].fileShare.outerbox == selectedFileSharingBox) {
            showelem(selectedFileSharingBox);
            getElementById(selectedFileSharingBox).style.width = "50%";
        } else {
            showelem(webcallpeers[x].fileShare.outerbox);
            getElementById(webcallpeers[x].fileShare.outerbox).style.width = "50%";
        }
    }
    /*syncButton(buttonId);*/
}

function minFV(userid, buttonId, selectedFileSharingBox) {
    hideelem(selectedFileSharingBox);
    // for (x in webcallpeers) {
    //     if (webcallpeers[x].fileShare.outerbox == selectedFileSharingBox) {
    //         hideelem(selectedFileSharingBox);
    //     } else {
    //         showelem(webcallpeers[x].fileShare.outerbox);
    //     }
    // }
}

function maxFV(userid, buttonId, selectedFileSharingBox) {
    showelem(selectedFileSharingBox);
    // const showelem1 = showelem(selectedFileSharingBox);
    // for (x in webcallpeers) {
    //     if (webcallpeers[x].fileShare.outerbox == selectedFileSharingBox) {
    //         showelem1;
    //     } else {
    //         hideelem(webcallpeers[x].fileShare.outerbox);
    //     }
    // }
    /*syncButton(buttonId);  */
}

/**
 * Save File Modal Popup
 * @method
 * @name createModalPopup
 * @param {string} filetype
 */
function createModalPopup(filetype) {
    webrtcdev.log(" create Modal popup for filetype ", filetype);

    const mainDiv = getElementById("mainDiv");

    if (getElementById("saveModal")) {
        mainDiv.removeChild(document.getElementById("saveModal"));
    }

    const modalBox = document.createElement("div");
    modalBox.className = "modal fade";
    modalBox.setAttribute("role", "dialog");
    modalBox.id = "saveModal";

    const modalinnerBox = document.createElement("div");
    modalinnerBox.className = "modal-dialog";

    const modal = document.createElement("div");
    modal.className = "modal-content";

    const modalheader = document.createElement("div");
    modalheader.className = "modal-header";

    const closeButton = document.createElement("button");
    closeButton.className = "close";
    closeButton.setAttribute("data-dismiss", "modal");
    closeButton.innerHTML = "&times;";

    const title = document.createElement("h4");
    title.className = "modal-title";
    title.innerHTML = "Save File";
    title.setAttribute("float", "left");
    modalheader.appendChild(title);
    modalheader.appendChild(closeButton);

    const modalbody = document.createElement("div");
    modalbody.className = "modal-body";
    modalbody.innerHTML = "";

    const body = document.createElement("div");
    switch (filetype) {
        case  "blobcanvas":
            title.innerHTML = "Save Drawing";
            var d1 = document.createElement("div");
            d1.innerHTML = "Right Click on Save, pop up window gives following info: Right Click on Draw image, Click Save As when window opens up.";
            body.appendChild(d1);
            break;
        case "application/pdf":
            title.innerHTML = "Save PDF";
            var d1 = document.createElement("div");
            d1.innerHTML = 'Click DOWNLOAD on top of the doc . Click SAVE AS when window opens up';
            const i1 = document.createElement("img");
            i1.src = "images/savefile.PNG";
            body.appendChild(d1);
            body.appendChild(i1);
            break;
        // browser supported formats
        case "image/jpeg":
        case "image/png":
        case "video/mov":
        case "video/webm":
        case "imagesnapshot":
            title.innerHTML = "Save Picture / Video";
            var d1 = document.createElement("div");
            d1.innerHTML = 'Right Click on the FILE . Click SAVE AS when window opens up';
            body.appendChild(d1);
            break;
        // browser supported audio formats
        case "audio/mp3":
            title.innerHTML = "Save Music File";
            var d1 = document.createElement("div");
            d1.innerHTML = "Right Click on the FILE (play display line). Click SAVE AS when window opens up";
            body.appendChild(d1);
            break;
        // propertiary stuff that will not open in browser
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        case "application/vnd.ms-excel":
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "video/x-ms-wmv":
            title.innerHTML = "Save Microsoft Office / Libra / Open Office Documents";
            var d1 = document.createElement("div");
            d1.innerHTML = "Click bottom DOWNLOAD in Uploaded Files box . File shows up below the Uploaded Files box. Click arrow on right, then select OPEN  . File Opens in New Window, then 'Save As'.";
            body.appendChild(d1);
            break;
        case "sessionRecording":
            title.innerHTML = "Save Session Recording";
            var d1 = document.createElement("div");
            d1.innerHTML = 'Extract the video and audio recording from the dowloaded compresed file and play together ';
            body.appendChild(d1);
            break;
        default :
            var d1 = document.createElement("div");
            d1.innerHTML = 'Document is Unrecognizable, cannot be saved, but can be shared with Remote. Use/Click Screen Share for Remote to view your screen. Then open the document on your screen.';
            body.appendChild(d1);
            break;
    }

    modalbody.appendChild(body);
    modal.appendChild(modalheader);
    modal.appendChild(modalbody);

    modalinnerBox.appendChild(modal);
    modalBox.appendChild(modalinnerBox);

    mainDiv.appendChild(modalBox);
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//***************************************************
 video handling
 *********************************************************/

function appendVideo(e, style) {
    createVideoContainer(e, style, function (div) {
        var video = document.createElement('video');
        video.className = style;
        video.setAttribute('style', 'height:auto;opacity:1;');
        video.controls = false;
        video.id = e.userid;
        video.src = URL.createObjectURL(e.stream);
        viden.hidden = false;
        var remote = document.getElementById('remote');
        div.appendChild(video);
        video.play();
    });
}

function createVideoContainer(e, style, callback) {
    var div = document.createElement('div');
    div.setAttribute('style', style || 'float:left;opacity: 1;width: 32%;');
    remote.insertBefore(div, remote.firstChild);
    if (callback) callback(div);
}

/****************************************************
 control Buttons attachment to Video Element
 *********************************************************/

/**
 * function to attach control bar to video for minmax , record etc
 * @method
 * @name attachControlButtons
 * @param {dom} vid
 * @param {json} peerinfo
 */
function attachControlButtons(vid, peerinfo) {

    var stream = peerinfo.stream;
    var streamid = peerinfo.streamid;
    var controlBarName = peerinfo.controlBarName;
    var snapshotViewer = peerinfo.fileSharingContainer;

    //Preventing multiple control bars
    var c = vid.parentNode.childNodes;
    for (i = 0; i < c.length; i++) {
        //webrtcdev.log("ChildNode of video Parent " , c[i]);
        if (c[i].nodeName == "DIV" && c[i].id != undefined) {
            if (c[i].id.indexOf("control") > -1) {
                webrtcdev.log("control bar exists already  , delete the previous one before adding new one");
                vid.parentNode.removeChild(c[i]);
            }
        }
    }

    // Control bar holds media control elements like , mute unmute , fillscreen ,. recird , snapshot
    let controlBar = document.createElement("div");
    controlBar.id = controlBarName;

    if (peerinfo.type == "local")
        controlBar.className = "localVideoControlBarClass";
    else
        controlBar.className = "remoteVideoControlBarClass";

    if (debug) {
        let nameBox = document.createElement("div");
        nameBox.innerHTML = vid.id;
        controlBar.appendChild(nameBox);
    }

    if (muteobj.active) {
        if (muteobj.audio.active) {
            controlBar.appendChild(createAudioMuteButton(controlBarName, peerinfo));
        }
        if (muteobj.video.active) {
            controlBar.appendChild(createVideoMuteButton(controlBarName, peerinfo));
        }
    }

    if (snapshotobj.active) {
        controlBar.appendChild(createSnapshotButton(controlBarName, peerinfo));
    }

    if (videoRecordobj.active) {
        controlBar.appendChild(createRecordButton(controlBarName, peerinfo, streamid, stream));
    }

    if (cursorobj.active) {
        //assignButtonCursor(cursorobj.button.id);
        controlBar.appendChild(createCursorButton(controlBarName, peerinfo));
    }

    if (minmaxobj.active) {
        controlBar.appendChild(createFullScreenButton(controlBarName, peerinfo, streamid, stream));
        // controlBar.appendChild(createMinimizeVideoButton(controlBarName, peerinfo, streamid, stream));

        // attach minimize button to header instead of widgets in footer
        nameBoxid = "#videoheaders" + peerinfo.userid;
        let nameBox = document.querySelectorAll(nameBoxid);
        for (n in nameBox) {
            // webrtcdev.log("[_media_dommodifier ] attachControlButtons - nameBox " , nameBox[n]);
            if (nameBox[n].appendChild)
                nameBox[n].appendChild(createMinimizeVideoButton(controlBarName, peerinfo, streamid, stream));
        }
    }

    vid.parentNode.appendChild(controlBar);
    return;
}

/**
 * function to createFullScreenButton
 * @method
 * @name createFullScreenButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createFullScreenButton(controlBarName, peerinfo, streamid, stream) {
    let button = document.createElement("span");
    button.id = controlBarName + "fullscreeButton";
    button.setAttribute("title", "Full Screen");
    button.className = minmaxobj.max.button.class_off;
    button.innerHTML = minmaxobj.max.button.html_off;

    // button.setAttribute("data-placement", "bottom");
    // button.setAttribute("data-toggle", "tooltip");
    // button.setAttribute("data-container", "body");

    button.onclick = function () {
        if (button.className == minmaxobj.max.button.class_off) {
            var vid = document.getElementById(peerinfo.videoContainer);
            vid.webkitRequestFullScreen();
            button.className = minmaxobj.max.button.class_on;
            button.innerHTML = minmaxobj.max.button.html_on;
        } else {
            button.className = minmaxobj.max.button.class_off;
            button.innerHTML = minmaxobj.max.button.html_off;
        }
        //syncButton(audioButton.id);
    };
    return button;
}

/**
 * function to createMinimizeVideoButton
 * @method
 * @name createMinimizeVideoButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createMinimizeVideoButton(controlBarName, peerinfo, streamid, stream) {
    let button = document.createElement("span");
    button.id = controlBarName + "minmizevideoButton";
    button.setAttribute("title", "Minimize Video");
    button.className = minmaxobj.min.button.class_off;
    button.innerHTML = minmaxobj.min.button.html_off;
    var vid = document.getElementById(peerinfo.videoContainer);
    button.onclick = function () {
        if (button.className == minmaxobj.min.button.class_off) {
            // vid.hidden = true;
            hideelem(vid);
            button.className = minmaxobj.min.button.class_on;
            button.innerHTML = minmaxobj.min.button.html_on;
        } else {
            // vid.hidden = false;
            showelem(vid);
            button.className = minmaxobj.min.button.class_off;
            button.innerHTML = minmaxobj.min.button.html_off;
        }
        //syncButton(audioButton.id);
    };
    webrtcdev.log("[_media_dommodifier ] createMinimizeVideoButton - button", button, " vid ", vid);
    return button;
}

/**
 * function to createAudioMuteButton
 * @method
 * @name attachUserDetails
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createAudioMuteButton(controlBarName, peerinfo) {
    let audioButton = document.createElement("span");
    audioButton.id = controlBarName + "audioButton";
    audioButton.setAttribute("data-val", "mute");
    audioButton.setAttribute("title", "Toggle Audio");
    // audioButton.setAttribute("data-placement", "bottom");
    // audioButton.setAttribute("data-toggle", "tooltip");
    // audioButton.setAttribute("data-container", "body");
    audioButton.className = muteobj.audio.button.class_on;
    audioButton.innerHTML = muteobj.audio.button.html_on;
    audioButton.onclick = function () {
        if (audioButton.className == muteobj.audio.button.class_on) {
            peerinfo.stream.mute({
                audio: !0
            });
            audioButton.className = muteobj.audio.button.class_off;
            audioButton.innerHTML = muteobj.audio.button.html_off;
        } else {
            peerinfo.stream.unmute({
                audio: !0
            });
            audioButton.className = muteobj.audio.button.class_on;
            audioButton.innerHTML = muteobj.audio.button.html_on;
        }
        syncButton(audioButton.id);
    };
    return audioButton;
}

/**
 * function to createVideoMuteButton
 * @method
 * @name createVideoMuteButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @return {dom} button
 */
function createVideoMuteButton(controlBarName, peerinfo) {
    let videoButton = document.createElement("span");
    videoButton.id = controlBarName + "videoButton";
    videoButton.setAttribute("title", "Toggle Video");
    videoButton.setAttribute("data-container", "body");
    videoButton.className = muteobj.video.button.class_on;
    videoButton.innerHTML = muteobj.video.button.html_on;
    videoButton.onclick = function (event) {
        if (videoButton.className == muteobj.video.button.class_on) {
            peerinfo.stream.mute({
                video: !0
            });
            videoButton.innerHTML = muteobj.video.button.html_off;
            videoButton.className = muteobj.video.button.class_off;
        } else {
            peerinfo.stream.unmute({
                video: !0
            });
            videoButton.innerHTML = muteobj.video.button.html_on;
            videoButton.className = muteobj.video.button.class_on;
        }
        syncButton(videoButton.id);
    };
    return videoButton;
}


/**********************************************
 User Detail attachment to Video Element
 *******************************************/

/**
 * function to attach user details header on top of video
 * @method
 * @name attachUserDetails
 * @param {dom} vid
 * @param {json} peerinfo
 */
function attachUserDetails(vid, peerinfo) {
    webrtcdev.log("[media_dommanager] attachUserDetails - ", peerinfo.userid, ":", peerinfo.type);
    if ((vid.parentNode.querySelectorAll('.videoHeaderClass')).length > 0) {
        webrtcdev.warn("[media_dommanager] video header already present ", vid.parentNode.querySelectorAll('.videoHeaderClass'));
        if ((vid.parentNode.querySelectorAll("videoheaders" + peerinfo.userid)).length > 0) {
            webrtcdev.warn("[media_dommanager] user's video header already present ", "videoheaders" + peerinfo.userid);
            return;
        } else {
            webrtcdev.warn("[media_dommanager] video header already present for diff user , overwrite with ", "videoheaders" + peerinfo.userid);
            let vidheader = vid.parentNode.querySelectorAll('.videoHeaderClass')[0];
            vidheader.remove();
        }
    }
    let nameBox = document.createElement("div");
    // nameBox.setAttribute("style", "background-color:" + peerinfo.color),
    nameBox.className = "videoHeaderClass",
        nameBox.innerHTML = peerinfo.name ,
        nameBox.id = "videoheaders" + peerinfo.userid;

    // vid.parentNode.appendChild(nameBox);
    vid.parentNode.insertBefore(nameBox, vid.parentNode.firstChild);
}

/**
 * function to attach user's meta details header on top of video
 * @method
 * @name attachMetaUserDetails
 * @param {dom} vid
 * @param {json} peerinfo
 */
function attachMetaUserDetails(vid, peerinfo) {
    webrtcdev.log("[media_dommanager] attachMetaUserDetails - ", peerinfo.userid, ":", peerinfo.type);
    let detailsbox = document.createElement("span");
    detailsbox.setAttribute("style", "background-color:" + peerinfo.color);
    detailsbox.innerHTML = peerinfo.userid + ":" + peerinfo.type + "<br/>";
    vid.parentNode.insertBefore(detailsbox, vid.parentNode.firstChild);
}


/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                    Notify JS                                                     */

/*-----------------------------------------------------------------------------------*/

/**
 * function to show bootstrap based notification to client
 * @constructor
 * @param {string} message - message passed inside the notification
 * @param {string} type - type of message passed inside the notification
 */
function shownotification(message, type) {

    if (!message || message == "undefined") return;

    if (document.getElementById("alertBox")) {
        var alertDiv = document.createElement("div");
        if (type == "warning")
            alertDiv.className = "alert alert-warning fade in";
        else if (type == "crtical")
            alertDiv.className = "alert alert-crtical";
        else
            alertDiv.className = "alert alert-success fade in";

        alertDiv.innerHTML = '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + message;

        document.getElementById("alertBox").hidden = false;
        // document.getElementById("alertBox").innerHTML="";
        document.getElementById("alertBox").appendChild(alertDiv);

        setTimeout(function () {
            document.getElementById("alertBox").hidden = true;
        }, 3000);
    } else {
        alert(message);
    }

}

/**
 * function to show notification warning
 * @function
 * @name shownotificationWarning
 * @param {string} message - message passed inside the notification
 */
function shownotificationWarning(message) {

    if (!message || message == "undefined") return;

    if (!debug) return;

    if (document.getElementById("alertBox")) {
        var alertDiv = document.createElement("div");
        alertDiv.className = "alert alert-warning fade in";
        alertDiv.innerHTML = '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + message;

        document.getElementById("alertBox").hidden = false;
        document.getElementById("alertBox").innerHTML = "";
        document.getElementById("alertBox").appendChild(alertDiv);

        setTimeout(function () {
            document.getElementById("alertBox").hidden = true;
        }, 3000);
    } else {
        alert(message);
    }

}

/**
 * function to show desktop notification
 * @function
 * @name showdesktopnotification
 */
this.showdesktopnotification = showdesktopnotification = function (title, description) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var options = {
            body: description
            /*icon: "images/villagexpertslogo2.png"*/
        };

        let notification = new Notification(title, options);

    } else if (Notification.permission !== 'denied') {
        webrtcdev.warn(" [notify.js] notification denied");
    }

    //  Otherwise, we need to ask the user for permission
    //  else if (Notification.permission !== 'denied') {
    //  Ntification.requestPermission(function (permission) {
    //     // If the user accepts, let's create a notification
    //     if (permission === "granted") {
    //       var notification = new Notification("Web based RealTime Communication");
    //     }
    //   });
    // }

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
};


// not a very good pracise i know
// need this to inform user of session updates when he/she is on another tab/widnow 
if (typeof Notification != undefined) {
    try {
        Notification.requestPermission().then(function (result) {
            webrtcdev.log("[notify.js] notification requestPermission ", result);
        });
    } catch (error) {
        // Safari doesn't return a promise for requestPermissions and it                                                                                                                                       
        // throws a TypeError. It takes a callback as the first argument                                                                                                                                       
        // instead.
        if (error instanceof TypeError) {
            Notification.requestPermission((result) => {
                webrtcdev.log("[notify.js] notification requestPermission safari", result);
            });
        } else {
            throw error;
        }
    }

}

function spawnNotification(theBody, theIcon, theTitle) {
    var options = {
        body: theBody,
        icon: theIcon
    }
    var n = new Notification(theTitle, options);
}

/*-----------------------------------------------------------------------------------*/


/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */var screenShareButton;

/**
 * find if view button is provided or need to be created
 * @method
 * @name createOrAssignScreenviewButton
 */
function createOrAssignScreenviewButton() {
    if (screenshareobj.button.viewButton.id && getElementById(screenshareobj.button.viewButton.id)) {
        let button = getElementById(screenshareobj.button.viewButton.id);
        assignScreenViewButton(button);
    } else {
        createScreenViewButton();
    }
}

/**
 * create the view button for screnshare
 * @method
 * @name createScreenViewButton
 */
function createScreenViewButton() {
    if (getElementById("viewScreenShareButton"))
        return;
    var viewScreenShareButton = document.createElement("span");
    viewScreenShareButton.className = screenshareobj.button.viewButton.class_off;
    viewScreenShareButton.innerHTML = screenshareobj.button.viewButton.html_off;
    viewScreenShareButton.id = "viewScreenShareButton";
    webrtcdevViewscreen(screenRoomid);
    viewScreenShareButton.onclick = function () {
        if (viewScreenShareButton.className == screenshareobj.button.viewButton.class_off) {
            getElementById(screenshareobj.screenshareContainer).hidden = false;
            viewScreenShareButton.className = screenshareobj.button.viewButton.class_on;
            viewScreenShareButton.innerHTML = screenshareobj.button.viewButton.html_on;
        } else if (viewScreenShareButton.className == screenshareobj.button.viewButton.class_on) {
            getElementById(screenshareobj.screenshareContainer).hidden = true;
            viewScreenShareButton.className = screenshareobj.button.viewButton.class_off;
            viewScreenShareButton.innerHTML = screenshareobj.button.viewButton.html_off;
        }
    };

    if (getElementById("topIconHolder_ul")) {
        let li = document.createElement("li");
        li.appendChild(viewScreenShareButton);
        getElementById("topIconHolder_ul").appendChild(li);
    }
}

/**
 * assign the view button for screnshare with existing buttom dom
 * @method
 * @name assignScreenViewButton
 */
function assignScreenViewButton(button) {
    /*
    if(getElementById(screenshareobj.button.viewButton.id))
        return;*/
    webrtcdevViewscreen(screenRoomid);
    button.onclick = function () {
        if (button.className == screenshareobj.button.viewButton.class_off) {
            getElementById(screenshareobj.screenshareContainer).hidden = false;
            button.className = screenshareobj.button.viewButton.class_on;
            button.innerHTML = screenshareobj.button.viewButton.html_on;
        } else if (button.className == screenshareobj.button.viewButton.class_on) {
            getElementById(screenshareobj.screenshareContainer).hidden = true;
            button.className = screenshareobj.button.viewButton.class_off;
            button.innerHTML = screenshareobj.button.viewButton.html_off;
        }
    };
}

/**
 * if viewScreenShareButton button exists , remove it
 * @method
 * @name removeScreenViewButton
 */
function removeScreenViewButton() {
    if (getElementById("viewScreenShareButton")) {
        let elem = getElementById("viewScreenShareButton");
        elem.parentElement.removeChild(elem);
    }
    return;
}


/**
 * If button id are present then assign sreen share button or creatr a new one
 * @method
 * @name createOrAssignScreenshareButton
 * @param {json} screenshareobject
 */
function createOrAssignScreenshareButton(screenshareobj) {
    webrtcdev.log("createOrAssignScreenshareButton ", screenshareobj);
    if (screenshareobj.button.shareButton.id && getElementById(screenshareobj.button.shareButton.id)) {
        assignScreenShareButton(screenshareobj.button.shareButton);
        hideScreenInstallButton();
        showScreenShareButton();
    } else {
        createScreenShareButton();
    }
}

/**
 * create Screen share Button
 * @method
 * @name createScreenshareButton
 */
function createScreenshareButton(screenshareobj) {
    screenShareButton = document.createElement("span");
    screenShareButton.className = screenshareobj.button.shareButton.class_off;
    screenShareButton.innerHTML = screenshareobj.button.shareButton.html_off;
    screenShareButton.id = "screenShareButton";
    screenShareButton.onclick = function (event) {
        if (screenShareButton.className == screenshareobj.button.shareButton.class_off) {
            let time = new Date().getUTCMilliseconds();
            screenRoomid = "screenshare" + "_" + sessionid + "_" + time;
            webrtcdevSharescreen(screenRoomid);
            screenShareButton.className = screenshareobj.button.shareButton.class_on;
            screenShareButton.innerHTML = screenshareobj.button.shareButton.html_on;
        } else if (screenShareButton.className == screenshareobj.button.shareButton.class_on) {
            screenShareButton.className = screenshareobj.button.shareButton.class_off;
            screenShareButton.innerHTML = screenshareobj.button.shareButton.html_off;
            webrtcdevStopShareScreen();
        } else {
            webrtcdev.log("[screenshare js] createScreenshareButton , classname is neither on nor off", screenShareButton.className);
        }
    };
    let li = document.createElement("li");
    li.appendChild(screenShareButton);
    getElementById("topIconHolder_ul").appendChild(li);
    return screenShareButton;
}


/**
 * If button id are present then assign sreen share button or creatr a new one
 * @method
 * @name assignScreenShareButton
 * @param {json} scrshareBtn
 */
function assignScreenShareButton(scrshareBtn) {
    webrtcdev.log("assignScreenShareButton", scrshareBtn);
    let button = getElementById(scrshareBtn.id);

    button.onclick = function (event) {
        if (button.className == scrshareBtn.class_off) {
            let time = new Date().getUTCMilliseconds();
            screenRoomid = "screenshare" + "_" + sessionid + "_" + time;
            // after posting message to obtain source Id from chrome extension wait for response
            webrtcdevSharescreen(screenRoomid);
            button.className = scrshareBtn.class_on;
            button.innerHTML = scrshareBtn.html_on;
            //f(debug) getElementById(button.id+"buttonstatus").innerHTML("Off");
        } else if (button.className == scrshareBtn.class_on) {
            button.className = scrshareBtn.class_off;
            button.innerHTML = scrshareBtn.html_off;
            webrtcdevStopShareScreen();
            //if(debug) getElementById(button.id+"buttonstatus").innerHTML("On");
        } else {
            webrtcdev.warn("[screenshare js] createScreenshareButton,classname neither on nor off", scrshareBtn.className);
        }
    }
    return button;
}

var counterBeforeFailureNotice = 0;

function screenshareNotification(message, type) {

    if (getElementById("alertBox")) {

        getElementById("alertBox").innerHTML = "";

        if (type == "screenshareBegin") {

            let alertDiv = document.createElement("div");
            resetAlertBox();
            alertDiv.className = "alert alert-info";
            alertDiv.innerHTML = '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + "You have begun sharing screen , waiting for peer to view";
            getElementById("alertBox").appendChild(alertDiv);

            setTimeout(function () {
                let alertDiv = document.createElement("div");
                resetAlertBox();
                alertDiv.className = "alert alert-danger";
                alertDiv.innerHTML = '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + "Peer was not able to view screen , please retry";
                getElementById("alertBox").appendChild(alertDiv);
            }, 20000);

        } else if (type == "screenshareStartedViewing") {

            // let alertDiv = document.createElement("div");
            // resetAlertBox();
            // alertDiv.className = "alert alert-success";
            // alertDiv.innerHTML = '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + "Peer has started viewing screen ";
            // getElementById("alertBox").appendChild(alertDiv);

        } else if (type == "screenshareError") {

            let alertDiv = document.createElement("div");
            resetAlertBox();
            alertDiv.className = "alert alert-danger";
            alertDiv.innerHTML = '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + "There was a error while sharing screen , please contact support ";
            getElementById("alertBox").appendChild(alertDiv);

        } else {
            // Handle these msgs too : TBD
        }

    } else {
        alert(message);
    }
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*
 * Assign Screen Record Button based on screenrecordobj widget
 * @method
 * @name assignScreenRecordButton
 */
function assignScreenRecordButton(screenrecordobj) {

    let recordButton = document.getElementById(screenrecordobj.button.id);

    recordButton.onclick = function () {
        if (recordButton.className == screenrecordobj.button.class_on) {

            recordButton.className = screenrecordobj.button.class_off;
            recordButton.innerHTML = screenrecordobj.button.html_off;
            //recordButton.disabled=true;
            webrtcdevRecordScreen();

        } else if (recordButton.className == screenrecordobj.button.class_off) {

            // var peerinfo;
            // if (selfuserid)
            //     peerinfo = findPeerInfo(selfuserid);
            // else
            //     peerinfo = findPeerInfo(rtcConn.userid);

            recordButton.className = screenrecordobj.button.class_on;
            recordButton.innerHTML = screenrecordobj.button.html_on;
            webrtcdevStopRecordScreen();

            // stopRecord(peerinfo , scrrecordStreamid, scrrecordStream , scrrecordAudioStreamid, scrrecordAudioStream);

            // var scrrecordStreamBlob;
            // var scrrecordAudioStreamBlob;

            // var recorder1 = listOfRecorders[scrrecordStreamid];
            // recorder1.stopRecording(function() {
            //     scrrecordStreamBlob = recorder1.getBlob();
            // });

            // var recorder2 = listOfRecorders[scrrecordAudioStreamid];
            // recorder2.stopRecording(function() {
            //     scrrecordAudioStreamBlob = recorder2.getBlob();
            // });

            // setTimeout(function(){

            //     webrtcdev.log(" ===blobs====", scrrecordStreamBlob , scrrecordAudioStreamBlob);
            //     mergeStreams(scrrecordStreamBlob , scrrecordAudioStreamBlob);
            //     //convertStreams(scrrecordStreamBlob , scrrecordAudioStreamBlob);

            //     scrrecordStreamid = null;
            //     scrrecordStream = null ;

            //     scrrecordAudioStreamid = null;
            //     scrrecordAudioStream = null ;

            //     //recordButton.disabled=false;

            //  }, 5000);

        }
    };
}

/*function assignScreenRecordButton(){

    var recordButton = document.getElementById(screenrecordobj.button.id);
    webrtcdev.log(" -------recordButton---------" , recordButton);
    recordButton.onclick = function() {
        if(recordButton.className==screenrecordobj.button.class_off){
            alert(" start recording screen + audio ");

            var elementToShare = document.getElementById("parentDiv");

            var canvas2d = document.createElement('canvas');
            canvas2d.setAttribute("style","z-index:-1");
            canvas2d.id="screenrecordCanvas";

            var context = canvas2d.getContext('2d');

            canvas2d.width = elementToShare.clientWidth;
            canvas2d.height = elementToShare.clientHeight;

            canvas2d.style.top = 0;
            canvas2d.style.left = 0;

            (document.body || document.documentElement).appendChild(canvas2d);

            var isRecordingStarted = false;
            var isStoppedRecording = false;

            (function looper() {
                if(!isRecordingStarted) {
                    return setTimeout(looper, 500);
                }

                html2canvas(elementToShare, {
                    grabMouse: true,
                    onrendered: function(canvas) {
                        context.clearRect(0, 0, canvas2d.width, canvas2d.height);
                        context.drawImage(canvas, 0, 0, canvas2d.width, canvas2d.height);

                        if(isStoppedRecording) {
                            return;
                        }

                        setTimeout(looper, 1);
                    }
                });
            })();

            recorder = RecordRTC(canvas2d, {
                type: 'canvas'
            });

            recordButton.className= screenrecordobj.button.class_on ;
            recordButton.innerHTML= screenrecordobj.button.html_on;

            recorder.startRecording();

            isStoppedRecording = false;
            isRecordingStarted = true;

        }else if(recordButton.className==screenrecordobj.button.class_on){
            alert(" stoppped recording screen + audio ");

            var elem = document.getElementById("screenrecordCanvas");
            elem.parentNode.removeChild(elem);

            recordButton.className= screenrecordobj.button.class_off ;
            recordButton.innerHTML= screenrecordobj.button.html_off;

            isStoppedRecoridng = true;

            recorder.stopRecording(function() {
                var blob = recorder.getBlob();
                var videoURL=URL.createObjectURL(blob);
                var uuid= guid();
                var recordVideoname= "screenrecorded"+ Math.floor(new Date() / 1000);
                var peerinfo=findPeerInfo( selfuserid);
                displayList(uuid , peerinfo , videoURL, recordVideoname , "videoScreenRecording");
                displayFile(uuid , peerinfo , videoURL, recordVideoname , "videoScreenRecording");
            });

        }
    };
}*/

/*function createScreenRecordButton(){

    var recordButton= document.createElement("span");
    recordButton.className= screenrecordobj.button.class_off ;
    recordButton.innerHTML= screenrecordobj.button.html_off;
    recordButton.onclick = function() {
        if(recordButton.className==screenrecordobj.button.class_off){

            var element = document.body;
            recorder = RecordRTC(element, {
                type: 'canvas',
                showMousePointer: true
            });

            var canvas2d = document.createElement('canvas');
            canvas2d.id="screenrecordCanvas";
            canvas2d.setAttribute("style","z-index:-1");
            var context = canvas2d.getContext('2d');

            canvas2d.style.top = 0;
            canvas2d.style.left = 0;

            (document.body || document.documentElement).appendChild(canvas2d);

            var isRecordingStarted = false;
            var isStoppedRecording = false;

            (function looper() {
                if(!isRecordingStarted) {
                    return setTimeout(looper, 500);
                }

                html2canvas(elementToShare, {
                    grabMouse: true,
                    onrendered: function(canvas) {
                        context.clearRect(0, 0, canvas2d.width, canvas2d.height);
                        context.drawImage(canvas, 0, 0, canvas2d.width, canvas2d.height);

                        if(isStoppedRecording) {
                            return;
                        }

                        setTimeout(looper, 1);
                    }
                });
            })();

            recorder = RecordRTC(canvas2d, {
                type: 'canvas'
            });

            recordButton.className= screenrecordobj.button.class_on ;
            recordButton.innerHTML= screenrecordobj.button.html_on;
            recorder.startRecording();

            isStoppedRecording = false;
            isRecordingStarted = true;

            setTimeout(function() {
                recordButton.disabled = false;
            }, 500);

        }else if(recordButton.className==screenrecordobj.button.class_on){
            recordButton.className= screenrecordobj.button.class_off ;
            recordButton.innerHTML= screenrecordobj.button.html_off;

            isStoppedRecoridng = true;

            recorder.stopRecording(function() {
                var elem = document.getElementById("screenrecordCanvas");
                elem.parentNode.removeChild(elem);

                var blob = recorder.getBlob();
                var video = document.createElement('video');
                video.src = URL.createObjectURL(blob);
                video.setAttribute('style', 'height: 100%; position: absolute; top:0;');
                document.body.appendChild(video);
                video.controls = true;
                video.play();
            });

        }
    };

    //webrtcUtils.enableLogs = false;

    var li =document.createElement("li");
    li.appendChild(recordButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}*/


/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */
/*
 * creates chat button DOM
 * @method
 * @name createChatButton
 * @param {json} chat widget object
 */
function createChatButton(obj) {
    var button = document.createElement("span");
    button.className = chatobj.button.class_on;
    button.innerHTML = chatobj.button.html_on;
    button.onclick = function () {
        if (button.className == chatobj.button.class_off) {
            hideelem(chatobj.container.id);
            button.className = chatobj.button.class_on;
            button.innerHTML = chatobj.button.html_on;
        } else if (button.className == chatobj.button.class_on) {
            showelem(chatobj.container.id)
            button.className = chatobj.button.class_off;
            button.innerHTML = chatobj.button.html_off;
        }
    };

    var li = document.createElement("li");
    li.appendChild(button);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/*function assignChatButton(chatobj){
    var button= document.getElementById(chatobj.button.id);
    button.onclick = function() {
        if(button.className==chatobj.button.class_off){
            document.getElementById(chatobj.chatContainer).hidden=true;
            button.className=chatobj.button.class_on;
            button.innerHTML= chatobj.button.html_on;
        }else if(button.className==chatobj.button.class_on){
            document.getElementById(chatobj.chatContainer).hidden=false;
            button.className=chatobj.button.class_off;
            button.innerHTML= chatobj.button.html_off;
        }
    };
}*/


/*
 * creates chat box DOM
 * @method
 * @name createChatBox
 * @param {json} chat widget object
 */
function createChatBox(obj) {

    var mainInputBox = document.createElement("div");

    let chatInput = document.createElement("input");
    chatInput.setAttribute("type", "text");
    chatInput.className = "form-control chatInputClass";
    chatInput.id = "chatInput";
    chatInput.onkeypress = function (e) {
        if (e.keyCode == 13) {
            sendChatMessage(chatInput.value);
            chatInput.value = "";
        }
    };

    let chatButton = document.createElement("span");
    chatButton.className = "btn btn-primary";
    chatButton.innerHTML = "Enter";
    chatButton.onclick = function () {
        let chatInput = document.getElementById("chatInput");
        sendChatMessage(chatInput.value);
        chatInput.value = "";
    };

    let whoTyping = document.createElement("div");
    whoTyping.className = "whoTypingClass";
    whoTyping.id = "whoTyping";

    mainInputBox.appendChild(chatInput);
    mainInputBox.appendChild(chatButton);
    mainInputBox.appendChild(whoTyping);
    document.getElementById(chatobj.container.id).appendChild(mainInputBox);

    let chatBoard = document.createElement("div");
    chatBoard.className = "chatMessagesClass";
    chatBoard.setAttribute("contenteditable", true);
    chatBoard.id = chatobj.chatBox.id;
    document.getElementById(chatobj.container.id).appendChild(chatBoard);
}


/*
 * Assigns chat DOM
 * @method
 * @name assignChatBox
 * @param {json} chat widget object
 */
function assignChatBox(obj) {

    var chatInput = document.getElementById(chatobj.inputBox.text_id);
    chatInput.onkeypress = function (e) {
        if (e.keyCode == 13) {
            var peerinfo = findPeerInfo(selfuserid);
            webrtcdev.log(" chat ", selfuserid, peerinfo);
            sendChatMessage(chatInput.value, peerinfo);
            chatInput.value = "";
        }
    };

    if (document.getElementById(chatobj.inputBox.sendbutton_id)) {
        var chatButton = document.getElementById(chatobj.inputBox.sendbutton_id);
        chatButton.onclick = function (e) {

            var peerinfo = findPeerInfo(selfuserid);
            var chatInput = document.getElementById(chatobj.inputBox.text_id);
            sendChatMessage(chatInput.value, peerinfo);
            chatInput.value = "";
        }
    }

    if (document.getElementById(chatobj.inputBox.minbutton_id)) {
        var button = document.getElementById(chatobj.inputBox.minbutton_id);
        button.onclick = function (e) {
            if (document.getElementById(chatobj.container.id).hidden)
                showelem(chatobj.container.id);
            else
                hideelem(chatobj.container.id);
        }
    }
}


/*
 * diaplys Who is typing
 * @method
 * @name updateWhotyping
 * @param {string} data
 */
function updateWhotyping(data) {
    document.getElementById("whoTyping").innerHTML = data;
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * Sync draw boads opening between all peers
 * @method
 * @name syncDrawBoard
 * @param {json} bdata
 */
function syncDrawBoard(bdata){
    if(document.getElementById(bdata.button.id)){
        document.getElementById(bdata.button.id).click();
    }else{
        webrtcdev.error("[draw dom modifier] Received sync board event but no button id found");
    }
}

/**
 * Create a draw button
 * @method
 * @name createdrawButton
 * @param {json} drawCanvasobj
 */
function createdrawButton(drawCanvasobj){
    let drawButton= document.createElement("span");
    drawButton.className = drawCanvasobj.button.class_off ;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className==drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            alert(" Draw Board Opened ");
            drawButton.className= drawCanvasobj.button.class_on ;
            drawButton.innerHTML= drawCanvasobj.button.html_on;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=false;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");

            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=false;
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                var bdata={
                    event : "open",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:bdata});
            }else{
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
            webrtcdevCanvasDesigner(drawCanvasobj);

        }else if(drawButton.className==drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=true;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");

            if(document.getElementById(drawCanvasobj.drawCanvasContainer))
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=true;
            else
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");


        }
    };
    var li =document.createElement("li");
    li.appendChild(drawButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/**
 * Assign a draw button
 * @method
 * @name assigndrawButton
 * @param {json} drawCanvasobj
 */
function assigndrawButton(drawCanvasobj){
    webrtcdev.log("[draw] dom modifier] drawCanvasobj ", drawCanvasobj);
    let drawButton = document.getElementById(drawCanvasobj.button.id);
    drawButton.className = drawCanvasobj.button.class_off;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className == drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            showelem(drawCanvasobj.container.id);
            webrtcdev.log("[draw dom modifier] Draw Board Opened ");
            drawButton.className = drawCanvasobj.button.class_on ;
            drawButton.innerHTML = drawCanvasobj.button.html_on;

            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                showelem(drawCanvasobj.drawCanvasContainer);
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                openDrawBoard();
            }else{
                webrtcdev.error("[drawjs] canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
        }else if(drawButton.className == drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            webrtcdev.log("[draw dom modifier] Draw Board Closed ");
            hideelem(drawCanvasobj.container.id);
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                hideelem(drawCanvasobj.drawCanvasContainer);
                closeDrawBoard();
            }else
                webrtcdev.error("[drawjs] canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
        }
    };
}

/**
 * Create a save button for canvas
 * @method
 * @name saveButtonCanvas
 * @param {json} bdata
 */
var saveButtonCanvas = document.createElement("div");
saveButtonCanvas.id = "saveButtonCanvasDraw";
saveButtonCanvas.setAttribute("data-toggle","modal");
saveButtonCanvas.setAttribute("data-target","#saveModal");
saveButtonCanvas.onclick=function(){
    createModalPopup( "blobcanvas" );
};
document.body.appendChild(saveButtonCanvas);

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * function to activateButtons
 * @name activateButtons
 */
function activateButtons(timerobj) {
    if (timerobj.container.minbutton_id && getElementById(timerobj.container.minbutton_id)) {
        var button = getElementById(timerobj.container.minbutton_id);
        button.onclick = function (e) {
            if (getElementById(timerobj.container.id).hidden)
                getElementById(timerobj.container.id).hidden = false;
            else
                getElementById(timerobj.container.id).hidden = true;
        }
    }
}


/**
 * function to start forward increasing session timer
 * @method
 * @name startForwardTimer
 */
function startForwardTimer() {
    webrtcdev.log("[timerjs] startForwardTimer");
    var cd = secs;
    var cdm = mins;
    var c = parseInt(cd.innerHTML, 10);
    var m = parseInt(cdm.innerHTML, 10);
    ftimer(cd, c, cdm, m);
}

/**
 * function to start backward decreasing session timer
 * @method
 * @name startBackwardTimer
 */
function startBackwardTimer() {
    webrtcdev.log("[timerjs] startBackwardTimer", hours, mins, secs);
    let cd = secs;
    let cdm = mins;
    let c = parseInt(cd.innerHTML, 10);
    let m = parseInt(cdm.innerHTML, 10);
    //alert(" Time for session validy is "+m +" minutes :"+ c+ " seconds");
    btimer(cd, c, cdm, m);
}

/**
 * function to start backward decreasing session timer
 * @method
 * @name Timer
 * @param {cd} timerobj
 * @param {c} timerobj
 * @param {cdm} timerobj
 * @param {m} timerobj
 */
function ftimer(cd, c, cdm, m) {
    var interv = setInterval(function () {
        c++;
        secs.innerHTML = c;

        if (c == 60) {
            c = 0;
            m++;
            mins.innerHTML = m;
        }
    }, 1000);
}

function btimer(cd, c, cdm, m) {
    var interv = setInterval(function () {
        c--;
        secs.innerHTML = c;

        if (c == 0) {
            c = 60;
            m--;
            mins.innerHTML = m;
            if (m < 0) {
                clearInterval(interv);
                //alert("time over");
            }
        }
    }, 1000);
}

/**
 * function to show time zone at local time zone area
 * @method
 * @name showTimeZone
 */
function showTimeZone() {
    if (timerobj.span.currentTimeZone && getElementByName(timerobj.span.currentTimeZone)) {
        let timerzonelocal = getElementByName(timerobj.span.currentTimeZone);
        timerzonelocal.innerHTML = timeZone();
    } else {
        webrtcdev.error(" [timer js ] timerobj.span.currentTimeZone DOM doesnt exist ");
    }
}


/**
 * function to show time zone at local time zone area
 * @method
 * @name showTimeZone
 */
function showRemoteTimeZone(peerinfo) {
    if (getElementById("remoteTimeZone_" + peerinfo.userid))
        return;
    for (x in timerobj.span.remoteTimeZone) {
        let y = x + 1;
        if (y > webcallpeers.length) return;
        let timerspanpeer;
        if (timerobj.span.remoteTimeZone[x]) {
            webrtcdev.info(" [timer js] showRemoteTimeZone -timerobj.span.remoteTimeZone", timerobj.span.remoteTimeZone[x], " exist for remote");
            timerspanpeer = getElementByName(timerobj.span.remoteTimeZone[x]);
        } else {
            webrtcdev.info(" [timer js] showRemoteTimeZone -timerobj.span.remoteTimeZone getting created for local and remotes");
            timerspanpeer = document.createElement("li");
        }
        timerspanpeer.id = "remoteTimeZone_" + peerinfo.userid;
        timerspanpeer.innerHTML = peerinfo.zone + " , ";
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
    } catch (err) {
        webrtcdev.error("[timer js ]", err);
    }
}

/**
 * creates and appends remotetimecontainer belonging to userid to parentTimecontainer
 * @method
 * @name createRemotetimeArea
 */
function createRemotetimeArea(userid) {
    let remotetimecontainer = document.createElement("ul");
    remotetimecontainer.id = "remoteTimerArea_" + userid;
    var peerinfo = findPeerInfo(userid);
    if (getElementById(peerinfo.videoContainer)) {
        var parentTimecontainer = getElementById(peerinfo.videoContainer).parentNode;
        parentTimecontainer.appendChild(remotetimecontainer);
        return remotetimecontainer;
    } else {
        return null;
    }
}

/**
 * creates and appends remotetimespan
 * @method
 * @name showRemoteTimer
 */
function showRemoteTimer(peerinfo) {
    let options = {
        // year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
        timeZone: peerinfo.zone
    };

    let timerspanpeer;

    if (timerobj.span.remoteTime[x]) {
        webrtcdev.info(" [timer js] startPeersTime - timerobj.span.remoteTime dom ", timerobj.span.remoteTime[x], " exist for remotes");
        timerspanpeer = getElementByName(timerobj.span.remoteTime[x]);
        timerspanpeer.id = "remoteTime_" + peerinfo.userid;
        timerspanpeer.innerHTML = new Date().toLocaleString('en-US', options);

    } else {
        // create the timer for p2p and conferences
        webrtcdev.info(" timerobj.span.remoteTime - timerobj.span.remoteTime dom  ", timerobj.span.remoteTime[x], " does not exist, creating it");

        if (getElementById("remoteTimeDate_" + peerinfo.userid))
            return;

        timerspanpeer = document.createElement("span");
        timerspanpeer.id = "remoteTime_" + peerinfo.userid;
        timerspanpeer.innerHTML = new Date().toLocaleString('en-US', options);

        var remotetimecontainer;
        if (!getElementById("remoteTimerArea_" + peerinfo.userid)) {
            remotetimecontainer = createRemotetimeArea(peerinfo.userid);
        } else {
            remotetimecontainer = getElementById("remoteTimerArea_" + peerinfo.userid);
        }
        remotetimecontainer.appendChild(timerspanpeer);
    }
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                        stats JS                                                   */
/*-----------------------------------------------------------------------------------*/

function getStats(mediaStreamTrack, callback, interval) {
    var peer = this;
    if (arguments[0] instanceof RTCMultiConnection) {
        peer = arguments[0];
        
        if(!!navigator.mozGetUserMedia) {
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
        _getStats(function(results) {
            var result = {
                audio: {},
                video: {},
                results: results,
                nomore: function() {
                    nomore = true;
                }
            };

            for (var i = 0; i < results.length; ++i) {
                var res = results[i];

                if(res.datachannelid && res.type === 'datachannel') {
                    result.datachannel = {
                        state: res.state // open or connecting
                    }
                }

                if(res.type === 'googLibjingleSession') {
                    result.isOfferer = res.googInitiator;
                }

                if(res.type == 'googCertificate') {
                    result.encryption = res.googFingerprintAlgorithm;
                }

                if (res.googCodecName == 'opus' && res.bytesSent) {
                    var kilobytes = 0;
                    if(!!res.bytesSent) {
                        if (!globalObject.audio.prevBytesSent) {
                            globalObject.audio.prevBytesSent = res.bytesSent;
                        }

                        var bytes = res.bytesSent - globalObject.audio.prevBytesSent;
                        globalObject.audio.prevBytesSent = res.bytesSent;

                        kilobytes = bytes / 1024;
                    }

                    if(!result.audio) {
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
                    if(!!res.bytesSent) {
                        if (!globalObject.video.prevBytesSent) {
                            globalObject.video.prevBytesSent = res.bytesSent;
                        }

                        var bytes = res.bytesSent - globalObject.video.prevBytesSent;
                        globalObject.video.prevBytesSent = res.bytesSent;

                        kilobytes = bytes / 1024;
                    }

                    if(!result.video) {
                        result.video = res;
                    }

                    result.video.availableBandwidth = kilobytes.toFixed(1);

                    if(res.googFrameHeightReceived && res.googFrameWidthReceived) {
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

                if(res.type === 'localcandidate') {
                    if(!result.connectionType) {
                        result.connectionType = {};
                    }

                    result.connectionType.local = {
                        candidateType: res.candidateType,
                        ipAddress: res.ipAddress + ':' + res.portNumber,
                        networkType: res.networkType/* || systemNetworkType */ || 'unknown',
                        transport: res.transport
                    }
                }

                if(res.type === 'remotecandidate') {
                    if(!result.connectionType) {
                        result.connectionType = {};
                    }
                    
                    result.connectionType.local = {
                        candidateType: res.candidateType,
                        ipAddress: res.ipAddress + ':' + res.portNumber,
                        networkType: res.networkType || systemNetworkType,
                        transport: res.transport
                    }
                }
            }

            try {
                if(peer.iceConnectionState.search(/failed|closed/gi) !== -1) {
                    nomore = true;
                }
            }
            catch(e) {
                nomore = true;
            }

            if(nomore === true) {
                if(result.datachannel) {
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
        webrtcdev.log( "peer " , peer);
        if(!peer.getStats()) return;

        if (!!navigator.mozGetUserMedia) {
            peer.getStats(
                mediaStreamTrack,
                function(res) {
                    var items = [];
                    res.forEach(function(result) {
                        items.push(result);
                    });
                    cb(items);
                },
                cb
            );
        } else {
            peer.getStats(function(res) {
                var items = [];
                res.result().forEach(function(result) {
                    var item = {};
                    result.names().forEach(function(name) {
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
    };
}

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

if(typeof window !== 'undefined') {
    window.getStats = getStats;
}



function activateBandwidthButtons(timerobj){
    if(document.getElementById("minimizeBandwidthButton")){
        var button= document.getElementById("minimizeBandwidthButton");
        button.onclick=function(e){
            if(document.getElementById("bandwidthContainer").hidden)
                document.getElementById("bandwidthContainer").hidden=false;
            else
                document.getElementById("bandwidthContainer").hidden=true;
        }  
    }
}

/**
 * shows status of ongoing webrtc call
 * @method
 * @name showStatus
 * @param {obj} conn
 */
function showStatus(){
    getStats(rtcConn, function(result) {
        webrtcdev.info("[stats]",result.connectionType.remote.ipAddress);
        webrtcdev.info("[stats]",result.connectionType.remote.candidateType);
        webrtcdev.info("[stats]",result.connectionType.transport);
    } , 10000);
    webrtcdev.info("[stats] WebcallPeers " , webcallpeers);
}

/**
 * shows stats of ongoing webrtc call 
 * @method
 * @name showStatus
 * @param {obj} conn
 */
function showRtpstats(){
    try{
        for( x=0; x<rtcConn.peers.getLength(); x++){
            var pid =  rtcConn.peers.getAllParticipants()[x];
            var arg = JSON.stringify(rtcConn.peers[pid] , undefined, 2);
            document.getElementById(statisticsobj.statsConainer).innerHTML += "<pre >"+ arg + "</pre>";        
        }
    }catch(e){
        webrtcdev.error("[stats] rtpstats" , e);
    }

}

/*
 * shows rtc conn of ongoing webrtc call 
 * @method
 * @name showRtcConn
 */
this.showRtcConn = function(){
    if(rtcConn){
        webrtcdev.info(" =========================================================================");
        webrtcdev.info("[stats] rtcConn : " , rtcConn);
        webrtcdev.info("[stats] rtcConn.peers.getAllParticipants() : " , rtcConn.peers.getAllParticipants());
        webrtcdev.info(" =========================================================================");
    }else{
        webrtcdev.debug(" rtcConn doesnt exist ");
    }
}

/*
 * shows rtcp capabilities of transceivers webrtc call 
 * @method
 * @name showRTCPcapabilities
 * @param {obj} conn
 */
function showRTCPcapabilities(){
    let str = ""; 
    str += RTCRtpSender.getCapabilities('audio');
    str += RTCRtpSender.getCapabilities('video');

    str += RTCRtpSender.getCapabilities('audio');
    str += RTCRtpSender.getCapabilities('video');

    document.getElementById(statisticsobj.statsConainer).innerHTML += "<pre >"+ str + "</pre>";    
}


/*
check MediaStreamTrack
    MediaTrackSupportedConstraints, 
    MediaTrackCapabilities, 
    MediaTrackConstraints 
    MediaTrackSettings
*/
function getstatsMediaDevices(){
    webrtcdev.log("[stats] getSupportedConstraints - " , navigator.mediaDevices.getSupportedConstraints());
}



/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**************************************************************
 Screenshare
 ****************************************************************/

var sourceId, screen_constraints, screenStreamId;
var isFirefox = typeof window.InstallTrigger !== 'undefined';
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isChrome = !!window.chrome && !isOpera;
// var isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);

var screenCallback;
var iceServers = [];
var signaler, screen, screenRoomid;
var screenShareStreamLocal = null;


/**
 * function set up Srcreens share session RTC peer connection
 * @method
 * @name webrtcdevPrepareScreenShare
 * @param {function} callback
 */
function webrtcdevPrepareScreenShare(screenRoomid) {

    localStorage.setItem("screenRoomid ", screenRoomid);
    webrtcdev.log("[screenshare JS] webrtcdevPrepareScreenShare - screenRoomid : ", screenRoomid);
    webrtcdev.log("[screenshare JS] webrtcdevPrepareScreenShare - filling up iceServers : ", turn, webrtcdevIceServers);

    scrConn = new RTCMultiConnection(),
        scrConn.channel = screenRoomid,
        scrConn.socketURL = location.hostname + ":8085/" ,
        scrConn.session = {
            screen: true,
            oneway: true
        },
        scrConn.sdpConstraints.mandatory = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: true
        },
        // scrConn.dontCaptureUserMedia = false,

        scrConn.onMediaError = function (error, constraints) {
            webrtcdev.error(error, constraints);
            shownotificationWarning(error.name);
        },

        scrConn.onstream = function (event) {
            webrtcdev.log("[screenshareJS] on stream in _screenshare :", event);

            if (debug) {
                let nameBox = document.createElement("span");
                nameBox.innerHTML = "<br/>" + screenRoomid + "<br/>";
                getElementById(screenshareobj.screenshareContainer).appendChild(nameBox);
            }

            if (event.type == "remote" && event.type != "local") {
                // Remote got screen share stream
                shownotificationWarning("started streaming remote's screen");
                webrtcdev.log("[screensharejs] on stream remote ");

                if (event.stream.streamid) {
                    webrtcdev.log("remote screen event.stream.streamId " + event.stream.streamId);
                    screenStreamId = event.stream.streamid;
                } else if (event.streamid) {
                    webrtcdev.log("remote screen event.streamid " + event.streamid);
                    screenStreamId = event.streamid;
                }

                let video = document.createElement('video');
                let stream = event.stream;
                attachMediaStream(video, stream);
                //video.id = peerInfo.videoContainer;
                console.log("========================= getElementById screenshareobj.screenshareContainer ", getElementById(screenshareobj.screenshareContainer));
                getElementById(screenshareobj.screenshareContainer).appendChild(video);
                showelem(screenshareobj.screenshareContainer);
                rtcConn.send({
                    type: "screenshare",
                    screenid: screenRoomid,
                    message: "screenshareStartedViewing"
                });

            } else {
                // Local got screen share stream
                shownotificationWarning("started streaming local screen");
                webrtcdev.log("[screenshareJS] on stream local ");
                rtcConn.send({
                    type: "screenshare",
                    screenid: screenRoomid,
                    screenStreamid: screenStreamId,
                    message: "startscreenshare"
                });
            }

            //createScreenViewButton();

            // Event Listener for Screen share stream started
            window.dispatchEvent(new CustomEvent('webrtcdev', {
                detail: {
                    servicetype: "screenshare",
                    action: "onScreenShareStarted"
                }
            }));
        },

        scrConn.onstreamended = function (event) {
            if (event)
                webrtcdev.log("[screenshare JS] onstreamended -", event);

            let screenShareButton = screenshareobj.button.shareButton.id;
            if (screenShareButton && document.getElementById(screenShareButton)) {
                document.getElementById(screenShareButton).className = screenshareobj.button.shareButton.class_off;
                document.getElementById(screenShareButton).innerHTML = screenshareobj.button.shareButton.html_off;
            }
            //removeScreenViewButton();

            // event listener for Screen share stream ended
            window.dispatchEvent(new CustomEvent('webrtcdev', {
                detail: {
                    servicetype: "screenshare",
                    action: "onScreenShareEnded"
                }
            }));
        },

        scrConn.onopen = function (event) {
            webrtcdev.log("[screensharejs] scrConn onopen - ", scrConn.connectionType);
        },

        scrConn.onerror = function (err) {
            webrtcdev.error("[screensharejs] scrConn error - ", err);
        },

        scrConn.onEntireSessionClosed = function (event) {
            webrtcdev.log("[screensharejs] scrConn onEntireSessionClosed - ", event);
        },

        scrConn.socketMessageEvent = 'scrRTCMultiConnection-Message',
        scrConn.socketCustomEvent = 'scrRTCMultiConnection-Custom-Message';

    if (turn && turn != 'none') {
        if (!webrtcdevIceServers) {
            webrtcdev.error("[screensharejs] ICE server not found yet in screenshare session");
            alert("ICE server not found yet in screenshare session ");
        }
        scrConn.iceServers = webrtcdevIceServers;
    }

    return scrConn;
}

/**
 * Prepares screenshare , send open channel and handled open channel reponse ,calls getusermedia in callback
 * @method
 * @name webrtcdevSharescreen
 */
function webrtcdevSharescreen(scrroomid) {
    webrtcdev.log("[screenshareJS] webrtcdevSharescreen, preparing screenshare by initiating ScrConn , scrroomid - ", scrroomid);

    return new Promise((resolve, reject) => {
        scrConn = webrtcdevPrepareScreenShare(scrroomid)
        resolve(scrroomid);
    })
        .then(function (scrroomid) {
            if (socket) {
                webrtcdev.log("[screenshare JS] open-channel-screenshare on - ", socket.io.uri);
                socket.emit("open-channel-screenshare", {
                    channel: scrroomid,
                    sender: selfuserid,
                    maxAllowed: 6
                });
                shownotification("Making a new session for screenshare" + scrroomid);
            } else {
                webrtcdev.error("[screenshare JS] parent socket doesnt exist ");
            }

            socket.on("open-channel-screenshare-resp", function (event) {
                webrtcdev.log("[screenshare JS] open-channel-screenshare-response -", event);
                if (event.status && event.channel == scrroomid) {
                    scrConn.open(scrroomid, function () {
                        webrtcdev.log("[screenshare JS] webrtcdevSharescreen, opened up room for screen share ");
                    });
                }
            });
        });
}

/**
 * update info about a peer in list of peers (webcallpeers)
 * @method
 * @name updatePeerInfo
 * @param {string} userid
 * @param {string} username
 * @param {string} usercolor
 * @param {string} type
 */
function connectScrWebRTC(type, scrroomid) {
    webrtcdev.log("[screenshareJS] connectScrWebRTC, first preparing screenshare by initiating ScrConn , scrroomid - ", scrroomid);

    return new Promise((resolve, reject) => {
        webrtcdevPrepareScreenShare(scrroomid)
        resolve(scrroomid);
    })
        .then(function (scrroomid) {
            webrtcdev.log("[screenshare JS] connectScrWebRTC -> ", type, scrroomid);
            if (type == "join") {
                scrConn.join(scrroomid);
                shownotification("Connected with existing Screenshare channel " + scrroomid);
            } else {
                shownotification("Connection type not found for Screenshare ");
                webrtcdev.error("[screenshare JS] connectScrWebRTC - Connection type not found for Screenshare ");
            }
        });
}

/**
 * view screen being shared
 * @method
 * @name webrtcdevViewscreen
 * @param {string} roomid
 */
function webrtcdevViewscreen(roomid) {
    scrConn.join(roomid);
}

/**
 * function stop screen share session RTC peer connection
 * @method
 * @name webrtcdevStopShareScreen
 */
function webrtcdevStopShareScreen() {
    try {

        rtcConn.send({
            type: "screenshare",
            message: "stoppedscreenshare"
        });

        scrConn.closeEntireSession();
        webrtcdev.log("[screenshare JS] Sender stopped: screenRoomid ", screenRoomid,
            "| Screen stopped ", scrConn,
            "| container ", getElementById(screenshareobj.screenshareContainer));

        if (screenShareStreamLocal) {
            screenShareStreamLocal.stop();
            screenShareStreamLocal = null;
        }

        let stream1 = scrConn.streamEvents.selectFirst()
        stream1.stream.getTracks().forEach(track => track.stop());

        webrtcdevCleanShareScreen();
    } catch (err) {
        webrtcdev.error("[screensharejs] webrtcdevStopShareScreen - ", err);
    }
}

/**
 * function clear screen share session RTC peer connection
 * @method
 * @name webrtcdevCleanShareScreen
 */
function webrtcdevCleanShareScreen(streamid) {
    try {
        scrConn.onstreamended();
        scrConn.removeStream(streamid);
        scrConn.close();
        scrConn = null;

        if (screenshareobj.screenshareContainer && getElementById(screenshareobj.screenshareContainer)) {
            getElementById(screenshareobj.screenshareContainer).innerHTML = "";
        }

    } catch (err) {
        webrtcdev.error("[screensharejs] webrtcdevStopShareScreen - ", err);
    }
}

/*
 * shows screenscre rtc conn of ongoing webrtc call 
 * @method
 * @name showScrConn
 */
this.showScrConn = function () {
    if (scrConn) {
        webrtcdev.info(" =========================================================================");
        webrtcdev.info(" srcConn : ", scrConn);
        webrtcdev.info(" srcConn.peers.getAllParticipants() : ", scrConn.peers.getAllParticipants());
        webrtcdev.info(" =========================================================================");
    } else {
        webrtcdev.debug(" Screen share is not active ");
    }
}


/**
 * Alert boxes for user if screen share isnt working
 * @method
 * @name screenshareNotification
 */
function resetAlertBox() {
    getElementById("alertBox").hidden = false;
    getElementById("alertBox").innerHTML = "";
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                        webrtc checks JS                                           */
/*-----------------------------------------------------------------------------------*/

/**
 * function to updateStats
 * @method
 * @name updateStats
 * @param {object} connection
 */
function updateStats(obj) {
    webrtcdev.info(" =============================== check Devices ==========================================");

    // Update Stats if active
    if (statisticsobj && statisticsobj.active) {
        // getStats(event.stream.getVideoTracks() , function(result) {
        //     document.getElementById("network-stats-body").innerHTML = result;        
        // } , 20000);
        document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(obj);
        document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(obj.bandwidth);
        document.getElementById(statisticsobj.statsConainer).innerHTML += JSON.stringify(obj.codecs);

        alert("detect RTC appended ");
    }

}

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

/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */// Last time updated: 2016-11-04 7:11:11 AM UTC

// ________________
// FileBufferReader

'';

(function() {

    function FileBufferReader() {
        var fbr = this;
        var fbrHelper = new FileBufferReaderHelper();

        fbr.chunks = {};
        fbr.users = {};

        fbr.readAsArrayBuffer = function(file, callback, extra) {
            var options = {
                file: file,
                earlyCallback: function(chunk) {
                    callback(fbrClone(chunk, {
                        currentPosition: -1
                    }));
                },
                extra: extra || {
                    userid: 0
                }
            };

            fbrHelper.readAsArrayBuffer(fbr, options);
        };

        fbr.getNextChunk = function(fileUUID, callback, userid) {

            /* Altanai patch for trash on file upload 
            */
            try{
                for(x in webcallpeers){
                    //console.log(" ========= fbr.getNextChunk -ids  " , userid ,  webcallpeers[x].userid , selfuserid);
                    if(webcallpeers[x].userid == selfuserid ){
                        for( y in webcallpeers[x].filearray){
                            //console.log(" ========= fbr.getNextChunk - filearray " , webcallpeers[x].filearray[y]);
                            if ( ! webcallpeers[x].filearray[y].pid){
                                console.warn("[ fbr.getNextChunk ] pid does mot exist ");
                                // return;
                            }
                            if( webcallpeers[x].filearray[y].pid.includes(fileUUID) && webcallpeers[x].filearray[y].status =="stop") {
                                // console.log("[ fbr.getNextChunk ] filename " , webcallpeers[x].filearray[y].pid , " | status " , webcallpeers[x].filearray[y].status);
                                webcallpeers[x].filearray[y].status="stopped";
                                // return;
                            }
                        }
                    }
                }
            }catch(e){
                console.log(e)
            }
            /*Altanai patch for trash file share ends 
            */
                        
            var currentPosition;

            if (typeof fileUUID.currentPosition !== 'undefined') {
                currentPosition = fileUUID.currentPosition;
                fileUUID = fileUUID.uuid;
            }

            var allFileChunks = fbr.chunks[fileUUID];
            if (!allFileChunks) {
                return;
            }

            if (typeof userid !== 'undefined') {
                if (!fbr.users[userid + '']) {
                    fbr.users[userid + ''] = {
                        fileUUID: fileUUID,
                        userid: userid,
                        currentPosition: -1
                    };
                }

                if (typeof currentPosition !== 'undefined') {
                    fbr.users[userid + ''].currentPosition = currentPosition;
                }

                fbr.users[userid + ''].currentPosition++;
                currentPosition = fbr.users[userid + ''].currentPosition;
            } else {
                if (typeof currentPosition !== 'undefined') {
                    fbr.chunks[fileUUID].currentPosition = currentPosition;
                }

                fbr.chunks[fileUUID].currentPosition++;
                currentPosition = fbr.chunks[fileUUID].currentPosition;
            }

            var nextChunk = allFileChunks[currentPosition];
            if (!nextChunk) {
                delete fbr.chunks[fileUUID];
                fbr.convertToArrayBuffer({
                    chunkMissing: true,
                    currentPosition: currentPosition,
                    uuid: fileUUID
                }, callback);
                return;
            }

            nextChunk = fbrClone(nextChunk);

            if (typeof userid !== 'undefined') {
                nextChunk.remoteUserId = userid + '';
            }

            if (!!nextChunk.start) {
                fbr.onBegin(nextChunk);
            }

            if (!!nextChunk.end) {
                fbr.onEnd(nextChunk);
            }

            fbr.onProgress(nextChunk);

            fbr.convertToArrayBuffer(nextChunk, function(buffer) {
                if (nextChunk.currentPosition == nextChunk.maxChunks) {
                    callback(buffer, true);
                    return;
                }

                callback(buffer, false);
            });
        };

        var fbReceiver = new FileBufferReceiver(fbr);

        fbr.addChunk = function(chunk, callback) {
            if (!chunk) {
                return;
            }

            fbReceiver.receive(chunk, function(chunk) {
                fbr.convertToArrayBuffer({
                    readyForNextChunk: true,
                    currentPosition: chunk.currentPosition,
                    uuid: chunk.uuid
                }, callback);
            });
        };

        fbr.chunkMissing = function(chunk) {
            delete fbReceiver.chunks[chunk.uuid];
            delete fbReceiver.chunksWaiters[chunk.uuid];
        };

        fbr.onBegin = function() {};
        fbr.onEnd = function() {};
        fbr.onProgress = function() {};

        fbr.convertToObject = FileConverter.ConvertToObject;
        fbr.convertToArrayBuffer = FileConverter.ConvertToArrayBuffer

        // for backward compatibility----it is redundant.
        fbr.setMultipleUsers = function() {};

        // extends 'from' object with members from 'to'. If 'to' is null, a deep clone of 'from' is returned
        function fbrClone(from, to) {
            if (from == null || typeof from != "object") return from;
            if (from.constructor != Object && from.constructor != Array) return from;
            if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
                from.constructor == String || from.constructor == Number || from.constructor == Boolean)
                return new from.constructor(from);

            to = to || new from.constructor();

            for (var name in from) {
                to[name] = typeof to[name] == "undefined" ? fbrClone(from[name], null) : to[name];
            }

            return to;
        }
    }

    function FileBufferReaderHelper() {
        var fbrHelper = this;

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            return worker;
        }

        fbrHelper.readAsArrayBuffer = function(fbr, options) {
            var earlyCallback = options.earlyCallback;
            delete options.earlyCallback;

            function processChunk(chunk) {
                if (!fbr.chunks[chunk.uuid]) {
                    fbr.chunks[chunk.uuid] = {
                        currentPosition: -1
                    };
                }

                options.extra = options.extra || {
                    userid: 0
                };

                chunk.userid = options.userid || options.extra.userid || 0;
                chunk.extra = options.extra;

                fbr.chunks[chunk.uuid][chunk.currentPosition] = chunk;

                if (chunk.end && earlyCallback) {
                    earlyCallback(chunk.uuid);
                    earlyCallback = null;
                }

                // for huge files
                if ((chunk.maxChunks > 200 && chunk.currentPosition == 200) && earlyCallback) {
                    earlyCallback(chunk.uuid);
                    earlyCallback = null;
                }
            }
            if (false && typeof Worker !== 'undefined') {
                var webWorker = processInWebWorker(fileReaderWrapper);

                webWorker.onmessage = function(event) {
                    processChunk(event.data);
                };

                webWorker.postMessage(options);
            } else {
                fileReaderWrapper(options, processChunk);
            }
        };

        function fileReaderWrapper(options, callback) {
            callback = callback || function(chunk) {
                postMessage(chunk);
            };

            var file = options.file;
            if (!file.uuid) {
                file.uuid = (Math.random() * 100).toString().replace(/\./g, '');
            }

            var chunkSize = options.chunkSize || 15 * 1000;
            if (options.extra && options.extra.chunkSize) {
                chunkSize = options.extra.chunkSize;
            }

            var sliceId = 0;
            var cacheSize = chunkSize;

            var chunksPerSlice = Math.floor(Math.min(100000000, cacheSize) / chunkSize);
            var sliceSize = chunksPerSlice * chunkSize;
            var maxChunks = Math.ceil(file.size / chunkSize);

            file.maxChunks = maxChunks;

            var numOfChunksInSlice;
            var currentPosition = 0;
            var hasEntireFile;
            var chunks = [];

            callback({
                currentPosition: currentPosition,
                uuid: file.uuid,
                maxChunks: maxChunks,
                size: file.size,
                name: file.name,
                type: file.type,
                lastModifiedDate: file.lastModifiedDate.toString(),
                start: true
            });

            var blob, reader = new FileReader();

            reader.onloadend = function(evt) {
                if (evt.target.readyState == FileReader.DONE) {
                    addChunks(file.name, evt.target.result, function() {
                        sliceId++;
                        if ((sliceId + 1) * sliceSize < file.size) {
                            blob = file.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize);
                            reader.readAsArrayBuffer(blob);
                        } else if (sliceId * sliceSize < file.size) {
                            blob = file.slice(sliceId * sliceSize, file.size);
                            reader.readAsArrayBuffer(blob);
                        } else {
                            file.url = URL.createObjectURL(file);
                            callback({
                                currentPosition: currentPosition,
                                uuid: file.uuid,
                                maxChunks: maxChunks,
                                size: file.size,
                                name: file.name,
                                lastModifiedDate: file.lastModifiedDate.toString(),
                                url: URL.createObjectURL(file),
                                type: file.type,
                                end: true
                            });
                        }
                    });
                }
            };

            currentPosition += 1;

            blob = file.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize);
            reader.readAsArrayBuffer(blob);

            function addChunks(fileName, binarySlice, addChunkCallback) {
                numOfChunksInSlice = Math.ceil(binarySlice.byteLength / chunkSize);
                for (var i = 0; i < numOfChunksInSlice; i++) {
                    var start = i * chunkSize;
                    chunks[currentPosition] = binarySlice.slice(start, Math.min(start + chunkSize, binarySlice.byteLength));

                    callback({
                        uuid: file.uuid,
                        buffer: chunks[currentPosition],
                        currentPosition: currentPosition,
                        maxChunks: maxChunks,

                        size: file.size,
                        name: file.name,
                        lastModifiedDate: file.lastModifiedDate.toString(),
                        type: file.type
                    });

                    currentPosition++;
                }

                if (currentPosition == maxChunks) {
                    hasEntireFile = true;
                }

                addChunkCallback();
            }
        }
    }

    function FileSelector() {
        var selector = this;

        selector.selectSingleFile = selectFile;
        selector.selectMultipleFiles = function(callback) {
            selectFile(callback, true);
        };

        selector.accept = '*.*';

        function selectFile(callback, multiple) {
            var file = document.createElement('input');
            file.type = 'file';

            if (multiple) {
                file.multiple = true;
            }

            file.accept = selector.accept;

            file.onchange = function() {
                if (multiple) {
                    if (!file.files.length) {
                        webrtcdev.error('No file selected.');
                        return;
                    }
                    callback(file.files);
                    return;
                }

                if (!file.files[0]) {
                    webrtcdev.error('No file selected.');
                    return;
                }

                callback(file.files[0]);

                file.parentNode.removeChild(file);
            };
            file.style.display = 'none';
            (document.body || document.documentElement).appendChild(file);
            fireClickEvent(file);
        }

        function fireClickEvent(element) {
            var evt = new window.MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                button: 0,
                buttons: 0,
                mozInputSource: 1
            });

            var fired = element.dispatchEvent(evt);
        }
    }

    function FileBufferReceiver(fbr) {
        var fbReceiver = this;

        fbReceiver.chunks = {};
        fbReceiver.chunksWaiters = {};

        function receive(chunk, callback) {
            if (!chunk.uuid) {
                fbr.convertToObject(chunk, function(object) {
                    receive(object);
                });
                return;
            }

            if (chunk.start && !fbReceiver.chunks[chunk.uuid]) {
                fbReceiver.chunks[chunk.uuid] = {};
                if (fbr.onBegin) fbr.onBegin(chunk);
            }

            if (!chunk.end && chunk.buffer) {
                fbReceiver.chunks[chunk.uuid][chunk.currentPosition] = chunk.buffer;
            }

            if (chunk.end) {
                var chunksObject = fbReceiver.chunks[chunk.uuid];
                var chunksArray = [];
                Object.keys(chunksObject).forEach(function(item, idx) {
                    chunksArray.push(chunksObject[item]);
                });

                var blob = new Blob(chunksArray, {
                    type: chunk.type
                });
                blob = merge(blob, chunk);
                blob.url = URL.createObjectURL(blob);
                blob.uuid = chunk.uuid;

                if (!blob.size) webrtcdev.error('Something went wrong. Blob Size is 0.');

                if (fbr.onEnd) fbr.onEnd(blob);

                // clear system memory
                delete fbReceiver.chunks[chunk.uuid];
                delete fbReceiver.chunksWaiters[chunk.uuid];
            }

            if (chunk.buffer && fbr.onProgress) fbr.onProgress(chunk);

            if (!chunk.end) {
                callback(chunk);

                fbReceiver.chunksWaiters[chunk.uuid] = function() {
                    function looper() {
                        if (!chunk.buffer) {
                            return;
                        }

                        if (!fbReceiver.chunks[chunk.uuid]) {
                            return;
                        }

                        if (chunk.currentPosition != chunk.maxChunks && !fbReceiver.chunks[chunk.uuid][chunk.currentPosition]) {
                            callback(chunk);
                            setTimeout(looper, 5000);
                        }
                    }
                    setTimeout(looper, 5000);
                };

                fbReceiver.chunksWaiters[chunk.uuid]();
            }
        }

        fbReceiver.receive = receive;
    }

    var FileConverter = {
        ConvertToArrayBuffer: function(object, callback) {
            binarize.pack(object, function(dataView) {
                callback(dataView.buffer);
            });
        },
        ConvertToObject: function(buffer, callback) {
            binarize.unpack(buffer, callback);
        }
    };

    function merge(mergein, mergeto) {
        if (!mergein) mergein = {};
        if (!mergeto) return mergein;

        for (var item in mergeto) {
            try {
                mergein[item] = mergeto[item];
            } catch (e) {}
        }
        return mergein;
    }

    var debug = false;

    var BIG_ENDIAN = false,
        LITTLE_ENDIAN = true,
        TYPE_LENGTH = Uint8Array.BYTES_PER_ELEMENT,
        LENGTH_LENGTH = Uint16Array.BYTES_PER_ELEMENT,
        BYTES_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

    var Types = {
        NULL: 0,
        UNDEFINED: 1,
        STRING: 2,
        NUMBER: 3,
        BOOLEAN: 4,
        ARRAY: 5,
        OBJECT: 6,
        INT8ARRAY: 7,
        INT16ARRAY: 8,
        INT32ARRAY: 9,
        UINT8ARRAY: 10,
        UINT16ARRAY: 11,
        UINT32ARRAY: 12,
        FLOAT32ARRAY: 13,
        FLOAT64ARRAY: 14,
        ARRAYBUFFER: 15,
        BLOB: 16,
        FILE: 16,
        BUFFER: 17 // Special type for node.js
    };

    if (debug) {
        var TypeNames = [
            'NULL',
            'UNDEFINED',
            'STRING',
            'NUMBER',
            'BOOLEAN',
            'ARRAY',
            'OBJECT',
            'INT8ARRAY',
            'INT16ARRAY',
            'INT32ARRAY',
            'UINT8ARRAY',
            'UINT16ARRAY',
            'UINT32ARRAY',
            'FLOAT32ARRAY',
            'FLOAT64ARRAY',
            'ARRAYBUFFER',
            'BLOB',
            'BUFFER'
        ];
    }

    var Length = [
        null, // Types.NULL
        null, // Types.UNDEFINED
        'Uint16', // Types.STRING
        'Float64', // Types.NUMBER
        'Uint8', // Types.BOOLEAN
        null, // Types.ARRAY
        null, // Types.OBJECT
        'Int8', // Types.INT8ARRAY
        'Int16', // Types.INT16ARRAY
        'Int32', // Types.INT32ARRAY
        'Uint8', // Types.UINT8ARRAY
        'Uint16', // Types.UINT16ARRAY
        'Uint32', // Types.UINT32ARRAY
        'Float32', // Types.FLOAT32ARRAY
        'Float64', // Types.FLOAT64ARRAY
        'Uint8', // Types.ARRAYBUFFER
        'Uint8', // Types.BLOB, Types.FILE
        'Uint8' // Types.BUFFER
    ];

    var binary_dump = function(view, start, length) {
        var table = [],
            endianness = BIG_ENDIAN,
            ROW_LENGTH = 40;
        table[0] = [];
        for (var i = 0; i < ROW_LENGTH; i++) {
            table[0][i] = i < 10 ? '0' + i.toString(10) : i.toString(10);
        }
        for (i = 0; i < length; i++) {
            var code = view.getUint8(start + i, endianness);
            var index = ~~(i / ROW_LENGTH) + 1;
            if (typeof table[index] === 'undefined') table[index] = [];
            table[index][i % ROW_LENGTH] = code < 16 ? '0' + code.toString(16) : code.toString(16);
        }
        webrtcdev.log('%c' + table[0].join(' '), 'font-weight: bold;');
        for (i = 1; i < table.length; i++) {
            webrtcdev.log(table[i].join(' '));
        }
    };

    var find_type = function(obj) {
        var type = undefined;

        if (obj === undefined) {
            type = Types.UNDEFINED;

        } else if (obj === null) {
            type = Types.NULL;

        } else {
            var const_name = obj.constructor.name;
            if (const_name !== undefined) {
                // return type by .constructor.name if possible
                type = Types[const_name.toUpperCase()];

            } else {
                // Work around when constructor.name is not defined
                switch (typeof obj) {
                    case 'string':
                        type = Types.STRING;
                        break;

                    case 'number':
                        type = Types.NUMBER;
                        break;

                    case 'boolean':
                        type = Types.BOOLEAN;
                        break;

                    case 'object':
                        if (obj instanceof Array) {
                            type = Types.ARRAY;

                        } else if (obj instanceof Int8Array) {
                            type = Types.INT8ARRAY;

                        } else if (obj instanceof Int16Array) {
                            type = Types.INT16ARRAY;

                        } else if (obj instanceof Int32Array) {
                            type = Types.INT32ARRAY;

                        } else if (obj instanceof Uint8Array) {
                            type = Types.UINT8ARRAY;

                        } else if (obj instanceof Uint16Array) {
                            type = Types.UINT16ARRAY;

                        } else if (obj instanceof Uint32Array) {
                            type = Types.UINT32ARRAY;

                        } else if (obj instanceof Float32Array) {
                            type = Types.FLOAT32ARRAY;

                        } else if (obj instanceof Float64Array) {
                            type = Types.FLOAT64ARRAY;

                        } else if (obj instanceof ArrayBuffer) {
                            type = Types.ARRAYBUFFER;

                        } else if (obj instanceof Blob) { // including File
                            type = Types.BLOB;

                        } else if (obj instanceof Buffer) { // node.js only
                            type = Types.BUFFER;

                        } else if (obj instanceof Object) {
                            type = Types.OBJECT;

                        }
                        break;

                    default:
                        break;
                }
            }
        }
        return type;
    };

    var utf16_utf8 = function(string) {
        return unescape(encodeURIComponent(string));
    };

    var utf8_utf16 = function(bytes) {
        return decodeURIComponent(escape(bytes));
    };

    /**
     * packs seriarized elements array into a packed ArrayBuffer
     * @param  {Array} serialized Serialized array of elements.
     * @return {DataView} view of packed binary
     */
    var pack = function(serialized) {
        var cursor = 0,
            i = 0,
            j = 0,
            endianness = BIG_ENDIAN;

        var ab = new ArrayBuffer(serialized[0].byte_length + serialized[0].header_size);
        var view = new DataView(ab);

        for (i = 0; i < serialized.length; i++) {
            var start = cursor,
                header_size = serialized[i].header_size,
                type = serialized[i].type,
                length = serialized[i].length,
                value = serialized[i].value,
                byte_length = serialized[i].byte_length,
                type_name = Length[type],
                unit = type_name === null ? 0 : window[type_name + 'Array'].BYTES_PER_ELEMENT;

            // Set type
            if (type === Types.BUFFER) {
                // on node.js Blob is emulated using Buffer type
                view.setUint8(cursor, Types.BLOB, endianness);
            } else {
                view.setUint8(cursor, type, endianness);
            }
            cursor += TYPE_LENGTH;

            if (debug) {
                webrtcdev.info('Packing', type, TypeNames[type]);
            }

            // Set length if required
            if (type === Types.ARRAY || type === Types.OBJECT) {
                view.setUint16(cursor, length, endianness);
                cursor += LENGTH_LENGTH;

                if (debug) {
                    webrtcdev.info('Content Length', length);
                }
            }

            // Set byte length
            view.setUint32(cursor, byte_length, endianness);
            cursor += BYTES_LENGTH;

            if (debug) {
                webrtcdev.info('Header Size', header_size, 'bytes');
                webrtcdev.info('Byte Length', byte_length, 'bytes');
            }

            switch (type) {
                case Types.NULL:
                case Types.UNDEFINED:
                    // NULL and UNDEFINED doesn't have any payload
                    break;

                case Types.STRING:
                    if (debug) {
                        webrtcdev.info('Actual Content %c"' + value + '"', 'font-weight:bold;');
                    }
                    for (j = 0; j < length; j++, cursor += unit) {
                        view.setUint16(cursor, value.charCodeAt(j), endianness);
                    }
                    break;

                case Types.NUMBER:
                case Types.BOOLEAN:
                    if (debug) {
                        webrtcdev.info('%c' + value.toString(), 'font-weight:bold;');
                    }
                    view['set' + type_name](cursor, value, endianness);
                    cursor += unit;
                    break;

                case Types.INT8ARRAY:
                case Types.INT16ARRAY:
                case Types.INT32ARRAY:
                case Types.UINT8ARRAY:
                case Types.UINT16ARRAY:
                case Types.UINT32ARRAY:
                case Types.FLOAT32ARRAY:
                case Types.FLOAT64ARRAY:
                    var _view = new Uint8Array(view.buffer, cursor, byte_length);
                    _view.set(new Uint8Array(value.buffer));
                    cursor += byte_length;
                    break;

                case Types.ARRAYBUFFER:
                case Types.BUFFER:
                    var _view = new Uint8Array(view.buffer, cursor, byte_length);
                    _view.set(new Uint8Array(value));
                    cursor += byte_length;
                    break;

                case Types.BLOB:
                case Types.ARRAY:
                case Types.OBJECT:
                    break;

                default:
                    throw 'TypeError: Unexpected type found.';
            }

            if (debug) {
                binary_dump(view, start, cursor - start);
            }
        }

        return view;
    };

    /**
     * Unpack binary data into an object with value and cursor
     * @param  {DataView} view [description]
     * @param  {Number} cursor [description]
     * @return {Object}
     */
    var unpack = function(view, cursor) {
        var i = 0,
            endianness = BIG_ENDIAN,
            start = cursor;
        var type, length, byte_length, value, elem;

        // Retrieve "type"
        type = view.getUint8(cursor, endianness);
        cursor += TYPE_LENGTH;

        if (debug) {
            webrtcdev.info('Unpacking', type, TypeNames[type]);
        }

        // Retrieve "length"
        if (type === Types.ARRAY || type === Types.OBJECT) {
            length = view.getUint16(cursor, endianness);
            cursor += LENGTH_LENGTH;

            if (debug) {
                webrtcdev.info('Content Length', length);
            }
        }

        // Retrieve "byte_length"
        byte_length = view.getUint32(cursor, endianness);
        cursor += BYTES_LENGTH;

        if (debug) {
            webrtcdev.info('Byte Length', byte_length, 'bytes');
        }

        var type_name = Length[type];
        var unit = type_name === null ? 0 : window[type_name + 'Array'].BYTES_PER_ELEMENT;

        switch (type) {
            case Types.NULL:
            case Types.UNDEFINED:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                // NULL and UNDEFINED doesn't have any octet
                value = null;
                break;

            case Types.STRING:
                length = byte_length / unit;
                var string = [];
                for (i = 0; i < length; i++) {
                    var code = view.getUint16(cursor, endianness);
                    cursor += unit;
                    string.push(String.fromCharCode(code));
                }
                value = string.join('');
                if (debug) {
                    webrtcdev.info('Actual Content %c"' + value + '"', 'font-weight:bold;');
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.NUMBER:
                value = view.getFloat64(cursor, endianness);
                cursor += unit;
                if (debug) {
                    webrtcdev.info('Actual Content %c"' + value.toString() + '"', 'font-weight:bold;');
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.BOOLEAN:
                value = view.getUint8(cursor, endianness) === 1 ? true : false;
                cursor += unit;
                if (debug) {
                    webrtcdev.info('Actual Content %c"' + value.toString() + '"', 'font-weight:bold;');
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.INT8ARRAY:
            case Types.INT16ARRAY:
            case Types.INT32ARRAY:
            case Types.UINT8ARRAY:
            case Types.UINT16ARRAY:
            case Types.UINT32ARRAY:
            case Types.FLOAT32ARRAY:
            case Types.FLOAT64ARRAY:
            case Types.ARRAYBUFFER:
                elem = view.buffer.slice(cursor, cursor + byte_length);
                cursor += byte_length;

                // If ArrayBuffer
                if (type === Types.ARRAYBUFFER) {
                    value = elem;

                    // If other TypedArray
                } else {
                    value = new window[type_name + 'Array'](elem);
                }

                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                break;

            case Types.BLOB:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                // If Blob is available (on browser)
                if (window.Blob) {
                    var mime = unpack(view, cursor);
                    var buffer = unpack(view, mime.cursor);
                    cursor = buffer.cursor;
                    value = new Blob([buffer.value], {
                        type: mime.value
                    });
                } else {
                    // node.js implementation goes here
                    elem = view.buffer.slice(cursor, cursor + byte_length);
                    cursor += byte_length;
                    // node.js implementatino uses Buffer to help Blob
                    value = new Buffer(elem);
                }
                break;

            case Types.ARRAY:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                value = [];
                for (i = 0; i < length; i++) {
                    // Retrieve array element
                    elem = unpack(view, cursor);
                    cursor = elem.cursor;
                    value.push(elem.value);
                }
                break;

            case Types.OBJECT:
                if (debug) {
                    binary_dump(view, start, cursor - start);
                }
                value = {};
                for (i = 0; i < length; i++) {
                    // Retrieve object key and value in sequence
                    var key = unpack(view, cursor);
                    var val = unpack(view, key.cursor);
                    cursor = val.cursor;
                    value[key.value] = val.value;
                }
                break;

            default:
                throw 'TypeError: Type not supported.';
        }
        return {
            value: value,
            cursor: cursor
        };
    };

    /**
     * deferred function to process multiple serialization in order
     * @param  {array}   array    [description]
     * @param  {Function} callback [description]
     * @return {void} no return value
     */
    var deferredSerialize = function(array, callback) {
        var length = array.length,
            results = [],
            count = 0,
            byte_length = 0;
        for (var i = 0; i < array.length; i++) {
            (function(index) {
                serialize(array[index], function(result) {
                    // store results in order
                    results[index] = result;
                    // count byte length
                    byte_length += result[0].header_size + result[0].byte_length;
                    // when all results are on table
                    if (++count === length) {
                        // finally concatenate all reuslts into a single array in order
                        var array = [];
                        for (var j = 0; j < results.length; j++) {
                            array = array.concat(results[j]);
                        }
                        callback(array, byte_length);
                    }
                });
            })(i);
        }
    };

    /**
     * Serializes object and return byte_length
     * @param  {mixed} obj JavaScript object you want to serialize
     * @return {Array} Serialized array object
     */
    var serialize = function(obj, callback) {
        var subarray = [],
            unit = 1,
            header_size = TYPE_LENGTH + BYTES_LENGTH,
            type, byte_length = 0,
            length = 0,
            value = obj;

        type = find_type(obj);

        unit = Length[type] === undefined || Length[type] === null ? 0 :
            window[Length[type] + 'Array'].BYTES_PER_ELEMENT;

        switch (type) {
            case Types.UNDEFINED:
            case Types.NULL:
                break;

            case Types.NUMBER:
            case Types.BOOLEAN:
                byte_length = unit;
                break;

            case Types.STRING:
                length = obj.length;
                byte_length += length * unit;
                break;

            case Types.INT8ARRAY:
            case Types.INT16ARRAY:
            case Types.INT32ARRAY:
            case Types.UINT8ARRAY:
            case Types.UINT16ARRAY:
            case Types.UINT32ARRAY:
            case Types.FLOAT32ARRAY:
            case Types.FLOAT64ARRAY:
                length = obj.length;
                byte_length += length * unit;
                break;

            case Types.ARRAY:
                deferredSerialize(obj, function(subarray, byte_length) {
                    callback([{
                        type: type,
                        length: obj.length,
                        header_size: header_size + LENGTH_LENGTH,
                        byte_length: byte_length,
                        value: null
                    }].concat(subarray));
                });
                return;

            case Types.OBJECT:
                var deferred = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        deferred.push(key);
                        deferred.push(obj[key]);
                        length++;
                    }
                }
                deferredSerialize(deferred, function(subarray, byte_length) {
                    callback([{
                        type: type,
                        length: length,
                        header_size: header_size + LENGTH_LENGTH,
                        byte_length: byte_length,
                        value: null
                    }].concat(subarray));
                });
                return;

            case Types.ARRAYBUFFER:
                byte_length += obj.byteLength;
                break;

            case Types.BLOB:
                var mime_type = obj.type;
                var reader = new FileReader();
                reader.onload = function(e) {
                    deferredSerialize([mime_type, e.target.result], function(subarray, byte_length) {
                        callback([{
                            type: type,
                            length: length,
                            header_size: header_size,
                            byte_length: byte_length,
                            value: null
                        }].concat(subarray));
                    });
                };
                reader.onerror = function(e) {
                    throw 'FileReader Error: ' + e;
                };
                reader.readAsArrayBuffer(obj);
                return;

            case Types.BUFFER:
                byte_length += obj.length;
                break;

            default:
                throw 'TypeError: Type "' + obj.constructor.name + '" not supported.';
        }

        callback([{
            type: type,
            length: length,
            header_size: header_size,
            byte_length: byte_length,
            value: value
        }].concat(subarray));
    };

    /**
     * Deserialize binary and return JavaScript object
     * @param  ArrayBuffer buffer ArrayBuffer you want to deserialize
     * @return mixed              Retrieved JavaScript object
     */
    var deserialize = function(buffer, callback) {
        var view = buffer instanceof DataView ? buffer : new DataView(buffer);
        var result = unpack(view, 0);
        return result.value;
    };

    if (debug) {
        window.Test = {
            BIG_ENDIAN: BIG_ENDIAN,
            LITTLE_ENDIAN: LITTLE_ENDIAN,
            Types: Types,
            pack: pack,
            unpack: unpack,
            serialize: serialize,
            deserialize: deserialize
        };
    }

    var binarize = {
        pack: function(obj, callback) {
            try {
                if (debug) webrtcdev.info('%cPacking Start', 'font-weight: bold; color: red;', obj);
                serialize(obj, function(array) {
                    if (debug) webrtcdev.info('Serialized Object', array);
                    callback(pack(array));
                });
            } catch (e) {
                throw e;
            }
        },
        unpack: function(buffer, callback) {
            try {
                if (debug) webrtcdev.info('%cUnpacking Start', 'font-weight: bold; color: red;', buffer);
                var result = deserialize(buffer);
                if (debug) webrtcdev.info('Deserialized Object', result);
                callback(result);
            } catch (e) {
                throw e;
            }
        }
    };

    window.FileConverter = FileConverter;
    window.FileSelector = FileSelector;
    window.FileBufferReader = FileBufferReader;
})();

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.webrtc-experiment.com/licence
// Documentation - github.com/streamproc/MediaStreamRecorder
// ______________________
// MediaStreamRecorder.js

function MediaStreamRecorder(mediaStream) {
    if (!mediaStream) throw 'MediaStream is mandatory.';

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        // Media Stream Recording API has not been implemented in chrome yet;
        // That's why using WebAudio API to record stereo audio in WAV format
        var Recorder = IsChrome ? window.StereoRecorder : window.MediaRecorderWrapper;

        // video recorder (in WebM format)
        if (this.mimeType.indexOf('video') != -1) {
            Recorder = IsChrome ? window.WhammyRecorder : window.MediaRecorderWrapper;
        }

        // video recorder (in GIF format)
        if (this.mimeType === 'image/gif') Recorder = window.GifRecorder;

        mediaRecorder = new Recorder(mediaStream);
        mediaRecorder.ondataavailable = this.ondataavailable;
        mediaRecorder.onstop = this.onstop;
        mediaRecorder.onStartedDrawingNonBlankFrames = this.onStartedDrawingNonBlankFrames;

        // Merge all data-types except "function"
        mediaRecorder = mergeProps(mediaRecorder, this);

        mediaRecorder.start(timeSlice);
    };

    this.onStartedDrawingNonBlankFrames = function() {};
    this.clearOldRecordedFrames = function() {
        if (!mediaRecorder) return;
        mediaRecorder.clearOldRecordedFrames();
    };

    this.stop = function() {
        if (mediaRecorder) mediaRecorder.stop();
    };

    this.ondataavailable = function(blob) {
        webrtcdev.log('ondataavailable..', blob);
    };

    this.onstop = function(error) {
        webrtcdev.warn('stopped..', error);
    };

    // Reference to "MediaRecorder.js"
    var mediaRecorder;
}

// below scripts are used to auto-load required files.

function loadScript(src, onload) {
    var root = window.MediaStreamRecorderScriptsDir;

    var script = document.createElement('script');
    script.src = root + src;
    script.onload = onload || function() {};
    document.documentElement.appendChild(script);
}

// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.webrtc-experiment.com/licence
// Documentation - github.com/streamproc/MediaStreamRecorder

// _____________________________
// Cross-Browser-Declarations.js

// animation-frame used in WebM recording
if (!window.requestAnimationFrame) {
    requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
}

if (!window.cancelAnimationFrame) {
    cancelAnimationFrame = window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
}

// WebAudio API representer
if (!window.AudioContext) {
    window.AudioContext = window.webkitAudioContext || window.mozAudioContext;
}

URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

if (window.webkitMediaStream) window.MediaStream = window.webkitMediaStream;

var IsChrome = !!navigator.webkitGetUserMedia;
console.log(" IsChrome " , IsChrome);

// Merge all other data-types except "function"

function mergeProps(mergein, mergeto) {
    mergeto = reformatProps(mergeto);
    for (var t in mergeto) {
        if (typeof mergeto[t] !== 'function') {
            mergein[t] = mergeto[t];
        }
    }
    return mergein;
}

function reformatProps(obj) {
    var output = {};
    for (var o in obj) {
        if (o.indexOf('-') != -1) {
            var splitted = o.split('-');
            var name = splitted[0] + splitted[1].split('')[0].toUpperCase() + splitted[1].substr(1);
            output[name] = obj[o];
        } else output[o] = obj[o];
    }
    return output;
}

// ______________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// ObjectStore.js
var ObjectStore = {
    AudioContext: window.AudioContext || window.webkitAudioContext
};

// ================
// MediaRecorder.js

/**
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

function MediaRecorderWrapper(mediaStream) {
    // if user chosen only audio option; and he tried to pass MediaStream with
    // both audio and video tracks;
    // using a dirty workaround to generate audio-only stream so that we can get audio/ogg output.
    if (this.type == 'audio' && mediaStream.getVideoTracks && mediaStream.getVideoTracks().length && !navigator.mozGetUserMedia) {
        var context = new AudioContext();
        var mediaStreamSource = context.createMediaStreamSource(mediaStream);

        var destination = context.createMediaStreamDestination();
        mediaStreamSource.connect(destination);

        mediaStream = destination.stream;
    }

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"

    // starting a recording session; which will initiate "Reading Thread"
    // "Reading Thread" are used to prevent main-thread blocking scenarios
    this.start = function(mTimeSlice) {
        mTimeSlice = mTimeSlice || 1000;
        isStopRecording = false;

        function startRecording() {
            if (isStopRecording) return;

            mediaRecorder = new MediaRecorder(mediaStream);

            mediaRecorder.ondataavailable = function(e) {
                webrtcdev.log('ondataavailable', e.data.type, e.data.size, e.data);
                // mediaRecorder.state == 'recording' means that media recorder is associated with "session"
                // mediaRecorder.state == 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

                if (!e.data.size) {
                    webrtcdev.warn('Recording of', e.data.type, 'failed.');
                    return;
                }

                // at this stage, Firefox MediaRecorder API doesn't allow to choose the output mimeType format!
                var blob = new window.Blob([e.data], {
                    type: e.data.type || self.mimeType || 'audio/ogg' // It specifies the container format as well as the audio and video capture formats.
                });

                // Dispatching OnDataAvailable Handler
                self.ondataavailable(blob);
            };

            mediaRecorder.onstop = function(error) {
                // for video recording on Firefox, it will be fired quickly.
                // because work on VideoFrameContainer is still in progress
                // https://wiki.mozilla.org/Gecko:MediaRecorder

                // self.onstop(error);
            };

            // http://www.w3.org/TR/2012/WD-dom-20121206/#error-names-table
            // showBrowserSpecificIndicator: got neither video nor audio access
            // "VideoFrameContainer" can't be accessed directly; unable to find any wrapper using it.
            // that's why there is no video recording support on firefox

            // video recording fails because there is no encoder available there
            // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp#317

            // Maybe "Read Thread" doesn't fire video-track read notification;
            // that's why shutdown notification is received; and "Read Thread" is stopped.

            // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html#error-handling
            mediaRecorder.onerror = function(error) {
                webrtcdev.error(error);
                self.start(mTimeSlice);
            };

            mediaRecorder.onwarning = function(warning) {
                webrtcdev.warn(warning);
            };

            // void start(optional long mTimeSlice)
            // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
            // handler. "mTimeSlice < 0" means Session object does not push encoded data to
            // onDataAvailable, instead, it passive wait the client side pull encoded data
            // by calling requestData API.
            mediaRecorder.start(0);

            // Start recording. If timeSlice has been provided, mediaRecorder will
            // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
            // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.

            setTimeout(function() {
                mediaRecorder.stop();
                startRecording();
            }, mTimeSlice);
        }

        // dirty workaround to fix Firefox 2nd+ intervals
        startRecording();
    };

    var isStopRecording = false;

    this.stop = function() {
        isStopRecording = true;

        if (self.onstop) {
            self.onstop({});
        }
    };

    this.ondataavailable = this.onstop = function() {};

    // Reference to itself
    var self = this;

    if (!self.mimeType && !!mediaStream.getAudioTracks) {
        self.mimeType = mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length ? 'video/webm' : 'audio/ogg';
    }

    // Reference to "MediaRecorderWrapper" object
    var mediaRecorder;
}

// =================
// StereoRecorder.js

function StereoRecorder(mediaStream) {
    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        mediaRecorder = new StereoAudioRecorder(mediaStream, this);

        mediaRecorder.record();

        timeout = setInterval(function() {
            mediaRecorder.requestData();
        }, timeSlice);
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            clearTimeout(timeout);
        }
    };

    this.ondataavailable = function() {};

    // Reference to "StereoAudioRecorder" object
    var mediaRecorder;
    var timeout;
}

// ======================
// StereoAudioRecorder.js

// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js

function StereoAudioRecorder(mediaStream, root) {
    // variables
    var leftchannel = [];
    var rightchannel = [];
    var scriptprocessornode;
    var recording = false;
    var recordingLength = 0;
    var volume;
    var audioInput;
    var sampleRate = 44100;
    var audioContext;
    var context;

    var numChannels = root.mono ? 1 : 2;

    this.record = function() {
        recording = true;
        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;
    };

    this.requestData = function() {
        if (recordingLength == 0) {
            requestDataInvoked = false;
            return;
        }

        requestDataInvoked = true;
        // clone stuff
        var internal_leftchannel = leftchannel.slice(0);
        var internal_rightchannel = rightchannel.slice(0);
        var internal_recordingLength = recordingLength;

        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = [];
        recordingLength = 0;
        requestDataInvoked = false;

        // we flat the left and right channels down
        var leftBuffer = mergeBuffers(internal_leftchannel, internal_recordingLength);
        var rightBuffer = mergeBuffers(internal_leftchannel, internal_recordingLength);

        // we interleave both channels together
        if (numChannels === 2) {
            var interleaved = interleave(leftBuffer, rightBuffer);
        } else {
            var interleaved = leftBuffer;
        }

        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++) {
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }

        // our final binary blob
        var blob = new Blob([view], {
            type: 'audio/wav'
        });

        webrtcdev.debug('audio recorded blob size:', bytesToSize(blob.size));

        root.ondataavailable(blob);
    };

    this.stop = function() {
        // we stop recording
        recording = false;
        this.requestData();
    };

    function interleave(leftChannel, rightChannel) {
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);

        var inputIndex = 0;

        for (var index = 0; index < length;) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    function mergeBuffers(channelBuffer, recordingLength) {
        var result = new Float32Array(recordingLength);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++) {
            var buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // creates the audio context

    // creates the audio context
    var audioContext = ObjectStore.AudioContext;

    if (!ObjectStore.AudioContextConstructor)
        ObjectStore.AudioContextConstructor = new audioContext();

    var context = ObjectStore.AudioContextConstructor;

    // creates a gain node
    if (!ObjectStore.VolumeGainNode)
        ObjectStore.VolumeGainNode = context.createGain();

    var volume = ObjectStore.VolumeGainNode;

    // creates an audio node from the microphone incoming stream
    if (!ObjectStore.AudioInput)
        ObjectStore.AudioInput = context.createMediaStreamSource(mediaStream);

    // creates an audio node from the microphone incoming stream
    var audioInput = ObjectStore.AudioInput;

    // connect the stream to the gain node
    audioInput.connect(volume);

    /* From the spec: This value controls how frequently the audioprocess event is
    dispatched and how many sample-frames need to be processed each call.
    Lower values for buffer size will result in a lower (better) latency.
    Higher values will be necessary to avoid audio breakup and glitches 
    Legal values are 256, 512, 1024, 2048, 4096, 8192, and 16384.*/
    var bufferSize = root.bufferSize || 2048;
    if (root.bufferSize == 0) bufferSize = 0;

    if (context.createJavaScriptNode) {
        scriptprocessornode = context.createJavaScriptNode(bufferSize, numChannels, numChannels);
    } else if (context.createScriptProcessor) {
        scriptprocessornode = context.createScriptProcessor(bufferSize, numChannels, numChannels);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    bufferSize = scriptprocessornode.bufferSize;

    webrtcdev.debug('using audio buffer-size:', bufferSize);

    var requestDataInvoked = false;

    // sometimes "scriptprocessornode" disconnects from he destination-node
    // and there is no exception thrown in this case.
    // and obviously no further "ondataavailable" events will be emitted.
    // below global-scope variable is added to debug such unexpected but "rare" cases.
    window.scriptprocessornode = scriptprocessornode;

    if (numChannels == 1) {
        webrtcdev.debug('It seems mono audio. All right-channels are skipped.');
    }

    // http://webaudio.github.io/web-audio-api/#the-scriptprocessornode-interface
    scriptprocessornode.onaudioprocess = function(e) {
        if (!recording || requestDataInvoked) return;

        var left = e.inputBuffer.getChannelData(0);
        leftchannel.push(new Float32Array(left));

        if (numChannels == 2) {
            var right = e.inputBuffer.getChannelData(1);
            rightchannel.push(new Float32Array(right));
        }
        recordingLength += bufferSize;
    };

    volume.connect(scriptprocessornode);
    scriptprocessornode.connect(context.destination);
}

// =======================
// WhammyRecorderHelper.js

function WhammyRecorderHelper(mediaStream, root) {
    this.record = function(timeSlice) {
        if (!this.width) this.width = 320;
        if (!this.height) this.height = 240;

        if (this.video && this.video instanceof HTMLVideoElement) {
            if (!this.width) this.width = video.videoWidth || 320;
            if (!this.height) this.height = video.videoHeight || 240;
        }

        if (!this.video) {
            this.video = {
                width: this.width,
                height: this.height
            };
        }

        if (!this.canvas) {
            this.canvas = {
                width: this.width,
                height: this.height
            };
        }

        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        // setting defaults
        if (this.video && this.video instanceof HTMLVideoElement) {
            video = this.video.cloneNode();
        } else {
            video = document.createElement('video');
            video.src = URL.createObjectURL(mediaStream);

            video.width = this.video.width;
            video.height = this.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video();

        webrtcdev.log('canvas resolutions', canvas.width, '*', canvas.height);
        webrtcdev.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);

        drawFrames();
    };

    this.clearOldRecordedFrames = function() {
        frames = [];
    };

    var requestDataInvoked = false;
    this.requestData = function() {
        if (!frames.length) {
            requestDataInvoked = false;
            return;
        }

        requestDataInvoked = true;
        // clone stuff
        var internal_frames = frames.slice(0);

        // reset the frames for the new recording
        frames = [];

        whammy.frames = dropBlackFrames(internal_frames, -1);

        var WebM_Blob = whammy.compile();
        root.ondataavailable(WebM_Blob);

        webrtcdev.debug('video recorded blob size:', bytesToSize(WebM_Blob.size));

        requestDataInvoked = false;
    };

    var frames = [];

    var isOnStartedDrawingNonBlankFramesInvoked = false;

    function drawFrames() {
        if (isStopDrawing) return;

        if (requestDataInvoked) return setTimeout(drawFrames, 100);

        var duration = new Date().getTime() - lastTime;
        if (!duration) return drawFrames();

        // via webrtc-experiment#206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        !isStopDrawing && frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });

        if (!isOnStartedDrawingNonBlankFramesInvoked && !isBlankFrame(frames[frames.length - 1])) {
            isOnStartedDrawingNonBlankFramesInvoked = true;
            root.onStartedDrawingNonBlankFrames();
        }

        setTimeout(drawFrames, 10);
    }

    var isStopDrawing = false;

    this.stop = function() {
        isStopDrawing = true;
        this.requestData();
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;

    var self = this;

    function isBlankFrame(frame, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');

        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;

        var matchPixCount, endPixCheck, maxPixCount;

        var image = new Image();
        image.src = frame.image;
        context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
        var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
        matchPixCount = 0;
        endPixCheck = imageData.data.length;
        maxPixCount = imageData.data.length / 4;

        for (var pix = 0; pix < endPixCheck; pix += 4) {
            var currentColor = {
                r: imageData.data[pix],
                g: imageData.data[pix + 1],
                b: imageData.data[pix + 2]
            };
            var colorDifference = Math.sqrt(
                Math.pow(currentColor.r - sampleColor.r, 2) +
                Math.pow(currentColor.g - sampleColor.g, 2) +
                Math.pow(currentColor.b - sampleColor.b, 2)
            );
            // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
            if (colorDifference <= maxColorDifference * pixTolerance) {
                matchPixCount++;
            }
        }

        if (maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
            return false;
        } else {
            return true;
        }
    }

    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        for (var f = 0; f < endCheckFrame; f++) {
            var matchPixCount, endPixCheck, maxPixCount;

            if (!doNotCheckNext) {
                var image = new Image();
                image.src = _frames[f].image;
                context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                matchPixCount = 0;
                endPixCheck = imageData.data.length;
                maxPixCount = imageData.data.length / 4;

                for (var pix = 0; pix < endPixCheck; pix += 4) {
                    var currentColor = {
                        r: imageData.data[pix],
                        g: imageData.data[pix + 1],
                        b: imageData.data[pix + 2]
                    };
                    var colorDifference = Math.sqrt(
                        Math.pow(currentColor.r - sampleColor.r, 2) +
                        Math.pow(currentColor.g - sampleColor.g, 2) +
                        Math.pow(currentColor.b - sampleColor.b, 2)
                    );
                    // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                    if (colorDifference <= maxColorDifference * pixTolerance) {
                        matchPixCount++;
                    }
                }
            }

            if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
                // webrtcdev.log('removed black frame : ' + f + ' ; frame duration ' + _frames[f].duration);
            } else {
                // webrtcdev.log('frame is passed : ' + f);
                if (checkUntilNotBlack) {
                    doNotCheckNext = true;
                }
                resultFrames.push(_frames[f]);
            }
        }

        resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

        if (resultFrames.length <= 0) {
            // at least one last frame should be available for next manipulation
            // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
            resultFrames.push(_frames[_frames.length - 1]);
        }

        return resultFrames;
    }
}

// =================
// WhammyRecorder.js

function WhammyRecorder(mediaStream) {
    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        mediaRecorder = new WhammyRecorderHelper(mediaStream, this);

        for (var prop in this) {
            if (typeof this[prop] !== 'function') {
                mediaRecorder[prop] = this[prop];
            }
        }

        mediaRecorder.record();

        timeout = setInterval(function() {
            mediaRecorder.requestData();
        }, timeSlice);
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            clearTimeout(timeout);
        }
    };

    this.clearOldRecordedFrames = function() {
        if (mediaRecorder) {
            mediaRecorder.clearOldRecordedFrames();
        }
    };

    this.ondataavailable = function() {};

    // Reference to "WhammyRecorder" object
    var mediaRecorder;
    var timeout;
}


// Muaz Khan     - https://github.com/muaz-khan 
// neizerth      - https://github.com/neizerth
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/streamproc/MediaStreamRecorder

// Note:
// ==========================================================
// whammy.js is an "external library" 
// and has its own copyrights. Taken from "Whammy" project.


// https://github.com/antimatter15/whammy/blob/master/LICENSE
// =========
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

var Whammy = (function() {

    function toWebM(frames) {
        var info = checkFrames(frames);

        var CLUSTER_MAX_DURATION = 30000;

        var EBML = [{
            "id": 0x1a45dfa3, // EBML
            "data": [{
                "data": 1,
                "id": 0x4286 // EBMLVersion
            }, {
                "data": 1,
                "id": 0x42f7 // EBMLReadVersion
            }, {
                "data": 4,
                "id": 0x42f2 // EBMLMaxIDLength
            }, {
                "data": 8,
                "id": 0x42f3 // EBMLMaxSizeLength
            }, {
                "data": "webm",
                "id": 0x4282 // DocType
            }, {
                "data": 2,
                "id": 0x4287 // DocTypeVersion
            }, {
                "data": 2,
                "id": 0x4285 // DocTypeReadVersion
            }]
        }, {
            "id": 0x18538067, // Segment
            "data": [{
                "id": 0x1549a966, // Info
                "data": [{
                    "data": 1e6, //do things in millisecs (num of nanosecs for duration scale)
                    "id": 0x2ad7b1 // TimecodeScale
                }, {
                    "data": "whammy",
                    "id": 0x4d80 // MuxingApp
                }, {
                    "data": "whammy",
                    "id": 0x5741 // WritingApp
                }, {
                    "data": doubleToString(info.duration),
                    "id": 0x4489 // Duration
                }]
            }, {
                "id": 0x1654ae6b, // Tracks
                "data": [{
                    "id": 0xae, // TrackEntry
                    "data": [{
                        "data": 1,
                        "id": 0xd7 // TrackNumber
                    }, {
                        "data": 1,
                        "id": 0x63c5 // TrackUID
                    }, {
                        "data": 0,
                        "id": 0x9c // FlagLacing
                    }, {
                        "data": "und",
                        "id": 0x22b59c // Language
                    }, {
                        "data": "V_VP8",
                        "id": 0x86 // CodecID
                    }, {
                        "data": "VP8",
                        "id": 0x258688 // CodecName
                    }, {
                        "data": 1,
                        "id": 0x83 // TrackType
                    }, {
                        "id": 0xe0, // Video
                        "data": [{
                            "data": info.width,
                            "id": 0xb0 // PixelWidth
                        }, {
                            "data": info.height,
                            "id": 0xba // PixelHeight
                        }]
                    }]
                }]
            }]
        }];

        //Generate clusters (max duration)
        var frameNumber = 0;
        var clusterTimecode = 0;
        while (frameNumber < frames.length) {

            var clusterFrames = [];
            var clusterDuration = 0;
            do {
                clusterFrames.push(frames[frameNumber]);
                clusterDuration += frames[frameNumber].duration;
                frameNumber++;
            } while (frameNumber < frames.length && clusterDuration < CLUSTER_MAX_DURATION);

            var clusterCounter = 0;
            var cluster = {
                "id": 0x1f43b675, // Cluster
                "data": [{
                    "data": clusterTimecode,
                    "id": 0xe7 // Timecode
                }].concat(clusterFrames.map(function(webp) {
                    var block = makeSimpleBlock({
                        discardable: 0,
                        frame: webp.data.slice(4),
                        invisible: 0,
                        keyframe: 1,
                        lacing: 0,
                        trackNum: 1,
                        timecode: Math.round(clusterCounter)
                    });
                    clusterCounter += webp.duration;
                    return {
                        data: block,
                        id: 0xa3
                    };
                }))
            }; //Add cluster to segment
            EBML[1].data.push(cluster);
            clusterTimecode += clusterDuration;
        }

        return generateEBML(EBML);
    }

    // sums the lengths of all the frames and gets the duration

    function checkFrames(frames) {
        if (!frames[0]) {
            webrtcdev.warn('Something went wrong. Maybe WebP format is not supported in the current browser.');
            return;
        }

        var width = frames[0].width,
            height = frames[0].height,
            duration = frames[0].duration;

        for (var i = 1; i < frames.length; i++) {
            duration += frames[i].duration;
        }
        return {
            duration: duration,
            width: width,
            height: height
        };
    }

    function numToBuffer(num) {
        var parts = [];
        while (num > 0) {
            parts.push(num & 0xff);
            num = num >> 8;
        }
        return new Uint8Array(parts.reverse());
    }

    function strToBuffer(str) {
        return new Uint8Array(str.split('').map(function(e) {
            return e.charCodeAt(0);
        }));
    }

    function bitsToBuffer(bits) {
        var data = [];
        var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
        bits = pad + bits;
        for (var i = 0; i < bits.length; i += 8) {
            data.push(parseInt(bits.substr(i, 8), 2));
        }
        return new Uint8Array(data);
    }

    function generateEBML(json) {
        var ebml = [];
        for (var i = 0; i < json.length; i++) {
            var data = json[i].data;
            if (typeof data == 'object') data = generateEBML(data);
            if (typeof data == 'number') data = bitsToBuffer(data.toString(2));
            if (typeof data == 'string') data = strToBuffer(data);

            var len = data.size || data.byteLength || data.length;
            var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
            var size_str = len.toString(2);
            var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
            var size = (new Array(zeroes)).join('0') + '1' + padded;

            ebml.push(numToBuffer(json[i].id));
            ebml.push(bitsToBuffer(size));
            ebml.push(data);
        }

        return new Blob(ebml, {
            type: "video/webm"
        });
    }

    function toBinStr_old(bits) {
        var data = '';
        var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
        bits = pad + bits;
        for (var i = 0; i < bits.length; i += 8) {
            data += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
        }
        return data;
    }

    function generateEBML_old(json) {
        var ebml = '';
        for (var i = 0; i < json.length; i++) {
            var data = json[i].data;
            if (typeof data == 'object') data = generateEBML_old(data);
            if (typeof data == 'number') data = toBinStr_old(data.toString(2));

            var len = data.length;
            var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
            var size_str = len.toString(2);
            var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
            var size = (new Array(zeroes)).join('0') + '1' + padded;

            ebml += toBinStr_old(json[i].id.toString(2)) + toBinStr_old(size) + data;

        }
        return ebml;
    }

    function makeSimpleBlock(data) {
        var flags = 0;
        if (data.keyframe) flags |= 128;
        if (data.invisible) flags |= 8;
        if (data.lacing) flags |= (data.lacing << 1);
        if (data.discardable) flags |= 1;
        if (data.trackNum > 127) {
            throw "TrackNumber > 127 not supported";
        }
        var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
            return String.fromCharCode(e);
        }).join('') + data.frame;

        return out;
    }

    function parseWebP(riff) {
        var VP8 = riff.RIFF[0].WEBP[0];

        var frame_start = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
        for (var i = 0, c = []; i < 4; i++) c[i] = VP8.charCodeAt(frame_start + 3 + i);

        var width, height, tmp;

        //the code below is literally copied verbatim from the bitstream spec
        tmp = (c[1] << 8) | c[0];
        width = tmp & 0x3FFF;
        tmp = (c[3] << 8) | c[2];
        height = tmp & 0x3FFF;
        return {
            width: width,
            height: height,
            data: VP8,
            riff: riff
        };
    }

    function parseRIFF(string) {
        var offset = 0;
        var chunks = {};

        while (offset < string.length) {
            var id = string.substr(offset, 4);
            var len = parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
                var unpadded = i.charCodeAt(0).toString(2);
                return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
            }).join(''), 2);
            var data = string.substr(offset + 4 + 4, len);
            offset += 4 + 4 + len;
            chunks[id] = chunks[id] || [];

            if (id == 'RIFF' || id == 'LIST') {
                chunks[id].push(parseRIFF(data));
            } else {
                chunks[id].push(data);
            }
        }
        return chunks;
    }

    function doubleToString(num) {
        return [].slice.call(
            new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
            return String.fromCharCode(e);
        }).reverse().join('');
    }

    // a more abstract-ish API

    function WhammyVideo(duration) {
        this.frames = [];
        this.duration = duration || 1;
        this.quality = 100;
    }

    WhammyVideo.prototype.add = function(frame, duration) {
        if ('canvas' in frame) { //CanvasRenderingContext2D
            frame = frame.canvas;
        }

        if ('toDataURL' in frame) {
            frame = frame.toDataURL('image/webp', this.quality);
        }

        if (!(/^data:image\/webp;base64,/ig).test(frame)) {
            throw "Input must be formatted properly as a base64 encoded DataURI of type image/webp";
        }
        this.frames.push({
            image: frame,
            duration: duration || this.duration
        });
    };
    WhammyVideo.prototype.compile = function() {
        return new toWebM(this.frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
        }));
    };
    return {
        Video: WhammyVideo,
        toWebM: toWebM
    };
})();

// Muaz Khan     - https://github.com/muaz-khan 
// neizerth      - https://github.com/neizerth
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/streamproc/MediaStreamRecorder
// ==========================================================
// GifRecorder.js

function GifRecorder(mediaStream) {
    if (!window.GIFEncoder) {
        throw 'Please link: https://cdn.webrtc-experiment.com/gif-recorder.js';
    }

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        var imageWidth = this.videoWidth || 320;
        var imageHeight = this.videoHeight || 240;

        canvas.width = video.width = imageWidth;
        canvas.height = video.height = imageHeight;

        // external library to record as GIF images
        gifEncoder = new GIFEncoder();

        // void setRepeat(int iter)
        // Sets the number of times the set of GIF frames should be played.
        // Default is 1; 0 means play indefinitely.
        gifEncoder.setRepeat(0);

        // void setFrameRate(Number fps)
        // Sets frame rate in frames per second.
        // Equivalent to setDelay(1000/fps).
        // Using "setDelay" instead of "setFrameRate"
        gifEncoder.setDelay(this.frameRate || 200);

        // void setQuality(int quality)
        // Sets quality of color quantization (conversion of images to the
        // maximum 256 colors allowed by the GIF specification).
        // Lower values (minimum = 1) produce better colors,
        // but slow processing significantly. 10 is the default,
        // and produces good color mapping at reasonable speeds.
        // Values greater than 20 do not yield significant improvements in speed.
        gifEncoder.setQuality(this.quality || 1);

        // Boolean start()
        // This writes the GIF Header and returns false if it fails.
        gifEncoder.start();

        startTime = Date.now();

        function drawVideoFrame(time) {
            lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

            if (typeof lastFrameTime === undefined) {
                lastFrameTime = time;
            }

            // ~10 fps
            if (time - lastFrameTime < 90) return;

            context.drawImage(video, 0, 0, imageWidth, imageHeight);

            gifEncoder.addFrame(context);

            // webrtcdev.log('Recording...' + Math.round((Date.now() - startTime) / 1000) + 's');
            // webrtcdev.log("fps: ", 1000 / (time - lastFrameTime));

            lastFrameTime = time;
        }

        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

        timeout = setTimeout(doneRecording, timeSlice);
    };

    function doneRecording() {
        endTime = Date.now();

        var gifBlob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: 'image/gif'
        });
        self.ondataavailable(gifBlob);

        // todo: find a way to clear old recorded blobs
        gifEncoder.stream().bin = [];
    };

    this.stop = function() {
        if (lastAnimationFrame) {
            cancelAnimationFrame(lastAnimationFrame);
            clearTimeout(timeout);
            doneRecording();
        }
    };

    this.ondataavailable = function() {};
    this.onstop = function() {};

    // Reference to itself
    var self = this;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.src = URL.createObjectURL(mediaStream);
    video.play();

    var lastAnimationFrame = null;
    var startTime, endTime, lastFrameTime;

    var gifEncoder;
    var timeout;
}

// ______________________
// MultiStreamRecorder.js

function MultiStreamRecorder(mediaStream) {
    if (!mediaStream) throw 'MediaStream is mandatory.';

    var self = this;
    var isFirefox = !!navigator.mozGetUserMedia;

    this.stream = mediaStream;

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        audioRecorder = new MediaStreamRecorder(mediaStream);
        videoRecorder = new MediaStreamRecorder(mediaStream);

        audioRecorder.mimeType = 'audio/ogg';
        videoRecorder.mimeType = 'video/webm';

        for (var prop in this) {
            if (typeof this[prop] !== 'function') {
                audioRecorder[prop] = videoRecorder[prop] = this[prop];
            }
        }

        audioRecorder.ondataavailable = function(blob) {
            if (!audioVideoBlobs[recordingInterval]) {
                audioVideoBlobs[recordingInterval] = {};
            }

            audioVideoBlobs[recordingInterval].audio = blob;

            if (audioVideoBlobs[recordingInterval].video && !audioVideoBlobs[recordingInterval].posted) {
                audioVideoBlobs[recordingInterval].posted = true;
                onDataAvailableInvoked(audioVideoBlobs[recordingInterval]);
            }
        };

        videoRecorder.ondataavailable = function(blob) {
            if (isFirefox) {
                return self.ondataavailable({
                    video: blob,
                    audio: blob
                });
            }

            if (!audioVideoBlobs[recordingInterval]) {
                audioVideoBlobs[recordingInterval] = {};
            }

            audioVideoBlobs[recordingInterval].video = blob;

            if (audioVideoBlobs[recordingInterval].audio && !audioVideoBlobs[recordingInterval].invokedOnce) {
                audioVideoBlobs[recordingInterval].invokedOnce = true;
                onDataAvailableInvoked(audioVideoBlobs[recordingInterval]);
            }
        };

        function onDataAvailableInvoked(blobs) {
            recordingInterval++;
            self.ondataavailable(blobs);
        }

        videoRecorder.onstop = audioRecorder.onstop = function(error) {
            self.onstop(error);
        };

        if (!isFirefox) {
            // to make sure both audio/video are synced.
            videoRecorder.onStartedDrawingNonBlankFrames = function() {
                webrtcdev.debug('Fired: onStartedDrawingNonBlankFrames');
                videoRecorder.clearOldRecordedFrames();
                audioRecorder.start(timeSlice);
            };
            videoRecorder.start(timeSlice);
        } else {
            videoRecorder.start(timeSlice);
        }
    };

    this.stop = function() {
        if (audioRecorder) audioRecorder.stop();
        if (videoRecorder) videoRecorder.stop();
    };

    this.ondataavailable = function(blob) {
        webrtcdev.log('ondataavailable..', blob);
    };

    this.onstop = function(error) {
        webrtcdev.warn('stopped..', error);
    };

    var audioRecorder;
    var videoRecorder;

    var audioVideoBlobs = {};
    var recordingInterval = 0;
}

function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function SaveToDisk(blobOrFile, fileName) {
    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(blobOrFile);
    hyperlink.target = '_blank';
    hyperlink.download = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + blobOrFile.type.split('/')[1];

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */'';

// Last time updated: 2016-10-21 11:04:26 AM UTC

// Open-Sourced: https://github.com/muaz-khan/RecordRTC

//--------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
//--------------------------------------------------

// ____________
// RecordRTC.js

/**
 * {@link https://github.com/muaz-khan/RecordRTC|RecordRTC} is a JavaScript-based media-recording library for modern web-browsers (supporting WebRTC getUserMedia API). It is optimized for different devices and browsers to bring all client-side (pluginfree) recording solutions in single place.
 * @summary JavaScript audio/video recording library runs top over WebRTC getUserMedia API.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef RecordRTC
 * @class
 * @example
 * var recordRTC = RecordRTC(mediaStream, {
 *     type: 'video' // audio or video or gif or canvas
 * });
 *
 * // or, you can also use the "new" keyword
 * var recordRTC = new RecordRTC(mediaStream[, config]);
 * @see For further information:
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, etc.}
 */

function RecordRTC(mediaStream, config) {
    if (!mediaStream) {
        throw 'MediaStream is mandatory.';
    }

    config = config || {
        type: 'video'
    };

    config = new RecordRTCConfiguration(mediaStream, config);

    // a reference to user's recordRTC object
    var self = this;

    function startRecording() {
        if (!config.disableLogs) {
            webrtcdev.debug('started recording ' + config.type + ' stream.');
        }

        if (mediaRecorder) {
            mediaRecorder.clearRecordedData();
            mediaRecorder.resume();

            if (self.recordingDuration) {
                handleRecordingDuration();
            }
            return self;
        }

        initRecorder(function() {
            if (self.recordingDuration) {
                handleRecordingDuration();
            }
        });

        return self;
    }

    function initRecorder(initCallback) {
        if (initCallback) {
            config.initCallback = function() {
                initCallback();
                initCallback = config.initCallback = null; // recordRTC.initRecorder should be call-backed once.
            };
        }

        var Recorder = new GetRecorderType(mediaStream, config);

        mediaRecorder = new Recorder(mediaStream, config);
        mediaRecorder.record();

        if (!config.disableLogs) {
            webrtcdev.debug('Initialized recorderType:', mediaRecorder.constructor.name, 'for output-type:', config.type);
        }
    }

    function stopRecording(callback) {
        if (!mediaRecorder) {
            return webrtcdev.warn(WARNING);
        }

        /*jshint validthis:true */
        var recordRTC = this;

        if (!config.disableLogs) {
            webrtcdev.warn('Stopped recording ' + config.type + ' stream.');
        }

        if (config.type !== 'gif') {
            mediaRecorder.stop(_callback);
        } else {
            mediaRecorder.stop();
            _callback();
        }

        function _callback(__blob) {
            for (var item in mediaRecorder) {
                if (self) {
                    self[item] = mediaRecorder[item];
                }

                if (recordRTC) {
                    recordRTC[item] = mediaRecorder[item];
                }
            }

            var blob = mediaRecorder.blob;

            if (!blob) {
                if (__blob) {
                    mediaRecorder.blob = blob = __blob;
                } else {
                    throw 'Recording failed.';
                }
            }

            if (callback) {
                var url = URL.createObjectURL(blob);
                callback(url);
            }

            if (blob && !config.disableLogs) {
                webrtcdev.debug(blob.type, '->', bytesToSize(blob.size));
            }

            if (!config.autoWriteToDisk) {
                return;
            }

            getDataURL(function(dataURL) {
                var parameter = {};
                parameter[config.type + 'Blob'] = dataURL;
                DiskStorage.Store(parameter);
            });
        }
    }

    function pauseRecording() {
        if (!mediaRecorder) {
            return webrtcdev.warn(WARNING);
        }

        mediaRecorder.pause();

        if (!config.disableLogs) {
            webrtcdev.debug('Paused recording.');
        }
    }

    function resumeRecording() {
        if (!mediaRecorder) {
            return webrtcdev.warn(WARNING);
        }

        // not all libs have this method yet
        mediaRecorder.resume();

        if (!config.disableLogs) {
            webrtcdev.debug('Resumed recording.');
        }
    }

    function readFile(_blob) {
        postMessage(new FileReaderSync().readAsDataURL(_blob));
    }

    function getDataURL(callback, _mediaRecorder) {
        if (!callback) {
            throw 'Pass a callback function over getDataURL.';
        }

        var blob = _mediaRecorder ? _mediaRecorder.blob : (mediaRecorder || {}).blob;

        if (!blob) {
            if (!config.disableLogs) {
                webrtcdev.warn('Blob encoder did not finish its job yet.');
            }

            setTimeout(function() {
                getDataURL(callback, _mediaRecorder);
            }, 1000);
            return;
        }

        if (typeof Worker !== 'undefined' && !navigator.mozGetUserMedia) {
            var webWorker = processInWebWorker(readFile);

            webWorker.onmessage = function(event) {
                callback(event.data);
            };

            webWorker.postMessage(blob);
        } else {
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function(event) {
                callback(event.target.result);
            };
        }

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            URL.revokeObjectURL(blob);
            return worker;
        }
    }

    function handleRecordingDuration() {
        setTimeout(function() {
            stopRecording(self.onRecordingStopped);
        }, self.recordingDuration);
    }

    var WARNING = 'It seems that "startRecording" is not invoked for ' + config.type + ' recorder.';

    var mediaRecorder;

    var returnObject = {
        /**
         * This method starts recording. It doesn't take any arguments.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.startRecording();
         */
        startRecording: startRecording,

        /**
         * This method stops recording. It takes a single "callback" argument. It is suggested to get blob or URI in the callback to make sure all encoders finished their jobs.
         * @param {function} callback - This callback function is invoked after completion of all encoding jobs.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function(videoURL) {
         *     video.src = videoURL;
         *     recordRTC.blob; recordRTC.buffer;
         * });
         */
        stopRecording: stopRecording,

        /**
         * This method pauses the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.pauseRecording();
         */
        pauseRecording: pauseRecording,

        /**
         * This method resumes the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.resumeRecording();
         */
        resumeRecording: resumeRecording,

        /**
         * This method initializes the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.initRecorder();
         */
        initRecorder: initRecorder,

        /**
         * This method sets the recording duration.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.setRecordingDuration();
         */
        setRecordingDuration: function(milliseconds, callback) {
            if (typeof milliseconds === 'undefined') {
                throw 'milliseconds is required.';
            }

            if (typeof milliseconds !== 'number') {
                throw 'milliseconds must be a number.';
            }

            self.recordingDuration = milliseconds;
            self.onRecordingStopped = callback || function() {};

            return {
                onRecordingStopped: function(callback) {
                    self.onRecordingStopped = callback;
                }
            };
        },

        /**
         * This method can be used to clear/reset all the recorded data.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.clearRecordedData();
         */
        clearRecordedData: function() {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            mediaRecorder.clearRecordedData();

            if (!config.disableLogs) {
                webrtcdev.debug('Cleared old recorded data.');
            }
        },

        /**
         * It is equivalent to <code className="str">"recordRTC.blob"</code> property.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var blob = recordRTC.getBlob();
         *
         *     // equivalent to: recordRTC.blob property
         *     var blob = recordRTC.blob;
         * });
         */
        getBlob: function() {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            return mediaRecorder.blob;
        },

        /**
         * This method returns the DataURL. It takes a single "callback" argument.
         * @param {function} callback - DataURL is passed back over this callback.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     recordRTC.getDataURL(function(dataURL) {
         *         video.src = dataURL;
         *     });
         * });
         */
        getDataURL: getDataURL,

        /**
         * This method returns the Virutal/Blob URL. It doesn't take any arguments.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     video.src = recordRTC.toURL();
         * });
         */
        toURL: function() {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            return URL.createObjectURL(mediaRecorder.blob);
        },

        /**
         * This method saves the blob/file to disk (by invoking save-as dialog). It takes a single (optional) argument i.e. FileName
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     recordRTC.save('file-name');
         * });
         */
        save: function(fileName) {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            invokeSaveAsDialog(mediaRecorder.blob, fileName);
        },

        /**
         * This method gets a blob from indexed-DB storage. It takes a single "callback" argument.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.getFromDisk(function(dataURL) {
         *     video.src = dataURL;
         * });
         */
        getFromDisk: function(callback) {
            if (!mediaRecorder) {
                return webrtcdev.warn(WARNING);
            }

            RecordRTC.getFromDisk(config.type, callback);
        },

        /**
         * This method appends an array of webp images to the recorded video-blob. It takes an "array" object.
         * @type {Array.<Array>}
         * @param {Array} arrayOfWebPImages - Array of webp images.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * var arrayOfWebPImages = [];
         * arrayOfWebPImages.push({
         *     duration: index,
         *     image: 'data:image/webp;base64,...'
         * });
         * recordRTC.setAdvertisementArray(arrayOfWebPImages);
         */
        setAdvertisementArray: function(arrayOfWebPImages) {
            config.advertisement = [];

            var length = arrayOfWebPImages.length;
            for (var i = 0; i < length; i++) {
                config.advertisement.push({
                    duration: i,
                    image: arrayOfWebPImages[i]
                });
            }
        },

        /**
         * It is equivalent to <code class="str">"recordRTC.getBlob()"</code> method.
         * @property {Blob} blob - Recorded Blob can be accessed using this property.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var blob = recordRTC.blob;
         *
         *     // equivalent to: recordRTC.getBlob() method
         *     var blob = recordRTC.getBlob();
         * });
         */
        blob: null,

        /**
         * @todo Add descriptions.
         * @property {number} bufferSize - Either audio device's default buffer-size, or your custom value.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var bufferSize = recordRTC.bufferSize;
         * });
         */
        bufferSize: 0,

        /**
         * @todo Add descriptions.
         * @property {number} sampleRate - Audio device's default sample rates.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var sampleRate = recordRTC.sampleRate;
         * });
         */
        sampleRate: 0,

        /**
         * @todo Add descriptions.
         * @property {ArrayBuffer} buffer - Audio ArrayBuffer, supported only in Chrome.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var buffer = recordRTC.buffer;
         * });
         */
        buffer: null,

        /**
         * @todo Add descriptions.
         * @property {DataView} view - Audio DataView, supported only in Chrome.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var dataView = recordRTC.view;
         * });
         */
        view: null
    };

    if (!this) {
        self = returnObject;
        return returnObject;
    }

    // if someone wants to use RecordRTC with the "new" keyword.
    for (var prop in returnObject) {
        this[prop] = returnObject[prop];
    }

    self = this;

    return returnObject;
}

/**
 * This method can be used to get all recorded blobs from IndexedDB storage.
 * @param {string} type - 'all' or 'audio' or 'video' or 'gif'
 * @param {function} callback - Callback function to get all stored blobs.
 * @method
 * @memberof RecordRTC
 * @example
 * RecordRTC.getFromDisk('all', function(dataURL, type){
 *     if(type === 'audio') { }
 *     if(type === 'video') { }
 *     if(type === 'gif')   { }
 * });
 */
RecordRTC.getFromDisk = function(type, callback) {
    if (!callback) {
        throw 'callback is mandatory.';
    }

    webrtcdev.log('Getting recorded ' + (type === 'all' ? 'blobs' : type + ' blob ') + ' from disk!');
    DiskStorage.Fetch(function(dataURL, _type) {
        if (type !== 'all' && _type === type + 'Blob' && callback) {
            callback(dataURL);
        }

        if (type === 'all' && callback) {
            callback(dataURL, _type.replace('Blob', ''));
        }
    });
};

/**
 * This method can be used to store recorded blobs into IndexedDB storage.
 * @param {object} options - {audio: Blob, video: Blob, gif: Blob}
 * @method
 * @memberof RecordRTC
 * @example
 * RecordRTC.writeToDisk({
 *     audio: audioBlob,
 *     video: videoBlob,
 *     gif  : gifBlob
 * });
 */
RecordRTC.writeToDisk = function(options) {
    webrtcdev.log('Writing recorded blob(s) to disk!');
    options = options || {};
    if (options.audio && options.video && options.gif) {
        options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
                options.gif.getDataURL(function(gifDataURL) {
                    DiskStorage.Store({
                        audioBlob: audioDataURL,
                        videoBlob: videoDataURL,
                        gifBlob: gifDataURL
                    });
                });
            });
        });
    } else if (options.audio && options.video) {
        options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
                DiskStorage.Store({
                    audioBlob: audioDataURL,
                    videoBlob: videoDataURL
                });
            });
        });
    } else if (options.audio && options.gif) {
        options.audio.getDataURL(function(audioDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                    audioBlob: audioDataURL,
                    gifBlob: gifDataURL
                });
            });
        });
    } else if (options.video && options.gif) {
        options.video.getDataURL(function(videoDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                    videoBlob: videoDataURL,
                    gifBlob: gifDataURL
                });
            });
        });
    } else if (options.audio) {
        options.audio.getDataURL(function(audioDataURL) {
            DiskStorage.Store({
                audioBlob: audioDataURL
            });
        });
    } else if (options.video) {
        options.video.getDataURL(function(videoDataURL) {
            DiskStorage.Store({
                videoBlob: videoDataURL
            });
        });
    } else if (options.gif) {
        options.gif.getDataURL(function(gifDataURL) {
            DiskStorage.Store({
                gifBlob: gifDataURL
            });
        });
    }
};

if (typeof module !== 'undefined' /* && !!module.exports*/ ) {
    module.exports = RecordRTC;
}

if (typeof define === 'function' && define.amd) {
    define('RecordRTC', [], function() {
        return RecordRTC;
    });
}

// __________________________
// RecordRTC-Configuration.js

/**
 * {@link RecordRTCConfiguration} is an inner/private helper for {@link RecordRTC}.
 * @summary It configures the 2nd parameter passed over {@link RecordRTC} and returns a valid "config" object.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef RecordRTCConfiguration
 * @class
 * @example
 * var options = RecordRTCConfiguration(mediaStream, options);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, getNativeBlob:true, etc.}
 */

function RecordRTCConfiguration(mediaStream, config) {
    if (config.recorderType && !config.type) {
        if (config.recorderType === WhammyRecorder || config.recorderType === CanvasRecorder) {
            config.type = 'video';
        } else if (config.recorderType === GifRecorder) {
            config.type = 'gif';
        } else if (config.recorderType === StereoAudioRecorder) {
            config.type = 'audio';
        } else if (config.recorderType === MediaStreamRecorder) {
            if (mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length) {
                config.type = 'video';
            } else if (mediaStream.getAudioTracks().length && !mediaStream.getVideoTracks().length) {
                config.type = 'audio';
            } else if (!mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length) {
                config.type = 'audio';
            } else {
                // config.type = 'UnKnown';
            }
        }
    }

    if (typeof MediaStreamRecorder !== 'undefined' && typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype) {
        if (!config.mimeType) {
            config.mimeType = 'video/webm';
        }

        if (!config.type) {
            config.type = config.mimeType.split('/')[0];
        }

        if (!config.bitsPerSecond) {
            // config.bitsPerSecond = 128000;
        }
    }

    // consider default type=audio
    if (!config.type) {
        if (config.mimeType) {
            config.type = config.mimeType.split('/')[0];
        }
        if (!config.type) {
            config.type = 'audio';
        }
    }

    return config;
}

// __________________
// GetRecorderType.js

/**
 * {@link GetRecorderType} is an inner/private helper for {@link RecordRTC}.
 * @summary It returns best recorder-type available for your browser.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef GetRecorderType
 * @class
 * @example
 * var RecorderType = GetRecorderType(options);
 * var recorder = new RecorderType(options);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {type:"video", disableLogs: true, numberOfAudioChannels: 1, bufferSize: 0, sampleRate: 0, video: HTMLVideoElement, etc.}
 */

function GetRecorderType(mediaStream, config) {
    var recorder;

    // StereoAudioRecorder can work with all three: Edge, Firefox and Chrome
    // todo: detect if it is Edge, then auto use: StereoAudioRecorder
    if (isChrome || isEdge || isOpera) {
        // Media Stream Recording API has not been implemented in chrome yet;
        // That's why using WebAudio API to record stereo audio in WAV format
        recorder = StereoAudioRecorder;
    }

    if (typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype && !isChrome) {
        recorder = MediaStreamRecorder;
    }

    // video recorder (in WebM format)
    if (config.type === 'video' && (isChrome || isOpera)) {
        recorder = WhammyRecorder;
    }

    // video recorder (in Gif format)
    if (config.type === 'gif') {
        recorder = GifRecorder;
    }

    // html2canvas recording!
    if (config.type === 'canvas') {
        recorder = CanvasRecorder;
    }

    if (isMediaRecorderCompatible() && recorder !== CanvasRecorder && recorder !== GifRecorder && typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype) {
        if (mediaStream.getVideoTracks().length) {
            recorder = MediaStreamRecorder;
        }
    }

    if (config.recorderType) {
        recorder = config.recorderType;
    }

    if (!config.disableLogs && !!recorder && !!recorder.name) {
        webrtcdev.debug('Using recorderType:', recorder.name || recorder.constructor.name);
    }

    return recorder;
}

// _____________
// MRecordRTC.js

/**
 * MRecordRTC runs on top of {@link RecordRTC} to bring multiple recordings in a single place, by providing simple API.
 * @summary MRecordRTC stands for "Multiple-RecordRTC".
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef MRecordRTC
 * @class
 * @example
 * var recorder = new MRecordRTC();
 * recorder.addStream(MediaStream);
 * recorder.mediaType = {
 *     audio: true, // or StereoAudioRecorder or MediaStreamRecorder
 *     video: true, // or WhammyRecorder or MediaStreamRecorder
 *     gif: true    // or GifRecorder
 * };
 * // mimeType is optional and should be set only in advance cases.
 * recorder.mimeType = {
 *     audio: 'audio/wav',
 *     video: 'video/webm',
 *     gif:   'image/gif'
 * };
 * recorder.startRecording();
 * @see For further information:
 * @see {@link https://github.com/muaz-khan/RecordRTC/tree/master/MRecordRTC|MRecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

function MRecordRTC(mediaStream) {

    /**
     * This method attaches MediaStream object to {@link MRecordRTC}.
     * @param {MediaStream} mediaStream - A MediaStream object, either fetched using getUserMedia API, or generated using captureStreamUntilEnded or WebAudio API.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.addStream(MediaStream);
     */
    this.addStream = function(_mediaStream) {
        if (_mediaStream) {
            mediaStream = _mediaStream;
        }
    };

    /**
     * This property can be used to set the recording type e.g. audio, or video, or gif, or canvas.
     * @property {object} mediaType - {audio: true, video: true, gif: true}
     * @memberof MRecordRTC
     * @example
     * var recorder = new MRecordRTC();
     * recorder.mediaType = {
     *     audio: true, // TRUE or StereoAudioRecorder or MediaStreamRecorder
     *     video: true, // TRUE or WhammyRecorder or MediaStreamRecorder
     *     gif  : true  // TRUE or GifRecorder
     * };
     */
    this.mediaType = {
        audio: true,
        video: true
    };

    /**
     * This method starts recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.startRecording();
     */
    this.startRecording = function() {
        var mediaType = this.mediaType;
        var recorderType;
        var mimeType = this.mimeType || {
            audio: null,
            video: null,
            gif: null
        };

        if (typeof mediaType.audio !== 'function' && isMediaRecorderCompatible() && mediaStream.getAudioTracks && !mediaStream.getAudioTracks().length) {
            // Firefox supports both audio/video in single blob
            mediaType.audio = false;
        }

        if (typeof mediaType.video !== 'function' && isMediaRecorderCompatible() && mediaStream.getVideoTracks && !mediaStream.getVideoTracks().length) {
            // Firefox supports both audio/video in single blob
            mediaType.video = false;
        }

        if (!mediaType.audio && !mediaType.video) {
            throw 'MediaStream must have either audio or video tracks.';
        }

        if (!!mediaType.audio) {
            recorderType = null;
            if (typeof mediaType.audio === 'function') {
                recorderType = mediaType.audio;
            }

            this.audioRecorder = new RecordRTC(mediaStream, {
                type: 'audio',
                bufferSize: this.bufferSize,
                sampleRate: this.sampleRate,
                numberOfAudioChannels: this.numberOfAudioChannels || 2,
                disableLogs: this.disableLogs,
                recorderType: recorderType,
                mimeType: mimeType.audio
            });

            if (!mediaType.video) {
                this.audioRecorder.startRecording();
            }
        }

        if (!!mediaType.video) {
            recorderType = null;
            if (typeof mediaType.video === 'function') {
                recorderType = mediaType.video;
            }

            var newStream = mediaStream;

            if (isMediaRecorderCompatible() && !!mediaType.audio && typeof mediaType.audio === 'function') {
                var videoTrack = mediaStream.getVideoTracks()[0];

                if (!!navigator.mozGetUserMedia) {
                    newStream = new MediaStream();
                    newStream.addTrack(videoTrack);

                    if (recorderType && recorderType === WhammyRecorder) {
                        // Firefox does NOT support webp-encoding yet
                        recorderType = MediaStreamRecorder;
                    }
                } else {
                    newStream = new MediaStream([videoTrack]);
                }
            }

            this.videoRecorder = new RecordRTC(newStream, {
                type: 'video',
                video: this.video,
                canvas: this.canvas,
                frameInterval: this.frameInterval || 10,
                disableLogs: this.disableLogs,
                recorderType: recorderType,
                mimeType: mimeType.video
            });

            if (!mediaType.audio) {
                this.videoRecorder.startRecording();
            }
        }

        if (!!mediaType.audio && !!mediaType.video) {
            var self = this;
            if (isMediaRecorderCompatible()) {
                self.audioRecorder = null;
                self.videoRecorder.startRecording();
            } else {
                self.videoRecorder.initRecorder(function() {
                    self.audioRecorder.initRecorder(function() {
                        // Both recorders are ready to record things accurately
                        self.videoRecorder.startRecording();
                        self.audioRecorder.startRecording();
                    });
                });
            }
        }

        if (!!mediaType.gif) {
            recorderType = null;
            if (typeof mediaType.gif === 'function') {
                recorderType = mediaType.gif;
            }
            this.gifRecorder = new RecordRTC(mediaStream, {
                type: 'gif',
                frameRate: this.frameRate || 200,
                quality: this.quality || 10,
                disableLogs: this.disableLogs,
                recorderType: recorderType,
                mimeType: mimeType.gif
            });
            this.gifRecorder.startRecording();
        }
    };

    /**
     * This method stops recording.
     * @param {function} callback - Callback function is invoked when all encoders finished their jobs.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.stopRecording(function(recording){
     *     var audioBlob = recording.audio;
     *     var videoBlob = recording.video;
     *     var gifBlob   = recording.gif;
     * });
     */
    this.stopRecording = function(callback) {
        callback = callback || function() {};

        if (this.audioRecorder) {
            this.audioRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'audio');
            });
        }

        if (this.videoRecorder) {
            this.videoRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'video');
            });
        }

        if (this.gifRecorder) {
            this.gifRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'gif');
            });
        }
    };

    /**
     * This method pauses recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.pauseRecording();
     */
    this.pauseRecording = function() {
        if (this.audioRecorder) {
            this.audioRecorder.pauseRecording();
        }

        if (this.videoRecorder) {
            this.videoRecorder.pauseRecording();
        }

        if (this.gifRecorder) {
            this.gifRecorder.pauseRecording();
        }
    };

    /**
     * This method resumes recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.resumeRecording();
     */
    this.resumeRecording = function() {
        if (this.audioRecorder) {
            this.audioRecorder.resumeRecording();
        }

        if (this.videoRecorder) {
            this.videoRecorder.resumeRecording();
        }

        if (this.gifRecorder) {
            this.gifRecorder.resumeRecording();
        }
    };

    /**
     * This method can be used to manually get all recorded blobs.
     * @param {function} callback - All recorded blobs are passed back to the "callback" function.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.getBlob(function(recording){
     *     var audioBlob = recording.audio;
     *     var videoBlob = recording.video;
     *     var gifBlob   = recording.gif;
     * });
     * // or
     * var audioBlob = recorder.getBlob().audio;
     * var videoBlob = recorder.getBlob().video;
     */
    this.getBlob = function(callback) {
        var output = {};

        if (this.audioRecorder) {
            output.audio = this.audioRecorder.getBlob();
        }

        if (this.videoRecorder) {
            output.video = this.videoRecorder.getBlob();
        }

        if (this.gifRecorder) {
            output.gif = this.gifRecorder.getBlob();
        }

        if (callback) {
            callback(output);
        }

        return output;
    };

    /**
     * This method can be used to manually get all recorded blobs' DataURLs.
     * @param {function} callback - All recorded blobs' DataURLs are passed back to the "callback" function.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.getDataURL(function(recording){
     *     var audioDataURL = recording.audio;
     *     var videoDataURL = recording.video;
     *     var gifDataURL   = recording.gif;
     * });
     */
    this.getDataURL = function(callback) {
        this.getBlob(function(blob) {
            if(blob.audio && blob.video) {
                getDataURL(blob.audio, function(_audioDataURL) {
                    getDataURL(blob.video, function(_videoDataURL) {
                        callback({
                            audio: _audioDataURL,
                            video: _videoDataURL
                        });
                    });
                });
          }
          else if(blob.audio) {
              getDataURL(blob.audio, function(_audioDataURL) {
                  callback({
                      audio: _audioDataURL
                  });
              });
          }
          else if(blob.video) {
              getDataURL(blob.video, function(_videoDataURL) {
                  callback({
                      video: _videoDataURL
                  });
              });
          }
        });

        function getDataURL(blob, callback00) {
            if (typeof Worker !== 'undefined') {
                var webWorker = processInWebWorker(function readFile(_blob) {
                    postMessage(new FileReaderSync().readAsDataURL(_blob));
                });

                webWorker.onmessage = function(event) {
                    callback00(event.data);
                };

                webWorker.postMessage(blob);
            } else {
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = function(event) {
                    callback00(event.target.result);
                };
            }
        }

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            var url;
            if (typeof URL !== 'undefined') {
                url = URL;
            } else if (typeof webkitURL !== 'undefined') {
                url = webkitURL;
            } else {
                throw 'Neither URL nor webkitURL detected.';
            }
            url.revokeObjectURL(blob);
            return worker;
        }
    };

    /**
     * This method can be used to ask {@link MRecordRTC} to write all recorded blobs into IndexedDB storage.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.writeToDisk();
     */
    this.writeToDisk = function() {
        RecordRTC.writeToDisk({
            audio: this.audioRecorder,
            video: this.videoRecorder,
            gif: this.gifRecorder
        });
    };

    /**
     * This method can be used to invoke a save-as dialog for all recorded blobs.
     * @param {object} args - {audio: 'audio-name', video: 'video-name', gif: 'gif-name'}
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.save({
     *     audio: 'audio-file-name',
     *     video: 'video-file-name',
     *     gif  : 'gif-file-name'
     * });
     */
    this.save = function(args) {
        args = args || {
            audio: true,
            video: true,
            gif: true
        };

        if (!!args.audio && this.audioRecorder) {
            this.audioRecorder.save(typeof args.audio === 'string' ? args.audio : '');
        }

        if (!!args.video && this.videoRecorder) {
            this.videoRecorder.save(typeof args.video === 'string' ? args.video : '');
        }
        if (!!args.gif && this.gifRecorder) {
            this.gifRecorder.save(typeof args.gif === 'string' ? args.gif : '');
        }
    };
}

/**
 * This method can be used to get all recorded blobs from IndexedDB storage.
 * @param {string} type - 'all' or 'audio' or 'video' or 'gif'
 * @param {function} callback - Callback function to get all stored blobs.
 * @method
 * @memberof MRecordRTC
 * @example
 * MRecordRTC.getFromDisk('all', function(dataURL, type){
 *     if(type === 'audio') { }
 *     if(type === 'video') { }
 *     if(type === 'gif')   { }
 * });
 */
MRecordRTC.getFromDisk = RecordRTC.getFromDisk;

/**
 * This method can be used to store recorded blobs into IndexedDB storage.
 * @param {object} options - {audio: Blob, video: Blob, gif: Blob}
 * @method
 * @memberof MRecordRTC
 * @example
 * MRecordRTC.writeToDisk({
 *     audio: audioBlob,
 *     video: videoBlob,
 *     gif  : gifBlob
 * });
 */
MRecordRTC.writeToDisk = RecordRTC.writeToDisk;

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.MRecordRTC = MRecordRTC;
}

var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

(function(that) {
    if (!that) {
        return;
    }

    if (typeof window !== 'undefined') {
        return;
    }

    if (typeof global === 'undefined') {
        return;
    }

    global.navigator = {
        userAgent: browserFakeUserAgent,
        getUserMedia: function() {}
    };

    if (!global.webrtcdev) {
        global.webrtcdev = {};
    }

    if (typeof global.webrtcdev.debug === 'undefined') {
        global.webrtcdev.debug = global.webrtcdev.info = global.webrtcdev.error = global.webrtcdev.log = global.webrtcdev.log || function() {
            webrtcdev.log(arguments);
        };
    }

    if (typeof document === 'undefined') {
        /*global document:true */
        that.document = {};

        document.createElement = document.captureStream = document.mozCaptureStream = function() {
            var obj = {
                getContext: function() {
                    return obj;
                },
                play: function() {},
                pause: function() {},
                drawImage: function() {},
                toDataURL: function() {
                    return '';
                }
            };
            return obj;
        };

        that.HTMLVideoElement = function() {};
    }

    if (typeof location === 'undefined') {
        /*global location:true */
        that.location = {
            protocol: 'file:',
            href: '',
            hash: ''
        };
    }

    if (typeof screen === 'undefined') {
        /*global screen:true */
        that.screen = {
            width: 0,
            height: 0
        };
    }

    if (typeof URL === 'undefined') {
        /*global screen:true */
        that.URL = {
            createObjectURL: function() {
                return '';
            },
            revokeObjectURL: function() {
                return '';
            }
        };
    }

    /*global window:true */
    that.window = global;
})(typeof global !== 'undefined' ? global : null);

// _____________________________
// Cross-Browser-Declarations.js

// animation-frame used in WebM recording

/*jshint -W079 */
var requestAnimationFrame = window.requestAnimationFrame;
if (typeof requestAnimationFrame === 'undefined') {
    if (typeof webkitRequestAnimationFrame !== 'undefined') {
        /*global requestAnimationFrame:true */
        requestAnimationFrame = webkitRequestAnimationFrame;
    }

    if (typeof mozRequestAnimationFrame !== 'undefined') {
        /*global requestAnimationFrame:true */
        requestAnimationFrame = mozRequestAnimationFrame;
    }
}

/*jshint -W079 */
var cancelAnimationFrame = window.cancelAnimationFrame;
if (typeof cancelAnimationFrame === 'undefined') {
    if (typeof webkitCancelAnimationFrame !== 'undefined') {
        /*global cancelAnimationFrame:true */
        cancelAnimationFrame = webkitCancelAnimationFrame;
    }

    if (typeof mozCancelAnimationFrame !== 'undefined') {
        /*global cancelAnimationFrame:true */
        cancelAnimationFrame = mozCancelAnimationFrame;
    }
}

// WebAudio API representer
var AudioContext = window.AudioContext;

if (typeof AudioContext === 'undefined') {
    if (typeof webkitAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = webkitAudioContext;
    }

    if (typeof mozAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = mozAudioContext;
    }
}

/*jshint -W079 */
var URL = window.URL;

if (typeof URL === 'undefined' && typeof webkitURL !== 'undefined') {
    /*global URL:true */
    URL = webkitURL;
}

if (typeof navigator !== 'undefined' && typeof navigator.getUserMedia === 'undefined') { // maybe window.navigator?
    if (typeof navigator.webkitGetUserMedia !== 'undefined') {
        navigator.getUserMedia = navigator.webkitGetUserMedia;
    }

    if (typeof navigator.mozGetUserMedia !== 'undefined') {
        navigator.getUserMedia = navigator.mozGetUserMedia;
    }
}

var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveBlob || !!navigator.msSaveOrOpenBlob);
var isOpera = !!window.opera || navigator.userAgent.indexOf('OPR/') !== -1;
var isChrome = !isOpera && !isEdge && !!navigator.webkitGetUserMedia;

var MediaStream = window.MediaStream;

if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
}

/*global MediaStream:true */
if (typeof MediaStream !== 'undefined') {
    if (!('getVideoTracks' in MediaStream.prototype)) {
        MediaStream.prototype.getVideoTracks = function() {
            if (!this.getTracks) {
                return [];
            }

            var tracks = [];
            this.getTracks.forEach(function(track) {
                if (track.kind.toString().indexOf('video') !== -1) {
                    tracks.push(track);
                }
            });
            return tracks;
        };

        MediaStream.prototype.getAudioTracks = function() {
            if (!this.getTracks) {
                return [];
            }

            var tracks = [];
            this.getTracks.forEach(function(track) {
                if (track.kind.toString().indexOf('audio') !== -1) {
                    tracks.push(track);
                }
            });
            return tracks;
        };
    }

    if (!('stop' in MediaStream.prototype)) {
        MediaStream.prototype.stop = function() {
            this.getAudioTracks().forEach(function(track) {
                if (!!track.stop) {
                    track.stop();
                }
            });

            this.getVideoTracks().forEach(function(track) {
                if (!!track.stop) {
                    track.stop();
                }
            });
        };
    }
}

// below function via: http://goo.gl/B3ae8c
/**
 * @param {number} bytes - Pass bytes and get formafted string.
 * @returns {string} - formafted string
 * @example
 * bytesToSize(1024*1024*5) === '5 GB'
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */
function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

/**
 * @param {Blob} file - File or Blob object. This parameter is required.
 * @param {string} fileName - Optional file name e.g. "Recorded-Video.webm"
 * @example
 * invokeSaveAsDialog(blob or file, [optional] fileName);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */
function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        try {
            file.type = 'video/webm';
        } catch (e) {}
    }

    var fileExtension = (file.type || 'video/webm').split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}

// __________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// Storage.js

/**
 * Storage is a standalone object used by {@link RecordRTC} to store reusable objects e.g. "new AudioContext".
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @example
 * Storage.AudioContext === webkitAudioContext
 * @property {webkitAudioContext} AudioContext - Keeps a reference to AudioContext object.
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */

var Storage = {};

if (typeof AudioContext !== 'undefined') {
    Storage.AudioContext = AudioContext;
} else if (typeof webkitAudioContext !== 'undefined') {
    Storage.AudioContext = webkitAudioContext;
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.Storage = Storage;
}

function isMediaRecorderCompatible() {
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isChrome = !!window.chrome && !isOpera;
    var isFirefox = typeof window.InstallTrigger !== 'undefined';

    if (isFirefox) {
        return true;
    }

    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

    if (isChrome || isOpera) {
        verOffset = nAgt.indexOf('Chrome');
        fullVersion = nAgt.substring(verOffset + 7);
    }

    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(';')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    if ((ix = fullVersion.indexOf(' ')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return majorVersion >= 49;
}

// ______________________
// MediaStreamRecorder.js

// todo: need to show alert boxes for incompatible cases
// encoder only supports 48k/16k mono audio channel

/*
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

/**
 * MediaStreamRecorder is an abstraction layer for "MediaRecorder API". It is used by {@link RecordRTC} to record MediaStream(s) in Firefox.
 * @summary Runs top over MediaRecorder API.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef MediaStreamRecorder
 * @class
 * @example
 * var options = {
 *     mimeType: 'video/mp4', // audio/ogg or video/webm
 *     audioBitsPerSecond : 256 * 8 * 1024,
 *     videoBitsPerSecond : 256 * 8 * 1024,
 *     bitsPerSecond: 256 * 8 * 1024,  // if this is provided, skip above two
 *     getNativeBlob: true // by default it is false
 * }
 * var recorder = new MediaStreamRecorder(MediaStream, options);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 *
 *     // or
 *     var blob = recorder.blob;
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {disableLogs:true, initCallback: function, mimeType: "video/webm", onAudioProcessStarted: function}
 */

function MediaStreamRecorder(mediaStream, config) {
    var self = this;

    config = config || {
        // bitsPerSecond: 256 * 8 * 1024,
        mimeType: 'video/webm'
    };

    if (config.type === 'audio') {
        if (mediaStream.getVideoTracks().length && mediaStream.getAudioTracks().length) {
            var stream;
            if (!!navigator.mozGetUserMedia) {
                stream = new MediaStream();
                stream.addTrack(mediaStream.getAudioTracks()[0]);
            } else {
                // webkitMediaStream
                stream = new MediaStream(mediaStream.getAudioTracks());
            }
            mediaStream = stream;
        }

        if (!config.mimeType || config.mimeType.toString().toLowerCase().indexOf('audio') === -1) {
            config.mimeType = isChrome ? 'audio/webm' : 'audio/ogg';
        }

        if (config.mimeType && config.mimeType.toString().toLowerCase() !== 'audio/ogg' && !!navigator.mozGetUserMedia) {
            // forcing better codecs on Firefox (via #166)
            config.mimeType = 'audio/ogg';
        }
    }

    /**
     * This method records MediaStream.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        self.blob = null;

        var recorderHints = config;

        if (!config.disableLogs) {
            webrtcdev.log('Passing following config over MediaRecorder API.', recorderHints);
        }

        if (mediaRecorder) {
            // mandatory to make sure Firefox doesn't fails to record streams 3-4 times without reloading the page.
            mediaRecorder = null;
        }

        if (isChrome && !isMediaRecorderCompatible()) {
            // to support video-only recording on stable
            recorderHints = 'video/vp8';
        }

        // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp
        // https://wiki.mozilla.org/Gecko:MediaRecorder
        // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html

        // starting a recording session; which will initiate "Reading Thread"
        // "Reading Thread" are used to prevent main-thread blocking scenarios
        try {
            mediaRecorder = new MediaRecorder(mediaStream, recorderHints);
        } catch (e) {
            mediaRecorder = new MediaRecorder(mediaStream);
        }

        if ('canRecordMimeType' in mediaRecorder && mediaRecorder.canRecordMimeType(config.mimeType) === false) {
            if (!config.disableLogs) {
                webrtcdev.warn('MediaRecorder API seems unable to record mimeType:', config.mimeType);
            }
        }

        // i.e. stop recording when <video> is paused by the user; and auto restart recording 
        // when video is resumed. E.g. yourStream.getVideoTracks()[0].muted = true; // it will auto-stop recording.
        mediaRecorder.ignoreMutedMedia = config.ignoreMutedMedia || false;

        // Dispatching OnDataAvailable Handler
        mediaRecorder.ondataavailable = function(e) {
            if (self.dontFireOnDataAvailableEvent) {
                return;
            }

            if (!e.data || !e.data.size || e.data.size < 100 || self.blob) {
                return;
            }

            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof MediaStreamRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            self.blob = config.getNativeBlob ? e.data : new Blob([e.data], {
                type: config.mimeType || 'video/webm'
            });

            if (self.recordingCallback) {
                self.recordingCallback(self.blob);
                self.recordingCallback = null;
            }
        };

        mediaRecorder.onerror = function(error) {
            if (!config.disableLogs) {
                if (error.name === 'InvalidState') {
                    webrtcdev.error('The MediaRecorder is not in a state in which the proposed operation is allowed to be executed.');
                } else if (error.name === 'OutOfMemory') {
                    webrtcdev.error('The UA has exhaused the available memory. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'IllegalStreamModification') {
                    webrtcdev.error('A modification to the stream has occurred that makes it impossible to continue recording. An example would be the addition of a Track while recording is occurring. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'OtherRecordingError') {
                    webrtcdev.error('Used for an fatal error other than those listed above. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'GenericError') {
                    webrtcdev.error('The UA cannot provide the codec or recording option that has been requested.', error);
                } else {
                    webrtcdev.error('MediaRecorder Error', error);
                }
            }

            // When the stream is "ended" set recording to 'inactive' 
            // and stop gathering data. Callers should not rely on 
            // exactness of the timeSlice value, especially 
            // if the timeSlice value is small. Callers should 
            // consider timeSlice as a minimum value

            if (mediaRecorder.state !== 'inactive' && mediaRecorder.state !== 'stopped') {
                mediaRecorder.stop();
            }
        };

        // void start(optional long mTimeSlice)
        // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
        // handler. "mTimeSlice < 0" means Session object does not push encoded data to
        // onDataAvailable, instead, it passive wait the client side pull encoded data
        // by calling requestData API.
        mediaRecorder.start(3.6e+6);

        // Start recording. If timeSlice has been provided, mediaRecorder will
        // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
        // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.

        if (config.onAudioProcessStarted) {
            config.onAudioProcessStarted();
        }

        if (config.initCallback) {
            config.initCallback();
        }
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }
        this.recordingCallback = function(blob) {
            mediaRecorder = null;

            if (callback) {
                callback(blob);
            }
        };

        // mediaRecorder.state === 'recording' means that media recorder is associated with "session"
        // mediaRecorder.state === 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

        if (mediaRecorder.state === 'recording') {
            // "stop" method auto invokes "requestData"!
            // mediaRecorder.requestData();
            mediaRecorder.stop();
        }
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (this.dontFireOnDataAvailableEvent) {
            this.dontFireOnDataAvailableEvent = false;

            var disableLogs = config.disableLogs;
            config.disableLogs = true;
            this.record();
            config.disableLogs = disableLogs;
            return;
        }

        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        if (!mediaRecorder) {
            return;
        }

        this.pause();

        this.dontFireOnDataAvailableEvent = true;
        this.stop();
    };

    // Reference to "MediaRecorder" object
    var mediaRecorder;

    function isMediaStreamActive() {
        if ('active' in mediaStream) {
            if (!mediaStream.active) {
                return false;
            }
        } else if ('ended' in mediaStream) { // old hack
            if (mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

    var self = this;

    // this method checks if media stream is stopped
    // or any track is ended.
    (function looper() {
        if (!mediaRecorder) {
            return;
        }

        if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
                webrtcdev.log('MediaStream seems stopped.');
            }
            self.stop();
            return;
        }

        setTimeout(looper, 1000); // check every second
    })();
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.MediaStreamRecorder = MediaStreamRecorder;
}

// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js
// https://github.com/mattdiamond/Recorderjs#license-mit
// ______________________
// StereoAudioRecorder.js

/**
 * StereoAudioRecorder is a standalone class used by {@link RecordRTC} to bring "stereo" audio-recording in chrome.
 * @summary JavaScript standalone object for stereo audio recording.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef StereoAudioRecorder
 * @class
 * @example
 * var recorder = new StereoAudioRecorder(MediaStream, {
 *     sampleRate: 44100,
 *     bufferSize: 4096
 * });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {sampleRate: 44100, bufferSize: 4096, numberOfAudioChannels: 1, etc.}
 */

function StereoAudioRecorder(mediaStream, config) {
    if (!mediaStream.getAudioTracks().length) {
        throw 'Your stream has no audio tracks.';
    }

    config = config || {};

    var self = this;

    // variables
    var leftchannel = [];
    var rightchannel = [];
    var recording = false;
    var recordingLength = 0;
    var jsAudioNode;

    var numberOfAudioChannels = 2;

    // backward compatibility
    if (config.leftChannel === true) {
        numberOfAudioChannels = 1;
    }

    if (config.numberOfAudioChannels === 1) {
        numberOfAudioChannels = 1;
    }

    if (!config.disableLogs) {
        webrtcdev.debug('StereoAudioRecorder is set to record number of channels: ', numberOfAudioChannels);
    }

    function isMediaStreamActive() {
        if ('active' in mediaStream) {
            if (!mediaStream.active) {
                return false;
            }
        } else if ('ended' in mediaStream) { // old hack
            if (mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

    /**
     * This method records MediaStream.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (isMediaStreamActive() === false) {
            throw 'Please make sure MediaStream is active.';
        }

        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;

        if (audioInput) {
            audioInput.connect(jsAudioNode);
        }

        // to prevent self audio to be connected with speakers
        // jsAudioNode.connect(context.destination);

        isAudioProcessStarted = isPaused = false;
        recording = true;
    };

    function mergeLeftRightBuffers(config, callback) {
        function mergeAudioBuffers(config, cb) {
            var numberOfAudioChannels = config.numberOfAudioChannels;

            // todo: "slice(0)" --- is it causes loop? Should be removed?
            var leftBuffers = config.leftBuffers.slice(0);
            var rightBuffers = config.rightBuffers.slice(0);
            var sampleRate = config.sampleRate;
            var internalInterleavedLength = config.internalInterleavedLength;

            if (numberOfAudioChannels === 2) {
                leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
                rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength);
            }

            if (numberOfAudioChannels === 1) {
                leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength);
            }

            function mergeBuffers(channelBuffer, rLength) {
                var result = new Float64Array(rLength);
                var offset = 0;
                var lng = channelBuffer.length;

                for (var i = 0; i < lng; i++) {
                    var buffer = channelBuffer[i];
                    result.set(buffer, offset);
                    offset += buffer.length;
                }

                return result;
            }

            function interleave(leftChannel, rightChannel) {
                var length = leftChannel.length + rightChannel.length;

                var result = new Float64Array(length);

                var inputIndex = 0;

                for (var index = 0; index < length;) {
                    result[index++] = leftChannel[inputIndex];
                    result[index++] = rightChannel[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function writeUTFBytes(view, offset, string) {
                var lng = string.length;
                for (var i = 0; i < lng; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            // interleave both channels together
            var interleaved;

            if (numberOfAudioChannels === 2) {
                interleaved = interleave(leftBuffers, rightBuffers);
            }

            if (numberOfAudioChannels === 1) {
                interleaved = leftBuffers;
            }

            var interleavedLength = interleaved.length;

            // create wav file
            var resultingBufferLength = 44 + interleavedLength * 2;

            var buffer = new ArrayBuffer(resultingBufferLength);

            var view = new DataView(buffer);

            // RIFF chunk descriptor/identifier 
            writeUTFBytes(view, 0, 'RIFF');

            // RIFF chunk length
            view.setUint32(4, 44 + interleavedLength * 2, true);

            // RIFF type 
            writeUTFBytes(view, 8, 'WAVE');

            // format chunk identifier 
            // FMT sub-chunk
            writeUTFBytes(view, 12, 'fmt ');

            // format chunk length 
            view.setUint32(16, 16, true);

            // sample format (raw)
            view.setUint16(20, 1, true);

            // stereo (2 channels)
            view.setUint16(22, numberOfAudioChannels, true);

            // sample rate 
            view.setUint32(24, sampleRate, true);

            // byte rate (sample rate * block align)
            view.setUint32(28, sampleRate * 2, true);

            // block align (channel count * bytes per sample) 
            view.setUint16(32, numberOfAudioChannels * 2, true);

            // bits per sample 
            view.setUint16(34, 16, true);

            // data sub-chunk
            // data chunk identifier 
            writeUTFBytes(view, 36, 'data');

            // data chunk length 
            view.setUint32(40, interleavedLength * 2, true);

            // write the PCM samples
            var lng = interleavedLength;
            var index = 44;
            var volume = 1;
            for (var i = 0; i < lng; i++) {
                view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
                index += 2;
            }

            if (cb) {
                return cb({
                    buffer: buffer,
                    view: view
                });
            }

            postMessage({
                buffer: buffer,
                view: view
            });
        }

        if (!isChrome) {
            // its Microsoft Edge
            mergeAudioBuffers(config, function(data) {
                callback(data.buffer, data.view);
            });
            return;
        }


        var webWorker = processInWebWorker(mergeAudioBuffers);

        webWorker.onmessage = function(event) {
            callback(event.data.buffer, event.data.view);

            // release memory
            URL.revokeObjectURL(webWorker.workerURL);
        };

        webWorker.postMessage(config);
    }

    function processInWebWorker(_function) {
        var workerURL = URL.createObjectURL(new Blob([_function.toString(),
            ';this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(workerURL);
        worker.workerURL = workerURL;
        return worker;
    }

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        // stop recording
        recording = false;

        // to make sure onaudioprocess stops firing
        // audioInput.disconnect();

        mergeLeftRightBuffers({
            sampleRate: sampleRate,
            numberOfAudioChannels: numberOfAudioChannels,
            internalInterleavedLength: recordingLength,
            leftBuffers: leftchannel,
            rightBuffers: numberOfAudioChannels === 1 ? [] : rightchannel
        }, function(buffer, view) {
            /**
             * @property {Blob} blob - The recorded blob object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var blob = recorder.blob;
             * });
             */
            self.blob = new Blob([view], {
                type: 'audio/wav'
            });

            /**
             * @property {ArrayBuffer} buffer - The recorded buffer object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var buffer = recorder.buffer;
             * });
             */
            self.buffer = new ArrayBuffer(view.buffer.byteLength);

            /**
             * @property {DataView} view - The recorded data-view object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var view = recorder.view;
             * });
             */
            self.view = view;

            self.sampleRate = sampleRate;
            self.bufferSize = bufferSize;

            // recorded audio length
            self.length = recordingLength;

            if (callback) {
                callback();
            }

            isAudioProcessStarted = false;
        });
    };

    if (!Storage.AudioContextConstructor) {
        Storage.AudioContextConstructor = new Storage.AudioContext();
    }

    var context = Storage.AudioContextConstructor;

    // creates an audio node from the microphone incoming stream
    var audioInput = context.createMediaStreamSource(mediaStream);

    var legalBufferValues = [0, 256, 512, 1024, 2048, 4096, 8192, 16384];

    /**
     * From the spec: This value controls how frequently the audioprocess event is
     * dispatched and how many sample-frames need to be processed each call.
     * Lower values for buffer size will result in a lower (better) latency.
     * Higher values will be necessary to avoid audio breakup and glitches
     * The size of the buffer (in sample-frames) which needs to
     * be processed each time onprocessaudio is called.
     * Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
     * @property {number} bufferSize - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     bufferSize: 4096
     * });
     */

    // "0" means, let chrome decide the most accurate buffer-size for current platform.
    var bufferSize = typeof config.bufferSize === 'undefined' ? 4096 : config.bufferSize;

    if (legalBufferValues.indexOf(bufferSize) === -1) {
        if (!config.disableLogs) {
            webrtcdev.warn('Legal values for buffer-size are ' + JSON.stringify(legalBufferValues, null, '\t'));
        }
    }

    if (context.createJavaScriptNode) {
        jsAudioNode = context.createJavaScriptNode(bufferSize, numberOfAudioChannels, numberOfAudioChannels);
    } else if (context.createScriptProcessor) {
        jsAudioNode = context.createScriptProcessor(bufferSize, numberOfAudioChannels, numberOfAudioChannels);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    // connect the stream to the gain node
    audioInput.connect(jsAudioNode);

    if (!config.bufferSize) {
        bufferSize = jsAudioNode.bufferSize; // device buffer-size
    }

    /**
     * The sample rate (in sample-frames per second) at which the
     * AudioContext handles audio. It is assumed that all AudioNodes
     * in the context run at this rate. In making this assumption,
     * sample-rate converters or "varispeed" processors are not supported
     * in real-time processing.
     * The sampleRate parameter describes the sample-rate of the
     * linear PCM audio data in the buffer in sample-frames per second.
     * An implementation must support sample-rates in at least
     * the range 22050 to 96000.
     * @property {number} sampleRate - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     sampleRate: 44100
     * });
     */
    var sampleRate = typeof config.sampleRate !== 'undefined' ? config.sampleRate : context.sampleRate || 44100;

    if (sampleRate < 22050 || sampleRate > 96000) {
        // Ref: http://stackoverflow.com/a/26303918/552182
        if (!config.disableLogs) {
            webrtcdev.warn('sample-rate must be under range 22050 and 96000.');
        }
    }

    if (!config.disableLogs) {
        webrtcdev.log('sample-rate', sampleRate);
        webrtcdev.log('buffer-size', bufferSize);
    }

    var isPaused = false;
    /**
     * This method pauses the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPaused = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (isMediaStreamActive() === false) {
            throw 'Please make sure MediaStream is active.';
        }

        if (!recording) {
            if (!config.disableLogs) {
                webrtcdev.info('Seems recording has been restarted.');
            }
            this.record();
            return;
        }

        isPaused = false;
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        this.pause();

        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;
    };

    var isAudioProcessStarted = false;

    function onAudioProcessDataAvailable(e) {
        if (isPaused) {
            return;
        }

        if (isMediaStreamActive() === false) {
            if (!config.disableLogs) {
                webrtcdev.log('MediaStream seems stopped.');
            }
            jsAudioNode.disconnect();
            recording = false;
        }

        if (!recording) {
            audioInput.disconnect();
            return;
        }

        /**
         * This method is called on "onaudioprocess" event's first invocation.
         * @method {function} onAudioProcessStarted
         * @memberof StereoAudioRecorder
         * @example
         * recorder.onAudioProcessStarted: function() { };
         */
        if (!isAudioProcessStarted) {
            isAudioProcessStarted = true;
            if (config.onAudioProcessStarted) {
                config.onAudioProcessStarted();
            }

            if (config.initCallback) {
                config.initCallback();
            }
        }

        var left = e.inputBuffer.getChannelData(0);

        // we clone the samples
        leftchannel.push(new Float32Array(left));

        if (numberOfAudioChannels === 2) {
            var right = e.inputBuffer.getChannelData(1);
            rightchannel.push(new Float32Array(right));
        }

        recordingLength += bufferSize;
    }

    jsAudioNode.onaudioprocess = onAudioProcessDataAvailable;

    // to prevent self audio to be connected with speakers
    jsAudioNode.connect(context.destination);
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.StereoAudioRecorder = StereoAudioRecorder;
}

// _________________
// CanvasRecorder.js

/**
 * CanvasRecorder is a standalone class used by {@link RecordRTC} to bring HTML5-Canvas recording into video WebM. It uses HTML2Canvas library and runs top over {@link Whammy}.
 * @summary HTML2Canvas recording into video WebM.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef CanvasRecorder
 * @class
 * @example
 * var recorder = new CanvasRecorder(htmlElement, { disableLogs: true });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {HTMLElement} htmlElement - querySelector/getElementById/getElementsByTagName[0]/etc.
 * @param {object} config - {disableLogs:true, initCallback: function}
 */

function CanvasRecorder(htmlElement, config) {
    if (typeof html2canvas === 'undefined' && htmlElement.nodeName.toLowerCase() !== 'canvas') {
        throw 'Please link: https://cdn.webrtc-experiment.com/screenshot.js';
    }

    config = config || {};
    if (!config.frameInterval) {
        config.frameInterval = 10;
    }

    // via DetectRTC.js
    var isCanvasSupportsStreamCapturing = false;
    ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].forEach(function(item) {
        if (item in document.createElement('canvas')) {
            isCanvasSupportsStreamCapturing = true;
        }
    });

    var _isChrome = (!!window.webkitRTCPeerConnection || !!window.webkitGetUserMedia) && !!window.chrome;

    var chromeVersion = 50;
    var matchArray = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    if (_isChrome && matchArray && matchArray[2]) {
        chromeVersion = parseInt(matchArray[2], 10);
    }

    if (_isChrome && chromeVersion < 52) {
        isCanvasSupportsStreamCapturing = false;
    }

    var globalCanvas, mediaStreamRecorder;

    if (isCanvasSupportsStreamCapturing) {
        if (!config.disableLogs) {
            webrtcdev.debug('Your browser supports both MediRecorder API and canvas.captureStream!');
        }

        if (htmlElement instanceof HTMLCanvasElement) {
            globalCanvas = htmlElement;
        } else if (htmlElement instanceof CanvasRenderingContext2D) {
            globalCanvas = htmlElement.canvas;
        } else {
            throw 'Please pass either HTMLCanvasElement or CanvasRenderingContext2D.';
        }
    } else if (!!navigator.mozGetUserMedia) {
        if (!config.disableLogs) {
            webrtcdev.error('Canvas recording is NOT supported in Firefox.');
        }
    }

    var isRecording;

    /**
     * This method records Canvas.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        isRecording = true;

        if (isCanvasSupportsStreamCapturing) {
            // CanvasCaptureMediaStream
            var canvasMediaStream;
            if ('captureStream' in globalCanvas) {
                canvasMediaStream = globalCanvas.captureStream(25); // 25 FPS
            } else if ('mozCaptureStream' in globalCanvas) {
                canvasMediaStream = globalCanvas.mozCaptureStream(25);
            } else if ('webkitCaptureStream' in globalCanvas) {
                canvasMediaStream = globalCanvas.webkitCaptureStream(25);
            }

            try {
                var mdStream = new MediaStream();
                mdStream.addTrack(canvasMediaStream.getVideoTracks()[0]);
                canvasMediaStream = mdStream;
            } catch (e) {}

            if (!canvasMediaStream) {
                throw 'captureStream API are NOT available.';
            }

            // Note: Jan 18, 2016 status is that, 
            // Firefox MediaRecorder API can't record CanvasCaptureMediaStream object.
            mediaStreamRecorder = new MediaStreamRecorder(canvasMediaStream, {
                mimeType: 'video/webm'
            });
            mediaStreamRecorder.record();
        } else {
            whammy.frames = [];
            lastTime = new Date().getTime();
            drawCanvasFrame();
        }

        if (config.initCallback) {
            config.initCallback();
        }
    };

    this.getWebPImages = function(callback) {
        if (htmlElement.nodeName.toLowerCase() !== 'canvas') {
            callback();
            return;
        }

        var framesLength = whammy.frames.length;
        whammy.frames.forEach(function(frame, idx) {
            var framesRemaining = framesLength - idx;
            if (!config.disableLogs) {
                webrtcdev.debug(framesRemaining + '/' + framesLength + ' frames remaining');
            }

            if (config.onEncodingCallback) {
                config.onEncodingCallback(framesRemaining, framesLength);
            }

            var webp = frame.image.toDataURL('image/webp', 1);
            whammy.frames[idx].image = webp;
        });

        if (!config.disableLogs) {
            webrtcdev.debug('Generating WebM');
        }

        callback();
    };

    /**
     * This method stops recording Canvas.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isRecording = false;

        var that = this;

        if (isCanvasSupportsStreamCapturing && mediaStreamRecorder) {
            mediaStreamRecorder.stop(callback);
            return;
        }

        this.getWebPImages(function() {
            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof CanvasRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            whammy.compile(function(blob) {
                if (!config.disableLogs) {
                    webrtcdev.debug('Recording finished!');
                }

                that.blob = blob;

                if (that.blob.forEach) {
                    that.blob = new Blob([], {
                        type: 'video/webm'
                    });
                }

                if (callback) {
                    callback(that.blob);
                }

                whammy.frames = [];
            });
        });
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (!isRecording) {
            this.record();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        this.pause();
        whammy.frames = [];
    };

    function cloneCanvas() {
        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = htmlElement.width;
        newCanvas.height = htmlElement.height;

        //apply the old canvas to the new one
        context.drawImage(htmlElement, 0, 0);

        //return the new canvas
        return newCanvas;
    }

    function drawCanvasFrame() {
        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawCanvasFrame, 500);
        }

        if (htmlElement.nodeName.toLowerCase() === 'canvas') {
            var duration = new Date().getTime() - lastTime;
            // via #206, by Jack i.e. @Seymourr
            lastTime = new Date().getTime();

            whammy.frames.push({
                image: cloneCanvas(),
                duration: duration
            });

            if (isRecording) {
                setTimeout(drawCanvasFrame, config.frameInterval);
            }
            return;
        }

        html2canvas(htmlElement, {
            grabMouse: typeof config.showMousePointer === 'undefined' || config.showMousePointer,
            onrendered: function(canvas) {
                var duration = new Date().getTime() - lastTime;
                if (!duration) {
                    return setTimeout(drawCanvasFrame, config.frameInterval);
                }

                // via #206, by Jack i.e. @Seymourr
                lastTime = new Date().getTime();

                whammy.frames.push({
                    image: canvas.toDataURL('image/webp', 1),
                    duration: duration
                });

                if (isRecording) {
                    setTimeout(drawCanvasFrame, config.frameInterval);
                }
            }
        });
    }

    var lastTime = new Date().getTime();

    var whammy = new Whammy.Video(100);
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.CanvasRecorder = CanvasRecorder;
}

// _________________
// WhammyRecorder.js

/**
 * WhammyRecorder is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It runs top over {@link Whammy}.
 * @summary Video recording feature in Chrome.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef WhammyRecorder
 * @class
 * @example
 * var recorder = new WhammyRecorder(mediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {disableLogs: true, initCallback: function, video: HTMLVideoElement, etc.}
 */

function WhammyRecorder(mediaStream, config) {

    config = config || {};

    if (!config.frameInterval) {
        config.frameInterval = 10;
    }

    if (!config.disableLogs) {
        webrtcdev.log('Using frames-interval:', config.frameInterval);
    }

    /**
     * This method records video.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!config.width) {
            config.width = 320;
        }

        if (!config.height) {
            config.height = 240;
        }

        if (!config.video) {
            config.video = {
                width: config.width,
                height: config.height
            };
        }

        if (!config.canvas) {
            config.canvas = {
                width: config.width,
                height: config.height
            };
        }

        canvas.width = config.canvas.width;
        canvas.height = config.canvas.height;

        context = canvas.getContext('2d');

        // setting defaults
        if (config.video && config.video instanceof HTMLVideoElement) {
            video = config.video.cloneNode();

            if (config.initCallback) {
                config.initCallback();
            }
        } else {
            video = document.createElement('video');

            if (typeof video.srcObject !== 'undefined') {
                video.srcObject = mediaStream;
            } else {
                video.src = URL.createObjectURL(mediaStream);
            }

            video.onloadedmetadata = function() { // "onloadedmetadata" may NOT work in FF?
                if (config.initCallback) {
                    config.initCallback();
                }
            };

            video.width = config.video.width;
            video.height = config.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video();

        if (!config.disableLogs) {
            webrtcdev.log('canvas resolutions', canvas.width, '*', canvas.height);
            webrtcdev.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);
        }

        drawFrames(config.frameInterval);
    };

    /**
     * Draw and push frames to Whammy
     * @param {integer} frameInterval - set minimum interval (in milliseconds) between each time we push a frame to Whammy
     */
    function drawFrames(frameInterval) {
        frameInterval = typeof frameInterval !== 'undefined' ? frameInterval : 10;

        var duration = new Date().getTime() - lastTime;
        if (!duration) {
            return setTimeout(drawFrames, frameInterval, frameInterval);
        }

        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawFrames, 100);
        }

        // via #206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        if (video.paused) {
            // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
            // Tweak for Android Chrome
            video.play();
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        whammy.frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });

        if (!isStopDrawing) {
            setTimeout(drawFrames, frameInterval, frameInterval);
        }
    }

    function asyncLoop(o) {
        var i = -1,
            length = o.length;

        var loop = function() {
            i++;
            if (i === length) {
                o.callback();
                return;
            }
            o.functionToLoop(loop, i);
        };
        loop(); //init
    }


    /**
     * remove black frames from the beginning to the specified frame
     * @param {Array} _frames - array of frames to be checked
     * @param {number} _framesToCheck - number of frame until check will be executed (-1 - will drop all frames until frame not matched will be found)
     * @param {number} _pixTolerance - 0 - very strict (only black pixel color) ; 1 - all
     * @param {number} _frameTolerance - 0 - very strict (only black frame color) ; 1 - all
     * @returns {Array} - array of frames
     */
    // pull#293 by @volodalexey
    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance, callback) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        asyncLoop({
            length: endCheckFrame,
            functionToLoop: function(loop, f) {
                var matchPixCount, endPixCheck, maxPixCount;

                var finishImage = function() {
                    if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
                        // webrtcdev.log('removed black frame : ' + f + ' ; frame duration ' + _frames[f].duration);
                    } else {
                        // webrtcdev.log('frame is passed : ' + f);
                        if (checkUntilNotBlack) {
                            doNotCheckNext = true;
                        }
                        resultFrames.push(_frames[f]);
                    }
                    loop();
                };

                if (!doNotCheckNext) {
                    var image = new Image();
                    image.onload = function() {
                        context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                        var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                        matchPixCount = 0;
                        endPixCheck = imageData.data.length;
                        maxPixCount = imageData.data.length / 4;

                        for (var pix = 0; pix < endPixCheck; pix += 4) {
                            var currentColor = {
                                r: imageData.data[pix],
                                g: imageData.data[pix + 1],
                                b: imageData.data[pix + 2]
                            };
                            var colorDifference = Math.sqrt(
                                Math.pow(currentColor.r - sampleColor.r, 2) +
                                Math.pow(currentColor.g - sampleColor.g, 2) +
                                Math.pow(currentColor.b - sampleColor.b, 2)
                            );
                            // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                            if (colorDifference <= maxColorDifference * pixTolerance) {
                                matchPixCount++;
                            }
                        }
                        finishImage();
                    };
                    image.src = _frames[f].image;
                } else {
                    finishImage();
                }
            },
            callback: function() {
                resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

                if (resultFrames.length <= 0) {
                    // at least one last frame should be available for next manipulation
                    // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
                    resultFrames.push(_frames[_frames.length - 1]);
                }
                callback(resultFrames);
            }
        });
    }

    var isStopDrawing = false;

    /**
     * This method stops recording video.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isStopDrawing = true;

        var _this = this;
        // analyse of all frames takes some time!
        setTimeout(function() {
            // e.g. dropBlackFrames(frames, 10, 1, 1) - will cut all 10 frames
            // e.g. dropBlackFrames(frames, 10, 0.5, 0.5) - will analyse 10 frames
            // e.g. dropBlackFrames(frames, 10) === dropBlackFrames(frames, 10, 0, 0) - will analyse 10 frames with strict black color
            dropBlackFrames(whammy.frames, -1, null, null, function(frames) {
                whammy.frames = frames;

                // to display advertisement images!
                if (config.advertisement && config.advertisement.length) {
                    whammy.frames = config.advertisement.concat(whammy.frames);
                }

                /**
                 * @property {Blob} blob - Recorded frames in video/webm blob.
                 * @memberof WhammyRecorder
                 * @example
                 * recorder.stop(function() {
                 *     var blob = recorder.blob;
                 * });
                 */
                whammy.compile(function(blob) {
                    _this.blob = blob;

                    if (_this.blob.forEach) {
                        _this.blob = new Blob([], {
                            type: 'video/webm'
                        });
                    }

                    if (callback) {
                        callback(_this.blob);
                    }
                });
            });
        }, 10);
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (isStopDrawing) {
            this.record();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        this.pause();
        whammy.frames = [];
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.WhammyRecorder = WhammyRecorder;
}

// https://github.com/antimatter15/whammy/blob/master/LICENSE
// _________
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

/**
 * Whammy is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It is written by {@link https://github.com/antimatter15|antimatter15}
 * @summary A real time javascript webm encoder based on a canvas hack.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef Whammy
 * @class
 * @example
 * var recorder = new Whammy().Video(15);
 * recorder.add(context || canvas || dataURL);
 * var output = recorder.compile();
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */

var Whammy = (function() {
    // a more abstract-ish API

    function WhammyVideo(duration) {
        this.frames = [];
        this.duration = duration || 1;
        this.quality = 0.8;
    }

    /**
     * Pass Canvas or Context or image/webp(string) to {@link Whammy} encoder.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.add(canvas || context || 'image/webp');
     * @param {string} frame - Canvas || Context || image/webp
     * @param {number} duration - Stick a duration (in milliseconds)
     */
    WhammyVideo.prototype.add = function(frame, duration) {
        if ('canvas' in frame) { //CanvasRenderingContext2D
            frame = frame.canvas;
        }

        if ('toDataURL' in frame) {
            frame = frame.toDataURL('image/webp', this.quality);
        }

        if (!(/^data:image\/webp;base64,/ig).test(frame)) {
            throw 'Input must be formatted properly as a base64 encoded DataURI of type image/webp';
        }
        this.frames.push({
            image: frame,
            duration: duration || this.duration
        });
    };

    function processInWebWorker(_function) {
        var blob = URL.createObjectURL(new Blob([_function.toString(),
            'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(blob);
        URL.revokeObjectURL(blob);
        return worker;
    }

    function whammyInWebWorker(frames) {
        function ArrayToWebM(frames) {
            var info = checkFrames(frames);
            if (!info) {
                return [];
            }

            var clusterMaxDuration = 30000;

            var EBML = [{
                'id': 0x1a45dfa3, // EBML
                'data': [{
                    'data': 1,
                    'id': 0x4286 // EBMLVersion
                }, {
                    'data': 1,
                    'id': 0x42f7 // EBMLReadVersion
                }, {
                    'data': 4,
                    'id': 0x42f2 // EBMLMaxIDLength
                }, {
                    'data': 8,
                    'id': 0x42f3 // EBMLMaxSizeLength
                }, {
                    'data': 'webm',
                    'id': 0x4282 // DocType
                }, {
                    'data': 2,
                    'id': 0x4287 // DocTypeVersion
                }, {
                    'data': 2,
                    'id': 0x4285 // DocTypeReadVersion
                }]
            }, {
                'id': 0x18538067, // Segment
                'data': [{
                    'id': 0x1549a966, // Info
                    'data': [{
                        'data': 1e6, //do things in millisecs (num of nanosecs for duration scale)
                        'id': 0x2ad7b1 // TimecodeScale
                    }, {
                        'data': 'whammy',
                        'id': 0x4d80 // MuxingApp
                    }, {
                        'data': 'whammy',
                        'id': 0x5741 // WritingApp
                    }, {
                        'data': doubleToString(info.duration),
                        'id': 0x4489 // Duration
                    }]
                }, {
                    'id': 0x1654ae6b, // Tracks
                    'data': [{
                        'id': 0xae, // TrackEntry
                        'data': [{
                            'data': 1,
                            'id': 0xd7 // TrackNumber
                        }, {
                            'data': 1,
                            'id': 0x73c5 // TrackUID
                        }, {
                            'data': 0,
                            'id': 0x9c // FlagLacing
                        }, {
                            'data': 'und',
                            'id': 0x22b59c // Language
                        }, {
                            'data': 'V_VP8',
                            'id': 0x86 // CodecID
                        }, {
                            'data': 'VP8',
                            'id': 0x258688 // CodecName
                        }, {
                            'data': 1,
                            'id': 0x83 // TrackType
                        }, {
                            'id': 0xe0, // Video
                            'data': [{
                                'data': info.width,
                                'id': 0xb0 // PixelWidth
                            }, {
                                'data': info.height,
                                'id': 0xba // PixelHeight
                            }]
                        }]
                    }]
                }]
            }];

            //Generate clusters (max duration)
            var frameNumber = 0;
            var clusterTimecode = 0;
            while (frameNumber < frames.length) {

                var clusterFrames = [];
                var clusterDuration = 0;
                do {
                    clusterFrames.push(frames[frameNumber]);
                    clusterDuration += frames[frameNumber].duration;
                    frameNumber++;
                } while (frameNumber < frames.length && clusterDuration < clusterMaxDuration);

                var clusterCounter = 0;
                var cluster = {
                    'id': 0x1f43b675, // Cluster
                    'data': getClusterData(clusterTimecode, clusterCounter, clusterFrames)
                }; //Add cluster to segment
                EBML[1].data.push(cluster);
                clusterTimecode += clusterDuration;
            }

            return generateEBML(EBML);
        }

        function getClusterData(clusterTimecode, clusterCounter, clusterFrames) {
            return [{
                'data': clusterTimecode,
                'id': 0xe7 // Timecode
            }].concat(clusterFrames.map(function(webp) {
                var block = makeSimpleBlock({
                    discardable: 0,
                    frame: webp.data.slice(4),
                    invisible: 0,
                    keyframe: 1,
                    lacing: 0,
                    trackNum: 1,
                    timecode: Math.round(clusterCounter)
                });
                clusterCounter += webp.duration;
                return {
                    data: block,
                    id: 0xa3
                };
            }));
        }

        // sums the lengths of all the frames and gets the duration

        function checkFrames(frames) {
            if (!frames[0]) {
                postMessage({
                    error: 'Something went wrong. Maybe WebP format is not supported in the current browser.'
                });
                return;
            }

            var width = frames[0].width,
                height = frames[0].height,
                duration = frames[0].duration;

            for (var i = 1; i < frames.length; i++) {
                duration += frames[i].duration;
            }
            return {
                duration: duration,
                width: width,
                height: height
            };
        }

        function numToBuffer(num) {
            var parts = [];
            while (num > 0) {
                parts.push(num & 0xff);
                num = num >> 8;
            }
            return new Uint8Array(parts.reverse());
        }

        function strToBuffer(str) {
            return new Uint8Array(str.split('').map(function(e) {
                return e.charCodeAt(0);
            }));
        }

        function bitsToBuffer(bits) {
            var data = [];
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data.push(parseInt(bits.substr(i, 8), 2));
            }
            return new Uint8Array(data);
        }

        function generateEBML(json) {
            var ebml = [];
            for (var i = 0; i < json.length; i++) {
                var data = json[i].data;

                if (typeof data === 'object') {
                    data = generateEBML(data);
                }

                if (typeof data === 'number') {
                    data = bitsToBuffer(data.toString(2));
                }

                if (typeof data === 'string') {
                    data = strToBuffer(data);
                }

                var len = data.size || data.byteLength || data.length;
                var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
                var sizeToString = len.toString(2);
                var padded = (new Array((zeroes * 7 + 7 + 1) - sizeToString.length)).join('0') + sizeToString;
                var size = (new Array(zeroes)).join('0') + '1' + padded;

                ebml.push(numToBuffer(json[i].id));
                ebml.push(bitsToBuffer(size));
                ebml.push(data);
            }

            return new Blob(ebml, {
                type: 'video/webm'
            });
        }

        function toBinStrOld(bits) {
            var data = '';
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
            }
            return data;
        }

        function makeSimpleBlock(data) {
            var flags = 0;

            if (data.keyframe) {
                flags |= 128;
            }

            if (data.invisible) {
                flags |= 8;
            }

            if (data.lacing) {
                flags |= (data.lacing << 1);
            }

            if (data.discardable) {
                flags |= 1;
            }

            if (data.trackNum > 127) {
                throw 'TrackNumber > 127 not supported';
            }

            var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
                return String.fromCharCode(e);
            }).join('') + data.frame;

            return out;
        }

        function parseWebP(riff) {
            var VP8 = riff.RIFF[0].WEBP[0];

            var frameStart = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
            for (var i = 0, c = []; i < 4; i++) {
                c[i] = VP8.charCodeAt(frameStart + 3 + i);
            }

            var width, height, tmp;

            //the code below is literally copied verbatim from the bitstream spec
            tmp = (c[1] << 8) | c[0];
            width = tmp & 0x3FFF;
            tmp = (c[3] << 8) | c[2];
            height = tmp & 0x3FFF;
            return {
                width: width,
                height: height,
                data: VP8,
                riff: riff
            };
        }

        function getStrLength(string, offset) {
            return parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
                var unpadded = i.charCodeAt(0).toString(2);
                return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
            }).join(''), 2);
        }

        function parseRIFF(string) {
            var offset = 0;
            var chunks = {};

            while (offset < string.length) {
                var id = string.substr(offset, 4);
                var len = getStrLength(string, offset);
                var data = string.substr(offset + 4 + 4, len);
                offset += 4 + 4 + len;
                chunks[id] = chunks[id] || [];

                if (id === 'RIFF' || id === 'LIST') {
                    chunks[id].push(parseRIFF(data));
                } else {
                    chunks[id].push(data);
                }
            }
            return chunks;
        }

        function doubleToString(num) {
            return [].slice.call(
                new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
                return String.fromCharCode(e);
            }).reverse().join('');
        }

        var webm = new ArrayToWebM(frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
        }));

        postMessage(webm);
    }

    /**
     * Encodes frames in WebM container. It uses WebWorkinvoke to invoke 'ArrayToWebM' method.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.compile(function(blob) {
     *    // blob.size - blob.type
     * });
     */
    WhammyVideo.prototype.compile = function(callback) {
        var webWorker = processInWebWorker(whammyInWebWorker);

        webWorker.onmessage = function(event) {
            if (event.data.error) {
                webrtcdev.error(event.data.error);
                return;
            }
            callback(event.data);
        };

        webWorker.postMessage(this.frames);
    };

    return {
        /**
         * A more abstract-ish API.
         * @method
         * @memberof Whammy
         * @example
         * recorder = new Whammy().Video(0.8, 100);
         * @param {?number} speed - 0.8
         * @param {?number} quality - 100
         */
        Video: WhammyVideo
    };
})();

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.Whammy = Whammy;
}

// ______________ (indexed-db)
// DiskStorage.js

/**
 * DiskStorage is a standalone object used by {@link RecordRTC} to store recorded blobs in IndexedDB storage.
 * @summary Writing blobs into IndexedDB.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @example
 * DiskStorage.Store({
 *     audioBlob: yourAudioBlob,
 *     videoBlob: yourVideoBlob,
 *     gifBlob  : yourGifBlob
 * });
 * DiskStorage.Fetch(function(dataURL, type) {
 *     if(type === 'audioBlob') { }
 *     if(type === 'videoBlob') { }
 *     if(type === 'gifBlob')   { }
 * });
 * // DiskStorage.dataStoreName = 'recordRTC';
 * // DiskStorage.onError = function(error) { };
 * @property {function} init - This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
 * @property {function} Fetch - This method fetches stored blobs from IndexedDB.
 * @property {function} Store - This method stores blobs in IndexedDB.
 * @property {function} onError - This function is invoked for any known/unknown error.
 * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */


var DiskStorage = {
    /**
     * This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.init();
     */
    init: function() {
        var self = this;

        if (typeof indexedDB === 'undefined' || typeof indexedDB.open === 'undefined') {
            webrtcdev.error('IndexedDB API are not available in this browser.');
            return;
        }

        var dbVersion = 1;
        var dbName = this.dbName || location.href.replace(/\/|:|#|%|\.|\[|\]/g, ''),
            db;
        var request = indexedDB.open(dbName, dbVersion);

        function createObjectStore(dataBase) {
            dataBase.createObjectStore(self.dataStoreName);
        }

        function putInDB() {
            var transaction = db.transaction([self.dataStoreName], 'readwrite');

            if (self.videoBlob) {
                transaction.objectStore(self.dataStoreName).put(self.videoBlob, 'videoBlob');
            }

            if (self.gifBlob) {
                transaction.objectStore(self.dataStoreName).put(self.gifBlob, 'gifBlob');
            }

            if (self.audioBlob) {
                transaction.objectStore(self.dataStoreName).put(self.audioBlob, 'audioBlob');
            }

            function getFromStore(portionName) {
                transaction.objectStore(self.dataStoreName).get(portionName).onsuccess = function(event) {
                    if (self.callback) {
                        self.callback(event.target.result, portionName);
                    }
                };
            }

            getFromStore('audioBlob');
            getFromStore('videoBlob');
            getFromStore('gifBlob');
        }

        request.onerror = self.onError;

        request.onsuccess = function() {
            db = request.result;
            db.onerror = self.onError;

            if (db.setVersion) {
                if (db.version !== dbVersion) {
                    var setVersion = db.setVersion(dbVersion);
                    setVersion.onsuccess = function() {
                        createObjectStore(db);
                        putInDB();
                    };
                } else {
                    putInDB();
                }
            } else {
                putInDB();
            }
        };
        request.onupgradeneeded = function(event) {
            createObjectStore(event.target.result);
        };
    },
    /**
     * This method fetches stored blobs from IndexedDB.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.Fetch(function(dataURL, type) {
     *     if(type === 'audioBlob') { }
     *     if(type === 'videoBlob') { }
     *     if(type === 'gifBlob')   { }
     * });
     */
    Fetch: function(callback) {
        this.callback = callback;
        this.init();

        return this;
    },
    /**
     * This method stores blobs in IndexedDB.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.Store({
     *     audioBlob: yourAudioBlob,
     *     videoBlob: yourVideoBlob,
     *     gifBlob  : yourGifBlob
     * });
     */
    Store: function(config) {
        this.audioBlob = config.audioBlob;
        this.videoBlob = config.videoBlob;
        this.gifBlob = config.gifBlob;

        this.init();

        return this;
    },
    /**
     * This function is invoked for any known/unknown error.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.onError = function(error){
     *     alerot( JSON.stringify(error) );
     * };
     */
    onError: function(error) {
        webrtcdev.error(JSON.stringify(error, null, '\t'));
    },

    /**
     * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.dataStoreName = 'recordRTC';
     */
    dataStoreName: 'recordRTC',
    dbName: null
};

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.DiskStorage = DiskStorage;
}

// ______________
// GifRecorder.js

/**
 * GifRecorder is standalone calss used by {@link RecordRTC} to record video or canvas into animated gif.
 * @license {@link https://github.com/muaz-khan/RecordRTC#license|MIT}
 * @author {@link http://www.MuazKhan.com|Muaz Khan}
 * @typedef GifRecorder
 * @class
 * @example
 * var recorder = new GifRecorder(mediaStream || canvas || context, { width: 1280, height: 720, frameRate: 200, quality: 10 });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     img.src = URL.createObjectURL(blob);
 * });
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 * @param {MediaStream} mediaStream - MediaStream object or HTMLCanvasElement or CanvasRenderingContext2D.
 * @param {object} config - {disableLogs:true, initCallback: function, width: 320, height: 240, frameRate: 200, quality: 10}
 */

function GifRecorder(mediaStream, config) {
    if (typeof GIFEncoder === 'undefined') {
        throw 'Please link: https://cdn.webrtc-experiment.com/gif-recorder.js';
    }

    config = config || {};

    var isHTMLObject = mediaStream instanceof CanvasRenderingContext2D || mediaStream instanceof HTMLCanvasElement;

    /**
     * This method records MediaStream.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!isHTMLObject) {
            if (!config.width) {
                config.width = video.offsetWidth || 320;
            }

            if (!this.height) {
                config.height = video.offsetHeight || 240;
            }

            if (!config.video) {
                config.video = {
                    width: config.width,
                    height: config.height
                };
            }

            if (!config.canvas) {
                config.canvas = {
                    width: config.width,
                    height: config.height
                };
            }

            canvas.width = config.canvas.width;
            canvas.height = config.canvas.height;

            video.width = config.video.width;
            video.height = config.video.height;
        }

        // external library to record as GIF images
        gifEncoder = new GIFEncoder();

        // void setRepeat(int iter) 
        // Sets the number of times the set of GIF frames should be played. 
        // Default is 1; 0 means play indefinitely.
        gifEncoder.setRepeat(0);

        // void setFrameRate(Number fps) 
        // Sets frame rate in frames per second. 
        // Equivalent to setDelay(1000/fps).
        // Using "setDelay" instead of "setFrameRate"
        gifEncoder.setDelay(config.frameRate || 200);

        // void setQuality(int quality) 
        // Sets quality of color quantization (conversion of images to the 
        // maximum 256 colors allowed by the GIF specification). 
        // Lower values (minimum = 1) produce better colors, 
        // but slow processing significantly. 10 is the default, 
        // and produces good color mapping at reasonable speeds. 
        // Values greater than 20 do not yield significant improvements in speed.
        gifEncoder.setQuality(config.quality || 10);

        // Boolean start() 
        // This writes the GIF Header and returns false if it fails.
        gifEncoder.start();

        startTime = Date.now();

        var self = this;

        function drawVideoFrame(time) {
            if (isPausedRecording) {
                return setTimeout(function() {
                    drawVideoFrame(time);
                }, 100);
            }

            lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

            if (typeof lastFrameTime === undefined) {
                lastFrameTime = time;
            }

            // ~10 fps
            if (time - lastFrameTime < 90) {
                return;
            }

            if (!isHTMLObject && video.paused) {
                // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
                // Tweak for Android Chrome
                video.play();
            }

            if (!isHTMLObject) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            if (config.onGifPreview) {
                config.onGifPreview(canvas.toDataURL('image/png'));
            }

            gifEncoder.addFrame(context);
            lastFrameTime = time;
        }

        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

        if (config.initCallback) {
            config.initCallback();
        }
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.stop(function(blob) {
     *     img.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function() {
        if (lastAnimationFrame) {
            cancelAnimationFrame(lastAnimationFrame);
        }

        endTime = Date.now();

        /**
         * @property {Blob} blob - The recorded blob object.
         * @memberof GifRecorder
         * @example
         * recorder.stop(function(){
         *     var blob = recorder.blob;
         * });
         */
        this.blob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: 'image/gif'
        });

        // bug: find a way to clear old recorded blobs
        gifEncoder.stream().bin = [];
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        if (!gifEncoder) {
            return;
        }

        this.pause();

        gifEncoder.stream().bin = [];
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    if (isHTMLObject) {
        if (mediaStream instanceof CanvasRenderingContext2D) {
            context = mediaStream;
            canvas = context.canvas;
        } else if (mediaStream instanceof HTMLCanvasElement) {
            context = mediaStream.getContext('2d');
            canvas = mediaStream;
        }
    }

    if (!isHTMLObject) {
        var video = document.createElement('video');
        video.muted = true;
        video.autoplay = true;

        if (typeof video.srcObject !== 'undefined') {
            video.srcObject = mediaStream;
        } else {
            video.src = URL.createObjectURL(mediaStream);
        }

        video.play();
    }

    var lastAnimationFrame = null;
    var startTime, endTime, lastFrameTime;

    var gifEncoder;
}

if (typeof RecordRTC !== 'undefined') {
    RecordRTC.GifRecorder = GifRecorder;
}

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */function createSnapshotButton(controlBarName , peerinfo){
    var snapshotButton=document.createElement("div");
    snapshotButton.id=controlBarName+"snapshotButton";
    snapshotButton.setAttribute("title", "Snapshot");
    // snapshotButton.setAttribute("data-placement", "bottom");
    // snapshotButton.setAttribute("data-toggle", "tooltip");
    // snapshotButton.setAttribute("data-container", "body");
    snapshotButton.className=snapshotobj.button.class_on;
    snapshotButton.innerHTML=snapshotobj.button.html_on;
    snapshotButton.onclick = function() {
        /*rtcMultiConnection.streams[streamid].takeSnapshot(function(datasnapshot) {*/
        /*
        for(i in webcallpeers ){
            if(webcallpeers[i].userid==rtcMultiConnection.userid){
            }
        }*/

        takeSnapshot(peerinfo, function(datasnapshot) {    
            var snapshotname = "snapshot"+ new Date().getTime();
        
            var peerinfo;
            if(selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);

            peerinfo.filearray.push(snapshotname);
            var numFile= document.createElement("div");
            numFile.value= peerinfo.filearray.length;

            if(fileshareobj.active){
                syncSnapshot(datasnapshot , "imagesnapshot" , snapshotname );
                displayList(peerinfo.uuid , peerinfo , datasnapshot , snapshotname, "imagesnapshot");
                displayFile(peerinfo.uuid , peerinfo , datasnapshot , snapshotname, "imagesnapshot");
            }else{
                displayFile(peerinfo.uuid , peerinfo , datasnapshot , snapshotname, "imagesnapshot");
            } 
        });         
    };
    return snapshotButton;
}

/* *************************************
Snapshot
************************************************/
function takeSnapshot(peerinfo , callback) {
    try{

        function _takeSnapshot(video) {

            if(video){
                var canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || video.clientWidth;
                canvas.height = video.videoHeight || video.clientHeight;

                var context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                /*
                connection.snapshots[userid] = canvas.toDataURL('image/png');
                args.callback && args.callback(connection.snapshots[userid]);*/
            
                callback(canvas.toDataURL('image/png'));
            }else{
                callback("");
            }

        }

        if (peerinfo.videoContainer) return _takeSnapshot(document.getElementById(peerinfo.videoContainer));
        else return "empty";
    }catch(e){
        webrtcdev.error(" [Snapshot - take snapshot] " , e);
    }
    /*
    var userid = args.userid;
    var connection = args.connection;*/

    /*
    for (var stream in connection.streams) {
        stream = connection.streams[stream];
        if (stream.userid == userid && stream.stream && stream.stream.getVideoTracks && stream.stream.getVideoTracks().length) {
            _takeSnapshot(stream.mediaElement);
            continue;
        }
    }*/
}
    
function syncSnapshot(datasnapshot , datatype , dataname ){
    rtcConn.send({
        type:datatype, 
        message:datasnapshot, 
        name : dataname
    });
}

/*function displaySnapshot(snapshotViewer , datasnapshot){
    var snaspshot=document.createElement("img");
    snaspshot.src = datasnapshot;
    document.getElementById(snapshotViewer).appendChild(snaspshot);
    webrtcdev.log("snaspshot ",datasnapshot);
}*/

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                    Geo JS                                                   */
/*-----------------------------------------------------------------------------------*/

if (navigator.geolocation) {
    operatingsystem = navigator.platform;
    navigator.geolocation.getCurrentPosition(showPosition, showError);
} else {
    x.innerHTML = "Geolocation is not supported by this browser.";
}

/**
 * shows position from lat and long
 * @method
 * @name showPosition
 * @param {object} position
 */
function showPosition(position) {
    webrtcdev.log("Latitude: " + position.coords.latitude +
        "<br>Longitude: " + position.coords.longitude);
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    /*return position;*/
}

/**
 * This method handles erro in position data
 * @method
 * @name showError
 * @param {object} error
 */
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            shownotification("User denied the request for Geolocation.")
            break;
        case error.POSITION_UNAVAILABLE:
            shownotification("Location information is unavailable.")
            break;
        case error.TIMEOUT:
            shownotification("The request to get user location timed out.")
            break;
        case error.UNKNOWN_ERROR:
            shownotification("An unknown error occurred.")
            break;
    }
}

/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*.                        Chat JS                                                   */
/*-----------------------------------------------------------------------------------*/

/* 
 * Sends chat messages
 * @method
 * @name sendChatMessage
 * @param {string} msg
 * @param {json} peerinfo
 */
function sendChatMessage(msg, peerinfo) {
    /*var userinfo;*/
    /*try{
        userinfo = getUserinfo(rtcConn.blobURLs[rtcConn.userid], "chat-message.png");
    }catch(e){
        userinfo = "empty";
    }*/
    addNewMessagelocal({
        header: rtcConn.extra.username,
        message: msg,
        userinfo: peerinfo,
        color: rtcConn.extra.color
    });

    rtcConn.send({
        type: "chat",
        userinfo: peerinfo,
        message: msg
    });
}

/* 
 * replaces URLs With HTML Links 
 * @method
 * @name replaceURLWithHTMLLinks
 * @param {string} text
 */
function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp, "<a href='$1' target='_blank'>$1</a>");
}

/* 
 * Display local message and add a snapshot
 * @method
 * @name addNewMessagelocal
 * @param {json} e peermessage
 */
function addNewMessagelocal(e) {
    if ("" != e.message && " " != e.message) {
        // addMessageSnapshotFormat("localMessageClass", e.userinfo, e.message, chatobj.chatBox.id);
        addMessageSnapshotFormat("chat-message self msg-avatar", e.userinfo, e.message, chatobj.chatBox.id);
    }
}

/* 
 * Display message and add a snapshot
 * @method
 * @name addNewMessage
 * @param {json} e peermessage
 */
function addNewMessage(e) {
    if ("" != e.message && " " != e.message) {
        // addMessageSnapshotFormat("remoteMessageClass", e.userinfo, e.message, chatobj.chatBox.id);
        addMessageSnapshotFormat("chat-message user msg-avatar", e.userinfo, e.message, chatobj.chatBox.id);
    }
}

/* 
 * Display local message and add a snapshot
 * @method
 * @name addMessageSnapshotFormat
 * @param {string} messageDivclass
 * @param {json} userinfo
 * @param {string} message
 * @param {dom} parent
 */
function addMessageSnapshotFormat(messageDivclass, userinfo, message, parent) {
    var n = document.createElement("div");
    n.className = messageDivclass;
    webrtcdev.log("addNewMessagelocal", userinfo);

    takeSnapshot(userinfo, function (datasnapshot) {
        var image = document.createElement("img");
        image.src = datasnapshot;
        image.setAttribute("style", "border-radius: 50%;height:40px");

        var t = document.createElement("span");
        t.className = "cm-msg-text";
        t.innerHTML = replaceURLWithHTMLLinks(message);

        n.appendChild(image);
        n.appendChild(t);
        //n.innerHTML = image +" : "+ replaceURLWithHTMLLinks(message);
        // displayFile(peerinfo.uuid , peerinfo, datasnapshot , snapshotname, "imagesnapshot");
    });

    document.getElementById(parent).insertBefore(n, document.getElementById(parent).firstChild);
}

/* 
 * Display Messages in Lineformat
 * @method
 * @name addMessageLineformat
 * @param {string} messageDivclass
 * @param {json} userinfo
 * @param {string} message
 * @param {dom} parent
 */
function addMessageLineformat(messageDivclass, messageheader, message, parent) {
    var n = document.createElement("div");
    n.className = messageDivclass;
    if (messageheader) {
        n.innerHTML = messageheader + " : " + replaceURLWithHTMLLinks(message);
    } else {
        n.innerHTML = replaceURLWithHTMLLinks(message);
    }

    document.getElementById(parent).insertBefore(n, document.getElementById(parent).firstChild);
}


/* 
 * Display Messages in BlockFormat
 * @method
 * @name addMessageBlockFormat
 * @param {string} messageDivclass
 * @param {json} userinfo
 * @param {string} message
 * @param {dom} parent
 */
function addMessageBlockFormat(messageheaderDivclass, messageheader, messageDivclass, message, parent) {

    var t = document.createElement("div");
    t.className = messageheaderDivclass,
        t.innerHTML = '<div className="chatusername">' + messageheader + "</div>";

    var n = document.createElement("div");
    n.className = messageDivclass,
        n.innerHTML = message,

        t.appendChild(n),
        $("#" + parent).append(n);
    /* $("#all-messages").scrollTop($("#all-messages")[0].scrollHeight) */
}


/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */function listDevices() {
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

/**********************************
 Detect Webcam
 **********************************/

/**
 * Detect if webcam is accesible by browser
 * @method
 * @name detectWebcam
 * @param {function} callback
 */
function detectWebcam(callback) {
    let md = navigator.mediaDevices;
    if (!md || !md.enumerateDevices) return callback(false);
    md.enumerateDevices().then(devices => {
        callback(devices.some(device => 'videoinput' === device.kind));
    });
}

/**
 * Detect if Mic is accesible by browser
 * @method
 * @name detectMic
 * @param {function} callback
 */
function detectMic(callback) {
    let md = navigator.mediaDevices;
    if (!md || !md.enumerateDevices) return callback(false);
    md.enumerateDevices().then(devices => {
        callback(devices.some(device => 'audioinput' === device.kind));
    });
}


async function getVideoPermission() {
    // navigator.getUserMedia({ audio: false, video: true}, function(){
    //     outgoingVideo = false;
    // }, function(){
    //  outgoingVideo = false;
    // });
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({audio: false, video: true})
        if (stream.getVideoTracks().length > 0) {
            //code for when none of the devices are available
            webrtcdev.log("--------------------------------- Video Permission obtained ");
            outgoingVideo = true;
            return;
        }
    } catch (err) {
        webrtcdev.error(err.name + ": " + err.message);
    }
    outgoingVideo = false;
    return;
}


async function getAudioPermission() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false})
        if (stream.getAudioTracks().length > 0) {
            //code for when none of the devices are available
            webrtcdev.log("--------------------------------- Audio Permission obtained ");
            outgoingAudio = true;
            return;
        }
    } catch (err) {
        webrtcdev.error(err.name + ": " + err.message);
    }
    outgoingAudio = false;
    return;
}

/************************************
 webrtc get media
 ***********************************/

/**
 * get Video and micrpphone stream media
 * @method
 * @name getCamMedia
 * @param {json} rtcConn
 */
function getCamMedia(rtcConn) {
    rtcConn.dontAttachStream = false,
    rtcConn.dontGetRemoteStream = false;

    webrtcdev.log(" [startJS] getCamMedia  role :", role);

    webrtcdev.log(" start getusermedia - outgoingVideo " + outgoingVideo + " outgoingAudio " + outgoingAudio);
    return new Promise(function (resolve, reject) {
        if (role == "inspector") {
            rtcConn.dontCaptureUserMedia = true;
            console.log("[_mediacontrol.js] getCamMedia  - Joining as inspector without camera Video");
        } else if (outgoingVideo && outgoingAudio) {
            rtcConn.dontCaptureUserMedia = false;
            webrtcdev.log("[_mediacontrol.js] getCamMedia  - Capture Media ");
            rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error 
        } else if (!outgoingVideo && outgoingAudio) {
            rtcConn.dontCaptureUserMedia = false;
            // alert(" start  getCamMedia  - Dont Capture Webcam, only Mic");
            webrtcdev.warn("[_mediacontrol.js] getCamMedia  - Dont Capture Webcam only Mic ");
            rtcConn.getUserMedia();  // not wait for the rtc conn on media stream or on error
        } else {
            rtcConn.dontCaptureUserMedia = true;
            webrtcdev.error(" [_mediacontrol.js] getCamMedia - dont Capture outgoing video ", outgoingVideo);
            window.dispatchEvent(new CustomEvent('webrtcdev', {
                detail: {
                    servicetype: "session",
                    action: "onNoCameraCard"
                }
            }));
        }
        resolve("success");
    }).catch(
        (reason) => {
            webrtcdev.error('[_mediacontrol.js] getCamMedia  - rejected promise (' + reason + ')');
        });
}

function waitForRemoteVideo(_remoteStream, _remoteVideo, _localVideo, _miniVideo) {
    var videoTracks = _remoteStream.getVideoTracks();
    if (videoTracks.length === 0 || _remoteVideo.currentTime > 0) {
        transitionToActive(_remoteVideo, _localVideo, _miniVideo);
    } else {
        setTimeout(function () {
            waitForRemoteVideo(_remoteStream, _remoteVideo, _localVideo, _miniVideo)
        }, 100);
    }
}

function transitionToActive(_remoteVideo, _localVideo, _miniVideo) {
    _remoteVideo.style.opacity = 1;
    if (localVideo != null) {
        setTimeout(function () {
            _localVideo.src = '';
        }, 500);
    }
    if (miniVideo != null) {
        setTimeout(function () {
            _miniVideo.style.opacity = 1;
        }, 1000);
    }
}

function transitionToWaiting() {
    card.style.webkitTransform = 'rotateY(0deg)';
    setTimeout(function () {
        localVideo.src = miniVideo.src;
        localVideo.muted = true;
        miniVideo.src = '';
        remoteVideo.src = '';
        localVideo.style.opacity = 1;
    }, 500);
    miniVideo.style.opacity = 0;
    remoteVideo.style.opacity = 0;
}

/**
 * attach media stream to dom element
 * @method
 * @name attachMediaStream
 * @param {string} remvid
 * @param {stream} stream
 */
function attachMediaStream(remvid, stream) {
    try {
        let element = "";
        webrtcdev.log("[ Mediacontrol - attachMediaStream ] element ", remvid);
        if ((document.getElementsByName(remvid)).length > 0) {
            element = document.getElementsByName(remvid)[0];
        } else if (remvid.video) {
            element = remvid.video;
        } else if (remvid.nodeName == "VIDEO") {
            element = remvid;
        } else {
            return;
        }

        webrtcdev.log("[ Mediacontrol - attachMediaStream ] stream ", stream);
        if (stream) {
            // if (typeof element.src == 'string') {
            //    element.src = URL.createObjectURL(stream);
            // }else if (typeof element.srcObject == 'object') {
            //     element.srcObject = stream;
            // }else{
            //    webrtcdev.log('Error attaching stream to element.' , element , stream);
            // }
            element.srcObject = stream;
            element.play();
            webrtcdev.log("[ Mediacontrol - attachMediaStream ] Media Stream attached to ", element, " successfully");
        } else {
            if ('srcObject' in element) {
                element.srcObject = null;
            } else {
                // Avoid using this in new browsers, as it is going away.
                element.src = null;
            }
            webrtcdev.warn("[ Mediacontrol - attachMediaStream ] Media Stream empty '' attached to ", element, " as stream is not valid ", stream);
        }

    } catch (err) {
        webrtcdev.error(" [ Mediacontrol - attachMediaStream ]  error", err);
    }
}

function reattachMediaStream(to, from) {
    to.src = from.src;
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                       Record JS                                                   */
/*-----------------------------------------------------------------------------------*/

/**
 * Create Record Button to call start and stop recoriding functions
 * @method
 * @name createRecordButton
 * @param {string} controlBarName
 * @param {json} peerinfo
 * @param {string} streamid
 * @param {blob} stream
 */
function createRecordButton(controlBarName, peerinfo, streamid, stream) {
    let recordButton = document.createElement("div");
    recordButton.id = controlBarName + "recordButton";
    recordButton.setAttribute("title", "Record");
    // recordButton.setAttribute("data-placement", "bottom");
    // recordButton.setAttribute("data-toggle", "tooltip");
    // recordButton.setAttribute("data-container", "body");
    recordButton.className = videoRecordobj.button.class_off;
    recordButton.innerHTML = videoRecordobj.button.html_off;
    recordButton.onclick = function (e) {
        if (recordButton.className == videoRecordobj.button.class_on) {
            recordButton.className = videoRecordobj.button.class_off;
            recordButton.innerHTML = videoRecordobj.button.html_off;
            stopRecord(peerinfo, streamid, stream);
        } else if (recordButton.className == videoRecordobj.button.class_off) {
            recordButton.className = videoRecordobj.button.class_on;
            recordButton.innerHTML = videoRecordobj.button.html_on;
            startRecord(peerinfo, streamid, stream);
        }
    };
    return recordButton;
}


var listOfRecorders = {};


/**
 * start Recording the stream using recordRTC
 * @method
 * @name startRecord
 * @param {json} peerinfo
 * @param {string} streamid
 * @param {blob} stream
 */
function startRecord(peerinfo, streamid, stream) {
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
 * @param {string} streamid
 * @param {blob} stream
 */
function stopRecord(peerinfo, streamid, stream) {
    /*var streamid = prompt('Enter stream-id');*/

    if (!listOfRecorders[streamid]) {
        /*throw 'Wrong stream-id';*/
        webrtcdev.log("wrong stream id ");
    }
    let recorder = listOfRecorders[streamid];
    recorder.stopRecording(function () {
        let blob = recorder.getBlob();
        // if (!peerinfo) {
            if (selfuserid)
                peerinfo = findPeerInfo(selfuserid);
            else
                peerinfo = findPeerInfo(rtcConn.userid);
        // }

        /*        
        window.open( URL.createObjectURL(blob) );
        // or upload to server
        var formData = new FormData();
        formData.append('file', blob);
        $.post('/server-address', formData, serverCallback);*/

        let recordVideoname = "recordedvideo" + new Date().getTime();
        peerinfo.filearray.push(recordVideoname);
        let numFile = document.createElement("div");
        numFile.value = peerinfo.filearray.length;
        let fileurl = URL.createObjectURL(blob);

        displayList(peerinfo.uuid, peerinfo, fileurl, recordVideoname, "videoRecording");
        displayFile(peerinfo.uuid, peerinfo, fileurl, recordVideoname, "videoRecording");
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
        var blob = recorder.getBlob();
        webrtcdev.log("scrrecordStreamid stopped recording blob is ", blob);
    });

    var recorder2 = listOfRecorders[scrrecordAudioStreamid];
    recorder2.stopRecording(function () {
        var blob = recorder2.getBlob();
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
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//************************************************************************
 Canvas Record
 *************************************************************************/
var scrrecordStream = null, scrrecordStreamid = null;
var mediaRecorder = null, chunks = [];
// var scrrecordAudioStream = null , scrrecordAudioStreamid = null;

// function syncVideoScreenRecording(data , datatype , dataname ){
//     rtcMultiConnection.send({type:datatype, message:data  , name : dataname});
// }

// function autorecordScreenVideo(){
// }

// function webrtcdevScreenRecordConstraints(chromeMediaSourceId){
    // webrtcdev.log(" webrtcdevScreenRecordConstraints :" + chromeMediaSourceId);
    // navigator.getUserMedia(
    //     {
    //         audio: true,
    //         video: false
    //     },
    //     function stream(event) {

    //         var peerinfo;
    //         if(selfuserid)
    //             peerinfo = findPeerInfo(selfuserid);
    //         else
    //             peerinfo = findPeerInfo(rtcConn.userid);

    //         scrrecordAudioStreamid = event.id ;
    //         scrrecordAudioStream = event ;
    //         startRecord(peerinfo ,  scrrecordAudioStreamid , scrrecordAudioStream);
    //     },
    //     function error(err) {
    //         webrtcdev.log(" Error in webrtcdevScreenRecordConstraints "  , err);
    //         if (isChrome && location.protocol === 'http:') {
    //             alert('Please test this WebRTC experiment on HTTPS.');
    //         } else if(isChrome) {
    //             alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
    //         } else if(!!navigator.mozGetUserMedia) {
    //             alert(Firefox_Screen_Capturing_Warning);
    //         }
    //     }
    // );
// }


// {

//  static _startScreenCapture() {
//     if (navigator.getDisplayMedia) {
//       return navigator.getDisplayMedia({video: true});
//     } else if (navigator.mediaDevices.getDisplayMedia) {
//       return navigator.mediaDevices.getDisplayMedia({video: true});
//     } else {
//       return navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}});
//     }
//   }

//   async _startRecording(e) {
//     console.log('Start capturing.');
//     this.status = 'Screen recording started.';
//     this.enableStartCapture = false;
//     this.enableStopCapture = true;
//     this.enableDownloadRecording = false;
//     this.requestUpdate('buttons');

//     if (this.recording) {
//       window.URL.revokeObjectURL(this.recording);
//     }

//     this.chunks = [];
//     this.recording = null;
//     this.stream = await ScreenSharing._startScreenCapture();
//     this.stream.addEventListener('inactive', e => {
//       console.log('Capture stream inactive - stop recording!');
//       this._stopCapturing(e);
//     });

//   }

//   _stopRecording(e) {
//     console.log('Stop capturing.');
//     this.status = 'Screen recorded completed.';
//     this.enableStartCapture = true;
//     this.enableStopCapture = false;
//     this.enableDownloadRecording = true;

//     this.mediaRecorder.stop();
//     this.mediaRecorder = null;
//     this.stream.getTracks().forEach(track => track.stop());
//     this.stream = null;

//     this.recording = window.URL.createObjectURL(new Blob(this.chunks, {type: 'video/webm'}));
//   }

//   _downloadRecording(e) {
//     console.log('Download recording.');
//     this.enableStartCapture = true;
//     this.enableStopCapture = false;
//     this.enableDownloadRecording = false;

//     const downloadLink = this.shadowRoot.querySelector('a#downloadLink');
//     downloadLink.addEventListener('progress', e => console.log(e));
//     downloadLink.href = this.recording;
//     downloadLink.download = 'screen-recording.webm';
//     downloadLink.click();
//   }
// }

// customElements.define('screen-sharing', ScreenSharing);

async function webrtcdevRecordScreen() {
    webrtcdev.log("[screenrecord js] webrtcdevRecordScreen");

    // if (navigator.getDisplayMedia) {
    //   return navigator.getDisplayMedia({video: true});
    // } else if (navigator.mediaDevices.getDisplayMedia) {
    //   return navigator.mediaDevices.getDisplayMedia({video: true});
    // } else {
    //   return navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}});
    // }
    try {

        // uses await to asynchronously wait for getDisplayMedia() to resolve with a MediaStream
        scrrecordStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: {
                mediaSource: "screen",
                mandatory: {
                    maxWidth: window.screen.width > 1920 ? window.screen.width : 1920,
                    maxHeight: window.screen.height > 1080 ? window.screen.height : 1080
                },
                optional: []
            }
        });
        webrtcdev.log('[screenrecord js] stream', scrrecordStream);
    } catch (err) {
        webrtcdev.error("[screenrecord js] Error in webrtcdevRecordScreen ", err);
        // List of errors 
        //AbortError-  doesn't match any of the other exceptions below occurred.
        // InvalidStateError - document in whose context getDisplayMedia() was called is not fully active; for example, perhaps it is not the frontmost tab.
        // NotAllowedError -  Permission to access a screen area was denied by the user, or the current browsing instance is not permitted access to screen sharing.
        // NotFoundError - No sources of screen video are available for capture.
        // NotReadableError - The user selected a screen, window, tab, or other source of screen data, but a hardware or operating system level error or lockout occurred, prevenging the sharing of the selected source.
        // OverconstrainedError - After creating the stream, applying the specified constraints fails because no compatible stream could be generated.
        // TypeError - The specified constraints include constraints which are not permitted when calling getDisplayMedia(). These unsupported constraints are advanced and any constraints which in turn have a member named min or exact.    
    }
    ;

    scrrecordStream.addEventListener('inactive', e => {
        webrtcdev.log('Capture stream inactive - stop recording!');
        webrtcdevStopRecordScreen(e);
    });

    try {
        mediaRecorder = new MediaRecorder(scrrecordStream, {mimeType: 'video/webm'});
        mediaRecorder.addEventListener('dataavailable', event => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        });
        mediaRecorder.start(10);
        webrtcdev.log('[screenrecord js] mediaRecorder', mediaRecorder);
    } catch (err) {
        webrtcdev.error("[screenrecord js] Error in mediaRecorder ", err);
    }
}

function webrtcdevStopRecordScreen(event) {

    webrtcdev.log("webrtcdevStopRecordScreen", event);
    // window.postMessage("webrtcdev-extension-stopsource-screenrecord", "*");
    mediaRecorder.stop();
    mediaRecorder = null;

    scrrecordStream.getTracks().forEach(track => track.stop());
    scrrecordStream = null;

    let recording = window.URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}));

    PostBlob(recording);
}

// Using ffmpeg concept and merging it together
// var workerPath = 'https://archive.org/download/ffmpeg_asm/ffmpeg_asm.js';
// function processInWebWorker() {
//     var blob = URL.createObjectURL(new Blob(['importScripts("' + workerPath + '");var now = Date.now;function print(text) {postMessage({"type" : "stdout","data" : text});};onmessage = function(event) {var message = event.data;if (message.type === "command") {var Module = {print: print,printErr: print,files: message.files || [],arguments: message.arguments || [],TOTAL_MEMORY: message.TOTAL_MEMORY || false};postMessage({"type" : "start","data" : Module.arguments.join(" ")});postMessage({"type" : "stdout","data" : "Received command: " +Module.arguments.join(" ") +((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")});var time = now();var result = ffmpeg_run(Module);var totalTime = now() - time;postMessage({"type" : "stdout","data" : "Finished processing (took " + totalTime + "ms)"});postMessage({"type" : "done","data" : result,"time" : totalTime});}};postMessage({"type" : "ready"});'], {
//         type: 'application/javascript'
//     }));

//     var worker = new Worker(blob);
//     URL.revokeObjectURL(blob);
//     return worker;
// }

// var worker;
// var videoFile = !!navigator.mozGetUserMedia ? 'video.gif' : 'video.webm';

/**
 * merging the recorded audio and video stream
 * @method
 * @name stopSessionRecord
 * @param {json} peerinfo
 * @param {string} scrrecordStreamid
 * @param {blob} scrrecordStream
 * @param {string} scrrecordAudioStreamid
 * @param {blob} scrrecordAudioStream
 */
// function mergeStreams(videoBlob, audioBlob) {
//     var peerinfo;
//     if(selfuserid){
//         peerinfo = findPeerInfo(selfuserid);
//     }else{
//         peerinfo = findPeerInfo(rtcConn.userid);
//     }

//     var recordVideoname = "recordedvideo"+ new Date().getTime();
//     peerinfo.filearray.push(recordVideoname);
//     var numFile= document.createElement("div");
//     numFile.value= peerinfo.filearray.length;
//     var fileurl=URL.createObjectURL(videoBlob);

//     var recordAudioname = "recordedaudio"+ new Date().getTime();
//     peerinfo.filearray.push(recordAudioname);
//     var numFile2= document.createElement("div");
//     numFile2.value= peerinfo.filearray.length;
//     var fileurl2=URL.createObjectURL(audioBlob);

//     var sessionRecordfileurl={
//         videofileurl: fileurl,
//         audiofileurl: fileurl2
//     };

//     var sessionRecordName={
//         videoname: recordVideoname,
//         audioname: recordAudioname
//     };

//    displayList(peerinfo.uuid , peerinfo , sessionRecordfileurl , sessionRecordName , "sessionRecording");
//    displayFile(peerinfo.uuid , peerinfo , sessionRecordfileurl , sessionRecordName , "sessionRecording"); 

// }

// function convertStreams(videoBlob, audioBlob) {
//     var vab;
//     var aab;
//     var buffersReady;
//     var workerReady;
//     var posted = false;

//     var fileReader1 = new FileReader();
//     fileReader1.onload = function() {
//         vab = this.result;

//         if (aab) buffersReady = true;

//         if (buffersReady && workerReady && !posted) postMessage();
//     };

//     var fileReader2 = new FileReader();
//     fileReader2.onload = function() {
//         aab = this.result;

//         if (vab) buffersReady = true;

//         if (buffersReady && workerReady && !posted) postMessage();
//     };

//     webrtcdev.log("videoBlob ", videoBlob);
//     webrtcdev.log("audioBlob ", audioBlob);

//     fileReader1.readAsArrayBuffer(videoBlob);
//     fileReader2.readAsArrayBuffer(audioBlob);

//     if (!worker) {
//         worker = processInWebWorker();
//     }

//     worker.onmessage = function(event) {
//         var message = event.data;
//         if (message.type == "ready") {
//             webrtcdev.log('<a href="'+ workerPath +'" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file has been loaded.');
//             workerReady = true;
//             if (buffersReady)
//                 postMessage();
//         } else if (message.type == "stdout") {
//             webrtcdev.log(message.data);
//         } else if (message.type == "start") {
//             webrtcdev.log('<a href="'+ workerPath +'" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file received ffmpeg command.');
//         } else if (message.type == "done") {
//             webrtcdev.log(JSON.stringify(message));

//             var result = message.data[0];
//             webrtcdev.log(JSON.stringify(result));

//             var blob = new Blob([result.data], {
//                 type: 'video/mp4'
//             });

//             webrtcdev.log(JSON.stringify(blob));

//             PostBlob(blob);
//         }
//     };

//     var postMessage = function() {
//         posted = true;

//         worker.postMessage({
//             type: 'command',
//             arguments: [
//                 '-i', videoFile,
//                 '-i', 'audio.wav',
//                 '-c:v', 'mpeg4',
//                 '-c:a', 'vorbis',
//                 '-b:v', '6400k',
//                 '-b:a', '4800k',
//                 '-strict', 'experimental', 'output.mp4'
//             ],
//             files: [
//                 {
//                     data: new Uint8Array(vab),
//                     name: videoFile
//                 },
//                 {
//                     data: new Uint8Array(aab),
//                     name: "audio.wav"
//                 }
//             ]
//         });
//     };
// }

function PostBlob(resource) {

    //var video = document.createElement('video');
    //video.controls = true;
    var fileurl = null;
    if (resource instanceof Blob) {
        fileurl = URL.createObjectURL(blob);
        //source.type = 'video/mp4; codecs=mpeg4';
    } else {
        fileurl = resource;
    }
    //video.appendChild(source);
    //video.download = 'Play mp4 in VLC Player.mp4';    
    //document.body.appendChild(video);
    /*    
    var h2 = document.createElement('h2');
    h2.innerHTML = '<a href="' + source.src + '" target="_blank" download="Play mp4 in VLC Player.mp4">Download Converted mp4 and play in VLC player!</a>';
    inner.appendChild(h2);
    h2.style.display = 'block';
    inner.appendChild(video);*/
    // video.tabIndex = 0;
    // video.focus();
    // video.play();

    var peerinfo;
    if (selfuserid) {
        peerinfo = findPeerInfo(selfuserid);
    } else {
        peerinfo = findPeerInfo(rtcConn.userid);
    }
    var recordVideoname = "recordedvideo" + new Date().getTime();
    peerinfo.filearray.push(recordVideoname);
    var numFile = document.createElement("div");
    numFile.value = peerinfo.filearray.length;

    displayList(peerinfo.uuid, peerinfo, fileurl, recordVideoname, "videoScreenRecording");
    displayFile(peerinfo.uuid, peerinfo, fileurl, recordVideoname, "videoScreenRecording");
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
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
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                         Draw JS                                                   */
/*-----------------------------------------------------------------------------------*/
var CanvasDesigner;
var isDrawOpened = false;

/**
 * Open draw iframe inside of drawCanvasContainer and add tools
 * @method
 * @name webrtcdevCanvasDesigner
 * @param {json} drawCanvasobj
 */
function openDrawBoard() {
    isDrawOpened = true;
    let boarddata = {
        event: "open",
        from: "remote",
        board: drawCanvasobj.drawCanvasContainer,
        button: drawCanvasobj.button
    };
    rtcConn.send({type: "canvas", board: boarddata});
    webrtcdevCanvasDesigner(drawCanvasobj);
    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "draw",
            action: "onDrawBoardActive"
        }
    }));
}

/**
 * Open draw iframe inside of drawCanvasContainer and add tools
 * @method
 * @name closeDrawBoard
 * @param {json} drawCanvasobj
 */
function closeDrawBoard() {
    isDrawOpened = false;
    let boarddata = {
        event: "close",
        from: "remote",
        board: drawCanvasobj.drawCanvasContainer,
        button: drawCanvasobj.button
    };
    rtcConn.send({type: "canvas", board: boarddata});
    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "draw",
            action: "onDrawBoardTerminate"
        }
    }));
}

/**
 * Open draw iframe inside of drawCanvasContainer and add tools
 * @method
 * @name webrtcdevCanvasDesigner
 * @param {json} drawCanvasobj
 */
function webrtcdevCanvasDesigner(drawCanvasobj) {
    webrtcdev.log("[drawjs] drawCanvasobj.drawCanvasContainer ", drawCanvasobj.drawCanvasContainer);
    if (document.getElementById(drawCanvasobj.drawCanvasContainer).innerHTML.indexOf("iframe") < 0) {
        try {
            CanvasDesigner.addSyncListener(function (data) {
                rtcConn.send({type: "canvas", draw: data});
            });

            CanvasDesigner.setSelected('pencil');

            CanvasDesigner.setTools({
                pencil: true,
                eraser: true
            });

            CanvasDesigner.appendTo(document.getElementById(drawCanvasobj.drawCanvasContainer));
        } catch (e) {
            webrtcdev.error(" Canvas drawing not supported ", e);
        }
    } else {
        webrtcdev.log("[drawjs] CanvasDesigner already started iframe is attached ");
    }

}

/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                    Reconnect JS                                                   */
/*-----------------------------------------------------------------------------------*/


function createButtonRedial(){
    var reconnectButton= document.createElement("span");
    reconnectButton.className= reconnectobj.button.class;
    reconnectButton.innerHTML= reconnectobj.button.html;
    reconnectButton.onclick=function(){
        var r = confirm("Do you want to reconnet ?");
        if (r == true) {
          //location.reload();

          $(this).html('<img src="http://www.bba-reman.com/images/fbloader.gif" />');
           setTimeout(function(){ 
            $(this).html(reconnectobj.button.html )
          }, 3000);

        } else {
           //do nothing
        }
    };
    var li =document.createElement("li");
    li.appendChild(reconnectButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

function assignButtonRedial(id){
    document.getElementById(id).onclick=function(){
        var r = confirm("Do you want to reconnect ?");
        if (r == true) {

            //rtcConn.rejoin(rtcConn.connectionDescription);
            if (!rtcConn.peers[rtcConn.connectionDescription.remoteUserId]) return;
            rtcConn.peers[rtcConn.connectionDescription.remoteUserId].peer.close();

            rtcConn.rejoin(rtcConn.connectionDescription);

            $(this).html('<img src="http://www.bba-reman.com/images/fbloader.gif" />');
            setTimeout(function(){ 
            
            document.getElementById(id).innerHTML= reconnectobj.button.html ;
          }, 3000);

           //location.reload();
        } else {
           //do nothing
        }
    };
}
/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                    listen-in JS                                                   */

/*-----------------------------------------------------------------------------------*/

/**
 * creates a listen in link for the sessionid
 * @method
 * @name getlisteninlink
 * @return {string}listeninlink
 */
this.getlisteninlink = function() {
    if (!sessionid) console.error("cant generate listenin link , no session id found ")
    try {
        webrtcdev.log(" Current Session ", window.origin);
        let listeninlink = window.origin + "/#" + sessionid + '?appname=webrtcwebcall&role=inspector&audio=0&video=0';
        return listeninlink;
    } catch (e) {
        webrtcdev.error("ListenIn :", e);
        return false;
    }
};

function freezescreen() {
    document.body.setAttribute("style", "pointer-events: none;");
}

/**
 * collect all webrtcStats and stream to Server to be stored in a file with session id as the file name
 * @method
 * @name sendwebrtcdevLogs
 * @param {string} url
 * @param {string} key
 * @param {string} senderuseremail
 * @param {string} receiveruseremail
 * @return Http request
 */
this.sendlisteninlink = function (url, key, senderuseremail, receiveruseremail) {

    var dataArray = {
        apikey: key,
        senderuseremail: senderuseremail,
        receiveruseremail: receiveruseremail,
        webrtcsessionid: webrtcdevobj.sessionid,
        connectiontype: 1
    };

    return fetch(url, {
        method: 'post',
        crossDomain: true,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': key,
            'Access-Control-Allow-Origin': window.location.origin,
            'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify(dataArray)
    })
        .then(apires => apires.json())
        .then(apires => console.log("Listenin API response ", apires))
        .catch(error => console.error("Listenin API response ", error));
};
/*-----------------------------------------------------------------------------------*/

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                       cursor JS                                                   */
/*-----------------------------------------------------------------------------------*/

var cursorX;
var cursorY;
var cursorinterval;

function placeCursor(element, x_pos, y_pos) {
    element.style.position = "absolute";
    /*element.style.left = '100px';
      element.style.top = '100px';*/
    element.style.left = x_pos + 'px';
    element.style.top = y_pos + 'px';
}

function startShareCursor() {
    document.getElementById("cursor1").setAttribute("style", "display:block");
    document.onmousemove = function (e) {
        cursorX = e.pageX + 10;
        cursorY = e.pageY;
    }
    cursorinterval = setInterval(shareCursor, 500);
}

function stopShareCursor() {
    document.getElementById("cursor1").setAttribute("style", "display:none");
    rtcConn.send({
        type: "pointer",
        action: "stopCursor"
    });
    clearInterval(cursorinterval);
}

/*function assignButtonCursor(bid){
  var button =document.getElementById(bid);
  button.onclick=function(){
    startShareCursor();
  }
}*/

function shareCursor() {
    var element = document.getElementById("cursor1");
    element.hidden = false;

    placeCursor(element, cursorX, cursorY);

    rtcConn.send({
        type: "pointer",
        action: "startCursor",
        corX: cursorX,
        corY: cursorY
    });
}

function createCursorButton(controlBarName, peerinfo, streamid, stream) {
    var button = document.createElement("span");
    button.id = controlBarName + "cursorButton";
    button.setAttribute("data-val", "mute");
    button.setAttribute("title", "Cursor");
    button.className = cursorobj.button.class_on;
    button.innerHTML = cursorobj.button.html_on;
    button.onclick = function () {
        var btnid = button.id;
        var peerinfo;
        if (selfuserid)
            peerinfo = findPeerInfo(selfuserid);
        else
            peerinfo = findPeerInfo(rtcConn.userid);

        if (btnid.indexOf(peerinfo.controlBarName) > -1) {
            if (button.className == cursorobj.button.class_on) {
                startShareCursor();
                button.className = cursorobj.button.class_off;
                button.innerHTML = cursorobj.button.html_off;
            } else if (button.className == cursorobj.button.class_off) {
                stopShareCursor();
                button.className = cursorobj.button.class_on;
                button.innerHTML = cursorobj.button.html_on;
            }
            //syncButton(audioButton.id);   
        } else {
            alert(" Use Local Pointer button ");
        }

    };
    return button;
}


/*-----------------------------------------------------------------------------------*/
/*
    <div id="cursor1" class="fa fa-hand-o-up" style="width:0"></div>
    <div id="cursor2" class="fa fa-hand-o-up" style="width:0"></div>*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                    Code Editor  JS                                                */
/*-----------------------------------------------------------------------------------*/

function createCodeEditorButton(){
    var codeeditorButton= document.createElement("span");
    codeeditorButton.className=codeeditorobj.button.class_off ;
    codeeditorButton.innerHTML=codeeditorobj.button.html_off;
    for( x in codeeditorobj.languages)
        document.getElementById("CodeStyles").innerHTML=document.getElementById("CodeStyles").innerHTML+codeeditorobj.languages[x];

    var codeArea= document.getElementById("codeArea").value;
    var modeVal="text/javascript"; 

    editor = CodeMirror.fromTextArea(document.getElementById("codeArea"), {
         mode: modeVal,
         styleActiveLine: true,
         lineNumbers: false,
         lineWrapping: true
    });
    editor.setOption('theme', 'mdn-like');

    codeeditorButton.onclick=function(){
        if(codeeditorButton.className==codeeditorobj.button.class_off){
            codeeditorButton.className= codeeditorobj.button.class_on ;
            codeeditorButton.innerHTML= codeeditorobj.button.html_on;
            startWebrtcdevcodeeditorSync();
            document.getElementById(codeeditorobj.codeeditorContainer).hidden=false;
        }else if(codeeditorButton.className==codeeditorobj.button.class_on){
            codeeditorButton.className= codeeditorobj.button.class_off ;
            codeeditorButton.innerHTML= codeeditorobj.button.html_off;
            stopWebrtcdevcodeeditorSync();
            document.getElementById(codeeditorobj.codeeditorContainer).hidden=true;
        }
    };

    var li =document.createElement("li");
    li.appendChild(codeeditorButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

function sendWebrtcdevCodeeditorSync(evt){
    if(evt.which ==  37 || evt.which ==  38 || evt.which ==  39 || evt.which ==  40  || evt.which==17 || evt.which == 18|| evt.which == 16){
        return true; 
    }

    var tobj ={
        "option" : "text",
        "codeContent": editor.getValue()
    }
    webrtcdev.log(" sending " , tobj);
    rtcMultiConnection.send({
            type: "codeeditor", 
            data: tobj
    });
}

function sendWebrtcdevCodeeditorStyleSync(evt){
    $("#CodeStyles option:selected").each(function() {
      var info = CodeMirror.findModeByMIME( $( this ).attr('mime')); 
      if (info) {
        mode = info.mode;
        spec = $( this ).attr('mime');
        editor.setOption("mode", spec);
        CodeMirror.autoLoadMode(editor, mode);
        //webrtcdev.log(info + " "+ mode+ " "+ spec + " "+ editor);
      }
    });

    var tobj ={
        "option" : "menu",
        "codeMode":mode,
        "codeSpec":spec
    }

    webrtcdev.log(" sending " , tobj);
    rtcMultiConnection.send({
            type: "codeeditor", 
            data: tobj
    });
}

function receiveWebrtcdevCodeeditorSync(data){
    webrtcdev.log("codeeditor " , data);
    if(data.option=="text"){
        var pos = editor.getCursor();
        editor.setValue(data.codeContent);
        editor.setCursor(pos);
    }else if(data.option=="menu"){
        editor.setOption("mode", evt.data.codeSpec);
        CodeMirror.autoLoadMode(editor, evt.data.codeMode);
    }
}

function startWebrtcdevcodeeditorSync(){
    document.getElementById(codeeditorobj.codeeditorContainer).addEventListener("keyup", sendWebrtcdevCodeeditorSync, false);
     document.getElementById("CodeStyles").addEventListener("change", sendWebrtcdevCodeeditorStyleSync, false);
}

function stopWebrtcdevcodeeditorSync(){
    document.getElementById(codeeditorobj.codeeditorContainer).removeEventListener("keyup", sendWebrtcdevCodeeditorSync, false);
}

/*-----------------------------------------------------------------------------------*/

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */function createTextEditorButton() {
    var texteditorButton = document.createElement("span");
    texteditorButton.className = texteditorobj.button.class_off;
    texteditorButton.innerHTML = texteditorobj.button.html_off;

    texteditorButton.onclick = function () {
        if (texteditorButton.className == texteditorobj.button.class_off) {
            texteditorButton.className = texteditorobj.button.class_on;
            texteditorButton.innerHTML = texteditorobj.button.html_on;
            startWebrtcdevTexteditorSync();
            document.getElementById(texteditorobj.texteditorContainer).hidden = false;
        } else if (texteditorButton.className == texteditorobj.button.class_on) {
            texteditorButton.className = texteditorobj.button.class_off;
            texteditorButton.innerHTML = texteditorobj.button.html_off;
            stopWebrtcdevTexteditorSync();
            document.getElementById(texteditorobj.texteditorContainer).hidden = true;
        }
    };
    var li = document.createElement("li");
    li.appendChild(texteditorButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/*************************************************************************
 Text Editor
 ******************************************************************************/

function sendWebrtcdevTexteditorSync(evt) {
    // Left: 37 Up: 38 Right: 39 Down: 40 Esc: 27 SpaceBar: 32 Ctrl: 17 Alt: 18 Shift: 16 Enter: 13
    if (evt.which == 37 || evt.which == 38 || evt.which == 39 || evt.which == 40 || evt.which == 17 || evt.which == 18 || evt.which == 16) {
        return true; // handle left up right down  control alt shift
    }

    var tobj = {
        "option": "text",
        "content": document.getElementById(texteditorobj.texteditorContainer).value
    }
    webrtcdev.log(" sending ", document.getElementById(texteditorobj.texteditorContainer).value);
    rtcMultiConnection.send({
        type: "texteditor",
        data: tobj
    });
}

function receiveWebrtcdevTexteditorSync(data) {
    webrtcdev.log("texteditor ", data);
    if (data.option == "text") {
        document.getElementById(texteditorobj.texteditorContainer).value = data.content;
    }
}

function startWebrtcdevTexteditorSync() {
    document.getElementById(texteditorobj.texteditorContainer).addEventListener("keyup", sendWebrtcdevTexteditorSync, false);
}

function stopWebrtcdevTexteditorSync() {
    document.getElementById(texteditorobj.texteditorContainer).removeEventListener("keyup", sendWebrtcdevTexteditorSync, false);
}

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*********************************************
 ICE
 **************************************************/
/**
 * {@link https://github.com/altanai/webrtc/blob/master/client/build/scripts/_turn.js|TURN}
 * @summary JavaScript audio/video recording library runs top over WebRTC getUserMedia API.
 * @author {@link https://telecom.altanai.com/about-me/|Altanai}
 * @typedef _turn.js
 * @function
 * @example
 *  turn    = (session.hasOwnProperty('turn')?session.turn:null);
 *  if(turn!=null ){
 *       getICEServer( turn.username ,turn.secretkey , turn.domain,
 *                      turn.application , turn.room , turn.secure); 
 *   }
 */

var iceServers = [];

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}

//function getICEServer(username , secretkey , domain , appname , roomname , secure){
function getICEServer() {
    var url = 'https://global.xirsys.net/_turn/Amplechat/';
    var xhr = createCORSRequest('PUT', url);
    xhr.onload = function () {
        webrtcdev.log("[turn Js] Response from Xirsys ", xhr.responseText);
        if (JSON.parse(xhr.responseText).v == null) {
            webrtcdevIceServers = "err";
            shownotification("Media will not able to pass through " + JSON.parse(xhr.responseText).e);
        } else {
            webrtcdevIceServers = JSON.parse(xhr.responseText).v.iceServers;
            webrtcdev.log("Obtained iceServers", webrtcdevIceServers);
        }
    };
    xhr.onerror = function () {
        webrtcdev.error('Woops, there was an error making xhr request.');
    };
    xhr.setRequestHeader("Authorization", "Basic " + btoa("farookafsari:e35af4d2-dbd5-11e7-b927-0c3f27cba33f"));
    xhr.send();
}
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
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

            // send to webworkers maintaining time in background activity
            tobj.push({
                zone: peerinfo.zone,
                userid: peerinfo.userid,
                remotetime: "remoteTime_" + peerinfo.userid
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
        webrtcdev.log("[timerjs] peerTimeZone -- " , zone , userid);
        // set peers zone in webcallpeers
        appendToPeerValue(userid , "zone" ,  zone);

        // Starting peer timer for all peers
        var peerinfo = findPeerInfo(userid);
        webrtcdev.log("[timerjs] peerTimeZone , updated peerinfo with zone-- " , peerinfo);
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
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//*-----------------------------------------------------------------------------------*/
/*                        Tracing JS                                                   */
/*-----------------------------------------------------------------------------------*/

this.getwebrtcdevlogs = function () {
    if (webrtcdevlogs)
        return webrtcdevlogs;

    return null;
};

/**
 * collect all webrtcStats and stream to Server to be stored in a file with session id as the file name
 * @method
 * @name sendwebrtcdevLogs
 * @param {string} url
 * @param {string} key
 * @param {string} msg
 * @return Http request
 */
this.sendwebrtcdevLogs = function (url, key, msg) {
    const data = new FormData();
    data.append('name', username || "no name");
    if (document.getElementById("help-screenshot-body"))
        data.append('scimage', document.getElementById("help-screenshot-body").src);

    console.log("=========================== message" , msg);

    data.append("apikey", key);
    data.append("useremail", selfemail);
    data.append("sessionid", sessionid);
    data.append("message", msg);
    if (webrtcdevlogs && (typeof webrtcdevlogs) == "object") {
        let logs = webrtcdevlogs;
        data.append("logfileContent", logs);
    } else {
        data.append("logfileContent", ["none"]);
        webrtcdev.error(" check if widget help is active to true ");
    }

    return fetch(url, {
        method: 'POST',
        body: data
    })
    .then(apires => apires.json())
    .then(apires => console.log("Listenin API response ", apires))
    .catch(error => console.error("Listenin API response ", error));
};


/**
 * add user id and email and status to page header area in debug mode
 * @method
 * @name showUserStats
 */
this.showUserStats = showUserStats = function () {
    var data = " userid-" + selfuserid +
        " Email-" + selfemail +
        " Audio-" + outgoing.audio +
        " Video-" + outgoing.video +
        " Role- " + role;
    if (document.getElementById("userstatus")) {
        document.getElementById("userstatus").innerHTML = data;
    } else {
        document.getElementById("mainDiv").prepend(data);
    }
}

/**
 * get screenshost to send along with debug logs
 * @method
 * @name getscreenshot
 */
this.getscreenshot = function (name) {
    // "#bodyDiv"
    var parentdom = document.querySelector(name);
    /*html2canvas(document.querySelector("#bodyDiv")).then(canvas => {*/
    html2canvas(parentdom).then(canvas => {
        /*document.getElementById("help-screenshot-body").src = canvas.toDataURL();*/
        return canvas.toDataURL();
    });
}

/**
 * get screenshost to send along with dbeug logs
 * @method
 * @name getScreenshotOfElement
 */
function getScreenshotOfElement(element, posX, posY, width, height, callback) {
    html2canvas(element, {
        onrendered: function (canvas) {
            var context = canvas.getContext('2d');
            var imageData = context.getImageData(posX, posY, width, height).data;
            var outputCanvas = document.createElement('canvas');
            var outputContext = outputCanvas.getContext('2d');
            outputCanvas.width = width;
            outputCanvas.height = height;

            var idata = outputContext.createImageData(width, height);
            idata.data.set(imageData);
            outputContext.putImageData(idata, 0, 0);
            callback(outputCanvas.toDataURL().replace("data:image/png;base64,", ""));
        },
        width: width,
        height: height,
        useCORS: true,
        taintTest: false,
        allowTaint: false
    });
}

/*-----------------------------------------------------------------------------------*/
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * find information about a peer form array of peers based on userid
 * @method
 * @name findPeerInfo
 * @param {string} userid
 */
var findPeerInfo = function (userid) {
    /*    
    if(rtcConn.userid==userid){
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
 * update already ecisting webcallpeers obj by appending a value , mostly used for timer zone
 * @method
 * @name appendToPeerValue
 * @param {string} userid
 * @param {json} value
 */
function appendToPeerValue(userid, value) {
    for (x in webcallpeers) {
        if (webcallpeers[x].userid == userid) {
            webcallpeers[x].key = value;
        }
    }
}

/**
 * update info about a peer in list of peers (webcallpeers)
 * @method
 * @name removePeerInfo
 * @param {string} userid
 * @param {string} usernamess
 * @param {string} usercolor
 * @param {string} type
 */
function removePeerInfo(index) {
    return new Promise(function (resolve, reject) {
        webrtcdev.log(" [peerinfomanager] removePeerInfo - remove index: ", index, webcallpeers[index]);
        webcallpeers.splice(index, 1);
        resolve("done");
    })
        .catch((err) => {
            webrtcdev.error("[peerinfomanager] removePeerInfo - Promise rejected ", err);
            reject("err");
        });
}

/**
 * update info about a peer in list of peers (webcallpeers)
 * @method
 * @name updatePeerInfo
 * @param {string} userid
 * @param {string} username
 * @param {string} usercolor
 * @param {string} type
 */
function updatePeerInfo(userid, username, usecolor, useremail, userrole, type) {
    webrtcdev.log("[peerinfomanager] updating peerInfo: ", userid, username, usecolor, useremail, userrole, type);
    var updateflag = -1;

    return new Promise(function (resolve, reject) {
        // if userid deosnt exist , exit
        if (!userid) {
            console.error("[peerinfomanager] userid is null / undefined, cannot create PeerInfo");
            reject("userid is null / undefined, cannot create PeerInfo");
            return;
        }

        // if userid is already present in webcallpeers , exit
        for (var x in webcallpeers) {
            if (webcallpeers[x].userid == userid) {
                webrtcdev.log("[peerinfomanager] UserID is already existing in webcallpeers, update the fields only at index ", x);
                updateflag = x;
                break;
            }
        }

        // check if total capacity of webcallpeers has been reached 
        peerInfo = {
            videoContainer: "video" + userid,
            videoHeight: null,
            videoClassName: null,
            userid: userid,
            name: username,
            color: usecolor,
            email: useremail,
            role: userrole,
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

        if (updateflag > -1) {
            webcallpeers[updateflag] = peerInfo;
            webrtcdev.log("[peerinfomanager] updated peerInfo: ", peerInfo);
        } else {
            webcallpeers.push(peerInfo);
            webrtcdev.log("[peerinfomanager] created peerInfo: ", peerInfo);
        }
        resolve("done");
    })
        .catch((err) => {
            webrtcdev.error("[peerinfomanager] Promise rejected ", err);
        });
}

/**
 * getwebcallpeers
 * @method
 * @name getwebcallpeers
 */
this.getwebcallpeers = function () {
    return webcallpeers;
};

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * set Widgets.
 */
var setWidgets = function (rtcConn) {

    return new Promise(function (resolve, reject) {

        // ---------------------------------- Chat Widget --------------------------------------------------
        if (chatobj.active) {
            if (chatobj.inputBox && chatobj.inputBox.text_id && document.getElementById(chatobj.inputBox.text_id)) {
                webrtcdev.log("[sessionmanager]Assign chat Box ");
                assignChatBox(chatobj);
            } else {
                webrtcdev.log("[sessionmanager]Create chat Box ");
                createChatBox(chatobj);
            }
            webrtcdev.log("[sessionmanager] chat widget loaded ");
        } else {
            webrtcdev.log("[sessionmanager] chat widget deactivated  ");
        }

        // ---------------------------------- Screen record Widget --------------------------------------------------
        if (screenrecordobj && screenrecordobj.active && role != "inspector") {
            if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                webrtcdev.log("[sessionmanager] Assign Screen Record Button ");
                assignScreenRecordButton(screenrecordobj);
            } else {
                webrtcdev.log("[sessionmanager] Create Screen Record Button ");
                createScreenRecordButton(screenrecordobj);
            }
            webrtcdev.log(" [sessionmanager] Screen record widget loaded ");
        } else if (screenrecordobj && !screenrecordobj.active) {
            if (screenrecordobj.button && screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                document.getElementById(screenrecordobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[sessionmanager] Screen record widget deactivated");
        }

        // ---------------------------------- Screenshare Widget --------------------------------------------------
        if (screenshareobj.active) {
            if (screenshareobj.button.shareButton.id && getElementById(screenshareobj.button.shareButton.id)) {
                webrtcdev.log("[sessionmanager] Assign screenshare Button ");
                assignScreenShareButton(screenshareobj.button.shareButton);
            } else {
                webrtcdev.log("[sessionmanager] Create screenshare Button ");
                createScreenShareButton(screenshareobj);
            }
            webrtcdev.log(" [sessionmanager]screen share widget loaded ");
        } else {
            webrtcdev.warn("[sessionmanager] screen share widget deactivated ");
        }

        // ---------------------------------- Reconnect Widget --------------------------------------------------
        if (reconnectobj && reconnectobj.active) {
            if (reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                webrtcdev.log("[sessionmanager] Reconnect Button Assigned");
                assignButtonRedial(reconnectobj.button.id);
            } else {
                webrtcdev.log("[sessionmanager]Rconnect Button created");
                createButtonRedial(reconnectobj);
            }
            webrtcdev.log(" [sessionmanager]reconnect widget loaded ");
        } else if (reconnectobj && !reconnectobj.active) {
            if (reconnectobj.button && reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                document.getElementById(reconnectobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn(" [sessionmanager] reconnect widget deactivated ");
        }

        // ---------------------------------- Cursor Widget --------------------------------------------------
        if (cursorobj && cursorobj.active) {
            hideelem("cursor1");
            hideelem("cursor2");
            webrtcdev.log(" [sessionmanager] cursor widget not loaded ");
        }else{
            webrtcdev.warn(" [sessionmanager] cursor widget deactivated ");
        }

        // ---------------------------------- Listenin Widget --------------------------------------------------
        if (listeninobj && listeninobj.active) {
            // listenintextbox = document.getElementById(listeninobj.button.textbox);
            // webrtcdev.log("[widget js] document.getElementById(listeninobj.button.textbox) " ,listenintextbox);
            // listenintextbox.value =  this.getlisteninlink();

            if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                //assignButtonRedial(reconnectobj.button.id);
            } else {
                //createButtonRedial();
            }
            webrtcdev.log("[widget js] listenin widget loaded ");
        } else if (listeninobj && !listeninobj.active) {
            if (listeninobj.button && listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                document.getElementById(listeninobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[widget js] listenin widget deactivated ");
        }

        // ---------------------------------- Timer Widget --------------------------------------------------
        if (timerobj && timerobj.active) {
            // startTime();
            // showTimeZone();
            activateButtons(timerobj);
            hideelem(timerobj.container.id)
        } else if (timerobj && !timerobj.active) {
            if (timerobj.button.id && document.getElementById(timerobj.button.id)) {
                document.getElementById(timerobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[widget js] timer widget deactivated ");
        }

        // ---------------------------------- Draw Widget --------------------------------------------------
        if (drawCanvasobj && drawCanvasobj.active) {
            if (drawCanvasobj.container && drawCanvasobj.container.id && document.getElementById(drawCanvasobj.container.id)) {
                document.getElementById(drawCanvasobj.container.id).hidden = true;
            }
            if (drawCanvasobj.button && drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                assigndrawButton(drawCanvasobj);
            } else {
                createdrawButton(drawCanvasobj);
            }

            CanvasDesigner = (function () {
                var iframe;
                let tools = {
                    line: true,
                    pencil: true,
                    dragSingle: true,
                    dragMultiple: true,
                    eraser: true,
                    rectangle: true,
                    arc: true,
                    bezier: true,
                    quadratic: true,
                    text: true
                };

                var selectedIcon = 'pencil';

                function syncData(data) {
                    if (!iframe) return;

                    iframe.contentWindow.postMessage({
                        canvasDesignerSyncData: data
                    }, '*');
                }

                var syncDataListener = function (data) {
                    webrtcdev.log("syncDataListener", data);
                };

                function onMessage() {
                    if (!event.data || !event.data.canvasDesignerSyncData) return;
                    syncDataListener(event.data.canvasDesignerSyncData);
                }

                /*window.addEventListener('message', onMessage, false);*/

                var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                var eventer = window[eventMethod];
                var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                // Listen to message from child window
                eventer(messageEvent, function (e) {
                    webrtcdev.log("CanvasDesigner parent received message : ", e.data);

                    if (e.data.modalpopup) {
                        saveButtonCanvas.click();
                        //return;
                    } else if (e.data || e.data.canvasDesignerSyncData) {
                        syncDataListener(e.data.canvasDesignerSyncData);
                    } else if (!e.data || !e.data.canvasDesignerSyncData) {
                        webrtcdev.log("parent received unexpected message");
                        //return;
                    }

                }, false);

                return {
                    appendTo: function (parentNode) {
                        iframe = document.createElement('iframe');
                        iframe.id = "drawboard",
                            iframe.src = 'widget.html?tools=' + JSON.stringify(tools) + '&selectedIcon=' + selectedIcon,
                            iframe.style.width = "100%",
                            iframe.style.height = "100%",
                            iframe.allowtransparency = true,
                            iframe.style.border = 0;
                        parentNode.appendChild(iframe);
                    },
                    destroy: function () {
                        if (iframe) {
                            iframe.parentNode.removeChild(iframe);
                        }
                        window.removeEventListener('message', onMessage);
                    },
                    addSyncListener: function (callback) {
                        syncDataListener = callback;
                    },
                    syncData: syncData,
                    setTools: function (_tools) {
                        tools = _tools;
                    },
                    setSelected: function (icon) {
                        if (typeof tools[icon] !== 'undefined') {
                            selectedIcon = icon;
                        }
                    }
                };
            })();
            webrtcdev.log("[sessionmanager] draw widget loaded ");
        } else if (drawCanvasobj && !drawCanvasobj.active) {
            if (drawCanvasobj.button && drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                document.getElementById(drawCanvasobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[sessionmanager] draw widget ndeactivated ");
        }

        // ---------------------------------- TextEditor Widget --------------------------------------------------
        if (texteditorobj.active) {
            createTextEditorButton();
        }

        // ---------------------------------- CodeEditor Widget --------------------------------------------------
        if (codeeditorobj.active) {
            createCodeEditorButton();
        }

        // ---------------------------------- Fileshare Widget --------------------------------------------------
        if (fileshareobj.active) {

            webrtcdev.log("[sessionmnagare] fileshareobj "),
                rtcConn.enableFileSharing = true;
            // rtcConn.filesContainer = document.body || document.documentElement;
            // /*setFileProgressBarHandlers(rtcConn);*/
            rtcConn.filesContainer = document.getElementById(fileshareobj.fileShareContainer);
            if (fileshareobj.button.id && document.getElementById(fileshareobj.button.id)) {
                assignFileShareButton(fileshareobj);
            } else {
                createFileShareButton(fileshareobj);
            }
            webrtcdev.log(" [sessionmanager] File sharing widget loaded ");
        } else {
            webrtcdev.warn("[sessionmanager] File sharing widget not loaded ");
        }

        // ---------------------------------- stats Widget --------------------------------------------------
        if (statisticsobj && statisticsobj.active) {
            try {
                document.getElementById(statisticsobj.statsConainer).innerHTML = "";
            } catch (e) {
                webrtcdev.error("[sessionmanager] statisticsobj statsConainer not found", e);
            }
        }

        // ---------------------------------- Help Widget --------------------------------------------------
        if (helpobj && helpobj.active) {
            try {

                document.getElementById(helpobj.helpContainer).innerHTML = "";
            } catch (err) {
                webrtcdev.error("[sessionmanager] helpobj helpContainer not found", err);
            }
        }
        resolve("success");
    });
};

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */// function handleError(error) {
//   if (error.name === 'ConstraintNotSatisfiedError') {
//     let v = constraints.video;
//     webrtcdev.error(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
//   } else if (error.name === 'PermissionDeniedError') {
//     webrtcdev.error('Permissions have not been granted to use your camera and ' +
//       'microphone, you need to allow the page access to your devices in ' +
//       'order for the demo to work.');
//   }
//   webrtcdev.error(`getUserMedia error: ${error.name}`, error);

//   outgoingVideo = false;
// }

/**
 * function to start session with socket
 * @method
 * @name startSession
 * @param {object} connection
 */
function startSocketSession(rtcConn, socketAddr, sessionid) {
    webrtcdev.log("[sessionmanager] startSocketSession , set selfuserid ", rtcConn.userid);
    if (!selfuserid)
        selfuserid = rtcConn.userid;
    else
        webrtcdev.warn("[sessionmanager] trying to overwrite remoteobj.userdetails.usercolorelfuserid");

    return new Promise((resolve, reject) => {
        try {
            let addr = "/";
            if (socketAddr != "/") {
                addr = socketAddr;
            }
            webrtcdev.log("[sessionmanager] StartSession" + sessionid, " on address ", addr);
            socket = io.connect(addr, {
                transports: ['websocket']
            });
            // socket.set('log level', 3);
        } catch (err) {
            webrtcdev.error(" problem in socket connnection", err);
            throw (" problem in socket connnection");
        }

        if (sessionid) {
            shownotification("Checking status of  : " + sessionid);
            socket.emit("presence", {
                channel: sessionid
            });
        } else {
            shownotification("Invalid session");
            webrtcdev.error("[sessionmanager] Session id undefined ");
            return;
        }

        // Socket Listeners
        socket.on("connect", function () {
            socket.on('disconnected', function () {
                shownotification("Disconnected from signaller ");
            });
        });

        socket.on("presence", function (channelpresence) {
            //If debug mode is on , show user detaisl at top under mainDiv
            if (debug) showUserStats();
            webrtcdev.log("[sessionmanager] presence for sessionid ", channelpresence);
            if (channelpresence) joinWebRTC(sessionid, selfuserid);
            else openWebRTC(sessionid, selfuserid, remoteobj.maxAllowed || 10);
        });

        socket.on("open-channel-resp", function (event) {
            webrtcdev.log("[sessionmanager] --------------open-channel-resp---------------------  ", event);
            if (event.status && event.channel == sessionid) {

                let promise = new Promise(function (resolve, reject) {
                    webrtcdev.log(" [open-channel-resp] ",
                        " Session video:", outgoingVideo,
                        " audio: ", outgoingAudio,
                        " data: ", outgoingData,
                        " OfferToReceiveAudio: ", incomingAudio,
                        " OfferToReceiveVideo: ", incomingVideo
                    );

                    rtcConn.connectionType = "open",
                        rtcConn.session = {
                            video: outgoingVideo,
                            audio: outgoingAudio,
                            data: outgoingData
                        },
                        rtcConn.sdpConstraints.mandatory = {
                            OfferToReceiveAudio: incomingAudio,
                            OfferToReceiveVideo: incomingVideo
                        },
                        rtcConn.open(event.channel, function (res) {
                            // alert(" callback from open room ", res);
                            webrtcdev.log(" [sessionmanager] offer/answer webrtc ", selfuserid, " with role ", role);
                        });
                    resolve("ok");
                }).then(function (res) {
                    updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local"),
                        webrtcdev.log(" [sessionmanager] updated local peerinfo for open-channel ");
                }).catch((reason) => {
                    webrtcdev.error(' [sessionmanager] Handle rejected promise (' + reason + ')');
                });

                getCamMedia(rtcConn);
                webrtcdev.log(" [sessionmanager] open-channel-resp -  done cam media ");
            } else {
                // signaller doesnt allow channel open
                alert("Could not open this channel, Server refused");
                webrtcdev.error(" [sessionmanager] Could not open this channel, Server refused");
            }
            if (event.message)
                shownotification(event.msgtype + " : " + event.message);
        });

        socket.on("join-channel-resp", function (event) {
            webrtcdev.log("[sessionmanager] --------------join-channel-resp---------------------  ", event);

            if (event.status && event.channel == sessionid) {

                let promise = new Promise(function (resolve, reject) {

                    webrtcdev.log(" [ join-channel-resp ] ",
                        " Session video:", outgoingVideo,
                        " audio: ", outgoingAudio,
                        " data: ", outgoingData,
                        " OfferToReceiveAudio: ", incomingAudio,
                        " OfferToReceiveVideo: ", incomingVideo
                    );
                    rtcConn.connectionType = "join",
                        rtcConn.session = {
                            video: outgoingVideo,
                            audio: outgoingAudio,
                            data: outgoingData
                        },
                        rtcConn.sdpConstraints.mandatory = {
                            OfferToReceiveAudio: incomingAudio,
                            OfferToReceiveVideo: incomingVideo
                        },
                        rtcConn.remoteUsers = event.users;
                    resolve(); // immediately give the result: 123
                });

                promise.then(
                    rtcConn.connectionDescription = rtcConn.join(event.channel),
                    webrtcdev.info(" [sessionmanager] offer/answer webrtc  ", selfuserid, " with role ", role)
                ).then(
                    // for a new joiner , update his local info 
                    updatePeerInfo(selfuserid, selfusername, selfcolor, selfemail, role, "local"),
                    webrtcdev.log(" [sessionmanager] updated local peerinfo for join-channel ")
                ).catch((reason) => {
                    webrtcdev.error('Handle rejected promise (' + reason + ')');
                });

                getCamMedia(rtcConn),
                    webrtcdev.log(" [sessionmanager] join-channel-resp -  done cam media ");

                if (event.message)
                    shownotification(event.msgtype + " : " + event.message);
            } else {
                // signaller doesnt allow channel Join
                webrtcdev.error(" [sessionmanager] Could not join this channel, Server refused");
                alert("Could not join this channel, Server refused ");
            }
        });

        socket.on("channel-event", function (event) {
            webrtcdev.log("[sessionmanager] --------------channel-event---------------------  ", event);

            if (event.type == "new-join" && event.msgtype != "error") {
                webrtcdev.log("[session manager ] - new-join-channel ");

                // check if maxAllowed capacity of the session isnt reached before updating peer info, else return
                if (remoteobj.maxAllowed != "unlimited" && webcallpeers.length <= remoteobj.maxAllowed) {
                    webrtcdev.log("[sessionmanager] channel-event : peer length " + webcallpeers.length + " is less than max capacity of session  of the session " + remoteobj.maxAllowed);
                    let participantId = event.data.sender;
                    if (!participantId) {
                        webrtcdev.error("[sartjs] channel-event : userid not present in channel-event:" + event.type);
                        reject("userid not found");
                    }
                    let peerinfo = findPeerInfo(participantId);
                    let name = event.data.extra.name,
                        color = event.data.extra.color,
                        email = event.data.extra.email,
                        role = event.data.extra.role;
                    if (!peerinfo) {
                        webrtcdev.log(" [sartjs] channel-event : PeerInfo not already present, create new peerinfo");
                        // If peerinfo is not present for new participant , treat him as Remote
                        if (name == "LOCAL") {
                            name = "REMOTE";
                        }
                        updatePeerInfo(participantId, name, color, email, role, "remote");
                        shownotification(event.data.extra.role + "  " + event.type);
                    } else {
                        // Peer was already present, this is s rejoin 
                        webrtcdev.log(" [sartjs] channel-event : PeerInfo was already present, this is s rejoin, update the peerinfo ");
                        updatePeerInfo(participantId, name, color, email, role, "remote");
                        shownotification(event.data.extra.role + " " + event.type);
                    }

                    if (!peerinfo) {
                        peerinfo = findPeerInfo(participantId)
                    }
                    peerinfo.type = "remote";
                    peerinfo.stream = "";
                    peerinfo.streamid = "";
                    updateWebCallView(peerinfo);

                    // event emitter for local connect
                    window.dispatchEvent(new CustomEvent('webrtcdev', {
                        detail: {
                            servicetype: "session",
                            action: "onLocalConnect"
                        },
                    }));

                } else {
                    // max capacity of session is reached 
                    webrtcdev.error("[sartjs] channel-event : max capacity of session is reached ", remoteobj.maxAllowed);
                    shownotification("Another user is trying to join this channel but max count [ " + remoteobj.maxAllowed + " ] is reached", "warning");

                }

            } else {
                webrtcdev.warn(" unhandled channel event ");
            }
        });
        resolve("done");
    })
        .catch((err) => {
            webrtcdev.error("[sessionmanager] startSocketSession error -", err);
            reject(err);
        });
}


/*
 * set Real Time Communication connection
 * @method
 * @name setRtcConn
 * @param {int} sessionid
*/
var setRtcConn = function (sessionid) {

    return new Promise((resolve, reject) => {

        webrtcdev.log("[sessionmanager - setRtcConn] initiating RtcConn"),

            rtcConn = new RTCMultiConnection(),

            rtcConn.channel = this.sessionid,
            rtcConn.socketURL = location.hostname + ":8085/",

            // turn off media till connection happens
            webrtcdev.log("info", "[sessionmanager] set dontAttachStream , dontCaptureUserMedia , dontGetRemoteStream as true "),
            rtcConn.dontAttachStream = true,
            rtcConn.dontCaptureUserMedia = true,
            rtcConn.dontGetRemoteStream = true,

            rtcConn.onNewParticipant = function (participantId, userPreferences) {
                webrtcdev.log("[sartjs] rtcconn onNewParticipant, participantId -  ", participantId, " , userPreferences - ", userPreferences);
                //shownotification("[sartjs] onNewParticipant userPreferences.connectionDescription.sender : " + participantId + " name : "+ remoteusername + " requests new participation ");
                rtcConn.acceptParticipationRequest(participantId, userPreferences);
            },

            rtcConn.onopen = function (event) {

                webrtcdev.log("[sessionmanager] rtconn onopen - ", event);
                try {

                    webrtcdev.log("[sessionmanager onopen] selfuserid ", selfuserid);

                    // Add remote peer userid to remoteUsers
                    remoteUsers = rtcConn.peers.getAllParticipants();
                    webrtcdev.log(" [sessionmanager onopen] Collecting remote peers", remoteUsers);


                    // remove old non existing peers, excluded selfuserid
                    webrtcdev.log(" [sessionmanager onopen] webcallpeers length ", webcallpeers.length);
                    if (webcallpeers.length - remoteUsers.length > 1) {
                        for (x in webcallpeers) {
                            webrtcdev.log(" [sessionmanager onopen] webcallpeers[" + x + "]", webcallpeers[x]);
                            if (!(remoteUsers.includes(webcallpeers[x].userid)) && (webcallpeers[x].userid != selfuserid)) {
                                console.warn("[sessionmanager] remove PeerInfo - ", webcallpeers[x].userid, " which neither exists in remote peer and not is selfuserid");
                                removePeerInfo(x);
                            }
                        }
                    }
                    webrtcdev.log(" [sessionmanager] removePeerInfo  After  ", webcallpeers);

                    // add new peers
                    for (x in remoteUsers) {
                        webrtcdev.log(" [sessionmanager] join-channel. Adding remote peer ", remoteUsers[x]);
                        if (remoteUsers[x] == event.userid) {
                            let remoterole = event.extra.role || "participant", // will fail in case of 2 listeners
                                remotecolor = event.extra.color,
                                remoteemail = event.extra.email,
                                remoteusername = (event.extra.name == "LOCAL" ? "REMOTE" : event.extra.name);

                            updatePeerInfo(remoteUsers[x], remoteusername, remotecolor, remoteemail, remoterole, "remote");
                            if (remoterole == "inspector") {
                                shownotificationWarning("This session is being inspected ");
                            }
                            break;
                        }
                        webrtcdev.log(" [sessionmanager onopen] created/updated local peerinfo for open-channel ");
                    }

                    // Remove Duplicates from remote
                    // remoteUsers = remoteUsers.filter(function (elem, index, self) {
                    //     return index == self.indexOf(elem);
                    // });

                    // setting local caches
                    webrtcdev.log(" [sessionmanager onopen] setting cache - channel " + sessionid + " with self-userid " + selfuserid + " and remoteUsers " + remoteUsers);

                    // In debug mode let the users create multiple user sesison in same browser ,
                    // do not use localstoarge values to get old userid for resuse
                    if (!debug) {
                        if (!localStorage.getItem("userid"))
                            localStorage.setItem("userid", selfuserid);

                        if (!localStorage.getItem("remoteUsers"))
                            localStorage.setItem("remoteUsers", remoteUsers);

                        if (!localStorage.getItem("channel"))
                            localStorage.setItem("channel", sessionid);
                    }

                    webrtcdev.log(" [sessionmanager onopen] webcallpeers ", webcallpeers);
                    // Connect to webrtc
                    if (rtcConn.connectionType == "open")
                        connectWebRTC("open", sessionid, selfuserid, []);
                    else if (rtcConn.connectionType == "join")
                        connectWebRTC("join", sessionid, selfuserid, remoteUsers);
                    else
                        shownotification("connnection type is neither open nor join", "warning");

                    shownotification(event.extra.name + " joined session ", "info");
                    showdesktopnotification(document.title, event.extra.name + " joined session ");

                    if (timerobj && timerobj.active) {
                        startsessionTimer(timerobj);
                        shareTimePeer();
                    }
                    window.dispatchEvent(new CustomEvent('webrtcdev', {
                        detail: {
                            servicetype: "session",
                            action: "onSessionConnect"
                        }
                    }));

                    // stats widget
                    if (statisticsobj && statisticsobj.active) {
                        //populate RTP stats
                        showRtpstats();
                    }

                } catch (err) {
                    shownotification("problem in session open ", "warning");
                    webrtcdev.error("problem in session open", err);
                }
            },

            rtcConn.onMediaError = function (error, constraints) {
                webrtcdev.error("[sessionmanager] onMediaError - ", error, " constraints ", constraints);

                // Join without stream
                webrtcdev.warn("[sessionmanager] onMediaError- Joining without camera Stream");
                shownotification(error.name + " Joining without camera Stream ", "warning");
                localVideoStreaming = false;
                // For local Peer , if camera is not allowed or not connected then put null in video containers
                let peerinfo = webcallpeers[0];
                peerinfo.type = "Local";
                peerinfo.stream = "";
                peerinfo.streamid = "";
                updateWebCallView(peerinfo);

                // event emitter for app client
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "session",
                        action: "onLocalConnect"
                    }
                }));
            },

            rtcConn.onstream = function (event) {
                webrtcdev.log("[sessionmanager onstream ] on stream Started event ", event);
                if (event.type == "local") localVideoStreaming = true;

                var peerinfo = findPeerInfo(event.userid);
                if (!peerinfo) {
                    webrtcdev.error("[sartjs] onstream - PeerInfo not present in webcallpeers ", event.userid, " creating it now ");

                    //userid, username, usecolor, useremail, userrole, type
                    updatePeerInfo(event.userid, event.extra.name, event.extra.color, event.extra.email, event.extra.role, event.type),
                        webrtcdev.log(" [sessionmanager] onstream - updated local peerinfo for open-channel "),
                        peerinfo = findPeerInfo(event.userid);

                } else if (role == "inspector" && event.type == "local") {
                    // ignore any incoming stream from inspector
                    webrtcdev.info("[sessionmanager] onstream - ignore any incoming stream from inspector");
                }

                peerinfo.type = event.type;
                peerinfo.stream = event.stream;
                peerinfo.streamid = event.stream.streamid;
                updateWebCallView(peerinfo);

                // event emitter for app client
                window.dispatchEvent(new CustomEvent('webrtcdev', {
                    detail: {
                        servicetype: "session",
                        action: "onLocalConnect"
                    },
                }));
            },

            rtcConn.onstreamended = function (event) {
                webrtcdev.log(" On streamEnded event ", event);
                let mediaElement = document.getElementById(event.streamid);
                if (mediaElement) {
                    mediaElement.parentNode.removeChild(mediaElement);
                }
            },

            rtcConn.chunkSize = 50 * 1000,

            rtcConn.onmessage = function (e) {
                webrtcdev.log("[sessionmanager] on message ", e);
                if (e.data.typing) {
                    updateWhotyping(e.extra.name + " is typing ...");
                } else if (e.data.stoppedTyping) {
                    updateWhotyping("");
                } else {
                    let msgpeerinfo = findPeerInfo(e.userid);
                    switch (e.data.type) {
                        case "screenshare":
                            if (e.data.message == "startscreenshare") {
                                let scrroomid = e.data.screenid;
                                shownotification("Starting screen share ", scrroomid);
                                //createScreenViewButton();
                                let button = document.getElementById(screenshareobj.button.shareButton.id);
                                button.className = screenshareobj.button.shareButton.class_busy;
                                button.innerHTML = screenshareobj.button.shareButton.html_busy;
                                button.disabled = true;
                                connectScrWebRTC("join", scrroomid);
                            } else if (e.data.message == "screenshareStartedViewing") {
                                screenshareNotification("", "screenshareStartedViewing");
                            } else if (e.data.message == "stoppedscreenshare") {
                                shownotification("Screenshare has stopped : " + e.data.screenStreamid);
                                //createScreenViewButton();
                                let button = document.getElementById(screenshareobj.button.shareButton.id);
                                button.className = screenshareobj.button.shareButton.class_off;
                                button.innerHTML = screenshareobj.button.shareButton.html_off;
                                button.disabled = false;
                                webrtcdevCleanShareScreen(e.data.screenStreamid);
                            } else {
                                webrtcdev.warn(" unrecognized screenshare message ", e.data.message);
                            }
                            break;
                        case "chat":
                            updateWhotyping(e.extra.name + " has send message");
                            addNewMessage({
                                header: e.extra.name,
                                message: e.data.message,
                                userinfo: e.data.userinfo,
                                color: e.extra.color
                            });
                            window.dispatchEvent(new CustomEvent('webrtcdev', {
                                detail: {
                                    servicetype: "chat",
                                    action: "onchat"
                                }
                            }));
                            break;
                        case "imagesnapshot":
                            displayList(null, msgpeerinfo, e.data.message, e.data.name, "imagesnapshot");
                            displayFile(null, msgpeerinfo, e.data.message, e.data.name, "imagesnapshot");
                            break;
                        case "videoRecording":
                            displayList(null, msgpeerinfo, e.data.message, e.data.name, "videoRecording");
                            displayFile(null, msgpeerinfo, e.data.message, e.data.name, "videoRecording");
                            break;
                        case "videoScreenRecording":
                            displayList(null, msgpeerinfo, e.data.message, e.data.name, "videoScreenRecording");
                            displayFile(null, msgpeerinfo, e.data.message, e.data.name, "videoScreenRecording");
                            break;
                        case "file":
                            addNewMessage({
                                header: e.extra.name,
                                message: e.data.message,
                                userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "chat-message.png"),
                                color: e.extra.color
                            });
                            break;
                        case "canvas":
                            if (e.data.draw) {
                                CanvasDesigner.syncData(e.data.draw);
                            } else if (e.data.board) {
                                webrtcdev.log(" Canvas : ", e.data);
                                if (e.data.board.from == "remote") {
                                    if (e.data.board.event == "open" && isDrawOpened != true)
                                        syncDrawBoard(e.data.board);
                                    else if (e.data.board.event == "close" && isDrawOpened == true)
                                        syncDrawBoard(e.data.board);
                                }
                            } else {
                                webrtcdev.warn(" Board data mismatch", e.data);
                            }
                            break;
                        case "texteditor":
                            receiveWebrtcdevTexteditorSync(e.data.data);
                            break;
                        case "codeeditor":
                            receiveWebrtcdevCodeeditorSync(e.data.data);
                            break;
                        case "pointer":
                            var elem = document.getElementById("cursor2");
                            if (elem) {
                                if (e.data.action == "startCursor") {
                                    elem.setAttribute("style", "display:block");
                                    placeCursor(elem, e.data.corX, e.data.corY);
                                } else if (e.data.action == "stopCursor") {
                                    elem.setAttribute("style", "display:none");
                                }
                            } else {
                                alert(" Cursor for remote is not present ");
                            }

                            break;
                        case "timer":
                            if (msgpeerinfo) {
                                //check if the peer has stored zone and time info
                                if (!msgpeerinfo.time) {
                                    msgpeerinfo.time = e.data.time;
                                }
                                if (!msgpeerinfo.zone) {
                                    msgpeerinfo.zone = e.data.zone;
                                }
                                webrtcdev.log("[sessionmanager] webcallpeers appended with zone and datetime ", msgpeerinfo);
                            }
                            webrtcdev.log("[sessionmanager] peerTimerStarted, start peerTimeZone and startPeersTime");
                            peerTimeZone(e.data.zone, e.userid);
                            startPeersTime(e.data.time, e.data.zone, e.userid);
                            break;
                        case "buttonclick":
                            var buttonElement = getElementById(e.data.buttonName);
                            if (buttonElement.getAttribute("lastClickedBy") != rtcConn.userid) {
                                buttonElement.setAttribute("lastClickedBy", e.userid);
                                buttonElement.click();
                            }
                            break;
                        case "syncOldFiles":
                            sendOldFiles();
                            break;
                        case "shareFileRemove":
                            webrtcdev.log(" [sessionmanager] shareFileRemove - remove file : ", e.data._filename);
                            var progressdiv = e.data._element;
                            var filename = e.data._filename;
                            let removeButton = "removeButton" + progressdiv;

                            if (document.getElementById("display" + filename))
                                hideelem("display" + filename);

                            if (document.getElementById(progressdiv)) {
                                hideelem(progressdiv);
                                removeFile(progressdiv);
                                webrtcdev.log(" [sessionmanager] shareFileRemove done");
                            } else {
                                webrtcdev.log(" [sessionmanager] shareFileRemove already done since ", progressdiv, "element doesnt exist ");
                                // already removed
                                return;
                            }
                            document.getElementById(removeButton).click();
                            hideelem(removeButton);

                            break;
                        case "shareFileStopUpload":
                            var progressid = e.data._element;
                            webrtcdev.log(" [sessionmanager] shareFileStopUpload", progressid);
                            // var filename = e.data._filename;

                            for (x in webcallpeers) {
                                for (y in webcallpeers[x].filearray) {
                                    if (webcallpeers[x].filearray[y].pid == progressid) {
                                        console.log("[ sessionmanager ] shareFileStopUpload -  filepid ", webcallpeers[x].filearray[y].pid, " | status ", webcallpeers[x].filearray[y].status);
                                        webcallpeers[x].filearray[y].status = "stopped";
                                        hideFile(progressid);
                                        removeFile(progressid);
                                        return;
                                    }
                                }
                            }
                            //  let stopuploadButton = "stopuploadButton"+filename;
                            // document.getElementById(stopuploadButton).hidden = true;
                            break;
                        default:
                            webrtcdev.warn(" unrecognizable message from peer  ", e);
                            break;
                    }
                }

            },

            rtcConn.sendMessage = function (event) {
                webrtcdev.log(" sendMessage ", event);
                event.userid = rtcConn.userid,
                    event.extra = rtcConn.extra,
                    rtcConn.sendCustomMessage(event)
            },

            rtcConn.onleave = function (e) {
                /*
                addNewMessage({
                    header: e.extra.name,
                    message: e.extra.name + " left session.",
                    userinfo: getUserinfo(rtcConn.blobURLs[e.userid], "info.png"),
                    color: e.extra.color
                }), */

                var peerinfo = findPeerInfo(e.userid);
                webrtcdev.log(" RTCConn onleave user", e, " his peerinfo ", peerinfo, " from webcallpeers ", webcallpeers);
                if (e.extra.name != "undefined")
                    shownotification(e.extra.name + "  left the conversation.");
                //rtcConn.playRoleOfInitiator()

                /*if(peerinfo){
                    destroyWebCallView(peerinfo, function (result) {
                        if (result)
                            removePeerInfo(e.userid);
                    });
                }*/
            },

            rtcConn.onclose = function (e) {
                webrtcdev.warn(" RTCConn on close conversation ", e);
            },

            rtcConn.onEntireSessionClosed = function (event) {
                rtcConn.attachStreams.forEach(function (stream) {
                    stream.stop();
                });
                shownotification("Session Disconneted");
                //eventEmitter.emit('sessiondisconnected', '');
            },

            rtcConn.onFileStart = function (file) {
                webrtcdev.log("onFileStart", file);
                fileSharingStarted(file)
            },

            rtcConn.onFileProgress = function (event) {
                fileSharingInprogress(event)
            },

            rtcConn.onFileEnd = function (file) {
                fileSharingEnded(file)
            },

            rtcConn.takeSnapshot = function (userid, callback) {
                takeSnapshot({
                    userid: userid,
                    connection: connection,
                    callback: callback
                });
            },

            rtcConn.connectionType = null,
            rtcConn.remoteUsers = [],

            rtcConn.extra = {
                uuid: rtcConn.userid,
                name: selfusername || "",
                // color: selfcolor || "", // user rmeote color do that joining parties can take it correctly
                color: (typeof remoteobj.userdetails === 'undefined') ? "" : remoteobj.userdetails.usercolor,
                email: selfemail || "",
                role: role || "participant"
            },

            rtcConn.socketMessageEvent = 'RTCMultiConnection-Message',
            rtcConn.socketCustomEvent = 'RTCMultiConnection-Custom-Message',

            rtcConn.enableFileSharing = true,
            rtcConn.filesContainer = document.body || document.documentElement,

            rtcConn.iceServers = webrtcdevIceServers,

            webrtcdev.log(" [sessionmanager] rtcConn : ", rtcConn);

        // if(this.turn!=null && this.turn !="none"){
        //     if (!webrtcdevIceServers) {
        //         return;
        //     }
        //     webrtcdev.info(" WebRTC dev ICE servers ", webrtcdevIceServers);
        //     rtcConn.iceServers = webrtcdevIceServers;
        //     //window.clearInterval(repeatInitilization);
        // }

        if (rtcConn)
            resolve("done");
        else
            reject("failed");
    })
        .catch((err) => {
            webrtcdev.error("setRtcConn", err);
            reject(err);
        });
};

/*
* Support Session Refresh
*/
function supportSessionRefresh() {
    //alert(" old Userid " + localStorage.getItem("userid") + " | old channel  "+ localStorage.getItem("channel") );
    webrtcdev.log(" [sessionmanager ] check for session refresh/user refreshed",
        " Channel in local stoarge - ", localStorage.getItem("channel"),
        " Current Channel  - ", rtcConn.channel,
        " match ", localStorage.getItem("channel") == rtcConn.channel);

    if (localStorage.getItem("channel") == rtcConn.channel && localStorage.getItem("userid")) {
        webrtcdev.log(" [sessionmanager ] supportSessionRefresh - rejoining with old user id " + localStorage.getItem("userid"));
        selfuserid = localStorage.getItem("userid");
        shownotification("Refreshing the Session");
        return selfuserid;
    }
    //return Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
    return rtcConn.userid;
}

/*
* Check Microphone and Camera Devices
*/
// function checkDevices(resolveparent, rejectparent, incoming, outgoing) {
//     listDevices();
// }

/**
 * Open a WebRTC socket channel
 * @method
 * @name opneWebRTC
 * @param {string} channel
 * @param {string} userid
 */
var openWebRTC = function (channel, userid, maxallowed) {
    webrtcdev.info("[sessionmanager] -openWebRTC channel: ", channel);

    socket.emit("open-channel", {
        channel: channel,
        sender: userid,
        maxAllowed: maxallowed
    });

    shownotification(" Making a new session ");
};


/**
 * connect to a webrtc socket channel
 * @method
 * @name connectWebRTC
 * @param {string} type
 * @param {string} channel
 * @param {string} userid
 * @param {string} remoteUsers
 */
var connectWebRTC = function (type, channel, selfuserid, remoteUsers) {
    webrtcdev.info(" [sessionmanager] ConnectWebRTC type : ", type, " , Channel :", channel,
        " , self-Userid : ", selfuserid, " , and remote users : ", remoteUsers);
    if (debug) showUserStats();

    // if the Listene is active then freeze the screen
    if (listeninobj.active && role == "inspector") {
        webrtcdev.info(" [sessionmanage] freezing screen for role inspector ");
        freezescreen();
    }

    /*void(document.title = channel);*/
    // File share object
    if (fileshareobj.active) {

        try {
            var _peerinfo = findPeerInfo(selfuserid);
            if (!_peerinfo) throw "self peerinfo missing in webcallpeers for " + selfuserid;

            // Create File Sharing Div 
            if (fileshareobj.props.fileShare == "single") {
                createFileSharingDiv(_peerinfo);
                //max diaply the local / single fileshare 
                document.getElementById(_peerinfo.fileShare.outerbox).style.width = "100%";
                // hide the remote fileshare
                // document.getElementById(_peerinfo.fileShare.outerbox).style.width="100%";
            } else if (fileshareobj.props.fileShare == "divided") {

                // create local File sharing window 
                // Do not create file share and file viewer for inspector's own session
                if (role != "inspector") {
                    webrtcdev.log(" [sessionmanager] creating local file sharing");
                    createFileSharingDiv(_peerinfo);
                } else {
                    webrtcdev.log("[sessionmanager] Since it is an inspector's own session , not creating local File viewer and list");
                }

                // create remotes File sharing window 
                for (x in webcallpeers) {
                    if (webcallpeers[x].userid != selfuserid && webcallpeers[x].role != "inspector") {
                        webrtcdev.log(" [start connectWebRTC] creating remote file sharing ");
                        createFileSharingDiv(webcallpeers[x]);
                    }
                }

                // on connect webrtc request old file from peerconnection session
                if (fileshareobj.sendOldFiles) {
                    requestOldFiles();
                }

            } else {
                webrtcdev.error("[sessionmanager] fileshareobj.props.fileShare undefined ");
            }

            // Creating File listing div 
            if (fileshareobj.props.fileList == "single") {
                document.getElementById(_peerinfo.fileList.outerbox).style.width = "100%";
            } else if (fileshareobj.props.fileShare != "single") {
                webrtcdev.log("No Seprate div created for this peer since fileshare container is single");
            } else {
                webrtcdev.error("fileshareobj.props.fileShare undefined ");
            }

        } catch (err) {
            webrtcdev.error("[sessionmanager] connectwebrtc -", err)
        }
    }

    // kick start the timer
    if (timerobj && timerobj.active) {
        startTime();
        showTimeZone();
    }
};


/**
 * function to join a webrtc socket channel
 * @method
 * @name joinWebRTC
 * @param {string} channel
 * @param {string} userid
 */
var joinWebRTC = function (channel, userid) {
    shownotification("Joining an existing session " + channel);
    webrtcdev.info(" [sessionmanager] joinWebRTC channel: ", channel);

    if (debug) showUserStats();

    socket.emit("join-channel", {
        channel: channel,
        sender: userid,
        extra: {
            userid: userid,
            name: selfusername || "",
            color: selfcolor || "",
            email: selfemail || "",
            role: role || "participant"
        }
    });
};

/**
 * cleares local storage varibles
 * @method
 * @name clearCaches
 */
this.clearCaches = clearCaches = function () {
    localStorage.clear();
};

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//**
 * function to leave a webrtc socket channel
 * @method
 * @name leaveWebRTC
 */
var leaveWebRTC = function () {
    shownotification("Leaving the session ");
};

/*window.onload=function(){
    webrtcdev.log( "Local Storage Channel " ,  localStorage.getItem("channel"));
};
*/
window.onunload = function () {
    webrtcdev.log("[startjs] onunload ", localStorage.getItem("channel"));
    alert(" Refreshing the Page will loose the session data");
};
/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  */};
if (typeof module !== 'undefined' /* && !!module.exports*/ ) {
    module.exports = exports = webrtcdevcon;
}

/* Generated on:Sun Apr 05 2020 22:51:51 GMT+0530 (India Standard Time) || version: 4.9.5 - Altanai , License : MIT  *//* ***************************************************************
Admin
******************************************************************/

var socket;
var webrtcdevDataObj;
var usersDataObj;
var channelsFeed= document.getElementById("channelsFeed");

var WebRTCdevadmin= function(signaller){
    console.log("[adminjs] connect to ", signaller);
    try{
        socket= io.connect(signaller);

        socket.on('response_to_admin_enquire', function(message) {
            console.log("[adminjs] response_to_admin_enquire -", message );
            switch (message.response){
                case "channels":
                    console.log("[adminjs] chnanels ");
                    let channelinfo = message.channelinfo;
                    if(message.format=="list"){
                        clearList("channellistArea");
                        for (i in Object.keys(channelinfo)) { 
                            /*drawList("channellistArea" , Object.keys(webrtcdevDataObj)[i]);*/
                            drawList("channellistArea" , channelinfo[i]);
                        }
                    }else if(message.format=="table"){
                        drawTable("webrtcdevTableBody",channelinfo);
                    }else{
                        webrtcdev.error("format not specified ");
                    }
                break;
            
                case "users":
                    console.log("[adminjs] users ");
                    users = message.users;
                    if(message.format=="list"){
                        clearList("userslistArea");
                        for (i in usersDataObj) { 
                            drawList("userslistArea" , usersDataObj[i]);
                        }
                    }
                break;

                case "all":
                    channelsFeed.innerHTML=JSON.stringify(message.channels, null, 4);
                break;

                default :
                    webrtcdev.log("unrecognizable response from signaller " , message);
            }
        });
    }catch(e){
        console.error(e);
    }
};

function onLoadAdmin(){
    socket.emit('admin_enquire', {
        ask:'channels',
        format: 'list'
    });
}

$('#channels_list').click(function () {
    socket.emit('admin_enquire', {
        ask:'channels',
        format: 'list'
    });
});

$("#channelFindBtn").click(function(){
    socket.emit('admin_enquire', {
        ask:'channels',
        find: $("#channelFindInput").val(),
        format: 'list'
    });
});

$('#users_list').click(function () {
    socket.emit('admin_enquire', {
        ask:'users',
        format: 'list'
    });
});

$('#channels_table').click(function () {
    socket.emit('admin_enquire', {
        ask:'channels',
        format: 'table'
    });
});

$('#channels_json').click(function () {
    socket.emit('admin_enquire', {
        ask:'all',
        format: 'json'
    });
});

$('#channel_clients').click(function () {
    socket.emit('admin_enquire', 
        {
            ask:'channel_clients',
            channel: 'https172162010780841524489749781952'
        });
});

function clearList(element){
    $("#"+element).empty();
}

function drawList(element , listitem){
    $("#"+element).append("<li className='list-group-item'>"+listitem+"</li>");
}

function drawTable(tablebody , data) {
    for (i in Object.keys(data)) { 
        var key=Object.keys(data)[i];
        
        drawTableRow(tablebody ,i , data[key].channel , data[key].timestamp, data[key].users , 
            data[key].status , data[key].endtimestamp , 0 );
        /*                    
        for (j in data[key].users) {
            users.push(data[key].users[j]);
        }*/
    }
}

function drawTableRow(tablebody ,i ,  channel , timestamp , users , 
    status , endtimestamp , duration) {

    var row = $("<tr className='success' />");
    row.append($("<td>" + i + "</td>"));
    row.append($("<td>" + channel + "</td>"));
    row.append($("<td>" + timestamp + "</td>"));
    row.append($("<td>" + JSON.stringify(users, null, 4) + "</td>"));
    row.append($("<td>" + status + "</td>"));
    row.append($("<td>" + endtimestamp + "</td>"));
    row.append($("<td>" + duration + "</td>"));
    $("#"+tablebody).append(row);
    /*row.append($("<td id='usersRow'>" + drawUsersTable("usersRow" , rowData.users) + "</td>"));*/
}

function drawUsersTable(users) {
    var usersTable=document.createElement("table");
    $("#usersRow").append(usersTable);
    for (var i = 0; i < users.length; i++) {
        drawUsersRow(usersTable , data[i]);
    }
}

function drawUsersRow(userData) {
    var row = $("<tr />")
    $("#table").append(row);
    row.append($("<td>" + userData + "</td>"));
}
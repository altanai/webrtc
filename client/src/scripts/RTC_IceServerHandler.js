// IceServersHandler.js

var IceServersHandler = (function () {
    function getIceServers(connection) {
        // let iceServers = [{
        //     'urls': [
        //         'stun:stun.l.google.com:19302',
        //         // 'stun:stun1.l.google.com:19302',
        //         // 'stun:stun2.l.google.com:19302',
        //         'stun:stun.l.google.com:19302?transport=udp',
        //     ]
        // }];
        let iceServers = [{
            'urls': []
        }];
        return iceServers;
    }

    return {
        getIceServers: getIceServers
    };
})();
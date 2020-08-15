// Create WebSocket connection.
const jsocket = new WebSocket('wss://54.193.51.199:8989/ws', 'janus-protocol');
var sessionid = 0;

wsHandlers = {
    'error': function (err) {
        console.error("Error connecting to the Janus WebSockets server... ", err);
    },

    'open': function () {
        let transactionid = "aaaaaaaaaaaa";
        jsocket.send(JSON.stringify({
            janus: "create",
            transaction: transactionid
        }));
    },

    'message': function (event) {

        let resp = JSON.parse(event.data);
        console.log("Jsocket Resp ", resp);

        if (resp.janus == "success" && resp.data.id) {
            sessionid = resp.data.id;
            let transactionid = "bbbbbbbbbbbb";
            jsocket.send(JSON.stringify({
                janus: "attach",
                opaque_id: "echotest-qBiNqhjPF4j7",
                plugin: "janus.plugin.echotest",
                session_id: sessionid,
                transaction: transactionid
            }));

            transactionid = "cccccccccccc";
            jsocket.send(JSON.stringify({
                body: {
                    audio: true,
                    video: true
                },
                handle_id: 4487806448595168,
                janus: "message",
                session_id: sessionid,
                transaction: "5NDfZlCJThoG"
            }));
        } else if (resp.janus == "event" && resp.data.result == "ok"){


        }

    },

    'close': function () {
        console.error(" Jsocket clsoed ");
    }
};

for (var eventName in wsHandlers) {
    jsocket.addEventListener(eventName, wsHandlers[eventName]);
}


// // Listen for messages
// jsocket.addEventListener('message', function (event) {
//     console.log('Message from server ', event.data);
// });
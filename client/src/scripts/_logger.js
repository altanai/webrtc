/*********************************************************
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

/**
 * store the logs in array for debugging if required
 * @constructor
 * @name getArgsJson
 * @return {arduments } args
 */
var webrtcdevlogger = {

        log:   function () {
            let arg ="";
            if (isJSON(arguments)) {
                arg = JSON.stringify(arguments, undefined, 2);
                webrtcdevlogs.push("<pre style='color:grey'>[LOG]" + arg + "</pre>");
            } else {
                arg = getArgsJson(arguments);
                webrtcdevlogs.push("<p style='color:grey'>[LOG]" + arg + "</p>");
            }
            // console.log(arguments);
        },

        info:   function () {
            let arg = "";
            if (isJSON(arguments)) {
                arg = JSON.stringify(arguments, undefined, 2);
                webrtcdevlogs.push("<pre style='color:blue'>[INFO]" + arg + "</pre>");
            } else {
                arg = getArgsJson(arguments);
                webrtcdevlogs.push("<p style='color:blue'>[INFO]" + arg + "</p>");
            }
            // console.info(arguments);
        },

        debug: function () {
            let arg = "";
            if (isJSON(arguments)) {
                arg = JSON.stringify(arguments, undefined, 2);
                webrtcdevlogs.push("<pre style='color:green'>[DEBUG]" + arg + "</pre>");
            } else {
                arg = getArgsJson(arguments);
                webrtcdevlogs.push("<p style='color:green'>[DEBUG]" + arg + "</p>");
            }
            // console.debug(arguments);
        },

        warn: function () {
            let arg = "";
            if (isJSON(arguments)) {
                arg = JSON.stringify(arguments, undefined, 2);
                webrtcdevlogs.push("<pre style='color:orange'>[WARN]" + arg + "</pre>");
            } else {
                arg = getArgsJson(arguments);
                webrtcdevlogs.push("<p style='color:orange'>[WARN]" + arg + "</p>");
            }
            // console.warn(arguments);
        },

        error: function () {
            let arg = "";
            if (isJSON(arguments)) {
                arg = JSON.stringify(arguments, undefined, 2);
                webrtcdevlogs.push("<pre style='color:red'>[ERROR]" + arg + "</pre>");
            } else {
                arg = getArgsJson(arguments);
                webrtcdevlogs.push("<p style='color:red'>[ERROR]" + arg + "</p>");
            }
            // console.error(arguments);
        }
};

var webrtcdev = webrtcdevlogger;
/* ********************************************************
webdev Logger
****************************************************** */
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
        JSON.parse(text);
        return true;
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
    for (let i = 0; i < arg.length; i++) {
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
        let arg = getArgsJson(arguments);
        // if (isJSON(arguments)) {
        //     let arg = JSON.stringify(arguments, undefined, 2);
        //     // webrtcdevlogs.push("<pre style='color:grey'>[-]" + arg + "</pre>");
        // } else {
        //     let arg = getArgsJson(arguments);
        //     // webrtcdevlogs.push("<p style='color:grey'>[-]" + arg + "</p>");
        // }
        webrtcdevlogs.push( arg );
        console.log(arguments);
    },

    info: function () {
        let arg = getArgsJson(arguments);
        // if (isJSON(arguments)) {
        //     let arg = JSON.stringify(arguments, undefined, 2);
        //     webrtcdevlogs.push("<pre style='color:blue'>[-]" + arg + "</pre>");
        // } else {
        //     let arg = getArgsJson(arguments);
        //     webrtcdevlogs.push("<p style='color:blue'>[INFO]" + arg + "</p>");
        // }
        webrtcdevlogs.push( arg );
        console.info(arguments);
    },

    debug: function () {
        let arg = getArgsJson(arguments);
        // if (isJSON(arguments)) {
        //     let arg = JSON.stringify(arguments, undefined, 2);
        //     webrtcdevlogs.push("<pre style='color:green'>[DEBUG]" + arg + "</pre>");
        // } else {
        //     let arg = getArgsJson(arguments);
        //     webrtcdevlogs.push("<p style='color:green'>[DEBUG]" + arg + "</p>");
        // }
        webrtcdevlogs.push( arg );
        console.debug(arguments);
    },

    warn: function () {
        let arg = getArgsJson(arguments);
        // webrtcdevlogs.push("<p style='color:yellow'>[WARN]" + arg + "</p>");
        webrtcdevlogs.push( arg );
        console.warn(arguments);
    },

    error: function () {
        let arg = getArgsJson(arguments);
        // if (isJSON(arguments)) {
        //     let arg = JSON.stringify(arguments, undefined, 2);
        //     webrtcdevlogs.push("<pre style='color:grey'>[-]" + arg + "</pre>");
        // } else {
        //     let arg = getArgsJson(arguments);
        //     webrtcdevlogs.push("<p style='color:red'>[ERROR]" + arg + "</p>");
        // }
        webrtcdevlogs.push( arg );
        console.error(arguments);
    }

    // }

};
/*-----------------------------------------------------------------------------------*/
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
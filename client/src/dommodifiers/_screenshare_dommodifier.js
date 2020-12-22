var screenShareButton;

/**
 * find if view button is provided or need to be created
 * @method
 * @name createOrAssignScreenviewButton
 */
function createOrAssignScreenviewButton() {
    if (screenshareobj.button.viewButton.id && getElementById(screenshareobj.button.viewButton.id)) {
        let button = getElementById(screenshareobj.button.viewButton.id);
        assignScreenViewButton(screenshareobj, button);
    } else {
        createScreenViewButton(screenshareobj);
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
function assignScreenViewButton(screenshareobj, button) {
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
}


/**
 * If button id are present then assign sreen share button or creatr a new one
 * @method
 * @name createOrAssignScreenshareButton
 * @param {json} screenshareobject
 */
function createOrAssignScreenshareButton(screenshareobj) {
    webrtcdev.log("[screenshare dommodifier] createOrAssignScreenshareButton ", screenshareobj);
    if (screenshareobj.button.shareButton.id && getElementById(screenshareobj.button.shareButton.id)) {
        assignScreenShareButton(screenshareobj.button.shareButton);
    } else {
        createScreenShareButton();
    }
}

/**
 * create Screen share Button
 * @method
 * @name createScreenshareButton
 */
function createScreenShareButton(screenshareobj) {
    webrtcdev.log("[screenshare dommodifier] create ScreenshareButton ", screenshareobj);
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
    webrtcdev.log("[screenshare dommodifier] assignScreenShareButton", scrshareBtn);
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
    };
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

        } else if (type == "screclass_offenshareStartedViewing") {

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
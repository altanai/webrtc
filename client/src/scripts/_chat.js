/*-----------------------------------------------------------------------------------*/
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
        addMessageSnapshotFormat("chat-message self", e.userinfo, e.message, chatobj.chatBox.id);
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
        addMessageSnapshotFormat("chat-message user", e.userinfo, e.message, chatobj.chatBox.id);
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
        t.className="cm-msg-text";
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
        t.innerHTML = '<div class="chatusername">' + messageheader + "</div>";

    var n = document.createElement("div");
    n.className = messageDivclass,
    n.innerHTML = message,

    t.appendChild(n),
    $("#" + parent).append(n);
    /* $("#all-messages").scrollTop($("#all-messages")[0].scrollHeight) */
}


/*-----------------------------------------------------------------------------------*/
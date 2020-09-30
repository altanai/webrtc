/*-----------------------------------------------------------------------------------*/
/*.                        Chat JS                                                   */
/*-----------------------------------------------------------------------------------*/

var chatcounter = 0;

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
        if(chatobj.msgsnapshot) {
            // addMessageSnapshotFormat("localMessageClass", e.userinfo, e.message, chatobj.chatBox.id);
            addMessageSnapshotFormat("chat-message self msg-avatar", e.userinfo, e.message, chatobj.chatBox.id);
        }else{
            addMessageLineformat("msg-box fonts", e.userinfo, e.message, chatobj.chatBox.id);
        }
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
        if(chatobj.msgsnapshot){
            // addMessageSnapshotFormat("remoteMessageClass", e.userinfo, e.message, chatobj.chatBox.id);
            addMessageSnapshotFormat("chat-message user msg-avatar", e.userinfo, e.message, chatobj.chatBox.id);
        }else{
            addMessageLineformat("msg-box fonts", e.userinfo, e.message, chatobj.chatBox.id);

            // or addMessageBlockFormat
        }
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
    let n = document.createElement("div");
    n.id = " chat-msg-" + chatcounter++;
    n.className = messageDivclass + " chat-msg ";

    takeSnapshot(userinfo, function (datasnapshot) {

        let image = document.createElement("img");
        image.src = datasnapshot;
        // image.setAttribute("style", "border-radius: 50%;height:40px");

        let span = document.createElement("span");
        span.className = "msg-avatar";
        span.appendChild(image);

        let t = document.createElement("span");
        t.className = "cm-msg-text ";
        t.innerHTML = replaceURLWithHTMLLinks(message);

        n.appendChild(span);
        n.appendChild(t);
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
    console.log(" addMessageLineformat ", messageheader);

    let n = document.createElement("ul");
    n.className = messageDivclass;
    if (messageheader.name) {
        n.innerHTML = "<li><h5>"+ messageheader.name + " : " + replaceURLWithHTMLLinks(message) + "</h5></li>";
    } else {
        n.innerHTML = "<li><h5>"+ replaceURLWithHTMLLinks(message) + "</h5></li>";
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
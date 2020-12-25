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


/*-----------------------------------------------------------------------------------*/
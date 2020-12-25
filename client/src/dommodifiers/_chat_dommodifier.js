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
            showelem(chatobj.container.id);
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
function createChatBox(chatobj) {

    webrtcdev.log("[chat dom modifier] create Chat Box ", chatobj);
    if (!chatobj) return;

    let mainInputBox = document.createElement("div");

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
function assignChatBox(chatobj) {
    webrtcdev.warn("[chatdommodifier ]  assignChatBox ");

    var chatInput = document.getElementById(chatobj.inputBox.text_id);
    if (!chatInput || chatInput == null) {
        webrtcdev.warn("[chatdommodifier ]  chatobj.inputBox.text_id not defined - ", chatobj.inputBox.text_id);
        return;
    }
    chatInput.onkeypress = function (e) {
        if (e.keyCode == 13) {
            var peerinfo = findPeerInfo(selfuserid);
            sendChatMessage(chatInput.value, peerinfo);
            chatInput.value = "";
        }
    };

    if (document.getElementById(chatobj.inputBox.sendbutton_id)) {
        let chatButton = document.getElementById(chatobj.inputBox.sendbutton_id);
        chatButton.onclick = function (e) {
            var peerinfo = findPeerInfo(selfuserid);
            var chatInput = document.getElementById(chatobj.inputBox.text_id);
            sendChatMessage(chatInput.value, peerinfo);
            chatInput.value = "";
        };
    }

    if (document.getElementById(chatobj.inputBox.minbutton_id)) {
        var button = document.getElementById(chatobj.inputBox.minbutton_id);
        button.onclick = function (e) {
            if (document.getElementById(chatobj.container.id).hidden)
                showelem(chatobj.container.id);
            else
                hideelem(chatobj.container.id);
        };
    }
}


/*
 * diaplys Who is typing
 * @method
 * @name updateWhotyping
 * @param {string} data
 */
function updateWhotyping(data) {
    if(document.getElementById("whoTyping"))
        document.getElementById("whoTyping").innerHTML = data;
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

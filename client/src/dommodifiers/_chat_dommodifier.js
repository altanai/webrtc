
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
            showelem(chatobj.container.id)
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
function createChatBox(obj) {

    var mainInputBox = document.createElement("div");

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
function assignChatBox(obj) {

    var chatInput = document.getElementById(chatobj.inputBox.text_id);
    chatInput.onkeypress = function (e) {
        if (e.keyCode == 13) {
            var peerinfo = findPeerInfo(selfuserid);
            webrtcdev.log(" chat ", selfuserid, peerinfo);
            sendChatMessage(chatInput.value, peerinfo);
            chatInput.value = "";
        }
    };

    if (document.getElementById(chatobj.inputBox.sendbutton_id)) {
        var chatButton = document.getElementById(chatobj.inputBox.sendbutton_id);
        chatButton.onclick = function (e) {

            var peerinfo = findPeerInfo(selfuserid);
            var chatInput = document.getElementById(chatobj.inputBox.text_id);
            sendChatMessage(chatInput.value, peerinfo);
            chatInput.value = "";
        }
    }

    if (document.getElementById(chatobj.inputBox.minbutton_id)) {
        var button = document.getElementById(chatobj.inputBox.minbutton_id);
        button.onclick = function (e) {
            if (document.getElementById(chatobj.container.id).hidden)
                showelem(chatobj.container.id);
            else
                hideelem(chatobj.container.id);
        }
    }
}


/*
 * diaplys Who is typing
 * @method
 * @name updateWhotyping
 * @param {string} data
 */
function updateWhotyping(data) {
    document.getElementById("whoTyping").innerHTML = data;
}
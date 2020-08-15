/*-----------------------------------------------------------------------------------*/
/*                    listen-in JS                                                   */

/*-----------------------------------------------------------------------------------*/

/**
 * creates a listen in link for the sessionid
 * @method
 * @name getlisteninlink
 * @return {string}listeninlink
 */
this.getlisteninlink = function() {
    if (!sessionid) console.error("cant generate listenin link , no session id found ")
    try {
        webrtcdev.log(" Current Session ", window.origin);
        let listeninlink = window.origin + "/#" + sessionid + '?appname=webrtcwebcall&role=inspector&audio=0&video=0';
        return listeninlink;
    } catch (e) {
        webrtcdev.error("ListenIn :", e);
        return false;
    }
};

function freezescreen() {
    document.body.setAttribute("style", "pointer-events: none;");
}

/**
 * collect all webrtcStats and stream to Server to be stored in a file with session id as the file name
 * @method
 * @name sendwebrtcdevLogs
 * @param {string} url
 * @param {string} key
 * @param {string} senderuseremail
 * @param {string} receiveruseremail
 * @return Http request
 */
this.sendlisteninlink = function (url, key, senderuseremail, receiveruseremail) {

    var dataArray = {
        apikey: key,
        senderuseremail: senderuseremail,
        receiveruseremail: receiveruseremail,
        webrtcsessionid: webrtcdevobj.sessionid,
        connectiontype: 1
    };

    return fetch(url, {
        method: 'post',
        crossDomain: true,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': key,
            'Access-Control-Allow-Origin': window.location.origin,
            'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify(dataArray)
    })
        .then(apires => apires.json())
        .then(apires => console.log("Listenin API response ", apires))
        .catch(error => console.error("Listenin API response ", error));
};
/*-----------------------------------------------------------------------------------*/

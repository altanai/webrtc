/*-----------------------------------------------------------------------------------*/
/*                    listen-in JS                                                   */

/*-----------------------------------------------------------------------------------*/

/**
 * creates a listen in link for the sessionid
 * @method
 * @name getlisteninlink
 * @return {string}listeninlink
 */
function getlisteninlink() {
    if (!sessionid) console.error("cant generate listenin link , no session id found ")
    try {
        webrtcdev.log(" Current Session ", window.origin);
        let listeninlink = window.origin + "/#" + sessionid + '?appname=webrtcwebcall&role=inspector&audio=0&video=0';
        return listeninlink;
    } catch (e) {
        webrtcdev.error("ListenIn :", e);
        return false;
    }
}

function freezescreen() {
    document.body.setAttribute("style", "pointer-events: none;");
}

/*-----------------------------------------------------------------------------------*/

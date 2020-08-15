/*-----------------------------------------------------------------------------------*/
/*                    Reconnect JS                                                   */
/*-----------------------------------------------------------------------------------*/

function createButtonRedial(reconnectobj){
    let reconnectButton= document.createElement("span");
    reconnectButton.className= reconnectobj.button.class;
    reconnectButton.innerHTML= reconnectobj.button.html;
    reconnectButton.onclick=function(){
        let r = confirm("Do you want to reconnet ?");
        if (r == true) {
          //location.reload();

          $(this).html('<img src="http://www.bba-reman.com/images/fbloader.gif" />');
           setTimeout(function(){ 
            $(this).html(reconnectobj.button.html )
          }, 3000);

        } else {
           //do nothing
        }
    };
    let li =document.createElement("li");
    li.appendChild(reconnectButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

function assignButtonRedial(id,reconnectobj){
    document.getElementById(id).onclick=function(){
        var r = confirm("Do you want to reconnect ?");
        if (r == true) {

            //rtcConn.rejoin(rtcConn.connectionDescription);
            if (!rtcConn.peers[rtcConn.connectionDescription.remoteUserId]) return;
            rtcConn.peers[rtcConn.connectionDescription.remoteUserId].peer.close();

            rtcConn.rejoin(rtcConn.connectionDescription);

            $(this).html('<img src="http://www.bba-reman.com/images/fbloader.gif" />');
            setTimeout(function(){ 
            
            document.getElementById(id).innerHTML= reconnectobj.button.html ;
          }, 3000);

           //location.reload();
        } else {
           //do nothing
        }
    };
}
/*-----------------------------------------------------------------------------------*/
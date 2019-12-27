/*-----------------------------------------------------------------------------------*/
/*                         Draw JS                                                   */
/*-----------------------------------------------------------------------------------*/
var CanvasDesigner;
var isDrawOpened = false ;

function openDrawBoard(){
    isDrawOpened = true;
    let boarddata={
        event : "open",
        from : "remote",
        board : drawCanvasobj.drawCanvasContainer,
        button : drawCanvasobj.button
    };
    rtcConn.send({type:"canvas", board:boarddata});
    webrtcdevCanvasDesigner(drawCanvasobj);
    window.dispatchEvent(new CustomEvent('webrtcdev',{
        detail: {
            servicetype: "draw",
            action: "onDrawBoardActive"
        }
    }));
}

function closeDrawBoard(){
    isDrawOpened = false ;
    let boarddata = {
        event : "close",
        from : "remote",
        board : drawCanvasobj.drawCanvasContainer,
        button : drawCanvasobj.button
    };
    rtcConn.send({type:"canvas", board:boarddata});
    window.dispatchEvent(new CustomEvent('webrtcdev',{
        detail: {
            servicetype: "draw",
            action: "onDrawBoardTerminate"
        }
    }));
}
/**
 * Open draw iframe winside of drawCanvasContainer and ass tools
 * @method
 * @name webrtcdevCanvasDesigner
 * @param {json} drawCanvasobj
 */
function webrtcdevCanvasDesigner(drawCanvasobj){
    webrtcdev.log("[drawjs] drawCanvasobj.drawCanvasContainer " , drawCanvasobj.drawCanvasContainer);
    if(document.getElementById(drawCanvasobj.drawCanvasContainer).innerHTML.indexOf("iframe") < 0){
        try{
            CanvasDesigner.addSyncListener(function(data) {
                rtcConn.send({type:"canvas", draw:data});
            });

            CanvasDesigner.setSelected('pencil');

            CanvasDesigner.setTools({
                pencil: true,
                eraser: true
            });

            CanvasDesigner.appendTo(document.getElementById(drawCanvasobj.drawCanvasContainer));
        }catch(e){
            webrtcdev.error(" Canvas drawing not supported " , e);
        }
    }else{
        webrtcdev.log("[drawjs] CanvasDesigner already started iframe is attached ");
    }

}

/*-----------------------------------------------------------------------------------*/
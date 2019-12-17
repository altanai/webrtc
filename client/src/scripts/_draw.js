/*-----------------------------------------------------------------------------------*/
/*                         Draw JS                                                   */
/*-----------------------------------------------------------------------------------*/
var CanvasDesigner;
var isDrawOpened = false ;

/**
 * Open draw iframe winside of drawCanvasContainer and ass tools
 * @method
 * @name webrtcdevCanvasDesigner
 * @param {json} drawCanvasobj
 */
function webrtcdevCanvasDesigner(drawCanvasobj){

    if(document.getElementById(drawCanvasobj.drawCanvasContainer).innerHTML.indexOf("iframe")<0){
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
        webrtcdev.log("CanvasDesigner already started .iframe is attached ");
    }

}

/*-----------------------------------------------------------------------------------*/
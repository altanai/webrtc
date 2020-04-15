/*-----------------------------------------------------------------------------------*/
/*                         Draw JS                                                   */
/*-----------------------------------------------------------------------------------*/
var CanvasDesigner;
var isDrawOpened = false;

/**
 * Open draw iframe inside of drawCanvasContainer and add tools
 * @method
 * @name webrtcdevCanvasDesigner
 * @param {json} drawCanvasobj
 */
function openDrawBoard() {
    isDrawOpened = true;
    let boarddata = {
        event: "open",
        from: "remote",
        board: drawCanvasobj.drawCanvasContainer,
        button: drawCanvasobj.button
    };
    rtcConn.send({type: "canvas", board: boarddata});
    webrtcdev.log("[drawJS] send canvas data on rtc")

    webrtcdevCanvasDesigner(drawCanvasobj);

    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "drawboard",
            action: "onDrawBoardActive"
        }
    }));
    webrtcdev.log("[drawJS] send ondrawboard active data on webrtcdev")
}

/**
 * Open draw iframe inside of drawCanvasContainer and add tools
 * @method
 * @name closeDrawBoard
 * @param {json} drawCanvasobj
 */
function closeDrawBoard() {
    isDrawOpened = false;
    let boarddata = {
        event: "close",
        from: "remote",
        board: drawCanvasobj.drawCanvasContainer,
        button: drawCanvasobj.button
    };
    rtcConn.send({type: "canvas", board: boarddata});
    window.dispatchEvent(new CustomEvent('webrtcdev', {
        detail: {
            servicetype: "drawboard",
            action: "onDrawBoardTerminate"
        }
    }));
}

/**
 * Open draw iframe inside of drawCanvasContainer and add tools
 * @method
 * @name webrtcdevCanvasDesigner
 * @param {json} drawCanvasobj
 */
function webrtcdevCanvasDesigner(drawCanvasobj) {
    webrtcdev.log("[drawjs] drawCanvasobj.drawCanvasContainer ", drawCanvasobj.drawCanvasContainer);
    if (document.getElementById(drawCanvasobj.drawCanvasContainer).innerHTML.indexOf("iframe") < 0) {
        try {
            CanvasDesigner.addSyncListener(function (data) {
                rtcConn.send({type: "canvas", draw: data});
            });

            CanvasDesigner.setSelected('pencil');

            CanvasDesigner.setTools({
                pencil: true,
                eraser: true
            });

            CanvasDesigner.appendTo(document.getElementById(drawCanvasobj.drawCanvasContainer));
        } catch (e) {
            webrtcdev.error(" Canvas drawing not supported ", e);
        }
    } else {
        webrtcdev.log("[drawjs] CanvasDesigner already started iframe is attached ");
    }

}

/*-----------------------------------------------------------------------------------*/
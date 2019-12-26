/**
 * Sync draw boads opening between all peers
 * @method
 * @name syncDrawBoard
 * @param {json} bdata
 */
function syncDrawBoard(bdata){
    if(document.getElementById(bdata.button.id)){
        document.getElementById(bdata.button.id).click();
    }else{
        webrtcdev.error(" Receieved sync board evenet but no button id found");
    }
}

/**
 * Create a draw button
 * @method
 * @name createdrawButton
 * @param {json} drawCanvasobj
 */
function createdrawButton(drawCanvasobj){
    let drawButton= document.createElement("span");
    drawButton.className = drawCanvasobj.button.class_off ;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className==drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            alert(" Draw Board Opened ");
            drawButton.className= drawCanvasobj.button.class_on ;
            drawButton.innerHTML= drawCanvasobj.button.html_on;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=false;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");

            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=false;
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                var bdata={
                    event : "open",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:bdata});
            }else{
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
            webrtcdevCanvasDesigner(drawCanvasobj);

        }else if(drawButton.className==drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.container.id))
                document.getElementById(drawCanvasobj.container.id).hidden=true;
            else
                webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");

            if(document.getElementById(drawCanvasobj.drawCanvasContainer))
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=true;
            else
                webrtcdev.error("Draw : canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");


        }
    };
    var li =document.createElement("li");
    li.appendChild(drawButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/**
 * Assign a draw button
 * @method
 * @name assigndrawButton
 * @param {json} drawCanvasobj
 */
function assigndrawButton(drawCanvasobj){
    webrtcdev.log(" ==================== drawCanvasobj ", drawCanvasobj);
    let drawButton = document.getElementById(drawCanvasobj.button.id);
    drawButton.className = drawCanvasobj.button.class_off;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className == drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            // self.onDrawBoardActive();
            showelem(drawCanvasobj.container.id);
            webrtcdev.log("[draw dom modifier] Draw Board Opened ");
            drawButton.className = drawCanvasobj.button.class_on ;
            drawButton.innerHTML = drawCanvasobj.button.html_on;
            // if(document.getElementById(drawCanvasobj.container.id))
            //     document.getElementById(drawCanvasobj.container.id).hidden=false;
            // else
            //     webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");

            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=false;
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                isDrawOpened = true;
                let boarddata={
                    event : "open",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:boarddata});
            }else{
                webrtcdev.error("[drawjs] canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
            webrtcdevCanvasDesigner(drawCanvasobj);

        }else if(drawButton.className == drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            webrtcdev.log("[draw dom modifier] Draw Board Closed ");
            // self.onDrawBoardTerminate();
            hideelem(drawCanvasobj.container.id);

            // if(document.getElementById(drawCanvasobj.container.id))
            //     document.getElementById(drawCanvasobj.container.id).hidden=true;
            // else
            //     webrtcdev.error("Draw : container-" , drawCanvasobj.container.id , " doesnt exist");
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                document.getElementById(drawCanvasobj.drawCanvasContainer).hidden=true;
                isDrawOpened = false ;
                let boarddata = {
                    event : "close",
                    from : "remote",
                    board : drawCanvasobj.drawCanvasContainer,
                    button : drawCanvasobj.button
                };
                rtcConn.send({type:"canvas", board:boarddata});
            }else
                webrtcdev.error("[drawjs] canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
        }
    };
}

/**
 * Create a save button for canvas
 * @method
 * @name saveButtonCanvas
 * @param {json} bdata
 */
var saveButtonCanvas = document.createElement("div");
saveButtonCanvas.id = "saveButtonCanvasDraw";
saveButtonCanvas.setAttribute("data-toggle","modal");
saveButtonCanvas.setAttribute("data-target","#saveModal");
saveButtonCanvas.onclick=function(){
    createModalPopup( "blobcanvas" );
};
document.body.appendChild(saveButtonCanvas);


// Event emitters for drawboard
this.onDrawBoardActive = function(){};
this.onDrawBoardTerminate = function(){};

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
        webrtcdev.error("[draw dom modifier] Received sync board event but no button id found");
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
    webrtcdev.log("[draw] dom modifier] drawCanvasobj ", drawCanvasobj);
    let drawButton = document.getElementById(drawCanvasobj.button.id);
    drawButton.className = drawCanvasobj.button.class_off;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick=function(){
        if(drawButton.className == drawCanvasobj.button.class_off  && document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            showelem(drawCanvasobj.container.id);
            webrtcdev.log("[draw dom modifier] Draw Board Opened ");
            drawButton.className = drawCanvasobj.button.class_on ;
            drawButton.innerHTML = drawCanvasobj.button.html_on;

            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                showelem(drawCanvasobj.drawCanvasContainer);
                document.getElementById(drawCanvasobj.drawCanvasContainer).focus();
                openDrawBoard();
            }else{
                webrtcdev.error("[drawjs] canvascontainer-" , drawCanvasobj.drawCanvasContainer , " doesnt exist");
            }
        }else if(drawButton.className == drawCanvasobj.button.class_on &&  !document.getElementById(drawCanvasobj.drawCanvasContainer).hidden){
            webrtcdev.log("[draw dom modifier] Draw Board Closed ");
            hideelem(drawCanvasobj.container.id);
            drawButton.className= drawCanvasobj.button.class_off ;
            drawButton.innerHTML= drawCanvasobj.button.html_off;
            if(document.getElementById(drawCanvasobj.drawCanvasContainer)){
                hideelem(drawCanvasobj.drawCanvasContainer);
                closeDrawBoard();
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

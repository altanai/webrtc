/**
 * Sync draw boads opening between all peers
 * @method
 * @name syncDrawBoard
 * @param {json} bdata
 */
function syncDrawBoard(bdata) {
    if (document.getElementById(bdata.button.id)) {
        document.getElementById(bdata.button.id).click();
    } else {
        webrtcdev.error("[draw dom modifier] Received sync board event but no button id found");
    }
}

/**drawCanvasContainer
 * Create a draw button
 * @method
 * @name createdrawButton
 * @param {json} drawCanvasobj
 */
function createdrawButton(drawCanvasobj) {
    let drawButton = document.createElement("span");
    drawButton.className = drawCanvasobj.button.class_off;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick = () => {
        if (drawButton.className == drawCanvasobj.button.class_off) {
            // alert(" Draw Board Opened ");
            drawButton.className = drawCanvasobj.button.class_on;
            drawButton.innerHTML = drawCanvasobj.button.html_on;

            openDrawBoard();

        } else if (drawButton.className == drawCanvasobj.button.class_on) {
            drawButton.className = drawCanvasobj.button.class_off;
            drawButton.innerHTML = drawCanvasobj.button.html_off;

            closeDrawBoard();
        }
    };
    var li = document.createElement("li");
    li.appendChild(drawButton);
    document.getElementById("topIconHolder_ul").appendChild(li);
}

/**
 * Assign a draw button
 * @method
 * @name assigndrawButton
 * @param {json} drawCanvasobj
 */
function assigndrawButton(drawCanvasobj) {
    webrtcdev.log("[draw] dom modifier] drawCanvasobj ", drawCanvasobj);
    let drawButton = document.getElementById(drawCanvasobj.button.id);
    drawButton.className = drawCanvasobj.button.class_off;
    drawButton.innerHTML = drawCanvasobj.button.html_off;
    drawButton.onclick = function () {
        if (drawButton.className == drawCanvasobj.button.class_off ) {
            showelem(drawCanvasobj.drawCanvasContainer);
            webrtcdev.log("[draw dom modifier] Draw Board Opened ");

            drawButton.className = drawCanvasobj.button.class_on;
            drawButton.innerHTML = drawCanvasobj.button.html_on;

            openDrawBoard();

        } else if (drawButton.className == drawCanvasobj.button.class_on ) {
            webrtcdev.log("[draw dom modifier] Draw Board Closed ");
            hideelem(drawCanvasobj.drawCanvasContainer);

            drawButton.className = drawCanvasobj.button.class_off;
            drawButton.innerHTML = drawCanvasobj.button.html_off;

            closeDrawBoard();
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
saveButtonCanvas.setAttribute("data-toggle", "modal");
saveButtonCanvas.setAttribute("data-target", "#saveModal");
saveButtonCanvas.onclick = function () {
    createModalPopup("blobcanvas");
};
document.body.appendChild(saveButtonCanvas);

/**
 * set Widgets.
 */
var setWidgets = function (rtcConn) {

    return new Promise(function (resolve, reject) {

        // ---------------------------------- Chat Widget --------------------------------------------------
        if (chatobj.active) {
            if (chatobj.inputBox && chatobj.inputBox.text_id && document.getElementById(chatobj.inputBox.text_id)) {
                webrtcdev.log("[sessionmanager]Assign chat Box ");
                assignChatBox(chatobj);
            } else {
                webrtcdev.log("[sessionmanager]Create chat Box ");
                createChatBox(chatobj);
            }
            webrtcdev.log("[sessionmanager] chat widget loaded ");
        } else {
            webrtcdev.log("[sessionmanager] chat widget not loaded ");
        }

        // ---------------------------------- Screen record Widget --------------------------------------------------
        if (screenrecordobj && screenrecordobj.active && role != "inspector") {
            if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                webrtcdev.log("[sessionmanager] Assign Record Button ");
                assignScreenRecordButton(screenrecordobj);
            } else {
                webrtcdev.log("[sessionmanager] Create Record Button ");
                createScreenRecordButton(screenrecordobj);
            }
            webrtcdev.log(" [sessionmanager] screen record widget loaded ");
        } else if (screenrecordobj && !screenrecordobj.active) {
            if (screenrecordobj.button && screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                document.getElementById(screenrecordobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[sessionmanager] screen record widget not loaded ");
        }

        // ---------------------------------- Screenshare Widget --------------------------------------------------
        if (screenshareobj.active) {
            if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                webrtcdev.log("[sessionmanager] Assign Record Button ");
                assignScreenShareButton(screenshareobj.button.shareButton);
            } else {
                webrtcdev.log("[sessionmanager] Create Record Button ");
                createScreenShareButton();
            }
            webrtcdev.log(" [sessionmanager]screen share widget loaded ");
        } else {
            webrtcdev.warn("[sessionmanager] screen share widget not loaded ");
        }

        // ---------------------------------- Reconnect Widget --------------------------------------------------
        if (reconnectobj && reconnectobj.active) {
            if (reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                webrtcdev.log("[sessionmanager] Reconnect Button Assigned");
                assignButtonRedial(reconnectobj.button.id);
            } else {
                webrtcdev.log("[sessionmanager]Rconnect Button created");
                createButtonRedial(reconnectobj);
            }
            webrtcdev.log(" [sessionmanager]reconnect widget loacded ");
        } else if (reconnectobj && !reconnectobj.active) {
            if (reconnectobj.button && reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                document.getElementById(reconnectobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn(" [sessionmanager] reconnect widget not loaded ");
        }

        // ---------------------------------- Cursor Widget --------------------------------------------------
        if (cursorobj.active) {
            hideelem("cursor1");
            hideelem("cursor2");
        }

        // ---------------------------------- Listenin Widget --------------------------------------------------
        if (listeninobj && listeninobj.active) {
            if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                //assignButtonRedial(reconnectobj.button.id);
            } else {
                //createButtonRedial();
            }
            webrtcdev.log(" [sessionmanager]listen in widget loaded ");
        } else if (listeninobj && !listeninobj.active) {
            if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                document.getElementById(listeninobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[sessionmanager] listenin widget not loaded ");
        }

        // ---------------------------------- Timer Widget --------------------------------------------------
        if (timerobj && timerobj.active) {
            startTime();
            timeZone();
            activateBttons(timerobj);
            hideelem(timerobj.container.id)
        } else if (timerobj && !timerobj.active) {
            if (timerobj.button.id && document.getElementById(timerobj.button.id)) {
                document.getElementById(timerobj.button.id).className = "inactiveButton";
            }
        }

        // ---------------------------------- Draw Widget --------------------------------------------------
        if (drawCanvasobj && drawCanvasobj.active) {
            if (drawCanvasobj.container && drawCanvasobj.container.id && document.getElementById(drawCanvasobj.container.id)) {
                document.getElementById(drawCanvasobj.container.id).hidden = true;
            }
            if (drawCanvasobj.button && drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                assigndrawButton(drawCanvasobj);
            } else {
                createdrawButton(drawCanvasobj);
            }

            CanvasDesigner = (function () {
                var iframe;
                let tools = {
                    line: true,
                    pencil: true,
                    dragSingle: true,
                    dragMultiple: true,
                    eraser: true,
                    rectangle: true,
                    arc: true,
                    bezier: true,
                    quadratic: true,
                    text: true
                };

                var selectedIcon = 'pencil';

                function syncData(data) {
                    if (!iframe) return;

                    iframe.contentWindow.postMessage({
                        canvasDesignerSyncData: data
                    }, '*');
                }

                var syncDataListener = function (data) {
                    webrtcdev.log("syncDataListener", data);
                };

                function onMessage() {
                    if (!event.data || !event.data.canvasDesignerSyncData) return;
                    syncDataListener(event.data.canvasDesignerSyncData);
                }

                /*window.addEventListener('message', onMessage, false);*/

                var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                var eventer = window[eventMethod];
                var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                // Listen to message from child window
                eventer(messageEvent, function (e) {
                    webrtcdev.log("CanvasDesigner parent received message : ", e.data);

                    if (e.data.modalpopup) {
                        saveButtonCanvas.click();
                        //return;
                    } else if (e.data || e.data.canvasDesignerSyncData) {
                        syncDataListener(e.data.canvasDesignerSyncData);
                    } else if (!e.data || !e.data.canvasDesignerSyncData) {
                        webrtcdev.log("parent received unexpected message");
                        //return;
                    }

                }, false);

                return {
                    appendTo: function (parentNode) {
                        iframe = document.createElement('iframe');
                        iframe.id = "drawboard",
                        iframe.src = 'widget.html?tools=' + JSON.stringify(tools) + '&selectedIcon=' + selectedIcon,
                        iframe.style.width = "100%",
                        iframe.style.height = "100%",
                        iframe.allowtransparency = true,
                        iframe.style.border = 0;
                        parentNode.appendChild(iframe);
                    },
                    destroy: function () {
                        if (iframe) {
                            iframe.parentNode.removeChild(iframe);
                        }
                        window.removeEventListener('message', onMessage);
                    },
                    addSyncListener: function (callback) {
                        syncDataListener = callback;
                    },
                    syncData: syncData,
                    setTools: function (_tools) {
                        tools = _tools;
                    },
                    setSelected: function (icon) {
                        if (typeof tools[icon] !== 'undefined') {
                            selectedIcon = icon;
                        }
                    }
                };
            })();
            webrtcdev.log("[sessionmanager] draw widget loaded ");
        } else if (drawCanvasobj && !drawCanvasobj.active) {
            if (drawCanvasobj.button && drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                document.getElementById(drawCanvasobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[sessionmanager] draw widget not loaded ");
        }

        // ---------------------------------- TextEditor Widget --------------------------------------------------
        if (texteditorobj.active) {
            createTextEditorButton();
        }

        // ---------------------------------- CodeEditor Widget --------------------------------------------------
        if (codeeditorobj.active) {
            createCodeEditorButton();
        }

        // ---------------------------------- Fileshare Widget --------------------------------------------------
        if (fileshareobj.active) {

            webrtcdev.log("[sessionmnagare] fileshareobj "),
                rtcConn.enableFileSharing = true;
            // rtcConn.filesContainer = document.body || document.documentElement;
            // /*setFileProgressBarHandlers(rtcConn);*/
            rtcConn.filesContainer = document.getElementById(fileshareobj.fileShareContainer);
            if (fileshareobj.button.id && document.getElementById(fileshareobj.button.id)) {
                assignFileShareButton(fileshareobj);
            } else {
                createFileShareButton(fileshareobj);
            }
            webrtcdev.log(" [sessionmanager] File sharing widget loaded ");
        } else {
            webrtcdev.warn("[sessionmanager] File sharing widget not loaded ");
        }

        // ---------------------------------- stats Widget --------------------------------------------------
        if (statisticsobj && statisticsobj.active) {
            try {
                document.getElementById(statisticsobj.statsConainer).innerHTML = "";
            } catch (e) {
                webrtcdev.error("[sessionmanager] statisticsobj statsConainer not found", e);
            }
        }

        // ---------------------------------- Help Widget --------------------------------------------------
        if (helpobj && helpobj.active) {
            try {
                document.getElementById(helpobj.helpContainer).innerHTML = "";
            } catch (err) {
                webrtcdev.error("[sessionmanager] helpobj helpContainer not found", err);
            }
        }
        resolve("success");
    });
};

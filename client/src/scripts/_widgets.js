/*-----------------------------------------------------------------------------------*/
/*                    Widgets JS                                                   */
/*-----------------------------------------------------------------------------------*/
var setWidgets = function (rtcConn, widgetsobj) {

    webrtcdev.log(" [widgets] widgetsobj ", widgetsobj);

    return new Promise(function (resolve, reject) {

        // ---------------------------------- Chat Widget --------------------------------------------------
        if (chatobj.active) {
            webrtcdev.log(" chat objs ", chatobj.inputBox, chatobj.inputBox.text_id, document.getElementById(chatobj.inputBox.text_id));
            if (chatobj.inputBox && chatobj.inputBox.text_id) {
                webrtcdev.log("[sessionmanager] chatObj - Assign chat Box ");
                assignChatBox(chatobj);
            } else {
                webrtcdev.log("[sessionmanager] chatobj - Create chat Box ");
                createChatBox(chatobj);
            }
            webrtcdev.log("[sessionmanager] chat widget loaded ");
        } else {
            webrtcdev.log("[sessionmanager] chat widget deactivated  ");
        }

        // ---------------------------------- Screen record Widget --------------------------------------------------
        if (screenrecordobj && screenrecordobj.active && role != "inspector") {
            if (screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                webrtcdev.log("[sessionmanager] Assign Screen Record Button ");
                assignScreenRecordButton(screenrecordobj);
            } else {
                webrtcdev.log("[sessionmanager] Create Screen Record Button ");
                createScreenRecordButton(screenrecordobj);
            }
            webrtcdev.log(" [sessionmanager] Screen record widget loaded ");
        } else if (screenrecordobj && !screenrecordobj.active) {
            if (screenrecordobj.button && screenrecordobj.button.id && document.getElementById(screenrecordobj.button.id)) {
                document.getElementById(screenrecordobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[sessionmanager] Screen record widget deactivated");
        }

        // ---------------------------------- Screenshare Widget --------------------------------------------------
        if (screenshareobj.active) {
            if (screenshareobj.button.shareButton.id && getElementById(screenshareobj.button.shareButton.id)) {
                webrtcdev.log("[sessionmanager] Assign screenshare Button ");
                assignScreenShareButton(screenshareobj.button.shareButton);
            } else {
                webrtcdev.log("[sessionmanager] Create screenshare Button ");
                createScreenShareButton(screenshareobj);
            }
            webrtcdev.log(" [sessionmanager]screen share widget loaded ");
        } else {
            webrtcdev.warn("[sessionmanager] screen share widget deactivated ");
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
            webrtcdev.log(" [sessionmanager]reconnect widget loaded ");
        } else if (reconnectobj && !reconnectobj.active) {
            if (reconnectobj.button && reconnectobj.button.id && document.getElementById(reconnectobj.button.id)) {
                document.getElementById(reconnectobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn(" [sessionmanager] reconnect widget deactivated ");
        }

        // ---------------------------------- Cursor Widget --------------------------------------------------
        if (cursorobj && cursorobj.active) {
            hideelem("cursor1");
            hideelem("cursor2");
            webrtcdev.log(" [sessionmanager] cursor widget not loaded ");
        } else {
            webrtcdev.warn(" [sessionmanager] cursor widget deactivated ");
        }

        // ---------------------------------- Listenin Widget --------------------------------------------------
        if (listeninobj && listeninobj.active) {
            // listenintextbox = document.getElementById(listeninobj.button.textbox);
            // webrtcdev.log("[widget js] document.getElementById(listeninobj.button.textbox) " ,listenintextbox);
            // listenintextbox.value =  this.getlisteninlink();

            if (listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                //assignButtonRedial(reconnectobj.button.id);
            } else {
                //createButtonRedial();
            }
            webrtcdev.log("[widget js] listenin widget loaded ");
        } else if (listeninobj && !listeninobj.active) {
            if (listeninobj.button && listeninobj.button.id && document.getElementById(listeninobj.button.id)) {
                document.getElementById(listeninobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[widget js] listenin widget deactivated ");
        }

        // ---------------------------------- Timer Widget --------------------------------------------------
        if (timerobj && timerobj.active) {
            // startTime();
            // showTimeZone();
            activateButtons(timerobj);
            hideelem(timerobj.container.id)
        } else if (timerobj && !timerobj.active) {
            if (timerobj.button.id && document.getElementById(timerobj.button.id)) {
                document.getElementById(timerobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[widget js] timer widget deactivated ");
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
                    webrtcdev.log("[widget js] syncDataListener", data);
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
                    webrtcdev.log(" [widget js] CanvasDesigner parent received message : ", e.data);

                    if (e.data.modalpopup) {
                        saveButtonCanvas.click();
                        //return;
                    } else if (e.data || e.data.canvasDesignerSyncData) {
                        syncDataListener(e.data.canvasDesignerSyncData);
                    } else if (!e.data || !e.data.canvasDesignerSyncData) {
                        webrtcdev.log("[widget js] parent received unexpected message");
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
            webrtcdev.log("[widget js] draw widget loaded ");
        } else if (drawCanvasobj && !drawCanvasobj.active) {
            if (drawCanvasobj.button && drawCanvasobj.button.id && document.getElementById(drawCanvasobj.button.id)) {
                document.getElementById(drawCanvasobj.button.id).className = "inactiveButton";
            }
            webrtcdev.warn("[widget js] draw widget deactivated ");
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

            webrtcdev.log("[widget js] fileshareobj ", fileshareobj),
                rtcConn.enableFileSharing = true;
            // rtcConn.filesContainer = document.body || document.documentElement;
            // /*setFileProgressBarHandlers(rtcConn);*/
            rtcConn.filesContainer = document.getElementById(fileshareobj.fileShareContainer);
            if (fileshareobj.button.id && document.getElementById(fileshareobj.button.id)) {
                assignFileShareButton(fileshareobj);
            } else {
                createFileShareButton(fileshareobj);
            }
            webrtcdev.log(" [widget js] File sharing widget loaded ");
        } else {
            webrtcdev.warn("[widget js] File sharing widget not loaded ");
        }

        // ---------------------------------- stats Widget --------------------------------------------------
        if (statisticsobj && statisticsobj.active) {
            try {
                webrtcdev.log("[widget js]statisticsobj ", statisticsobj);
                document.getElementById(statisticsobj.statsConainer).innerHTML = "";
            } catch (e) {
                webrtcdev.error("[widget js] statisticsobj statsConainer not found", e);
            }
        }

        // ---------------------------------- Help Widget --------------------------------------------------
        if (helpobj && helpobj.active) {
            try {
                webrtcdev.log("[widget js] helpobj ", helpobj, document.getElementById(helpobj.helpContainer));
                document.getElementById(helpobj.helpContainer).innerHTML = "";
            } catch (err) {
                webrtcdev.error("[widget js] helpobj helpContainer not found", err);
            }
        }
        resolve("success");
    });
};

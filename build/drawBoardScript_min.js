/* Generated on:Fri Dec 25 2020 21:29:05 GMT+0530 (India Standard Time) || version: 6.7.1 - Altanai (@altanai)  , License : MIT  */function fitToContainer(a,b){try{b.width=a.offsetWidth,b.height=a.offsetHeight}catch(a){webrtcdev.error(a)}}function setContext(a){var b=null;try{b=a.getContext("2d"),b.lineWidth=lineWidth,b.strokeStyle=strokeStyle,b.fillStyle=fillStyle,b.font=font}catch(a){webrtcdev.error(a)}return b}let mainCanvas=document.getElementById("main-canvas"),canvas=document.getElementById("temp-canvas"),context=setContext(mainCanvas),tempContext=setContext(canvas),parentBox=document.getElementById("drawBox");fitToContainer(parentBox,mainCanvas),fitToContainer(parentBox,canvas),document.getElementById("trashBtn")?document.getElementById("trashBtn").onclick=function(){tempContext.clearRect(0,0,canvas.width,canvas.height),context.clearRect(0,0,mainCanvas.width,mainCanvas.height),window.location.reload()}:webrtcdev.error("trash button not found"),document.getElementById("saveBtn")?document.getElementById("saveBtn").onclick=function(){parent.postMessage({modalpopup:{filetype:"blobcanvas"},sender:selfId},"*")}:webrtcdev.error("save button not found");var is={isLine:!1,isArc:!1,isDragLastPath:!1,isDragAllPaths:!1,isRectangle:!1,isQuadraticCurve:!1,isBezierCurve:!1,isPencil:!1,isEraser:!1,isText:!1,set:function(a){var b=this;b.isLine=b.isArc=b.isDragLastPath=b.isDragAllPaths=b.isRectangle=b.isQuadraticCurve=b.isBezierCurve=is.isPencil=is.isEraser=is.isText=!1,b["is"+a]=!0}};function addEvent(a,b,c){return a.addEventListener?(a.addEventListener(b,c,!1),!0):a.attachEvent?a.attachEvent("on"+b,c):(a["on"+b]=c,this)}function find(a){return document.getElementById(a)}var points=[],textarea=find("code-text"),lineWidth=2,strokeStyle="#6c96c8",fillStyle="transparent",globalAlpha=1,globalCompositeOperation="source-over",lineCap="butt",font="15px Verdana",lineJoin="miter",common={updateTextArea:function(){var a=common,b=a.toFixed,c=a.getPoint,d=find("is-absolute-points").checked,e=find("is-shorten-code").checked;d&&e&&a.absoluteShortened(),d&&!e&&a.absoluteNOTShortened(b),!d&&e&&a.relativeShortened(b,c),d||e||a.relativeNOTShortened(b,c)},toFixed:function(a){return(+a).toFixed(1)},getPoint:function(a,b,c){return a=a>b?c+" + "+(a-b):a<b?c+" - "+(b-a):c,a},absoluteShortened:function(){var a,b="",c=points.length,d=0;for(d;d<c;d++)a=points[d],b+=this.shortenHelper(a[0],a[1],a[2]);b=b.substr(0,b.length-2),textarea.value="var points = ["+b+"], length = points.length, point, p, i = 0;\n\n"+this.forLoop,this.prevProps=null},absoluteNOTShortened:function(a){var b,c,d,e=[];for(b=0;b<points.length;b++)d=points[b],c=d[1],"pencil"===d[0]&&(e[b]=["context.beginPath();\ncontext.moveTo("+c[0]+", "+c[1]+");\ncontext.lineTo("+c[2]+", "+c[3]+");\n"+this.strokeOrFill(d[2])]),"eraser"===d[0]&&(e[b]=["context.beginPath();\ncontext.moveTo("+c[0]+", "+c[1]+");\ncontext.lineTo("+c[2]+", "+c[3]+");\n"+this.strokeOrFill(d[2])]),"line"===d[0]&&(e[b]=["context.beginPath();\ncontext.moveTo("+c[0]+", "+c[1]+");\ncontext.lineTo("+c[2]+", "+c[3]+");\n"+this.strokeOrFill(d[2])]),"text"===d[0]&&(e[b]=["context.fillText("+c[0]+", "+c[1]+", "+c[2]+");\n"+this.strokeOrFill(d[2])]),"arc"===d[0]&&(e[b]=["context.beginPath(); \ncontext.arc("+a(c[0])+","+a(c[1])+","+a(c[2])+","+a(c[3])+", 0,"+c[4]+"); \n"+this.strokeOrFill(d[2])]),"rect"===d[0]&&(e[b]=[this.strokeOrFill(d[2])+"\ncontext.strokeRect("+c[0]+", "+c[1]+","+c[2]+","+c[3]+");\ncontext.fillRect("+c[0]+", "+c[1]+","+c[2]+","+c[3]+");"]),"quadratic"===d[0]&&(e[b]=["context.beginPath();\ncontext.moveTo("+c[0]+", "+c[1]+");\ncontext.quadraticCurveTo("+c[2]+", "+c[3]+", "+c[4]+", "+c[5]+");\n"+this.strokeOrFill(d[2])]),"bezier"===d[0]&&(e[b]=["context.beginPath();\ncontext.moveTo("+c[0]+", "+c[1]+");\ncontext.bezierCurveTo("+c[2]+", "+c[3]+", "+c[4]+", "+c[5]+", "+c[6]+", "+c[7]+");\n"+this.strokeOrFill(d[2])]);textarea.value=e.join("\n\n")+this.strokeFillText,this.prevProps=null},relativeShortened:function(a,b){var c,d,e=0,f=points.length,g="",h=0,j=0;for(e;e<f;e++)d=points[e],c=d[1],0==e&&(h=c[0],j=c[1]),"text"===d[0]&&(h=c[1],j=c[2]),"pencil"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),b(c[2],h,"x"),b(c[3],j,"y")],d[2])),"eraser"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),b(c[2],h,"x"),b(c[3],j,"y")],d[2])),"line"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),b(c[2],h,"x"),b(c[3],j,"y")],d[2])),"text"===d[0]&&(g+=this.shortenHelper(d[0],[c[0],b(c[1],h,"x"),b(c[2],j,"y")],d[2])),"arc"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),c[2],c[3],c[4]],d[2])),"rect"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),b(c[2],h,"x"),b(c[3],j,"y")],d[2])),"quadratic"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),b(c[2],h,"x"),b(c[3],j,"y"),b(c[4],h,"x"),b(c[5],j,"y")],d[2])),"bezier"===d[0]&&(g+=this.shortenHelper(d[0],[b(c[0],h,"x"),b(c[1],j,"y"),b(c[2],h,"x"),b(c[3],j,"y"),b(c[4],h,"x"),b(c[5],j,"y"),b(c[6],h,"x"),b(c[7],j,"y")],d[2]));g=g.substr(0,g.length-2),textarea.value="var x = "+h+", y = "+j+", points = ["+g+"], length = points.length, point, p, i = 0;\n\n"+this.forLoop,this.prevProps=null},relativeNOTShortened:function(a,b){var c,d,e,f=points.length,g="",h=0,j=0;for(c=0;c<f;c++)e=points[c],d=e[1],0===c&&(h=d[0],j=d[1],"text"===e[0]&&(h=d[1],j=d[2]),g="var x = "+h+", y = "+j+";\n\n"),"arc"===e[0]&&(g+="context.beginPath();\ncontext.arc("+b(d[0],h,"x")+", "+b(d[1],j,"y")+", "+d[2]+", "+d[3]+", 0, "+d[4]+");\n"+this.strokeOrFill(e[2])),"pencil"===e[0]&&(g+="context.beginPath();\ncontext.moveTo("+b(d[0],h,"x")+", "+b(d[1],j,"y")+");\ncontext.lineTo("+b(d[2],h,"x")+", "+b(d[3],j,"y")+");\n"+this.strokeOrFill(e[2])),"eraser"===e[0]&&(g+="context.beginPath();\ncontext.moveTo("+b(d[0],h,"x")+", "+b(d[1],j,"y")+");\ncontext.lineTo("+b(d[2],h,"x")+", "+b(d[3],j,"y")+");\n"+this.strokeOrFill(e[2])),"line"===e[0]&&(g+="context.beginPath();\ncontext.moveTo("+b(d[0],h,"x")+", "+b(d[1],j,"y")+");\ncontext.lineTo("+b(d[2],h,"x")+", "+b(d[3],j,"y")+");\n"+this.strokeOrFill(e[2])),"text"===e[0]&&(g+="context.fillText("+d[0]+", "+b(d[1],h,"x")+", "+b(d[2],j,"y")+");\n"+this.strokeOrFill(e[2])),"rect"===e[0]&&(g+=this.strokeOrFill(e[2])+"\ncontext.strokeRect("+b(d[0],h,"x")+", "+b(d[1],j,"y")+", "+b(d[2],h,"x")+", "+b(d[3],j,"y")+");\ncontext.fillRect("+b(d[0],h,"x")+", "+b(d[1],j,"y")+", "+b(d[2],h,"x")+", "+b(d[3],j,"y")+");"),"quadratic"===e[0]&&(g+="context.beginPath();\ncontext.moveTo("+b(d[0],h,"x")+", "+b(d[1],j,"y")+");\ncontext.quadraticCurveTo("+b(d[2],h,"x")+", "+b(d[3],j,"y")+", "+b(d[4],h,"x")+", "+b(d[5],j,"y")+");\n"+this.strokeOrFill(e[2])),"bezier"===e[0]&&(g+="context.beginPath();\ncontext.moveTo("+b(d[0],h,"x")+", "+b(d[1],j,"y")+");\ncontext.bezierCurveTo("+b(d[2],h,"x")+", "+b(d[3],j,"y")+", "+b(d[4],h,"x")+", "+b(d[5],j,"y")+", "+b(d[6],h,"x")+", "+b(d[7],j,"y")+");\n"+this.strokeOrFill(e[2])),c!==f-1&&(g+="\n\n");textarea.value=g+this.strokeFillText,this.prevProps=null},forLoop:"for(i; i < length; i++) {\n\t p = points[i];\n\t point = p[1];\n\t context.beginPath();\n\n\t if(p[2]) { \n\t\t context.lineWidth = p[2][0];\n\t\t context.strokeStyle = p[2][1];\n\t\t context.fillStyle = p[2][2];\n\t\t context.globalAlpha = p[2][3];\n\t\t context.globalCompositeOperation = p[2][4];\n\t\t context.lineCap = p[2][5];\n\t\t context.lineJoin = p[2][6];\n\t\t context.font = p[2][7];\n\t }\n\n\t if(p[0] === \"line\") { \n\t\t context.moveTo(point[0], point[1]);\n\t\t context.lineTo(point[2], point[3]);\n\t }\n\n\t if(p[0] === \"pencil\") { \n\t\t context.moveTo(point[0], point[1]);\n\t\t context.lineTo(point[2], point[3]);\n\t }\n\n\t if(p[0] === \"text\") { \n\t\t context.fillText(point[0], point[1], point[2]);\n\t }\n\n\t if(p[0] === \"eraser\") { \n\t\t context.moveTo(point[0], point[1]);\n\t\t context.lineTo(point[2], point[3]);\n\t }\n\n\t if(p[0] === \"arc\") context.arc(point[0], point[1], point[2], point[3], 0, point[4]); \n\n\t if(p[0] === \"rect\") {\n\t\t context.strokeRect(point[0], point[1], point[2], point[3]);\n\t\t context.fillRect(point[0], point[1], point[2], point[3]);\n\t }\n\n\t if(p[0] === \"quadratic\") {\n\t\t context.moveTo(point[0], point[1]);\n\t\t context.quadraticCurveTo(point[2], point[3], point[4], point[5]);\n\t }\n\n\t if(p[0] === \"bezier\") {\n\t\t context.moveTo(point[0], point[1]);\n\t\t context.bezierCurveTo(point[2], point[3], point[4], point[5], point[6], point[7]);\n\t }\n\n\t context.stroke();\n\t context.fill();\n}",strokeFillText:"\n\nfunction strokeOrFill(lineWidth, strokeStyle, fillStyle, globalAlpha, globalCompositeOperation, lineCap, lineJoin, font) { \n\t if(lineWidth) { \n\t\t context.globalAlpha = globalAlpha;\n\t\t context.globalCompositeOperation = globalCompositeOperation;\n\t\t context.lineCap = lineCap;\n\t\t context.lineJoin = lineJoin;\n\t\t context.lineWidth = lineWidth;\n\t\t context.strokeStyle = strokeStyle;\n\t\t context.fillStyle = fillStyle;\n\t\t context.font = font;\n\t } \n\n\t context.stroke();\n\t context.fill();\n}",strokeOrFill:function(a){return this.prevProps&&this.prevProps===a.join(",")?"strokeOrFill();":(this.prevProps=a.join(","),"strokeOrFill(\""+a.join("\", \"")+"\");")},prevProps:null,shortenHelper:function(a,b,c){var d="[\""+a+"\", ["+b.join(", ")+"]";return this.prevProps&&this.prevProps===c.join(",")||(this.prevProps=c.join(","),d+=", [\""+c.join("\", \"")+"\"]"),d+"], "}};function endLastPath(){var a=is;a.isArc?arcHandler.end():a.isQuadraticCurve?quadraticHandler.end():a.isBezierCurve&&bezierHandler.end(),drawHelper.redraw()}var isControlKeyPressed,copiedStuff=[];function copy(){endLastPath(),dragHelper.global.startingIndex=0,find("copy-last").checked?(copiedStuff=points[points.length-1],setSelection(find("drag-last-path"),"DragLastPath")):(copiedStuff=points,setSelection(find("drag-all-paths"),"DragAllPaths"))}function paste(){endLastPath(),dragHelper.global.startingIndex=0,find("copy-last").checked?(points[points.length]=copiedStuff,dragHelper.global={prevX:0,prevY:0,startingIndex:points.length-1},dragHelper.dragAllPaths(0,0),setSelection(find("drag-last-path"),"DragLastPath")):(dragHelper.global.startingIndex=points.length,points=points.concat(copiedStuff),setSelection(find("drag-all-paths"),"DragAllPaths"))}function make_base(a,b){base_image=new Image,base_image.onload=function(){alert("Make base decorator pencil ",a),b.drawImage(base_image,40,40)},base_image.src=a}(function(){function a(a){return decodeURIComponent(a.replace(/\+/g," "))}for(var b,c={},d=window.location.search;b=/([^&=]+)=?([^&]*)/g.exec(d.substring(1));)c[a(b[1])]=a(b[2]);window.params=c})();var tools={line:!0,pencil:!0,dragSingle:!0,dragMultiple:!0,eraser:!0,rectangle:!0,arc:!0,bezier:!1,quadratic:!1,text:!0};params.tools&&(tools=JSON.parse(params.tools));function setSelection(a,b){endLastPath(),hideContainers(),is.set(b);var c=document.getElementsByClassName("selected-shape")[0];c&&(c.className=c.className.replace(/selected-shape/g,"")),a.className+=" selected-shape"}(function(){function a(a){var b=find(a).getContext("2d");return b.lineWidth=2,b.strokeStyle="#6c96c8",b}function b(a,b){"Pencil"===b&&(lineCap=lineJoin="round"),params.selectedIcon?(params.selectedIcon=params.selectedIcon.split("")[0].toUpperCase()+params.selectedIcon.replace(params.selectedIcon.split("").shift(1),""),params.selectedIcon===b&&is.set(params.selectedIcon)):is.set("Pencil"),a.canvas&&(a=context.canvas),addEvent(a,"click",function(){dragHelper.global.startingIndex=0,setSelection(this,b),"drag-last-path"===this.id?(find("copy-last").checked=!0,find("copy-all").checked=!1):"drag-all-paths"===this.id&&(find("copy-all").checked=!0,find("copy-last").checked=!1),"pencil-icon"===this.id||"eraser-icon"===this.id?(h.lineCap=lineCap,h.lineJoin=lineJoin,lineCap=lineJoin="round"):h.lineCap&&h.lineJoin&&(lineCap=h.lineCap,lineJoin=h.lineJoin),"eraser-icon"===this.id?(h.strokeStyle=strokeStyle,h.fillStyle=fillStyle,h.lineWidth=lineWidth,strokeStyle="White",fillStyle="White",lineWidth=10):h.strokeStyle&&h.fillStyle&&"undefined"!=typeof h.lineWidth&&(strokeStyle=h.strokeStyle,fillStyle=h.fillStyle,lineWidth=h.lineWidth)})}function c(){var c,d,e=a("drag-last-path"),f=10,g=6,h="line",j=[[h,f,g,f+5,g+27],[h,f,g,f+18,g+19],[h,f+17,g+19,f+9,g+20],[h,f+9,g+20,f+5,g+27],[h,f+16,g+22,f+16,g+31],[h,f+12,g+27,f+20,g+27]],k=j.length;for(d=0;d<k;d++)c=j[d],"line"===c[0]&&(e.beginPath(),e.moveTo(c[1],c[2]),e.lineTo(c[3],c[4]),e.closePath(),e.stroke());e.fillStyle="Gray",e.font="9px Verdana",e.fillText("Last",18,12),b(e,"DragLastPath")}function d(){var c,d,e=a("drag-all-paths"),f=10,g=6,h="line",j=[[h,f,g,f+5,g+27],[h,f,g,f+18,g+19],[h,f+17,g+19,f+9,g+20],[h,f+9,g+20,f+5,g+27],[h,f+16,g+22,f+16,g+31],[h,f+12,g+27,f+20,g+27]],k=j.length;for(d=0;d<k;d++)c=j[d],"line"===c[0]&&(e.beginPath(),e.moveTo(c[1],c[2]),e.lineTo(c[3],c[4]),e.closePath(),e.stroke());e.fillStyle="Gray",e.font="10px Verdana",e.fillText("All",20,12),b(e,"DragAllPaths")}function e(){n.parentNode.style.display="none",o.style.display="none",hideContainers(),endLastPath()}function f(){n.parentNode.style.display="block",o.style.display="block",n.focus(),common.updateTextArea(),g(),hideContainers(),endLastPath()}function g(){n.style.width=innerWidth-o.clientWidth-30+"px",n.style.height=innerHeight-40+"px",n.style.marginLeft=o.clientWidth+"px",o.style.height=innerHeight+"px"}var h={},i=find("lineCap-select"),j=find("lineJoin-select"),k=find("tool-box");k.style.height="100%",!0===tools.dragSingle?c():document.getElementById("drag-last-path").style.display="none",!0===tools.dragMultiple?d():document.getElementById("drag-all-paths").style.display="none",!0===tools.line?function(){let a=document.getElementById("line");if(a.innerHTML)b(a,"Line");else{let c=a.getContext("2d"),d=new Image;d.src="drawboardicons/line.png",d.onload=function(){c.drawImage(d,0,0,35,35)},b(c,"Line")}}():document.getElementById("line").style.display="none",!0===tools.pencil?function(){let a=document.getElementById("pencil-icon");if(a.innerHTML)b(a,"Pencil");else{let c=a.getContext("2d"),d=new Image;d.src="drawboardicons/pencil.png",d.onload=function(){c.drawImage(d,0,0,35,35)},b(c,"Pencil")}}():document.getElementById("pencil-icon").style.display="none",!0===tools.eraser?function(){let a=document.getElementById("eraser-icon");if(a.innerHTML)b(a,"Eraser");else{var c=a.getContext("2d"),d=new Image;d.src="drawboardicons/eraser.png",d.onload=function(){c.drawImage(d,0,0,35,35)},b(c,"Eraser")}}():document.getElementById("eraser-icon").style.display="none",!0===tools.text?function(){let a=document.getElementById("text-icon");if(a.innerHTML)b(a,"Text");else{var c=a.getContext("2d");c.font="22px Verdana",c.strokeText("T",15,30),b(c,"Text")}}():document.getElementById("text-icon").style.display="none",!0===tools.arc?function(){var c=a("arc");c.arc(20,20,16.3,2*Math.PI,0,1),c.stroke(),c.fillStyle="Gray",c.font="9px Verdana",c.fillText("Arc",10,24),b(c,"Arc")}():document.getElementById("arc").style.display="none",!0===tools.rectangle?function(){let a=document.getElementById("rectangle");if(a.innerHTML)b(a,"Rectangle");else{var c=a.getContext("2d"),d=new Image;d.src="drawboardicons/rectangle.png",d.onload=function(){c.drawImage(d,0,0,35,35)},b(c,"Rectangle")}}():document.getElementById("rectangle").style.display="none",!0===tools.quadratic?function(){var c=a("quadratic-curve");c.moveTo(0,0),c.quadraticCurveTo(50,10,30,40),c.stroke(),c.fillStyle="Gray",c.font="9px Verdana",c.fillText("quad..",2,24),b(c,"QuadraticCurve")}():document.getElementById("quadratic-curve").style.display="none",!0===tools.bezier?function(){var c=a("bezier-curve"),d=0,e=4;c.moveTo(d,e),c.bezierCurveTo(d+86,e+16,d-45,e+24,d+48,e+34),c.stroke(),c.fillStyle="Gray",c.font="9px Verdana",c.fillText("Bezier",10,8),b(c,"BezierCurve")}():document.getElementById("bezier-curve").style.display="none",function(){var a;let b=document.getElementById("line-width");if(b.innerHTML)a=b;else{var c=document.getElementById("line-width").getContext("2d"),d=new Image;d.src="drawboardicons/linesize.png",d.onload=function(){c.drawImage(d,0,0,35,35)},a=c.canvas}var e=find("line-width-container"),f=find("line-width-text"),g=find("line-width-done"),h=document.getElementsByTagName("h1")[0];addEvent(a,"click",function(){hideContainers(),e.style.display="block",e.style.top=a.offsetTop+1+"px",e.style.left=a.offsetLeft+a.clientWidth+"px",f.focus()}),addEvent(g,"click",function(){e.style.display="none",lineWidth=f.value|f.innerHTML})}(),function(){let a=document.getElementById("colors");var b;if(a.innerHTML)b=a;else{var c=a.getContext("2d"),d=new Image;d.src="drawboardicons/color.png",d.onload=function(){c.drawImage(d,0,0,35,35)},b=c.canvas}var e=find("colors-container"),f=find("stroke-style"),g=find("fill-style"),h=find("colors-done"),i=document.getElementsByTagName("h1")[0];addEvent(b,"click",function(){hideContainers(),e.style.display="block",e.style.top=b.offsetTop+1+"px",e.style.left=b.offsetLeft+b.clientWidth+"px",f.focus()}),addEvent(h,"click",function(){e.style.display="none",strokeStyle=f.value,fillStyle=g.value})}(),function(){var b=a("additional");b.fillStyle="#6c96c8",b.font="35px Verdana",b.fillText("\xBB",10,27),b.fillStyle="Gray",b.font="9px Verdana",b.fillText("Extras!",2,38);var c=find("additional-container"),d=find("additional-close"),e=document.getElementsByTagName("h1")[0],f=b.canvas,g=find("globalAlpha-select"),h=find("globalCompositeOperation-select");addEvent(f,"click",function(){hideContainers(),c.style.display="block",c.style.top=f.offsetTop+1+"px",c.style.left=f.offsetLeft+f.clientWidth+"px"}),addEvent(d,"click",function(){c.style.display="none",globalAlpha=g.value,globalCompositeOperation=h.value,lineCap=i.value,lineJoin=j.value})}();var l=find("design-preview"),m=find("code-preview");window.selectBtn=function(a,b){m.className=l.className="",a==l?l.className="preview-selected":m.className="preview-selected",!b&&window.connection&&1<=connection.numberOfConnectedUsers?connection.send({btnSelected:a.id}):a==l?e():f()},addEvent(l,"click",function(){selectBtn(l),e()}),addEvent(m,"click",function(){selectBtn(m),f()});var n=find("code-text"),o=find("options-container"),p=find("is-absolute-points"),q=find("is-shorten-code");addEvent(q,"change",common.updateTextArea),addEvent(p,"change",common.updateTextArea)})();function hideContainers(){var a=find("additional-container"),b=find("colors-container"),c=find("line-width-container");a.style.display=b.style.display=c.style.display="none"}var drawHelper={redraw:function(a){tempContext.clearRect(0,0,innerWidth,innerHeight),context.clearRect(0,0,innerWidth,innerHeight);var b,c,d=points.length;for(b=0;b<d;b++)c=points[b],this[c[0]](context,c[1],c[2]);a||syncPoints()},getOptions:function(){return[lineWidth,strokeStyle,fillStyle,globalAlpha,globalCompositeOperation,lineCap,lineJoin,font]},handleOptions:function(a,b,c){b=b||this.getOptions(),a.globalAlpha=b[3],a.globalCompositeOperation=b[4],a.lineCap=b[5],a.lineJoin=b[6],a.lineWidth=b[0],a.strokeStyle=b[1],a.fillStyle=b[2],c||(a.stroke(),a.fill())},line:function(a,b,c){a.beginPath(),a.moveTo(b[0],b[1]),a.lineTo(b[2],b[3]),this.handleOptions(a,c)},text:function(a,b,c){var d=fillStyle;a.fillStyle="transparent"===fillStyle||"White"===fillStyle?"Black":fillStyle,a.font="15px Verdana",a.fillText(b[0].substr(1,b[0].length-2),b[1],b[2]),fillStyle=d,this.handleOptions(a,c)},arc:function(a,b,c){a.beginPath(),a.arc(b[0],b[1],b[2],b[3],0,b[4]),this.handleOptions(a,c)},rect:function(a,b,c){this.handleOptions(a,c,!0),a.strokeRect(b[0],b[1],b[2],b[3]),a.fillRect(b[0],b[1],b[2],b[3])},quadratic:function(a,b,c){a.beginPath(),a.moveTo(b[0],b[1]),a.quadraticCurveTo(b[2],b[3],b[4],b[5]),this.handleOptions(a,c)},bezier:function(a,b,c){a.beginPath(),a.moveTo(b[0],b[1]),a.bezierCurveTo(b[2],b[3],b[4],b[5],b[6],b[7]),this.handleOptions(a,c)}},dragHelper={global:{prevX:0,prevY:0,ismousedown:!1,pointsToMove:"all",startingIndex:0},mousedown:function(a){isControlKeyPressed&&(copy(),paste(),isControlKeyPressed=!1);var b=dragHelper,c=b.global,d=a.pageX-canvas.offsetLeft,e=a.pageY-canvas.offsetTop;if(c.prevX=d,c.prevY=e,c.pointsToMove="all",points.length){var f=points[points.length-1],g=f[1];"line"===f[0]&&(b.isPointInPath(d,e,g[0],g[1])&&(c.pointsToMove="head"),b.isPointInPath(d,e,g[2],g[3])&&(c.pointsToMove="tail")),"rect"===f[0]&&b.isPointInPath(d,e,g[0]+g[2],g[1]+g[3])&&(c.pointsToMove="stretch"),"quadratic"===f[0]&&(b.isPointInPath(d,e,g[0],g[1])&&(c.pointsToMove="starting-points"),b.isPointInPath(d,e,g[2],g[3])&&(c.pointsToMove="control-points"),b.isPointInPath(d,e,g[4],g[5])&&(c.pointsToMove="ending-points")),"bezier"===f[0]&&(b.isPointInPath(d,e,g[0],g[1])&&(c.pointsToMove="starting-points"),b.isPointInPath(d,e,g[2],g[3])&&(c.pointsToMove="1st-control-points"),b.isPointInPath(d,e,g[4],g[5])&&(c.pointsToMove="2nd-control-points"),b.isPointInPath(d,e,g[6],g[7])&&(c.pointsToMove="ending-points"))}c.ismousedown=!0},mouseup:function(){var a=this.global;is.isDragLastPath&&(tempContext.clearRect(0,0,innerWidth,innerHeight),context.clearRect(0,0,innerWidth,innerHeight),this.end()),a.ismousedown=!1},mousemove:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this.global;drawHelper.redraw(),d.ismousedown&&this.dragShape(b,c),is.isDragLastPath&&this.init()},init:function(){var a=Math.PI;if(points.length){var b=points[points.length-1],c=b[1],d=this.global;tempContext.fillStyle=d.ismousedown?"rgba(255,85 ,154,.9)":"rgba(255,85 ,154,.4)","quadratic"===b[0]&&(tempContext.beginPath(),tempContext.arc(c[0],c[1],10,2*a,0,!1),tempContext.arc(c[2],c[3],10,2*a,0,!1),tempContext.arc(c[4],c[5],10,2*a,0,!1),tempContext.fill()),"bezier"===b[0]&&(tempContext.beginPath(),tempContext.arc(c[0],c[1],10,2*a,0,!1),tempContext.arc(c[2],c[3],10,2*a,0,!1),tempContext.arc(c[4],c[5],10,2*a,0,!1),tempContext.arc(c[6],c[7],10,2*a,0,!1),tempContext.fill()),"line"===b[0]&&(tempContext.beginPath(),tempContext.arc(c[0],c[1],10,2*a,0,!1),tempContext.arc(c[2],c[3],10,2*a,0,!1),tempContext.fill()),"text"===b[0]&&(tempContext.font="15px Verdana",tempContext.fillText(c[0],c[1],c[2])),"rect"===b[0]&&(tempContext.beginPath(),tempContext.arc(c[0]+c[2],c[1]+c[3],10,2*a,0,!1),tempContext.fill())}},isPointInPath:function(a,b,c,d){return a>c-10&&a<c+10&&b>d-10&&b<d+10},getPoint:function(a,b,c){return a=a>b?c+(a-b):c-(b-a),a},dragShape:function(a,b){if(this.global.ismousedown){tempContext.clearRect(0,0,innerWidth,innerHeight),is.isDragLastPath&&this.dragLastPath(a,b),is.isDragAllPaths&&this.dragAllPaths(a,b);var c=this.global;c.prevX=a,c.prevY=b}},end:function(){if(points.length){tempContext.clearRect(0,0,innerWidth,innerHeight);var a=points[points.length-1];drawHelper[a[0]](context,a[1],a[2])}},dragAllPaths:function(a,b){var c,d,e=this.global,f=e.prevX,g=e.prevY,h=points.length,j=this.getPoint,k=e.startingIndex;for(k;k<h;k++)c=points[k],d=c[1],"line"===c[0]&&(points[k]=[c[0],[j(a,f,d[0]),j(b,g,d[1]),j(a,f,d[2]),j(b,g,d[3])],c[2]]),"text"===c[0]&&(points[k]=[c[0],[d[0],j(a,f,d[1]),j(b,g,d[2])],c[2]]),"arc"===c[0]&&(points[k]=[c[0],[j(a,f,d[0]),j(b,g,d[1]),d[2],d[3],d[4]],c[2]]),"rect"===c[0]&&(points[k]=[c[0],[j(a,f,d[0]),j(b,g,d[1]),d[2],d[3]],c[2]]),"quadratic"===c[0]&&(points[k]=[c[0],[j(a,f,d[0]),j(b,g,d[1]),j(a,f,d[2]),j(b,g,d[3]),j(a,f,d[4]),j(b,g,d[5])],c[2]]),"bezier"===c[0]&&(points[k]=[c[0],[j(a,f,d[0]),j(b,g,d[1]),j(a,f,d[2]),j(b,g,d[3]),j(a,f,d[4]),j(b,g,d[5]),j(a,f,d[6]),j(b,g,d[7])],c[2]])},dragLastPath:function(a,b){var c=this.global,d=c.prevX,e=c.prevY,f=points[points.length-1],g=f[1],h=this.getPoint,i="all"===c.pointsToMove;"line"===f[0]&&(("head"===c.pointsToMove||i)&&(g[0]=h(a,d,g[0]),g[1]=h(b,e,g[1])),("tail"===c.pointsToMove||i)&&(g[2]=h(a,d,g[2]),g[3]=h(b,e,g[3])),points[points.length-1]=[f[0],g,f[2]]),"text"===f[0]&&(("head"===c.pointsToMove||i)&&(g[1]=h(a,d,g[1]),g[2]=h(b,e,g[2])),points[points.length-1]=[f[0],g,f[2]]),"arc"===f[0]&&(g[0]=h(a,d,g[0]),g[1]=h(b,e,g[1]),points[points.length-1]=[f[0],g,f[2]]),"rect"===f[0]&&(i&&(g[0]=h(a,d,g[0]),g[1]=h(b,e,g[1])),"stretch"===c.pointsToMove&&(g[2]=h(a,d,g[2]),g[3]=h(b,e,g[3])),points[points.length-1]=[f[0],g,f[2]]),"quadratic"===f[0]&&(("starting-points"===c.pointsToMove||i)&&(g[0]=h(a,d,g[0]),g[1]=h(b,e,g[1])),("control-points"===c.pointsToMove||i)&&(g[2]=h(a,d,g[2]),g[3]=h(b,e,g[3])),("ending-points"===c.pointsToMove||i)&&(g[4]=h(a,d,g[4]),g[5]=h(b,e,g[5])),points[points.length-1]=[f[0],g,f[2]]),"bezier"===f[0]&&(("starting-points"===c.pointsToMove||i)&&(g[0]=h(a,d,g[0]),g[1]=h(b,e,g[1])),("1st-control-points"===c.pointsToMove||i)&&(g[2]=h(a,d,g[2]),g[3]=h(b,e,g[3])),("2nd-control-points"===c.pointsToMove||i)&&(g[4]=h(a,d,g[4]),g[5]=h(b,e,g[5])),("ending-points"===c.pointsToMove||i)&&(g[6]=h(a,d,g[6]),g[7]=h(b,e,g[7])),points[points.length-1]=[f[0],g,f[2]])}},pencilHandler={ismousedown:!1,prevX:0,prevY:0,mousedown:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.prevX=b,d.prevY=c,d.ismousedown=!0,tempContext.lineCap="round",drawHelper.line(tempContext,[d.prevX,d.prevY,b,c]),points[points.length]=["line",[d.prevX,d.prevY,b,c],drawHelper.getOptions()],d.prevX=b,d.prevY=c},mouseup:function(){this.ismousedown=!1},mousemove:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.ismousedown&&(tempContext.lineCap="round",drawHelper.line(tempContext,[d.prevX,d.prevY,b,c]),points[points.length]=["line",[d.prevX,d.prevY,b,c],drawHelper.getOptions()],d.prevX=b,d.prevY=c)}},eraserHandler={ismousedown:!1,prevX:0,prevY:0,mousedown:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.prevX=b,d.prevY=c,d.ismousedown=!0,tempContext.lineCap="round",drawHelper.line(tempContext,[d.prevX,d.prevY,b,c]),points[points.length]=["line",[d.prevX,d.prevY,b,c],drawHelper.getOptions()],d.prevX=b,d.prevY=c},mouseup:function(){this.ismousedown=!1},mousemove:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.ismousedown&&(tempContext.lineCap="round",drawHelper.line(tempContext,[d.prevX,d.prevY,b,c]),points[points.length]=["line",[d.prevX,d.prevY,b,c],drawHelper.getOptions()],d.prevX=b,d.prevY=c)}},lineHandler={ismousedown:!1,prevX:0,prevY:0,mousedown:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.prevX=b,d.prevY=c,d.ismousedown=!0},mouseup:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.ismousedown&&(points[points.length]=["line",[d.prevX,d.prevY,b,c],drawHelper.getOptions()],d.ismousedown=!1)},mousemove:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.ismousedown&&(tempContext.clearRect(0,0,innerWidth,innerHeight),drawHelper.line(tempContext,[d.prevX,d.prevY,b,c]))}},rectHandler={ismousedown:!1,prevX:0,prevY:0,mousedown:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.prevX=b,d.prevY=c,d.ismousedown=!0},mouseup:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.ismousedown&&(points[points.length]=["rect",[d.prevX,d.prevY,b-d.prevX,c-d.prevY],drawHelper.getOptions()],d.ismousedown=!1)},mousemove:function(a){var b=a.pageX-canvas.offsetLeft,c=a.pageY-canvas.offsetTop,d=this;d.ismousedown&&(tempContext.clearRect(0,0,innerWidth,innerHeight),drawHelper.rect(tempContext,[d.prevX,d.prevY,b-d.prevX,c-d.prevY]))}},textInput=document.getElementById("text-input");textInput.onkeyup=function(a){13!=a.keyCode||(fillText(),textHandler.isTextPending=!0,textHandler.y+=20,textHandler.pageY+=20,textInput.style.top=textHandler.pageY-10+"px",textInput.style.left=textHandler.pageX-10+"px",textInput.style.color="transparent"==fillStyle?"Black":fillStyle,setTimeout(function(){textInput.focus()},200))},textInput.onblur=function(){return textInput.value.length?void fillText():void(textInput.style.top="-100000px",textInput.style.left="-100000px",textHandler.isTextPending=!1)};function fillText(){if(textHandler.isTextPending){textHandler.isTextPending=!1;var a=fillStyle,b=font;fillStyle="Black",font="15px Verdana",points[points.length]=["text",["\""+textInput.value+"\"",textHandler.x,textHandler.y],drawHelper.getOptions()],fillStyle=a,font=b,textInput.style.top="-100000px",textInput.style.left="-100000px",textInput.value="",drawHelper.redraw()}}var textHandler={isTextPending:!1,mousedown:function(a){textHandler.isTextPending&&fillText(),textHandler.isTextPending=!0,textHandler.pageX=a.pageX,textHandler.pageY=a.pageY,textHandler.x=a.pageX-canvas.offsetLeft-10,textHandler.y=a.pageY-canvas.offsetTop+5,textInput.style.top=a.pageY-10+"px",textInput.style.left=a.pageX-10+"px",textInput.style.color="transparent"==fillStyle?"Black":fillStyle,setTimeout(function(){textInput.focus()},200)},mouseup:function(){},mousemove:function(){}},selfId=parent.selfuserid,isTouch=("createTouch"in document);addEvent(canvas,isTouch?"touchstart":"mousedown",function(a){isTouch&&(a=a.pageX?a:a.touches.length?a.touches[0]:{pageX:0,pageY:0});var b=is;if(b.isLine)lineHandler.mousedown(a);else if(b.isArc)arcHandler.mousedown(a);else if(b.isRectangle)rectHandler.mousedown(a);else if(b.isQuadraticCurve)quadraticHandler.mousedown(a);else if(b.isBezierCurve)bezierHandler.mousedown(a);else if(b.isDragLastPath||b.isDragAllPaths)dragHelper.mousedown(a);else if(is.isPencil)pencilHandler.mousedown(a);else if(is.isEraser)eraserHandler.mousedown(a);else if(is.isText)textHandler.mousedown(a);else return void console.log(" none of the event matched ");drawHelper.redraw()}),addEvent(canvas,isTouch?"touchend":"mouseup",function(a){isTouch&&(a=a.pageX?a:a.touches.length?a.touches[0]:{pageX:0,pageY:0});var b=is;b.isLine?lineHandler.mouseup(a):b.isArc?arcHandler.mouseup(a):b.isRectangle?rectHandler.mouseup(a):b.isQuadraticCurve?quadraticHandler.mouseup(a):b.isBezierCurve?bezierHandler.mouseup(a):b.isDragLastPath||b.isDragAllPaths?dragHelper.mouseup(a):is.isPencil?pencilHandler.mouseup(a):is.isEraser?eraserHandler.mouseup(a):is.isText&&textHandler.mouseup(a),drawHelper.redraw()}),addEvent(canvas,isTouch?"touchmove":"mousemove",function(a){isTouch&&(a=a.pageX?a:a.touches.length?a.touches[0]:{pageX:0,pageY:0});var b=is;b.isLine?lineHandler.mousemove(a):b.isArc?arcHandler.mousemove(a):b.isRectangle?rectHandler.mousemove(a):b.isQuadraticCurve?quadraticHandler.mousemove(a):b.isBezierCurve?bezierHandler.mousemove(a):b.isDragLastPath||b.isDragAllPaths?dragHelper.mousemove(a):is.isPencil?pencilHandler.mousemove(a):is.isEraser?eraserHandler.mousemove(a):is.isText&&textHandler.mousemove(a)});var keyCode;function onkeydown(a){keyCode=a.keyCode,isControlKeyPressed||17!==keyCode||(isControlKeyPressed=!0)}addEvent(document,"keydown",onkeydown);function onkeyup(a){keyCode=a.keyCode,isControlKeyPressed&&90===keyCode&&points.length&&(--points.length,drawHelper.redraw()),isControlKeyPressed&&65===keyCode&&(dragHelper.global.startingIndex=0,endLastPath(),setSelection(find("drag-all-paths"),"DragAllPaths")),isControlKeyPressed&&67===keyCode&&points.length&&copy(),isControlKeyPressed&&86===keyCode&&copiedStuff.length&&paste(),17===keyCode&&(isControlKeyPressed=!1)}addEvent(document,"keyup",onkeyup);var lastPoint=[];window.addEventListener("message",function(a){a.data&&a.data.canvasDesignerSyncData&&(!a.data.sender||a.data.sender!=selfId)&&(points=a.data.canvasDesignerSyncData,!lastPoint.length&&(lastPoint=points.join("")),drawHelper.redraw(!0))},!1);function syncPoints(){lastPoint.length||(lastPoint=points.join("")),points.join("")!=lastPoint&&(syncData(points||[]),lastPoint=points.join(""))}function syncData(a){parent.postMessage({canvasDesignerSyncData:a,sender:selfId},"*")}
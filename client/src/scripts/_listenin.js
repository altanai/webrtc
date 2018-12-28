/* **********************************************
Listen -In
*************************************************/

if(document.getElementById("ListenInButton")){

	var listeninLink = window.location+'?appname=webrtcwebcall&role=inspector&audio=0&video=0';
  	
  	var modalBox=document.createElement("div");
  	modalBox.className="modal fade";
  	modalBox.setAttribute("role" , "dialog");
  	modalBox.id="myModal";

  	var modalinnerBox=document.createElement("div");
  	modalinnerBox.className="modal-dialog";

	var modal=document.createElement("div");
	modal.className = "modal-content";

	var modalheader= document.createElement("div");
	modalheader.className = "modal-header";

	var closeButton= document.createElement("button");
	closeButton.className="close";
	closeButton.setAttribute("data-dismiss", "modal");
	closeButton.innerHTML="&times;";

	var title=document.createElement("h4");
	title.className="modal-title";
	title.innerHTML="Listen-In Link";	

	modalheader.appendChild(title);
	modalheader.appendChild(closeButton);


	var modalbody = document.createElement("div");
	modalbody.className="modal-body";

	var link = document.createElement("div");
	link.innerHTML = window.location+'?appname=webrtcwebcall&role=inspector&audio=0&video=0';

	var mail=document.createElement("div");
	mail.innerHTML='<a href="mailto:?Subject=Hello%20again" target="_top">Send Mail</a>';

	modalbody.appendChild(link);
	modalbody.appendChild(mail);

	modal.appendChild(modalheader);
	modal.appendChild(modalbody);

	modalinnerBox.appendChild(modal);
	modalBox.appendChild(modalinnerBox);

	var mainDiv= document.getElementById("mainDiv");
	mainDiv.appendChild(modalBox);

	webrtcdev.log(" -----------------sppenedd modal dialog ListenIn" , modalBox);
	//document.body.appendChild(modalBox);

	/*document.getElementById("ListenInButton").onclick=function(){
		//alert(window.location+'?appname=webrtcwebcall&role=inspector&audio=0&video=0');
	}*/
}

if(document.getElementById('listenInLink')){
	try{
		var currSession =  window.location.href;
		webrtcdev.log(" Current Session ", currSession);
	
		var listeninSession = currSession+'?appname=webrtcwebcall&role=inspector&audio=0&video=0';
		webrtcdev.log(" Inspector Link " , listeninSession);

		document.getElementById("listenInLink").value = listeninSession;
	}catch(e){
		webrtcdev.error(" Listen In :". e);
	}
}

function mailListenInLink(){
			fetch(url, {
			  method		: 'post',
			  crossDomain	: true,
			  ContentEncoding: 'base64',
			  headers		: {
			    'Accept': 'application/zip, text/plain, */*',
			    'Content-Type': 'application/json',
			    'Authorization' : key
			  },
			  body: { 
		            apikey 		: key ,
		            useremail	: selfemail, 
		            sessionid	: sessionid,
		            webrtcZip 	: content , //Zip file (Max File Size 2MB)
		            webrtcTxt 	: 'traceswebrtcdev'
		        }
			})
			.then(res => res.json())
			.then(res => console.log(res));
}

/************************************************************************
Track Call Record 
*************************************************************************/
/**
 * collect all webrtcStats and stream to Server to be stored in a file with seesion id as the file name 
 * @method
 * @name sendCallTraces
 * @param {string} traces
 */
// function sendCallTraces(){

// }

/**
 * collect all webrtcdev.log and stream to Server to be stored in a file with seesion id as the file name 
 * @method
 * @name sendwebrtcdevLogs
 * @param {string} logs
 */
// function sendwebrtcdevLogs(url , key){

// 	try{

// 		var zip = new JSZip();
// 		zip.file("webrtcDevSessionLogs.txt", webrtcdevlogs);
// 		// var img = zip.folder("images");
// 		// img.file("smile.gif", imgData, {base64: true});
// 		// zip.generateAsync({type:"blob"})
// 		zip.generateAsync({type:"base64"})
// 		.then(function(content) {
// 		    // see FileSaver.js
// 		    // saveAs(content, "webrtcDevSessionLogs.zip");
// 		    fetch(url, {
// 			  method		: 'post',
// 			  crossDomain	: true,
// 			  ContentEncoding: 'base64',
// 			  headers		: {
// 			    'Accept': 'application/zip, text/plain, */*',
// 			    'Content-Type': 'application/json',
// 			    'Authorization' : key
// 			  },
// 			  body: { 
// 		            apikey 		: key ,
// 		            useremail	: selfemail, 
// 		            sessionid	: sessionid,
// 		            webrtcZip 	: content , //Zip file (Max File Size 2MB)
// 		            webrtcTxt 	: 'traceswebrtcdev'
// 		        }
// 			})
// 			.then(res => res.json())
// 			.then(res => console.log(res));

// 		});

// 	}catch(e){
// 		webrtcdevlogs.error(" Exception in sendwebrtcdevLogs " , e);
// 	}
// }


function sendwebrtcdevLogs(url, key , msg) {
	const data = new FormData();
	const fileField = webrtcdevlogs;
	data.append('name', selfemail);
	data.append('scimage', "");
	data.append("apikey", "dnE5aGpkUE03U1k4K3V5V0FUU3A4aGpGV2JHbkVsanhUVVBGU0NiaTZKcz0=");
	data.append("useremail", selfemail);
	data.append("sesionid", "15247878");
	data.append("message", msg);
	data.append("logfileContent", "WEBRTC LOG");

	return fetch(url, {
			method: 'POST',
			body: data
		})
		.then(res => res.text())
		.then(text => console.log(text));
}
// haal elementen op waarvan de id's overkomen met;
var naarstap2klik = document.getElementById("naarstap2klik");
var naarstap3klik = document.getElementById("naarstap3klik");
var terugnaarstap1klik = document.getElementById("terugnaarstap1");
var terugnaarstap2klik = document.getElementById("terugnaarstap2");

// verberg de tweede en derde registreer stap.
document.getElementById("stap2").className = "staphidden";
document.getElementById("stap3").className = "staphidden";

// verberg de eerste stap en laat de tweede stap verschijnen.
function naarstap2() {
  document.getElementById("stap1").className = "staphidden";
  document.getElementById("stap2").className = "stap2";
}

// laat de eerste stap weer verschijnen en verberg de tweede stap weer.
function terugnaarstap1() {
	document.getElementById("stap1").className = "stap1";
	document.getElementById("stap2").className = "staphidden";
}

// verberg de tweede stap en laat de derde stap verschijnen.
function naarstap3() {
  document.getElementById("stap2").className = "staphidden";
  document.getElementById("stap3").className = "stap3";
}

// laat de tweede stap weer verschijnen en verberg de derde stap weer.
function terugnaarstap2() {
	document.getElementById("stap2").className = "stap2";
	document.getElementById("stap3").className = "staphidden";
}

/* eventlisteners die luisteren naar een klik van de gebruiker op de in het begin gedeclareerde elementen.
vervolgens worden stappen verborgen of laten verschijnen. */
naarstap2klik.addEventListener('click', naarstap2, false);
naarstap3klik.addEventListener('click', naarstap3, false);
terugnaarstap1klik.addEventListener('click', terugnaarstap1, false);
terugnaarstap2klik.addEventListener('click', terugnaarstap2, false);

// api

var username = document.getElementById('email');
var takenuser = document.getElementById('takenuser');

var JSONHttpRequest = function(url, successHandler, errorHandler) {
	var req = new XMLHttpRequest();
	req.open('get', url, true);
	req.responseType = 'json';
	req.onload = function() {
		var status = req.status;
		if (status == 200) {
			successHandler && successHandler(req.response);
		} else {
			errorHandler && errorHandler(status);
		}
	};
	req.send();
};

var username = document.getElementById('email');
username.addEventListener("keydown", verberg, false);
console.log(username)

if (username && username.addEventListener) {
    username.addEventListener("keypress", function(){
    		JSONHttpRequest('/api?email='+email.value, function(data) {
      			if(data.status == 'ok') {
        				takenuser.className = "display";
        				naarstap3klik.className = "verberg";
                console.log(data);
      			}
    		}, function(err) {
    			// fail silently
    			console.log('error')
    		});
    }, false);
}

console.log(JSONHttpRequest);

function verberg(){
  	takenuser.classList.remove("display");
  	naarstap3klik.classList.remove("verberg");

}

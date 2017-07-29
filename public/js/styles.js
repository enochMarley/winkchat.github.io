/**
    Created By Enoch Marley [24/07/2017]
    This is the script which takes care of client side validation
*/

$(function($){

	/*******************events for the sign up page**********************************/
	//defining variables
	var $signupForm = $(".signup-form");
	var $resMsg = $(".signup-res-msg");
	var $username = $(".signup-username");
	var $password = $(".signup-password");
	var $passwordConf = $(".signup-password-conf");
	var $signupBtn = $(".signup-btn");


	//setting properties of components
	$signupBtn.prop("disabled",true);
	$passwordConf.prop("readonly",true);
	//$(".signup-username-ok, .signup-pwd-ok, .signup-pwdconf-ok").hide();

	//validating username on real time
	$username.on("input", () => {
		var username = $username.val().trim();
		var regex = /^[A-Za-z0-9]+$/;
		
		if(username.length < 5 && !regex.test(username)){
			$resMsg.html('Username Must Be Must Be Alphanumeric').addClass("res-msg").removeClass("check-ok");
			$(".signup-username-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		} else if(username.length > 5 && !regex.test(username)){
			$resMsg.html('Username Must Be Must Be Alphanumeric').addClass("res-msg").removeClass("check-ok");
			$(".signup-username-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		} else if(username.length < 5 && $.isNumeric(username.substr(0))){
			$resMsg.html('Username Cannot Begin With A Number').addClass("res-msg").removeClass("check-ok");
			$(".signup-username-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		} else if(username.length > 5 && $.isNumeric(username.substr(0))){
			$resMsg.html('Username Cannot Begin With A Number').addClass("res-msg").removeClass("check-ok");
			$(".signup-username-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		} else if (username.length < 5) {
			$resMsg.html('Username Must Be At Least 5 Characters Long').addClass("res-msg").removeClass("check-ok");
			$(".signup-username-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		}else if(username === ''){
			$resMsg.html('').addClass("res-msg").removeClass("check-ok");
			$(".signup-username-ok").removeClass("fa fa-remove check-not-ok").removeClass("check-ok");
		} else if (username !== '') {
			$resMsg.html('<img src="/images/loading.gif" class="loadin-img"> Checking Username Availability').removeClass("res-msg").addClass("check-ok");
			$(".signup-username-ok").removeClass("fa fa-remove check-not-ok");
			var usernameObj = {"username": username};

			$.ajax({
				method: 'POST',
				url: '/checkUsername',
				contentType: 'application/json',
				data: JSON.stringify(usernameObj),
				success: (response) =>{
					if (response) {
						$resMsg.html('Username Unavailable. Already In Use').addClass("res-msg").removeClass("check-ok");
						$(".signup-username-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
					}else{
						$resMsg.html(username +' Is Available For You.').addClass("check-ok").removeClass("res-msg");
						$(".signup-username-ok").addClass("fa fa-check check-not-ok").removeClass("res-msg").addClass("check-ok");
					}
				},
				error: (error) => {
					alert(error);
				}
			});
		}

	});

	//validating password on real time
	$password.on("input", () => {{
		var password = $password.val().trim();
		if (password.length < 5) {
			$passwordConf.prop("readonly",true);
			$resMsg.html('Password Must Be At Least 5 Characters Long').addClass("res-msg").removeClass("check-ok");
			$(".signup-pwd-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		}else{
			$resMsg.html('');
			$(".signup-pwd-ok").removeClass("fa fa-remove check-not-ok").addClass("fa fa-check check-ok");
			$passwordConf.prop("readonly",false);
		}
	}});

	//validating confirmation password  on real time
	$passwordConf.on("input", () => {{
		var passwordConf = $passwordConf.val().trim();
		if ((passwordConf.length >= $password.val().trim().length) && (passwordConf != $password.val().trim())) {
			$resMsg.html('Password & Confirmation Password Do Not Match').addClass("res-msg").removeClass("check-ok");
			$(".signup-pwdconf-ok").addClass("fa fa-remove check-not-ok").removeClass("check-ok");
		}else if((passwordConf.length < $password.val().trim().length)){
			$resMsg.html('');
			$(".signup-pwdconf-ok").removeClass("fa fa-remove fa fa-check check-not-ok check-ok");
		}else{
			$resMsg.html('');
			$(".signup-pwdconf-ok").removeClass("fa fa-remove check-not-ok").addClass("fa fa-check check-ok");
			$signupBtn.prop("disabled",false);
		}
	}})

	//submitting the form
	$signupForm.on("submit", (event) => {
		event.preventDefault();
		var username = $username.val().trim();
		var password = $password.val().trim();
		$resMsg.html('<img src="/images/loading.gif" class="loadin-img"> Signing Up').removeClass("res-msg").addClass("check-ok");
		

		var signupObj = {"username": username, "password": password};
			
		$.ajax({
			method: 'POST',
			url: '/signupuser',
			contentType: 'application/json',
			data: JSON.stringify(signupObj),
			success: (response) => {
				if (!response) {
					$resMsg.html('Unable To Sign Up. Try Again').addClass("res-msg").removeClass("check-ok");
				}else{

					$resMsg.html('<b>Signup Successful</b>').addClass("check-ok").removeClass("res-msg");
					setTimeout(() => {
						window.location.href = '/login';
					}, 1500)
				}
			},
			error: (error) => {
				alert(error);
			}
		});

	});
	/*******************end events for the sign up page**********************************/


	/*******************events for the login page**********************************/
	var $loginForm = $(".login-form");
	var $loginUsername = $(".login-username");
	var $loginPassword = $(".login-password");
	var $loginBtn = $(".login-btn");
	var $loginErrMsg = $(".login-res-msg");

	$loginForm.on("submit", (event) => {
		event.preventDefault();
		var username = $loginUsername.val().trim();
		var password = $loginPassword.val().trim();
		$loginErrMsg.html('<img src="/images/loading.gif" class="loadin-img"> Loging In').removeClass("res-msg").addClass("check-ok");

		var loginObj = {"username": username, "password": password};
			
		$.ajax({
			method: 'POST',
			url: '/loginuser',
			contentType: 'application/json',
			data: JSON.stringify(loginObj),
			success: (response) => {
				if (!response) {
					$loginErrMsg.html('Wrong Username Or Password. Try Again').addClass("res-msg").removeClass("check-ok");
					$loginUsername.val('');
					$loginPassword.val('');
				}else{

					$loginErrMsg.html('<b>Login Successful</>').addClass("check-ok").removeClass("res-msg");
					setTimeout(() => {
						window.location.href = '/chatroom';
					}, 1000)
				}
			},
			error: (error) => {
				alert(error);
			}
		});
	});

	/*******************end of events for the login page**********************************/


});

function login() {
	setTimeout(function() {
		chrome.storage.local.get(["li_user", "li_pwd"], function (item) {
			document.getElementById("username") = item.li_user;
			document.getElementById("password") = item.li_pwd;
			document.querySelector('button[type="submit"][aria-label="Sign in"]').click();
		});
	}, 2000);
}
async function wait_for_login() {
	await login();
	window.close();
}
wait_for_login();

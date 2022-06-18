let api_ce_login = "https://api.bextra.io/ce/login";
let LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
document.addEventListener('DOMContentLoaded', restore_options());
document.getElementById('loginbtn').addEventListener('click', login);
document.getElementById('campaign_ID').addEventListener('change',async event => {
	console.log("ONCHANGE SAVING CAMPAIGN ID")
	await LS.setItem("list_code", document.getElementById('campaign_ID').value) 
});

//Create Table for Counters
let table = document.createElement('table');
let thead = document.createElement('thead');
let tbody = document.createElement('tbody');

table.appendChild(thead);
table.appendChild(tbody);

// Adding the entire table to the body tag
document.getElementById('counters-table').appendChild(table);

// Creating and adding data to first row of the table
let row_1 = document.createElement('tr');
let heading_1 = document.createElement('th');
heading_1.innerHTML = "Date";
let heading_2 = document.createElement('th');
heading_2.innerHTML = "Accounts";
let heading_3 = document.createElement('th');
heading_3.innerHTML = "Contacts";
let heading_4 = document.createElement('th');
heading_4.innerHTML = "Failures";

row_1.appendChild(heading_1);
row_1.appendChild(heading_2);
row_1.appendChild(heading_3);
row_1.appendChild(heading_4);
thead.appendChild(row_1);


async function add_counters_to_table() {
	let counters = await LS.getItem("Counters")
	console.log(counters)
	if(counters) {
		for (let i=0; i < counters.length; i++) {
			// Creating and adding data to second row of the table
			let row_2 = document.createElement('tr');
			let row_2_data_1 = document.createElement('td');
			row_2_data_1.innerHTML = counters[i].index;
			let row_2_data_2 = document.createElement('td');
			row_2_data_2.innerHTML = counters[i].accounts;
			let row_2_data_3 = document.createElement('td');
			row_2_data_3.innerHTML = counters[i].contacts;
			let row_2_data_4 = document.createElement('td');
			row_2_data_4.innerHTML = counters[i].failures;

			row_2.appendChild(row_2_data_1);
			row_2.appendChild(row_2_data_2);
			row_2.appendChild(row_2_data_3);
			row_2.appendChild(row_2_data_4);
			tbody.appendChild(row_2);
		}
	}
}
add_counters_to_table()

// Saves options to chrome.storage
function save_options(_name, _regkey, _userid, _li_user, _li_pwd, _li_member_id, _site_url) {
    chrome.storage.local.set({
        ce_reg_key: _regkey,
		name: _name,
		user_id: _userid,
		li_user: _li_user,
		li_pwd: _li_pwd,
		li_member_id: _li_member_id,
		site_url: _site_url
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Successfully identified.';
        setTimeout(function () {
            status.textContent = '';
			restore_options();
        }, 2000);
    });
}
function logout() {
console.log("logout()");
	chrome.storage.local.set({
        ce_reg_key: null
    }, function () {
		restore_options();
	});
}
// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.local.get(["ce_reg_key", "user_email", "name"],async function (item) {
		document.getElementById('campaign_ID').value = await LS.getItem("list_code")
		let ologin = document.getElementById("login");
		let ostatus = document.getElementById('status');
		let rkey = document.getElementById("regkey");
		if(item) {
			if(item.user_email) {
				document.getElementById("email").value = item.user_email;
			}
			if(!item.ce_reg_key) {
				ologin.setAttribute("style", "display:block");
				rkey.setAttribute("style", "display: none");
				ostatus.textContent = "Identify your CE using your email address and password";
			}
			else {
				ologin.setAttribute("style", "display:none");
				rkey.innerHTML = '<div class="space-evenly-flex flex-wrap"><div class="left" style="width:80%">Hi ' + item.name + '<br/><label>Reg Key: </label>' + item.ce_reg_key + '</div>' +
							'<div class="right" style="width:20%"><img id="logout" style="cursor: pointer;width:15px;" src="../images/logout.png"/></div></div>';
				rkey.setAttribute("style", "display: block");
				ostatus.textContent = "Ohh mama .. we are rolling!";
				const btn = document.getElementById("logout").addEventListener('click',logout);
			}
		}
		else {
			ologin.setAttribute("style", "display:block");
			rkey.setAttribute("style", "display: none");
		}
    });
}
async function save_credentials(cemail) {
	chrome.storage.local.set({
        user_email: cemail
    }, function () {
		return;
	});
}
async function login() {
	let cemail = document.getElementById("email").value;
	let cpwd = document.getElementById("upwd").value;
	save_credentials(cemail);
	
    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_ce_login);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200 && xhr.response == "") {
				console.log("API response is empty, No New Email Campaign to Send");
				alert("API response is empty, No New Email Campaign to Send");
			} 
			else if (this.status === 200 && xhr.response) {
				let obj = JSON.parse(xhr.response);

				let promis = new Promise((res, rej) => {
					if (obj.length > 0) {
						save_options(obj[0].full_name, 
									 obj[0].reg_key,
									 obj[0].user_id,
									 obj[0].li_user,
									 obj[0].li_pwd,
									 obj[0].li_member_id,
									 obj[0].site_url
									 );
					}
					res();
				});
				setTimeout(() => {
					chrome.runtime.sendMessage({message: "Logged In, Start Automation Now!"})
				}, 700);
			}
			else {
				alert("ERROR");
			}
        }
		
    };
    xhr.send(JSON.stringify({"useremail": cemail, "userpwd": cpwd}));
}

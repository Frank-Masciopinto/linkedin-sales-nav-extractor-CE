document.addEventListener('DOMContentLoaded', restore_options());
document.getElementById('save').addEventListener('click', save_options);

// Saves options to chrome.storage
function save_options() {
    var regkey = document.getElementById('regkey').value;
    chrome.storage.sync.set({
        ce_reg_key: regkey
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
			
        }, 2000);
    });
}
// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value autotoggle = false and rdayslimit = 2.
    chrome.storage.sync.get("ce_reg_key", function (item) {
		if(item) {
			document.getElementById('regkey').value = item.ce_reg_key;
		}
    });
	function getitemval(oitem) {
		if(typeof(oitem)==="object" ) {
			let rethtml="";
			for(oi in oitem) {
				rethtml += (rethtml!="" ? "<br/>" : "") + oitem[oi];
			}
			return rethtml;
		}
		else {
			return oitem;
		}
	};
	chrome.storage.local.get(null, function(items) {
		let htmlcode="";
		for(item in items) {
			htmlcode += "<div class=\"space-evenly-flex flex-wrap\">" +
							"<div class=\"left\" style=\"width:30%;vertical-align:top;color:#F67C07;\">" + item + "</div>" +
							"<div class=\"right;flex-wrap\" style=\"vertical-align:top;text-align:left;width:70%;\">" + getitemval(items[item]) + "</div>" +
						"</div>";
		}
		if(htmlcode!="") {
			document.getElementById("localdata").innerHTML = htmlcode;
		}
	});
}
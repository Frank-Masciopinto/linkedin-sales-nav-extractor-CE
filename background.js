let LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
let linked_url = "https://www.linkedin.com";
let api_URL_Company = "https://api.bextra.io/account/insert";
let api_URL_Contact = "https://api.bextra.io/account/insert_contacts";
let api_ERROR_URL = "https://api.bextra.io/error/report";
let api_get_next_company = "https://api.bextra.io/ce/get_next_account_to_research";
let api_URL_account_has_been_researched = "https://api.bextra.io/account/researched";
let api_APPID_URL = "";
let job_experience_array_new_url;
let automation_extraction_completed = false;
let is_Automation = false;
let process_is_active = false;
let order_index = 1;
let set_back_for_awhile = 1;
let Message_Connect;
let Company_Name;

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason == "install") {
        let today_counter = {
            index: 0,
            accounts: 0,
            contacts: 0,
            failures: 0
        }
        let today_Date = new Date()
        //get_linkedin_login()     // Login into linkedin should be done only after getting the campaign
		await LS.setItem("number_of_pages_to_scroll", 5);
		await LS.setItem("Counters_last_date_checked", today_Date.toString());
		await LS.setItem("Counters", [today_counter]);
		await LS.setItem("memory_auto_list_manual", "OFF");
		await LS.setItem("AutoLIST-ON-OFF-TOGGLE-Position", "OFF");
		await LS.setItem("list_code", "");
    }
});
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.message === "fetch_phone") {  //called from content.js and content_sales_navigator.js
        let fetched_info = await get_Website_email(request.payload.Company_Domain)
        is_Automation = true;
        request.payload.Extra_phones = fetched_info.Phone
        request.payload.Email = fetched_info.Email
        request.payload.Company_Facebook = fetched_info.facebook
        request.payload.Company_Instagram = fetched_info.instagram
        request.payload.Company_Twitter = fetched_info.twitter
        await LS.setItem("linkedin_correct_URL", request.payload.LinkedIn_page)
        await call_API_fetch(request.payload, "Company")
        return true;
    }
})

//Check how many days have passed for leads counter
async function counter_daily_check() {
    let counters = await LS.getItem("Counters");
	let counterindex = (counters ? counters[counters.length - 1].index + 1 : 0);
    let today_counter = {
        index: counterindex,
        accounts: 0,
        contacts: 0,
        failures: 0
    }
    let last_date_checked = new Date(await LS.getItem("Counters_last_date_checked"));
    let oneDay = 86400000;
    let today_Date = new Date();
    let days_Passed_Since_last_check = Math.round(Math.abs((today_Date - last_date_checked) / oneDay));
    //If 1 days passed since last check, add new today counter
    if (days_Passed_Since_last_check > 0) {
        counters.push(today_counter);
        await LS.setItem("Counters_last_date_checked", today_Date.toString());
        await LS.setItem("Counters", counters);
    }
    //Delete oldest counter record if more than 7 counters
    if (counters && counters.length > 7) {
        counters.shift();
    }
}
setTimeout(() => {
    counter_daily_check();
}, 250);


//When change tab
/*****************************************************************************************************/
/**	We should inject JS only to a single working tab and not to any linkedin tab 					**/
/*****************************************************************************************************/
chrome.tabs.onActivated.addListener(tab => {
    //Check if Linkedin is in the url
    chrome.tabs.get(tab.tabId, function (tab) {
        if (chrome.runtime.lastError) {
            console.log("Inside runtime error");
        } else {
            setTimeout(() => {
                inject_Js(tab.url, tab.id);
            }, 300);
        }
    });
    function inject_Js(link, tabId) {
        if (link.includes("chrome://") || link.includes("developer.chrome.com") || link.includes("chrome-extension://") || link.includes("chrome-error://") || link.includes("chrome.google.com/webstore") || link.includes("about:") || link.includes("addons.mozilla.org") || link.includes("moz-extension://")) {
        } 
        else if (link.includes("linkedin.com/sales/")) {
            check_than_Insert_JS("content_sales_Navigator.js", "linkedin.css", tabId)
        } 
    }
});

//On Every new tab Update
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
        inject_javas();
    }
    function inject_javas() {
        //Check if Linkedin is in the url
        chrome.tabs.get(tabId, function (tab) {
            if (chrome.runtime.lastError) {
                console.log("Inside runtime error");
            } else {
                try {
                    inject_Js(tab.url, tab.id);
                } catch {
                    console.log("Inside tab is  undefined");
                }
            }
        })

        async function inject_Js(link, tabId) {
            if (link.includes("chrome://") || link.includes("chrome-extension://") || link.includes("developer.chrome.com") || link.includes("chrome.google.com/webstore") || link.includes("about:") || link.includes("addons.mozilla.org") || link.includes("moz-extension://")) {
            } 
			else if (link.includes("linkedin.com/sales/")) {
                if (await LS.getItem("Last Extracted") != link) {
                    await LS.setItem("Last Extracted", link);
                    await LS.setItem("tab_Injected", tabId);
                    await LS.setItem("inject_next", "true");
                    check_than_Insert_JS("content_sales_Navigator.js", "linkedin.css", tabId)
                }
				else if (await LS.getItem("inject_next") == "true") {
                    await LS.setItem("inject_next", "false");
                    check_than_Insert_JS("content_sales_Navigator.js", "linkedin.css", tabId)
                }
            }
        }
    }
});

//Logging Error to API
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function call_API_ERROR(error_message, line_number) {
    var xhr = new XMLHttpRequest();
    let api_URL;
    if (error_message == "send_app_id") {
        api_URL = api_APPID_URL
    } else {
        api_URL = api_ERROR_URL;
    }
    xhr.open("POST", api_URL);

    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            //If error response
            if (xhr.status.toString().substring(0, 1) != "2") {
                alert(`API CALL ERROR - Response: \n\n ${xhr.response}`)
            }
            //If got a valid response
            else {
                console.log("Error Submitted")
            }
        }
    };
    let api_message;
    if (error_message == "send_app_id") {
        api_message = {
            "appid": chrome.runtime.id
        }

    } else {
        api_message = {
            "product": "Bexten",
            "error_message": error_message,
            "function_name": "Row number " + line_number
        }
    }
    xhr.send(JSON.stringify(api_message));
}
// function to insert scripts by checking if they are already injected first
function check_than_Insert_JS(js_File_Name, css_File_Name, tabId) {
    let content_Message = "are_you_there_content_script?";
		chrome.tabs.sendMessage(tabId, {
			message: content_Message
		}, function (msg) {
			msg = msg || {};
			if (chrome.runtime.lastError) {
                setTimeout(() => {
                    console.log("Inside runtime error, NO SCRIPT IS THERE! ------+++++ new function---> " + js_File_Name);
                }, 700);
			} 
            else if (msg.status != 'yes') {
			} 
            else {
                chrome.tabs.sendMessage(tabId, {
                    message: "Tab_Updated"
                })
			}
		});
}

async function scrape_company_About_and_employees_AUTO(company_url) {
        let keywords = await LS.getItem("Keywords")
        let company_name = company_url.replace(/(https\:\/\/)(\w+)\.linkedin\.com\/company\//i, '').replace(/\//i, '')
        let result_Company_Extraction = await extract_Next_Company_Lead(company_url)
        Company_Name = company_name
        if (result_Company_Extraction == "Fetched") { //update popup counters if fetched
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'Images/128.png',
                title: "Scraped '" + company_name + "' data",
                message: "Done",
                priority: 1
            })
            chrome.runtime.sendMessage({
                message: "Update-Company-Counter"
            })
        }
        //Extract all employees from 1st keyword
        if (keywords != null) {
            let keywords_array = JSON.parse(keywords)
                if (keywords_array[0].key != null) {
                    let key_length = keywords_array.length
                        for (i = 0; i < key_length; i++) {
                            if (keywords_array[i].send_connect_request == true) {
                                Message_Connect = keywords_array[i].msg_template[0].body
                            } else {
                                Message_Connect = null
                            }
                            chrome.notifications.create({
                                type: 'basic',
                                iconUrl: 'Images/128.png',
                                title: "Getting '" + keywords_array[i].key + "' Employees",
                                message: company_name,
                                priority: 1
                            })
                            await extract_All_Employees_from_Each_Keyword(company_url, keywords_array[i].key, result_Company_Extraction)
                        }
                } else {
                    alert("You Dont have any keywords saved for employees extraction. Update Campaign ID.")
                }
        } else {
            console.log("No Keywords Fetched for your Campaign ID!")
        }
}

async function get_Website_email(domain) {
    return new Promise ((res, rej) => {
        let set_emails = new Set;
        let phone_confirmed = new Set;
        let title;
        let company_Facebook;
        let company_Twitter;
        let company_Instagram;
        if (domain != "null") {
        
            const fetch_Response = fetch(domain)
			.then(function(response) {
                return response.text()})
			.then((txt) => {  
                    let contact_Page_full;
                    try {
                        title = txt.match(/(?<=\<title\>).*?(?=\<)/)[0]
                    }
                    catch {}
                    try {
                        company_Facebook = txt.match(/(?<=href=")https\:\/\/(www.||)facebook.com.*?(?=\")/)[0]
                    } catch {
                        company_Facebook = "Null"
                    }
                    try {
                        company_Twitter = txt.match(/(?<=href=")https\:\/\/(www.||)twitter.com.*?(?=\")/)[0]
                    } catch {
                        company_Twitter = "Null"
                    }
                    try {
                        company_Instagram = txt.match(/(?<=href=")https\:\/\/(www.||)instagram.com.*?(?=\")/)[0]
                    } catch {
                        company_Instagram = "Null"
                    }
                    //defining Contact Page
                    try {
                        let contact_page_href_list = txt.match(/href=(["'])(?:(?=(\\?))\2.)*(contatti|contact|contacts)\1/ig)
                        let contact_Page = contact_page_href_list[0].match(/(?<=href=").*(?=")/)[0]
                        if (!contact_Page.includes("http")) {
                            if (contact_Page.charAt(0) != "/") {
                                contact_Page = "/" + contact_Page
                            }
                            if (domain.slice(-1) != "/") {
                                contact_Page_full = domain + contact_Page
                            }
                            else {
                                contact_Page_full = domain + contact_Page.substring(1, contact_Page.length)
                            }
                        }
                        else {
                            contact_Page_full = contact_Page
                        }
                    }
                    catch{contact_Page_full = null}
    
                    let listOfEmails = txt.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+(\.it|\.biz|\.com|\.net|\.co\.uk|\.fr|\.com\.br|\.de|\.es|\.nl|\.com\.au|\.in|\.ca|\.ru|\.co\.jp|\.be|\.be|\.com\.mx|\.co\.id|\.com\.sg|\.ch|\.net\.au)+/gi);
                    if (listOfEmails !== null){
                        listOfEmails.forEach(function(email){
                            if (email == ".@.null" || email.includes("sentry-next.") || email.includes("example.com") || email.includes("youremail") || email.includes("name@")) {}
                            else {set_emails.add(email)}
                        })
                        list_of_emails = Array.from(set_emails)
                    }
                    else {
                        list_of_emails = null
                    }
                    phone_n = txt.match(/href=(["'])tel:(?:(?=(\\?))\2.)*\1+/gi)
                    if (phone_n != null){
                        for (let i=0; i<phone_n.length; i++) {
                            phone_confirmed.add(phone_n[i].match(/(?<=href="tel:).*?(?=\")/g)[0])
                        }
                    }
                    else {
                        phone_confirmed = null
                    }
                    // If list of emails is null open contact page
                    if (listOfEmails == null) {
                        const fetch_Response_Contact_Page = fetch(contact_Page_full)
						.then(function(response) {
                            return response.text()}).then((txt) => {
                                let listOfEmails = txt.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+(\.it|\.biz|\.com|\.net|\.co\.uk|\.fr|\.com\.br|\.de|\.es|\.nl|\.com\.au|\.in|\.ca|\.ru|\.co\.jp|\.be|\.be|\.com\.mx|\.co\.id|\.com\.sg|\.ch|\.net\.au)+/gi);
                                if (listOfEmails !== null){
                                    listOfEmails.forEach(function(email){
                                        if (email == ".@.null" || email.includes("sentry-next.") || email.includes("example.com") || email.includes("youremail") || email.includes("name@")) {}
                                        else {set_emails.add(email)}
                                    })
                                    list_of_emails = Array.from(set_emails)
                                    phone_n = txt.match(/href=(["'])tel:(?:(?=(\\?))\2.)*\1+/gi)
                                    if (phone_n != null){
                                        for (let i=0; i<phone_n.length; i++) {
                                            phone_confirmed.add(phone_n[i].match(/(?<=href="tel:).*?(?=\")/g)[0].replace(";", "; "))
                                        }
                                    }
                                    else {}
                                    let all_phones;
                                    if (all_phones != null) {
                                        all_phones = Array.from(phone_confirmed)
                                    }
                                    else {
                                        all_phones = "N/A"
                                    }
                                    res({phones: all_phones, emails: list_of_emails, instagram: company_Instagram, facebook: company_Facebook, twitter: company_Twitter})

                                }
                                else {
                                    list_of_emails = null
                                    res({phones: "N/A", emails: "N/A", instagram: company_Instagram, facebook: company_Facebook, twitter: company_Twitter})
                                }
                                    
                                }).catch((error) => console.log(error), res({phones: "N/A", emails: "N/A", instagram: company_Instagram, facebook: company_Facebook, twitter: company_Twitter})
                                )
                                .then((value) => {
                                    console.log(value)
                                })
                    }
                    else {
                        let all_phones;
                        if (phone_confirmed != null) {
                            all_phones = Array.from(phone_confirmed)
                        }
                        else {
                            all_phones = null
                        }
                        res({phones: all_phones, emails: list_of_emails, instagram: company_Instagram, facebook: company_Facebook, twitter: company_Twitter})

                    }
			})
			.catch(function(error) {
				res({phones: "N/A", emails: "N/A"})
				console.log(error)})
        }
        else {
            res({phones: "N/A", emails: "N/A", instagram: company_Instagram, facebook: company_Facebook, twitter: company_Twitter})
        }
    })
}

async function call_API_fetch(record, company_Or_Contact) {
    return new Promise(async (res, rej) => {
        //defining right url API
        if (company_Or_Contact == "Company") {
            api_url = api_URL_Company + '/' + await LS.getItem("user_id") + '/' + await LS.getItem("list_code");
        } 
        else if (company_Or_Contact == "Contact-Enrichment") {
            api_url = api_URL_Contact + '/' + await LS.getItem("user_id") + '/' + await LS.getItem("list_code")
        } 
        else {
            api_url = api_URL_Contact + '/' + await LS.getItem("user_id") + '/' + await LS.getItem("list_code")
        }
        //Defining API message
        let api_message;
        function check_NaN(val) {
            if (parseInt(val) != parseInt(val)) {
                return 0;
            }
            return parseInt(val);
        }
        if (company_Or_Contact == "Company") {
            api_message = {
                "account_id": record.account_id,
                "name": record.Name,
                "description": record.Description,
                "industry": record.Industry,
                "company_domain": record.Company_Domain,
                "company_size": check_NaN(String(record.Company_size).replace(',', '')),
                "year_founded": record.Year_founded,
                "linkedin_page": record.LinkedIn_page,
                "followers": record.Followers,
                "phone": record.Phone,
                "email": record.Email,
                "logo_filelink": record.Logo,
                "source": "linkedin",
                "ce_reg_key": await LS.getItem("ce_reg_key"),
                "facebookpage": record.Company_Facebook,
                "instagrampage": record.Company_Instagram,
                "twitterpage": record.Company_Twitter,
                "linkedin_id": record.company_id,
                "address": [{
                        "full_address": record.Address,
                        "addresstype": ""
                    }
                ]
            }
        } 
        else {
            api_message = [
                record
            ]
        }
    console.log("api_message", JSON.stringify(api_message));
        await fetch(api_url, {
            // Adding method type
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(api_message)
        })
        .then((response) => {
    //        console.log(JSON.stringify(api_message))
            return response})
        .then(async (json) => {
            job_experience_array_new_url = null
            if (is_Automation == true) {
                is_Automation = false
                automation_extraction_completed = true
            }
            await LS.setItem("email_found", null)
            await LS.setItem("company_ID", null)
            let counters = await LS.getItem("Counters")
            if (json.status != 200) {//If error, add it to failures
                counters[counters.length - 1].failures++
                await LS.setItem("Counters", counters);
            }
            else {
                if (company_Or_Contact == "Company") {
                    counters[counters.length - 1].accounts++
                    await LS.setItem("Counters", counters);
                }
                else {
                    counters[counters.length - 1].contacts++
                    await LS.setItem("Counters", counters);
                }
            }
            res()
        })
        .catch((error) => {
          console.log("call_API_fetch(record, company_Or_Contact)", error);
          res()
        });
    })
}

async function extract_company_info() {
    return new Promise((res, rej) => {
        let check_if_extension_is_stucked = 0
        let wait_for_extraction_completed = setInterval(() => {
            if (automation_extraction_completed == true) {
                clearInterval(wait_for_extraction_completed);
                automation_extraction_completed = false;
                res()
            }
            else if (automation_extraction_completed == "404") {
                res("404")
            }
            else if (check_if_extension_is_stucked > 30) {
                res("EXTENSION_STUCKED")
            }
            else {
                check_if_extension_is_stucked++
            }
        }, 2000);
    })
}

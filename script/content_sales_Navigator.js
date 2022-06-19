let adding_buttons_called = false;
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log("onMessage ==> ", request);
    if (request.message == "Tab_Updated") {
        tab_updated();
        console.lof(adding_buttons_called)
    }
    else if (request.message === 'are_you_there_content_script?') {
        if (adding_buttons_called == true) {
            sendResponse({
                status: "no"
            });
        }
        else {
            sendResponse({
                status: "yes"
            });
        }
    }
})

async function extract_Contact_Information(all_leads) {
    let connect_Message;
    let send_message_bool;
    let connect_Company_Name
    if (all_leads == "Autolist-Contact") {
        chrome.runtime.sendMessage({message: "Connect?"}, function (response) {
            if (response.answer == false) {
                connect_Message = null
                send_message_bool = false
            }
            else {
                    connect_Message = response.answer
                    connect_Company_Name = response.company_Name
                    send_message_bool = true
            }
        })
    }
    else {
        //If manually visiting the contact page, dont connect automatically
        connect_Message = null
        send_message_bool = false
    }
    let wait_time_human_simulation;
    let first_Name;
    let last_name;
    let picture_url;
    let linkedin_page;
    let headline;
    let languages = [];
    let current;
    let job_title;
    let start_date;
    let end_date;
    let company_linkedin_page;
    let company_name;
    let company_logo_url;
    let work_full_address;
    let person_full_Address
    let experience = []; 
    let number_of_Job_Positions_in_Company = [];

    
    let full_Name = document.querySelector('[data-anonymize="person-name"]').innerText
    try {
        var lastIndex = full_Name.lastIndexOf(" ");
        first_Name = full_Name.substring(0, lastIndex);
        last_name = full_Name.split(" ").pop();
    } catch {
        first_Name = full_Name
    }
    try {
        picture_url = document.querySelector('[data-anonymize="headshot-photo"]').src
    } catch {
        picture_url = null
    }
    //Getting linkedin URL
    let all_codes = document.querySelectorAll("code")
    for (let i=0; i<all_codes.length; i++) {
        if (all_codes[i].innerText.length > 5000) {
            console.log(all_codes[i].innerText.match("https://www.linkedin.com/in/.*?(?=\")")[0])
            linkedin_page = all_codes[i].innerText.match("(?<=flagshipProfileUrl\"\:\").*?(?=\")")[0]
        }
    }

    //ADDRESS
    try {
        person_full_Address = document.querySelector('[data-anonymize="location"]').innerText
    } 
    catch {
        person_full_Address = null
    }

    //ABOUT
    try {
        headline = document.querySelector('[data-anonymize="headline"]').innerText
        if (!headline) {
            headline = document.querySelector('[data-anonymize="person-blurb"]').innerText
        }
    } catch {
        headline = null
    }

    //LANGUAGES
    try {
        let accomplishment_titles_container =  document.getElementById("profile-accomplishments").querySelectorAll("h3.accomplishments-panel__title")
        for (let i = 0; i < accomplishment_titles_container.length; i++) {
            if (accomplishment_titles_container[i].innerText == "Languages" || accomplishment_titles_container[i].innerText == "Language") {
                let all_languages_li = accomplishment_titles_container[i].parentElement.querySelectorAll("li")
                for (let i=0; i< all_languages_li.length; i++) {
                    languages.push(all_languages_li[i].innerText)
                }
            }
        }
    } catch {
        languages = null
    }

    async function check_If_Experience_Exist() {
        console.log("CHECKING IF EXPERIENCE EXIST")
        return new Promise ((res, rej) => {
            let exp_section_obj = document.querySelector("section#profile-positions");
			if (exp_section_obj != null) {
                res(exp_section_obj)
            }
            else {
                res(null)
            }
        })
    }

    //EXPERIENCE
	//then ..
    let all_work_Experience_Containers;
    let experience_Container = await check_If_Experience_Exist()
    console.log(experience_Container)
    //If experience container exist, fetch all work container
    if (experience_Container != null) {
        console.log("---***FETCHING EXPERIENCES----***")
        all_work_Experience_Containers = experience_Container.querySelectorAll('[data-test-profile-position]')
        iteration()
    }
    else {}
    
    
    async function iteration() {
        for (let i = 0; i < all_work_Experience_Containers.length; i++) {
            //Sales navigator have only single job position
            const data = await fetch_single_work(all_work_Experience_Containers[i])
            
        }
    }
    function clean_json_for_position(company_name, company_LI, company_logo, job_title, current, start_date, 
        end_date, address, description) {
            let position = {
                "company_linkedin_page": company_LI,
                "company_name": company_name,
                "company_logo_url": company_logo,
                "description": description,
                "job_title": job_title,
                "current": current,
                "start_date": start_date,
                "end_date": end_date,
                "full_address": address
            }
            for (key in position) {
                if (position[key] == null) {
                    delete position[key]
                }
            }
            return position;
        }
    
    async function fetch_single_work(single_pos_obj) {
        let job_Positions = [];
        let s_current;
        let s_job_title;
        let s_start_date;
        let s_end_date;
        let s_company_linkedin_page;
        let s_company_name;
        let s_company_logo_url;
        let s_work_full_address;     
        let s_description;  
        
     return new Promise((res, rej) => {
                let single_work_header = single_pos_obj.querySelector("a[data-control-name='background_details_company']")
                if (single_work_header == null) {
                    single_work_header = single_pos_obj.querySelector("a[href^='/search/results/all/']")
                }
                try {
                    s_work_full_address = single_pos_obj.querySelector('[data-anonymize="location"]').innerText.replace("Location\n", "")
                }
                catch {
                    s_work_full_address = null
                }
                try {
                    let work_Dates_Array = single_pos_obj.querySelector("p.profile-position__dates-employed").innerText.replace("Dates Employed\n", "").split("–")
                    s_start_date = work_Dates_Array[0]
                    s_end_date = work_Dates_Array[1]
                    if (work_Dates_Array[1] == "Present") {
                        s_current = true
                    } else {
                        s_current = false
                    }
                }    
                catch {
                    s_start_date = null
                    s_end_date = null
                    s_current = false
                }
                try {
                    s_job_title = single_pos_obj.querySelector('[data-anonymize="job-title"]').innerText
                }
                catch {
                    s_job_title = null
                }

                
                try {
                    s_company_linkedin_page = single_pos_obj.querySelector("a").href
                } catch {
                    s_company_linkedin_page = null
                }
                try {
                    s_description = single_pos_obj.querySelector('[data-anonymize="person-blurb"]').innerText.replace("Description\n", "")
                    if (s_description == "Description") {
                        s_description = null
                    }
                } catch {
                    s_description = null
                }
                try {
                    s_company_logo_url = single_pos_obj.querySelector("img").src
                } catch {
                    s_company_logo_url = null
                }

                try {
                    s_company_name = single_pos_obj.querySelector('[data-anonymize="company-name"]').innerText
                } catch {
                    s_company_name = null
                }
                experience.push(clean_json_for_position(s_company_name, s_company_linkedin_page, 
                    s_company_logo_url, s_job_title, s_current, s_start_date, 
                    s_end_date, s_work_full_address, s_description))

                res()
    })
    }
    
    if (connect_Message != undefined || connect_Message != null){
        // Replace Name / Last Name / Company for connect message if any
        connect_Message = connect_Message.replace("{{contact.first_name}}", first_Name)
        connect_Message = connect_Message.replace("{{contact.last_name}} ", last_name)
        connect_Message = connect_Message.replace("{{contact.company.name}}", connect_Company_Name)
    }

    let is_email = null
    
    setTimeout(function() { 
        
        let user_record = {
            "first_name": first_Name,
            "last_name": last_name,
            "email": is_email,
            "msg_template": {connect_Message},
            "picture_url": picture_url,
            "send_connect_request": send_message_bool,
            "linkedin_page": linkedin_page,
            "full_address": person_full_Address,
            "Headline": headline,
            "languages": languages,
            "experience": experience
        }
        console.log(user_record)
        if (all_leads == "false") {
            chrome.runtime.sendMessage({
                message: "call_API_Contact",
                payload: user_record
            })
        } 
        // else if (all_leads == "true") {
        //     chrome.runtime.sendMessage({
        //         message: "call_API_Contact_extract_Next_Lead",
        //         contact_info: user_record,
        //     })
        //     try {
        //         document.querySelector("a[href$='contact-info/']").click()
        //     }
        //     catch {}
        //     setTimeout(function() { 
        //         window.close() 
        //     }, 900);
        // }
        // else if (all_leads == "Autolist-Contact") {
        //     wait_time_human_simulation = getRandomInt(7) * 1000
        //     if (connect_Message != false){
        //         let connect_Promise = new Promise((res, rej) => {
        //             // Connect Blue Button does exist
        //             if (document.querySelector('[id="main"]').querySelector('[aria-label^="Invite"]') != null) {
        //                 console.log("Inside Blue Connect Button")
        //                 //Connect thru menu
        //                 document.querySelector('[id="main"]').querySelector('[aria-label^="Invite"]').click()
        //                 setTimeout(() => {
        //                     document.querySelector('[aria-label^="Add a note"]').click()
        //                 },1000)
        //                 setTimeout(() => {
        //                     document.querySelector('[name="message"]').value = connect_Message
        //                     document.querySelector('[aria-label="Send now"]').disabled = false
        //                     document.querySelector('[aria-label="Send now"]').click()
        //                     res()
        //                 },1500)
        //             }
        //             // If blue button does not exist, try menu 3 dots
        //             else if (document.querySelector('[type="connect-icon"]') != null) {
        //                 console.log("Inside 3 dots menu for Connect")
        //                 //Connect thru menu
        //                 document.querySelector('[type="connect-icon"]').click()
        //                 setTimeout(() => {
		// 					if (document.querySelector('[aria-label^="Add a note"]') != null ) {
		// 						document.querySelector('[aria-label^="Add a note"]').click();
		// 					}
        //                 },1000)
        //                 setTimeout(() => {
        //                     document.querySelector('[name="message"]').value = connect_Message
        //                     document.querySelector('[aria-label="Send now"]').disabled = false
        //                     document.querySelector('[aria-label="Send now"]').click()
        //                 },1500)
        //                 //Click connect
        //                 document.querySelector('[aria-label="Connect"]').click()
        //                 res()
        //             }
        //             else {res()}
        //         }).then((res) => {
        //             chrome.runtime.sendMessage({
        //                 message: "new_AUTO_Contact_Info_Fetched",
        //                 contact_info: user_record,
        //             })
        //             document.querySelector("a[href$='contact-info/']").click()
        //             setTimeout(function() { 
        //                 setTimeout(function() { 
        //                     window.close() 
        //                 }, 900);
        //             }, wait_time_human_simulation);
        //             })
        //         }
        //     else {
        //         setTimeout(() => {
        //             chrome.runtime.sendMessage({
        //                 message: "new_AUTO_Contact_Info_Fetched",
        //                 contact_info: user_record,
        //             })
        //             try {
        //                 document.querySelector("a[href$='contact-info/']").click()
        //             }
        //             catch {}
        //             setTimeout(function() { 
        //                 window.close() 
        //             }, 900);
        //         }, wait_time_human_simulation)
        //     }
        // }
        
        // else if (all_leads == "one") {
        //     chrome.runtime.sendMessage({
        //         message: "call_API_Contact",
        //         payload: user_record,
        //     })
        //     try {
        //         document.querySelector("a[href$='contact-info/']").click()
        //     }
        //     catch {}
        //     setTimeout(function() { 
        //         window.close() 
        //     }, 900);
        // }
    }, 1500);
}

async function extract_Company_Information() {
    let wait_time_human_simulation;
    console.log("EXTRACTING COMPANY INFO")
    let dom_txt = document.body.textContent
    let company_name;
    let overview;
    let industry;
    let website;
    let company_followers;
    let company_Linkedin_Url;
    let company_Logo;
    let company_Headquarter;
    let company_Founded;
    let company_Size;
    let company_Phone;
    let company_Street_Address = [];
    let check_name;
    await click(document.querySelector('[aria-label="Open dropdown menu for more account actions"]'))
    await click(document.querySelector('[data-control-name="open_account_details"]'))
    let no_value = "null"
    try {
        company_name = document.querySelector('[data-anonymize="company-name"]').innerText
    } 
    catch {
    company_name = no_value
    }
    try {
        overview = document.querySelector('[data-anonymize="company-blurb"]').innerText
    } catch {
        overview = no_value
    }
    try {
        industry = document.querySelectorAll('[data-anonymize="industry"]')[0].innerText
    } catch {
        industry = no_value
    }
    try {
        company_Street_Address.push(document.querySelector('[data-anonymize="address"]').innerText)
    } 
    catch {}
    company_Phone = no_value

    try {
        company_Headquarter = document.querySelector('[data-anonymize="location"]').innerText}
    catch{}
    try {
        website = document.querySelector('[data-anonymize="url"]').innerText}
    catch {}
    let all_containers = document.querySelectorAll("dt.company-details-panel__subtitle")
    for (let i=0; i<all_containers.length; i++) {
        if (all_containers[i].innerText == "Founded") {
            company_Founded = all_containers[i].nextElementSibling.innerText
        }
    }       
    try {
        company_Headquarter = document.querySelector('[data-anonymize="address"]').innerText}
    catch {}     


    try {
        company_Size = document.querySelector(".employee-count").firstElementChild.innerText} 
    catch {}
    let all_codes = document.querySelectorAll("code")
    for (let i=0; i<all_codes.length; i++) {
        if (all_codes[i].innerText.length > 5000) {
            company_Linkedin_Url = all_codes[i].innerText.match("(?<=flagshipCompanyUrl\"\:\").*?(?=\")")[0]
        }
    }
    try {
        company_Logo = document.querySelector('img[data-anonymize="company-logo"]').src}
    catch {}

    let record = {
        "Name": company_name,
        "Description": overview,
        "Industry": industry,
        "Company_Domain": website,
        "Company_size": company_Size,
        "Address": company_Headquarter,
        "Year_founded": company_Founded,
        "LinkedIn_page": company_Linkedin_Url,
        "Followers": company_followers,
        "Phone": company_Phone,
        "Email": no_value,
        "Company_Facebook": no_value,
        "Company_Instagram": no_value,
        "Company_Twitter": no_value,
        "Logo": company_Logo,
        "Company_Street_Address": company_Street_Address
    }
    console.log(record["LinkedIn_page"])
    dom_txt = ""
    if (window.name == "autoCompany") {
        wait_time_human_simulation = getRandomInt(7) * 1000
        console.log(wait_time_human_simulation)
        setTimeout(() => {
            chrome.runtime.sendMessage({
                message: "AUTOLIST_COMPANY_fetch_phone",
                payload: record
            })
        window.close()
        }, wait_time_human_simulation)
    }
    else {
        chrome.runtime.sendMessage({
            message: "fetch_phone",
            payload: record
        })
        window.close()
    }
    adding_buttons_called = false
}

async function click(btn) {
    return new Promise((res, rej) => {
        console.log("Clicking..")
        console.log(btn)
        btn.scrollIntoView()
        btn.click()
        btn.dispatchEvent(new MouseEvent('mousedown', { 'bubbles': true }))
        btn.dispatchEvent(new MouseEvent('mouseup', { 'bubbles': true }))
        setTimeout(() => {
            res()
        }, 450);
})
}

async function click_see_more_buttons() {
        console.log("INSIDE SEE MORE")
        let job_see_More_btns = document.querySelector("section#profile-positions").querySelectorAll(".artdeco-button__text")
        console.log(job_see_More_btns)
        for (let i = 0; i < job_see_More_btns.length; i++) {
            await click(job_see_More_btns[i])
        }
}

async function add_button(company_div, btn_class) {
    return new Promise((res, rej) => {
        let btn_container = company_div.querySelector("button").parentElement.parentElement
        let new_btn = document.createElement("button")
        new_btn.id = "bpersonal_btn_SN"
        new_btn.className = btn_class
        new_btn.innerText = "Extract"
        new_btn.onclick = function (e) {
            e.preventDefault()
            window.open(company_div.parentElement.parentElement.parentElement.querySelector('[data-anonymize="company-name"]').href, "Sales Nav Extract Company BTN CLICKED", "height=100,width=200", "_blank")
        }

        try {
            btn_container.appendChild(new_btn)
            console.log("Button Added Successfully")
            res("Button Added Successfully")
        }
        catch (e) {
            console.log("Failed to append button")
            console.log(e)
            btn_container = company_div
            console.log(btn_container)
            btn_container.appendChild(new_btn)
            res("Failed")
        }
    })
}

async function add_buttons() {
    console.log("add_buttons()")
    let all_company_results = document.getElementById("search-results-container").querySelectorAll(".save-to-list-dropdown")
    let btn_class = "artdeco-dropdown__trigger artdeco-dropdown__trigger--placement-bottom ember-view artdeco-button artdeco-button--primary"
    for (let i=0; i< all_company_results.length; i++) {
        if (!all_company_results[i].querySelector("#bpersonal_btn_SN")) {
            await add_button(all_company_results[i], btn_class)
            }
        else {
            console.log("button already there")
            console.log(all_company_results[i])
        }
    }
    console.log("Finished function add_buttons")
    adding_buttons_called = false
}

function tab_updated() {
    if ((document.URL.includes("/company/") || document.URL.includes("/school/")) && window.name.includes("Sales Nav Extract Company BTN CLICKED")) {
        console.log("URL includes -> first cond")
        adding_buttons_called = true
        var existCondition = setInterval(function () {
            //wait for loading page
            if (document.querySelector('[aria-label="Open dropdown menu for more account actions"]')) {
                console.log("Page Loaded")
                clearInterval(existCondition);
                document.body.scrollBy({
                    top: 10000,
                    left: 100,
                    behavior: "smooth"
                });
                setTimeout(() => {
                    extract_Company_Information()
                }, 1500);
            }
            //All Contacts LISTED
            else { console.log("*********waiting for page to load before extracting, in loop...**************")
        }
    }, 1000);
}
else if (document.URL.includes("sales/search/company")) {
    console.log("URL includes -> sales/search/company")
    adding_buttons_called = true
    var existCondition = setInterval(function () {
        //wait for loading page
                if (document.querySelector("#search-results-container") && !document.querySelector("#bpersonal_btn_SN")) {
                    console.log("Page Loaded")
                    clearInterval(existCondition);
                    document.querySelector("#search-results-container").scrollBy({
                        top: 10000,
                        left: 100,
                        behavior: "smooth"
                    });
                    setTimeout(() => {
                        document.querySelector("#search-results-container").scrollBy({
                            top: -10000,
                            left: 100,
                            behavior: 'smooth'
                        });
                    }, 1500);
                    setTimeout(() => {
                        add_buttons()
                    }, 3000);
            }
            else if (document.querySelector("#bpersonal_btn_SN")) {
                clearInterval(existCondition);
            }
            //All Contacts LISTED
            else { console.log("*********waiting for page to load before extracting, in loop...**************")
            }
        }, 2000);
    }
}

tab_updated()
console.log("***C. Sales Navigator Injected!")
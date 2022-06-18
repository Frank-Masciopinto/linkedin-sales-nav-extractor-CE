const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
console.log("Bexten Yogesh - Content Script INJECTED!")

let accountid = null;
async function update_LS() {
    await LS.setItem("extracting_automatically_Bool", "false");
}
update_LS()

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log("chrome.runtime.onMessage.addListener((request, sender, sendResponse) ==> ", request);
    if (request.message === 'are_you_there_content_script?') {
        sendResponse({
            status: "yes"
        });
    }
});

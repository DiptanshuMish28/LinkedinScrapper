chrome.action.onClicked.addListener(function () {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                todo: "toggle"
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Message failed: ", chrome.runtime.lastError.message);
                }
            });
        } else {
            console.error("No active tab found.");
        }
    });
});
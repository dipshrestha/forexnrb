function createNotification() {
    var opt = { type: "basic", title: "Foreign Currency Exchange Rate-Nepal Rastra Bank", message: "Thanks for using forexNRB.", iconUrl: "img/icon.png" }
    chrome.notifications.create("notificationName", opt, function () { });

    //include this line if you want to clear the notification after 5 seconds
    setTimeout(function () { chrome.notifications.clear("notificationName", function () { }); }, 10000);
}

// Set up listeners to trigger the first time registration.
chrome.runtime.onInstalled.addListener(createNotification);
//chrome.runtime.onStartup.addListener(createNotification);
function createNotification() {
    var opt = { type: "basic", title: "Foreign Currency Exchange Rate-Nepal Rastra Bank", message: "Thanks for using forexNRB.", iconUrl: "img/icon.png" }
    chrome.notifications.create("notificationName", opt, function () { });
    //include this line if you want to clear the notification after 5 seconds
    setTimeout(function () { chrome.notifications.clear("notificationName", function () { }); }, 10000);

    // for analytics
    var req = new XMLHttpRequest();
    req.open("GET", 'http://www3.clustrmaps.com/stats/maps-no_clusters/nepalesedevelopers.me-thumb.jpg', true);
    req.send(null);
}

// Set up listeners to trigger the first time registration.
chrome.runtime.onInstalled.addListener(createNotification);
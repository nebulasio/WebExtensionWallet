
var s = document.createElement('script');
s.src = chrome.extension.getURL('inpage.js');
//s.textContent = "inpage.js"
var container = document.head||document.documentElement
container.insertBefore(s, container.children[0])
s.onload = function() {s.remove();};


var port = chrome.runtime.connect({name: "contentscript"});
port.postMessage({src: "contentScript",dst:"background"});

port.onMessage.addListener(function(msg) {
    console.log("msg listened: " +JSON.stringify(msg));

    window.postMessage({        //forward msg from background to webpage
        "data":msg
    }, "*");

});

//just for debug, listen to port disconnect event
port.onDisconnect.addListener(function(message) {
    console.log("Port disconnected: " + JSON.stringify(message))
});

/*
chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected ....." + port.name);
    port.onMessage.addListener(function(msg) {
        console.log("msg listened: " + JSON.stringify(msg));
    })

})
*/

//message from background
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");

        window.postMessage({        //forward msg from background to webpage
            "data": request
        }, "*");

    });

// Event listener
window.addEventListener('message', function(e) {
    //if (e.source != window)
    //    return;

    console.log("contentscript.js: received message event:" + ", stringify msg.data: "+JSON.stringify(e.data) );
    //outputObj(e)
    port.postMessage({          //forward msg from webpage to background
        src: "contentScript",
        dst:"background",
        data: e.data })
});


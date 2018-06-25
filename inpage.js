

var webExtensionWallet = "for nebulas";

console.log("webExtensionWallet is defined:" + webExtensionWallet);

var _NasExtWallet = function () {
    this.getUserAddressCallback ;

    this.getUserAddress = function(callback) {
        //console.log("********* get account ************")
        getUserAddressCallback = callback
        window.postMessage({
            "target": "contentscript",
            "data":{},
            "method": "getAccount",
        }, "*");
    }

// listen message from contentscript
    window.addEventListener('message', function(e) {
        // e.detail contains the transferred data (can
        if (e.data.src ==="content" && e.data.dst === "inpage" && !!e.data.data && !!e.data.data.account) {
            userAddrerss = e.data.data.account;
            if(typeof getUserAddressCallback === 'function'){
                getUserAddressCallback(userAddrerss)
            }
        }
    })
}

var NasExtWallet = new _NasExtWallet()




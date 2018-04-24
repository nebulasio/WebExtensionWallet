
//this port communicate with background
var port = chrome.runtime.connect({name: "popup"});
port.postMessage({src: "popup",dst:"background"});
port.onMessage.addListener(function(msg) {
    console.log("msg listened: " +JSON.stringify(msg));
    if (!! msg.unapprovedTxs) {
        var length = msg.unapprovedTxs.length
        if(msg.unapprovedTxs.length > 0) {
            var data = msg.unapprovedTxs[length - 1].data
            console.log("to address: " + data.to + ", mount: " + data.value)
            $(".icon-address.to input").val(data.to);
            $("#amount").val(data.value);
        }else{
            console.log("no more unapprovedTxs")
            $(".icon-address.to input").val('');
            $("#amount").val('');
        }

    }
});

/*
chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected ....." + port.name);
    port.onMessage.addListener(function(msg) {
        console.log("msg listened: " + JSON.stringify(msg));
    })

})
*/

//load stored keyfle info from chrome.storage.local
document.addEventListener("DOMContentLoaded", function() {
    console.log("popout page loaded...")
    chrome.storage.local.get(['keyInfo'], function(result) {
        console.log('keyInfo Value is :' + JSON.stringify(result.keyInfo));
        result = JSON.parse(result.keyInfo)

        if(!!result){
            $(".container select-wallet-file").addClass("active1")
            console.log("unlockFile:")
            UnlockFile(result.fileJson, result.password)
            getNextTx()
        }


    });
});

var AccAddress ;

function getNextTx() {
    port.postMessage({
        src: "popup",
        dst:"background",
        data: {
            getNextTx : 'true'
        }
    });

}

function UnlockFile( fileJson, password) {
    console.log("\tfileJson: " + JSON.stringify(fileJson) )

    try {
        var address;
        var Account = require("nebulas").Account
        var account = Account.fromAddress(fileJson.address)

        account.fromKey(fileJson, password);
        address = account.getAddressString();
        gAccount = account;
        AccAddress = address;

        console.log("AccAddress got...")
        port.postMessage({
            src: "popup",
            dst:"background",
            data: {
                AccAddress : AccAddress
            }
        });

        console.log("\tfileJson: " + JSON.stringify(gAccount) )


        $(".icon-address.from input").val(address).trigger("input"); // gen icon from addr, needs trigger 'input' event if via set o.value
        $("#unlock").hide();
        $("#send").show();

        neb.api.getAccountState(address)
            .then(function (resp) {
                var nas = Unit.fromBasic(resp.balance, "nas").toNumber();
                console.log("\tbalance: " + nas +", nonce: " + resp.nonce)
                $("#balance").val(nas).trigger("input"); // add comma & unit from value, needs trigger 'input' event if via set o.value
                $("#nonce").val(parseInt(resp.nonce || 0) + 1);
            })
            .catch(function (e) {
                // this catches e thrown by nebulas.js!neb

                bootbox.dialog({
                    backdrop: true,
                    onEscape: true,
                    message: i18n.apiErrorToText(e.message),
                    size: "large",
                    title: "Error"
                });
            });
    } catch (e) {
        // this catches e thrown by nebulas.js!account
        console.log("unlockFile error:" + JSON.stringify(e))

    }
}










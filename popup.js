
//this port communicate with background
var port = chrome.runtime.connect({name: "popup"});
port.postMessage({src: "popup",dst:"background"});
port.onMessage.addListener(function(msg) {
    console.log("msg listened: " +JSON.stringify(msg));
    if (!! msg.unapprovedTxs) {
        var length = msg.unapprovedTxs.length
        if(msg.unapprovedTxs.length > 0) {
            var tx = msg.unapprovedTxs[length - 1].data
            processTx(tx);
        }else{
            console.log("no more unapprovedTxs")
            $(".icon-address.to input").val('');
            $("#amount").val('');
        }

    }
});
//just for debug, listen to port disconnect event
port.onDisconnect.addListener(function(message) {
    console.log("Port disconnected: " + JSON.stringify(message))
});

function messageToBackground(name,msg) {
    var data = {}
    data[name] = msg
    port.postMessage({
        src: "popup",dst:"background",
        serialNumber: serialNumber || "",
        data : data
        // data: {
        //     name : msg
        // }
    });
}

var txTobeProcessed
var serialNumber

function processTx(tx) {
    txTobeProcessed = tx
    console.log("to address: " + tx.to + ", mount: " + tx.value)
    $(".icon-address.to input").val(tx.to);
    $("#amount").val(tx.value);
    serialNumber = tx.serialNumber || "";
    if(!!tx.contract){
        $("#contract_div").css("display","unset");
        $("#contract").val(JSON.stringify(tx.contract))
    }
    else{
        $("#contract_div").css("display","none");
        $("#contract").val("")
    }

}

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
    changeNetwork()
    restoreAccount()
    $("#contract_div").css("display","none");
});

var AccAddress ;

function getNextTx() {
    console.log("to get next unapprovedTxs")
    // port.postMessage({
    //     src: "popup",
    //     dst:"background",
    //     data: {
    //         getNextTx : 'true'
    //     }
    // });
    messageToBackground("getNextTx","true")

}
function changeNetwork() {
    var url = localSave.getItem("apiPrefix")
    var chainId = localSave.getItem("chainId")
    console.log("to change network")
    // port.postMessage({
    //     src: "popup",
    //     dst:"background",
    //     data: {
    //         network : url,
    //         chainId : chainId
    //     }
    // });
    messageToBackground("data",{
        "network" : url,
        "chainId" : chainId
    })
}

function restoreAccount() {

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
                var nas = require("nebulas").Unit.fromBasic(resp.balance, "nas").toNumber();
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










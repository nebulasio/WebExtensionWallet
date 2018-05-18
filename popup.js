'use strict';

//this port communicate with background
var port = chrome.runtime.connect({name: "popup"});
port.postMessage({src: "popup",dst:"background"});
port.onMessage.addListener(function(msg) {
    console.log("msg listened: " +JSON.stringify(msg));
    if (!! msg.unapprovedTxs) {
        processTx(msg.unapprovedTxs);
        // var length = msg.unapprovedTxs.length
        // if(msg.unapprovedTxs.length > 0) {
        //     var tx = msg.unapprovedTxs[length - 1].data
        //     processTx(tx);
        // }else{
        //     console.log("no more unapprovedTxs")
        //     $(".icon-address.to input").val('');
        //     $("#amount").val('');
        // }

    }
});

//just for debug, listen to port disconnect event
port.onDisconnect.addListener(function(message) {
    console.log("Port disconnected: " + JSON.stringify(message))
});

//post message to background
function messageToBackground(name,msg) {
    var data = {}
    data[name] = msg
    port.postMessage({
        src: "popup",dst:"background",
        serialNumber: txTobeProcessed.serialNumber || "",
        data : data
        // data: {
        //     name : msg
        // }
    });
}

var txTobeProcessed = ""
//var serialNumber

function processTx(unapprovedTxs) {
    var length = unapprovedTxs.length;
    if(length > 0) {
        var tx = unapprovedTxs[length - 1].data;
        txTobeProcessed = tx

        console.log("to address: " + tx.to + ", mount: " + tx.value)
        $(".icon-address.to input").val(tx.to).trigger("input");
        $("#amount").val(tx.value).trigger("input");

        if (length > 1)
            $("#rejectAll").show();

        if (tx.serialNumber)             //value send by nebPay is using unit of Wei
            $("#amount").val(Unit.fromBasic(tx.value, "nas")).trigger("input");

        //serialNumber = tx.serialNumber || "";
        if (!!tx.contract) {
            //$("#contract_div").css("display", "unset");
            $("#contract_div").show();
            $("#contract").val(JSON.stringify(tx.contract))
        }
        else {
            //$("#contract_div").css("display", "none");
            $("#contract_div").hide();
            $("#contract").val("")
        }
    } else {
        console.log("no more unapprovedTxs")
        $(".icon-address.to input").val('').trigger("input");
        $("#amount").val('').trigger("input");
        $("#contract_div").hide();
        $("#rejectAll").hide();

    }

}

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

    messageToBackground("getNextTx","true")

}

//tell background to check if the network is changed
function changeNetwork() {
    var url = localSave.getItem("apiPrefix")
    //var chainId = localSave.getItem("chainId")
    console.log("to change network")

    messageToBackground("changeNetwork",url)
}

//
function restoreAccount() {

    chrome.storage.local.get(['keyInfo'], function(result) {
        console.log('keyInfo Value is :' + JSON.stringify(result.keyInfo));
        result = JSON.parse(result.keyInfo)

        if(!!result){
            $(".container select-wallet-file").addClass("active1")
            console.log("unlockFile:")
            UnlockFile(result.fileJson, result.password)
            hideKeyFileInput()
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











"use strict";

var nebulas = require("nebulas"),
    Transaction = nebulas.Transaction,
    Utils = nebulas.Utils,
    Unit = nebulas.Unit,
    neb = new nebulas.Neb(),
    validateAll = uiBlock.validate(),
    gLastGenerateInfo = {},
    gAccount, gTx;

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix") || "https://testnet.nebulas.io/"));
$("#generate").on("click", onClickGenerate);
$("#reject").on("click", onClickReject);
$("#modal-confirm .s").on("click", onClickModalConfirmS);
$("#send_transaction").on("click", onClickSendTransaction);
$("#change-wallet").on("click", onClickChangeWallet);

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    iconAddress: ".icon-address",
    logoMain: ".logo-main",
    numberComma: ".number-comma",
    selectWalletFile: [".select-wallet-file", onUnlockFile]
});

function hideKeyFileInput(){
    $(".select-wallet-file").hide()
    $(".change_wallet").show()
}

function onClickChangeWallet(){
    $(".select-wallet-file").show()
    $(".change_wallet").hide()
}

function onUnlockFile(swf, fileJson, account, password) {

    try {
        var value = new Object();
        //value.swf = swf;
        value.fileJson = fileJson
        value.password = password
        //console.log("keyInfo to be stored: " + JSON.stringify(JSON.parse(value)))
        var valueJson = JSON.stringify(value)
        console.log("valueJson: " + valueJson)
        chrome.storage.local.set({keyInfo: valueJson}, function () {
            console.log('Value is set to ' + valueJson);
        });
    } catch(e){
        console.log("storage set error"+e)
    }

    var address;
    try {
        account.fromKey(fileJson, password);
        address = account.getAddressString();
        gAccount = account;

        $(".icon-address.from input").val(address).trigger("input"); // gen icon from addr, needs trigger 'input' event if via set o.value
        $("#unlock").hide();
        $("#send").show();

        neb.api.getAccountState(address)
            .then(function (resp) {
                var nas = Unit.fromBasic(resp.balance, "nas").toNumber();

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

        bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: localSave.getItem("lang") == "en" ? e : "keystore 文件错误, 或者密码错误",
            size: "large",
            title: "Error"
        });
    }
}

function onClickReject() {

    messageToBackground("reject","true")

    messageToBackground("default","Error: Transaction rejected by user")
    //getNextTx()
    window.close()
}


function onClickGenerate() {

    messageToBackground("generate","true")

    var fromAddress, toAddress, balance, amount, gaslimit, gasprice, nonce, bnAmount;
    var contract;

    if (validateAll()) {
        fromAddress = $(".icon-address.from input").val();
        toAddress = $(".icon-address.to input").val();
        balance = $("#balance").val();
        amount = $("#amount").val();
        gaslimit = $("#limit").val();
        gasprice = $("#price").val();
        nonce = $("#nonce").val();

        if($("#contract").val())
            contract = JSON.parse($("#contract").val());

        if (gLastGenerateInfo.fromAddress != fromAddress ||
            gLastGenerateInfo.toAddress != toAddress ||
            gLastGenerateInfo.balance != balance ||
            gLastGenerateInfo.amount != amount ||
            gLastGenerateInfo.gaslimit != gaslimit ||
            gLastGenerateInfo.gasprice != gasprice ||
            gLastGenerateInfo.nonce != nonce ||
            gLastGenerateInfo.contract != contract) try {
            var tmp = Unit.fromBasic(Utils.toBigNumber(gaslimit)
                .times(Utils.toBigNumber(gasprice)), "nas");

            if (Utils.toBigNumber(balance).lt(Utils.toBigNumber(amount).plus(tmp)))
                if (Utils.toBigNumber(balance).lt(tmp))
                    bnAmount = Utils.toBigNumber(0);
                else
                    bnAmount = Utils.toBigNumber(balance).minus(Utils.toBigNumber(tmp));

            gTx = new Transaction(parseInt(localSave.getItem("chainId")), gAccount, toAddress, Unit.nasToBasic(Utils.toBigNumber(amount)), parseInt(nonce), gasprice, gaslimit, contract);
            gTx.signTransaction();

            $("#raw").val(gTx.toString());
            $("#signed").val(gTx.toProtoString());

            // //if the length of gTx is to large, then qrcode() will throw an error
            // //then the qrcode will be the error message,
            // try {
            //     $("<div id=addressqr></div>")
            //         .qrcode(gTx.toProtoString())
            //         .replaceAll('#addressqr');
            // }catch (e) {
            //     console.log(e);
            //     $("<div id=addressqr></div>")
            //         .qrcode(e)
            //         .replaceAll('#addressqr');
            // }
            //$("#transaction").show();

            gLastGenerateInfo.fromAddress = fromAddress;
            gLastGenerateInfo.toAddress = toAddress;
            gLastGenerateInfo.balance = balance;
            gLastGenerateInfo.amount = amount;
            gLastGenerateInfo.gaslimit = gaslimit;
            gLastGenerateInfo.gasprice = gasprice;
            gLastGenerateInfo.nonce = nonce;

            onClickSendTransaction()

        } catch (e) {
            bootbox.dialog({
                backdrop: true,
                onEscape: true,
                message: e,
                size: "large",
                title: "Error"
            });
        }
    }
}

function onClickSendTransaction() {
    $("#for_addr").val($(".icon-address.from input").val());
    $("#to_addr").val($(".icon-address.to input").val());
    $("#value").val($("#amount").val()).trigger("input");
}

var request = function(obj) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(obj.method || "GET", obj.url);
        if (obj.headers) {
            Object.keys(obj.headers).forEach(key => {
                xhr.setRequestHeader(key, obj.headers[key]);
            });
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(obj.body);
    });
};


function psotTxhashToServer(txTobeProcessed, mTxHash){

    if(!txTobeProcessed.callback){
        console.log("this tx has no \"callback\"")
        return
    }
    var url = txTobeProcessed.callback;
    var payId = txTobeProcessed.serialNumber;
    var txHash= mTxHash;

    url = `${url}?payId=${payId}&txHash=${txHash}`;

    var obj = {
        url: url,
        method: "POST",
        body: {}
    };

    request(obj).then(function (resp) {
        console.log("psotTxhashToServer result:" + JSON.stringify(resp))
    }).catch(function (err) {
        console.log("psotTxhashToServer error:" + JSON.stringify(err))
    })
    //     .then(function () {
    //     window.location.href = "check.html?" + mTxHash;
    // })
}

function onClickModalConfirmS() {
    var mTxHash;

    gTx && neb.api.sendRawTransaction(gTx.toProtoString())
        .then(function (resp) {
            // console.log("sendRawTransaction resp: " + JSON.stringify(resp));
            mTxHash = resp.txhash;

            console.log("txHash got...")  //send txhash msg to background.js

            messageToBackground("txhash",resp)

            psotTxhashToServer(txTobeProcessed, mTxHash);

            //window.location.href = "check.html?" + mTxHash;
            setTimeout(() => {
                window.location.href = "check.html?" + mTxHash;
            }, 1000)

            return neb.api.getTransactionReceipt(mTxHash);
        }).then(function (resp) {
            $("#receipt").text(mTxHash).prop("href", "check.html?" + mTxHash);
            $("#receipt_state").val(JSON.stringify(resp));
            $("#receipt_div").show();

            console.log("txReceipt got...")  //send txhash msg to background.js

            messageToBackground("receipt",resp)

            // TODO 重新点击需要reset页面状态，清理setTimeout
            setTimeout(function () {
                neb.api.getAccountState($(".icon-address.from input").val())
                    .then(function (resp) {
                        // console.log("getAccountState resp: " + JSON.stringify(resp));
                        var balanceNas = Unit.fromBasic(resp.balance, "nas");
                        $("#balance").val(balanceNas);
                        $("#nonce").val(resp.nonce);
                    }).catch(function (err) {
                    // TODO error
                });
            }, 60 * 1000);
        }).catch(function (o) {
            bootbox.dialog({
                backdrop: true,
                onEscape: true,
                message: i18n.apiErrorToText(o.message),
                size: "large",
                title: "Error"
            });
        });

    // $("#receipt_div").show();
}

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
$("#rejectAll").on("click", onClickRejectAll);
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

function onCurrencyChanged() {
    updateBalance()
}
uiBlock.addCurrencyChangedListener(onCurrencyChanged);

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
        messageToBackground("newWallet","true")
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

        updateBalance();
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

function updateBalance() {
    if (!gAccount) {
        return;
    }
    var addr = gAccount.getAddressString();
    var currency = uiBlock.currency;
    var contractAddr = uiBlock.getContractAddr(uiBlock.currency);
    $("#balance").val("").trigger("input");
    if (currency == "NAS") {
        neb.api.getAccountState(addr)
            .then(function (resp) {
                if (currency != uiBlock.currency) {
                    return;
                }
                if (resp.error) {
                    throw new Error(resp.error);
                }
                var nas = Unit.fromBasic(resp.balance, "nas").toString(10);
                $("#balance").val(nas).trigger("input"); // add comma & unit from value, needs trigger 'input' event if via set o.value
                $("#nonce").val(parseInt(resp.nonce || 0) + 1);
            })
            .catch(function (e) {
                if (currency != uiBlock.currency) {
                    return;
                }
                // this catches e thrown by nebulas.js!neb
                bootbox.dialog({
                    backdrop: true,
                    onEscape: true,
                    message: i18n.apiErrorToText(e.message),
                    size: "large",
                    title: "Error"
                });
            });
    } else {
        var contract = {"function": "balanceOf", "args": "[\"" + addr + "\"]"};
        neb.api.call({"from": addr, "to": uiBlock.getContractAddr(uiBlock.currency), "gasLimit": 400000, "gasPrice":20000000000, "value": 0, "contract": contract})
            .then(function (resp) {
                if (currency != uiBlock.currency) {
                    return;
                }
                if (resp.error) {
                    throw new Error(resp.error);
                }
                var b = resp.result.replace(/"/ig, "");
                let decimals = uiBlock.currency == "NAX" ? "gwei" : "nas";
                var balance = Unit.fromBasic(b, decimals).toString(10);
                $("#balance").val(balance).trigger("input"); // add comma & unit from value, needs trigger 'input' event if via set o.value
            })
            .catch(function (e) {
                if (currency != uiBlock.currency) {
                    return;
                }
                // this catches e thrown by nebulas.js!neb
                bootbox.dialog({
                    backdrop: true,
                    onEscape: true,
                    message: i18n.apiErrorToText(e.message),
                    size: "large",
                    title: "Error"
                });
            });

        neb.api.getAccountState(addr)
            .then(function (resp) {
                if (!resp.error) {
                    $("#nonce").val(parseInt(resp.nonce || 0) + 1);
                }
            })
            .catch(function (e) {
            });
    }
}

function onClickReject() {

    messageToBackground("reject","true")

    messageToBackground("default","Error: Transaction rejected by user")
    //getNextTx()
    window.close()
}

function onClickRejectAll() {

    messageToBackground("rejectAll","true")
    getNextTx()     //to refresh data
    //window.close()
}

function onClickGenerate() {

    messageToBackground("generate","true")

    var fromAddress, toAddress, balance, amount, gaslimit, gasprice, nonce, bnAmount;
    var contract = null;

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
            gLastGenerateInfo.contract != contract ||
            gLastGenerateInfo.nonce != nonce) try {
            var tmp = Unit.fromBasic(Utils.toBigNumber(gaslimit)
                .times(Utils.toBigNumber(gasprice)), "nas");

            if (Utils.toBigNumber(balance).lt(Utils.toBigNumber(amount).plus(tmp)))
                if (Utils.toBigNumber(balance).lt(tmp))
                    bnAmount = Utils.toBigNumber(0);
                else
                    bnAmount = Utils.toBigNumber(balance).minus(Utils.toBigNumber(tmp));

            var a = amount.split(".");
            var amountValid = a.length == 1 || a[1].length <= 18;
            if (uiBlock.currency == "NAS" || contract) {
                if (!amountValid) throw new Error("Invalid value! The minimum unit is wei (1^-18nas) ");
                gTx = new Transaction(parseInt(localSave.getItem("chainId")), gAccount, toAddress, Unit.nasToBasic(Utils.toBigNumber(amount)), parseInt(nonce), gasprice, gaslimit, contract);
            } else {
                let decimals = uiBlock.currency == "NAX" ? 9 : 18;
                if (!amountValid) throw new Error("Invalid value! The minimum unit is wei (1^-" + decimals + uiBlock.currency.toLowerCase() + ") ");
                let value = Utils.toBigNumber(10).pow(decimals).times(amount).toString(10)
                contract = {"function": "transfer", "args": "[\"" + toAddress + "\", \"" + value + "\"]", "type": "call"};
                gTx = new Transaction(parseInt(localSave.getItem("chainId")), gAccount, uiBlock.getContractAddr(uiBlock.currency), Unit.nasToBasic(Utils.toBigNumber("0")), parseInt(nonce), gasprice, gaslimit, contract);
            }
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
                reject(xhr.response);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(obj.body);
    });
};


var postCount = 0  //失败后的尝试次数
var maxPostCount = 5
function postTxhashToServer(txTobeProcessed, mTxHash,callback){

    if(!txTobeProcessed.callback){
        console.log("this tx has no \"callback\"")
        callback()
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
        postCount = 0
        //callback({status : 0, info:'Post serialNumber to server successfully'})
        callback()
    }).catch(function (error) {
        postCount ++
        console.log("post SN failed count: " + postCount)
        if(postCount > maxPostCount){
            postCount = 0
            //callback({status: 1, info : error.message || error})  //error
            callback(error.message || error)  //error
        }else{
            setTimeout(function () {
                postTxhashToServer(txTobeProcessed, mTxHash,callback)
            },500)

        }

    })
}

function onClickModalConfirmS() {
    var mTxHash;

    gTx && neb.api.sendRawTransaction(gTx.toProtoString())
        .catch(function (o) {
            bootbox.dialog({
                backdrop: true,
                onEscape: true,
                message: i18n.apiErrorToText(o.message),
                size: "large",
                title: "Error"
            });
        })
        .then(function (resp) {
            // console.log("sendRawTransaction resp: " + JSON.stringify(resp));
            mTxHash = resp.txhash;

            console.log("txHash got...")  //send txhash msg to background.js

            //messageToBackground("txhash",resp)

            postTxhashToServer(txTobeProcessed, mTxHash,function (postResult) {
                if(postResult) {
                    resp.error = postResult
                }
                messageToBackground("txhash",resp)
                window.location.href = "check.html?" + mTxHash;
            })

        })
        // .then(function (resp) {
        //     console.log("postTxhashToServer result:" + JSON.stringify(resp))
        //     messageToBackground("default","Post serialNumber to server successfully")
        //     window.location.href = "check.html?" + mTxHash;
        //
        // }).catch(function (error) {
        //     console.log("post txhash To Server error:")
        //     console.log(JSON.stringify(error))
        //     //failed, try again
        //     return postTxhashToServer(txTobeProcessed, mTxHash)  //try for second time
        // }).then(function (resp) {
        //     messageToBackground("default","serialNumber poster to server successfully")
        //     console.log("postTxhashToServer result:" + JSON.stringify(resp))
        //     window.location.href = "check.html?" + mTxHash;
        //
        // }).catch(function (error) {
        //     console.log("post txhash to Server error:")
        //     console.log(JSON.stringify(error))
        //     messageToBackground("default",{error:'Post serialNumber to server failed: ' , request_response: (error.message || error)})
        // })

    // $("#receipt_div").show();
}
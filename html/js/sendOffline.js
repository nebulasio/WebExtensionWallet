"use strict";

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    Neb = nebulas.Neb,
    Transaction = nebulas.Transaction,
    utils = nebulas.Utils,
    unit = nebulas.Unit,
    neb = new Neb(),
    gAccount = new Account(),
    gLastGenerateInfo = {},
    validateStep1 = uiBlock.validate("#step1"),
    validateStep2 = uiBlock.validate("#step2"),
    gFromState;

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix") || "https://testnet.nebulas.io/"));
$("#exampleModal .send").on("click", onClickExampleModalSend);
$("#generate").on("click", onClickGenerate);
$("#generate-infomation").on("click", onClickGenerateInfomation);
$("#signedoffline").on({
    focus: onFocusSignedOffline,
    input: onInputSignedOffline
});
$("#step3 .send").on("click", onClickStep3Send);

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    iconAddress: ".icon-address",
    logoMain: ".logo-main",
    numberComma: ".number-comma",
    selectWalletFile: [".select-wallet-file", onUnlockFile]
});

function onUnlockFile(swf, fileJson, account, password) {
    var address;

    try {
        account.fromKey(fileJson, password);
        address = account.getAddressString();
        gAccount = account;

        $("#step2 .icon-address.from input").val(address).trigger("input");
        $(".transaction").show();
    } catch (e) {
        bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: localSave.getItem("lang") == "en" ? e : "keystore 文件错误, 或者密码错误",
            size: "large",
            title: "Error"
        });
    }
}

function onClickStep3Send() {
    var val = $("#signedoffline").val(), tx;

    if (val) try {
        tx = Transaction.prototype.fromProto(val);
        $("#for_addr").val(tx.from.getAddressString());
        $("#to_addr").val(tx.to.getAddressString());
        $("#value").val(unit.fromBasic(tx.value, "nas")).trigger("input");
        // $("#value").val(unit.nasToBasic(tx.value).c);
    } catch (err) {
        bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: localSave.getItem("lang") == "en" ? err.message : "无效的签名交易",
            size: "large",
            title: "Error"
        });
    }
}

function onClickGenerate() {
    var fromaddress, toaddress, amount, nonce, gaslimit, gasprice, toaccount, tx;

    if (validateStep2()) {
        fromaddress = $(".icon-address.from input").val();
        toaddress = $(".icon-address.to input").val();
        amount = $("#amount").val();
        nonce = $("#nonce").val();
        gaslimit = $("#limit").val();
        gasprice = $("#price").val();

        if (gLastGenerateInfo.fromaddress != fromaddress ||
            gLastGenerateInfo.toaddress != toaddress ||
            gLastGenerateInfo.amount != amount ||
            gLastGenerateInfo.nonce != nonce ||
            gLastGenerateInfo.gaslimit != gaslimit ||
            gLastGenerateInfo.gasprice != gasprice) try {
            toaccount = Account.fromAddress(toaddress);

            tx = new Transaction(parseInt(localSave.getItem("chainId")), gAccount, toaccount.getAddressString(), unit.nasToBasic(amount), parseInt(nonce), gasprice, gaslimit);
            tx.signTransaction();

            $("#raw").val(tx.toString());
            $("#signed").val(tx.toProtoString());
            $("#signedoffline").val(tx.toProtoString());
            // $("#qrcode").qrcode(tx.toProtoString());

            $("<div id=qrcode style=text-align:center;></div>")
                .qrcode(tx.toProtoString())
                .replaceAll('#qrcode');

            $(".transaction").show();

            gLastGenerateInfo.fromaddress = fromaddress;
            gLastGenerateInfo.toaddress = toaddress;
            gLastGenerateInfo.amount = amount;
            gLastGenerateInfo.nonce = nonce;
            gLastGenerateInfo.gaslimit = gaslimit;
            gLastGenerateInfo.gasprice = gasprice;
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

function onClickGenerateInfomation() {
    var fromaddress = $(".icon-address.from input").val();

    if (validateStep1())
        try {
            neb.api.gasPrice()
                .then(function (resp) {
                    $("#fa_gasprice").val(resp.gas_price);
                    $("#price").val(resp.gas_price);

                    return neb.api.getAccountState(fromaddress);
                })
                .then(function (resp) {
                    gFromState = {
                        balance: resp.balance,
                        nonce: resp.nonce
                    };

                    $("#fa_nonce").val(parseInt(resp.nonce) + 1);
                    $("#nonce").val(parseInt(resp.nonce) + 1);
                    $("#information").show();
                })
                .catch(function (e) {
                    // https://stackoverflow.com/questions/30715367/why-can-i-not-throw-inside-a-promise-catch-handler
                    bootbox.dialog({
                        backdrop: true,
                        onEscape: true,
                        message: e,
                        size: "large",
                        title: "Error"
                    });
                });
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

function onFocusSignedOffline() {
    $("[data-validate-order-matters]").removeClass("invalid").popover("hide");
}

function onInputSignedOffline() {
    $("<div id=qrcode></div>")
        .qrcode($("#signedoffline").val())
        .replaceAll('#qrcode');
}

function onClickExampleModalSend() {
    neb.api.sendRawTransaction($("#signedoffline").val())
        .then(function (resp) {
            return neb.api.getTransactionReceipt(resp.txhash);
        }).then(function (resp) {
        $("#receipt_state").val(JSON.stringify(resp));
        $("#receipt").text(resp.hash).prop("href", "check.html?" + resp.hash);
        $("#receipt_div").show();
    }).catch(function (o) {
        bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: i18n.apiErrorToText(o.message),
            size: "large",
            title: "Error"
        });
    });
}
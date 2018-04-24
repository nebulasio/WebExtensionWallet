"use strict";

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    Neb = nebulas.Neb,
    Transaction = nebulas.Transaction,
    Utils = nebulas.Utils,
    neb = new Neb(),
    gAccount, gFileJson;

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix") || "https://testnet.nebulas.io/"));
$("#keystore").on("click", onClickKeystore);
$("#togglePassword").on("change", onChangeTogglePassword);

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    logoMain: ".logo-main",
    selectWalletFile: [".select-wallet-file", onUnlockFile]
});

function onUnlockFile(swf, fileJson, account, password) {
    try {
        gAccount = account;
        gFileJson = fileJson;
        account.fromKey(fileJson, password);

        $("#address").val(account.getAddressString());
        $("#sideaddress").text(account.getAddressString());
        $("#password").val(account.getPrivateKeyString());
        $("#addressqr").qrcode(account.getAddressString());
        $("#privateqr").qrcode(account.getPrivateKeyString());
        $("#walletinfo").show();

        neb.api.getAccountState(account.getAddressString())
            .then(function (resp) {
                if (resp.error) {
                    throw new Error(resp.error);
                } else {
                    $("#amount").val(nebulas.Unit.fromBasic(Utils.toBigNumber(resp.balance), "nas").toNumber() + " NAS");
                }
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

function onClickKeystore() {
    var blob = new Blob([JSON.stringify(gFileJson)], { type: "application/json; charset=utf-8" });
    saveAs(blob, gAccount.getAddressString());
}

function onChangeTogglePassword(e) {
    if (e.target.checked) {
        $("#password").prop("type", "text");
        $(".key_qr").removeClass("display-none");
    } else {
        $("#password").prop("type", "password");
        $(".key_qr").addClass("display-none");
    }
}
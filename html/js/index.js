"use strict";

// replace ="([^ =]+)" with =$1

var nebulas = require("nebulas"),
    account = nebulas.Account.NewAccount(),
    validateAll = uiBlock.validate();

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    logoMain: ".logo-main"
});

$("#creat").on("click", onClickCreate);
$(".download button").on("click", onClickDownloadButton);

function onClickCreate() {
    validateAll() && $(".download").removeClass("active1");
}

function onClickDownloadButton() {
    var password = $("#password").val(), address, keyStr, blob;

    if (validateAll()) {
        bootbox.alert({
            message: "waiting...",
            title: "info"
        });

        // window.open('tokey.html?password=' + password, '_blank');

        address = account.getAddressString();
        keyStr = account.toKeyString(password);
        blob = new Blob([keyStr], { type: "application/json; charset=utf-8" });
        saveAs(blob, address);
        bootbox.hideAll();
    }
}
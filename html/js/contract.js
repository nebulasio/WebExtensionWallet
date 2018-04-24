
"use strict";

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    Utils = nebulas.Utils,
    neb = new nebulas.Neb(),
    globalParams = {
        account: null
    },
    validateTab2 = uiBlock.validate("#tab2"),
    validateTab3 = uiBlock.validate("#tab3");

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix") || "https://testnet.nebulas.io/"));

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    iconAddress: ".icon-address",
    logoMain: ".logo-main",
    numberComma: ".number-comma",
    selectWalletFile: [".select-wallet-file", onUnlockFile]
});

$("#tabs a").click(function (e) {
    e.preventDefault();
    $("#tabs li").removeClass("ccc");
    $(this).parent().addClass("ccc");
    $("#content div").removeClass("show");
    $("#" + $(this).attr("title")).addClass("show");
    $(this).addClass("current");
});

$("#tabs a").hover(function () {
    if (!$(this).parent().hasClass("current")) {
        $(this).parent().addClass("hoverItem");
    }
}, function () {
    $(this).parent().removeClass("hoverItem");
});

$(".search").on("click", onClickSearch);
$("#deploy_test").on("click", onClickDeployTest);
$("#deploy").on("click", onClickDeploy);
$("#call_test").on("click", onClickCallTest);
$("#call").on("click", onClickCall);

function onClickDeployTest() {
    validateTab2() && innerDeploy(function (params) {
        neb.api.call({
            from: params.from,
            to: params.to,
            value: params.value,
            nonce: params.nonce,
            gasPrice: params.gasPrice,
            gasLimit: params.gasLimit,
            contract: params.contract
        }).then(function (resp) {
            $("#deploy_test_result").text(JSON.stringify(resp));
            $("#deploy").attr("disabled", false); // = $('#deploy').removeAttr("disabled")
            $("#deploy_result").text("");
            $("#deploy_test_result").parents(".next").removeClass("active1");
        }).catch(function (err) {
            $("#deploy_test_result").text(JSON.stringify(err));
            $("#deploy").attr("disabled", true);
            $("#deploy_result").text("");
            $("#deploy_test_result").parents(".next").removeClass("active1");
        });
    });
}

function onClickDeploy() {
    $(".modal.loading").modal("show");
    $(".next_right").removeClass("active1");

    innerDeploy(function (params) {
        var gTx = new nebulas.Transaction(parseInt(localSave.getItem("chainId")),
            globalParams.account,
            params.to, params.value, params.nonce, params.gasPrice, params.gasLimit, params.contract);

        gTx.signTransaction();

        neb.api
            .sendRawTransaction(gTx.toProtoString())
            .then(function (resp) {
                $("#deploy_result").text(JSON.stringify(resp));
                $("#deploy_result_address").val(resp.contract_address);
                $("#receipt").text(resp.txhash).prop("href", "check.html?" + resp.txhash);
                $(".modal.loading").modal("hide");
            })
            .catch(function (err) {
                $("#deploy_result").text(JSON.stringify(err));
                $(".modal.loading").modal("hide");
            });
    });
}

function onClickSearch() {
    if ($("#addr_input").val().length != 64) {
        $(".errmsg").removeClass("active1");

        setTimeout(function () {
            $(".errmsg").addClass("active1");
        }, 2000);
    } else {
        $(".modal.loading").modal("show");

        neb.api
            .getTransactionReceipt($("#addr_input").val())
            .then(function (resp) {
                var data, s, lang;

                if (!resp.contract_address || resp.contract_address === "") {
                    bootbox.dialog({
                        backdrop: true,
                        message: i18n.apiErrorToText("transaction not found"),
                        onEscape: true,
                        size: "large",
                        title: "Error"
                    });
                } else {
                    $(".search_result").removeClass("active1");

                    if (resp.data) {
                        data = atob(resp.data);
                        lang = Prism.languages.javascript;

                        if (resp.type == "binary")
                            s = data;
                        else if (resp.type == "deploy")
                            s = Prism.highlight(js_beautify(JSON.parse(data).Source), lang);
                        else if (resp.type == "call")
                            s = Prism.highlight(js_beautify(data), lang);
                        else
                            s = "0x0";

                        $(".search_result").html(s);
                        $(".modal.loading").modal("hide");
                    }
                }
            })
            .catch(function (err) {
                bootbox.dialog({
                    backdrop: true,
                    onEscape: true,
                    message: i18n.apiErrorToText(err.message),
                    size: "large",
                    title: "Error"
                });

                $(".modal.loading").modal("hide");
            });
    }
}

function onClickCallTest() {
    validateTab3() && innerCall(function (params) {
        neb.api
            .call({
                from: params.from,
                to: params.to,
                value: params.value,
                nonce: params.nonce,
                gasPrice: params.gasPrice,
                gasLimit: params.gasLimit,
                contract: params.contract
            })
            .then(function (resp) {
                $("#call_test_result").text(JSON.stringify(resp));

                if (resp.execute_err && resp.execute_err !== "") {
                    $("#call").attr("disabled", true);
                    $("#call_result").text("");
                    $(".next").removeClass("active1");
                } else {
                    $("#call").attr("disabled", false);
                    $("#call_result").text("");
                    $(".next").removeClass("active1");
                }
            })
            .catch(function (err) {
                $("#call_test_result").text(JSON.stringify(err));
                $("#call").attr("disabled", true);
                $("#call_result").text("");
                $(".next").removeClass("active1");
            });
    });
}

function onClickCall() {
    $(".modal.loading").modal("show");

    innerCall(function (params) {
        var gTx = new nebulas.Transaction(parseInt(localSave.getItem("chainId")),
            globalParams.account,
            params.to, params.value, params.nonce, params.gasPrice, params.gasLimit, params.contract);

        gTx.signTransaction();

        neb.api
            .sendRawTransaction(gTx.toProtoString())
            .then(function (resp) {
                console.log(JSON.stringify(resp));
                $("#call_result").text(JSON.stringify(resp));
                $(".result").removeClass("active1");
                $(".next").removeClass("active1");
                $("#receipt_call").text(resp.txhash).prop("href", "check.html?" + resp.txhash);
                $(".modal.loading").modal("hide");
            })
            .catch(function (err) {
                $("#call_result").text(JSON.stringify(err));
                $(".result").removeClass("active1");
                $(".next").removeClass("active1");
                $(".modal.loading").modal("hide");
            });
    });
}

function onUnlockFile(swf, fileJson, account, password) {
    var balance_nas, state,
        fromAddr = account.getAddressString(),
        $tab = $(swf).closest(".tab");

    $(".modal.loading").modal("show");

    if ($tab.prop("id") == "tab2") {
        $("#from_addr").val(fromAddr).trigger("input");
        $("#to_addr").val(account.getAddressString()).trigger("input");
    } else if ($tab.prop("id") == "tab3")
        $("#run_from_addr").val(fromAddr).trigger("input");

    try {
        account.fromKey(fileJson, password);
        globalParams.account = account;
        $("#unlock").hide();
        $("#send").show();

        neb.api.gasPrice()
            .then(function (resp) {
                $("#gas_price").val(resp.gas_price);
                $("#run_gas_price").val(resp.gas_price);

                return neb.api.getAccountState(fromAddr);
            })
            .then(function (resp) {
                var balance = nebulas.Unit.fromBasic(resp.balance, "nas");

                if ($tab.prop("id") == "tab2")
                    $("#balance").val(balance + " NAS");
                else if ($tab.prop("id") == "tab3")
                    $("#run_balance").val(balance + " NAS");

                $(".modal.loading").modal("hide");
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

                $(".modal.loading").modal("hide");
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

        $(".modal.loading").modal("hide");
    }
}

function innerDeploy(callback) {
    let params = {};

    if (!globalParams.account) {
        // TODO 提示钱包信息不正确
        return;
    }

    params.from = globalParams.account.getAddressString();
    params.to = params.from;

    // prepare gasLimit
    let gasLimit = Utils.toBigNumber(0);

    try {
        gasLimit = Utils.toBigNumber($("#gas_limit").val());
    } catch (err) {
        console.log(err);
    }

    if (gasLimit.cmp(Utils.toBigNumber(0)) <= 0) {
        $("#gas_limit").addClass("err");
        setTimeout(function () {
            $("#gas_limit").removeClass("err");
        }, 5000);
        return;
    }

    params.gasLimit = gasLimit.toNumber();

    // prepare gasPrice
    let gasPrice = Utils.toBigNumber(0);

    try {
        gasPrice = Utils.toBigNumber($("#gas_price").val());
    } catch (err) {
        console.log(err);
    }

    if (gasPrice.cmp(Utils.toBigNumber(0)) <= 0) {
        $("#gas_price").addClass("err");
        setTimeout(function () {
            $("#gas_price").removeClass("err");
        }, 5000);
        return;
    }

    params.gasPrice = gasPrice.toNumber();
    params.value = "0";
    params.contract = {
        "source": $("#source").val(),
        "sourceType": $("input[name=sourceType]:checked").val(),
        "args": $("#deploy_args").val().trim()
    };

    // prepare nonce
    neb.api.getAccountState(params.from)
        .then(function (resp) {
            var balance = nebulas.Unit.fromBasic(resp.balance, "nas"),
                $tab = $(".show.tab");

            params.nonce = parseInt(resp.nonce) + 1;

            if ($tab.prop("id") == "tab2")
                $("#balance").val(balance + " NAS");
            else if ($tab.prop("id") == "tab3")
                $("#run_balance").val(balance + " NAS");

            callback(params);
        })
        .catch(function (err) {
            $(".modal.loading").modal("hide");

            bootbox.dialog({
                backdrop: true,
                onEscape: true,
                message: i18n.apiErrorToText(err.message),
                size: "large",
                title: "Error"
            });
        });
}

function innerCall(callback) {
    let params = {};

    if (!globalParams.account) {
        // TODO 提示钱包信息不正确
        return;
    }
    params.from = globalParams.account.getAddressString();

    // prepare to
    let toAddr = $("#run_to_addr").val().trim();
    if (!Account.isValidAddress(toAddr)) {
        $("#run_to_addr").addClass("err");
        setTimeout(function () {
            $("#run_to_addr").removeClass("err");
        }, 5000);
        return;
    }
    params.to = toAddr;

    // prepare gasLimit
    let gasLimit = Utils.toBigNumber(0);
    try {
        gasLimit = Utils.toBigNumber($("#run_gas_limit").val());
    } catch (err) {
        console.log(err);
    }
    if (gasLimit.cmp(Utils.toBigNumber(0)) <= 0) {
        $("#run_gas_limit").addClass("err");
        setTimeout(function () {
            $("#run_gas_limit").removeClass("err");
        }, 5000);
        return;
    }
    params.gasLimit = gasLimit.toNumber();

    // prepare gasPrice
    let gasPrice = Utils.toBigNumber(0);
    try {
        gasPrice = Utils.toBigNumber($("#run_gas_price").val());
    } catch (err) {
        console.log(err);
    }
    if (gasPrice.cmp(Utils.toBigNumber(0)) <= 0) {
        $("#run_gas_price").addClass("err");
        setTimeout(function () {
            $("#run_gas_price").removeClass("err");
        }, 5000);
        return;
    }
    params.gasPrice = gasPrice.toNumber();

    // prepare value
    let value = Utils.toBigNumber(0);
    try {
        value = nebulas.Unit.toBasic(Utils.toBigNumber($("#run_value").val()), "nas");
    } catch (err) {
        console.log(err);
    }
    if (value.cmp(Utils.toBigNumber(0)) < 0) {
        // TODO 添加提示value输入不对
        console.log("invalid value");
        return;
    }
    params.value = value;

    // prepare contract
    params.contract = {
        "function": $("#call_function").val(),
        "args": $("#call_args").val().trim()
    };

    // prepare nonce
    // needs refresh data on every 'test' and 'commit' call, because data update may slow,
    // you can get different result by hit 'test' multiple times
    neb.api.getAccountState(params.from).then(function (resp) {
        var balance = nebulas.Unit.fromBasic(resp.balance, "nas"),
            $tab = $(".show.tab");

        params.nonce = parseInt(resp.nonce) + 1;

        if ($tab.prop("id") == "tab2")
            $("#balance").val(balance + " NAS");
        else if ($tab.prop("id") == "tab3")
            $("#run_balance").val(balance + " NAS");

        callback(params);
    }).catch(function (err) {
        // console.log("prepare nonce error: " + err);
        bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: i18n.apiErrorToText(err.message),
            size: "large",
            title: "Error"
        });
    });
}
// CodeMirror
var editor = CodeMirror.fromTextArea(document.getElementById("source"), {
    // lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
});

onChange(instance,changeObj),codeMirror;
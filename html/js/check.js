var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb(),
    Unit = nebulas.Unit;
    hash = location.search.slice(1),
    validateAll = uiBlock.validate();

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    logoMain: ".logo-main",
    numberComma: ".number-comma"
});

$("#btn_done").hide()

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix") || "https://testnet.nebulas.io/"));
$("#btn").on("click", onClickBtn);
$("#btn_done").on("click", function () {
    window.close()
});

if (hash) {
    $("#input").val(hash);
    $("#btn").trigger("click");
}

function setAutoCheck() {
    if($(".status").text() !== "success"){
        var interval = 1000
        var second = 15
        var number = second
        var countDown = setInterval(function () {
            if($(".status").text() === "success" ||
                $(".status").text() === "fail"){
                clearInterval(countDown)
                //$("#counterDown").remove()
                $("#btn").hide()
                $("#btn_done").show()
            }

            if( $("#counterDown").length > 0){
                $("#counterDown").text(' (' + number + ')')
            }else{
                var spanTag = document.createElement("span");
                spanTag.id = "counterDown";
                spanTag.innerHTML = '(' + number + ')';
                $("#btn").append(spanTag);
            }

            if(number === 0){
                number = second
                onClickBtn()
            }

            number--;

        }, interval)
    }

}

function onClickBtn() {
    var addr = $("#input").val();

    if (validateAll()) {
        $(".modal.loading").modal("show");

        neb.api.getTransactionReceipt(addr)
            .then(doneGetTransactionReceipt)
            .catch(function (o) {
                $(".modal.loading").modal("hide");

                bootbox.dialog({
                    backdrop: true,
                    message: i18n.apiErrorToText(o.message),
                    onEscape: true,
                    size: "large",
                    title: "Error"
                });
            });
    } else {
        $(".errmsg").removeClass("active1");
        setTimeout(function () {
            $(".errmsg").addClass("active1");
        }, 2000);
    }
    setAutoCheck()
}

function doneGetTransactionReceipt(o) {

/*
    if (o.data) {
        data = atob(o.data);
        lang = Prism.languages.javascript;

        if (o.type == "binary")
            s = data;
        else if (o.type == "deploy")
            s = Prism.highlight(js_beautify(JSON.parse(data).Source), lang);
        else if (o.type == "call")
            s = Prism.highlight(js_beautify(data), lang);
        else
            s = "0x0";

        $("#code").html(s);
    }
*/
    $(".modal.loading").modal("hide");

    $("#info").removeClass("active1");
    $("#code").text(o.data);
    $(".tx_hash").text(o.hash);
    $(".contract_addr").text(o.contract_address);
    $(".status").text(o.status == 1 ? "success" : (o.status == 0 ? "fail" : "pending"));
    $(".status").css("color", o.status == 1 ? "green" : (o.status == 0 ? "red" : "blue"));
    $(".from_address").text(o.from);
    $(".to_address").text(o.to);
    $(".nonce").text(o.nonce);

    $(".amount input").val(o.value).trigger("input");
    $(".gas-limit input").val(o.gas_limit).trigger("input");
    $(".gas-price input").val(o.gas_price).trigger("input");
    $(".gas-used input").val(o.gas_used).trigger("input");
}


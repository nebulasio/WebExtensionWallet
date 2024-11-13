//
// requires - jquery blockies bootbox i18n.js nebulas.js
// because this project already uses them

var uiBlock = (function () {
  var MAIN_NET_ATP_CONTRACT_ADDR = "n1zUNqeBPvsyrw5zxp9mKcDdLTjuaEL7s39";
  var MAIN_NET_NAT_CONTRACT_ADDR = "n1mpgNi6KKdSzr7i5Ma7JsG5yPY9knf9He7";
  var MAIN_NET_NAX_CONTRACT_ADDR = "n1etmdwczuAUCnMMvpGasfi8kwUbb2ddvRJ";
  var MAIN_NET_nUSDT_CONTRACT_ADDR = "n1tV52CtfmV4f9W6txBYDXCBE5ChC1afEa5";
  var MAIN_NET_WNAS_CONTRACT_ADDR = "n1jrKxgPEUcs7BU2vq3jBzNBdTwWH1oFXku";

  // NAS-NAX lp token
  var MAIN_NET_NAS_NAX_LP_ADDR_V1 = "n1wVRRay5H9nhd32ovdLdTTuEpub7VXKhPN";
  // NAS-nUSDT lp token
  var MAIN_NET_NAS_nUSDT_LP_ADDR_V1 = "n1pjr32LURxmrizcL9xbiJnWSYnoUVaRBRN";
  // NAX-nUSDT lp token
  var MAIN_NET_NAX_nUSDT_LP_ADDR_V1 = "n1q1TK5JgtbvxUJ9K255rV5dBktmRJUsUCs";

  // NAS-NAX lp token
  var MAIN_NET_NAS_NAX_LP_ADDR = "n1xyK8QkGGjjmZRHufuF6JY7Vk3AcMwNUrq";
  // NAS-nUSDT lp token
  var MAIN_NET_NAS_nUSDT_LP_ADDR = "n1nDsKeXrwurQx1CvJasdxAWGJ7QX5xFd8g";
  // NAX-nUSDT lp token
  var MAIN_NET_NAX_nUSDT_LP_ADDR = "n21kYF8bYsR69utWXRDnutgDgYurpTCGSCx";


  var TEST_NET_ATP_CONTRACT_ADDR = "n1nkoSJVLQnaKnDKH56mtKtdjbgLKoHZhtD";
  var TEST_NET_NAT_CONTRACT_ADDR = "n22PdtQepev7rcQgy3zqfdAkNPN2pSpywZ8";
  var TEST_NET_NAX_CONTRACT_ADDR = "n1ojXjG5CZKRrMLuUav46ogG81SDWe7pxD3";
  var TEST_NET_nUSDT_CONTRACT_ADDR = "n1prbivQy5kwQ3WU9RdzRFPifJwprUrDyTQ";

  // NAS-NAX lp token
  var TEST_NET_NAS_NAX_LP_ADDR = "n1kqDZtdvJm3JjmzqsVWedd6da5wUBwtthS";
  // NAS-nUSDT lp token
  var TEST_NET_NAS_nUSDT_LP_ADDR = "n1nqBaYMxn7WpJ2CXUJNV9WBAkCKeEtDLYm";
  // NAX-nUSDT lp token
  var TEST_NET_NAX_nUSDT_LP_ADDR = "n1gWVbt1ob79uGxLcKRNq6hgx8EBPEPD9Cd";

  var old$fnModal = $.fn.modal;

  $.fn.modal = $fnModal;

  return {
    insert: insert,
    numberAddComma: numberAddComma,
    toSi: toSi,
    validate: validate,
    currency: "NAS",
    _currencyChangedListeners: [],
    addCurrencyChangedListener: addCurrencyChangedListener,
    getContractAddr: getContractAddr,
    getCurrencyByContractAddr: getCurrencyByContractAddr,
    isNRC20ContractAddr: isNRC20ContractAddr,
  };

  function $fnModal(s) {
    if (!this.hasClass("listen-to-bs-shown")) {
      this.addClass("listen-to-bs-shown");
      this.on("shown.bs.modal", onShownBsModal);
    }

    if (s == "show") this.removeClass("marked-for-close");
    else if (s == "hide")
      // when modal is animating, you can not close it, it's important to set this flag;
      // when animating is over, you can close modal, this flag is not used
      this.addClass("marked-for-close");

    old$fnModal.apply(this, arguments);
  }

  function onShownBsModal() {
    var $this = $(this);

    if ($this.hasClass("marked-for-close")) $this.modal("hide");
  }

  function addCurrencyChangedListener(f) {
    this._currencyChangedListeners.push(f);
  }

  function onCurrencyChanged() {
    for (var i in uiBlock._currencyChangedListeners) {
      uiBlock._currencyChangedListeners[i]();
    }
  }

  function getContractAddr(currency) {
    return getCurrencies()[currency];
  }

  function getCurrencyByContractAddr(addr) {
    var currencies = getCurrencies();
    for (var c in currencies) {
      if (currencies[c] == addr) {
        return c;
      }
    }
    return null;
  }

  function isNRC20ContractAddr(addr) {
    var currencies = getCurrencies();
    for (var c in currencies) {
      if (c != "NAS" && currencies[c] == addr) {
        return true;
      }
    }
    return false;
  }

  function getCurrencies() {
    currencies = localSave.getItem("currencies");
    if (!currencies) {
      currencies = {
        NAS: "",
        ATP: MAIN_NET_ATP_CONTRACT_ADDR,
        NAT: MAIN_NET_NAT_CONTRACT_ADDR,
        NAX: MAIN_NET_NAX_CONTRACT_ADDR,
        WNAS: MAIN_NET_WNAS_CONTRACT_ADDR,
      };
    } else {
      currencies = JSON.parse(currencies);
    }
    return currencies;
  }

  function getCurrencyCount() {
    currencies = getCurrencies();
    return Object.getOwnPropertyNames(currencies).length;
  }

  function insert(dic) {
    // f({ header: ".header-1, .abc" })
    // - will insert header html string into all elements found by document.querySelectorAll(".header-1, .abc")

    var Account = require("nebulas").Account,
      bag = {
        footer: footer,
        header: header,
        iconAddress: iconAddress,
        logoMain: logoMain,
        numberComma: numberComma,
        selectWalletFile: selectWalletFile,
      },
      i;

    for (i in dic)
      if (i in bag)
        Array.isArray(dic[i]) ? bag[i].apply(null, dic[i]) : bag[i](dic[i]);

    function footer(selector) {
      i18n.run(
        $(selector)
          .addClass("container footer")
          .html(
            // "<div class=logo></div>" +
            '<a href="https://nebulas.io/" target="__blank" ref="noopener noreferrer" ><img class=logo src="../images/logo-b.png"></img></a>' +
              '<span class="copyright text-center">Copyright &copy; 2018-2020 Nebulas.io</span>'
          )
      );
    }

    function header(selector) {
      var i,
        len,
        arr = [
          "index.html",
          "sendNas.html",
          "sendOffline.html",
          "viewWalletInfo.html",
          "check.html",
          "contract.html",
        ];

      for (i = 0, len = arr.length; i < len; ++i)
        if (location.pathname.indexOf(arr[i]) != -1) arr[i] += " class=checked";

      i18n.run(
        $(selector)
          .addClass("container header")
          .html(
            "<div>" +
              "    <a href=" +
              arr[0] +
              " data-i18n=header/new-wallet></a>" +
              "    <a href=" +
              arr[1] +
              " data-i18n=header/send></a>" +
              // "    <a href=" + arr[2] + " data-i18n=header/send-offline></a>" +
              // "    <a href=" + arr[3] + " data-i18n=header/view></a>" +
              "    <a href=" +
              arr[4] +
              " data-i18n=header/refresh_button></a>" +
              //"    <a href=" + arr[5] + " data-i18n=header/contract></a>" +
              "</div>" +
              "<hr>"
          )
      );
    }

    function iconAddress(selector) {
      var $selector = $(selector);

      $selector.each(each);
      i18n.run($selector);

      function each(i, o) {
        var $o = $(o),
          attrDisabled = $o.attr("data-disabled") != undefined,
          attrId = $o.attr("data-id");

        $o.addClass("icon-address")
          .html(
            '<input class="address form-control"' +
              // do not validate when disabled
              (attrDisabled
                ? " disabled"
                : ' data-i18n=placeholder/addr data-validate-order-matters="required lengthEq35"') +
              (attrId ? " id=" + attrId : "") +
              "><canvas class=placeholder></canvas>"
          )
          .on("input", "input", onInput);
      }

      function onInput(e) {
        var val = e.target.value,
          $canvas = $(this).closest(".icon-address").find("canvas");

        if (val.length == 35)
          $canvas.replaceWith(
            blockies.create({
              seed: val.toLowerCase(),
            })
          );
        else if (!$canvas.hasClass("placeholder"))
          $canvas.replaceWith("<canvas class=placeholder></canvas>");
      }
    }

    function logoMain(selector) {
      var i,
        len,
        apiList,
        langList,
        apiPrefix,
        sApiButtons,
        sApiText,
        lang,
        sLangButtons;

      // apiPrefix
      apiList = [
        {
          chainId: 1,
          name: "Mainnet",
          url: "https://mainnet.nebulas.io",
          currencies: {
            NAS: "",
            ATP: MAIN_NET_ATP_CONTRACT_ADDR,
            NAT: MAIN_NET_NAT_CONTRACT_ADDR,
            NAX: MAIN_NET_NAX_CONTRACT_ADDR,
            nUSDT: MAIN_NET_nUSDT_CONTRACT_ADDR,
            WNAS: MAIN_NET_WNAS_CONTRACT_ADDR,
            "NAS-NAX LP": MAIN_NET_NAS_NAX_LP_ADDR,
            "NAS-nUSDT LP": MAIN_NET_NAS_nUSDT_LP_ADDR,
            "NAX-nUSDT LP": MAIN_NET_NAX_nUSDT_LP_ADDR,
            "NAS-NAX LP V1": MAIN_NET_NAS_NAX_LP_ADDR_V1,
            "NAS-nUSDT LP V1": MAIN_NET_NAS_nUSDT_LP_ADDR_V1,
            "NAX-nUSDT LP V1": MAIN_NET_NAX_nUSDT_LP_ADDR_V1,

          },
        },
        {
          chainId: 1001,
          name: "Testnet",
          url: "https://testnet.nebulas.io",
          currencies: {
            NAS: "",
            ATP: TEST_NET_ATP_CONTRACT_ADDR,
            NAT: TEST_NET_NAT_CONTRACT_ADDR,
            NAX: TEST_NET_NAX_CONTRACT_ADDR,
            nUSDT: TEST_NET_nUSDT_CONTRACT_ADDR,
            "NAS-NAX LP": TEST_NET_NAS_NAX_LP_ADDR,
            "NAS-nUSDT LP": TEST_NET_NAS_nUSDT_LP_ADDR,
            "NAX-nUSDT LP": TEST_NET_NAX_nUSDT_LP_ADDR,
          },
        },
        {
          chainId: 100,
          name: "Local Nodes",
          url: "http://127.0.0.1:8685",
          currencies: { NAS: "" },
        },
      ];

      apiPrefix = (localSave.getItem("apiPrefix") || "").toLowerCase();

      var p = localSave.getItem("apiPrefixListAppend");
      if (!p) {
        p = [];
      } else {
        p = JSON.parse(p);
      }
      for (var ix = 0; ix < p.length; ix++) {
        var l = getLocation(p[ix]);
        var nn = l.hostname + ":" + l.port;
        apiList.push({ chainId: 100, name: nn, url: p[ix] });
      }

      sApiButtons = "";

      for (
        i = 0, len = apiList.length;
        i < len && apiList[i].url != apiPrefix;
        ++i
      );

      i == len && (i = 0);
      localSave.setItem("apiPrefix", (apiPrefix = apiList[i].url));
      localSave.setItem("chainId", apiList[i].chainId);
      localSave.setItem("currencies", JSON.stringify(apiList[i].currencies));
      sApiText = apiList[i].name;

      for (i = 0, len = apiList.length; i < len; ++i)
        sApiButtons +=
          '<button class="' +
          (apiPrefix == apiList[i].url ? "active " : "") +
          'dropdown-item" data-i=' +
          i +
          ">" +
          apiList[i].name +
          "</button>";

      //add custom selecter
      sApiButtons +=
        '<div><input id="customrpc" placeholder="Rpc..." style="width:75px;margin:0 10px" type="custom rpc" /><button  id="add_customrpc">Add</button></div>';
      //
      // lang

      langList = i18n.supports();
      lang = (localSave.getItem("lang") || "").toLowerCase();
      sLangButtons = "";

      for (i = 0, len = langList.length; i < len && langList[i] != lang; ++i);

      i == len && (i = 0);
      localSave.setItem("lang", (lang = langList[i]));

      for (i = 0, len = langList.length; i < len; ++i)
        sLangButtons +=
          '<button class="' +
          (langList[i] == lang ? "active " : "") +
          'dropdown-item" data-lang=' +
          langList[i] +
          ">" +
          i18n.langName(langList[i]) +
          "</button>";

      //
      // $.html

      i18n.run(
        $(selector)
          .addClass("container logo-main")
          .html(
            "<div class=row>" +
              "    <div class=col></div>" +
              "    <div class=col>" +
              "        <div class=dropdown>" +
              '            <button class="btn dropdown-toggle" id=logo-main-dropdown-1 data-toggle=dropdown aria-haspopup=true aria-expanded=false>' +
              sApiText +
              "</button>" +
              '            <div class="dropdown-menu api" aria-labelledby=logo-main-dropdown-1>' +
              sApiButtons +
              "            </div>" +
              "        </div>" +
              "        <div class=dropdown>" +
              '            <button class="btn dropdown-toggle" id=logo-main-dropdown-2 data-toggle=dropdown aria-haspopup=true aria-expanded=false data-i18n=name></button>' +
              '            <div class="dropdown-menu lang" aria-labelledby=logo-main-dropdown-2>' +
              sLangButtons +
              "            </div>" +
              "        </div>" +
              "    </div>" +
              "</div>"
          )
          .on("click", "#add_customrpc", onClickAddRpc)
          .on("click", ".api > button:not(#add_customrpc)", onClickMenuApi)
          .on("click", ".lang > button", onClickMenuLang),
        lang
      );

      function onClickMenuApi() {
        var $this = $(this);

        if (!$this.hasClass("active")) {
          localSave.setItem("apiPrefix", apiList[$this.data("i")].url);
          location.reload();
        }
      }
      function onClickMenuLang() {
        var $this = $(this);

        if (!$this.hasClass("active")) {
          localSave.setItem("lang", $this.data("lang"));
          i18n.run();
          $this.parent().children().removeClass("active");
          $this.addClass("active");
        }
      }
      function onClickAddRpc() {
        var val = $("#customrpc").val();
        if (!val) return false;
        var l = getLocation(val);
        localSave.setItem("apiPrefix", val);
        var p = localSave.getItem("apiPrefixListAppend");
        if (!p) {
          p = [];
        } else {
          p = JSON.parse(p);
        }
        p.push(val);
        localSave.setItem("apiPrefixListAppend", JSON.stringify(p));
        apiList.push({
          chainId: 100,
          name: l.hostname + ":" + l.port,
          url: val,
        });
        location.reload();
      }
    }
    function getLocation(href) {
      var l = document.createElement("a");
      l.href = href;
      return l;
    }
    function numberComma(selector) {
      var $selector = $(selector);

      $selector.each(each);
      $selector.children("input").trigger("input");
      i18n.run($selector);

      function each(i, o) {
        var $o = $(o),
          attrDisabled = $o.attr("data-disabled") != undefined,
          attrI18n = $o.attr("data-data-i18n"),
          attrId = $o.attr("data-id"),
          attrValidate = $o.attr("data-validate"),
          attrValue = $o.attr("data-value");
        attrCurrencySelector = $o.attr("data-currency-selector") != undefined;

        var currency_items = "";
        var currencies = getCurrencies();
        for (var c in currencies) {
          currency_items +=
            '<li><a class="dropdown-item currency ' +
            (uiBlock.currency == c ? "active" : "") +
            '" href="#">' +
            c +
            "</a></li>";
        }

        $o.addClass("number-comma")
          .html(
            "<input class=form-control" +
              (attrDisabled ? " disabled" : "") +
              (attrI18n ? " data-i18n=" + attrI18n : "") +
              (attrId ? " id=" + attrId : "") +
              (attrValidate
                ? ' data-validate-order-matters="' + attrValidate + '"'
                : "") +
              (attrValue ? " value=" + attrValue : "") +
              ">" +
              (attrCurrencySelector && getCurrencyCount() > 1
                ? '<span class="dropdown"><a href="#" class="dropdown-toggle current-currency" data-toggle="dropdown">NAS<b class="caret"></b></a>' +
                  '<ul class="dropdown-menu">' +
                  currency_items +
                  "</ul>" +
                  "</span>"
                : "<div></div>")
          )
          .on("input", "input", onInput)
          .on("click", ".currency", onCurrencyClick);
      }

      function onInput() {
        var $this = $(this),
          $parent = $this.parent();
        if (
          $parent.attr("data-currency-selector") == undefined ||
          getCurrencyCount() == 1
        ) {
          $parent
            .children("div")
            .text("≈ " + toSi($this.val(), $parent.attr("data-unit")));
        }
      }

      function onCurrencyClick() {
        var $this = $(this),
          $parent = $this.parent();
        var c = $this.text();
        if (c == uiBlock.currency) {
          return;
        }
        uiBlock.currency = c;
        onCurrencyChanged();
        $(".current-currency").each(function () {
          $(this).text(c);
        });
        $(".currency").removeClass("active");
        $this.addClass("active");
        var inputs = $(".number-comma input");
        inputs.trigger("input");
      }
    }

    // this block should not add 'container' class by it self, should let user add it
    function selectWalletFile(selector, callback) {
      var mAccount, mFileJson;

      i18n.run(
        $(selector)
          .addClass("select-wallet-file")
          .html(
            "<p data-i18n=swf/name></p>" +
              '<label class="file empty"><span data-i18n=swf/button></span><input type=file></label>' +
              '<label class="hide pass"><span data-i18n=swf/good></span><input type=password></label>' +
              '<button class="btn btn-block" data-i18n=swf/unlock></button>'
          )
          .on("click", "button", onClickUnlock)
          .on("keyup", "input[type=password]", onKeyUpPassword)
          .on(
            {
              change: onChangeFile,
              click: onClickFile,
            },
            "input[type=file]"
          )
      );

      function onChangeFile(e) {
        // read address from json file content, not it's file name
        var $this = $(this),
          file = e.target.files[0],
          fr = new FileReader();

        // https://stackoverflow.com/questions/857618/javascript-how-to-extract-filename-from-a-file-input-control
        // this.value.split(/[\\|/]/).pop()
        $("<span>" + file.name + "</span>").replaceAll(
          $this.closest(".select-wallet-file").find("label.file > span")
        );
        fr.onload = onload;
        fr.readAsText(file);

        // open file, parse json string, create account from address, then it's a success
        function onload(e) {
          try {
            mFileJson = JSON.parse(e.target.result);
            mAccount = Account.fromAddress(mFileJson.address);
            $this
              .closest(".select-wallet-file")
              .find("label.pass")
              .removeClass("hide");
            $this
              .closest(".select-wallet-file")
              .find("label.file")
              .removeClass("empty");
          } catch (e) {
            $this
              .closest(".select-wallet-file")
              .find("label.file")
              .addClass("empty");
            bootbox.dialog({
              backdrop: true,
              onEscape: true,
              message: e.message,
              size: "large",
              title: "Error",
            });
          }
        }
      }

      function onClickFile() {
        // clear file input
        // https://stackoverflow.com/questions/12030686/html-input-file-selection-event-not-firing-upon-selecting-the-same-file
        this.value = null;
      }

      function onKeyUpPassword(e) {
        e.key == "Enter" &&
          $(this).closest(".select-wallet-file").find("button").click();
      }

      function onClickUnlock() {
        var $swf = $(this).closest(".select-wallet-file");

        if (mFileJson)
          if (typeof callback == "function")
            callback(
              $swf[0],
              mFileJson,
              mAccount,
              $swf.find("input[type=password]").val()
            );
          else
            console.log(
              "uiBlock/selectWalletFile - 'callback' parameter not specified, cannot pass result"
            );
        else {
          bootbox.dialog({
            backdrop: true,
            onEscape: true,
            message: "<span data-i18n=swf/modal/select/message></span>",
            size: "large",
            title: "<span data-i18n=swf/modal/select/title></span>",
          });

          i18n.run($(".bootbox.modal"));
        }
      }
    }
  }

  function isOnScreen(el) {
    // https://stackoverflow.com/questions/20644029/checking-if-a-div-is-visible-within-viewport-using-jquery

    var win = $(window),
      $el = $(el),
      bounds = $el.offset(),
      viewport = {
        top: win.scrollTop(),
        left: win.scrollLeft(),
      };

    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();

    bounds.right = bounds.left + $el.outerWidth();
    bounds.bottom = bounds.top + $el.outerHeight();

    return !(
      viewport.right < bounds.left ||
      viewport.left > bounds.right ||
      viewport.bottom < bounds.top ||
      viewport.top > bounds.bottom
    );
  }

  function numberAddComma(n) {
    // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript

    var parts = (+n || 0).toString().split(".");

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function toSi(n, unit) {
    // https://en.wikipedia.org/wiki/Metric_prefix
    //        0    1    2    3    4    5    6    7    8
    var si = ["", "k", "M", "G", "T", "P", "E", "Z", "Y"],
      i,
      len;

    n = +n || 0;
    unit = (unit || "").toLowerCase();

    if (unit == "wei") {
      len = 6;
      unit = "Wei";
    } else if (unit == "currency") {
      len = si.length - 1;
      unit = uiBlock.currency;
    } else {
      len = si.length - 1;
      unit = unit.toUpperCase();
    }

    for (i = 0; i < len && n >= 1000; ++i, n /= 1000);

    if (i == len && unit == "Wei")
      for (
        i = 0, len = si.length - 1, unit = "NAS";
        i < len && n >= 1000;
        ++i, n /= 1000
      );

    n = n.toFixed();
    return (i == len ? numberAddComma(n) : n) + " " + si[i] + unit;
  }

  function validate(selector) {
    // these validates performed in order listed in the value of data-validate-order-matters
    // queries inputs on each validateAll call so you can add or remove <input> into selector at any time

    var nebulas = require("nebulas"),
      mRules = {
        eqgt0: function (s) {
          return s > -1;
        },
        gt0: function (s) {
          return s > 0;
        },
        lengthEq35: function (s) {
          return s.length == 35;
        },
        lengthEq64: function (s) {
          return s.length == 64;
        },
        lengthGt8: function (s) {
          return s.length > 8;
        },
        number: function (s) {
          try {
            nebulas.Utils.toBigNumber(s);
            return true;
          } catch (e) {
            return false;
          }
        },
        required: function (s) {
          return s.length != 0;
        },
      };

    selector || (selector = "body");

    // or use focusin/focusout, see
    // https://stackoverflow.com/questions/9577971/focus-and-blur-jquery-events-not-bubbling
    $(selector).on(
      {
        blur: onBlur,
        focus: onFocus,
      },
      "[data-validate-order-matters]"
    );

    return validateAll;

    function onBlur(e) {
      // https://stackoverflow.com/questions/121499/when-a-blur-event-occurs-how-can-i-find-out-which-element-focus-went-to
      // Oriol
      //
      // rel = element currently has focus, validate when
      // - rel is falsy, many cases here, just validate anyway
      // - rel is child of selector
      var rel = e.relatedTarget;

      if (!rel || $(selector).find(rel).length) validateAll();
    }

    function validateAll() {
      var ret = true;

      // doubt - remove all invalid state?
      $("[data-validate-order-matters]").removeClass("invalid").popover("hide");

      $(selector)
        .find("[data-validate-order-matters]")
        .each(function (i, o) {
          var $o = $(o),
            arr,
            i,
            len,
            s = $o.data("validate-order-matters");

          if (s)
            for (
              arr = s.match(/\S+/g) || [], i = 0, len = arr.length;
              i < len;
              ++i
            )
              if (mRules[arr[i]]) {
                if (!mRules[arr[i]](o.value)) {
                  $o.addClass("invalid");

                  // only show popover for first invalid input
                  if (ret) {
                    ret = false;
                    $o.data("index", arr[i]);

                    $o.popover({
                      container: "body",
                      content: function () {
                        return i18n
                          .run(
                            $(
                              "<div><span data-i18n=validate/" +
                                $(this).data("index") +
                                "></span></div>"
                            )
                          )
                          .html();
                      },
                      html: true,
                      placement: "auto",
                      trigger: "manual",
                    }).popover("show");

                    setTimeout(function () {
                      // unlike parameterless scrollIntoView() call, this call has no visual effect if called synchronously, don't know why
                      isOnScreen(o) || o.scrollIntoView({ behavior: "smooth" });
                    });
                  }
                  break;
                }
              } else
                console.log(
                  "validateAll - unknown rule -",
                  arr[i] + ", ignored"
                );
        });

      return ret;
    }

    function onFocus() {
      validateAll();
      $(this).removeClass("invalid").popover("hide");
    }
  }
})();

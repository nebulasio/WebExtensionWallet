
'use strict';

var msgCount = 0;
//var unapprovedTxCount = 0;
var unapprovedTxs = [];

var AccAddress ;
var AccPubKey;
var AccPubKeyString;

var nebulas = require("nebulas");
var neb = new nebulas.Neb();
var gAccount;
var network ,chainId;

//var sourceName = 'NasExtWallet';

function resetNeb() {
    network = localSave.getItem("apiPrefix") || "https://testnet.nebulas.io"
    chainId = localSave.getItem("chainId" ) || 1001

    neb.setRequest(new nebulas.HttpRequest(network));
}


function rpc_call(data, cb) {
    if (!AccAddress) {
        alert("please import your wallet file into extension")
        cb("error: please import wallet file")
        return
    }
    neb.api.getAccountState(AccAddress)
        .then(function (accStat) {
            //var balance = nebulas.Unit.fromBasic(accStat.balance, "nas"),
            //var nonce = parseInt(accStat.nonce) + 1;
            return neb.api.call({
                from: AccAddress,
                to: data.to,
                value: data.value,
                nonce: parseInt(accStat.nonce) + 1,
                gasPrice: "1000000",
                gasLimit: "200000",
                contract: data.contract
            })
        })
        .then(function (resp) {
            cb(resp)
        })
        .catch(function (err) {
            console.log("rpc call error: " + JSON.stringify(err))
            cb(err.message || err)
        });
}


// massage from web page format is basically like this:
// {
// 	"src": "contentScript",
// 	"dst": "background",
// 	"data": {
// 		"target": "contentscript",
// 		"data": {
// 			"to": "n1vHgvjw6VPPa4P2MQ6xTPdanbbVYPfGQeu",
// 			"value": "0",
// 			"contract": {
// 				"function": "balanceOf",
// 				"args": "[\"n1JmhE82GNjdZPNZr6dgUuSfzy2WRwmD9zy\"]"
// 			}
// 		},
// 		"method": "neb_call"
// 	}
// }
//receive msg from ContentScript and popup.js
chrome.runtime.onConnect.addListener(function(port) {
	console.log("Connected ....." + port.name );

	port.onMessage.addListener(function(msg) {

        msgCount ++;
        console.log("msgCount:" + msgCount );
        console.log("msg listened: " + JSON.stringify(msg));

		if (msg.src === 'contentScript'){       //message from webpage(DApp page)
		    if (!msg.data)
		        return;
		    if (msg.data.method === "neb_sendTransaction"){
                cacheTx(msg.data);
            }
            else if (msg.data.method === "neb_call"){
                rpc_call(msg.data.data,function (resp) {
                    port.postMessage({
			            //source: sourceName,
                        neb_call: resp
                    })
                })
            }
            else if (msg.data.method === "getAccount")
                port.postMessage({
                    //source: sourceName,
                    account: AccAddress,
                    accountPubKey: AccPubKey,
                    accountPubKeyString: AccPubKeyString
                })
        }
        //**********************************
        else if (msg.src === 'popup'){      //message from extension popup page
            if (!msg.data)
                return;
            if (!!msg.data.AccAddress){
                AccAddress = msg.data.AccAddress;
                AccPubKey = msg.data.AccPubKey;
                AccPubKeyString = msg.data.AccPubKeyString;
            }
            else if(!!msg.data.changeNetwork){
                if(msg.data.changeNetwork !== network){
                    resetNeb();
                }
            }
            else if (!!msg.data.newWallet){     //user changed wallet, update the wallet right now
                restoreAccount();
            }
            else if (!!msg.data.getNextTx){
                port.postMessage({
	                //source: sourceName,
                    unapprovedTxs : unapprovedTxs
                })
            }
            else if (!!msg.data.rejectAll){
                unapprovedTxs.splice(0,unapprovedTxs.length);
                updateBadgeText();
            }
            else if (!!msg.data.generate || !!msg.data.reject){
                unapprovedTxs.pop();
                updateBadgeText();
            }
            else if (!!msg.data.txhash){
                console.log("txhash: " + JSON.stringify(msg.data.txhash));
                //if has serial number, then this message is send from nebpay,
                if(msg.serialNumber){
                    forwardMsgToPage(msg.serialNumber,msg.data.txhash);
                    return
                }
                chrome.tabs.query({}, function(tabs){       //send tx receipt back to web page
                    for (var i=0; i<tabs.length; ++i) {
                        chrome.tabs.sendMessage(tabs[i].id, {txhash: msg.data.txhash});
                    }
                });

            }
            else if (!!msg.data.receipt){
                console.log("Receipt: " + JSON.stringify(msg.data.Receipt));
                chrome.tabs.query({}, function(tabs){       //send tx receipt back to web page
                    for (var i=0; i<tabs.length; ++i) {
                        chrome.tabs.sendMessage(tabs[i].id, {receipt: msg.data.Receipt});
                    }
                });

            }
            else if (!!msg.data.default) { //some message about this serial-number
                console.log("txhash: " + JSON.stringify(msg.data.default));
                if (msg.serialNumber) {
                    forwardMsgToPage(msg.serialNumber, msg.data.default);
                }
            }

        }
	});
});

//forward msg from popup-page to Dapp-page(Page ID has been recorded)
function forwardMsgToPage(serialNumber,resp) {
    var senderInfo = messagesFromPage[serialNumber];
    if(senderInfo){
        chrome.tabs.sendMessage(senderInfo.sender.id,
            {
                "src" : "background",
                "logo" : "nebulas",
                "serialNumber" : serialNumber,
                "resp" : resp
            });

        //delete messagesFromPage[serialNumber];
    }

}
//received a sendTransaction message
function cacheTx(txData) {
    unapprovedTxs.push(txData)
    console.log("unapprovedTxCount:" + unapprovedTxs.length);
    updateBadgeText()
    chrome.windows.create({'url': 'html/sendNas.html', 'type': 'popup', height: 1024, width:420}, function(window) {
    });
}

function updateBadgeText(){
    if(unapprovedTxs.length === 0)
        chrome.browserAction.setBadgeText({text:''});
    else
        chrome.browserAction.setBadgeText({text: unapprovedTxs.length.toString()});
}

//initiallize: updateBadgeText()
document.addEventListener("DOMContentLoaded", function() {
    console.log("background page loaded...")
    updateBadgeText()
    resetNeb()
    restoreAccount()
});

function restoreAccount() {
    chrome.storage.local.get(['keyInfo'], function(result) {
        console.log('keyInfo Value is :' + JSON.stringify(result.keyInfo));
        result = JSON.parse(result.keyInfo)

        if(!!result){
            console.log("unlockFile:")
            UnlockFile(result.fileJson, result.password)
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
        AccPubKey = account.getPublicKey();
        AccPubKeyString = account.getPublicKeyString();

    } catch (e) {
        // this catches e thrown by nebulas.js!account
        console.log("unlockFile error:" + JSON.stringify(e))

    }
}

//use Object messagesFromPage as map,
// used to save the message from nebpay, key= serialNumber, value=
var messagesFromPage = {};

//listen msg from contentscript (nebpay -> contentscript -> background)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + JSON.stringify(sender.tab) :
            "from the extension");

        console.log("request: " + JSON.stringify(request));

        if(request.logo === "nebulas") {
            messagesFromPage[request.params.serialNumber] = {sender: sender.tab, params: request.params};

            var type = request.params.pay.payload.type;
            if (type === "simulateCall"){       //
                var data = {
                    "to":request.params.pay.to,
                    "value":request.params.pay.value,
                    "contract":{
                        "function":request.params.pay.payload.function,
                        "args":request.params.pay.payload.args
                    }
                }
                rpc_call(data,function (resp) {
                    forwardMsgToPage(request.params.serialNumber,resp)
                    // sendResponse({
                    //     "src": "background",
                    //     "logo": "nebulas",
                    //     "serialNumber": request.params.serialNumber,
                    //     "resp": resp
                    // })
                })
            }else if (type === "binary" ||
                type === "deploy" ||
                type === "call" ){
                var txData = {
                    "to":request.params.pay.to,
                    "value":request.params.pay.value,
                    "gasPrice":request.params.pay.gasPrice,
                    "gasLimit":request.params.pay.gasLimit,
                    "serialNumber":request.params.serialNumber,
                    "callback":request.params.callback
                };
                if(type === "deploy")
                    txData.contract ={
                        "source":request.params.pay.payload.source,
                        "sourceType":request.params.pay.payload.sourceType,
                        "args":request.params.pay.payload.args
                    };
                if(type === "call")
                    txData.contract = {
                        "function":request.params.pay.payload.function,
                        "args":request.params.pay.payload.args
                    };
                cacheTx({data:txData});
            }else {
                sendResponse({
                    "serialNumber": request.params.serialNumber, "resp": "undefined interface"
                })
            }
        }

    });

//details.reason === 'install' || details.reason === 'update'
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install' || details.reason === 'update') {
        chrome.tabs.create({url: 'html/welcome.html'})
    }
})

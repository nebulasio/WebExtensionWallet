// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var msgCount = 0;
//var unapprovedTxCount = 0;
var unapprovedTxs = [];

var AccAddress ;

var nebulas = require("nebulas");
var neb = new nebulas.Neb();
var gAccount;
var network ,chainId;

function resetNeb() {
    network = (localSave.getItem("network") || "").toLowerCase();
    chainId = localSave.getItem("chainId" ) || 1001
    neb.setRequest(new nebulas.HttpRequest(network || "https://testnet.nebulas.io/"));
}


function rpc_call(data, cb) {
    getAccountStat(AccAddress,function (accStat) {
        neb.api.call({
            from: AccAddress,
            to: data.to,
            value: data.value,
            nonce: parseInt(accStat.nonce) + 1,
            gasPrice: "1000000",
            gasLimit: "200000",
            contract: data.contract
        })
        .then(function (resp) {
            cb(resp)
        })
        .catch(function (err) {
            console.log("rpc call error: " + JSON.stringify(err))
            cb(err)
        });
    })

}

function getAccountStat(acc, callback) {
    // prepare nonce
    neb.api.getAccountState(acc)
        .then(function (resp) {
            //var balance = nebulas.Unit.fromBasic(resp.balance, "nas"),
            //var nonce = parseInt(resp.nonce) + 1;
            callback(resp);
        })
        .catch(function (err) {
            console.log("get account state error" + err.toString())
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
                unapprovedTxs.push(msg.data)
                console.log("unapprovedTxCount:" + unapprovedTxs.length);
                updateBadgeText()
                chrome.windows.create({'url': 'html/sendNas.html', 'type': 'popup', height: 1024, width:420}, function(window) {
                });
            }
            else if (msg.data.method === "neb_call"){
                rpc_call(msg.data.data,function (resp) {
                    port.postMessage({
                        neb_call: resp
                    })
                })
            }
            else if (msg.data.method === "getAccount")
                port.postMessage({
                    account: AccAddress
                })
        }
        //**********************************
        else if (msg.src === 'popup'){      //message from extension popup page
            if (!msg.data)
                return;
            if (!!msg.data.AccAddress){
                AccAddress = msg.data.AccAddress;
            }
            else if(!!msg.data.network){
                if(msg.data.network !== network){
                    localSave.setItem("network", msg.data.network);
                    localSave.setItem("chainId", msg.data.chainId);
                    //location.reload(true)
                    resetNeb();
                }
            }
            else if (!!msg.data.getNextTx){
                port.postMessage({
                    unapprovedTxs : unapprovedTxs
                })
            }
            else if (!!msg.data.generate || !!msg.data.reject){
                unapprovedTxs.pop();
                updateBadgeText();
            }
            else if (!!msg.data.Receipt){
                console.log("Receipt: " + JSON.stringify(msg.data.Receipt));
                chrome.tabs.query({}, function(tabs){       //send tx receipt back to web page
                    for (var i=0; i<tabs.length; ++i) {
                        chrome.tabs.sendMessage(tabs[i].id, {receipt: msg.data.Receipt});
                    }
                });

            }

        }
	});
});

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

    } catch (e) {
        // this catches e thrown by nebulas.js!account
        console.log("unlockFile error:" + JSON.stringify(e))

    }
}
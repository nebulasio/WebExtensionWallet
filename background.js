// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var msgCount = 0;
var unapprovedTxCount = 0;
var unapprovedTxs = [];

var AccAddress ;

//this might useless,
/*
var bg_port = chrome.runtime.connect({name: "background"});
bg_port.postMessage({src: "background",dst:"all"});
bg_port.onMessage.addListener(function(msg) {
    console.log("msg listened by bg_port: " + JSON.stringify(msg));

});
*/

/*
massage format is basically like this:
{
	src: "",
	dst: "",
	data: {}
}
*/

//receive msg from ContentScript and popup.js
chrome.runtime.onConnect.addListener(function(port) {
	console.log("Connected ....." + port.name );

	port.onMessage.addListener(function(msg) {

        msgCount ++;
        console.log("msgCount:" + msgCount );
        console.log("msg listened: " + JSON.stringify(msg));

		if (msg.src === 'contentScript'){       //message from webpage(DApp page)
		    if(!msg.data)
		        return;
		    if(msg.data.method === "neb_sendTransaction"){
                unapprovedTxs.push(msg.data)
                console.log("unapprovedTxCount:" + unapprovedTxs.length);
                updateBadgeText()
                chrome.windows.create({'url': 'html/sendNas.html', 'type': 'popup', height: 1024, width:420}, function(window) {
                });
            }
            else if(msg.data.method === "getAccount")
                port.postMessage({
                    account: AccAddress
                })
        }
        else if (msg.src === 'popup'){      //message from extension popup page
            if(!msg.data)
                return;
            if(!!msg.data.AccAddress){
                AccAddress = msg.data.AccAddress;
            }
            else if(!!msg.data.getNextTx){
                port.postMessage({
                    unapprovedTxs : unapprovedTxs
                })
            }
            else if(!!msg.data.generate || !!msg.data.reject){
                unapprovedTxs.pop();
                updateBadgeText();
            }
            else if(!!msg.data.Receipt){
                console.log("Receipt: " + JSON.stringify(msg.data.Receipt));
                chrome.tabs.query({}, function(tabs){
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
});

//just for debug, listen to port disconnect event
chrome.runtime.Port.onDisconnect.addListener(function(message) {
    console.log("Port disconnected: " + JSON.stringify(message))
});


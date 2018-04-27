# WebExtensionWallet

### 1. Install

(1) clone the repo into your local environment.

  ![](resources/download-from-fithub.png)

(2) Open your chrome browser, go to chrome://extensions/ and check the box for Developer mode in the top right.

(3) Click the Load unpacked extension button and select your local repo folder for your extension.

  ![](resources/add-chrome-extension.png)


### 2. Brief introduction of using our ExtensionWallet
```
(1) In tab `New-Wallet`, you can create your own wallet, and download the keystore files.
(2) In tab `Send-TX`, you can import your keystore file, and then your account will be stored within the extension.
(3) After your account keyfile is imported, you can send NAS to other account address.
(4) After a transaction is sent, you got the transaction hash shown at the bottom of extension page.
(5) Click the transaction hash in tab `Send-TX` to check transaction status
(6) Another way to check your transaction status is to copy your transaction hash to `check-TX` to view the result.
```

### 3. Instructions on how to use WebExtensionApp in your webapp

When developing your Dapp page, you can use `postMessage` API to communicate with ExtensionWallet, and use `window.addEventListener` to listen the message answer. Just as the example blew.

To send a transaction with extensionWallet, you should use `postMessage` to send a message as blew:
```js
window.postMessage({
        "target": "contentscript", //
        "data":{                //
            "to": to,
            "value": amount
        },
        "method": "neb_sendTransaction",
    }, "*");
```
To call a smart contract function with extensionWallet, you should use `postMessage` to send a message as blew:
```js
window.postMessage({
    "target": "contentscript",
    "data":{
        "to": to,
        "value": "0",
        "contract":{  //"contract" is a parameter used to deploy a contract or call a smart contract function
            "function":func,
            "args":para
        }
    },
    "method": "neb_sendTransaction",
}, "*");
```
These two example above is similar with [Nebulas rpc](https://github.com/nebulasio/wiki/blob/master/rpc_admin.md#sendtransaction) interface, we will add all the rpc interfaces to ExtensionWallet.

And you can use test/TestPage.html to take a test.



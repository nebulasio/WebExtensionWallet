function setupInjection(file) {
  var s = document.createElement("script")
  s.src = chrome.extension.getURL(file)
  var container = document.head || document.documentElement
  container.insertBefore(s, container.children[0])
  s.onload = function() {
    s.remove()
  }
}

var file = "inpage.js"
setupInjection(file)

var port = chrome.runtime.connect({ name: "contentscript" })
port.postMessage({ src: "contentScript", dst: "background" })

port.onMessage.addListener(function(msg) {
  window.postMessage(
    {
      //forward msg from background to webpage
      data: msg
    },
    "*"
  )
})

//message from background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.logo === "nebulas") {
    request.src = "content"
    window.postMessage(request, "*") //forward msg from background to webpage
    return
  }

  window.postMessage(
    {
      //forward msg from background to webpage
      data: request
    },
    "*"
  )
})

// Event listener, msg from web-page
window.addEventListener("message", function(e) {
  if (e.data.target === "contentscript") {
    port.postMessage({
      //forward msg from webpage to background, [just for compatible]
      src: "contentScript",
      dst: "background",
      data: e.data
    })
  }

  if (e.data.logo === "nebulas" && e.data.src === "nebPay") {
    //msg from nebPay
    e.data.src = "content"
  }
})

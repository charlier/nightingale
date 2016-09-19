class RecorderProxy {
  constructor() {
    this.active = null;
  }

  start(url) {
    chrome.tabs.getSelected(null, tab => {
      chrome.runtime.sendMessage({action: "start", recorded_tab: tab.id, start_url: url});
    });
  }

  stop() {
    chrome.runtime.sendMessage({action: "stop"});
  }

  open(url, callback) {
    chrome.tabs.getSelected(null, tab => {
      chrome.tabs.sendMessage(tab.id, {action: "open", 'url': url}, callback);
    });
  }
}

let startUrl = '';

class RecorderUI {
  constructor() {
    this.recorder = new RecorderProxy();
    chrome.runtime.sendMessage({action: "get_status"}, response => {
      if (response.active) {
        ui.set_started();
      } else {
        if (!response.empty) {
          ui.set_stopped();
        }
        chrome.tabs.getSelected(null, tab => {
          startUrl = tab.url;
        });
      }
    });
  }

  start() {
    const url = startUrl;
    if (url == "") {
      return false;
    }
    ui.set_started()
    ui.recorder.start(url);

    return false;
  }

  set_started() {
    let e = document.getElementById("bstop");
    e.style.display = '';
    e.onclick = ui.stop;
    e.value = "Stop Recording";
    e = document.getElementById("bgo");
    e.style.display = 'none';
    e = document.getElementById("bexport");
    e.style.display = 'none';
  }

  stop() {
    ui.set_stopped();
    ui.recorder.stop();
    return false;
  }

  set_stopped() {
    let e = document.getElementById("bstop");
    e.style.display = 'none';
    e = document.getElementById("bgo");
    e.style.display = '';
    e = document.getElementById("bexport");
    e.style.display = '';
  }

  export() {
    chrome.tabs.create({url: "./nightingale.html"});
  }
}

var ui;

// bind events to ui elements
window.onload = () => {
  document.querySelector('input#bgo').onclick=() => {ui.start(); return false;};
  document.querySelector('input#bstop').onclick=() => {ui.stop(); return false;};
  document.querySelector('input#bexport').onclick=() => {ui.export(); return false;};
  ui = new RecorderUI();
}

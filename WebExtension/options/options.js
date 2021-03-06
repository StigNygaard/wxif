function setDisplayMode(dispMode) {
  if (context.prefersDark(dispMode)) {
    document.body.classList.replace("light", "dark"); // If light, then swap with dark
    document.body.classList.add("dark"); // But also set dark if light wasn't set
  } else {
    document.body.classList.replace("dark", "light"); // If dark, then swap with light
    document.body.classList.add("light"); // But also set light if dark wasn't set
  }
}

function updateDeepSearchSize() {
  var inp = document.getElementById("deepSearchBiggerLimit");
  var out = document.getElementById("deepSearchBiggerLimitEx");
  out.textContent = "";
  var d = parseInt(inp.value);
  if (!Number.isNaN(d)) {
    d = Math.sqrt(d);
    if (!Number.isNaN(d)) {
      d = Math.floor(d);
      out.textContent = d + "x" + d;
    }
  }
}

function saveOptions(e) {
  e.preventDefault();
  context.setOptions({
    dispMode: document.forms[0].dispMode.value,
    popupPos: document.forms[0].popupPos.value,
    deepSearchBiggerLimit: document.querySelector("form#xIFroptions #deepSearchBiggerLimit").value,
    mlinkOSM: document.querySelector("form#xIFroptions #mlinkOSM").checked,
    mlinkGoogle: document.querySelector("form#xIFroptions #mlinkGoogle").checked,
    mlinkBing: document.querySelector("form#xIFroptions #mlinkBing").checked,
    mlinkMapQuest: document.querySelector("form#xIFroptions #mlinkMapQuest").checked,
    mlinkHere: document.querySelector("form#xIFroptions #mlinkHere").checked,
    mlinkFlickr: document.querySelector("form#xIFroptions #mlinkFlickr").checked
  }).then(
    () => {setDisplayMode(document.forms[0].dispMode.value); updateDeepSearchSize()}, (error) => {context.error('Failed saving xIFr options: ' + error)}
  );
}

function handlerInitOptionsForm(options) {
  setDisplayMode(options["dispMode"]);
  [...document.forms[0].elements].forEach((input) => {
    if (input.type === "radio" && options[input.name] === input.value) {
      input.checked = true;
    } else if (input.type === "checkbox" && options[input.value] !== undefined) {
      input.checked = options[input.value];
    } else if (input.type === "text" && options[input.id] !== undefined) {
      input.value = options[input.id];
    }
  });
  updateDeepSearchSize();
  // save on input event:
  document.querySelector("form#xIFroptions").addEventListener("input", saveOptions);
}

function initializeOptionsPage() {
  document.querySelector('div#xIFroptionspage #verstr').textContent = browser.runtime.getManifest().version;
  if (context.isFirefox()) {
    document.body.classList.add("isFirefox");
  }
  if (context.supportsDeepSearch()) {
    document.body.classList.add("supportsDeepSearch");
  }
  context.getOptions().then(handlerInitOptionsForm);
}

window.addEventListener("DOMContentLoaded", initializeOptionsPage);

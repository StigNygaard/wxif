function createRichElement(tagName, attributes, ...content) {
  let element = document.createElement(tagName);
  if (attributes) {
    for (const [attr, value] of Object.entries(attributes)) {
      element.setAttribute(attr, value);
    }
  }
  if (content && content.length) {
    element.append(...content);
  }
  return element;
}
/*
// "Linkified text" from text With URLs converted to DOMStrings and Nodes to (spread and) insert with ParentNode.append() or ParentNode.replaceChildren()
function linkifyWithNodeAppendables(str, anchorattributes) { // Needs a better name? :-)
  // Regex inspired from https://www.regextester.com/96146 (Must NOT be too good. Try to avoid things that's not supposed to be an url/webaddress)
  let purl = /((http|https):\/\/)?(?<![@-a-zA-Z0-9.])[a-zA-Z0-9][-a-zA-Z0-9.]{1,249}\.[a-zA-Z][a-zA-Z0-9]{1,62}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/i;  // Negative Lookbehind requires Firefox 78+ (Chrome 62+)
  function mailtoWithNodeAppendables(str, anchorattributes) {
    let pemail = /(mailto:)?([a-zA-Z0-9._-]+@[a-zA-Z0-9][-a-zA-Z0-9.]{1,249}\.[a-zA-Z][a-zA-Z0-9]{1,62})/i;
    let e = str.match(pemail);
    if (e === null) {
      return [str];
    } else {
      if (!anchorattributes) anchorattributes = {};
      let demail = e[0];
      anchorattributes.href = demail.search(/^mailto:/) === -1 ? "mailto:" + demail : demail;
      let begin = str.substring(0,str.search(demail));
      let end = str.substring(begin.length + demail.length);
      return [begin, createRichElement('a', anchorattributes, demail), ...mailtoWithNodeAppendables(end, anchorattributes)]; // recursive
    }
  }
  let a = str.match(purl);
  if (a === null) {
    return [...mailtoWithNodeAppendables(str)];
  } else {
    if (!anchorattributes) anchorattributes = {};
    let durl = a[0].replace(/\.+$/, "");
    anchorattributes.href = durl.search(/^https?:\/\//) === -1 ? "http://" + durl : durl;
    let begin = str.substring(0,str.search(durl));
    let end = str.substring(begin.length + durl.length);
    return [...mailtoWithNodeAppendables(begin), createRichElement('a', anchorattributes, durl), ...linkifyWithNodeAppendables(end, anchorattributes)]; // recursive
  }
}
*/

// "Formatted text" from text with (real or escaped) linebreaks [and from xIFr 2.x: linkified URLs] converted to DOMStrings and Nodes to (spread and) insert with ParentNode.append() or ParentNode.replaceChildren()
function formatWithNodeAppendables(s) { // Needs a better name? :-)
  if (s.indexOf("\\r") > -1) {
    s = s.split("\\n").join("");
  } else {
    s = s.split("\\n").join("\\r");
  }
  s = s.split("\n").join("\\r");
  let lines = s.split("\\r");
  for (let i = lines.length - 1; i > 0; i--) {
    lines.splice(i, 0, document.createElement('br'));
    // lines.splice(i + 1, 1, ...linkifyWithNodeAppendables(lines[i + 1])); // xIF 2.x
  }
  // return [...linkifyWithNodeAppendables(lines[0]), ...lines.slice(1)]; // xIFr 2.x
  return lines;
}
function populate(response) {
  if (response.properties.URL) {
    let image = document.querySelector("#image img");
    if (response.properties.naturalWidth) {
      let w;
      let h;
      if (response.properties.naturalWidth > response.properties.naturalHeight) {
        w = Math.min(200, response.properties.naturalWidth);
        h = Math.round((w / response.properties.naturalWidth) * response.properties.naturalHeight);
      } else {
        h = Math.min(200, response.properties.naturalHeight);
        w = Math.round((h / response.properties.naturalHeight) * response.properties.naturalWidth);
      }
      image.style.width = w + 'px';
      image.style.height = h + 'px';
    }
    image.src = response.properties.URL;
    let url = createRichElement('a', {href: response.properties.URL});
    if (response.properties.URL.startsWith("data:")) {
      document.getElementById("filename").textContent = "[ inline imagedata ]";
      document.getElementById("filename").title = "";
    } else if (response.properties.URL.startsWith("blob:")) {
      document.getElementById("filename").textContent = "[ blob imagedata ]";
      document.getElementById("filename").title = response.properties.URL;
    } else {
      document.getElementById("filename").textContent = (url.pathname.length > 1 ? url.pathname.substring(url.pathname.lastIndexOf("/") + 1) : url.hostname || url.host) || "[ ./ ]";
      document.getElementById("filename").title = response.properties.URL;
    }
    document.getElementById("filename").href = response.properties.URL;
    document.getElementById("imgsize").textContent = response.properties.byteLength;
    document.getElementById("imgsize2").textContent = response.properties.byteLength >= 1048576 ? ((response.properties.byteLength / 1048576).toFixed(2)).toString() + " MB" : ((response.properties.byteLength / 1024).toFixed(2)).toString() + " KB";
    if (response.properties.URL.startsWith("file:")) {
      document.getElementById("contenttype").textContent = "";
      document.getElementById("lastmodified").textContent = "";
    } else {
      document.getElementById("contenttype").textContent = response.properties.contentType;
      document.getElementById("lastmodified").textContent = response.properties.lastModified;
    }
    if (typeof response.properties.naturalWidth === 'number') {
      document.getElementById("dimensions").textContent = response.properties.naturalWidth + "x" + response.properties.naturalHeight + " pixels";
    }
    document.getElementById("dimensions").textContent = response.properties.naturalWidth + "x" + response.properties.naturalHeight + " pixels";
  }
  function addMessages(list, icon, alt) {
    list.forEach(function (item) {
      let msg = createRichElement('i', {}, item);
      let sign = createRichElement('img', {src: icon, alt: alt});
      document.getElementById('messages').appendChild(createRichElement('div', {}, sign, ' ', msg));
    });
  }
  if (response.errors.length > 0 || response.warnings.length > 0 || response.infos.length > 0) {
    addMessages(response.errors, '/icons/error-7-32w.png', '!');
    addMessages(response.warnings, '/icons/warn-32w.png', '!');
    addMessages(response.infos, '/icons/info-32w.png', 'i');
    document.getElementById('messages').style.display = 'block';
  }

  function gpsRowClick(event) {
    event.preventDefault();
    document.body.classList.add('expandGps');
    document.querySelectorAll('.gps.expandable').forEach(
      function(elm) {
        let row = elm.parentNode.parentNode;
        row.removeAttribute('title');
        row.classList.remove('clickable');
        row.removeEventListener("click", gpsRowClick, {capture: true, once: true});
      });
  }
  function softwareRowClick(event) {
    event.preventDefault();
    document.body.classList.add('expandSoftware');
    let elm = document.querySelector('.software.expandable');
    if (elm) {
      let row = elm.parentNode.parentNode;
      row.removeAttribute('title');
      row.classList.remove('clickable');
    }
  }
  function listArrayWithNodeAppendables(arr) { // Inserting linebreaks to get one item pr. line
    let ret = [];
    arr.forEach(function(item) {ret.push(item); ret.push(document.createElement('br'))});
    return ret;
  }
  let table = document.getElementById("data");
  function addDataRow(key_v) {
    if (key_v !== "GPSPureDdLat" && key_v !== "GPSPureDdLon" && key_v !== "AdditionalSoftware" && response.data[key_v].value !== null && response.data[key_v].value !== "") {
      let row = table.insertRow(-1);
      let label = row.insertCell(0);
      let value = row.insertCell(1);
      label.textContent = response.data[key_v].label;
      label.id = key_v + "LabelCell";
      value.textContent = response.data[key_v].value;
      value.id = key_v + "ValueCell";
      // if (["LicenseURL", "CreditLine", "Copyright", "CreatorEmails"].includes(key_v)) {
      //   let text = value.textContent.trim();
      //   value.textContent = ''; // Clear - In Firefox 78+ (and Chrome/Edge 86+) we could use ParentNode.replaceChildren() here ...
      //   value.append(...linkifyWithNodeAppendables(text));  // Text with links
      // } else
      if (["Caption", "UsageTerms", "DocumentNotes", "UserComment", "Comment", "Instructions"].includes(key_v)) {
        let text = value.textContent.trim();
        value.textContent = ''; // Clear - In Firefox 78+ (and Chrome/Edge 86+) we could use ParentNode.replaceChildren() here ...
        value.append(...formatWithNodeAppendables(text));  // Text with linebreaks (and links from xIFr 2.x)
      } else if (key_v === "Keywords") {
        row.classList.add('scsv');
      } else if (key_v === 'GPSLat') {
        value.insertBefore(createRichElement('div', {id: 'maplinks'}), value.firstChild);
        value.insertAdjacentElement("beforeend", createRichElement('span', {class: 'gps expandable'}, document.createElement('br'), response.data['GPSPureDdLat'].value + " (decimal)"));
        row.title = "Click for decimal latitude and longitude values";
        row.classList.add('clickable');
        row.addEventListener("click", gpsRowClick, {capture: true, once: true});
      } else if (key_v === 'GPSLon') {
        value.insertAdjacentElement("beforeend", createRichElement('span', {class: 'gps expandable'}, document.createElement('br'), response.data['GPSPureDdLon'].value + " (decimal)"));
        row.title = "Click for decimal latitude and longitude values";
        row.addEventListener("click", gpsRowClick, {capture: true, once: true});
        row.classList.add('clickable');
      } else if (key_v === "Software" && response.data['AdditionalSoftware'] && response.data['AdditionalSoftware'].value && response.data['AdditionalSoftware'].value.length) {
        value.insertAdjacentElement("afterbegin", createRichElement('span', {class: 'software expandable'}, ...listArrayWithNodeAppendables(response.data['AdditionalSoftware'].value)));
        row.title = "Click for additional software used";
        row.addEventListener("click", softwareRowClick, {capture: true, once: true});
        row.classList.add('clickable');
      } else if (key_v === 'ColorSpace') {
        row.title = "Notice: Color space given in Exif and XMP meta-data, might not be the same as actual image color space used!";
      }
    }
  }
  let orderedKeys = ["Headline", "Caption", "ObjectName", "Creditline", "Copyright", "UsageTerms", "LicenseURL",
    "Creator", "CreatorAddress", "CreatorCity", "CreatorRegion", "CreatorPostalCode", "CreatorCountry", "CreatorPhoneNumbers", "CreatorEmails", "CreatorURLs",
    "Date", "Make", "Model", "Lens", "FocalLengthText", "DigitalZoomRatio", "ApertureFNumber", "ExposureTime", "ISOequivalent", "FlashUsed", "WhiteBalance", "Distance",
    "GPSLat", "GPSLon", "GPSAlt", "GPSImgDir", "CountryName", "ProvinceState", "City", "Sublocation" ];
  let foundKeys = Object.keys(response.data);
  orderedKeys.filter(x => foundKeys.includes(x)).forEach(addDataRow);  // First the orderedKeys (Headline, Description, Creator, Copyright, Credit Line,...)
  foundKeys.filter(x => !orderedKeys.includes(x)).forEach(addDataRow); // Then the rest...
  if (response.data.GPSPureDdLat && response.data.GPSPureDdLon && typeof response.data.GPSPureDdLat.value === 'number' && typeof response.data.GPSPureDdLon.value === 'number') {
    document.getElementById("maintab").onclick = () => {
      document.body.classList.replace("mapmode", "mainmode")
    };
    document.getElementById("maptab").onclick = () => {
      document.body.classList.replace("mainmode", "mapmode");
      // bbox calculation is a hack. Can do better with:
      // Destination point given distance and bearing from start point
      // https://www.movable-type.co.uk/scripts/latlong.html
      // Bearing
      // https://rechneronline.de/geo-coordinates/
      document.getElementById("osmap").src = "https://www.openstreetmap.org/export/embed.html?bbox=" + (response.data.GPSPureDdLon.value - 0.003) + "%2C" + (response.data.GPSPureDdLat.value - 0.007) + "%2C" + (response.data.GPSPureDdLon.value + 0.003) + "%2C" + (response.data.GPSPureDdLat.value + 0.007) + "&layer=mapnik&marker=" + response.data.GPSPureDdLat.value + "%2C" + response.data.GPSPureDdLon.value;
      document.getElementById("largermap").href = "https://www.openstreetmap.org/?mlat=" + response.data.GPSPureDdLat.value + "&mlon=" + response.data.GPSPureDdLon.value + "#map=15/" + response.data.GPSPureDdLat.value + "/" + response.data.GPSPureDdLon.value;
    };
    let maplinks = document.getElementById('maplinks');
    function maplink(title, className, url, letter) {
      let link = createRichElement('a', {href: url}, letter);
      return createRichElement('div', {title: title, class: className}, link);
    }
    if (maplinks) {
      let lat = response.data.GPSPureDdLat.value;
      let lon = response.data.GPSPureDdLon.value;
      let lang = browser.i18n.getUILanguage();
      let titleString = encodeURIComponent('Photo location').replace(/_/gu, ' '); // Used by Bing. Could potentially be filename or title, but underscores means trouble :-/ ...
      maplinks.appendChild(maplink('Locate on OpenStreetMap', 'OSM', `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&layers=M`, 'O'));
      maplinks.appendChild(maplink('Locate on Google Maps', 'Google', `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, 'G'));
      maplinks.appendChild(maplink('Locate on Bing Maps', 'Bing', `https://www.bing.com/maps/?cp=%lat%~%lon%&lvl=16&sp=point.${lat}_${lon}_${titleString}`, 'B'));
      maplinks.appendChild(maplink('Locate on MapQuest', 'MapQuest', `https://www.mapquest.com/latlng/${lat},${lon}`, 'Q'));
      maplinks.appendChild(maplink('Locate on Here WeGo', 'Here', `https://share.here.com/l/${lat},${lon}`, 'H'));
      maplinks.appendChild(maplink('Explore nearby on Flickr', 'Flickr', `https://www.flickr.com/map/?fLat=${lat}&fLon=${lon}&zl=15`, 'F')); // "https://www.flickr.com/map/?fLat=${lat}&fLon=${lon}&zl=15&everyone_nearby=1"  -  &zl=15&min_upload_date=2019-06-07%2000%3A00%3A00&max_upload_date=2019-07-08%2000%3A00%3A00 ?
    }
  } else {
    // Disable map-tab
    document.getElementById('maptab').classList.add('disabled');
  }
  document.querySelectorAll('a').forEach((elem) => {
    elem.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      window.open(event.target.href, '_blank', 'noopener,noreferrer');
      self.close();
    }, true)
  });
  document.getElementById("settings").addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    browser.runtime.openOptionsPage();
    self.close();
  }, true);
  if (navigator.clipboard && navigator.clipboard.writeText) { // Firefox 63+
    document.getElementById("cpClipboard").addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      // Copy to clipboard
      navigator.clipboard.writeText(copyPasteContent());
    }, true);
  } else {
    document.body.classList.add('copyUnsupported'); // Hide copy button
  }
}
function copyPasteContent() {
  let s = 'FILE PROPERTIES\n\n';
  s += document.getElementById('properties').innerText + '\n\n';
  let rows = document.querySelectorAll('table#data tr');
  if (rows && rows.length > 0) {
    document.body.classList.add("copypastemode");
    s += 'IMAGE META DATA\n\n';
    rows.forEach((row) => {
      let tds = row.getElementsByTagName('td');
      if (tds && tds.length > 1) {
        s += tds[0].innerText + ': ' + tds[1].innerText + '\n';
      }
    });
    document.body.classList.remove("copypastemode");
  }
  return s;
}
function setup(options) {
  if (context.prefersDark(options["dispMode"])) {
    document.body.classList.replace("light", "dark"); // If light, then swap with dark
    document.body.classList.add("dark"); // But also set dark if light wasn't set
  } else {
    document.body.classList.replace("dark", "light"); // If dark, then swap with light
    document.body.classList.add("light"); // But also set light if dark wasn't set
  }
  // Enable selected maplinks...
  ["OSM", "Google", "Bing", "MapQuest", "Here", "Flickr"].forEach((v) => {
    if (options["mlink" + v]) {
      document.body.classList.add("show" + v);
    }
  });
}

function init() {
  context.getOptions().then(setup);
  browser.runtime.sendMessage({
    message: "popupReady"
  }).then(populate);
}
window.addEventListener("DOMContentLoaded", init);

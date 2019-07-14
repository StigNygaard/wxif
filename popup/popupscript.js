browser.runtime.sendMessage({
  message: "popupReady"
}).then( response => {
  if (response.properties.URL) {
    var image = document.querySelector("#image img");
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
    if (browser.runtime.getURL("./").startsWith("moz-extension://") && response.properties.URL.startsWith("file:")) { // Firefox won't show images from file:
      image.src = response.properties.URL; // Some "dummy"/info image instead?
    } else {
      image.src = response.properties.URL;
    }
    let url = document.createElement('a');
    url.href = response.properties.URL;
    if (response.properties.URL.startsWith("data:")) {
      document.getElementById("filename").innerText = "[ inline imagedata ]";
      document.getElementById("filename").title = "";
    } else if (response.properties.URL.startsWith("blob:")) {
      document.getElementById("filename").innerText = "[ blob imagedata ]";
      document.getElementById("filename").title = response.properties.URL;
    } else {
      document.getElementById("filename").innerText = (url.pathname.length > 1 ? url.pathname.substring(url.pathname.lastIndexOf("/") + 1) : url.hostname || url.host ) || "[ ./ ]";
      document.getElementById("filename").title = response.properties.URL;
    }
    document.getElementById("filename").href = response.properties.URL;
    document.getElementById("imgsize").innerText = response.properties.byteLength;
    document.getElementById("imgsize2").innerText = response.properties.byteLength >= 1048576 ? ((response.properties.byteLength/1048576).toFixed(2)).toString() + " MB" : ((response.properties.byteLength/1024).toFixed(2)).toString() + " kB";
    if (response.properties.URL.startsWith("file:")) {
      document.getElementById("contenttype").innerText = "";
      document.getElementById("lastmodified").innerText = "";
    } else {
      document.getElementById("contenttype").innerText = response.properties.contentType;
      document.getElementById("lastmodified").innerText = response.properties.lastModified;
    }
    if (typeof response.properties.naturalWidth === 'number' ) {
      document.getElementById("dimensions").innerText = response.properties.naturalWidth + "x" + response.properties.naturalHeight + " pixels";
    }
    document.getElementById("dimensions").innerText = response.properties.naturalWidth + "x" + response.properties.naturalHeight + " pixels";
  }

  if (response.errors.length > 0 || response.warnings.length > 0 || response.infos.length > 0) {
    response.errors.forEach(item => document.getElementById('messages').insertAdjacentHTML("beforeend", "<div><img src='/icons/error-7-32w.png' alt='!' /> <i>" + item + "</i></div>"));
    response.warnings.forEach(item => document.getElementById('messages').insertAdjacentHTML("beforeend", "<div><img src='/icons/warn-32w.png' alt='!' /> <i>" + item + "</i></div>"));
    response.infos.forEach(item => document.getElementById('messages').insertAdjacentHTML("beforeend", "<div><img src='/icons/info-32w.png' alt='i' /> <i>" + item + "</i></div>"));
    document.getElementById('messages').style.display = 'block';
  }

  // todo: Rewrite? Something not table?
  var table = document.getElementById("data");
  Object.keys(response.data).forEach(key_v => {
    if (key_v !== "GPSPureDdLat" && key_v !== "GPSPureDdLon") { // Ignore GPS _decimal_ values (for now) ...
      var row = table.insertRow(-1);
      var label = row.insertCell(0);
      var value = row.insertCell(1);
      label.innerText = response.data[key_v].label;
      label.id = key_v + "LabelCell";
      value.innerText = response.data[key_v].value;
      value.id = key_v + "ValueCell";
      if (key_v === 'GPSLat') {
        value.insertAdjacentHTML("afterbegin", "<div id='maplinks'></div>");
      }
    }
  });
  if (response.data.GPSPureDdLat && response.data.GPSPureDdLon && typeof response.data.GPSPureDdLat.value === 'number' && typeof response.data.GPSPureDdLon.value === 'number') {
    document.getElementById("maintab").onclick = () => {
      document.body.className = "mainmode";
    };
    document.getElementById("maptab").onclick = () => {
      document.body.className = "mapmode";
      // bbox calculation is a hack. Can do better with:
      // Destination point given distance and bearing from start point
      // https://www.movable-type.co.uk/scripts/latlong.html
      // Bearing
      // https://rechneronline.de/geo-coordinates/
      document.getElementById("osmap").src = "https://www.openstreetmap.org/export/embed.html?bbox=" + (response.data.GPSPureDdLon.value - 0.003) + "%2C" + (response.data.GPSPureDdLat.value - 0.007) + "%2C" + (response.data.GPSPureDdLon.value + 0.003) + "%2C" + (response.data.GPSPureDdLat.value + 0.007) + "&layer=mapnik&marker=" + response.data.GPSPureDdLat.value + "%2C" + response.data.GPSPureDdLon.value;
      document.getElementById("largermap").href = "https://www.openstreetmap.org/?mlat=" + response.data.GPSPureDdLat.value + "&mlon=" + response.data.GPSPureDdLon.value + "#map=15/" + response.data.GPSPureDdLat.value + "/" + response.data.GPSPureDdLon.value;
    };

    var maplinks = document.getElementById('maplinks');
    if (maplinks) {
      let lat = response.data.GPSPureDdLat.value;
      let lon = response.data.GPSPureDdLon.value;
      let lang = browser.i18n.getUILanguage();
      let titleString = encodeURIComponent('Photo location').replace(/_/g, ' '); // Used by Bing. Could potentially be filename or title, but underscores -> trouble.
      maplinks.insertAdjacentHTML("beforeend", ` <div title="Locate on OpenStreetMap" style="float:left;color:#fff;width:16px;height:16px;border:none;padding:0;margin:0 .2ch;background-image:url(/icons/globe-32.png);background-size:16px 16px"><a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&layers=M" style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:bold">O</a></div>`);
      maplinks.insertAdjacentHTML("beforeend", ` <div title="Locate on Google Maps" style="float:left;color:#fff;width:16px;height:16px;border:none;padding:0;margin:0 .2ch;background-image:url(/icons/globe-32.png);background-size:16px 16px"><a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:bold">G</a></div>`);
      maplinks.insertAdjacentHTML("beforeend", ` <div title="Locate on Bing Maps" style="float:left;color:#fff;width:16px;height:16px;border:none;padding:0;margin:0 .2ch;background-image:url(/icons/globe-32.png);background-size:16px 16px"><a href="https://www.bing.com/maps/?cp=%lat%~%lon%&lvl=16&sp=point.${lat}_${lon}_${titleString}" style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:bold">B</a></div>`); // var href = 'http://www.bing.com/maps/?cp=%lat%~%lon%&lvl=16&sp=point.%lat%_%lon%_%titleString%_%notesString%_%linkURL%_%photoURL%'; // Can't get it to handle underscores in strings/urls :-/
      maplinks.insertAdjacentHTML("beforeend", ` <div title="Locate on MapQuest" style="float:left;color:#fff;width:16px;height:16px;border:none;padding:0;margin:0 .2ch;background-image:url(/icons/globe-32.png);background-size:16px 16px"><a href="https://www.mapquest.com/latlng/${lat},${lon}" style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:bold">Q</a></div>`);
      maplinks.insertAdjacentHTML("beforeend", ` <div title="Locate on Here WeGo" style="float:left;color:#fff;width:16px;height:16px;border:none;padding:0;margin:0 .2ch;background-image:url(/icons/globe-32.png);background-size:16px 16px"><a href="https://share.here.com/l/${lat},${lon}" style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:bold">H</a></div>`);
      maplinks.insertAdjacentHTML("beforeend", ` <div title="Explore nearby on Flickr" style="float:left;color:#fff;width:16px;height:16px;border:none;padding:0;margin:0 .2ch;background-image:url(/icons/globe-32.png);background-size:16px 16px"><a href="https://www.flickr.com/map/?fLat=${lat}&fLon=${lon}&zl=15&everyone_nearby=1" style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:bold">F</a></div>`); // &zl=15&min_upload_date=2019-06-07%2000%3A00%3A00&max_upload_date=2019-07-08%2000%3A00%3A00 ?
    }
  } else {
    // Disable map-tab
    document.getElementById('maptab').className = 'disabled';
  }

  document.querySelectorAll('a').forEach( (elem) => {
    elem.addEventListener('click', (event) => {
      // Which way is the prefered way of opening new tab?:
      window.open(event.target.href, '_blank', 'noopener,noreferrer');
      // browser.tabs.create( {url:event.target.href} );
      event.preventDefault();
      self.close();
    } )
  } );

});

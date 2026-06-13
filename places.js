// ════════════════════════════════════════════════════════════════
// CampusRide — places.js
// Location autocomplete + map picker. 100% free stack:
//   • Curated BMSCE/Bengaluru spots (instant, offline)
//   • Photon (photon.komoot.io) — free OSM geocoder, no key
//   • Leaflet + OpenStreetMap tiles — free map picker, no key
// Requires ui.js (UI.icon, UI.openSheet, UI.toast, UI.esc).
// ════════════════════════════════════════════════════════════════

var PLACES = (function () {
  'use strict';

  /* ── Bengaluru bias (BMSCE, Bull Temple Rd, Basavanagudi) ──── */
  var HOME = { lat: 12.9410, lng: 77.5655 };

  /* Greater Bengaluru bounding box: Kengeri↔Whitefield, E-City↔Airport.
     Results outside this box are dropped. [minLon, minLat, maxLon, maxLat] */
  var BBOX = [77.38, 12.76, 77.88, 13.27];
  function inBengaluru(lat, lng) {
    return lng >= BBOX[0] && lng <= BBOX[2] && lat >= BBOX[1] && lat <= BBOX[3];
  }

  /* best curated match for free-typed text (or null) */
  function findCampusByText(q) {
    q = (q || '').toLowerCase().trim();
    if (!q) return null;
    var m = campusMatches(q);
    return m.length ? m[0] : null;
  }

  /* nearest curated hotspot within ~140 m of a point (or null) —
     lets the map pin say "BMSCE Main Gate" instead of a street name */
  function snapToCampus(lat, lng) {
    var best = null, bestD = 140;
    CAMPUS.forEach(function (c) {
      var dy = (lat - c[2]) * 111320;
      var dx = (lng - c[3]) * 111320 * Math.cos(lat * Math.PI / 180);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = c; }
    });
    return best ? { label: best[0], sub: best[1] } : null;
  }

  /* ── Curated campus spots (name, area, lat, lng) ─────────────
     Point POIs cross-verified against Wikipedia/OSM 2026-06-12
     (metro stations, terminals, landmarks). Area entries are
     centroids by design; picks are background-refined via Photon. */
  var CAMPUS = [
    ['BMSCE Main Gate', 'Bull Temple Rd', 12.9418, 77.5662],
    ['BMSCE Gate 2', 'Basavanagudi', 12.9405, 77.5662],
    ['BMS College Hostel', 'Basavanagudi', 12.9398, 77.5648],
    ['Bull Temple (Dodda Basavana Gudi)', 'Basavanagudi', 12.9430, 77.5683],
    ['Gandhi Bazaar', 'Basavanagudi', 12.9459, 77.5710],
    ['National College Metro', 'Basavanagudi', 12.9505, 77.5737],
    ['South End Circle Metro', 'RV Road', 12.9382, 77.5801],
    ['Lalbagh West Gate', 'Mavalli', 12.9485, 77.5780],
    ['Lalbagh Metro', 'RV Road', 12.9464, 77.5800],
    ['Jayanagar 4th Block', 'Jayanagar', 12.9279, 77.5837],
    ['Jayanagar 9th Block', 'Jayanagar', 12.9180, 77.5950],
    ['JP Nagar 2nd Phase', 'JP Nagar', 12.9100, 77.5850],
    ['Banashankari Metro / Bus Stand', 'Kanakapura Rd', 12.9156, 77.5736],
    ['Banashankari 3rd Stage', 'Banashankari', 12.9250, 77.5460],
    ['Kathriguppe', 'Banashankari', 12.9290, 77.5510],
    ['BTM Layout', 'BTM 2nd Stage', 12.9166, 77.6101],
    ['Silk Board Junction', 'HSR/BTM', 12.9172, 77.6229],
    ['HSR Layout', 'Sector 1', 12.9121, 77.6446],
    ['Koramangala 5th Block', 'Koramangala', 12.9352, 77.6245],
    ['Forum Mall (Nexus) Koramangala', 'Koramangala', 12.9347, 77.6113],
    ['Majestic (Kempegowda Bus Stn)', 'Gandhi Nagar', 12.9768, 77.5726],
    ['KSR City Railway Station', 'Majestic', 12.9772, 77.5694],
    ['KR Market Metro', 'City Market', 12.9614, 77.5746],
    ['Chickpete Metro', 'Chickpete', 12.9668, 77.5748],
    ['MG Road', 'Central', 12.9758, 77.6045],
    ['Brigade Road', 'Central', 12.9719, 77.6075],
    ['Church Street', 'Central', 12.9753, 77.6044],
    ['Cubbon Park Metro', 'Central', 12.9811, 77.5969],
    ['Vidhana Soudha', 'Central', 12.9796, 77.5906],
    ['Shivajinagar Bus Stand', 'Shivajinagar', 12.9857, 77.6057],
    ['Richmond Circle', 'Richmond Town', 12.9590, 77.5970],
    ['Indiranagar 100ft Road', 'Indiranagar', 12.9719, 77.6412],
    ['Domlur', 'Old Airport Rd', 12.9609, 77.6387],
    ['Marathahalli Bridge', 'Marathahalli', 12.9569, 77.7011],
    ['Bellandur', 'ORR', 12.9304, 77.6784],
    ['Sarjapur Road', 'Bellandur', 12.9100, 77.6870],
    ['Electronic City Phase 1', 'Hosur Rd', 12.8452, 77.6602],
    ['Whitefield (Hope Farm)', 'Whitefield', 12.9698, 77.7500],
    ['Malleshwaram 8th Cross', 'Malleshwaram', 13.0035, 77.5709],
    ['Mantri Square Mall', 'Sampige Rd', 12.9910, 77.5704],
    ['Rajajinagar', '1st Block', 12.9905, 77.5525],
    ['Vijayanagar', 'Bus Stand', 12.9719, 77.5302],
    ['Yeshwanthpur Railway Stn', 'Yeshwanthpur', 13.0220, 77.5510],
    ['Hebbal', 'Flyover', 13.0358, 77.5970],
    ['Yelahanka', 'New Town', 13.1007, 77.5963],
    ['Kempegowda Intl Airport (KIA)', 'Devanahalli', 13.1989, 77.7056],
    ['Pattanagere Metro (RVCE)', 'Mysore Rd', 12.9244, 77.4983],
    ['Kengeri Bus Terminal', 'Kengeri', 12.9077, 77.4854],
    ['Nayandahalli Junction', 'Mysore Rd', 12.9420, 77.5265],
    ['Basaveshwaranagar', '8th Main', 12.9866, 77.5380]
  ];

  /* ── Helpers ────────────────────────────────────────────────── */
  function debounced(fn, ms) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function campusMatches(q) {
    q = q.toLowerCase().trim();
    if (!q) return [];
    var tokens = q.split(/\s+/);   // "bms main" → every token must appear
    var starts = [], contains = [];
    CAMPUS.forEach(function (c) {
      var hay = (c[0] + ' ' + c[1]).toLowerCase();
      var all = tokens.every(function (t) { return hay.indexOf(t) !== -1; });
      if (!all) return;
      if (c[0].toLowerCase().indexOf(tokens[0]) === 0) starts.push(c);
      else contains.push(c);
    });
    return starts.concat(contains).slice(0, 4).map(function (c) {
      return { label: c[0], sub: c[1], lat: c[2], lng: c[3], campus: true };
    });
  }

  /* ── Photon (free OSM geocoder) ─────────────────────────────── */
  var cache = {};
  var inflight = null;

  function photonLabel(p) {
    var name = p.name || [p.street, p.housenumber].filter(Boolean).join(' ');
    return name || p.city || p.state || 'Unnamed place';
  }
  function photonSub(p) {
    return [p.suburb || p.district || p.street, p.city || p.county]
      .filter(Boolean)
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
      .join(', ');
  }

  function searchPhoton(q, cb) {
    if (cache[q]) { cb(cache[q]); return; }
    if (inflight) inflight.abort();
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    inflight = ctrl;
    var url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(q) +
              '&lat=' + HOME.lat + '&lon=' + HOME.lng +
              '&bbox=' + BBOX.join(',') + '&limit=6&lang=en';
    fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (json) {
        var out = (json.features || []).map(function (f) {
          var p = f.properties || {};
          return {
            label: photonLabel(p),
            sub: photonSub(p),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            campus: false
          };
        }).filter(function (it) {
          return inBengaluru(it.lat, it.lng);   // belt + braces with bbox param
        });
        cache[q] = out;
        cb(out);
      })
      .catch(function () { cb([]); });   // offline / throttled → curated only
  }

  function reverseGeocode(lat, lng, cb) {
    fetch('https://photon.komoot.io/reverse?lat=' + lat + '&lon=' + lng + '&lang=en')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        var f = (json.features || [])[0];
        if (!f) { cb(null); return; }
        var p = f.properties || {};
        var label = photonLabel(p);
        var sub = photonSub(p);
        cb({ label: label, sub: sub, full: sub ? label + ', ' + sub : label });
      })
      .catch(function () { cb(null); });
  }

  /* ── Suggestion dropdown ────────────────────────────────────── */
  function attach(input, opts) {
    opts = opts || {};
    var wrap = input.closest('.field__wrap');
    if (!wrap) return;
    wrap.classList.add('has-sugg');

    var listId = 'sugg-' + (input.id || Math.random().toString(36).slice(2, 7));
    var panel = document.createElement('div');
    panel.className = 'sugg';
    panel.id = listId;
    panel.setAttribute('role', 'listbox');
    wrap.appendChild(panel);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);
    input.autocomplete = 'off';

    /* optional map-picker button */
    if (opts.map) {
      var mapBtn = document.createElement('button');
      mapBtn.type = 'button';
      mapBtn.className = 'map-btn';
      mapBtn.setAttribute('aria-label', 'Pick on map');
      mapBtn.title = 'Pick on map';
      mapBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>';
      mapBtn.addEventListener('click', function () { openMap(input); });
      wrap.appendChild(mapBtn);
      input.classList.add('has-map-btn');
    }

    var items = [], active = -1, open = false;

    function close() {
      open = false; active = -1;
      panel.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    function render() {
      if (!items.length) { close(); return; }
      open = true;
      panel.innerHTML = items.map(function (it, i) {
        return '<div class="sugg__item' + (i === active ? ' active' : '') + '" id="' + listId + '-' + i + '" role="option" data-i="' + i + '"' + (i === active ? ' aria-selected="true"' : '') + '>' +
          '<span class="sugg__ic' + (it.campus ? ' sugg__ic--campus' : '') + '">' +
            (it.campus
              ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>') +
          '</span>' +
          '<span class="sugg__txt"><strong>' + UI.esc(it.label) + '</strong>' +
            (it.sub ? '<small>' + UI.esc(it.sub) + '</small>' : '') + '</span>' +
        '</div>';
      }).join('');
      panel.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      if (active >= 0) input.setAttribute('aria-activedescendant', listId + '-' + active);
      else input.removeAttribute('aria-activedescendant');
    }

    function pick(i) {
      var it = items[i];
      if (!it) return;
      input.value = it.sub && !it.campus ? it.label + ', ' + it.sub.split(',')[0] : it.label;
      input.dataset.lat = it.lat;
      input.dataset.lng = it.lng;
      close();
      if (it.campus) refineCampusPick(input, it);
      if (opts.onPick) opts.onPick(it);
    }

    /* curated picks get refined in the background against live OSM
       data (Photon) — self-heals any static-coordinate drift */
    function refineCampusPick(inp, it) {
      searchPhoton(it.label, function (res) {
        if (!res.length) return;
        var best = res[0];
        var dy = (best.lat - it.lat) * 111320;
        var dx = (best.lng - it.lng) * 111320 * Math.cos(it.lat * Math.PI / 180);
        var drift = Math.sqrt(dx * dx + dy * dy);
        /* same place (≤1.2 km away) and the field still holds this pick */
        if (drift < 1200 && Math.abs(+inp.dataset.lat - it.lat) < 1e-9) {
          inp.dataset.lat = best.lat;
          inp.dataset.lng = best.lng;
        }
      });
    }

    var lookup = debounced(function () {
      var q = input.value.trim();
      if (q.length < 1) { items = []; render(); return; }
      var local = campusMatches(q);
      items = local.slice();
      active = -1;
      render();
      if (q.length >= 3) {
        searchPhoton(q, function (remote) {
          if (input.value.trim() !== q) return;   // stale
          var seen = {};
          items = local.concat(remote).filter(function (it) {
            var k = (it.label + '|' + it.sub).toLowerCase();
            if (seen[k]) return false;
            seen[k] = 1;
            return true;
          }).slice(0, 7);
          render();
        });
      }
    }, 220);

    input.addEventListener('input', function () {
      delete input.dataset.lat;   // typed text invalidates picked coords
      delete input.dataset.lng;
      lookup();
    });
    input.addEventListener('focus', function () { if (input.value.trim()) lookup(); });
    input.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; render(); }
      else if (e.key === 'Enter') { if (active >= 0) { e.preventDefault(); pick(active); } else close(); }
      else if (e.key === 'Escape') { close(); }
    });
    panel.addEventListener('mousedown', function (e) {   // mousedown beats blur
      var item = e.target.closest('.sugg__item');
      if (item) { e.preventDefault(); pick(+item.dataset.i); }
    });
    input.addEventListener('blur', function () { setTimeout(close, 120); });
  }

  /* ── Map picker (Leaflet, lazy-loaded) ──────────────────────── */
  var leafletReady = null;
  function loadLeaflet() {
    if (leafletReady) return leafletReady;
    leafletReady = new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(css);
      var js = document.createElement('script');
      js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      js.onload = resolve;
      js.onerror = reject;
      document.head.appendChild(js);
    });
    return leafletReady;
  }

  var mapOverlay = null, map = null, marker = null, targetInput = null, picked = null;

  function ensureMapSheet() {
    if (mapOverlay) return;
    mapOverlay = document.createElement('div');
    mapOverlay.className = 'overlay';
    mapOverlay.id = 'mapOverlay';
    mapOverlay.setAttribute('role', 'dialog');
    mapOverlay.setAttribute('aria-modal', 'true');
    mapOverlay.setAttribute('aria-label', 'Pick a location on the map');
    mapOverlay.innerHTML =
      '<div class="sheet sheet--map">' +
        '<div class="sheet__handle"></div>' +
        '<h2 class="sheet__title" style="margin-bottom:0.6rem;">Pin the spot</h2>' +
        '<div class="map-box"><div id="leafletMap"></div>' +
          '<button type="button" class="map-locate" id="mapLocate" aria-label="Use my current location" title="Use my location">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="map-addr" id="mapAddr"><span class="skel" style="display:inline-block;width:60%;height:12px;"></span></div>' +
        '<div class="sheet__actions">' +
          '<button type="button" class="btn btn--ghost" id="mapCancel">Cancel</button>' +
          '<button type="button" class="btn btn--primary" id="mapUse" disabled>Use this location</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(mapOverlay);

    document.getElementById('mapCancel').addEventListener('click', function () { UI.closeSheet(mapOverlay); });
    document.getElementById('mapUse').addEventListener('click', function () {
      if (!picked || !targetInput) return;
      targetInput.value = picked.text;
      targetInput.dataset.lat = picked.lat;
      targetInput.dataset.lng = picked.lng;
      UI.closeSheet(mapOverlay);
      targetInput.focus();
    });
    document.getElementById('mapLocate').addEventListener('click', function () {
      if (!navigator.geolocation) { UI.toast('Location not available here', 'error'); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        var ll = [pos.coords.latitude, pos.coords.longitude];
        map.setView(ll, 16);
        marker.setLatLng(ll);
        onMarkerMove();
      }, function () {
        UI.toast('Couldn’t get your location — check permission', 'error');
      }, { enableHighAccuracy: true, timeout: 8000 });
    });
  }

  var PIN_SM  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
  var STAR_SM = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>';

  var reverseDeb = debounced(function () {
    var ll = marker.getLatLng();
    var addrEl = document.getElementById('mapAddr');
    reverseGeocode(ll.lat, ll.lng, function (res) {
      var snap = snapToCampus(ll.lat, ll.lng);   // hotspot beats street name
      var label, full;
      if (snap) {
        label = snap.label;
        full = snap.label + ', ' + snap.sub;
      } else if (res) {
        label = res.label;
        full = res.full;
      } else {
        label = full = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5);
      }
      picked = { text: label, full: full, lat: ll.lat, lng: ll.lng };
      addrEl.innerHTML = (snap ? STAR_SM : PIN_SM) + '<span>' + UI.esc(full) + '</span>';
      document.getElementById('mapUse').disabled = false;
    });
  }, 350);

  function onMarkerMove() {
    document.getElementById('mapUse').disabled = true;
    document.getElementById('mapAddr').innerHTML =
      '<span class="skel" style="display:inline-block;width:60%;height:12px;"></span>';
    reverseDeb();
  }

  function openMap(input) {
    targetInput = input;
    picked = null;
    ensureMapSheet();
    UI.openSheet(mapOverlay);

    loadLeaflet().then(function () {
      var start = (input.dataset.lat && input.dataset.lng)
        ? [+input.dataset.lat, +input.dataset.lng]
        : [HOME.lat, HOME.lng];

      if (!map) {
        map = L.map('leafletMap', { zoomControl: true }).setView(start, 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        marker = L.marker(start, { draggable: true, keyboard: true }).addTo(map);
        marker.on('dragend', onMarkerMove);
        map.on('click', function (e) { marker.setLatLng(e.latlng); onMarkerMove(); });
      } else {
        map.setView(start, 15);
        marker.setLatLng(start);
      }
      /* sheet animates in → Leaflet needs a size refresh */
      setTimeout(function () { map.invalidateSize(); }, 320);
      onMarkerMove();

      /* typed text but nothing picked yet → pre-centre the map on it */
      var txt = (input.value || '').trim();
      if (!input.dataset.lat && txt) {
        var jump = function (lat, lng) {
          if (!mapOverlay.classList.contains('open')) return;
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          onMarkerMove();
        };
        var c = findCampusByText(txt);
        if (c) jump(c.lat, c.lng);
        else searchPhoton(txt, function (res) { if (res.length) jump(res[0].lat, res[0].lng); });
      }
    }).catch(function () {
      UI.toast('Couldn’t load the map — check your connection', 'error');
      UI.closeSheet(mapOverlay);
    });
  }

  /* ── Mini route map for ride details (read-only, exact pins) ── */
  function routeMap(el, from, to) {
    if (!el) return;
    var pts = [];
    if (from && from.lat && from.lng) pts.push({ ll: [+from.lat, +from.lng], a: true });
    if (to && to.lat && to.lng)       pts.push({ ll: [+to.lat, +to.lng],   a: false });
    if (!pts.length) { el.style.display = 'none'; return; }

    loadLeaflet().then(function () {
      if (el._lmap) { el._lmap.remove(); el._lmap = null; }
      var m = L.map(el, {
        zoomControl: true,          /* +/- buttons */
        scrollWheelZoom: true,      /* scroll to zoom */
        doubleClickZoom: true,
        dragging: true,
        tap: false
      });
      el._lmap = m;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(m);

      pts.forEach(function (p) {
        L.circleMarker(p.ll, {
          radius: 8,
          weight: 2.5,
          color: p.a ? '#8a6f4d' : '#5b4bd6',
          fillColor: p.a ? '#cab69e' : '#8b7cff',
          fillOpacity: 1
        }).addTo(m);
      });
      if (pts.length === 2) {
        L.polyline([pts[0].ll, pts[1].ll], {
          color: '#8b7cff', weight: 2, dashArray: '6 7', opacity: 0.75
        }).addTo(m);
      }

      setTimeout(function () {
        m.invalidateSize();
        if (pts.length === 2) m.fitBounds(L.latLngBounds(pts[0].ll, pts[1].ll).pad(0.3));
        else m.setView(pts[0].ll, 15);
      }, 330);
    }).catch(function () { el.style.display = 'none'; });
  }

  return { attach: attach, openMap: openMap, reverseGeocode: reverseGeocode, routeMap: routeMap };
})();

// rides.js — Firebase Realtime Database backend
// Replaces localStorage with cross-device real-time sync

var RIDES = (function () {

  // ── Firebase config ─────────────────────────────────────────
  var firebaseConfig = {
    apiKey:            "AIzaSyChLbBhiHASeZhZUeS6z5MVZS-kuz3n_z4",
    authDomain:        "campusride-6fde9.firebaseapp.com",
    databaseURL:       "https://campusride-6fde9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "campusride-6fde9",
    storageBucket:     "campusride-6fde9.firebasestorage.app",
    messagingSenderId: "515150635202",
    appId:             "1:515150635202:web:5db627a027ab1219fb9b5b"
  };

  // Guard against double-init (multiple pages load this file)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  var db       = firebase.database();
  var ridesRef = db.ref('rides');

  // ── Key encoding ─────────────────────────────────────────────
  // Firebase keys cannot contain . or @ — encode emails used as keys
  function encKey(email) {
    return email.replace(/\./g, ',').replace(/@/g, '--at--');
  }
  function decKey(key) {
    return key.replace(/,/g, '.').replace(/--at--/g, '@');
  }

  // ── Normalise raw Firebase ride snapshot ─────────────────────
  // Firebase stores bookedBy as a map {encodedEmail: true}
  // We expose it as a plain array of email strings
  function norm(raw) {
    var r = Object.assign({}, raw);
    r.bookedBy = (r.bookedBy && typeof r.bookedBy === 'object')
      ? Object.keys(r.bookedBy).map(decKey)
      : [];
    return r;
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  // ── Add a new ride (fire-and-forget) ─────────────────────────
  function add(ride) {
    var id    = genId();
    ride.id       = id;
    ride.status   = 'open';
    ride.bookedBy = {};       // stored as map in Firebase
    ride.postedAt = Date.now();
    ridesRef.child(id).set(ride);
  }

  // ── Book a ride (transaction = race-condition safe) ───────────
  function book(rideId, email, cb) {
    ridesRef.child(rideId).transaction(function (ride) {
      if (!ride) return ride;
      if (!ride.bookedBy) ride.bookedBy = {};

      var key   = encKey(email);
      var taken = Object.keys(ride.bookedBy).length;

      if (ride.offeredBy === email) return;           // abort: own ride
      if (ride.bookedBy[key])       return;           // abort: already booked
      if (taken >= +ride.seats)     return;           // abort: full

      ride.bookedBy[key] = true;
      if (Object.keys(ride.bookedBy).length >= +ride.seats) ride.status = 'full';
      return ride;

    }, function (err, committed, snap) {
      if (err) { cb({ ok: false, error: 'error' }); return; }
      if (!committed) {
        var raw = snap && snap.val();
        if (!raw)                                { cb({ ok: false, error: 'not_found'      }); return; }
        if (raw.offeredBy === email)             { cb({ ok: false, error: 'own_ride'       }); return; }
        if (raw.bookedBy && raw.bookedBy[encKey(email)]) { cb({ ok: false, error: 'already_booked' }); return; }
        var cnt = raw.bookedBy ? Object.keys(raw.bookedBy).length : 0;
        if (cnt >= +raw.seats)                   { cb({ ok: false, error: 'full'           }); return; }
        cb({ ok: false, error: 'aborted' });
        return;
      }
      cb({ ok: true });
    });
  }

  // ── Real-time listener — fires immediately + on every change ──
  function onRidesChange(cb) {
    ridesRef.on('value', function (snap) {
      var rides = [];
      snap.forEach(function (child) { rides.push(norm(child.val())); });
      rides.sort(function (a, b) { return (b.postedAt || 0) - (a.postedAt || 0); });
      cb(rides);
    });
  }

  // ── One-shot reads ────────────────────────────────────────────
  function getOfferedBy(email, cb) {
    ridesRef.once('value', function (snap) {
      var out = [];
      snap.forEach(function (c) {
        var r = norm(c.val());
        if (r.offeredBy === email) out.push(r);
      });
      out.sort(function (a, b) { return (b.postedAt || 0) - (a.postedAt || 0); });
      cb(out);
    });
  }

  function getBookedBy(email, cb) {
    ridesRef.once('value', function (snap) {
      var out = [];
      snap.forEach(function (c) {
        var r = norm(c.val());
        if (r.bookedBy.indexOf(email) !== -1) out.push(r);
      });
      out.sort(function (a, b) { return (b.postedAt || 0) - (a.postedAt || 0); });
      cb(out);
    });
  }

  // ── Utilities ─────────────────────────────────────────────────
  function formatDT(dt) {
    if (!dt) return 'TBD';
    var d       = new Date(dt);
    var now     = new Date();
    var today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var rideDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var diff    = Math.round((rideDay - today) / 86400000);
    var time    = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diff === 0) return 'Today, '    + time;
    if (diff === 1) return 'Tomorrow, ' + time;
    if (diff < 0)   return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + time;
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return {
    add:           add,
    book:          book,
    onRidesChange: onRidesChange,
    getOfferedBy:  getOfferedBy,
    getBookedBy:   getBookedBy,
    formatDT:      formatDT,
    cap:           cap,
    esc:           esc,
  };
})();

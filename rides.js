// rides.js — Firebase Realtime Database backend
// Cross-device, real-time sync. v2 2026-06-12:
//  + driver ratings (ratings/{driver}/{rater})
//  + undefined-field sanitising in add() (supports optional phone)
//  + isPast() helper
// Booking/cancel transactions unchanged from v1 (race-condition safe).

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

  var db         = firebase.database();
  var ridesRef   = db.ref('rides');
  var ratingsRef = db.ref('ratings');

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
    // Firebase rejects undefined values — strip them (e.g. optional phone)
    Object.keys(ride).forEach(function (k) {
      if (ride[k] === undefined || ride[k] === null || ride[k] === '') delete ride[k];
    });
    ridesRef.child(id).set(ride);
    return id;
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

  // ── Time helpers ─────────────────────────────────────────────
  function canCancel(datetime) {
    return (new Date(datetime) - Date.now()) > 15 * 60 * 1000;
  }
  function isPast(datetime) {
    return new Date(datetime) - Date.now() < 0;
  }

  // ── Cancel a whole ride (offerer) ─────────────────────────────
  function cancelRide(rideId, email, cb) {
    ridesRef.child(rideId).transaction(function (ride) {
      if (!ride) return ride;
      if (ride.offeredBy !== email)  return;               // not your ride
      if (!canCancel(ride.datetime)) return;               // <15 min away
      ride.status = 'cancelled';
      return ride;
    }, function (err, committed, snap) {
      if (err) { cb({ ok: false, error: 'error' }); return; }
      if (!committed) {
        var raw = snap && snap.val();
        if (!raw) { cb({ ok: false, error: 'not_found' }); return; }
        if (!canCancel(raw.datetime)) { cb({ ok: false, error: 'too_late' }); return; }
        cb({ ok: false, error: 'aborted' });
        return;
      }
      cb({ ok: true });
    });
  }

  // ── Cancel a booking (booker removes themselves) ──────────────
  function cancelBooking(rideId, email, cb) {
    ridesRef.child(rideId).transaction(function (ride) {
      if (!ride) return ride;
      if (!canCancel(ride.datetime)) return;               // <15 min away
      if (!ride.bookedBy) return ride;
      var key = encKey(email);
      if (!ride.bookedBy[key]) return ride;               // not booked
      delete ride.bookedBy[key];
      if (ride.status === 'full') ride.status = 'open';   // free up seat
      return ride;
    }, function (err, committed, snap) {
      if (err) { cb({ ok: false, error: 'error' }); return; }
      if (!committed) {
        var raw = snap && snap.val();
        if (!raw) { cb({ ok: false, error: 'not_found' }); return; }
        if (!canCancel(raw.datetime)) { cb({ ok: false, error: 'too_late' }); return; }
        cb({ ok: false, error: 'aborted' });
        return;
      }
      cb({ ok: true });
    });
  }

  // ── Propagate a new display name onto all of a user's rides ───
  function renameMine(email, newName, cb) {
    ridesRef.once('value', function (snap) {
      var updates = {};
      snap.forEach(function (c) {
        var v = c.val();
        if (v && v.offeredBy === email) updates[c.key + '/offererName'] = newName;
      });
      if (!Object.keys(updates).length) { if (cb) cb({ ok: true, count: 0 }); return; }
      ridesRef.update(updates)
        .then(function () { if (cb) cb({ ok: true, count: Object.keys(updates).length }); })
        .catch(function () { if (cb) cb({ ok: false }); });
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

  // ── Ratings ───────────────────────────────────────────────────
  // ratings/{driverKey}/{raterKey} = { stars, rideId, at }
  // One rating per rater per driver; re-rating overwrites.
  function rateDriver(driverEmail, raterEmail, rideId, stars, cb) {
    stars = Math.max(1, Math.min(5, parseInt(stars, 10) || 0));
    if (!stars || driverEmail === raterEmail) { if (cb) cb({ ok: false, error: 'invalid' }); return; }
    ratingsRef.child(encKey(driverEmail)).child(encKey(raterEmail))
      .set({ stars: stars, rideId: rideId || '', at: Date.now() })
      .then(function () { if (cb) cb({ ok: true }); })
      .catch(function () { if (cb) cb({ ok: false, error: 'error' }); });
  }

  // → { 'driver@bmsce.ac.in': { avg: 4.5, count: 2 }, ... }
  function getAllRatings(cb) {
    ratingsRef.once('value', function (snap) {
      var out = {};
      snap.forEach(function (driverNode) {
        var sum = 0, n = 0;
        driverNode.forEach(function (raterNode) {
          var v = raterNode.val();
          if (v && v.stars) { sum += +v.stars; n++; }
        });
        if (n > 0) out[decKey(driverNode.key)] = { avg: sum / n, count: n };
      });
      cb(out);
    });
  }

  // → stars (1–5) or null
  function getMyRating(driverEmail, raterEmail, cb) {
    ratingsRef.child(encKey(driverEmail)).child(encKey(raterEmail))
      .once('value', function (snap) {
        var v = snap.val();
        cb(v && v.stars ? +v.stars : null);
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
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return {
    add:            add,
    book:           book,
    canCancel:      canCancel,
    isPast:         isPast,
    cancelRide:     cancelRide,
    cancelBooking:  cancelBooking,
    onRidesChange:  onRidesChange,
    renameMine:     renameMine,
    getOfferedBy:   getOfferedBy,
    getBookedBy:    getBookedBy,
    rateDriver:     rateDriver,
    getAllRatings:  getAllRatings,
    getMyRating:    getMyRating,
    formatDT:       formatDT,
    cap:            cap,
    esc:            esc,
  };
})();

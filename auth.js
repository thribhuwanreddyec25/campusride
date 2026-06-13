// ════════════════════════════════════════════════════════════════
// CampusRide – auth.js v3 (Firebase Authentication)
// Accounts live in Firebase Auth (passwords never touch our DB).
// User profile data (phone) lives at users/{uid} in RTDB.
// Legacy localStorage accounts auto-migrate on first sign-in.
// Requires: firebase-app/auth/database-compat + firebase-init.js.
// ════════════════════════════════════════════════════════════════

var AUTH = (function () {
  'use strict';

  var DOMAIN = '@bmsce.ac.in';
  var auth = firebase.auth();
  var db   = firebase.database();

  /* ── Auth state ─────────────────────────────────────────────── */
  var _user = null, _isReady = false, _readyCbs = [];

  auth.onAuthStateChanged(function (u) {
    _user = u;
    if (!_isReady) {
      _isReady = true;
      _readyCbs.splice(0).forEach(function (cb) { cb(u); });
    }
  });

  // cb fires once with the signed-in user (or null)
  function ready(cb) {
    if (_isReady) cb(_user);
    else _readyCbs.push(cb);
  }

  function currentUser() {
    return auth.currentUser ? auth.currentUser.email : null;
  }
  function uid() {
    return auth.currentUser ? auth.currentUser.uid : null;
  }

  // Gate for app pages: must be signed in.
  // Email verification is not required — sign-up is already restricted to @bmsce.ac.in.
  function requireAuth(cb) {
    ready(function (u) {
      if (!u) { window.location.href = 'login.html'; return; }
      cb(u);
    });
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  function validateEmail(email) {
    var trimmed = (email || '').trim().toLowerCase();
    if (!trimmed.endsWith(DOMAIN)) return { ok: false, error: 'Must use a @bmsce.ac.in email.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { ok: false, error: 'Invalid email format.' };
    return { ok: true, email: trimmed };
  }

  // "arjun.kumar@bmsce.ac.in" → "Arjun Kumar"
  function displayName(email) {
    var local = (email || '').split('@')[0];
    return local.split(/[._\-]/).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ') || 'Student';
  }
  function firstName(email) { return displayName(email).split(' ')[0]; }

  function mapErr(e) {
    var c = (e && e.code) || '';
    if (c.indexOf('invalid-credential') > -1 ||
        c.indexOf('invalid-login-credentials') > -1 ||
        c.indexOf('wrong-password') > -1)        return 'Incorrect email or password.';
    if (c.indexOf('user-not-found') > -1)        return 'No account with this email yet — create one.';
    if (c.indexOf('email-already-in-use') > -1)  return 'An account already exists for this email — sign in instead.';
    if (c.indexOf('weak-password') > -1)         return 'Password must be at least 6 characters.';
    if (c.indexOf('too-many-requests') > -1)     return 'Too many attempts — wait a minute and try again.';
    if (c.indexOf('network-request-failed') > -1) return 'Network error — check your connection.';
    if (c.indexOf('requires-recent-login') > -1) return 'Please sign in again, then retry.';
    if (c.indexOf('operation-not-allowed') > -1 ||
        c.indexOf('admin-restricted-operation') > -1 ||
        c.indexOf('configuration-not-found') > -1) {
      return "Email sign-in isn’t enabled in Firebase yet — console → Authentication → Sign-in method → enable Email/Password.";
    }
    return 'Something went wrong (' + (c || 'unknown error') + ') — try again.';
  }

  /* ── Legacy (localStorage v1/v2) migration ──────────────────── */
  function legacyFind(email, pw) {
    try {
      var a = JSON.parse(localStorage.getItem('cr_accounts')) || [];
      for (var i = 0; i < a.length; i++) {
        if (a[i].email === email && a[i].password === pw) return a[i];
      }
    } catch (_) {}
    return null;
  }

  /* ── Sign up / sign in / sign out ───────────────────────────── */
  function signUp(email, pw, phone, cb) {
    auth.createUserWithEmailAndPassword(email, pw)
      .then(function (cred) {
        var u = cred.user;
        return db.ref('users/' + u.uid)
          .set({ email: email, phone: phone || '', createdAt: firebase.database.ServerValue.TIMESTAMP })
          .catch(function () { /* profile write is non-fatal */ })
          .then(function () { return u.sendEmailVerification().catch(function () {}); })
          .then(function () { cb({ ok: true }); });
      })
      .catch(function (e) { cb({ ok: false, error: mapErr(e), code: e && e.code }); });
  }

  function signIn(email, pw, cb) {
    auth.signInWithEmailAndPassword(email, pw)
      .then(function () { cb({ ok: true }); })
      .catch(function (e) {
        var c = (e && e.code) || '';
        var credentialFail =
          c.indexOf('user-not-found') > -1 ||
          c.indexOf('wrong-password') > -1 ||
          c.indexOf('invalid-credential') > -1 ||
          c.indexOf('invalid-login-credentials') > -1;

        // Seamless migration: matching legacy local account → create it in Firebase
        var legacy = credentialFail ? legacyFind(email, pw) : null;
        if (legacy) {
          signUp(email, pw, legacy.phone || '', function (r) {
            if (r.ok) cb({ ok: true, migrated: true });
            else cb({ ok: false, error: mapErr(e) });   // e.g. exists with a different password
          });
          return;
        }
        cb({ ok: false, error: mapErr(e) });
      });
  }

  function signOut(cb) {
    auth.signOut().then(cb || function () {}).catch(cb || function () {});
  }

  /* ── Email verification ─────────────────────────────────────── */
  function resendVerification(cb) {
    var u = auth.currentUser;
    if (!u) { cb({ ok: false, error: 'Not signed in.' }); return; }
    u.sendEmailVerification()
      .then(function () { cb({ ok: true }); })
      .catch(function (e) { cb({ ok: false, error: mapErr(e) }); });
  }

  function checkVerified(cb) {
    var u = auth.currentUser;
    if (!u) { cb(false); return; }
    u.reload()
      .then(function () { cb(!!(auth.currentUser && auth.currentUser.emailVerified)); })
      .catch(function () { cb(false); });
  }

  /* ── Password change (reauth required) ──────────────────────── */
  function changePassword(currentPw, newPw, cb) {
    var u = auth.currentUser;
    if (!u) { cb({ ok: false, error: 'Not signed in.' }); return; }
    var cred = firebase.auth.EmailAuthProvider.credential(u.email, currentPw);
    u.reauthenticateWithCredential(cred)
      .then(function () { return u.updatePassword(newPw); })
      .then(function () { cb({ ok: true }); })
      .catch(function (e) {
        var c = (e && e.code) || '';
        if (c.indexOf('wrong-password') > -1 || c.indexOf('invalid-credential') > -1 ||
            c.indexOf('invalid-login-credentials') > -1) {
          cb({ ok: false, error: 'Current password is incorrect.' });
        } else {
          cb({ ok: false, error: mapErr(e) });
        }
      });
  }

  /* ── Profile (phone) ────────────────────────────────────────── */
  function getMyPhone(cb) {
    var id = uid();
    if (!id) { cb(null); return; }
    db.ref('users/' + id + '/phone').once('value',
      function (snap) { cb(snap.val() || null); },
      function () { cb(null); });
  }

  function setMyPhone(phone, cb) {
    var id = uid();
    if (!id) { cb({ ok: false }); return; }
    db.ref('users/' + id).update({ phone: phone, email: currentUser() })
      .then(function () { cb({ ok: true }); })
      .catch(function () { cb({ ok: false }); });
  }

  /* ── Display name ───────────────────────────────────────────── */
  function getStoredName(cb) {
    var id = uid();
    if (!id) { cb(null); return; }
    db.ref('users/' + id + '/displayName').once('value',
      function (snap) { cb(snap.val() || null); },
      function () { cb(null); });
  }

  function setStoredName(name, cb) {
    var id = uid();
    if (!id) { cb({ ok: false }); return; }
    db.ref('users/' + id).update({ displayName: name })
      .then(function () { _myName = name; cb({ ok: true }); })
      .catch(function () { cb({ ok: false }); });
  }

  /* ── Current user's display name (cached) ───────────────────── */
  var _myName = null;

  // Load the signed-in user's chosen name into cache (falls back to email-derived).
  function loadMyName(cb) {
    getStoredName(function (n) {
      _myName = n || displayName(currentUser());
      if (cb) cb(_myName);
    });
  }
  function myDisplayName() { return _myName || displayName(currentUser()); }

  // Resolve the name to show for a RIDE — prefers the offerer's chosen name
  // (denormalised onto the ride as offererName), else derives from their email.
  function rideName(r) {
    if (r && r.offererName) return r.offererName;
    return displayName(r && r.offeredBy);
  }
  function rideFirstName(r) { return rideName(r).split(' ')[0]; }

  // Validate that every word in 'input' is a substring of the name tokens from 'email'.
  // e.g. email "thribhuwanreddy.ec25@bmsce.ac.in" → combined "thribhuwanreddy"
  // "Thribhuwan" ✓, "Reddy" ✓, "Bhuwan" ✓, "John" ✗
  function validateDisplayName(input, email) {
    var local = (email || '').split('@')[0];
    var combined = local.split(/[._\-]/)
      .filter(function (t) { return !/^\d+$/.test(t); })
      .join('')
      .toLowerCase();
    var trimmed = (input || '').trim();
    if (!trimmed) return { ok: false, error: 'Enter a name.' };
    var words = trimmed.toLowerCase().split(/\s+/);
    if (words.length > 3) return { ok: false, error: 'Keep it to 3 words max.' };
    if (trimmed.length < 3) return { ok: false, error: 'Name must be at least 3 characters.' };
    if (/\d/.test(trimmed)) return { ok: false, error: 'Name can\'t contain numbers.' };
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (combined.indexOf(w) === -1) return { ok: false, error: '"' + w + '" isn\'t part of your name.' };
    }
    return { ok: true };
  }

  // Capitalise first letter of each word
  function titleCase(s) {
    return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  return {
    ready:              ready,
    requireAuth:        requireAuth,
    currentUser:        currentUser,
    signUp:             signUp,
    signIn:             signIn,
    signOut:            signOut,
    resendVerification: resendVerification,
    checkVerified:      checkVerified,
    changePassword:     changePassword,
    getMyPhone:         getMyPhone,
    setMyPhone:         setMyPhone,
    getStoredName:      getStoredName,
    setStoredName:      setStoredName,
    loadMyName:         loadMyName,
    myDisplayName:      myDisplayName,
    rideName:           rideName,
    rideFirstName:      rideFirstName,
    validateDisplayName: validateDisplayName,
    validateEmail:      validateEmail,
    displayName:        displayName,
    firstName:          firstName,
    titleCase:          titleCase
  };
})();

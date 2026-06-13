// ════════════════════════════════════════════════════════════════
// CampusRide v2 — ui.js
// Shared UI runtime: theme (auto/light/dark), nav, toasts, sheets,
// confirm dialogs, avatars, skeletons, count-up, PWA install.
// No dependencies. 2026-06-12.
// ════════════════════════════════════════════════════════════════

var UI = (function () {
  'use strict';

  /* ── Escape ─────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── Icon registry (Lucide-style, stroke=currentColor) ─────── */
  function icon(name, size) {
    var paths = {
      home:    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      car:     '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
      user:    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      users:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      plus:    '<path d="M5 12h14"/><path d="M12 5v14"/>',
      search:  '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
      pin:     '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
      flag:    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
      cal:     '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
      rupee:   '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/>',
      check:   '<path d="M20 6 9 17l-5-5"/>',
      checkbig:'<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
      x:       '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      alert:   '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
      info:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
      share:   '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
      phone:   '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
      star:    '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
      moon:    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
      sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
      mail:    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
      lock:    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      logout:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
      shield:  '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
      zap:     '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
      clock:   '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      arrow:   '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
      swap:    '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
      route:   '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
      download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
      wand:    '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
      whatsapp:'<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0zm0 0a5 5 0 0 0 5 5m0 0h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1z"/>'
    };
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }

  function starSvg(cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>';
  }

  /* vehicle glyphs (custom auto-rickshaw + bike) */
  function vehicleIcon(type, w, h) {
    var b = ' fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    var AUTO = '<g transform="scale(-1,1) translate(-72,0)"><circle cx="54" cy="38" r="8"/><circle cx="54" cy="38" r="3"/><circle cx="12" cy="38" r="6"/><circle cx="12" cy="38" r="2"/><path d="M20 36 L20 14 Q22 4 34 3 L54 3 Q62 6 62 14 L62 36 Z"/><line x1="20" y1="14" x2="27" y2="3"/><rect x="34" y="8" width="18" height="13" rx="2"/><path d="M20 32 L14 30 L12 32"/><path d="M15 22 Q18 19 22 20"/></g>';
    var BIKE = '<g transform="scale(-1,1) translate(-72,0)"><circle cx="54" cy="36" r="10"/><circle cx="54" cy="36" r="3.5"/><circle cx="16" cy="36" r="10"/><circle cx="16" cy="36" r="3.5"/><line x1="16" y1="26" x2="24" y2="12"/><path d="M22 12 L30 10 L32 13"/><path d="M30 10 L34 26 L46 26 L54 28"/><path d="M30 26 L28 16 L48 14 L52 22 L46 26"/><path d="M34 28 L34 36 L46 36 L46 28 Z"/><path d="M46 34 L58 36"/></g>';
    if (type === 'auto') return '<svg width="' + (w || 20) + '" height="' + (h || 14) + '" viewBox="0 0 72 48"' + b + ' stroke-width="2.2">' + AUTO + '</svg>';
    if (type === 'bike') return '<svg width="' + (w || 20) + '" height="' + (h || 14) + '" viewBox="0 0 72 48"' + b + ' stroke-width="2.2">' + BIKE + '</svg>';
    return icon('car', w || 16);
  }

  /* ── Theme (auto | light | dark) ────────────────────────────── */
  var THEME_KEY = 'cr-theme';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function themeGet() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return (v === 'light' || v === 'dark') ? v : 'auto';
    } catch (_) { return 'auto'; }
  }
  function themeEffective() {
    var m = themeGet();
    if (m === 'auto') return (mq && mq.matches) ? 'light' : 'dark';
    return m;
  }
  function themeApply() {
    var eff = themeEffective();
    if (eff === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', eff === 'light' ? '#f4f2ec' : '#14110d');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(eff === 'light'));
      btn.setAttribute('aria-label', eff === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
    document.querySelectorAll('[data-theme-seg]').forEach(function (seg) {
      var mode = themeGet();
      seg.querySelectorAll('.seg__opt').forEach(function (o) {
        o.classList.toggle('active', o.dataset.mode === mode);
      });
    });
  }
  function themeSet(mode) {
    try {
      if (mode === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, mode);
    } catch (_) {}
    themeApply();
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (themeGet() === 'auto') themeApply(); });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-toggle]');
    if (btn) { e.preventDefault(); themeSet(themeEffective() === 'light' ? 'dark' : 'light'); return; }
    var opt = e.target.closest('[data-theme-seg] .seg__opt');
    if (opt) { themeSet(opt.dataset.mode); }
  });

  /* ── Nav ────────────────────────────────────────────────────── */
  var BRAND_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.4" cy="17.6" r="2.7"/><line x1="8.7" y1="15.3" x2="15.3" y2="8.7"/><circle cx="17.6" cy="6.4" r="2.7"/></svg>';

  function themeBtn() {
    return '<button type="button" class="theme-btn" data-theme-toggle aria-label="Toggle theme" aria-pressed="false">' +
      '<span class="i-moon">' + icon('moon', 17) + '</span><span class="i-sun">' + icon('sun', 17) + '</span></button>';
  }

  function mountNav(active) {
    var links = [
      { id: 'home',    href: 'index.html',   label: 'Home',    ic: 'home' },
      { id: 'rides',   href: 'rides.html',   label: 'Rides',   ic: 'car' },
      { id: 'profile', href: 'profile.html', label: 'Profile', ic: 'user' }
    ];
    var top = document.createElement('nav');
    top.className = 'nav-top';
    top.setAttribute('aria-label', 'Primary');
    top.innerHTML =
      '<div class="nav-top__inner">' +
        '<a class="brand" href="index.html" aria-label="CampusRide home">' +
          '<span class="brand__mark">' + BRAND_GLYPH + '</span>CampusRide</a>' +
        '<div class="nav-top__links">' +
          links.map(function (l) {
            return '<a class="nav-top__link' + (l.id === active ? ' active' : '') + '" href="' + l.href + '"' +
              (l.id === active ? ' aria-current="page"' : '') + '>' + icon(l.ic) + '<span>' + l.label + '</span></a>';
          }).join('') +
        '</div>' +
        '<div class="nav-top__actions">' + themeBtn() + '</div>' +
      '</div>';
    document.body.insertBefore(top, document.body.firstChild);

    var pill = document.createElement('nav');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-label', 'Primary');
    pill.innerHTML = links.map(function (l) {
      return '<a class="nav-pill__link' + (l.id === active ? ' active' : '') + '" href="' + l.href + '"' +
        (l.id === active ? ' aria-current="page"' : '') + '>' + icon(l.ic, 21) + '<span>' + l.label + '</span></a>';
    }).join('');
    document.body.appendChild(pill);

    ensureToasts();
    themeApply();
  }

  /* ── Toasts ─────────────────────────────────────────────────── */
  function ensureToasts() {
    var t = document.querySelector('.toasts');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toasts';
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    return t;
  }

  function toast(msg, type, opts) {
    opts = opts || {};
    var wrap = ensureToasts();
    var el = document.createElement('div');
    var icMap = { success: 'check', error: 'alert', info: 'info' };
    el.className = 'toast toast--' + (type || 'info');
    el.setAttribute('role', 'status');
    el.innerHTML = icon(icMap[type] || 'info', 17) + '<span>' + esc(msg) + '</span>' +
      (opts.action ? '<button type="button" class="toast__action">' + esc(opts.action.label) + '</button>' : '');
    if (opts.action) {
      el.querySelector('.toast__action').addEventListener('click', function () {
        dismiss(); opts.action.fn();
      });
    }
    wrap.appendChild(el);
    var timer = setTimeout(dismiss, opts.duration || 3400);
    function dismiss() {
      clearTimeout(timer);
      if (!el.parentNode) return;
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 320);
    }
    return dismiss;
  }

  /* ── Sheets ─────────────────────────────────────────────────── */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var _lastFocus = null;

  function openSheet(overlay) {
    if (typeof overlay === 'string') overlay = document.getElementById(overlay);
    if (!overlay) return;
    _lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('[data-autofocus]') || overlay.querySelector(FOCUSABLE);
    if (first) setTimeout(function () { first.focus(); }, 60);

    function onKey(e) {
      if (e.key === 'Escape' && !overlay.classList.contains('overlay--locked')) { closeSheet(overlay); }
      if (e.key === 'Tab') {
        var items = Array.prototype.filter.call(overlay.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null; });
        if (!items.length) return;
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && (i === 0 || i === -1)) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    }
    overlay._keyHandler = onKey;
    document.addEventListener('keydown', onKey);
  }

  function closeSheet(overlay) {
    if (typeof overlay === 'string') overlay = document.getElementById(overlay);
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (overlay._keyHandler) { document.removeEventListener('keydown', overlay._keyHandler); overlay._keyHandler = null; }
    if (_lastFocus && _lastFocus.focus) { _lastFocus.focus(); _lastFocus = null; }
  }

  /* click on overlay backdrop closes (unless locked) */
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('overlay') &&
        e.target.classList.contains('open') && !e.target.classList.contains('overlay--locked')) {
      closeSheet(e.target);
    }
  });

  /* ── Confirm sheet (Promise<boolean>) ───────────────────────── */
  var _confirmEl = null;
  function confirmSheet(opts) {
    opts = opts || {};
    if (!_confirmEl) {
      _confirmEl = document.createElement('div');
      _confirmEl.className = 'overlay';
      _confirmEl.setAttribute('role', 'dialog');
      _confirmEl.setAttribute('aria-modal', 'true');
      _confirmEl.setAttribute('aria-hidden', 'true');
      _confirmEl.innerHTML =
        '<div class="sheet" style="max-width:420px;">' +
          '<div class="sheet__handle"></div>' +
          '<h2 class="sheet__title" id="cfTitle"></h2>' +
          '<p id="cfMsg" style="color:var(--text-2); font-size:0.9rem; margin:-0.5rem 0 1.25rem;"></p>' +
          '<div class="sheet__actions">' +
            '<button type="button" class="btn btn--ghost" id="cfNo">Keep</button>' +
            '<button type="button" class="btn btn--primary" id="cfYes" data-autofocus>Confirm</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(_confirmEl);
    }
    var titleEl = _confirmEl.querySelector('#cfTitle');
    var msgEl   = _confirmEl.querySelector('#cfMsg');
    var yes     = _confirmEl.querySelector('#cfYes');
    var no      = _confirmEl.querySelector('#cfNo');
    titleEl.textContent = opts.title || 'Are you sure?';
    msgEl.textContent   = opts.message || '';
    yes.textContent     = opts.confirmLabel || 'Confirm';
    no.textContent      = opts.cancelLabel || 'Go back';
    yes.className = 'btn ' + (opts.danger ? 'btn--danger' : 'btn--primary');

    return new Promise(function (resolve) {
      function done(v) {
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
        closeSheet(_confirmEl);
        resolve(v);
      }
      function onYes() { done(true); }
      function onNo()  { done(false); }
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
      openSheet(_confirmEl);
    });
  }

  /* ── Avatars ────────────────────────────────────────────────── */
  var AVA_GRADS = [
    ['#c98f5f', '#96622f'], ['#e08d5a', '#b35f33'], ['#5fb592', '#2e7d5e'],
    ['#5fa8c9', '#39708a'], ['#d4799b', '#a04e71'], ['#d9a441', '#a3741c'],
    ['#8f7be0', '#62519c'], ['#a98d6b', '#7b6248'], ['#8fae6a', '#5f7e45'],
    ['#c47fb1', '#8f5380']
  ];
  function hashCode(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  function avatarStyle(email) {
    var g = AVA_GRADS[hashCode(email || 'x') % AVA_GRADS.length];
    return 'background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ');';
  }
  function initials(name) {
    return (name || '?').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  /* ── Stars markup ───────────────────────────────────────────── */
  function starsHTML(avg) {
    var out = '<span class="stars-display" aria-hidden="true">';
    var rounded = Math.round(avg || 0);
    for (var i = 1; i <= 5; i++) out += starSvg(i <= rounded ? '' : 'off');
    return out + '</span>';
  }

  /* ── Greeting / time chips ──────────────────────────────────── */
  function greeting() {
    var h = new Date().getHours();
    if (h < 5)  return 'Up late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function timeChip(datetime) {
    var diff = new Date(datetime) - Date.now();
    return { soon: diff > 0 && diff < 60 * 60 * 1000 };
  }

  /* ── Count-up ───────────────────────────────────────────────── */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el, target, decimals) {
    if (el == null) return;
    var d = decimals || 0;
    if (REDUCED || !window.requestAnimationFrame) { el.textContent = target.toFixed(d); return; }
    var dur = 800, t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(d);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ── Skeletons / stagger ────────────────────────────────────── */
  function skeletons(container, n) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    var html = '';
    for (var i = 0; i < (n || 3); i++) {
      html +=
        '<div class="skel-card" aria-hidden="true">' +
          '<div style="display:flex;gap:0.7rem;align-items:center;">' +
            '<div class="skel" style="width:40px;height:40px;border-radius:14px;"></div>' +
            '<div style="flex:1;display:flex;flex-direction:column;gap:0.4rem;">' +
              '<div class="skel" style="height:12px;width:55%;"></div>' +
              '<div class="skel" style="height:9px;width:35%;"></div>' +
            '</div>' +
            '<div class="skel" style="height:22px;width:72px;border-radius:999px;"></div>' +
          '</div>' +
          '<div class="skel" style="height:13px;width:70%;"></div>' +
          '<div class="skel" style="height:13px;width:55%;"></div>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function stagger(container) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    Array.prototype.forEach.call(container.children, function (child, i) {
      child.style.setProperty('--i', Math.min(i, 8));
      child.classList.add('reveal');
    });
  }

  /* ── PWA: service worker + install prompt ───────────────────── */
  var _bip = null, _bipCbs = [];
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    _bip = e;
    _bipCbs.forEach(function (cb) { cb(); });
  });
  function onInstallable(cb) { if (_bip) cb(); else _bipCbs.push(cb); }
  function promptInstall() {
    if (!_bip) return;
    _bip.prompt();
    _bip.userChoice.then(function () { _bip = null; });
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    var ok = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!ok) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* non-fatal */ });
    });
  }

  /* ── Mandatory phone gate ───────────────────────────────────── */
  // Non-dismissable sheet shown until a valid WhatsApp number is saved.
  // save(formattedPhone, done) → call done(true) on success.
  var _phoneEl = null;
  function requirePhone(save) {
    if (!_phoneEl) {
      _phoneEl = document.createElement('div');
      _phoneEl.className = 'overlay overlay--locked';
      _phoneEl.setAttribute('role', 'dialog');
      _phoneEl.setAttribute('aria-modal', 'true');
      _phoneEl.setAttribute('aria-labelledby', 'pgTitle');
      _phoneEl.innerHTML =
        '<div class="sheet" style="max-width:440px;">' +
          '<div class="sheet__handle"></div>' +
          '<h2 class="sheet__title" id="pgTitle">Add your WhatsApp number</h2>' +
          '<p style="color:var(--text-2); font-size:0.88rem; margin:-0.5rem 0 1.1rem;">' +
            'CampusRide needs it so students who book your ride can reach you. ' +
            'It’s only shown to confirmed bookers.</p>' +
          '<div style="display:flex; gap:0.5rem; margin-bottom:0.6rem;">' +
            '<input id="pgCC" class="input input--plain" type="text" value="+91" maxlength="5" aria-label="Country code" style="width:76px; flex-shrink:0;">' +
            '<input id="pgNum" class="input input--plain" type="tel" inputmode="numeric" placeholder="10-digit number" maxlength="10" aria-label="Phone number" data-autofocus>' +
          '</div>' +
          '<div class="msg-error" id="pgError" role="alert"></div>' +
          '<button type="button" class="btn btn--primary btn--block" id="pgSave" style="margin-top:0.6rem;">Save &amp; continue</button>' +
        '</div>';
      document.body.appendChild(_phoneEl);

      _phoneEl.querySelector('#pgSave').addEventListener('click', function () {
        var errEl = _phoneEl.querySelector('#pgError');
        errEl.style.display = 'none';
        var cc  = _phoneEl.querySelector('#pgCC').value.trim();
        var num = _phoneEl.querySelector('#pgNum').value.replace(/\s/g, '').trim();
        if (!/^\+\d{1,3}$/.test(cc)) {
          errEl.textContent = 'Enter a valid country code (e.g. +91).';
          errEl.style.display = 'block'; return;
        }
        if (!/^\d{10}$/.test(num)) {
          errEl.textContent = 'Phone number must be exactly 10 digits.';
          errEl.style.display = 'block'; return;
        }
        var btn = _phoneEl.querySelector('#pgSave');
        btn.disabled = true; btn.textContent = 'Saving…';
        var formatted = cc + ' ' + num.slice(0, 5) + ' ' + num.slice(5);
        save(formatted, function (ok) {
          btn.disabled = false; btn.textContent = 'Save & continue';
          if (ok) {
            closeSheet(_phoneEl);
            toast('Phone saved — you’re all set', 'success');
          } else {
            errEl.textContent = 'Could not save — check your connection and retry.';
            errEl.style.display = 'block';
          }
        });
      });
    }
    openSheet(_phoneEl);
  }

  /* ── Share ──────────────────────────────────────────────────── */
  function share(data, fallbackMsg) {
    if (navigator.share) {
      navigator.share(data).catch(function () { /* user dismissed */ });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText((data.title ? data.title + '\n' : '') + (data.text || '') + (data.url ? '\n' + data.url : ''))
        .then(function () { toast(fallbackMsg || 'Copied to clipboard', 'success'); })
        .catch(function () { toast('Could not share', 'error'); });
    } else {
      toast('Sharing not supported here', 'error');
    }
  }

  /* apply theme ASAP (head inline script already pre-painted) */
  themeApply();
  registerSW();

  return {
    esc: esc,
    icon: icon,
    starSvg: starSvg,
    starsHTML: starsHTML,
    vehicleIcon: vehicleIcon,
    theme: { get: themeGet, set: themeSet, effective: themeEffective, apply: themeApply },
    mountNav: mountNav,
    themeBtnHTML: themeBtn,
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    confirm: confirmSheet,
    avatarStyle: avatarStyle,
    initials: initials,
    greeting: greeting,
    timeChip: timeChip,
    countUp: countUp,
    skeletons: skeletons,
    stagger: stagger,
    onInstallable: onInstallable,
    promptInstall: promptInstall,
    requirePhone: requirePhone,
    share: share
  };
})();

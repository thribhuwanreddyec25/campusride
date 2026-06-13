// CampusRide v2 — theme.js (deprecated shim)
// Theme handling moved into ui.js (UI.theme). This file is kept only
// so any stale cached page referencing theme.js doesn't 404.
// Safe to delete once all pages are confirmed on v2.
(function () {
  if (window.UI && UI.theme) { UI.theme.apply(); }
})();

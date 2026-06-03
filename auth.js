// Campus Ride – Auth utilities (localStorage)
// Up to 10 @bmsce.ac.in accounts. No server required.

const AUTH = (function () {
  const ACCOUNTS_KEY = 'cr_accounts';
  const CURRENT_KEY  = 'cr_current_user';
  const MAX_ACCOUNTS = 10;
  const DOMAIN       = '@bmsce.ac.in';

  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || []; }
    catch (_) { return []; }
  }

  function saveAccounts(a) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
  }

  function getAccount(email) {
    return getAccounts().find(function (a) { return a.email === email; });
  }

  function updateAccount(email, updates) {
    var accounts = getAccounts();
    var idx = accounts.findIndex ? accounts.findIndex(function(a){ return a.email === email; })
                                 : (function(){ for(var i=0;i<accounts.length;i++){ if(accounts[i].email===email) return i; } return -1; })();
    if (idx === -1) return false;
    Object.keys(updates).forEach(function(k){ accounts[idx][k] = updates[k]; });
    saveAccounts(accounts);
    return true;
  }

  function addAccount(email, password) {
    var accounts = getAccounts();
    if (accounts.length >= MAX_ACCOUNTS) return { ok: false, error: 'max_accounts' };
    if (getAccount(email))               return { ok: false, error: 'exists' };
    accounts.push({ email: email, password: password, createdAt: Date.now() });
    saveAccounts(accounts);
    return { ok: true };
  }

  function currentUser() {
    try { return localStorage.getItem(CURRENT_KEY) || null; }
    catch (_) { return null; }
  }

  function login(email) {
    localStorage.setItem(CURRENT_KEY, email);
  }

  function logout() {
    localStorage.removeItem(CURRENT_KEY);
  }

  // Redirect to login if not authenticated
  function requireAuth() {
    if (!currentUser()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // "arjun.kumar@bmsce.ac.in" → "Arjun Kumar"
  function displayName(email) {
    var local = (email || '').split('@')[0];
    return local.split(/[._\-]/).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ') || 'Student';
  }

  function validateEmail(email) {
    var trimmed = (email || '').trim().toLowerCase();
    if (!trimmed.endsWith(DOMAIN)) return { ok: false, error: 'Must use a @bmsce.ac.in email.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { ok: false, error: 'Invalid email format.' };
    return { ok: true, email: trimmed };
  }

  return {
    getAccount:    getAccount,
    getAccounts:   getAccounts,
    addAccount:    addAccount,
    updateAccount: updateAccount,
    currentUser:   currentUser,
    login:         login,
    logout:        logout,
    requireAuth:   requireAuth,
    displayName:   displayName,
    validateEmail: validateEmail,
    MAX_ACCOUNTS:  MAX_ACCOUNTS,
  };
})();

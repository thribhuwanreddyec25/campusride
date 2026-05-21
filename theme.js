// Campus Ride – theme toggle
// Default = dark. Persisted in localStorage under 'cr-theme'.
(function () {
  const STORAGE_KEY = 'cr-theme';
  const root = document.documentElement;

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (_) {}
  }
  function apply(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    // Update every toggle button on the page
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const isLight = theme === 'light';
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute(
        'aria-label',
        isLight ? 'Switch to dark mode' : 'Switch to light mode'
      );
    });
  }

  // Initial apply (in case the early head script didn't run)
  const initial = getStored() === 'light' ? 'light' : 'dark';
  apply(initial);

  // Wire up toggles
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    e.preventDefault();
    const current =
      root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    setStored(next);
    apply(next);
  });
})();

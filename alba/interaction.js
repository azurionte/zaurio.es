(() => {
  const canVibrate = typeof navigator.vibrate === 'function';
  if (!canVibrate) return;
  const touchOnly = matchMedia('(pointer: coarse)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', event => {
    if (!event.isTrusted || event.defaultPrevented || !touchOnly.matches || reduce.matches ||
        event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a.btn, .top nav a, .contact-link-list a');
    if (!link || link.getAttribute('aria-current') === 'page') return;
    try { navigator.vibrate(9); } catch { /* Visual feedback remains available. */ }
  }, { passive: true });
})();

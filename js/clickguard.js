/* Track a tagged PowerLink entry and its short in-site navigation session. */
(() => {
  'use strict';
  const p = new URLSearchParams(location.search);
  const tagged = p.get('n_campaign_type') === '1' && !!(p.get('n_ad') || p.get('n_ad_group'));
  let active = false;
  try {
    const entry = JSON.parse(sessionStorage.getItem('clickguard-entry-areaclean24'));
    active = !!(entry && entry.fields && entry.receipt && entry.created > Date.now() - 30 * 60000);
  } catch {}
  if (!tagged && !active) return;
  const script = document.createElement('script');
  script.src = 'https://areaclean24-clickguard.forceo007.workers.dev/tracker.js?v=2';
  script.dataset.site = 'areaclean24';
  script.dataset.endpoint = 'https://areaclean24-clickguard.forceo007.workers.dev/collect';
  script.async = true;
  document.body.appendChild(script);
})();

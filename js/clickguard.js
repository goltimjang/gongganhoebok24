/* Load the landing tracker only for tagged PowerLink visits. */
(() => {
  'use strict';
  const p = new URLSearchParams(location.search);
  if (p.get('n_campaign_type') !== '1' || !(p.get('n_ad') || p.get('n_ad_group'))) return;
  const script = document.createElement('script');
  script.src = 'https://areaclean24-clickguard.forceo007.workers.dev/tracker.js';
  script.dataset.site = 'areaclean24';
  script.dataset.endpoint = 'https://areaclean24-clickguard.forceo007.workers.dev/collect';
  script.async = true;
  document.body.appendChild(script);
})();

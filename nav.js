(function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const primaryLinks = [
    { href: 'newcomer-start.html', label: 'Newcomer' },
    { href: 'education.html',      label: 'Education' },
    { href: 'finance.html',        label: 'Finance' },
    { href: 'healthcare.html',     label: 'Healthcare' },
    { href: 'news.html',           label: '🔴 Live', live: true },
  ];

  const moreLinks = [
    { href: 'tools.html',          label: '🧮 Financial Planner' },
    { href: 'cost-of-living.html', label: '💵 Cost of Living' },
    { href: 'credit.html',         label: '💳 Credit Builder' },
    { href: 'travel.html',         label: 'Travel' },
    { href: 'recreation.html',     label: 'Recreation' },
    { href: 'tech-careers.html',   label: 'Tech & AI' },
    { href: 'about.html',          label: 'About' },
    { href: 'contact.html',        label: 'Contact' },
  ];

  const allLinks = [...primaryLinks, ...moreLinks];

  function isActive(href) { return currentPage === href; }

  const primaryHTML = primaryLinks.map(l =>
    `<a href="${l.href}" class="nav-link${isActive(l.href) ? ' nav-active' : ''}${l.live ? ' nav-live' : ''}">${l.label}</a>`
  ).join('');

  const moreItemsHTML = moreLinks.map(l =>
    `<a href="${l.href}" class="nav-more-item${isActive(l.href) ? ' nav-active' : ''}">${l.label}</a>`
  ).join('');

  const allLinksHTML = allLinks.map(l =>
    `<a href="${l.href}" class="nav-mob-item${isActive(l.href) ? ' nav-active' : ''}${l.live ? ' nav-live' : ''}">${l.label}</a>`
  ).join('');

  const html = `
<nav id="cfg-nav">
  <a class="nav-logo" href="index.html">🍁 Canada <span>Family Guide</span></a>
  <div class="nav-desktop">
    ${primaryHTML}
    <div class="nav-more-wrap">
      <button class="nav-more-btn" id="nav-more-btn" aria-expanded="false">More <span class="nav-more-arrow">&#9660;</span></button>
      <div class="nav-more-drop" id="nav-more-drop">${moreItemsHTML}</div>
    </div>
  </div>
  <button class="nav-ham" id="nav-ham" aria-label="Menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="nav-mob-panel" id="nav-mob-panel">${allLinksHTML}</div>
<style>
#cfg-nav{position:fixed;top:0;left:0;right:0;height:60px;background:rgba(247,245,240,.96);backdrop-filter:blur(8px);border-bottom:1px solid #ddd;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;font-family:'Plus Jakarta Sans','DM Sans',sans-serif}
.nav-logo{font-weight:800;font-size:1rem;color:#0f0f0f;text-decoration:none;display:flex;align-items:center;gap:.4rem;white-space:nowrap;flex-shrink:0}
.nav-logo span{color:#C8102E}
.nav-desktop{display:flex;align-items:center;gap:2px}
.nav-link{font-size:.82rem;font-weight:500;color:#555;text-decoration:none;padding:5px 10px;border-radius:6px;transition:color .2s;white-space:nowrap}
.nav-link:hover,.nav-link.nav-active{color:#C8102E}
.nav-link.nav-live{color:#C8102E;font-weight:700}
.nav-more-wrap{position:relative}
.nav-more-btn{font-size:.82rem;font-weight:600;color:#555;background:none;border:1px solid #ddd;border-radius:6px;padding:4px 10px;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit;transition:all .2s}
.nav-more-btn:hover{color:#C8102E;border-color:#C8102E}
.nav-more-arrow{font-size:.65rem;transition:transform .2s;display:inline-block}
.nav-more-btn[aria-expanded="true"] .nav-more-arrow{transform:rotate(180deg)}
.nav-more-drop{display:none;position:absolute;right:0;top:calc(100% + 8px);background:#fff;border:1px solid #e0dbd0;border-radius:8px;padding:6px;min-width:150px;z-index:300;box-shadow:0 4px 16px rgba(0,0,0,.08)}
.nav-more-drop.open{display:block}
.nav-more-item{display:block;font-size:.85rem;font-weight:500;color:#0f0f0f;text-decoration:none;padding:7px 12px;border-radius:5px;transition:background .15s,color .15s}
.nav-more-item:hover{background:#F7F5F0;color:#C8102E}
.nav-more-item.nav-active{color:#C8102E}
.nav-ham{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:36px;height:36px;background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;flex-shrink:0}
.nav-ham:hover{background:#EDE9E0}
.nav-ham span{display:block;width:20px;height:2px;background:#0f0f0f;border-radius:2px;transition:transform .25s,opacity .25s}
.nav-ham[aria-expanded="true"] span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.nav-ham[aria-expanded="true"] span:nth-child(2){opacity:0}
.nav-ham[aria-expanded="true"] span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.nav-mob-panel{display:none;position:fixed;top:60px;left:0;right:0;background:rgba(247,245,240,.98);backdrop-filter:blur(8px);border-bottom:1px solid #ddd;z-index:199;padding:.75rem 1.5rem 1rem;grid-template-columns:1fr 1fr;gap:2px}
.nav-mob-panel.open{display:grid}
.nav-mob-item{font-size:.9rem;font-weight:500;color:#0f0f0f;text-decoration:none;padding:10px 12px;border-radius:6px;transition:background .15s,color .15s}
.nav-mob-item:hover{background:#EDE9E0;color:#C8102E}
.nav-mob-item.nav-active{color:#C8102E}
.nav-mob-item.nav-live{color:#C8102E;font-weight:700}
@media(max-width:780px){.nav-desktop{display:none}.nav-ham{display:flex}}
@media(min-width:781px){.nav-mob-panel{display:none!important}}
</style>`;

  const existing = document.querySelector('nav');
  if (existing) { existing.insertAdjacentHTML('afterend', html); existing.remove(); }
  else { document.body.insertAdjacentHTML('afterbegin', html); }

  document.querySelectorAll('.nav-mob-panel').forEach((el, i) => { if (i > 0) el.remove(); });

  const moreBtn = document.getElementById('nav-more-btn');
  const moreDrop = document.getElementById('nav-more-drop');
  const hamBtn  = document.getElementById('nav-ham');
  const mobPanel = document.getElementById('nav-mob-panel');

  if (moreBtn) moreBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const open = moreDrop.classList.toggle('open');
    moreBtn.setAttribute('aria-expanded', open);
  });

  if (hamBtn) hamBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const open = mobPanel.classList.toggle('open');
    hamBtn.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', function() {
    if (moreDrop) { moreDrop.classList.remove('open'); if (moreBtn) moreBtn.setAttribute('aria-expanded', false); }
    if (mobPanel) { mobPanel.classList.remove('open'); if (hamBtn) hamBtn.setAttribute('aria-expanded', false); }
  });

  if (mobPanel) mobPanel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobPanel.classList.remove('open');
    if (hamBtn) hamBtn.setAttribute('aria-expanded', false);
  }));
})();

// PWA — inject manifest link and register service worker
(function() {
  // Add manifest link if not already present
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);
  }

  // Add theme-color meta if not present
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#C8102E';
    document.head.appendChild(meta);
  }

  // Add apple-mobile-web-app meta tags for iOS
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const tags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Canada Guide' },
    ];
    tags.forEach(t => {
      const m = document.createElement('meta');
      m.name = t.name; m.content = t.content;
      document.head.appendChild(m);
    });
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
})();

// Analytics — GoatCounter
(function() {
  // Skip if already loaded (defensive — prevents double-counting)
  if (document.querySelector('script[data-goatcounter]')) return;

  // Skip localhost / file:// so local testing doesn't pollute real stats
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '' || window.location.protocol === 'file:') return;

  const s = document.createElement('script');
  s.async = true;
  s.src = '//gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://canadafamilyguide.goatcounter.com/count');
  document.head.appendChild(s);
})();

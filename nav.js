// nav.js — Single source of truth for site navigation
// Drop this file in your repo root. Every page loads it with:
// <script src="nav.js"></script>  (placed right after <body>)

(function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const links = [
    { href: 'newcomer-start.html', label: 'Newcomer' },
    { href: 'education.html',      label: 'Education' },
    { href: 'finance.html',        label: 'Finance' },
    { href: 'travel.html',         label: 'Travel' },
    { href: 'healthcare.html',     label: 'Healthcare' },
    { href: 'news.html',           label: '🔴 Live', style: 'color:var(--red);font-weight:700' },
    { href: 'tech-careers.html',   label: 'Tech & AI' },
    { href: 'about.html',          label: 'About' },
  ];

  const navLinks = links.map(link => {
    const isActive = currentPage === link.href;
    const styleAttr = link.style ? ` style="${link.style}"` : '';
    const activeClass = isActive ? ' active' : '';
    return `<a href="${link.href}" class="nav-link${activeClass}"${styleAttr}>${link.label}</a>`;
  }).join('\n    ');

  const isHomePage = currentPage === 'index.html' || currentPage === '';
  const homeBtn = isHomePage ? '' : `<a class="nav-home" href="index.html">← Home</a>`;

  const navHTML = `
<nav>
  <a class="nav-logo" href="index.html">🍁 Canada <span>Family Guide</span></a>
  <div class="nav-links">
    ${homeBtn}
    ${navLinks}
  </div>
</nav>`;

  // Insert nav at the top of body, replacing any existing <nav> element
  const existing = document.querySelector('nav');
  if (existing) {
    existing.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }
})();

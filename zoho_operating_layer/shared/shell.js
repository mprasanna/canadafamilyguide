/* Shared shell builder — generates sidebar + topbar + tour overlay HTML */
window.ZOLShell = {

  nav: [
    { section:'Executive Experience', items:[
      { id:'overview',  n:'00', label:'Overview',        file:'00-overview.html' },
      { id:'ceo',       n:'01', label:'CEO Daily Brief', file:'01-ceo-brief.html', dot:'#E0432F' },
      { id:'growth',    n:'02', label:'Growth',           file:'02-growth.html' },
      { id:'customers', n:'03', label:'Customers',        file:'03-customers.html', dot:'#D14343' },
      { id:'execution', n:'04', label:'Execution',        file:'04-execution.html' },
      { id:'people',    n:'05', label:'People',           file:'05-people.html' },
      { id:'cash',      n:'06', label:'Cash',             file:'06-cash.html' },
      { id:'changed',   n:'+',  label:'What Changed',     file:'0x-what-changed.html' },
      { id:'meeting',   n:'+',  label:'Meeting Prep',     file:'0x-meeting-prep.html' },
      { id:'delivery',  n:'+',  label:'Cliq & Mobile',   file:'0x-cliq-mobile.html' },
    ]},
    { section:'Signal Intelligence', items:[
      { id:'explorer',   n:'07', label:'Signal Explorer', file:'07-signal-explorer.html', dot:'#C8841C' },
      { id:'signal',     n:'08', label:'Signal Detail',   file:'08-signal-detail.html' },
      { id:'graph',      n:'09', label:'Business Graph',  file:'09-business-graph.html' },
      { id:'thresholds', n:'+',  label:'Signal Thresholds',file:'0x-thresholds.html' },
    ]},
    { section:'Recommendation & Action', items:[
      { id:'recommend', n:'10', label:'Recommendation Center', file:'10-recommendations.html' },
      { id:'approval',  n:'11', label:'Approval Center',       file:'11-approval-center.html' },
      { id:'delegation',n:'12', label:'Delegation Center',     file:'12-delegation.html' },
      { id:'outcomes',  n:'+',  label:'Outcomes',              file:'0x-outcomes.html' },
    ]},
    { section:'Role Cascade', items:[
      { id:'vpsales', n:'13', label:'VP Sales Brief', file:'13-vp-sales.html' },
      { id:'cfo',     n:'14', label:'CFO Brief',      file:'14-cfo.html' },
    ]},
    { section:'Platform Story', items:[
      { id:'architecture', n:'15', label:'Architecture',       file:'15-architecture.html' },
      { id:'dataflow',     n:'+',  label:'Data Flow',          file:'0x-data-flow.html' },
      { id:'metrics',      n:'+',  label:'Success Metrics',    file:'0x-metrics.html' },
      { id:'maturity',     n:'+',  label:'Maturity & Roadmap', file:'0x-maturity.html' },
    ]},
  ],

  sidebar(activeId) {
    const items = this.nav.map(sec => {
      const navItems = sec.items.map(it => {
        const isActive = it.id === activeId;
        return `<a href="${it.file}" class="nav-item${isActive?' active':''}">
          <span class="nav-num">${it.n}</span>
          <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.label}</span>
          ${it.dot ? `<span class="nav-dot" style="background:${it.dot}"></span>` : ''}
        </a>`;
      }).join('');
      return `<div class="nav-section-label">${sec.section}</div>${navItems}`;
    }).join('');

    return `<aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <div class="sidebar-logo-grid">
            <span class="sidebar-logo-dot"></span>
            <span class="sidebar-logo-dot dim"></span>
            <span class="sidebar-logo-dot dim"></span>
            <span class="sidebar-logo-dot"></span>
          </div>
        </div>
        <div>
          <div class="sidebar-brand-name">Zoho One</div>
          <div class="sidebar-brand-sub">Operating Layer</div>
        </div>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      <div class="sidebar-user">
        <div class="sidebar-avatar">MF</div>
        <div>
          <div class="sidebar-user-name">Mark Francis</div>
          <div class="sidebar-user-role">Chief Executive Officer</div>
        </div>
      </div>
    </aside>`;
  },

  topbar(title, sub) {
    return `<header class="topbar">
      <div class="topbar-title">
        <h1>${title}</h1>
        <p>${sub}</p>
      </div>
      <div class="topbar-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        Ask the Operating Layer…
      </div>
      <div style="position:relative">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
        <span style="position:absolute;top:-3px;right:-3px;width:7px;height:7px;border-radius:50%;background:#E0432F;border:1.5px solid #fff"></span>
      </div>
      <span class="topbar-time">7:02 AM</span>
    </header>`;
  },

  wrap(activeId, title, sub, contentHtml) {
    return `${this.sidebar(activeId)}
    <main class="main">
      ${this.topbar(title, sub)}
      <div class="content">
        <div class="content-inner">${contentHtml}</div>
      </div>
    </main>`;
  },

  head(pageTitle) {
    return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle} — Zoho One Operating Layer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../shared/design.css">
</head>`;
  },
};

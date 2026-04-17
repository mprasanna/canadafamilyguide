/* ============================================================
   Canada Family Guide — Feedback Widget
   ------------------------------------------------------------
   Drop-in thumbs-up/down widget. Posts to Web3Forms.
   
   USAGE:
   
   1. Include once per page, just before </body>:
        <script src="feedback.js"></script>
   
   2. For a SECTION-level widget, add anywhere in the page:
        <div class="cfg-thumbs" data-section="TFSA"></div>
   
   3. For a PAGE-level widget at the bottom, add:
        <div class="cfg-thumbs" data-section="Page (bottom)"></div>
      OR just let it auto-inject by setting this data attr on <body>:
        <body data-auto-thumbs="true">
   
   The widget auto-detects the page filename (e.g. "finance.html")
   and sends it along with the section label and vote.
   ============================================================ */

(function(){
  'use strict';

  var ACCESS_KEY = '72b4da98-3bdb-47a4-b133-2d29019d665a';
  var ENDPOINT   = 'https://api.web3forms.com/submit';
  var PAGE_SLUG  = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';

  /* ---------- STYLES (injected once) ---------- */
  var css = [
    '.cfg-thumbs{',
    '  margin:2rem 0 1.5rem;padding:1.2rem 1.4rem;',
    '  background:#F7F5F0;border:1px solid #e0dbd0;border-radius:10px;',
    '  display:flex;flex-wrap:wrap;align-items:center;gap:.9rem;',
    '  font-family:"DM Sans",sans-serif;',
    '}',
    '.cfg-thumbs-prompt{',
    '  font-family:"Plus Jakarta Sans",sans-serif;font-weight:700;',
    '  font-size:.88rem;color:#0f0f0f;margin-right:.3rem;',
    '}',
    '.cfg-thumbs-section{',
    '  font-size:.75rem;color:#666;font-weight:500;',
    '  background:#fff;padding:.2rem .55rem;border-radius:4px;',
    '  border:1px solid #e0dbd0;',
    '}',
    '.cfg-thumbs-btn{',
    '  display:inline-flex;align-items:center;gap:.35rem;',
    '  background:#fff;border:1px solid #d8d3c8;border-radius:6px;',
    '  padding:.45rem .85rem;cursor:pointer;',
    '  font-size:.85rem;font-weight:600;color:#0f0f0f;',
    '  transition:all .15s;font-family:inherit;',
    '}',
    '.cfg-thumbs-btn:hover{border-color:#C8102E;transform:translateY(-1px)}',
    '.cfg-thumbs-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}',
    '.cfg-thumbs-btn.voted{background:#C8102E;border-color:#C8102E;color:#fff}',
    '.cfg-thumbs-btn .cfg-ico{width:16px;height:16px;display:inline-block}',
    '.cfg-thumbs-followup{',
    '  flex-basis:100%;display:none;margin-top:.4rem;',
    '  flex-wrap:wrap;gap:.6rem;align-items:flex-start;',
    '  background:#FFF9E6;border:1px solid #F0D878;border-left:3px solid #E8A53D;',
    '  border-radius:6px;padding:.9rem 1rem;',
    '  animation:cfgFadeIn .25s ease;',
    '}',
    '.cfg-thumbs-followup.show{display:flex}',
    '@keyframes cfgFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}',
    '.cfg-thumbs-followup-label{',
    '  flex-basis:100%;',
    '  font-family:"Plus Jakarta Sans",sans-serif;font-weight:700;font-size:.82rem;',
    '  color:#7A5A12;margin-bottom:.15rem;',
    '}',
    '.cfg-thumbs-input{',
    '  flex:1;min-width:220px;',
    '  font-family:inherit;font-size:.88rem;',
    '  background:#fff;border:1px solid #d8d3c8;border-radius:6px;',
    '  padding:.55rem .8rem;color:#0f0f0f;',
    '}',
    '.cfg-thumbs-input:focus{outline:none;border-color:#C8102E;box-shadow:0 0 0 3px rgba(200,16,46,.12)}',
    '.cfg-thumbs-send{',
    '  background:#C8102E;color:#fff;border:none;border-radius:6px;',
    '  padding:.55rem 1.1rem;cursor:pointer;',
    '  font-family:"Plus Jakarta Sans",sans-serif;font-weight:700;font-size:.82rem;',
    '  transition:background .15s;',
    '}',
    '.cfg-thumbs-send:hover{background:#9B0B22}',
    '.cfg-thumbs-send:disabled{opacity:.6;cursor:not-allowed}',
    '.cfg-thumbs-thanks{',
    '  flex-basis:100%;margin-top:.3rem;',
    '  font-size:.82rem;color:#1a7a4a;font-weight:500;',
    '  display:none;',
    '}',
    '.cfg-thumbs-thanks.show{display:block}',
    '.cfg-thumbs-error{color:#9B0B22}',
    '@media(max-width:520px){',
    '  .cfg-thumbs{padding:1rem 1.1rem;gap:.6rem}',
    '  .cfg-thumbs-prompt{flex-basis:100%;margin-bottom:.2rem}',
    '}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- SVG icons ---------- */
  var thumbUp = '<svg class="cfg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
  var thumbDown = '<svg class="cfg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>';

  /* ---------- Send vote to Web3Forms ---------- */
  function sendVote(section, vote, comment){
    var body = new FormData();
    body.append('access_key', ACCESS_KEY);
    body.append('subject', '[Feedback ' + (vote === 'up' ? '👍' : '👎') + '] ' + PAGE_SLUG + ' — ' + section);
    body.append('from_name', 'Canada Family Guide — Feedback Widget');
    body.append('botcheck', '');
    body.append('page', PAGE_SLUG + '.html');
    body.append('section', section);
    body.append('vote', vote);
    body.append('comment', comment || '');
    body.append('user_agent', navigator.userAgent);

    return fetch(ENDPOINT, { method: 'POST', body: body })
      .then(function(r){ return r.json(); })
      .then(function(d){ if(!d.success) throw new Error(d.message || 'failed'); return d; });
  }

  /* ---------- Build one widget inside a container ---------- */
  function buildWidget(container){
    var section = container.getAttribute('data-section') || 'Page';
    var voted = false;

    container.innerHTML =
      '<span class="cfg-thumbs-prompt">Was this helpful?</span>' +
      '<span class="cfg-thumbs-section">' + section + '</span>' +
      '<button type="button" class="cfg-thumbs-btn" data-vote="up" aria-label="Yes, helpful">' + thumbUp + '<span>Yes</span></button>' +
      '<button type="button" class="cfg-thumbs-btn" data-vote="down" aria-label="No, not helpful">' + thumbDown + '<span>No</span></button>' +
      '<div class="cfg-thumbs-followup">' +
        '<div class="cfg-thumbs-followup-label">What was missing or confusing? (optional, but really helps)</div>' +
        '<input class="cfg-thumbs-input" type="text" maxlength="300" placeholder="e.g. The TFSA withdrawal rules weren\u2019t clear…">' +
        '<button type="button" class="cfg-thumbs-send">Send</button>' +
      '</div>' +
      '<div class="cfg-thumbs-thanks">Thanks — noted.</div>';

    var upBtn     = container.querySelector('[data-vote="up"]');
    var downBtn   = container.querySelector('[data-vote="down"]');
    var followup  = container.querySelector('.cfg-thumbs-followup');
    var input     = container.querySelector('.cfg-thumbs-input');
    var sendBtn   = container.querySelector('.cfg-thumbs-send');
    var thanks    = container.querySelector('.cfg-thumbs-thanks');

    function disableButtons(){
      upBtn.disabled = true;
      downBtn.disabled = true;
    }

    function showThanks(isError){
      thanks.textContent = isError
        ? 'Couldn\u2019t send — please try again later.'
        : 'Thanks — noted.';
      thanks.className = 'cfg-thumbs-thanks show' + (isError ? ' cfg-thumbs-error' : '');
    }

    upBtn.addEventListener('click', function(){
      if(voted) return;
      voted = true;
      upBtn.classList.add('voted');
      disableButtons();
      sendVote(section, 'up', '')
        .then(function(){ showThanks(false); })
        .catch(function(){ showThanks(true); });
    });

    downBtn.addEventListener('click', function(){
      if(voted) return;
      voted = true;
      downBtn.classList.add('voted');
      disableButtons();
      followup.classList.add('show');

      // Ensure the follow-up box is visible — scroll the widget into view
      // if it's even partially below the fold, then focus the input.
      setTimeout(function(){
        var rect = container.getBoundingClientRect();
        var viewH = window.innerHeight || document.documentElement.clientHeight;
        var needsScroll = rect.bottom > viewH - 40 || rect.top < 80;
        if(needsScroll){
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focus after scroll settles to avoid iOS keyboard-jump jank
          setTimeout(function(){ input.focus(); }, 420);
        } else {
          input.focus();
        }
      }, 40);
    });

    sendBtn.addEventListener('click', function(){
      var comment = input.value.trim();
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
      sendVote(section, 'down', comment)
        .then(function(){
          followup.classList.remove('show');
          showThanks(false);
        })
        .catch(function(){
          followup.classList.remove('show');
          showThanks(true);
        });
    });

    // Allow Enter in the textbox to submit
    input.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); sendBtn.click(); }
    });
  }

  /* ---------- Boot: find all widgets, build them ---------- */
  function boot(){
    // Auto-inject a page-bottom widget if <body data-auto-thumbs="true">
    if(document.body && document.body.getAttribute('data-auto-thumbs') === 'true'){
      // Only inject if the page doesn't already have one at the bottom
      var existing = document.querySelector('.cfg-thumbs[data-auto]');
      if(!existing){
        var auto = document.createElement('div');
        auto.className = 'cfg-thumbs';
        auto.setAttribute('data-section', 'Page (bottom)');
        auto.setAttribute('data-auto', 'true');
        // Insert just before <footer> if one exists, else append to body
        var footer = document.querySelector('footer');
        if(footer && footer.parentNode){
          footer.parentNode.insertBefore(auto, footer);
        } else {
          document.body.appendChild(auto);
        }
      }
    }

    var widgets = document.querySelectorAll('.cfg-thumbs');
    for(var i = 0; i < widgets.length; i++){
      if(!widgets[i].getAttribute('data-built')){
        widgets[i].setAttribute('data-built', 'true');
        buildWidget(widgets[i]);
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

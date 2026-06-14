/* ═══════════════════════════════════════
   الصوت المحلي — Navigation Component
   Client-side nav, ticker, breadcrumbs, search
   ═══════════════════════════════════════ */

const Nav = {
  _config: null,
  _articles: [],
  _tickerInterval: null,
  _searchContainer: null,
  _styleInjected: false,
  _stickySentinel: null,

  _defaultNav: [
    { slug: '', label: 'رئيسي', icon: '\u2605', url: '/', section: 'main' },
    { slug: 'news', label: 'أخبار', icon: '\uD83D\uDCF0', url: '/news.html', section: 'news' },
    { slug: 'activity', label: 'نشاطات', icon: '\uD83D\uDCC8', url: '/activities.html', section: 'activity' },
    { slug: 'announcement', label: 'إعلانات', icon: '\uD83D\uDCE2', url: '/announcements.html', section: 'announcement' },
    { slug: 'timeline', label: 'أرشيف', icon: '\uD83D\uDCC5', url: '/timeline.html', section: null },
  ],

  _sectionNav: [
    { slug: 'sports', label: 'رياضة', icon: '\u26BD', url: '/section.html?s=sports' },
    { slug: 'culture', label: 'ثقافة', icon: '\uD83C\uDFAD', url: '/section.html?s=culture' },
    { slug: 'science', label: 'علوم', icon: '\uD83D\uDD2C', url: '/section.html?s=science' },
    { slug: 'literature', label: 'أدب', icon: '\uD83D\uDCD6', url: '/section.html?s=literature' },
    { slug: 'opinion', label: 'رأي', icon: '\uD83D\uDDE3\uFE0F', url: '/section.html?s=opinion' },
    { slug: 'guidance', label: 'توجيه', icon: '\uD83E\uDDD1\u200D\uD83C\uDFEB', url: '/section.html?s=guidance' },
    { slug: 'students', label: 'طلبة', icon: '\uD83C\uDF93', url: '/section.html?s=students' },
    { slug: 'education', label: 'تربية', icon: '\uD83C\uDFEB', url: '/section.html?s=education' },
  ],

  _catNames: {
    news: 'أخبار',
    activity: 'نشاطات',
    announcement: 'إعلانات',
    sports: 'رياضة',
    culture: 'ثقافة',
    science: 'علوم',
    literature: 'أدب',
    opinion: 'رأي',
    guidance: 'توجيه',
    students: 'طلبة',
    education: 'تربية',
  },

  /* ── Public API ── */

  async init() {
    this._injectStyles();
    try {
      const [config, latestNews] = await Promise.all([
        this._fetchConfig(),
        API.get('/latest-news').catch(() => ({ items: [] }))
      ]);
      this._config = config;
      const newsData = latestNews && latestNews.items ? latestNews.items : (Array.isArray(latestNews) ? latestNews : []);
      this._articles = newsData;
      this._renderNav(config);
      this._renderSearch();
      this._renderTicker(this._articles);
      this._renderBreadcrumbs(config);
      this._setActiveState(config);
      this._setSectionMeta(config);
      this._initStickyNav();
      this._initMobileMenu();
      this._initKeyboardSearch();
      this.lazyLoad();
    } catch (e) {
      this._renderSearch();
      this._initStickyNav();
      this._initMobileMenu();
      this._initKeyboardSearch();
      this.lazyLoad();
    }
  },

  async initTicker() {
    try {
      const data = await API.get('/latest-news');
      this._articles = data && data.items ? data.items : (Array.isArray(data) ? data : []);
    } catch {
      this._articles = [];
    }
    this._renderTicker(this._articles);
  },

  renderBreadcrumbs() {
    this._renderBreadcrumbs(this._config);
  },

  lazyLoad() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.src) {
          el.src = el.dataset.src;
          el.removeAttribute('data-src');
        }
        if (el.dataset.srcset) {
          el.srcset = el.dataset.srcset;
          el.removeAttribute('data-srcset');
        }
        el.classList.remove('lazy');
        observer.unobserve(el);
      });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('.lazy, img[loading="lazy"]:not(.lazy-loaded)').forEach(el => {
      el.classList.add('lazy-loaded');
      observer.observe(el);
    });
    return observer;
  },

  getCategoryName(slug) {
    return this._catNames[slug] || slug || '';
  },

  /* ── Style Injection ── */

  _injectStyles() {
    if (this._styleInjected) return;
    this._styleInjected = true;
    var style = document.createElement('style');
    style.id = 'nav-styles';
    style.textContent = '\
.np-nav.is-sticky {\
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);\
  border-bottom-color: var(--np-accent, #c8a951);\
}\
.nav-hamburger {\
  display: none;\
  background: none;\
  border: none;\
  color: var(--np-gray-light, #999);\
  font-size: 1.3rem;\
  padding: 10px 12px;\
  cursor: pointer;\
  transition: var(--np-transition, all 0.3s ease);\
}\
.nav-hamburger:hover,\
.nav-hamburger.active {\
  color: var(--np-white, #fff);\
}\
.nav-items {\
  display: flex;\
  align-items: center;\
}\
#news-ticker {\
  background: var(--np-primary-dark, #0f2440);\
  border-bottom: 2px solid var(--np-accent, #c8a951);\
  overflow: hidden;\
  position: relative;\
  height: 36px;\
}\
#news-ticker .ticker-label {\
  position: absolute;\
  right: 0;\
  top: 0;\
  background: var(--np-accent, #c8a951);\
  color: var(--np-primary-dark, #0f2440);\
  font-size: 0.7rem;\
  font-weight: 700;\
  padding: 0 14px;\
  height: 100%;\
  display: flex;\
  align-items: center;\
  z-index: 2;\
  white-space: nowrap;\
  font-family: Tajawal, sans-serif;\
}\
#news-ticker .ticker-track {\
  display: flex;\
  align-items: center;\
  height: 100%;\
  white-space: nowrap;\
  will-change: transform;\
}\
#news-ticker .ticker-track.paused {\
  animation-play-state: paused !important;\
}\
#news-ticker a.ticker-item {\
  display: inline-flex;\
  align-items: center;\
  padding: 0 24px;\
  color: var(--np-accent-light, #e8d48b);\
  font-size: 0.78rem;\
  font-family: Tajawal, sans-serif;\
  text-decoration: none;\
  border-left: 1px solid rgba(255,255,255,0.1);\
  white-space: nowrap;\
  height: 100%;\
  transition: color 0.2s ease;\
}\
#news-ticker a.ticker-item:hover {\
  color: var(--np-white, #fff);\
  text-decoration: underline;\
}\
#news-ticker .ticker-fallback {\
  display: flex;\
  align-items: center;\
  height: 100%;\
  padding: 0 16px;\
  overflow-x: auto;\
}\
#news-ticker .ticker-fallback a {\
  color: var(--np-accent-light, #e8d48b);\
  font-size: 0.78rem;\
  font-family: Tajawal, sans-serif;\
  text-decoration: none;\
  padding: 0 16px;\
  white-space: nowrap;\
  border-left: 1px solid rgba(255,255,255,0.1);\
}\
#news-ticker .ticker-fallback a:hover {\
  color: var(--np-white, #fff);\
  text-decoration: underline;\
}\
#breadcrumbs {\
  background: var(--np-paper-light, #faf7f2);\
  border-bottom: 1px solid var(--np-border, #d4c9b8);\
  padding: 8px 0;\
  font-size: 0.78rem;\
  font-family: Tajawal, sans-serif;\
}\
#breadcrumbs .container {\
  display: flex;\
  align-items: center;\
  gap: 6px;\
  flex-wrap: wrap;\
}\
#breadcrumbs .breadcrumb-item {\
  color: var(--np-gray, #666);\
  text-decoration: none;\
}\
#breadcrumbs .breadcrumb-item:hover {\
  color: var(--np-primary-light, #2c5f8a);\
}\
#breadcrumbs .breadcrumb-item.current {\
  color: var(--np-primary, #1a3a5c);\
  font-weight: 600;\
}\
#breadcrumbs .breadcrumb-sep {\
  color: var(--np-gray-light, #999);\
  font-size: 0.7rem;\
}\
#global-search {\
  display: flex;\
  align-items: center;\
}\
#global-search form {\
  display: flex;\
  align-items: center;\
}\
#global-search .search-input {\
  background: rgba(255,255,255,0.1);\
  border: 1px solid var(--np-gray-dark, #444);\
  border-radius: 4px;\
  padding: 4px 10px;\
  font-size: 0.78rem;\
  color: var(--np-white, #fff);\
  width: 160px;\
  transition: var(--np-transition, all 0.3s ease);\
  font-family: Tajawal, sans-serif;\
  outline: none;\
}\
#global-search .search-input::placeholder {\
  color: var(--np-gray-light, #999);\
}\
#global-search .search-input:focus {\
  border-color: var(--np-accent, #c8a951);\
  background: rgba(255,255,255,0.15);\
  width: 200px;\
}\
#global-search .search-btn {\
  background: none;\
  border: none;\
  color: var(--np-gray-light, #999);\
  font-size: 1rem;\
  padding: 4px 8px;\
  cursor: pointer;\
  transition: var(--np-transition, all 0.3s ease);\
}\
#global-search .search-btn:hover {\
  color: var(--np-accent, #c8a951);\
}\
.nav-mobile-overlay {\
  display: none;\
  position: fixed;\
  top: 0; left: 0; right: 0; bottom: 0;\
  background: rgba(0,0,0,0.5);\
  z-index: 99;\
}\
.nav-mobile-overlay.open {\
  display: block;\
}\
@media (max-width: 768px) {\
  .nav-hamburger {\
    display: block;\
  }\
  .np-nav .nav-items {\
    display: none;\
    position: absolute;\
    top: 100%;\
    right: 0;\
    left: 0;\
    background: var(--np-primary, #1a3a5c);\
    flex-direction: column;\
    border-top: 2px solid var(--np-accent, #c8a951);\
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);\
    z-index: 200;\
    max-height: 80vh;\
    overflow-y: auto;\
  }\
  .np-nav .nav-items.open {\
    display: flex;\
  }\
  .np-nav .nav-items a,\
  .np-nav .nav-items .np-nav-dropdown-trigger {\
    padding: 12px 20px;\
    border-bottom: 1px solid rgba(255,255,255,0.08);\
    width: 100%;\
  }\
  .np-nav .nav-items a {\
    border-bottom: 1px solid rgba(255,255,255,0.08);\
  }\
  .np-nav .nav-items .np-nav-dropdown-trigger {\
    display: flex;\
    justify-content: space-between;\
    align-items: center;\
  }\
  .np-nav-dropdown {\
    display: flex;\
    flex-direction: column;\
    width: 100%;\
  }\
  .np-nav-dropdown-menu {\
    position: static;\
    opacity: 1;\
    pointer-events: all;\
    display: none;\
    border: none;\
    border-right: 2px solid var(--np-accent, #c8a951);\
    margin-right: 10px;\
    min-width: auto;\
    background: rgba(0,0,0,0.15);\
  }\
  .np-nav-dropdown.open .np-nav-dropdown-menu {\
    display: block;\
  }\
  .np-nav .nav-left {\
    margin-right: auto;\
    display: flex;\
    align-items: center;\
    gap: 4px;\
  }\
  #global-search .search-input {\
    width: 100px;\
  }\
  #global-search .search-input:focus {\
    width: 140px;\
  }\
  #news-ticker {\
    display: none;\
  }\
  #breadcrumbs {\
    font-size: 0.72rem;\
  }\
}\
@media (min-width: 769px) and (max-width: 1024px) {\
  .np-nav .nav-items a,\
  .np-nav .np-nav-dropdown-trigger {\
    padding: 8px 10px;\
    font-size: 0.75rem;\
  }\
  #global-search .search-input {\
    width: 120px;\
  }\
  #global-search .search-input:focus {\
    width: 150px;\
  }\
}\
';
    document.head.appendChild(style);
  },

  /* ── Config Fetching ── */

  async _fetchConfig() {
    try {
      const data = await API.get('/nav');
      return data;
    } catch {
      return { items: this._defaultNav, sections: this._sectionNav, regions: [] };
    }
  },

  /* ── Nav Rendering ── */

  _renderNav(config) {
    var navEl = document.getElementById('main-nav') || document.querySelector('.np-nav');
    if (!navEl) return;
    navEl.id = 'main-nav';

    var container = navEl.querySelector('.container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'container';
      navEl.appendChild(container);
    }

    var mainItems = config && config.items ? config.items : this._defaultNav;
    var sections = config && config.sections ? config.sections : this._sectionNav;
    var regions = config && config.regions ? config.regions : [];

    var itemsHtml = '';
    itemsHtml += '<button class="nav-hamburger" aria-label="القائمة" type="button">\u2630</button>';
    itemsHtml += '<div class="nav-items">';

    mainItems.forEach(function(item) {
      var href = item.url || (item.slug ? (item.slug === '' ? '/' : '/' + item.slug) : '/');
      var label = item.icon ? item.icon + ' ' + item.label : item.label;
      itemsHtml += '<a href="' + href + '">' + label + '</a>';
    });

    if (sections && sections.length) {
      itemsHtml += '<div class="np-nav-dropdown">';
      itemsHtml += '<span class="np-nav-dropdown-trigger">\uD83D\uDCCA \u0623\u0642\u0633\u0627\u0645 \u25BE</span>';
      itemsHtml += '<div class="np-nav-dropdown-menu">';
      sections.forEach(function(sec) {
        var href = sec.url || '/section.html?s=' + sec.slug;
        var label = sec.icon ? sec.icon + ' ' + sec.label : sec.label;
        itemsHtml += '<a href="' + href + '">' + label + '</a>';
      });
      itemsHtml += '</div></div>';
    }

    if (regions && regions.length) {
      itemsHtml += '<div class="np-nav-dropdown">';
      itemsHtml += '<span class="np-nav-dropdown-trigger">\uD83C\uDF0D \u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u25BE</span>';
      itemsHtml += '<div class="np-nav-dropdown-menu">';
      regions.forEach(function(reg) {
        var href = reg.url || '/region/' + reg.slug;
        var label = reg.icon ? reg.icon + ' ' + reg.label : reg.label;
        itemsHtml += '<a href="' + href + '">' + label + '</a>';
      });
      itemsHtml += '</div></div>';
    }

    itemsHtml += '</div>';

    var leftHtml = '<div class="nav-left">';
    leftHtml += '<div id="global-search"></div>';
    leftHtml += '<a href="/admin">\u2699\uFE0F \u0627\u0644\u0625\u062F\u0627\u0631\u0629</a>';
    leftHtml += '</div>';

    container.innerHTML = itemsHtml + leftHtml;
    this._searchContainer = document.getElementById('global-search');
  },

  /* ── News Ticker ── */

  _renderTicker(articles) {
    var container = document.getElementById('news-ticker');
    if (!container) {
      var navEl = document.getElementById('main-nav') || document.querySelector('.np-nav');
      if (!navEl) return;
      container = document.createElement('div');
      container.id = 'news-ticker';
      navEl.parentNode.insertBefore(container, navEl.nextSibling);
    }

    var items = articles && articles.length ? articles : [];

    if (!items.length) {
      container.innerHTML = '<div class="ticker-fallback"><span style="color:var(--np-gray-light,#999);font-size:0.78rem;padding:0 16px;">\u0644\u0627 \u062A\u0648\u062C\u062F \u0622\u062E\u0631 \u0627\u0644\u0623\u062E\u0628\u0627\u0631</span></div>';
      return;
    }

    var html = '<span class="ticker-label">\uD83D\uDCE1 \u0622\u062E\u0631 \u0627\u0644\u0623\u062E\u0628\u0627\u0631</span>';
    html += '<div class="ticker-track">';

    var doubled = items.concat(items);
    doubled.forEach(function(article) {
      var title = article.title || '';
      html += '<a href="/article/' + article.id + '" class="ticker-item">' + title + '</a>';
    });

    html += '</div>';
    container.innerHTML = html;

    var track = container.querySelector('.ticker-track');
    if (!track) return;

    var itemWidth = 0;
    var singleSetWidth = 0;
    track.querySelectorAll('.ticker-item').forEach(function(el, idx) {
      itemWidth += el.offsetWidth + 24;
      if (idx === items.length - 1) singleSetWidth = itemWidth;
    });

    if (singleSetWidth === 0) return;

    track.style.width = (singleSetWidth * 2) + 'px';

    var duration = Math.max(singleSetWidth / 40, 20);

    track.style.animation = 'ticker-scroll ' + duration + 's linear infinite';

    var keyframes = '\
@keyframes ticker-scroll {\
  0% { transform: translateX(0); }\
  100% { transform: translateX(-' + singleSetWidth + 'px); }\
}';
    var styleSheet = document.getElementById('nav-styles');
    if (styleSheet) {
      styleSheet.textContent += keyframes;
    }

    container.addEventListener('mouseenter', function() {
      track.classList.add('paused');
    });
    container.addEventListener('mouseleave', function() {
      track.classList.remove('paused');
    });
  },

  /* ── Breadcrumbs ── */

  _renderBreadcrumbs(config) {
    var container = document.getElementById('breadcrumbs');
    if (!container) {
      var mainEl = document.querySelector('main') || document.querySelector('.container');
      if (!mainEl) return;
      container = document.createElement('nav');
      container.id = 'breadcrumbs';
      container.setAttribute('aria-label', 'Breadcrumb');
      var bodyParent = document.body;
      var topBar = document.querySelector('.np-top-bar');
      var masthead = document.querySelector('.np-masthead');
      var navEl = document.getElementById('main-nav') || document.querySelector('.np-nav');
      var insertAfter = navEl || masthead || topBar;
      if (insertAfter && insertAfter.parentNode) {
        if (navEl && document.getElementById('news-ticker')) {
          var ticker = document.getElementById('news-ticker');
          ticker.parentNode.insertBefore(container, ticker.nextSibling);
        } else {
          insertAfter.parentNode.insertBefore(container, insertAfter.nextSibling);
        }
      }
    }

    var path = window.location.pathname;
    var parts = path.replace(/\/$/, '').split('/').filter(Boolean);
    var crumbs = [];

    crumbs.push({ label: '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629', url: '/', position: 1 });

    if (parts.length) {
      if (parts[0] === 'section' && parts[1]) {
        var sectionSlug = parts[1];
        var secName = '';
        if (config && config.sections) {
          config.sections.forEach(function(s) {
            if (s.slug === sectionSlug) secName = s.label;
          });
        }
        if (!secName) secName = this.getCategoryName(sectionSlug);
        crumbs.push({ label: '\u0627\u0644\u0642\u0633\u0645: ' + secName, url: path, position: 2 });
      } else if (parts[0] === 'article' && parts[1]) {
        crumbs.push({ label: '\u0627\u0644\u0645\u0642\u0627\u0644', url: path, position: 2 });
      } else if (parts[0] === 'search') {
        crumbs.push({ label: '\u0627\u0644\u0628\u062D\u062B', url: path, position: 2 });
      } else if (parts[0] === 'archive') {
        crumbs.push({ label: '\u0627\u0644\u0623\u0631\u0634\u064A\u0641', url: path, position: 2 });
      } else if (parts[0] === 'timeline') {
        crumbs.push({ label: '\u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0632\u0645\u0646\u064A', url: path, position: 2 });
      } else if (parts[0] === 'region' && parts[1]) {
        var regionName = parts[1];
        if (config && config.regions) {
          config.regions.forEach(function(r) {
            if (r.slug === parts[1]) regionName = r.label;
          });
        }
        crumbs.push({ label: '\u0627\u0644\u0645\u0646\u0637\u0642\u0629: ' + regionName, url: path, position: 2 });
      } else if (parts[0] === 'announcements') {
        crumbs.push({ label: '\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A', url: path, position: 2 });
      } else if (parts[0] === 'activities') {
        crumbs.push({ label: '\u0627\u0644\u0646\u0634\u0627\u0637\u0627\u062A', url: path, position: 2 });
      } else if (parts[0] === 'news') {
        crumbs.push({ label: '\u0627\u0644\u0623\u062E\u0628\u0627\u0631', url: path, position: 2 });
      } else {
        crumbs.push({ label: decodeURIComponent(parts[parts.length - 1]), url: path, position: 2 });
      }
    }

    var html = '<div class="container">';
    crumbs.forEach(function(crumb, idx) {
      if (idx > 0) html += '<span class="breadcrumb-sep">/</span>';
      if (idx === crumbs.length - 1) {
        html += '<span class="breadcrumb-item current">' + crumb.label + '</span>';
      } else {
        html += '<a href="' + crumb.url + '" class="breadcrumb-item">' + crumb.label + '</a>';
      }
    });
    html += '</div>';
    container.innerHTML = html;

    this._addJsonLdBreadcrumb(crumbs);
  },

  /* ── JSON-LD Breadcrumb ── */

  _addJsonLdBreadcrumb(items) {
    if (!items || !items.length) return;
    var existing = document.querySelector('script[type="application/ld+json"][data-breadcrumb]');
    if (existing) existing.remove();

    var ld = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map(function(item, idx) {
        return {
          '@type': 'ListItem',
          position: idx + 1,
          name: item.label,
          item: window.location.origin + item.url,
        };
      }),
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumb', '');
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  },

  /* ── Global Search ── */

  _renderSearch() {
    var container = document.getElementById('global-search');
    if (!container) {
      var leftArea = document.querySelector('.nav-left');
      if (!leftArea) return;
      container = document.createElement('div');
      container.id = 'global-search';
      leftArea.insertBefore(container, leftArea.firstChild);
    }
    container.innerHTML = '\
<form id="nav-search-form" action="/search" role="search">\
  <input class="search-input" id="nav-search-input" type="search" placeholder="\u0628\u062D\u062B..." aria-label="\u0628\u062D\u062B">\
  <button class="search-btn" type="submit" aria-label="\u0628\u062D\u062B">\uD83D\uDD0D</button>\
</form>';

    var form = document.getElementById('nav-search-form');
    var input = document.getElementById('nav-search-input');

    if (form && input) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = input.value.trim();
        if (q) window.location.href = '/search?q=' + encodeURIComponent(q);
      });
    }
  },

  /* ── Active State ── */

  _setActiveState(config) {
    var path = window.location.pathname;
    var links = document.querySelectorAll('#main-nav .nav-items a');
    links.forEach(function(link) {
      link.classList.remove('active');
      var href = link.getAttribute('href');
      if (!href) return;
      if (href === path || (href !== '/' && path.indexOf(href) === 0)) {
        link.classList.add('active');
      }
      if (path === '/' && href === '/') {
        link.classList.add('active');
      }
    });
    if (path === '/' || path === '') {
      var homeLink = document.querySelector('#main-nav .nav-items a[href="/"]');
      if (homeLink) homeLink.classList.add('active');
    }
    var dropdowns = document.querySelectorAll('#main-nav .np-nav-dropdown-menu a');
    dropdowns.forEach(function(link) {
      if (link.getAttribute('href') === path) {
        var dd = link.closest('.np-nav-dropdown');
        if (dd) {
          var trigger = dd.querySelector('.np-nav-dropdown-trigger');
          if (trigger) trigger.style.color = 'var(--np-accent, #c8a951)';
        }
      }
    });
  },

  /* ── Sticky Nav ── */

  _initStickyNav() {
    var nav = document.getElementById('main-nav') || document.querySelector('.np-nav');
    if (!nav) return;

    var navStyle = window.getComputedStyle(nav);
    var canUseSticky = navStyle.position === 'sticky' || navStyle.position === '-webkit-sticky';

    if (canUseSticky) {
      var ticking = false;
      var lastScrollY = 0;

      var onScroll = function() {
        lastScrollY = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(function() {
            if (lastScrollY > 50) {
              nav.classList.add('is-sticky');
            } else {
              nav.classList.remove('is-sticky');
            }
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  },

  /* ── Mobile Menu ── */

  _initMobileMenu() {
    var hamburger = document.querySelector('.nav-hamburger');
    var navItems = document.querySelector('.nav-items');
    if (!hamburger || !navItems) return;

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = navItems.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    var dropdownTriggers = navItems.querySelectorAll('.np-nav-dropdown-trigger');
    dropdownTriggers.forEach(function(trigger) {
      trigger.addEventListener('click', function(e) {
        if (window.innerWidth > 768) return;
        e.preventDefault();
        e.stopPropagation();
        var dd = trigger.closest('.np-nav-dropdown');
        if (dd) dd.classList.toggle('open');
      });
    });

    var dropdownLinks = navItems.querySelectorAll('.np-nav-dropdown-menu a');
    dropdownLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        navItems.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    var navLinks = navItems.querySelectorAll('a');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth > 768) return;
        navItems.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', function(e) {
      if (window.innerWidth > 768) return;
      if (!navItems.contains(e.target) && !hamburger.contains(e.target)) {
        navItems.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  },

  /* ── Keyboard Search Shortcut ── */

  _initKeyboardSearch() {
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        var input = document.getElementById('nav-search-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  },

  /* ── Section Metadata ── */

  _setSectionMeta(config) {
    var path = window.location.pathname;
    var titleBase = document.title.replace(/\s*\|\s*.+$/, '').trim() || '\u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    var pageTitle = '\u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    var desc = '\u0645\u0646\u0635\u0629 \u062C\u0647\u0648\u064A\u0629 \u0644\u0644\u0625\u0639\u0644\u0627\u0645 \u0627\u0644\u0639\u0627\u0645 \u0648\u0627\u0644\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629 - \u0648\u0644\u0627\u064A\u0629 \u062A\u064A\u0627\u0631\u062A';

    if (path.indexOf('/section') === 0) {
      var params = new URLSearchParams(window.location.search);
      var slug = params.get('s');
      var name = '';
      if (slug) {
        if (config && config.sections) {
          config.sections.forEach(function(s) {
            if (s.slug === slug) name = s.label;
          });
        }
        if (!name) name = this.getCategoryName(slug);
      }
      if (name) {
        pageTitle = name + ' | \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
        desc = '\u0642\u0633\u0645 ' + name + ' - \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u060C \u0645\u0646\u0635\u0629 \u062C\u0647\u0648\u064A\u0629 \u0644\u0644\u0625\u0639\u0644\u0627\u0645 \u0627\u0644\u0639\u0627\u0645 \u0648\u0627\u0644\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0645\u062D\u0644\u064A\u0629';
      }
    } else if (path.indexOf('/article') === 0) {
      pageTitle = '\u0645\u0642\u0627\u0644 | \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    } else if (path.indexOf('/search') === 0) {
      pageTitle = '\u0627\u0644\u0628\u062D\u062B | \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
      desc = '\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    } else if (path.indexOf('/archive') === 0) {
      pageTitle = '\u0627\u0644\u0623\u0631\u0634\u064A\u0641 | \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
      desc = '\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    } else if (path.indexOf('/timeline') === 0) {
      pageTitle = '\u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0632\u0645\u0646\u064A | \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
      desc = '\u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0632\u0645\u0646\u064A \u0644\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    } else if (path === '/' || path === '') {
      pageTitle = '\u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062D\u0644\u064A';
    }

    if (document.title !== pageTitle) document.title = pageTitle;

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', window.location.origin + path);
    } else {
      var link = document.createElement('link');
      link.rel = 'canonical';
      link.href = window.location.origin + path;
      document.head.appendChild(link);
    }
  },
};

document.addEventListener('DOMContentLoaded', function() {
  Nav.init();
});

/* ═══════════════════════════════════════
   الصوت المحلي — Newspaper JS
   Client-side rendering for Neo Vintage UI
   ═══════════════════════════════════════ */

const NP = {
  CONFIG: {
    sections: [
      { id: 'main', label: '\u0631\u0626\u064A\u0633\u064A', icon: '\u2605' },
      { id: 'news', label: '\u0623\u062E\u0628\u0627\u0631', icon: '\uD83D\uDCF0' },
      { id: 'activity', label: '\u0646\u0634\u0627\u0637\u0627\u062A', icon: '\uD83D\uDCC8' },
      { id: 'announcement', label: '\u0625\u0639\u0644\u0627\u0646\u0627\u062A', icon: '\uD83D\uDCE2' },
      { id: 'sports', label: '\u0631\u064A\u0627\u0636\u0629', icon: '\u26BD' },
      { id: 'culture', label: '\u062B\u0642\u0627\u0641\u0629', icon: '\uD83C\uDFAD' },
      { id: 'science', label: '\u0639\u0644\u0648\u0645', icon: '\uD83D\uDD2C' },
      { id: 'literature', label: '\u0623\u062F\u0628', icon: '\uD83D\uDCD6' },
      { id: 'opinion', label: '\u0631\u0623\u064A', icon: '\uD83D\uDDE3\uFE0F' },
      { id: 'guidance', label: '\u062A\u0648\u062C\u064A\u0647', icon: '\uD83E\uDDD1\u200D\uD83C\uDFEB' },
      { id: 'students', label: '\u0637\u0644\u0628\u0629', icon: '\uD83C\uDF93' },
      { id: 'education', label: '\u062A\u0631\u0628\u064A\u0629', icon: '\uD83C\uDFEB' },
    ],
    categoryLabels: {
      news: '\u0623\u062E\u0628\u0627\u0631',
      activity: '\u0646\u0634\u0627\u0637\u0627\u062A',
      announcement: '\u0625\u0639\u0644\u0627\u0646\u0627\u062A',
      uncategorized: '\u063A\u064A\u0631 \u0645\u0635\u0646\u0641',
    },
    sectionCategoryMap: {
      main: null, news: 'news', activity: 'activity',
      announcement: 'announcement', sports: null, culture: null,
      science: null, literature: null, opinion: null,
      guidance: null, students: null, education: null,
    },
  },

  init() {
    this.setCurrentDate();
    this.loadFeatured();
    this.loadEditorialGrid();
    this.loadTimeline();
    this.loadStats();
    this.setupAutoRefresh();
    this.setupNavScroll();
  },

  setCurrentDate() {
    const el = document.getElementById('np-date');
    if (!el) return;
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = now.toLocaleDateString('ar-DZ', opts);
    const hijri = document.getElementById('np-hijri');
    if (hijri) hijri.textContent = '\u0627\u0644\u0639\u062F\u062F ' + now.getDate();
  },

  /* ── Featured Story ── */
  async loadFeatured() {
    const container = document.getElementById('np-featured');
    if (!container) return;
    container.innerHTML = '<div class="np-loading">\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0642\u0627\u0644 \u0627\u0644\u0645\u0645\u064A\u0632...</div>';
    try {
      const data = await API.getContent({ status: 'published', limit: 1, sort: 'score' });
      if (!data.items || data.items.length === 0) {
        container.innerHTML = '';
        return;
      }
      const item = data.items[0];
      const date = item.event_date || (item.published_at ? item.published_at.split('T')[0] : '');
      const imageStyle = item.image_data ? `background-image:url('${item.image_data}')` :
                         item.image_url ? `background-image:url('${item.image_url}')` : '';
      container.innerHTML = `
        <div class="np-featured">
          <div class="np-featured-inner">
            <div class="np-featured-image" style="${imageStyle || ''}">
              ${imageStyle ? '' : '\uD83D\uDCF0'}
            </div>
            <div class="np-featured-content">
              <div class="category-tag ${item.category}">${this.CONFIG.categoryLabels[item.category] || item.category}</div>
              <h2><a href="/article/${item.id}">${item.title}</a></h2>
              <p>${(item.summary || item.body || '').substring(0, 200)}...</p>
              <div class="meta">
                <span>\uD83D\uDCC5 ${date}</span>
                <span>\uD83D\uDCE1 ${item.source_name || '\u063A\u064A\u0631 \u0645\u062D\u062F\u062F'}</span>
                ${item.overall_score ? `<span>\uD83C\uDFAF ${Math.round(item.overall_score * 100)}%</span>` : ''}
              </div>
              <a href="/article/${item.id}" class="np-btn np-btn-sm np-btn-primary" style="margin-top:15px;width:fit-content;">\u0627\u0642\u0631\u0623 \u0627\u0644\u0645\u0632\u064A\u062F</a>
            </div>
          </div>
        </div>`;
    } catch (e) {
      container.innerHTML = '<div class="np-loading" style="padding:20px;">\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0642\u0627\u0644 \u0627\u0644\u0645\u0645\u064A\u0632</div>';
    }
  },

  /* ── Editorial Grid (3 columns) ── */
  async loadEditorialGrid() {
    const container = document.getElementById('np-editorial-grid');
    if (!container) return;
    container.innerHTML = '<div class="np-loading">\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0623\u062E\u0628\u0627\u0631...</div>';
    try {
      const data = await API.getContent({ status: 'published', limit: 12 });
      const items = data.items || [];
      if (items.length === 0) { container.innerHTML = ''; return; }

      let html = '<div class="np-news-grid">';
      items.forEach((item, i) => {
        const spanClass = i === 0 ? 'col-span-2 np-card-lg' : '';
        const date = item.event_date || (item.published_at ? item.published_at.split('T')[0] : '');
        const summary = (item.summary || item.body || '').substring(0, 120);
        const hasImage = item.image_data || item.image_url;
        html += `
          <div class="np-card ${spanClass}">
            ${hasImage
              ? `<img class="np-card-image" src="${item.image_data || item.image_url}" alt="${item.title}" loading="lazy">`
              : `<div class="np-card-image-placeholder">\uD83D\uDCF0</div>`
            }
            <div class="np-card-body">
              <div class="category-tag ${item.category}">${this.CONFIG.categoryLabels[item.category] || item.category}</div>
              <h3><a href="/article/${item.id}">${item.title}</a></h3>
              <p>${summary}...</p>
              <div class="meta"><span>\uD83D\uDCC5 ${date}</span>${item.overall_score ? `<span>\uD83C\uDFAF ${Math.round(item.overall_score * 100)}%</span>` : ''}</div>
            </div>
          </div>`;
      });
      html += '</div>';
      container.innerHTML = html;

      const timestamps = document.querySelectorAll('.np-timestamp');
      if (timestamps.length) {
        timestamps.forEach(el => {
          el.textContent = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
        });
      }
    } catch (e) {
      container.innerHTML = '<div class="np-loading">\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0623\u062E\u0628\u0627\u0631</div>';
    }
  },

  /* ── Timeline ── */
  async loadTimeline() {
    const container = document.getElementById('np-timeline');
    if (!container) return;
    container.innerHTML = '<div class="np-loading">\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0623\u0631\u0634\u064A\u0641...</div>';
    try {
      const timeline = await API.getTimeline();
      if (!timeline || timeline.length === 0) { container.innerHTML = ''; return; }
      let html = '<div class="np-timeline">';
      timeline.slice(0, 8).forEach(item => {
        const date = item.event_date || (item.published_at ? item.published_at.split('T')[0] : item.created_at ? item.created_at.split('T')[0] : '');
        html += `
          <div class="np-timeline-item">
            <div class="t-date">${date}</div>
            <h4><a href="/article/${item.id}">${item.title}</a></h4>
            <p>${(item.summary || item.body || '').substring(0, 100)}...</p>
          </div>`;
      });
      html += '</div>';
      html += '<div style="text-align:center;margin-top:15px;"><a href="/timeline.html" class="np-btn np-btn-sm">\u0639\u0631\u0636 \u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0643\u0627\u0645\u0644</a></div>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '';
    }
  },

  /* ── Stats Bar ── */
  async loadStats() {
    const container = document.getElementById('np-stats');
    if (!container) return;
    try {
      const stats = await API.getStats();
      const html = `
        <div class="np-stat-card"><div class="number">${stats.total_articles || 0}</div><div class="label">\u0645\u0642\u0627\u0644</div></div>
        <div class="np-stat-card"><div class="number">${stats.published || 0}</div><div class="label">\u0645\u0646\u0634\u0648\u0631</div></div>
        <div class="np-stat-card"><div class="number">${stats.categories || 0}</div><div class="label">\u0623\u0642\u0633\u0627\u0645</div></div>
        <div class="np-stat-card"><div class="number">${stats.archived || 0}</div><div class="label">\u0645\u0624\u0631\u0634\u0641</div></div>
        <div class="np-stat-card"><div class="number">${stats.views || 0}</div><div class="label">\u0645\u0634\u0627\u0647\u062F\u0629</div></div>
        <div class="np-stat-card"><div class="number">${stats.sources || 0}</div><div class="label">\u0645\u0635\u062F\u0631</div></div>`;
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '';
    }
  },

  /* ── Category page loader ── */
  async loadCategoryPage(category) {
    const container = document.getElementById('np-category-content');
    if (!container) return;
    container.innerHTML = '<div class="np-loading">\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644...</div>';
    try {
      const data = await API.getContent({ category, status: 'published', limit: 50 });
      const items = data.items || [];
      if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--np-gray);font-size:1.1rem;">\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0642\u0627\u0644\u0627\u062A \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645</div>';
        return;
      }
      let html = '<div class="np-news-grid">';
      items.forEach(item => {
        const date = item.event_date || (item.published_at ? item.published_at.split('T')[0] : '');
        const hasImage = item.image_data || item.image_url;
        html += `
          <div class="np-card">
            ${hasImage
              ? `<img class="np-card-image" src="${item.image_data || item.image_url}" alt="${item.title}" loading="lazy">`
              : `<div class="np-card-image-placeholder">\uD83D\uDCF0</div>`
            }
            <div class="np-card-body">
              <div class="category-tag ${item.category}">${this.CONFIG.categoryLabels[item.category] || item.category}</div>
              <h3><a href="/article/${item.id}">${item.title}</a></h3>
              <p>${(item.summary || item.body || '').substring(0, 120)}...</p>
              <div class="meta"><span>\uD83D\uDCC5 ${date}</span></div>
            </div>
          </div>`;
      });
      html += '</div>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<div class="np-loading">\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0642\u0633\u0645</div>';
    }
  },

  /* ── Search ── */
  initSearch() {
    const input = document.getElementById('np-search-input');
    const btn = document.getElementById('np-search-btn');
    const results = document.getElementById('np-search-results');
    if (!input || !btn || !results) return;

    const doSearch = async () => {
      const q = input.value.trim();
      if (!q || q.length < 2) { results.innerHTML = ''; return; }
      results.innerHTML = '<div class="np-loading">\u062C\u0627\u0631\u064A \u0627\u0644\u0628\u062D\u062B...</div>';
      try {
        const data = await API.search(q);
        const items = data.items || [];
        if (items.length === 0) {
          results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--np-gray);">\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C</div>';
          return;
        }
        let html = '<div class="np-news-grid" style="grid-template-columns:1fr;">';
        items.forEach(item => {
          const date = item.event_date || (item.published_at ? item.published_at.split('T')[0] : '');
          html += `
            <div class="np-card np-card-sm" style="display:grid;grid-template-columns:100px 1fr;gap:12px;border:none;border-bottom:1px solid var(--np-border);padding-bottom:12px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:center;background:var(--np-gray-pale);height:70px;">\uD83D\uDCF0</div>
              <div class="np-card-body" style="padding:0;">
                <div class="category-tag ${item.category}" style="font-size:0.6rem;">${this.CONFIG.categoryLabels[item.category] || item.category}</div>
                <h3 style="font-size:0.9rem;font-weight:600;"><a href="/article/${item.id}">${item.title}</a></h3>
                <div class="meta" style="font-size:0.7rem;"><span>\uD83D\uDCC5 ${date}</span></div>
              </div>
            </div>`;
        });
        html += '</div>';
        results.innerHTML = html;
      } catch (e) {
        results.innerHTML = '<div class="np-loading">\u062A\u0639\u0630\u0631 \u0627\u0644\u0628\u062D\u062B</div>';
      }
    };

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  },

  /* ── Section nav highlighting ── */
  setupNavScroll() {
    const nav = document.querySelector('.np-nav .container');
    if (nav) {
      nav.addEventListener('scroll', () => { /* no-op for now */ });
    }
  },

  /* ── Auto-refresh ── */
  setupAutoRefresh() {
    const meta = document.querySelector('meta[data-auto-refresh]');
    if (!meta) return;
    const interval = parseInt(meta.getAttribute('data-auto-refresh')) || 180000;
    setTimeout(() => {
      this.loadFeatured();
      this.loadEditorialGrid();
    }, interval);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  NP.init();
  NP.initSearch();
});

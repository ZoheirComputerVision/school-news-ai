const NP = {
  CONFIG: {
    categoryLabels: {
      news: 'أخبار', activity: 'نشاطات', announcement: 'إعلانات',
      event: 'حدث', national: 'وطني', 'regional-news': 'المنطقة',
      society: 'مجتمع', culture: 'ثقافة', sports: 'رياضة',
      development: 'تنمية', 'faces-stories': 'وجوه وعبر',
      advertisements: 'إعلانات', uncategorized: 'غير مصنف',
    },
  },

  async init() {
    this.setDates();
    try {
      const data = await API.getHomepage();
      this._data = data;
      this.renderHero(data.hero, data.breaking);
      this.renderLatest(data.latest);
      this.renderRegional(data.regional);
      this.renderTrending(data.trending);
      this.renderDev(data.development);
      this.renderCultureSociety(data.culture, data.society);
      this.renderSports(data.sports);
      this.renderFooterNav(data.nav);
      this.renderAds();
      this.updateTimestamps();
      this.setupAutoRefresh();
      this.lazyLoad();
    } catch (e) {
      console.error('Homepage load error:', e);
      this.loadFallback();
    }
  },

  setDates() {
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatted = now.toLocaleDateString('ar-DZ', opts);
    document.querySelectorAll('#np-date, #np-date-line').forEach(el => {
      if (el) el.textContent = formatted;
    });
  },

  renderHero(hero, breaking) {
    const container = document.getElementById('np-hero-zone');
    if (!container) return;

    let html = '';

    // Breaking bar
    if (breaking && breaking.length) {
      let breakingHtml = '<div class="hp-breaking-bar">';
      breakingHtml += '<span class="hp-breaking-label">📰 عاجل</span>';
      breakingHtml += '<div class="hp-breaking-items">';
      breaking.slice(0, 4).forEach(item => {
        breakingHtml += `<a href="/article/${item.id}" class="hp-breaking-item">${item.title}</a>`;
      });
      breakingHtml += '</div></div>';
      html += breakingHtml;
    }

    // Hero layout
    html += '<div class="hp-hero-layout">';

    // Featured (main story)
    if (hero.featured) {
      const f = hero.featured;
      const cat = this.CONFIG.categoryLabels[f.category] || f.category || 'خبر';
      const date = f.published_at ? f.published_at.split('T')[0] : '';
      const img = f.image_data || f.image_url || '';
      html += `
        <div class="hp-hero-featured">
          ${img ? `<div class="hp-hero-img"><img src="${img}" alt="${f.title}" loading="lazy"></div>` : '<div class="hp-hero-img-placeholder"><span>📰</span></div>'}
          <div class="hp-hero-body">
            <span class="hp-hero-cat">${cat}</span>
            <h2><a href="/article/${f.id}">${f.title}</a></h2>
            <p>${(f.summary || f.body || '').substring(0, 200)}...</p>
            <div class="hp-hero-meta">
              <span>📅 ${date}</span>
              <span>📡 ${f.source_name || 'الصوت المحلي'}</span>
              ${f.overall_score ? `<span>🎯 ${Math.round(f.overall_score * 100)}%</span>` : ''}
            </div>
          </div>
        </div>`;
    }

    // Secondary stories
    if (hero.secondary && hero.secondary.length) {
      html += '<div class="hp-hero-secondary">';
      hero.secondary.forEach(item => {
        const cat = this.CONFIG.categoryLabels[item.category] || item.category || 'خبر';
        const date = item.published_at ? item.published_at.split('T')[0] : '';
        html += `
          <div class="hp-hero-sec-item">
            <h3><a href="/article/${item.id}">${item.title}</a></h3>
            <span class="hp-hero-sec-meta">${cat} · ${date}</span>
          </div>`;
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  renderLatest(items) {
    const container = document.getElementById('np-latest-grid');
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = '<p style="text-align:center;color:var(--np-gray);padding:30px;">لا توجد أخبار حالياً</p>'; return; }

    let html = '<div class="hp-latest-grid">';
    items.forEach(item => {
      const cat = this.CONFIG.categoryLabels[item.category] || item.category || 'خبر';
      const date = item.published_at ? item.published_at.split('T')[0] : '';
      const img = item.image_data || item.image_url || '';
      const summary = (item.summary || item.body || '').substring(0, 100);
      html += `
        <div class="hp-latest-card">
          ${img ? `<div class="hp-latest-card-img"><img src="${img}" alt="${item.title}" loading="lazy"></div>` : '<div class="hp-latest-card-img-placeholder"><span>📰</span></div>'}
          <div class="hp-latest-card-body">
            <span class="hp-latest-card-cat">${cat}</span>
            <h3><a href="/article/${item.id}">${item.title}</a></h3>
            <p>${summary}...</p>
            <span class="hp-latest-card-date">📅 ${date}</span>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderRegional(items) {
    const container = document.getElementById('np-regional-grid');
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = '<p style="text-align:center;color:var(--np-gray);padding:20px;">لا توجد أخبار جهوية</p>'; return; }

    let html = '<div class="hp-regional-grid">';
    items.forEach(item => {
      const date = item.published_at ? item.published_at.split('T')[0] : '';
      html += `
        <div class="hp-regional-card">
          <h3><a href="/article/${item.id}">${item.title}</a></h3>
          <p>${(item.summary || item.body || '').substring(0, 120)}...</p>
          <span class="hp-regional-date">📅 ${date}</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderTrending(items) {
    const container = document.getElementById('np-trending-grid');
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = ''; return; }

    let html = '<div class="hp-trending-grid">';
    items.slice(0, 6).forEach((item, i) => {
      const date = item.published_at ? item.published_at.split('T')[0] : '';
      const cat = this.CONFIG.categoryLabels[item.category] || item.category || 'خبر';
      html += `
        <div class="hp-trending-item">
          <span class="hp-trending-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="hp-trending-body">
            <span class="hp-trending-cat">${cat}</span>
            <h3><a href="/article/${item.id}">${item.title}</a></h3>
            <span class="hp-trending-meta">📅 ${date} · 👁 ${item.view_count || 0}</span>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderDev(items) {
    const container = document.getElementById('np-dev-grid');
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = '<p style="color:var(--np-gray);">لا توجد مقالات</p>'; return; }

    let html = '<div class="hp-category-list">';
    items.forEach(item => {
      const date = item.published_at ? item.published_at.split('T')[0] : '';
      html += `
        <div class="hp-cat-item">
          <h4><a href="/article/${item.id}">${item.title}</a></h4>
          <span class="hp-cat-date">📅 ${date}</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderCultureSociety(culture, society) {
    const cultureContainer = document.getElementById('np-culture-grid');
    if (cultureContainer) {
      if (culture && culture.length) {
        let html = '<div class="hp-category-list">';
        culture.forEach(item => {
          const date = item.published_at ? item.published_at.split('T')[0] : '';
          html += `
            <div class="hp-cat-item">
              <h4><a href="/article/${item.id}">${item.title}</a></h4>
              <span class="hp-cat-date">📅 ${date}</span>
            </div>`;
        });
        html += '</div>';
        cultureContainer.innerHTML = html;
      } else {
        cultureContainer.innerHTML = '<p style="color:var(--np-gray);">لا توجد مقالات</p>';
      }
    }

    const societyContainer = document.getElementById('np-society-grid');
    if (societyContainer) {
      if (society && society.length) {
        let html = '<div class="hp-category-list">';
        society.forEach(item => {
          const date = item.published_at ? item.published_at.split('T')[0] : '';
          html += `
            <div class="hp-cat-item">
              <h4><a href="/article/${item.id}">${item.title}</a></h4>
              <span class="hp-cat-date">📅 ${date}</span>
            </div>`;
        });
        html += '</div>';
        societyContainer.innerHTML = html;
      } else {
        societyContainer.innerHTML = '<p style="color:var(--np-gray);">لا توجد مقالات</p>';
      }
    }
  },

  renderSports(items) {
    const container = document.getElementById('np-sports-grid');
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = '<p style="text-align:center;color:var(--np-gray);padding:20px;">لا توجد أخبار رياضية</p>'; return; }

    let html = '<div class="hp-sports-grid">';
    items.forEach(item => {
      const date = item.published_at ? item.published_at.split('T')[0] : '';
      const img = item.image_data || item.image_url || '';
      html += `
        <div class="hp-sports-card">
          ${img ? `<div class="hp-sports-img"><img src="${img}" alt="${item.title}" loading="lazy"></div>` : '<div class="hp-sports-img-placeholder"><span>⚽</span></div>'}
          <div class="hp-sports-body">
            <h3><a href="/article/${item.id}">${item.title}</a></h3>
            <span class="hp-sports-date">📅 ${date}</span>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  async renderAds() {
    const zones = ['homepage-top', 'homepage-middle', 'homepage-bottom'];
    for (const zoneId of zones) {
      try {
        const data = await API.get(`/ads/zone/${zoneId}`);
        if (data && data.ad) {
          const sectionId = zoneId === 'homepage-top' ? 'hp-ad-1' : zoneId === 'homepage-bottom' ? 'hp-ad-2' : null;
          if (!sectionId) continue;
          const section = document.getElementById(sectionId);
          if (!section) continue;
          const contentDiv = document.getElementById(sectionId === 'hp-ad-1' ? 'np-ad-content-1' : 'np-ad-content-2');
          if (!contentDiv) continue;
          const ad = data.ad;
          let adHtml = '';
          if (ad.image_url) {
            adHtml += `<a href="${ad.link_url || '#'}" target="_blank" rel="noopener" onclick="API.post('/ads/track/click/${ad.id}',{}).catch(()=>{})">`;
            adHtml += `<img src="${ad.image_url}" alt="${ad.title}" style="max-width:100%;height:auto;" loading="lazy">`;
            adHtml += '</a>';
          } else {
            adHtml += `<a href="${ad.link_url || '#'}" target="_blank" rel="noopener" style="display:block;padding:20px;background:var(--np-primary);color:var(--np-white);text-align:center;border-radius:8px;text-decoration:none;" onclick="API.post('/ads/track/click/${ad.id}',{}).catch(()=>{})">`;
            adHtml += `<strong style="font-size:1.1rem;">${ad.title}</strong>`;
            adHtml += `<br><span style="font-size:0.78rem;">${ad.advertiser || ''}</span>`;
            adHtml += '</a>';
          }
          contentDiv.innerHTML = adHtml;
          section.style.display = 'block';
          API.post(`/ads/track/impression/${ad.id}`, {}).catch(() => {});
        }
      } catch (e) {
        // Zone has no active ad or error — keep hidden
      }
    }
  },

  renderFooterNav(nav) {
    const container = document.getElementById('footer-nav-links');
    if (!container) return;
    if (!nav || !nav.items) return;
    let html = '';
    nav.items.forEach(item => {
      html += `<a href="${item.path}">${item.label}</a>`;
    });
    container.innerHTML = html;
  },

  updateTimestamps() {
    const now = new Date();
    const time = now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.np-timestamp').forEach(el => {
      if (el) el.textContent = time;
    });
  },

  lazyLoad() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.src) { el.src = el.dataset.src; el.removeAttribute('data-src'); }
        if (el.dataset.srcset) { el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); }
        el.classList.remove('lazy');
        observer.unobserve(el);
      });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('.lazy, img[loading="lazy"]').forEach(el => observer.observe(el));
  },

  setupAutoRefresh() {
    const meta = document.querySelector('meta[data-auto-refresh]');
    if (!meta) return;
    const interval = parseInt(meta.getAttribute('data-auto-refresh')) || 180000;
    setTimeout(() => this.init(), interval);
  },

  async loadFallback() {
    try {
      const data = await API.getContent({ status: 'published', limit: 12 });
      const items = data.items || [];
      if (items.length > 0) {
        this.renderHero({ featured: items[0], secondary: items.slice(1, 3) }, []);
        this.renderLatest(items);
      }
    } catch (e) {
      document.querySelectorAll('#np-hero-zone, #np-latest-grid').forEach(el => {
        if (el) el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--np-gray);">⚠️ تعذر تحميل المحتوى</div>';
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  NP.init();
});

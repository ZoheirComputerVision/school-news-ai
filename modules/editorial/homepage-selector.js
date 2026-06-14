const db = require('../../database');
const { navItems } = require('../../config/navigation');

class HomepageSelector {
  selectHero() {
    const items = db.adapter.findAll('processed_content') || [];
    const published = items.filter(i => i.status === 'published');
    if (!published.length) return null;

    const scored = published.map(item => {
      const score = (item.overall_score || 0) * 0.4
        + (item.editor_priority || 0) * 0.3
        + (item.confidence_score || 0) * 0.2
        + (item.view_count || 0) * 0.001;
      return { ...item, _composite: score };
    });

    scored.sort((a, b) => b._composite - a._composite);

    return {
      featured: scored[0] || null,
      secondary: scored.slice(1, 3) || [],
    };
  }

  selectTrending(limit = 6) {
    const items = db.adapter.findAll('processed_content') || [];
    const published = items.filter(i => i.status === 'published');
    const viewCounts = {};
    (db.adapter.findAll('views') || []).forEach(v => {
      viewCounts[v.content_id] = (viewCounts[v.content_id] || 0) + 1;
    });

    return published
      .map(item => ({ ...item, view_count: viewCounts[item.id] || 0 }))
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, limit);
  }

  selectRegional(limit = 4) {
    const items = db.adapter.findAll('processed_content') || [];
    const published = items.filter(i => i.status === 'published' && i.category === 'regional-news');
    return published
      .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
      .slice(0, limit);
  }

  selectByCategory(category, limit = 6) {
    const items = db.adapter.findAll('processed_content') || [];
    const published = items.filter(i => i.status === 'published' && i.category === category);
    return published
      .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
      .slice(0, limit);
  }

  selectLatest(limit = 12) {
    const items = db.adapter.findAll('processed_content') || [];
    const published = items.filter(i => i.status === 'published');
    return published
      .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
      .slice(0, limit);
  }

  selectBreaking(limit = 5) {
    const items = db.adapter.findAll('processed_content') || [];
    const breaking = items.filter(i => i.status === 'published' && i.category === 'event');
    if (!breaking.length) {
      return items
        .filter(i => i.status === 'published')
        .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
        .slice(0, limit);
    }
    return breaking
      .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
      .slice(0, limit);
  }

  buildHomepage() {
    const hero = this.selectHero();
    const viewCounts = {};
    (db.adapter.findAll('views') || []).forEach(v => {
      viewCounts[v.content_id] = (viewCounts[v.content_id] || 0) + 1;
    });

    const enrich = item => item ? { ...item, view_count: viewCounts[item.id] || 0 } : null;

    return {
      breaking: this.selectBreaking().map(enrich),
      hero: {
        featured: enrich(hero.featured),
        secondary: hero.secondary.map(enrich),
      },
      latest: this.selectLatest(12).map(enrich),
      regional: this.selectRegional(4).map(enrich),
      trending: this.selectTrending(6).map(enrich),
      development: this.selectByCategory('development', 4).map(enrich),
      culture: this.selectByCategory('culture', 3).map(enrich),
      society: this.selectByCategory('society', 3).map(enrich),
      sports: this.selectByCategory('sports', 3).map(enrich),
      nav: { items: navItems },
      generated_at: new Date().toISOString(),
    };
  }
}

module.exports = HomepageSelector;

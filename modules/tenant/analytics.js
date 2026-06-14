const db = require('../../database');

class TenantAnalytics {
  getContentStats(tenantId) {
    try {
      const items = (db.adapter.findAll('processed_content') || []).filter(i => !i.tenant_id || i.tenant_id === parseInt(tenantId));
      const views = db.adapter.findAll('views') || [];
      const viewMap = {};
      views.forEach(v => { viewMap[v.content_id] = (viewMap[v.content_id] || 0) + 1; });
      return {
        total: items.length,
        published: items.filter(i => i.status === 'published').length,
        draft: items.filter(i => i.status === 'draft' || i.status === 'pending').length,
        rejected: items.filter(i => i.status === 'rejected').length,
        by_category: items.reduce((acc, i) => {
          const cat = i.category || 'uncategorized';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {}),
        total_views: Object.values(viewMap).reduce((a, b) => a + b, 0),
        avg_views_per_article: items.length > 0 ? Math.round(Object.values(viewMap).reduce((a, b) => a + b, 0) / items.length) : 0,
      };
    } catch { return { total: 0, published: 0, draft: 0, rejected: 0, by_category: {}, total_views: 0, avg_views_per_article: 0 }; }
  }

  getAdStats(tenantId) {
    try {
      const campaigns = (db.adapter.findAll('campaigns') || []).filter(c => !c.tenant_id || c.tenant_id === parseInt(tenantId));
      const advertisers = (db.adapter.findAll('advertisers') || []).filter(a => !a.tenant_id || a.tenant_id === parseInt(tenantId));
      return {
        total_campaigns: campaigns.length,
        active_campaigns: campaigns.filter(c => c.status === 'active').length,
        total_impressions: campaigns.reduce((s, c) => s + (c.impressions || 0), 0),
        total_clicks: campaigns.reduce((s, c) => s + (c.clicks || 0), 0),
        ctr: campaigns.reduce((s, c) => s + (c.impressions || 0), 0) > 0
          ? ((campaigns.reduce((s, c) => s + (c.clicks || 0), 0) / campaigns.reduce((s, c) => s + (c.impressions || 0), 0)) * 100).toFixed(2)
          : 0,
        total_advertisers: advertisers.length,
      };
    } catch { return { total_campaigns: 0, active_campaigns: 0, total_impressions: 0, total_clicks: 0, ctr: 0, total_advertisers: 0 }; }
  }

  getEditorialStats(tenantId) {
    try {
      const items = (db.adapter.findAll('editorial_items') || []).filter(i => !i.tenant_id || i.tenant_id === parseInt(tenantId));
      return {
        total: items.length,
        pending: items.filter(i => i.status === 'pending').length,
        approved: items.filter(i => i.status === 'approved').length,
        rejected: items.filter(i => i.status === 'rejected').length,
        published: items.filter(i => i.status === 'published').length,
        avg_confidence: items.length > 0
          ? (items.reduce((s, i) => s + (parseFloat(i.confidence_score) || 0), 0) / items.length).toFixed(2)
          : 0,
      };
    } catch { return { total: 0, pending: 0, approved: 0, rejected: 0, published: 0, avg_confidence: 0 }; }
  }

  getEngagement(tenantId) {
    try {
      const items = (db.adapter.findAll('processed_content') || []).filter(i => !i.tenant_id || i.tenant_id === parseInt(tenantId));
      const views = db.adapter.findAll('views') || [];
      const tenantViews = views.filter(v => {
        const content = items.find(i => i.id === v.content_id);
        return content;
      });
      const viewMap = {};
      tenantViews.forEach(v => { viewMap[v.content_id] = (viewMap[v.content_id] || 0) + 1; });
      const withViews = items.map(i => ({ ...i, view_count: viewMap[i.id] || 0 }));
      const sorted = withViews.sort((a, b) => b.view_count - a.view_count);
      return {
        total_views: tenantViews.length,
        unique_viewed_articles: Object.keys(viewMap).length,
        most_viewed: sorted.slice(0, 5).map(i => ({ id: i.id, title: i.title, views: i.view_count })),
      };
    } catch { return { total_views: 0, unique_viewed_articles: 0, most_viewed: [] }; }
  }

  getFull(tenantId) {
    return {
      content: this.getContentStats(tenantId),
      ads: this.getAdStats(tenantId),
      editorial: this.getEditorialStats(tenantId),
      engagement: this.getEngagement(tenantId),
      generated_at: new Date().toISOString(),
    };
  }
}

module.exports = TenantAnalytics;

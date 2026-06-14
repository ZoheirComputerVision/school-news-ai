const { BaseRepository } = require('./base-repository');

class ArticleRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'processed_content');
    this.logTable = 'ai_decision_log';
  }

  findByStatus(status) {
    return this.find(c => c.status === status);
  }

  findByCategory(category) {
    return this.find(c => c.category === category);
  }

  findPublished(options = {}) {
    const { category, limit = 20, offset = 0, sort = 'created_at' } = options;
    let items = this.find(c => c.status === 'published');
    if (category) items = items.filter(c => c.category === category);
    const sortField = ['created_at', 'published_at', 'overall_score', 'event_date'].includes(sort) ? sort : 'created_at';
    items.sort((a, b) => (b[sortField] || '').localeCompare((a[sortField] || '')));
    const total = items.length;
    return { items: items.slice(offset, offset + limit), total };
  }

  findPendingReview() {
    return this.find(c => c.status === 'review').sort((a, b) => (b.created_at || '').localeCompare((a.created_at || '')));
  }

  findDraftsForPublish() {
    return this.find(c => c.status === 'draft' && c.overall_score >= 0.8);
  }

  search(query) {
    const q = (query || '').toLowerCase();
    if (q.length < 2) return [];
    return this.find(c =>
      c.status === 'published' &&
      ((c.title || '').toLowerCase().includes(q) || (c.body || '').toLowerCase().includes(q))
    ).slice(0, 20);
  }

  getStats() {
    const all = this.findAll();
    const published = all.filter(c => c.status === 'published');
    const catCounts = {};
    const allCategories = ['event', 'national', 'regional-news', 'society', 'culture', 'sports', 'development', 'faces-stories', 'advertisements', 'uncategorized'];
    for (const cat of allCategories) {
      catCounts[cat] = published.filter(c => c.category === cat).length;
    }
    return {
      total: all.length,
      published: published.length,
      rejected: all.filter(c => c.status === 'rejected').length,
      drafts: all.filter(c => c.status === 'draft').length,
      review: all.filter(c => c.status === 'review').length,
      byCategory: catCounts,
    };
  }

  logDecision(contentId, type, data) {
    return this.adapter.create(this.logTable, {
      content_id: contentId,
      decision_type: type,
      input_data: JSON.stringify(data || {}),
      output_data: JSON.stringify({ timestamp: new Date().toISOString() }),
      model_version: 'repository-v1',
      confidence: type.includes('approve') || type === 'auto_publish' ? 0.95 : 1.0,
      human_reviewed: type === 'manual_approve' || type === 'rejected' ? 1 : 0,
    });
  }

  getDecisionLogs(contentId) {
    return this.adapter.find(this.logTable, l => l.content_id === contentId)
      .sort((a, b) => (b.created_at || '').localeCompare((a.created_at || '')));
  }

  getAllLogs(options = {}) {
    const { limit = 100, offset = 0 } = options;
    const all = this.adapter.findAll(this.logTable)
      .sort((a, b) => (b.created_at || '').localeCompare((a.created_at || '')));
    const total = all.length;
    const items = all.slice(offset, offset + limit).map(log => {
      const content = this.adapter.getById(this.table, log.content_id);
      return { ...log, title: content ? content.title : 'N/A' };
    });
    return { items, total };
  }

  addView(contentId, ip) {
    const existing = this.adapter.findOne('views', v => v.content_id === contentId && v.ip === ip);
    if (!existing) {
      this.adapter.create('views', { content_id: contentId, ip });
    }
    return this.adapter.count('views', v => v.content_id === contentId);
  }

  getViewCount(contentId) {
    return this.adapter.count('views', v => v.content_id === contentId);
  }

  getCategories() {
    const published = this.find(c => c.status === 'published');
    const counts = {};
    published.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  }
}

module.exports = { ArticleRepository };

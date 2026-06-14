const path = require('path');
const fs = require('fs');
const config = require('../../config');
const { BaseRepository } = require('./base-repository');

class ArchiveRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'archive');
    this.contentTable = 'processed_content';
    this.logTable = 'ai_decision_log';
    this.viewTable = 'views';
  }

  findByContentId(contentId) {
    return this.findOne(a => a.content_id === contentId);
  }

  archiveContent(contentId, reason) {
    const content = this.adapter.getById(this.contentTable, contentId);
    if (!content) return null;
    const existing = this.findByContentId(contentId);
    if (!existing) {
      return this.create({
        content_id: contentId,
        original_data: JSON.stringify(content),
        archive_reason: reason,
        decisions_log: JSON.stringify({ archived_at: new Date().toISOString(), by: 'archive-v1' }),
      });
    }
    return existing;
  }

  buildTimeline() {
    const allContent = this.adapter.findAll(this.contentTable)
      .filter(c => c.status === 'published' || c.status === 'rejected')
      .sort((a, b) => (b.event_date || b.created_at || '').localeCompare(a.event_date || a.created_at || ''));

    const timeline = {};
    for (const item of allContent) {
      const date = item.event_date || (item.created_at || '').split('T')[0] || 'غير محدد';
      const year = date.split('-')[0] || 'غير محدد';
      const month = date.split('-')[1] || '00';
      const monthNames = ['', 'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthName = monthNames[parseInt(month)] || month;
      if (!timeline[year]) timeline[year] = {};
      if (!timeline[year][monthName]) timeline[year][monthName] = [];
      timeline[year][monthName].push(item);
    }
    return timeline;
  }

  getStats() {
    const items = this.adapter.findAll(this.contentTable);
    const archived = this.findAll();
    const logs = this.adapter.findAll(this.logTable);
    const views = this.adapter.findAll(this.viewTable);
    const published = items.filter(i => i.status === 'published');
    const catCounts = {};
    const allCategories = ['event', 'national', 'regional-news', 'society', 'culture', 'sports', 'development', 'faces-stories', 'advertisements', 'uncategorized'];
    for (const cat of allCategories) {
      catCounts[cat] = published.filter(i => i.category === cat).length;
    }
    return {
      total_published: published.length,
      total_rejected: items.filter(i => i.status === 'rejected').length,
      total_archived: archived.length,
      total_drafts: items.filter(i => i.status === 'draft').length,
      total_review: items.filter(i => i.status === 'review').length,
      total_ai_decisions: logs.length,
      total_views: views.length,
      by_category: catCounts,
    };
  }

  exportToJSON() {
    const data = {
      exported_at: new Date().toISOString(),
      school: config.SCHOOL_NAME,
      content: this.adapter.orderBy(this.adapter.findAll(this.contentTable), 'created_at', 'desc'),
      archive: this.adapter.orderBy(this.findAll(), 'archived_at', 'desc'),
      decisions: this.adapter.orderBy(this.adapter.findAll(this.logTable), 'created_at', 'desc'),
      stats: this.getStats(),
    };
    const filePath = path.join(config.DATA_DIR, `export_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }
}

module.exports = { ArchiveRepository };

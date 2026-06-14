const db = require('../../database');

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'published'];

class EditorialReviewQueue {
  async add(contentData, tenantId) {
    const item = db.adapter.create('editorial_items', {
      source_id: contentData.source_id || null,
      raw_content_id: contentData.raw_content_id || null,
      category: contentData.category || 'uncategorized',
      confidence_score: contentData.confidence_score || 0,
      headline: contentData.headline || '',
      summary: contentData.summary || '',
      article: contentData.article || '',
      tags: Array.isArray(contentData.tags) ? contentData.tags.join(',') : (contentData.tags || ''),
      status: 'pending',
      tenant_id: tenantId || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    this._log(item.id, 'created', 'system', { category: item.category, confidence: item.confidence_score });
    
    return item;
  }

  approve(id, actor = 'admin') {
    const item = db.adapter.getById('editorial_items', id);
    if (!item) throw new Error(`Editorial item ${id} not found`);
    if (item.status !== 'pending') throw new Error(`Cannot approve item with status "${item.status}"`);
    
    const updated = db.adapter.update('editorial_items', id, {
      status: 'approved',
      updated_at: new Date().toISOString(),
    });
    
    this._log(id, 'approved', actor, { previous_status: item.status });
    
    return updated;
  }

  reject(id, reason = '', actor = 'admin') {
    const item = db.adapter.getById('editorial_items', id);
    if (!item) throw new Error(`Editorial item ${id} not found`);
    if (item.status === 'published') throw new Error('Cannot reject a published item');
    
    const updated = db.adapter.update('editorial_items', id, {
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    });
    
    this._log(id, 'rejected', actor, { reason, previous_status: item.status });
    
    return updated;
  }

  markPublished(id, actor = 'system') {
    const item = db.adapter.getById('editorial_items', id);
    if (!item) throw new Error(`Editorial item ${id} not found`);
    if (item.status !== 'approved') throw new Error(`Cannot publish item with status "${item.status}"`);
    
    const updated = db.adapter.update('editorial_items', id, {
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    this._log(id, 'published', actor, { previous_status: 'approved' });
    
    return updated;
  }

  getPending(limit = 20, tenantId) {
    try {
      const items = db.adapter.findAll('editorial_items') || [];
      return items
        .filter(i => i.status === 'pending' && (!tenantId || !i.tenant_id || i.tenant_id === tenantId))
        .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  getApproved(limit = 20, tenantId) {
    try {
      const items = db.adapter.findAll('editorial_items') || [];
      return items
        .filter(i => i.status === 'approved' && (!tenantId || !i.tenant_id || i.tenant_id === tenantId))
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  getRejected(limit = 20, tenantId) {
    try {
      const items = db.adapter.findAll('editorial_items') || [];
      return items
        .filter(i => i.status === 'rejected' && (!tenantId || !i.tenant_id || i.tenant_id === tenantId))
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  getStats(tenantId) {
    try {
      const all = (db.adapter.findAll('editorial_items') || []).filter(i => !tenantId || !i.tenant_id || i.tenant_id === tenantId);
      return {
        pending: all.filter(i => i.status === 'pending').length,
        approved: all.filter(i => i.status === 'approved').length,
        rejected: all.filter(i => i.status === 'rejected').length,
        published: all.filter(i => i.status === 'published').length,
        total: all.length,
      };
    } catch {
      return { pending: 0, approved: 0, rejected: 0, published: 0, total: 0 };
    }
  }

  _log(itemId, action, actor, details = {}) {
    try {
      db.adapter.create('editorial_audit', {
        editorial_item_id: itemId,
        action,
        actor: actor || 'system',
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to log editorial audit:', e.message);
    }
  }
}

module.exports = EditorialReviewQueue;

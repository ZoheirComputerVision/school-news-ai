const db = require('../database');

const SOURCE_TYPES = ['facebook', 'rss', 'web', 'manual'];
const SOURCE_STATUSES = ['active', 'paused', 'error', 'disabled'];
const SOURCE_CATEGORIES = ['social', 'official', 'news', 'education', 'internal', 'general'];
const REGIONS = ['تيارت', 'الجزائر', ''];

class SourceRegistry {
  constructor() {
    this.repo = db.sources;
    this.adapter = db.adapter;
  }

  register(data) {
    const existing = data.source_id ? this.repo.findOne(s => s.source_id === data.source_id) : null;
    if (existing) return this.repo.update(existing.id, { ...data, updated_at: new Date().toISOString() });
    return this.repo.create({
      source_id: data.source_id || `src-${Date.now()}`,
      name: data.name || '',
      url: data.url || '',
      type: data.type || 'web',
      region: data.region || '',
      municipality: data.municipality || '',
      category: data.category || 'general',
      status: data.status || 'active',
      reliability_score: typeof data.reliability_score === 'number' ? data.reliability_score : 0.5,
      sync_frequency: data.sync_frequency || 30,
      is_active: data.status === 'active' ? 1 : 0,
      created_at: new Date().toISOString(),
    });
  }

  getActive() {
    return this.repo.find(s => s.status === 'active');
  }

  getByType(type) {
    return this.repo.find(s => s.type === type);
  }

  getByRegion(region) {
    return this.repo.find(s => s.region === region);
  }

  getByCategory(category) {
    return this.repo.find(s => s.category === category);
  }

  getById(id) {
    return this.repo.findById ? this.repo.findById(id) : this.adapter.getById('sources', id);
  }

  getBySourceId(sourceId) {
    return this.repo.findOne(s => s.source_id === sourceId);
  }

  getAll() {
    return this.repo.findAll();
  }

  update(id, data) {
    return this.repo.update(id, { ...data, updated_at: new Date().toISOString() });
  }

  remove(id) {
    const source = this.getById(id);
    if (!source) return false;
    return this.repo.update(id, { status: 'disabled', is_active: 0, updated_at: new Date().toISOString() });
  }

  hardDelete(id) {
    return this.adapter.delete('sources', id);
  }

  markSync(id, success = true) {
    const now = new Date().toISOString();
    return this.repo.update(id, {
      last_scraped: now,
      last_sync: now,
      status: success ? 'active' : 'error',
      is_active: success ? 1 : 1,
      updated_at: now,
    });
  }

  markError(id, errorMsg) {
    const now = new Date().toISOString();
    this.adapter.create('admin_actions', {
      action: 'source_error',
      details: JSON.stringify({ sourceId: id, error: errorMsg, timestamp: now }),
      created_at: now,
    });
    return this.repo.update(id, { status: 'error', is_active: 1, updated_at: now });
  }

  shouldSync(source) {
    if (!source || source.status !== 'active') return false;
    if (!source.last_sync) return true;
    const freq = source.sync_frequency || 30;
    const last = new Date(source.last_sync).getTime();
    return (Date.now() - last) >= freq * 60 * 1000;
  }

  getStats() {
    const all = this.getAll();
    const active = all.filter(s => s.status === 'active');
    const error = all.filter(s => s.status === 'error');
    const byType = {};
    const byRegion = {};
    const byCategory = {};
    for (const s of all) {
      byType[s.type] = (byType[s.type] || 0) + 1;
      byRegion[s.region || 'unknown'] = (byRegion[s.region || 'unknown'] || 0) + 1;
      byCategory[s.category || 'general'] = (byCategory[s.category || 'general'] || 0) + 1;
    }
    return {
      total: all.length,
      active: active.length,
      error: error.length,
      byType,
      byRegion,
      byCategory,
    };
  }

  getReliabilityScores() {
    return this.getActive().map(s => ({
      id: s.id,
      source_id: s.source_id,
      name: s.name,
      type: s.type,
      reliability_score: s.reliability_score || 0.5,
      last_sync: s.last_sync,
    })).sort((a, b) => b.reliability_score - a.reliability_score);
  }

  findByName(name) {
    if (!name) return null;
    const q = name.toLowerCase();
    return this.repo.findOne(s => (s.name || '').toLowerCase().includes(q)) || null;
  }

  findByUrl(url) {
    if (!url) return null;
    return this.repo.findOne(s => s.url && url.includes(s.url)) || null;
  }
}

module.exports = new SourceRegistry();

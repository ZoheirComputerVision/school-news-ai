const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { DataAdapter } = require('./adapter');
const { backupTable } = require('./backup');

class Cache {
  constructor(ttl = 30000) {
    this.store = new Map();
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() - entry.time > this.ttl) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  set(key, data) {
    this.store.set(key, { data, time: Date.now() });
    if (this.store.size > 500) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
  }

  invalidate(pattern) {
    for (const key of this.store.keys()) {
      if (key.includes(pattern) || key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
    };
  }
}

class JsonAdapter extends DataAdapter {
  constructor() {
    super();
    this.dir = config.DATA_DIR;
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
    this.tables = {};
    this.cache = new Cache(20000);
    this.saveQueue = {};
    this.saveTimer = null;
    this.backupEnabled = true;
  }

  init() {
    const start = Date.now();
    this.tables = {
      sources: this._load('sources'),
      raw_data: this._load('raw_data'),
      processed_content: this._load('processed_content'),
      media: this._load('media'),
      archive: this._load('archive'),
      ai_decision_log: this._load('ai_decision_log'),
      admin_actions: this._load('admin_actions'),
      settings: this._load('settings'),
      views: this._load('views'),
    };
    this._seedDefaults();
    const count = Object.values(this.tables).reduce((a, t) => a + t.length, 0);
    return count;
  }

  _load(name) {
    const fp = path.join(this.dir, `${name}.json`);
    try {
      const data = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  _saveNow(name) {
    this._save(name);
    delete this.saveQueue[name];
  }

  _save(name) {
    const fp = path.join(this.dir, `${name}.json`);
    fs.writeFileSync(fp, JSON.stringify(this.tables[name] || []), 'utf-8');
    this.cache.invalidate(name);
  }

  _debouncedSave(name) {
    this.saveQueue[name] = true;
    if (!this.saveTimer) {
      this.saveTimer = setTimeout(() => {
        for (const tableName of Object.keys(this.saveQueue)) {
          this._save(tableName);
        }
        this.saveQueue = {};
        this.saveTimer = null;
      }, 500);
    }
  }

  _seedDefaults() {
    if (this.tables.sources.length === 0) {
      this.tables.sources = [
        { id: 1, name: 'صفحة الفيسبوك الرسمية', url: `https://www.facebook.com/${config.AI.FACEBOOK_PAGE}`, type: 'facebook', is_active: 1, trust_score: 0.75, last_scraped: null, created_at: new Date().toISOString() },
        { id: 2, name: 'وزارة التربية الوطنية', url: config.AI.MINISTRY_URL, type: 'web', is_active: 1, trust_score: 0.9, last_scraped: null, created_at: new Date().toISOString() },
        { id: 3, name: 'إدخال يدوي - إدارة الثانوية', url: '', type: 'manual', is_active: 1, trust_score: 1.0, last_scraped: null, created_at: new Date().toISOString() },
      ];
      this._save('sources');
    }
    if (this.tables.settings.length === 0) {
      this.tables.settings = [
        { key: 'stop_auto_publish', value: 'false', updated_at: new Date().toISOString() },
        { key: 'require_human_review', value: 'false', updated_at: new Date().toISOString() },
        { key: 'last_scheduler_run', value: 'never', updated_at: new Date().toISOString() },
        { key: 'total_published_today', value: '0', updated_at: new Date().toISOString() },
        { key: 'publish_date', value: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() },
      ];
      this._save('settings');
    }
  }

  _nextId(table) {
    const arr = this.tables[table] || [];
    return arr.length > 0 ? arr.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1 : 1;
  }

  findAll(table) {
    return [...(this.tables[table] || [])];
  }

  find(table, predicate) {
    const items = this.tables[table] || [];
    return predicate ? items.filter(predicate) : [...items];
  }

  findOne(table, predicate) {
    const items = this.tables[table] || [];
    return predicate ? items.find(predicate) || null : null;
  }

  getById(table, id) {
    const cacheKey = `get:${table}:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const result = (this.tables[table] || []).find(r => r.id === id) || null;
    if (result) this.cache.set(cacheKey, result);
    return result;
  }

  create(table, data) {
    if (this.backupEnabled) backupTable(table);
    const id = this._nextId(table);
    const record = { id, ...data, created_at: new Date().toISOString() };
    this.tables[table].push(record);
    this._saveNow(table);
    this.cache.invalidate(table);
    return record;
  }

  update(table, id, data) {
    if (this.backupEnabled) backupTable(table);
    const arr = this.tables[table];
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...data, updated_at: new Date().toISOString() };
    this._saveNow(table);
    this.cache.invalidate(table);
    return arr[idx];
  }

  delete(table, id) {
    if (this.backupEnabled) backupTable(table);
    const arr = this.tables[table];
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    this._saveNow(table);
    this.cache.invalidate(table);
    return true;
  }

  upsert(table, data, matchFn) {
    if (this.backupEnabled) backupTable(table);
    const arr = this.tables[table];
    const existing = matchFn ? arr.find(matchFn) : null;
    if (existing) {
      Object.assign(existing, data, { updated_at: new Date().toISOString() });
      this._saveNow(table);
      this.cache.invalidate(table);
      return existing;
    }
    return this.create(table, data);
  }

  count(table, predicate) {
    const items = this.tables[table] || [];
    return predicate ? items.filter(predicate).length : items.length;
  }

  saveNow(table) {
    this._saveNow(table);
  }

  rawCollection(table) {
    return this.tables[table] || [];
  }

  getCacheStats() {
    return this.cache.stats();
  }

  orderBy(items, key, dir = 'desc') {
    return [...items].sort((a, b) => {
      const va = (a[key] || '').toString();
      const vb = (b[key] || '').toString();
      if (dir === 'desc') return vb.localeCompare(va);
      return va.localeCompare(vb);
    });
  }

  limit(items, n, offset = 0) {
    return items.slice(offset, offset + n);
  }

  where(table, conditions) {
    let items = this.tables[table] || [];
    for (const [key, val] of Object.entries(conditions)) {
      items = items.filter(r => r[key] === val);
    }
    return items;
  }
}

module.exports = { JsonAdapter };

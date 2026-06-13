const path = require('path');
const config = require('../../config');
const { DataAdapter } = require('./adapter');

class SqliteAdapter extends DataAdapter {
  constructor() {
    super();
    this.db = null;
    this.initialized = false;
  }

  init() {
    const Database = require('better-sqlite3');
    const dbPath = path.join(config.DATA_DIR, 'database.sqlite');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this._createTables();
    this._seedDefaults();
    this.initialized = true;
    const count = this.count('processed_content');
    return count;
  }

  _createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT,
        type TEXT,
        is_active INTEGER DEFAULT 1,
        trust_score REAL DEFAULT 0.5,
        last_scraped TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS raw_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        raw_text TEXT,
        content_hash TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS processed_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_data_id INTEGER,
        title TEXT,
        body TEXT,
        summary TEXT,
        category TEXT DEFAULT 'uncategorized',
        classification_score REAL,
        fact_check_score REAL,
        source_trust REAL,
        urgency_score REAL,
        importance TEXT DEFAULT 'normal',
        overall_score REAL,
        status TEXT DEFAULT 'draft',
        source_url TEXT,
        source_name TEXT,
        event_date TEXT,
        image_url TEXT,
        image_data TEXT,
        is_ai_generated INTEGER DEFAULT 0,
        writer_version TEXT,
        review_priority TEXT,
        reviewed_at TEXT,
        reviewed_by TEXT,
        rejection_reason TEXT,
        published_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER,
        url TEXT,
        type TEXT,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS archive (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER,
        original_data TEXT,
        archive_reason TEXT,
        decisions_log TEXT,
        archived_at TEXT,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS ai_decision_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER,
        decision_type TEXT,
        input_data TEXT,
        output_data TEXT,
        model_version TEXT,
        confidence REAL,
        human_reviewed INTEGER DEFAULT 0,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS admin_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        details TEXT,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER,
        ip TEXT,
        created_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_processed_status ON processed_content(status);
      CREATE INDEX IF NOT EXISTS idx_processed_category ON processed_content(category);
      CREATE INDEX IF NOT EXISTS idx_raw_status ON raw_data(status);
      CREATE INDEX IF NOT EXISTS idx_archive_content_id ON archive(content_id);
      CREATE INDEX IF NOT EXISTS idx_views_content_id ON views(content_id);
    `);
  }

  _seedDefaults() {
    const sourceCount = this.db.prepare('SELECT COUNT(*) as c FROM sources').get().c;
    if (sourceCount === 0) {
      const insert = this.db.prepare('INSERT INTO sources (id, name, url, type, is_active, trust_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insert.run(1, 'صفحة الفيسبوك الرسمية', `https://www.facebook.com/${config.AI.FACEBOOK_PAGE}`, 'facebook', 1, 0.75, new Date().toISOString());
      insert.run(2, 'وزارة التربية الوطنية', config.AI.MINISTRY_URL, 'web', 1, 0.9, new Date().toISOString());
      insert.run(3, 'إدخال يدوي - إدارة الثانوية', '', 'manual', 1, 1.0, new Date().toISOString());
    }
    const settingCount = this.db.prepare('SELECT COUNT(*) as c FROM settings').get().c;
    if (settingCount === 0) {
      const insert = this.db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
      const now = new Date().toISOString();
      insert.run('stop_auto_publish', 'false', now);
      insert.run('require_human_review', 'false', now);
      insert.run('last_scheduler_run', 'never', now);
      insert.run('total_published_today', '0', now);
      insert.run('publish_date', new Date().toISOString().split('T')[0], now);
    }
  }

  findAll(table) {
    return this.db.prepare(`SELECT * FROM ${table}`).all();
  }

  find(table, predicate) {
    const all = this.findAll(table);
    return predicate ? all.filter(predicate) : all;
  }

  findOne(table, predicate) {
    const all = this.findAll(table);
    return predicate ? all.find(predicate) || null : null;
  }

  getById(table, id) {
    return this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) || null;
  }

  create(table, data) {
    const { id, created_at, ...rest } = data;
    const cols = Object.keys(rest);
    const vals = Object.values(rest);
    const placeholders = cols.map(() => '?').join(', ');
    const result = this.db.prepare(
      `INSERT INTO ${table} (${cols.join(', ')}, created_at) VALUES (${placeholders}, ?)`
    ).run(...vals, created_at || new Date().toISOString());
    return this.getById(table, result.lastInsertRowid);
  }

  update(table, id, data) {
    const { id: _, created_at, updated_at, ...rest } = data;
    const cols = Object.keys(rest);
    const vals = Object.values(rest);
    if (cols.length === 0) return this.getById(table, id);
    const sets = cols.map(c => `${c} = ?`).join(', ');
    this.db.prepare(
      `UPDATE ${table} SET ${sets}, updated_at = ? WHERE id = ?`
    ).run(...vals, updated_at || new Date().toISOString(), id);
    return this.getById(table, id);
  }

  delete(table, id) {
    const result = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  upsert(table, data, matchFn) {
    const all = this.findAll(table);
    const existing = matchFn ? all.find(matchFn) : null;
    if (existing) {
      return this.update(table, existing.id, { ...data, id: existing.id });
    }
    return this.create(table, data);
  }

  count(table, predicate) {
    if (predicate) {
      const all = this.findAll(table);
      return all.filter(predicate).length;
    }
    const result = this.db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
    return result.c;
  }

  saveNow(table) {
    // SQLite auto-commits
    return true;
  }

  rawCollection(table) {
    return this.findAll(table);
  }

  close() {
    if (this.db) this.db.close();
  }
}

module.exports = { SqliteAdapter };

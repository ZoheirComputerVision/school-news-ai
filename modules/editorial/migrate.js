const db = require('../../database');
const config = require('../../config');

async function ensureEditorialTables() {
  // For JSON adapter: tables are auto-created on first use (create method)
  // Just verify by attempting to access them
  const adapter = db.adapter;
  
  if (config.DB_TYPE === 'sqlite') {
    try {
      adapter.db.exec(`
        CREATE TABLE IF NOT EXISTS editorial_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id INTEGER,
          raw_content_id INTEGER,
          category TEXT DEFAULT 'uncategorized',
          confidence_score REAL DEFAULT 0,
          headline TEXT DEFAULT '',
          summary TEXT DEFAULT '',
          article TEXT DEFAULT '',
          tags TEXT DEFAULT '',
          status TEXT DEFAULT 'pending',
          rejection_reason TEXT DEFAULT '',
          published_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
      `);
      adapter.db.exec(`
        CREATE TABLE IF NOT EXISTS editorial_audit (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          editorial_item_id INTEGER,
          action TEXT DEFAULT '',
          actor TEXT DEFAULT 'system',
          details TEXT DEFAULT '{}',
          timestamp TEXT DEFAULT (datetime('now'))
        );
      `);
      console.log('  ✓ Editorial SQLite tables ensured');
    } catch (e) {
      console.error('  ✗ Failed to create editorial tables:', e.message);
    }
  } else {
    // JSON adapter — tables are pre-loaded in json-adapter.js init()
    try {
      adapter.find('editorial_items', () => true);
      adapter.find('editorial_audit', () => true);
      console.log('  ✓ Editorial JSON tables ready');
    } catch (e) {
      console.error('  ✗ Failed to verify editorial tables:', e.message);
    }
  }
}

module.exports = { ensureEditorialTables };

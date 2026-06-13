const path = require('path');
const config = require('../../config');
const { JsonAdapter } = require('./json-adapter');
const { SqliteAdapter } = require('./sqlite-adapter');

const TABLES = [
  'sources', 'raw_data', 'processed_content', 'media',
  'archive', 'ai_decision_log', 'admin_actions', 'settings', 'views'
];

async function migrateJsonToSqlite(options = {}) {
  const { onProgress, onError } = options;
  const report = { total: 0, migrated: 0, errors: [], tables: {} };

  const json = new JsonAdapter();
  json.backupEnabled = false;
  json.init();

  const sqlite = new SqliteAdapter();
  sqlite.init();

  for (const table of TABLES) {
    if (onProgress) onProgress(`هجرة ${table}...`);
    try {
      const records = json.findAll(table);
      report.tables[table] = { total: records.length, migrated: 0, errors: [] };

      for (const record of records) {
        try {
          const existing = sqlite.getById(table, record.id);
          if (!existing) {
            sqlite.create(table, record);
          } else {
            sqlite.update(table, record.id, record);
          }
          report.tables[table].migrated++;
        } catch (err) {
          report.tables[table].errors.push({ id: record.id, error: err.message });
          if (onError) onError(table, record.id, err);
        }
      }

      report.migrated += report.tables[table].migrated;
      report.total += report.tables[table].total;
    } catch (err) {
      report.errors.push({ table, error: err.message });
      if (onError) onError(table, null, err);
    }
  }

  return report;
}

async function verifyMigration() {
  const json = new JsonAdapter();
  json.backupEnabled = false;
  json.init();

  const sqlite = new SqliteAdapter();
  sqlite.init();

  const discrepancies = [];

  for (const table of TABLES) {
    const jsonCount = json.count(table);
    const sqliteCount = sqlite.count(table);

    if (jsonCount !== sqliteCount) {
      discrepancies.push({
        table,
        jsonCount,
        sqliteCount,
        difference: Math.abs(jsonCount - sqliteCount),
      });
    }
  }

  if (sqlite.close) sqlite.close();
  return {
    consistent: discrepancies.length === 0,
    discrepancies,
    summary: TABLES.map(t => ({
      table: t,
      json: json.count(t),
      sqlite: sqlite.count(t),
    })),
  };
}

function getMigrationStatus() {
  const json = new JsonAdapter();
  json.backupEnabled = false;
  json.init();
  const status = {};
  for (const table of TABLES) {
    status[table] = { jsonRecords: json.count(table), sqliteRecords: 0 };
  }
  const sqlitePath = path.join(config.DATA_DIR, 'database.sqlite');
  const fs = require('fs');
  if (fs.existsSync(sqlitePath)) {
    const sqlite = new SqliteAdapter();
    sqlite.init();
    for (const table of TABLES) {
      status[table].sqliteRecords = sqlite.count(table);
    }
    if (sqlite.close) sqlite.close();
  }
  return { tables: status, sqliteExists: fs.existsSync(sqlitePath) };
}

module.exports = { migrateJsonToSqlite, verifyMigration, getMigrationStatus };

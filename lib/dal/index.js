const { JsonAdapter } = require('./json-adapter');
const { SqliteAdapter } = require('./sqlite-adapter');
const backup = require('./backup');
const migration = require('./migration');
const config = require('../../config');

const DB_TYPE = {
  JSON: 'json',
  SQLITE: 'sqlite',
};

let activeAdapter = null;
let fallbackAdapter = null;
let activeDbType = DB_TYPE.JSON;

function initialize(dbType = DB_TYPE.JSON) {
  if (dbType === DB_TYPE.SQLITE) {
    activeAdapter = new SqliteAdapter();
    fallbackAdapter = new JsonAdapter();
    fallbackAdapter.backupEnabled = false;
    fallbackAdapter.init();
  } else {
    activeAdapter = new JsonAdapter();
    fallbackAdapter = null;
  }
  activeDbType = dbType;
  const count = activeAdapter.init();
  return { type: dbType, recordCount: count };
}

function switchAdapter(dbType) {
  if (dbType === activeDbType) return { type: dbType };
  if (activeAdapter && activeAdapter.close) activeAdapter.close();
  return initialize(dbType);
}

function getAdapter() {
  if (!activeAdapter) initialize();
  return activeAdapter;
}

function getFallbackAdapter() {
  return fallbackAdapter;
}

function getDbType() {
  return activeDbType;
}

module.exports = {
  initialize,
  switchAdapter,
  getAdapter,
  getFallbackAdapter,
  getDbType,
  backup,
  migration,
  DB_TYPE,
};

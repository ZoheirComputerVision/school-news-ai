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
let activeDbType = DB_TYPE.JSON;

function initialize(dbType = DB_TYPE.JSON) {
  if (dbType === DB_TYPE.SQLITE) {
    activeAdapter = new SqliteAdapter();
  } else {
    activeAdapter = new JsonAdapter();
  }
  activeDbType = dbType;
  const count = activeAdapter.init();
  return { type: dbType, recordCount: count };
}

function getAdapter() {
  if (!activeAdapter) initialize();
  return activeAdapter;
}

function getDbType() {
  return activeDbType;
}

module.exports = {
  initialize,
  getAdapter,
  getDbType,
  backup,
  migration,
  DB_TYPE,
};

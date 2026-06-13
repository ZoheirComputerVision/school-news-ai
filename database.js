const dal = require('./lib/dal');
const { createRepositories } = require('./lib/repositories');

const state = dal.initialize(dal.DB_TYPE.JSON);
const adapter = dal.getAdapter();
const repos = createRepositories(adapter);

module.exports = {
  // Legacy API — backward compatibility
  query: (table, fn) => adapter.find(table, fn),
  get: (table, id) => adapter.getById(table, id),
  findOne: (table, fn) => adapter.findOne(table, fn),
  insert: (table, data) => adapter.create(table, data),
  update: (table, id, data) => adapter.update(table, id, data),
  upsert: (table, data, matchFn) => adapter.upsert(table, data, matchFn),
  delete: (table, id) => adapter.delete(table, id),
  saveNow: (table) => adapter.saveNow(table),
  count: (table, fn) => adapter.count(table, fn),
  where: (table, conditions) => adapter.where ? adapter.where(table, conditions) : adapter.find(table, r => Object.entries(conditions).every(([k, v]) => r[k] === v)),
  orderBy: (items, key, dir) => adapter.orderBy ? adapter.orderBy(items, key, dir) : [...items].sort((a, b) => { const va = (a[key] || '').toString(); const vb = (b[key] || '').toString(); return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb); }),
  limit: (items, n, offset) => adapter.limit ? adapter.limit(items, n, offset) : items.slice(offset || 0, (offset || 0) + n),
  getCacheStats: () => adapter.getCacheStats ? adapter.getCacheStats() : null,

  // New DAL API
  dal,
  adapter,
  repos,

  // Repositories
  articles: repos.articles,
  settings: repos.settings,
  archive: repos.archive,
  sources: repos.sources,
  rawData: repos.rawData,
  media: repos.media,
  adminActions: repos.adminActions,

  // DAL metadata
  dbType: dal.getDbType(),
  recordCount: state.recordCount,
};

const config = require('./config');
const dal = require('./lib/dal');
const { createRepositories } = require('./lib/repositories');

let ctx = null;

function _init(dbType) {
  const type = dbType || config.DB_TYPE || 'json';
  dal.initialize(type);
  const adapter = dal.getAdapter();
  const repos = createRepositories(adapter);
  const state = { type: dal.getDbType(), recordCount: adapter.count('processed_content') };
  ctx = { adapter, repos, state };
  return ctx;
}

_init();

module.exports = {
  // Legacy API — backward compatibility
  query: (table, fn) => ctx.adapter.find(table, fn),
  get: (table, id) => ctx.adapter.getById(table, id),
  findOne: (table, fn) => ctx.adapter.findOne(table, fn),
  insert: (table, data) => ctx.adapter.create(table, data),
  update: (table, id, data) => ctx.adapter.update(table, id, data),
  upsert: (table, data, matchFn) => ctx.adapter.upsert(table, data, matchFn),
  delete: (table, id) => ctx.adapter.delete(table, id),
  saveNow: (table) => ctx.adapter.saveNow(table),
  count: (table, fn) => ctx.adapter.count(table, fn),
  where: (table, conditions) => ctx.adapter.where ? ctx.adapter.where(table, conditions) : ctx.adapter.find(table, r => Object.entries(conditions).every(([k, v]) => r[k] === v)),
  orderBy: (items, key, dir) => ctx.adapter.orderBy ? ctx.adapter.orderBy(items, key, dir) : [...items].sort((a, b) => { const va = (a[key] || '').toString(); const vb = (b[key] || '').toString(); return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb); }),
  limit: (items, n, offset) => ctx.adapter.limit ? ctx.adapter.limit(items, n, offset) : items.slice(offset || 0, (offset || 0) + n),
  getCacheStats: () => ctx.adapter.getCacheStats ? ctx.adapter.getCacheStats() : null,

  // New DAL API
  get adapter() { return ctx.adapter; },
  get repos() { return ctx.repos; },
  dal,

  // Runtime switching
  switchAdapter(dbType) {
    dal.switchAdapter(dbType);
    _init();
    return this;
  },

  // Repositories
  get articles() { return ctx.repos.articles; },
  get settings() { return ctx.repos.settings; },
  get archive() { return ctx.repos.archive; },
  get sources() { return ctx.repos.sources; },
  get rawData() { return ctx.repos.rawData; },
  get media() { return ctx.repos.media; },
  get adminActions() { return ctx.repos.adminActions; },

  // DAL metadata
  get dbType() { return dal.getDbType(); },
  get recordCount() { return ctx.state.recordCount; },
};

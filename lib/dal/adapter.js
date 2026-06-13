class DataAdapter {
  findAll(table) { throw new Error('Not implemented'); }
  find(table, predicate) { throw new Error('Not implemented'); }
  findOne(table, predicate) { throw new Error('Not implemented'); }
  getById(table, id) { throw new Error('Not implemented'); }
  create(table, data) { throw new Error('Not implemented'); }
  update(table, id, data) { throw new Error('Not implemented'); }
  delete(table, id) { throw new Error('Not implemented'); }
  upsert(table, data, matchFn) { throw new Error('Not implemented'); }
  count(table, predicate) { throw new Error('Not implemented'); }
  saveNow(table) { throw new Error('Not implemented'); }
  rawCollection(table) { throw new Error('Not implemented'); }
}

module.exports = { DataAdapter };

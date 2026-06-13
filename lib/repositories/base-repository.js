class BaseRepository {
  constructor(adapter, tableName) {
    this.adapter = adapter;
    this.table = tableName;
  }

  findAll() {
    return this.adapter.findAll(this.table);
  }

  findById(id) {
    return this.adapter.getById(this.table, id);
  }

  findOne(predicate) {
    return this.adapter.findOne(this.table, predicate);
  }

  find(predicate) {
    return this.adapter.find(this.table, predicate);
  }

  create(data) {
    return this.adapter.create(this.table, data);
  }

  update(id, data) {
    return this.adapter.update(this.table, id, data);
  }

  delete(id) {
    return this.adapter.delete(this.table, id);
  }

  count(predicate) {
    return this.adapter.count(this.table, predicate);
  }
}

module.exports = { BaseRepository };

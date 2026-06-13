const { BaseRepository } = require('./base-repository');

class SettingsRepository extends BaseRepository {
  constructor(adapter) {
    super(adapter, 'settings');
  }

  get(key) {
    const s = this.findOne(s => s.key === key);
    return s ? s.value : null;
  }

  set(key, value) {
    return this.adapter.upsert('settings', { key, value, updated_at: new Date().toISOString() }, s => s.key === key);
  }

  getAll() {
    const settings = this.findAll();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    return obj;
  }

  getBool(key) {
    return this.get(key) === 'true';
  }

  getInt(key, def = 0) {
    const val = this.get(key);
    return val ? parseInt(val) : def;
  }
}

module.exports = { SettingsRepository };

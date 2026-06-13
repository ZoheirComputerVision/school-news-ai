const db = require('../database');
const { ArchiveRepository } = require('../lib/repositories/archive-repository');

module.exports = new (class ArchiveSystemWrapper {
  constructor() {
    this.repo = new ArchiveRepository(db.adapter);
  }
  buildTimeline() { return this.repo.buildTimeline(); }
  getStats() { return this.repo.getStats(); }
  exportToJSON() { return this.repo.exportToJSON(); }
})();

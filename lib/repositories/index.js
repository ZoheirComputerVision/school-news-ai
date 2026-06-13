const { ArticleRepository } = require('./article-repository');
const { SettingsRepository } = require('./settings-repository');
const { ArchiveRepository } = require('./archive-repository');
const { BaseRepository } = require('./base-repository');

function createRepositories(adapter) {
  return {
    articles: new ArticleRepository(adapter),
    settings: new SettingsRepository(adapter),
    archive: new ArchiveRepository(adapter),
    sources: new BaseRepository(adapter, 'sources'),
    rawData: new BaseRepository(adapter, 'raw_data'),
    media: new BaseRepository(adapter, 'media'),
    adminActions: new BaseRepository(adapter, 'admin_actions'),
  };
}

module.exports = { createRepositories, ArticleRepository, SettingsRepository, ArchiveRepository, BaseRepository };

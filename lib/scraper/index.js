const { FacebookCollector } = require('./facebook');
const { RssCollector } = require('./rss');
const { WebsiteCollector } = require('./website');
const { Fetcher } = require('./fetcher');
const { Parser } = require('./parser');

const SOURCE_TYPES = {
  FACEBOOK: 'facebook',
  RSS: 'rss',
  WEB: 'web',
  MANUAL: 'manual',
};

class ScraperFactory {
  static create(source) {
    const type = (source.type || '').toLowerCase();
    switch (type) {
      case SOURCE_TYPES.FACEBOOK: {
        const fb = new FacebookCollector({ pageId: source.page_id || source.url });
        const token = process.env.FACEBOOK_ACCESS_TOKEN || '';
        if (token) fb.setCredentials(source.page_id || source.url, token);
        return fb;
      }
      case SOURCE_TYPES.RSS:
        return { type: 'rss', collector: new RssCollector(), url: source.url };
      case SOURCE_TYPES.WEB:
        return { type: 'web', collector: new WebsiteCollector(), url: source.url };
      default:
        return null;
    }
  }
}

module.exports = { ScraperFactory, FacebookCollector, RssCollector, WebsiteCollector, Fetcher, Parser, SOURCE_TYPES };

const Parser = require('rss-parser');
const { Fetcher } = require('./fetcher');

class RssCollector {
  constructor() {
    this.parser = new Parser({ timeout: 15000, customFields: { item: ['media:content', 'dc:creator'] } });
    this.fetcher = new Fetcher({ timeout: 15000, retries: 1 });
  }

  async fetchFeed(feedUrl) {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      if (!feed || !feed.items) return { ok: false, error: 'No items', items: [] };
      const items = feed.items.map(item => ({
        title: (item.title || '').substring(0, 500),
        body: (item.contentSnippet || item.content || item.description || '').substring(0, 50000),
        sourceUrl: item.link || item.guid || '',
        eventDate: (item.isoDate || item.pubDate || '').substring(0, 10),
        imageUrl: (item['media:content'] && item['media:content'].$.url) || item.envelope || '',
        author: item.creator || item.author || '',
        guid: item.guid || item.link || '',
        rawSource: 'rss',
      }));
      return { ok: true, items, title: feed.title || '', description: feed.description || '' };
    } catch (err) {
      return { ok: false, error: err.message, items: [] };
    }
  }

  async fetchMultiple(feeds) {
    const results = [];
    for (const feed of feeds) {
      const res = await this.fetchFeed(feed.url);
      results.push({ feed: feed.name || feed.url, url: feed.url, ok: res.ok, items: res.items, error: res.error });
    }
    return results;
  }
}

module.exports = { RssCollector };

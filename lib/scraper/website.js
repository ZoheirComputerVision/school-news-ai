const { Fetcher } = require('./fetcher');
const { Parser } = require('./parser');

class WebsiteCollector {
  constructor() {
    this.fetcher = new Fetcher({ timeout: 20000, retries: 2, retryDelay: 2000 });
  }

  async scrape(url) {
    const res = await this.fetcher.fetch(url);
    if (!res.ok) return { ok: false, error: res.error, url };

    const article = Parser.extractArticle(res.data, url);
    return { ok: true, url, ...article };
  }

  async scrapeMultiple(urls) {
    return Promise.all(urls.map(u => this.scrape(u)));
  }

  async findLinks(url, selector = 'a[href]') {
    const res = await this.fetcher.fetch(url);
    if (!res.ok) return [];
    const cheerio = require('cheerio');
    const $ = cheerio.load(res.data);
    const links = [];
    $(selector).each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) links.push(href);
    });
    return [...new Set(links)];
  }
}

module.exports = { WebsiteCollector };

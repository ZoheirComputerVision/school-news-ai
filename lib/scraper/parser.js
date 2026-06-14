const cheerio = require('cheerio');

class Parser {
  static extractText(html) {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, .sidebar, .menu, iframe, noscript').remove();
    const text = $('body').text() || $.text();
    return text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  static extractMeta(html) {
    const $ = cheerio.load(html);
    const meta = {};
    $('meta').each((i, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || '';
      const content = $(el).attr('content') || '';
      if (name && content) meta[name.toLowerCase()] = content;
    });
    return {
      title: meta['og:title'] || meta['twitter:title'] || $('title').text().trim() || '',
      description: meta['og:description'] || meta['twitter:description'] || meta['description'] || '',
      image: meta['og:image'] || meta['twitter:image'] || '',
      publishedDate: meta['article:published_time'] || meta['date'] || '',
    };
  }

  static extractArticle(html, url) {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, .sidebar, iframe, noscript').remove();

    let title = $('h1').first().text().trim();
    if (!title) title = $('h2').first().text().trim();
    if (!title) title = $('title').text().trim();

    let body = '';
    const articleSelectors = ['article', '[role="main"]', 'main', '.post-content', '.entry-content', '.article-body', '.content-body', '#content'];
    for (const sel of articleSelectors) {
      const el = $(sel);
      if (el.length) {
        el.find('script, style, nav, footer, iframe').remove();
        body = el.text().trim();
        if (body.length > 100) break;
      }
    }
    if (!body || body.length < 100) {
      body = $('body').text().replace(/\s+/g, ' ').trim();
    }

    const date = $('time').attr('datetime') || $('meta[property="article:published_time"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || $('article img').first().attr('src') || '';

    return {
      title: title.substring(0, 500),
      body: body.substring(0, 50000),
      date: date.substring(0, 20),
      image: image || '',
      sourceUrl: url,
    };
  }
}

module.exports = { Parser };

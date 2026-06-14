const crypto = require('crypto');

class DedupEngine {
  constructor(adapter) {
    this.adapter = adapter;
  }

  computeHash(text) {
    return crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
  }

  existsByHash(hash, table = 'raw_data') {
    const records = this.adapter.find(table, r => r.content_hash === hash);
    return records.length > 0 ? records[0] : null;
  }

  existsByUrl(url, table = 'raw_data') {
    if (!url) return null;
    const records = this.adapter.find(table, r => {
      try {
        const raw = typeof r.raw_text === 'string' ? JSON.parse(r.raw_text) : r.raw_text;
        return raw.source_url === url || raw.sourceUrl === url;
      } catch { return false; }
    });
    return records.length > 0 ? records[0] : null;
  }

  existsByTitle(title, table = 'processed_content') {
    if (!title || title.length < 10) return null;
    const records = this.adapter.find(table, r => {
      const sim = this._similarity(r.title || '', title);
      return sim > 0.8;
    });
    return records.length > 0 ? records[0] : null;
  }

  _similarity(a, b) {
    if (!a || !b) return 0;
    const aNorm = a.replace(/\s+/g, '').substring(0, 100);
    const bNorm = b.replace(/\s+/g, '').substring(0, 100);
    if (aNorm === bNorm) return 1;
    const bigrams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const bg = s.substring(i, i + 2); m.set(bg, (m.get(bg) || 0) + 1); } return m; };
    const mapA = bigrams(aNorm);
    const mapB = bigrams(bNorm);
    let intersection = 0;
    for (const [bg, count] of mapA) { if (mapB.has(bg)) intersection += Math.min(count, mapB.get(bg)); }
    const total = (aNorm.length - 1) + (bNorm.length - 1) - intersection;
    return total > 0 ? intersection / total : 0;
  }

  async isDuplicate(item, { checkHash = true, checkUrl = true, checkTitle = true } = {}) {
    const text = typeof item.raw_text === 'string' ? item.raw_text : (item.body || item.title || '');
    const hash = this.computeHash(text);

    if (checkHash) {
      const byHash = this.existsByHash(hash);
      if (byHash) return { isDuplicate: true, method: 'hash', existing: byHash };
    }

    const parsed = typeof item.raw_text === 'string' ? this._tryParse(item.raw_text) : item;
    if (checkUrl && parsed.source_url) {
      const byUrl = this.existsByUrl(parsed.source_url);
      if (byUrl) return { isDuplicate: true, method: 'url', existing: byUrl };
    }
    if (checkUrl && parsed.sourceUrl) {
      const byUrl = this.existsByUrl(parsed.sourceUrl);
      if (byUrl) return { isDuplicate: true, method: 'url', existing: byUrl };
    }

    if (checkTitle && parsed.title) {
      const byTitle = this.existsByTitle(parsed.title);
      if (byTitle) return { isDuplicate: true, method: 'title_similarity', existing: byTitle, similarity: this._similarity(parsed.title, byTitle.title) };
    }

    return { isDuplicate: false };
  }

  _tryParse(str) {
    try { return JSON.parse(str); } catch { return {}; }
  }
}

module.exports = { DedupEngine };

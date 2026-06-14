class ContentNormalizer {
  static normalize(rawData, source = {}) {
    const parsed = typeof rawData === 'string' ? this._tryParse(rawData) : rawData;
    if (!parsed) return null;

    const body = this._cleanBody(parsed.body || parsed.message || parsed.description || '');
    const title = this._cleanTitle(parsed.title || body.split('\n')[0] || '');
    const eventDate = this._normalizeDate(parsed.eventDate || parsed.event_date || parsed.publishedDate || parsed.created_time || parsed.isoDate || '');
    const imageUrl = parsed.imageUrl || parsed.image_url || parsed.full_picture || parsed.image || '';
    const sourceUrl = parsed.sourceUrl || parsed.source_url || parsed.link || parsed.permalink_url || '';
    const sourceName = source.name || parsed.source || '';

    return {
      title: title.substring(0, 500),
      body: body.substring(0, 50000),
      summary: this._extractSummary(body),
      eventDate,
      sourceUrl: sourceUrl.substring(0, 1000),
      sourceName: sourceName.substring(0, 200),
      category: this._inferCategory(title, body),
      imageUrl: imageUrl.substring(0, 2000),
      rawSource: parsed.rawSource || source.type || 'unknown',
    };
  }

  static _cleanTitle(title) {
    return title.replace(/^[\s\n\r\-—•·]+/, '').replace(/[\s\n\r]+$/, '').substring(0, 500);
  }

  static _cleanBody(body) {
    return body
      .replace(/<[^>]*>/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  static _extractSummary(body) {
    const cleaned = body.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/[.?!\n]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) return sentences[0].trim().substring(0, 300);
    return cleaned.substring(0, 300);
  }

  static _normalizeDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
    const match = dateStr.match(/(\d{4})-?(\d{2})?-?(\d{2})?/);
    if (match) {
      const [, y, m, d] = match;
      if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (y && m) return `${y}-${m.padStart(2, '0')}`;
      if (y) return y;
    }
    return dateStr.substring(0, 10);
  }

  static _inferCategory(title, body) {
    const text = `${title} ${body}`;
    const scores = {
      news: this._matchScore(text, ['أعلنت', 'صرح', 'أكد', 'كشف', 'وزارة', 'قرار', 'نتائج', 'أفاد']),
      activity: this._matchScore(text, ['نظمت', 'شارك', 'في إطار', 'زيارة', 'نشاط', 'حفل', 'تلاميذ', 'أساتذة']),
      announcement: this._matchScore(text, ['يعلن', 'تعلن', 'تنظم', 'مسابقة', 'أبواب مفتوحة', 'على الراغبين', 'آخر أجل', 'إعلان']),
    };
    let best = 'uncategorized';
    let bestScore = 0;
    for (const [cat, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; best = cat; }
    }
    return bestScore > 0 ? best : 'uncategorized';
  }

  static _matchScore(text, keywords) {
    let score = 0;
    for (const kw of keywords) { if (text.includes(kw)) score++; }
    return score / keywords.length;
  }

  static _tryParse(str) { try { return JSON.parse(str); } catch { return null; } }
}

module.exports = { ContentNormalizer };

const { Fetcher } = require('./fetcher');

class FacebookCollector {
  constructor(config = {}) {
    this.fetcher = new Fetcher({ timeout: 20000, retries: 1 });
    this.pageId = config.pageId || '';
    this.accessToken = config.accessToken || '';
    this.baseUrl = 'https://graph.facebook.com/v21.0';
  }

  setCredentials(pageId, accessToken) {
    this.pageId = pageId;
    this.accessToken = accessToken;
  }

  get isConfigured() {
    return !!(this.pageId && this.accessToken);
  }

  async fetchPosts(limit = 20) {
    if (!this.isConfigured) return this._demoFallback(limit);
    try {
      const url = `${this.baseUrl}/${this.pageId}/posts?fields=message,created_time,permalink_url,full_picture,attachments&limit=${limit}&access_token=${this.accessToken}`;
      const res = await this.fetcher.fetchJSON(url);
      if (!res.ok) return this._demoFallback(limit);

      const posts = res.data.data || [];
      return posts.map(p => ({
        title: (p.message || '').split('\n')[0].substring(0, 200),
        body: p.message || '',
        sourceUrl: p.permalink_url || '',
        eventDate: p.created_time ? p.created_time.split('T')[0] : '',
        imageUrl: p.full_picture || (p.attachments && p.attachments.data && p.attachments.data[0] && p.attachments.data[0].media && p.attachments.data[0].media.image ? p.attachments.data[0].media.image.src : '') || '',
        rawSource: 'facebook',
      }));
    } catch {
      return this._demoFallback(limit);
    }
  }

  _demoFallback(limit) {
    if (limit <= 0) return [];
    const samples = [
      { title: 'تنظيم يوم إعلامي حول التوجيه المدرسي', body: 'نظمت ولاية تيارت، يومًا إعلاميًا حول التوجيه المدرسي لفائدة تلاميذ السنة الثالثة ثانوي.', sourceUrl: '', eventDate: '', imageUrl: '', rawSource: 'facebook' },
      { title: 'إعلان عن تنظيم أيام الأبواب المفتوحة', body: 'تنظم ولاية تيارت، أيام الأبواب المفتوحة لفائدة تلاميذ السنة الرابعة متوسط.', sourceUrl: '', eventDate: '', imageUrl: '', rawSource: 'facebook' },
    ];
    return samples.slice(0, Math.min(limit, samples.length));
  }
}

module.exports = { FacebookCollector };

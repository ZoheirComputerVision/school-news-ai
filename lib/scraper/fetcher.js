const axios = require('axios');

const DEFAULTS = {
  timeout: 15000,
  retries: 2,
  retryDelay: 1000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,fr;q=0.9,en;q=0.8',
  },
};

class Fetcher {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS, ...options };
    this.client = axios.create({ timeout: this.opts.timeout, headers: this.opts.headers });
  }

  async fetch(url) {
    for (let attempt = 0; attempt <= this.opts.retries; attempt++) {
      try {
        const res = await this.client.get(url, { validateStatus: s => s < 500 });
        if (res.status === 200) return { ok: true, data: res.data, status: res.status, headers: res.headers };
        if (attempt < this.opts.retries) await this._delay();
        else return { ok: false, error: `HTTP ${res.status}`, status: res.status };
      } catch (err) {
        if (attempt < this.opts.retries) await this._delay();
        else return { ok: false, error: err.message, status: 0 };
      }
    }
  }

  async fetchJSON(url) {
    const res = await this.fetch(url);
    if (res.ok) {
      try { res.data = JSON.parse(res.data); } catch { res.ok = false; res.error = 'Invalid JSON'; }
    }
    return res;
  }

  _delay() { return new Promise(r => setTimeout(r, this.opts.retryDelay)); }
}

module.exports = { Fetcher };

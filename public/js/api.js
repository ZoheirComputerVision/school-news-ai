const API = {
  base: '/api',

  async _fetch(url, options = {}) {
    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      if (e.name === 'AbortError') throw new Error('انتهت مهلة الطلب');
      throw e;
    }
  },

  async get(endpoint, useAuth = false) {
    const options = {};
    if (useAuth) {
      options.headers = this._getHeaders();
    }
    const res = await this._fetch(this.base + endpoint, options);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-CSRF-Token'] = token.slice(0, 20);
    }
    return headers;
  },

  async post(endpoint, data) {
    const res = await this._fetch(this.base + endpoint, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let msg = `API Error: ${res.status}`;
      try { const err = await res.json(); if (err.error) msg = err.error; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  // Public API
  getContent: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return API.get(`/content${q ? '?' + q : ''}`);
  },
  getContentById: (id) => API.get(`/content/${id}`),
  getTimeline: () => API.get('/timeline'),
  getStats: () => API.get('/stats'),
  getCategories: () => API.get('/categories'),
  search: (q) => API.get(`/search?q=${encodeURIComponent(q)}`),
  getRecent: () => API.get('/recent'),
  trackView: (id) => API.post(`/content/${id}/view`),

  // Admin API
  admin: {
    login: (username, password) => API.post('/admin/auth', { username, password }),
    dashboard: () => API.get('/admin/dashboard', true),
    getContent: (params) => API.get(`/admin/content?${new URLSearchParams(params).toString()}`, true),
    getContentById: (id) => API.get(`/admin/content/${id}`, true),
    approve: (id) => API.post(`/admin/content/${id}/approve`),
    reject: (id, reason) => API.post(`/admin/content/${id}/reject`, { reason }),
    generate: (id) => API.post(`/admin/content/${id}/generate`),
    removeItem: (id) => API.post(`/admin/content/${id}/delete`),
    updateItem: (id, data) => API.post(`/admin/content/${id}/update`, data),
    collect: () => API.post('/admin/collect'),
    collectManual: (data) => API.post('/admin/collect/manual', data),
    analyze: () => API.post('/admin/analyze'),
    publish: () => API.post('/admin/publish'),
    getLogs: (params) => API.get(`/admin/logs?${new URLSearchParams(params).toString()}`, true),
    getSettings: () => API.get('/admin/settings', true),
    updateSetting: (key, value) => API.post('/admin/settings', { key, value }),
    exportArchive: () => API.post('/admin/archive/export'),
    getTimeline: () => API.get('/admin/archive/timeline', true),
    getSources: () => API.get('/admin/sources', true),
    runCollector: () => API.post('/admin/scheduler/run-collector'),
    getGovernance: (params) => API.get(`/admin/governance?${new URLSearchParams(params||{}).toString()}`, true),
    getGovernanceSummary: () => API.get('/admin/governance/summary', true),
    getGovernanceByContent: (id) => API.get(`/admin/governance?content_id=${id}`, true),
    getPipelineQueue: () => API.get('/admin/pipeline/queue', true),
    getPipelineStats: () => API.get('/admin/pipeline/stats', true),
  },
};

const db = require('../../database');

class UsageTracker {
  getCurrentPeriod(tenantId) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const metrics = db.adapter.find('usage_metrics', u =>
      u.tenant_id === parseInt(tenantId) &&
      u.period_start >= periodStart &&
      u.period_end <= periodEnd
    ) || [];
    return this._computeFromDb(metrics, tenantId, periodStart, periodEnd);
  }

  getByPeriod(tenantId, start, end) {
    const metrics = db.adapter.find('usage_metrics', u =>
      u.tenant_id === parseInt(tenantId) &&
      u.period_start >= start &&
      u.period_end <= end
    ) || [];
    return this._computeFromDb(metrics, tenantId, start, end);
  }

  getAll(tenantId) {
    try {
      return (db.adapter.find('usage_metrics', u => u.tenant_id === parseInt(tenantId)) || [])
        .sort((a, b) => b.period_start.localeCompare(a.period_start));
    } catch { return []; }
  }

  _computeFromDb(metrics, tenantId, periodStart, periodEnd) {
    const articleCount = this._countArticles(tenantId);
    const editorCount = this._countEditors(tenantId);
    const stored = metrics.reduce((acc, m) => {
      acc[m.metric_name] = (acc[m.metric_name] || 0) + (parseInt(m.metric_value) || 0);
      return acc;
    }, {});
    return {
      tenant_id: parseInt(tenantId),
      period_start: periodStart,
      period_end: periodEnd,
      articles_count: articleCount,
      editors_count: editorCount,
      api_requests: stored.api_requests || 0,
      storage_bytes: stored.storage_bytes || this._estimateStorage(tenantId),
    };
  }

  recordApiRequest(tenantId) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const existing = db.adapter.find('usage_metrics', u =>
      u.tenant_id === parseInt(tenantId) &&
      u.metric_name === 'api_requests' &&
      u.period_start >= periodStart
    );
    if (existing.length) {
      db.adapter.update('usage_metrics', existing[0].id, {
        metric_value: (parseInt(existing[0].metric_value) || 0) + 1,
      });
    } else {
      db.adapter.create('usage_metrics', {
        tenant_id: parseInt(tenantId),
        metric_name: 'api_requests',
        metric_value: 1,
        period_start: periodStart,
        period_end: periodEnd,
        recorded_at: now.toISOString(),
      });
    }
  }

  _countArticles(tenantId) {
    try {
      return (db.adapter.find('processed_content', a => !a.tenant_id || a.tenant_id === parseInt(tenantId)) || []).length;
    } catch { return 0; }
  }

  _countEditors(tenantId) {
    try {
      return (db.adapter.find('tenant_users', u => u.tenant_id === parseInt(tenantId) && (u.role === 'editor' || u.role === 'reviewer' || u.role === 'tenant_admin')) || []).length;
    } catch { return 0; }
  }

  _estimateStorage(tenantId) {
    try {
      const articles = db.adapter.find('processed_content', a => !a.tenant_id || a.tenant_id === parseInt(tenantId)) || [];
      const totalChars = articles.reduce((s, a) => s + (a.content || '').length + (a.title || '').length, 0);
      return totalChars * 2;
    } catch { return 0; }
  }

  checkLimits(tenantId, plan) {
    const usage = this.getCurrentPeriod(tenantId);
    const limits = plan.limits || {};
    const violations = [];
    if (limits.articles_per_month && usage.articles_count > limits.articles_per_month) {
      violations.push({ metric: 'articles_count', current: usage.articles_count, limit: limits.articles_per_month });
    }
    if (limits.editors && usage.editors_count > limits.editors) {
      violations.push({ metric: 'editors_count', current: usage.editors_count, limit: limits.editors });
    }
    if (limits.api_calls_per_day && usage.api_requests > limits.api_calls_per_day) {
      violations.push({ metric: 'api_requests', current: usage.api_requests, limit: limits.api_calls_per_day });
    }
    if (limits.storage_mb && usage.storage_bytes > limits.storage_mb * 1024 * 1024) {
      violations.push({ metric: 'storage_bytes', current: Math.round(usage.storage_bytes / (1024 * 1024)), limit: limits.storage_mb });
    }
    return { within_limits: violations.length === 0, usage, violations };
  }
}

module.exports = UsageTracker;

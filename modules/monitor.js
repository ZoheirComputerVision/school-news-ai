class CollectorMonitor {
  constructor(adapter) {
    this.adapter = adapter;
  }

  logRun({ status, sourceId, sourceName, sourceType, itemsCollected, itemsDeduped, itemsFailed, duration, error } = {}) {
    try {
      this.adapter.create('admin_actions', {
        action: 'collector_run',
        details: JSON.stringify({
          sourceId, sourceName, sourceType, itemsCollected: itemsCollected || 0,
          itemsDeduped: itemsDeduped || 0, itemsFailed: itemsFailed || 0,
          duration: duration || 0, error: error || null, status: status || 'unknown',
        }),
        created_at: new Date().toISOString(),
      });
    } catch {}
  }

  getRecentRuns(limit = 50) {
    const all = this.adapter.findAll('admin_actions', { action: 'collector_run' });
    return all
      .map(a => {
        const d = typeof a.details === 'string' ? this._tryParse(a.details) : (a.details || {});
        return { id: a.id, ...d, created_at: a.created_at };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, limit);
  }

  getStats(days = 7) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const runs = this.adapter.find('admin_actions', a => {
      if (a.action !== 'collector_run') return false;
      return (a.created_at || '') >= cutoff;
    });
    const details = runs.map(a => {
      const d = typeof a.details === 'string' ? this._tryParse(a.details) : (a.details || {});
      return { ...d, created_at: a.created_at };
    });

    return {
      totalRuns: runs.length,
      successfulRuns: details.filter(d => d.status === 'success').length,
      failedRuns: details.filter(d => d.status === 'failed').length,
      totalItemsCollected: details.reduce((sum, d) => sum + (d.itemsCollected || 0), 0),
      totalItemsDeduped: details.reduce((sum, d) => sum + (d.itemsDeduped || 0), 0),
      avgDuration: details.length > 0 ? Math.round(details.reduce((s, d) => s + (d.duration || 0), 0) / details.length) : 0,
      periodDays: days,
    };
  }

  getSourcesSummary() {
    const sources = this.adapter.findAll('sources');
    const active = sources.filter(s => s.is_active);
    const inactive = sources.filter(s => !s.is_active);
    const runs = this.adapter.find('admin_actions', a => a.action === 'collector_run');

    return {
      total: sources.length,
      active: active.length,
      inactive: inactive.length,
      byType: this._groupBy(sources, 'type'),
      lastRun: runs.length > 0 ? runs[runs.length - 1].created_at : null,
    };
  }

  _groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const val = item[key] || 'unknown';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }

  _tryParse(str) { try { return JSON.parse(str); } catch { return {}; } }
}

module.exports = { CollectorMonitor };

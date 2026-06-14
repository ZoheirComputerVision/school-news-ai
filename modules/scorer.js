class SourceScorer {
  constructor(adapter) {
    this.adapter = adapter;
  }

  computeScore(source) {
    if (!source) return { composite: 0, trust: 0, freshness: 0, success: 0 };

    const trustScore = typeof source.trust_score === 'number' ? source.trust_score : 0.5;

    const now = Date.now();
    const last = source.last_scraped ? new Date(source.last_scraped).getTime() : 0;
    const daysSinceLastFetch = last > 0 ? (now - last) / 86400000 : 365;
    const freshnessScore = Math.max(0, 1 - daysSinceLastFetch / 30);

    const totalFetches = this._countFetches(source.id);
    const successRate = totalFetches > 0 ? 0.8 : 0.5;

    const composite = Math.round((trustScore * 0.4 + freshnessScore * 0.3 + successRate * 0.3) * 100) / 100;

    return {
      composite,
      trust: trustScore,
      freshness: freshnessScore,
      success: successRate,
      totalFetches,
      updatedAt: new Date().toISOString(),
    };
  }

  _countFetches(sourceId) {
    try {
      const logs = this.adapter.find('admin_actions', a => {
        try {
          const d = typeof a.details === 'string' ? JSON.parse(a.details) : a.details || {};
          return a.action === 'collector_run' && d.sourceId === sourceId;
        } catch { return false; }
      });
      return logs.length;
    } catch { return 0; }
  }

  async updateSourceScore(source) {
    if (!source || !source.id) return null;
    const score = this.computeScore(source);
    try {
      this.adapter.update('sources', source.id, {
        trust_score: score.composite,
        updated_at: new Date().toISOString(),
      });
    } catch {}
    return score;
  }

  getTopSources(limit = 5) {
    const sources = this.adapter.findAll('sources', { is_active: 1 });
    return sources
      .map(s => ({ ...s, score: this.computeScore(s) }))
      .sort((a, b) => b.score.composite - a.score.composite)
      .slice(0, limit);
  }
}

module.exports = { SourceScorer };

const db = require('../../database');

class AdTracker {
  trackImpression(campaignId) {
    try {
      const campaign = db.adapter.getById('campaigns', campaignId);
      if (!campaign) return false;
      db.adapter.update('campaigns', campaignId, {
        impressions: (campaign.impressions || 0) + 1,
        updated_at: new Date().toISOString(),
      });
      db.adapter.create('ad_events', {
        campaign_id: campaignId,
        event_type: 'impression',
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch { return false; }
  }

  trackClick(campaignId) {
    try {
      const campaign = db.adapter.getById('campaigns', campaignId);
      if (!campaign) return false;
      db.adapter.update('campaigns', campaignId, {
        clicks: (campaign.clicks || 0) + 1,
        updated_at: new Date().toISOString(),
      });
      db.adapter.create('ad_events', {
        campaign_id: campaignId,
        event_type: 'click',
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch { return false; }
  }

  getEvents(campaignId = null, limit = 100) {
    try {
      let events = db.adapter.findAll('ad_events') || [];
      if (campaignId) events = events.filter(e => e.campaign_id === campaignId);
      return events.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, limit);
    } catch { return []; }
  }

  getDailyReport(date) {
    const target = date || new Date().toISOString().split('T')[0];
    const events = db.adapter.findAll('ad_events') || [];
    const dayEvents = events.filter(e => (e.timestamp || '').startsWith(target));
    return {
      date: target,
      impressions: dayEvents.filter(e => e.event_type === 'impression').length,
      clicks: dayEvents.filter(e => e.event_type === 'click').length,
      ctr: this._calcCtr(dayEvents),
    };
  }

  getWeeklyReport() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return this._rangeReport(weekAgo, now, 'weekly');
  }

  getMonthlyReport() {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    return this._rangeReport(monthAgo, now, 'monthly');
  }

  _rangeReport(from, to, label) {
    const events = db.adapter.findAll('ad_events') || [];
    const filtered = events.filter(e => {
      const t = new Date(e.timestamp || 0);
      return t >= from && t <= to;
    });
    return {
      period: label,
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      impressions: filtered.filter(e => e.event_type === 'impression').length,
      clicks: filtered.filter(e => e.event_type === 'click').length,
      ctr: this._calcCtr(filtered),
      top_campaigns: this._topCampaigns(filtered),
    };
  }

  _calcCtr(events) {
    const imps = events.filter(e => e.event_type === 'impression').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    return imps > 0 ? ((clicks / imps) * 100).toFixed(2) : 0;
  }

  _topCampaigns(events) {
    const counts = {};
    events.forEach(e => {
      if (!counts[e.campaign_id]) counts[e.campaign_id] = { impressions: 0, clicks: 0 };
      counts[e.campaign_id][e.event_type === 'impression' ? 'impressions' : 'clicks']++;
    });
    return Object.entries(counts)
      .map(([id, stats]) => {
        const campaign = db.adapter.getById('campaigns', parseInt(id));
        return { campaign_id: parseInt(id), title: campaign ? campaign.title : '—', ...stats };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }
}

module.exports = AdTracker;

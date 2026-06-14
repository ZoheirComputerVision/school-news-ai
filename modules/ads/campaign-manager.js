const db = require('../../database');
const AdInventory = require('./ad-inventory');

const VALID_STATUSES = ['draft', 'active', 'paused', 'completed'];
const VALID_ZONES = Object.keys(new AdInventory().getZones());

class CampaignManager {
  create(data) {
    if (!data.advertiser_id) throw new Error('معرف المعلن مطلوب');
    if (!data.title) throw new Error('عنوان الحملة مطلوب');
    if (!data.target_zone || !VALID_ZONES.includes(data.target_zone)) throw new Error('المنطقة المستهدفة غير صالحة');

    const campaign = db.adapter.create('campaigns', {
      advertiser_id: data.advertiser_id,
      title: data.title,
      description: data.description || '',
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      target_zone: data.target_zone,
      image_url: data.image_url || '',
      link_url: data.link_url || '',
      impressions: 0,
      clicks: 0,
      budget: data.budget || 0,
      status: data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return campaign;
  }

  update(id, data) {
    const existing = db.adapter.getById('campaigns', id);
    if (!existing) throw new Error(`الحملة ${id} غير موجودة`);
    const updates = {};
    const allowed = ['title', 'description', 'start_date', 'end_date', 'target_zone', 'image_url', 'link_url', 'budget', 'status'];
    allowed.forEach(k => { if (data[k] !== undefined) updates[k] = data[k]; });
    updates.updated_at = new Date().toISOString();
    if (updates.target_zone && !VALID_ZONES.includes(updates.target_zone)) throw new Error('المنطقة المستهدفة غير صالحة');
    if (updates.status && !VALID_STATUSES.includes(updates.status)) throw new Error('الحالة غير صالحة');
    return db.adapter.update('campaigns', id, updates);
  }

  delete(id) {
    const existing = db.adapter.getById('campaigns', id);
    if (!existing) throw new Error(`الحملة ${id} غير موجودة`);
    return db.adapter.delete('campaigns', id);
  }

  pause(id) { return this.update(id, { status: 'paused' }); }

  activate(id) { return this.update(id, { status: 'active' }); }

  complete(id) { return this.update(id, { status: 'completed' }); }

  getAll(limit = 50) {
    try {
      return (db.adapter.findAll('campaigns') || [])
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, limit);
    } catch { return []; }
  }

  getById(id) { return db.adapter.getById('campaigns', id); }

  getActive() {
    try {
      const now = new Date();
      return (db.adapter.findAll('campaigns') || []).filter(c => {
        if (c.status !== 'active') return false;
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return now >= start && now <= end;
      });
    } catch { return []; }
  }

  getStats() {
    try {
      const campaigns = db.adapter.findAll('campaigns') || [];
      const total = campaigns.length;
      const active = campaigns.filter(c => c.status === 'active').length;
      const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
      const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
      return {
        total_campaigns: total,
        active_campaigns: active,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
        by_zone: this._groupByZone(campaigns),
        by_status: this._groupByStatus(campaigns),
      };
    } catch { return { total_campaigns: 0, active_campaigns: 0, total_impressions: 0, total_clicks: 0, ctr: 0, by_zone: {}, by_status: {} }; }
  }

  _groupByZone(campaigns) {
    const groups = {};
    campaigns.forEach(c => {
      const zone = c.target_zone || 'unknown';
      if (!groups[zone]) groups[zone] = { count: 0, impressions: 0, clicks: 0 };
      groups[zone].count++;
      groups[zone].impressions += c.impressions || 0;
      groups[zone].clicks += c.clicks || 0;
    });
    return groups;
  }

  _groupByStatus(campaigns) {
    const groups = {};
    campaigns.forEach(c => {
      const s = c.status || 'unknown';
      if (!groups[s]) groups[s] = 0;
      groups[s]++;
    });
    return groups;
  }
}

module.exports = CampaignManager;

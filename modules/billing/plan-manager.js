const db = require('../../database');

const DEFAULT_PLANS = [
  { id: 1, name: 'Starter', price: 0, limits: { tenants: 1, editors: 3, articles_per_month: 500, storage_mb: 100, api_calls_per_day: 1000 }, active: true, description: 'للمنصات الصغيرة', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 2, name: 'Professional', price: 49, limits: { tenants: 1, editors: 10, articles_per_month: 5000, storage_mb: 1000, api_calls_per_day: 10000 }, active: true, description: 'للنمو والتوسع', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 3, name: 'Enterprise', price: 199, limits: { tenants: 999, editors: 999, articles_per_month: 999999, storage_mb: 50000, api_calls_per_day: 999999 }, active: true, description: 'حل متكامل بلا حدود', created_at: '2026-06-14T00:00:00.000Z' },
];

class PlanManager {
  getAll() {
    try { return db.adapter.findAll('plans') || []; } catch { return []; }
  }

  getActive() {
    try { return db.adapter.find('plans', p => p.active === true) || []; } catch { return []; }
  }

  getById(id) {
    try { return db.adapter.getById('plans', parseInt(id)) || null; } catch { return null; }
  }

  create(data) {
    if (!data.name) throw new Error('اسم الخطة مطلوب');
    if (data.price === undefined) throw new Error('السعر مطلوب');
    return db.adapter.create('plans', {
      name: data.name,
      price: parseFloat(data.price),
      limits: data.limits || { tenants: 1, editors: 3, articles_per_month: 500, storage_mb: 100, api_calls_per_day: 1000 },
      active: data.active !== undefined ? data.active : true,
      description: data.description || '',
      created_at: new Date().toISOString(),
    });
  }

  update(id, data) {
    const plan = this.getById(id);
    if (!plan) throw new Error('الخطة غير موجودة');
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.price !== undefined) updates.price = parseFloat(data.price);
    if (data.limits) updates.limits = data.limits;
    if (data.active !== undefined) updates.active = data.active;
    if (data.description !== undefined) updates.description = data.description;
    return db.adapter.update('plans', parseInt(id), updates);
  }

  deactivate(id) { return this.update(id, { active: false }); }
  activate(id) { return this.update(id, { active: true }); }

  seedDefaults() {
    const existing = this.getAll();
    if (existing.length >= 3) return;
    DEFAULT_PLANS.forEach(p => {
      const found = this.getById(p.id);
      if (!found) db.adapter.create('plans', p);
    });
  }
}

module.exports = PlanManager;

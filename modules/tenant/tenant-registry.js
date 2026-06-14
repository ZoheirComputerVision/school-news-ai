const db = require('../../database');

const DEFAULT_TENANTS = [
  { id: 1, slug: 'tiaret', name: 'تيارت', region: 'ولاية تيارت', status: 'active', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 2, slug: 'oran', name: 'وهران', region: 'ولاية وهران', status: 'active', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 3, slug: 'setif', name: 'سطيف', region: 'ولاية سطيف', status: 'active', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 4, slug: 'algiers', name: 'الجزائر العاصمة', region: 'ولاية الجزائر', status: 'active', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 5, slug: 'mostaganem', name: 'مستغانم', region: 'ولاية مستغانم', status: 'active', created_at: '2026-06-14T00:00:00.000Z' },
  { id: 6, slug: 'chlef', name: 'الشلف', region: 'ولاية الشلف', status: 'active', created_at: '2026-06-14T00:00:00.000Z' },
];

class TenantRegistry {
  getAll() {
    try { return db.adapter.findAll('tenants') || []; } catch { return []; }
  }

  getById(id) {
    try { return db.adapter.getById('tenants', parseInt(id)); } catch { return null; }
  }

  getBySlug(slug) {
    try {
      return db.adapter.find('tenants', t => t.slug === slug)[0] || null;
    } catch { return null; }
  }

  getActive() {
    try { return db.adapter.find('tenants', t => t.status === 'active'); } catch { return []; }
  }

  create(data) {
    if (!data.slug || !data.name) throw new Error('الاسم والرمز مطلوبان');
    const existing = this.getBySlug(data.slug);
    if (existing) throw new Error(`الرمز ${data.slug} مستخدم بالفعل`);
    return db.adapter.create('tenants', {
      slug: data.slug,
      name: data.name,
      region: data.region || '',
      status: data.status || 'active',
      created_at: new Date().toISOString(),
    });
  }

  update(id, data) {
    const existing = this.getById(id);
    if (!existing) throw new Error(`المنصة ${id} غير موجودة`);
    if (data.slug && data.slug !== existing.slug) {
      const dup = this.getBySlug(data.slug);
      if (dup) throw new Error(`الرمز ${data.slug} مستخدم بالفعل`);
    }
    const allowed = ['slug', 'name', 'region', 'status'];
    const updates = {};
    allowed.forEach(k => { if (data[k] !== undefined) updates[k] = data[k]; });
    return db.adapter.update('tenants', id, updates);
  }

  activate(id) { return this.update(id, { status: 'active' }); }
  deactivate(id) { return this.update(id, { status: 'inactive' }); }

  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      active: all.filter(t => t.status === 'active').length,
      inactive: all.filter(t => t.status === 'inactive').length,
      by_region: all.reduce((acc, t) => {
        const region = t.region || 'unknown';
        if (!acc[region]) acc[region] = 0;
        acc[region]++;
        return acc;
      }, {}),
    };
  }

  seedDefaults() {
    const existing = this.getAll();
    if (existing.length >= 6) return;
    DEFAULT_TENANTS.forEach(t => {
      const found = this.getBySlug(t.slug);
      if (!found) db.adapter.create('tenants', t);
    });
  }
}

module.exports = TenantRegistry;

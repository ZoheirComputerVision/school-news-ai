const db = require('../../database');
const PlanManager = require('./plan-manager');

const STATUSES = ['trial', 'active', 'suspended', 'expired', 'cancelled'];

class SubscriptionManager {
  constructor() {
    this.planMgr = new PlanManager();
  }

  getByTenant(tenantId) {
    try {
      return db.adapter.find('subscriptions', s => s.tenant_id === parseInt(tenantId))[0] || null;
    } catch { return null; }
  }

  getById(id) {
    try { return db.adapter.getById('subscriptions', parseInt(id)) || null; } catch { return null; }
  }

  getAll() {
    try { return db.adapter.findAll('subscriptions') || []; } catch { return []; }
  }

  getActive() {
    try { return db.adapter.find('subscriptions', s => s.status === 'active' || s.status === 'trial') || []; } catch { return []; }
  }

  create(tenantId, planId) {
    const existing = this.getByTenant(tenantId);
    if (existing) throw new Error('المنصة لديها اشتراك بالفعل');
    const plan = this.planMgr.getById(planId);
    if (!plan) throw new Error('الخطة غير موجودة');
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);
    return db.adapter.create('subscriptions', {
      tenant_id: parseInt(tenantId),
      plan_id: parseInt(planId),
      status: 'trial',
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      cancelled_at: null,
      created_at: now.toISOString(),
    });
  }

  activate(id) {
    const sub = this.getById(id);
    if (!sub) throw new Error('الاشتراك غير موجود');
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return db.adapter.update('subscriptions', parseInt(id), {
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
  }

  suspend(id) {
    const sub = this.getById(id);
    if (!sub) throw new Error('الاشتراك غير موجود');
    return db.adapter.update('subscriptions', parseInt(id), { status: 'suspended' });
  }

  renew(id) {
    const sub = this.getById(id);
    if (!sub) throw new Error('الاشتراك غير موجود');
    if (sub.status === 'cancelled') throw new Error('لا يمكن تجديد اشتراك ملغي');
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return db.adapter.update('subscriptions', parseInt(id), {
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
  }

  cancel(id) {
    const sub = this.getById(id);
    if (!sub) throw new Error('الاشتراك غير موجود');
    return db.adapter.update('subscriptions', parseInt(id), { status: 'cancelled', cancelled_at: new Date().toISOString() });
  }

  expire(id) {
    return db.adapter.update('subscriptions', parseInt(id), { status: 'expired' });
  }

  changePlan(id, planId) {
    const sub = this.getById(id);
    if (!sub) throw new Error('الاشتراك غير موجود');
    const plan = this.planMgr.getById(planId);
    if (!plan) throw new Error('الخطة غير موجودة');
    return db.adapter.update('subscriptions', parseInt(id), { plan_id: parseInt(planId) });
  }

  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      trial: all.filter(s => s.status === 'trial').length,
      active: all.filter(s => s.status === 'active').length,
      suspended: all.filter(s => s.status === 'suspended').length,
      expired: all.filter(s => s.status === 'expired').length,
      cancelled: all.filter(s => s.status === 'cancelled').length,
    };
  }

  getStatuses() { return [...STATUSES]; }
}

module.exports = SubscriptionManager;

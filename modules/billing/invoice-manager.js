const db = require('../../database');
const PlanManager = require('./plan-manager');
const SubscriptionManager = require('./subscription-manager');

const STATUSES = ['pending', 'paid', 'overdue', 'cancelled'];

class InvoiceManager {
  constructor() {
    this.planMgr = new PlanManager();
    this.subMgr = new SubscriptionManager();
  }

  getByTenant(tenantId) {
    try {
      return db.adapter.find('invoices', i => i.tenant_id === parseInt(tenantId)).sort((a, b) => b.created_at.localeCompare(a.created_at)) || [];
    } catch { return []; }
  }

  getById(id) {
    try { return db.adapter.getById('invoices', parseInt(id)) || null; } catch { return null; }
  }

  getAll() {
    try { return db.adapter.findAll('invoices') || []; } catch { return []; }
  }

  getPending() {
    try { return db.adapter.find('invoices', i => i.status === 'pending') || []; } catch { return []; }
  }

  generate(tenantId) {
    const sub = this.subMgr.getByTenant(tenantId);
    if (!sub) throw new Error('المنصة ليس لديها اشتراك');
    const plan = this.planMgr.getById(sub.plan_id);
    if (!plan) throw new Error('الخطة غير موجودة');
    if (plan.price === 0) throw new Error('لا يمكن إنشاء فاتورة لخطة مجانية');

    const now = new Date();
    const periodStart = sub.current_period_start ? new Date(sub.current_period_start) : now;
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const existingCount = this.getAll().length + 1;
    const invoiceNumber = `INV-${year}${month}-${String(existingCount).padStart(4, '0')}`;

    const existing = db.adapter.find('invoices', i =>
      i.tenant_id === parseInt(tenantId) &&
      i.invoice_number === invoiceNumber
    );
    if (existing.length) throw new Error('الفاتورة لهذه الفترة موجودة بالفعل');

    return db.adapter.create('invoices', {
      tenant_id: parseInt(tenantId),
      subscription_id: sub.id,
      invoice_number: invoiceNumber,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      amount: plan.price,
      status: 'pending',
      paid_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  }

  markPaid(id) {
    const inv = this.getById(id);
    if (!inv) throw new Error('الفاتورة غير موجودة');
    return db.adapter.update('invoices', parseInt(id), { status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  markOverdue(id) {
    return db.adapter.update('invoices', parseInt(id), { status: 'overdue', updated_at: new Date().toISOString() });
  }

  cancel(id) {
    return db.adapter.update('invoices', parseInt(id), { status: 'cancelled', updated_at: new Date().toISOString() });
  }

  getRevenue() {
    const all = this.getAll();
    const paid = all.filter(i => i.status === 'paid');
    const totalRevenue = paid.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const pending = all.filter(i => i.status === 'pending');
    const pendingRevenue = pending.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    return { total_revenue: totalRevenue, pending_revenue: pendingRevenue, paid_invoices: paid.length, pending_invoices: pending.length, total_invoices: all.length };
  }

  getMonthlyRevenue() {
    const all = this.getAll().filter(i => i.status === 'paid');
    const monthly = {};
    all.forEach(i => {
      const month = i.created_at ? i.created_at.substring(0, 7) : 'unknown';
      monthly[month] = (monthly[month] || 0) + (parseFloat(i.amount) || 0);
    });
    return monthly;
  }

  getMRR() {
    const revenue = this.getMonthlyRevenue();
    const months = Object.keys(revenue);
    if (!months.length) return 0;
    const lastMonth = months[months.length - 1];
    return revenue[lastMonth] || 0;
  }

  getARR() { return this.getMRR() * 12; }

  getStatuses() { return [...STATUSES]; }
}

module.exports = InvoiceManager;

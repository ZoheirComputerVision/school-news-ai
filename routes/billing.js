const express = require('express');
const router = express.Router();
const PlanManager = require('../modules/billing/plan-manager');
const SubscriptionManager = require('../modules/billing/subscription-manager');
const InvoiceManager = require('../modules/billing/invoice-manager');
const UsageTracker = require('../modules/billing/usage-tracker');
const { authenticateToken, adminAuth, requireRole, requireTenantAccess } = require('../middleware/authorize');

const planMgr = new PlanManager();
const subMgr = new SubscriptionManager();
const invMgr = new InvoiceManager();
const usageTracker = new UsageTracker();

// ─── Plans (super_admin only for mutations) ───

router.get('/plans', (req, res) => {
  try {
    const plans = planMgr.getActive();
    res.json({ plans, total: plans.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/plans/all', adminAuth, (req, res) => {
  try {
    const plans = planMgr.getAll();
    res.json({ plans, total: plans.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/plan/create', adminAuth, (req, res) => {
  try {
    const plan = planMgr.create(req.body);
    res.json({ success: true, plan });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/plan/:id', adminAuth, (req, res) => {
  try {
    planMgr.update(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/plan/:id/deactivate', adminAuth, (req, res) => {
  try {
    planMgr.deactivate(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/plan/:id/activate', adminAuth, (req, res) => {
  try {
    planMgr.activate(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Subscriptions ───

router.get('/subscriptions', adminAuth, (req, res) => {
  try {
    const subs = subMgr.getAll();
    res.json({ subscriptions: subs, total: subs.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/subscription/tenant/:tenantId', authenticateToken, requireTenantAccess, (req, res) => {
  try {
    const sub = subMgr.getByTenant(req.params.tenantId);
    if (!sub) return res.status(404).json({ error: 'لا يوجد اشتراك' });
    const plan = planMgr.getById(sub.plan_id);
    res.json({ subscription: sub, plan });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/subscription/create', authenticateToken, requireRole('super_admin', 'tenant_admin'), (req, res) => {
  try {
    const { tenant_id, plan_id } = req.body;
    const sub = subMgr.create(tenant_id, plan_id);
    res.json({ success: true, subscription: sub });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/subscription/:id/activate', adminAuth, (req, res) => {
  try {
    subMgr.activate(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/subscription/:id/suspend', adminAuth, (req, res) => {
  try {
    subMgr.suspend(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/subscription/:id/renew', adminAuth, (req, res) => {
  try {
    subMgr.renew(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/subscription/:id/cancel', adminAuth, (req, res) => {
  try {
    subMgr.cancel(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/subscription/:id/plan', adminAuth, (req, res) => {
  try {
    subMgr.changePlan(req.params.id, req.body.plan_id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Invoices ───

router.get('/invoices', adminAuth, (req, res) => {
  try {
    const invoices = invMgr.getAll();
    res.json({ invoices, total: invoices.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/invoices/tenant/:tenantId', authenticateToken, requireTenantAccess, (req, res) => {
  try {
    const invoices = invMgr.getByTenant(req.params.tenantId);
    res.json({ invoices });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/invoice/generate', adminAuth, (req, res) => {
  try {
    const inv = invMgr.generate(req.body.tenant_id);
    res.json({ success: true, invoice: inv });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/invoice/:id/paid', adminAuth, (req, res) => {
  try {
    invMgr.markPaid(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/invoice/:id/overdue', adminAuth, (req, res) => {
  try {
    invMgr.markOverdue(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/invoice/:id/cancel', adminAuth, (req, res) => {
  try {
    invMgr.cancel(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Usage ───

router.get('/usage', adminAuth, (req, res) => {
  try {
    const subs = subMgr.getAll();
    const usage = subs.map(s => {
      const u = usageTracker.getCurrentPeriod(s.tenant_id);
      const plan = planMgr.getById(s.plan_id);
      const limits = plan ? usageTracker.checkLimits(s.tenant_id, plan) : null;
      return { tenant_id: s.tenant_id, usage: u, limits_check: limits };
    });
    res.json({ usage });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/usage/tenant/:tenantId', authenticateToken, requireTenantAccess, (req, res) => {
  try {
    const u = usageTracker.getCurrentPeriod(req.params.tenantId);
    const sub = subMgr.getByTenant(req.params.tenantId);
    const plan = sub ? planMgr.getById(sub.plan_id) : null;
    const limits = plan ? usageTracker.checkLimits(req.params.tenantId, plan) : null;
    res.json({ usage: u, limits_check: limits });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Revenue ───

router.get('/revenue', adminAuth, (req, res) => {
  try {
    const revenue = invMgr.getRevenue();
    const mrr = invMgr.getMRR();
    const arr = invMgr.getARR();
    const monthly = invMgr.getMonthlyRevenue();
    const subStats = subMgr.getStats();
    res.json({ revenue, mrr, arr, monthly_revenue: monthly, subscription_stats: subStats });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;

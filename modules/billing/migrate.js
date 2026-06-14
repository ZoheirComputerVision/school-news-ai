const db = require('../../database');
const PlanManager = require('./plan-manager');

async function ensureBillingTables() {
  try {
    db.adapter.find('plans', () => true);
    db.adapter.find('subscriptions', () => true);
    db.adapter.find('invoices', () => true);
    db.adapter.find('usage_metrics', () => true);
    db.adapter.find('payment_events', () => true);
    const planMgr = new PlanManager();
    planMgr.seedDefaults();
    console.log('  ✓ Billing JSON tables ready (plans, subscriptions, invoices, usage, payments)');
  } catch (e) {
    console.error('  ✗ Failed to verify billing tables:', e.message);
  }
}

async function seedTrialSubscriptions() {
  try {
    const tenants = db.adapter.findAll('tenants') || [];
    const subMgr = require('./subscription-manager');
    const mgr = new subMgr();
    let seeded = 0;
    tenants.forEach(t => {
      const existing = mgr.getByTenant(t.id);
      if (!existing) {
        mgr.create(t.id, 1);
        seeded++;
      }
    });
    if (seeded) console.log(`  ✓ Seeded ${seeded} trial subscriptions`);
  } catch (e) {
    console.error('  ✗ Failed to seed trial subscriptions:', e.message);
  }
}

module.exports = { ensureBillingTables, seedTrialSubscriptions };

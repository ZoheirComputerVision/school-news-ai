const db = require('../../database');
const TenantRegistry = require('./tenant-registry');

async function ensureTenantTables() {
  try {
    db.adapter.find('tenants', () => true);
    db.adapter.find('tenant_config', () => true);
    db.adapter.find('tenant_settings', () => true);
    db.adapter.find('tenant_users', () => true);
    db.adapter.find('tenant_pages', () => true);
    const registry = new TenantRegistry();
    registry.seedDefaults();
    seedDefaultSuperAdmin();
    console.log('  ✓ Tenant JSON tables ready (registry, settings, users, pages)');
  } catch (e) {
    console.error('  ✗ Failed to verify tenant tables:', e.message);
  }
}

function seedDefaultSuperAdmin() {
  const existing = db.adapter.find('tenant_users', u => u.username === 'superadmin' && u.role === 'super_admin');
  if (!existing.length) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.adapter.create('tenant_users', {
      tenant_id: 1,
      username: 'superadmin',
      password_hash: hash,
      role: 'super_admin',
      display_name: 'المشرف العام',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('  ✓ Seeded default super_admin user');
  }
}

async function migrateExistingData() {
  try {
    const tiaret = db.adapter.find('tenants', t => t.slug === 'tiaret');
    if (!tiaret.length) { console.log('  ⚠ No default tenant found, skipping migration'); return; }
    const defaultTenantId = tiaret[0].id;

    // Migrate articles (processed_content)
    const articles = db.adapter.findAll('processed_content') || [];
    let migratedArticles = 0;
    articles.forEach(a => {
      if (!a.tenant_id) {
        db.adapter.update('processed_content', a.id, { tenant_id: defaultTenantId });
        migratedArticles++;
      }
    });
    if (migratedArticles) console.log(`  ✓ Migrated ${migratedArticles} articles to tenant tiaret`);

    // Migrate editorial items
    const editorialItems = db.adapter.findAll('editorial_items') || [];
    let migratedEditorial = 0;
    editorialItems.forEach(e => {
      if (!e.tenant_id) {
        db.adapter.update('editorial_items', e.id, { tenant_id: defaultTenantId });
        migratedEditorial++;
      }
    });
    if (migratedEditorial) console.log(`  ✓ Migrated ${migratedEditorial} editorial items to tenant tiaret`);

    // Migrate advertisers
    const advertisers = db.adapter.findAll('advertisers') || [];
    let migratedAdv = 0;
    advertisers.forEach(a => {
      if (!a.tenant_id) {
        db.adapter.update('advertisers', a.id, { tenant_id: defaultTenantId });
        migratedAdv++;
      }
    });
    if (migratedAdv) console.log(`  ✓ Migrated ${migratedAdv} advertisers to tenant tiaret`);

    // Migrate campaigns
    const campaigns = db.adapter.findAll('campaigns') || [];
    let migratedCamp = 0;
    campaigns.forEach(c => {
      if (!c.tenant_id) {
        db.adapter.update('campaigns', c.id, { tenant_id: defaultTenantId });
        migratedCamp++;
      }
    });
    if (migratedCamp) console.log(`  ✓ Migrated ${migratedCamp} campaigns to tenant tiaret`);

    console.log('  ✓ Data migration complete');
  } catch (e) {
    console.error('  ✗ Data migration error:', e.message);
  }
}

module.exports = { ensureTenantTables, migrateExistingData };

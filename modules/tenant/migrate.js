const db = require('../../database');
const TenantRegistry = require('./tenant-registry');

async function ensureTenantTables() {
  try {
    db.adapter.find('tenants', () => true);
    db.adapter.find('tenant_config', () => true);
    const registry = new TenantRegistry();
    registry.seedDefaults();
    console.log('  ✓ Tenant JSON tables ready');
  } catch (e) {
    console.error('  ✗ Failed to verify tenant tables:', e.message);
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

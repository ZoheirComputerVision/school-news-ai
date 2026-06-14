const db = require('../../database');

async function ensureAdTables() {
  try {
    db.adapter.find('advertisers', () => true);
    db.adapter.find('campaigns', () => true);
    db.adapter.find('ad_events', () => true);
    console.log('  ✓ Advertising JSON tables ready');
  } catch (e) {
    console.error('  ✗ Failed to verify advertising tables:', e.message);
  }
}

module.exports = { ensureAdTables };

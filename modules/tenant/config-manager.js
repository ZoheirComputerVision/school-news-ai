const db = require('../../database');

const CONFIG_KEYS = ['title', 'slogan', 'contact_phone', 'contact_email', 'address',
  'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url',
  'homepage_hero_count', 'homepage_latest_count',
  'primary_color', 'secondary_color',
];

const DEFAULT_CONFIG = {
  title: 'الصوت المحلي',
  slogan: 'عين كرمس - تيارت',
  contact_phone: '',
  contact_email: '',
  address: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  youtube_url: '',
  homepage_hero_count: '3',
  homepage_latest_count: '12',
  primary_color: '#1a3a5c',
  secondary_color: '#c8a951',
};

class TenantConfigManager {
  getAll(tenantId) {
    try {
      const configs = db.adapter.find('tenant_config', c => c.tenant_id === parseInt(tenantId)) || [];
      const result = { ...DEFAULT_CONFIG };
      configs.forEach(c => { result[c.config_key] = c.config_value; });
      return result;
    } catch { return { ...DEFAULT_CONFIG }; }
  }

  get(tenantId, key) {
    if (!CONFIG_KEYS.includes(key)) return null;
    try {
      const entry = db.adapter.find('tenant_config', c => c.tenant_id === parseInt(tenantId) && c.config_key === key);
      return entry.length ? entry[0].config_value : DEFAULT_CONFIG[key] || null;
    } catch { return DEFAULT_CONFIG[key] || null; }
  }

  set(tenantId, key, value) {
    if (!CONFIG_KEYS.includes(key)) throw new Error(`مفتاح الإعدادات ${key} غير صالح`);
    const existing = db.adapter.find('tenant_config', c => c.tenant_id === parseInt(tenantId) && c.config_key === key);
    if (existing.length) {
      db.adapter.update('tenant_config', existing[0].id, { config_value: String(value) });
    } else {
      db.adapter.create('tenant_config', {
        tenant_id: parseInt(tenantId),
        config_key: key,
        config_value: String(value),
      });
    }
    return true;
  }

  setBulk(tenantId, data) {
    Object.entries(data).forEach(([key, value]) => {
      if (CONFIG_KEYS.includes(key)) this.set(tenantId, key, value);
    });
    return true;
  }

  getKeys() { return [...CONFIG_KEYS]; }
}

module.exports = TenantConfigManager;

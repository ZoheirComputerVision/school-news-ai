const db = require('../../database');

const BRANDING_KEYS = [
  'logo_url', 'favicon_url', 'homepage_title', 'footer_info',
  'editorial_description', 'about_text', 'contact_email', 'contact_phone',
  'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url',
];

const DEFAULT_BRANDING = {
  logo_url: '',
  favicon_url: '',
  homepage_title: 'الصوت المحلي',
  footer_info: 'جميع الحقوق محفوظة © الصوت المحلي',
  editorial_description: 'منصة إعلامية جهوية',
  about_text: '',
  contact_email: '',
  contact_phone: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  youtube_url: '',
};

class TenantBrandingManager {
  getAll(tenantId) {
    try {
      const entries = db.adapter.find('tenant_settings', s => s.tenant_id === parseInt(tenantId) && BRANDING_KEYS.includes(s.setting_key)) || [];
      const result = { ...DEFAULT_BRANDING };
      entries.forEach(e => { result[e.setting_key] = e.setting_value; });
      return result;
    } catch { return { ...DEFAULT_BRANDING }; }
  }

  get(tenantId, key) {
    if (!BRANDING_KEYS.includes(key)) return null;
    try {
      const entry = db.adapter.find('tenant_settings', s => s.tenant_id === parseInt(tenantId) && s.setting_key === key);
      return entry.length ? entry[0].setting_value : DEFAULT_BRANDING[key] || null;
    } catch { return DEFAULT_BRANDING[key] || null; }
  }

  set(tenantId, key, value) {
    if (!BRANDING_KEYS.includes(key)) throw new Error(`مفتاح ${key} غير صالح`);
    const existing = db.adapter.find('tenant_settings', s => s.tenant_id === parseInt(tenantId) && s.setting_key === key);
    if (existing.length) {
      db.adapter.update('tenant_settings', existing[0].id, { setting_value: String(value) });
    } else {
      db.adapter.create('tenant_settings', { tenant_id: parseInt(tenantId), setting_key: key, setting_value: String(value) });
    }
    return true;
  }

  setBulk(tenantId, data) {
    Object.entries(data).forEach(([key, value]) => {
      if (BRANDING_KEYS.includes(key)) this.set(tenantId, key, value);
    });
    return true;
  }

  getKeys() { return [...BRANDING_KEYS]; }
}

module.exports = TenantBrandingManager;

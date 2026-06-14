const db = require('../../database');

const VALID_PAGE_TYPES = ['about', 'contact', 'editorial-policy', 'privacy-policy'];

class TenantPagesManager {
  get(tenantId, pageType) {
    if (!VALID_PAGE_TYPES.includes(pageType)) return null;
    try {
      const pages = db.adapter.find('tenant_pages', p => p.tenant_id === parseInt(tenantId) && p.page_type === pageType);
      return pages.length ? pages[0] : null;
    } catch { return null; }
  }

  getAll(tenantId) {
    try {
      return (db.adapter.find('tenant_pages', p => p.tenant_id === parseInt(tenantId)) || [])
        .sort((a, b) => a.page_type.localeCompare(b.page_type));
    } catch { return []; }
  }

  upsert(tenantId, pageType, data) {
    if (!VALID_PAGE_TYPES.includes(pageType)) throw new Error(`نوع الصفحة ${pageType} غير صالح`);
    const existing = this.get(tenantId, pageType);
    if (existing) {
      return db.adapter.update('tenant_pages', existing.id, {
        title: data.title || existing.title,
        content: data.content !== undefined ? data.content : existing.content,
        published: data.published !== undefined ? data.published : existing.published,
        updated_at: new Date().toISOString(),
      });
    }
    return db.adapter.create('tenant_pages', {
      tenant_id: parseInt(tenantId),
      page_type: pageType,
      title: data.title || this._defaultTitle(pageType),
      content: data.content || '',
      published: data.published !== undefined ? data.published : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  publish(tenantId, pageType) {
    const page = this.get(tenantId, pageType);
    if (!page) throw new Error('الصفحة غير موجودة');
    return db.adapter.update('tenant_pages', page.id, { published: true, updated_at: new Date().toISOString() });
  }

  unpublish(tenantId, pageType) {
    const page = this.get(tenantId, pageType);
    if (!page) throw new Error('الصفحة غير موجودة');
    return db.adapter.update('tenant_pages', page.id, { published: false, updated_at: new Date().toISOString() });
  }

  getPublished(tenantId) {
    try {
      return (db.adapter.find('tenant_pages', p => p.tenant_id === parseInt(tenantId) && p.published === true) || [])
        .sort((a, b) => a.page_type.localeCompare(b.page_type));
    } catch { return []; }
  }

  getTypes() { return [...VALID_PAGE_TYPES]; }

  _defaultTitle(pageType) {
    const map = {
      'about': 'عن المنصة',
      'contact': 'اتصل بنا',
      'editorial-policy': 'السياسة التحريرية',
      'privacy-policy': 'سياسة الخصوصية',
    };
    return map[pageType] || pageType;
  }
}

module.exports = TenantPagesManager;

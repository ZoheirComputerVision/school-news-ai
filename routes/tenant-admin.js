const express = require('express');
const router = express.Router();
const TenantUserManager = require('../modules/tenant/user-manager');
const TenantBrandingManager = require('../modules/tenant/branding-manager');
const TenantPagesManager = require('../modules/tenant/pages-manager');
const TenantAnalytics = require('../modules/tenant/analytics');
const { authenticateToken, requireRole, requireTenantAccess } = require('../middleware/authorize');
const config = require('../config');
const jwt = require('jsonwebtoken');

const userMgr = new TenantUserManager();
const brandingMgr = new TenantBrandingManager();
const pagesMgr = new TenantPagesManager();
const analytics = new TenantAnalytics();

// Tenant-scoped login
router.post('/auth', (req, res) => {
  const { tenant_id, username, password } = req.body;
  if (!tenant_id || !username || !password) {
    return res.status(400).json({ success: false, error: 'معرف المنصة واسم المستخدم وكلمة المرور مطلوبون' });
  }
  const user = userMgr.authenticate(tenant_id, username, password);
  if (!user) {
    return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
  }
  const token = userMgr.generateToken(user);
  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role, tenant_id: user.tenant_id, display_name: user.display_name },
  });
});

// All subsequent routes require auth
router.use(authenticateToken);

// ─── Branding ───

router.get('/:id/branding', requireTenantAccess, (req, res) => {
  try {
    const data = brandingMgr.getAll(req.params.id);
    res.json({ branding: data });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id/branding', requireRole('super_admin', 'tenant_admin'), requireTenantAccess, (req, res) => {
  try {
    brandingMgr.setBulk(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Pages ───

router.get('/:id/pages', requireTenantAccess, (req, res) => {
  try {
    const pages = pagesMgr.getAll(req.params.id);
    res.json({ pages });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/:id/pages/:pageType', requireTenantAccess, (req, res) => {
  try {
    const page = pagesMgr.get(req.params.id, req.params.pageType);
    if (!page) return res.status(404).json({ error: 'الصفحة غير موجودة' });
    res.json({ page });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id/pages/:pageType', requireRole('super_admin', 'tenant_admin', 'editor'), requireTenantAccess, (req, res) => {
  try {
    const page = pagesMgr.upsert(req.params.id, req.params.pageType, req.body);
    res.json({ success: true, page });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/pages/:pageType/publish', requireRole('super_admin', 'tenant_admin', 'editor'), requireTenantAccess, (req, res) => {
  try {
    pagesMgr.publish(req.params.id, req.params.pageType);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/pages/:pageType/unpublish', requireRole('super_admin', 'tenant_admin', 'editor'), requireTenantAccess, (req, res) => {
  try {
    pagesMgr.unpublish(req.params.id, req.params.pageType);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Public pages (no auth required)
router.get('/public/:slug/pages', (req, res) => {
  try {
    const { slug } = req.params;
    const TenantRegistry = require('../modules/tenant/tenant-registry');
    const reg = new TenantRegistry();
    const tenant = reg.getBySlug(slug);
    if (!tenant) return res.status(404).json({ error: 'المنصة غير موجودة' });
    const pages = pagesMgr.getPublished(tenant.id);
    res.json({ pages });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/public/:slug/pages/:pageType', (req, res) => {
  try {
    const { slug, pageType } = req.params;
    const TenantRegistry = require('../modules/tenant/tenant-registry');
    const reg = new TenantRegistry();
    const tenant = reg.getBySlug(slug);
    if (!tenant) return res.status(404).json({ error: 'المنصة غير موجودة' });
    const page = pagesMgr.get(tenant.id, pageType);
    if (!page || !page.published) return res.status(404).json({ error: 'الصفحة غير موجودة' });
    res.json({ page });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Users ───

router.get('/:id/users', requireRole('super_admin', 'tenant_admin'), requireTenantAccess, (req, res) => {
  try {
    const users = userMgr.getByTenant(req.params.id);
    res.json({ users });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/users', requireRole('super_admin', 'tenant_admin'), requireTenantAccess, (req, res) => {
  try {
    const user = userMgr.create({ ...req.body, tenant_id: req.params.id });
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, tenant_id: user.tenant_id } });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id/users/:userId', requireRole('super_admin', 'tenant_admin'), requireTenantAccess, (req, res) => {
  try {
    userMgr.update(req.params.userId, req.body);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Analytics ───

router.get('/:id/analytics', requireTenantAccess, (req, res) => {
  try {
    const data = analytics.getFull(req.params.id);
    res.json({ analytics: data });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;

const TenantRegistry = require('../modules/tenant/tenant-registry');

const KNOWNTENANT_PATHS = ['tiaret', 'oran', 'setif', 'algiers', 'mostaganem', 'chlef'];

const registry = new TenantRegistry();

function tenantMiddleware(req, res, next) {
  const pathParts = req.path.split('/').filter(Boolean);
  let tenantSlug = null;
  let slugFromPath = false;

  // Check if first path segment is a known tenant slug
  if (pathParts.length && KNOWNTENANT_PATHS.includes(pathParts[0])) {
    tenantSlug = pathParts[0];
    slugFromPath = true;
  }

  // Override with header if present
  const headerSlug = req.headers['x-tenant-id'];
  if (headerSlug) {
    tenantSlug = headerSlug;
    slugFromPath = false;
  }

  // Fallback to default
  if (!tenantSlug) tenantSlug = 'tiaret';

  const tenant = registry.getBySlug(tenantSlug);
  if (!tenant) {
    // Not found — if slug was from path, try next middleware (maybe it's not a tenant URL)
    if (slugFromPath) {
      req.tenant = registry.getBySlug('tiaret') || { id: 1, slug: 'tiaret', name: 'تيارت', region: 'ولاية تيارت', status: 'active' };
      return next();
    }
    return res.status(404).json({ error: `المنصة "${tenantSlug}" غير موجودة` });
  }

  if (tenant.status !== 'active') {
    return res.status(503).json({ error: `المنصة "${tenant.name}" غير نشطة حالياً` });
  }

  req.tenant = tenant;

  // Rewrite URL: remove tenant slug prefix so downstream routes work unchanged
  if (slugFromPath) {
    req.url = req.url.replace(`/${tenantSlug}`, '') || '/';
  }

  next();
}

function requireTenant(req, res, next) {
  if (!req.tenant) return res.status(400).json({ error: 'المنصة غير محددة' });
  next();
}

module.exports = { tenantMiddleware, requireTenant };

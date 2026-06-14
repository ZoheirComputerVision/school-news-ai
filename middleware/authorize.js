const jwt = require('jsonwebtoken');
const config = require('../config');
const TenantUserManager = require('../modules/tenant/user-manager');

const userMgr = new TenantUserManager();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'غير مصرح: يلزم رمز الدخول' });
  }
  const decoded = userMgr.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'رمز الدخول غير صالح أو منتهي الصلاحية' });
  }
  req.user = decoded;
  next();
}

function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'غير مصرح: يلزم رمز الدخول' });
  }
  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'رمز الدخول غير صالح أو منتهي الصلاحية' });
    }
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'غير مصرح: يلزم تسجيل الدخول' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }
    next();
  };
}

function requireTenantAccess(req, res, next) {
  const tenantId = parseInt(req.params.id || req.body.tenant_id || req.query.tenant_id);
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'غير مصرح: يلزم تسجيل الدخول' });
  }
  if (req.user.role === 'super_admin') return next();
  if (req.user.tenant_id === tenantId) return next();
  return res.status(403).json({ success: false, error: 'ليس لديك صلاحية للوصول إلى هذه المنصة' });
}

module.exports = { authenticateToken, adminAuth, requireRole, requireTenantAccess };

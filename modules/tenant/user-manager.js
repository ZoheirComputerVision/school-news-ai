const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database');
const config = require('../../config');

const VALID_ROLES = ['super_admin', 'tenant_admin', 'editor', 'reviewer'];

class TenantUserManager {
  create(data) {
    if (!data.tenant_id) throw new Error('معرف المنصة مطلوب');
    if (!data.username || data.username.length < 3) throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    if (!data.password || data.password.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (!data.role || !VALID_ROLES.includes(data.role)) throw new Error('الدور غير صالح');

    const existing = db.adapter.find('tenant_users', u => u.username === data.username && u.tenant_id === parseInt(data.tenant_id));
    if (existing.length) throw new Error('اسم المستخدم مستخدم بالفعل في هذه المنصة');

    const hashedPassword = bcrypt.hashSync(data.password, 10);
    return db.adapter.create('tenant_users', {
      tenant_id: parseInt(data.tenant_id),
      username: data.username,
      password_hash: hashedPassword,
      role: data.role,
      display_name: data.display_name || data.username,
      active: data.active !== undefined ? data.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  authenticate(tenantId, username, password) {
    const users = db.adapter.find('tenant_users', u =>
      u.tenant_id === parseInt(tenantId) && u.username === username && u.active !== false
    );
    if (!users.length) return null;
    const user = users[0];
    if (!bcrypt.compareSync(password, user.password_hash)) return null;
    return user;
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role, tenant_id: user.tenant_id },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch { return null; }
  }

  getByTenant(tenantId) {
    try {
      const users = db.adapter.find('tenant_users', u => u.tenant_id === parseInt(tenantId)) || [];
      return users.map(u => ({ id: u.id, tenant_id: u.tenant_id, username: u.username, role: u.role, display_name: u.display_name, active: u.active, created_at: u.created_at }));
    } catch { return []; }
  }

  getById(id) {
    try {
      const u = db.adapter.getById('tenant_users', parseInt(id));
      if (!u) return null;
      return { id: u.id, tenant_id: u.tenant_id, username: u.username, role: u.role, display_name: u.display_name, active: u.active, created_at: u.created_at };
    } catch { return null; }
  }

  update(id, data) {
    const user = db.adapter.getById('tenant_users', parseInt(id));
    if (!user) throw new Error('المستخدم غير موجود');
    const updates = {};
    if (data.display_name) updates.display_name = data.display_name;
    if (data.role && VALID_ROLES.includes(data.role)) updates.role = data.role;
    if (data.active !== undefined) updates.active = data.active;
    if (data.password) updates.password_hash = bcrypt.hashSync(data.password, 10);
    return db.adapter.update('tenant_users', parseInt(id), { ...updates, updated_at: new Date().toISOString() });
  }

  hasAccess(user, tenantId) {
    if (user.role === 'super_admin') return true;
    return user.tenant_id === parseInt(tenantId);
  }

  getValidRoles() { return [...VALID_ROLES]; }
}

module.exports = TenantUserManager;

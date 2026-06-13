const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'تجاوزت حد الطلبات المسموح. حاول بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'تجاوزت حد الطلبات المسموح' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'محاولات دخول كثيرة. حاول بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

function csrfProtection(req, res, next) {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!csrfToken || !token || csrfToken !== token.slice(0, 20)) {
    return res.status(403).json({ success: false, error: 'طلب غير مصرح: CSRF token مفقود أو غير صالح' });
  }

  next();
}

function validateManualInput(req, res, next) {
  const { title, body } = req.body;
  const errors = [];

  if (title && (typeof title !== 'string' || title.trim().length < 2 || title.length > 500)) {
    errors.push('العنوان يجب أن يكون بين 2 و 500 حرف');
  }

  if (body && (typeof body !== 'string' || body.trim().length < 2 || body.length > 50000)) {
    errors.push('المحتوى يجب أن يكون بين 2 و 50000 حرف');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }

  next();
}

module.exports = { adminLimiter, apiLimiter, authLimiter, csrfProtection, validateManualInput };

const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticateToken(req, res, next) {
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

module.exports = { authenticateToken };

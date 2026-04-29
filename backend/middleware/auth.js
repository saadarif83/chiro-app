const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chiro-dev-secret-change-in-production';

module.exports = (roles = []) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

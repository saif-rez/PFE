const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // If user changed their password, invalidate all JWTs issued before that moment
  prisma.user.findUnique({
    where: { id: decoded.id },
    select: { password_changed_at: true },
  }).then(user => {
    if (user?.password_changed_at) {
      const tokenIssuedAt = new Date(decoded.iat * 1000);
      if (tokenIssuedAt < user.password_changed_at) {
        return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
      }
    }
    req.user = decoded;
    next();
  }).catch(() => {
    // On DB error, allow through to avoid blocking the site
    req.user = decoded;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin };

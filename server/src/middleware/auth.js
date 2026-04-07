import jwt from 'jsonwebtoken';
import db from '../utils/db.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    logger.warn(`Unauthorized admin access attempt by user ${req.user?.id} from IP ${req.ip}`);
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function auditLog(action, resourceType = null) {
  return (req, res, next) => {
    const original = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode < 400) {
        try {
          db.prepare(`
            INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            req.user?.id || null,
            action,
            resourceType,
            req.params?.id || null,
            req.ip,
            req.headers['user-agent']?.substring(0, 200) || null,
            JSON.stringify({ method: req.method, path: req.path })
          );
        } catch (e) {
          logger.error('Audit log error:', e);
        }
      }
      return original(data);
    };
    next();
  };
}

export { authenticate, requireAdmin, auditLog }; 

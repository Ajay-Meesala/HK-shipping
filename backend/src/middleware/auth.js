import { getAuth } from 'firebase-admin/auth';
import { db, COLLECTIONS } from '../db/firebase.js';

/**
 * verifyToken — Verifies a Firebase ID token sent in the Authorization header.
 * Attaches req.user = { uid, email, role } on success.
 * Falls back gracefully if no token is provided (for backward-compat with
 * the current mock-auth frontend). To enforce auth strictly, remove the fallback.
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // No token — allow request through with a "guest" user (backward compat)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { uid: null, email: null, role: 'guest' };
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const { uid, email } = decoded;

    // Try to load role from Firestore user profile
    let role = decoded.role || 'driver'; // fallback to custom claim or 'driver'
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
      if (userDoc.exists) {
        role = userDoc.data().role || role;
      }
    } catch {
      // Firestore read failed — use claim-based role
    }

    req.user = { uid, email, role };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized — invalid or expired token',
    });
  }
};

/**
 * checkRole — Middleware factory that restricts access to specified roles.
 * Must be used AFTER verifyToken.
 *
 * Usage:
 *   router.post('/', verifyToken, checkRole(['admin', 'dispatcher']), handler)
 *
 * If req.user.role is 'guest' (no token provided), the request is also blocked
 * unless 'guest' is explicitly included in the allowed roles array.
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { role } = req.user;

    // Guest (no token) with no explicit guest permission — block
    if (role === 'guest' && !allowedRoles.includes('guest')) {
      return res.status(403).json({
        success: false,
        error: `Forbidden — this action requires one of: [${allowedRoles.join(', ')}]`,
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden — your role (${role}) is not authorized for this action`,
      });
    }

    next();
  };
};

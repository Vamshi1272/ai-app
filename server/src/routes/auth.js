import express from 'express';
import sendEmail from '../utils/email.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import db from '../utils/db.js';
import { createOTP, verifyOTP } from '../utils/otp.js';
import { authLimiter, otpLimiter } from '../middleware/security.js';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

console.log(" AUTH ROUTES FILE LOADED");

const router = express.Router();
// ================= GET USERS =================
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name, is_admin, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      users
    });

  } catch (err) {
    console.log("GET USERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to load users'
    });
  }
});
router.get('/test', (req, res) => {
  res.send("AUTH WORKING");
});
// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, apostrophes'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

function generateTokens(userId, isAdmin) {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access', admin: isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

function storeRefreshToken(userId, refreshToken, req) {
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, hash, expiresAt, req.ip, req.headers['user-agent']?.substring(0, 200));
}

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password, full_name, phone } = req.body;

  try {
    const existing = db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(email);
    if (existing) {
      if (!existing.email_verified) {
        // Resend OTP for unverified accounts
        const otp = createOTP(email, 'email_verification', existing.id);
        console.log(" REGISTER OTP:", otp);
        await sendEmail(email, otp);
        return res.json({ success: true, message: 'Account exists but unverified. New OTP sent.', step: 'verify_email' });
      }
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, full_name, phone || null);
    console.log("🔥 REGISTER ROUTE HIT");
    console.log("👉 Step 1: Before OTP");
    const otp = createOTP(email, 'email_verification', userId);
    console.log("👉 Step 2: After OTP");
    console.log("📩 OTP VALUE:", otp);
    console.log("👉 Step 3: Before sendEmail");
    await sendEmail(email, otp);

    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for the verification OTP.',
      step: 'verify_email',
    });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, otp } = req.body;
  const result = verifyOTP(email, otp, 'email_verification');

  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.reason });
  }

  db.prepare('UPDATE users SET email_verified = 1, updated_at = unixepoch() WHERE email = ?').run(email);
  res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

// POST /api/auth/login - Step 1: verify credentials
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Invalid input' });
  }

  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Generic error to prevent user enumeration
    if (!user) {
      await bcrypt.compare(password, '$2a$12$invalidhashtopreventtimingattack');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    // Check account lockout
    const now = Math.floor(Date.now() / 1000);
    if (user.locked_until && user.locked_until > now) {
      const minutesLeft = Math.ceil((user.locked_until - now) / 60);
      return res.status(429).json({ success: false, message: `Account locked. Try again in ${minutesLeft} minutes.` });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? now + 30 * 60 : null; // Lock for 30 min after 5 fails
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockUntil, user.id);
      logger.warn(`Failed login attempt for ${email} from IP ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Check your inbox.', step: 'verify_email' });
    }

    // Reset failed attempts
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    // Send login OTP
    const otp = createOTP(email, 'login', user.id);
    console.log("LOGIN OTP:", otp);
    await sendEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to your email.', step: 'verify_otp' });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/verify-login-otp - Step 2: verify OTP and issue tokens
router.post('/verify-login-otp', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Invalid input' });
  }

  const { email, otp } = req.body;
  const result = verifyOTP(email, otp, 'login');
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.reason });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.is_admin);
  storeRefreshToken(user.id, refreshToken, req);

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_admin: !!user.is_admin,
    },
  });
});

// POST /api/auth/admin-login - Admin login (separate, tighter)
router.post('/admin-login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const { email, password } = req.body;

  // Extra delay for admin to slow brute force
  await new Promise(r => setTimeout(r, 500));

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_admin = 1 AND is_active = 1').get(email);
    if (!user) {
      await bcrypt.compare(password, '$2a$12$dummyhashfortimingattackprevention');
      logger.warn(`Admin login attempt with invalid email: ${email} from IP ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.locked_until && user.locked_until > now) {
      return res.status(429).json({ success: false, message: 'Account locked. Contact support.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = attempts >= 3 ? now + 60 * 60 : null; // Stricter: 3 attempts, 1hr lock
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockUntil, user.id);
      logger.warn(`Failed admin login for ${email} from IP ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified' });
    }

    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    const otp = createOTP(email, 'admin_login', user.id);
    console.log("ADMIN OTP:", otp);
    await sendEmail(email, otp);
    res.json({ success: true, message: 'Admin OTP sent.', step: 'verify_otp' });
  } catch (err) {
    logger.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /api/auth/verify-admin-otp
router.post('/verify-admin-otp', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res) => {
  const { email, otp } = req.body;
  const result = verifyOTP(email, otp, 'admin_login');
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.reason });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_admin = 1 AND is_active = 1').get(email);
  if (!user) return res.status(401).json({ success: false, message: 'Admin not found' });

  const { accessToken, refreshToken } = generateTokens(user.id, true);
  storeRefreshToken(user.id, refreshToken, req);

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, full_name: user.full_name, is_admin: true },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const now = Math.floor(Date.now() / 1000);

    const stored = db.prepare(`
      SELECT * FROM refresh_tokens
      WHERE user_id = ? AND token_hash = ? AND revoked = 0 AND expires_at > ?
    `).get(payload.sub, hash, now);

    if (!stored) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    // Rotate refresh token
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const tokens = generateTokens(user.id, user.is_admin);
    storeRefreshToken(user.id, tokens.refreshToken, req);

    res.json({ success: true, ...tokens });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND token_hash = ?')
      .run(req.user.id, hash);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('type').isIn(['email_verification', 'login', 'admin_login']),
], async (req, res) => {
  const { email, type } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.json({ success: true, message: 'If the email exists, OTP has been resent.' }); // No enumeration

  const otp = createOTP(email, type, user.id);
  console.log("RESEND OTP:", otp);
  await sendEmail(email, otp);
  res.json({ success: true, message: 'OTP resent. Check your email.' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const { password_hash, ...user } = req.user;
  res.json({ success: true, user });
});

export default router; 

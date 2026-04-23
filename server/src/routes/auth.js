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

const router = express.Router();

console.log("AUTH ROUTES FILE LOADED");

// ================= HELPER =================
const sendOtpEmail = async (email, otp, title = "OTP Code") => {
  await sendEmail({
    to: email,
    subject: title,
    html: `
      <div style="font-family:sans-serif">
        <h2>${title}</h2>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `,
  });
};

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (existing) {
      const otp = createOTP(email, 'email_verification', existing.id);
      console.log("REGISTER OTP:", otp);
      await sendOtpEmail(email, otp, "Email Verification OTP");

      return res.json({
        success: true,
        message: 'Account exists. OTP sent again',
      });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name)
      VALUES (?, ?, ?, ?)
    `).run(id, email, hash, full_name);

    const otp = createOTP(email, 'email_verification', id);
    console.log("REGISTER OTP:", otp);

    await sendOtpEmail(email, otp, "Email Verification OTP");

    res.json({
      success: true,
      message: 'Registered. OTP sent',
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Register failed' });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const otp = createOTP(email, 'login', user.id);
    console.log("LOGIN OTP:", otp);

    await sendOtpEmail(email, otp, "Login OTP");

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// ================= ADMIN LOGIN =================
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_admin = 1').get(email);

    if (!user) {
      return res.status(401).json({ message: 'Not admin' });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const otp = createOTP(email, 'admin_login', user.id);
    console.log("ADMIN OTP:", otp);

    await sendOtpEmail(email, otp, "Admin Login OTP");

    res.json({ success: true, message: 'OTP sent' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Admin login failed' });
  }
});

// ================= VERIFY ADMIN OTP =================
router.post('/verify-admin-otp', async (req, res) => {
  const { email, otp } = req.body;

  const result = verifyOTP(email, otp, 'admin_login');

  if (!result.valid) {
    return res.status(400).json({ message: result.reason });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  const accessToken = jwt.sign(
    { id: user.id, is_admin: true },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    success: true,
    user,
    accessToken,
  });
});

// ================= RESEND OTP =================
router.post('/resend-otp', async (req, res) => {
  const { email, type } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.json({ success: true });
  }

  const otp = createOTP(email, type, user.id);
  console.log("RESEND OTP:", otp);

  await sendOtpEmail(email, otp, "Resend OTP");

  res.json({ success: true });
});

export default router;
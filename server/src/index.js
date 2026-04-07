import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './utils/db.js';

import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ===== SERVE FRONTEND =====
app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

// PORT
const PORT = process.env.PORT || 5001;

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  await seedAdmin();
});

// ===== ADMIN SEED FUNCTION =====
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@docrevamp.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@SecurePass123!';

  const existing = db.prepare(
    'SELECT id FROM users WHERE email = ? AND is_admin = 1'
  ).get(adminEmail);

  if (!existing) {
    const hash = await bcrypt.hash(adminPass, 12);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, is_admin, email_verified)
      VALUES (?, ?, ?, 'Admin', 1, 1)
    `).run(uuidv4(), adminEmail, hash);

    console.log(`🔥 Admin user created: ${adminEmail}`);
  } else {
    console.log(`✅ Admin already exists: ${adminEmail}`);
  }
}
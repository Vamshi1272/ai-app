import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
const app = express();

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send('SERVER WORKING ✅');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  await seedAdmin(); // 🔥 ADD THIS LINE
});
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './utils/db.js';

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
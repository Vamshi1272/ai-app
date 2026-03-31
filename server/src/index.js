require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const db = require('./utils/db');
// const {
//   helmetMiddleware, generalLimiter, speedLimiter, hpp, compression
// } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware (order matters)
// app.use(helmetMiddleware);
// app.use(compression);
// app.use(hpp);

// CORS
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers (webhook needs raw body - must come before json parser for that route)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting & slow down
// app.use('/api', generalLimiter);
// app.use('/api', speedLimiter);

// Remove X-Powered-By (already done by helmet but double check)
app.disable('x-powered-by');

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/documents', documentRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/admin', adminRoutes);

// Serve static client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.log('Unhandled error:', err)
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (status < 500 ? err.message : 'Internal server error')
    : err.message;
  res.status(status).json({ success: false, message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  //seedAdmin();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => { db.close(); process.exit(0); });
});

// Seed admin user on startup
async function seedAdmin() {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@docrevamp.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@SecurePass123!';

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND is_admin = 1').get(adminEmail);
  if (!existing) {
    const hash = await bcrypt.hash(adminPass, 12);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, is_admin, email_verified)
      VALUES (?, ?, ?, 'Admin', 1, 1)
    `).run(uuidv4(), adminEmail, hash);
    console.log(`Admin user seeded: ${adminEmail}`);
  }
}

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./src/utils/db');

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@docrevamp.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@SecurePass123!';
  console.log('Seeding admin:', adminEmail);
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND is_admin = 1').get(adminEmail);
  if (!existing) {
    const hash = await bcrypt.hash(adminPass, 12);
    db.prepare('INSERT INTO users (id, email, password_hash, full_name, is_admin, email_verified) VALUES (?, ?, ?, \'Admin\', 1, 1)').run(uuidv4(), adminEmail, hash);
    console.log('Admin user seeded');
  } else {
    console.log('Admin already exists');
  }
}

seedAdmin();
import express from 'express';
import path from 'path';
import fs from 'fs';
import { body } from 'express-validator';
import db from '../utils/db.js';
import { authenticate, requireAdmin, auditLog } from '../middleware/auth.js';
import { uploadProcessed, handleUploadError } from '../middleware/upload.js';
import sendEmail from '../utils/email.js';
import { fileURLToPath } from 'url';

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ================= GET AUDIT LOGS =================
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT id, user_id, action, resource_type, resource_id,
             ip_address, user_agent, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    res.json({ success: true, logs });

  } catch (err) {
    console.log("AUDIT LOG ERROR:", err);
    res.status(500).json({ success: false, message: 'Failed to load logs' });
  }
});

// ================= GET USERS =================
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name, is_admin, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ success: true, users });

  } catch (err) {
    console.log("GET USERS ERROR:", err);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

// ================= DASHBOARD =================
router.get('/dashboard', (req, res) => {
  const stats = {
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE is_admin = 0').get().c,
    pendingDocuments: db.prepare("SELECT COUNT(*) as c FROM documents WHERE status = 'pending'").get().c,
    processingDocuments: db.prepare("SELECT COUNT(*) as c FROM documents WHERE status = 'processing'").get().c,
    completedDocuments: db.prepare("SELECT COUNT(*) as c FROM documents WHERE status = 'completed'").get().c,
    totalDocuments: db.prepare('SELECT COUNT(*) as c FROM documents').get().c,
    totalRevenue: db.prepare("SELECT COALESCE(SUM(amount_paid), 0) as r FROM documents WHERE payment_status = 'paid'").get().r,
    recentDocuments: db.prepare(`
      SELECT d.id, d.original_filename, d.status, d.payment_status, d.created_at,
             u.full_name, u.email
      FROM documents d JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC LIMIT 10
    `).all(),
  };

  res.json({ success: true, stats });
});

// ================= GET DOCUMENTS =================
router.get('/documents', (req, res) => {
  const { status, payment_status, page = 1, limit = 20, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '1=1';
  const params = [];

  if (status) { where += ' AND d.status = ?'; params.push(status); }
  if (payment_status) { where += ' AND d.payment_status = ?'; params.push(payment_status); }
  if (search) {
    where += ' AND (u.email LIKE ? OR u.full_name LIKE ? OR d.original_filename LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const docs = db.prepare(`
    SELECT d.id, d.original_filename, d.file_size, d.file_type, d.status, d.payment_status,
           d.amount_paid, d.notes, d.admin_notes, d.processed_at, d.created_at, d.updated_at,
           CASE WHEN d.processed_filename IS NOT NULL THEN 1 ELSE 0 END as has_processed,
           u.full_name, u.email
    FROM documents d JOIN users u ON d.user_id = u.id
    WHERE ${where}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as c FROM documents d JOIN users u ON d.user_id = u.id WHERE ${where}
  `).get(...params).c;

  res.json({ success: true, documents: docs, total });
});

// ================= DOWNLOAD ORIGINAL =================
router.get('/documents/:id/download-original', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);

  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

  const filePath = path.join(__dirname, '../../uploads/original', doc.stored_filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  res.download(filePath, doc.original_filename);
});

// ================= UPLOAD PROCESSED =================
router.post(
  '/documents/:id/upload-processed',
  auditLog('upload_processed', 'document'),
  (req, res, next) => {
    uploadProcessed.single('document')(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);

      if (!doc) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      db.prepare(`
        UPDATE documents SET
          processed_filename = ?, status = 'completed', processed_at = unixepoch()
        WHERE id = ?
      `).run(req.file.filename, req.params.id);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(doc.user_id);

      // ✅ FIXED EMAIL SENDING
      if (user) {
        await sendEmail({
          to: user.email,
          subject: "Your document is ready",
          html: `
            <h2>Your document is ready</h2>
            <p>You can now download your processed file.</p>
          `,
        });
      }

      res.json({ success: true, message: 'Processed document uploaded' });

    } catch (err) {
      console.error("UPLOAD PROCESSED ERROR:", err);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  }
);

// ================= UPDATE STATUS =================
router.patch('/documents/:id/status', [
  body('status').optional().isIn(['pending', 'processing', 'completed']),
], (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);

  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

  db.prepare(`
    UPDATE documents SET status = ?, updated_at = unixepoch()
    WHERE id = ?
  `).run(req.body.status, req.params.id);

  res.json({ success: true });
});

// ================= UPDATE USER STATUS =================
router.patch('/users/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = db.prepare(`
      UPDATE users
      SET is_active = ?
      WHERE id = ?
    `).run(isActive ? 1 : 0, id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User updated successfully"
    });

  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
});

export default router;
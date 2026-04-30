import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { uploadOriginal, handleUploadError } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/security.js';
import sendEmail from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();


// ================= UPLOAD =================
router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  (req, res, next) => {
    uploadOriginal.single('document')(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
      const docCount = db.prepare(`
        SELECT COUNT(*) as cnt FROM documents
        WHERE user_id = ? AND status NOT IN ('cancelled')
      `).get(req.user.id);

      if (docCount.cnt >= 10) {
        fs.unlinkSync(req.file.path);
        return res.status(429).json({
          success: false,
          message: 'Maximum document limit reached',
        });
      }

      const docId = uuidv4();

      db.prepare(`
        INSERT INTO documents (id, user_id, original_filename, stored_filename, file_size, file_type, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        docId,
        req.user.id,
        req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        req.body.notes?.substring(0, 500) || null
      );

      sendEmail(req.user.email, `Document uploaded successfully`).catch(() => {});

      res.status(201).json({
        success: true,
        document: { id: docId, status: 'pending' },
      });

    } catch (err) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      console.log("UPLOAD ERROR:", err);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  }
);


// ================= GET ALL =================
router.get('/', authenticate, (req, res) => {
  const docs = db.prepare(`
    SELECT id, original_filename, status, payment_status,
           CASE WHEN processed_filename IS NOT NULL THEN 1 ELSE 0 END as has_processed
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ success: true, documents: docs });
});


// ================= GET ONE =================
router.get('/:id', authenticate, (req, res) => {
  const doc = db.prepare(`
    SELECT * FROM documents WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  res.json({ success: true, document: doc });
});


// ================= DOWNLOAD PROCESSED =================
router.get('/:id/download-processed', authenticate, (req, res) => {
  try {
    const doc = db.prepare(`
      SELECT * FROM documents WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!doc.processed_filename) {
      return res.status(404).json({ success: false, message: 'Processed file not available' });
    }

    // 🔥 FIXED PATH (NO __dirname)
    const filePath = path.resolve('uploads/processed', doc.processed_filename);

    console.log("DOWNLOAD PATH:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // 🔥 FORCE DOWNLOAD
    res.download(filePath, `Processed_${doc.original_filename}`);

  } catch (err) {
    console.log("DOWNLOAD ERROR:", err);
    res.status(500).json({ success: false, message: 'Download failed' });
  }
});


export default router;
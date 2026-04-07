import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel, only /tmp is writable; locally use project folder
const IS_VERCEL = process.env.VERCEL === '1';
const UPLOAD_DIR = IS_VERCEL ? '/tmp/uploads/original' : path.join(__dirname, '../../uploads/original');
const PROCESSED_DIR = IS_VERCEL ? '/tmp/uploads/processed' : path.join(__dirname, '../../uploads/processed');

// Ensure upload directories exist
[UPLOAD_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(32).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

const processedStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PROCESSED_DIR),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(32).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.pdf', '.doc', '.docx'].includes(ext)) {
    return cb(new Error('Invalid file extension'), false);
  }
  cb(null, true);
}

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB) || 10;

const uploadOriginal = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024, files: 1 },
});

const uploadProcessed = multer({
  storage: processedStorage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024, files: 1 },
});

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: `File too large. Max size: ${maxSizeMB}MB` });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
}

export { uploadOriginal, uploadProcessed, handleUploadError, UPLOAD_DIR, PROCESSED_DIR };
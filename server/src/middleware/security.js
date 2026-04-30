import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';

// Helmet - security headers (keep this)
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // disable for dev to avoid blocking
});

// 🚀 DISABLED LIMITERS (for development)

const generalLimiter = (req, res, next) => next();

const authLimiter = (req, res, next) => next();

const otpLimiter = (req, res, next) => next();

const uploadLimiter = (req, res, next) => next();

const speedLimiter = (req, res, next) => next();

// Export everything
export {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  otpLimiter,
  uploadLimiter,
  speedLimiter
};

export const hppMiddleware = hpp();
export const compressionMiddleware = compression();
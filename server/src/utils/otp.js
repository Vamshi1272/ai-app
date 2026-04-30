import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";
import db from "./db.js";
import { v4 as uuidv4 } from "uuid";

// CREATE OTP
export function createOTP(email, type, userId = null) {
  const otp = otpGenerator.generate(6, {
  digits: true,
  lowerCaseAlphabets: false,
  upperCaseAlphabets: false,
  specialChars: false,
});
  const hashed = bcrypt.hashSync(otp, 10);

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes

  db.prepare(`
    INSERT INTO otp_codes (id, user_id, email, code, type, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, email, hashed, type, expiresAt);

  return otp; // send plain OTP to email
}

// VERIFY OTP
export function verifyOTP(email, otp, type) {
  const now = Math.floor(Date.now() / 1000);

  const record = db.prepare(`
  SELECT * FROM otp_codes
  WHERE email = ? AND type = ? AND used = 0
  ORDER BY created_at DESC
  LIMIT 1
`).get(email, type);

  if (!record) {
    return { valid: false, reason: "OTP not found" };
  }

  if (record.expires_at < now) {
    return { valid: false, reason: "OTP expired" };
  }

  const match = bcrypt.compareSync(otp, record.code);

  if (!match) {
    return { valid: false, reason: "Invalid OTP" };
  }

  // mark used
  db.prepare(`
    UPDATE otp_codes SET used = 1 WHERE id = ?
  `).run(record.id);

  return { valid: true };
}
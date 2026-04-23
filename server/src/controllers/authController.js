import Otp from "../models/otp.js";
import User from "../models/User.js";
import sendEmail from "../utils/email.js";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ================= NORMAL USER OTP =================

// SEND OTP
export const sendOtp = async (req, res) => {
  try {
    console.log("🔥 ADMIN LOGIN API HIT");
    const { email } = req.body;

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });

    // ✅ SEND EMAIL
    await sendEmail({
      to: [email],
      subject: "Your OTP Code",
      html: `
        <div style="font-family:sans-serif">
          <h2>OTP Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ CHECK EXPIRY
    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await compareOtp(otp, record.otp);

    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ DELETE USED OTP
    await Otp.deleteMany({ email });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ success: true, token });

  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// ================= ADMIN LOGIN =================

// STEP 1: PASSWORD CHECK + SEND OTP
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.is_admin) {
      return res.status(401).json({ message: "Not an admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // ✅ SEND ADMIN OTP EMAIL
    await sendEmail({
      to: [email],
      subject: "Admin Login OTP",
      html: `
        <div style="font-family:sans-serif">
          <h2>Admin Login OTP</h2>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Admin OTP sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Admin login failed" });
  }
};

// STEP 2: VERIFY ADMIN OTP
export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ CHECK EXPIRY
    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await compareOtp(otp, record.otp);

    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ DELETE OTP AFTER USE
    await Otp.deleteMany({ email });

    const user = await User.findOne({ email });

    const accessToken = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      user,
      accessToken,
    });

  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};
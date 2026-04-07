import Otp from "../models/otp.js";
import User from "../models/User.js";
import sendEmail from "../utils/email.js";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// NORMAL OTP
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    await Otp.create({ email, otp: hashedOtp });
    await sendEmail(email, otp);

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await compareOtp(otp, record.otp);

    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// ✅ ADMIN LOGIN (STEP 1)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.is_admin) {
      return res.status(401).json({ message: "Not an admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    await Otp.create({ email, otp: hashedOtp });
    await sendEmail(email, otp);

    res.json({ success: true, message: "Admin OTP sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Admin login failed" });
  }
};

// ✅ ADMIN VERIFY OTP (STEP 2)
export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await compareOtp(otp, record.otp);

    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email });

    const accessToken = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      user,
      accessToken
    });

  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};
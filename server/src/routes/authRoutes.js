import express from "express";
import {
  sendOtp,
  verifyOtp,
  adminLogin,
  verifyAdminOtp
} from "../controllers/authController.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// ✅ ADMIN ROUTES
router.post("/admin-login", adminLogin);
router.post("/verify-admin-otp", verifyAdminOtp);

export default router;
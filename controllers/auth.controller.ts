import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import ErrorHandler from "../utils/ErrorHandler";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
console.log("Login request received with email:", email, password); // Debug log
    if (!email || !password) {
      return next(
        new ErrorHandler("Email and password are required", 400)
      );
    }

    const user = await User.findOne({ email });
console.log("Login attempt for email:", email, user); // Debug log
    if (!user) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    // Build payload dynamically
    const payload: any = {
      userId: user._id.toString(),
      role: user.role,
    };

    // Only attach gymId if exists (owner/staff)
    if (user.gymId) {
      payload.gymId = user.gymId.toString();
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

/* ─── Helper: send OTP email ────────────────────────────────────────────── */
async function sendOtpEmail(to: string, otp: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_MAIL, pass: process.env.SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: `"TryTrakora" <${process.env.SMTP_MAIL}>`,
    to,
    subject: "Your Password Reset OTP — TryTrakora",
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin-top:0;color:#1e293b">Password Reset</h2>
        <p style="color:#475569">Use the OTP below to reset your TryTrakora account password. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:28px 0">
          <span style="display:inline-block;letter-spacing:10px;font-size:36px;font-weight:700;color:#2563eb;background:#eff6ff;padding:16px 24px;border-radius:8px">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/* ─── POST /auth/forgot-password ────────────────────────────────────────── */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) return next(new ErrorHandler("Email is required", 400));

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success to avoid email enumeration
    if (!user) {
      return res.status(200).json({ message: "If that email exists, an OTP has been sent." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    user.otpCode = await bcrypt.hash(otp, salt);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "If that email exists, an OTP has been sent." });
  } catch (err) {
    next(err);
  }
};

/* ─── POST /auth/verify-otp ─────────────────────────────────────────────── */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new ErrorHandler("Email and OTP are required", 400));

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.otpCode || !user.otpExpires) {
      return next(new ErrorHandler("Invalid or expired OTP", 400));
    }

    if (user.otpExpires < new Date()) {
      return next(new ErrorHandler("OTP has expired. Please request a new one.", 400));
    }

    const isValid = await bcrypt.compare(otp, user.otpCode);
    if (!isValid) return next(new ErrorHandler("Invalid OTP", 400));

    // Issue a short-lived reset token
    const resetToken = jwt.sign(
      { userId: user._id.toString(), purpose: "password_reset" },
      process.env.JWT_SECRET!,
      { expiresIn: "10m" }
    );

    // Clear OTP fields
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ resetToken });
  } catch (err) {
    next(err);
  }
};

/* ─── POST /auth/reset-password ─────────────────────────────────────────── */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return next(new ErrorHandler("Reset token and new password are required", 400));
    }

    let payload: any;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET!);
    } catch {
      return next(new ErrorHandler("Invalid or expired reset token", 400));
    }

    if (payload.purpose !== "password_reset") {
      return next(new ErrorHandler("Invalid reset token", 400));
    }

    const user = await User.findById(payload.userId);
    if (!user) return next(new ErrorHandler("User not found", 404));

    if (newPassword.length < 6) {
      return next(new ErrorHandler("Password must be at least 6 characters", 400));
    }

    user.passwordHash = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
};
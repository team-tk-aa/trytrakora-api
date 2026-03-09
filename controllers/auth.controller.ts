import { Request, Response, NextFunction } from "express";
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
import { Request, Response, NextFunction } from "express";
import Gym from "../models/Gym";
import User from "../models/User";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middleware/auth.middleware";

export const createGym = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gymName, ownerName, phone, email, password } = req.body;

    if (!gymName || !ownerName || !phone || !email || !password) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Prevent duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    // Create gym
    const gym = await Gym.create({
      name: gymName,
      ownerName,
      phone,
      email,
      subscriptionStatus: "active",
    });

    // Create owner user
    await User.create({
      email,
      passwordHash: password, // model will hash
      role: "owner",
      gymId: gym._id,
    });

    res.status(201).json({
      message: "Gym and owner created successfully",
      gymId: gym._id,
    });
  } catch (err) {
    next(err);
  }
};
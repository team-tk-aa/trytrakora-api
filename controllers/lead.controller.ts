import { Request, Response, NextFunction } from "express";
import Lead from "../models/Lead";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import Gym from "../models/Gym";
import User from "../models/User";

// Public - Create Lead
export const createLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gymName, ownerName, phone, email, currentMembers, message } = req.body;

    if (!gymName || !ownerName || !phone || !email) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    const lead = await Lead.create({
      gymName,
      ownerName,
      phone,
      email,
      currentMembers,
      message,
    });

    res.status(201).json({
      message: "Lead submitted successfully",
      leadId: lead._id,
    });
  } catch (err) {
    next(err);
  }
};

// Superadmin - View All Leads
export const getLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });

    res.status(200).json({ leads });
  } catch (err) {
    next(err);
  }
};

export const convertLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { leadId } = req.params;
    const { password } = req.body; // temporary password for owner

    if (!password) {
      return next(new ErrorHandler("Owner password required", 400));
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return next(new ErrorHandler("Lead not found", 404));
    }

    if (lead.status === "converted") {
      return next(new ErrorHandler("Lead already converted", 400));
    }

    // Create Gym
    const gym = await Gym.create({
      name: lead.gymName,
      ownerName: lead.ownerName,
      phone: lead.phone,
      email: lead.email,
      subscriptionStatus: "active",
    });

    // Create Owner User
    await User.create({
      email: lead.email,
      passwordHash: password,
      role: "owner",
      gymId: gym._id,
    });

    // Update Lead Status
    lead.status = "converted";
    lead.convertedAt = new Date();
    await lead.save();

    res.status(200).json({
      message: "Lead converted successfully",
      gymId: gym._id,
    });
  } catch (err) {
    next(err);
  }
};
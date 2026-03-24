import { Request, Response, NextFunction } from "express";
import Lead from "../models/Lead";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import Gym from "../models/Gym";
import User from "../models/User";
import sendEmail from "../utils/sendEmail";

// Public - Create Lead
export const createLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gymName, ownerName, phone, email, city, currentMembers, message } = req.body;

    if (!gymName || !ownerName || !phone || !email) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    const lead = await Lead.create({
      gymName,
      ownerName,
      phone,
      email,
      city,
      currentMembers,
      message,
    } as any);

    // Notify admin about new lead (non-blocking — email failure must not fail the request)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        email: adminEmail,
        subject: `New Lead: ${gymName} – ${ownerName}`,
        template: "newLead.ejs",
        data: {
          gymName,
          ownerName,
          email,
          phone,
          city,
          currentMembers,
          message,
          submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          adminUrl: `${process.env.CLIENT_URL}/secured/leads`,
        },
      }).catch((err) => console.error("[Email] New-lead notification failed:", err?.message));
    }

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

    // Send welcome email (non-blocking — email failure must not fail the request)
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    sendEmail({
      email: lead.email,
      subject: "Welcome to Trakora – Your Login Credentials",
      template: "gymWelcome.ejs",
      data: {
        ownerName: lead.ownerName,
        gymName: lead.gymName,
        email: lead.email,
        tempPassword: password,
        loginUrl,
      },
    }).catch((err) => console.error("[Email] Welcome email failed:", err?.message));

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
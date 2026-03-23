import { Request, Response, NextFunction } from "express";
import Gym from "../models/Gym";
import User from "../models/User";
import Member from "../models/Member";
import Renewal from "../models/Renewal";
import Lead from "../models/Lead";
import GymSubscriptionPayment from "../models/GymSubscriptionPayment";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";

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

// Superadmin - Get All Gyms with payment stats
export const getGyms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const gyms = await Gym.find().sort({ createdAt: -1 }).lean();

    const gymIds = gyms.map((g) => g._id);

    // Aggregate total revenue and monthly revenue per gym from renewals
    const revenueAgg = await Renewal.aggregate([
      { $match: { gymId: { $in: gymIds } } },
      {
        $group: {
          _id: "$gymId",
          totalRevenue: { $sum: "$amount" },
          monthlyRevenue: {
            $sum: {
              $cond: [{ $gte: ["$renewedOn", startOfMonth] }, "$amount", 0],
            },
          },
          totalRenewals: { $sum: 1 },
        },
      },
    ]);

    // Aggregate member counts per gym
    const memberAgg = await Member.aggregate([
      { $match: { gymId: { $in: gymIds } } },
      {
        $group: {
          _id: "$gymId",
          totalMembers: { $sum: 1 },
          activeMembers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
        },
      },
    ]);

    const revenueMap = new Map(revenueAgg.map((r) => [r._id.toString(), r]));
    const memberMap = new Map(memberAgg.map((m) => [m._id.toString(), m]));

    const result = gyms.map((gym) => {
      const id = (gym._id as mongoose.Types.ObjectId).toString();
      const rev = revenueMap.get(id);
      const mem = memberMap.get(id);
      return {
        ...gym,
        totalRevenue: rev?.totalRevenue ?? 0,
        monthlyRevenue: rev?.monthlyRevenue ?? 0,
        totalRenewals: rev?.totalRenewals ?? 0,
        totalMembers: mem?.totalMembers ?? 0,
        activeMembers: mem?.activeMembers ?? 0,
      };
    });

    res.status(200).json({ gyms: result });
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
    const { password } = req.body;

    if (!password) {
      return next(new ErrorHandler("Password is required", 400));
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return next(new ErrorHandler("Lead not found", 404));
    if (lead.status === "converted") {
      return next(new ErrorHandler("Lead is already converted", 400));
    }

    const existingUser = await User.findOne({ email: lead.email });
    if (existingUser) {
      return next(new ErrorHandler("A user with this email already exists", 400));
    }

    const gym = await Gym.create({
      name: lead.gymName,
      ownerName: lead.ownerName,
      phone: lead.phone,
      email: lead.email,
      subscriptionStatus: "active",
    });

    await User.create({
      email: lead.email,
      passwordHash: password,
      role: "owner",
      gymId: gym._id,
    });

    lead.status = "converted";
    lead.convertedAt = new Date();
    await lead.save();

    res.status(201).json({
      message: "Lead converted to gym successfully",
      gymId: gym._id,
    });
  } catch (err) {
    next(err);
  }
};

export const updateLeadStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    const validStatuses = ["new", "contacted", "converted"];
    if (!status || !validStatuses.includes(status)) {
      return next(new ErrorHandler("Invalid status value", 400));
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return next(new ErrorHandler("Lead not found", 404));

    if (lead.status === "converted" && status !== "converted") {
      return next(new ErrorHandler("Cannot revert a converted lead", 400));
    }

    lead.status = status;
    await lead.save();

    res.status(200).json({ message: "Lead status updated", lead });
  } catch (err) {
    next(err);
  }
};

// Superadmin - Platform-wide dashboard stats
export const getSuperAdminDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalGyms,
      activeGyms,
      totalMembers,
      activeMembers,
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      revenueAgg,
    ] = await Promise.all([
      Gym.countDocuments(),
      Gym.countDocuments({ subscriptionStatus: "active" }),
      Member.countDocuments(),
      Member.countDocuments({ status: "active" }),
      Lead.countDocuments(),
      Lead.countDocuments({ status: "new" }),
      Lead.countDocuments({ status: "contacted" }),
      Lead.countDocuments({ status: "converted" }),
      Renewal.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            monthlyRevenue: {
              $sum: {
                $cond: [{ $gte: ["$renewedOn", startOfMonth] }, "$amount", 0],
              },
            },
            monthlyRenewals: {
              $sum: {
                $cond: [{ $gte: ["$renewedOn", startOfMonth] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const rev = revenueAgg[0] ?? { totalRevenue: 0, monthlyRevenue: 0, monthlyRenewals: 0 };

    res.status(200).json({
      totalGyms,
      activeGyms,
      totalMembers,
      activeMembers,
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      totalRevenue: rev.totalRevenue,
      monthlyRevenue: rev.monthlyRevenue,
      monthlyRenewals: rev.monthlyRenewals,
    });
  } catch (err) {
    next(err);
  }
};

// Superadmin - Record a subscription payment received from a gym owner
export const recordSubscriptionPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gymId } = req.params;
    const { amount, paymentMethod, paidOn, note, subscriptionStatus } = req.body;

    if (!amount || !paymentMethod) {
      return next(new ErrorHandler("amount and paymentMethod are required", 400));
    }

    const gym = await Gym.findById(gymId);
    if (!gym) return next(new ErrorHandler("Gym not found", 404));

    const payment = await GymSubscriptionPayment.create({
      gymId,
      amount,
      paymentMethod,
      paidOn: paidOn ? new Date(paidOn) : new Date(),
      note,
      recordedBy: req.user?.userId,
    });

    // Optionally update the gym's subscription status and next due date
    if (subscriptionStatus) {
      gym.subscriptionStatus = subscriptionStatus;
    }
    if (req.body.subscriptionFee !== undefined) {
      gym.subscriptionFee = req.body.subscriptionFee;
    }
    if (req.body.subscriptionDueDate) {
      gym.subscriptionDueDate = new Date(req.body.subscriptionDueDate);
    }
    await gym.save();

    res.status(201).json({ message: "Payment recorded successfully", payment });
  } catch (err) {
    next(err);
  }
};

// Superadmin - Get subscription payment history for a gym
export const getGymSubscriptionPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gymId } = req.params;

    const gym = await Gym.findById(gymId).lean();
    if (!gym) return next(new ErrorHandler("Gym not found", 404));

    const payments = await GymSubscriptionPayment.find({ gymId })
      .sort({ paidOn: -1 })
      .lean();

    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({ gym, payments, totalReceived });
  } catch (err) {
    next(err);
  }
};

// Superadmin - Update gym subscription status / fee
export const updateGymSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gymId } = req.params;
    const { subscriptionStatus, subscriptionFee, subscriptionDueDate } = req.body;

    const gym = await Gym.findById(gymId);
    if (!gym) return next(new ErrorHandler("Gym not found", 404));

    if (subscriptionStatus) gym.subscriptionStatus = subscriptionStatus;
    if (subscriptionFee !== undefined) gym.subscriptionFee = subscriptionFee;
    if (subscriptionDueDate) gym.subscriptionDueDate = new Date(subscriptionDueDate);

    await gym.save();
    res.status(200).json({ message: "Gym subscription updated", gym });
  } catch (err) {
    next(err);
  }
};
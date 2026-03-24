import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import Member from "../models/Member";
import ErrorHandler from "../utils/ErrorHandler";
import Plan from "../models/Plan";
import Renewal from "../models/Renewal";

export const createMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {

    const { name, phone, email, planId, discount = 0 } = req.body;

    if (!name || !phone || !planId) {
      return next(new ErrorHandler("name, phone and planId are required", 400));
    }

    const gymId = req.user?.gymId;

    // Per-gym duplicate checks (explicit for clear error messages)
    const phoneExists = await Member.exists({ gymId, phone });
    if (phoneExists) {
      return next(new ErrorHandler("A member with this phone number already exists in this gym", 400));
    }
    if (email) {
      const emailExists = await Member.exists({ gymId, email });
      if (emailExists) {
        return next(new ErrorHandler("A member with this email already exists in this gym", 400));
      }
    }

    // find plan
    const plan = await Plan.findOne({
      _id: planId,
      gymId
    });

    if (!plan) {
      return next(new ErrorHandler("Plan not found", 404));
    }

    // calculate dates
    const startDate = new Date();

    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const planPrice = plan.price;

    const finalAmount = Math.max(0, planPrice - (planPrice * discount / 100));

    const member = await Member.create({
      gymId,
      name,
      phone,
      // store undefined rather than empty string so sparse index works correctly
      email: email || undefined,

      planId: plan._id,
      planName: plan.name,
      planPrice,

      discount,
      finalAmount,

      startDate,
      endDate
    });

    // Record initial enrollment as a renewal so revenue is tracked
    await Renewal.create({
      gymId,
      memberId: member._id,
      previousEndDate: startDate,
      newEndDate: endDate,
      amount: finalAmount,
      planName: plan.name,
      type: 'new',
      renewedOn: startDate,
    });

    res.status(201).json({ member });

  } catch (err) {
    next(err);
  }
};

export const getMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const members = await Member.find({
            gymId: req.user?.gymId
        }).sort({ createdAt: -1 });

        res.status(200).json({ members });

    } catch (err) {
        next(err);
    }
};

export const updateMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const { name, phone, email } = req.body;
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;

        const gymId = new Types.ObjectId(req.user!.gymId);
        const memberId = new Types.ObjectId(req.params.id as string);

        if (phone !== undefined) {
            const conflict = await Member.exists({ gymId, phone, _id: { $ne: memberId } });
            if (conflict) {
                return next(new ErrorHandler("A member with this phone number already exists in this gym", 400));
            }
            updates.phone = phone;
        }

        if (email !== undefined) {
            const normalized = email || undefined;
            if (normalized) {
                const conflict = await Member.exists({ gymId, email: normalized, _id: { $ne: memberId } });
                if (conflict) {
                    return next(new ErrorHandler("A member with this email already exists in this gym", 400));
                }
            }
            updates.email = normalized;
        }

        const member = await Member.findOneAndUpdate(
            {
                _id: req.params.id,
                gymId: req.user?.gymId
            },
            updates,
            { new: true }
        );

        if (!member) {
            return next(new ErrorHandler("Member not found", 404));
        }

        res.status(200).json({ member });

    } catch (err) {
        next(err);
    }
};

export const bulkImportMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const gymId = req.user?.gymId;
    const { members: rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return next(new ErrorHandler("members array is required", 400));
    }

    const succeeded: number[] = [];
    const errors: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { name, phone, email, planId, discount = 0 } = rows[i];
      try {
        if (!name || !phone || !planId) {
          throw new Error("name, phone and planId are required");
        }

        const phoneExists = await Member.exists({ gymId, phone });
        if (phoneExists) throw new Error("A member with this phone number already exists in this gym");

        if (email) {
          const emailExists = await Member.exists({ gymId, email });
          if (emailExists) throw new Error("A member with this email already exists in this gym");
        }

        const plan = await Plan.findOne({ _id: planId, gymId });
        if (!plan) throw new Error("Plan not found");

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.durationDays);

        const planPrice = plan.price;
        const finalAmount = Math.max(0, planPrice - (planPrice * discount / 100));

        const member = await Member.create({
          gymId,
          name,
          phone,
          email: email || undefined,
          planId: plan._id,
          planName: plan.name,
          planPrice,
          discount,
          finalAmount,
          startDate,
          endDate,
        });

        await Renewal.create({
          gymId,
          memberId: member._id,
          previousEndDate: startDate,
          newEndDate: endDate,
          amount: finalAmount,
          planName: plan.name,
          type: 'new',
          renewedOn: startDate,
        });

        succeeded.push(i + 1);
      } catch (err: any) {
        errors.push({
          row: i + 1,
          name: rows[i].name || `Row ${i + 1}`,
          reason: err.message || "Unknown error",
        });
      }
    }

    res.status(200).json({
      succeeded: succeeded.length,
      failed: errors.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
};

export const getExpiringMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const today = new Date();
        const next7Days = new Date();
        next7Days.setDate(today.getDate() + 7);

        const members = await Member.find({
            gymId: req.user?.gymId,
            endDate: { $lte: next7Days },
            status: "active"
        });

        res.status(200).json({ members });

    } catch (err) {
        next(err);
    }
};


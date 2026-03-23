import { Request, Response, NextFunction } from "express";
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

    const { name, phone, planId, discount = 0 } = req.body;

    if (!name || !phone || !planId) {
      return next(new ErrorHandler("name, phone and planId are required", 400));
    }

    const gymId = req.user?.gymId;

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
        if (phone !== undefined) updates.phone = phone;
        if (email !== undefined) updates.email = email;

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
      const { name, phone, planId, discount = 0 } = rows[i];
      try {
        if (!name || !phone || !planId) {
          throw new Error("name, phone and planId are required");
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


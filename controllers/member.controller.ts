import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Member from "../models/Member";
import ErrorHandler from "../utils/ErrorHandler";
import Plan from "../models/Plan";

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

    const finalAmount = planPrice - discount;

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

        const member = await Member.findOneAndUpdate(
            {
                _id: req.params.id,
                gymId: req.user?.gymId
            },
            req.body,
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


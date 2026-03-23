import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Member from "../models/Member";
import Plan from "../models/Plan";
import ErrorHandler from "../utils/ErrorHandler";
import Renewal from "../models/Renewal";

export const renewMember = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const { memberId, planId, newEndDate, amount } = req.body;

        const member = await Member.findOne({
            _id: memberId,
            gymId: req.user?.gymId
        });

        if (!member) {
            return next(new ErrorHandler("Member not found", 404));
        }

        const plan = planId ? await Plan.findOne({ _id: planId, gymId: req.user?.gymId }) : null;

        const renewal = await Renewal.create({
            gymId: req.user?.gymId,
            memberId: member._id,
            previousEndDate: member.endDate,
            newEndDate,
            amount,
            planName: plan?.name ?? member.planName ?? '',
            type: 'renewal',
        });

        // update member
        member.endDate = newEndDate;
        member.status = "active";
        member.followUpStatus = "renewed";

        await member.save();

        res.status(200).json({
            message: "Membership renewed successfully",
            renewal
        });

    } catch (err) {
        next(err);
    }
};

export const getRenewals = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const renewals = await Renewal.find({
            gymId: req.user?.gymId
        })
            .populate("memberId", "name phone")
            .sort({ renewedOn: -1, createdAt: -1 });

        const mapped = renewals.map(r => {
            const pop = r.memberId as any;
            return {
                _id: r._id,
                memberId: pop?._id?.toString() ?? r.memberId.toString(),
                memberName: pop?.name ?? 'Unknown',
                planName: (r as any).planName || '',
                renewedAt: (r.renewedOn ?? (r as any).createdAt)?.toISOString?.() ?? new Date().toISOString(),
                amount: r.amount,
                type: (r as any).type || 'renewal',
            };
        });

        res.status(200).json({ renewals: mapped });

    } catch (err) {
        next(err);
    }
};
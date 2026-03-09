import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Member from "../models/Member";
import ErrorHandler from "../utils/ErrorHandler";
import Renewal from "../models/Renewal";

export const renewMember = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const { memberId, newEndDate, amount } = req.body;

        const member = await Member.findOne({
            _id: memberId,
            gymId: req.user?.gymId
        });

        if (!member) {
            return next(new ErrorHandler("Member not found", 404));
        }

        const renewal = await Renewal.create({
            gymId: req.user?.gymId,
            memberId: member._id,
            previousEndDate: member.endDate,
            newEndDate,
            amount
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
            .sort({ createdAt: -1 });

        res.status(200).json({ renewals });

    } catch (err) {
        next(err);
    }
};
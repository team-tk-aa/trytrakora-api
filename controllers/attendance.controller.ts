import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Attendance from "../models/Attendance";
import ErrorHandler from "../utils/ErrorHandler";
import Member from "../models/Member";

export const checkInMember = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { memberId } = req.body;

        const member = await Member.findOne({
            _id: memberId,
            gymId: req.user?.gymId
        });

        if (!member) {
            return next(new ErrorHandler("Member not found", 404));
        }

        const attendance = await Attendance.create({
            gymId: req.user?.gymId,
            memberId: member._id
        });

        res.status(201).json({ attendance });

    } catch (err) {
        next(err);
    }
};

export const getAttendance = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {

    const attendance = await Attendance.find({
        gymId: req.user?.gymId
    })
        .populate("memberId", "name phone")
        .sort({ createdAt: -1 });

    res.status(200).json({ attendance });

};

export const getInactiveMembers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveMembers = await Member.aggregate([
        {
            $match: {
                gymId: req.user?.gymId
            }
        },
        {
            $lookup: {
                from: "attendances",
                localField: "_id",
                foreignField: "memberId",
                as: "attendance"
            }
        },
        {
            $addFields: {
                lastVisit: { $max: "$attendance.createdAt" }
            }
        },
        {
            $match: {
                lastVisit: { $lt: sevenDaysAgo }
            }
        }
    ]);

    res.status(200).json({ inactiveMembers });

};
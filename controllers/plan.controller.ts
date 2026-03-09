import { Response, NextFunction } from "express";
import Plan from "../models/Plan";
import { AuthRequest } from "../middleware/auth.middleware";
import ErrorHandler from "../utils/ErrorHandler";
import PlanPriceHistory from "../models/PlanPriceHistory";
import Member from "../models/Member";

export const createPlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const { name, durationDays, price } = req.body;

        if (!name || !durationDays || !price) {
            return next(new ErrorHandler("All fields required", 400));
        }

        const plan = await Plan.create({
            gymId: req.user?.gymId,
            name,
            durationDays,
            price
        });

        res.status(201).json({ plan: { _id: plan._id, name: plan.name, durationDays: plan.durationDays, price: plan.price } });

    } catch (err) {
        next(err);
    }
};

export const getPlans = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const plans = await Plan.find({
            gymId: req.user?.gymId
        }).select('_id name durationDays price').sort({ createdAt: -1 });

        res.status(200).json({ plans });

    } catch (err) {
        next(err);
    }
};

export const deletePlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const plan = await Plan.findOne({
            _id: req.params.id,
            gymId: req.user?.gymId
        });

        if (!plan) {
            return next(new ErrorHandler("Plan not found", 404));
        }

        // Check if any members are using this plan
        const membersUsingPlan = await Member.find({
            gymId: req.user?.gymId,
            planId: req.params.id
        });

        if (membersUsingPlan.length > 0) {
            return next(new ErrorHandler("Cannot delete plan as it is currently assigned to members", 400));
        }

        await Plan.findOneAndDelete({
            _id: req.params.id,
            gymId: req.user?.gymId
        });

        res.status(200).json({
            message: "Plan deleted successfully"
        });

    } catch (err) {
        next(err);
    }
};



export const updatePlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {

    const plan = await Plan.findOne({
        _id: req.params.id,
        gymId: req.user?.gymId
    });

    if (!plan) {
        return next(new ErrorHandler("Plan not found", 404));
    }

    const oldPrice = plan.price;
    const newPrice = req.body.price;

    if (oldPrice !== newPrice) {

        await PlanPriceHistory.create({
            gymId: req.user?.gymId,
            planId: plan._id,
            planName: plan.name,
            oldPrice,
            newPrice
        });

    }

    plan.price = newPrice;
    plan.durationDays = req.body.durationDays || plan.durationDays;

    await plan.save();

    res.status(200).json({ plan: { _id: plan._id, name: plan.name, durationDays: plan.durationDays, price: plan.price } });

};
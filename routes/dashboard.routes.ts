import express from "express";
import { protect } from "../middleware/auth.middleware";
import { getDashboardStats } from "../controllers/dashboard.controller";

const dashboardRouter = express.Router();

dashboardRouter.get("/dashboard", protect, getDashboardStats);

export default dashboardRouter;
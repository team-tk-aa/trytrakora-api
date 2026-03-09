import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
} from "../controllers/plan.controller";

const planRouter = express.Router();

planRouter.post("/plans", protect, createPlan);

planRouter.get("/plans", protect, getPlans);

planRouter.put("/plans/:id", protect, updatePlan);

planRouter.delete("/plans/:id", protect, deletePlan);

export default planRouter;
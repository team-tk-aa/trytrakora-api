import express from "express";
import { protect } from "../middleware/auth.middleware";
import { restrictTo } from "../middleware/role.middleware";
import { createGym } from "../controllers/admin.controller";

const adminRouter = express.Router();

adminRouter.post(
  "/create-gym",
  protect,
  restrictTo("superadmin"),
  createGym
);

export default adminRouter;
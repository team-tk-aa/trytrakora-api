import express from "express";
import { protect } from "../middleware/auth.middleware";
import { renewMember, getRenewals } from "../controllers/renewal.controller";
import { restrictTo } from "../middleware/role.middleware";

const renewalRouter = express.Router();

renewalRouter.post("/renewals", protect, restrictTo("owner"), renewMember);

renewalRouter.get("/renewals", protect, restrictTo("owner"), getRenewals);

export default renewalRouter;
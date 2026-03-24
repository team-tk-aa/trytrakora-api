require("dotenv").config();
import connectDB from "../utils/db";
import { runRenewalReminder } from "../jobs/renewalReminder.job";

(async () => {
  await connectDB();
  console.log("[Test] Running renewal reminder job...");
  await runRenewalReminder();
  console.log("[Test] Done.");
  process.exit(0);
})();

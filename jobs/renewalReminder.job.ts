import cron from "node-cron";
import Member from "../models/Member";

cron.schedule("0 9 * * *", async () => {

  const today = new Date();

  const next3Days = new Date();
  next3Days.setDate(today.getDate() + 3);

  const expiringMembers = await Member.find({
    endDate: { $lte: next3Days },
    status: "active"
  });

  console.log("Members expiring soon:", expiringMembers.length);

});
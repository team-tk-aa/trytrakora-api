import cron from "node-cron";
import Member from "../models/Member";
import Gym from "../models/Gym";
import sendEmail from "../utils/sendEmail";

export async function runRenewalReminder() {
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  const expiringMembers = await Member.find({
    endDate: { $gte: today, $lte: next7Days },
    status: "active",
  }).lean();

  if (expiringMembers.length === 0) {
    console.log("[RenewalReminder] No members expiring in the next 7 days.");
    return;
  }

  // Group by gymId
  const byGym = new Map<string, typeof expiringMembers>();
  for (const member of expiringMembers) {
    const key = member.gymId.toString();
    if (!byGym.has(key)) byGym.set(key, []);
    byGym.get(key)!.push(member);
  }

  console.log(`[RenewalReminder] Sending reminders for ${byGym.size} gym(s), ${expiringMembers.length} member(s).`);

  for (const [gymId, members] of byGym.entries()) {
    const gym = await Gym.findById(gymId).lean();
    if (!gym || !gym.email) {
      console.warn(`[RenewalReminder] Gym ${gymId} not found or has no email. Skipping.`);
      continue;
    }

    try {
      await sendEmail({
        email: gym.email,
        subject: `⚠️ ${members.length} member${members.length > 1 ? "s" : ""} expiring soon — ${gym.name}`,
        template: "expiryReminder.ejs",
        data: {
          gymName: gym.name,
          ownerName: gym.ownerName,
          members,
        },
      });
      console.log(`[RenewalReminder] Email sent to ${gym.email} (${gym.name}) — ${members.length} member(s).`);
    } catch (emailErr) {
      console.error(`[RenewalReminder] Failed to send email to ${gym.email}:`, emailErr);
    }
  }
}

/**
 * Runs every day at 9:00 AM.
 */
cron.schedule("0 9 * * *", async () => {
  try {
    await runRenewalReminder();
  } catch (err) {
    console.error("[RenewalReminder] Job failed:", err);
  }
});


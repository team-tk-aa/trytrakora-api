import axios from "axios";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";


/**
 * Send OTP via WhatsApp Cloud API intelligently
 * Uses template if first message, plain text if user already messaged you
 * @param mobile User mobile number including country code (no +)
 * @param otp OTP string
 */
export async function sendWhatsAppOtpSmart(mobile: string, otp: string) {
  try {
    // Check if user has an active session (i.e., messaged you before)
    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/contacts?blocking=wait&contacts=${mobile}`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );

    //@ts-ignore
    const userExists = response.data.contacts?.[0]?.status === "valid";

    // Build payload based on whether user exists
    const payload = userExists
      ? {
          messaging_product: "whatsapp",
          to: mobile,
          type: "text",
          text: {
            body: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
          },
        }
      : {
          messaging_product: "whatsapp",
          to: mobile,
          type: "template",
          template: {
            name: "otp_template", // pre-approved template name
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otp }],
              },
            ],
          },
        };

    await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ WhatsApp OTP sent to ${mobile} (${userExists ? "plain text" : "template"})`);
  } catch (err: any) {
    console.error("❌ WhatsApp OTP send failed:", err.response?.data || err.message);
    throw new Error("Failed to send WhatsApp OTP");
  }
}

/**
 * Placeholder for SMS OTP (Twilio, MSG91, etc.)
 */
export async function sendSmsOtp(mobile: string, otp: string) {
  console.log(`📩 SMS OTP ${otp} sent to ${mobile}`);
  // TODO: integrate with SMS provider later
}

import axios from "axios";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: any;
    cc?: string;
    bcc?: string;
}

const sendViaSMTP = async (mailOptions: any) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: true,
        requireTLS: true,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    await transporter.sendMail(mailOptions);
};

const sendViaResend = async (mailOptions: any) => {
    const normalizeRecipients = (value?: string | string[]) => {
        if (!value) return undefined;

        const emails = Array.isArray(value)
            ? value
            : value.split(",").map((email: string) => email.trim());

        return emails.filter(Boolean);
    };

    const payload: any = {
        from: mailOptions.from,
        to: normalizeRecipients(mailOptions.to) || [],
        subject: mailOptions.subject,
        html: mailOptions.html,
    };

    const ccList = normalizeRecipients(mailOptions.cc);
    const bccList = normalizeRecipients(mailOptions.bcc);

    if (ccList?.length) {
        payload.cc = ccList;
    }

    if (bccList?.length) {
        payload.bcc = bccList;
    }

    if (process.env.RESEND_REPLY_TO) {
        payload.reply_to = process.env.RESEND_REPLY_TO;
    }

    await axios.post("https://api.resend.com/emails", payload, {
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
};

const sendEmail = async (options: EmailOptions): Promise<void> => {
    let { email, subject, template, data, cc, bcc } = options;

    // Add admin BCC
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        if (!bcc) {
            bcc = adminEmail;
        } else if (!bcc.split(",").map(e => e.trim()).includes(adminEmail)) {
            bcc += `,${adminEmail}`;
        }
    }

    const templatePath = path.join(__dirname, "../mails/", template);
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL || `"TryTrakora" <${process.env.SMTP_MAIL || process.env.MSG91_FROM_EMAIL}>`,
        to: email,
        subject,
        html,
        cc,
        bcc,
    };

    const provider = (process.env.EMAIL_PROVIDER || "RESEND").toUpperCase();

    try {
        switch (provider) {
            case "RESEND":
                console.log("Sending email via Resend");
                await sendViaResend(mailOptions);
                break;

            case "SMTP":
            default:
                console.log("Sending email via SMTP");
                await sendViaSMTP(mailOptions);
                break;
        }

        console.log("Email sent successfully");
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            console.error("Email provider error status:", err.response?.status);
            console.error("Email provider error data:", err.response?.data);
            console.error("Email provider error headers:", err.response?.headers);
            console.error("Email provider error message:", err.message);
        } else {
            console.error("Email sending failed:", err);
        }
        throw err;
    }
};

export default sendEmail;
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

const sendViaMSG91 = async (mailOptions: any) => {
    const payload: any = {
        to: [
            {
                email: mailOptions.to,
            },
        ],
        from: {
            email: process.env.MSG91_FROM_EMAIL,
            name: "TryTrakora",
        },
        subject: mailOptions.subject,
        html: mailOptions.html,
    };

    if (mailOptions.cc) {
        payload.cc = mailOptions.cc.split(",").map((email: string) => ({
            email: email.trim(),
        }));
    }

    if (mailOptions.bcc) {
        payload.bcc = mailOptions.bcc.split(",").map((email: string) => ({
            email: email.trim(),
        }));
    }

    await axios.post(
        "https://control.msg91.com/api/v5/email/send",
        payload,
        {
            headers: {
                authkey: process.env.MSG91_AUTH_KEY,
                "Content-Type": "application/json",
            },
        }
    );
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
        from: `"TryTrakora" <${process.env.SMTP_MAIL || process.env.MSG91_FROM_EMAIL}>`,
        to: email,
        subject,
        html,
        cc,
        bcc,
    };

    const provider = (process.env.EMAIL_PROVIDER || "SMTP").toUpperCase();

    try {
        switch (provider) {
            case "MSG91":
                console.log("Sending email via MSG91");
                await sendViaMSG91(mailOptions);
                break;

            case "SMTP":
            default:
                console.log("Sending email via SMTP");
                await sendViaSMTP(mailOptions);
                break;
        }

        console.log("Email sent successfully");
    } catch (err) {
        console.error("Email sending failed:", err);
        throw err;
    }
};

export default sendEmail;
require("dotenv").config();
import nodemailer, { Transporter } from "nodemailer";
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

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string,           // e.g., "smtp.gmail.com"
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,       // TLS via STARTTLS
    auth: {
      user: process.env.SMTP_MAIL,       // Gmail address
      pass: process.env.SMTP_PASSWORD,   // App password
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });


  let { email, subject, template, data, cc, bcc } = options;

  // ✅ Always BCC admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    if (!bcc) {
      bcc = adminEmail;
    } else if (!bcc.includes(adminEmail)) {
      bcc = `${bcc},${adminEmail}`;
    }
  }

  // Template path
  const templatePath = path.join(__dirname, "../mails", template);

  try {
    const html = await ejs.renderFile(templatePath, data) as string;

    await transporter.sendMail({
      from: `"Juris&Journa" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject,
      html,
      cc,
      bcc,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

export default sendEmail;

require("dotenv").config();
import nodeMailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
    email: string,
    subject: string,
    template: string,
    data: any,
    cc?: string,
    bcc?: string // Added bcc as optional
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
    const transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    try {
        await transporter.verify();
        console.log("SMTP VERIFIED");
    } catch (err) {
        console.log("VERIFY ERROR:", err);
    }

    let { email, subject, template, data, cc, bcc } = options;
    // Always BCC admin email unless already present
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        if (!bcc) {
            bcc = adminEmail;
        } else if (typeof bcc === 'string' && !bcc.split(',').map(e => e.trim()).includes(adminEmail)) {
            bcc = bcc + ',' + adminEmail;
        }
    }

    //get the template path
    const templatePath = path.join(__dirname, "../mails/", template);
    //render the email template

    console.log("templatePath", templatePath)
    console.log("email", email)
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_MAIL:", process.env.SMTP_MAIL);
    console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "****" : "NOT SET");
    try {
        const html: string = await ejs.renderFile(templatePath, (data));
        const mailOptions = {
            from: `"TryTrakora" <${process.env.SMTP_MAIL}>`, // Add a display name
            to: email,
            subject,
            html,
            cc,
            bcc
        };
        // Send the email
        await transporter.sendMail(mailOptions);

    } catch (error: any) {
        console.log(error)
    }

};

export default sendEmail;
// services/emailService.js
import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text, html) => {
    try {
        // Create a transporter (configure for your email provider)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Send email
        const info = await transporter.sendMail({
            from: `"Your App" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            text,
            html
        });

        console.log(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export default sendEmail;
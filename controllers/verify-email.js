// Updated verify-email.js
import otpGenerator from 'otp-generator';
import OTP from '../models/OTP.js';
import InstituteAdmin from '../models/Admin.js';
import sendEmail from '../service/email-service.js';

const verifyAdminEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new errorResponse("Email is required", 400, "EMAIL_REQUIRED");
        }

        // Check for existing admin
        const existingAdmin = await InstituteAdmin.findOne({ email });
        if (existingAdmin) {
            throw new errorResponse("Email already exists", 409, "EMAIL_EXISTS");
        }

        // Generate OTP
        let otp, result;
        let retries = 0;
        const maxRetries = 5;

        do {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp });
            retries++;
        } while (result && retries < maxRetries);

        if (result) {
            throw new errorResponse("Failed to generate unique OTP", 500, "OTP_GENERATION_FAILED");
        }

        // Store OTP
        await OTP.create({ email, otp, user: "Admin" });

        // Send email with OTP
        const subject = "Email Verification - Your OTP Code";
        const text = `Your verification code is: ${otp}. It is valid for 10 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Email Verification</h2>
                <p>Please use the following code to verify your email address:</p>
                <div style="background-color: #f4f4f4; padding: 12px; font-size: 24px; text-align: center; letter-spacing: 6px; font-weight: bold;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this verification, please ignore this email.</p>
            </div>
        `;

        await sendEmail(email, subject, text, html);

        res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
        console.error("Error in verifyAdminEmail:", err);
        next(err);
    }
};

export default verifyAdminEmail;
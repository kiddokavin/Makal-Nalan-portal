const nodemailer = require('nodemailer');

/**
 * Sends a styled HTML email containing the 6-digit OTP passcode to the administrator.
 * @param {string} email - Recipient administrator email
 * @param {string} otp - 6-digit verification code
 * @returns {Promise} nodemailer send response promise
 */
async function sendOTPEmail(email, otp) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Validate email configuration
    if (!host || !user || !pass) {
        throw new Error("SMTP server credentials are not fully configured in the environment variables.");
    }

    const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: port === '465', // SSL connection on 465, TLS/STARTTLS on others
        auth: {
            user: user,
            pass: pass
        }
    });

    const htmlContent = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <!-- Header Brand block -->
            <div style="background-color: #7A0016; padding: 25px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">மக்கள் நலன்</h1>
                <p style="color: #ffffff; margin: 4px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">MAKKAL NALAN - Admin Verification</p>
            </div>
            
            <!-- Message Body block -->
            <div style="padding: 35px 30px; background-color: #ffffff; color: #1e293b;">
                <h2 style="font-size: 18px; margin-top: 0; color: #0F0F16; font-weight: 600;">நிர்வாக உள்நுழைவுக்கான OTP / One-Time Passcode</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569;">வணக்கம், உங்களது மக்கள் நலன் நிர்வாகப் பக்கத்தில் உள்நுழைவதற்கான ஒற்றை முறை கடவுச்சொல் (OTP) கீழே தரப்பட்டுள்ளது.</p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px;">Dear Administrator, your One-Time Passcode (OTP) for admin control room login is:</p>
                
                <!-- Display OTP box -->
                <div style="text-align: center; margin: 30px 0; background-color: #f8fafc; border: 2px dashed #7A0016; border-radius: 12px; padding: 20px 15px;">
                    <span style="font-size: 34px; font-weight: 800; color: #7A0016; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                </div>
                
                <!-- Warnings -->
                <p style="font-size: 12px; color: #ef4444; line-height: 1.5; margin-bottom: 30px;">
                    * இந்த கடவுச்சொல் அடுத்த 5 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும்.<br>
                    * This passcode is valid for the next 5 minutes only.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
                    26 TVK IT Wing Grievance Redressal System • Controlled by @26_tvk_it_wing_<br>
                    Please do not share this passcode with anyone.
                </p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"Makkal Nalan Admin Room" <${user}>`,
        to: email,
        subject: `[Passcode: ${otp}] Makkal Nalan Admin Access Request`,
        html: htmlContent
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };

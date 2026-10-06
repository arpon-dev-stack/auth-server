import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (to: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Your Authentication OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="color: #4A90E2; letter-spacing: 4px;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `,
  });
};

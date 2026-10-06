import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { forgotPasswordSchema, resetPasswordSchema } from "../lib/validations.js";
import { generateOTP } from "../lib/tokens.js";
import { sendOTPEmail } from "../lib/mailer.js";

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await db.orm.public.User.where({ email }).first();
    if (!user) {
      // Prevents user enumeration by sending a generic message
      res.status(200).json({ message: "If an account exists, an OTP has been sent." });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Check if an existing OTP record exists for this user
    const existingOtp = await db.orm.public.UserOtp.where({ userId: user.id }).first();

    if (existingOtp) {
      await db.orm.public.UserOtp.where({ id: existingOtp.id }).update({
        otp,
        otpExpiry,
      });
    } else {
      await db.orm.public.UserOtp.create({
        userId: user.id,
        otp,
        otpExpiry,
      });
    }

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "Password reset OTP sent to email." });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Request failed" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

    // Get the user by email
    const user = await db.orm.public.User.where({ email }).first();
    if (!user) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Get the associated OTP record for the user
    const otpRecord = await db.orm.public.UserOtp.where({ userId: user.id }).first();

    if (
      !otpRecord ||
      otpRecord.otp !== otp ||
      !otpRecord.otpExpiry ||
      new Date(otpRecord.otpExpiry) < new Date()
    ) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password (or additional fields if needed)
    await db.orm.public.User.where({ id: user.id }).update({
      password: hashedPassword,
    });

    // Clean up used OTP record
    await db.orm.public.UserOtp.where({ id: otpRecord.id }).delete();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Password reset failed" });
  }
};
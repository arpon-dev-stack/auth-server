import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { signUpSchema, verifyOtpSchema } from "../lib/validations.js";
import { generateOTP } from "../lib/tokens.js";
import { sendOTPEmail } from "../lib/mailer.js";

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = signUpSchema.parse(req.body);

    const existingUser = await db.orm.public.User.where({ email }).first();
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Create user record
    const user = await db.orm.public.User.create({
      email,
      password: hashedPassword,
      name,
      isVerified: false,
    });

    // Create associated OTP record in UserOtp table
    await db.orm.public.UserOtp.create({
      userId: user.id,
      otp,
      otpExpiry,
    });

    await sendOTPEmail(email, otp);

    res
      .status(201)
      .json({ message: "Registration successful. OTP sent to email." });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Sign up failed" });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const user = await db.orm.public.User.where({ email }).first();
    if (!user) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Look up the matching UserOtp record via userId
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

    // Update user verification status
    await db.orm.public.User.where({ id: user.id }).update({
      isVerified: true,
    });

    // Remove the verified OTP record
    await db.orm.public.UserOtp.where({ id: otpRecord.id }).delete();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: error.message || "OTP verification failed" });
  }
};
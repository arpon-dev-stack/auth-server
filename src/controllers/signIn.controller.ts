import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { signInSchema } from "../lib/validations.js";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt.js";

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = signInSchema.parse(req.body);

    // Replaced db.user.findUnique with Prisma v8 query syntax
    const user = await db.orm.public.User.where({ email }).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: "Account not verified. Please verify your email." });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    res.status(200).json({ accessToken, refreshToken });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Sign in failed" });
  }
};
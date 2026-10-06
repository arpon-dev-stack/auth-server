import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { db } from "../prisma/db.js";

export const verifyMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await db.orm.public.User.where({ id: userId }).first();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Omit sensitive/internal properties before returning
    const { password, ...userResponse } = user as any;

    res.status(200).json({ user: userResponse });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve user info" });
  }
};
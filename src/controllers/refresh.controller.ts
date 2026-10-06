import { Request, Response } from "express";
import { verifyRefreshToken, generateAccessToken } from "../lib/jwt.js";

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    const newAccessToken = await generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

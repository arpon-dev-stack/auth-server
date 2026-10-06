import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../lib/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    const decoded = await verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

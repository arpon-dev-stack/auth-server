import { Request, Response } from "express";

export const signOut = async (_req: Request, res: Response): Promise<void> => {
  // Clear HTTP-only cookies if implemented, or return success status for client-side storage cleanup
  res.status(200).json({ message: "Signed out successfully" });
};

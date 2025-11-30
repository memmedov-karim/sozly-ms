import { Request, Response, NextFunction } from "express";
import { verifyUserId } from "../services/client/AuthService";

export function userIdMiddleware (
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!userId) {
    return res.status(401).json({ success:false,message: "invalid" });
  }

  const isValid = verifyUserId(userId);

  if (!isValid) {
    return res.status(401).json({ success: false,message: "invalid" });
  }

  next();
};

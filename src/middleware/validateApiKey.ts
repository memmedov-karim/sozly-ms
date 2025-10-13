import { Request, Response, NextFunction } from "express";
import { API_KEYS } from "../constants/shared";

export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  var apiKey = req.header("x-api-key");
  if (API_KEYS.length > 0 && (!apiKey || !API_KEYS.includes(apiKey))) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

import {  Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { getTurnServerCredentials } from "../client/cloudflare";

export class TurnServerController {
  async getTurnCredentials(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      var data = await getTurnServerCredentials();
      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Credentials fetch failed",
      });
    }
  }
}

export default new TurnServerController();

import { NextFunction, Request, Response } from "express";
import { save } from "../services/ReportService";
import { ReportBody } from "../types";
import { getClientIp } from "../utils/ip";

export async function saveReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reportBody: ReportBody = req.body;
    const reporterIp = getClientIp(req);
    const reporterUniqueUserId = req.header("x-user-id");
    console.log("Reporter Unique User ID", { reporterUniqueUserId });
    await save(reportBody, reporterIp, reporterUniqueUserId);
    res.status(201).json({ message: "Report saved successfully!" });
  } catch (error) {
    next(error);
  }
}

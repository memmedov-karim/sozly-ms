"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReport = saveReport;
const ReportService_1 = require("../services/ReportService");
const ip_1 = require("../utils/ip");
async function saveReport(req, res, next) {
    try {
        const reportBody = req.body;
        const reporterIp = (0, ip_1.getClientIp)(req);
        await (0, ReportService_1.save)(reportBody, reporterIp);
        res.status(201).json({ message: 'Report saved successfully!' });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=ReportController.js.map
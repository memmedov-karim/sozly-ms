"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.save = save;
const ResourceNotFoundException_1 = require("../error/ResourceNotFoundException");
const ChatSession_1 = __importDefault(require("../models/ChatSession"));
const Report_1 = __importDefault(require("../models/Report"));
async function save(report, reporterIp) {
    const currentChat = await ChatSession_1.default.findOne({ sessionId: report.sessionId });
    if (!currentChat)
        throw new ResourceNotFoundException_1.ResourceNotFoundException('There is not ChatSession with given sessionId: ' + report.sessionId);
    const users = currentChat.users;
    const reportedIp = users.filter((user) => user.ip !== reporterIp)[0]?.ip;
    const rprt = new Report_1.default({
        sessionId: report.sessionId,
        reporterIp,
        reportedIp,
        message: report.message,
    });
    await rprt.save();
}
//# sourceMappingURL=ReportService.js.map
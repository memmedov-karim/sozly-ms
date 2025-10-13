"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReportController_1 = require("../controller/ReportController");
const router = express_1.default.Router();
router.post('/api/v1/report', ReportController_1.saveReport);
exports.default = router;
//# sourceMappingURL=ReportRouter.js.map
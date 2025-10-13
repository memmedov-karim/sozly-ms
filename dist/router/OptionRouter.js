"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const OptionController_1 = require("../controller/OptionController");
const router = express_1.default.Router();
router.get('/api/v1/options', OptionController_1.getUserPreferences);
exports.default = router;
//# sourceMappingURL=OptionRouter.js.map
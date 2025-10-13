"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPreferences = getUserPreferences;
const OptionService_1 = require("../services/OptionService");
const DEFAULT_LANG = 'az';
const SUPPORTED_LANGS = ['az', 'ru', 'en'];
async function getUserPreferences(req, res, next) {
    try {
        const appLang = req.headers['app-lang'] || DEFAULT_LANG;
        const lang = SUPPORTED_LANGS.includes(appLang) ? appLang : DEFAULT_LANG;
        console.log('Requested language:', lang);
        const options = await (0, OptionService_1.getUserPreferencesOptions)(lang);
        res.status(200).json(options);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=OptionController.js.map
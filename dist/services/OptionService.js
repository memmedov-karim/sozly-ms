"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPreferencesOptions = getUserPreferencesOptions;
const Option_1 = __importDefault(require("../models/Option"));
async function getUserPreferencesOptions(appLang) {
    const allOptions = await Option_1.default.find({
        type: { $in: ['languages', 'topics', 'genders'] }
    }).lean();
    const grouped = allOptions.reduce((acc, option) => {
        if (!acc[option.type]) {
            acc[option.type] = [];
        }
        acc[option.type].push({
            value: option.value,
            name: option.name[appLang]
        });
        return acc;
    }, {});
    return {
        languages: grouped.languages || [],
        topics: grouped.topics || [],
        genders: grouped.genders?.filter(gender => gender.value !== 'any') || [],
        allGenders: grouped.genders || [],
    };
}
//# sourceMappingURL=OptionService.js.map
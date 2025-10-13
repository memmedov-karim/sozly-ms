"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
const character_1 = require("../constants/character");
function getClientIp(source) {
    let ip;
    const forwarded = source.headers["x-forwarded-for"];
    ip =
        forwarded?.split(character_1.COMMA)[0].trim() ||
            source.socket?.remoteAddress ||
            source.ip;
    if (!ip)
        return character_1.EMPTY;
    return ip.replace(/^::ffff:/, "");
}
//# sourceMappingURL=ip.js.map
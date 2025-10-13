"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceNotFoundException = void 0;
const HttpException_1 = require("./HttpException");
class ResourceNotFoundException extends HttpException_1.HttpException {
    constructor(message) {
        super(404, message);
        this.name = 'ResourceNotFound';
    }
}
exports.ResourceNotFoundException = ResourceNotFoundException;
//# sourceMappingURL=ResourceNotFoundException.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = globalErrorHandler;
function globalErrorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({
        name: err.name,
        message,
        status,
    });
}
//# sourceMappingURL=errorHandler.js.map
import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../error/HttpException';

export function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const status = (err as HttpException).status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({
    name: err.name,
    message,
    status,
  });
}

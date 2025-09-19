import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const message = error.message || 'Internal Server Error';
    error = new AppError(message, statusCode, false);
  }

  const appError = error as AppError;

  // Log error
  logger.error({
    message: appError.message,
    statusCode: appError.statusCode,
    stack: appError.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Send error response
  res.status(appError.statusCode).json({
    success: false,
    error: {
      message: appError.message,
      statusCode: appError.statusCode,
      ...(config.isDevelopment && { stack: appError.stack }),
    },
  });
};
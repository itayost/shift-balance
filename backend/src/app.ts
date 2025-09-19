import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { morganStream } from './utils/logger';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error';

export const createApp = (): Application => {
  const app = express();

  // Trust proxy (for deployment behind reverse proxy)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(
    morgan(
      config.isDevelopment ? 'dev' : 'combined',
      { stream: morganStream }
    )
  );

  // API routes
  app.use('/api', routes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
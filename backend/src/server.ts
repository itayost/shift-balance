import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
import { initializeSocketServer } from './websocket/socket.server';

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app
const app = createApp();

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server
let socketServer: any;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Initialize WebSocket server
    socketServer = initializeSocketServer(httpServer);
    logger.info('✅ WebSocket server initialized');

    // Start listening
    const host = config.nodeEnv === 'production' ? '0.0.0.0' : 'localhost';
    httpServer.listen(config.port, host, () => {
      logger.info(`🚀 Server is running on ${host}:${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📍 Health check: http://${host}:${config.port}/api/health`);
      logger.info(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal...');

  if (httpServer) {
    httpServer.close(async () => {
      logger.info('HTTP server closed');

      try {
        await prisma.$disconnect();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
startServer();
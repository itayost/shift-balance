import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected', // TODO: Add actual Redis check
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      error: 'Database connection failed',
    });
  }
});

export default router;
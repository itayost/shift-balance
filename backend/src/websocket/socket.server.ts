import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class SocketServer {
  private io: Server;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(httpServer: HttpServer) {
    const corsOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.CLIENT_URL || 'https://shiftbalance.vercel.app',
          'https://shiftbalance.vercel.app',
          /\.vercel\.app$/,
        ]
      : ['http://localhost:3000', 'http://localhost:3001'];

    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigins,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = verifyAccessToken(token);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        logger.info(`User ${socket.userId} connected via WebSocket`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;

      // Track user's sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join role-specific room
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      logger.info(`Socket ${socket.id} connected for user ${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            this.emitUserStatusChange(userId, false);
          }
        }
        logger.info(`Socket ${socket.id} disconnected for user ${userId}`);
      });

      // Emit user online status
      this.emitUserStatusChange(userId, true);

      // Handle heartbeat
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit to multiple users
  emitToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  // Emit to all users with specific role
  emitToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Emit user online/offline status
  private emitUserStatusChange(userId: string, isOnline: boolean) {
    this.broadcast('user:status', { userId, isOnline });
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Notification events
  sendNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'notification:new', notification);
    logger.info(`Sent notification to user ${userId}`);
  }

  // Swap request events
  notifySwapRequest(userIds: string[], swapRequest: any) {
    this.emitToUsers(userIds, 'swap:request', swapRequest);
  }

  notifySwapAccepted(userId: string, swapRequest: any) {
    this.emitToUser(userId, 'swap:accepted', swapRequest);
  }

  notifySwapCancelled(userId: string, swapRequest: any) {
    this.emitToUser(userId, 'swap:cancelled', swapRequest);
  }

  // Schedule events
  notifySchedulePublished(scheduleId: string) {
    this.broadcast('schedule:published', { scheduleId });
  }

  notifyScheduleUpdated(scheduleId: string, changes: any) {
    this.broadcast('schedule:updated', { scheduleId, changes });
  }

  // Shift events
  notifyShiftUpdated(shiftId: string, userIds: string[]) {
    this.emitToUsers(userIds, 'shift:updated', { shiftId });
  }
}

let socketServer: SocketServer | null = null;

export const initializeSocketServer = (httpServer: HttpServer): SocketServer => {
  if (!socketServer) {
    socketServer = new SocketServer(httpServer);
  }
  return socketServer;
};

export const getSocketServer = (): SocketServer => {
  if (!socketServer) {
    throw new Error('Socket server not initialized');
  }
  return socketServer;
};
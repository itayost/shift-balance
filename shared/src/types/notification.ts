export enum NotificationType {
  SHIFT_PUBLISHED = 'SHIFT_PUBLISHED',
  SWAP_REQUEST = 'SWAP_REQUEST',
  SWAP_ACCEPTED = 'SWAP_ACCEPTED',
  SWAP_REJECTED = 'SWAP_REJECTED',
  AVAILABILITY_REMINDER = 'AVAILABILITY_REMINDER',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface MarkAsReadDto {
  notificationIds: string[];
}
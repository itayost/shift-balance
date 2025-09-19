import { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useNotificationStore, NotificationType } from '../store/notification.store';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Bell,
  BellOff,
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Check,
  CheckCheck
} from 'lucide-react';

export const NotificationPage = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError
  } = useNotificationStore();

  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    fetchNotifications(filterUnread);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, filterUnread]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SHIFT_PUBLISHED:
        return Calendar;
      case NotificationType.SWAP_REQUEST_CREATED:
      case NotificationType.SWAP_REQUEST_ACCEPTED:
      case NotificationType.SWAP_REQUEST_CANCELLED:
        return ArrowRightLeft;
      case NotificationType.SHIFT_REMINDER:
        return Clock;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SHIFT_PUBLISHED:
        return 'text-blue-600 bg-blue-50';
      case NotificationType.SWAP_REQUEST_CREATED:
        return 'text-purple-600 bg-purple-50';
      case NotificationType.SWAP_REQUEST_ACCEPTED:
        return 'text-green-600 bg-green-50';
      case NotificationType.SWAP_REQUEST_CANCELLED:
        return 'text-red-600 bg-red-50';
      case NotificationType.SHIFT_REMINDER:
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    if (notification.data?.swapRequestId) {
      // Navigate to swap page
      window.location.href = '/swap';
    } else if (notification.data?.scheduleId) {
      // Navigate to schedule page
      window.location.href = '/schedule';
    }
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: he
    });
  };

  return (
    <MobileLayout title="התראות">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="card card-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {unreadCount > 0 ? `${unreadCount} התראות חדשות` : 'אין התראות חדשות'}
                </p>
                <p className="text-xs text-gray-500">
                  סה"כ {notifications.length} התראות
                </p>
              </div>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterUnread(!filterUnread)}
                  className={`p-2 rounded-lg transition-colors ${
                    filterUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <BellOff className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 rounded-lg bg-green-100 text-green-600"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card card-danger">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={clearError} className="text-red-600">×</button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card card-default">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card card-muted text-center py-12">
            <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {filterUnread ? 'אין התראות שלא נקראו' : 'אין התראות'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`card ${
                    !notification.isRead ? 'card-primary border-blue-200 bg-blue-50/30' : 'card-default'
                  } cursor-pointer transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 rounded hover:bg-green-100 text-green-600"
                              title="סמן כנקרא"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('האם למחוק את ההתראה?')) {
                                deleteNotification(notification.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-red-100 text-red-600"
                            title="מחק התראה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Read indicator */}
                      {notification.isRead && notification.readAt && (
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-gray-400">
                            נקרא {formatTimeAgo(notification.readAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
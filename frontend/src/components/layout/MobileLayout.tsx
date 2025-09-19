import { ReactNode, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Clock, Users, User, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import { UserRole } from 'shiftbalance-shared';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  fab?: ReactNode;
}

export const MobileLayout = ({ children, title, showBack = false, fab }: MobileLayoutProps) => {
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'בית',
      show: true,
      badge: 0
    },
    {
      path: '/schedule',
      icon: Calendar,
      label: 'סידור',
      show: true,
      badge: 0
    },
    {
      path: '/notifications',
      icon: Bell,
      label: 'התראות',
      show: true,
      badge: unreadCount
    },
    {
      path: '/availability',
      icon: Clock,
      label: 'זמינות',
      show: true,
      badge: 0
    },
    {
      path: '/profile',
      icon: User,
      label: 'פרופיל',
      show: true,
      badge: 0
    },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top App Bar */}
      <header className="app-bar">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -mr-2 rounded-lg tap-feedback"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {title || 'ShiftBalance'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-1" />
              {badge > 0 && (
                <span className="notification-badge absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Floating Action Button */}
      {fab}
    </div>
  );
};
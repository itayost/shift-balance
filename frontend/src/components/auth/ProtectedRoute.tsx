import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { UserRole } from 'shiftbalance-shared';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user, fetchCurrentUser, accessToken } = useAuthStore();

  useEffect(() => {
    // If we have a token but no user, try to fetch the current user
    if (accessToken && !user) {
      fetchCurrentUser().catch(() => {
        // If fetching fails, the store will clear auth state
      });
    }
  }, [accessToken, user, fetchCurrentUser]);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין לך הרשאה</h2>
          <p className="text-gray-600">אין לך הרשאה לצפות בעמוד זה</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
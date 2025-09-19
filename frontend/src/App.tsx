import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/admin/UsersPage';
import { ScheduleManagementPage } from './pages/admin/ScheduleManagementPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { ScheduleViewPage } from './pages/ScheduleViewPage';
import { SwapPage } from './pages/SwapPage';
import { NotificationPage } from './pages/NotificationPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useAuthStore } from './store/auth.store';
import { useSocket } from './hooks/useSocket';
import { UserRole } from 'shiftbalance-shared';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isConnected } = useSocket();

  return (
    <Router>
      {/* Connection Status Indicator */}
      {isAuthenticated && !isConnected && (
        <ConnectionStatus isConnected={isConnected} />
      )}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <ScheduleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute>
              <AvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <ScheduleViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swap"
          element={
            <ProtectedRoute>
              <SwapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App

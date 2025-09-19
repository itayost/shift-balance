import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/auth.store';
import { EmployeePosition, EmployeeLevel, UserRole } from 'shiftbalance-shared';
import { User, Phone, Briefcase, Award, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserProfilePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPositionLabel = () => {
    switch (user.position) {
      case EmployeePosition.SHIFT_MANAGER:
        return 'אחראי משמרת';
      case EmployeePosition.BARTENDER:
        return 'ברמן';
      case EmployeePosition.SERVER:
        return 'מלצר';
      default:
        return '';
    }
  };

  const getLevelLabel = () => {
    switch (user.level) {
      case EmployeeLevel.TRAINEE:
        return 'מתאמן';
      case EmployeeLevel.RUNNER:
        return 'רץ';
      case EmployeeLevel.INTERMEDIATE:
        return 'בינוני';
      case EmployeeLevel.EXPERT:
        return 'מומחה';
      default:
        return '';
    }
  };

  return (
    <MobileLayout title="פרופיל">
      <div className="space-y-4">
        {/* User Info */}
        <div className="card card-default">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.fullName}</h2>
              <p className="text-sm text-gray-600">
                {getPositionLabel()} • {user.role === UserRole.ADMIN ? 'מנהל' : 'עובד'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <div className="card card-default flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">טלפון</p>
              <p className="text-sm font-medium text-gray-900">{user.phone}</p>
            </div>
          </div>

          <div className="card card-default flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">תפקיד</p>
              <p className="text-sm font-medium text-gray-900">{getPositionLabel()}</p>
            </div>
          </div>

          <div className="card card-default flex items-center gap-3">
            <Award className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">רמה</p>
              <p className="text-sm font-medium text-gray-900">{getLevelLabel()}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full card card-danger tap-feedback flex items-center justify-center gap-2 text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">התנתקות</span>
        </button>
      </div>
    </MobileLayout>
  );
};
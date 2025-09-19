import { User, EmployeePosition, EmployeeLevel } from 'shiftbalance-shared';
import { X, Phone, Calendar, UserCheck, UserX } from 'lucide-react';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onGenerateToken?: (user: User) => void;
  currentUserId?: string;
  isCurrentUserAdmin?: boolean;
}

export const UserDetailModal = ({
  user,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
  onGenerateToken,
  currentUserId,
  isCurrentUserAdmin = false,
}: UserDetailModalProps) => {
  const getPositionLabel = (position: EmployeePosition) => {
    switch (position) {
      case EmployeePosition.SHIFT_MANAGER:
        return 'אחראי משמרת';
      case EmployeePosition.BARTENDER:
        return 'ברמן';
      case EmployeePosition.SERVER:
        return 'מלצר';
      default:
        return position;
    }
  };

  const getLevelLabel = (level: EmployeeLevel) => {
    switch (level) {
      case EmployeeLevel.EXPERT:
        return 'מומחה';
      case EmployeeLevel.INTERMEDIATE:
        return 'בינוני';
      case EmployeeLevel.RUNNER:
        return 'רץ';
      case EmployeeLevel.TRAINEE:
        return 'מתלמד';
      default:
        return level;
    }
  };

  const getStatusInfo = () => {
    if (!user.isActive) return { text: 'לא פעיל', color: 'text-red-600' };
    if (!user.password && !user.tokenUsed) return { text: 'ממתין להרשמה', color: 'text-orange-600' };
    return { text: 'פעיל', color: 'text-green-600' };
  };

  const statusInfo = getStatusInfo();
  const isOwnProfile = user.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{backgroundColor: 'var(--bg-white)'}}>
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4" style={{backgroundColor: 'var(--bg-white)'}}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                פרטי עובד
              </h3>
              <button
                onClick={onClose}
                className="p-2 tap-feedback rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              {/* Name */}
              <div className="card card-default">
                <h4 className="text-lg font-semibold text-gray-900">{user.fullName}</h4>
                <p className="text-sm text-gray-600 mt-1">{getPositionLabel(user.position as EmployeePosition)}</p>
              </div>

              {/* Contact Info */}
              <div className="card card-default">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">טלפון</p>
                    <p className="text-sm text-gray-900" dir="ltr">{user.phone}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="card card-default">
                <div className="flex items-center gap-3">
                  {user.isActive ? (
                    <UserCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <UserX className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">סטטוס</p>
                    <p className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Level (if available) */}
              {user.level && (
                <div className="card card-default">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">רמה</p>
                      <p className="text-sm text-gray-900">{getLevelLabel(user.level as EmployeeLevel)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {isCurrentUserAdmin && !isOwnProfile && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(user)}
                        className="btn btn-primary text-sm"
                      >
                        ערוך פרטים
                      </button>
                    )}
                    {onToggleStatus && (
                      <button
                        onClick={() => onToggleStatus(user)}
                        className={`btn text-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                      >
                        {user.isActive ? 'השבת' : 'הפעל'}
                      </button>
                    )}
                  </div>

                  {onGenerateToken && !user.password && !user.tokenUsed && (
                    <button
                      onClick={() => onGenerateToken(user)}
                      className="btn btn-secondary w-full text-sm"
                    >
                      צור טוקן הרשמה
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => onDelete(user)}
                      className="btn btn-danger w-full text-sm"
                    >
                      מחק משתמש
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
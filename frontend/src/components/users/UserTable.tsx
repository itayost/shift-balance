import { User, EmployeePosition } from 'shiftbalance-shared';

interface UserTableProps {
  users: User[];
  onUserClick: (user: User) => void;
  currentUserId?: string;
}

export const UserTable = ({
  users,
  onUserClick,
}: UserTableProps) => {


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


  return (
    <div className="space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onUserClick(user)}
          className="w-full card card-default tap-feedback text-right"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{user.fullName}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {getPositionLabel(user.position as EmployeePosition)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );}
;
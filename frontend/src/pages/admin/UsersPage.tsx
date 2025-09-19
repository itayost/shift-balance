import { useEffect, useState } from 'react';
import { User, CreateUserInput, UpdateUserInput, UserRole } from 'shiftbalance-shared';
import { useUserStore } from '../../store/user.store';
import { useAuthStore } from '../../store/auth.store';
import { UserTable } from '../../components/users/UserTable';
import { UserForm } from '../../components/users/UserForm';
import { UserDetailModal } from '../../components/users/UserDetailModal';
import { MobileLayout } from '../../components/layout/MobileLayout';
import toast from 'react-hot-toast';

export const UsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const {
    users,
    isLoading,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    generateUserToken,
  } = useUserStore();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (data: CreateUserInput) => {
    try {
      // Set role to EMPLOYEE for all new users (only admin can create users)
      const userData = {
        ...data,
        role: UserRole.EMPLOYEE
      };
      await createUser(userData);
      setShowForm(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleUpdateUser = async (data: UpdateUserInput) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, data);
      setEditingUser(null);
      setShowForm(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את ${user.fullName}?`)) {
      try {
        await deleteUser(user.id);
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleGenerateToken = async (user: User) => {
    try {
      const token = await generateUserToken(user.id);
      // Show token in a modal or copy to clipboard
      navigator.clipboard.writeText(token);
      toast.success('הטוקן הועתק ללוח');
      alert(`טוקן הרשמה עבור ${user.fullName}:\n\n${token}\n\nהטוקן הועתק ללוח`);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleSearch = () => {
    fetchUsers({ query: searchQuery });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSelectedUser(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  return (
    <MobileLayout title="ניהול משתמשים">
      <div className="space-y-4">
        {/* Header */}
        <div className="card card-default">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ניהול משתמשים</h3>
              <p className="text-sm text-gray-500 mt-1">
                {pagination?.total || 0} משתמשים רשומים במערכת
              </p>
            </div>
            {currentUser?.role === UserRole.ADMIN && (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                הוסף משתמש
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="card card-default">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="חפש לפי שם או טלפון..."
              className="input flex-1"
            />
            <button
              onClick={handleSearch}
              className="btn btn-secondary"
            >
              חפש
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchUsers();
                }}
                className="btn btn-secondary"
              >
                נקה
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card card-default">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="card card-default text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-sm font-medium text-gray-900">אין משתמשים</h3>
            <p className="text-sm text-gray-500 mt-1">התחל על ידי הוספת משתמש חדש</p>
          </div>
        ) : (
          <UserTable
            users={users}
            onUserClick={handleUserClick}
            currentUserId={currentUser?.userId}
          />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="card card-default">
            <div className="flex items-center justify-between">
              <button
                onClick={() => fetchUsers({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                הקודם
              </button>
              <span className="text-sm text-gray-700">
                עמוד {pagination.page} מתוך {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                הבא
              </button>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={handleCloseModal}
            onEdit={handleEdit}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onGenerateToken={handleGenerateToken}
            currentUserId={currentUser?.userId}
            isCurrentUserAdmin={currentUser?.role === UserRole.ADMIN}
          />
        )}

        {/* User Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseForm}></div>

              <div className="inline-block align-bottom rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{backgroundColor: 'var(--bg-white)'}}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4" style={{backgroundColor: 'var(--bg-white)'}}>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingUser ? 'ערוך משתמש' : 'הוסף משתמש חדש'}
                  </h3>
                  <UserForm
                    user={editingUser}
                    onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                    onCancel={handleCloseForm}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
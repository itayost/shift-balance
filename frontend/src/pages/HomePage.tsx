import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from 'shiftbalance-shared';
import { Calendar, Clock, ChevronLeft, Users, Settings, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useScheduleStore } from '../store/schedule.store';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const HomePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { userShifts, fetchMyShifts } = useScheduleStore();
  const [nextShift, setNextShift] = useState<any>(null);

  useEffect(() => {
    fetchMyShifts();
  }, [fetchMyShifts]);

  useEffect(() => {
    // Find the next upcoming shift
    const now = new Date();
    const upcoming = userShifts
      .filter(shift => new Date(shift.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    setNextShift(upcoming);
  }, [userShifts]);

  const getShiftTypeLabel = (type: string) => {
    return type === 'LUNCH' ? 'משמרת צהריים' : 'משמרת ערב';
  };

  return (
    <MobileLayout title="דף הבית">
      <div className="space-y-4">
        {/* Next Shift Card */}
        {nextShift ? (
          <div className="card card-active">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">המשמרת הבאה שלך</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {format(new Date(nextShift.date), 'EEEE', { locale: he })}
              </div>
              <div className="text-sm text-gray-600">
                {format(new Date(nextShift.date), 'dd/MM/yyyy')}
              </div>
              <div className="text-sm text-gray-600">
                {getShiftTypeLabel(nextShift.type)} • {nextShift.startTime}-{nextShift.endTime}
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-muted">
            <div className="text-center py-4">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">אין משמרות קרובות</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/schedule')}
            className="w-full card card-default tap-feedback flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div className="text-right">
                <p className="font-medium text-gray-900">צפה בסידור</p>
                <p className="text-sm text-gray-500">ראה את כל המשמרות השבועיות</p>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/availability')}
            className="w-full card card-default tap-feedback flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="text-right">
                <p className="font-medium text-gray-900">הגש זמינות</p>
                <p className="text-sm text-gray-500">עדכן את הזמינות שלך לשבוע הבא</p>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/swap')}
            className="w-full card card-default tap-feedback flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <div className="text-right">
                <p className="font-medium text-gray-900">החלפת משמרות</p>
                <p className="text-sm text-gray-500">בקש או קח משמרות של עמיתים</p>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          {/* Admin Access */}
          {user?.role === UserRole.ADMIN && (
            <>
              <button
                onClick={() => navigate('/admin/schedule')}
                className="w-full card card-subtle tap-feedback flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <div className="text-right">
                    <p className="font-medium text-gray-900">ניהול סידור</p>
                    <p className="text-sm text-gray-500">צור ונהל סידורי עבודה</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/users')}
                className="w-full card card-subtle tap-feedback flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div className="text-right">
                    <p className="font-medium text-gray-900">ניהול משתמשים</p>
                    <p className="text-sm text-gray-500">נהל עובדים והרשאות</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};
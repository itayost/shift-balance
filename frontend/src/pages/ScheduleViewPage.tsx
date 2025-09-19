import { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useScheduleStore } from '../store/schedule.store';
import { useAuthStore } from '../store/auth.store';
import { format, startOfWeek, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { ShiftType } from 'shiftbalance-shared';
import { Coffee, Moon, ChevronLeft, ChevronRight, Users, Calendar } from 'lucide-react';

export const ScheduleViewPage = () => {
  const { currentSchedule, userShifts, isLoading, fetchCurrentSchedule, fetchMyShiftsForDisplay } = useScheduleStore();
  const { user } = useAuthStore();
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  useEffect(() => {
    fetchCurrentSchedule();
    fetchMyShiftsForDisplay();
  }, [fetchCurrentSchedule, fetchMyShiftsForDisplay]);

  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const getShiftForDay = (dayIndex: number, type: ShiftType) => {
    if (!currentSchedule?.shifts) return null;
    const targetDate = addDays(selectedWeek, dayIndex);
    return currentSchedule.shifts.find(
      shift =>
        format(new Date(shift.date), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd') &&
        shift.type === type
    );
  };

  const isMyShift = (shiftId: string) => {
    return userShifts.some(shift => shift.id === shiftId);
  };

  const ShiftColumn = ({ shift, type, title }: { shift: any; type: ShiftType; title: string }) => {
    const Icon = type === ShiftType.LUNCH ? Coffee : Moon;
    const timeLabel = shift?.startTime && shift?.endTime
      ? `${shift.startTime}-${shift.endTime}`
      : type === ShiftType.LUNCH ? '11:00-16:00' : '18:00-23:00';

    const workers = shift?.employees || [];
    const shiftManager = shift?.shiftManager;
    const hasMyShift = shift && isMyShift(shift.id);

    return (
      <div className={`card ${hasMyShift ? 'card-active' : 'card-default'} flex-1`}>
        <div className="space-y-3">
          {/* Shift Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Icon className={`w-4 h-4 ${hasMyShift ? 'text-blue-600' : 'text-gray-500'}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${hasMyShift ? 'text-blue-900' : 'text-gray-700'}`}>
                {title}
              </p>
              <p className="text-xs text-gray-500">{timeLabel}</p>
            </div>
          </div>

          {/* Workers List */}
          <div className="space-y-2">
            {!shift ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">לא מתוכנן</p>
              </div>
            ) : workers.length === 0 && !shiftManager ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">אין עובדים משובצים</p>
              </div>
            ) : (
              <>
                {/* Shift Manager */}
                {shiftManager && (
                  <div className={`p-2 rounded-lg text-xs border-r-2 border-orange-400 ${
                    shiftManager.id === user?.userId
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'bg-orange-50 text-orange-800'
                  }`}>
                    👑 {shiftManager.fullName || shiftManager.name || 'מנהל משמרת'}
                  </div>
                )}

                {/* Regular Workers */}
                {workers.map((employee: any, index: number) => (
                  <div key={index} className={`p-2 rounded-lg text-xs ${
                    employee.id === user?.userId
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    {employee.fullName || employee.name || 'עובד לא ידוע'}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  if (isLoading) {
    return (
      <MobileLayout title="סידור משמרות">
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="סידור משמרות">
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="card card-default flex items-center justify-between">
          <button onClick={() => changeWeek('prev')} className="p-2 tap-feedback">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-500">שבוע</p>
            <p className="font-semibold text-gray-900">
              {format(selectedWeek, 'dd/MM')} - {format(addDays(selectedWeek, 6), 'dd/MM')}
            </p>
          </div>
          <button onClick={() => changeWeek('next')} className="p-2 tap-feedback">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Schedule Status */}
        {currentSchedule && (
          <div className={`card ${currentSchedule.isPublished ? 'card-success' : 'card-warning'}`}>
            <p className={`text-sm font-medium ${currentSchedule.isPublished ? 'text-green-800' : 'text-orange-800'}`}>
              {currentSchedule.isPublished ? '✓ הסידור פורסם' : '⏳ הסידור בהכנה'}
            </p>
          </div>
        )}

        {/* Day Tabs */}
        {currentSchedule && (
          <div className="card card-default">
            <div className="flex overflow-x-auto gap-2 p-2">
              {daysOfWeek.map((day, dayIndex) => {
                const lunchShift = getShiftForDay(dayIndex, ShiftType.LUNCH);
                const dinnerShift = getShiftForDay(dayIndex, ShiftType.DINNER);
                const hasMyShift = (lunchShift && isMyShift(lunchShift.id)) ||
                                 (dinnerShift && isMyShift(dinnerShift.id));
                const isSelected = selectedDay === dayIndex;

                return (
                  <button
                    key={dayIndex}
                    onClick={() => setSelectedDay(dayIndex)}
                    className={`flex-shrink-0 px-3 py-2 rounded-full tap-feedback border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : hasMyShift
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                    style={{ minWidth: '70px' }}
                  >
                    <p className="text-sm font-semibold">{day}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Day Schedule */}
        {!currentSchedule ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">אין סידור זמין לשבוע זה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Day Header */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {daysOfWeek[selectedDay]}
              </h2>
              <p className="text-sm text-gray-500">
                {format(addDays(selectedWeek, selectedDay), 'dd MMMM yyyy', { locale: he })}
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="flex gap-3">
              <ShiftColumn
                shift={getShiftForDay(selectedDay, ShiftType.LUNCH)}
                type={ShiftType.LUNCH}
                title="משמרת צהריים"
              />
              <ShiftColumn
                shift={getShiftForDay(selectedDay, ShiftType.DINNER)}
                type={ShiftType.DINNER}
                title="משמרת ערב"
              />
            </div>
          </div>
        )}

        {/* My Shifts Summary */}
        {userShifts.length > 0 && (
          <div className="card card-active">
            <p className="text-sm font-medium text-blue-900">
              יש לך {userShifts.length} משמרות השבוע
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
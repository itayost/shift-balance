import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/auth.store';
import { useAvailabilityStore } from '../store/availability.store';
import { ShiftType } from 'shiftbalance-shared';
import { addWeeks, subWeeks, format, startOfWeek, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Coffee, Moon, ChevronLeft, ChevronRight, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const AvailabilityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentWeek,
    weeklySlots,
    status,
    isSaving,
    error,
    setCurrentWeek,
    loadAvailability,
    toggleSlot,
    submitAvailability,
    clearError
  } = useAvailabilityStore();


  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAvailability();
  }, [user, navigate, loadAvailability]);

  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const handleSubmit = async () => {
    const result = await submitAvailability();
    if (result) {
      toast.success('הזמינות נשמרה בהצלחה');
      setTimeout(() => navigate('/'), 1000);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next'
      ? addWeeks(currentWeek, 1)
      : subWeeks(currentWeek, 1);

    // Don't allow navigation to weeks earlier than next week
    const nextWeek = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 0 });
    if (direction === 'prev' && newWeek < nextWeek) {
      return;
    }

    setCurrentWeek(newWeek);
  };

  const AvailabilitySlot = ({
    dayIndex,
    shiftType,
    isAvailable
  }: {
    dayIndex: number;
    shiftType: ShiftType;
    isAvailable: boolean;
  }) => {
    const Icon = shiftType === ShiftType.LUNCH ? Coffee : Moon;
    const timeLabel = shiftType === ShiftType.LUNCH ? '11:00-16:00' : '18:00-23:00';

    return (
      <button
        onClick={() => toggleSlot(dayIndex, shiftType)}
        className={`card tap-feedback transition-colors ${
          isAvailable ? 'card-success' : 'card-default'
        }`}
      >
        <div className="flex items-center justify-center flex-col gap-1">
          <Icon className={`w-4 h-4 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
          <span className={`text-xs ${isAvailable ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
            {timeLabel}
          </span>
        </div>
      </button>
    );
  };

  const FAB = () => (
    <button
      onClick={handleSubmit}
      disabled={isSaving || status?.isPastDeadline}
      className="fab disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Send className="w-6 h-6" />
    </button>
  );

  if (!user) return null;

  return (
    <MobileLayout title="הגשת זמינות" fab={<FAB />}>
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="card card-default flex items-center justify-between">
          <button
            onClick={() => changeWeek('prev')}
            disabled={currentWeek <= startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 0 })}
            className="p-2 tap-feedback disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-500">שבוע</p>
            <p className="font-semibold text-gray-900">
              {format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM')}
            </p>
          </div>
          <button onClick={() => changeWeek('next')} className="p-2 tap-feedback">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Deadline Warning */}
        {status && (
          <div className={`card ${status.isPastDeadline ? 'card-danger' : 'card-warning'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${status.isPastDeadline ? 'text-red-600' : 'text-orange-600'}`} />
              <p className={`text-sm ${status.isPastDeadline ? 'text-red-800' : 'text-orange-800'}`}>
                {status.isPastDeadline
                  ? 'המועד האחרון להגשה עבר'
                  : `יש להגיש עד ${format(status.deadline, "EEEE HH:mm", { locale: he })}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card card-danger">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button onClick={clearError} className="text-red-600">×</button>
            </div>
          </div>
        )}

        {/* Availability Grid */}
        <div className="space-y-3">
          {daysOfWeek.map((day, dayIndex) => {
            const lunchAvailable = weeklySlots?.get(`${dayIndex}-${ShiftType.LUNCH}`) || false;
            const dinnerAvailable = weeklySlots?.get(`${dayIndex}-${ShiftType.DINNER}`) || false;

            return (
              <div key={dayIndex}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-medium ${
                    lunchAvailable || dinnerAvailable ? 'text-green-600' : 'text-gray-700'
                  }`}>
                    {day}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {format(addDays(currentWeek, dayIndex), 'dd/MM')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <AvailabilitySlot
                    dayIndex={dayIndex}
                    shiftType={ShiftType.LUNCH}
                    isAvailable={lunchAvailable}
                  />
                  <AvailabilitySlot
                    dayIndex={dayIndex}
                    shiftType={ShiftType.DINNER}
                    isAvailable={dinnerAvailable}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="card card-muted">
          <p className="text-xs text-gray-600 text-center">
            לחץ על המשבצות לסימון זמינות • ירוק = זמין
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};
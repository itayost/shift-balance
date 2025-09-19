import { useEffect } from 'react';
import { ShiftType } from 'shiftbalance-shared';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { useAvailabilityStore } from '../../store/availability.store';

const DAYS_OF_WEEK = [
  { day: 0, name: 'ראשון' },
  { day: 1, name: 'שני' },
  { day: 2, name: 'שלישי' },
  { day: 3, name: 'רביעי' },
  { day: 4, name: 'חמישי' },
  { day: 5, name: 'שישי' },
  { day: 6, name: 'שבת' }
];

const SHIFTS = [
  { type: ShiftType.LUNCH, name: 'צהריים', time: '11:00-17:00', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { type: ShiftType.DINNER, name: 'ערב', time: '17:00-23:00', color: 'bg-blue-50 hover:bg-blue-100' }
];

export const AvailabilityGrid = () => {
  const {
    currentWeek,
    weeklySlots,
    status,
    isLoading,
    toggleSlot,
    initializeWeeklySlots
  } = useAvailabilityStore();

  useEffect(() => {
    initializeWeeklySlots();
  }, [initializeWeeklySlots]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const isPastDeadline = status?.isPastDeadline || false;

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          שבוע {format(currentWeek, 'dd/MM', { locale: he })} - {format(addDays(currentWeek, 6), 'dd/MM', { locale: he })}
        </h3>
        {isPastDeadline && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <p className="text-sm text-red-600">עבר המועד להגשת זמינות לשבוע זה</p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* Header Row */}
          <div className="bg-gray-50 p-3 border-b border-l font-medium text-gray-700">
            משמרת
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.day}
              className="bg-gray-50 p-3 border-b border-l font-medium text-gray-700 text-center"
            >
              <div>{day.name}</div>
              <div className="text-xs text-gray-500">
                {format(addDays(currentWeek, day.day), 'dd/MM')}
              </div>
            </div>
          ))}

          {/* Shift Rows */}
          {SHIFTS.map((shift) => (
            <div key={shift.type} className="contents">
              <div className="p-3 border-b border-l font-medium text-gray-700 bg-gray-50">
                <div>{shift.name}</div>
                <div className="text-xs text-gray-500">{shift.time}</div>
              </div>
              {DAYS_OF_WEEK.map((day) => {
                const key = `${day.day}-${shift.type}`;
                const isAvailable = weeklySlots.get(key) || false;

                return (
                  <div
                    key={key}
                    className={`border-b border-l p-2 ${isPastDeadline ? 'bg-gray-100' : ''}`}
                  >
                    <button
                      type="button"
                      disabled={isPastDeadline}
                      onClick={() => toggleSlot(day.day, shift.type)}
                      className={`
                        w-full h-full min-h-[60px] rounded-lg transition-all
                        ${isPastDeadline
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:shadow-md'
                        }
                        ${isAvailable
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : shift.color + ' border-2 border-dashed border-gray-300'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {isAvailable ? (
                          <>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">זמין</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">לחץ לסימון</span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            סה"כ משמרות מסומנות: <span className="font-bold text-gray-900">
              {Array.from(weeklySlots.values()).filter(v => v).length}
            </span>
          </div>
          {status && (
            <div className={`text-sm ${status.submitted ? 'text-green-600' : 'text-orange-600'}`}>
              {status.submitted ? `✓ הוגש (${status.slotsCount} משמרות)` : 'טרם הוגש'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
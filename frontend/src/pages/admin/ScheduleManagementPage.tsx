import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { useAuthStore } from '../../store/auth.store';
import { useScheduleStore } from '../../store/schedule.store';
import { startOfWeek, addWeeks, subWeeks, format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShiftType } from 'shiftbalance-shared';
import { ScheduleBuilder } from '../../components/schedule/ScheduleBuilder';

export const ScheduleManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentSchedule,
    isLoading,
    availabilityStats,
    fetchAvailabilityStats,
    fetchWeekAvailability,
    fetchActiveEmployees,
    saveScheduleAssignments,
    fetchWeekSchedule,
    publishSchedule
  } = useScheduleStore();
  const [selectedWeek, setSelectedWeek] = useState<Date>(
    startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 0 }) // Default to next week
  );
  const [currentAssignments, setCurrentAssignments] = useState<{ [key: string]: any }>({});
  const [weekSchedule, setWeekSchedule] = useState<any>(null);

  useEffect(() => {
    // Load data for the selected week
    fetchAvailabilityStats(selectedWeek);
    fetchWeekAvailability(selectedWeek);
    fetchActiveEmployees();
    loadWeekSchedule();
  }, [selectedWeek, fetchAvailabilityStats, fetchWeekAvailability, fetchActiveEmployees]);

  const loadWeekSchedule = async () => {
    const schedule = await fetchWeekSchedule(selectedWeek);
    setWeekSchedule(schedule);

    // If schedule exists, convert it to assignments format for the builder
    if (schedule?.shifts) {
      const existingAssignments: { [key: string]: any } = {};

      schedule.shifts.forEach((shift: any) => {
        const shiftDate = new Date(shift.date);
        const dayOfWeek = shiftDate.getDay();
        const key = `${dayOfWeek}-${shift.type}`;

        if (shift.employees && shift.employees.length > 0) {
          existingAssignments[key] = shift.employees;
        }
      });

      setCurrentAssignments(existingAssignments);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next'
      ? addWeeks(selectedWeek, 1)
      : subWeeks(selectedWeek, 1);

    // Don't allow navigation to weeks earlier than next week
    const nextWeek = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 0 });
    if (direction === 'prev' && newWeek < nextWeek) {
      return;
    }

    setSelectedWeek(newWeek);
  };

  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Use real data from store
  const statsToShow = availabilityStats || {
    totalEmployees: 0,
    submitted: 0,
    submissionRate: 0,
    totalSlots: 0
  };

  const weekStats = {
    totalShifts: 14,
    assignedShifts: 6,
    coverage: 43
  };

  const handleAssignmentsChange = (assignments: { [key: string]: any }) => {
    setCurrentAssignments(assignments);
  };

  const validateSchedule = () => {
    const violations = [];
    let hasAssignments = false;

    Object.entries(currentAssignments).forEach(([key, employees]) => {
      if (employees.length > 0) {
        hasAssignments = true;
        const [dayOfWeek, shiftType] = key.split('-');
        const dayName = daysOfWeek[parseInt(dayOfWeek)];
        const shiftName = shiftType === 'LUNCH' ? 'צהריים' : 'ערב';

        const hasShiftManager = employees.some(emp => emp.position === 'SHIFT_MANAGER');
        const hasBartender = employees.some(emp => emp.position === 'BARTENDER');

        if (!hasShiftManager) {
          violations.push(`חסר אחראי משמרת ב${dayName} משמרת ${shiftName}`);
        }
        if (!hasBartender) {
          violations.push(`חסר ברמן ב${dayName} משמרת ${shiftName}`);
        }
        if (employees.length < 3) {
          violations.push(`לא מספיק עובדים ב${dayName} משמרת ${shiftName} (מינימום 3)`);
        }
      }
    });

    return { isValid: violations.length === 0 && hasAssignments, violations, hasAssignments };
  };

  const handleSaveDraft = async () => {
    if (Object.keys(currentAssignments).length === 0) {
      return;
    }

    // Transform assignments to the format expected by the backend
    const formattedAssignments: { [key: string]: { employeeIds: string[]; shiftManagerId?: string } } = {};

    Object.entries(currentAssignments).forEach(([key, employees]) => {
      if (employees.length > 0) {
        const shiftManager = employees.find(emp => emp.position === 'SHIFT_MANAGER');
        formattedAssignments[key] = {
          employeeIds: employees.map(emp => emp.id),
          shiftManagerId: shiftManager?.id
        };
      }
    });

    const success = await saveScheduleAssignments(selectedWeek, formattedAssignments);
    if (success) {
      navigate('/');
    }
  };

  const handlePublishSchedule = async () => {
    const validation = validateSchedule();

    if (!validation.isValid) {
      // For now, we'll allow publishing with warnings
      const proceed = window.confirm(
        `יש בעיות בסידור:\n\n${validation.violations.join('\n')}\n\nהאם אתה בטוח שברצונך לפרסם?`
      );
      if (!proceed) return;
    }

    if (Object.keys(currentAssignments).length === 0) {
      return;
    }

    // Transform assignments to the format expected by the backend
    const formattedAssignments: { [key: string]: { employeeIds: string[]; shiftManagerId?: string } } = {};

    Object.entries(currentAssignments).forEach(([key, employees]) => {
      if (employees.length > 0) {
        const shiftManager = employees.find(emp => emp.position === 'SHIFT_MANAGER');
        formattedAssignments[key] = {
          employeeIds: employees.map(emp => emp.id),
          shiftManagerId: shiftManager?.id
        };
      }
    });

    // First save the draft
    const saveSuccess = await saveScheduleAssignments(selectedWeek, formattedAssignments);
    if (!saveSuccess) {
      return;
    }

    // Get the saved schedule to get its ID
    const savedSchedule = await fetchWeekSchedule(selectedWeek);
    if (savedSchedule?.id) {
      // Then publish the schedule
      const publishSuccess = await publishSchedule(savedSchedule.id);
      if (publishSuccess) {
        navigate('/');
      }
    } else {
      alert('שגיאה בפרסום הסידור - לא נמצא מזהה הסידור');
    }
  };

  return (
    <MobileLayout title="ניהול סידור">
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="card card-default flex items-center justify-between">
          <button
            onClick={() => changeWeek('prev')}
            disabled={selectedWeek <= startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 0 })}
            className="p-2 tap-feedback disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-500">שבוע לסידור</p>
            <p className="font-semibold text-gray-900">
              {format(selectedWeek, 'dd/MM')} - {format(addDays(selectedWeek, 6), 'dd/MM')}
            </p>
          </div>
          <button onClick={() => changeWeek('next')} className="p-2 tap-feedback">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Schedule Builder */}
        <ScheduleBuilder
          weekDate={selectedWeek}
          onAssignmentsChange={handleAssignmentsChange}
          initialAssignments={currentAssignments}
        />

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleSaveDraft}
            disabled={Object.keys(currentAssignments).length === 0 || isLoading}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'שומר...' : 'שמור טיוטה'}
          </button>
          <button
            onClick={handlePublishSchedule}
            disabled={Object.keys(currentAssignments).length === 0 || isLoading}
            className="btn btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            פרסם סידור
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};
import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { ShiftType, User, EmployeePosition } from 'shiftbalance-shared';
import { useScheduleStore } from '../../store/schedule.store';
import { Coffee, Moon, Users, 
  X, UserCheck, Wine, Crown } from 'lucide-react';

interface ScheduleBuilderProps {
  weekDate: Date;
  onAssignmentsChange?: (assignments: { [key: string]: User[] }) => void;
  initialAssignments?: { [key: string]: User[] };
}

export const ScheduleBuilder = ({ weekDate, onAssignmentsChange, initialAssignments }: ScheduleBuilderProps) => {
  const {
    getAvailableEmployees
  } = useScheduleStore();

  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [assignments, setAssignments] = useState<{
    [key: string]: User[]; // "dayOfWeek-shiftType" -> assigned employees
  }>(initialAssignments || {});

  // Update assignments when initialAssignments change
  useEffect(() => {
    if (initialAssignments) {
      setAssignments(initialAssignments);
    }
  }, [initialAssignments]);

  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const getAssignmentKey = (dayOfWeek: number, shiftType: ShiftType) =>
    `${dayOfWeek}-${shiftType}`;

  const getAssignedEmployees = (dayOfWeek: number, shiftType: ShiftType) =>
    assignments[getAssignmentKey(dayOfWeek, shiftType)] || [];

  const assignEmployee = (dayOfWeek: number, shiftType: ShiftType, employee: User) => {
    const key = getAssignmentKey(dayOfWeek, shiftType);
    const currentAssignments = assignments[key] || [];

    if (!currentAssignments.find(e => e.id === employee.id)) {
      const newAssignments = {
        ...assignments,
        [key]: [...currentAssignments, employee]
      };
      setAssignments(newAssignments);
      onAssignmentsChange?.(newAssignments);
    }
  };

  const removeEmployee = (dayOfWeek: number, shiftType: ShiftType, employeeId: string) => {
    const key = getAssignmentKey(dayOfWeek, shiftType);
    const currentAssignments = assignments[key] || [];

    const newAssignments = {
      ...assignments,
      [key]: currentAssignments.filter(e => e.id !== employeeId)
    };
    setAssignments(newAssignments);
    onAssignmentsChange?.(newAssignments);
  };

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

  const getPositionIcon = (position: EmployeePosition) => {
    switch (position) {
      case EmployeePosition.SHIFT_MANAGER:
        return Crown;
      case EmployeePosition.BARTENDER:
        return Wine;
      case EmployeePosition.SERVER:
        return UserCheck;
      default:
        return UserCheck;
    }
  };

  const getPositionColor = (position: EmployeePosition) => {
    switch (position) {
      case EmployeePosition.SHIFT_MANAGER:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case EmployeePosition.BARTENDER:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case EmployeePosition.SERVER:
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const AvailableEmployeesList = ({ dayOfWeek, shiftType }: { dayOfWeek: number; shiftType: ShiftType }) => {
    const availableEmployees = getAvailableEmployees(dayOfWeek, shiftType);
    const assignedEmployees = getAssignedEmployees(dayOfWeek, shiftType);

    return (
      <div className="space-y-2 mt-3">
        <h5 className="text-xs font-medium text-gray-700">עובדים זמינים:</h5>
        {availableEmployees.length === 0 ? (
          <p className="text-xs text-gray-400">אין עובדים זמינים</p>
        ) : (
          <div className="space-y-1">
            {availableEmployees.map(employee => {
              const isAssigned = assignedEmployees.find(e => e.id === employee.id);

              return (
                <button
                  key={employee.id}
                  onClick={() => assignEmployee(dayOfWeek, shiftType, employee)}
                  disabled={!!isAssigned}
                  className={`w-full text-right p-2 rounded-lg text-xs tap-feedback ${
                    isAssigned
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{employee.fullName}</span>
                    <span className="text-xs opacity-75">
                      {getPositionLabel(employee.position as EmployeePosition)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const AssignedEmployeesList = ({ dayOfWeek, shiftType }: { dayOfWeek: number; shiftType: ShiftType }) => {
    const assignedEmployees = getAssignedEmployees(dayOfWeek, shiftType);

    // Group employees by position
    const employeesByPosition = assignedEmployees.reduce((acc, employee) => {
      const position = employee.position as EmployeePosition;
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(employee);
      return acc;
    }, {} as Record<EmployeePosition, User[]>);

    const positions = [EmployeePosition.SHIFT_MANAGER, EmployeePosition.BARTENDER, EmployeePosition.SERVER];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-medium text-gray-700">משובצים:</h5>
          <span className="text-xs text-gray-500">{assignedEmployees.length} עובדים</span>
        </div>

        {assignedEmployees.length === 0 ? (
          <div className="text-center py-3">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">לא שובץ אף עובד</p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map(position => {
              const positionEmployees = employeesByPosition[position] || [];
              if (positionEmployees.length === 0) return null;

              const Icon = getPositionIcon(position);
              const colorClass = getPositionColor(position);

              return (
                <div key={position} className="space-y-1">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${colorClass}`}>
                    <Icon className="w-3 h-3" />
                    <span className="text-xs font-medium">
                      {getPositionLabel(position)} ({positionEmployees.length})
                    </span>
                  </div>

                  <div className="space-y-1 mr-4">
                    {positionEmployees.map(employee => (
                      <div
                        key={employee.id}
                        className={`flex items-center justify-between p-2 rounded-lg border ${colorClass}`}
                      >
                        <div className="text-right">
                          <p className="text-xs font-medium">{employee.fullName}</p>
                        </div>
                        <button
                          onClick={() => removeEmployee(dayOfWeek, shiftType, employee.id)}
                          className="p-1 tap-feedback text-red-500 hover:bg-red-100 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const ShiftCard = ({ dayOfWeek, shiftType, title }: { dayOfWeek: number; shiftType: ShiftType; title: string }) => {
    const Icon = shiftType === ShiftType.LUNCH ? Coffee : Moon;
    const timeLabel = shiftType === ShiftType.LUNCH ? '11:00-16:00' : '18:00-23:00';
    const assignedEmployees = getAssignedEmployees(dayOfWeek, shiftType);
    const assignedCount = assignedEmployees.length;
    const availableCount = getAvailableEmployees(dayOfWeek, shiftType).length;

    // Count employees by position for summary
    const positionCounts = assignedEmployees.reduce((acc, employee) => {
      const position = employee.position as EmployeePosition;
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {} as Record<EmployeePosition, number>);

    const positionSummary = [
      { position: EmployeePosition.SHIFT_MANAGER, count: positionCounts[EmployeePosition.SHIFT_MANAGER] || 0, icon: Crown, color: 'text-purple-600' },
      { position: EmployeePosition.BARTENDER, count: positionCounts[EmployeePosition.BARTENDER] || 0, icon: Wine, color: 'text-blue-600' },
      { position: EmployeePosition.SERVER, count: positionCounts[EmployeePosition.SERVER] || 0, icon: UserCheck, color: 'text-green-600' }
    ];

    return (
      <div className="card card-default">
        <div className="space-y-3">
          {/* Shift Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Icon className="w-4 h-4 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{title}</p>
              <p className="text-xs text-gray-500">{timeLabel}</p>

              {/* Position Summary */}
              {assignedCount > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  {positionSummary.map(({ position, count, icon: PosIcon, color }) => {
                    if (count === 0) return null;
                    return (
                      <div key={position} className={`flex items-center gap-1 ${color}`}>
                        <PosIcon className="w-3 h-3" />
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {assignedCount}/{availableCount}
            </div>
          </div>

          {/* Assigned Employees */}
          <AssignedEmployeesList dayOfWeek={dayOfWeek} shiftType={shiftType} />

          {/* Available Employees */}
          <AvailableEmployeesList dayOfWeek={dayOfWeek} shiftType={shiftType} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Day Navigation Tabs */}
      <div className="card card-default">
        <div className="flex overflow-x-auto gap-2 p-2">
          {daysOfWeek.map((day, dayIndex) => {
            const isSelected = selectedDay === dayIndex;
            const lunchAssigned = getAssignedEmployees(dayIndex, ShiftType.LUNCH).length;
            const dinnerAssigned = getAssignedEmployees(dayIndex, ShiftType.DINNER).length;
            const hasAssignments = lunchAssigned > 0 || dinnerAssigned > 0;

            return (
              <button
                key={dayIndex}
                onClick={() => setSelectedDay(dayIndex)}
                className={`flex-shrink-0 px-3 py-2 rounded-full tap-feedback border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : hasAssignments
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
                style={{ minWidth: '70px' }}
              >
                <div className="text-center">
                  <p className="text-sm font-semibold">{day}</p>
                  {hasAssignments && (
                    <p className="text-xs opacity-75">{lunchAssigned + dinnerAssigned}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {daysOfWeek[selectedDay]}
        </h3>
        <p className="text-sm text-gray-500">
          {format(addDays(weekDate, selectedDay), 'dd MMMM yyyy', { locale: he })}
        </p>
      </div>

      {/* Shift Assignment Grid */}
      <div className="grid grid-cols-1 gap-4">
        <ShiftCard
          dayOfWeek={selectedDay}
          shiftType={ShiftType.LUNCH}
          title="משמרת צהריים"
        />
        <ShiftCard
          dayOfWeek={selectedDay}
          shiftType={ShiftType.DINNER}
          title="משמרת ערב"
        />
      </div>

      {/* Summary */}
      <div className="card card-muted">
        <div className="text-center">
          <p className="text-xs text-gray-600">
            סה"כ משובצים השבוע: {Object.values(assignments).flat().length} משמרות
          </p>
        </div>
      </div>
    </div>
  );
};
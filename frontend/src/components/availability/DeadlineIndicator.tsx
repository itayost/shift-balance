import { useEffect, useState } from 'react';
import { differenceInHours, differenceInMinutes, format } from 'date-fns';
import { he } from 'date-fns/locale';

interface DeadlineIndicatorProps {
  deadline: Date;
  isPastDeadline: boolean;
}

export const DeadlineIndicator = ({ deadline, isPastDeadline }: DeadlineIndicatorProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();

      if (isPastDeadline) {
        setTimeRemaining('המועד עבר');
        return;
      }

      const hoursLeft = differenceInHours(deadline, now);
      const minutesLeft = differenceInMinutes(deadline, now) % 60;

      if (hoursLeft < 0) {
        setTimeRemaining('המועד עבר');
      } else if (hoursLeft === 0) {
        setTimeRemaining(`${minutesLeft} דקות`);
      } else if (hoursLeft < 24) {
        setTimeRemaining(`${hoursLeft} שעות ו-${minutesLeft} דקות`);
      } else {
        const daysLeft = Math.floor(hoursLeft / 24);
        const hoursRemainder = hoursLeft % 24;
        setTimeRemaining(`${daysLeft} ימים ו-${hoursRemainder} שעות`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline, isPastDeadline]);

  const getColorClass = () => {
    const hoursLeft = differenceInHours(deadline, new Date());

    if (isPastDeadline || hoursLeft < 0) {
      return 'bg-red-50 border-red-200 text-red-700';
    } else if (hoursLeft < 6) {
      return 'bg-orange-50 border-orange-200 text-orange-700';
    } else if (hoursLeft < 24) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    } else {
      return 'bg-green-50 border-green-200 text-green-700';
    }
  };

  const getIcon = () => {
    if (isPastDeadline) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`rounded-lg border p-4 ${getColorClass()}`}>
      <div className="flex items-start space-x-3 space-x-reverse">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">
            מועד אחרון להגשת זמינות
          </h4>
          <p className="text-sm">
            יום חמישי, {format(deadline, 'dd בMMMM', { locale: he })} בשעה 16:00
          </p>
          <p className="text-sm font-bold mt-1">
            {isPastDeadline ? (
              <span className="text-red-600">המועד עבר</span>
            ) : (
              <>נותרו: {timeRemaining}</>
            )}
          </p>
        </div>
      </div>

      {!isPastDeadline && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="flex items-center text-xs">
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            הזמינות נשמרת אוטומטית כל 30 שניות
          </div>
        </div>
      )}
    </div>
  );
};
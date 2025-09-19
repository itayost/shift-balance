import { useState, useEffect } from 'react';
import { useSwapStore } from '../../store/swap.store';
import { useScheduleStore } from '../../store/schedule.store';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Coffee, Moon, X, Send, AlertCircle } from 'lucide-react';

interface CreateSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSwapModal = ({ isOpen, onClose }: CreateSwapModalProps) => {
  const { createSwapRequest, isLoading } = useSwapStore();
  const { userShifts, fetchMyShifts } = useScheduleStore();

  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchMyShifts();
    }
  }, [isOpen, fetchMyShifts]);

  const getShiftTypeLabel = (type: string) => {
    return type === 'LUNCH' ? 'צהריים' : 'ערב';
  };

  const getShiftIcon = (type: string) => {
    return type === 'LUNCH' ? Coffee : Moon;
  };

  // Backend already filters to swappable shifts (4+ hours notice, published schedules)
  const swappableShifts = userShifts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedShiftId) {
      return;
    }

    const success = await createSwapRequest({
      shiftId: selectedShiftId,
      reason: reason.trim() || undefined
    });

    if (success) {
      setSelectedShiftId('');
      setReason('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedShiftId('');
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">בקשת החלפת משמרת</h2>
          <button
            onClick={handleClose}
            className="p-2 tap-feedback rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shift Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                בחר משמרת להחלפה
              </label>

              {swappableShifts.length === 0 ? (
                <div className="card card-muted text-center py-6">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">אין לך משמרות זמינות להחלפה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {swappableShifts.map(shift => {
                    const Icon = getShiftIcon(shift.type);
                    const isSelected = selectedShiftId === shift.id;

                    return (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => setSelectedShiftId(shift.id)}
                        className={`w-full card tap-feedback transition-colors ${
                          isSelected ? 'card-active' : 'card-default'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                          <div className="flex-1 text-right">
                            <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {format(new Date(shift.date), 'EEEE dd/MM', { locale: he })}
                            </p>
                            <p className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                              משמרת {getShiftTypeLabel(shift.type)} • {shift.startTime}-{shift.endTime}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason (Optional) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                סיבת ההחלפה (אופציונלי)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="למשל: בעיה אישית, מחלה, אירוע חשוב..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 text-left">
                {reason.length}/200
              </p>
            </div>

            {/* Important Notice */}
            <div className="card card-warning">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-orange-800">
                  <p className="font-medium mb-1">שים לב:</p>
                  <ul className="space-y-1">
                    <li>• ניתן לבטל בקשה רק עד שמישהו מקבל אותה</li>
                    <li>• מקסימום 2 בקשות החלפה פתוחות בו זמנית</li>
                    <li>• לא ניתן לבקש החלפה פחות מ-4 שעות לפני המשמרת</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={!selectedShiftId || isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>שולח...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    שלח בקשת החלפה
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="btn btn-outline w-full"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
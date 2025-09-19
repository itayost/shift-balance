import { useEffect, useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useSwapStore } from '../store/swap.store';
import { useScheduleStore } from '../store/schedule.store';
import { CreateSwapModal } from '../components/swap/CreateSwapModal';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ArrowRightLeft,
  Coffee,
  Moon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

export const SwapPage = () => {
  const {
    myRequests,
    availableRequests,
    isLoading,
    error,
    fetchMyRequests,
    fetchAvailableRequests,
    acceptSwapRequest,
    cancelSwapRequest,
    clearError
  } = useSwapStore();

  const { userShifts, fetchMyShifts } = useScheduleStore();
  const [activeTab, setActiveTab] = useState<'available' | 'my-requests'>('available');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchMyRequests();
    fetchAvailableRequests();
    fetchMyShifts();
  }, [fetchMyRequests, fetchAvailableRequests, fetchMyShifts]);

  const getShiftTypeLabel = (type: string) => {
    return type === 'LUNCH' ? 'צהריים' : 'ערב';
  };

  const getShiftIcon = (type: string) => {
    return type === 'LUNCH' ? Coffee : Moon;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳ ממתין להחלפה';
      case 'APPROVED':
        return '✅ הוחלף בהצלחה';
      case 'REJECTED':
        return '❌ נדחה';
      case 'CANCELLED':
        return '🚫 בוטל';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Clock;
      case 'APPROVED':
        return CheckCircle;
      case 'REJECTED':
        return XCircle;
      case 'CANCELLED':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const handleAcceptSwap = async (swapRequestId: string) => {
    await acceptSwapRequest(swapRequestId);
  };

  const handleCancelSwap = async (swapRequestId: string) => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך לבטל את בקשת ההחלפה?');
    if (confirmed) {
      await cancelSwapRequest(swapRequestId);
    }
  };

  const AvailableSwapCard = ({ request }: { request: any }) => {
    const Icon = getShiftIcon(request.shift.type);

    // Calculate urgency
    const shiftDate = new Date(request.shift.date);
    const now = new Date();
    const hoursUntilShift = Math.round((shiftDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const isUrgent = hoursUntilShift <= 24;

    return (
      <div className={`card ${isUrgent ? 'card-warning' : 'card-default'}`}>
        <div className="space-y-3">
          {/* Urgency Badge */}
          {isUrgent && (
            <div className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-full w-fit">
              <AlertCircle className="w-3 h-3" />
              דחוף - {hoursUntilShift} שעות למשמרת
            </div>
          )}

          {/* Shift Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(request.shift.date, 'EEEE', { locale: he })}
                </p>
                <p className="text-xs text-gray-500">
                  {format(request.shift.date, 'dd/MM')} • משמרת {getShiftTypeLabel(request.shift.type)}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {request.shift.startTime}-{request.shift.endTime}
            </div>
          </div>

          {/* Requester Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3 h-3 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {request.requestedBy.fullName}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              רמה: {request.requestedBy.level} • תפקיד: {request.requestedBy.position}
            </p>
            {request.reason && (
              <p className="text-xs text-gray-600 mt-1">
                סיבה: {request.reason}
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleAcceptSwap(request.id)}
            disabled={isLoading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4 ml-2" />
            קח את המשמרת
          </button>
        </div>
      </div>
    );
  };

  const MyRequestCard = ({ request }: { request: any }) => {
    const Icon = getShiftIcon(request.shift.type);
    const StatusIcon = getStatusIcon(request.status);
    const statusColor = getStatusColor(request.status);

    // Calculate time until shift
    const shiftDate = new Date(request.shift.date);
    const now = new Date();
    const hoursUntilShift = Math.round((shiftDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    return (
      <div className="card card-default">
        <div className="space-y-3">
          {/* Status Badge with Icon */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${statusColor}`}>
              <StatusIcon className="w-3 h-3" />
              {getStatusLabel(request.status)}
            </div>
            <div className="text-xs text-gray-500">
              נוצר {format(request.createdAt, 'dd/MM HH:mm')}
            </div>
          </div>

          {/* Shift Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(request.shift.date, 'EEEE dd/MM', { locale: he })}
                </p>
                <p className="text-xs text-gray-500">
                  משמרת {getShiftTypeLabel(request.shift.type)} • {request.shift.startTime}-{request.shift.endTime}
                </p>
              </div>
            </div>
            {/* Time Until Shift */}
            {request.status === 'PENDING' && hoursUntilShift > 0 && (
              <div className={`text-xs font-medium ${
                hoursUntilShift <= 12 ? 'text-red-600' :
                hoursUntilShift <= 24 ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {hoursUntilShift < 24
                  ? `${hoursUntilShift} שעות`
                  : `${Math.round(hoursUntilShift / 24)} ימים`
                }
              </div>
            )}
          </div>

          {request.reason && (
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-600">
                סיבה: {request.reason}
              </p>
            </div>
          )}

          {/* Accepted By Info */}
          {request.acceptedBy && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-800 mb-1">
                    🤝 הוחלף עם:
                  </p>
                  <p className="text-sm font-medium text-green-900">
                    {request.acceptedBy.fullName}
                  </p>
                  <p className="text-xs text-green-700">
                    רמה: {request.acceptedBy.level} • תפקיד: {request.acceptedBy.position}
                  </p>
                </div>
                {request.resolvedAt && (
                  <div className="text-xs text-green-600">
                    {format(new Date(request.resolvedAt), 'dd/MM HH:mm')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {request.status === 'PENDING' && (
            <button
              onClick={() => handleCancelSwap(request.id)}
              disabled={isLoading}
              className="btn btn-outline w-full disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 ml-2" />
              בטל בקשה
            </button>
          )}
        </div>
      </div>
    );
  };

  const CreateSwapButton = () => (
    <button
      onClick={() => setShowCreateModal(true)}
      className="btn btn-primary w-full"
    >
      <Plus className="w-4 h-4 ml-2" />
      בקש החלפת משמרת
    </button>
  );

  return (
    <MobileLayout title="החלפת משמרות">
      <div className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="card card-danger">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={clearError} className="text-red-600">×</button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="card card-default">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'available'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              זמינות להחלפה ({availableRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-requests'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              הבקשות שלי ({myRequests.length})
            </button>
          </div>
        </div>

        {/* Create Swap Button */}
        {activeTab === 'my-requests' && (
          <CreateSwapButton />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card card-default">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'available' ? (
              availableRequests.length === 0 ? (
                <div className="card card-muted text-center py-8">
                  <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">אין בקשות החלפה זמינות כרגע</p>
                </div>
              ) : (
                availableRequests.map(request => (
                  <AvailableSwapCard key={request.id} request={request} />
                ))
              )
            ) : (
              myRequests.length === 0 ? (
                <div className="card card-muted text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">אין לך בקשות החלפה</p>
                  <p className="text-xs text-gray-500 mt-1">לחץ על "בקש החלפת משמרת" להתחיל</p>
                </div>
              ) : (
                myRequests.map(request => (
                  <MyRequestCard key={request.id} request={request} />
                ))
              )
            )}
          </div>
        )}

        {/* Create Swap Modal */}
        <CreateSwapModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </MobileLayout>
  );
};
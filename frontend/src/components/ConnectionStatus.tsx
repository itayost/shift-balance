import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus = ({ isConnected }: ConnectionStatusProps) => {
  return (
    <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-md transition-all ${
      isConnected
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-medium">מחובר</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-medium">מתחבר מחדש...</span>
        </>
      )}
    </div>
  );
};
import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in pointer-events-auto">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${
          isSuccess
            ? 'bg-geo-green/10 border-geo-green/30 text-geo-green'
            : 'bg-geo-red/10 border-geo-red/30 text-geo-red'
        }`}
      >
        <span className="text-sm font-semibold">{isSuccess ? '✓' : '⚠'}</span>
        <p className="text-xs font-medium leading-relaxed flex-1 select-text">{message}</p>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary text-[10px] transition-colors p-1 rounded"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

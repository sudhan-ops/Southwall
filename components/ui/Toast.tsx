
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useBrandingStore } from '../../store/brandingStore';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const { colorScheme } = useBrandingStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const getBgColor = () => {
    if (type === 'error') return 'bg-red-500';
    // Success color depends on theme
    return colorScheme === 'blue' ? 'bg-[#1a3a6e]' : 'bg-green-500';
  };

  const bgColor = getBgColor();
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg text-white shadow-lg ${bgColor}`}>
      <Icon className="h-6 w-6 mr-3" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-4 -mr-2 p-1.5 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
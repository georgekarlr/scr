import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface StatusMessageProps {
  status: 'success' | 'error' | 'loading' | 'idle';
  message?: React.ReactNode;
  className?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message, className = '' }) => {
  if (status === 'idle' || (!message && status !== 'loading')) return null;

  const statusStyles = {
    success: 'bg-green-50 border-green-100 text-green-700',
    error: 'bg-red-50 border-red-100 text-red-700',
    loading: 'bg-blue-50 border-blue-100 text-blue-700',
    idle: '',
  };

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    loading: Loader2,
    idle: () => null,
  }[status];

  return (
    <div className={`rounded-xl p-4 border flex items-center space-x-3 ${statusStyles[status]} ${className}`}>
      <Icon className={`h-5 w-5 flex-shrink-0 ${status === 'loading' ? 'animate-spin' : ''}`} />
      <p className="text-sm font-medium">{message || (status === 'loading' ? 'Loading...' : '')}</p>
    </div>
  );
};

export default StatusMessage;

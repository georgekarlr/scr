import React from 'react';
import { Link } from 'react-router-dom';
import { X, MessageSquare, Loader2, Copy, Star } from 'lucide-react';
import { GetSetForPlayResponse } from '../../types/study';

interface StudyHeaderProps {
  data: GetSetForPlayResponse | null;
  cloning: boolean;
  onClose: () => void;
  onClone: () => void;
  onShowSetComments: () => void;
  onShowRateModal: () => void;
}

const StudyHeader: React.FC<StudyHeaderProps> = ({
  data,
  cloning,
  onClose,
  onClone,
  onShowSetComments,
  onShowRateModal
}) => {
  return (
    <div className="p-4 sm:p-6 flex items-center justify-between bg-white border-b border-gray-100">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
          {data?.set.emoji || '📚'}
        </div>
        <Link 
          to={data ? `/p/${data.set.id}` : '#'} 
          onClick={(e) => {
            if (!data) e.preventDefault();
            else onClose();
          }}
          className="min-w-0 hover:opacity-75 transition-opacity"
        >
          <h3 className="font-bold text-gray-900 line-clamp-1 text-base">{data?.set.title || 'Loading...'}</h3>
          <p className="text-xs text-gray-500">{data?.set.subject || 'Study Set'}</p>
        </Link>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button 
          onClick={onShowSetComments}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600"
          title="View set comments"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button 
          onClick={onClone}
          disabled={cloning || !data}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600 disabled:opacity-50"
          title="Clone this set"
        >
          {cloning ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
        <button
          onClick={onShowRateModal}
          disabled={!data}
          className="px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-yellow-50 rounded-xl transition-colors text-gray-600 hover:text-yellow-600 disabled:opacity-50 flex items-center space-x-1 sm:space-x-2 border border-gray-100 hover:border-yellow-200"
          title="Rate this set"
        >
          <Star className="h-5 w-5" />
          <span className="text-xs sm:text-sm font-bold">Rate</span>
        </button>
        <button 
          onClick={onClose}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default StudyHeader;
import React from 'react';
import { Heart, MessageSquare, Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { StudyItemPlay } from '../../types/study';

interface StudyFooterProps {
  currentIndex: number;
  totalItems: number;
  currentItem: StudyItemPlay | undefined;
  togglingReaction: boolean;
  sessionFinished: boolean;
  isFinishing: boolean;
  onToggleReaction: () => void;
  onShowLikers: () => void;
  onShowItemComments: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const StudyFooter: React.FC<StudyFooterProps> = ({
  currentIndex,
  totalItems,
  currentItem,
  togglingReaction,
  sessionFinished,
  isFinishing,
  onToggleReaction,
  onShowLikers,
  onShowItemComments,
  onPrev,
  onNext
}) => {
  return (
    <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            <button 
              onClick={onToggleReaction}
              disabled={togglingReaction}
              className="text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
              title={currentItem?.is_liked ? "Unlike this card" : "Like this card"}
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${currentItem?.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button 
              onClick={onShowLikers}
              className="text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {currentItem?.like_count || 0}
            </button>
          </div>
          <button 
            onClick={onShowItemComments}
            className="flex items-center space-x-1 sm:space-x-1.5 text-gray-500 hover:text-blue-500 transition-colors p-1"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-bold">{currentItem?.comment_count || 0}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-100">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Level {currentItem?.study_data.box_level || 0}
            </span>
          </div>

          <div className="text-sm font-bold text-gray-400">
            {currentIndex + 1} <span className="text-gray-300 mx-1">/</span> {totalItems}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <button 
          onClick={onPrev}
          disabled={currentIndex === 0 || sessionFinished}
          className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 rounded-2xl border-2 border-gray-100 font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors text-xs sm:text-base active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Previous</span>
        </button>
        <button 
          onClick={onNext}
          disabled={isFinishing || sessionFinished}
          className="flex-[2] flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-30 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-xs sm:text-base active:scale-95"
        >
          {isFinishing ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <>
              <span>{currentIndex === totalItems - 1 ? 'Finish Session' : 'Next Card'}</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StudyFooter;
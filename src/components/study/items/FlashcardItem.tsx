import React from 'react';
import { Brain } from 'lucide-react';
import { FlashcardContent } from '../../../types/study';

interface FlashcardItemProps {
  content: FlashcardContent;
  flipped: boolean;
  onFlip: () => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ content, flipped, onFlip }) => {
  return (
    <div
      onClick={onFlip}
      className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] max-h-[60vh] cursor-pointer perspective-1000 group"
    >
      <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl overflow-y-auto">
          <div className="absolute top-4 left-4 bg-blue-50 p-2 rounded-xl">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-relaxed">{content.front}</h2>
          {content.image_url && <img src={content.image_url} alt="" className="mt-4 max-h-32 object-contain rounded-lg" />}
          <p className="mt-6 sm:mt-8 text-xs text-blue-500 font-black uppercase tracking-widest animate-pulse">Click to flip</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-500 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl rotate-y-180 text-white overflow-y-auto">
          <div className="absolute top-4 left-4 bg-white/20 p-2 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <p className="text-lg sm:text-xl font-medium mb-4 leading-relaxed">{content.back}</p>
          {content.explanation && (
            <div className="mt-4 p-3 sm:p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-sm italic">
              {content.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;

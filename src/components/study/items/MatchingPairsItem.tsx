import React from 'react';
import { GitMerge } from 'lucide-react';
import { MatchingPairsContent } from '../../../types/study';

interface MatchingPairsItemProps {
  content: MatchingPairsContent;
  shuffledLeft: string[];
  shuffledRight: string[];
  matchingMatches: Record<string, string>;
  matchingSelected: { side: 'left' | 'right', text: string } | null;
  isAnswered: boolean;
  onSelect: (side: 'left' | 'right', text: string) => void;
  onReset: () => void;
  onCheck: () => void;
}

const MatchingPairsItem: React.FC<MatchingPairsItemProps> = ({
  content,
  shuffledLeft,
  shuffledRight,
  matchingMatches,
  matchingSelected,
  isAnswered,
  onSelect,
  onReset,
  onCheck
}) => {
  const leftOptions = shuffledLeft.length > 0 ? shuffledLeft : content.pairs.map(p => p.left);
  const rightOptions = shuffledRight.length > 0 ? shuffledRight : content.pairs.map(p => p.right);

  return (
    <div className="w-full bg-white border-2 border-purple-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-purple-600">
        <GitMerge className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Matching Pairs</span>
      </div>
      {content.question && <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>}
      
      <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6">
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-1 sm:mb-2">Terms</p>
          {leftOptions.map((text, idx) => {
            const isSelected = matchingSelected?.side === 'left' && matchingSelected.text === text;
            const isMatched = !!matchingMatches[text];
            const isCorrect = isAnswered && matchingMatches[text] === content.pairs.find(p => p.left === text)?.right;

            return (
              <button
                key={`left-${idx}`}
                disabled={isAnswered || isMatched}
                onClick={() => onSelect('left', text)}
                className={`w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${
                  isAnswered 
                    ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                    : (isSelected ? 'border-purple-500 bg-purple-50 text-purple-700' : 
                       isMatched ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-purple-100 bg-purple-50 text-purple-700 hover:border-purple-300')
                }`}
              >
                {text}
              </button>
            );
          })}
        </div>
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-1 sm:mb-2">Definitions</p>
          {rightOptions.map((text, idx) => {
            const isSelected = matchingSelected?.side === 'right' && matchingSelected.text === text;
            const matchedLeft = Object.keys(matchingMatches).find(key => matchingMatches[key] === text);
            const isMatched = !!matchedLeft;
            const isCorrect = isAnswered && matchedLeft && content.pairs.find(p => p.left === matchedLeft)?.right === text;

            return (
              <button
                key={`right-${idx}`}
                disabled={isAnswered || isMatched}
                onClick={() => onSelect('right', text)}
                className={`w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${
                  isAnswered 
                    ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                    : (isSelected ? 'border-purple-500 bg-purple-50 text-purple-700' : 
                       isMatched ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-gray-50 bg-gray-50 text-gray-700 hover:border-gray-200')
                }`}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>

      {!isAnswered && (
        <div className="flex space-x-2">
          <button
            onClick={onReset}
            className="flex-1 py-3 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm"
          >
            Reset
          </button>
          <button
            onClick={onCheck}
            disabled={Object.keys(matchingMatches).length < content.pairs.length}
            className="flex-[2] py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all disabled:opacity-50 text-sm"
          >
            Check Matches
          </button>
        </div>
      )}

      {isAnswered && content.explanation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold text-gray-900 mb-1">Explanation</p>
          <p className="text-sm text-gray-600 italic">{content.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MatchingPairsItem;

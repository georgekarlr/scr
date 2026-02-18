import React from 'react';
import { Type } from 'lucide-react';
import { WrittenAnswerContent } from '../../../types/study';

interface WrittenAnswerItemProps {
  content: WrittenAnswerContent;
  writtenAnswer: string;
  isAnswered: boolean;
  onAnswerChange: (value: string) => void;
  onCheck: () => void;
}

const WrittenAnswerItem: React.FC<WrittenAnswerItemProps> = ({
  content,
  writtenAnswer,
  isAnswered,
  onAnswerChange,
  onCheck
}) => {
  const isCorrect = content.accepted_answers.some(
    ans => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase()
  );

  return (
    <div className="w-full bg-white border-2 border-pink-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-pink-600">
        <Type className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Written Answer</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>
      
      <div className="space-y-4">
        <input
          type="text"
          value={writtenAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={isAnswered}
          placeholder="Type your answer here..."
          className={`w-full p-3 sm:p-4 rounded-2xl border-2 transition-all font-medium focus:outline-none text-sm sm:text-base ${
            isAnswered 
              ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
              : 'border-gray-50 bg-gray-50 text-gray-900 focus:border-pink-500 focus:bg-pink-50'
          }`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isAnswered && writtenAnswer.trim()) {
              onCheck();
            }
          }}
        />
        
        {!isAnswered && (
          <button
            onClick={onCheck}
            disabled={!writtenAnswer.trim()}
            className="w-full py-3 sm:py-4 bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-100 hover:bg-pink-700 transition-all disabled:opacity-50 text-sm sm:text-base"
          >
            Check Answer
          </button>
        )}
      </div>

      {isAnswered && (
        <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {!isCorrect && (
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-sm font-bold text-green-900 mb-1">Correct Answer(s):</p>
              <div className="flex flex-wrap gap-2">
                {content.accepted_answers.map((ans, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white border border-green-200 rounded-full text-sm text-green-700 font-medium">
                    {ans}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {content.explanation && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-1">Explanation</p>
              <p className="text-sm text-gray-600 italic">{content.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WrittenAnswerItem;

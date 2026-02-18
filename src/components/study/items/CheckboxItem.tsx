import React from 'react';
import { CheckSquare as CheckSquareIcon } from 'lucide-react';
import { CheckboxQuestionContent, CheckboxOption } from '../../../types/study';

interface CheckboxItemProps {
  content: CheckboxQuestionContent;
  shuffledOptions: CheckboxOption[];
  selectedOptionIds: number[];
  isAnswered: boolean;
  onToggle: (optionId: number) => void;
  onCheck: () => void;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({
  content,
  shuffledOptions,
  selectedOptionIds,
  isAnswered,
  onToggle,
  onCheck
}) => {
  return (
    <div className="w-full bg-white border-2 border-indigo-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-indigo-600">
        <CheckSquareIcon className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Multiple Select</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>
      <div className="space-y-2 sm:space-y-3 mb-6">
        {shuffledOptions.map((opt) => {
          const isSelected = selectedOptionIds.includes(opt.id);
          const isCorrect = content.correct_option_ids.includes(opt.id);
          
          let buttonClass = "w-full text-left p-3 sm:p-4 rounded-2xl border-2 transition-all text-sm sm:text-base font-medium flex items-center justify-between group ";
          
          if (isAnswered) {
            if (isCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-700";
            } else if (isSelected) {
              buttonClass += "border-red-500 bg-red-50 text-red-700";
            } else {
              buttonClass += "border-gray-50 text-gray-400 opacity-50 bg-white";
            }
          } else {
            buttonClass += isSelected 
              ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
              : "border-gray-50 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700";
          }

          return (
            <button 
              key={opt.id}
              disabled={isAnswered}
              onClick={() => onToggle(opt.id)}
              className={buttonClass}
            >
              <span className="min-w-0 flex-1 mr-2">{opt.text}</span>
              <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-lg border-2 transition-colors flex-shrink-0 flex items-center justify-center ${
                isAnswered && isCorrect ? 'border-green-500 bg-green-500' : 
                isAnswered && isSelected && !isCorrect ? 'border-red-500 bg-red-500' : 
                !isAnswered && isSelected ? 'border-indigo-500 bg-indigo-500' :
                'border-gray-200 group-hover:border-indigo-300'
              }`}>
                {(isSelected || (isAnswered && isCorrect)) && (
                  <CheckSquareIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      {!isAnswered && (
        <button
          onClick={onCheck}
          disabled={selectedOptionIds.length === 0}
          className="w-full py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm sm:text-base"
        >
          Check Answers
        </button>
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

export default CheckboxItem;

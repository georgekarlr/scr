import React from 'react';
import { CheckSquare } from 'lucide-react';
import { QuizQuestionContent, QuizQuestionOption } from '../../../types/study';

interface QuizItemProps {
  content: QuizQuestionContent;
  shuffledOptions: QuizQuestionOption[];
  selectedOptionId: number | null;
  isAnswered: boolean;
  onAnswer: (optionId: number, isCorrect: boolean) => void;
}

const QuizItem: React.FC<QuizItemProps> = ({ 
  content, 
  shuffledOptions, 
  selectedOptionId, 
  isAnswered, 
  onAnswer 
}) => {
  return (
    <div className="w-full bg-white border-2 border-orange-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-orange-600">
        <CheckSquare className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Multiple Choice</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 sm:mb-8 leading-tight">{content.question}</h2>
      <div className="space-y-2 sm:space-y-3">
        {shuffledOptions.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrect = opt.id === content.correct_option_id;
          
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
            buttonClass += "border-gray-50 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 text-gray-700";
          }

          return (
            <button 
              key={opt.id}
              disabled={isAnswered}
              onClick={() => onAnswer(opt.id, opt.id === content.correct_option_id)}
              className={buttonClass}
            >
              <span className="min-w-0 flex-1 mr-2">{opt.text}</span>
              <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 transition-colors flex-shrink-0 flex items-center justify-center ${
                isAnswered && isCorrect ? 'border-green-500 bg-green-500' : 
                isAnswered && isSelected ? 'border-red-500 bg-red-500' : 
                'border-gray-200 group-hover:border-blue-500'
              }`}>
                {isAnswered && (isCorrect || isSelected) && (
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      {isAnswered && content.explanation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold text-gray-900 mb-1">Explanation</p>
          <p className="text-sm text-gray-600 italic">{content.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuizItem;

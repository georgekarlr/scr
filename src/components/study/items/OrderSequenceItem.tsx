import React from 'react';
import { ListOrdered, ChevronLeft, ChevronRight } from 'lucide-react';
import { OrderSequenceContent } from '../../../types/study';

interface OrderSequenceItemProps {
  content: OrderSequenceContent;
  orderedItems: string[];
  isAnswered: boolean;
  onMove: (idx: number, direction: 'up' | 'down') => void;
  onCheck: () => void;
}

const OrderSequenceItem: React.FC<OrderSequenceItemProps> = ({
  content,
  orderedItems,
  isAnswered,
  onMove,
  onCheck
}) => {
  return (
    <div className="w-full bg-white border-2 border-blue-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-blue-600">
        <ListOrdered className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Order Sequence</span>
      </div>
      {content.question && <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>}
      <div className="space-y-2 sm:space-y-3 mb-6">
        {orderedItems.map((text, idx) => {
          const isCorrectPosition = isAnswered && text === content.items[idx].text;
          return (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                isAnswered 
                  ? (isCorrectPosition ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                  : 'border-blue-50 bg-blue-50 text-blue-900'
              }`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                  isAnswered ? (isCorrectPosition ? 'bg-green-600' : 'bg-red-600') : 'bg-blue-600'
                } text-white`}>
                  {idx + 1}
                </div>
                <span className="font-medium text-base truncate">{text}</span>
              </div>
              {!isAnswered && (
                <div className="flex flex-col space-y-1">
                  <button 
                    onClick={() => onMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 hover:bg-blue-100 rounded-lg disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-90" />
                  </button>
                  <button 
                    onClick={() => onMove(idx, 'down')}
                    disabled={idx === orderedItems.length - 1}
                    className="p-1 hover:bg-blue-100 rounded-lg disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!isAnswered && (
        <button
          onClick={onCheck}
          className="w-full py-3 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 text-sm sm:text-base"
        >
          Check Order
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

export default OrderSequenceItem;

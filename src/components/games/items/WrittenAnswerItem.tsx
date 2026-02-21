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
        <div className="w-full bg-white border-2 border-pink-100 rounded-[40px] p-8 sm:p-12 shadow-2xl">
            <div className="flex items-center space-x-2 mb-8 text-pink-600">
                <Type className="h-8 w-8" />
                <span className="font-black uppercase tracking-[0.2em] text-sm">Transcription Station</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-10 leading-tight">{content.question}</h2>

            <div className="space-y-6">
                <input
                    type="text"
                    value={writtenAnswer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    disabled={isAnswered}
                    placeholder="Type your response here..."
                    className={`w-full p-5 sm:p-7 rounded-3xl border-2 transition-all font-black text-lg sm:text-xl focus:outline-none shadow-inner ${
                        isAnswered
                            ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                            : 'border-gray-50 bg-gray-50 text-gray-900 focus:border-pink-500 focus:bg-pink-50 focus:shadow-[0_0_20px_rgba(236,72,153,0.1)]'
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
                        className="w-full py-5 sm:py-6 bg-pink-600 text-white font-black rounded-3xl shadow-xl shadow-pink-100 hover:bg-pink-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 text-lg uppercase tracking-widest"
                    >
                        Validate Transmission
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

import React from 'react';
import { Sparkles } from 'lucide-react';
import { FinishStudySessionResponse } from '../../types/study';

interface StudySessionSummaryProps {
  sessionSummary: FinishStudySessionResponse | null;
  results: Record<string, boolean>;
  onClose: () => void;
}

const StudySessionSummary: React.FC<StudySessionSummaryProps> = ({ sessionSummary, results, onClose }) => {
  return (
    <div className="text-center animate-in zoom-in duration-500 w-full max-w-md">
      <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Well Done!</h2>
      <p className="text-gray-500 mb-8">You've completed this study session.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cards</p>
          <p className="text-2xl font-black text-gray-900">{sessionSummary?.cards_reviewed ?? Object.keys(results).length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Accuracy</p>
          <p className="text-2xl font-black text-blue-600">
            {sessionSummary ? `${sessionSummary.accuracy}%` : `${Math.round((Object.values(results).filter(Boolean).length / Math.max(Object.keys(results).length, 1)) * 100)}%`}
          </p>
        </div>
      </div>

      {sessionSummary && (
        <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 mb-8">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase mb-1">XP Earned</p>
              <p className="text-2xl font-black text-blue-700">+{sessionSummary.xp_earned}</p>
            </div>
            <div className="w-px h-10 bg-blue-100"></div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Streak</p>
              <div className="flex items-center justify-center space-x-1">
                <p className="text-2xl font-black text-blue-700">{sessionSummary.new_streak}</p>
                {sessionSummary.streak_increased && (
                  <div className="h-5 w-5 bg-orange-100 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-orange-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={onClose}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-95"
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default StudySessionSummary;

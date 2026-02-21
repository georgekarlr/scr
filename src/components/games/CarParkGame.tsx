import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Clock, 
  Trophy, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronLeft,
  Car
} from 'lucide-react';
import { 
  FlashcardContent, 
  QuizQuestionContent, 
  NoteContent, 
  WrittenAnswerContent, 
  CheckboxQuestionContent, 
  MatchingPairsContent, 
  OrderSequenceContent 
} from '../../types/study';
import { useCarParkGame } from './useCarParkGame';

// Import themed items
import FlashcardItem from './items/FlashcardItem';
import QuizItem from './items/QuizItem';
import NoteItem from './items/NoteItem';
import WrittenAnswerItem from './items/WrittenAnswerItem';
import CheckboxItem from './items/CheckboxItem';
import MatchingPairsItem from './items/MatchingPairsItem';
import OrderSequenceItem from './items/OrderSequenceItem';

interface CarParkGameProps {
  setId: string;
  selectedItemIds?: string[];
}

const CarParkGame: React.FC<CarParkGameProps> = ({ setId, selectedItemIds }) => {
  const navigate = useNavigate();
  const {
    gameState,
    setGameState,
    duration,
    setDuration,
    timeLeft,
    score,
    totalCorrect,
    totalMistakes,
    itemStats,
    items,
    currentIndex,
    isAnswered,
    isCorrect,
    gameEndedReason,
    fetchItems,
    handleAnswer,
    flipped, setFlipped,
    selectedOptionId, setSelectedOptionId,
    selectedOptionIds, setSelectedOptionIds,
    writtenAnswer, setWrittenAnswer,
    matchingMatches, setMatchingMatches,
    matchingSelected, setMatchingSelected,
    orderedItems, setOrderedItems,
    shuffledQuizOptions,
    shuffledCheckboxOptions,
    shuffledMatchingLeft,
    shuffledMatchingRight,
  } = useCarParkGame({ setId, selectedItemIds });

  const getItemDisplayText = (stats: any) => {
    switch (stats.type) {
      case 'flashcard':
        return stats.content.front;
      case 'quiz_question':
      case 'written_answer':
      case 'checkbox_question':
      case 'matching_pairs':
      case 'order_sequence':
        return stats.content.question || stats.content.title || 'Driving Challenge';
      case 'note':
        return stats.content.title;
      default:
        return 'Challenge';
    }
  };

  // Duration options in seconds
  const durationOptions = [30, 60, 120, 300];
  const [customDuration, setCustomDuration] = React.useState('');

  const renderItem = () => {
    if (items.length === 0) return null;
    const item = items[currentIndex % items.length];

    switch (item.type) {
      case 'flashcard':
        return (
          <FlashcardItem 
            content={item.content as FlashcardContent}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
            onContinue={() => handleAnswer(true)}
          />
        );
      case 'quiz_question':
        return (
          <QuizItem 
            content={item.content as QuizQuestionContent}
            shuffledOptions={shuffledQuizOptions}
            selectedOptionId={selectedOptionId}
            isAnswered={isAnswered}
            onAnswer={(id, correct) => {
              setSelectedOptionId(id);
              handleAnswer(correct);
            }}
          />
        );
      case 'note':
        return (
          <NoteItem 
            content={item.content as NoteContent} 
            onContinue={() => handleAnswer(true)}
          />
        );
      case 'written_answer':
        return (
          <WrittenAnswerItem 
            content={item.content as WrittenAnswerContent}
            writtenAnswer={writtenAnswer}
            onAnswerChange={setWrittenAnswer}
            isAnswered={isAnswered}
            onCheck={() => {
              const content = item.content as WrittenAnswerContent;
              const isCorrect = content.accepted_answers.some(
                ans => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase()
              );
              handleAnswer(isCorrect);
            }}
          />
        );
      case 'checkbox_question':
        return (
          <CheckboxItem 
            content={item.content as CheckboxQuestionContent}
            shuffledOptions={shuffledCheckboxOptions}
            selectedOptionIds={selectedOptionIds}
            isAnswered={isAnswered}
            onToggle={(id) => {
              if (isAnswered) return;
              setSelectedOptionIds(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
            }}
            onCheck={() => {
              const content = item.content as CheckboxQuestionContent;
              const correctIds = content.correct_option_ids;
              const isCorrect = selectedOptionIds.length === correctIds.length &&
                  selectedOptionIds.every(id => correctIds.includes(id));
              handleAnswer(isCorrect);
            }}
          />
        );
      case 'matching_pairs':
        return (
          <MatchingPairsItem 
            content={item.content as MatchingPairsContent}
            shuffledLeft={shuffledMatchingLeft}
            shuffledRight={shuffledMatchingRight}
            matchingMatches={matchingMatches}
            matchingSelected={matchingSelected}
            isAnswered={isAnswered}
            onSelect={(side, text) => {
                if (isAnswered) return;
                if (!matchingSelected) {
                  setMatchingSelected({ side, text });
                  return;
                }
                if (matchingSelected.side === side) {
                  setMatchingSelected({ side, text });
                  return;
                }
                const left = side === 'left' ? text : matchingSelected.text;
                const right = side === 'right' ? text : matchingSelected.text;
                setMatchingMatches(prev => ({ ...prev, [left]: right }));
                setMatchingSelected(null);
            }}
            onReset={() => {
                setMatchingMatches({});
                setMatchingSelected(null);
            }}
            onCheck={() => {
                const content = item.content as MatchingPairsContent;
                const isCorrect = content.pairs.every(p => matchingMatches[p.left] === p.right);
                handleAnswer(isCorrect);
            }}
          />
        );
      case 'order_sequence':
        return (
          <OrderSequenceItem 
            content={item.content as OrderSequenceContent}
            orderedItems={orderedItems}
            isAnswered={isAnswered}
            onMove={(idx, direction) => {
                if (isAnswered) return;
                const newItems = [...orderedItems];
                const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= newItems.length) return;
                [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
                setOrderedItems(newItems);
            }}
            onCheck={() => {
                const content = item.content as OrderSequenceContent;
                const isCorrect = orderedItems.every((text, idx) => text === content.items[idx].text);
                handleAnswer(isCorrect);
            }}
          />
        );
      default:
        return null;
    }
  };

  if (gameState === 'config') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Set
        </button>

        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-blue-50">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-200 mb-6">
              <Car className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Car Park</h1>
            <p className="text-gray-600 max-w-md text-lg leading-relaxed">
              Drive, park, and solve! Use your car to navigate through study items and park in the correct spots.
            </p>
          </div>

          <div className="max-w-sm mx-auto space-y-8">
            <div>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-4 text-center">
                Select Session Time
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {durationOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDuration(opt);
                      setCustomDuration('');
                    }}
                    className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                      duration === opt && !customDuration
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {opt >= 60 ? `${opt / 60}m` : `${opt}s`}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomDuration(val);
                    if (val && parseInt(val) > 0) {
                      setDuration(parseInt(val) * 60);
                    }
                  }}
                  placeholder="Custom minutes..."
                  className={`w-full py-4 px-6 rounded-2xl font-bold transition-all border-2 outline-none ${
                    customDuration 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 placeholder:text-blue-200' 
                      : 'bg-white border-gray-100 text-gray-600 focus:border-blue-200 focus:bg-blue-50 placeholder:text-gray-400'
                  }`}
                />
                {customDuration && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black uppercase tracking-widest opacity-70">
                    min
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={fetchItems}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <span>START DRIVING</span>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-full shadow-xl mb-6">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
        <p className="text-gray-500 font-bold animate-pulse text-lg">Warming up the engine...</p>
      </div>
    );
  }

  if (gameState === 'game-over') {
    const accuracy = totalCorrect + totalMistakes > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalMistakes)) * 100) 
      : 0;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 overflow-x-hidden">
        <div className="bg-white rounded-3xl p-5 sm:p-10 shadow-2xl border border-blue-50 relative overflow-x-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-2xl mb-5">
              <Trophy className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Driving Lesson Complete!</h1>
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              {gameEndedReason === 'timeout' ? "Time's up! Great session." : "You've parked all the items!"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <div className="bg-blue-50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform border border-blue-100">
              <p className="text-blue-600 font-black uppercase tracking-widest text-[10px] mb-1.5">Total Score</p>
              <p className="text-3xl font-black text-blue-900">{score}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform border border-emerald-100">
              <p className="text-emerald-600 font-black uppercase tracking-widest text-[10px] mb-1.5">Accuracy</p>
              <p className="text-3xl font-black text-emerald-900">{accuracy}%</p>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform border border-indigo-100">
              <p className="text-indigo-600 font-black uppercase tracking-widest text-[10px] mb-1.5">Items Parked</p>
              <p className="text-3xl font-black text-indigo-900">{totalCorrect}</p>
            </div>
          </div>

          {Object.keys(itemStats).length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-tight">
                <Car className="h-5 w-5 text-blue-600" />
                Detailed Driver's Log
              </h3>
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar border border-gray-50 rounded-2xl p-2">
                {Object.entries(itemStats)
                  .sort((a, b) => (a[1].position || 0) - (b[1].position || 0))
                  .map(([id, stats]) => {
                    const isItemCorrect = stats.correct > 0 && stats.mistakes === 0;
                    return (
                      <div 
                        key={id}
                        className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-4 ${
                          isItemCorrect 
                            ? 'bg-emerald-50 border-emerald-100' 
                            : 'bg-red-50 border-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isItemCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
                          }`}>
                            {isItemCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                              {stats.type.replace('_', ' ')}
                            </p>
                            <p className={`font-bold text-sm truncate ${
                              isItemCorrect ? 'text-emerald-900' : 'text-red-900'
                            }`}>
                              {getItemDisplayText(stats)}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-xs font-black ${
                            isItemCorrect ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {isItemCorrect ? 'PERFECT' : `${stats.mistakes} ERR`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={fetchItems}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>DRIVE AGAIN</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black text-base hover:bg-gray-200 transition-all active:scale-95"
            >
              BACK TO SET
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-12 overflow-x-hidden">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-10 bg-white p-4 sm:p-6 rounded-3xl shadow-lg border border-blue-50">
        <div className="flex items-center space-x-3 sm:space-x-6">
          <button 
            onClick={() => setGameState('config')}
            className="p-2 sm:p-3 hover:bg-gray-100 rounded-2xl transition-colors group"
          >
            <XCircle className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 group-hover:text-red-500" />
          </button>
          <div className="h-10 sm:h-12 w-[1px] bg-gray-100 hidden sm:block"></div>
          <div>
            <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current Score</p>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{score}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-10">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Progress</p>
            <p className="text-sm font-bold text-gray-900">{currentIndex + 1} / {items.length}</p>
          </div>
          <div className={`flex items-center space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border-2 transition-colors ${
            timeLeft < 10 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600'
          }`}>
            <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${timeLeft < 10 ? 'animate-bounce' : ''}`} />
            <span className="text-xl sm:text-2xl font-black tabular-nums leading-none">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative">
        {/* Item Content */}
        <div className="transition-all duration-300 transform">
            {renderItem()}
        </div>

        {/* Feedback Overlay */}
        {isAnswered && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-500 ${
            isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
          } backdrop-blur-sm animate-in fade-in`}>
            <div className={`bg-white p-10 sm:p-16 rounded-[40px] shadow-2xl flex flex-col items-center transform animate-in zoom-in duration-300 border-4 ${
              isCorrect ? 'border-emerald-500' : 'border-red-500'
            }`}>
              {isCorrect ? (
                <>
                  <div className="bg-emerald-100 p-6 rounded-full mb-6">
                    <CheckCircle2 className="h-20 w-20 text-emerald-600" />
                  </div>
                  <h2 className="text-4xl font-black text-emerald-900 mb-2 uppercase tracking-tighter">Perfectly Parked!</h2>
                  <p className="text-emerald-600 font-bold text-xl">+10 points</p>
                </>
              ) : (
                <>
                  <div className="bg-red-100 p-6 rounded-full mb-6">
                    <XCircle className="h-20 w-20 text-red-600" />
                  </div>
                  <h2 className="text-4xl font-black text-red-900 mb-2 uppercase tracking-tighter">Fender Bender!</h2>
                  <p className="text-red-600 font-bold text-xl">Keep practicing your parking!</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar & Driver Score */}
      <div className="mt-8 sm:mt-12 space-y-6">
        <div>
          <div className="flex justify-between items-end mb-3">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Route Progress</p>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
              {Math.round(((currentIndex) / items.length) * 100)}% Complete
            </p>
          </div>
          <div className="h-4 bg-white rounded-full p-1 shadow-inner border border-gray-100 mt-4">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${((currentIndex) / items.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correct</p>
            <p className="text-xl font-black text-emerald-600">{totalCorrect}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mistakes</p>
            <p className="text-xl font-black text-red-500">{totalMistakes}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-xl font-black text-blue-600">
              {totalCorrect + totalMistakes > 0 ? Math.round((totalCorrect / (totalCorrect + totalMistakes)) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efficiency</p>
            <p className="text-xl font-black text-indigo-600">
              {Math.round((score / (currentIndex + 1 || 1)) * 10) / 10} pts/item
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarParkGame;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Trophy, RefreshCw, ChevronRight, CheckCircle2, XCircle, Loader2, GitMerge, ListOrdered, CheckSquare as CheckSquareIcon, Type, Brain, CheckSquare, FileText, ChevronLeft } from 'lucide-react';
import { FlashcardContent, QuizQuestionContent, NoteContent, WrittenAnswerContent, CheckboxQuestionContent, MatchingPairsContent, OrderSequenceContent } from '../../types/study';
import { useSpeedMarchGame } from './useSpeedMarchGame';

interface SpeedMarchGameProps {
  setId: string;
  selectedItemIds?: string[];
}

const SpeedMarchGame: React.FC<SpeedMarchGameProps> = ({ setId, selectedItemIds }) => {
  const navigate = useNavigate();
  const {
    gameState,
    setGameState,
    timeTaken,
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
  } = useSpeedMarchGame({ setId, selectedItemIds });

  const handleSideClick = (side: 'left' | 'right', text: string) => {
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
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    if (isAnswered) return;
    const newItems = [...orderedItems];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    setOrderedItems(newItems);
  };

  const renderFlashcard = (content: FlashcardContent) => (
    <div 
      onClick={() => setFlipped(!flipped)}
      className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3] max-h-[60vh] cursor-pointer perspective-1000 group"
    >
      <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-green-100 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl overflow-y-auto">
          <div className="absolute top-4 left-4 bg-green-50 p-2 rounded-xl">
            <Brain className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-relaxed">{content.front}</h2>
          {content.image_url && <img src={content.image_url} alt="" className="mt-4 max-h-32 object-contain rounded-lg" />}
          <p className="mt-6 sm:mt-8 text-xs text-green-500 font-black uppercase tracking-widest animate-pulse">Click to flip</p>
        </div>
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-green-500 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl rotate-y-180 text-white overflow-y-auto">
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

  const renderQuiz = (content: QuizQuestionContent) => (
    <div className="w-full bg-white border-2 border-green-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-green-600">
        <CheckSquare className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Multiple Choice</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 sm:mb-8 leading-tight">{content.question}</h2>
      <div className="space-y-2 sm:space-y-3">
        {shuffledQuizOptions.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrect = opt.id === content.correct_option_id;
          let buttonClass = "w-full text-left p-3 sm:p-4 rounded-2xl border-2 transition-all text-sm sm:text-base font-medium flex items-center justify-between group ";
          if (isAnswered) {
            if (isCorrect) buttonClass += "border-green-500 bg-green-50 text-green-700";
            else if (isSelected) buttonClass += "border-red-500 bg-red-50 text-red-700";
            else buttonClass += "border-gray-50 text-gray-400 opacity-50 bg-white";
          } else {
            buttonClass += "border-gray-50 bg-gray-50 hover:border-green-500 hover:bg-green-50 text-gray-700";
          }
          return (
            <button 
              key={opt.id}
              disabled={isAnswered}
              onClick={() => {
                setSelectedOptionId(opt.id);
                handleAnswer(opt.id === content.correct_option_id);
              }}
              className={buttonClass}
            >
              <span className="min-w-0 flex-1 mr-2">{opt.text}</span>
              <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 transition-colors flex-shrink-0 flex items-center justify-center ${
                isAnswered && isCorrect ? 'border-green-500 bg-green-500' : 
                isAnswered && isSelected ? 'border-red-500 bg-red-500' : 
                'border-gray-200 group-hover:border-green-500'
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

  const renderNote = (content: NoteContent) => (
    <div className="w-full bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-xl max-h-[60vh] overflow-y-auto">
      <div className="flex items-center space-x-2 mb-6 text-emerald-600">
        <FileText className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-sm">Study Note</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{content.title}</h2>
      <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
        {content.markdown}
      </div>
    </div>
  );

  const renderMatchingPairs = (content: MatchingPairsContent) => {
    const leftOptions = shuffledMatchingLeft.length > 0 ? shuffledMatchingLeft : content.pairs.map(p => p.left);
    const rightOptions = shuffledMatchingRight.length > 0 ? shuffledMatchingRight : content.pairs.map(p => p.right);
    const handleCheck = () => {
      const isCorrect = content.pairs.every(pair => matchingMatches[pair.left] === pair.right);
      const allMatched = content.pairs.length === Object.keys(matchingMatches).length;
      handleAnswer(isCorrect && allMatched);
    };
    return (
      <div className="w-full bg-white border-2 border-green-100 rounded-3xl p-5 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-green-600">
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
              const isCorrectMatch = isAnswered && matchingMatches[text] === content.pairs.find(p => p.left === text)?.right;
              return (
                <button
                  key={`left-${idx}`}
                  disabled={isAnswered || isMatched}
                  onClick={() => handleSideClick('left', text)}
                  className={`w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${
                    isAnswered 
                      ? (isCorrectMatch ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                      : (isSelected ? 'border-green-500 bg-green-50 text-green-700' : 
                         isMatched ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-green-100 bg-green-50 text-green-700 hover:border-green-300')
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
              const isCorrectMatch = isAnswered && matchedLeft && content.pairs.find(p => p.left === matchedLeft)?.right === text;
              return (
                <button
                  key={`right-${idx}`}
                  disabled={isAnswered || isMatched}
                  onClick={() => handleSideClick('right', text)}
                  className={`w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${
                    isAnswered 
                      ? (isCorrectMatch ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                      : (isSelected ? 'border-green-500 bg-green-50 text-green-700' : 
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
            <button onClick={() => setMatchingMatches({})} className="flex-1 py-3 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm">Reset</button>
            <button onClick={handleCheck} disabled={Object.keys(matchingMatches).length < content.pairs.length} className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 text-sm">Check Matches</button>
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

  const renderOrderSequence = (content: OrderSequenceContent) => {
    const handleCheck = () => {
      const isCorrect = orderedItems.every((text, idx) => text === content.items[idx]?.text);
      handleAnswer(isCorrect);
    };
    return (
      <div className="w-full bg-white border-2 border-green-100 rounded-3xl p-5 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-green-600">
          <ListOrdered className="h-6 w-6" />
          <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Order Sequence</span>
        </div>
        {content.question && <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>}
        <div className="space-y-2 sm:space-y-3 mb-6">
          {orderedItems.map((text, idx) => {
            const isCorrectPosition = isAnswered && text === content.items[idx]?.text;
            return (
              <div key={idx} className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all ${isAnswered ? (isCorrectPosition ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-green-50 bg-green-50 text-green-900'}`}>
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${isAnswered ? (isCorrectPosition ? 'bg-green-600' : 'bg-red-600') : 'bg-green-600'} text-white`}>{idx + 1}</div>
                  <span className="font-medium text-base truncate">{text}</span>
                </div>
                {!isAnswered && (
                  <div className="flex flex-col space-y-1">
                    <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-green-100 rounded-lg disabled:opacity-30"><ChevronLeft className="h-4 w-4 rotate-90" /></button>
                    <button onClick={() => moveItem(idx, 'down')} disabled={idx === orderedItems.length - 1} className="p-1 hover:bg-green-100 rounded-lg disabled:opacity-30"><ChevronRight className="h-4 w-4 rotate-90" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!isAnswered && <button onClick={handleCheck} className="w-full py-3 sm:py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95 text-sm sm:text-base">Check Order</button>}
        {isAnswered && content.explanation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-bold text-gray-900 mb-1">Explanation</p>
            <p className="text-sm text-gray-600 italic">{content.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderCheckboxQuestion = (content: CheckboxQuestionContent) => {
    const handleCheck = () => {
      const sortedSelected = [...selectedOptionIds].sort();
      const sortedCorrect = [...content.correct_option_ids].sort();
      const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
      handleAnswer(isCorrect);
    };
    return (
      <div className="w-full bg-white border-2 border-green-100 rounded-3xl p-5 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-green-600">
          <CheckSquareIcon className="h-6 w-6" />
          <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Multiple Select</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>
        <div className="space-y-2 sm:space-y-3 mb-6">
          {shuffledCheckboxOptions.map((opt) => {
            const isSelected = selectedOptionIds.includes(opt.id);
            const isCorrect = content.correct_option_ids.includes(opt.id);
            let buttonClass = "w-full text-left p-3 sm:p-4 rounded-2xl border-2 transition-all text-sm sm:text-base font-medium flex items-center justify-between group ";
            if (isAnswered) {
              if (isCorrect) buttonClass += "border-green-500 bg-green-50 text-green-700";
              else if (isSelected) buttonClass += "border-red-500 bg-red-50 text-red-700";
              else buttonClass += "border-gray-50 text-gray-400 opacity-50 bg-white";
            } else {
              buttonClass += isSelected ? "border-green-500 bg-green-50 text-green-700" : "border-gray-50 bg-gray-50 hover:border-green-300 hover:bg-green-50 text-gray-700";
            }
            return (
              <button 
                key={opt.id}
                disabled={isAnswered}
                onClick={() => isSelected ? setSelectedOptionIds(prev => prev.filter(id => id !== opt.id)) : setSelectedOptionIds(prev => [...prev, opt.id])}
                className={buttonClass}
              >
                <span className="min-w-0 flex-1 mr-2">{opt.text}</span>
                <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-lg border-2 transition-colors flex-shrink-0 flex items-center justify-center ${isAnswered && isCorrect ? 'border-green-500 bg-green-500' : isAnswered && isSelected ? 'border-red-500 bg-red-500' : isSelected ? 'border-green-500 bg-green-500' : 'border-gray-200 group-hover:border-green-500'}`}>
                  {(isSelected || (isAnswered && isCorrect)) && <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-sm bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
        {!isAnswered && <button onClick={handleCheck} disabled={selectedOptionIds.length === 0} className="w-full py-3 sm:py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 text-sm sm:text-base">Check Answers</button>}
        {isAnswered && content.explanation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-bold text-gray-900 mb-1">Explanation</p>
            <p className="text-sm text-gray-600 italic">{content.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderWrittenAnswer = (content: WrittenAnswerContent) => {
    const handleCheck = () => {
      const isCorrect = content.accepted_answers.some(ans => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase());
      handleAnswer(isCorrect);
    };
    const isCorrect = content.accepted_answers.some(ans => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase());
    return (
      <div className="w-full bg-white border-2 border-green-100 rounded-3xl p-5 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-green-600">
          <Type className="h-6 w-6" />
          <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">Written Answer</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 leading-tight">{content.question}</h2>
        <div className="space-y-4">
          <input type="text" value={writtenAnswer} onChange={(e) => setWrittenAnswer(e.target.value)} disabled={isAnswered} placeholder="Type your answer here..." className={`w-full p-3 sm:p-4 rounded-2xl border-2 transition-all font-medium focus:outline-none text-sm sm:text-base ${isAnswered ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-gray-50 bg-gray-50 text-gray-900 focus:border-green-500 focus:bg-green-50'}`} onKeyDown={(e) => e.key === 'Enter' && writtenAnswer.trim() && !isAnswered && handleCheck()} />
          {!isAnswered && <button onClick={handleCheck} disabled={!writtenAnswer.trim()} className="w-full py-3 sm:py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 text-sm sm:text-base">Submit Answer</button>}
          {isAnswered && (
            <div className={`p-4 rounded-2xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>{isCorrect ? 'Correct!' : 'Not quite right.'}</p>
              <p className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">Accepted Answers:</p>
              <div className="flex flex-wrap gap-2">
                {content.accepted_answers.map((ans, idx) => <span key={idx} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-green-600 border border-green-200">{ans}</span>)}
              </div>
            </div>
          )}
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

  const renderConfig = () => (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-gray-900 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <Clock className="h-10 w-10 text-green-600" />
        </div>
      </div>
      <h2 className="text-3xl font-black text-center mb-2">Speed March</h2>
      <p className="text-gray-500 text-center mb-8">How fast can you finish? Complete the set as quickly as possible!</p>
      
      <button 
        onClick={fetchItems} 
        className="w-full font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 group bg-green-600 hover:bg-green-700 text-white shadow-green-100"
      >
        <span>Start Game</span>
        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPlaying = () => {
    const currentItem = items[currentIndex % items.length];
    if (!currentItem) return null;
    return (
      <div className="w-full max-w-2xl px-4 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-8 bg-gray-800/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-green-400" />
            <span className="text-2xl font-black tabular-nums text-white">{formatTime(timeTaken)}</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm font-bold text-gray-400">
                Item <span className="text-white text-lg">{currentIndex + 1}</span> / {items.length}
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-bold"><CheckCircle2 className="h-4 w-4 mr-1" />{totalCorrect}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-bold"><XCircle className="h-4 w-4 mr-1" />{totalMistakes}</span>
            </div>
          </div>
        </div>
        <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
          {currentItem.type === 'flashcard' && (
            <div className="space-y-6">
              {renderFlashcard(currentItem.content as FlashcardContent)}
              {flipped && <button onClick={() => handleAnswer(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] animate-in fade-in slide-in-from-top-2 duration-300">Continue</button>}
            </div>
          )}
          {currentItem.type === 'quiz_question' && renderQuiz(currentItem.content as QuizQuestionContent)}
          {currentItem.type === 'note' && (
            <div className="space-y-6">
              {renderNote(currentItem.content as NoteContent)}
              <button onClick={() => handleAnswer(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">Got it!</button>
            </div>
          )}
          {currentItem.type === 'matching_pairs' && renderMatchingPairs(currentItem.content as MatchingPairsContent)}
          {currentItem.type === 'order_sequence' && renderOrderSequence(currentItem.content as OrderSequenceContent)}
          {currentItem.type === 'checkbox_question' && renderCheckboxQuestion(currentItem.content as CheckboxQuestionContent)}
          {currentItem.type === 'written_answer' && renderWrittenAnswer(currentItem.content as WrittenAnswerContent)}
        </div>
        {isAnswered && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-200">
            {isCorrect ? <div className="bg-green-500/90 text-white p-8 rounded-full shadow-2xl"><CheckCircle2 className="h-20 w-20" /></div> : isCorrect === false ? <div className="bg-red-500/90 text-white p-8 rounded-full shadow-2xl"><XCircle className="h-20 w-20" /></div> : null}
          </div>
        )}
      </div>
    );
  };

  const renderGameOver = () => (
    <div className="w-full max-w-xl bg-white rounded-3xl p-10 shadow-2xl text-gray-900 animate-in zoom-in duration-300">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-3xl mb-6">{gameEndedReason === 'no-items' ? <FileText className="h-12 w-12 text-green-600" /> : <Trophy className="h-12 w-12 text-green-600" />}</div>
        <h2 className="text-4xl font-black mb-2">{gameEndedReason === 'no-items' ? 'No Items Found' : "Mission Accomplished!"}</h2>
        <p className="text-gray-500 mb-8">{gameEndedReason === 'no-items' ? "This study set doesn't have any compatible items for Speed March." : "You finished the march! Here's your time:"}</p>
        {gameEndedReason !== 'no-items' && (
          <>
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-1 block">Final Time</span>
              <span className="text-6xl font-black text-green-600">{formatTime(timeTaken)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-green-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-bold">Correct: {totalCorrect}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-red-50 border border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-bold">Mistakes: {totalMistakes}</span>
              </div>
            </div>
            {Object.keys(itemStats).length > 0 && (
              <div className="text-left mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Per-Item Performance</p>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Type</th>
                        <th className="px-3 py-2 text-right font-semibold">Correct</th>
                        <th className="px-3 py-2 text-right font-semibold">Mistakes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(itemStats)
                        .sort(([, a], [, b]) => (a.position ?? 0) - (b.position ?? 0))
                        .map(([id, s]) => (
                          <tr key={id} className="odd:bg-white even:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{s.position}</td>
                            <td className="px-3 py-2 text-gray-700 capitalize">{String(s.type).replace('_', ' ')}</td>
                            <td className="px-3 py-2 text-right text-green-600 font-semibold">{s.correct}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">{s.mistakes}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        <div className="space-y-3">
          <button onClick={() => setGameState('config')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-100 transition-all flex items-center justify-center space-x-2"><RefreshCw className="h-5 w-5" /><span>March Again</span></button>
          <button onClick={() => navigate('/games')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all">Back to Games</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      {gameState === 'config' && renderConfig()}
      {gameState === 'loading' && <div className="flex flex-col items-center"><Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" /><p className="text-gray-400 font-bold">Preparing your march...</p></div>}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'game-over' && renderGameOver()}
    </div>
  );
};

export default SpeedMarchGame;

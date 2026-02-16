import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Brain, CheckSquare, FileText, Heart, MessageSquare, Loader2, Sparkles, Copy, Star } from 'lucide-react';
import { studyService } from '../../services/studyService';
import { GetSetForPlayResponse, StudyItemPlay, FlashcardContent, QuizQuestionContent, NoteContent, StudySessionResult, FinishStudySessionResponse, ItemLiker, MatchingPairsContent, OrderSequenceContent, CheckboxQuestionContent, WrittenAnswerContent } from '../../types/study';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import LikersModal from './LikersModal';
import CommentsModal from './CommentsModal';
import RateSetModal from './RateSetModal';
import { ListOrdered, GitMerge, CheckSquare as CheckSquareIcon, Type } from 'lucide-react';

interface StudyModalProps {
  setId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudyModal: React.FC<StudyModalProps> = ({ setId, isOpen, onClose }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [data, setData] = useState<GetSetForPlayResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [matchingMatches, setMatchingMatches] = useState<Record<string, string>>({});
  const [matchingSelected, setMatchingSelected] = useState<{ side: 'left' | 'right', text: string } | null>(null);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [shuffledQuizOptions, setShuffledQuizOptions] = useState<QuizQuestionOption[]>([]);
  const [shuffledCheckboxOptions, setShuffledCheckboxOptions] = useState<CheckboxOption[]>([]);
  const [shuffledMatchingLeft, setShuffledMatchingLeft] = useState<string[]>([]);
  const [shuffledMatchingRight, setShuffledMatchingRight] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<FinishStudySessionResponse | null>(null);
  const [togglingReaction, setTogglingReaction] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [likers, setLikers] = useState<ItemLiker[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ 
    id: string, 
    type: 'set' | 'item', 
    title: string,
    setDetails?: {
      title: string,
      description?: string | null,
      subject?: string,
      emoji?: string | null,
      cardsCount?: number,
      rating?: number
    }
  } | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);

  useEffect(() => {
    if (isOpen && setId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const result = await studyService.getSetForPlay(setId);
          setData(result);
          setCurrentIndex(0);
          setFlipped(false);
          setSelectedOptionId(null);
          setSelectedOptionIds([]);
          setWrittenAnswer('');
          setMatchingMatches({});
          setMatchingSelected(null);
          setOrderedItems([]);
          setShuffledQuizOptions([]);
          setShuffledCheckboxOptions([]);
          setShuffledMatchingLeft([]);
          setShuffledMatchingRight([]);
          
          // Initial shuffle if first item needs it
          if (result && result.items[0]) {
            const firstItem = result.items[0];
            if (firstItem.type === 'order_sequence') {
              const content = firstItem.content as OrderSequenceContent;
              setOrderedItems([...content.items.map(i => i.text)].sort(() => Math.random() - 0.5));
            } else if (firstItem.type === 'quiz_question') {
              const content = firstItem.content as QuizQuestionContent;
              setShuffledQuizOptions([...content.options].sort(() => Math.random() - 0.5));
            } else if (firstItem.type === 'checkbox_question') {
              const content = firstItem.content as CheckboxQuestionContent;
              setShuffledCheckboxOptions([...content.options].sort(() => Math.random() - 0.5));
            } else if (firstItem.type === 'matching_pairs') {
              const content = firstItem.content as MatchingPairsContent;
              setShuffledMatchingLeft([...content.pairs.map(p => p.left)].sort(() => Math.random() - 0.5));
              setShuffledMatchingRight([...content.pairs.map(p => p.right)].sort(() => Math.random() - 0.5));
            }
          }

          setIsAnswered(false);
          setStartTime(Date.now());
          setResults({});
          setIsFinishing(false);
          setSessionFinished(false);
          setSessionSummary(null);
        } catch (err) {
          console.error('Failed to fetch study set:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (!isOpen) {
      // Clean up when modal closes
      setStartTime(null);
    }
  }, [isOpen, setId]);

  if (!isOpen) return null;

  const handleFinish = async () => {
    if (!data || !startTime || isFinishing) return;

    try {
      setIsFinishing(true);
      
      // Ensure the current item is recorded if it hasn't been yet (for flashcards/notes)
      const finalResults = { ...results };
      const currentItem = data.items[currentIndex];
      if (currentItem && finalResults[currentItem.id] === undefined) {
        if (currentItem.type === 'flashcard' || currentItem.type === 'note') {
          finalResults[currentItem.id] = true;
        }
      }

      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const resultsArray: StudySessionResult[] = Object.entries(finalResults).map(([item_id, is_correct]) => ({
        item_id,
        is_correct
      }));

      if (resultsArray.length > 0) {
        const summary = await studyService.finishStudySession({
          set_id: data.set.id,
          duration_seconds: Math.max(durationSeconds, 1),
          results: resultsArray
        });
        setSessionSummary(summary);
        showToast('Study session saved!', 'success');
      }
      
      setSessionFinished(true);
    } catch (err: any) {
      console.error('Failed to finish study session:', err);
      showToast('Failed to save progress', 'error');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (data && currentIndex < data.items.length - 1) {
      // Record progress for current item if it's flashcard/note and not yet recorded
      const item = data.items[currentIndex];
      if ((item.type === 'flashcard' || item.type === 'note') && results[item.id] === undefined) {
        setResults(prev => ({ ...prev, [item.id]: true }));
      }

      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setSelectedOptionId(null);
      setSelectedOptionIds([]);
      setWrittenAnswer('');
      setMatchingMatches({});
      setMatchingSelected(null);
      setOrderedItems([]);
      setShuffledQuizOptions([]);
      setShuffledCheckboxOptions([]);
      setShuffledMatchingLeft([]);
      setShuffledMatchingRight([]);
      setIsAnswered(false);
      
      // Auto-shuffle for new items if we move to one
      const nextItem = data.items[currentIndex + 1];
      if (nextItem) {
        if (nextItem.type === 'order_sequence') {
          const content = nextItem.content as OrderSequenceContent;
          setOrderedItems([...content.items.map(i => i.text)].sort(() => Math.random() - 0.5));
        } else if (nextItem.type === 'quiz_question') {
          const content = nextItem.content as QuizQuestionContent;
          setShuffledQuizOptions([...content.options].sort(() => Math.random() - 0.5));
        } else if (nextItem.type === 'checkbox_question') {
          const content = nextItem.content as CheckboxQuestionContent;
          setShuffledCheckboxOptions([...content.options].sort(() => Math.random() - 0.5));
        } else if (nextItem.type === 'matching_pairs') {
          const content = nextItem.content as MatchingPairsContent;
          setShuffledMatchingLeft([...content.pairs.map(p => p.left)].sort(() => Math.random() - 0.5));
          setShuffledMatchingRight([...content.pairs.map(p => p.right)].sort(() => Math.random() - 0.5));
        }
      }
    } else if (currentIndex === data.items.length - 1) {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      // Record progress for current item if it's flashcard/note and not yet recorded
      const item = data.items[currentIndex];
      if ((item.type === 'flashcard' || item.type === 'note') && results[item.id] === undefined) {
        setResults(prev => ({ ...prev, [item.id]: true }));
      }

      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setSelectedOptionId(null);
      setSelectedOptionIds([]);
      setWrittenAnswer('');
      setMatchingMatches({});
      setMatchingSelected(null);
      setOrderedItems([]);
      setShuffledQuizOptions([]);
      setShuffledCheckboxOptions([]);
      setShuffledMatchingLeft([]);
      setShuffledMatchingRight([]);
      setIsAnswered(false);

      // Auto-shuffle for previous items if we move back to one
      const prevItem = data.items[currentIndex - 1];
      if (prevItem) {
        if (prevItem.type === 'order_sequence') {
          const content = prevItem.content as OrderSequenceContent;
          setOrderedItems([...content.items.map(i => i.text)].sort(() => Math.random() - 0.5));
        } else if (prevItem.type === 'quiz_question') {
          const content = prevItem.content as QuizQuestionContent;
          setShuffledQuizOptions([...content.options].sort(() => Math.random() - 0.5));
        } else if (prevItem.type === 'checkbox_question') {
          const content = prevItem.content as CheckboxQuestionContent;
          setShuffledCheckboxOptions([...content.options].sort(() => Math.random() - 0.5));
        } else if (prevItem.type === 'matching_pairs') {
          const content = prevItem.content as MatchingPairsContent;
          setShuffledMatchingLeft([...content.pairs.map(p => p.left)].sort(() => Math.random() - 0.5));
          setShuffledMatchingRight([...content.pairs.map(p => p.right)].sort(() => Math.random() - 0.5));
        }
      }
    }
  };

  const handleClone = async () => {
    if (!data?.set.id || cloning) return;
    try {
      setCloning(true);
      await studyService.cloneSet(data.set.id);
      showToast(`Successfully cloned "${data.set.title}"!`, 'success');
    } catch (err: any) {
      console.error('Failed to clone set:', err);
      showToast(err?.message || 'Failed to clone study set', 'error');
    } finally {
      setCloning(false);
    }
  };

  const handleToggleReaction = async () => {
    if (!currentItem || togglingReaction || !data) return;
    
    // Optimistic Update
    const wasLiked = currentItem.is_liked;
    const previousCount = currentItem.like_count;
    const newIsLiked = !wasLiked;
    const newCount = wasLiked ? previousCount - 1 : previousCount + 1;

    // Update local state immediately
    const updatedItems = [...data.items];
    updatedItems[currentIndex] = {
      ...currentItem,
      is_liked: newIsLiked,
      like_count: Math.max(0, newCount)
    };
    
    // Also update set's total likes if we want to be thorough
    const updatedSet = {
      ...data.set,
      total_likes: Math.max(0, data.set.total_likes + (newIsLiked ? 1 : -1))
    };

    setData({
      ...data,
      set: updatedSet,
      items: updatedItems
    });

    try {
      setTogglingReaction(true);
      const response = await studyService.toggleReaction(currentItem.id);
      
      // Update with actual server data
      if (data) {
        const finalItems = [...updatedItems];
        finalItems[currentIndex] = {
          ...updatedItems[currentIndex],
          is_liked: response.is_liked,
          like_count: response.new_count
        };
        
        setData(prev => prev ? {
          ...prev,
          items: finalItems
        } : null);

        // Update likers list if it's currently relevant
        if (showLikers && user) {
          if (response.is_liked) {
            // Add current user to likers if not already there
            setLikers(prev => {
              if (prev.some(l => l.user_id === user.id)) return prev;
              return [{
                user_id: user.id,
                username: user.email?.split('@')[0] || 'Me', // Fallback as we might not have full profile
                full_name: null,
                avatar_url: null,
                liked_at: new Date().toISOString()
              }, ...prev];
            });
          } else {
            // Remove current user from likers
            setLikers(prev => prev.filter(l => l.user_id !== user.id));
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle reaction:', err);
      showToast('Failed to update reaction', 'error');
      
      // Rollback on error
      setData(prev => prev ? {
        ...prev,
        set: {
          ...prev.set,
          total_likes: data.set.total_likes
        },
        items: data.items
      } : null);
    } finally {
      setTogglingReaction(false);
    }
  };

  const handleShowLikers = async () => {
    if (!currentItem) return;
    
    // Open modal immediately and reset list to avoid showing old data
    setShowLikers(true);
    setLikers([]); 
    
    try {
      setLoadingLikers(true);
      const result = await studyService.getItemLikers(currentItem.id);
      setLikers(result);
    } catch (err) {
      console.error('Failed to fetch likers:', err);
      showToast('Failed to load likers', 'error');
    } finally {
      setLoadingLikers(false);
    }
  };

  const currentItem = data?.items[currentIndex];

  const renderFlashcard = (content: FlashcardContent) => (
    <div 
      onClick={() => setFlipped(!flipped)}
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

  const renderQuiz = (content: QuizQuestionContent) => (
    <div className="w-full bg-white border-2 border-orange-100 rounded-3xl p-5 sm:p-8 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-orange-600">
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
              onClick={() => {
                setSelectedOptionId(opt.id);
                setIsAnswered(true);
                if (currentItem) {
                  setResults(prev => ({ ...prev, [currentItem.id]: opt.id === content.correct_option_id }));
                }
              }}
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
    const handleSideClick = (side: 'left' | 'right', text: string) => {
      if (isAnswered) return;

      if (!matchingSelected) {
        setMatchingSelected({ side, text });
      } else if (matchingSelected.side === side) {
        setMatchingSelected({ side, text }); // Change selection on same side
      } else {
        // Try to match
        const left = side === 'left' ? text : matchingSelected.text;
        const right = side === 'right' ? text : matchingSelected.text;
        
        setMatchingMatches(prev => ({ ...prev, [left]: right }));
        setMatchingSelected(null);
      }
    };

    const handleCheck = () => {
      setIsAnswered(true);
      if (currentItem) {
        const isCorrect = content.pairs.every(pair => matchingMatches[pair.left] === pair.right);
        const allMatched = content.pairs.length === Object.keys(matchingMatches).length;
        setResults(prev => ({ ...prev, [currentItem.id]: isCorrect && allMatched }));
      }
    };

    const leftOptions = shuffledMatchingLeft.length > 0 ? shuffledMatchingLeft : content.pairs.map(p => p.left);
    const rightOptions = shuffledMatchingRight.length > 0 ? shuffledMatchingRight : content.pairs.map(p => p.right);

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
                  onClick={() => handleSideClick('left', text)}
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
                  onClick={() => handleSideClick('right', text)}
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
              onClick={() => setMatchingMatches({})}
              className="flex-1 py-3 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm"
            >
              Reset
            </button>
            <button
              onClick={handleCheck}
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

  const renderOrderSequence = (content: OrderSequenceContent) => {
    const moveItem = (idx: number, direction: 'up' | 'down') => {
      if (isAnswered) return;
      const newItems = [...orderedItems];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newItems.length) return;
      
      [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
      setOrderedItems(newItems);
    };

    const handleCheck = () => {
      setIsAnswered(true);
      if (currentItem) {
        const isCorrect = orderedItems.every((text, idx) => text === content.items[idx].text);
        setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
      }
    };

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
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-blue-100 rounded-lg disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4 rotate-90" />
                    </button>
                    <button 
                      onClick={() => moveItem(idx, 'down')}
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
            onClick={handleCheck}
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

  const renderCheckboxQuestion = (content: CheckboxQuestionContent) => {
    const handleCheck = () => {
      setIsAnswered(true);
      if (currentItem) {
        const sortedSelected = [...selectedOptionIds].sort();
        const sortedCorrect = [...content.correct_option_ids].sort();
        const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
        setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
      }
    };

    return (
      <div className="w-full bg-white border-2 border-indigo-100 rounded-3xl p-5 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6 text-indigo-600">
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
                onClick={() => {
                  if (isSelected) {
                    setSelectedOptionIds(prev => prev.filter(id => id !== opt.id));
                  } else {
                    setSelectedOptionIds(prev => [...prev, opt.id]);
                  }
                }}
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
            onClick={handleCheck}
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

  const renderWrittenAnswer = (content: WrittenAnswerContent) => {
    const handleCheck = () => {
      setIsAnswered(true);
      if (currentItem) {
        const isCorrect = content.accepted_answers.some(
          ans => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase()
        );
        setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
      }
    };

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
            onChange={(e) => setWrittenAnswer(e.target.value)}
            disabled={isAnswered}
            placeholder="Type your answer here..."
            className={`w-full p-3 sm:p-4 rounded-2xl border-2 transition-all font-medium focus:outline-none text-sm sm:text-base ${
              isAnswered 
                ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                : 'border-gray-50 bg-gray-50 focus:border-pink-500 focus:bg-pink-50'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && writtenAnswer.trim() && !isAnswered) {
                handleCheck();
              }
            }}
          />

          {!isAnswered && (
            <button
              onClick={handleCheck}
              disabled={!writtenAnswer.trim()}
              className="w-full py-3 sm:py-4 bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-100 hover:bg-pink-700 transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              Submit Answer
            </button>
          )}

          {isAnswered && (
            <div className={`p-4 rounded-2xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Correct!' : 'Not quite right.'}
              </p>
              <p className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">Accepted Answers:</p>
              <div className="flex flex-wrap gap-2">
                {content.accepted_answers.map((ans, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-pink-600 border border-pink-200">
                    {ans}
                  </span>
                ))}
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-[90vh] md:h-auto md:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between bg-white border-b border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
              {data?.set.emoji || '📚'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 line-clamp-1 text-base">{data?.set.title || 'Loading...'}</h3>
              <p className="text-xs text-gray-500">{data?.set.subject || 'Study Set'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button 
              onClick={() => {
                if (data) {
                  setCommentTarget({
                    id: data.set.id,
                    type: 'set',
                    title: `Comments on ${data.set.title}`,
                    setDetails: {
                      title: data.set.title,
                      description: data.set.description,
                      subject: data.set.subject,
                      emoji: data.set.emoji,
                      cardsCount: data.items.length,
                      rating: data.set.average_rating
                    }
                  });
                  setShowComments(true);
                }
              }}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600"
              title="View set comments"
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button 
              onClick={handleClone}
              disabled={cloning || !data}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600 disabled:opacity-50"
              title="Clone this set"
            >
              {cloning ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            <button
              onClick={() => setShowRateModal(true)}
              disabled={!data}
              className="px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-yellow-50 rounded-xl transition-colors text-gray-600 hover:text-yellow-600 disabled:opacity-50 flex items-center space-x-1 sm:space-x-2 border border-gray-100 hover:border-yellow-200"
              title="Rate this set"
            >
              <Star className="h-5 w-5" />
              <span className="text-xs sm:text-sm font-bold">Rate</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Preparing your study session...</p>
            </div>
          ) : sessionFinished ? (
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
          ) : data && currentItem ? (
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
              {currentItem.type === 'flashcard' && renderFlashcard(currentItem.content as FlashcardContent)}
              {currentItem.type === 'quiz_question' && renderQuiz(currentItem.content as QuizQuestionContent)}
              {currentItem.type === 'note' && renderNote(currentItem.content as NoteContent)}
              {currentItem.type === 'matching_pairs' && renderMatchingPairs(currentItem.content as MatchingPairsContent)}
              {currentItem.type === 'order_sequence' && renderOrderSequence(currentItem.content as OrderSequenceContent)}
              {currentItem.type === 'checkbox_question' && renderCheckboxQuestion(currentItem.content as CheckboxQuestionContent)}
              {currentItem.type === 'written_answer' && renderWrittenAnswer(currentItem.content as WrittenAnswerContent)}
            </div>
          ) : (
            <p className="text-gray-500">Failed to load items.</p>
          )}
        </div>

        {/* Progress & Controls */}
        {data && (
          <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <button 
                    onClick={handleToggleReaction}
                    disabled={togglingReaction}
                    className="text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
                    title={currentItem?.is_liked ? "Unlike this card" : "Like this card"}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${currentItem?.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button 
                    onClick={handleShowLikers}
                    className="text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {currentItem?.like_count || 0}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (currentItem) {
                      setCommentTarget({
                        id: currentItem.id,
                        type: 'item',
                        title: `Comments on Card ${currentIndex + 1}`
                      });
                      setShowComments(true);
                    }
                  }}
                  className="flex items-center space-x-1 sm:space-x-1.5 text-gray-500 hover:text-blue-500 transition-colors p-1"
                >
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-bold">{currentItem?.comment_count || 0}</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {/* Study Progress badge */}
                <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-100">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Level {currentItem?.study_data.box_level || 0}
                  </span>
                </div>

                <div className="text-sm font-bold text-gray-400">
                  {currentIndex + 1} <span className="text-gray-300 mx-1">/</span> {data.items.length}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0 || sessionFinished}
                className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 rounded-2xl border-2 border-gray-100 font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors text-xs sm:text-base active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Previous</span>
              </button>
              <button 
                onClick={handleNext}
                disabled={isFinishing || sessionFinished}
                className="flex-[2] flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-30 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-xs sm:text-base active:scale-95"
              >
                {isFinishing ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <>
                    <span>{currentIndex === data.items.length - 1 ? 'Finish Session' : 'Next Card'}</span>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <LikersModal 
        isOpen={showLikers}
        onClose={() => setShowLikers(false)}
        likers={likers}
        loading={loadingLikers}
      />

      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        targetId={commentTarget?.id || ''}
        targetType={commentTarget?.type || 'set'}
        title={commentTarget?.title}
        setDetails={commentTarget?.setDetails}
      />

      {data && (
        <RateSetModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          setId={data.set.id}
          initialAverage={data.set.average_rating}
          onRated={(newAverage, newTotal) => {
            setData(prev => prev ? { ...prev, set: { ...prev.set, average_rating: newAverage, total_ratings: newTotal } } : prev);
            showToast('Thanks for your rating!', 'success');
          }}
        />
      )}
    </div>
  );
};

export default StudyModal;

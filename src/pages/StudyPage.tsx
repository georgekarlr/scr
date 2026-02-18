import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { X, Heart, MessageSquare, Loader2, Copy, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { studyService } from '../services/studyService';
import {
  GetSetForPlayResponse,
  StudySessionResult,
  FinishStudySessionResponse,
  ItemLiker,
  FlashcardContent,
  QuizQuestionContent,
  NoteContent,
  MatchingPairsContent,
  OrderSequenceContent,
  CheckboxQuestionContent,
  WrittenAnswerContent,
  QuizQuestionOption,
  CheckboxOption
} from '../types/study';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import LikersModal from '../components/study/LikersModal';
import CommentsModal from '../components/study/CommentsModal';
import RateSetModal from '../components/study/RateSetModal';
import StudySessionSummary from '../components/study/StudySessionSummary';
import FlashcardItem from '../components/study/items/FlashcardItem';
import QuizItem from '../components/study/items/QuizItem';
import NoteItem from '../components/study/items/NoteItem';
import MatchingPairsItem from '../components/study/items/MatchingPairsItem';
import OrderSequenceItem from '../components/study/items/OrderSequenceItem';
import CheckboxItem from '../components/study/items/CheckboxItem';
import WrittenAnswerItem from '../components/study/items/WrittenAnswerItem';

const StudyPage: React.FC = () => {
  const { id: setId } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
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
    if (setId) {
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
    }
  }, [setId]);

  const onClose = () => navigate(-1);

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-[90vh] md:h-auto md:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between bg-white border-b border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
              {data?.set.emoji || '📚'}
            </div>
            <Link 
              to={data ? `/p/${data.set.id}` : '#'} 
              onClick={(e) => {
                if (!data) e.preventDefault();
                else onClose();
              }}
              className="min-w-0 hover:opacity-75 transition-opacity"
            >
              <h3 className="font-bold text-gray-900 line-clamp-1 text-base">{data?.set.title || 'Loading...'}</h3>
              <p className="text-xs text-gray-500">{data?.set.subject || 'Study Set'}</p>
            </Link>
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
            <StudySessionSummary sessionSummary={sessionSummary} results={results} onClose={onClose} />
          ) : data && currentItem ? (
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
              {currentItem.type === 'flashcard' && (
                <FlashcardItem 
                  content={currentItem.content}
                  flipped={flipped}
                  onFlip={() => setFlipped(!flipped)}
                />
              )}
              {currentItem.type === 'quiz_question' && (
                <QuizItem
                  content={currentItem.content as QuizQuestionContent}
                  shuffledOptions={shuffledQuizOptions}
                  selectedOptionId={selectedOptionId}
                  isAnswered={isAnswered}
                  onAnswer={(optionId, isCorrect) => {
                    setSelectedOptionId(optionId);
                    setIsAnswered(true);
                    setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
                  }}
                />
              )}
              {currentItem.type === 'note' && (
                <NoteItem content={currentItem.content} />
              )}
              {currentItem.type === 'matching_pairs' && (
                <MatchingPairsItem
                  content={currentItem.content as MatchingPairsContent}
                  shuffledLeft={shuffledMatchingLeft}
                  shuffledRight={shuffledMatchingRight}
                  matchingMatches={matchingMatches}
                  matchingSelected={matchingSelected}
                  isAnswered={isAnswered}
                  onSelect={(side, text) => {
                    if (isAnswered) return;
                    if (!matchingSelected) {
                      setMatchingSelected({ side, text });
                    } else if (matchingSelected.side === side) {
                      setMatchingSelected({ side, text });
                    } else {
                      const left = side === 'left' ? text : matchingSelected.text;
                      const right = side === 'right' ? text : matchingSelected.text;
                      setMatchingMatches(prev => ({ ...prev, [left]: right }));
                      setMatchingSelected(null);
                    }
                  }}
                  onReset={() => setMatchingMatches({})}
                  onCheck={() => {
                    setIsAnswered(true);
                    const content = currentItem.content as MatchingPairsContent;
                    const isCorrect = content.pairs.every(pair => matchingMatches[pair.left] === pair.right);
                    const allMatched = content.pairs.length === Object.keys(matchingMatches).length;
                    setResults(prev => ({ ...prev, [currentItem.id]: isCorrect && allMatched }));
                  }}
                />
              )}
              {currentItem.type === 'order_sequence' && (
                <OrderSequenceItem
                  content={currentItem.content as OrderSequenceContent}
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
                    setIsAnswered(true);
                    const content = currentItem.content as OrderSequenceContent;
                    const isCorrect = orderedItems.every((text, idx) => text === content.items[idx].text);
                    setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
                  }}
                />
              )}
              {currentItem.type === 'checkbox_question' && (
                <CheckboxItem
                  content={currentItem.content as CheckboxQuestionContent}
                  shuffledOptions={shuffledCheckboxOptions}
                  selectedOptionIds={selectedOptionIds}
                  isAnswered={isAnswered}
                  onToggle={(optionId) => {
                    setSelectedOptionIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
                  }}
                  onCheck={() => {
                    setIsAnswered(true);
                    const content = currentItem.content as CheckboxQuestionContent;
                    const sortedSelected = [...selectedOptionIds].sort();
                    const sortedCorrect = [...content.correct_option_ids].sort();
                    const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
                    setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
                  }}
                />
              )}
              {currentItem.type === 'written_answer' && (
                <WrittenAnswerItem
                  content={currentItem.content}
                  writtenAnswer={writtenAnswer}
                  isAnswered={isAnswered}
                  onAnswerChange={setWrittenAnswer}
                  onCheck={() => {
                    setIsAnswered(true);
                    const content = currentItem.content as any;
                    const isCorrect = content.accepted_answers.some((ans: string) => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase());
                    setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
                  }}
                />
              )}
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
        setDetails={commentTarget?.setDetails}
        itemDetails={commentTarget?.type === 'item' && currentItem ? {
          type: currentItem.type as any,
          content: currentItem.content,
          metadata: currentItem.study_data
        } : undefined}
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

export default StudyPage;

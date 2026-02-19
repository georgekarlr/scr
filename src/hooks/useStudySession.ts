import { useState, useEffect, useCallback } from 'react';
import { studyService } from '../services/studyService';
import { 
  GetSetForPlayResponse, 
  StudySessionResult, 
  FinishStudySessionResponse,
  OrderSequenceContent,
  QuizQuestionContent,
  CheckboxQuestionContent,
  MatchingPairsContent,
  QuizQuestionOption,
  CheckboxOption,
  ItemLiker
} from '../types/study';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export const useStudySession = (setId: string | undefined, onFinish: (summary: FinishStudySessionResponse | null, results: Record<string, boolean>) => void) => {
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
  const [togglingReaction, setTogglingReaction] = useState(false);
  const [likers, setLikers] = useState<ItemLiker[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  const shuffleItem = useCallback((item: any) => {
    if (!item) return;
    if (item.type === 'order_sequence') {
      const content = item.content as OrderSequenceContent;
      setOrderedItems([...content.items.map(i => i.text)].sort(() => Math.random() - 0.5));
    } else if (item.type === 'quiz_question') {
      const content = item.content as QuizQuestionContent;
      setShuffledQuizOptions([...content.options].sort(() => Math.random() - 0.5));
    } else if (item.type === 'checkbox_question') {
      const content = item.content as CheckboxQuestionContent;
      setShuffledCheckboxOptions([...content.options].sort(() => Math.random() - 0.5));
    } else if (item.type === 'matching_pairs') {
      const content = item.content as MatchingPairsContent;
      setShuffledMatchingLeft([...content.pairs.map(p => p.left)].sort(() => Math.random() - 0.5));
      setShuffledMatchingRight([...content.pairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
  }, []);

  const resetItemState = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (setId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const result = await studyService.getSetForPlay(setId);
          setData(result);
          setCurrentIndex(0);
          resetItemState();
          
          if (result && result.items[0]) {
            shuffleItem(result.items[0]);
          }

          setStartTime(Date.now());
          setResults({});
          setIsFinishing(false);
        } catch (err) {
          console.error('Failed to fetch study set:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [setId, resetItemState, shuffleItem]);

  const handleFinish = async () => {
    if (!data || !startTime || isFinishing) return;

    try {
      setIsFinishing(true);
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

      let summary: FinishStudySessionResponse | null = null;
      if (resultsArray.length > 0) {
        summary = await studyService.finishStudySession({
          set_id: data.set.id,
          duration_seconds: Math.max(durationSeconds, 1),
          results: resultsArray
        });
        showToast('Study session saved!', 'success');
      }
      
      onFinish(summary, finalResults);
    } catch (err: any) {
      console.error('Failed to finish study session:', err);
      showToast('Failed to save progress', 'error');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (data && currentIndex < data.items.length - 1) {
      const item = data.items[currentIndex];
      if ((item.type === 'flashcard' || item.type === 'note') && results[item.id] === undefined) {
        setResults(prev => ({ ...prev, [item.id]: true }));
      }

      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      resetItemState();
      shuffleItem(data.items[nextIdx]);
    } else if (data && currentIndex === data.items.length - 1) {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && data) {
      const item = data.items[currentIndex];
      if ((item.type === 'flashcard' || item.type === 'note') && results[item.id] === undefined) {
        setResults(prev => ({ ...prev, [item.id]: true }));
      }

      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      resetItemState();
      shuffleItem(data.items[prevIdx]);
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
    const currentItem = data?.items[currentIndex];
    if (!currentItem || togglingReaction || !data) return;
    
    const wasLiked = currentItem.is_liked;
    const previousCount = currentItem.like_count;
    const newIsLiked = !wasLiked;
    const newCount = wasLiked ? previousCount - 1 : previousCount + 1;

    const updatedItems = [...data.items];
    updatedItems[currentIndex] = {
      ...currentItem,
      is_liked: newIsLiked,
      like_count: Math.max(0, newCount)
    };
    
    const updatedSet = {
      ...data.set,
      total_likes: Math.max(0, data.set.total_likes + (newIsLiked ? 1 : -1))
    };

    const oldData = data;
    setData({
      ...data,
      set: updatedSet,
      items: updatedItems
    });

    try {
      setTogglingReaction(true);
      const response = await studyService.toggleReaction(currentItem.id);
      
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

      if (user) {
        if (response.is_liked) {
          setLikers(prev => {
            if (prev.some(l => l.user_id === user.id)) return prev;
            return [{
              user_id: user.id,
              username: user.email?.split('@')[0] || 'Me',
              full_name: null,
              avatar_url: null,
              liked_at: new Date().toISOString()
            }, ...prev];
          });
        } else {
          setLikers(prev => prev.filter(l => l.user_id !== user.id));
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle reaction:', err);
      showToast('Failed to update reaction', 'error');
      setData(oldData);
    } finally {
      setTogglingReaction(false);
    }
  };

  const fetchLikers = async () => {
    const currentItem = data?.items[currentIndex];
    if (!currentItem) return;
    
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

  return {
    loading,
    cloning,
    data,
    setData,
    currentIndex,
    flipped,
    setFlipped,
    selectedOptionId,
    setSelectedOptionId,
    selectedOptionIds,
    setSelectedOptionIds,
    writtenAnswer,
    setWrittenAnswer,
    matchingMatches,
    setMatchingMatches,
    matchingSelected,
    setMatchingSelected,
    orderedItems,
    setOrderedItems,
    shuffledQuizOptions,
    shuffledCheckboxOptions,
    shuffledMatchingLeft,
    shuffledMatchingRight,
    isAnswered,
    setIsAnswered,
    results,
    setResults,
    isFinishing,
    togglingReaction,
    likers,
    loadingLikers,
    handleNext,
    handlePrev,
    handleClone,
    handleToggleReaction,
    fetchLikers,
    currentItem: data?.items[currentIndex]
  };
};
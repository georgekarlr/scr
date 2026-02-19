import { useState, useEffect, useCallback } from 'react';
import { studyService } from '../../services/studyService';
import { 
  StudyItemPlay, 
  QuizQuestionContent,
  CheckboxQuestionContent, 
  MatchingPairsContent, 
  OrderSequenceContent 
} from '../../types/study';

export type GameState = 'config' | 'loading' | 'playing' | 'game-over';

interface UseRushBreakGameProps {
  setId: string;
  selectedItemIds?: string[];
}

export const useTimeBattleGame = ({ setId, selectedItemIds }: UseRushBreakGameProps) => {
  const [gameState, setGameState] = useState<GameState>('config');
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [itemStats, setItemStats] = useState<Record<string, { correct: number; mistakes: number; type: string; position: number; content: any }>>({});
  const [items, setItems] = useState<StudyItemPlay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameEndedReason, setGameEndedReason] = useState<'timeout' | 'no-items' | 'completed' | null>(null);

  // Item-specific states
  const [flipped, setFlipped] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [matchingMatches, setMatchingMatches] = useState<Record<string, string>>({});
  const [matchingSelected, setMatchingSelected] = useState<{ side: 'left' | 'right', text: string } | null>(null);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [shuffledQuizOptions, setShuffledQuizOptions] = useState<{ id: number; text: string }[]>([]);
  const [shuffledCheckboxOptions, setShuffledCheckboxOptions] = useState<{ id: number; text: string }[]>([]);
  const [shuffledMatchingLeft, setShuffledMatchingLeft] = useState<string[]>([]);
  const [shuffledMatchingRight, setShuffledMatchingRight] = useState<string[]>([]);

  const prepareItem = useCallback((item: StudyItemPlay) => {
    setIsAnswered(false);
    setIsCorrect(null);
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

    if (item.type === 'quiz_question') {
      const content = item.content as QuizQuestionContent;
      setShuffledQuizOptions([...content.options].sort(() => Math.random() - 0.5));
    } else if (item.type === 'checkbox_question') {
      const content = item.content as CheckboxQuestionContent;
      setShuffledCheckboxOptions([...content.options].sort(() => Math.random() - 0.5));
    } else if (item.type === 'matching_pairs') {
      const content = item.content as MatchingPairsContent;
      setShuffledMatchingLeft([...content.pairs.map(p => p.left)].sort(() => Math.random() - 0.5));
      setShuffledMatchingRight([...content.pairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    } else if (item.type === 'order_sequence') {
      const content = item.content as OrderSequenceContent;
      setOrderedItems([...content.items.map(i => i.text)].sort(() => Math.random() - 0.5));
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setGameState('loading');
      const data = await studyService.getSetForPlay(setId);
      if (data && data.items.length > 0) {
        let playableItems = data.items.filter(item => 
          ['flashcard', 'quiz_question', 'note', 'written_answer', 'checkbox_question', 'matching_pairs', 'order_sequence'].includes(item.type)
        );

        if (selectedItemIds && selectedItemIds.length > 0) {
          playableItems = playableItems.filter(item => selectedItemIds.includes(item.id));
        }

        if (playableItems.length === 0) {
          setGameEndedReason('no-items');
          setGameState('game-over');
          return;
        }

        const shuffled = [...playableItems].sort(() => Math.random() - 0.5);
        setItems(shuffled);
        setScore(0);
        setTotalCorrect(0);
        setTotalMistakes(0);
        setItemStats({});
        setCurrentIndex(0);
        setTimeLeft(duration);
        setGameEndedReason(null);
        setGameState('playing');
        prepareItem(shuffled[0]);
      } else {
        setGameEndedReason('no-items');
        setGameState('game-over');
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setGameEndedReason('no-items');
      setGameState('game-over');
    }
  }, [setId, selectedItemIds, duration, prepareItem]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameEndedReason('timeout');
            setGameState('game-over');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && items.length > 0) {
      const currentItem = items[currentIndex % items.length];
      if (currentItem) {
        prepareItem(currentItem);
      }
    }
  }, [currentIndex, items, gameState, prepareItem]);

  const handleAnswer = (isCorrectAnswer: boolean) => {
    if (isAnswered) return;

    setIsCorrect(isCorrectAnswer);
    setIsAnswered(true);
    
    const currentItem = items[currentIndex % items.length];
    if (currentItem) {
      setItemStats(prev => {
        const stats = prev[currentItem.id] || { 
          correct: 0, 
          mistakes: 0, 
          type: currentItem.type, 
          position: currentItem.position,
          content: currentItem.content 
        };
        return {
          ...prev,
          [currentItem.id]: {
            ...stats,
            correct: isCorrectAnswer ? stats.correct + 1 : stats.correct,
            mistakes: isCorrectAnswer ? stats.mistakes : stats.mistakes + 1
          }
        };
      });
    }

    if (isCorrectAnswer) {
      setScore(prev => prev + 10);
      setTotalCorrect(prev => prev + 1);
    } else {
      setTotalMistakes(prev => prev + 1);
    }

    const delay = isCorrectAnswer ? 1000 : 2000;
    setTimeout(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        if (nextIndex >= items.length && items.length > 0) {
          setGameEndedReason('completed');
          setGameState('game-over');
          return prevIndex;
        }
        return nextIndex;
      });
    }, delay);
  };

  return {
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
    // Item-specific states
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
  };
};

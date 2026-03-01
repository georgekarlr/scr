import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FinishStudySessionResponse,
  MatchingPairsContent,
  OrderSequenceContent,
  CheckboxQuestionContent,
} from '../types/study';
import { useToast } from '../contexts/ToastContext';
import LikersModal from '../components/study/LikersModal';
import CommentsModal from '../components/study/CommentsModal';
import RateSetModal from '../components/study/RateSetModal';
import StudyHeader from '../components/study/StudyHeader';
import StudyContent from '../components/study/StudyContent';
import StudyFooter from '../components/study/StudyFooter';
import WordExportModal from '../components/study/WordExportModal';
import { useStudySession } from '../hooks/useStudySession';

const StudyPage: React.FC = () => {
  const { id: setId } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<FinishStudySessionResponse | null>(null);
  const [showLikers, setShowLikers] = useState(false);
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
  const [showExportModal, setShowExportModal] = useState(false);

  const onSessionFinish = useCallback((summary: FinishStudySessionResponse | null, _resultsMap: Record<string, boolean>) => {
    setSessionSummary(summary);
    setSessionFinished(true);
  }, []);

  const {
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
    currentItem
  } = useStudySession(setId, onSessionFinish);

  const onClose = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-[90vh] md:h-auto md:max-h-[90vh]">
        <StudyHeader 
          data={data}
          cloning={cloning}
          onClose={onClose}
          onClone={handleClone}
          onShowRateModal={() => setShowRateModal(true)}
          onShowExportModal={() => setShowExportModal(true)}
          onShowSetComments={() => {
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
        />

        <StudyContent 
          loading={loading}
          sessionFinished={sessionFinished}
          sessionSummary={sessionSummary}
          results={results}
          currentItem={currentItem}
          onClose={onClose}
          flipped={flipped}
          onFlip={() => setFlipped(!flipped)}
          shuffledQuizOptions={shuffledQuizOptions}
          selectedOptionId={selectedOptionId}
          isAnswered={isAnswered}
          onAnswer={(optionId, isCorrect) => {
            setSelectedOptionId(optionId);
            setIsAnswered(true);
            if (currentItem) {
              setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
            }
          }}
          shuffledMatchingLeft={shuffledMatchingLeft}
          shuffledMatchingRight={shuffledMatchingRight}
          matchingMatches={matchingMatches}
          matchingSelected={matchingSelected}
          onMatchingSelect={(side, text) => {
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
          onMatchingReset={() => setMatchingMatches({})}
          onMatchingCheck={() => {
            if (!currentItem) return;
            setIsAnswered(true);
            const content = currentItem.content as MatchingPairsContent;
            const isCorrect = content.pairs.every(pair => matchingMatches[pair.left] === pair.right);
            const allMatched = content.pairs.length === Object.keys(matchingMatches).length;
            setResults(prev => ({ ...prev, [currentItem.id]: isCorrect && allMatched }));
          }}
          orderedItems={orderedItems}
          onOrderMove={(idx, direction) => {
            if (isAnswered) return;
            const newItems = [...orderedItems];
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= newItems.length) return;
            [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
            setOrderedItems(newItems);
          }}
          onOrderCheck={() => {
            if (!currentItem) return;
            setIsAnswered(true);
            const content = currentItem.content as OrderSequenceContent;
            const isCorrect = orderedItems.every((text, idx) => text === content.items[idx].text);
            setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
          }}
          shuffledCheckboxOptions={shuffledCheckboxOptions}
          selectedOptionIds={selectedOptionIds}
          onCheckboxToggle={(optionId) => {
            setSelectedOptionIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
          }}
          onCheckboxCheck={() => {
            if (!currentItem) return;
            setIsAnswered(true);
            const content = currentItem.content as CheckboxQuestionContent;
            const sortedSelected = [...selectedOptionIds].sort();
            const sortedCorrect = [...content.correct_option_ids].sort();
            const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
            setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
          }}
          writtenAnswer={writtenAnswer}
          onWrittenAnswerChange={setWrittenAnswer}
          onWrittenAnswerCheck={() => {
            if (!currentItem) return;
            setIsAnswered(true);
            const content = currentItem.content as any;
            const isCorrect = content.accepted_answers.some((ans: string) => ans.trim().toLowerCase() === writtenAnswer.trim().toLowerCase());
            setResults(prev => ({ ...prev, [currentItem.id]: isCorrect }));
          }}
        />

        {data && (
          <StudyFooter 
            currentIndex={currentIndex}
            totalItems={data.items.length}
            currentItem={currentItem}
            togglingReaction={togglingReaction}
            sessionFinished={sessionFinished}
            isFinishing={isFinishing}
            onToggleReaction={handleToggleReaction}
            onShowLikers={() => {
              setShowLikers(true);
              fetchLikers();
            }}
            onShowItemComments={() => {
              if (currentItem) {
                setCommentTarget({
                  id: currentItem.id,
                  type: 'item',
                  title: `Comments on Card ${currentIndex + 1}`
                });
                setShowComments(true);
              }
            }}
            onPrev={handlePrev}
            onNext={handleNext}
          />
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

      {data && showExportModal && (
        <WordExportModal 
          data={data}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default StudyPage;

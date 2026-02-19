import React from 'react';
import { Loader2 } from 'lucide-react';
import { 
  StudyItemPlay, 
  FinishStudySessionResponse,
  QuizQuestionContent,
  MatchingPairsContent,
  OrderSequenceContent,
  CheckboxQuestionContent,
  QuizQuestionOption,
  CheckboxOption,
  FlashcardContent,
  NoteContent,
  WrittenAnswerContent
} from '../../types/study';
import StudySessionSummary from './StudySessionSummary';
import FlashcardItem from './items/FlashcardItem';
import QuizItem from './items/QuizItem';
import NoteItem from './items/NoteItem';
import MatchingPairsItem from './items/MatchingPairsItem';
import OrderSequenceItem from './items/OrderSequenceItem';
import CheckboxItem from './items/CheckboxItem';
import WrittenAnswerItem from './items/WrittenAnswerItem';

interface StudyContentProps {
  loading: boolean;
  sessionFinished: boolean;
  sessionSummary: FinishStudySessionResponse | null;
  results: Record<string, boolean>;
  currentItem: StudyItemPlay | undefined;
  onClose: () => void;
  // Item specific state/actions
  flipped: boolean;
  onFlip: () => void;
  shuffledQuizOptions: QuizQuestionOption[];
  selectedOptionId: number | null;
  isAnswered: boolean;
  onAnswer: (optionId: number, isCorrect: boolean) => void;
  shuffledMatchingLeft: string[];
  shuffledMatchingRight: string[];
  matchingMatches: Record<string, string>;
  matchingSelected: { side: 'left' | 'right', text: string } | null;
  onMatchingSelect: (side: 'left' | 'right', text: string) => void;
  onMatchingReset: () => void;
  onMatchingCheck: () => void;
  orderedItems: string[];
  onOrderMove: (idx: number, direction: 'up' | 'down') => void;
  onOrderCheck: () => void;
  shuffledCheckboxOptions: CheckboxOption[];
  selectedOptionIds: number[];
  onCheckboxToggle: (optionId: number) => void;
  onCheckboxCheck: () => void;
  writtenAnswer: string;
  onWrittenAnswerChange: (value: string) => void;
  onWrittenAnswerCheck: () => void;
}

const StudyContent: React.FC<StudyContentProps> = ({
  loading,
  sessionFinished,
  sessionSummary,
  results,
  currentItem,
  onClose,
  flipped,
  onFlip,
  shuffledQuizOptions,
  selectedOptionId,
  isAnswered,
  onAnswer,
  shuffledMatchingLeft,
  shuffledMatchingRight,
  matchingMatches,
  matchingSelected,
  onMatchingSelect,
  onMatchingReset,
  onMatchingCheck,
  orderedItems,
  onOrderMove,
  onOrderCheck,
  shuffledCheckboxOptions,
  selectedOptionIds,
  onCheckboxToggle,
  onCheckboxCheck,
  writtenAnswer,
  onWrittenAnswerChange,
  onWrittenAnswerCheck
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
      {loading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Preparing your study session...</p>
        </div>
      ) : sessionFinished ? (
        <StudySessionSummary sessionSummary={sessionSummary} results={results} onClose={onClose} />
      ) : currentItem ? (
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
          {currentItem.type === 'flashcard' && (
            <FlashcardItem 
              content={currentItem.content as FlashcardContent}
              flipped={flipped}
              onFlip={onFlip}
            />
          )}
          {currentItem.type === 'quiz_question' && (
            <QuizItem
              content={currentItem.content as QuizQuestionContent}
              shuffledOptions={shuffledQuizOptions}
              selectedOptionId={selectedOptionId}
              isAnswered={isAnswered}
              onAnswer={onAnswer}
            />
          )}
          {currentItem.type === 'note' && (
            <NoteItem content={currentItem.content as NoteContent} />
          )}
          {currentItem.type === 'matching_pairs' && (
            <MatchingPairsItem
              content={currentItem.content as MatchingPairsContent}
              shuffledLeft={shuffledMatchingLeft}
              shuffledRight={shuffledMatchingRight}
              matchingMatches={matchingMatches}
              matchingSelected={matchingSelected}
              isAnswered={isAnswered}
              onSelect={onMatchingSelect}
              onReset={onMatchingReset}
              onCheck={onMatchingCheck}
            />
          )}
          {currentItem.type === 'order_sequence' && (
            <OrderSequenceItem
              content={currentItem.content as OrderSequenceContent}
              orderedItems={orderedItems}
              isAnswered={isAnswered}
              onMove={onOrderMove}
              onCheck={onOrderCheck}
            />
          )}
          {currentItem.type === 'checkbox_question' && (
            <CheckboxItem
              content={currentItem.content as CheckboxQuestionContent}
              shuffledOptions={shuffledCheckboxOptions}
              selectedOptionIds={selectedOptionIds}
              isAnswered={isAnswered}
              onToggle={onCheckboxToggle}
              onCheck={onCheckboxCheck}
            />
          )}
          {currentItem.type === 'written_answer' && (
            <WrittenAnswerItem
              content={currentItem.content as WrittenAnswerContent}
              writtenAnswer={writtenAnswer}
              isAnswered={isAnswered}
              onAnswerChange={onWrittenAnswerChange}
              onCheck={onWrittenAnswerCheck}
            />
          )}
        </div>
      ) : (
        <p className="text-gray-500">Failed to load items.</p>
      )}
    </div>
  );
};

export default StudyContent;
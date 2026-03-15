import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { 
  Zap, 
  Brain, 
  Clock, 
  BookOpen, 
  ChevronRight, 
  Play, 
  Check, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { studyService } from '../../services/studyService';
import { 
  FlashcardContent, 
  QuizQuestionContent, 
  WrittenAnswerContent, 
  CheckboxQuestionContent, 
  MatchingPairsContent, 
  OrderSequenceContent 
} from '../../types/study';

interface GameItem {
  id: string;
  term: string;
  answer: string;
  type: 'flashcard' | 'quiz_question' | 'written_answer' | 'checkbox_question' | 'note' | 'matching_pairs' | 'order_sequence';
  explanation?: string;
  image?: string;
}

interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  textColor: string;
}

const gameModes: GameMode[] = [
  { 
    id: 'standard', 
    name: 'Standard Study', 
    description: 'Review cards and items at your own pace', 
    icon: BookOpen, 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-600' 
  },
  { 
    id: 'rush-break', 
    name: 'Rush Break', 
    description: 'Race against the clock to answer as many items as possible', 
    icon: Zap, 
    color: 'bg-yellow-500', 
    bgColor: 'bg-yellow-50', 
    textColor: 'text-yellow-600' 
  },
  { 
    id: 'time-battle', 
    name: 'Time Battle', 
    description: 'Answer as many questions as you can in the time limit', 
    icon: Brain, 
    color: 'bg-purple-500', 
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-600' 
  },
  { 
    id: 'speed-march', 
    name: 'Speed March', 
    description: 'Answer quickly as fast as you can', 
    icon: Clock, 
    color: 'bg-green-500', 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-600' 
  }
];

interface StudyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  setId: string;
  setTitle: string;
}

const StudyModeModal: React.FC<StudyModeModalProps> = ({ isOpen, onClose, setId, setTitle }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select-mode' | 'select-items' | 'select-duration'>('select-mode');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [items, setItems] = useState<GameItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState(false);
  const [duration, setDuration] = useState(60);

  const durationOptions = [30, 60, 120];

  useEffect(() => {
    if (!isOpen) {
      setStep('select-mode');
      setSelectedMode(null);
      setSelectedItemIds(new Set());
      setDuration(60);
    }
  }, [isOpen]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const result = await studyService.getSetForPlay(setId);
      if (result) {
        const gameItems: GameItem[] = result.items
          .map((item: any) => {
            if (item.type === 'flashcard') {
              const content = item.content as FlashcardContent;
              return {
                id: item.id,
                term: content.front,
                answer: content.back,
                type: 'flashcard',
                explanation: content.explanation,
                image: content.image_url
              };
            } else if (item.type === 'quiz_question') {
              const content = item.content as QuizQuestionContent;
              const correctOpt = content.options.find(o => o.id === content.correct_option_id);
              return {
                id: item.id,
                term: content.question,
                answer: correctOpt?.text || '',
                type: 'quiz_question',
                explanation: content.explanation
              };
            } else if (item.type === 'written_answer') {
              const content = item.content as WrittenAnswerContent;
              return {
                id: item.id,
                term: content.question,
                answer: content.accepted_answers[0],
                type: 'written_answer',
                explanation: content.explanation
              };
            } else if (item.type === 'checkbox_question') {
              const content = item.content as CheckboxQuestionContent;
              const correctOpts = content.options.filter(o => content.correct_option_ids.includes(o.id));
              return {
                id: item.id,
                term: content.question,
                answer: correctOpts.map(o => o.text).join(', '),
                type: 'checkbox_question',
                explanation: content.explanation
              };
            } else if (item.type === 'matching_pairs') {
              const content = item.content as MatchingPairsContent;
              return {
                id: item.id,
                term: content.question,
                answer: content.pairs.map(p => `${p.left} - ${p.right}`).join(', '),
                type: 'matching_pairs',
                explanation: content.explanation
              };
            } else if (item.type === 'order_sequence') {
              const content = item.content as OrderSequenceContent;
              return {
                id: item.id,
                term: content.question,
                answer: content.items.map(i => i.text).join(' -> '),
                type: 'order_sequence',
                explanation: content.explanation
              };
            }
            return null;
          })
          .filter((item: any): item is GameItem => item !== null && item.type !== 'note');
        
        setItems(gameItems);
        setSelectedItemIds(new Set(gameItems.map(i => i.id)));
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    if (mode.id === 'standard') {
      navigate(`/study/${setId}`);
      onClose();
    } else {
      setSelectedMode(mode);
      setStep('select-items');
      fetchItems();
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === items.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(items.map(i => i.id)));
    }
  };

  const startGame = () => {
    if (!selectedMode || selectedItemIds.size === 0) return;
    
    // Check if we need duration for this mode
    if ((selectedMode.id === 'rush-break' || selectedMode.id === 'time-battle') && step !== 'select-duration') {
      setStep('select-duration');
      return;
    }

    navigate(`/study/${setId}/playing/${selectedMode.id}`, { 
      state: { 
        selectedItemIds: Array.from(selectedItemIds),
        duration: (selectedMode.id === 'rush-break' || selectedMode.id === 'time-battle') ? duration : undefined
      } 
    });
    onClose();
  };

  const renderContent = () => {
    if (step === 'select-mode') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-6">
            Choose how you want to study <span className="font-bold text-gray-900">{setTitle}</span>
          </p>
          <div className="grid grid-cols-1 gap-3">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode)}
                className="flex items-center p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group text-left"
              >
                <div className={`h-12 w-12 ${mode.bgColor} ${mode.textColor} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                  <mode.icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{mode.name}</h4>
                  <p className="text-xs text-gray-500">{mode.description}</p>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (step === 'select-items') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setStep('select-mode')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center"
            >
              Back to modes
            </button>
            <button
              onClick={toggleSelectAll}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {selectedItemIds.size === items.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="flex-1 min-h-[300px] overflow-y-auto pr-2 mb-20">
            {loadingItems ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                <p className="text-sm text-gray-500">Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No compatible items found in this set.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      selectedItemIds.has(item.id) 
                        ? 'border-blue-200 bg-blue-50/50' 
                        : 'border-gray-50 bg-white hover:border-blue-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      selectedItemIds.has(item.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedItemIds.has(item.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.term}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{item.type.replace('_', ' ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 rounded-b-xl sm:rounded-b-3xl">
            <button
              onClick={startGame}
              disabled={selectedItemIds.size === 0 || loadingItems}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedItemIds.size === 0 || loadingItems
                  ? 'bg-gray-200 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              <Play size={18} fill="currentColor" />
              {((selectedMode?.id === 'rush-break' || selectedMode?.id === 'time-battle')) ? 'Continue' : `Start Game (${selectedItemIds.size})`}
            </button>
          </div>
        </div>
      );
    }

    if (step === 'select-duration') {
      return (
        <div className="space-y-6 pb-20">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => setStep('select-items')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center"
            >
              Back to items
            </button>
          </div>

          <div className="text-center mb-8">
            <div className={`h-16 w-16 mx-auto ${selectedMode?.bgColor} ${selectedMode?.textColor} rounded-2xl flex items-center justify-center mb-4`}>
              {selectedMode && <selectedMode.icon size={32} />}
            </div>
            <h3 className="text-xl font-black text-gray-900">{selectedMode?.name}</h3>
            <p className="text-sm text-gray-500">Set the time limit for your game</p>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block text-center">
              Duration: <span className="text-blue-600">{duration} seconds</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {durationOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setDuration(opt)}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    duration === opt 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {opt}s
                </button>
              ))}
              <div className="col-span-1">
                <input 
                  type="number" 
                  min="1" 
                  max="3600"
                  value={durationOptions.includes(duration) ? '' : duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setDuration(Math.max(1, Math.min(3600, val)));
                  }}
                  placeholder="Custom"
                  className={`w-full py-4 px-2 rounded-xl font-bold transition-all outline-none text-center ${
                    !durationOptions.includes(duration) 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 rounded-b-xl sm:rounded-b-3xl">
            <button
              onClick={startGame}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Play size={18} fill="currentColor" />
              Start Game ({selectedItemIds.size} items)
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        step === 'select-mode' ? 'Choose Study Mode' : 
        step === 'select-items' ? `Select Items for ${selectedMode?.name}` :
        `Game Duration`
      }
    >
      {renderContent()}
    </Modal>
  );
};

export default StudyModeModal;

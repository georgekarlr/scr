import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, Zap, Brain, Clock, Shuffle, Target, Trophy, Play, Check, Loader2 } from 'lucide-react'
import { libraryService } from '../services/libraryService'
import { studyService } from '../services/studyService'
import { useNavigation } from '../contexts/NavigationContext'
import { LibraryContentItem, LibraryTabType } from '../types/library'
import { FlashcardContent, QuizQuestionContent, WrittenAnswerContent, CheckboxQuestionContent, NoteContent, MatchingPairsContent, OrderSequenceContent } from '../types/study'

type Step = 'select-game' | 'select-set' | 'select-items'
type SetTab = 'my-sets' | 'saved-sets'

interface Game {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface GameItem {
  id: string
  term: string
  answer: string
  type: 'flashcard' | 'quiz_question' | 'written_answer' | 'checkbox_question' | 'note' | 'matching_pairs' | 'order_sequence'
  explanation?: string
  image?: string
}

const dummyGames: Game[] = [
  { id: 'rush-break', name: 'Rush Break', description: 'Race against the clock to answer as many items as possible', icon: Zap, color: 'from-yellow-400 to-orange-500' },
  { id: 'time-battle', name: 'Time Battle', description: 'Answer as many questions as you can in the time limit', icon: Brain, color: 'from-purple-500 to-indigo-600' },
  { id: 'speed-march', name: 'Speed March', description: 'Answer quickly as fast as you can', icon: Clock, color: 'from-green-400 to-emerald-600' },
  /*{ id: 'scatter', name: 'Scatter', description: 'Drag and drop terms to their matching definitions', icon: Shuffle, color: 'from-pink-500 to-rose-600' },
  { id: 'target-practice', name: 'Target Practice', description: 'Type the correct answer as fast as you can', icon: Target, color: 'from-blue-500 to-cyan-600' },
  { id: 'survival', name: 'Survival', description: 'Answer correctly to stay alive — one wrong and it\'s over', icon: Trophy, color: 'from-red-500 to-orange-600' },*/
]

const GamesPage: React.FC = () => {
  const [step, setStep] = useState<Step>('select-game')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedSet, setSelectedSet] = useState<LibraryContentItem | null>(null)
  const [setTab, setSetTab] = useState<SetTab>('my-sets')
  const [items, setItems] = useState<GameItem[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [sets, setSets] = useState<LibraryContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const navigate = useNavigate()
  const { setBottomNavVisible, setTopBarVisible } = useNavigation()

  const stepIndex = step === 'select-game' ? 0 : step === 'select-set' ? 1 : 2
  const steps = ['Select Game', 'Select Set', 'Select Items']

  useEffect(() => {
    if (step === 'select-items') {
      setBottomNavVisible(false)
      setTopBarVisible(false)
    } else {
      setBottomNavVisible(true)
      setTopBarVisible(true)
    }

    // Reset on unmount
    return () => {
      setBottomNavVisible(true)
      setTopBarVisible(true)
    }
  }, [step, setBottomNavVisible, setTopBarVisible])

  useEffect(() => {
    const fetchSets = async () => {
      setLoading(true)
      try {
        const tabType: LibraryTabType = setTab === 'my-sets' ? 'created' : 'saved'
        const fetchedSets = await libraryService.getLibraryContent(tabType)
        setSets(fetchedSets)
      } catch (error) {
        console.error('Failed to fetch sets:', error)
      } finally {
        setLoading(false)
      }
    }

    if (step === 'select-set') {
      fetchSets()
    }
  }, [step, setTab])

  useEffect(() => {
    const fetchItems = async () => {
      if (step === 'select-items' && selectedSet) {
        setLoadingItems(true)
        try {
          const result = await studyService.getSetForPlay(selectedSet.id)
          if (result) {
            const gameItems: GameItem[] = result.items
              .map(item => {
                if (item.type === 'flashcard') {
                  const content = item.content as FlashcardContent
                  return {
                    id: item.id,
                    term: content.front,
                    answer: content.back,
                    type: 'flashcard',
                    explanation: content.explanation,
                    image: content.image_url
                  }
                } else if (item.type === 'quiz_question') {
                  const content = item.content as QuizQuestionContent
                  // Find correct answer text
                  const correctOption = content.options.find(o => o.id === content.correct_option_id)
                  return {
                    id: item.id,
                    term: content.question,
                    answer: correctOption ? correctOption.text : 'Unknown Answer',
                    type: 'quiz_question',
                    explanation: content.explanation
                  }
                } else if (item.type === 'written_answer') {
                  const content = item.content as WrittenAnswerContent
                  return {
                    id: item.id,
                    term: content.question,
                    answer: content.accepted_answers.join(' / '),
                    type: 'written_answer',
                    explanation: content.explanation
                  }
                } else if (item.type === 'checkbox_question') {
                  const content = item.content as CheckboxQuestionContent
                  const correctOptions = content.options
                    .filter(o => content.correct_option_ids.includes(o.id))
                    .map(o => o.text)
                    .join(', ')
                  return {
                    id: item.id,
                    term: content.question,
                    answer: correctOptions,
                    type: 'checkbox_question',
                    explanation: content.explanation
                  }
                } else if (item.type === 'note') {
                  const content = item.content as NoteContent
                  return {
                    id: item.id,
                    term: content.title,
                    answer: content.markdown,
                    type: 'note'
                  }
                } else if (item.type === 'matching_pairs') {
                  const content = item.content as MatchingPairsContent
                  const pairs = content.pairs || []
                  return {
                    id: item.id,
                    term: content.question || 'Matching Pair',
                    answer: `Match ${pairs.length} pairs: ${pairs.map(p => `${p.left} - ${p.right}`).join(', ')}`,
                    type: 'matching_pairs',
                    explanation: content.explanation
                  }
                } else if (item.type === 'order_sequence') {
                  const content = item.content as OrderSequenceContent
                  const items = content.items || []
                  return {
                    id: item.id,
                    term: content.question || 'Order Sequence',
                    answer: `Order: ${items.map(i => i.text).join(' → ')}`,
                    type: 'order_sequence',
                    explanation: content.explanation
                  }
                }
                return null
              })
              .filter((item): item is GameItem => item !== null)
            
            setItems(gameItems)
            setSelectedItemIds(new Set(gameItems.map(item => item.id)))
          }
        } catch (error) {
          console.error('Failed to fetch set items:', error)
        } finally {
          setLoadingItems(false)
        }
      }
    }

    fetchItems()
  }, [step, selectedSet])

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game)
    setStep('select-set')
  }

  const handleSetSelect = (set: LibraryContentItem) => {
    setSelectedSet(set)
    setItems([])
    setSelectedItemIds(new Set())
    setStep('select-items')
  }

  const handleBack = () => {
    if (step === 'select-game') {
      navigate(-1)
    } else if (step === 'select-set') {
      setStep('select-game')
      setSelectedGame(null)
    } else if (step === 'select-items') {
      setStep('select-set')
      setSelectedSet(null)
      setItems([])
      setSelectedItemIds(new Set())
    }
  }

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItemIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItemIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.size === items.length) {
      setSelectedItemIds(new Set())
    } else {
      setSelectedItemIds(new Set(items.map(item => item.id)))
    }
  }

  // Removed currentSets derived state

  return (
    <div className="w-full max-w-2xl mx-auto lg:mx-0 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-black text-gray-900">Games</h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                i <= stepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {i + 1}
              </div>
              <span className={`ml-2 text-sm font-bold hidden sm:inline ${
                i <= stepIndex ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded ${
                i < stepIndex ? 'bg-blue-600' : 'bg-gray-100'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Game */}
      {step === 'select-game' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">Choose a game mode to play with your study sets.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dummyGames.map((game) => {
              const Icon = game.icon
              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className="text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-3 shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{game.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{game.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Select Set */}
      {step === 'select-set' && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedGame?.color} flex items-center justify-center`}>
              {selectedGame && <selectedGame.icon className="h-4 w-4 text-white" />}
            </div>
            <span className="text-sm font-bold text-gray-900">{selectedGame?.name}</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-6 bg-white sticky top-16 lg:top-0 z-10">
            <button
              onClick={() => setSetTab('my-sets')}
              className={`flex-1 py-4 text-sm sm:text-base font-bold transition-colors border-b-4 flex items-center justify-center space-x-2 ${
                setTab === 'my-sets'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>My Sets</span>
            </button>
            <button
              onClick={() => setSetTab('saved-sets')}
              className={`flex-1 py-4 text-sm sm:text-base font-bold transition-colors border-b-4 flex items-center justify-center space-x-2 ${
                setTab === 'saved-sets'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span>Saved Sets</span>
            </button>
          </div>

          {/* Set List */}
          <div className="space-y-3 pb-24">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : sets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No sets found in this category.</p>
              </div>
            ) : (
              sets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => handleSetSelect(set)}
                  className={`w-full text-left bg-white border rounded-2xl p-4 transition-all active:scale-[0.99] group ${
                    selectedSet?.id === set.id
                      ? 'border-blue-600 ring-2 ring-blue-100 shadow-md'
                      : 'border-gray-100 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {set.subject?.emoji || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{set.title}</h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-gray-500">{set.subject?.name || 'Uncategorized'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{set.cards_count} cards</span>
                        {set.creator && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">by @{set.creator.username}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Start Game Button - Removed from here */}
        </div>
      )}

      {/* Step 3: Select Items */}
      {step === 'select-items' && selectedSet && (
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedGame?.color} flex items-center justify-center`}>
              {selectedGame && <selectedGame.icon className="h-4 w-4 text-white" />}
            </div>
            <span className="text-sm font-bold text-gray-900">{selectedGame?.name}</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-bold text-gray-900">{selectedSet.title}</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-24">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Select Terms to Include</h3>
              <button
                onClick={toggleSelectAll}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {selectedItemIds.size === items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {loadingItems ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-500 font-medium">No compatible items found in this set.</p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start space-x-4 group ${
                      selectedItemIds.has(item.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      selectedItemIds.has(item.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {selectedItemIds.has(item.id) && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 mb-1 flex items-center">
                        {item.term}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ml-2 ${
                          item.type === 'flashcard' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : item.type === 'quiz_question'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.type === 'written_answer'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.type === 'checkbox_question'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : item.type === 'matching_pairs'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : item.type === 'order_sequence'
                            ? 'bg-pink-50 text-pink-700 border-pink-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {item.type === 'flashcard' ? 'Card' : 
                           item.type === 'quiz_question' ? 'Quiz' :
                           item.type === 'written_answer' ? 'Writing' :
                           item.type === 'checkbox_question' ? 'Multi' :
                           item.type === 'matching_pairs' ? 'Match' :
                           item.type === 'order_sequence' ? 'Order' : 'Note'}
                        </span>
                      </p>
                      {/*<p className="text-sm text-gray-500 line-clamp-2">{item.answer}</p>*/}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Start Game Button */}
          <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-[60] pointer-events-none">
            <button
              onClick={() => navigate(`/study/${selectedSet.id}/playing/${selectedGame?.id}`, { state: { selectedItemIds: Array.from(selectedItemIds) } })}
              disabled={selectedItemIds.size < 1}
              className={`w-full max-w-2xl text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 pointer-events-auto ${
                selectedItemIds.size < 1
                  ? 'bg-gray-300 cursor-not-allowed transform-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Start Game ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default GamesPage

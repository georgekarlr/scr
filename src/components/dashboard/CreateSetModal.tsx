import React, { useState, useEffect } from 'react'
import { studyService } from '../../services/studyService'
import { Subject, CreateStudyItem, UpdateStudyItem, StudyItemType, FlashcardContent, QuizQuestionContent, NoteContent, MatchingPairsContent, OrderSequenceContent, CheckboxQuestionContent, WrittenAnswerContent } from '../../types/study'
import { Loader2, Plus, X, Brain, CheckSquare, FileText, Trash2, Edit2, GitMerge, ListOrdered, Type, CheckCircle2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

interface CreateSetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  mode?: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    description: string
    subject_id: number
    is_public: boolean
    tags: string[]
    items: UpdateStudyItem[]
  }
}

interface ItemEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: CreateStudyItem) => void
  initialItem?: CreateStudyItem
  itemIndex?: number
}

const ItemEditorModal: React.FC<ItemEditorModalProps> = ({ isOpen, onClose, onSave, initialItem, itemIndex }) => {
  const [type, setType] = useState<StudyItemType>(initialItem?.type || 'flashcard')
  const [content, setContent] = useState<any>(initialItem?.content || { front: '', back: '', explanation: '', image_url: '' })

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type)
      setContent(initialItem.content)
    } else {
      setType('flashcard')
      setContent({ front: '', back: '', explanation: '', image_url: '' })
    }
  }, [initialItem, isOpen])

  const handleTypeChange = (newType: StudyItemType) => {
    setType(newType)
    if (newType === 'flashcard') {
      setContent({ front: '', back: '', explanation: '', image_url: '' })
    } else if (newType === 'quiz_question') {
      setContent({ question: '', options: [{ id: 1, text: '' }, { id: 2, text: '' }], correct_option_id: 1, explanation: '' })
    } else if (newType === 'note') {
      setContent({ title: '', markdown: '', attachment_url: '' })
    } else if (newType === 'matching_pairs') {
      setContent({ question: '', pairs: [{ left: '', right: '' }], explanation: '' })
    } else if (newType === 'order_sequence') {
      setContent({ question: '', items: [{ text: '' }, { text: '' }], explanation: '' })
    } else if (newType === 'checkbox_question') {
      setContent({ question: '', options: [{ id: 1, text: '' }, { id: 2, text: '' }], correct_option_ids: [1], explanation: '' })
    } else if (newType === 'written_answer') {
      setContent({ question: '', accepted_answers: [''], explanation: '' })
    }
  }

  const updateContent = (fields: any) => {
    setContent({ ...content, ...fields })
  }

  const handleSave = () => {
    onSave({ type, content })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1010] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 h-[95vh] sm:h-auto sm:max-h-[85vh] mb-[env(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)] sm:mb-0 sm:pb-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {itemIndex !== undefined ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Type Selector */}
          {!initialItem && (
            <div className="grid grid-cols-4 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('flashcard')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-xs font-bold transition-all
                  ${type === 'flashcard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Brain className="h-5 w-5" />
                <span>Flashcard</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('quiz_question')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-xs font-bold transition-all
                  ${type === 'quiz_question' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CheckSquare className="h-5 w-5" />
                <span>Quiz</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('checkbox_question')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-xs font-bold transition-all
                  ${type === 'checkbox_question' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Checkbox</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('written_answer')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-xs font-bold transition-all
                  ${type === 'written_answer' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Type className="h-5 w-5" />
                <span>Written</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('matching_pairs')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-[10px] font-bold transition-all
                  ${type === 'matching_pairs' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <GitMerge className="h-4 w-4" />
                <span>Match</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('order_sequence')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-[10px] font-bold transition-all
                  ${type === 'order_sequence' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ListOrdered className="h-4 w-4" />
                <span>Order</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('note')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-[10px] font-bold transition-all
                  ${type === 'note' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="h-4 w-4" />
                <span>Note</span>
              </button>
            </div>
          )}

          {/* Flashcard Editor */}
          {type === 'flashcard' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Front (Term)</label>
                <textarea
                  value={content.front}
                  onChange={(e) => updateContent({ front: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                  placeholder="What is the term?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Back (Definition)</label>
                <textarea
                  value={content.back}
                  onChange={(e) => updateContent({ back: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                  placeholder="What is the definition?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanation (Optional)</label>
                <textarea
                  value={content.explanation}
                  onChange={(e) => updateContent({ explanation: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={2}
                  placeholder="Add context or mnemonics..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={content.image_url}
                  onChange={(e) => updateContent({ image_url: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          )}

          {/* Quiz Editor */}
          {type === 'quiz_question' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                <textarea
                  value={content.question}
                  onChange={(e) => updateContent({ question: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  rows={3}
                  placeholder="Enter your question here..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Options (Select correct one)</label>
                {content.options.map((opt: any, optIdx: number) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={content.correct_option_id === opt.id}
                      onChange={() => updateContent({ correct_option_id: opt.id })}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...content.options]
                          newOpts[optIdx].text = e.target.value
                          updateContent({ options: newOpts })
                        }}
                        className="flex-1 border-none text-sm py-2 px-3 focus:ring-0"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                      {content.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = content.options.filter((o: any) => o.id !== opt.id)
                            const correctId = content.correct_option_id === opt.id ? newOpts[0].id : content.correct_option_id
                            updateContent({ options: newOpts, correct_option_id: correctId })
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {content.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      const maxId = Math.max(...content.options.map((o: any) => o.id), 0)
                      updateContent({ options: [...content.options, { id: maxId + 1, text: '' }] })
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanation (Optional)</label>
                <textarea
                  value={content.explanation}
                  onChange={(e) => updateContent({ explanation: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  rows={2}
                  placeholder="Why is this the correct answer?"
                />
              </div>
            </div>
          )}

          {/* Matching Pairs Editor */}
          {type === 'matching_pairs' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instruction (Optional)</label>
                <input
                  type="text"
                  value={content.question}
                  onChange={(e) => updateContent({ question: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="e.g. Match the Capitals"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Pairs</label>
                {content.pairs.map((pair: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(e) => {
                        const newPairs = [...content.pairs]
                        newPairs[idx].left = e.target.value
                        updateContent({ pairs: newPairs })
                      }}
                      className="flex-1 rounded-xl border-gray-200 text-sm"
                      placeholder="Left item"
                    />
                    <div className="text-gray-400">→</div>
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(e) => {
                        const newPairs = [...content.pairs]
                        newPairs[idx].right = e.target.value
                        updateContent({ pairs: newPairs })
                      }}
                      className="flex-1 rounded-xl border-gray-200 text-sm"
                      placeholder="Right item"
                    />
                    {content.pairs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPairs = content.pairs.filter((_: any, i: number) => i !== idx)
                          updateContent({ pairs: newPairs })
                        }}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {content.pairs.length < 10 && (
                  <button
                    type="button"
                    onClick={() => updateContent({ pairs: [...content.pairs, { left: '', right: '' }] })}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Pair</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanation (Optional)</label>
                <textarea
                  value={content.explanation}
                  onChange={(e) => updateContent({ explanation: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Order Sequence Editor */}
          {type === 'order_sequence' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instruction (Optional)</label>
                <input
                  type="text"
                  value={content.question}
                  onChange={(e) => updateContent({ question: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. Order the lifecycle of a butterfly"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Items (In Correct Order)</label>
                {content.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newItems = [...content.items]
                        newItems[idx].text = e.target.value
                        updateContent({ items: newItems })
                      }}
                      className="flex-1 rounded-xl border-gray-200 text-sm"
                      placeholder={`Step ${idx + 1}`}
                    />
                    {content.items.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = content.items.filter((_: any, i: number) => i !== idx)
                          updateContent({ items: newItems })
                        }}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {content.items.length < 10 && (
                  <button
                    type="button"
                    onClick={() => updateContent({ items: [...content.items, { text: '' }] })}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Step</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanation (Optional)</label>
                <textarea
                  value={content.explanation}
                  onChange={(e) => updateContent({ explanation: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Checkbox Question Editor */}
          {type === 'checkbox_question' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                <textarea
                  value={content.question}
                  onChange={(e) => updateContent({ question: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  rows={2}
                  placeholder="Enter your question here..."
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Options (Select all that are correct)</label>
                {content.options.map((opt: any, idx: number) => (
                  <div key={opt.id} className="group flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        const isCorrect = content.correct_option_ids.includes(opt.id)
                        let newCorrectIds
                        if (isCorrect) {
                          newCorrectIds = content.correct_option_ids.filter((id: number) => id !== opt.id)
                        } else {
                          newCorrectIds = [...content.correct_option_ids, opt.id]
                        }
                        updateContent({ correct_option_ids: newCorrectIds })
                      }}
                      className={`h-6 w-6 rounded-md border-2 transition-all flex items-center justify-center
                        ${content.correct_option_ids.includes(opt.id) ? 'bg-violet-600 border-violet-600' : 'border-gray-200 hover:border-violet-300'}`}
                    >
                      {content.correct_option_ids.includes(opt.id) && <Plus className="h-4 w-4 text-white rotate-45" />}
                    </button>
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...content.options]
                          newOpts[idx].text = e.target.value
                          updateContent({ options: newOpts })
                        }}
                        className="flex-1 rounded-xl border-gray-200 text-sm"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {content.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = content.options.filter((o: any) => o.id !== opt.id)
                            const newCorrectIds = content.correct_option_ids.filter((id: number) => id !== opt.id)
                            updateContent({ options: newOpts, correct_option_ids: newCorrectIds })
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {content.options.length < 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      const maxId = Math.max(...content.options.map((o: any) => o.id), 0)
                      updateContent({ options: [...content.options, { id: maxId + 1, text: '' }] })
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanation (Optional)</label>
                <textarea
                  value={content.explanation}
                  onChange={(e) => updateContent({ explanation: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Written Answer Editor */}
          {type === 'written_answer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                <textarea
                  value={content.question}
                  onChange={(e) => updateContent({ question: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  rows={2}
                  placeholder="e.g. What is the capital of France?"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Accepted Answers</label>
                {content.accepted_answers.map((ans: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ans}
                      onChange={(e) => {
                        const newAns = [...content.accepted_answers]
                        newAns[idx] = e.target.value
                        updateContent({ accepted_answers: newAns })
                      }}
                      className="flex-1 rounded-xl border-gray-200 text-sm"
                      placeholder={`Valid answer ${idx + 1}`}
                    />
                    {content.accepted_answers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAns = content.accepted_answers.filter((_: string, i: number) => i !== idx)
                          updateContent({ accepted_answers: newAns })
                        }}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {content.accepted_answers.length < 5 && (
                  <button
                    type="button"
                    onClick={() => updateContent({ accepted_answers: [...content.accepted_answers, ''] })}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-pink-300 hover:text-pink-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Answer</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explanation (Optional)</label>
                <textarea
                  value={content.explanation}
                  onChange={(e) => updateContent({ explanation: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Note Editor */}
          {type === 'note' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => updateContent({ title: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Key concepts of..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content (Markdown)</label>
                <textarea
                  value={content.markdown}
                  onChange={(e) => updateContent({ markdown: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
                  rows={6}
                  placeholder="# Introduction\nUse markdown to format your note..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Attachment URL (Optional)</label>
                <input
                  type="text"
                  value={content.attachment_url}
                  onChange={(e) => updateContent({ attachment_url: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Link to PDF, video, or extra resource"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
          >
            {itemIndex !== undefined ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CreateSetModal: React.FC<CreateSetModalProps> = ({ isOpen, onClose, onSuccess, mode = 'create', initialData }) => {
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState('')
  const [items, setItems] = useState<UpdateStudyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Item Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UpdateStudyItem | undefined>()
  const [editingIndex, setEditingIndex] = useState<number | undefined>()

  useEffect(() => {
    if (isOpen && initialData && mode === 'edit') {
      setTitle(initialData.title)
      setDescription(initialData.description || '')
      setSubjectId(initialData.subject_id)
      setIsPublic(initialData.is_public)
      setTags(initialData.tags?.join(', ') || '')
      setItems(initialData.items || [])
    } else if (isOpen && mode === 'create') {
      setTitle('')
      setDescription('')
      setSubjectId('')
      setIsPublic(true)
      setTags('')
      setItems([])
    }
  }, [isOpen, initialData, mode])

  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          const data = await studyService.getSubjects()
          setSubjects(data)
        } catch (err) {
          console.error('Failed to fetch subjects:', err)
        } finally {
          setSubjectsLoading(false)
        }
      }
      fetchSubjects()
    }
  }, [isOpen])

  const openAddItem = () => {
    setEditingItem(undefined)
    setEditingIndex(undefined)
    setIsEditorOpen(true)
  }

  const openEditItem = (index: number) => {
    setEditingItem(items[index])
    setEditingIndex(index)
    setIsEditorOpen(true)
  }

  const handleSaveItem = (item: CreateStudyItem) => {
    if (editingIndex !== undefined) {
      const newItems = [...items]
      newItems[editingIndex] = item
      setItems(newItems)
    } else {
      setItems([...items, item])
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (subjectId === '') {
      setError('Please select a subject')
      return
    }

    try {
      setLoading(true)
      if (mode === 'edit' && initialData) {
        await studyService.updateFullSet({
          set_id: initialData.id,
          title: title.trim(),
          description: description.trim(),
          subject_id: Number(subjectId),
          is_public: isPublic,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          items: items
        })
        showToast('Study set updated successfully!', 'success')
      } else {
        await studyService.createFullSet({
          title: title.trim(),
          description: description.trim(),
          subject_id: Number(subjectId),
          is_public: isPublic,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          items: items.length > 0 ? items : undefined
        })
        showToast('Study set created successfully!', 'success')
      }
      
      onSuccess?.()
      onClose()
      
      if (mode === 'create') {
        // Reset form
        setTitle('')
        setDescription('')
        setSubjectId('')
        setItems([])
        setTags('')
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create set'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            {mode === 'edit' ? (
              <>
                <Edit2 className="h-6 w-6 mr-2 text-blue-600" />
                Edit Study Set
              </>
            ) : (
              <>
                <Plus className="h-6 w-6 mr-2 text-blue-600" />
                Create Study Set
              </>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-set-form" onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Set Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">General Information</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-lg py-3"
                    placeholder="e.g. Organic Chemistry"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                    required
                    disabled={subjectsLoading}
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="What is this set about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="chem, bio, exam..."
                  />
                </div>
                <div className="flex items-center pt-2 border-t border-gray-200 mt-2">
                  <label className="inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-700">Make this set public</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Study Items ({items.length})</h3>
                <button
                  type="button"
                  onClick={openAddItem}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Start building your set</h4>
                  <p className="text-gray-500">Add flashcards, quiz questions, or detailed notes.</p>
                  <button
                    type="button"
                    onClick={openAddItem}
                    className="mt-6 px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Create first item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div 
                      key={index} 
                      className="group flex items-center p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openEditItem(index)}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mr-4 
                        ${item.type === 'flashcard' ? 'bg-blue-50 text-blue-600' : 
                          item.type === 'quiz_question' ? 'bg-indigo-50 text-indigo-600' : 
                          item.type === 'checkbox_question' ? 'bg-violet-50 text-violet-600' :
                          item.type === 'written_answer' ? 'bg-pink-50 text-pink-600' :
                          item.type === 'matching_pairs' ? 'bg-purple-50 text-purple-600' :
                          item.type === 'order_sequence' ? 'bg-blue-50 text-blue-500' :
                          'bg-emerald-50 text-emerald-600'}`}
                      >
                        {item.type === 'flashcard' && <Brain className="h-5 w-5" />}
                        {item.type === 'quiz_question' && <CheckSquare className="h-5 w-5" />}
                        {item.type === 'checkbox_question' && <CheckCircle2 className="h-5 w-5" />}
                        {item.type === 'written_answer' && <Type className="h-5 w-5" />}
                        {item.type === 'matching_pairs' && <GitMerge className="h-5 w-5" />}
                        {item.type === 'order_sequence' && <ListOrdered className="h-5 w-5" />}
                        {item.type === 'note' && <FileText className="h-5 w-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {item.type === 'flashcard' && (item.content as FlashcardContent).front}
                          {item.type === 'quiz_question' && (item.content as QuizQuestionContent).question}
                          {item.type === 'checkbox_question' && (item.content as CheckboxQuestionContent).question}
                          {item.type === 'written_answer' && (item.content as WrittenAnswerContent).question}
                          {item.type === 'matching_pairs' && ((item.content as MatchingPairsContent).question || 'Matching Pairs')}
                          {item.type === 'order_sequence' && ((item.content as OrderSequenceContent).question || 'Order Sequence')}
                          {item.type === 'note' && ((item.content as NoteContent).title || 'Untitled Note')}
                        </p>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          {item.type.replace('_', ' ')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditItem(index)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeItem(index)
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pb-6">
          <div className="text-sm">
            {error && <p className="text-red-600 font-medium">{error}</p>}
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Discard
            </button>
            <button
              form="create-set-form"
              type="submit"
              disabled={loading || items.length === 0}
              className="bg-blue-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale flex items-center shadow-xl shadow-blue-100"
            >
              {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              {mode === 'edit' ? 'Save Changes' : 'Publish Set'}
            </button>
          </div>
        </div>

        {/* Focused Item Editor Modal */}
        <ItemEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveItem}
          initialItem={editingItem}
          itemIndex={editingIndex}
        />
      </div>
    </div>
  )
}

export default CreateSetModal

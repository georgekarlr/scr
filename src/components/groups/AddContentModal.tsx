import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { libraryService } from '../../services/libraryService';
import { groupService } from '../../services/groupService';
import { studyService } from '../../services/studyService';
import { LibraryContentItem } from '../../types/library';
import { 
  Subject, 
  CreateStudyItem, 
  UpdateStudyItem, 
  StudyItemType, 
  FlashcardContent, 
  QuizQuestionContent, 
  NoteContent, 
  MatchingPairsContent, 
  OrderSequenceContent, 
  CheckboxQuestionContent, 
  WrittenAnswerContent 
} from '../../types/study';
import { useToast } from '../../contexts/ToastContext';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Loader2, 
  Star, 
  CheckCircle2, 
  X, 
  Brain, 
  CheckSquare, 
  FileText, 
  Trash2, 
  Edit2, 
  GitMerge, 
  ListOrdered, 
  Type 
} from 'lucide-react';

interface ItemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CreateStudyItem) => void;
  initialItem?: CreateStudyItem;
  itemIndex?: number;
}

const ItemEditorModal: React.FC<ItemEditorModalProps> = ({ isOpen, onClose, onSave, initialItem, itemIndex }) => {
  const [type, setType] = useState<StudyItemType>(initialItem?.type || 'flashcard');
  const [content, setContent] = useState<any>(initialItem?.content || { front: '', back: '', explanation: '', image_url: '' });

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setContent(initialItem.content);
    } else {
      setType('flashcard');
      setContent({ front: '', back: '', explanation: '', image_url: '' });
    }
  }, [initialItem, isOpen]);

  const handleTypeChange = (newType: StudyItemType) => {
    setType(newType);
    if (newType === 'flashcard') {
      setContent({ front: '', back: '', explanation: '', image_url: '' });
    } else if (newType === 'quiz_question') {
      setContent({ question: '', options: [{ id: 1, text: '' }, { id: 2, text: '' }], correct_option_id: 1, explanation: '' });
    } else if (newType === 'note') {
      setContent({ title: '', markdown: '', attachment_url: '' });
    } else if (newType === 'matching_pairs') {
      setContent({ question: '', pairs: [{ left: '', right: '' }], explanation: '' });
    } else if (newType === 'order_sequence') {
      setContent({ question: '', items: [{ text: '' }, { text: '' }], explanation: '' });
    } else if (newType === 'checkbox_question') {
      setContent({ question: '', options: [{ id: 1, text: '' }, { id: 2, text: '' }], correct_option_ids: [1], explanation: '' });
    } else if (newType === 'written_answer') {
      setContent({ question: '', accepted_answers: [''], explanation: '' });
    }
  };

  const updateContent = (fields: any) => {
    setContent({ ...content, ...fields });
  };

  const handleSave = () => {
    onSave({ type, content });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1010] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 h-[92dvh] sm:h-auto sm:max-h-[85vh] mb-[env(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)] sm:mb-0 sm:pb-0">
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
                <GitMerge className="h-5 w-5" />
                <span>Multi</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('written_answer')}
                className={`flex flex-col items-center justify-center space-y-1 py-2 rounded-lg text-xs font-bold transition-all
                  ${type === 'written_answer' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Type className="h-5 w-5" />
                <span>Write</span>
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
                  placeholder="e.g. Mitochondria"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Back (Definition)</label>
                <textarea
                  value={content.back}
                  onChange={(e) => updateContent({ back: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                  placeholder="The powerhouse of the cell..."
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
                          const newOpts = [...content.options];
                          newOpts[optIdx].text = e.target.value;
                          updateContent({ options: newOpts });
                        }}
                        className="flex-1 border-none text-sm py-2 px-3 focus:ring-0"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                      {content.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = content.options.filter((o: any) => o.id !== opt.id);
                            const correctId = content.correct_option_id === opt.id ? newOpts[0].id : content.correct_option_id;
                            updateContent({ options: newOpts, correct_option_id: correctId });
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
                      const maxId = Math.max(...content.options.map((o: any) => o.id), 0);
                      updateContent({ options: [...content.options, { id: maxId + 1, text: '' }] });
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
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
                  rows={3}
                  placeholder="Enter question requiring a written response..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Accepted Answers</label>
                {content.accepted_answers.map((ans: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ans}
                      onChange={(e) => {
                        const newAns = [...content.accepted_answers];
                        newAns[idx] = e.target.value;
                        updateContent({ accepted_answers: newAns });
                      }}
                      className="flex-1 rounded-xl border-gray-200 text-sm"
                      placeholder={`Valid answer ${idx + 1}`}
                    />
                    {content.accepted_answers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAns = content.accepted_answers.filter((_: string, i: number) => i !== idx);
                          updateContent({ accepted_answers: newAns });
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
            </div>
          )}

          {/* Checkbox Editor */}
          {type === 'checkbox_question' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                <textarea
                  value={content.question}
                  onChange={(e) => updateContent({ question: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  rows={3}
                  placeholder="Enter a question with multiple correct answers..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Options (Check all correct ones)</label>
                {content.options.map((opt: any, optIdx: number) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={content.correct_option_ids.includes(opt.id)}
                      onChange={(e) => {
                        let newIds = [...content.correct_option_ids];
                        if (e.target.checked) {
                          newIds.push(opt.id);
                        } else {
                          newIds = newIds.filter(id => id !== opt.id);
                        }
                        updateContent({ correct_option_ids: newIds });
                      }}
                      className="text-violet-600 focus:ring-violet-500 h-4 w-4 rounded"
                    />
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 transition-all">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...content.options];
                          newOpts[optIdx].text = e.target.value;
                          updateContent({ options: newOpts });
                        }}
                        className="flex-1 border-none text-sm py-2 px-3 focus:ring-0"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                      {content.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = content.options.filter((o: any) => o.id !== opt.id);
                            const newIds = content.correct_option_ids.filter((id: number) => id !== opt.id);
                            updateContent({ options: newOpts, correct_option_ids: newIds });
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
                      const maxId = Math.max(...content.options.map((o: any) => o.id), 0);
                      updateContent({ options: [...content.options, { id: maxId + 1, text: '' }] });
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
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
  );
};

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess: () => void;
}

const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, groupId, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Create New Set State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [items, setItems] = useState<CreateStudyItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  
  // Item Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreateStudyItem | undefined>();
  const [editingIndex, setEditingIndex] = useState<number | undefined>();

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'existing') {
        fetchLibrary();
      } else {
        fetchSubjects();
      }
    }
  }, [isOpen, activeTab]);

  const fetchSubjects = async () => {
    if (subjects.length > 0) return;
    setSubjectsLoading(true);
    try {
      const data = await studyService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      // Fetch both created and saved sets
      const [created, saved] = await Promise.all([
        libraryService.getLibraryContent('created'),
        libraryService.getLibraryContent('saved')
      ]);
      
      // Combine and remove duplicates if any
      const combined = [...created];
      saved.forEach(s => {
        if (!combined.find(c => c.id === s.id)) {
          combined.push(s);
        }
      });
      
      setLibraryItems(combined);
    } catch (err) {
      console.error(err);
      showToast('Failed to load library items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = libraryItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLinkExisting = async () => {
    if (!selectedSetId) return;
    setSubmitting(true);
    try {
      await groupService.addSetToGroup({
        p_group_id: groupId,
        p_existing_set_id: selectedSetId
      });
      showToast('Set added to group successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to add set to group', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNew = async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (subjectId === '') {
      showToast('Please select a subject', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one item to the set', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await groupService.addSetToGroup({
        p_group_id: groupId,
        p_title: title.trim(),
        p_description: description.trim(),
        p_subject_id: Number(subjectId),
        p_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        p_items: items
      });
      showToast('New set created and added to group!', 'success');
      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setSubjectId('');
      setItems([]);
      setTags('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create and add set', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddItem = () => {
    setEditingItem(undefined);
    setEditingIndex(undefined);
    setIsEditorOpen(true);
  };

  const openEditItem = (index: number) => {
    setEditingItem(items[index]);
    setEditingIndex(index);
    setIsEditorOpen(true);
  };

  const handleSaveItem = (item: CreateStudyItem) => {
    if (editingIndex !== undefined) {
      const newItems = [...items];
      newItems[editingIndex] = item;
      setItems(newItems);
    } else {
      setItems([...items, item]);
    }
  };

  const removeItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Content to Group">
      <div className="flex flex-col">
        {/* Tabs */}
        <div className="flex bg-gray-50 p-1 rounded-2xl mb-6 sticky top-0 z-10">
          <button
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'existing' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Link Existing Set
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'new' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create New Set
          </button>
        </div>

        {activeTab === 'existing' ? (
          <div className="flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="min-h-[300px] pr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Loading your library...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <BookOpen size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">No sets found in your library.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSetId(item.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                        selectedSetId === item.id 
                          ? 'border-blue-500 bg-blue-50/50' 
                          : 'border-gray-50 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          selectedSetId === item.id ? 'bg-blue-100 scale-110' : 'bg-gray-50'
                        }`}>
                          {item.subject?.emoji || '📚'}
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm mb-0.5 transition-colors ${
                            selectedSetId === item.id ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            <span>{item.cards_count} Cards</span>
                            {item.average_rating > 0 && (
                              <span className="flex items-center text-yellow-500">
                                <Star size={10} className="fill-current mr-0.5" />
                                {item.average_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedSetId === item.id && (
                        <CheckCircle2 size={20} className="text-blue-500 animate-in zoom-in duration-300" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white pb-2 z-10">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkExisting}
                disabled={!selectedSetId || submitting}
                className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  !selectedSetId || submitting
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95'
                }`}
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Add Selected Set
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="space-y-6">
              {/* Form Fields */}
              <div className="bg-gray-50 p-5 rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-sm py-2.5"
                    placeholder="e.g. Weekly Quiz #1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-xl border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-sm py-2.5"
                      disabled={subjectsLoading}
                    >
                      <option value="">Select...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tags</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full rounded-xl border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-sm py-2.5"
                      placeholder="tag1, tag2..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-sm py-2"
                    rows={2}
                    placeholder="Briefly describe this set..."
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-bold text-gray-900">Study Items ({items.length})</h4>
                  <button
                    onClick={openAddItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">No items added yet.</p>
                    <button
                      onClick={openAddItem}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      Create your first item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => openEditItem(index)}
                        className="flex items-center p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-all cursor-pointer group"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-3 shrink-0
                          ${item.type === 'flashcard' ? 'bg-blue-50 text-blue-600' : 
                            item.type === 'quiz_question' ? 'bg-indigo-50 text-indigo-600' : 
                            item.type === 'checkbox_question' ? 'bg-violet-50 text-violet-600' :
                            'bg-pink-50 text-pink-600'}`}
                        >
                          {item.type === 'flashcard' ? <Brain size={16} /> : 
                           item.type === 'quiz_question' ? <CheckSquare size={16} /> :
                           item.type === 'checkbox_question' ? <GitMerge size={16} /> :
                           <Type size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {item.type === 'flashcard' ? (item.content as FlashcardContent).front :
                             (item.content as QuizQuestionContent | CheckboxQuestionContent | WrittenAnswerContent).question}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                            {item.type.replace('_', ' ')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => removeItem(e, index)}
                          className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white pb-2 z-10">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                disabled={!title.trim() || items.length === 0 || submitting}
                className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  !title.trim() || items.length === 0 || submitting
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95'
                }`}
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Create & Add Set
              </button>
            </div>

            <ItemEditorModal
              isOpen={isEditorOpen}
              onClose={() => setIsEditorOpen(false)}
              onSave={handleSaveItem}
              initialItem={editingItem}
              itemIndex={editingIndex}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddContentModal;

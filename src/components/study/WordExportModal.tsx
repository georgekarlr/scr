import React, { useState } from 'react';
import { X, FileText, Check, Settings2 } from 'lucide-react';
import { GetSetForPlayResponse, GetSetDetailsResponse, StudyItemType } from '../../types/study';
import { generateWordFile, WordExportOptions, ExportFormatOptions } from '../../services/wordExportService';

interface WordExportModalProps {
  data: GetSetForPlayResponse | GetSetDetailsResponse;
  onClose: () => void;
}

const WordExportModal: React.FC<WordExportModalProps> = ({ data, onClose }) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    data.items.map(item => item.id)
  );
  
  const [isExporting, setIsExporting] = useState(false);

  // Default formats for each type
  const [typeFormats, setTypeFormats] = useState<Record<string, ExportFormatOptions>>({
    quiz_question: { includeQuestion: true, includeOptions: true, includeBlank: false, includeAnswerKey: true, includeExplanation: true },
    checkbox_question: { includeQuestion: true, includeOptions: true, includeBlank: false, includeAnswerKey: true, includeExplanation: true },
    matching_pairs: { includeQuestion: true, includeOptions: true, includeBlank: false, includeAnswerKey: true, includeExplanation: true },
    order_sequence: { includeQuestion: true, includeOptions: true, includeBlank: false, includeAnswerKey: true, includeExplanation: true },
    written_answer: { includeQuestion: true, includeOptions: false, includeBlank: true, includeAnswerKey: true, includeExplanation: true },
    flashcard: { includeQuestion: true, includeOptions: true, includeBlank: true, includeAnswerKey: true, includeExplanation: true }, // "show all"
    note: { includeQuestion: true, includeOptions: true, includeBlank: true, includeAnswerKey: true, includeExplanation: true }, // "show all"
  });

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItemIds.length === data.items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(data.items.map(item => item.id));
    }
  };

  const updateTypeFormat = (type: string, field: keyof ExportFormatOptions) => {
    setTypeFormats(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: !prev[type][field]
      }
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const formats: Record<string, ExportFormatOptions> = {};
      data.items.forEach(item => {
        formats[item.id] = typeFormats[item.type] || typeFormats.quiz_question;
      });

      const options: WordExportOptions = {
        setTitle: data.set.title,
        selectedItemIds,
        formats
      };

      await generateWordFile(data, options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const itemTypes = Array.from(new Set(data.items.map(item => item.type)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export to Word</h2>
              <p className="text-sm text-gray-500">Select items and customize format</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Format Settings */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Settings2 className="h-5 w-5 text-gray-400" />
              <h3 className="font-bold text-gray-900">Format Settings</h3>
            </div>
            <div className="space-y-4">
              {itemTypes.map(type => (
                <div key={type} className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-3">
                    {type.replace('_', ' ')}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {['flashcard', 'note'].includes(type) ? (
                      <span className="text-sm text-gray-500 italic">Always showing all fields for {type.replace('_', ' ')}s</span>
                    ) : (
                      <>
                        <button
                          onClick={() => updateTypeFormat(type, 'includeQuestion')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            typeFormats[type].includeQuestion ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          Question
                        </button>
                        {type === 'written_answer' ? (
                          <button
                            onClick={() => updateTypeFormat(type, 'includeBlank')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              typeFormats[type].includeBlank ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            Blank Line
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTypeFormat(type, 'includeOptions')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              typeFormats[type].includeOptions ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            Options
                          </button>
                        )}
                        <button
                          onClick={() => updateTypeFormat(type, 'includeAnswerKey')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            typeFormats[type].includeAnswerKey ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          Answer Key
                        </button>
                        <button
                          onClick={() => updateTypeFormat(type, 'includeExplanation')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            typeFormats[type].includeExplanation ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          Explanation
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Item Selection */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Select Items ({selectedItemIds.length})</h3>
              <button 
                onClick={toggleAll}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {selectedItemIds.length === data.items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start p-3 rounded-xl border transition-all text-left ${
                    selectedItemIds.includes(item.id) 
                      ? 'border-blue-200 bg-blue-50/50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedItemIds.includes(item.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                  }`}>
                    {selectedItemIds.includes(item.id) && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {idx + 1}. {
                        item.type === 'flashcard' ? (item.content as any).front :
                        (item.content as any).question || (item.content as any).title || 'No title'
                      }
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-tighter mt-0.5">
                      {item.type.replace('_', ' ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedItemIds.length === 0 || isExporting}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <span>Generate Word File</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordExportModal;

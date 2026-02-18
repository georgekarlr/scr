import React from 'react';
import { FileText } from 'lucide-react';
import { NoteContent } from '../../../types/study';

interface NoteItemProps {
  content: NoteContent;
}

const NoteItem: React.FC<NoteItemProps> = ({ content }) => {
  return (
    <div className="w-full bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-xl max-h-[60vh] overflow-y-auto">
      <div className="flex items-center space-x-2 mb-6 text-emerald-600">
        <FileText className="h-6 w-6" />
        <span className="font-bold uppercase tracking-wider text-sm">Study Note</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{content.title}</h2>
      <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
        {content.markdown}
      </div>
    </div>
  );
};

export default NoteItem;

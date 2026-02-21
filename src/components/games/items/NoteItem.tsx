import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { NoteContent } from '../../../types/study';

interface NoteItemProps {
    content: NoteContent;
    onContinue?: () => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ content, onContinue }) => {
    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full bg-white border-2 border-emerald-100 rounded-3xl p-10 sm:p-14 shadow-xl max-h-[75vh] overflow-y-auto">
                <div className="flex items-center space-x-2 mb-8 text-emerald-600">
                    <FileText className="h-8 w-8" />
                    <span className="font-bold uppercase tracking-wider text-base">Study Note</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8">{content.title}</h2>
                <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {content.markdown}
                </div>
            </div>
            
            {onContinue && (
                <div className="flex justify-center">
                    <button
                        onClick={onContinue}
                        className="group flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl tracking-widest uppercase transition-all shadow-xl shadow-emerald-100 hover:-translate-y-1 active:scale-95"
                    >
                        <span>Continue to Next Item</span>
                        <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoteItem;

import React, { useState } from 'react';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Brain, 
  Star, 
  Users, 
  Clock, 
  Lock, 
  Globe,
  Loader2
} from 'lucide-react';
import { LibraryContentItem } from '../../types/library';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

interface LibrarySetCardProps {
  item: LibraryContentItem;
  onStudy: (id: string) => void;
  onEdit: (item: LibraryContentItem) => void;
  onDelete: (id: string) => void;
}

const LibrarySetCard: React.FC<LibrarySetCardProps> = ({ item, onStudy, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div 
      className="bg-white border border-gray-100 rounded-3xl p-5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all group relative cursor-pointer"
      onClick={() => onStudy(item.id)}
    >
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Study Set"
        message={`Are you sure you want to delete "${item.title}"? This action cannot be undone and you will lose all progress and items associated with this set.`}
      />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            {item.subject?.emoji || '📚'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h3>
              {item.is_public ? (
                <Globe className="h-3 w-3 text-gray-400" />
              ) : (
                <Lock className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{item.subject?.name || 'General'}</p>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-3" />
                  Edit Set
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  disabled={deleting}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-3" />
                  )}
                  Delete Set
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
          {item.description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50 mb-4">
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Cards</p>
          <p className="font-bold text-gray-900">{item.cards_count}</p>
        </div>
        <div className="text-center border-x border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Rating</p>
          <div className="flex items-center justify-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <p className="font-bold text-gray-900">{item.average_rating.toFixed(1)}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-1">Reviews</p>
          <p className="font-bold text-gray-900">{item.total_ratings}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-400 text-xs font-medium">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(item.created_at).toLocaleDateString()}
        </div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onStudy(item.id);
          }}
        >
          Study Now
        </button>
      </div>
    </div>
  );
};

export default LibrarySetCard;

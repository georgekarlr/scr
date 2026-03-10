import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { ItemLiker } from '../../types/study';

interface LikersModalProps {
  isOpen: boolean;
  onClose: () => void;
  likers: ItemLiker[];
  loading: boolean;
}

const LikersModal: React.FC<LikersModalProps> = ({ isOpen, onClose, likers, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 ml-2">Liked by</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : likers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No likes yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {likers.map((liker) => (
                <div 
                  key={liker.user_id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    {liker.avatar_url ? (
                      <img 
                        src={liker.avatar_url} 
                        alt={liker.username || 'User'} 
                        className="h-10 w-10 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {(liker.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{liker.username || 'Anonymous'}</p>
                      {liker.full_name && (
                        <p className="text-xs text-gray-500">{liker.full_name}</p>
                      )}
                    </div>
                  </div>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikersModal;

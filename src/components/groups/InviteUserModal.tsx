import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, UserPlus, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import { studyService } from '../../services/studyService';
import { groupService } from '../../services/groupService';
import { SearchUserResult } from '../../types/study';
import { useToast } from '../../contexts/ToastContext';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, groupId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await studyService.searchUsers(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to search users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      setInvitingId(userId);
      const result = await groupService.inviteUserToGroup({
        p_group_id: groupId,
        p_target_user_id: userId
      });

      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Invitation sent successfully!', 'success');
        // Optionally remove invited user from results or mark as invited
        setResults(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Invite error:', error);
      showToast('Failed to send invitation', 'error');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Invite Members</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
              <p className="text-sm text-gray-500 font-medium">Searching users...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.id}
                className="w-full flex items-center p-3 hover:bg-blue-50 rounded-2xl transition-all group"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="ml-4 text-left flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleInvite(user.id)}
                  disabled={invitingId === user.id}
                  className="bg-white p-2.5 rounded-xl shadow-sm border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {invitingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">No users found</h3>
              <p className="text-sm text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default InviteUserModal;

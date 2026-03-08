import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { groupService } from '../../services/groupService';
import { useToast } from '../../contexts/ToastContext';
import { Loader2, Users, Lock, Globe } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const groupId = await groupService.createGroup(name, description, isPrivate);
      showToast('Group created successfully!', 'success');
      onSuccess(groupId);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(true);
    } catch (error) {
      showToast('Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Group Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g. Physics Study Group"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-32"
            placeholder="What is this group about?"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">
            Privacy Settings
          </label>
          
          <div 
            onClick={() => setIsPrivate(true)}
            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isPrivate ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`p-2 rounded-lg mr-4 ${isPrivate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Lock size={20} />
            </div>
            <div className="flex-1">
              <p className={`font-bold ${isPrivate ? 'text-blue-900' : 'text-gray-900'}`}>Private Group</p>
              <p className="text-sm text-gray-500">Only invited members can join. Requires approval.</p>
            </div>
            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
              isPrivate ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
            }`}>
              {isPrivate && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </div>

          <div 
            onClick={() => setIsPrivate(false)}
            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              !isPrivate ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`p-2 rounded-lg mr-4 ${!isPrivate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Globe size={20} />
            </div>
            <div className="flex-1">
              <p className={`font-bold ${!isPrivate ? 'text-blue-900' : 'text-gray-900'}`}>Public Group</p>
              <p className="text-sm text-gray-500">Anyone can find and join this group instantly.</p>
            </div>
            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
              !isPrivate ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
            }`}>
              {!isPrivate && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Creating Group...
            </>
          ) : (
            <>
              <Users className="h-5 w-5 mr-2" />
              Create Group
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;

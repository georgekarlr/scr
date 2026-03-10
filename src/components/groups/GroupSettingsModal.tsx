import React, { useState } from 'react';
import { Settings, Save, X, Loader2, Shield, Lock, Unlock, Trophy, BookOpen, Clock } from 'lucide-react';
import Modal from '../ui/Modal';
import { Group } from '../../types/groups';
import { groupService } from '../../services/groupService';
import { useToast } from '../../contexts/ToastContext';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdate: () => void;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ isOpen, onClose, group, onUpdate }) => {
  const isAdmin = group.my_role === 'admin';
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    is_private: group.is_private,
    allow_member_creation: group.allow_member_creation,
    show_leaderboard: group.show_leaderboard,
    show_study_logs: group.show_study_logs
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formData.name.trim()) return;

    setLoading(true);
    try {
      await groupService.updateGroupSettings({
        p_group_id: group.id,
        p_name: formData.name,
        p_description: formData.description,
        p_is_private: formData.is_private,
        p_allow_creation: formData.allow_member_creation,
        p_show_leaderboard: formData.show_leaderboard,
        p_show_logs: formData.show_study_logs
      });
      showToast('Group settings updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update group settings:', error);
      showToast('Failed to update group settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Group Settings">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium disabled:opacity-60"
              placeholder="Enter group name..."
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-1">Description</label>
            <textarea
              disabled={!isAdmin}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium min-h-[100px] resize-none disabled:opacity-60"
              placeholder="Tell us what this group is about..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Privacy Toggle */}
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => setFormData({ ...formData, is_private: !formData.is_private })}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                formData.is_private 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200'
              } ${!isAdmin && 'opacity-60 cursor-not-allowed'}`}
            >
              <div className={`p-2.5 rounded-xl ${formData.is_private ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {formData.is_private ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <div>
                <div className="font-black text-sm">Private Group</div>
                <div className="text-xs text-gray-500 font-medium">Require invite or request</div>
              </div>
            </button>

            {/* Member Content Creation Toggle */}
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => setFormData({ ...formData, allow_member_creation: !formData.allow_member_creation })}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                formData.allow_member_creation 
                  ? 'border-green-500 bg-green-50/50' 
                  : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200'
              } ${!isAdmin && 'opacity-60 cursor-not-allowed'}`}
            >
              <div className={`p-2.5 rounded-xl ${formData.allow_member_creation ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <BookOpen size={20} />
              </div>
              <div>
                <div className="font-black text-sm">Member Creation</div>
                <div className="text-xs text-gray-500 font-medium">Allow members to add sets</div>
              </div>
            </button>

            {/* Leaderboard Toggle */}
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => setFormData({ ...formData, show_leaderboard: !formData.show_leaderboard })}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                formData.show_leaderboard 
                  ? 'border-amber-500 bg-amber-50/50' 
                  : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200'
              } ${!isAdmin && 'opacity-60 cursor-not-allowed'}`}
            >
              <div className={`p-2.5 rounded-xl ${formData.show_leaderboard ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Trophy size={20} />
              </div>
              <div>
                <div className="font-black text-sm">Leaderboard</div>
                <div className="text-xs text-gray-500 font-medium">Show group rankings</div>
              </div>
            </button>

            {/* Study Logs Toggle */}
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => setFormData({ ...formData, show_study_logs: !formData.show_study_logs })}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                formData.show_study_logs 
                  ? 'border-purple-500 bg-purple-50/50' 
                  : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200'
              } ${!isAdmin && 'opacity-60 cursor-not-allowed'}`}
            >
              <div className={`p-2.5 rounded-xl ${formData.show_study_logs ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Clock size={20} />
              </div>
              <div>
                <div className="font-black text-sm">Study Activity</div>
                <div className="text-xs text-gray-500 font-medium">Show member study logs</div>
              </div>
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default GroupSettingsModal;

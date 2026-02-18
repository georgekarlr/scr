import React, { useState } from 'react';
import { RecommendedUser } from '../../types/study';
import { UserPlus, UserCheck, Loader2, MoreHorizontal } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { studyService } from '../../services/studyService';
import { useNavigate } from 'react-router-dom';

interface RecommendationCardProps {
  user: RecommendedUser;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ user }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleFollow = async () => {
    try {
      setLoading(true);
      await studyService.followUser(user.user_id);

      setFollowed(true);
      showToast(`Now following ${user.username}`, 'success');
    } catch (err: any) {
      console.error('Follow error:', err);
      showToast(err?.message || `Failed to follow ${user.username}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setLoading(true);
      await studyService.unfollowUser(user.user_id);

      setFollowed(false);
      setShowMenu(false);
      showToast(`Unfollowed ${user.username}`, 'success');
    } catch (err: any) {
      console.error('Unfollow error:', err);
      showToast(err?.message || `Failed to unfollow ${user.username}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3 relative">
      <div 
        className="flex items-center space-x-3 cursor-pointer group/user"
        onClick={() => navigate(`/u/${user.username}`)}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.username || 'User'} className="h-12 w-12 rounded-full object-cover group-hover/user:opacity-80 transition-opacity" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg group-hover/user:bg-blue-200 transition-colors">
            {(user.username || 'User').substring(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-bold text-gray-900 group-hover/user:text-blue-600 transition-colors">{user.username || 'Anonymous'}</p>
          <p className="text-xs text-gray-500">{user.xp.toLocaleString()} XP • Suggested for you</p>
          {user.bio && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-1 italic">
              "{user.bio}"
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleFollow}
          disabled={loading || followed}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center space-x-1 ${
            followed 
              ? 'bg-green-100 text-green-700 cursor-default' 
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
          }`}
        >
          {loading && !showMenu ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : followed ? (
            <UserCheck className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          <span>{followed ? 'Following' : 'Follow'}</span>
        </button>

        {followed && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                <button
                  onClick={handleUnfollow}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Unfollow
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { studyService } from '../services/studyService';
import { WhoToFollowUser } from '../types/study';
import { Loader2, ChevronLeft, Users, UserPlus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const WhoToFollowPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState<WhoToFollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchWhoToFollow = async () => {
      try {
        setLoading(true);
        const data = await studyService.getWhoToFollow(50);
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch who to follow:', error);
        showToast('Failed to load recommendations', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchWhoToFollow();
  }, [showToast]);

  const handleFollow = async (userId: string, username: string) => {
    if (followLoading[userId]) return;

    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      await studyService.followUser(userId);
      setFollowingIds(prev => new Set([...prev, userId]));
      showToast(`Following @${username}`, 'success');
    } catch (error) {
      console.error('Follow failed:', error);
      showToast('Failed to follow user', 'error');
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Who to follow</h1>
          <p className="text-sm text-gray-500">People you might know or find interesting</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-50">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                <Link to={`/u/${user.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="h-full w-full object-cover" alt={user.username} />
                    ) : (
                      user.username.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-gray-900 truncate">@{user.username}</p>
                      {user.is_relevant && (
                        <span className="flex-shrink-0 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Similar interests
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.total_xp.toLocaleString()} XP</p>
                  </div>
                </Link>
                <button 
                  onClick={() => handleFollow(user.id, user.username)}
                  disabled={followingIds.has(user.id) || followLoading[user.id]}
                  className={`ml-4 px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    followingIds.has(user.id)
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95 flex items-center gap-2 shadow-md shadow-gray-200'
                  }`}
                >
                  {followLoading[user.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : followingIds.has(user.id) ? (
                    'Following'
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-50 mb-4">
            <Users className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No suggestions found</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
            Check back later for more recommendations!
          </p>
        </div>
      )}
    </div>
  );
};

export default WhoToFollowPage;

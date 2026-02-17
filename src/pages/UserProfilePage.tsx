import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studyService } from '../services/studyService';
import { messageService } from '../services/messageService';
import { GetUserProfileResponse, PublicSetSummary } from '../types/study';
import { supabase } from '../lib/supabase';
import { Loader2, Users, BookOpen, Star, UserPlus, UserMinus, FileText, ArrowRight, ChevronLeft, MessageSquare } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const UserProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const params = useParams();
  const navigate = useNavigate();
  const rawUsername = params.username || '';
  const username = useMemo(() => rawUsername.replace(/^@/, ''), [rawUsername]);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GetUserProfileResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Resolve username -> user id
        const { data: profileRow, error: profileErr } = await supabase
            .from('c_profiles')
            .select('id, username')
            .eq('username', username)
            .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileRow) {
          setError('User not found');
          setData(null);
          return;
        }

        // 2) Fetch public profile + sets by id
        const res = await studyService.getUserProfile(profileRow.id);
        if (mounted) setData(res);
      } catch (e: any) {
        console.error('Failed to load profile', e);
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (username) fetchProfile();
    return () => { mounted = false; };
  }, [username]);

  const handleToggleFollow = async () => {
    if (!data?.profile || followLoading || data.profile.is_own_profile) return;

    try {
      setFollowLoading(true);
      const isFollowing = data.profile.is_following;

      if (isFollowing) {
        await studyService.unfollowUser(data.profile.id);
        showToast(`Unfollowed @${data.profile.username}`, 'success');
      } else {
        await studyService.followUser(data.profile.id);
        showToast(`Following @${data.profile.username}`, 'success');
      }

      // Update local state
      setData(prev => {
        if (!prev || !prev.profile) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            is_following: !isFollowing,
            followers_count: prev.profile.followers_count + (isFollowing ? -1 : 1)
          }
        };
      });
    } catch (err: any) {
      console.error('Failed to toggle follow:', err);
      showToast(err?.message || 'Failed to update follow status', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!data?.profile || messageLoading || data.profile.is_own_profile) return;

    try {
      setMessageLoading(true);
      const { conversation_id } = await messageService.startChat(data.profile.id);
      navigate(`/messages/${conversation_id}`);
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      showToast(err?.message || 'Failed to start conversation', 'error');
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="p-6">
          <div className="flex items-center text-gray-600"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading profile...</div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 font-medium">{error}</div>
        </div>
    );
  }

  const p = data?.profile || null;
  const sets: PublicSetSummary[] = data?.sets || [];

  return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-100 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm border-2 border-white">
              {p?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={p.username} className="h-full w-full rounded-full object-cover" />
              ) : (
                  (p?.username?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">{p?.full_name || p?.username}</div>
                {p && !p.is_own_profile && (
                    <button
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                        className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 ${
                            p.is_following
                                ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      {followLoading ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : p.is_following ? (
                          <>
                            <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Unfollow</span><span className="sm:hidden">Unfollow</span>
                          </>
                      ) : (
                          <>
                            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Follow</span><span className="sm:hidden">Follow</span>
                          </>
                      )}
                    </button>
                )}
                {p && !p.is_own_profile && (
                    <button
                        onClick={handleMessage}
                        disabled={messageLoading}
                        className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {messageLoading ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                          <>
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" /> <span>Message</span>
                          </>
                      )}
                    </button>
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">@{p?.username}</div>
            </div>
          </div>

          {p?.bio && <div className="text-sm text-gray-600 max-w-xl whitespace-pre-wrap md:hidden">{p?.bio}</div>}

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <Link 
              to={`/u/${p?.username}/connections?tab=followers`}
              className="bg-gray-50 rounded-xl px-2 sm:px-4 py-2 border border-gray-100 flex flex-col justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-xs uppercase text-gray-400 font-bold mb-1">Followers</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center justify-center gap-1 truncate"><Users className="h-4 w-4" /> {p?.followers_count || 0}</div>
            </Link>
            <Link 
              to={`/u/${p?.username}/connections?tab=following`}
              className="bg-gray-50 rounded-xl px-2 sm:px-4 py-2 border border-gray-100 flex flex-col justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-xs uppercase text-gray-400 font-bold mb-1">Following</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 truncate">{p?.following_count || 0}</div>
            </Link>
            <div className="bg-gray-50 rounded-xl px-2 sm:px-4 py-2 border border-gray-100 flex flex-col justify-center">
              <div className="text-xs uppercase text-gray-400 font-bold mb-1">Streak</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 truncate">{p?.streak || 0}🔥</div>
            </div>
          </div>

          {p?.bio && <div className="hidden md:block text-sm text-gray-600 max-w-xl whitespace-pre-wrap">{p?.bio}</div>}
        </div>

        {/* Public Sets */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" /> Public Study Sets</h2>
            <div className="text-xs sm:text-sm text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{sets.length} total</div>
          </div>
          {sets.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No public sets yet.</p>
              </div>
          ) : (
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                {sets.map((s) => (
                    <div
                        key={s.id}
                        onClick={() => navigate(`/p/${s.id}`)}
                        className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-blue-300 transition-all bg-white cursor-pointer hover:shadow-md group flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">{s.subject?.emoji || '📚'}</div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors text-sm sm:text-base">{s.title}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 font-medium">{s.subject?.name || 'General'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100"><Star className="h-3.5 w-3.5 fill-yellow-500" /> <span className="text-xs font-bold">{s.average_rating?.toFixed(1) ?? '0.0'}</span></div>
                      </div>
                      {s.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow leading-relaxed">{s.description}</p>}
                      <div className="mt-auto flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 font-medium"><FileText className="h-3.5 w-3.5" /> {s.cards_count} cards</div>
                          <div className="text-blue-600 font-bold flex items-center gap-0.5">Study <ArrowRight className="h-3 w-3" /></div>
                        </div>
                        <div className="text-gray-400 hidden sm:block">{new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-gray-400 px-2">
          <div className="flex items-center gap-2">
            <span>Joined {p ? new Date(p.joined_at).toLocaleDateString() : ''}</span>
            {p?.is_own_profile ? (
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold text-[10px]">YOU</span>
            ) : p?.is_following ? (
                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold text-[10px]">FOLLOWING</span>
            ) : null}
          </div>
          <Link to="/dashboard" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* No StudyModal here anymore, navigating to PostPage */}
      </div>
  );
};

export default UserProfilePage;

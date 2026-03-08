import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { 
  GroupFullDetails, 
  GroupLeaderboardEntry, 
  GroupContentItem,
  GroupAction,
  GroupActivityLog
} from '../types/groups';
import AddContentModal from '../components/groups/AddContentModal';
import GroupSettingsModal from '../components/groups/GroupSettingsModal';
import { useToast } from '../contexts/ToastContext';
import { 
  Users, 
  Trophy, 
  BookOpen, 
  Settings, 
  ChevronLeft, 
  Loader2, 
  Plus, 
  Globe, 
  Lock,
  Crown,
  Star,
  Clock,
  User,
  ArrowLeft
} from 'lucide-react';

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'content' | 'leaderboard' | 'members' | 'activity'>('content');
  const [details, setDetails] = useState<GroupFullDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupLeaderboardEntry[]>([]);
  const [content, setContent] = useState<GroupContentItem[]>([]);
  const [activity, setActivity] = useState<GroupActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [detailsData, activityData] = await Promise.all([
        groupService.getGroupDetails(groupId),
        groupService.getGroupActivity(groupId)
      ]);
      setDetails(detailsData);
      setLeaderboard(detailsData.members);
      setContent(detailsData.sets);
      setActivity(activityData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load group details', 'error');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action: GroupAction) => {
    if (!groupId || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await groupService.handleGroupAction(groupId, action);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Action successful!', 'success');
        if (action === 'leave' || action === 'reject_invite' || action === 'cancel_request') {
          navigate('/groups');
        } else {
          fetchData();
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-500" />
        <p className="font-bold text-lg">Loading community...</p>
      </div>
    );
  }

  if (!details) return null;

  const { group, access_denied } = details;
  const isAdmin = group.my_role === 'admin';
  const membership = group.my_status ? { role: group.my_role, status: group.my_status } : null;
  const isMember = group.my_status === 'active';

  const getActionLabel = (status: string | null, isPrivate: boolean) => {
    switch (status) {
      case 'active': return 'Leave Group';
      case 'requested': return 'Cancel Request';
      case 'invited': return 'Join Group';
      case 'banned': return 'Banned';
      default: return isPrivate ? 'Request Access' : 'Join Now';
    }
  };

  const getAction = (status: string | null): GroupAction | null => {
    switch (status) {
      case 'active': return 'leave';
      case 'requested': return 'cancel_request';
      case 'invited': return 'join';
      case 'banned': return null;
      default: return 'join';
    }
  };

  const currentAction = getAction(group.my_status);

  return (
    <div className="min-h-screen bg-white">
      {/* Ceintelly Solo Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-8">
        <Link
          to="/groups"
          className="flex items-center gap-2 group transition-all"
        >
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="font-bold text-gray-600 group-hover:text-blue-600 transition-colors hidden sm:block">
            Back to Groups
          </span>
        </Link>
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/icon.svg" alt="Ceintelly" className="h-8 w-8" />
          <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Ceintelly
          </h2>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 sm:h-32 sm:w-32 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-4xl font-black border-2 border-white/20 shadow-2xl overflow-hidden">
                {group.avatar_url ? (
                  <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover" />
                ) : (
                  group.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{group.name}</h1>
                  {group.is_private ? <Lock size={20} className="text-blue-200" /> : <Globe size={20} className="text-blue-200" />}
                </div>
                <p className="text-blue-100 max-w-2xl text-lg font-medium leading-relaxed mb-6">
                  {group.description || "Welcome to our study community! Let's learn together and grow our knowledge."}
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <Users size={18} className="text-blue-200" />
                    <span className="font-bold">{group.member_count} Members</span>
                  </div>
                  {isMember && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-orange-300">
                      <Trophy size={18} />
                      <span className="font-bold">Group Member</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10"
                  aria-label="Settings"
                >
                  <Settings size={24} />
                </button>
              )}
              {currentAction && (
                <button 
                  disabled={actionLoading}
                  onClick={() => handleAction(currentAction)}
                  className="px-8 py-3.5 bg-white text-blue-600 font-black rounded-2xl shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center min-w-[140px]"
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    getActionLabel(group.my_status, group.is_private)
                  )}
                </button>
              )}
              {!currentAction && group.my_status === 'banned' && (
                <div className="px-8 py-3.5 bg-red-500/20 backdrop-blur-md text-red-100 font-black rounded-2xl border border-red-500/30 flex items-center justify-center min-w-[140px]">
                  Banned
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-100 sticky top-16 bg-white z-10 px-4 lg:px-10">
        <div className="max-w-6xl mx-auto flex items-center space-x-10">
          {[
            { id: 'content', label: 'Study Content', icon: BookOpen },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'activity', label: 'Activity', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'content' | 'leaderboard' | 'members' | 'activity')}
              className={`
                relative py-6 flex items-center gap-2 font-black text-sm transition-all
                ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto px-4 py-10 lg:px-10">
        {activeTab === 'content' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">Course Materials</h2>
              {(isAdmin || group.allow_member_creation) && isMember && (
                <button 
                  onClick={() => setIsAddContentOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition-all text-sm"
                >
                  <Plus size={18} className="mr-2" />
                  Add Study Set
                </button>
              )}
            </div>
            
            {access_denied ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <Lock size={40} className="mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Private Content</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Join this group to see shared study sets and materials.</p>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <BookOpen size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-500 max-w-xs mx-auto">This group doesn't have any shared study sets yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/study/${item.id}`}
                    className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {item.subject?.emoji || '📚'}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center text-yellow-500 font-black text-sm mb-1">
                          <Star size={14} className="fill-current mr-1" />
                          {item.average_rating ? item.average_rating.toFixed(1) : "N/A"}
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {item.cards_count} Cards
                        </div>
                      </div>
                    </div>
                    <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 min-h-[2.5rem]">{item.description}</p>
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center text-[11px] font-bold text-gray-400">
                        <User size={12} className="mr-1.5" />
                        Added by @{item.creator.username}
                      </div>
                      <button className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <BookOpen size={18} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">Leaderboard</h2>
              <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold flex items-center">
                <Trophy size={16} className="mr-2" />
                Community Rankings
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-blue-50/50 overflow-hidden">
              {access_denied ? (
                <div className="text-center py-20 text-gray-400">
                  <Lock size={40} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-bold">Join this group to see the leaderboard.</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="font-bold">No active students found in this group.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.user_id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`
                          h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm
                          ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'text-gray-400'}
                        `}>
                          #{idx + 1}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-sm">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt={entry.username} className="h-full w-full object-cover" />
                            ) : (
                              entry.username[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-gray-900">{entry.username}</span>
                              {entry.role === 'admin' && <Crown size={14} className="text-yellow-500" />}
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{entry.role}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-blue-600">{entry.group_xp}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">Community Members</h2>
              <p className="text-sm text-gray-500 font-bold">{group.member_count} total</p>
            </div>
            
            {access_denied ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <Users size={40} className="mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Member List Restricted</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Join this group to see the members list.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {leaderboard.map((member) => (
                  <div key={member.user_id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.username} className="h-full w-full object-cover" />
                        ) : (
                          member.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 line-clamp-1">{member.username}</span>
                          {member.role === 'admin' && <Crown size={12} className="text-yellow-500" />}
                        </div>
                        <p className="text-xs text-gray-500 font-medium capitalize">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      <Trophy size={12} />
                      <span className="text-xs font-black">{member.group_xp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">Recent Activity</h2>
              <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold flex items-center">
                <Clock size={16} className="mr-2" />
                Live Feed
              </div>
            </div>

            <div className="space-y-4">
              {activity.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                  <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Clock size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No activity yet</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Study sessions will appear here as members complete them.</p>
                </div>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-all">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-sm">
                      {log.user.avatar_url ? (
                        <img src={log.user.avatar_url} alt={log.user.username} className="h-full w-full object-cover" />
                      ) : (
                        log.user.username[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900">
                          <span className="text-blue-600">{log.user.username}</span> finished a study session
                        </p>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4 flex items-center">
                        <BookOpen size={14} className="mr-1.5 opacity-50" />
                        Set: <span className="font-bold text-gray-700 ml-1">{log.set.title}</span>
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-black flex items-center border border-green-100">
                          <Trophy size={12} className="mr-1.5" />
                          +{log.xp_earned} XP
                        </div>
                        <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-black flex items-center border border-purple-100">
                          <Star size={12} className="mr-1.5" />
                          {log.score}% Accuracy
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold capitalize flex items-center border border-gray-100">
                          {log.game_mode.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {groupId && (
        <AddContentModal
          isOpen={isAddContentOpen}
          onClose={() => setIsAddContentOpen(false)}
          groupId={groupId}
          onSuccess={fetchData}
        />
      )}

      {isSettingsOpen && details && (
        <GroupSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          group={details.group}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default GroupDetailsPage;

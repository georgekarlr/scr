import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { 
  GroupFullDetails, 
  GroupLeaderboardEntry, 
  GroupContentItem,
  GroupAction,
  GroupActivityLog,
  ItemGameStatistics
} from '../types/groups';
import AddContentModal from '../components/groups/AddContentModal';
import GroupSettingsModal from '../components/groups/GroupSettingsModal';
import InviteUserModal from '../components/groups/InviteUserModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { 
  Users, 
  Trophy, 
  BookOpen, 
  Settings, 
  Loader2,
  Plus, 
  Globe, 
  Lock,
  Crown,
  Star,
  Clock,
  User,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Trash2,
  BarChart2,
  AlertCircle,
  Filter,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studyService } from '../services/studyService';
import { GetSetDetailsResponse } from '../types/study';
import WordExportModal from '../components/study/WordExportModal';
import CreateSetModal from '../components/dashboard/CreateSetModal';
import StudyModeModal from '../components/groups/StudyModeModal';

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'content' | 'leaderboard' | 'members' | 'activity' | 'statistics'>('content');
  const [details, setDetails] = useState<GroupFullDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupLeaderboardEntry[]>([]);
  const [content, setContent] = useState<GroupContentItem[]>([]);
  const [activity, setActivity] = useState<GroupActivityLog[]>([]);
  const [stats, setStats] = useState<ItemGameStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isResetCodeConfirmOpen, setIsResetCodeConfirmOpen] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // Statistics filters
  const [statsUserFilter, setStatsUserFilter] = useState<string>('all');
  const [statsSetFilter, setStatsSetFilter] = useState<string>('all');
  const [statsModeFilter, setStatsModeFilter] = useState<'all' | 'rush_break' | 'time_battle' | 'speed_march'>('all');
  
  // Menu and Modals state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isWordExportOpen, setIsWordExportOpen] = useState(false);
  const [selectedSetForExport, setSelectedSetForExport] = useState<GetSetDetailsResponse | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<GroupContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editSetData, setEditSetData] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStudyModeOpen, setIsStudyModeOpen] = useState(false);
  const [selectedSetForStudy, setSelectedSetForStudy] = useState<GroupContentItem | null>(null);

  const fetchStats = useCallback(async () => {
    if (!groupId) return;
    setStatsLoading(true);
    try {
      const statsData = await groupService.getItemGameStatistics({ 
        p_group_id: groupId,
        p_user_id: statsUserFilter === 'all' ? null : (statsUserFilter === 'me' ? user?.id : statsUserFilter),
        p_set_id: statsSetFilter === 'all' ? null : statsSetFilter
      });
      setStats(statsData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load statistics', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, [groupId, showToast, statsUserFilter, statsSetFilter, user?.id]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

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

  const [copied, setCopied] = useState(false);
  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Invite code copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const [resettingCode, setResettingCode] = useState(false);
  const handleResetInviteCode = async () => {
    if (!groupId || !isAdmin || resettingCode) return;
    
    setResettingCode(true);
    try {
      const result = await groupService.resetInviteCode({ p_group_id: groupId });
      if (result.success && result.new_code) {
        showToast('Invite code reset successfully!', 'success');
        setDetails(prev => prev ? {
          ...prev,
          group: {
            ...prev.group,
            invite_code: result.new_code
          }
        } : null);
      } else {
        showToast(result.error || 'Failed to reset invite code', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while resetting the invite code', 'error');
    } finally {
      setResettingCode(false);
      setIsResetCodeConfirmOpen(false);
    }
  };

  const handleEditSet = async (item: GroupContentItem) => {
    try {
      const details = await studyService.getSetDetails(item.id);
      if (!details) {
        showToast('Set details not found', 'error');
        return;
      }
      setEditSetData({
        id: details.set.id,
        title: details.set.title,
        description: details.set.description || '',
        subject_id: details.set.subject?.id || 0,
        is_public: details.set.is_public,
        tags: details.set.tags || [],
        items: details.items.map(i => ({
          id: i.id,
          type: i.type,
          content: i.content
        }))
      });
      setIsEditModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to load set details', 'error');
    }
  };

  const handleDeleteSet = async () => {
    if (!setToDelete || !groupId) return;
    setDeleting(true);
    try {
      await groupService.removeSetFromGroup({
        p_group_id: groupId,
        p_set_id: setToDelete.id,
        p_delete_entirely: false // Default to only unlinking from group
      });
      showToast('Set removed from group successfully', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove set from group', 'error');
    } finally {
      setDeleting(false);
      setIsDeleteConfirmOpen(false);
      setSetToDelete(null);
    }
  };

  const handleGenerateWord = async (item: GroupContentItem) => {
    try {
      const details = await studyService.getSetDetails(item.id);
      setSelectedSetForExport(details);
      setIsWordExportOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to load set details for export', 'error');
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
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        
        <div className={`relative max-w-6xl mx-auto px-4 lg:px-10 transition-all duration-500 ease-in-out ${
          isHeaderExpanded ? 'py-8 sm:py-12 opacity-100 max-h-[1000px]' : 'py-3 opacity-0 max-h-0 pointer-events-none'
        }`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 sm:h-32 sm:w-32 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-4xl font-black border-2 border-white/20 shadow-2xl overflow-hidden shrink-0">
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
                  {isMember && group.invite_code && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 group">
                      <button 
                        onClick={() => copyInviteCode(group.invite_code!)}
                        className="flex items-center gap-2 hover:opacity-80 transition-all"
                        title="Click to copy invite code"
                      >
                        <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Invite Code:</span>
                        <span className="font-mono font-bold">{group.invite_code}</span>
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-blue-200 transition-colors" />}
                      </button>
                      
                      {isAdmin && (
                        <button
                          onClick={() => setIsResetCodeConfirmOpen(true)}
                          disabled={resettingCode}
                          className="ml-2 p-1.5 hover:bg-white/20 rounded-lg transition-colors text-blue-200 hover:text-white"
                          title="Reset invite code"
                        >
                          <RefreshCw size={14} className={resettingCode ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>
                  )}
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

        {/* Header Toggle Bar */}
        <div className="relative border-t border-white/10 bg-black/10 hover:bg-black/20 transition-colors group/toggle">
          <button
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            className="w-full h-8 flex items-center justify-center gap-2 text-blue-100/60 group-hover/toggle:text-white transition-all"
            title={isHeaderExpanded ? "Collapse header" : "Expand header"}
          >
            {!isHeaderExpanded && (
              <span className="text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-1">
                Show Community Details ({group.name})
              </span>
            )}
            <div className="p-1 rounded-full bg-white/5 border border-white/5">
              {isHeaderExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-100 sticky top-16 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-10 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-10 whitespace-nowrap min-w-max">
            {[
              { id: 'content', label: 'Study Content', icon: BookOpen },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'activity', label: 'Activity', icon: Clock },
              { id: 'statistics', label: 'Statistics', icon: BarChart2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'content' | 'leaderboard' | 'members' | 'activity' | 'statistics')}
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
                  <div 
                    key={item.id} 
                    className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {item.subject?.emoji || '📚'}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-yellow-500 font-black text-sm">
                            <Star size={14} className="fill-current mr-1" />
                            {item.average_rating ? item.average_rating.toFixed(1) : "N/A"}
                          </div>
                          
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.id ? null : item.id);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSetForStudy(item);
                                    setIsStudyModeOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <BookOpen className="h-4 w-4 mr-3" />
                                  Study Now
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSet(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="h-4 w-4 mr-3" />
                                  Edit Set
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateWord(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <FileText className="h-4 w-4 mr-3" />
                                  Generate Word
                                </button>
                                <div className="my-1 border-t border-gray-50" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSetToDelete(item);
                                    setIsDeleteConfirmOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Remove from Group
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
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
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSetForStudy(item);
                          setIsStudyModeOpen(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <BookOpen size={18} />
                      </button>
                    </div>
                  </div>
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
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500 font-bold">{group.member_count} total</p>
                {isAdmin && (
                  <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all text-xs"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Invite
                  </button>
                )}
              </div>
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
        {activeTab === 'statistics' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Learning Analytics</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">
                  Performance insights across games and study sets
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchStats}
                  disabled={statsLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all text-xs disabled:opacity-50"
                >
                  <RefreshCw size={14} className={`mr-1.5 ${statsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={16} className="text-blue-600" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filter Data</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* User Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Member</label>
                  <select
                    value={statsUserFilter}
                    onChange={(e) => setStatsUserFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">Everyone in Group</option>
                    <option value="me">My Personal Stats</option>
                    {leaderboard
                      .filter(m => m.user_id !== user?.id)
                      .map(member => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.username}'s Stats
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Set Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Study Set</label>
                  <select
                    value={statsSetFilter}
                    onChange={(e) => setStatsSetFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Study Sets</option>
                    {content.map(set => (
                      <option key={set.id} value={set.id}>
                        {set.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Game Mode Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Game Mode</label>
                  <select
                    value={statsModeFilter}
                    onChange={(e) => setStatsModeFilter(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Analytics</option>
                    <option value="rush_break">Rush Break</option>
                    <option value="time_battle">Time Battle</option>
                    <option value="speed_march">Speed March</option>
                  </select>
                </div>
              </div>
            </div>

            {statsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500 font-bold">Calculating insights...</p>
              </div>
            ) : !stats || (
              (statsModeFilter === 'all' || statsModeFilter === 'rush_break') && stats.rush_break.length === 0 && 
              (statsModeFilter === 'all' || statsModeFilter === 'time_battle') && stats.time_battle.length === 0 && 
              (statsModeFilter === 'all' || statsModeFilter === 'speed_march') && stats.speed_march.length === 0
            ) ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <BarChart2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No analytics available</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Play some games to generate detailed item-level performance statistics.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Rush Break Section */}
                {(statsModeFilter === 'all' || statsModeFilter === 'rush_break') && stats.rush_break.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Rush Break Performance</h3>
                        <p className="text-sm text-gray-500 font-medium">Top missed questions and average speed</p>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Question / Item</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Correct</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Wrong</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Avg Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {stats.rush_break.map((s, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 line-clamp-1 group-hover:line-clamp-none transition-all">{s.question}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{s.item_type}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
                                    {s.total_correct}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.total_wrong > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400'}`}>
                                    {s.total_wrong}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-bold text-gray-600">{s.avg_duration_seconds}s</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

                {/* Time Battle Section */}
                {(statsModeFilter === 'all' || statsModeFilter === 'time_battle') && stats.time_battle.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Time Battle Analytics</h3>
                        <p className="text-sm text-gray-500 font-medium">How much time is left when answering correctly</p>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Question / Item</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Correct</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Wrong</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Avg Time Left</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {stats.time_battle.map((s, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 line-clamp-1 group-hover:line-clamp-none transition-all">{s.question}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{s.item_type}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
                                    {s.times_correct}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.times_wrong > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400'}`}>
                                    {s.times_wrong}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-bold text-blue-600">{s.avg_time_left_seconds}s</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

                {/* Speed March Section */}
                {(statsModeFilter === 'all' || statsModeFilter === 'speed_march') && stats.speed_march.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Speed March Insights</h3>
                        <p className="text-sm text-gray-500 font-medium">Slowest questions that need more practice</p>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Question / Item</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Correct</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Wrong</th>
                              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Avg Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {stats.speed_march.map((s, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 line-clamp-1 group-hover:line-clamp-none transition-all">{s.question}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{s.item_type}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
                                    {s.times_correct}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.times_wrong > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400'}`}>
                                    {s.times_wrong}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`text-sm font-bold ${s.avg_duration_seconds > 5 ? 'text-orange-600' : 'text-gray-600'}`}>
                                    {s.avg_duration_seconds}s
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
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

      {isInviteOpen && groupId && (
        <InviteUserModal 
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          groupId={groupId}
        />
      )}

      <ConfirmationModal
        isOpen={isResetCodeConfirmOpen}
        onClose={() => setIsResetCodeConfirmOpen(false)}
        onConfirm={handleResetInviteCode}
        title="Reset Invite Code"
        message="Are you sure you want to reset the invite code? The old code will no longer work and you will need to share the new one with potential members."
        confirmText="Reset Code"
        variant="warning"
        loading={resettingCode}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSetToDelete(null);
        }}
        onConfirm={handleDeleteSet}
        title="Remove Study Set"
        message={`Are you sure you want to remove "${setToDelete?.title}" from this group?`}
        confirmText="Remove"
        variant="danger"
        loading={deleting}
      />

      {isWordExportOpen && selectedSetForExport && (
        <WordExportModal
          data={selectedSetForExport}
          onClose={() => {
            setIsWordExportOpen(false);
            setSelectedSetForExport(null);
          }}
        />
      )}

      {isEditModalOpen && (
        <CreateSetModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditSetData(null);
          }}
          mode="edit"
          groupId={groupId}
          initialData={editSetData}
          onSuccess={() => {
            fetchData();
            setIsEditModalOpen(false);
            setEditSetData(null);
          }}
        />
      )}
      {selectedSetForStudy && (
        <StudyModeModal
          isOpen={isStudyModeOpen}
          onClose={() => {
            setIsStudyModeOpen(false);
            setSelectedSetForStudy(null);
          }}
          setId={selectedSetForStudy.id}
          setTitle={selectedSetForStudy.title}
        />
      )}
    </div>
  );
};

export default GroupDetailsPage;

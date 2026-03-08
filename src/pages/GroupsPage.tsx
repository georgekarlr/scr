import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { groupService } from '../services/groupService'
import { 
  GroupDashboard, 
  GroupExploreItem, 
  GroupDashboardActive, 
  GroupDashboardInvitation, 
  GroupDashboardPending,
  GroupAction
} from '../types/groups'
import { useToast } from '../contexts/ToastContext'
import { 
  Users, 
  Plus, 
  Search, 
  Loader2, 
  Globe, 
  Lock, 
  Trophy, 
  UserPlus, 
  Check, 
  X as CloseIcon,
  LogOut,
  Clock
} from 'lucide-react'
import CreateGroupModal from '../components/groups/CreateGroupModal'

const GroupCard: React.FC<{
  group: GroupDashboardActive;
  onOpen: (id: string) => void;
}> = ({ group, onOpen }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-100">
        {group.avatar_url ? (
          <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover rounded-2xl" />
        ) : (
          group.name.substring(0, 2).toUpperCase()
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
          {group.role}
        </span>
      </div>
    </div>
    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{group.name}</h3>
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center text-gray-500 text-sm">
        <Users className="h-4 w-4 mr-1.5" />
        <span>{group.member_count} members</span>
      </div>
      <div className="flex items-center text-orange-500 font-bold text-sm">
        <Trophy className="h-4 w-4 mr-1" />
        <span>{group.group_xp} XP</span>
      </div>
    </div>
    <button 
      onClick={() => onOpen(group.id)}
      className="w-full mt-5 py-2.5 bg-gray-50 text-gray-900 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
    >
      Open Group
    </button>
  </div>
);

const InvitationCard: React.FC<{
  invitation: GroupDashboardInvitation;
  onAction: (id: string, action: GroupAction) => void;
  loading?: boolean;
}> = ({ invitation, onAction, loading }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
    <div className="flex items-center">
      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
        {invitation.avatar_url ? (
          <img src={invitation.avatar_url} alt={invitation.name} className="h-full w-full object-cover rounded-2xl" />
        ) : (
          invitation.name.substring(0, 2).toUpperCase()
        )}
      </div>
      <div className="ml-4">
        <h3 className="font-bold text-gray-900">{invitation.name}</h3>
        <p className="text-sm text-gray-500">Invited by <span className="font-bold">@{invitation.invited_by}</span></p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <button 
        disabled={loading}
        onClick={() => onAction(invitation.id, 'reject_invite')}
        className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-all"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
      <button 
        disabled={loading}
        onClick={() => onAction(invitation.id, 'accept_invite')}
        className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm flex items-center"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
        Accept
      </button>
    </div>
  </div>
);

const PendingCard: React.FC<{
  pending: GroupDashboardPending;
  onAction: (id: string, action: GroupAction) => void;
  loading?: boolean;
}> = ({ pending, onAction, loading }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
    <div className="flex items-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center font-bold text-lg">
        <Clock className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <h3 className="font-bold text-gray-900">{pending.name}</h3>
        <p className="text-sm text-gray-500">Requested {new Date(pending.requested_at).toLocaleDateString()}</p>
      </div>
    </div>
    <button 
      disabled={loading}
      onClick={() => onAction(pending.id, 'cancel_request')}
      className="px-4 py-2.5 border-2 border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Request'}
    </button>
  </div>
);

const ExploreCard: React.FC<{
  group: GroupExploreItem;
  onAction: (id: string, action: GroupAction) => void;
  loading?: boolean;
}> = ({ group, onAction, loading }) => {
  const getActionLabel = () => {
    switch (group.membership_status) {
      case 'active': return 'Leave Group';
      case 'requested': return 'Cancel Request';
      case 'invited': return 'Join Group';
      case 'banned': return 'Banned';
      default: return group.is_private ? 'Request to Join' : 'Join Group';
    }
  };

  const getAction = (): GroupAction | null => {
    switch (group.membership_status) {
      case 'active': return 'leave';
      case 'requested': return 'cancel_request';
      case 'invited': return 'join';
      case 'banned': return null;
      default: return 'join';
    }
  };

  const currentAction = getAction();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden">
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover" />
          ) : (
            <Users className="h-7 w-7" />
          )}
        </div>
        <div className="flex items-center space-x-1.5 bg-gray-50 px-2 py-1 rounded-lg">
          {group.is_private ? <Lock size={12} className="text-gray-400" /> : <Globe size={12} className="text-blue-500" />}
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            {group.is_private ? 'Private' : 'Public'}
          </span>
        </div>
      </div>
      <h3 className="font-bold text-gray-900">{group.name}</h3>
      {group.description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">{group.description}</p>
      )}
      <div className="mt-4 flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
        <Users className="h-4 w-4 mr-1.5" />
        <span>{group.member_count} members</span>
      </div>

      <div className="mt-5">
        {currentAction ? (
          <button 
            disabled={loading}
            onClick={() => onAction(group.id, currentAction)}
            className={`w-full py-2.5 font-bold rounded-xl transition-all text-sm flex items-center justify-center ${
              group.membership_status === 'active' 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : group.membership_status === 'requested' || group.membership_status === 'invited'
                  ? 'border-2 border-blue-50 text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : (
              group.membership_status === null && !group.is_private ? <UserPlus className="h-4 w-4 mr-1.5" /> : null
            )}
            {getActionLabel()}
          </button>
        ) : group.membership_status === 'banned' ? (
          <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl text-sm cursor-not-allowed">
            Banned
          </button>
        ) : null}
      </div>
    </div>
  );
};

const GroupsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-groups' | 'invitations' | 'requests' | 'explore'>('my-groups')
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [explore, setExplore] = useState<GroupExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, exploreData] = await Promise.all([
        groupService.getGroupsDashboard(),
        groupService.exploreGroups(searchQuery || null)
      ]);
      setDashboard(dashData);
      setExplore(exploreData);
    } catch (error) {
      showToast('Failed to load groups data', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGroupAction = async (groupId: string, action: GroupAction) => {
    setActionLoading(groupId);
    try {
      const result = await groupService.handleGroupAction(groupId, action);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Success!', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'my-groups', label: 'My Groups', count: dashboard?.active.length },
    { id: 'invitations', label: 'Invitations', count: dashboard?.invitations.length },
    { id: 'requests', label: 'Requests', count: dashboard?.pending.length },
    { id: 'explore', label: 'Explore' },
  ] as const

  const renderContent = () => {
    if (loading && !dashboard) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
          <p className="font-bold">Loading your groups...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'my-groups':
        return (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Your Communities</h2>
              <p className="text-sm text-gray-500 font-bold">{dashboard?.active.length || 0} active</p>
            </div>
            
            {dashboard?.active.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Users size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Groups Yet</h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-8">Join a community or create your own to start studying together!</p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    Explore Groups
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-8 py-3 bg-white text-gray-900 font-bold rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    Create New
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard?.active.map((group) => (
                  <GroupCard key={group.id} group={group} onOpen={(id) => navigate(`/groups/${id}`)} />
                ))}
              </div>
            )}
          </div>
        )
      case 'invitations':
        return (
          <div className="mt-8">
            <h2 className="text-xl font-black text-gray-900 mb-6">Group Invitations</h2>
            {dashboard?.invitations.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <p className="text-gray-500 font-bold">You don't have any pending invitations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard?.invitations.map((inv) => (
                  <InvitationCard 
                    key={inv.id} 
                    invitation={inv} 
                    onAction={handleGroupAction}
                    loading={actionLoading === inv.id}
                  />
                ))}
              </div>
            )}
          </div>
        )
      case 'requests':
        return (
          <div className="mt-8">
            <h2 className="text-xl font-black text-gray-900 mb-6">Pending Requests</h2>
            {dashboard?.pending.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <p className="text-gray-500 font-bold">No active join requests at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard?.pending.map((req) => (
                  <PendingCard 
                    key={req.id} 
                    pending={req} 
                    onAction={handleGroupAction}
                    loading={actionLoading === req.id}
                  />
                ))}
              </div>
            )}
          </div>
        )
      case 'explore':
        return (
          <div className="mt-8">
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Find study groups, communities, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : explore.length === 0 ? (
              <div className="text-center py-20">
                <Search size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No results found</h3>
                <p className="text-gray-500">Try searching for something else or create your own group!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {explore.map((group) => (
                  <ExploreCard 
                    key={group.id} 
                    group={group} 
                    onAction={handleGroupAction}
                    loading={actionLoading === group.id}
                  />
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Groups</h1>
            <p className="text-gray-500 mt-1 font-medium">Join or create study communities</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            <Plus className="h-5 w-5 mr-2 stroke-[3px]" />
            Create New Group
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="mt-10 border-b border-gray-100 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="flex space-x-8 min-w-max px-2" aria-label="Groups navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative py-5 px-1 font-black text-sm transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <div className="flex items-center">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={(id) => {
          fetchData();
          setActiveTab('my-groups');
        }}
      />
    </div>
  )
}

export default GroupsPage

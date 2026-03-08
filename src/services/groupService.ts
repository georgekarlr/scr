import { supabase } from '../lib/supabase';
import { 
  GroupDashboard, 
  GroupExploreItem, 
  GroupLeaderboardEntry, 
  GroupAction, 
  GroupActionResponse,
  GroupContentItem,
  GroupFullDetails,
  GroupActivityLog,
  AddSetToGroupParams
} from '../types/groups';

export const groupService = {
  /**
   * Creates a new group.
   */
  async createGroup(name: string, description: string | null, isPrivate: boolean): Promise<string> {
    const { data, error } = await supabase.rpc('c_create_group', {
      p_name: name,
      p_description: description,
      p_is_private: isPrivate,
    });

    if (error) {
      console.error('Error creating group:', error);
      throw error;
    }

    return data as string;
  },

  /**
   * Joins a group using an invite code.
   */
  async joinGroupByCode(inviteCode: string): Promise<{ success: boolean; group_id: string }> {
    const { data, error } = await supabase.rpc('c_join_group', {
      p_invite_code: inviteCode,
    });

    if (error) {
      console.error('Error joining group by code:', error);
      throw error;
    }

    return data as { success: boolean; group_id: string };
  },

  /**
   * Fetches the groups dashboard data for the current user.
   */
  async getGroupsDashboard(): Promise<GroupDashboard> {
    const { data, error } = await supabase.rpc('c_get_groups_dashboard');

    if (error) {
      console.error('Error fetching groups dashboard:', error);
      throw error;
    }

    return data as GroupDashboard;
  },

  /**
   * Explores groups with optional search query and limit.
   */
  async exploreGroups(searchQuery: string | null = null, limitCount: number = 20): Promise<GroupExploreItem[]> {
    const { data, error } = await supabase.rpc('c_explore_groups', {
      search_query: searchQuery,
      limit_count: limitCount,
    });

    if (error) {
      console.error('Error exploring groups:', error);
      throw error;
    }

    return (data || []) as GroupExploreItem[];
  },

  /**
   * Handles a group action (join, leave, accept invite, etc.).
   */
  async handleGroupAction(groupId: string, action: GroupAction): Promise<GroupActionResponse> {
    const { data, error } = await supabase.rpc('c_handle_group_action', {
      p_group_id: groupId,
      p_action: action,
    });

    if (error) {
      console.error('Error handling group action:', error);
      throw error;
    }

    return data as GroupActionResponse;
  },

  /**
   * Fetches the leaderboard for a specific group.
   */
  async getGroupLeaderboard(groupId: string): Promise<GroupLeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('c_get_group_leaderboard', {
      target_group_id: groupId,
    });

    if (error) {
      console.error('Error fetching group leaderboard:', error);
      throw error;
    }

    return (data || []) as GroupLeaderboardEntry[];
  },

  /**
   * Fetches the content (study sets) for a specific group.
   */
  async getGroupContent(groupId: string): Promise<GroupContentItem[]> {
    const { data, error } = await supabase.rpc('c_get_group_content', {
      target_group_id: groupId,
    });

    if (error) {
      console.error('Error fetching group content:', error);
      throw error;
    }

    return (data || []) as GroupContentItem[];
  },

  /**
   * Fetches full details for a specific group (metadata, members, content).
   */
  async getGroupDetails(groupId: string): Promise<GroupFullDetails> {
    const { data, error } = await supabase.rpc('c_get_group_details', {
      target_group_id: groupId,
    });

    if (error) {
      console.error('Error fetching group details:', error);
      throw error;
    }

    return data as GroupFullDetails;
  },

  /**
   * Updates group settings.
   */
  async updateGroupSettings(
    groupId: string,
    name: string,
    description: string | null,
    isPrivate: boolean,
    allowCreation: boolean,
    showLeaderboard: boolean,
    showLogs: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc('c_update_group_settings', {
      p_group_id: groupId,
      p_name: name,
      p_description: description,
      p_is_private: isPrivate,
      p_allow_creation: allowCreation,
      p_show_leaderboard: showLeaderboard,
      p_show_logs: showLogs,
    });

    if (error) {
      console.error('Error updating group settings:', error);
      throw error;
    }
  },

  /**
   * Fetches recent activity logs for a group.
   */
  async getGroupActivity(groupId: string, limitCount: number = 20): Promise<GroupActivityLog[]> {
    const { data, error } = await supabase.rpc('c_get_group_activity', {
      target_group_id: groupId,
      limit_count: limitCount,
    });

    if (error) {
      console.error('Error fetching group activity:', error);
      throw error;
    }

    return (data || []) as GroupActivityLog[];
  },

  /**
   * Adds a set to a group (links existing or creates new).
   */
  async addSetToGroup(params: AddSetToGroupParams): Promise<string> {
    const { data, error } = await supabase.rpc('c_add_set_to_group', params);

    if (error) {
      console.error('Error adding set to group:', error);
      throw error;
    }

    return data as string;
  },
};

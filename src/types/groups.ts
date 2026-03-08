export type GroupRole = 'admin' | 'tutor' | 'student';
export type GroupMemberStatus = 'active' | 'invited' | 'requested' | 'banned';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id?: string; // Optional in new RPC
  avatar_url: string | null;
  is_private: boolean;
  invite_code?: string;
  allow_member_creation: boolean;
  show_leaderboard: boolean;
  show_study_logs: boolean;
  created_at: string;
  my_role: GroupRole | null;
  my_status: GroupMemberStatus | null;
  member_count: number;
  sets_count: number;
}

export interface GroupDashboardActive {
  id: string;
  name: string;
  avatar_url: string | null;
  role: GroupRole;
  group_xp: number;
  member_count: number;
}

export interface GroupDashboardInvitation {
  id: string;
  name: string;
  avatar_url: string | null;
  invited_by: string; // username
}

export interface GroupDashboardPending {
  id: string;
  name: string;
  requested_at: string;
}

export interface GroupDashboard {
  active: GroupDashboardActive[];
  invitations: GroupDashboardInvitation[];
  pending: GroupDashboardPending[];
}

export interface GroupExploreItem {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_private: boolean;
  member_count: number;
  membership_status: GroupMemberStatus | null;
}

export interface GroupLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  group_xp: number;
  role: GroupRole;
}

export interface GroupContentItem {
  id: string;
  title: string;
  description: string | null;
  cards_count: number;
  average_rating: number | null;
  total_ratings: number;
  added_at: string;
  creator: {
    username: string;
    avatar_url: string | null;
  };
  subject: {
    name: string;
    emoji: string | null;
  } | null;
}

export interface GroupFullDetails {
  group: Group;
  members: GroupLeaderboardEntry[];
  sets: GroupContentItem[];
  access_denied?: boolean;
}

export interface GroupActivityLog {
  id: string;
  xp_earned: number;
  score: number;
  created_at: string;
  game_mode: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
  set: {
    id: string;
    title: string;
  };
}

export type GroupAction = 'join' | 'accept_invite' | 'reject_invite' | 'cancel_request' | 'leave';

export interface GroupActionResponse {
  status: GroupMemberStatus | null;
  error?: string;
}

export interface AddSetToGroupParams {
  p_group_id: string;
  p_existing_set_id?: string | null;
  p_title?: string | null;
  p_description?: string | null;
  p_subject_id?: number | null;
  p_tags?: string[] | null;
  p_items?: any; // jsonb in SQL, can be CreateStudyItem[]
}

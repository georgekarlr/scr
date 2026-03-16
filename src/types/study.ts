export interface Subject {
  id: number;
  name: string;
  slug: string;
  emoji?: string;
}

export interface StudySet {
  id: string;
  title: string;
  average_rating: number;
  subject_id: string;
  is_public: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySetWithSubject extends Pick<StudySet, 'id' | 'title' | 'average_rating'> {
  subject: string;
}

export interface DailyPick {
  message: string;
  set: StudySetWithSubject;
}

export interface ContinueStudyingItem {
  id: string;
  title: string;
  subject: string;
  emoji: string | null;
  last_active: string;
}

// Full detail for Continue Studying modal (from c_get_continue_studying)
export interface ContinueStudyingSet {
  id: string;
  title: string;
  average_rating: number | null;
  total_ratings: number | null;
  last_active: string;
  creator: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  subject: {
    name: string | null;
    emoji: string | null;
  } | null;
  cards_due: number;
}

export interface Creator {
  id: string;
  username: string;
  avatar: string | null;
  avatar_url?: string | null;
}

export interface FeedItem {
  type: 'feed';
  set_id: string;
  title: string;
  description: string | null;
  tags: string[];
  created_at: string;
  is_official: boolean;
  creator: Creator;
  subject: {
    name: string;
    emoji: string | null;
  };
  stats: {
    average_rating: number;
    total_ratings: number;
    cards_count: number;
    like_count: number;
    comment_count: number;
  };
  is_bookmarked?: boolean;
}

export interface RecommendedUser {
  type: 'rec_user';
  user_id: string;
  username: string;
  avatar: string | null;
  xp: number;
  bio: string | null;
}

export interface WhoToFollowUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  is_relevant: boolean;
}

export type FeedContent = FeedItem | RecommendedUser;

export type StudyItemType = 
  | 'flashcard' 
  | 'quiz_question' 
  | 'note' 
  | 'matching_pairs' 
  | 'order_sequence' 
  | 'checkbox_question' 
  | 'written_answer';

export interface FlashcardContent {
  front: string;
  back: string;
  explanation?: string;
  image_url?: string;
}

export interface QuizQuestionOption {
  id: number;
  text: string;
}

export interface QuizQuestionContent {
  question: string;
  options: QuizQuestionOption[];
  correct_option_id: number;
  explanation?: string;
}

export interface NoteContent {
  title: string;
  markdown: string;
  attachment_url?: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingPairsContent {
  question?: string;
  pairs: MatchingPair[];
  explanation?: string;
}

export interface OrderSequenceItem {
  text: string;
}

export interface OrderSequenceContent {
  question?: string;
  items: OrderSequenceItem[];
  explanation?: string;
}

export interface CheckboxOption {
  id: number;
  text: string;
}

export interface CheckboxQuestionContent {
  question: string;
  options: CheckboxOption[];
  correct_option_ids: number[];
  explanation?: string;
}

export interface WrittenAnswerContent {
  question: string;
  accepted_answers: string[];
  explanation?: string;
}

export type StudyItemContent = 
  | FlashcardContent 
  | QuizQuestionContent 
  | NoteContent 
  | MatchingPairsContent 
  | OrderSequenceContent 
  | CheckboxQuestionContent 
  | WrittenAnswerContent;

export interface CreateStudyItem {
  type: StudyItemType;
  content: StudyItemContent;
}

export interface CreateFullSetParams {
  title: string;
  description: string;
  subject_id: number;
  is_public: boolean;
  tags: string[];
  items?: CreateStudyItem[];
}

export interface UpdateStudyItem extends CreateStudyItem {
  id?: string;
}

export interface UpdateFullSetParams {
  set_id: string;
  title: string;
  description: string;
  subject_id: number;
  is_public: boolean;
  tags: string[];
  items: UpdateStudyItem[];
}

export interface UserStats {
  streak: number;
  total_xp: number;
  level: number;
  cards_due: number;
  minutes_today: number;
  pending_invites: number;
}

export interface StudyProgress {
  box_level: number;
  is_due: boolean;
  last_reviewed: string | null;
}

export interface StudyItemPlay {
  id: string;
  type: StudyItemType;
  position: number;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_bookmarked?: boolean;
  study_data: StudyProgress;
  content: StudyItemContent;
}

export interface StudySetPlay {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  emoji: string | null;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  creator: Creator;
  total_likes: number;
  total_comments: number;
  is_bookmarked?: boolean;
}

export interface GetSetForPlayResponse {
  set: StudySetPlay;
  items: StudyItemPlay[];
}

export interface GetSetDetailsResponse {
  set: {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    is_public: boolean;
    average_rating: number;
    total_ratings: number;
    created_at: string;
    is_owner: boolean;
    is_official: boolean;
    is_bookmarked: boolean;
    cards_count: number;
    comments_count: number;
    emoji?: string | null;
    subject_name?: string;
    creator: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
    subject: {
      id: number;
      name: string;
      emoji: string | null;
    } | null;
  };
  items: {
    id: string;
    type: StudyItemType;
    position: number;
    content: StudyItemContent;
  }[];
}

export interface StudySessionResult {
  item_id: string;
  is_correct: boolean;
}

export interface ItemLiker {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  liked_at: string;
}

export interface CommentUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface CommentReply {
  id: string;
  content: string;
  created_at: string;
  user: CommentUser;
}

export interface StudyComment {
  id: string;
  content: string;
  created_at: string;
  user: CommentUser;
  replies: CommentReply[];
  parent_id?: string | null;
}

export interface FinishStudySessionParams {
  set_id: string;
  duration_seconds: number;
  results: StudySessionResult[];
  game_mode?: string;
  game_data?: any;
}

export interface FinishPersonalStudyParams {
  p_set_id: string;
  p_duration_seconds: number;
  p_results: StudySessionResult[];
  p_game_mode?: string;
  p_game_data?: any;
}

export interface FinishStudySessionResponse {
  xp_earned: number;
  new_streak: number;
  // Optional fields for backward compatibility/UI
  total_xp?: number;
  streak_increased?: boolean;
  cards_reviewed?: number;
  correct_count?: number;
  accuracy?: number;
}

export interface HomeDashboardResponse {
  user_stats: UserStats | null;
  daily_pick: DailyPick | null;
  continue_studying: ContinueStudyingItem[];
  feed_type: 'following' | 'recommendations';
  feed_content: FeedContent[];
}

export interface RateSetParams {
  p_set_id: string;
  p_rating: number;
  p_review?: string;
}

export interface RateSetResponse {
  new_average: number;
  new_total: number;
}

// User profile viewing API types
export interface PublicSetSummarySubject {
  name: string | null;
  emoji: string | null;
}

export interface PublicSetSummary {
  id: string;
  title: string;
  description: string | null;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  cards_count: number;
  subject: PublicSetSummarySubject | null;
}

export interface UserProfileInfo {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  streak: number;
  joined_at: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_own_profile: boolean;
}

export interface ExploreTrendingSet {
  id: string;
  title: string;
  description: string | null;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  cards_count: number;
  creator: {
    username: string | null;
    avatar_url: string | null;
  };
  subject: {
    name: string | null;
    emoji: string | null;
  } | null;
}

export interface SearchUserResult {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  followers_count: number;
  is_following: boolean;
}

export interface SearchSetResult {
  id: string;
  title: string;
  description: string | null;
  average_rating: number;
  total_ratings: number;
  cards_count: number;
  creator: {
    username: string | null;
    avatar_url: string | null;
  };
  subject: {
    name: string | null;
    emoji: string | null;
  } | null;
}

export interface ExploreInitialResponse {
  categories: Subject[];
  results: ExploreTrendingSet[];
}

export interface GetUserProfileResponse {
  profile: UserProfileInfo;
  sets: PublicSetSummary[];
}

export interface UserConnection {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  is_following: boolean;
}

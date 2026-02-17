import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, Bookmark, Copy, 
  Loader2, Star, Brain, CheckSquare, FileText, 
  Send, X, Play, CornerDownRight
} from 'lucide-react';
import { studyService } from '../services/studyService';
import { GetSetDetailsResponse, StudyItemType, StudyComment, CommentReply } from '../types/study';
import { useToast } from '../contexts/ToastContext';
import StudyModal from '../components/study/StudyModal';
import RateSetModal from '../components/study/RateSetModal';

const PostPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GetSetDetailsResponse | null>(null);
  const [cloning, setCloning] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingStats, setRatingStats] = useState({ average: 0, total: 0 });
  
  // Comments state
  const [comments, setComments] = useState<StudyComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, username: string } | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!setId) return;
      try {
        setLoading(true);
        const result = await studyService.getSetDetails(setId);
        if (result) {
          setData(result);
          setIsBookmarked(result.set.is_bookmarked);
          setRatingStats({
            average: result.set.average_rating,
            total: result.set.total_ratings
          });
        } else {
          showToast('Study set not found', 'error');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch set details:', err);
        showToast('Failed to load study set details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [setId, navigate, showToast]);

  useEffect(() => {
    if (showComments && setId) {
      fetchComments();
    }
  }, [showComments, setId]);

  const fetchComments = async () => {
    if (!setId) return;
    try {
      setCommentsLoading(true);
      const data = await studyService.getComments(setId, 'set');
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      showToast('Failed to load comments', 'error');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setId || !newComment.trim() || commentSubmitting || commentsLoading) return;

    try {
      setCommentSubmitting(true);
      const postedComment = await studyService.postComment(
        setId,
        'set',
        newComment.trim(),
        replyTo?.id
      );

      if (replyTo) {
        setComments(prev => prev.map(c => {
          if (c.id === replyTo.id) {
            return {
              ...c,
              replies: [...(c.replies || []), postedComment as unknown as CommentReply]
            };
          }
          return c;
        }));
        showToast('Reply posted!', 'success');
      } else {
        setComments(prev => [postedComment, ...prev]);
        showToast('Comment posted!', 'success');
      }

      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast('Failed to post comment', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const timeAgo = (iso: string) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const handleToggleBookmark = async () => {
    if (!setId || bookmarking) return;
    try {
      setBookmarking(true);
      const nowBookmarked = await studyService.toggleBookmark(setId, 'set');
      setIsBookmarked(nowBookmarked);
      showToast(nowBookmarked ? 'Bookmarked!' : 'Removed from bookmarks', 'success');
    } catch (error) {
      showToast('Failed to update bookmark', 'error');
    } finally {
      setBookmarking(false);
    }
  };

  const handleClone = async () => {
    if (!setId || cloning) return;
    try {
      setCloning(true);
      await studyService.cloneSet(setId);
      showToast('Successfully cloned study set!', 'success');
    } catch (err: any) {
      console.error('Failed to clone set:', err);
      showToast(err?.message || 'Failed to clone study set', 'error');
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { set, items } = data;

  const renderItemIcon = (type: StudyItemType) => {
    switch (type) {
      case 'flashcard': return <Brain className="h-5 w-5 text-blue-600" />;
      case 'quiz_question': return <CheckSquare className="h-5 w-5 text-orange-600" />;
      case 'note': return <FileText className="h-5 w-5 text-green-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100 p-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-xl truncate">Study Set</h1>
      </div>

      <div className="p-4 sm:p-6">
        {/* User Ownership Hierarchy */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          {/* User Profile Header */}
          <div className="p-4 sm:p-6 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <Link 
                to={`/u/${set.creator.username}`}
                className="flex items-center gap-4 group"
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg ring-4 ring-white shadow-sm">
                  {set.creator.avatar_url ? (
                    <img src={set.creator.avatar_url} alt={set.creator.username} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    set.creator.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-black text-gray-900 group-hover:underline text-lg">@{set.creator.username}</p>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Creator Profile</p>
                </div>
              </Link>
              <button className="text-sm font-bold bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 px-6 py-2 rounded-2xl transition-all active:scale-95 shadow-sm">
                Follow
              </button>
            </div>
          </div>

          {/* Nested Set Info */}
          <div className="p-4 sm:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-sm">{set.subject?.emoji || '📚'}</span>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight mb-0.5">{set.title}</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">{set.subject?.name || 'General'}</span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {set.cards_count} cards
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {set.is_official && (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-blue-100">
                    Official
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-base leading-relaxed mb-6 whitespace-pre-wrap max-w-2xl">
              {set.description || "No description provided."}
            </p>

            {set.tags && set.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {set.tags.map(tag => (
                  <span key={tag} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-100/50">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => setShowStudyModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                <span className="text-sm">Study Now</span>
              </button>
              <button 
                onClick={handleClone}
                disabled={cloning}
                className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 text-gray-900 font-black py-3 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {cloning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Copy className="h-5 w-5" />}
                <span className="text-sm">Clone Now</span>
              </button>
            </div>

            {/* Interaction Bar */}
            <div className="flex items-center justify-around py-6 bg-gray-50/50 rounded-2xl text-gray-500 mb-6">
              <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 group px-4 py-2 rounded-xl transition-all hover:shadow-sm ${showComments ? 'bg-white shadow-sm text-blue-600' : 'hover:bg-white'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${showComments ? 'text-blue-600' : 'group-hover:text-blue-600'}`}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <span className="block text-xs text-gray-400 font-bold uppercase tracking-tighter">Comments</span>
                  <span className="text-sm font-black text-gray-900">{set.comments_count}</span>
                </div>
              </button>
              <div className="w-px h-8 bg-gray-200/50" />
              <button 
                onClick={() => setShowRateModal(true)}
                className="flex items-center gap-2 group px-4 py-2 rounded-xl hover:bg-white transition-all hover:shadow-sm"
              >
                <div className="p-2 rounded-full group-hover:text-yellow-600 transition-colors">
                  <Star className={`h-6 w-6 ${ratingStats.average > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </div>
                <div className="text-left">
                  <span className="block text-xs text-gray-400 font-bold uppercase tracking-tighter">Rating</span>
                  <span className="text-sm font-black text-gray-900">{ratingStats.average.toFixed(1)}</span>
                </div>
              </button>
              <div className="w-px h-8 bg-gray-200/50" />
              <button 
                onClick={handleToggleBookmark}
                disabled={bookmarking}
                className={`flex items-center gap-2 group px-4 py-2 rounded-xl hover:bg-white transition-all hover:shadow-sm ${isBookmarked ? 'text-blue-600' : ''}`}
              >
                <div className={`p-2 rounded-full ${isBookmarked ? 'bg-blue-50 text-blue-600' : 'group-hover:text-blue-600'} transition-colors`}>
                  {bookmarking ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-xs text-gray-400 font-bold uppercase tracking-tighter">Status</span>
                  <span className="text-sm font-black text-gray-900">{isBookmarked ? 'Saved' : 'Save'}</span>
                </div>
              </button>
            </div>

            {/* Inline Comments UI */}
            {showComments && (
              <div className="border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg text-gray-900">Comments</h3>
                  <button 
                    onClick={fetchComments}
                    disabled={commentsLoading}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {commentsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Refresh
                  </button>
                </div>

                {/* Comment Input */}
                <div className="mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  {replyTo && (
                    <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-xl bg-blue-100 animate-in slide-in-from-bottom-2">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-blue-700">
                        <Send className="w-3 h-3" /> Replying to @{replyTo.username}
                      </span>
                      <button 
                        onClick={() => setReplyTo(null)}
                        className="p-1 rounded-full hover:bg-white/50 text-blue-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <textarea 
                      id="comment-input"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyTo ? `Write a reply...` : "Add a comment..."}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[44px] max-h-[120px] shadow-sm disabled:opacity-50"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(e);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={commentsLoading || !newComment.trim() || commentSubmitting}
                      className="h-11 w-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100 disabled:opacity-50 disabled:active:scale-100"
                    >
                      {commentSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {commentsLoading && comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                      <p className="text-sm font-medium">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <MessageSquare className="w-12 h-12 opacity-10 mb-2" />
                      <p className="text-sm font-medium">No comments yet. Be the first to share!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="space-y-4">
                        <div className="flex gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 flex-shrink-0">
                            {comment.user.avatar_url ? (
                              <img src={comment.user.avatar_url} alt={comment.user.username} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              comment.user.username.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-gray-900">@{comment.user.username}</span>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {timeAgo(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2 ml-2">
                              <button 
                                onClick={() => {
                                  setReplyTo({ id: comment.id, username: comment.user.username });
                                  document.querySelector<HTMLTextAreaElement>('#comment-input')?.focus();
                                }}
                                className="text-xs font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                              >
                                Reply
                              </button>
                              {comment.replies && comment.replies.length > 0 && (
                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{comment.replies.length} replies</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-10 space-y-4 border-l-2 border-gray-50 pl-6 pt-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="relative">
                                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-100 flex-shrink-0">
                                    {reply.user.avatar_url ? (
                                      <img src={reply.user.avatar_url} alt={reply.user.username} className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                      reply.user.username.substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <CornerDownRight className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200" />
                                </div>
                                <div className="flex-1 bg-white border border-gray-50 rounded-2xl p-3 shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-blue-600">@{reply.user.username}</span>
                                    <span className="text-[10px] font-bold text-gray-300">
                                      {timeAgo(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 text-xs whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl text-gray-900">Items in this set</h3>
            <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{items.length}</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">
                  {renderItemIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300">#{item.position}</span>
                  </div>
                  
                  {item.type === 'flashcard' && (
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900">{(item.content as any).front}</p>
                      <div className="h-px bg-gray-50 w-full" />
                      <p className="text-gray-600 text-sm">{(item.content as any).back}</p>
                    </div>
                  )}

                  {item.type === 'quiz_question' && (
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900">{(item.content as any).question}</p>
                      <p className="text-gray-500 text-xs">{(item.content as any).options?.length || 0} options</p>
                    </div>
                  )}

                  {item.type === 'note' && (
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900">{(item.content as any).title}</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{(item.content as any).markdown}</p>
                    </div>
                  )}
                  
                  {/* Generic catch-all for other types */}
                  {!['flashcard', 'quiz_question', 'note'].includes(item.type) && (
                    <p className="font-bold text-gray-900">{(item.content as any).question || (item.content as any).title || "View details in study mode"}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <StudyModal 
        isOpen={showStudyModal}
        onClose={() => setShowStudyModal(false)}
        setId={setId || null}
      />

      <RateSetModal 
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        setId={setId || ''}
        initialAverage={ratingStats.average}
        onRated={(newAvg, newTotal) => {
          setRatingStats({ average: newAvg, total: newTotal });
          showToast('Thanks for your rating!', 'success');
        }}
      />
    </div>
  );
};

export default PostPage;

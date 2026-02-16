import React, { useEffect, useState } from 'react';
import { X, Send, MessageSquare, Loader2, CornerDownRight, Layers, CreditCard } from 'lucide-react';
import { studyService } from '../../services/studyService';
import { StudyComment, CommentReply } from '../../types/study';
import { useToast } from '../../contexts/ToastContext';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'set' | 'item';
  title?: string;
  setDetails?: {
    title: string;
    description?: string | null;
    subject?: string;
    emoji?: string | null;
    cardsCount?: number;
    rating?: number;
    tags?: string[];
  };
  itemDetails?: {
    type: 'flashcard' | 'quiz' | 'note' | 'quiz_question' | 'matching_pairs' | 'order_sequence' | 'checkbox_question' | 'written_answer';
    content: any;
    metadata?: any;
  };
}

const CommentsModal: React.FC<CommentsModalProps> = ({ 
  isOpen, 
  onClose, 
  targetId, 
  targetType,
  setDetails,
  itemDetails
}) => {
  const { showToast } = useToast();
  const [comments, setComments] = useState<StudyComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, username: string } | null>(null);

  // Derived counts for header badges
  const totalTopLevel = comments.length;
  const totalReplies = comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  const totalAll = totalTopLevel + totalReplies;

  const isSet = targetType === 'set';

  useEffect(() => {
    if (isOpen && targetId) {
      fetchComments();
    }
  }, [isOpen, targetId, targetType]);

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

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await studyService.getComments(targetId, targetType);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || loading) return;

    try {
      setSubmitting(true);
      const postedComment = await studyService.postComment(
        targetId,
        targetType,
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
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header - Simplified to just a close button and title */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">
              {isSet ? 'Set Comments' : 'Item Comments'}
            </h3>
            <span className={`px-2 py-0.5 text-[10px] rounded-full bg-gray-50 border text-gray-500`}>
              {totalAll}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Content Summary - Now part of scrollable area */}
          {isSet && setDetails ? (
            <div className={`p-4 sm:p-6 border-b ${isSet ? 'bg-indigo-50/30' : 'bg-emerald-50/30'}`}>
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  {setDetails.emoji || '📚'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2">{setDetails.title}</h3>
                  <p className="text-xs sm:text-sm text-indigo-600 font-medium">{setDetails.subject || 'Study Set'}</p>
                </div>
              </div>
              
              {setDetails.description && (
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 italic line-clamp-3">
                  "{setDetails.description}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-indigo-100/30">
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500 text-sm">★</span>
                    {setDetails.rating?.toFixed(1) || '0.0'}
                  </span>
                  {setDetails.cardsCount !== undefined && (
                    <span className="text-gray-400 font-medium">{setDetails.cardsCount} cards</span>
                  )}
                </div>
                {setDetails.tags && setDetails.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {setDetails.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-white border border-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : targetType === 'item' && itemDetails ? (
            <div className={`p-4 border-b bg-emerald-50/30`}>
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                {itemDetails.type === 'flashcard' && <Layers className="w-4 h-4" />}
                {(itemDetails.type === 'quiz' || itemDetails.type === 'quiz_question' || itemDetails.type === 'checkbox_question') && <CreditCard className="w-4 h-4" />}
                {itemDetails.type === 'note' && <MessageSquare className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-wider">{itemDetails.type.replace('_', ' ')}</span>
              </div>
              <div className="text-sm text-gray-800 font-medium line-clamp-4">
                {typeof itemDetails.content === 'string' ? (
                  itemDetails.content
                ) : itemDetails.type === 'flashcard' ? (
                  <>
                    <p className="font-bold">Front: {itemDetails.content.front}</p>
                    <p className="text-gray-600 mt-1">Back: {itemDetails.content.back}</p>
                  </>
                ) : (itemDetails.type === 'quiz_question' || itemDetails.type === 'checkbox_question') ? (
                  <p>{itemDetails.content.question}</p>
                ) : itemDetails.type === 'note' ? (
                  <p className="font-bold">{itemDetails.content.title}</p>
                ) : (
                  <p>{itemDetails.content.question || 'Item Content'}</p>
                )}
              </div>
            </div>
          ) : null}

          {/* Comments List */}
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Conversation
              </h4>
              <button 
                onClick={fetchComments}
                disabled={loading}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-gray-500`}
              >
                <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {loading && comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2 className={`w-8 h-8 animate-spin ${isSet ? 'text-indigo-500' : 'text-emerald-500'}`} />
                <p>Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p className="text-sm">No comments yet. Be the first to share!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex gap-3">
                    <img 
                      src={comment.user.avatar_url || `https://ui-avatars.com/api/?name=${comment.user.username}&background=random`} 
                      alt={comment.user.username}
                      className="w-9 h-9 rounded-full border border-gray-100 object-cover"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-sm ${isSet ? 'text-indigo-600' : 'text-emerald-600'}`}>{comment.user.username}</span>
                          <span className="text-[10px] text-gray-400">
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <button 
                          onClick={() => {
                            setReplyTo({ id: comment.id, username: comment.user.username });
                            document.querySelector<HTMLTextAreaElement>('#comment-input')?.focus();
                          }}
                          className={`text-xs font-semibold text-gray-500 transition-colors ${isSet ? 'hover:text-indigo-600' : 'hover:text-emerald-600'}`}
                        >
                          Reply
                        </button>
                        {comment.replies && comment.replies.length > 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">{comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-9 space-y-3 pt-1 border-l-2 border-gray-100 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="relative">
                            <img 
                              src={reply.user.avatar_url || `https://ui-avatars.com/api/?name=${reply.user.username}&background=random`} 
                              alt={reply.user.username}
                              className="w-7 h-7 rounded-full border border-gray-100 object-cover"
                            />
                            <CornerDownRight className="absolute -left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          </div>
                          <div className={`flex-1 rounded-2xl p-3 border ${isSet ? 'bg-indigo-50/30 border-indigo-100/50' : 'bg-emerald-50/30 border-emerald-100/50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-bold text-xs ${isSet ? 'text-indigo-600' : 'text-emerald-600'}`}>{reply.user.username}</span>
                              <span className="text-[10px] text-gray-400">
                                {timeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-xs whitespace-pre-wrap">{reply.content}</p>
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

        {/* Input Area */}
        <div className="p-4 border-t bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4">
          {replyTo && (
            <div className={`mb-3 flex items-center justify-between px-3 py-2 rounded-xl animate-in slide-in-from-bottom-2 ${isSet ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isSet ? 'text-indigo-700' : 'text-emerald-700'}`}>
                <Send className="w-3 h-3" /> Replying to @{replyTo.username}
              </span>
              <button 
                onClick={() => setReplyTo(null)}
                className={`p-1 rounded-full hover:bg-white/50 ${isSet ? 'text-indigo-700' : 'text-emerald-700'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea disabled={loading}
              id="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? `Write a reply...` : "Add a comment..."}
              className={`flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none min-h-[44px] max-h-[120px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isSet ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim() || submitting || newComment.length > 500}
              className={`text-white p-3 rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-[44px] w-[44px] flex items-center justify-center flex-shrink-0 active:scale-90 ${
                isSet 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-400 italic">
              Press Enter to post
            </p>
            <div className={`text-[10px] font-bold ${newComment.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
              {newComment.length}/500
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;

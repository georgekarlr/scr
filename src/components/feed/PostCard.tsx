import React, { useState } from 'react'
import { MessageSquare, Share2, MoreHorizontal, Brain, CheckSquare, FileText, Bookmark, Copy, Loader2, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import CommentsModal from '../study/CommentsModal'
import RateSetModal from '../study/RateSetModal'
import { useToast } from '../../contexts/ToastContext'
import { studyService } from '../../services/studyService'

interface PostCardProps {
  post: {
    id: string
    type?: 'flashcard' | 'quiz' | 'note' | 'study_set'
    author: {
      name: string
      username: string
      avatar: string
    }
    content: string
    timestamp: string
    likes: number
    comments: number
    shares: number
    image?: string
    metadata?: any;
    onStudyNow?: () => void;
    onClone?: () => Promise<void>;
    is_bookmarked?: boolean;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { showToast } = useToast();
  const [cloning, setCloning] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingStats, setRatingStats] = useState({
    average: post.metadata?.rating || 0,
    total: post.metadata?.total_ratings || 0
  });
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarking) return;

    try {
      setBookmarking(true);
      const targetType = post.type === 'study_set' ? 'set' : 'item';
      const nowBookmarked = await studyService.toggleBookmark(post.id, targetType);
      setIsBookmarked(nowBookmarked);
      showToast(nowBookmarked ? 'Bookmarked!' : 'Removed from bookmarks', 'success');
    } catch (error) {
      showToast('Failed to update bookmark', 'error');
    } finally {
      setBookmarking(false);
    }
  };

  const handleClone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.onClone || cloning) return;
    
    try {
      setCloning(true);
      await post.onClone();
    } finally {
      setCloning(false);
    }
  };

  const renderContent = () => {
    switch (post.type) {
      case 'flashcard':
        return (
          <div className="mt-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 sm:p-6 text-center shadow-sm">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 leading-snug">{post.content}</p>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4 transition-colors">
              Flip to see back
            </button>
          </div>
        )
      case 'quiz':
        return (
          <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4 text-orange-600">
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm font-bold">Quick Quiz</span>
            </div>
            <p className="text-[15px] font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{post.content}</p>
            <div className="space-y-1.5 sm:space-y-2">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <button key={opt} className="w-full text-left p-2.5 sm:p-3 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700">
                  <span className="font-bold mr-2 text-blue-600">{opt}.</span>
                  Option placeholder text
                </button>
              ))}
            </div>
          </div>
        )
      case 'study_set':
        return (
          <div className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-xl sm:text-2xl flex-shrink-0">{post.metadata?.subject?.emoji || '📚'}</span>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-base truncate">{post.metadata?.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{post.metadata?.subject?.name || 'General'}</p>
                </div>
              </div>
              <div className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider flex-shrink-0 ml-2">
                Set
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
              {post.content}
            </p>

            <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-gray-50">
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-gray-500">
                <span className="flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  {post.metadata?.cards_count || 0} cards
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRateModal(true);
                  }}
                  className="flex items-center hover:bg-yellow-50 px-1 rounded transition-colors"
                >
                  <span className="text-yellow-400 mr-0.5 sm:mr-1">★</span>
                  {ratingStats.average.toFixed(1)}
                </button>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button 
                  onClick={handleClone}
                  disabled={cloning}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                  title="Clone this set"
                >
                  {cloning ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  <span className="hidden sm:inline">Clone</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    post.onStudyNow?.();
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Study Now →
                </button>
              </div>
            </div>

            {post.metadata?.tags && post.metadata.tags.length > 0 && (
              <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1">
                {post.metadata.tags.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      case 'note':
      default:
        return (
          <>
            <div className="mt-1 text-gray-900 text-[15px] leading-normal whitespace-pre-wrap">
              {post.content}
            </div>
            {post.image && (
              <div className="mt-2 sm:mt-3 rounded-2xl overflow-hidden border border-gray-100">
                <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[400px] sm:max-h-[500px]" />
              </div>
            )}
          </>
        )
    }
  }

  return (
    <div className="bg-white border-b border-gray-100 p-3 sm:p-4 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={post.onStudyNow}>
      <div className="flex space-x-2 sm:space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Link
            to={`/u/${post.author.username.replace(/^@/, '')}`}
            onClick={(e) => e.stopPropagation()}
            className="block"
            title={`Go to @${post.author.username.replace(/^@/, '')}`}
          >
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm sm:text-base">
              {post.author.avatar}
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center space-x-1 min-w-0">
              <Link
                to={`/u/${post.author.username.replace(/^@/, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-gray-900 truncate hover:underline text-base"
                title={`Go to @${post.author.username.replace(/^@/, '')}`}
              >
                {post.author.name}
              </Link>
              <Link
                to={`/u/${post.author.username.replace(/^@/, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="text-gray-500 text-sm truncate hover:underline"
                title={`Go to @${post.author.username.replace(/^@/, '')}`}
              >
                {post.author.username}
              </Link>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-500 text-sm truncate">{post.timestamp}</span>
            </div>
            <button className="text-gray-400 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50 transition-colors">
              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {renderContent()}

          {/* Comments modal for study sets */}
          {post.type === 'study_set' && (
            <>
              <CommentsModal
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                targetId={post.id}
                targetType={'set'}
                title={`Comments on ${post.metadata?.title || 'Study Set'}`}
                setDetails={{
                  title: post.metadata?.title || 'Study Set',
                  description: post.content,
                  subject: post.metadata?.subject?.name,
                  emoji: post.metadata?.subject?.emoji,
                  cardsCount: post.metadata?.cards_count,
                  rating: ratingStats.average
                }}
              />
              <RateSetModal
                isOpen={showRateModal}
                onClose={() => setShowRateModal(false)}
                setId={post.id}
                initialAverage={ratingStats.average}
                onRated={(newAverage, newTotal) => {
                  setRatingStats({ average: newAverage, total: newTotal });
                  showToast('Thanks for your rating!', 'success');
                }}
              />
            </>
          )}

          {/* Interactions */}
          <div className="mt-3 flex items-center justify-between text-gray-500" onClick={(e) => e.stopPropagation()}>
            <button className="flex items-center space-x-1 sm:space-x-2 group transition-colors hover:text-blue-500" onClick={() => post.type === 'study_set' && setShowComments(true)}>
              <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <MessageSquare className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px]" />
              </div>
              <span className="text-sm">{post.comments}</span>
            </button>
            {post.type === 'study_set' ? (
              <button 
                onClick={handleClone}
                disabled={cloning}
                className="flex items-center space-x-1 sm:space-x-2 group transition-colors hover:text-blue-500 disabled:opacity-50"
                title="Clone this set"
              >
                <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  {cloning ? (
                    <Loader2 className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] animate-spin" />
                  ) : (
                    <Copy className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px]" />
                  )}
                </div>
                <span className="text-sm hidden sm:inline">Clone</span>
              </button>
            ) : (
              <button className="flex items-center space-x-1 sm:space-x-2 group transition-colors hover:text-green-500">
                <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-green-50 transition-colors">
                  <Share2 className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px]" />
                </div>
                <span className="text-sm">{post.shares}</span>
              </button>
            )}
            {post.type === 'study_set' && (
              <button 
                onClick={() => setShowRateModal(true)}
                className="flex items-center space-x-1 sm:space-x-2 group transition-colors hover:text-yellow-600 text-yellow-500"
              >
                <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-yellow-50 transition-colors">
                  <Star className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px]" />
                </div>
                <span className="text-sm font-medium">{ratingStats.average.toFixed(1)}</span>
              </button>
            )}
            <button 
              onClick={handleToggleBookmark}
              disabled={bookmarking}
              className={`flex items-center space-x-1 sm:space-x-2 group transition-colors ${isBookmarked ? 'text-blue-600' : 'hover:text-blue-500'}`}
            >
              <div className={`p-1.5 sm:p-2 rounded-full transition-colors ${isBookmarked ? 'bg-blue-50' : 'group-hover:bg-blue-50'}`}>
                {bookmarking ? (
                  <Loader2 className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] animate-spin" />
                ) : (
                  <Bookmark className={`h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] ${isBookmarked ? 'fill-current' : ''}`} />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostCard

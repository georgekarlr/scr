import React, { useEffect, useState } from 'react'
import PostCard from '../components/feed/PostCard'
import { studyService } from '../services/studyService'
import { HomeDashboardResponse, FeedItem, RecommendedUser } from '../types/study'
import DailyPick from '../components/dashboard/DailyPick'
import ContinueStudying from '../components/dashboard/ContinueStudying'
import ContinueStudyingModal from '../components/dashboard/ContinueStudyingModal'
import RecommendationCard from '../components/dashboard/RecommendationCard'
import UserStats from '../components/dashboard/UserStats'
import CreateSetModal from '../components/dashboard/CreateSetModal'
import { Loader2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'

const FeedPage: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [dashboardData, setDashboardData] = useState<HomeDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isContinueModalOpen, setIsContinueModalOpen] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const data = await studyService.getHomeDashboard()
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to fetch dashboard:', err)
        setError('Failed to load your dashboard. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  console.log('FeedPage rendering')

  const handleCloneSet = async (setId: string, title: string) => {
    try {
      const newSetId = await studyService.cloneSet(setId);
      showToast(`Successfully cloned "${title}"!`, 'success');
      // Optionally redirect or refresh. For now, just toast.
    } catch (err: any) {
      console.error('Failed to clone set:', err);
      showToast(err?.message || 'Failed to clone study set', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-600 font-bold hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto lg:mx-0 p-4">
      {/* Feed Tabs */}
      {/*<div className="flex border-b border-gray-100 sticky top-16 lg:top-0 bg-white/95 backdrop-blur-md z-20 mb-6">
        <button className="flex-1 py-4 text-sm sm:text-base font-bold text-gray-900 hover:bg-gray-50 transition-colors border-b-4 border-blue-600">
          For You
        </button>
        <button className="flex-1 py-4 text-sm sm:text-base font-bold text-gray-500 hover:bg-gray-50 transition-colors border-b-4 border-transparent">
          Following
        </button>
      </div>*/}

      {dashboardData?.user_stats && <UserStats stats={dashboardData.user_stats} />}

      {dashboardData?.daily_pick && <DailyPick pick={dashboardData.daily_pick} onStudyNow={(id) => navigate(`/study/${id}`)} />}


      <CreateSetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ContinueStudyingModal 
        isOpen={isContinueModalOpen}
        onClose={() => setIsContinueModalOpen(false)}
        onPlay={(id) => {
          setIsContinueModalOpen(false)
          navigate(`/study/${id}`)
        }}
      />
      
      {dashboardData?.continue_studying && dashboardData.continue_studying.length > 0 && (
        <ContinueStudying items={dashboardData.continue_studying} onPlay={(id) => navigate(`/study/${id}`)} onSeeAll={() => setIsContinueModalOpen(true)} />
      )}

        {/* Trigger for the new modal */}
        {/*<button
            onClick={() => setIsModalOpen(true)}
            className="w-full mb-6 p-3 sm:p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
            <div className="flex items-center min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="text-left min-w-0">
                    <p className="font-bold text-gray-900 text-base truncate">Create a new study set</p>
                    <p className="text-xs text-gray-500 truncate">Add flashcards, quizzes, or notes</p>
                </div>
            </div>
            <div className="bg-blue-600 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg shadow-md shadow-blue-100 flex-shrink-0 ml-2">
                Quick Create
            </div>
        </button>*/}
      {/* Feed Content */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900 px-1">
          {dashboardData?.feed_type === 'following' ? 'Your Feed' : 'Recommended for You'}
        </h2>
        
        <div className="divide-y divide-gray-100">
          {dashboardData?.feed_content.map((item, index) => {
            if (item.type === 'feed') {
              const feedItem = item as FeedItem;
              // Map FeedItem to PostCard format
              const post = {
                id: feedItem.set_id,
                type: 'study_set' as const,
                author: {
                  name: feedItem.creator.username || 'Anonymous',
                  username: feedItem.creator.username ? `@${feedItem.creator.username}` : '@anonymous',
                  avatar: feedItem.creator.avatar || (feedItem.creator.username ? feedItem.creator.username.substring(0, 2).toUpperCase() : '??')
                },
                content: feedItem.description || `Created a new study set: ${feedItem.title}`,
                timestamp: new Date(feedItem.created_at).toLocaleDateString(),
                likes: feedItem.stats.like_count,
                comments: feedItem.stats.comment_count,
                shares: 0,
                metadata: {
                  title: feedItem.title,
                  tags: feedItem.tags,
                  subject: feedItem.subject,
                  cards_count: feedItem.stats.cards_count,
                  rating: feedItem.stats.average_rating
                },
                onStudyNow: () => navigate(`/study/${feedItem.set_id}`),
                onClone: () => handleCloneSet(feedItem.set_id, feedItem.title),
                is_bookmarked: feedItem.is_bookmarked
              };
              return <PostCard key={`${feedItem.set_id}-${index}`} post={post} />;
            } else {
              return <RecommendationCard key={`${(item as RecommendedUser).user_id}-${index}`} user={item as RecommendedUser} />;
            }
          })}

          {dashboardData?.feed_content.length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <p>Nothing to show here yet. Start following people to see their activity!</p>
            </div>
          )}

          {dashboardData?.feed_type !== 'following' && dashboardData?.feed_content.some(item => item.type !== 'feed') && (
            <div className="p-4 pt-1 flex justify-center">
              <button 
                onClick={() => navigate('/who-to-follow')}
                className="flex items-center space-x-2 px-6 py-2 bg-white border border-gray-200 rounded-full text-blue-600 font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                <Users className="h-4 w-4" />
                <span>Show more people</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Footer */}
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">You've reached the end of your feed.</p>
        <button className="mt-4 text-blue-600 font-bold hover:underline">
          Back to top
        </button>
      </div>
    </div>
  )
}

export default FeedPage

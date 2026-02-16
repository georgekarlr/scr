import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, MoreHorizontal, Trophy, Star, Search, Loader2, X } from 'lucide-react'
import { studyService } from '../../services/studyService'
import { SearchSetResult, SearchUserResult, WhoToFollowUser } from '../../types/study'
import { Link } from 'react-router-dom'

const RightSidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'sets' | 'users'>('sets')
  const [setResults, setSetResults] = useState<SearchSetResult[]>([])
  const [userResults, setUserResults] = useState<SearchUserResult[]>([])
  const [whoToFollow, setWhoToFollow] = useState<WhoToFollowUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingWhoToFollow, setIsLoadingWhoToFollow] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchWhoToFollow = async () => {
      try {
        const data = await studyService.getWhoToFollow(4)
        setWhoToFollow(data)
      } catch (err) {
        console.error('Failed to fetch who to follow:', err)
      } finally {
        setIsLoadingWhoToFollow(false)
      }
    }

    fetchWhoToFollow()
  }, [])

  const handleFollow = async (userId: string) => {
    try {
      await studyService.followUser(userId)
      setFollowingIds(prev => new Set(prev).add(userId))
      // Optional: remove from list or show followed status
    } catch (err) {
      console.error('Failed to follow user:', err)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true)
        setShowResults(true)
        try {
          const searchSets = searchType === 'sets'
            ? studyService.searchSets(searchTerm, null, 3)
            : Promise.resolve([])
          
          const searchUsers = searchType === 'users'
            ? studyService.searchUsers(searchTerm, 3)
            : Promise.resolve([])

          const [sets, users] = await Promise.all([searchSets, searchUsers])
          setSetResults(sets)
          setUserResults(users)
        } catch (err) {
          console.error('Search failed:', err)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSetResults([])
        setUserResults([])
        setShowResults(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, searchType])


  const leaderboard = [
    { name: 'John Doe', xp: '12,450', rank: 1, avatar: 'JD' },
    { name: 'Jane Smith', xp: '10,200', rank: 2, avatar: 'JS' },
    { name: 'Alice Johnson', xp: '9,800', rank: 3, avatar: 'AJ' },
  ]

  return (
    <aside className="hidden xl:block w-80 p-4 space-y-6 sticky top-0 h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Search Bar */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder={searchType === 'sets' ? 'Search sets...' : 'Search users...'} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length > 1 && setShowResults(true)}
            className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-10 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setShowResults(false); }}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
          )}

          {/* Search Results Dropdown */}
          {showResults && (setResults.length > 0 || userResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                {userResults.length > 0 && (
                  <div className="pb-2 border-b border-gray-50">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">Users</h3>
                    {userResults.map((user) => (
                      <Link 
                        key={user.id} 
                        to={`/u/${user.username}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} className="h-full w-full object-cover rounded-full" alt="" />
                          ) : (
                            user.username.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">@{user.username}</p>
                          <p className="text-[10px] text-gray-500 truncate">{user.full_name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {setResults.length > 0 && (
                  <div className="pt-1">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">Study Sets</h3>
                    {setResults.map((result) => (
                      <div key={result.id} className="p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 truncate">{result.title}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-[10px] text-gray-500 flex items-center">
                            <Star className="h-2.5 w-2.5 mr-0.5 text-yellow-500 fill-current" />
                            {result.average_rating.toFixed(1)}
                          </p>
                          <span className="text-[10px] text-gray-400">•</span>
                          <p className="text-[10px] text-gray-500 truncate">{result.subject?.name || 'General'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Type Indicator/Selector */}
        <div className="flex items-center space-x-1 px-1">
          <button
            onClick={() => setSearchType('sets')}
            className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center ${
              searchType === 'sets' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Sets
          </button>
          <button
            onClick={() => setSearchType('users')}
            className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center ${
              searchType === 'users' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Users
          </button>
        </div>
      </div>

      {/* Who to Follow Section */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center text-gray-900">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Who to follow
          </h2>
        </div>
        <div className="space-y-4">
          {isLoadingWhoToFollow ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          ) : whoToFollow.length > 0 ? (
            whoToFollow.map((user) => (
              <div key={user.id} className="flex items-center justify-between group">
                <Link to={`/u/${user.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      user.username.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-bold text-gray-900 truncate">@{user.username}</p>
                      {user.is_relevant && (
                        <span className="flex-shrink-0 bg-blue-100 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Similar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.total_xp.toLocaleString()} XP</p>
                  </div>
                </Link>
                <button 
                  onClick={() => handleFollow(user.id)}
                  disabled={followingIds.has(user.id)}
                  className={`ml-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    followingIds.has(user.id)
                      ? 'bg-gray-200 text-gray-500 cursor-default'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {followingIds.has(user.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No recommendations found</p>
          )}
        </div>
        <Link to="/explore" className="mt-4 block text-blue-600 text-sm font-semibold hover:text-blue-700">
          Show more
        </Link>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <h2 className="text-xl font-bold flex items-center mb-4 text-gray-900">
          <Trophy className="h-5 w-5 mr-2 text-blue-600" />
          Weekly Leaderboard
        </h2>
        <div className="space-y-4">
          {leaderboard.map((user) => (
            <div key={user.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                    {user.avatar}
                  </div>
                  <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm
                    ${user.rank === 1 ? 'bg-yellow-500' : user.rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                    {user.rank}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">{user.xp} XP</p>
                </div>
              </div>
              <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                Lv. {Math.floor(parseInt(user.xp.replace(',', '')) / 1000)}
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-700">
          Full Leaderboard
        </button>
      </div>

      {/* Footer Links */}
      <div className="px-4 text-xs text-gray-500 space-x-3">
        <a href="#" className="hover:underline">Terms of Service</a>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Cookie Policy</a>
        <p className="mt-2">© 2026 Ceintelly, Inc.</p>
      </div>
    </aside>
  )
}

export default RightSidebar

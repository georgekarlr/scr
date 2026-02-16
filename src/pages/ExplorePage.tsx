import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Search, TrendingUp, Grid, Star, Users, X } from 'lucide-react';
import { studyService } from '../services/studyService';
import { ExploreInitialResponse, ExploreTrendingSet, SearchUserResult, SearchSetResult } from '../types/study';
import PostCard from '../components/feed/PostCard';
import StudyModal from '../components/study/StudyModal';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';

const ExplorePage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<ExploreInitialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studySetId, setStudySetId] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'top_rated'>('trending');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'sets' | 'users'>('sets');
  const [isSearching, setIsSearching] = useState(false);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [setResults, setSetResults] = useState<SearchSetResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        setLoading(true);
        const result = await studyService.getExploreInitial(
          selectedSubjectIds.length > 0 ? selectedSubjectIds : null,
          sortBy
        );
        setData(result);
      } catch (err) {
        console.error('Failed to fetch explore data:', err);
        setError('Failed to load explore data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExplore();
  }, [selectedSubjectIds, sortBy]);

  const performSearch = useCallback(async (query: string, type: 'sets' | 'users') => {
    if (query.trim().length < 2) {
      setUserResults([]);
      setSetResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const searchUsers = type === 'users' 
        ? studyService.searchUsers(query, 5) 
        : Promise.resolve([]);
      
      const searchSets = type === 'sets'
        ? studyService.searchSets(query, null, 5)
        : Promise.resolve([]);

      const [users, sets] = await Promise.all([searchUsers, searchSets]);
      setUserResults(users);
      setSetResults(sets);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery, searchType);
      } else {
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType, performSearch]);

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleCloneSet = async (setId: string, title: string) => {
    try {
      await studyService.cloneSet(setId);
      showToast(`Successfully cloned "${title}"!`, 'success');
    } catch (err: any) {
      console.error('Failed to clone set:', err);
      showToast(err?.message || 'Failed to clone study set', 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
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
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 pb-20">
      {/* Header */}
      <div className="px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
          <p className="text-gray-500">Discover top-rated study sets across all subjects</p>
        </div>

        {/* Search Bar - Hidden on XL screens because it's in the RightSidebar */}
        <div className="relative w-full md:w-96 group xl:hidden">
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                searchQuery ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <input 
                type="text" 
                placeholder={searchType === 'sets' ? 'Search study sets...' : 'Search users...'} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowResults(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {isSearching && (
                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Search Type Indicator/Selector */}
            <div className="flex items-center space-x-2 px-1">
              <button
                onClick={() => setSearchType('sets')}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all flex items-center ${
                  searchType === 'sets' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Grid className="h-2.5 w-2.5 mr-1" /> Sets
              </button>
              <button
                onClick={() => setSearchType('users')}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all flex items-center ${
                  searchType === 'users' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Users className="h-2.5 w-2.5 mr-1" /> Users
              </button>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (searchQuery.length >= 2) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {isSearching && userResults.length === 0 && setResults.length === 0 ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Searching...</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {/* Users Results */}
                  {userResults.length > 0 && (
                    <div className="p-2 border-b border-gray-50">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1 flex items-center">
                        <Users className="h-3 w-3 mr-1" /> Users
                      </h3>
                      <div className="space-y-1">
                        {userResults.map((user) => (
                          <Link 
                            key={user.id} 
                            to={`/u/${user.username}`}
                            className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-xl transition-colors group"
                            onClick={() => setShowResults(false)}
                          >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-white shadow-sm overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                              ) : (
                                user.username.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">@{user.username}</p>
                              <p className="text-xs text-gray-500 truncate">{user.full_name || 'No name'}</p>
                            </div>
                            <div className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              Lv. {user.level}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sets Results */}
                  {setResults.length > 0 && (
                    <div className="p-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1 flex items-center">
                        <Grid className="h-3 w-3 mr-1" /> Study Sets
                      </h3>
                      <div className="space-y-1">
                        {setResults.map((set) => (
                          <button 
                            key={set.id} 
                            onClick={() => {
                              setStudySetId(set.id);
                              setShowResults(false);
                            }}
                            className="w-full flex items-center space-x-3 p-2 hover:bg-orange-50 rounded-xl transition-colors text-left group"
                          >
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-xl shadow-sm">
                              {set.subject?.emoji || '📚'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">{set.title}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] text-gray-500 flex items-center">
                                  <Star className="h-2.5 w-2.5 mr-0.5 text-yellow-500 fill-current" />
                                  {set.average_rating.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-gray-400">•</span>
                                <span className="text-[10px] text-gray-500 font-medium uppercase">{set.subject?.name || 'General'}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {userResults.length === 0 && setResults.length === 0 && !isSearching && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center space-x-2">
            <Grid className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Categories</h2>
          </div>
          {selectedSubjectIds.length > 0 && (
            <button 
              onClick={() => setSelectedSubjectIds([])}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Clear filters ({selectedSubjectIds.length})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {data?.categories.map((cat) => {
            const isSelected = selectedSubjectIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleSubject(cat.id)}
                className={`flex flex-col items-center justify-center p-2.5 border rounded-xl transition-all group ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-600 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <span className={`text-2xl mb-1 group-hover:scale-110 transition-transform ${
                  isSelected ? 'scale-110' : ''
                }`}>
                  {cat.emoji || '📚'}
                </span>
                <span className={`text-xs font-bold text-center line-clamp-1 ${
                  isSelected ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trending Sets */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-1 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">
              {sortBy === 'trending' ? 'Trending Now' : sortBy === 'newest' ? 'Newest Sets' : 'Top Rated Sets'}
            </h2>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { id: 'trending', label: 'Trending' },
              { id: 'newest', label: 'Newest' },
              { id: 'top_rated', label: 'Top Rated' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sortBy === option.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 max-w-2xl relative">
          {loading && data && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-start justify-center pt-20 rounded-xl">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          )}
          {data?.results.map((set: ExploreTrendingSet) => {
             // Map ExploreTrendingSet to PostCard expected format
             const post = {
               id: set.id,
               type: 'study_set' as const,
               author: {
                 name: set.creator.username || 'Anonymous',
                 username: set.creator.username ? `@${set.creator.username}` : '@anonymous',
                 avatar: set.creator.avatar_url || (set.creator.username ? set.creator.username.substring(0, 2).toUpperCase() : '??')
               },
               content: set.description || `Explore this ${set.subject?.name || 'study'} set`,
               timestamp: new Date(set.created_at).toLocaleDateString(),
               likes: 0, // Not provided by explore API directly in results object but we can show stats
               comments: 0,
               shares: 0,
               metadata: {
                 title: set.title,
                 subject: set.subject,
                 cards_count: set.cards_count,
                 rating: set.average_rating,
                 total_ratings: set.total_ratings
               },
               onStudyNow: () => setStudySetId(set.id),
               onClone: () => handleCloneSet(set.id, set.title)
             };
             return <PostCard key={set.id} post={post} />;
          })}

          {data?.results.length === 0 && (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">No sets found</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                We couldn't find any study sets matching your filters. Try selecting different categories or a different sort order.
              </p>
              {selectedSubjectIds.length > 0 && (
                <button
                  onClick={() => setSelectedSubjectIds([])}
                  className="mt-4 text-sm font-bold text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <StudyModal 
        setId={studySetId} 
        isOpen={!!studySetId} 
        onClose={() => setStudySetId(null)} 
      />
    </div>
  );
};

export default ExplorePage;

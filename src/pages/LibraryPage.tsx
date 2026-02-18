import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, Bookmark, Plus, Search, Filter, ArrowUpDown, ChevronDown, X } from 'lucide-react';
import { libraryService } from '../services/libraryService';
import { LibraryContentItem, LibraryTabType } from '../types/library';
import PostCard from '../components/feed/PostCard';
import LibrarySetCard from '../components/library/LibrarySetCard';
import CreateSetModal from '../components/dashboard/CreateSetModal';
import { useToast } from '../contexts/ToastContext';
import { studyService } from '../services/studyService';

const LibraryPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LibraryTabType>('created');
  const [items, setItems] = useState<LibraryContentItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editSetData, setEditSetData] = useState<any>(null);

  // New Filter/Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchLibraryContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryService.getLibraryContent(
        activeTab,
        searchQuery || null,
        filterSubjectId,
        sortBy
      );
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch library content:', err);
      setError('Failed to load library content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subs = await studyService.getSubjects();
        setSubjects(subs);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchLibraryContent();
  }, [activeTab, filterSubjectId, sortBy]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLibraryContent();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCloneSet = async (setId: string, title: string) => {
    try {
      await studyService.cloneSet(setId);
      showToast(`Successfully cloned "${title}"!`, 'success');
      if (activeTab === 'created') {
          fetchLibraryContent();
      }
    } catch (err: any) {
      console.error('Failed to clone set:', err);
      showToast(err?.message || 'Failed to clone study set', 'error');
    }
  };

  const handleEditSet = async (item: LibraryContentItem) => {
    try {
      setLoading(true);
      // We need to fetch the full set data including items for editing
      const fullSet = await studyService.getSetForPlay(item.id);
      if (fullSet) {
        setEditSetData({
          id: item.id,
          title: item.title,
          description: item.description || '',
          subject_id: fullSet.items[0] ? 0 : 0, // We need to find the subject_id. 
          // Actually getSetForPlay doesn't return subject_id but subject name/emoji.
          // This is a bit tricky. Let's look at StudySetPlay type again.
          is_public: item.is_public,
          tags: [], // Tags also not in LibraryContentItem or StudySetPlay currently
          items: fullSet.items.map(i => ({
            id: i.id,
            type: i.type,
            content: i.content
          }))
        });

        // We need a better way to get subject_id. 
        // For now let's check if we can get it from the subjects list in CreateSetModal 
        // Or if we should add a getFullSet RPC.
        // Looking at study.ts, StudySet has subject_id.
        // Maybe I should fetch subjects first and match by name.
        const subjects = await studyService.getSubjects();
        const subject = subjects.find(s => s.name === item.subject?.name);

        setEditSetData((prev: any) => ({
          ...prev,
          subject_id: subject?.id || 0,
          tags: [] // Still missing tags, but RPC c_get_library_content doesn't return them.
        }));

        setIsCreateModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch set for editing:', err);
      showToast('Failed to load set details for editing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      await studyService.deleteSet(setId);
      showToast('Study set deleted successfully', 'success');
      fetchLibraryContent();
    } catch (err) {
      console.error('Failed to delete set:', err);
      showToast('Failed to delete study set', 'error');
    }
  };

  const renderContent = () => {
    if (loading) {
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
            onClick={() => fetchLibraryContent()}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            Retry
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      const hasFilters = searchQuery || filterSubjectId || sortBy !== 'newest';
      return (
        <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            {activeTab === 'created' ? (
              <BookOpen className="h-8 w-8 text-gray-400" />
            ) : (
              <Bookmark className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {hasFilters ? "No matching sets found" : (activeTab === 'created' ? "You haven't created any sets yet" : "No bookmarked sets found")}
          </h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            {hasFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : (activeTab === 'created'
                  ? "Start building your knowledge by creating your first study set."
                  : "Explore the community and save sets you want to study later.")
            }
          </p>
          {hasFilters ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterSubjectId(null);
                setSortBy('newest');
              }}
              className="px-6 py-2.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
            >
              <span>Clear All Filters</span>
            </button>
          ) : (
            activeTab === 'created' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Set</span>
              </button>
            )
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {items.map((item) => {
          if (activeTab === 'created') {
            return (
              <LibrarySetCard
                key={item.id}
                item={item}
                onStudy={(id) => navigate(`/p/${id}`)}
                onEdit={handleEditSet}
                onDelete={handleDeleteSet}
              />
            );
          }

          const post = {
            id: item.id,
            type: 'study_set' as const,
            author: {
              name: item.creator?.username || 'Anonymous',
              username: item.creator?.username ? `@${item.creator.username}` : '@anonymous',
              avatar: item.creator?.avatar_url || (item.creator?.username ? item.creator.username.substring(0, 2).toUpperCase() : '??')
            },
            content: item.description || `Study set: ${item.title}`,
            timestamp: new Date(item.created_at).toLocaleDateString(),
            likes: 0, // RPC doesn't return likes directly for library content currently
            comments: 0,
            shares: 0,
            metadata: {
              title: item.title,
              subject: item.subject,
              cards_count: item.cards_count,
              rating: item.average_rating,
              total_ratings: item.total_ratings
            },
            onStudyNow: () => navigate(`/study/${item.id}`),
            onClone: () => handleCloneSet(item.id, item.title),
            is_bookmarked: activeTab === 'saved'
          };
          return <PostCard key={item.id} post={post} />;
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto lg:mx-0 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">My Library</h1>
        <button
          onClick={() => {
            setEditSetData(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>Create Set</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6 bg-white sticky top-16 lg:top-0 z-10">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex-1 py-4 text-sm sm:text-base font-bold transition-colors border-b-4 ${
            activeTab === 'created'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          My Sets
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-4 text-sm sm:text-base font-bold transition-colors border-b-4 ${
            activeTab === 'saved'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Saved
        </button>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
              searchQuery ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-2xl py-3 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-medium text-gray-700"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="a-z">A-Z</option>
            </select>
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Subject Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setFilterSubjectId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterSubjectId === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setFilterSubjectId(subject.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                filterSubjectId === subject.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              <span>{subject.emoji}</span>
              <span>{subject.name}</span>
            </button>
          ))}
        </div>
      </div>

      {renderContent()}

      <CreateSetModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditSetData(null);
        }}
        mode={editSetData ? 'edit' : 'create'}
        initialData={editSetData}
        onSuccess={() => {
            if (activeTab === 'created') fetchLibraryContent();
        }}
      />
    </div>
  );
};

export default LibraryPage;

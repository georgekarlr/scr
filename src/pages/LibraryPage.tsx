import React, { useEffect, useState } from 'react';
import { Loader2, BookOpen, Bookmark, Plus } from 'lucide-react';
import { libraryService } from '../services/libraryService';
import { LibraryContentItem, LibraryTabType } from '../types/library';
import PostCard from '../components/feed/PostCard';
import LibrarySetCard from '../components/library/LibrarySetCard';
import StudyModal from '../components/study/StudyModal';
import CreateSetModal from '../components/dashboard/CreateSetModal';
import { useToast } from '../contexts/ToastContext';
import { studyService } from '../services/studyService';

const LibraryPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<LibraryTabType>('created');
  const [items, setItems] = useState<LibraryContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studySetId, setStudySetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editSetData, setEditSetData] = useState<any>(null);

  const fetchLibraryContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryService.getLibraryContent(activeTab);
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch library content:', err);
      setError('Failed to load library content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryContent();
  }, [activeTab]);

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
            {activeTab === 'created' ? "You haven't created any sets yet" : "No bookmarked sets found"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            {activeTab === 'created' 
              ? "Start building your knowledge by creating your first study set." 
              : "Explore the community and save sets you want to study later."}
          </p>
          {activeTab === 'created' && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Set</span>
            </button>
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
                onStudy={(id) => setStudySetId(id)}
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
            onStudyNow: () => setStudySetId(item.id),
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

      {renderContent()}

      <StudyModal 
        setId={studySetId} 
        isOpen={!!studySetId} 
        onClose={() => setStudySetId(null)} 
      />
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

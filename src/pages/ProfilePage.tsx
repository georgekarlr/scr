import React, { useEffect, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { 
  Loader2, 
  Flame, 
  Clock, 
  BookOpen, 
  Calendar,
  Mail,
  CheckCircle2,
  TrendingUp,
  Edit
} from 'lucide-react';
import { profileService } from '../services/profileService';
import { MyProfileResponse } from '../types/profile';
import { useToast } from '../contexts/ToastContext';
import LibrarySetCard from '../components/library/LibrarySetCard';
import CreateSetModal from '../components/dashboard/CreateSetModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import { studyService } from '../services/studyService';
import { LibraryContentItem } from '../types/library';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editSetData, setEditSetData] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getMyProfile();
      setData(profileData);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditSet = async (item: LibraryContentItem) => {
    try {
      setLoading(true);
      const fullSet = await studyService.getSetForPlay(item.id);
      if (fullSet) {
        const subjects = await studyService.getSubjects();
        const subject = subjects.find(s => s.name === item.subject?.name);
        
        setEditSetData({
          id: item.id,
          title: item.title,
          description: item.description || '',
          subject_id: subject?.id || 0,
          is_public: item.is_public,
          tags: [],
          items: fullSet.items.map(i => ({
            id: i.id,
            type: i.type,
            content: i.content
          }))
        });
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
      fetchProfile();
    } catch (err) {
      console.error('Failed to delete set:', err);
      showToast('Failed to delete study set', 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button 
          onClick={fetchProfile}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats, sets } = data;

  // Format study time (seconds to hours/minutes)
  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 lg:pb-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 flex gap-2">
          <button 
            onClick={() => setIsEditProfileOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit profile"
          >
            <Edit className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-24 w-24 sm:h-32 sm:w-32 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-xl shadow-blue-100">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover rounded-3xl" />
            ) : (
              profile.username?.[0].toUpperCase()
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">{profile.full_name || profile.username}</h1>
            <p className="text-blue-600 font-bold mb-4">@{profile.username}</p>
            
            {profile.bio && (
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mb-6 leading-relaxed">
                {profile.bio}
              </p>
            )}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(profile.joined_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-50">
          <Link 
            to={`/u/${profile.username}/connections?tab=followers`}
            className="text-center hover:bg-gray-50 rounded-2xl py-2 transition-colors cursor-pointer"
          >
            <p className="text-2xl font-black text-gray-900">{profile.followers_count}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Followers</p>
          </Link>
          <Link 
            to={`/u/${profile.username}/connections?tab=following`}
            className="text-center border-l border-gray-50 hover:bg-gray-50 rounded-2xl py-2 transition-colors cursor-pointer"
          >
            <p className="text-2xl font-black text-gray-900">{profile.following_count}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Following</p>
          </Link>
          <div className="text-center border-l border-gray-50 py-2">
            <p className="text-2xl font-black text-gray-900">{profile.level}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Level</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-2xl font-black text-gray-900">{profile.total_xp.toLocaleString()}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total XP</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Streak</p>
            <p className="text-xl font-black text-orange-900">{profile.streak} Days</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Study Time</p>
            <p className="text-xl font-black text-blue-900">{formatStudyTime(stats.total_study_time)}</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-green-600 rounded-2xl flex items-center justify-center text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Reviewed</p>
            <p className="text-xl font-black text-green-900">{stats.cards_reviewed}</p>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Sessions</p>
            <p className="text-xl font-black text-purple-900">{stats.sessions_count}</p>
          </div>
        </div>
      </div>

      {/* My Study Sets */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-blue-600" />
            My Study Sets
          </h2>
          <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
            {sets.length} Total
          </span>
        </div>

        {sets.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
            <div className="h-20 w-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No study sets yet</h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Create your first study set to start your learning journey.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              Create New Set
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sets.map((set: any) => {
              // Map MySet to LibraryContentItem for reuse of LibrarySetCard
              const item: LibraryContentItem = {
                id: set.id,
                title: set.title,
                description: set.description,
                is_public: set.is_public,
                average_rating: set.average_rating || 0,
                total_ratings: set.total_ratings || 0,
                created_at: set.created_at,
                cards_count: set.cards_count,
                subject: set.subject || null,
                creator: {
                   username: profile.username,
                   avatar_url: profile.avatar_url
                }
              };

              return (
                <LibrarySetCard 
                  key={set.id}
                  item={item}
                  onStudy={(id) => navigate(`/p/${id}`)}
                  onEdit={handleEditSet}
                  onDelete={handleDeleteSet}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* No StudyModal here anymore, navigating to PostPage */}

      <CreateSetModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditSetData(null);
        }}
        mode={editSetData ? 'edit' : 'create'}
        initialData={editSetData}
        onSuccess={() => {
          fetchProfile();
        }}
      />

      <EditProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        onSuccess={fetchProfile}
      />
    </div>
  );
};

export default ProfilePage;

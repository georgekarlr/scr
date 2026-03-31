import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { User, Shield, School, Mail, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';
import { offlineSync } from '../utils/offlineSync.ts';

export const AccountPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const metadata = user?.user_metadata;

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Cache profile data when online
    if (navigator.onLine && profile) {
      offlineSync.cacheData('user_profile', profile);
    }

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [profile]);

  const displayProfile = profile || metadata;

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              <WifiOff size={16} />
              Offline Mode
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <User size={48} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {displayProfile?.first_name} {displayProfile?.last_name}
              </h2>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Shield size={12} />
                {displayProfile?.role?.replace('_', ' ') || 'User'}
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Profile Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <User size={12} /> First Name
                    </label>
                    <p className="text-sm font-semibold text-gray-900">{displayProfile?.first_name || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <User size={12} /> Last Name
                    </label>
                    <p className="text-sm font-semibold text-gray-900">{displayProfile?.last_name || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <Mail size={12} /> Email Address
                    </label>
                    <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <School size={12} /> School
                    </label>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile?.school_name || metadata?.school_name || metadata?.school_id || 'Not Assigned'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <Shield size={12} /> Account Status
                    </label>
                    <div className="flex items-center gap-1.5">
                      {profile?.status === 'approved' ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <AlertCircle size={14} className="text-amber-500" />
                      )}
                      <p className="text-sm font-semibold text-gray-900 capitalize">{profile?.status || 'Pending'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h4 className="text-blue-900 font-bold mb-2">Need to update your information?</h4>
              <p className="text-blue-700 text-sm mb-4">
                Profile updates currently require a stable internet connection. Please contact your school administrator if you need to change your assigned role or school.
              </p>
              <button
                disabled={!isOnline}
                onClick={() => refreshProfile()}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  isOnline 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isOnline ? 'Refresh Profile' : 'Refresh Unavailable Offline'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

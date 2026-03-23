import React, { useState, useEffect } from 'react'
import { registrarService } from '../../services/registrarService'
import { offlineSync } from '../../utils/offlineSync'
import { PendingProfile } from '../../types/registrar'
import { AppRole } from '../../types/auth'
import { Check, X, Clock, UserCheck } from 'lucide-react'

export const UserApprovalsPage: React.FC = () => {
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({})

  useEffect(() => {
    fetchPendingProfiles()
  }, [])

  const fetchPendingProfiles = async () => {
    setFetchLoading(true)
    const cached = await offlineSync.getCachedData('registrar_pending_profiles')
    if (cached) {
      setPendingProfiles(cached)
      const initialRoles: Record<string, AppRole> = {}
      cached.forEach((p: PendingProfile) => {
        initialRoles[p.id] = 'teacher'
      })
      setSelectedRoles(initialRoles)
    }

    if (!navigator.onLine && cached) {
      setFetchLoading(false)
      return
    }

    const { data, error } = await registrarService.getPendingProfiles()
    if (error) {
      console.error('Error fetching pending profiles:', error)
    } else if (data) {
      setPendingProfiles(data)
      offlineSync.cacheData('registrar_pending_profiles', data)
      // Initialize roles for selection, default to teacher or something sensible
      const initialRoles: Record<string, AppRole> = {}
      data.forEach(p => {
        initialRoles[p.id] = 'teacher'
      })
      setSelectedRoles(initialRoles)
    }
    setFetchLoading(false)
  }

  const handleApprove = async (profileId: string) => {
    if (!navigator.onLine) {
      setMessage({ type: 'error', text: 'Approving users requires an internet connection.' })
      return
    }

    setLoading(true)
    setMessage(null)
    const role = selectedRoles[profileId] || 'teacher'
    
    const { error } = await registrarService.approveProfile({
      p_profile_id: profileId,
      p_role: role
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to approve profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile approved successfully!' })
      fetchPendingProfiles()
    }
    setLoading(false)
  }

  const handleRoleChange = (profileId: string, role: AppRole) => {
    setSelectedRoles(prev => ({ ...prev, [profileId]: role }))
  }

  const roles: AppRole[] = ['teacher', 'moderator', 'registrar']

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="text-blue-600" size={32} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Approvals</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Pending Sign-ups</h2>
            <p className="text-sm text-gray-500">Review and approve new user accounts for your school.</p>
          </div>

          {fetchLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingProfiles.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No pending profiles found.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
                {pendingProfiles.map((profile) => (
                  <div key={profile.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{profile.first_name} {profile.last_name}</div>
                        <div className="text-sm text-gray-500">{profile.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign Role</label>
                      <select
                        value={selectedRoles[profile.id] || 'teacher'}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value as AppRole)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleApprove(profile.id)}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <Check size={16} />
                      Approve User
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Signed Up</th>
                      <th className="px-6 py-4 font-semibold">Assign Role</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingProfiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{profile.first_name} {profile.last_name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{profile.email}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={selectedRoles[profile.id] || 'teacher'}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as AppRole)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {roles.map(role => (
                              <option key={role} value={role}>{role.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleApprove(profile.id)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { registrarService } from '../../services/registrarService'
import { offlineSync } from '../../utils/offlineSync'
import { StaffProfile } from '../../types/registrar'
import { AppRole, ProfileStatus } from '../../types/auth'
import { Search, Edit2, X, Check, ShieldCheck } from 'lucide-react'

export const StaffDirectoryPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<StaffProfile | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setFetchLoading(true)
    const cached = await offlineSync.getCachedData('registrar_staff')
    if (cached) {
      setStaff(cached)
    }

    if (!navigator.onLine && cached) {
      setFetchLoading(false)
      return
    }

    const { data, error } = await registrarService.getStaff()
    if (error) {
      console.error('Error fetching staff:', error)
    } else if (data) {
      setStaff(data)
      offlineSync.cacheData('registrar_staff', data)
    }
    setFetchLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData) return

    if (!navigator.onLine) {
      alert('Updating staff members requires an internet connection.')
      return
    }

    setLoading(true)

    const { error } = await registrarService.updateStaffRole({
      p_profile_id: editFormData.id,
      p_role: editFormData.role,
      p_status: editFormData.status,
    })

    if (error) {
      alert(error.message || 'Failed to update staff member')
    } else {
      setEditingId(null)
      setEditFormData(null)
      fetchStaff()
    }
    setLoading(false)
  }

  const startEditing = (member: StaffProfile) => {
    setEditingId(member.id)
    setEditFormData({ ...member })
  }

  const filteredStaff = staff.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roles: AppRole[] = ['teacher', 'moderator', 'registrar']
  const statuses: ProfileStatus[] = ['pending', 'approved', 'rejected']

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-blue-600" size={32} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Directory</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Staff Roles</h2>
              <p className="text-sm text-gray-500">Update roles and account status for school personnel.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
          </div>

          {fetchLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm ? 'No staff members match your search.' : 'No staff members found.'}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
                {filteredStaff.map((member) => (
                  <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{member.first_name} {member.last_name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                      <div>
                        {editingId === member.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={handleUpdate}
                              disabled={loading}
                              className="p-1.5 text-green-600 bg-green-50 rounded-lg"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditFormData(null); }}
                              className="p-1.5 text-red-600 bg-red-50 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(member)}
                            className="p-1.5 text-gray-400 bg-gray-50 rounded-lg hover:text-blue-600"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</label>
                        {editingId === member.id ? (
                          <select
                            value={editFormData?.role}
                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, role: e.target.value as AppRole } : null)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {roles.map(r => (
                              <option key={r} value={r}>{r.replace('_', ' ')}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm capitalize text-gray-700 font-medium">
                            {member.role.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                        {editingId === member.id ? (
                          <select
                            value={editFormData?.status}
                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, status: e.target.value as ProfileStatus } : null)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {statuses.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              member.status === 'approved' ? 'bg-green-50 text-green-700' :
                              member.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{member.first_name} {member.last_name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{member.email}</td>
                        <td className="px-6 py-4">
                          {editingId === member.id ? (
                            <select
                              value={editFormData?.role}
                              onChange={(e) => setEditFormData(prev => prev ? { ...prev, role: e.target.value as AppRole } : null)}
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {roles.map(r => (
                                <option key={r} value={r}>{r.replace('_', ' ')}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm capitalize text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                              {member.role.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === member.id ? (
                            <select
                              value={editFormData?.status}
                              onChange={(e) => setEditFormData(prev => prev ? { ...prev, status: e.target.value as ProfileStatus } : null)}
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              member.status === 'approved' ? 'bg-green-50 text-green-700' :
                              member.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {member.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingId === member.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Save"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditFormData(null); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(member)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
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

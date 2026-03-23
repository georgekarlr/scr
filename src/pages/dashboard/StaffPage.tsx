import React, { useState, useEffect } from 'react'
import { schoolAdminService } from '../../services/schoolAdminService'
import { InviteStaffParams, StaffProfile } from '../../types/schoolAdmin'
import { AppRole } from '../../types/auth'
import { Edit2, Trash2, X, Check, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export const StaffPage: React.FC = () => {
  const { profile: currentProfile } = useAuth()
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [formData, setFormData] = useState<InviteStaffParams>({
    p_email: '',
    p_first_name: '',
    p_last_name: '',
    p_role: 'teacher',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editFormData, setEditFormData] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; staffId: string | null }>({
    isOpen: false,
    staffId: null,
  })

  const fetchStaff = async () => {
    setFetchLoading(true)
    const { data, error } = await schoolAdminService.getStaff()
    if (error) {
      console.error('Error fetching staff:', error)
    } else if (data) {
      setStaff(data)
    }
    setFetchLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      await fetchStaff()
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await schoolAdminService.inviteStaff(formData)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to invite staff' })
    } else {
      setMessage({ type: 'success', text: 'Staff invited successfully!' })
      setFormData({ p_email: '', p_first_name: '', p_last_name: '', p_role: 'teacher' })
      setIsAdding(false)
      fetchStaff()
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData) return
    setLoading(true)

    const { error } = await schoolAdminService.updateStaff({
      p_profile_id: editFormData.id,
      p_first_name: editFormData.first_name,
      p_last_name: editFormData.last_name,
      p_role: editFormData.role,
      p_status: editFormData.status,
    })

    if (error) {
      alert(error.message || 'Failed to update staff')
    } else {
      setEditingId(null)
      setEditFormData(null)
      fetchStaff()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (id === currentProfile?.profile_id) {
      alert('You cannot delete your own admin account.')
      return
    }
    setDeleteModal({ isOpen: true, staffId: id })
  }

  const confirmDelete = async () => {
    if (!deleteModal.staffId) return

    setLoading(true)
    const { error } = await schoolAdminService.removeStaff(deleteModal.staffId)
    if (error) {
      alert(error.message || 'Failed to remove staff')
    } else {
      fetchStaff()
      setDeleteModal({ isOpen: false, staffId: null })
    }
    setLoading(false)
  }

  const startEditing = (member: StaffProfile) => {
    setEditingId(member.id)
    setEditFormData({ ...member })
  }

  const staffRoles: AppRole[] = ['registrar', 'moderator', 'teacher', 'school_admin']
  const statusOptions = ['pending', 'active', 'rejected']

  return (
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-gray-500 mt-1">Manage school personnel, roles, and access permissions.</p>
            </div>
            <button
                onClick={() => setIsAdding(!isAdding)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
                    isAdding
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
            >
              {isAdding ? (
                  <>
                    <X size={20} />
                    <span>Cancel</span>
                  </>
              ) : (
                  <>
                    <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl leading-none">+</span>
                    </div>
                    <span>Invite Staff</span>
                  </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Invite Form */}
            {isAdding && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm max-w-2xl">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                      Invite New Staff
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">First Name</label>
                          <input
                              type="text"
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                              value={formData.p_first_name}
                              onChange={(e) => setFormData({ ...formData, p_first_name: e.target.value })}
                              placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Last Name</label>
                          <input
                              type="text"
                              required
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                              value={formData.p_last_name}
                              onChange={(e) => setFormData({ ...formData, p_last_name: e.target.value })}
                              placeholder="Doe"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Email Address</label>
                          <div className="relative">
                            <input
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                value={formData.p_email}
                                onChange={(e) => setFormData({ ...formData, p_email: e.target.value })}
                                placeholder="john.doe@school.edu"
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Assigned Role</label>
                          <select
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all capitalize appearance-none"
                              value={formData.p_role}
                              onChange={(e) => setFormData({ ...formData, p_role: e.target.value as AppRole })}
                          >
                            {staffRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role.replace('_', ' ')}
                                </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {message && (
                          <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                            {message.text}
                          </div>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-blue-200"
                        >
                          {loading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Inviting...</span>
                              </div>
                          ) : 'Invite Staff Member'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
            )}

            {/* List */}
            <div className="w-full">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Staff Directory</h2>
                  <div className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">
                    Total: {staff.length}
                  </div>
                </div>

                {fetchLoading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-500 font-medium">Loading staff members...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Mail size={24} />
                      </div>
                      <p className="text-gray-500 font-medium">No staff members found.</p>
                      <p className="text-sm text-gray-400 mt-1">Click the "Invite Staff" button to add your first member.</p>
                    </div>
                ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                        {staff.map((member) => (
                          <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                  {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  {editingId === member.id ? (
                                    <div className="flex flex-col gap-2">
                                      <input
                                        type="text"
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg w-full"
                                        value={editFormData?.first_name || ''}
                                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                                      />
                                      <input
                                        type="text"
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg w-full"
                                        value={editFormData?.last_name || ''}
                                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div className="font-bold text-gray-900 truncate">{member.first_name} {member.last_name}</div>
                                      <div className="text-xs text-gray-500 truncate">{member.email}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {editingId === member.id ? (
                                  <>
                                    <button onClick={handleUpdate} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg"><Check size={18} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 bg-gray-50 rounded-lg"><X size={18} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing(member)} className="p-1.5 text-gray-400 bg-gray-50 rounded-lg hover:text-blue-600"><Edit2 size={18} /></button>
                                    <button 
                                      onClick={() => handleDelete(member.id)} 
                                      disabled={member.id === currentProfile?.profile_id}
                                      className={`p-1.5 text-gray-400 bg-gray-50 rounded-lg hover:text-red-600 ${member.id === currentProfile?.profile_id ? 'opacity-20 cursor-not-allowed' : ''}`}
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Role</label>
                                {editingId === member.id ? (
                                  <select
                                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg w-full capitalize"
                                    value={editFormData?.role || 'teacher'}
                                    onChange={(e) => setEditFormData(prev => prev ? { ...prev, role: e.target.value as AppRole } : null)}
                                  >
                                    {staffRoles.map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                                  </select>
                                ) : (
                                  <div className="text-sm font-semibold text-gray-700 capitalize">{member.role.replace('_', ' ')}</div>
                                )}
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                                {editingId === member.id ? (
                                  <select
                                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg w-full capitalize"
                                    value={editFormData?.status || 'pending'}
                                    onChange={(e) => setEditFormData(prev => prev ? { ...prev, status: e.target.value } : null)}
                                  >
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                    member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    member.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}>
                                    {member.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                            <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Status</th>
                            <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                          {staff.map((member) => (
                              <tr key={member.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-5">
                                  {editingId === member.id ? (
                                      <div className="flex flex-col gap-2 max-w-[200px]">
                                        <input
                                            type="text"
                                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                                            value={editFormData?.first_name || ''}
                                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                                        />
                                        <input
                                            type="text"
                                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                                            value={editFormData?.last_name || ''}
                                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                                        />
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="font-bold text-gray-900">{member.first_name} {member.last_name}</div>
                                          <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                            <Mail size={14} className="text-gray-400" />
                                            {member.email}
                                          </div>
                                        </div>
                                      </div>
                                  )}
                                </td>
                                <td className="px-8 py-5">
                                  {editingId === member.id ? (
                                      <div className="flex flex-col gap-2 max-w-[150px]">
                                        <select
                                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-full capitalize"
                                            value={editFormData?.role || 'teacher'}
                                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, role: e.target.value as AppRole } : null)}
                                        >
                                          {staffRoles.map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                                        </select>
                                        <select
                                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-full capitalize"
                                            value={editFormData?.status || 'pending'}
                                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, status: e.target.value } : null)}
                                        >
                                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      </div>
                                  ) : (
                                      <div className="flex flex-col gap-1.5">
                                  <span className="text-sm font-semibold text-gray-700 capitalize">
                                    {member.role.replace('_', ' ')}
                                  </span>
                                        <div className="flex">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                        member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            member.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                      {member.status}
                                    </span>
                                        </div>
                                      </div>
                                  )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <div className="flex justify-end gap-2">
                                    {editingId === member.id ? (
                                        <>
                                          <button
                                              onClick={handleUpdate}
                                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                              title="Save"
                                          >
                                            <Check size={20} />
                                          </button>
                                          <button
                                              onClick={() => setEditingId(null)}
                                              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                              title="Cancel"
                                          >
                                            <X size={20} />
                                          </button>
                                        </>
                                    ) : (
                                        <>
                                          <button
                                              onClick={() => startEditing(member)}
                                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                              title="Edit"
                                          >
                                            <Edit2 size={18} />
                                          </button>
                                          <button
                                              onClick={() => handleDelete(member.id)}
                                              className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all ${member.id === currentProfile?.profile_id ? 'opacity-20 cursor-not-allowed' : ''}`}
                                              disabled={member.id === currentProfile?.profile_id}
                                              title={member.id === currentProfile?.profile_id ? "Cannot delete yourself" : "Delete"}
                                          >
                                            <Trash2 size={18} />
                                          </button>
                                        </>
                                    )}
                                  </div>
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
        </div>

        <ConfirmationModal
            isOpen={deleteModal.isOpen}
            title="Remove Staff Member"
            message="Are you sure you want to remove this staff member? This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setDeleteModal({ isOpen: false, staffId: null })}
            loading={loading}
        />
      </div>
  )
}

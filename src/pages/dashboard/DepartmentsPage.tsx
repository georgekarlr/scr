import React, { useState, useEffect } from 'react'
import { schoolAdminService } from '../../services/schoolAdminService'
import { CreateDepartmentParams, Department, Moderator } from '../../types/schoolAdmin'
import { Edit2, Trash2, X, Check } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [formData, setFormData] = useState<CreateDepartmentParams>({
    p_name: '',
    p_moderator_id: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editFormData, setEditFormData] = useState<Department | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; departmentId: string | null }>({
    isOpen: false,
    departmentId: null,
  })

  const fetchDepartments = async () => {
    setFetchLoading(true)
    const { data, error } = await schoolAdminService.getDepartments()
    if (error) {
      console.error('Error fetching departments:', error)
    } else if (data) {
      setDepartments(data)
    }
    setFetchLoading(false)
  }

  const fetchModerators = async () => {
    const { data, error } = await schoolAdminService.getModerators()
    if (error) {
      console.error('Error fetching moderators:', error)
    } else if (data) {
      setModerators(data)
    }
  }

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchDepartments(),
        fetchModerators()
      ])
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await schoolAdminService.createDepartment({
      ...formData,
      p_moderator_id: formData.p_moderator_id || null,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create department' })
    } else {
      setMessage({ type: 'success', text: 'Department created successfully!' })
      setFormData({ p_name: '', p_moderator_id: '' })
      setIsAdding(false)
      fetchDepartments()
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData) return
    setLoading(true)

    const { error } = await schoolAdminService.updateDepartment({
      p_id: editFormData.id,
      p_name: editFormData.name,
      p_moderator_id: editFormData.moderator_id,
    })

    if (error) {
      alert(error.message || 'Failed to update department')
    } else {
      setEditingId(null)
      setEditFormData(null)
      fetchDepartments()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleteModal({ isOpen: true, departmentId: id })
  }

  const confirmDelete = async () => {
    if (!deleteModal.departmentId) return
    
    setLoading(true)
    const { error } = await schoolAdminService.deleteDepartment(deleteModal.departmentId)
    if (error) {
      alert(error.message || 'Failed to delete department')
    } else {
      fetchDepartments()
      setDeleteModal({ isOpen: false, departmentId: null })
    }
    setLoading(false)
  }

  const startEditing = (dept: Department) => {
    setEditingId(dept.id)
    setEditFormData({ ...dept })
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Departments</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Manage academic departments and assign moderators.</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all shadow-sm ${
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
                <span>Add Department</span>
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Create Form */}
          {isAdding && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm max-w-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  Create New Department
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Department Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                        value={formData.p_name}
                        onChange={(e) => setFormData({ ...formData, p_name: e.target.value })}
                        placeholder="e.g., Mathematics Department"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Moderator (Optional)</label>
                      <select
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                        value={formData.p_moderator_id || ''}
                        onChange={(e) => setFormData({ ...formData, p_moderator_id: e.target.value })}
                      >
                        <option value="">Select a moderator</option>
                        {moderators.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.first_name} {mod.last_name} ({mod.email})
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

                  <div className="flex flex-col-reverse xs:flex-row justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-6 py-2.5 sm:py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white font-bold px-8 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-blue-200 text-sm sm:text-base"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creating...</span>
                        </div>
                      ) : 'Create Department'}
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
                <h2 className="text-xl font-bold text-gray-900">Existing Departments</h2>
                <div className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">
                  Total: {departments.length}
                </div>
              </div>
              
              {fetchLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500 font-medium">Loading departments...</p>
                </div>
              ) : departments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-gray-200" size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">No departments created yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Click the "Add Department" button to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      {editingId === dept.id ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                            <div className="xs:col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Department Name</label>
                              <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                value={editFormData?.name || ''}
                                onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                              />
                            </div>
                            <div className="xs:col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Moderator</label>
                              <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                value={editFormData?.moderator_id || ''}
                                onChange={(e) => setEditFormData(prev => prev ? { ...prev, moderator_id: e.target.value || null } : null)}
                              >
                                <option value="">No Moderator</option>
                                {moderators.map((mod) => (
                                  <option key={mod.id} value={mod.id}>
                                    {mod.first_name} {mod.last_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex flex-col-reverse xs:flex-row justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-4 py-2.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              {loading ? 'Saving...' : (
                                <>
                                  <Check size={16} />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                              <span className="text-indigo-600 font-bold text-base sm:text-lg">{dept.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">{dept.name}</h3>
                              <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                                {dept.moderator_first_name ? (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-md uppercase tracking-wider">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                    Moderator: {dept.moderator_first_name} {dept.moderator_last_name}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] sm:text-xs font-bold rounded-md uppercase tracking-wider">
                                    No Moderator Assigned
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => startEditing(dept)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(dept.id)}
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, departmentId: null })}
        loading={loading}
      />
    </div>
  )
}

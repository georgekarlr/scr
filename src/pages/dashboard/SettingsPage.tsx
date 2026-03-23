import React, { useState, useEffect } from 'react'
import { schoolAdminService } from '../../services/schoolAdminService'
import { offlineSync } from '../../utils/offlineSync'
import { CreateGradingPeriodParams, GradingPeriod } from '../../types/schoolAdmin'
import { Edit2, Trash2, X, Check } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export const SettingsPage: React.FC = () => {
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([])
  const [formData, setFormData] = useState<CreateGradingPeriodParams>({
    p_name: '',
    p_weight: 100,
    p_start_date: '',
    p_end_date: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editFormData, setEditFormData] = useState<GradingPeriod | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; periodId: string | null }>({
    isOpen: false,
    periodId: null,
  })

  const fetchGradingPeriods = async () => {
    setFetchLoading(true)
    const cached = await offlineSync.getCachedData('admin_grading_periods')
    if (cached) {
      setGradingPeriods(cached)
    }

    if (!navigator.onLine && cached) {
      setFetchLoading(false)
      return
    }

    const { data, error } = await schoolAdminService.getGradingPeriods()
    if (error) {
      console.error('Error fetching grading periods:', error)
    } else if (data) {
      setGradingPeriods(data)
      offlineSync.cacheData('admin_grading_periods', data)
    }
    setFetchLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      await fetchGradingPeriods()
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!navigator.onLine) {
      setMessage({ type: 'error', text: 'Creating grading periods requires an internet connection.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await schoolAdminService.createGradingPeriod({
      ...formData,
      p_start_date: formData.p_start_date || null,
      p_end_date: formData.p_end_date || null,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create grading period' })
    } else {
      setMessage({ type: 'success', text: 'Grading period created successfully!' })
      setFormData({ p_name: '', p_weight: 100, p_start_date: '', p_end_date: '' })
      setIsAdding(false)
      fetchGradingPeriods()
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData) return

    if (!navigator.onLine) {
      alert('Updating grading periods requires an internet connection.')
      return
    }

    setLoading(true)

    const { error } = await schoolAdminService.updateGradingPeriod({
      p_id: editFormData.id,
      p_name: editFormData.name,
      p_weight: editFormData.weight,
      p_start_date: editFormData.start_date,
      p_end_date: editFormData.end_date,
    })

    if (error) {
      alert(error.message || 'Failed to update grading period')
    } else {
      setEditingId(null)
      setEditFormData(null)
      fetchGradingPeriods()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleteModal({ isOpen: true, periodId: id })
  }

  const confirmDelete = async () => {
    if (!deleteModal.periodId) return

    if (!navigator.onLine) {
      alert('Deleting grading periods requires an internet connection.')
      setDeleteModal({ isOpen: false, periodId: null })
      return
    }
    
    setLoading(true)
    const { error } = await schoolAdminService.deleteGradingPeriod(deleteModal.periodId)
    if (error) {
      alert(error.message || 'Failed to delete grading period')
    } else {
      fetchGradingPeriods()
      setDeleteModal({ isOpen: false, periodId: null })
    }
    setLoading(false)
  }

  const startEditing = (period: GradingPeriod) => {
    setEditingId(period.id)
    setEditFormData({ ...period })
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">School Settings</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your school's grading periods and weights.</p>
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
                <span>Add Grading Period</span>
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
                  Create Grading Period
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Period Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm sm:text-base"
                        value={formData.p_name}
                        onChange={(e) => setFormData({ ...formData, p_name: e.target.value })}
                        placeholder="e.g., First Quarter"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Weight (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                            value={formData.p_weight}
                            onChange={(e) => setFormData({ ...formData, p_weight: parseInt(e.target.value) || 0 })}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">Start Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                          value={formData.p_start_date || ''}
                          onChange={(e) => setFormData({ ...formData, p_start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-tight">End Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                          value={formData.p_end_date || ''}
                          onChange={(e) => setFormData({ ...formData, p_end_date: e.target.value })}
                        />
                      </div>
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
                      ) : 'Create Period'}
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
                <h2 className="text-xl font-bold text-gray-900">Grading Periods</h2>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  Total Weight: {gradingPeriods.reduce((acc, p) => acc + p.weight, 0)}%
                </div>
              </div>
              
              {fetchLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500 font-medium">Loading periods...</p>
                </div>
              ) : gradingPeriods.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit2 className="text-gray-300" size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">No grading periods defined yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Click the "Add Grading Period" button to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {gradingPeriods.map((period) => (
                    <div key={period.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      {editingId === period.id ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                            <div className="xs:col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Name</label>
                              <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                value={editFormData?.name || ''}
                                onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Weight (%)</label>
                              <input
                                type="number"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                value={editFormData?.weight || 0}
                                onChange={(e) => setEditFormData(prev => prev ? { ...prev, weight: parseInt(e.target.value) || 0 } : null)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Start</label>
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                  value={editFormData?.start_date || ''}
                                  onChange={(e) => setEditFormData(prev => prev ? { ...prev, start_date: e.target.value } : null)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">End</label>
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                  value={editFormData?.end_date || ''}
                                  onChange={(e) => setEditFormData(prev => prev ? { ...prev, end_date: e.target.value } : null)}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col-reverse xs:flex-row justify-end gap-3 pt-2">
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
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-bold">{period.weight}%</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg leading-tight">{period.name}</h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                  {period.start_date || 'No start date'}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                                  {period.end_date || 'No end date'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => startEditing(period)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(period.id)}
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
        title="Delete Grading Period"
        message="Are you sure you want to delete this grading period? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, periodId: null })}
        loading={loading}
      />
    </div>
  )
}

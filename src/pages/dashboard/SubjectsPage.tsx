import React, { useState, useEffect } from 'react'
import { subjectService } from '../../services/subjectService'
import { CreateSubjectParams, Subject } from '../../types/subject'
import { Edit2, Trash2, X, Check, Plus, BookOpen, Loader2, Search } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [formData, setFormData] = useState<CreateSubjectParams>({
    p_name: '',
    p_code: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editFormData, setEditFormData] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subjectId: string | null }>({
    isOpen: false,
    subjectId: null,
  })

  const fetchSubjects = async () => {
    setFetchLoading(true)
    const { data, error } = await subjectService.getSubjects()
    if (error) {
      console.error('Error fetching subjects:', error)
    } else if (data) {
      setSubjects(data)
    }
    setFetchLoading(false)
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.p_name.trim()) return

    setLoading(true)
    setMessage(null)

    const { error } = await subjectService.createSubject({
      p_name: formData.p_name.trim(),
      p_code: formData.p_code?.trim() || null,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create subject' })
    } else {
      setMessage({ type: 'success', text: 'Subject created successfully!' })
      setFormData({ p_name: '', p_code: '' })
      setIsAdding(false)
      fetchSubjects()
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData || !editFormData.name.trim()) return
    setLoading(true)

    const { error } = await subjectService.updateSubject({
      p_id: editFormData.id,
      p_name: editFormData.name.trim(),
      p_code: editFormData.code?.trim() || null,
    })

    if (error) {
      alert(error.message || 'Failed to update subject')
    } else {
      setEditingId(null)
      setEditFormData(null)
      fetchSubjects()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleteModal({ isOpen: true, subjectId: id })
  }

  const confirmDelete = async () => {
    if (!deleteModal.subjectId) return
    
    setLoading(true)
    const { error } = await subjectService.deleteSubject(deleteModal.subjectId)
    if (error) {
      alert(error.message || 'Failed to delete subject')
    } else {
      fetchSubjects()
      setDeleteModal({ isOpen: false, subjectId: null })
    }
    setLoading(false)
  }

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            Subject Catalog
          </h1>
          <p className="text-gray-500 mt-1">Manage the list of subjects offered in your school.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add New Subject
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-8 bg-white p-6 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Create New Subject</h2>
            <button 
              onClick={() => { setIsAdding(false); setMessage(null); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.p_name}
                  onChange={(e) => setFormData({ ...formData, p_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Subject Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MATH101"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.p_code || ''}
                  onChange={(e) => setFormData({ ...formData, p_code: e.target.value })}
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setMessage(null); }}
                className="px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Create Subject
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetchLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                      <span className="text-sm">Loading subjects...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen size={32} className="text-gray-200" />
                      <span className="text-sm">{searchTerm ? 'No subjects found matching your search.' : 'No subjects in the catalog yet.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === subject.id ? (
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editFormData?.name || ''}
                          onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                          autoFocus
                        />
                      ) : (
                        <div className="font-semibold text-gray-900">{subject.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === subject.id ? (
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editFormData?.code || ''}
                          onChange={(e) => setEditFormData(prev => prev ? { ...prev, code: e.target.value } : null)}
                        />
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subject.code ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500 italic'}`}>
                          {subject.code || 'No code'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === subject.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save changes"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditFormData(null); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel editing"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(subject.id); setEditFormData(subject); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit subject"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete subject"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone and may affect any classes using this subject."
        confirmText="Delete Subject"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, subjectId: null })}
        loading={loading}
        variant="danger"
      />
    </div>
  )
}

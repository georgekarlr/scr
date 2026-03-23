import React, { useState, useEffect } from 'react'
import { registrarService } from '../../services/registrarService'
import { Student, CreateStudentParams } from '../../types/registrar'
import { Plus, Search, Edit2, Trash2, X, Check, Users } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export const MasterRosterPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState<CreateStudentParams>({
    p_student_id_number: '',
    p_first_name: '',
    p_last_name: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; studentId: string | null }>({
    isOpen: false,
    studentId: null,
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setFetchLoading(true)
    const { data, error } = await registrarService.getStudents()
    if (error) {
      console.error('Error fetching students:', error)
    } else if (data) {
      setStudents(data)
    }
    setFetchLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (editingStudent) {
      const { error } = await registrarService.updateStudent({
        p_id: editingStudent.id,
        p_student_id_number: formData.p_student_id_number,
        p_first_name: formData.p_first_name,
        p_last_name: formData.p_last_name,
      })
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to update student' })
      } else {
        setMessage({ type: 'success', text: 'Student updated successfully!' })
        setEditingStudent(null)
        setShowAddModal(false)
        fetchStudents()
      }
    } else {
      const { error } = await registrarService.createStudent(formData)
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to create student' })
      } else {
        setMessage({ type: 'success', text: 'Student added successfully!' })
        setFormData({ p_student_id_number: '', p_first_name: '', p_last_name: '' })
        setShowAddModal(false)
        fetchStudents()
      }
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleteModal({ isOpen: true, studentId: id })
  }

  const confirmDelete = async () => {
    if (!deleteModal.studentId) return
    setLoading(true)
    const { error } = await registrarService.deleteStudent(deleteModal.studentId)
    if (error) {
      alert(error.message || 'Failed to delete student')
    } else {
      fetchStudents()
      setDeleteModal({ isOpen: false, studentId: null })
    }
    setLoading(false)
  }

  const startEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      p_student_id_number: student.student_id_number,
      p_first_name: student.first_name,
      p_last_name: student.last_name,
    })
    setShowAddModal(true)
  }

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Master Roster</h1>
          </div>
          <button
            onClick={() => {
              setEditingStudent(null)
              setFormData({ p_student_id_number: '', p_first_name: '', p_last_name: '' })
              setShowAddModal(true)
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            Add Student
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Student Database</h2>
              <p className="text-sm text-gray-500">Manage the list of all students enrolled in the school.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
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
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm ? 'No students match your search.' : 'No students found in the roster.'}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{student.last_name}, {student.first_name}</div>
                        <div className="text-xs font-mono text-gray-500 uppercase">{student.student_id_number}</div>
                      </div>
                      <div>
                        {student.has_account ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Check size={10} /> Registered
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] italic font-medium uppercase tracking-wider">No account</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => startEdit(student)}
                        className="flex-1 inline-flex items-center justify-center gap-2 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">ID Number</th>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{student.student_id_number}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{student.last_name}, {student.first_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          {student.has_account ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded-full">
                              <Check size={12} /> Registered
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">No account</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(student)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID Number</label>
                <input
                  type="text"
                  required
                  value={formData.p_student_id_number}
                  onChange={(e) => setFormData({ ...formData, p_student_id_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2023-0001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.p_first_name}
                    onChange={(e) => setFormData({ ...formData, p_first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.p_last_name}
                    onChange={(e) => setFormData({ ...formData, p_last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Student"
        message="Are you sure you want to delete this student record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, studentId: null })}
        loading={loading}
      />
    </div>
  )
}

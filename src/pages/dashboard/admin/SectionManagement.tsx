import React, { useEffect, useState } from 'react';
import { LayoutGrid, Search, Plus, X, Edit2, Trash2, User } from 'lucide-react';
import { sectionService } from '../../../services/sectionService';
import { userService } from '../../../services/userService';
import { Section } from '../../../types/section';
import { UserProfile } from '../../../types/auth';
import StatusMessage from '../../../components/ui/StatusMessage';

const SectionManagement: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    academic_year: '',
    adviser_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await sectionService.getSections({ search_term: searchTerm });
    if (error) {
      setError(error.message || 'Failed to fetch sections');
    } else if (data) {
      setSections(data);
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data, error } = await userService.listSchoolUsers('teacher');
    if (!error && data) {
      setTeachers(data);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSections();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenModal = (section?: Section) => {
    if (section) {
      setSelectedSection(section);
      setFormData({
        name: section.name,
        grade_level: section.grade_level,
        academic_year: section.academic_year,
        adviser_id: section.adviser_id || ''
      });
    } else {
      setSelectedSection(null);
      setFormData({
        name: '',
        grade_level: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        adviser_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    let result;
    if (selectedSection) {
      result = await sectionService.updateSection(
        selectedSection.id,
        formData.name,
        formData.grade_level,
        formData.academic_year,
        formData.adviser_id || null
      );
    } else {
      result = await sectionService.createSection(
        formData.name,
        formData.grade_level,
        formData.academic_year,
        formData.adviser_id || null
      );
    }

    if (result.error) {
      setError(result.error.message || 'An error occurred while saving the section');
    } else {
      setIsModalOpen(false);
      fetchSections();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    const { error } = await sectionService.deleteSection(id);
    if (error) {
      setError(error.message || 'Failed to delete section');
    } else {
      fetchSections();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Section Management</h1>
          <p className="text-gray-600">Manage school sections, grade levels, and assigned advisers.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Section
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by section name or grade level..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <StatusMessage status="error" message={error} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Section Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Grade Level</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Academic Year</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Adviser</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading sections...</span>
                    </div>
                  </td>
                </tr>
              ) : sections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No sections found.
                  </td>
                </tr>
              ) : (
                sections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{section.name}</td>
                    <td className="px-6 py-4 text-gray-600">{section.grade_level}</td>
                    <td className="px-6 py-4 text-gray-600">{section.academic_year}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {section.adviser_first_name ? (
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span>{section.adviser_first_name} {section.adviser_last_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">No adviser assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(section)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(section.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedSection ? 'Edit Section' : 'Add New Section'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Section A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grade 7"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2023-2024"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adviser (Optional)
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.adviser_id}
                  onChange={(e) => setFormData({ ...formData, adviser_id: e.target.value })}
                >
                  <option value="">Select an adviser</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    selectedSection ? 'Update Section' : 'Create Section'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionManagement;

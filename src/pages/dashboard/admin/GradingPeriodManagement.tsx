import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, X, Edit2, Trash2, CheckCircle, Circle, Filter } from 'lucide-react';
import { gradingPeriodService } from '../../../services/gradingPeriodService';
import { academicYearService } from '../../../services/academicYearService';
import { GradingPeriod, GradingPeriodFilters } from '../../../types/gradingPeriod';
import { AcademicYear } from '../../../types/academicYear';
import ErrorModal from '../../../components/ui/ErrorModal';
import StatusMessage from '../../../components/ui/StatusMessage';

const GradingPeriodManagement: React.FC = () => {
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<GradingPeriod | null>(null);
  const [filters, setFilters] = useState<GradingPeriodFilters>({
    filter_academic_year_id: '',
    filter_semester: '',
    filter_department: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    department: 'College',
    academic_year_id: '',
    semester: '1st Semester',
    required_payment_percentage: 100,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [gpResult, ayResult] = await Promise.all([
      gradingPeriodService.getGradingPeriods(filters),
      academicYearService.getAcademicYears()
    ]);

    if (gpResult.error) {
      setError(gpResult.error.message || 'Failed to fetch grading periods');
    } else if (gpResult.data) {
      setGradingPeriods(gpResult.data);
    }

    if (ayResult.error) {
      console.error('Failed to fetch academic years', ayResult.error);
    } else if (ayResult.data) {
      setAcademicYears(ayResult.data);
      // If we have academic years and no academic year is selected in form, pick the active one or first one
      if (ayResult.data.length > 0 && !formData.academic_year_id) {
        const activeYear = ayResult.data.find(y => y.is_active) || ayResult.data[0];
        setFormData(prev => ({ ...prev, academic_year_id: activeYear.id }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleOpenModal = (period?: GradingPeriod) => {
    if (period) {
      setSelectedPeriod(period);
      setFormData({
        name: period.name,
        department: period.department,
        academic_year_id: period.academic_year_id,
        semester: period.semester,
        required_payment_percentage: period.required_payment_percentage,
        is_active: period.is_active
      });
    } else {
      setSelectedPeriod(null);
      const activeYear = academicYears.find(y => y.is_active) || academicYears[0];
      setFormData({
        name: '',
        department: filters.filter_department || 'College',
        academic_year_id: activeYear?.id || '',
        semester: '1st Semester',
        required_payment_percentage: 100,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    let result;
    if (selectedPeriod) {
      result = await gradingPeriodService.updateGradingPeriod(
        selectedPeriod.id,
        formData.name,
        formData.department,
        formData.academic_year_id,
        formData.semester,
        formData.required_payment_percentage,
        formData.is_active
      );
    } else {
      result = await gradingPeriodService.createGradingPeriod(
        formData.name,
        formData.department,
        formData.academic_year_id,
        formData.semester,
        formData.required_payment_percentage,
        formData.is_active
      );
    }

    if (result.error) {
      setError(result.error.message || 'An error occurred while saving the grading period');
    } else {
      setIsModalOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this grading period?')) return;

    const { error } = await gradingPeriodService.deleteGradingPeriod(id);
    if (error) {
      setError(error.message || 'Failed to delete grading period');
    } else {
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grading Period Management</h1>
          <p className="text-gray-600">Create and manage grading periods for each semester.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Grading Period
        </button>
      </div>

      <ErrorModal 
        isOpen={!!error} 
        message={error} 
        onClose={() => setError('')} 
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select 
            value={filters.filter_department || ''}
            onChange={(e) => setFilters({ ...filters, filter_department: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">All Departments</option>
            <option value="College">College</option>
            <option value="Junior High School">Junior High School</option>
            <option value="Senior High School">Senior High School</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Filter size={14} /> Academic Year
          </label>
          <select 
            value={filters.filter_academic_year_id || ''}
            onChange={(e) => setFilters({ ...filters, filter_academic_year_id: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">All Academic Years</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select 
            value={filters.filter_semester || ''}
            onChange={(e) => setFilters({ ...filters, filter_semester: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">All Semesters</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
        <button 
          onClick={() => setFilters({ filter_academic_year_id: '', filter_semester: '', filter_department: 'College' })}
          className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Academic Year</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Semester</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Payment %</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading grading periods...
                  </td>
                </tr>
              ) : gradingPeriods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No grading periods found.
                  </td>
                </tr>
              ) : (
                gradingPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <ClipboardList size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{period.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        period.department === 'College' ? 'bg-blue-100 text-blue-700' : 
                        period.department === 'Senior High School' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {period.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{period.academic_year_name}</td>
                    <td className="px-6 py-4 text-gray-600">{period.semester}</td>
                    <td className="px-6 py-4 text-gray-600">{period.required_payment_percentage}%</td>
                    <td className="px-6 py-4">
                      {period.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} />
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Circle size={12} />
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(period)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(period.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPeriod ? 'Edit Grading Period' : 'Add Grading Period'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g., Midterm, Final"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  disabled={!!selectedPeriod}
                >
                  <option value="College">College</option>
                  <option value="Junior High School">Junior High School</option>
                  <option value="Senior High School">Senior High School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <select
                  required
                  value={formData.academic_year_id}
                  onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="" disabled>Select Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Payment Percentage *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.required_payment_percentage}
                  onChange={(e) => setFormData({ ...formData, required_payment_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g., 50.0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Is Active (Allow grade entry)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingPeriodManagement;

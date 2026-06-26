import React, { useEffect, useState } from 'react';
import { Wallet, Plus, Trash2, Calendar, Filter, Edit2, X } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { academicYearService } from '../../../services/academicYearService';
import { subjectService } from '../../../services/subjectService';
import { FeeItem, FeeCategory } from '../../../types/finance';
import { AcademicYear } from '../../../types/academicYear';
import { Subject } from '../../../types/subject';
import ErrorModal from '../../../components/ui/ErrorModal';

const FeeItems: React.FC = () => {
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedAY, setSelectedAY] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeeItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'tuition' as FeeCategory,
    amount: 0,
    academic_year_id: '',
    applicable_to_year_level: '',
    applicable_to_subject: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ayData, error: ayError } = await academicYearService.getAcademicYears();
      if (ayError) throw ayError;
      if (ayData) {
        setAcademicYears(ayData);
        const activeAY = ayData.find(ay => ay.is_active);
        if (activeAY) {
          setSelectedAY(activeAY.id);
          setFormData(prev => ({ ...prev, academic_year_id: activeAY.id }));
        } else if (ayData.length > 0) {
          setSelectedAY(ayData[0].id);
          setFormData(prev => ({ ...prev, academic_year_id: ayData[0].id }));
        }
      }

      const { data: subData, error: subError } = await subjectService.getSubjects();
      if (subError) throw subError;
      if (subData) setSubjects(subData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeItems = async (ayId: string, category?: string) => {
    if (!ayId) return;
    setLoading(true);
    const { data, error } = await financeService.getFeeItems(ayId, category);
    if (error) setError(error.message);
    else if (data) setFeeItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAY) {
      fetchFeeItems(selectedAY, selectedCategory);
    }
  }, [selectedAY, selectedCategory]);

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      category: 'tuition',
      amount: 0,
      academic_year_id: selectedAY,
      applicable_to_year_level: '',
      applicable_to_subject: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenUpdateModal = (item: FeeItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      amount: item.amount,
      academic_year_id: selectedAY,
      applicable_to_year_level: item.applicable_to_year_level || '',
      applicable_to_subject: item.applicable_to_subject || ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const result = await financeService.createFeeItem({
      p_name: formData.name,
      p_category: formData.category,
      p_amount: formData.amount,
      p_academic_year_id: formData.academic_year_id,
      p_applicable_to_year_level: formData.applicable_to_year_level || null,
      p_applicable_to_subject: formData.applicable_to_subject || null
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsCreateModalOpen(false);
      fetchFeeItems(selectedAY, selectedCategory);
    }
    setSubmitting(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    
    const result = await financeService.updateFeeItem({
      p_fee_item_id: selectedItem.id,
      p_name: formData.name,
      p_category: formData.category,
      p_amount: formData.amount,
      p_applicable_to_year_level: formData.applicable_to_year_level || null,
      p_applicable_to_subject: formData.applicable_to_subject || null
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsUpdateModalOpen(false);
      fetchFeeItems(selectedAY, selectedCategory);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fee item?')) return;
    const { error } = await financeService.deleteFeeItem(id);
    if (error) setError(error.message);
    else fetchFeeItems(selectedAY, selectedCategory);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="text-blue-600" />
            Fee Items Catalog
          </h1>
          <p className="text-gray-600">Manage standard fees and prices for the academic year.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Fee Item
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <select
            value={selectedAY}
            onChange={(e) => setSelectedAY(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} {ay.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            <option value="tuition">Tuition</option>
            <option value="miscellaneous">Miscellaneous</option>
            <option value="laboratory">Laboratory</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No fee items found for this academic year.
                  </td>
                </tr>
              ) : (
                feeItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.category === 'tuition' ? 'bg-green-100 text-green-800' : 
                          item.category === 'laboratory' ? 'bg-purple-100 text-purple-800' : 
                          item.category === 'miscellaneous' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.applicable_to_year_level || 'All'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.subject_code || 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenUpdateModal(item)}
                          className="text-blue-600 hover:text-blue-900" 
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900" 
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
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Create New Fee Item
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g. Tuition Fee"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FeeCategory })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="tuition">Tuition</option>
                    <option value="miscellaneous">Miscellaneous</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year Level (Optional)</label>
                <input
                  type="text"
                  value={formData.applicable_to_year_level || ''}
                  onChange={(e) => setFormData({ ...formData, applicable_to_year_level: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g. Grade 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject (Optional)</label>
                <select
                  value={formData.applicable_to_subject || ''}
                  onChange={(e) => setFormData({ ...formData, applicable_to_subject: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Not specific to a subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Fee Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit Fee Item
              </h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g. Tuition Fee"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as FeeCategory })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="tuition">Tuition</option>
                    <option value="miscellaneous">Miscellaneous</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year Level (Optional)</label>
                <input
                  type="text"
                  value={formData.applicable_to_year_level || ''}
                  onChange={(e) => setFormData({ ...formData, applicable_to_year_level: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g. Grade 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject (Optional)</label>
                <select
                  value={formData.applicable_to_subject || ''}
                  onChange={(e) => setFormData({ ...formData, applicable_to_subject: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Not specific to a subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <ErrorModal message={error} onClose={() => setError('')} />}
    </div>
  );
};


export default FeeItems;

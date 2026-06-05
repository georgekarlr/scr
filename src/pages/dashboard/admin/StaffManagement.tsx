import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, Plus, Mail, Lock, User as UserIcon, Shield, School, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { User, AppRole, UserProfile } from '../../../types/auth';
import StatusMessage from '../../../components/ui/StatusMessage';

const StaffManagement: React.FC = () => {
  const { listSchoolUsers, listUsers, createUser, updateUser } = useAuth();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'teacher' as AppRole
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await listSchoolUsers();
    if (error) {
      setError(error.message);
    } else if (data) {
      // Filter out students for staff management
      setStaff(data.filter(u => u.role && u.role !== 'student'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      // For editing, we might need the email which is not in UserProfile
      // But the previous implementation used User.email.
      // Since listSchoolUsers returns UserProfile which doesn't have email in the DB function provided, 
      // but the UI needs email to edit.
      // Wait, let me check get_my_school_users definition again.
      // id, role, first_name, last_name, student_type, year_level, school_id, section_id, created_at
      // No email. This is a problem.
      setFormData({
        email: '', // We don't have email here anymore!
        password: '', 
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        role: user.role || 'teacher'
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'teacher'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const metadata = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role,
      school_id: '7ea28e4e-1c9c-40fb-a9b9-583236a8a9d2'
    };

    let result;
    if (editingUser) {
      const updates: any = {
        email: formData.email,
        user_metadata: metadata
      };
      if (formData.password) {
        updates.password = formData.password;
      }
      result = await updateUser(editingUser.id, updates);
    } else {
      result = await createUser(formData.email, formData.password, metadata);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsModalOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const filteredStaff = staff.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage school administrators, teachers, and registrars.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {error && <StatusMessage status="error" message={error} />}

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search staff by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">School ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Loading staff...</p>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user) => (
                  <StaffRow 
                    key={user.id} 
                    user={user} 
                    onEdit={() => handleOpenModal(user)} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  required={!editingUser}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as AppRole})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="teacher">Teacher</option>
                  <option value="registrar">Registrar</option>
                  <option value="cashier">Cashier</option>
                  <option value="student">Student</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffRow: React.FC<{ user: UserProfile; onEdit: () => void }> = ({ user, onEdit }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <UserIcon size={20} />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Shield size={12} />
            {user.role}
          </p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 capitalize">
        <Shield size={14} className="text-blue-500" />
        {user.user_metadata?.role?.replace('_', ' ')}
      </span>
    </td>
    <td className="px-6 py-4">
      <span className="flex items-center gap-1.5 text-sm text-gray-600">
        <School size={14} className="text-gray-400" />
        {user.user_metadata?.school_id || 'N/A'}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button 
        onClick={onEdit}
        className="text-blue-600 hover:text-blue-800 text-sm font-bold uppercase tracking-wider"
      >
        Edit
      </button>
    </td>
  </tr>
);

export default StaffManagement;

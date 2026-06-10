import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, Plus, Mail, Lock, User as UserIcon, Shield, School, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { User, AppRole, UserProfile } from '../../../types/auth';
import ErrorModal from '../../../components/ui/ErrorModal';
import StatusMessage from '../../../components/ui/StatusMessage';

const UserManagement: React.FC = () => {
  const { listSchoolUsers, listUsers, createUser, updateUser, updateUserName, updateUserRole, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editType, setEditType] = useState<'email' | 'password' | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'teacher' as AppRole
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    password: ''
  });
  const [nameFormData, setNameFormData] = useState({
    firstName: '',
    lastName: ''
  });
  const [roleFormData, setRoleFormData] = useState({
    role: 'teacher' as AppRole
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await listSchoolUsers(
      roleFilter === 'all' ? undefined : roleFilter,
      searchTerm || undefined
    );
    if (error) {
      setError(error.message);
    } else if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [roleFilter, searchTerm]);

  const handleOpenModal = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'teacher' as AppRole
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile, type: 'email' | 'password') => {
    setSelectedUser(user);
    setEditType(type);
    setEditFormData({
      email: '', // We don't have the current email easily available here
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenNameModal = (user: UserProfile) => {
    setSelectedUser(user);
    setNameFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || ''
    });
    setIsNameModalOpen(true);
  };

  const handleOpenRoleModal = (user: UserProfile) => {
    setSelectedUser(user);
    setRoleFormData({
      role: user.role
    });
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    setError('');

    const result = await updateUserRole(
      selectedUser.id, 
      roleFormData.role
    );

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsRoleModalOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    setError('');

    const result = await updateUserName(
      selectedUser.id, 
      nameFormData.firstName, 
      nameFormData.lastName
    );

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsNameModalOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editType) return;

    setSubmitting(true);
    setError('');

    const updates: any = {};
    if (editType === 'email') {
      updates.email = editFormData.email;
    } else {
      updates.password = editFormData.password;
    }

    const result = await updateUser(selectedUser.id, updates);

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsEditModalOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const metadata = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role,
      school_id: profile?.school_id || ''
    };

    const result = await createUser(formData.email, formData.password, metadata);

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsModalOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage school administrators, teachers, and other staff members.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      <ErrorModal 
        isOpen={!!error} 
        message={error} 
        onClose={() => setError('')} 
      />

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter size={18} className="text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | 'all')}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="registrar">Registrar</option>
            <option value="cashier">Cashier</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    onChangeName={() => handleOpenNameModal(user)}
                    onChangeRole={() => handleOpenRoleModal(user)}
                    onChangeEmail={() => handleOpenEditModal(user, 'email')}
                    onChangePassword={() => handleOpenEditModal(user, 'password')}
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
                Add New User
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
                  Password
                </label>
                <input
                  required
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
                  {submitting ? 'Saving...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Change Name Modal */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Change User Name
              </h3>
              <button onClick={() => setIsNameModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleNameSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <input
                  required
                  type="text"
                  value={nameFormData.firstName}
                  onChange={(e) => setNameFormData({...nameFormData, firstName: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <input
                  required
                  type="text"
                  value={nameFormData.lastName}
                  onChange={(e) => setNameFormData({...nameFormData, lastName: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Last Name"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Change Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Change User Role
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="px-6 py-2 bg-blue-50 text-blue-700 text-sm">
              Updating for: <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Select New Role</label>
                <select
                  value={roleFormData.role}
                  onChange={(e) => setRoleFormData({role: e.target.value as AppRole})}
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
                  onClick={() => setIsRoleModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editType === 'email' ? 'Change Email' : 'Change Password'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="px-6 py-2 bg-blue-50 text-blue-700 text-sm">
              Updating for: <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editType === 'email' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">New Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="new-email@example.com"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const UserRow: React.FC<{ 
  user: UserProfile; 
  onChangeName: () => void;
  onChangeRole: () => void;
  onChangeEmail: () => void; 
  onChangePassword: () => void;
}> = ({ user, onChangeName, onChangeRole, onChangeEmail, onChangePassword }) => (
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
    <td className="px-6 py-4 text-right">
      <div className="flex justify-end gap-2">
        <button 
          onClick={onChangeName}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Change Name"
        >
          <UserIcon size={18} />
        </button>
        <button 
          onClick={onChangeRole}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Change Role"
        >
          <Shield size={18} />
        </button>
        <button 
          onClick={onChangeEmail}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Change Email"
        >
          <Mail size={18} />
        </button>
        <button 
          onClick={onChangePassword}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Change Password"
        >
          <Lock size={18} />
        </button>
      </div>
    </td>
  </tr>
);

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  GraduationCap
} from 'lucide-react';
import { authAPI, studentAPI, predictionAPI, modelAPI } from '../services/api';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalUsers: 0,
    adminCount: 0,
    predictions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  // Handle query parameter for tab switching
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'users') {
      setActiveTab('users');
    }
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, studentsRes, predictionsRes, modelsRes] = await Promise.all([
        authAPI.getAllUsers(),
        studentAPI.getAll(),
        predictionAPI.getAll(),
        modelAPI.getAll(),
      ]);

      const allUsers = usersRes.data.data || [];
      setUsers(allUsers);
      
      setStats({
        totalStudents: (studentsRes.data.data || []).length,
        totalUsers: allUsers.length,
        adminCount: allUsers.filter(u => u.role === 'admin').length,
        predictions: (predictionsRes.data.data || []).length,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await authAPI.toggleUserStatus(userId);
      fetchData();
    } catch (error) {
      alert('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await authAPI.deleteUser(userId);
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await authAPI.createAdminUser(newAdminData);
      setShowAddAdmin(false);
      setNewAdminData({ username: '', email: '', password: '' });
      fetchData();
      alert('Admin user created successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create admin user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {activeTab === 'overview' && 'Admin Dashboard'}
          {activeTab === 'users' && 'User Management'}
        </h1>
        <p className="text-gray-600 mt-2">Manage users and system settings</p>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.adminCount}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Predictions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.predictions}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Settings className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Go to Main Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Add Admin Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Admin User
              </button>
            </div>

            {/* Add Admin Form */}
            {showAddAdmin && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Admin User</h3>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newAdminData.username}
                    onChange={(e) => setNewAdminData({...newAdminData, username: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAdminData.email}
                    onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newAdminData.password}
                    onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <div className="md:col-span-3 flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Create Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAdmin(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{u.username}</span>
                          {u.username === 'Beast' && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Default</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          u.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`p-1 rounded ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                            disabled={u.username === 'Beast'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No users found.</p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserPlus, X, Key } from 'lucide-react';
import { studentAPI, authAPI } from '../services/api';

function Students() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    course: 'BS Information Technology',
    institution: 'NUEVA VIZCAYA STATE UNIVERSITY',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchStudentsAndUsers();
  }, []);

  const fetchStudentsAndUsers = async () => {
    try {
      setLoading(true);
      const [studentsRes, usersRes] = await Promise.all([
        studentAPI.getAll(),
        authAPI.getAllUsers(),
      ]);
      setStudents(studentsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        console.log('Updating student:', editingStudent.id);
        console.log('Form data:', formData);
        console.log('Users array:', users);
        
        // Update student info
        await studentAPI.update(editingStudent.id, {
          student_id: formData.student_id,
          name: formData.name,
          course: formData.course,
          institution: formData.institution,
        });
        
        // Update user credentials if they exist and were changed
        const user = users.find(u => u.student_profile_id === editingStudent.id);
        console.log('Found user:', user);
        
        if (user) {
          const userUpdates = {};
          if (formData.username && formData.username !== user.username) {
            userUpdates.username = formData.username;
          }
          if (formData.email && formData.email !== user.email) {
            userUpdates.email = formData.email;
          }
          
          console.log('User updates:', userUpdates);
          
          // Only update if there are changes
          if (Object.keys(userUpdates).length > 0) {
            console.log('Calling authAPI.updateUser with:', user.id, userUpdates);
            const result = await authAPI.updateUser(user.id, userUpdates);
            console.log('Update result:', result);
            alert('Student and credentials updated successfully!');
          } else {
            alert('Student updated (no credential changes)');
          }
        } else if (formData.username && formData.password) {
          // Create new user account if username and password provided
          console.log('Creating new user account for student:', editingStudent.id);
          await authAPI.register({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            student_id: formData.student_id,
            name: formData.name,
            course: formData.course,
            institution: formData.institution,
          });
          alert('Student updated and new user account created!');
        } else {
          console.log('No user found for student ID:', editingStudent.id);
          alert('Student updated (no associated user account - add username & password to create one)');
        }
      } else {
        // Create student with user account
        await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          student_id: formData.student_id,
          name: formData.name,
          course: formData.course,
          institution: formData.institution,
        });
        alert('Student created successfully with user account!');
      }
      setShowModal(false);
      setEditingStudent(null);
      setFormData({ student_id: '', name: '', course: '', institution: '', username: '', password: '' });
      fetchStudentsAndUsers();
    } catch (error) {
      console.error('Error saving student:', error);
      console.error('Error response:', error.response);
      alert(error.response?.data?.error || error.message || 'Error saving student');
    }
  };

  const handleEdit = (student) => {
    // Find associated user
    const user = users.find(u => u.student_profile_id === student.id);
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      course: student.course || '',
      institution: student.institution || '',
      username: user?.username || '',
      email: user?.email || '',
      password: '', // Don't show existing password, only allow changing
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentAPI.delete(id);
      fetchStudentsAndUsers();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.course && student.course.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage student records for OJT tracking</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setFormData({ student_id: '', name: '', course: 'BS Information Technology', institution: 'NUEVA VIZCAYA STATE UNIVERSITY', username: '', email: '', password: '', confirmPassword: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Credentials</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                // Find associated user
                const user = users.find(u => u.student_profile_id === student.id);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.course || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.institution || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user ? (
                        <div className="bg-gray-100 rounded-lg p-2 text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-semibold text-gray-600">User:</span>
                            <span className="text-gray-900">{user.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-600">Pass:</span>
                            <span className="text-gray-900 font-mono">••••••••</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No account</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.accomplishments_count || 0} accomplishments
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No students found. Add your first student to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Student Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Student Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Student ID *</label>
                      <input
                        type="text"
                        required
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        className="input-field"
                        placeholder="e.g., 2024-001"
                      />
                    </div>
                    <div>
                      <label className="label">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field"
                        placeholder="e.g., Juan Dela Cruz"
                      />
                    </div>
                    <div>
                      <label className="label">Course/Program</label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="input-field"
                      >
                        <option value="BS Information Technology">BS Information Technology</option>
                        <option value="BS Information Systems">BS Information Systems</option>
                        <option value="BS Computer Sciences">BS Computer Sciences</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Institution/School</label>
                      <input
                        type="text"
                        value={formData.institution}
                        readOnly
                        className="input-field bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Credentials Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Credentials</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Username *</label>
                      <input
                        type="text"
                        required={!editingStudent}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="input-field"
                        placeholder="e.g., juan.delacruz"
                      />
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input
                        type="email"
                        required={!editingStudent}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                        placeholder="e.g., juan@nvsu.edu.ph"
                      />
                    </div>
                    <div>
                      <label className="label">
                        {editingStudent ? 'New Password (leave blank to keep current)' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        required={!editingStudent}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field"
                        placeholder={editingStudent ? "Enter new password" : "Enter password"}
                      />
                    </div>
                    {!editingStudent && (
                      <div>
                        <label className="label">Confirm Password *</label>
                        <input
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="input-field"
                          placeholder="Confirm password"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStudent ? 'Update' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;

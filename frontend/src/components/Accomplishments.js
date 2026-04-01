import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Calendar, Clock, X, FileText } from 'lucide-react';
import { studentAPI, accomplishmentAPI } from '../services/api';

function Accomplishments() {
  const [students, setStudents] = useState([]);
  const [accomplishments, setAccomplishments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    week_number: '',
    activities_performed: '',
    skills: '',
    number_of_hours: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchAccomplishments(selectedStudent);
    } else {
      fetchAllAccomplishments();
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAll();
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAccomplishments = async (studentId) => {
    try {
      setLoading(true);
      const response = await studentAPI.getAccomplishments(studentId);
      setAccomplishments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAccomplishments = async () => {
    try {
      setLoading(true);
      const response = await accomplishmentAPI.getAll();
      setAccomplishments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        student_id: parseInt(formData.student_id),
        week_number: parseInt(formData.week_number),
        number_of_hours: parseFloat(formData.number_of_hours),
      };

      if (editingAcc) {
        await accomplishmentAPI.update(editingAcc.id, data);
      } else {
        await accomplishmentAPI.create(data);
      }

      setShowModal(false);
      setEditingAcc(null);
      setFormData({ student_id: '', week_number: '', activities_performed: '', skills: '', number_of_hours: '' });

      if (selectedStudent) {
        fetchAccomplishments(selectedStudent);
      } else {
        fetchAllAccomplishments();
      }
    } catch (error) {
      console.error('Error saving accomplishment:', error);
      alert(error.response?.data?.error || 'Error saving accomplishment');
    }
  };

  const handleEdit = (acc) => {
    setEditingAcc(acc);
    setFormData({
      student_id: acc.student_id.toString(),
      week_number: acc.week_number.toString(),
      activities_performed: acc.activities_performed,
      skills: acc.skills,
      number_of_hours: acc.number_of_hours.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await accomplishmentAPI.delete(id);
      if (selectedStudent) {
        fetchAccomplishments(selectedStudent);
      } else {
        fetchAllAccomplishments();
      }
    } catch (error) {
      console.error('Error deleting accomplishment:', error);
      alert('Error deleting record');
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accomplishments</h1>
          <p className="text-gray-600 mt-2">Record student OJT accomplishments week by week</p>
        </div>
        <button
          onClick={() => {
            setEditingAcc(null);
            setFormData({ student_id: selectedStudent || '', week_number: '', activities_performed: '', skills: '', number_of_hours: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Record</span>
        </button>
      </div>

      {/* Student Filter */}
      <div className="mb-6">
        <label className="label">Filter by Student</label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="input-field max-w-md"
        >
          <option value="">All Students</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.student_id})
            </option>
          ))}
        </select>
      </div>

      {/* Accomplishments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          accomplishments.map((acc) => (
            <div key={acc.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Calendar className="h-4 w-4 mr-1" />
                      Week {acc.week_number}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Clock className="h-4 w-4 mr-1" />
                      {acc.number_of_hours} hours
                    </span>
                    <span className="text-sm text-gray-500">
                      {getStudentName(acc.student_id)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Activities Performed</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{acc.activities_performed}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Skills Developed</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{acc.skills}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(acc)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && accomplishments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No accomplishments recorded yet.</p>
            <p className="text-sm">Add your first OJT record to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAcc ? 'Edit Accomplishment' : 'Add Accomplishment'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Student *</label>
                  <select
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="input-field"
                    disabled={editingAcc !== null}
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.student_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Week Number *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.week_number}
                    onChange={(e) => setFormData({ ...formData, week_number: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 1"
                  />
                </div>

                <div>
                  <label className="label">Activities Performed *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.activities_performed}
                    onChange={(e) => setFormData({ ...formData, activities_performed: e.target.value })}
                    className="input-field"
                    placeholder="Describe the tasks and activities performed during this week..."
                  />
                </div>

                <div>
                  <label className="label">Skills Developed *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="input-field"
                    placeholder="List the skills learned or improved during this week..."
                  />
                </div>

                <div>
                  <label className="label">Number of Hours *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.number_of_hours}
                    onChange={(e) => setFormData({ ...formData, number_of_hours: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 40"
                  />
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
                  {editingAcc ? 'Update' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accomplishments;

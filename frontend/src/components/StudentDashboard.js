import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Brain, 
  User, 
  LogOut,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import { studentAPI, predictionAPI, accomplishmentAPI } from '../services/api';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [accomplishments, setAccomplishments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAccomplishmentModal, setShowAccomplishmentModal] = useState(false);
  const [accomplishmentForm, setAccomplishmentForm] = useState({
    week_number: 1,
    activities_performed: '',
    skills: '',
    number_of_hours: '',
  });

  useEffect(() => {
    if (!user?.student_profile_id) {
      setLoading(false);
      return;
    }
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [studentRes, accRes, predRes] = await Promise.all([
        studentAPI.getById(user.student_profile_id),
        studentAPI.getAccomplishments(user.student_profile_id),
        predictionAPI.getAll(user.student_profile_id),
      ]);

      setStudent(studentRes.data.data);
      setAccomplishments(accRes.data.data || []);
      setPredictions(predRes.data.data || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAccomplishmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await accomplishmentAPI.create({
        ...accomplishmentForm,
        student_id: user.student_profile_id,
      });
      setShowAccomplishmentModal(false);
      setAccomplishmentForm({ week_number: 1, activities_performed: '', skills: '', number_of_hours: '' });
      fetchStudentData();
      alert('Accomplishment added successfully!');
    } catch (error) {
      console.error('Error adding accomplishment:', error);
      alert(error.response?.data?.error || 'Error adding accomplishment');
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-emerald-400',
      3: 'bg-teal-400',
      4: 'bg-blue-500',
      5: 'bg-indigo-500',
      6: 'bg-violet-500',
      7: 'bg-purple-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const latestPrediction = predictions[0];
  const totalHours = accomplishments.reduce((sum, acc) => sum + (acc.number_of_hours || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{user?.username}</h1>
              <p className="text-xs text-gray-500">Student Account</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 px-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              activeTab === 'profile' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="font-medium">Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab('accomplishments')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              activeTab === 'accomplishments' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Accomplishments</span>
          </button>
          
          <button
            onClick={() => setActiveTab('predictions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              activeTab === 'predictions' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Brain className="h-5 w-5" />
            <span className="font-medium">PQF Predictions</span>
          </button>

          <div className="border-t border-gray-200 my-3"></div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === 'profile' && 'My Profile'}
            {activeTab === 'accomplishments' && 'My Accomplishments'}
            {activeTab === 'predictions' && 'My PQF Predictions'}
          </h1>
          <p className="text-gray-600 mt-2">
            {student?.name && `Welcome, ${student.name}`}
          </p>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accomplishments</p>
                    <p className="text-2xl font-bold text-gray-900">{accomplishments.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Predictions</p>
                    <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Prediction */}
            {latestPrediction && (
              <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl shadow-sm p-6 border-2 border-primary-200">
                <div className="flex items-center mb-4">
                  <Award className="h-6 w-6 text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Latest PQF Prediction</h2>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 rounded-full ${getLevelColor(latestPrediction.predicted_level)} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                    {latestPrediction.predicted_level}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">PQF Level {latestPrediction.predicted_level}</p>
                    <p className="text-gray-600">
                      Confidence: {(latestPrediction.confidence_score * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Predicted on {new Date(latestPrediction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!latestPrediction && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No predictions yet. Go to PQF Predictions to get your first analysis.</p>
              </div>
            )}
          </div>
        )}

        {/* Accomplishments Tab */}
        {activeTab === 'accomplishments' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">OJT Accomplishments</h2>
              <button
                onClick={() => setShowAccomplishmentModal(true)}
                className="btn-primary flex items-center space-x-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Accomplishment</span>
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activities</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accomplishments.map((acc) => (
                  <tr key={acc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{acc.week_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{acc.activities_performed}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{acc.skills}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{acc.number_of_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {accomplishments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No accomplishments recorded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${getLevelColor(pred.predicted_level)} flex items-center justify-center text-white font-bold`}>
                      {pred.predicted_level}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">PQF Level {pred.predicted_level}</p>
                      <p className="text-sm text-gray-600">Model: {pred.model_used}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {(pred.confidence_score * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(pred.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {predictions.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No predictions available.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;

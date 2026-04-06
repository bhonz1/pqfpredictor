import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Brain, 
  User, 
  LogOut,
  TrendingUp,
  Clock,
  Award,
  Plus,
  X
} from 'lucide-react';
import { studentAPI, predictionAPI, modelAPI, signatoryAPI } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [accomplishments, setAccomplishments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loadedModels, setLoadedModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [signatories, setSignatories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAccomplishmentModal, setShowAccomplishmentModal] = useState(false);
  const [accomplishmentForm, setAccomplishmentForm] = useState({
    week_number: 1,
    activities_performed: '',
    skills: '',
    number_of_hours: '',
  });

  const fetchStudentData = useCallback(async () => {
    if (!user?.student_profile_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [studentRes, accRes, predRes, modelRes, signatoryRes] = await Promise.all([
        studentAPI.getById(user.student_profile_id),
        studentAPI.getAccomplishments(user.student_profile_id),
        predictionAPI.getAll(user.student_profile_id),
        modelAPI.getLoaded(),
        signatoryAPI.getAll(),
      ]);

      setStudent(studentRes.data.data);
      setAccomplishments(accRes.data.data || []);
      setPredictions(predRes.data.data || []);
      const models = modelRes.data.data?.loaded_models || [];
      setLoadedModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0]);
      }
      setSignatories(signatoryRes.data.data || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.student_profile_id]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

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

  const handlePredict = async () => {
    if (!user?.student_profile_id || !selectedModel) return;
    if (accomplishments.length === 0) {
      alert('Please add at least one accomplishment record before running a prediction.');
      return;
    }

    try {
      setPredictionLoading(true);
      const response = await predictionAPI.predict(
        user.student_profile_id,
        selectedModel
      );
      
      const newPrediction = response.data.data;
      setPredictions([newPrediction, ...predictions]);
      alert(`Prediction complete! You have been classified as PQF Level ${newPrediction.predicted_level}.`);
    } catch (error) {
      console.error('Error running prediction:', error);
      alert(error.response?.data?.error || 'Error running prediction');
    } finally {
      setPredictionLoading(false);
    }
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      1: "Routine, repetitive, and predictable activities",
      2: "Range of familiar and non-familiar contexts",
      3: "Diverse, unfamiliar, and changing activities",
      4: "Complex, non-routine, unfamiliar contexts",
      5: "Specialized, complex, professional work",
      6: "Advanced professional, highly specialized work",
      7: "Highly advanced, specialized, complex professional work",
    };
    return descriptions[level] || "Unknown Level";
  };

  const generateCertificateHTML = (prediction) => {
    const activeSignatories = signatories.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PQF Certificate - ${student?.name || 'Student'}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .certificate { width: 8.5in; height: 6.5in; margin: 0 auto; background: white; padding: 40px; border: 3px solid #1e40af; box-shadow: 0 4px 6px rgba(0,0,0,0.1); box-sizing: border-box; display: flex; flex-direction: column; }
          .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { font-size: 16px; color: #1e40af; margin: 0; }
          .header h2 { font-size: 14px; color: #374151; margin: 5px 0 0; }
          .content { text-align: center; flex: 1; }
          .content h3 { font-size: 18px; color: #1e40af; margin-bottom: 15px; }
          .student-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 15px 0; }
          .details { font-size: 14px; color: #4b5563; margin: 15px 0; line-height: 1.4; }
          .pqf-level { display: inline-block; background: #1e40af; color: white; padding: 10px 25px; font-size: 20px; font-weight: bold; border-radius: 8px; margin: 15px 0; }
          .signatories { margin-top: 30px; }
          .signatory-grid { display: flex; flex-wrap: nowrap; justify-content: center; gap: 20px; }
          .signatory-item { text-align: center; min-width: 120px; flex: 0 0 auto; }
          .signatory-name { font-weight: bold; color: #1f2937; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 3px; font-size: 12px; }
          .signatory-position { font-size: 10px; color: #6b7280; }
          .date { text-align: right; margin-top: 20px; font-style: italic; color: #6b7280; font-size: 12px; }
          @media print { body { background: white; } .certificate { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <h1>COLLEGE OF INFORMATION TECHNOLOGY EDUCATION</h1>
            <h2>Bachelor of Science in Information Technology</h2>
            <h1 style="font-size: 22px; color: #1e40af; margin-top: 15px;">PHILIPPINE QUALIFICATIONS FRAMEWORK LEVEL</h1>
            <h2>Certificate of PQF Level Classification</h2>
          </div>
          <div class="content">
            <h3>This certifies that</h3>
            <div class="student-name">${student?.name || 'Unknown Student'}</div>
            <div class="details">
              Student ID: ${student?.student_id || 'N/A'}<br>
              ${student?.course ? `Course: ${student.course}<br>` : ''}
              ${student?.institution ? `Institution: ${student.institution}<br>` : ''}
            </div>
            <div>has been classified under</div>
            <div class="pqf-level">PQF LEVEL ${prediction.predicted_level}</div>
            <div class="details">
              ${prediction.level_description || getLevelDescription(prediction.predicted_level)}<br>
              <strong>Confidence Score: ${prediction.confidence_score ? (prediction.confidence_score * 100).toFixed(1) + '%' : 'N/A'}</strong><br>
              Date Classified: ${new Date(prediction.created_at).toLocaleDateString()}
            </div>
          </div>
          <div class="signatories">
            <div class="signatory-grid">
              ${activeSignatories.map(s => `
                <div class="signatory-item">
                  <div class="signatory-name">${s.name}</div>
                  <div class="signatory-position">${s.position}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="date">
            Issued on: ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generatePDF = async (prediction) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateCertificateHTML(prediction);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      await document.fonts.ready;
      
      const canvas = await html2canvas(tempDiv.firstElementChild, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const filename = `PQF_Certificate_${student?.name?.replace(/\s+/g, '_') || prediction.student_id}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
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
          <div className="space-y-6">
            {/* Run Prediction Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Run PQF Prediction</h2>
              
              {loadedModels.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">No prediction models available. Please contact your administrator.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Select Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="input-field"
                    >
                      {loadedModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                  
                  {accomplishments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>{accomplishments.length}</strong> accomplishment records will be used for analysis
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={handlePredict}
                    disabled={predictionLoading || accomplishments.length === 0}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {predictionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        <span>Run PQF Prediction</span>
                      </>
                    )}
                  </button>
                  
                  {accomplishments.length === 0 && (
                    <p className="text-sm text-red-600 text-center">
                      Please add accomplishments before running a prediction.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Prediction History */}
            <h3 className="text-lg font-semibold text-gray-900">Your Prediction History</h3>
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
                
                {/* Certificate Download Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => generatePDF(pred)}
                    disabled={signatories.filter(s => s.is_active).length === 0}
                    className="btn-primary flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download Certificate PDF</span>
                  </button>
                  {signatories.filter(s => s.is_active).length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Certificate generation unavailable - no active signatories configured.
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {predictions.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No predictions yet. Run your first PQF prediction above.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showAccomplishmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Accomplishment</h2>
              <button
                onClick={() => setShowAccomplishmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAccomplishmentSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Week Number *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={accomplishmentForm.week_number}
                    onChange={(e) =>
                      setAccomplishmentForm({
                        ...accomplishmentForm,
                        week_number: parseInt(e.target.value || '1', 10),
                      })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Activities Performed *</label>
                  <textarea
                    required
                    rows="3"
                    value={accomplishmentForm.activities_performed}
                    onChange={(e) =>
                      setAccomplishmentForm({
                        ...accomplishmentForm,
                        activities_performed: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Skills Developed *</label>
                  <textarea
                    required
                    rows="3"
                    value={accomplishmentForm.skills}
                    onChange={(e) =>
                      setAccomplishmentForm({
                        ...accomplishmentForm,
                        skills: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Number of Hours *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={accomplishmentForm.number_of_hours}
                    onChange={(e) =>
                      setAccomplishmentForm({
                        ...accomplishmentForm,
                        number_of_hours: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAccomplishmentModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

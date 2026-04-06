import React, { useState, useEffect, useRef } from 'react';
import { Brain, Play, History, AlertCircle, CheckCircle, X, Loader2, Trash2, FileText, Users, Plus, Edit2, Download } from 'lucide-react';
import { studentAPI, predictionAPI, modelAPI, accomplishmentAPI, signatoryAPI } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function Predictions() {
  const [students, setStudents] = useState([]);
  const [accomplishments, setAccomplishments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loadedModels, setLoadedModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('default');
  const [prediction, setPrediction] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuickPredict, setShowQuickPredict] = useState(false);
  const [quickPredictData, setQuickPredictData] = useState([
    { week_number: 1, activities_performed: '', skills: '', number_of_hours: '' }
  ]);
  
  // Signatory states
  const [signatories, setSignatories] = useState([]);
  const [showSignatoryModal, setShowSignatoryModal] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState(null);
  const [signatoryForm, setSignatoryForm] = useState({
    name: '',
    position: '',
    office: '',
    display_order: 1,
  });
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchLoadedModels();
    fetchAllPredictions();
    fetchSignatories();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAccomplishments(selectedStudent);
    } else {
      setAccomplishments([]);
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

  const fetchStudentAccomplishments = async (studentId) => {
    try {
      const response = await studentAPI.getAccomplishments(studentId);
      setAccomplishments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
    }
  };

  const fetchLoadedModels = async () => {
    try {
      const response = await modelAPI.getLoaded();
      const models = response.data.data?.loaded_models || [];
      setLoadedModels(models);
      if (models.length > 0 && !models.includes(selectedModel)) {
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchAllPredictions = async () => {
    try {
      const response = await predictionAPI.getAll();
      setPredictions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handleResetHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all prediction history? This cannot be undone.')) return;
    try {
      await predictionAPI.reset();
      setPredictions([]);
      alert('Prediction history cleared successfully');
    } catch (error) {
      console.error('Reset error:', error);
      alert('Failed to clear prediction history');
    }
  };

  const handlePredict = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    if (loadedModels.length === 0) {
      alert('No models loaded. Please upload and load a model first.');
      return;
    }

    try {
      setLoading(true);
      const response = await predictionAPI.predict(parseInt(selectedStudent), selectedModel);
      setPrediction(response.data.data);
      fetchAllPredictions();
    } catch (error) {
      console.error('Prediction error:', error);
      alert(error.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPredict = async () => {
    if (loadedModels.length === 0) {
      alert('No models loaded. Please upload and load a model first.');
      return;
    }

    // Validate quick predict data
    for (const acc of quickPredictData) {
      if (!acc.activities_performed || !acc.skills || !acc.number_of_hours) {
        alert('Please fill in all fields for each week');
        return;
      }
    }

    try {
      setLoading(true);
      const data = quickPredictData.map(acc => ({
        ...acc,
        week_number: parseInt(acc.week_number),
        number_of_hours: parseFloat(acc.number_of_hours),
      }));

      const response = await predictionAPI.quickPredict(data, selectedModel);
      setPrediction(response.data.data);
    } catch (error) {
      console.error('Quick prediction error:', error);
      alert(error.response?.data?.error || 'Quick prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const addQuickPredictWeek = () => {
    setQuickPredictData([...quickPredictData, {
      week_number: quickPredictData.length + 1,
      activities_performed: '',
      skills: '',
      number_of_hours: ''
    }]);
  };

  const updateQuickPredictField = (index, field, value) => {
    const updated = [...quickPredictData];
    updated[index][field] = value;
    setQuickPredictData(updated);
  };

  const removeQuickPredictWeek = (index) => {
    const updated = quickPredictData.filter((_, i) => i !== index);
    // Re-number weeks
    updated.forEach((acc, i) => acc.week_number = i + 1);
    setQuickPredictData(updated);
  };

  // Signatory management functions
  const fetchSignatories = async () => {
    try {
      const response = await signatoryAPI.getAll();
      setSignatories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching signatories:', error);
    }
  };

  const handleSignatorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSignatory) {
        await signatoryAPI.update(editingSignatory.id, signatoryForm);
      } else {
        await signatoryAPI.create(signatoryForm);
      }
      setShowSignatoryModal(false);
      setEditingSignatory(null);
      setSignatoryForm({ name: '', position: '', office: '', display_order: 1 });
      fetchSignatories();
    } catch (error) {
      console.error('Error saving signatory:', error);
      alert(error.response?.data?.error || 'Error saving signatory');
    }
  };

  const handleEditSignatory = (signatory) => {
    setEditingSignatory(signatory);
    setSignatoryForm({
      name: signatory.name,
      position: signatory.position,
      office: signatory.office,
      display_order: signatory.display_order,
    });
    setShowSignatoryModal(true);
  };

  const handleDeleteSignatory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this signatory?')) return;
    try {
      await signatoryAPI.delete(id);
      fetchSignatories();
    } catch (error) {
      console.error('Error deleting signatory:', error);
      alert('Error deleting signatory');
    }
  };

  const handleToggleSignatory = async (id) => {
    try {
      await signatoryAPI.toggleStatus(id);
      fetchSignatories();
    } catch (error) {
      console.error('Error toggling signatory:', error);
      alert('Error toggling signatory status');
    }
  };

  const generateCertificate = (prediction) => {
    setSelectedPrediction(prediction);
    setShowCertificateModal(true);
  };

  const handleGenerateCertificate = async () => {
    if (signatories.length === 0) {
      alert('Please add at least one signatory before generating a certificate.');
      return;
    }
    
    if (signatories.length < 5) {
      if (!window.confirm(`You only have ${signatories.length} signatories. The certificate recommends 5 signatories. Continue anyway?`)) {
        return;
      }
    }
    
    await generatePDF(selectedPrediction);
    setShowCertificateModal(false);
  };

  const generatePDF = async (prediction) => {
    try {
      // Create a temporary div for the certificate
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateCertificateHTML(prediction);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Wait for fonts to load
      await document.fonts.ready;
      
      // Capture the certificate as canvas
      const canvas = await html2canvas(tempDiv.firstElementChild, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Remove temp div
      document.body.removeChild(tempDiv);

      // Create PDF
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
      
      const student = students.find(s => s.id === prediction.student_id);
      const filename = `PQF_Certificate_${student?.name?.replace(/\s+/g, '_') || prediction.student_id}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Falling back to print view.');
      // Fallback to print window
      const certificateHTML = generateCertificateHTML(prediction);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(certificateHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateCertificateHTML = (prediction) => {
    const student = students.find(s => s.id === prediction.student_id);
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
          .header h1 { color: #1e40af; font-size: 22px; margin: 0; }
          .header h2 { color: #374151; font-size: 14px; margin: 8px 0 0; }
          .content { text-align: center; flex: 1; }
          .content h3 { font-size: 18px; color: #1e40af; margin-bottom: 15px; }
          .student-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 15px 0; }
          .details { font-size: 14px; color: #4b5563; margin: 15px 0; line-height: 1.4; }
          .pqf-level { display: inline-block; background: #1e40af; color: white; padding: 10px 25px; font-size: 20px; font-weight: bold; border-radius: 8px; margin: 15px 0; }
          .signatories { margin-top: 30px; }
          .signatories h4 { text-align: center; color: #374151; margin-bottom: 15px; font-size: 14px; }
          .signatory-grid { display: flex; flex-wrap: nowrap; justify-content: center; gap: 20px; }
          .signatory-item { text-align: center; min-width: 120px; flex: 0 0 auto; }
          .signatory-name { font-weight: bold; color: #1f2937; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 3px; font-size: 12px; }
          .signatory-position { font-size: 10px; color: #6b7280; }
          .signatory-office { font-size: 9px; color: #9ca3af; }
          .date { text-align: right; margin-top: 20px; font-style: italic; color: #6b7280; font-size: 12px; }
          @media print { body { background: white; } .certificate { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <h1 style="font-size: 16px; color: #1e40af;">COLLEGE OF INFORMATION TECHNOLOGY EDUCATION</h1>
            <h2 style="font-size: 22px; color: #1e40af; margin-top: 15px;">PHILIPPINE QUALIFICATIONS FRAMEWORK LEVEL</h1>
            <h2 style="font-size: 14px; color: #374151;">Certificate of PQF Level Classification</h2>
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PQF Predictions</h1>
        <p className="text-gray-600 mt-2">Analyze student OJT records and predict PQF Levels</p>
      </div>

      {/* Model Status Warning */}
      {loadedModels.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">No Models Loaded</p>
            <p className="text-sm text-yellow-700">
              Please go to Model Management to upload and load a PQF classifier model.
            </p>
          </div>
        </div>
      )}

      {/* Prediction Mode Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setShowQuickPredict(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !showQuickPredict ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Student Prediction
        </button>
        <button
          onClick={() => setShowQuickPredict(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showQuickPredict ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Quick Predict (No Save)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {!showQuickPredict ? (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.student_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="input-field"
                  >
                    {loadedModels.length === 0 ? (
                      <option value="">No models loaded</option>
                    ) : (
                      loadedModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))
                    )}
                  </select>
                </div>

                {selectedStudent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>{accomplishments.length}</strong> accomplishment records available for analysis
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePredict}
                  disabled={loading || !selectedStudent || loadedModels.length === 0}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      <span>Predict PQF Level</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quick Predict</h2>
                <button
                  onClick={addQuickPredictWeek}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add Week
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {quickPredictData.map((acc, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">Week {acc.week_number}</span>
                      {quickPredictData.length > 1 && (
                        <button
                          onClick={() => removeQuickPredictWeek(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Activities performed..."
                        value={acc.activities_performed}
                        onChange={(e) => updateQuickPredictField(index, 'activities_performed', e.target.value)}
                        className="input-field text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Skills developed..."
                        value={acc.skills}
                        onChange={(e) => updateQuickPredictField(index, 'skills', e.target.value)}
                        className="input-field text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Hours..."
                        value={acc.number_of_hours}
                        onChange={(e) => updateQuickPredictField(index, 'number_of_hours', e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="label">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="input-field mb-4"
                >
                  {loadedModels.length === 0 ? (
                    <option value="">No models loaded</option>
                  ) : (
                    loadedModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))
                  )}
                </select>

                <button
                  onClick={handleQuickPredict}
                  disabled={loading || loadedModels.length === 0}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>Quick Predict</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {prediction ? (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary-200">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Prediction Result</h2>
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getLevelColor(prediction.predicted_level)} text-white text-4xl font-bold shadow-lg`}>
                  {prediction.predicted_level}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-4">
                  PQF Level {prediction.predicted_level}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-1">Level Description</h3>
                  <p className="text-sm text-gray-600">{prediction.level_description}</p>
                </div>

                {prediction.confidence_score && (
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-2">Confidence Score</h3>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all"
                          style={{ width: `${prediction.confidence_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {(prediction.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {prediction.features_used && (
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-2">Analysis Features</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Hours:</span>
                        <span className="font-medium">{prediction.features_used.total_hours?.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weeks:</span>
                        <span className="font-medium">{prediction.features_used.num_weeks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Activity Complexity:</span>
                        <span className="font-medium">{prediction.features_used.activity_complexity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Skill Diversity:</span>
                        <span className="font-medium">{prediction.features_used.skill_diversity}</span>
                      </div>
                    </div>
                  </div>
                )}

                {prediction.student_name && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Student:</strong> {prediction.student_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Model:</strong> {prediction.model_used}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No prediction yet</p>
              <p className="text-sm">Select a student or use quick predict to analyze PQF Level</p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <History className="h-5 w-5 mr-2" />
            Prediction History
          </h2>
          {predictions.length > 0 && (
            <button
              onClick={handleResetHistory}
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Reset History
            </button>
          )}
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PQF Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.slice(0, 10).map((pred) => (
                <tr key={pred.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(pred.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Student #{pred.student_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {pred.model_used}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getLevelColor(pred.predicted_level)}`}>
                      Level {pred.predicted_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pred.confidence_score ? `${(pred.confidence_score * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => generatePDF(pred)}
                      disabled={signatories.filter(s => s.is_active).length === 0}
                      className="text-primary-600 hover:text-primary-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title={signatories.filter(s => s.is_active).length === 0 ? 'Add signatories first' : 'Download Certificate PDF'}
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {predictions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No prediction history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Signatory Management Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Certificate Signatories
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({signatories.filter(s => s.is_active).length} active)
            </span>
          </h2>
          <button
            onClick={() => {
              setEditingSignatory(null);
              setSignatoryForm({ name: '', position: '', office: '', display_order: signatories.length + 1 });
              setShowSignatoryModal(true);
            }}
            className="btn-primary flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Signatory
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {signatories.sort((a, b) => a.display_order - b.display_order).map((signatory) => (
                <tr key={signatory.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {signatory.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {signatory.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {signatory.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {signatory.office}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleSignatory(signatory.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        signatory.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {signatory.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditSignatory(signatory)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSignatory(signatory.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {signatories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No signatories added yet. Add at least 5 signatories for certificate generation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Generation Button */}
      {prediction && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => generateCertificate(prediction)}
            className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
          >
            <FileText className="h-6 w-6" />
            <span>Generate PQF Certificate</span>
          </button>
        </div>
      )}

      {/* Signatory Modal */}
      {showSignatoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSignatory ? 'Edit Signatory' : 'Add Signatory'}
              </h2>
              <button onClick={() => setShowSignatoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSignatorySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.name}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="label">Position *</label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.position}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, position: e.target.value })}
                    className="input-field"
                    placeholder="e.g., University President"
                  />
                </div>
                <div>
                  <label className="label">Office/Organization *</label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.office}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, office: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Nueva Vizcaya State University"
                  />
                </div>
                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={signatoryForm.display_order}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, display_order: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {editingSignatory && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this signatory?')) {
                        handleDeleteSignatory(editingSignatory.id);
                        setShowSignatoryModal(false);
                        setEditingSignatory(null);
                      }
                    }}
                    className="btn-danger flex items-center mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSignatoryModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSignatory ? 'Update' : 'Add Signatory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Generation Modal */}
      {showCertificateModal && selectedPrediction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generate PQF Certificate</h2>
              <button onClick={() => setShowCertificateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Certificate Preview</h3>
                <p className="text-sm text-blue-800">
                  This will generate a PQF Level {selectedPrediction.predicted_level} certificate for the student.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Active Signatories ({signatories.filter(s => s.is_active).length})</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {signatories.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order).map((s, index) => (
                    <div key={s.id} className="flex items-center text-sm py-1">
                      <span className="text-gray-500 w-6">{index + 1}.</span>
                      <span className="text-gray-900">{s.name}</span>
                      <span className="text-gray-500 ml-2">- {s.position}</span>
                    </div>
                  ))}
                  {signatories.filter(s => s.is_active).length === 0 && (
                    <p className="text-red-500 text-sm">No active signatories. Please add signatories first.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCertificate}
                  disabled={signatories.filter(s => s.is_active).length === 0}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Print Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Predictions;

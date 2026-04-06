import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Brain, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { studentAPI, predictionAPI, modelAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAccomplishments: 0,
    totalPredictions: 0,
    loadedModels: 0,
  });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [studentsRes, predictionsRes, modelsRes] = await Promise.all([
        studentAPI.getAll(),
        predictionAPI.getAll(),
        modelAPI.getAll(),
      ]);

      const students = studentsRes.data.data || [];
      const predictions = predictionsRes.data.data || [];
      const loadedModels = modelsRes.data.data?.loaded_models || [];

      // Count accomplishments from all students
      let totalAccomplishments = 0;
      students.forEach(s => {
        totalAccomplishments += s.accomplishments_count || 0;
      });

      setStats({
        totalStudents: students.length,
        totalAccomplishments,
        totalPredictions: predictions.length,
        loadedModels: loadedModels.length,
      });

      // Get recent predictions
      setRecentPredictions(predictions.slice(0, 5));
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your PQF Classification System</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* System Title */}
      <div className="mb-8 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-primary-700">
          Predictive Model for Philippine Qualifications Framework Level Classification of On-the-Job Training Tasks
        </h2>
        <div className="mt-2 w-24 h-1 bg-primary-500 mx-auto rounded"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Students"
          value={stats.totalStudents}
          color="bg-blue-500"
          subtitle="Registered in system"
        />
        <StatCard
          icon={FileText}
          title="Accomplishments"
          value={stats.totalAccomplishments}
          color="bg-green-500"
          subtitle="OJT records logged"
        />
        <StatCard
          icon={Brain}
          title="Predictions"
          value={stats.totalPredictions}
          color="bg-purple-500"
          subtitle="PQF classifications"
        />
        <StatCard
          icon={Activity}
          title="Models Loaded"
          value={stats.loadedModels}
          color="bg-orange-500"
          subtitle="Active classifiers"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Predictions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Predictions</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          {recentPredictions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No predictions yet</p>
              <p className="text-sm">Add student accomplishments and run predictions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPredictions.map((pred) => (
                <div key={pred.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${getLevelColor(pred.predicted_level)} flex items-center justify-center text-white font-bold`}>
                      {pred.predicted_level}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Student #{pred.student_id}</p>
                      <p className="text-sm text-gray-500">{pred.model_used}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {(pred.confidence_score * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(pred.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-800">API Server</span>
              </div>
              <span className="text-green-600 text-sm">Running</span>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Quick Start Guide</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="font-bold">1.</span>
                  <span>Go to <strong>Model Management</strong> and upload your PQF classifier model</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">2.</span>
                  <span>Add students in the <strong>Students</strong> section</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">3.</span>
                  <span>Record OJT accomplishments in <strong>Accomplishments</strong></span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">4.</span>
                  <span>Run PQF predictions in <strong>PQF Predictions</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

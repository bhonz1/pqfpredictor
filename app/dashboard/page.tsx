'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  Settings, 
  LogOut,
  Menu,
  TrendingUp,
  Clock,
  CheckCircle,
  GraduationCap,
  Award,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [accomplishments, setAccomplishments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccomplishment, setEditingAccomplishment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAccomplishment, setDeletingAccomplishment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullname: '',
    course: '',
    institution: ''
  });

  const [editForm, setEditForm] = useState({
    week_number: '',
    month: '',
    performed_activities: '',
    skills_gained: '',
    hours_rendered: ''
  });

  // Add Accomplishment modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    week_number: '',
    month: '',
    performed_activities: '',
    skills_gained: '',
    hours_rendered: ''
  });

  const supabase = createClient();

  // Fetch student data and accomplishments
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get logged in student from localStorage
        const studentData = localStorage.getItem('student');
        if (!studentData) {
          // Redirect to login if no student data
          window.location.href = '/login';
          return;
        }
        
        const parsedStudent = JSON.parse(studentData);
        setStudent(parsedStudent);

        // Fetch accomplishments for this student
        const { data: accomplishmentsData, error: accomError } = await supabase
          .from('accomplishments')
          .select('*')
          .eq('student_id', parsedStudent.student_id)
          .order('week_number', { ascending: true });

        if (accomError) throw accomError;
        setAccomplishments(accomplishmentsData || []);

        // Fetch predictions for this student
        const { data: predictionsData, error: predError } = await supabase
          .from('pqf_predictions')
          .select('*')
          .eq('student_id', parsedStudent.student_id)
          .order('created_at', { ascending: false });

        if (predError) throw predError;
        setPredictions(predictionsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (accomplishment) => {
    setEditingAccomplishment(accomplishment);
    setEditForm({
      week_number: accomplishment.week_number,
      month: accomplishment.month || '',
      performed_activities: accomplishment.performed_activities || '',
      skills_gained: accomplishment.skills_gained || '',
      hours_rendered: accomplishment.hours_rendered
    });
    setIsEditModalOpen(true);
    setFormError('');
  };

  const handleDeleteClick = (accomplishment) => {
    setDeletingAccomplishment(accomplishment);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const { error } = await supabase
        .from('accomplishments')
        .update({
          week_number: parseInt(editForm.week_number),
          month: editForm.month,
          performed_activities: editForm.performed_activities,
          skills_gained: editForm.skills_gained,
          hours_rendered: parseInt(editForm.hours_rendered),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAccomplishment.id);

      if (error) throw error;

      // Update local state
      setAccomplishments(prev => 
        prev.map(acc => 
          acc.id === editingAccomplishment.id 
            ? { ...acc, ...editForm, week_number: parseInt(editForm.week_number), hours_rendered: parseInt(editForm.hours_rendered) }
            : acc
        ).sort((a, b) => a.week_number - b.week_number)
      );

      setIsEditModalOpen(false);
      setEditingAccomplishment(null);
    } catch (err) {
      console.error('Error updating accomplishment:', err);
      setFormError('Failed to update accomplishment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('accomplishments')
        .delete()
        .eq('id', deletingAccomplishment.id);

      if (error) throw error;

      // Update local state
      setAccomplishments(prev => prev.filter(acc => acc.id !== deletingAccomplishment.id));
      setIsDeleteModalOpen(false);
      setDeletingAccomplishment(null);
    } catch (err) {
      console.error('Error deleting accomplishment:', err);
      alert('Failed to delete accomplishment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProfile = () => {
    setProfileForm({
      fullname: student?.fullname || '',
      course: student?.course || '',
      institution: student?.institution || ''
    });
    setFormError('');
    setIsEditingProfile(true);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const { error } = await supabase
        .from('students')
        .update({
          fullname: profileForm.fullname,
          course: profileForm.course,
          institution: profileForm.institution,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student.student_id);

      if (error) throw error;

      // Update local state and localStorage
      const updatedStudent = { ...student, ...profileForm, updated_at: new Date().toISOString() };
      setStudent(updatedStudent);
      localStorage.setItem('student', JSON.stringify(updatedStudent));

      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setFormError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setAddForm({
      week_number: '',
      month: '',
      performed_activities: '',
      skills_gained: '',
      hours_rendered: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const { data, error } = await supabase
        .from('accomplishments')
        .insert([{
          student_id: student.student_id,
          week_number: parseInt(addForm.week_number),
          month: addForm.month,
          performed_activities: addForm.performed_activities,
          skills_gained: addForm.skills_gained,
          hours_rendered: parseInt(addForm.hours_rendered),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAccomplishments(prev => [...prev, data].sort((a, b) => a.week_number - b.week_number));

      setIsAddModalOpen(false);
      setAddForm({
        week_number: '',
        month: '',
        performed_activities: '',
        skills_gained: '',
        hours_rendered: ''
      });
    } catch (err) {
      console.error('Error adding accomplishment:', err);
      setFormError('Failed to add accomplishment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#' },
    { id: 'accomplishment', label: 'Accomplishment', icon: FileText, href: '#' },
    { id: 'pqf-prediction', label: 'PQF Prediction', icon: Target, href: '#' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '#' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">PQF Predictor</h1>
              <p className="text-xs text-slate-500">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          <button 
            onClick={() => {
              localStorage.removeItem('student');
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-slate-900 capitalize">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {student?.fullname ? student.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{student?.fullname || 'Loading...'}</p>
                  <p className="text-xs text-slate-500">{predictions.length > 0 ? `Level ${predictions[0].predicted_level} Student` : 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid - Only 2 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Hours
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {accomplishments.reduce((sum, acc) => sum + (acc.hours_rendered || 0), 0)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Hours Completed</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Count
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{accomplishments.length}</p>
                  <p className="text-sm text-slate-500 mt-1">Accomplishments Uploaded</p>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Chart Placeholder */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Progress Overview</h3>
                  <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
                      <p className="text-slate-500">Progress chart will appear here</p>
                    </div>
                  </div>
                </div>

                {/* Recent Accomplishments */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Accomplishments</h3>
                  <div className="space-y-4">
                    {accomplishments.slice(-4).reverse().map((acc) => (
                      <div key={acc.id} className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <FileText className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900">Week {acc.week_number} - {acc.month || 'N/A'}</p>
                          <p className="text-xs text-slate-500 truncate">{acc.performed_activities?.slice(0, 30)}...</p>
                        </div>
                      </div>
                    ))}
                    {accomplishments.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No accomplishments yet</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'accomplishment' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">My Accomplishments</h3>
                  <p className="text-sm text-slate-500">Manage your OJT weekly accomplishments</p>
                </div>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Accomplishment
                </button>
              </div>

              {/* Accomplishments Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading accomplishments...</p>
                  </div>
                ) : accomplishments.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-900 font-medium mb-2">No accomplishments yet</p>
                    <p className="text-slate-500 text-sm mb-4">Start tracking your OJT progress by adding your first accomplishment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Week</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Activities</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Skills Gained</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {accomplishments.map((accomplishment) => (
                          <tr key={accomplishment.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                Week {accomplishment.week_number}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-slate-600">{accomplishment.month || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-900 line-clamp-2">{accomplishment.performed_activities || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-900 line-clamp-2">{accomplishment.skills_gained || '-'}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-slate-900">{accomplishment.hours_rendered} hrs</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(accomplishment)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(accomplishment)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {accomplishments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-sm text-indigo-600 font-medium">Total Weeks</p>
                    <p className="text-2xl font-bold text-indigo-900">{accomplishments.length}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-sm text-emerald-600 font-medium">Total Hours</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {accomplishments.reduce((sum, acc) => sum + (acc.hours_rendered || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-600 font-medium">Avg Hours/Week</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {Math.round(accomplishments.reduce((sum, acc) => sum + (acc.hours_rendered || 0), 0) / accomplishments.length)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pqf-prediction' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900">PQF Level Prediction</h3>
                <p className="text-sm text-slate-500">Your current qualification level based on latest analysis</p>
              </div>

              {loading ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-500">Loading prediction...</p>
                </div>
              ) : predictions.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-900 font-medium mb-2">No predictions yet</p>
                  <p className="text-slate-500 text-sm mb-4">Your PQF level prediction will appear here after your first assessment</p>
                </div>
              ) : (
                <>
                  {/* Certificate Card */}
                  {(() => {
                    const latestPrediction = predictions[0];
                    const levelTitles = {
                      1: 'Foundation',
                      2: 'Intermediate',
                      3: 'Advanced',
                      4: 'Professional',
                      5: 'Expert',
                      6: 'Master'
                    };
                    const levelColors = {
                      1: 'from-slate-500 to-slate-600',
                      2: 'from-blue-500 to-blue-600',
                      3: 'from-emerald-500 to-emerald-600',
                      4: 'from-indigo-500 to-indigo-600',
                      5: 'from-purple-500 to-purple-600',
                      6: 'from-amber-500 to-amber-600'
                    };
                    const levelBgColors = {
                      1: 'bg-slate-50 border-slate-200',
                      2: 'bg-blue-50 border-blue-200',
                      3: 'bg-emerald-50 border-emerald-200',
                      4: 'bg-indigo-50 border-indigo-200',
                      5: 'bg-purple-50 border-purple-200',
                      6: 'bg-amber-50 border-amber-200'
                    };

                    return (
                      <div className={`${levelBgColors[latestPrediction.predicted_level]} border rounded-2xl p-8 shadow-sm`}>
                        {/* Certificate Body - Simplified */}
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                          {/* Level Badge - Main Focus */}
                          <div className="flex justify-center mb-8">
                            <div className={`bg-gradient-to-r ${levelColors[latestPrediction.predicted_level]} text-white px-8 py-4 rounded-2xl shadow-lg`}>
                              <div className="text-center">
                                <p className="text-sm opacity-90">Predicted PQF Level</p>
                                <p className="text-5xl font-bold">{latestPrediction.predicted_level}</p>
                                <p className="text-lg font-medium">{levelTitles[latestPrediction.predicted_level]}</p>
                              </div>
                            </div>
                          </div>

                          {/* Details - 4 Fields Only */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                              <p className="text-3xl font-bold text-slate-900">{latestPrediction.predicted_level}</p>
                              <p className="text-sm text-slate-500">PQF Level</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                              <p className="text-3xl font-bold text-slate-900">{Math.round(latestPrediction.confidence_score)}%</p>
                              <p className="text-sm text-slate-500">Confidence</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                              <p className="text-3xl font-bold text-slate-900">{latestPrediction.total_hours || accomplishments.reduce((sum, acc) => sum + (acc.hours_rendered || 0), 0)}</p>
                              <p className="text-sm text-slate-500"># of Hours</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                              <p className="text-3xl font-bold text-slate-900">{accomplishments.length}</p>
                              <p className="text-sm text-slate-500">Weeks</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                          <button 
                            onClick={() => window.print()}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Print Certificate
                          </button>
                          <button 
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                          >
                            <Award className="h-4 w-4" />
                            Download PDF
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Prediction History */}
                  {predictions.length > 1 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Prediction History</h4>
                      <div className="space-y-3">
                        {predictions.slice(1).map((pred, index) => (
                          <div key={pred.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <span className="text-lg font-bold text-indigo-700">{pred.predicted_level}</span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">Level {pred.predicted_level}</p>
                                <p className="text-sm text-slate-500">{pred.model_used || 'Default Model'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-900">{Math.round(pred.confidence_score)}% confidence</p>
                              <p className="text-xs text-slate-400">
                                {new Date(pred.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
                <p className="text-sm text-slate-500">Manage your account profile</p>
              </div>

              {/* Profile Card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                      {student?.fullname ? student.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{student?.fullname || 'Loading...'}</h4>
                      <p className="text-sm text-slate-500">Student ID: {student?.student_id}</p>
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {formError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{formError}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          name="fullname"
                          value={profileForm.fullname}
                          onChange={handleProfileInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
                        <select
                          name="course"
                          value={profileForm.course}
                          onChange={handleProfileInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          required
                        >
                          <option value="">Select Course</option>
                          <option value="BS Information Technology">BS Information Technology</option>
                          <option value="BS Computer Science">BS Computer Science</option>
                          <option value="BS Information Systems">BS Information Systems</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Institution *</label>
                        <input
                          type="text"
                          name="institution"
                          value={profileForm.institution}
                          onChange={handleProfileInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                          placeholder="Enter your institution"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
                          <p className="text-sm font-medium text-slate-900">{student?.fullname || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Student ID</p>
                          <p className="text-sm font-medium text-slate-900">{student?.student_id || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Course</p>
                          <p className="text-sm font-medium text-slate-900">{student?.course || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Institution</p>
                          <p className="text-sm font-medium text-slate-900">{student?.institution || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <button
                          onClick={handleEditProfile}
                          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Member Since</span>
                    <span className="text-slate-900">{student?.created_at ? new Date(student.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Updated</span>
                    <span className="text-slate-900">{student?.updated_at ? new Date(student.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accomplishments</span>
                    <span className="text-slate-900">{accomplishments.length} entries</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Edit Accomplishment</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Week Number *</label>
                  <input
                    type="number"
                    name="week_number"
                    value={editForm.week_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month *</label>
                  <select
                    name="month"
                    value={editForm.month}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Performed Activities</label>
                  <textarea
                    name="performed_activities"
                    value={editForm.performed_activities}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Describe the activities you performed this week..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Skills Gained</label>
                  <textarea
                    name="skills_gained"
                    value={editForm.skills_gained}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="List the skills you gained this week..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours Rendered *</label>
                  <input
                    type="number"
                    name="hours_rendered"
                    value={editForm.hours_rendered}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    min="0"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Accomplishment Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Add Accomplishment</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Week Number *</label>
                  <input
                    type="number"
                    name="week_number"
                    value={addForm.week_number}
                    onChange={handleAddInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    min="1"
                    placeholder="e.g. 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month *</label>
                  <select
                    name="month"
                    value={addForm.month}
                    onChange={handleAddInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Performed Activities</label>
                  <textarea
                    name="performed_activities"
                    value={addForm.performed_activities}
                    onChange={handleAddInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Describe the activities you performed this week..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Skills Gained</label>
                  <textarea
                    name="skills_gained"
                    value={addForm.skills_gained}
                    onChange={handleAddInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="List the skills you gained this week..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours Rendered *</label>
                  <input
                    type="number"
                    name="hours_rendered"
                    value={addForm.hours_rendered}
                    onChange={handleAddInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    min="0"
                    placeholder="e.g. 40"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Accomplishment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Accomplishment</h3>
                <p className="text-slate-500 mb-6">
                  Are you sure you want to delete Week {deletingAccomplishment?.week_number} ({deletingAccomplishment?.month || 'N/A'})? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

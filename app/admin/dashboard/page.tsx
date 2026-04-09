'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Target,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  Shield,
  Plus,
  Search,
  Box,
  Edit2,
  Trash2,
  X,
  UserPlus,
  Calendar,
  Clock,
  BookOpen,
  Wrench,
  Upload,
  Brain,
  FileUp,
  Check,
  Award,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Accomplishments state
  const [showAddAccomplishmentModal, setShowAddAccomplishmentModal] = useState(false);
  const [showEditAccomplishmentModal, setShowEditAccomplishmentModal] = useState(false);
  const [showDeleteAccomplishmentModal, setShowDeleteAccomplishmentModal] = useState(false);
  const [selectedAccomplishment, setSelectedAccomplishment] = useState(null);
  const [selectedStudentForAccomplishment, setSelectedStudentForAccomplishment] = useState(null);
  const [accomplishmentSearchQuery, setAccomplishmentSearchQuery] = useState('');

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  // Prediction History state (needed early for useEffect)
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [predictionHistoryLoading, setPredictionHistoryLoading] = useState(false);
  const [predictionHistoryError, setPredictionHistoryError] = useState(null);
  const [showResetHistoryModal, setShowResetHistoryModal] = useState(false);
  const [isResettingHistory, setIsResettingHistory] = useState(false);

  // Admin user state (for course-based access control)
  const [adminUser, setAdminUser] = useState(null);

  // PQF Prediction state
  const [predictionStudent, setPredictionStudent] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentAccomplishmentsCount, setStudentAccomplishmentsCount] = useState(0);
  const studentDropdownRef = useRef(null);

  // Initialize Supabase client with useMemo to handle missing env vars gracefully
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }, []);

  // Fetch students from database (filtered by admin's course)
  const fetchStudents = async () => {
    if (!supabase) {
      setStudentsError('Database connection not available. Check environment variables.');
      return;
    }
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      // Get admin info from localStorage if not in state yet
      const storedAdmin = localStorage.getItem('adminUser');
      const admin = adminUser || (storedAdmin ? JSON.parse(storedAdmin) : null);
      
      let query = supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by course if admin has a course assigned (not superadmin)
      if (admin && admin.course && !admin.isSuperAdmin) {
        query = query.eq('course', admin.course);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudentsError(err.message || 'Failed to load students from database');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Load admin info and students on mount
  useEffect(() => {
    // Load admin info from localStorage
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    } else {
      // Redirect to login if no admin info
      window.location.href = '/admin';
      return;
    }
    fetchStudents();
    fetchPredictionHistory();
  }, []);

  // Click outside handler for student dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch prediction history from database (filtered by admin's course)
  const fetchPredictionHistory = async () => {
    if (!supabase) {
      setPredictionHistoryError('Database connection not available.');
      return;
    }
    setPredictionHistoryLoading(true);
    try {
      // Get admin info from localStorage if not in state yet
      const storedAdmin = localStorage.getItem('adminUser');
      const admin = adminUser || (storedAdmin ? JSON.parse(storedAdmin) : null);
      
      let query = supabase
        .from('pqf_predictions')
        .select(`
          *,
          students:student_id (fullname, student_id, course)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Filter by course if admin has a course assigned (not superadmin)
      if (admin && admin.course && !admin.isSuperAdmin) {
        query = query.eq('students.course', admin.course);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setPredictionHistory(data || []);
    } catch (err) {
      console.error('Error fetching prediction history:', err);
    } finally {
      setPredictionHistoryLoading(false);
    }
  };

  // Reset prediction history
  const handleResetPredictionHistory = async () => {
    if (predictionHistory.length === 0) {
      setShowResetHistoryModal(false);
      return;
    }

    setIsResettingHistory(true);
    try {
      const { error } = await supabase
        .from('pqf_predictions')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (error) throw error;
      
      setPredictionHistory([]);
      setShowResetHistoryModal(false);
      alert('Prediction history has been reset successfully.');
    } catch (err) {
      console.error('Error resetting prediction history:', err);
      alert('Failed to reset prediction history: ' + err.message);
    } finally {
      setIsResettingHistory(false);
    }
  };

  // Mock accomplishments data - will be replaced with database fetch
  const [accomplishments, setAccomplishments] = useState([]);
  const [accomplishmentsLoading, setAccomplishmentsLoading] = useState(false);
  const [accomplishmentsError, setAccomplishmentsError] = useState(null);

  // Fetch accomplishments from database (filtered by admin's course)
  const fetchAccomplishments = async () => {
    setAccomplishmentsLoading(true);
    setAccomplishmentsError(null);
    try {
      // Get admin info from localStorage if not in state yet
      const storedAdmin = localStorage.getItem('adminUser');
      const admin = adminUser || (storedAdmin ? JSON.parse(storedAdmin) : null);
      
      let query = supabase
        .from('accomplishments')
        .select('*, students!inner(student_id, course)')
        .order('created_at', { ascending: false });
      
      // Filter by course if admin has a course assigned (not superadmin)
      if (admin && admin.course && !admin.isSuperAdmin) {
        query = query.eq('students.course', admin.course);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAccomplishments(data || []);
    } catch (err) {
      console.error('Error fetching accomplishments:', err);
      setAccomplishmentsError('Failed to load accomplishments from database');
    } finally {
      setAccomplishmentsLoading(false);
    }
  };

  // Load accomplishments on mount
  useEffect(() => {
    fetchAccomplishments();
  }, []);

  const [formData, setFormData] = useState({
    student_id: '',
    fullname: '',
    course: 'BS Information Technology',
    institution: '',
    password: ''
  });

  const [accomplishmentFormData, setAccomplishmentFormData] = useState({
    student_id: '',
    week_number: 1,
    month: 'January',
    performed_activities: '',
    skills_gained: '',
    hours_rendered: 0
  });

  // Model management state
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  // Fetch models from database
  const fetchModels = async () => {
    if (!supabase) {
      setModelsError('Database connection not available.');
      return;
    }
    setModelsLoading(true);
    setModelsError(null);
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      console.error('Error fetching models:', err);
      setModelsError(err.message || 'Failed to load models from database');
    } finally {
      setModelsLoading(false);
    }
  };

  // Load models on mount
  useEffect(() => {
    fetchModels();
  }, []);
  const [showUploadModelModal, setShowUploadModelModal] = useState(false);
  const [showDeleteModelModal, setShowDeleteModelModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [modelFormData, setModelFormData] = useState({
    name: '',
    model_type: 'WEKA Random Forest',
    file: null
  });

  // Settings - User Management state
  const [settingsSubTab, setSettingsSubTab] = useState('user-management');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    username: '',
    fullname: '',
    password: '',
    role: 'admin'
  });

  // Fetch admin users from database
  const fetchAdminUsers = async () => {
    if (!supabase) {
      setAdminUsersError('Database connection not available.');
      return;
    }
    setAdminUsersLoading(true);
    setAdminUsersError(null);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*');
      
      if (error) throw error;
      setAdminUsers(data || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setAdminUsersError(err.message || 'Failed to load admin users');
    } finally {
      setAdminUsersLoading(false);
    }
  };

  // Load admin users on mount
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleAddAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert([adminFormData])
        .select()
        .single();
      
      if (error) throw error;
      
      setAdminUsers([data, ...adminUsers]);
      setShowAddAdminModal(false);
      setAdminFormData({ username: '', fullname: '', password: '', role: 'admin' });
    } catch (err) {
      console.error('Error adding admin:', err);
      alert('Failed to add admin: ' + err.message);
    }
  };

  const handleEditAdmin = async () => {
    try {
      const updateData = { ...adminFormData };
      if (!updateData.password) delete updateData.password;
      
      const { data, error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', selectedAdmin.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setAdminUsers(adminUsers.map(a => a.id === selectedAdmin.id ? data : a));
      setShowEditAdminModal(false);
      setSelectedAdmin(null);
    } catch (err) {
      console.error('Error updating admin:', err);
      alert('Failed to update admin: ' + err.message);
    }
  };

  const handleDeleteAdmin = async () => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', selectedAdmin.id);
      
      if (error) throw error;
      
      setAdminUsers(adminUsers.filter(a => a.id !== selectedAdmin.id));
      setShowDeleteAdminModal(false);
      setSelectedAdmin(null);
    } catch (err) {
      console.error('Error deleting admin:', err);
      alert('Failed to delete admin: ' + err.message);
    }
  };

  const openEditAdminModal = (admin) => {
    setSelectedAdmin(admin);
    setAdminFormData({
      username: admin.username,
      fullname: admin.fullname,
      password: '',
      role: admin.role
    });
    setShowEditAdminModal(true);
  };

  const openDeleteAdminModal = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteAdminModal(true);
  };

  const handleAddStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([formData])
        .select()
        .single();
      
      if (error) throw error;
      
      setStudents([data, ...students]);
      setShowAddModal(false);
      setFormData({ student_id: '', fullname: '', course: 'BS Information Technology', institution: '', password: '' });
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student: ' + err.message);
    }
  };

  const handleEditStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(formData)
        .eq('id', selectedStudent.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setStudents(students.map(s => s.id === selectedStudent.id ? data : s));
      setShowEditModal(false);
      setSelectedStudent(null);
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Failed to update student: ' + err.message);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);
      
      if (error) throw error;
      
      setStudents(students.filter(s => s.id !== selectedStudent.id));
      setAccomplishments(accomplishments.filter(a => a.student_id !== selectedStudent.student_id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student: ' + err.message);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      student_id: student.student_id,
      fullname: student.fullname,
      course: student.course,
      institution: student.institution,
      password: student.password
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Accomplishments handlers
  const handleAddAccomplishment = async () => {
    try {
      const { data, error } = await supabase
        .from('accomplishments')
        .insert([accomplishmentFormData])
        .select()
        .single();
      
      if (error) throw error;
      
      setAccomplishments([data, ...accomplishments]);
      setShowAddAccomplishmentModal(false);
      setAccomplishmentFormData({ student_id: '', week_number: 1, month: 'January', performed_activities: '', skills_gained: '', hours_rendered: 0 });
    } catch (err) {
      console.error('Error adding accomplishment:', err);
      alert('Failed to add accomplishment: ' + err.message);
    }
  };

  const handleEditAccomplishment = async () => {
    try {
      const { data, error } = await supabase
        .from('accomplishments')
        .update(accomplishmentFormData)
        .eq('id', selectedAccomplishment.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setAccomplishments(accomplishments.map(a => a.id === selectedAccomplishment.id ? data : a));
      setShowEditAccomplishmentModal(false);
      setSelectedAccomplishment(null);
    } catch (err) {
      console.error('Error updating accomplishment:', err);
      alert('Failed to update accomplishment: ' + err.message);
    }
  };

  const handleDeleteAccomplishment = async () => {
    try {
      const { error } = await supabase
        .from('accomplishments')
        .delete()
        .eq('id', selectedAccomplishment.id);
      
      if (error) throw error;
      
      setAccomplishments(accomplishments.filter(a => a.id !== selectedAccomplishment.id));
      setShowDeleteAccomplishmentModal(false);
      setSelectedAccomplishment(null);
    } catch (err) {
      console.error('Error deleting accomplishment:', err);
      alert('Failed to delete accomplishment: ' + err.message);
    }
  };

  const openAddAccomplishmentModal = (student) => {
    setSelectedStudentForAccomplishment(student);
    setAccomplishmentFormData({
      student_id: student.student_id,
      week_number: 1,
      month: 'January',
      performed_activities: '',
      skills_gained: '',
      hours_rendered: 0
    });
    setShowAddAccomplishmentModal(true);
  };

  const openEditAccomplishmentModal = (accomplishment) => {
    setSelectedAccomplishment(accomplishment);
    setAccomplishmentFormData({
      student_id: accomplishment.student_id,
      week_number: accomplishment.week_number,
      month: accomplishment.month,
      performed_activities: accomplishment.performed_activities,
      skills_gained: accomplishment.skills_gained,
      hours_rendered: accomplishment.hours_rendered
    });
    setShowEditAccomplishmentModal(true);
  };

  const openDeleteAccomplishmentModal = (accomplishment) => {
    setSelectedAccomplishment(accomplishment);
    setShowDeleteAccomplishmentModal(true);
  };

  // Model management handlers
  const handleUploadModel = async () => {
    try {
      const newModelData = {
        name: modelFormData.name,
        filename: modelFormData.file ? modelFormData.file.name : 'uploaded_model.model',
        model_type: modelFormData.model_type,
        is_loaded: false,
        file_size: modelFormData.file ? (modelFormData.file.size / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB'
      };
      
      const { data, error } = await supabase
        .from('models')
        .insert([newModelData])
        .select()
        .single();
      
      if (error) throw error;
      
      setModels([data, ...models]);
      setShowUploadModelModal(false);
      setModelFormData({ name: '', model_type: 'WEKA Random Forest', file: null });
    } catch (err) {
      console.error('Error uploading model:', err);
      alert('Failed to upload model: ' + err.message);
    }
  };

  const handleDeleteModel = async () => {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', selectedModel.id);
      
      if (error) throw error;
      
      setModels(models.filter(m => m.id !== selectedModel.id));
      setShowDeleteModelModal(false);
      setSelectedModel(null);
    } catch (err) {
      console.error('Error deleting model:', err);
      alert('Failed to delete model: ' + err.message);
    }
  };

  const handleLoadModel = async (modelId) => {
    try {
      // First, unload all models
      await supabase
        .from('models')
        .update({ is_loaded: false })
        .neq('id', 0);
      
      // Then load the selected model
      const { data, error } = await supabase
        .from('models')
        .update({ is_loaded: true })
        .eq('id', modelId)
        .select()
        .single();
      
      if (error) throw error;
      
      setModels(models.map(m => ({ ...m, is_loaded: m.id === modelId })));
    } catch (err) {
      console.error('Error loading model:', err);
      alert('Failed to load model: ' + err.message);
    }
  };

  const openDeleteModelModal = (model) => {
    setSelectedModel(model);
    setShowDeleteModelModal(true);
  };

  // Check database connection
  const checkDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('students').select('id').limit(1);
      if (error) throw error;
      return { connected: true, error: null };
    } catch (err) {
      console.error('Database connection check failed:', err);
      return { connected: false, error: err.message };
    }
  };

  // PQF Prediction handler
  const handleRunPrediction = async () => {
    if (!predictionStudent) return;
    
    setIsPredicting(true);
    
    try {
      // Step 1: Check database connection
      const { connected, error: connError } = await checkDatabaseConnection();
      if (!connected) {
        alert(`Database connection failed: ${connError}. Please check your connection and try again.`);
        setIsPredicting(false);
        return;
      }
      
      // Step 2: Get the active/loaded model
      const { data: loadedModel, error: modelError } = await supabase
        .from('models')
        .select('*')
        .eq('is_loaded', true)
        .single();
      
      if (modelError || !loadedModel) {
        alert('No active model found. Please load a model from Model Management first.');
        setIsPredicting(false);
        return;
      }
      
      // Step 3: Get student accomplishments from database
      const { data: studentAccomplishments, error: accomError } = await supabase
        .from('accomplishments')
        .select('*')
        .eq('student_id', predictionStudent.student_id)
        .order('week_number', { ascending: true });
      
      if (accomError) throw accomError;
      
      // Check if student has any accomplishments
      if (!studentAccomplishments || studentAccomplishments.length === 0) {
        alert(`No accomplishments found for ${predictionStudent.fullname}. Please add accomplishments before running a prediction.`);
        setIsPredicting(false);
        return;
      }
      
      // Calculate metrics from accomplishments
      const totalHours = studentAccomplishments.reduce((sum, a) => sum + (a.hours_rendered || 0), 0);
      const totalWeeks = studentAccomplishments.length;
      
      // Step 4: Determine input type based on active model
      const modelTypeLower = loadedModel.model_type?.toLowerCase() || '';
      const isSkillsModel = modelTypeLower.includes('skill') || modelTypeLower.includes('rf') || modelTypeLower.includes('random forest');
      const activeInputType = isSkillsModel ? 'skills_gained' : 'performed_activities';
      
      // Step 5: Extract features based on active model type
      let inputFeatures = '';
      let featureSource = '';
      
      if (activeInputType === 'skills_gained') {
        // Combine all skills gained from accomplishments
        const allSkills = studentAccomplishments
          .map(a => a.skills_gained)
          .filter(skill => skill && skill.trim().length > 0);
        inputFeatures = allSkills.join(', ');
        featureSource = `${allSkills.length} weeks of skills data`;
      } else {
        // Combine all performed activities (default for most models)
        const allActivities = studentAccomplishments
          .map(a => a.performed_activities)
          .filter(activity => activity && activity.trim().length > 0);
        inputFeatures = allActivities.join(', ');
        featureSource = `${allActivities.length} weeks of activity data`;
      }
      
      // Check if there's actual content to analyze
      if (!inputFeatures || inputFeatures.trim().length === 0) {
        alert(`No ${activeInputType === 'skills_gained' ? 'skills gained' : 'performed activities'} data found in accomplishments. Please update the accomplishments with detailed information.`);
        setIsPredicting(false);
        return;
      }
      
      // Step 6: Run prediction using the active model
      const predictionResult = await runModelPrediction(
        inputFeatures,
        totalHours,
        totalWeeks,
        activeInputType,
        loadedModel.model_type
      );
      
      // Step 7: Save prediction to database with detailed info
      const predictionData = {
        student_id: predictionStudent.student_id,
        predicted_level: predictionResult.level,
        confidence_score: predictionResult.confidence,
        total_hours: totalHours,
        model_used: loadedModel.name,
        input_type: activeInputType,
        features_used: inputFeatures.substring(0, 500),
        general_assessment: (predictionResult as any).analysis?.reasoning || (predictionResult as any).reasoning || 'Assessment completed based on student OJT activities.'
      };
      
      const { data: savedPrediction, error: predError } = await supabase
        .from('pqf_predictions')
        .insert([predictionData])
        .select()
        .single();
      
      if (predError) throw predError;
      
      // Step 7: Set result with detailed analysis
      setPredictionResult({
        ...savedPrediction,
        student: predictionStudent,
        confidence: savedPrediction.confidence_score,
        timestamp: savedPrediction.created_at,
        features: inputFeatures,
        featureSource: featureSource,
        analysis: predictionResult.analysis,
        activeModel: loadedModel
      });
      
      // Refresh prediction history after new prediction
      fetchPredictionHistory();
      
    } catch (err) {
      console.error('Error running prediction:', err);
      alert('Failed to run prediction: ' + err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  // Model prediction logic - uses Cloudflare Workers AI LLM for better accuracy
  const runModelPrediction = async (features, totalHours, totalWeeks, inputType, modelType) => {
    try {
      // Call the Cloudflare Workers AI API route
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          features,
          totalHours,
          totalWeeks,
          inputType,
          modelType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        level: data.level,
        confidence: data.confidence,
        analysis: {
          totalHours,
          totalWeeks,
          reasoning: data.reasoning,
          llmAnalysis: data.analysis,
          modelType: modelType || 'Cloudflare AI (Llama 3.1)',
        }
      };
    } catch (error) {
      console.error('LLM Prediction failed, falling back to keyword analysis:', error);
      
      // Fallback to keyword-based prediction
      return runFallbackPrediction(features, totalHours, totalWeeks, modelType);
    }
  };

  // Fallback keyword-based prediction (original logic)
  const runFallbackPrediction = (features, totalHours, totalWeeks, modelType) => {
    // Feature preprocessing
    const featureText = features.toLowerCase();
    const featureWords = featureText.split(/[\s,;]+/).filter(w => w.length > 2);
    const uniqueWords = new Set(featureWords);
    const wordCount = featureWords.length;
    
    // Enhanced PQF Level Keywords with weights
    const keywordDatabase = {
      6: {
        keywords: ['architect', 'leadership', 'mentoring', 'research', 'innovation', 'strategic', 
                   'complex systems', 'enterprise', 'scalability', 'distributed systems', 
                   'machine learning', 'ai', 'artificial intelligence', 'blockchain', 'microservices',
                   'kubernetes', 'docker swarm', 'system design', 'technical leadership',
                   'advanced algorithms', 'optimization', 'performance tuning', 'security architecture',
                   'cloud architecture', 'devops', 'ci/cd pipelines', 'infrastructure as code'],
        weight: 3.0
      },
      5: {
        keywords: ['framework', 'design patterns', 'integration', 'api design', 'database design',
                  'backend', 'frontend', 'full stack', 'restful', 'graphql', 'oauth', 'jwt',
                  'authentication', 'authorization', 'middleware', 'caching', 'redis', 'message queue',
                  'event-driven', 'websocket', 'real-time', 'testing frameworks', 'automation'],
        weight: 2.5
      },
      4: {
        keywords: ['debugging', 'troubleshooting', 'profiling', 'code review', 'refactoring',
                  'version control', 'git', 'github', 'gitlab', 'agile', 'scrum', 'jira',
                  'sql', 'database', 'orm', 'mvc', 'mvvm', 'component', 'library', 'npm',
                  'package management', 'deployment', 'hosting', 'ssl', 'https'],
        weight: 2.0
      },
      3: {
        keywords: ['object-oriented', 'oop', 'inheritance', 'polymorphism', 'encapsulation',
                  'interfaces', 'abstract classes', 'data structures', 'arrays', 'lists', 'maps',
                  'algorithms', 'sorting', 'searching', 'recursion', 'iteration', 'loops',
                  'functions', 'methods', 'classes', 'objects', 'json', 'xml', 'parsing',
                  'error handling', 'exceptions', 'logging'],
        weight: 1.5
      },
      2: {
        keywords: ['variables', 'constants', 'data types', 'strings', 'numbers', 'booleans',
                  'conditionals', 'if else', 'switch', 'operators', 'arithmetic', 'logical',
                  'comparison', 'input', 'output', 'console', 'print', 'basic syntax',
                  'hello world', 'comments', 'documentation', 'ide', 'editor'],
        weight: 1.0
      },
      1: {
        keywords: ['introduction', 'overview', 'fundamentals', 'concepts', 'basics',
                  'getting started', 'tutorial', 'learning', 'study', 'theory',
                  'history', 'terminology', 'definitions', 'examples', 'exercises'],
        weight: 0.5
      }
    };
    
    const levelScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let totalKeywordMatches = 0;
    
    for (let level = 1; level <= 6; level++) {
      const { keywords, weight } = keywordDatabase[level];
      let matches = 0;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const exactMatches = (featureText.match(regex) || []).length;
        const partialMatches = featureText.includes(keyword) ? 1 : 0;
        matches += (exactMatches * 2) + (partialMatches * 0.5);
      });
      
      levelScores[level] = matches * weight;
      totalKeywordMatches += matches;
    }
    
    let hoursLevel = 1;
    if (totalHours >= 600) hoursLevel = 6;
    else if (totalHours >= 480) hoursLevel = 5;
    else if (totalHours >= 360) hoursLevel = 4;
    else if (totalHours >= 240) hoursLevel = 3;
    else if (totalHours >= 120) hoursLevel = 2;
    
    levelScores[hoursLevel] += 3;
    
    let consistencyBonus = 0;
    if (totalWeeks >= 24) consistencyBonus = 2;
    else if (totalWeeks >= 16) consistencyBonus = 1.5;
    else if (totalWeeks >= 12) consistencyBonus = 1;
    else if (totalWeeks >= 8) consistencyBonus = 0.5;
    
    const sortedLevels = Object.entries(levelScores)
      .map(([level, score]) => ({ level: parseInt(level), score }))
      .sort((a, b) => b.score - a.score);
    
    if (sortedLevels.length > 0) {
      const topLevel = sortedLevels[0].level;
      levelScores[topLevel] = (levelScores[topLevel] || 0) + consistencyBonus;
    }
    
    const richnessBonus = Math.min(2, uniqueWords.size / 100);
    if (sortedLevels.length > 0) {
      const topLevel = sortedLevels[0].level;
      levelScores[topLevel] = (levelScores[topLevel] || 0) + richnessBonus;
    }
    
    const maxPossibleScore = Math.max(...Object.values(levelScores));
    const levelConfidences = {};
    
    for (let level = 1; level <= 6; level++) {
      if (maxPossibleScore > 0) {
        const scoreRatio = levelScores[level] / maxPossibleScore;
        const stabilityFactor = Math.min(1, totalWeeks / 8);
        levelConfidences[level] = Math.round(scoreRatio * 100 * stabilityFactor);
      } else {
        levelConfidences[level] = 0;
      }
    }
    
    const PQF_RANGES = {
      1: { min: 50, max: 59, label: 'Foundation' },
      2: { min: 60, max: 69, label: 'Intermediate' },
      3: { min: 70, max: 74, label: 'Advanced' },
      4: { min: 75, max: 79, label: 'Professional' },
      5: { min: 80, max: 89, label: 'Expert' },
      6: { min: 90, max: 100, label: 'Master' }
    };
    
    const normalizeConfidenceToWEKA = (rawConfidence, level) => {
      const range = PQF_RANGES[level];
      if (rawConfidence < range.min) {
        return Math.round(range.min + (rawConfidence / 100) * (range.max - range.min));
      }
      return Math.min(range.max, Math.max(range.min, rawConfidence));
    };
    
    for (let level = 1; level <= 6; level++) {
      levelConfidences[level] = normalizeConfidenceToWEKA(levelConfidences[level], level);
    }
    
    const MAJORITY_THRESHOLD = 60;
    const MIN_WEEKS_FOR_STABILITY = 3;
    const isStable = totalWeeks >= MIN_WEEKS_FOR_STABILITY;
    
    const totalScore = Object.values(levelScores).reduce((sum, score) => sum + score, 0);
    
    const levelPercentages = {};
    for (let level = 1; level <= 6; level++) {
      levelPercentages[level] = totalScore > 0 
        ? Math.round((levelScores[level] / totalScore) * 100) 
        : 0;
    }
    
    let predictedLevel = 1;
    
    for (let level = 2; level <= 6; level++) {
      const prevLevel = level - 1;
      const currentLevelPercentage = levelPercentages[level];
      const prevLevelPercentage = levelPercentages[prevLevel];
      
      const meetsMajorityThreshold = currentLevelPercentage >= MAJORITY_THRESHOLD;
      const isHigherThanPrevious = currentLevelPercentage > prevLevelPercentage;
      const hasMinimumConfidence = levelConfidences[level] >= PQF_RANGES[level].min;
      
      if (meetsMajorityThreshold && isHigherThanPrevious && hasMinimumConfidence && isStable) {
        predictedLevel = level;
      } else if (!meetsMajorityThreshold || !isHigherThanPrevious) {
        break;
      }
    }
    
    if (!isStable && predictedLevel > 1) {
      predictedLevel = 1;
    }
    
    const majorityAnalysis = {
      levelPercentages,
      majorityThreshold: MAJORITY_THRESHOLD,
      appliedRule: 'Majority Prediction Rule (≥60%)'
    };
    
    let modelAdjustment = 0;
    if (modelType) {
      const modelTypeLower = modelType.toLowerCase();
      if (modelTypeLower.includes('random forest') || modelTypeLower.includes('ensemble')) {
        modelAdjustment = -0.3;
      } else if (modelTypeLower.includes('svm') || modelTypeLower.includes('neural')) {
        modelAdjustment = 0.3;
      }
    }
    
    if (levelConfidences[predictedLevel] >= PQF_RANGES[predictedLevel].min + 10) {
      const adjustedLevel = Math.max(1, Math.min(6, Math.round(predictedLevel + modelAdjustment)));
      if (levelConfidences[adjustedLevel] >= PQF_RANGES[adjustedLevel].min) {
        predictedLevel = adjustedLevel;
      }
    }
    
    let confidence = levelConfidences[predictedLevel];
    
    if (totalHours >= 400) confidence = Math.min(confidence + 2, PQF_RANGES[predictedLevel].max);
    else if (totalHours >= 300) confidence = Math.min(confidence + 1, PQF_RANGES[predictedLevel].max);
    
    if (totalWeeks >= 20) confidence = Math.min(confidence + 2, PQF_RANGES[predictedLevel].max);
    else if (totalWeeks >= 12) confidence = Math.min(confidence + 1, PQF_RANGES[predictedLevel].max);
    
    if (sortedLevels.length >= 2) {
      const topLevelScore = levelScores[predictedLevel];
      const secondBestScore = sortedLevels.find(l => l.level !== predictedLevel)?.score || 0;
      const scoreGap = topLevelScore - secondBestScore;
      
      if (scoreGap > 5) confidence = Math.min(confidence + 2, PQF_RANGES[predictedLevel].max);
      else if (scoreGap > 2) confidence = Math.min(confidence + 1, PQF_RANGES[predictedLevel].max);
    }
    
    if (totalWeeks < MIN_WEEKS_FOR_STABILITY) {
      confidence = Math.max(confidence - 5, PQF_RANGES[predictedLevel].min);
    }
    
    const matchStrength = totalKeywordMatches / Math.max(1, wordCount) * 100;
    
    confidence = Math.min(PQF_RANGES[predictedLevel].max, Math.max(PQF_RANGES[predictedLevel].min, Math.round(confidence)));
    
    return {
      level: predictedLevel,
      confidence: confidence,
      analysis: {
        totalHours,
        totalWeeks,
        uniqueWords: uniqueWords.size,
        totalWords: wordCount,
        keywordMatches: Math.round(totalKeywordMatches),
        matchStrength: Math.round(matchStrength * 10) / 10,
        levelScores: levelScores,
        levelConfidences: levelConfidences,
        levelPercentages: levelPercentages,
        majorityAnalysis: majorityAnalysis,
        modelType: modelType || 'Keyword Fallback',
        stability: isStable,
        minWeeksRequired: MIN_WEEKS_FOR_STABILITY,
        note: 'Fallback prediction used (AI service unavailable)'
      }
    };
  };

  // Generate certificate from prediction history
  const generateCertificateFromHistory = (prediction: any) => {
    // Create a compatible prediction result object from history data
    const historyPredictionResult = {
      predicted_level: prediction.predicted_level,
      confidence: prediction.confidence_score,
      confidence_score: prediction.confidence_score,
      total_hours: prediction.total_hours,
      student: prediction.students || {
        fullname: prediction.students?.fullname || 'Unknown Student',
        student_id: prediction.student_id,
        course: prediction.students?.course || 'N/A'
      },
      analysis: {
        reasoning: prediction.general_assessment || prediction.features_used || 'Assessment based on historical prediction data.',
        modelPrediction: {
          levelScores: {}
        }
      },
      features: prediction.features_used || '',
      timestamp: prediction.created_at
    };
    
    // Temporarily set as current prediction result and generate
    const originalResult = predictionResult;
    setPredictionResult(historyPredictionResult as any);
    
    // Generate certificate with slight delay to ensure state update
    setTimeout(() => {
      generateCertificateForHistory(historyPredictionResult);
      // Restore original result
      setPredictionResult(originalResult);
    }, 100);
  };

  // Certificate generator for history (doesn't depend on predictionResult state)
  const generateCertificateForHistory = (result: any) => {
    if (!result) return;
    
    // Open certificate in new window with exact 8.5in x 11in dimensions (96 DPI)
    const width = 816;  // 8.5 inches at 96 DPI
    const height = 1056; // 11 inches at 96 DPI
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const certWindow = window.open(
      '',
      'Certificate',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );
    
    if (certWindow) {
      const levelNames: Record<number, string> = {
        1: 'Foundation',
        2: 'Intermediate',
        3: 'Advanced',
        4: 'Professional',
        5: 'Expert',
        6: 'Master'
      };
      
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const certificateId = `PQF-${today.getFullYear()}-${String(result.student.student_id).padStart(6, '0')}`;
      
      const activityPercentage = Math.round(result.confidence || 0);
      const assessmentComment = result.analysis?.reasoning || 
        'Assessment completed based on student OJT activities and performance metrics.';
      
      certWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PQF Certificate - ${result.student.fullname}</title>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>
            @page { size: 8.5in 11in; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 8.5in; height: 11in; font-family: 'Inter', sans-serif;
              background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .certificate {
              width: 8.5in; height: 11in; background: #ffffff;
              position: relative; border-radius: 12px;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
              padding: 48px; display: flex; flex-direction: column;
            }
            .header {
              text-align: center; margin-bottom: 32px;
              padding-bottom: 24px; border-bottom: 2px solid #166534;
            }
            .university-name {
              font-family: 'Cormorant Garamond', serif; font-size: 20px;
              font-weight: 600; color: #166534; letter-spacing: 2px;
              text-transform: uppercase; margin-bottom: 4px;
            }
            .college-name { font-size: 12px; color: #166534; margin-bottom: 16px; }
            .certificate-title {
              font-family: 'Cormorant Garamond', serif; font-size: 32px;
              font-weight: 600; color: #1e293b; letter-spacing: 3px; text-transform: uppercase;
            }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 8px; letter-spacing: 1px; }
            
            /* Student Name Section */
            .student-name-section {
              text-align: center;
              padding: 20px 0;
              margin-bottom: 16px;
              border-bottom: 2px solid #e2e8f0;
            }
            .student-label {
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .student-name {
              font-family: 'Cormorant Garamond', serif;
              font-size: 32px;
              font-weight: 600;
              color: #1e293b;
              letter-spacing: 2px;
              margin-bottom: 4px;
            }
            .student-id {
              font-size: 11px;
              color: #94a3b8;
              font-family: 'Courier New', monospace;
            }
            
            /* Portfolio Grid - Two Columns */
            .portfolio-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 20px;
            }
            
            /* Left Column - Information */
            .info-column {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .info-section {
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 12px;
            }
            .info-section:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .info-title {
              font-size: 9px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
            }
            .info-value-id {
              font-size: 10px;
              color: #94a3b8;
              font-family: 'Courier New', monospace;
            }
            .activity-bar {
              width: 100%;
              height: 8px;
              background: #e2e8f0;
              border-radius: 4px;
              margin-top: 8px;
              overflow: hidden;
            }
            .activity-bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
              border-radius: 4px;
            }
            
            /* Right Column - Level */
            .level-column {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 2px solid #10b981;
            }
            .level-header {
              font-size: 10px;
              color: #059669;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .level-badge {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              width: 100px;
              height: 100px;
              border-radius: 50%;
              margin-bottom: 12px;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
              border: 3px solid white;
            }
            .level-number {
              font-family: 'Cormorant Garamond', serif;
              font-size: 40px;
              font-weight: 700;
              line-height: 1;
            }
            .level-label {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-top: 2px;
              font-weight: 500;
            }
            .level-name {
              font-family: 'Cormorant Garamond', serif;
              font-size: 20px;
              font-weight: 600;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .level-confidence {
              font-size: 12px;
              color: #059669;
              font-weight: 500;
            }
            
            /* Full Width Assessment */
            .assessment-fullwidth {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              border-left: 4px solid #6366f1;
            }
            .assessment-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
            }
            .assessment-icon {
              width: 20px;
              height: 20px;
              background: #6366f1;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
            }
            .assessment-title {
              font-size: 10px;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .assessment-comment {
              font-size: 12px;
              line-height: 1.7;
              color: #334155;
              text-align: justify;
            }
            .print-btn { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 12px 32px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; letter-spacing: 1px; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4); }
            .print-btn:hover { background: #4f46e5; transform: translateX(-50%) translateY(-2px); }
            @media print { .print-btn { display: none; } body { background: white; padding: 0; } .certificate { box-shadow: none; border: none; } }
          </style>
        </head>
        <body>
          <div class="certificate">
            <!-- Header -->
            <div class="header">
              <div class="university-name">Nueva Vizcaya State University</div>
              <div class="college-name">College of Information Technology Education</div>
              <div class="certificate-title">PQF Qualification Assessment</div>
            </div>
            
            <!-- Student Name -->
            <div class="student-name-section">
              <div class="student-label">Student Portfolio</div>
              <div class="student-name">${result.student.fullname}</div>
              <div class="student-id">ID: ${result.student.student_id}</div>
            </div>
            
            <!-- Two Column Layout -->
            <div class="portfolio-grid">
              <!-- Left Column - Information -->
              <div class="info-column">
                <div class="info-section">
                  <div class="info-title">Program</div>
                  <div class="info-value">${result.student.course || 'N/A'}</div>
                </div>
                <div class="info-section">
                  <div class="info-title">Total Hours Rendered</div>
                  <div class="info-value">${result.total_hours || 0} Hours</div>
                </div>
                <div class="info-section">
                  <div class="info-title">Activity Match</div>
                  <div class="info-value">${activityPercentage}%</div>
                  <div class="activity-bar">
                    <div class="activity-bar-fill" style="width: ${Math.min(100, activityPercentage)}%"></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-title">Assessment Date</div>
                  <div class="info-value">${formattedDate}</div>
                </div>
                <div class="info-section">
                  <div class="info-title">Reference ID</div>
                  <div class="info-value-id">${certificateId}</div>
                </div>
              </div>
              
              <!-- Right Column - PQF Level -->
              <div class="level-column">
                <div class="level-header">Predicted PQF Qualification Level</div>
                <div class="level-badge">
                  <div class="level-number">${result.predicted_level}</div>
                  <div class="level-label">LEVEL</div>
                </div>
                <div class="level-name">${levelNames[result.predicted_level]}</div>
                <div class="level-confidence">${Math.round(result.confidence || 0)}% Confidence</div>
              </div>
            </div>
            
            <!-- General Assessment Below -->
            <div class="assessment-fullwidth">
              <div class="assessment-header">
                <div class="assessment-icon">📋</div>
                <div class="assessment-title">GENERAL ASSESSMENT</div>
              </div>
              <div class="assessment-comment">${assessmentComment}</div>
            </div>
          </div>
          <button class="print-btn" onclick="window.print()">Print Certificate</button>
        </body>
        </html>
      `);
      certWindow.document.close();
    }
  };

  const generateCertificate = () => {
    if (!predictionResult) return;
    
    // Open certificate in new window with exact 8.5in x 11in dimensions (96 DPI)
    const width = 816;  // 8.5 inches at 96 DPI
    const height = 1056; // 11 inches at 96 DPI
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const certWindow = window.open(
      '',
      'Certificate',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );
    
    if (certWindow) {
      const levelNames = {
        1: 'Foundation',
        2: 'Intermediate',
        3: 'Advanced',
        4: 'Professional',
        5: 'Expert',
        6: 'Master'
      };
      
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const certificateId = `PQF-${today.getFullYear()}-${String(predictionResult.student.student_id).padStart(6, '0')}`;
      
      // Get activity percentage
      const levelScores = predictionResult.analysis?.modelPrediction?.levelScores as Record<number, number> | undefined;
      const totalScore = levelScores ? Object.values(levelScores).reduce((sum: number, score) => sum + (score || 0), 0) : 0;
      const activityPercentage = levelScores?.[predictionResult.predicted_level] && totalScore > 0
        ? Math.round(((levelScores[predictionResult.predicted_level] || 0) / totalScore) * 100)
        : Math.round(predictionResult.confidence || 0);
      
      // Get assessment comment
      const assessmentComment = predictionResult.analysis?.reasoning || 
        predictionResult.features || 
        'Assessment completed based on student OJT activities and performance metrics.';
      
      certWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PQF Certificate - ${predictionResult.student.fullname}</title>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              width: 8.5in;
              height: 11in;
              font-family: 'Inter', sans-serif;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .certificate {
              width: 100%;
              min-height: 10in;
              background: #ffffff;
              position: relative;
              border-radius: 12px;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
              padding: 48px;
              display: flex;
              flex-direction: column;
            }
            
            
            /* Header */
            .header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 24px;
              border-bottom: 2px solid #166534;
            }
            
            .university-name {
              font-family: 'Cormorant Garamond', serif;
              font-size: 20px;
              font-weight: 600;
              color: #166534;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            
            .college-name {
              font-size: 12px;
              color: #166534;
              margin-bottom: 16px;
            }
            
            .certificate-title {
              font-family: 'Cormorant Garamond', serif;
              font-size: 32px;
              font-weight: 600;
              color: #1e293b;
              letter-spacing: 3px;
              text-transform: uppercase;
            }
            
            .subtitle {
              font-size: 11px;
              color: #64748b;
              margin-top: 8px;
              letter-spacing: 1px;
            }
            
            /* Student Name Section */
            .student-name-section {
              text-align: center;
              padding: 20px 0;
              margin-bottom: 16px;
              border-bottom: 2px solid #e2e8f0;
            }
            .student-label {
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .student-name {
              font-family: 'Cormorant Garamond', serif;
              font-size: 32px;
              font-weight: 600;
              color: #1e293b;
              letter-spacing: 2px;
              margin-bottom: 4px;
            }
            .student-id {
              font-size: 11px;
              color: #94a3b8;
              font-family: 'Courier New', monospace;
            }
            
            /* Portfolio Grid - Two Columns */
            .portfolio-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 20px;
            }
            
            /* Left Column - Information */
            .info-column {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .info-section {
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 12px;
            }
            .info-section:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .info-title {
              font-size: 9px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
            }
            .info-value-id {
              font-size: 10px;
              color: #94a3b8;
              font-family: 'Courier New', monospace;
            }
            .activity-bar {
              width: 100%;
              height: 8px;
              background: #e2e8f0;
              border-radius: 4px;
              margin-top: 8px;
              overflow: hidden;
            }
            .activity-bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
              border-radius: 4px;
            }
            
            /* Right Column - Level */
            .level-column {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 2px solid #10b981;
            }
            .level-header {
              font-size: 10px;
              color: #059669;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .level-badge {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              width: 100px;
              height: 100px;
              border-radius: 50%;
              margin-bottom: 12px;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
              border: 3px solid white;
            }
            .level-number {
              font-family: 'Cormorant Garamond', serif;
              font-size: 40px;
              font-weight: 700;
              line-height: 1;
            }
            .level-label {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-top: 2px;
              font-weight: 500;
            }
            .level-name {
              font-family: 'Cormorant Garamond', serif;
              font-size: 20px;
              font-weight: 600;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .level-confidence {
              font-size: 12px;
              color: #059669;
              font-weight: 500;
            }
            
            /* Full Width Assessment */
            .assessment-fullwidth {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              border-left: 4px solid #6366f1;
            }
            .assessment-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
            }
            .assessment-icon {
              width: 20px;
              height: 20px;
              background: #6366f1;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
            }
            .assessment-title {
              font-size: 10px;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .assessment-comment {
              font-size: 12px;
              line-height: 1.7;
              color: #334155;
              text-align: justify;
            }
            
            /* Print Button */
            .print-btn {
              position: fixed;
              bottom: 24px;
              left: 50%;
              transform: translateX(-50%);
              padding: 12px 32px;
              background: #6366f1;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              font-family: 'Inter', sans-serif;
              letter-spacing: 1px;
              box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
              transition: all 0.2s ease;
            }
            
            .print-btn:hover {
              background: #4f46e5;
              transform: translateX(-50%) translateY(-2px);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
            }
            
            @media print {
              .print-btn {
                display: none;
              }
              body {
                background: white;
                padding: 0;
              }
              .certificate {
                box-shadow: none;
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <!-- Header -->
            <div class="header">
              <div class="university-name">Nueva Vizcaya State University</div>
              <div class="college-name">College of Information Technology Education</div>
              <div class="certificate-title">PQF Qualification Assessment</div>
            </div>
            
            <!-- Student Name -->
            <div class="student-name-section">
              <div class="student-label">Student Portfolio</div>
              <div class="student-name">${predictionResult.student.fullname}</div>
              <div class="student-id">ID: ${predictionResult.student.student_id}</div>
            </div>
            
            <!-- Two Column Layout -->
            <div class="portfolio-grid">
              <!-- Left Column - Information -->
              <div class="info-column">
                <div class="info-section">
                  <div class="info-title">Program</div>
                  <div class="info-value">${predictionResult.student.course || 'N/A'}</div>
                </div>
                <div class="info-section">
                  <div class="info-title">Total Hours Rendered</div>
                  <div class="info-value">${predictionResult.total_hours || 0} Hours</div>
                </div>
                <div class="info-section">
                  <div class="info-title">Activity Match</div>
                  <div class="info-value">${activityPercentage}%</div>
                  <div class="activity-bar">
                    <div class="activity-bar-fill" style="width: ${Math.min(100, activityPercentage)}%"></div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-title">Assessment Date</div>
                  <div class="info-value">${formattedDate}</div>
                </div>
                <div class="info-section">
                  <div class="info-title">Reference ID</div>
                  <div class="info-value-id">${certificateId}</div>
                </div>
              </div>
              
              <!-- Right Column - PQF Level -->
              <div class="level-column">
                <div class="level-header">Predicted PQF Qualification Level</div>
                <div class="level-badge">
                  <div class="level-number">${predictionResult.predicted_level}</div>
                  <div class="level-label">LEVEL</div>
                </div>
                <div class="level-name">${levelNames[predictionResult.predicted_level]}</div>
                <div class="level-confidence">${Math.round(predictionResult.confidence || 0)}% Confidence</div>
              </div>
            </div>
            
            <!-- General Assessment Below -->
            <div class="assessment-fullwidth">
              <div class="assessment-header">
                <div class="assessment-icon">📋</div>
                <div class="assessment-title">GENERAL ASSESSMENT</div>
              </div>
              <div class="assessment-comment">${assessmentComment}</div>
            </div>
          </div>
          <button class="print-btn" onclick="window.print()">Print Certificate</button>
        </body>
        </html>
      `);
      certWindow.document.close();
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.filename.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.model_type.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccomplishments = accomplishments.filter(a => {
    const student = students.find(s => s.student_id === a.student_id);
    const searchLower = accomplishmentSearchQuery.toLowerCase();
    return (
      a.student_id.toLowerCase().includes(searchLower) ||
      (student?.fullname || '').toLowerCase().includes(searchLower) ||
      a.month.toLowerCase().includes(searchLower) ||
      a.performed_activities.toLowerCase().includes(searchLower) ||
      a.skills_gained.toLowerCase().includes(searchLower)
    );
  });

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#' },
    { id: 'students', label: 'Students', icon: Users, href: '#' },
    { id: 'accomplishments', label: 'Accomplishments', icon: FileText, href: '#' },
    { id: 'pqf-prediction', label: 'PQF Prediction', icon: Target, href: '#' },
    { id: 'model-management', label: 'Model Management', icon: Box, href: '#' },
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
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">PQF Predictor</h1>
              <p className="text-xs text-slate-500">Admin Portal</p>
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
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Admin Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          {adminUser && (
            <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-semibold text-slate-700">{adminUser.username}</p>
              {adminUser.course && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  {adminUser.course}
                </span>
              )}
              {adminUser.isSuperAdmin && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Super Admin
                </span>
              )}
            </div>
          )}
          <button 
            onClick={() => {
              localStorage.removeItem('adminUser');
              window.location.href = '/admin';
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                  AD
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">System Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{students.length}</p>
                  <p className="text-sm text-slate-500">Students Registered</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +8%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{accomplishments.length}</p>
                  <p className="text-sm text-slate-500">Accomplishments Uploaded</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-xs text-purple-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +15%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">89</p>
                  <p className="text-sm text-slate-500">PQF Predictions</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Box className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="text-xs text-slate-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{models.length}</p>
                  <p className="text-sm text-slate-500">Models Uploaded</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'students' && (
            <>
              {/* Students Management Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={fetchStudents}
                    disabled={studentsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                    title="Refresh from database"
                  >
                    <RefreshCw className={`h-4 w-4 ${studentsLoading ? 'animate-spin' : ''}`} />
                    {studentsLoading ? 'Loading...' : 'Refresh'}
                  </button>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Student
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {studentsError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Error loading students</p>
                      <p className="text-sm text-red-600">{studentsError}</p>
                    </div>
                    <button 
                      onClick={fetchStudents}
                      className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Students Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Student ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Fullname</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Course</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Institution</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500">Loading students from database...</p>
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No students found</p>
                            <p className="text-slate-400 text-sm mt-1">{searchQuery ? 'Try a different search term' : 'Add your first student to get started'}</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-slate-900 font-medium">{student.student_id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                  {student.fullname.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-slate-900 font-medium">{student.fullname}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-600">{student.course}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-600">{student.institution}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => openEditModal(student)}
                                  className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600"
                                  title="Edit Student"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => openDeleteModal(student)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                  title="Delete Student"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => openAddAccomplishmentModal(student)}
                                  className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                                  title="Add Accomplishment"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'accomplishments' && (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Accomplishments</h2>
                    <p className="text-slate-500 text-sm mt-1">Track student OJT progress and weekly achievements</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={fetchAccomplishments}
                      disabled={accomplishmentsLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 shadow-sm"
                      title="Refresh from database"
                    >
                      <RefreshCw className={`h-4 w-4 ${accomplishmentsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <select 
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm min-w-[200px]"
                      onChange={(e) => {
                        const student = students.find(s => s.student_id === e.target.value);
                        if (student) openAddAccomplishmentModal(student);
                      }}
                      value=""
                    >
                      <option value="">+ Add Accomplishment</option>
                      {students.map(student => (
                        <option key={student.id} value={student.student_id}>
                          {student.fullname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              {!accomplishmentsLoading && filteredAccomplishments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium">Total Records</p>
                        <p className="text-3xl font-bold mt-1">{filteredAccomplishments.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">Students</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                          {new Set(filteredAccomplishments.map(a => a.student_id)).size}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">Total Hours</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                          {filteredAccomplishments.reduce((sum, a) => sum + (a.hours_rendered || 0), 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">This Week</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                          {filteredAccomplishments.filter(a => {
                            const date = new Date();
                            const weekAgo = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
                            return new Date(a.created_at) >= weekAgo;
                          }).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search by student, activities, or skills..."
                    value={accomplishmentSearchQuery}
                    onChange={(e) => setAccomplishmentSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full shadow-sm"
                  />
                </div>
              </div>

              {/* Error Message */}
              {accomplishmentsError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Error loading accomplishments</p>
                      <p className="text-sm text-red-600">{accomplishmentsError}</p>
                    </div>
                    <button 
                      onClick={fetchAccomplishments}
                      className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Accomplishments Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Week</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Activities</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Skills Gained</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accomplishmentsLoading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Loading accomplishments...</p>
                          </td>
                        </tr>
                      ) : filteredAccomplishments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-10 w-10 text-slate-400" />
                            </div>
                            <p className="text-slate-900 font-semibold text-lg">No accomplishments found</p>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                              {accomplishmentSearchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first student accomplishment'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredAccomplishments.map((accomplishment) => {
                          const student = students.find(s => s.student_id === accomplishment.student_id);
                          return (
                            <tr key={accomplishment.id} className="hover:bg-slate-50/60 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                    {(student?.fullname || 'U').split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="text-slate-900 font-semibold text-sm">{student?.fullname || 'Unknown'}</p>
                                    <p className="text-slate-500 text-xs">{accomplishment.student_id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                                  Week {accomplishment.week_number}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-slate-700 text-sm font-medium">{accomplishment.month}</span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-slate-700 text-sm max-w-xs truncate leading-relaxed">{accomplishment.performed_activities}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-slate-700 text-sm max-w-xs truncate leading-relaxed">{accomplishment.skills_gained}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                                  {accomplishment.hours_rendered} hrs
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => openEditAccomplishmentModal(accomplishment)}
                                    className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-indigo-600 hover:scale-105"
                                    title="Edit Accomplishment"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => openDeleteAccomplishmentModal(accomplishment)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-all text-red-600 hover:scale-105"
                                    title="Delete Accomplishment"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'model-management' && (
            <>
              {/* Model Management Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search models..."
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={fetchModels}
                    disabled={modelsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                    title="Refresh from database"
                  >
                    <RefreshCw className={`h-4 w-4 ${modelsLoading ? 'animate-spin' : ''}`} />
                    {modelsLoading ? 'Loading...' : 'Refresh'}
                  </button>
                  <button 
                    onClick={() => setShowUploadModelModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Model
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {modelsError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Error loading models</p>
                      <p className="text-sm text-red-600">{modelsError}</p>
                    </div>
                    <button 
                      onClick={fetchModels}
                      className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Models Grid */}
              {modelsLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500">Loading models from database...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredModels.map((model) => (
                    <div 
                      key={model.id} 
                      className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${
                        model.is_loaded 
                          ? 'border-emerald-300 ring-2 ring-emerald-100' 
                          : 'border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        {model.is_loaded && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-slate-900 mb-1">{model.name}</h3>
                      <p className="text-sm text-slate-500 mb-4">{model.filename}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Type:</span>
                          <span className="text-slate-700 font-medium">{model.model_type}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Size:</span>
                          <span className="text-slate-700">{model.file_size}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Uploaded:</span>
                          <span className="text-slate-700">{model.upload_date || new Date(model.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        {!model.is_loaded && (
                          <button 
                            onClick={() => handleLoadModel(model.id)}
                            disabled={modelsLoading}
                            className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-all disabled:opacity-50"
                          >
                            Load Model
                          </button>
                        )}
                        <button 
                          onClick={() => openDeleteModelModal(model)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Delete Model"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!modelsLoading && filteredModels.length === 0 && (
                <div className="text-center py-12">
                  <Box className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No models found</p>
                  <p className="text-slate-400 text-sm mt-1">{modelSearchQuery ? 'Try a different search term' : 'Upload a WEKA .model file to get started'}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'pqf-prediction' && (
            <>
              {/* PQF Prediction Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">PQF Level Prediction</h3>
                    <p className="text-sm text-slate-500">AI-powered qualification assessment</p>
                  </div>
                </div>
              </div>

              {/* Main Layout - Changed to single column with cards */}
              <div className="space-y-6">
                {/* Configuration Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Model Status Card */}
                  {(() => {
                    const loadedModel = models.find(m => m.is_loaded);
                    if (!loadedModel) {
                      return (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-lg">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Status</p>
                              <p className="text-sm font-semibold text-amber-900">No Model Loaded</p>
                              <p className="text-xs text-amber-600">Load from Model Management</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    // Determine input type based on active model
                    const modelTypeLower = loadedModel.model_type?.toLowerCase() || '';
                    const isSkillsModel = modelTypeLower.includes('skill') || modelTypeLower.includes('rf') || modelTypeLower.includes('random forest');
                    const activeInputType = isSkillsModel ? 'Skills' : 'Activities';
                    return (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500 rounded-lg">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Active Model</p>
                            <p className="text-sm font-semibold text-emerald-900">{loadedModel.name}</p>
                            <p className="text-xs text-emerald-600">{loadedModel.model_type}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <div className="flex items-center gap-2">
                            {isSkillsModel ? (
                              <Wrench className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-emerald-600" />
                            )}
                            <span className="text-xs text-emerald-700 font-medium">
                              Using: {activeInputType} Data
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Student Selection Card - Searchable Dropdown */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" ref={studentDropdownRef}>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      <Users className="h-4 w-4" />
                      Select Student
                    </label>
                    <div className="relative">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder={predictionStudent ? `${predictionStudent.fullname} (${predictionStudent.student_id})` : "Search student by name or ID..."}
                          value={studentSearchQuery}
                          onChange={(e) => {
                            setStudentSearchQuery(e.target.value);
                            setShowStudentDropdown(true);
                          }}
                          onFocus={() => setShowStudentDropdown(true)}
                          className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        {predictionStudent && (
                          <button
                            onClick={() => {
                              setPredictionStudent(null);
                              setStudentSearchQuery('');
                              setPredictionResult(null);
                              setStudentAccomplishmentsCount(0);
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                          >
                            <X className="h-3 w-3 text-slate-400" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Results */}
                      {showStudentDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {students
                            .filter(s => 
                              studentSearchQuery === '' || 
                              s.fullname.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                              s.student_id.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                              s.course.toLowerCase().includes(studentSearchQuery.toLowerCase())
                            )
                            .slice(0, 50) // Limit to 50 results for performance
                            .map(student => (
                              <button
                                key={student.id}
                                onClick={async () => {
                                  setPredictionStudent(student);
                                  setStudentSearchQuery('');
                                  setShowStudentDropdown(false);
                                  setPredictionResult(null);
                                  
                                  // Check if student has accomplishments
                                  const { count, error: accomErr } = await supabase
                                    .from('accomplishments')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('student_id', student.student_id);
                                  
                                  if (!accomErr) {
                                    setStudentAccomplishmentsCount(count || 0);
                                  } else {
                                    console.error('Error checking accomplishments:', accomErr);
                                    setStudentAccomplishmentsCount(0);
                                  }
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                                  predictionStudent?.student_id === student.student_id ? 'bg-emerald-50 hover:bg-emerald-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm text-slate-900">{student.fullname}</p>
                                    <p className="text-xs text-slate-500">{student.student_id} • {student.course}</p>
                                  </div>
                                  {predictionStudent?.student_id === student.student_id && (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  )}
                                </div>
                              </button>
                            ))}
                          {students.filter(s => 
                            studentSearchQuery === '' || 
                            s.fullname.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            s.student_id.toLowerCase().includes(studentSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-3 text-center">
                              <p className="text-sm text-slate-500">No students found</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {predictionStudent && (
                      <>
                        <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Selected: {predictionStudent.course}
                        </p>
                        {studentAccomplishmentsCount === 0 && (
                          <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
                            <X className="h-3 w-3" />
                            No Accomplishment(s) uploaded
                          </p>
                        )}
                        {studentAccomplishmentsCount > 0 && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {studentAccomplishmentsCount} Accomplishment(s) found
                          </p>
                        )}
                      </>
                    )}
                  </div>

                </div>

                {/* Run Prediction Button - Full Width */}
                <button
                  onClick={handleRunPrediction}
                  disabled={!predictionStudent || !models.some(m => m.is_loaded) || isPredicting || studentAccomplishmentsCount === 0}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25"
                >
                  {isPredicting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Student Data...
                    </>
                  ) : studentAccomplishmentsCount === 0 && predictionStudent ? (
                    <>
                      <X className="h-6 w-6" />
                      Cannot Run - No Accomplishments
                    </>
                  ) : (
                    <>
                      <Target className="h-6 w-6" />
                      Run PQF Prediction
                    </>
                  )}
                </button>
                
                {predictionStudent && studentAccomplishmentsCount === 0 && (
                  <p className="text-xs text-red-600 mt-3 text-center font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                    This student has not uploaded any accomplishments. Please add accomplishments first.
                  </p>
                )}

                {/* Results Section */}
                {predictionResult ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${predictionResult.confidence >= 60 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                          {predictionResult.confidence >= 60 ? (
                            <Check className="h-6 w-6 text-emerald-600" />
                          ) : (
                            <X className="h-6 w-6 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">Assessment Complete</h4>
                          <p className="text-sm text-slate-500">
                            {predictionResult.confidence >= 60 ? 'Student PASSED' : 'Student NOT PASSED'} • {new Date(predictionResult.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={generateCertificate}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all flex items-center gap-2 text-sm"
                      >
                        <Award className="h-4 w-4" />
                        Certificate
                      </button>
                    </div>

                    {/* Two Column Results Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left - Predicted PQF Level */}
                      <div>
                        <h5 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Predicted PQF Level</h5>
                        {(() => {
                          const predictedLevel = predictionResult.predicted_level;
                          const wekaRanges = {
                            1: { min: 50, max: 59, label: 'Foundation' },
                            2: { min: 60, max: 69, label: 'Intermediate' },
                            3: { min: 70, max: 74, label: 'Advanced' },
                            4: { min: 75, max: 79, label: 'Professional' },
                            5: { min: 80, max: 89, label: 'Expert' },
                            6: { min: 90, max: 100, label: 'Master' }
                          };
                          const range = wekaRanges[predictedLevel];
                          const confidence = predictionResult.confidence || 0;
                          const isInRange = confidence >= range.min && confidence <= range.max;
                          const levelNames = {
                            1: 'Foundation',
                            2: 'Intermediate',
                            3: 'Advanced',
                            4: 'Professional',
                            5: 'Expert',
                            6: 'Master'
                          };
                          // Get activity percentage from model prediction data
                          const levelScores = predictionResult.analysis?.modelPrediction?.levelScores as Record<number, number> | undefined;
                          const totalScore = levelScores ? Object.values(levelScores).reduce((sum, score) => sum + (score || 0), 0) : 0;
                          const activityPercentage = levelScores?.[predictedLevel] && totalScore > 0
                            ? Math.round(((levelScores[predictedLevel] || 0) / totalScore) * 100)
                            : Math.round((predictionResult.confidence || 0) * 0.8);
                          
                          return (
                            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-md">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-3xl text-white">
                                  {predictedLevel}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-lg text-slate-900">{levelNames[predictedLevel]}</p>
                                  <p className="text-xs text-slate-500">WEKA Range: {range.min}-{range.max}%</p>
                                  {isInRange && (
                                    <p className="text-xs text-emerald-600 font-medium">✓ Within WEKA range</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t border-emerald-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-700">Activity Match</span>
                                  <span className="text-lg font-bold text-emerald-600">{activityPercentage}%</span>
                                </div>
                                <div className="w-full bg-emerald-200 rounded-full h-3">
                                  <div 
                                    className="bg-emerald-500 h-3 rounded-full transition-all" 
                                    style={{ width: `${Math.min(100, activityPercentage)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                  {activityPercentage >= 60 
                                    ? '✓ Strong activity match (≥60%)' 
                                    : activityPercentage >= 40 
                                      ? '◐ Moderate activity match' 
                                      : '⚠ Weak activity match'}
                                </p>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-emerald-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-600">Confidence Score</span>
                                  <span className="text-lg font-bold text-emerald-600">{confidence}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        {/* ASSESSMENT - LLM Comment on Student Activities */}
                        {predictionResult.analysis?.reasoning && (
                          <div className="mt-4 p-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                              <Brain className="h-5 w-5 text-indigo-600" />
                              <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">GENERAL ASSESSMENT:</p>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{predictionResult.analysis.reasoning}</p>
                            {predictionResult.analysis?.llmAnalysis && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 italic">{predictionResult.analysis.llmAnalysis.split('\n')[0]}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                      </div>

                      {/* Right - Analysis Details */}
                      <div className="space-y-4">
                        {/* Student Info Card */}
                        <div className="bg-slate-50 rounded-xl p-4">
                          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Student Information</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Name:</span>
                              <span className="font-medium text-slate-900">{predictionResult.student.fullname}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ID:</span>
                              <span className="font-medium text-slate-900">{predictionResult.student.student_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Course:</span>
                              <span className="font-medium text-slate-900">{predictionResult.student.course}</span>
                            </div>
                          </div>
                        </div>

                        {/* Analysis Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-emerald-600">{predictionResult.confidence}%</p>
                            <p className="text-xs text-emerald-600 font-medium">Confidence</p>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-blue-600">{predictionResult.total_hours}</p>
                            <p className="text-xs text-blue-600 font-medium">Hours</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-purple-600">{predictionResult.analysis?.totalWeeks || '-'}</p>
                            <p className="text-xs text-purple-600 font-medium">Weeks</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-amber-600">{predictionResult.analysis?.keywordMatches || '0'}</p>
                            <p className="text-xs text-amber-600 font-medium">Keywords</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Target className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">Ready to Predict</p>
                    <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Configure the settings above and click "Run PQF Prediction" to analyze student qualifications</p>
                  </div>
                )}

              </div>

              {/* Prediction History Table */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Prediction History</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchPredictionHistory}
                      disabled={predictionHistoryLoading}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${predictionHistoryLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    {predictionHistory.length > 0 && (
                      <button
                        onClick={() => setShowResetHistoryModal(true)}
                        disabled={predictionHistoryLoading}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50 ml-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {predictionHistoryLoading ? (
                    <div className="p-8 text-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Loading prediction history...</p>
                    </div>
                  ) : predictionHistory.length === 0 ? (
                    <div className="p-8 text-center">
                      <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No predictions yet</p>
                      <p className="text-slate-400 text-sm mt-1">Run a prediction to see history here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Input Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {predictionHistory.map((prediction) => (
                            <tr key={prediction.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{prediction.students?.fullname || 'N/A'}</p>
                                  <p className="text-xs text-slate-500">{prediction.students?.student_id || prediction.student_id}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  Level {prediction.predicted_level}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-medium ${
                                  prediction.confidence_score >= 60 ? 'text-emerald-600' : 
                                  prediction.confidence_score >= 40 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {Math.round(prediction.confidence_score)}%
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-600">{prediction.total_hours} hrs</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-600 capitalize">
                                  {prediction.input_type?.replace('_', ' ') || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-600">{prediction.model_used || 'Default'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-500">
                                  {new Date(prediction.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => generateCertificateFromHistory(prediction)}
                                  className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                                  title="Preview Certificate"
                                >
                                  <Award className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                {predictionHistory.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-xs text-emerald-600 uppercase tracking-wider">Total Predictions</p>
                      <p className="text-2xl font-bold text-emerald-900">{predictionHistory.length}</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <p className="text-xs text-indigo-600 uppercase tracking-wider">Avg Level</p>
                      <p className="text-2xl font-bold text-indigo-900">
                        {(predictionHistory.reduce((sum, p) => sum + p.predicted_level, 0) / predictionHistory.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs text-amber-600 uppercase tracking-wider">Avg Confidence</p>
                      <p className="text-2xl font-bold text-amber-900">
                        {Math.round(predictionHistory.reduce((sum, p) => sum + p.confidence_score, 0) / predictionHistory.length)}%
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs text-blue-600 uppercase tracking-wider">High Confidence (≥60%)</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {predictionHistory.filter(p => p.confidence_score >= 60).length}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              {/* Settings Header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Settings</h3>
                <p className="text-slate-500">Manage system settings and administrative users.</p>
              </div>

              {/* Settings Tab Folders */}
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button
                  onClick={() => setSettingsSubTab('user-management')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    settingsSubTab === 'user-management'
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  User Management
                </button>
                <button
                  onClick={() => setSettingsSubTab('general-settings')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    settingsSubTab === 'general-settings'
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  General Settings
                </button>
              </div>

              {/* User Management Content */}
              {settingsSubTab === 'user-management' && (
                <>
                  {/* User Management Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search admin users..."
                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={fetchAdminUsers}
                        disabled={adminUsersLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                        title="Refresh from database"
                      >
                        <RefreshCw className={`h-4 w-4 ${adminUsersLoading ? 'animate-spin' : ''}`} />
                        {adminUsersLoading ? 'Loading...' : 'Refresh'}
                      </button>
                      <button 
                        onClick={() => setShowAddAdminModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Admin User
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {adminUsersError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <X className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-800">Error loading admin users</p>
                          <p className="text-sm text-red-600">{adminUsersError}</p>
                        </div>
                        <button 
                          onClick={fetchAdminUsers}
                          className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-all"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Users Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Username</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Full Name</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminUsersLoading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-slate-500">Loading admin users from database...</p>
                              </td>
                            </tr>
                          ) : adminUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center">
                                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No admin users found</p>
                                <p className="text-slate-400 text-sm mt-1">Add your first admin user to get started</p>
                              </td>
                            </tr>
                          ) : (
                            adminUsers.map((admin) => (
                              <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="text-slate-900 font-medium">{admin.username}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                                      {admin.fullname.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-slate-900 font-medium">{admin.fullname}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium capitalize">
                                    {admin.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-slate-600">{new Date(admin.created_at).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => openEditAdminModal(admin)}
                                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600"
                                      title="Edit Admin"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => openDeleteAdminModal(admin)}
                                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                      title="Delete Admin"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* General Settings Content */}
              {settingsSubTab === 'general-settings' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-slate-900 mb-6">System Information</h4>
                  
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block mb-1">Version</span>
                      <p className="text-slate-900 font-medium text-lg">1.0.0</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block mb-1">Last Updated</span>
                      <p className="text-slate-900 font-medium text-lg">April 2024</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block mb-1">Database</span>
                      <p className="text-slate-900 font-medium text-lg">PostgreSQL</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block mb-1">Storage</span>
                      <p className="text-slate-900 font-medium text-lg">Supabase</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input 
                  type="text" 
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter Student ID (e.g., 2024001)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullname}
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                <select 
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option>BS Information Technology</option>
                  <option>BS Computer Science</option>
                  <option>BS Information Systems</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institution</label>
                <input 
                  type="text" 
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter institution"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter password"
                />
                <p className="text-xs text-slate-500 mt-1">Student ID will be the username for login</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStudent}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input 
                  type="text" 
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullname}
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                <select 
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option>BS Information Technology</option>
                  <option>BS Computer Science</option>
                  <option>BS Information Systems</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institution</label>
                <input 
                  type="text" 
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditStudent}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Student</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete <strong>{selectedStudent.fullname}</strong> ({selectedStudent.student_id})? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteStudent}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Prediction History Confirmation Modal */}
      {showResetHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Reset Prediction History</h3>
              <p className="text-slate-600 text-sm mb-2">
                Are you sure you want to delete all {predictionHistory.length} prediction records?
              </p>
              <p className="text-red-600 text-xs font-medium">
                This action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowResetHistoryModal(false)}
                disabled={isResettingHistory}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPredictionHistory}
                disabled={isResettingHistory}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResettingHistory ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Reset All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Accomplishment Modal */}
      {showAddAccomplishmentModal && selectedStudentForAccomplishment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add Accomplishment</h3>
                <p className="text-sm text-slate-500">{selectedStudentForAccomplishment.fullname} ({selectedStudentForAccomplishment.student_id})</p>
              </div>
              <button onClick={() => setShowAddAccomplishmentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Week Number
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="52"
                    value={accomplishmentFormData.week_number}
                    onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, week_number: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Hours Rendered
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="168"
                    value={accomplishmentFormData.hours_rendered}
                    onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, hours_rendered: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <select 
                  value={accomplishmentFormData.month}
                  onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, month: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option>January</option>
                  <option>February</option>
                  <option>March</option>
                  <option>April</option>
                  <option>May</option>
                  <option>June</option>
                  <option>July</option>
                  <option>August</option>
                  <option>September</option>
                  <option>October</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Performed Activities
                </label>
                <textarea 
                  value={accomplishmentFormData.performed_activities}
                  onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, performed_activities: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[100px]"
                  placeholder="Describe the activities performed during this week..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Wrench className="h-4 w-4 inline mr-1" />
                  Skills Gained
                </label>
                <textarea 
                  value={accomplishmentFormData.skills_gained}
                  onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, skills_gained: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[80px]"
                  placeholder="List the skills gained or improved..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowAddAccomplishmentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddAccomplishment}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
              >
                Add Accomplishment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Accomplishment Modal */}
      {showEditAccomplishmentModal && selectedAccomplishment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Accomplishment</h3>
                <p className="text-sm text-slate-500">Week {accomplishmentFormData.week_number}</p>
              </div>
              <button onClick={() => setShowEditAccomplishmentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Week Number
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="52"
                    value={accomplishmentFormData.week_number}
                    onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, week_number: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Hours Rendered
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="168"
                    value={accomplishmentFormData.hours_rendered}
                    onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, hours_rendered: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <select 
                  value={accomplishmentFormData.month}
                  onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, month: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option>January</option>
                  <option>February</option>
                  <option>March</option>
                  <option>April</option>
                  <option>May</option>
                  <option>June</option>
                  <option>July</option>
                  <option>August</option>
                  <option>September</option>
                  <option>October</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Performed Activities
                </label>
                <textarea 
                  value={accomplishmentFormData.performed_activities}
                  onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, performed_activities: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[100px]"
                  placeholder="Describe the activities performed during this week..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Wrench className="h-4 w-4 inline mr-1" />
                  Skills Gained
                </label>
                <textarea 
                  value={accomplishmentFormData.skills_gained}
                  onChange={(e) => setAccomplishmentFormData({...accomplishmentFormData, skills_gained: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[80px]"
                  placeholder="List the skills gained or improved..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowEditAccomplishmentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditAccomplishment}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Accomplishment Confirmation Modal */}
      {showDeleteAccomplishmentModal && selectedAccomplishment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Accomplishment</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete the Week {selectedAccomplishment.week_number} accomplishment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteAccomplishmentModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccomplishment}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Model Modal */}
      {showUploadModelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upload Model</h3>
                <p className="text-sm text-slate-500">Import WEKA .model file</p>
              </div>
              <button onClick={() => setShowUploadModelModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                <input 
                  type="text" 
                  value={modelFormData.name}
                  onChange={(e) => setModelFormData({...modelFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., PQF Level Predictor v3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model Type</label>
                <select 
                  value={modelFormData.model_type}
                  onChange={(e) => setModelFormData({...modelFormData, model_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option>WEKA Random Forest</option>
                  <option>WEKA SVM</option>
                  <option>WEKA Naive Bayes</option>
                  <option>WEKA J48 Decision Tree</option>
                  <option>WEKA Multilayer Perceptron</option>
                  <option>WEKA Logistic Regression</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model File (.model)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <FileUp className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <input 
                    type="file" 
                    accept=".model"
                    onChange={(e) => setModelFormData({...modelFormData, file: e.target.files?.[0] || null})}
                    className="hidden"
                    id="model-file-input"
                  />
                  <label 
                    htmlFor="model-file-input"
                    className="cursor-pointer text-sm text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    {modelFormData.file ? modelFormData.file.name : 'Click to upload .model file'}
                  </label>
                  <p className="text-xs text-slate-400 mt-1">WEKA model files only (.model)</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowUploadModelModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadModel}
                disabled={!modelFormData.name || !modelFormData.file}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Model Confirmation Modal */}
      {showDeleteModelModal && selectedModel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Model</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete <strong>{selectedModel.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModelModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteModel}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin User Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add Admin User</h3>
              <button onClick={() => setShowAddAdminModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({...adminFormData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={adminFormData.fullname}
                  onChange={(e) => setAdminFormData({...adminFormData, fullname: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddAdmin}
                disabled={!adminFormData.username || !adminFormData.fullname || !adminFormData.password}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin User Modal */}
      {showEditAdminModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Admin User</h3>
              <button onClick={() => setShowEditAdminModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({...adminFormData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={adminFormData.fullname}
                  onChange={(e) => setAdminFormData({...adminFormData, fullname: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password (optional)</label>
                <input 
                  type="password" 
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowEditAdminModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditAdmin}
                disabled={!adminFormData.username || !adminFormData.fullname}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin User Confirmation Modal */}
      {showDeleteAdminModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Admin User</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete <strong>{selectedAdmin.fullname}</strong> ({selectedAdmin.username})? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteAdminModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAdmin}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

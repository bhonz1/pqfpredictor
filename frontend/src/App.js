import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Brain, 
  Settings,
  GraduationCap,
  Home
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import LoginSelector from './components/LoginSelector';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import Students from './components/Students';
import Accomplishments from './components/Accomplishments';
import Predictions from './components/Predictions';
import ModelManagement from './components/ModelManagement';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/student-dashboard" replace />;
  }
  
  return children;
}

// Layout component with sidebar for internal pages
function MainLayout({ children }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/accomplishments', icon: FileText, label: 'Accomplishments' },
    { path: '/predictions', icon: Brain, label: 'PQF Predictions' },
    { path: '/models', icon: Settings, label: 'Model Management' },
  ];

  // Add User Management for admins
  if (user?.role === 'admin') {
    navItems.push({ path: '/dashboard?tab=users', icon: Users, label: 'User Management' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">PQF Predictor</h1>
              <p className="text-xs text-gray-500">OJT Classification System</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 px-4">
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
          
          {user?.role === 'student' && (
            <Link
              to="/student-dashboard"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">My Dashboard</span>
            </Link>
          )}
          
          <div className="border-t border-gray-200 my-3"></div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <div className="border-t border-gray-200 my-3"></div>
          
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginSelector />} />
      <Route path="/login/student" element={<Login role="student" />} />
      <Route path="/login/admin" element={<Login role="admin" />} />
      <Route path="/register" element={<Register />} />
      
      {/* Admin/Student Routes */}
      <Route 
        path="/student-dashboard" 
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Main Routes - Admin Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MainLayout><AdminDashboard /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/students" 
        element={
          <ProtectedRoute>
            <MainLayout><Students /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/accomplishments" 
        element={
          <ProtectedRoute>
            <MainLayout><Accomplishments /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/predictions" 
        element={
          <ProtectedRoute>
            <MainLayout><Predictions /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/models" 
        element={
          <ProtectedRoute>
            <MainLayout><ModelManagement /></MainLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

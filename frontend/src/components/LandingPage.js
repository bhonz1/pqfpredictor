import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Users, 
  FileText, 
  TrendingUp, 
  Award,
  ChevronRight,
  Target,
  BarChart3,
  GraduationCap,
  Shield,
  ArrowRight
} from 'lucide-react';

function LandingPage() {

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered PQF Classification',
      description: 'Machine learning models analyze BSIT OJT records to predict PQF levels 1-6 with high accuracy.'
    },
    {
      icon: Users,
      title: 'BSIT Student Management',
      description: 'Easily manage BSIT student profiles, track OJT progress, and organize training records.'
    },
    {
      icon: FileText,
      title: 'IT Accomplishment Tracking',
      description: 'Log weekly IT-related OJT activities, technical skills developed, and hours completed.'
    },
    {
      icon: TrendingUp,
      title: 'BSIT Progress Analytics',
      description: 'Visualize OJT training progress and PQF level predictions specific to BSIT competencies.'
    }
  ];

  const pqfLevels = [
    { level: 1, description: 'Routine, repetitive, and predictable activities', color: 'bg-green-500' },
    { level: 2, description: 'Familiar and non-familiar contexts', color: 'bg-emerald-400' },
    { level: 3, description: 'Diverse, unfamiliar, and changing contexts', color: 'bg-teal-400' },
    { level: 4, description: 'Complex, non-routine activities', color: 'bg-blue-500' },
    { level: 5, description: 'Specialized, complex, and professional work', color: 'bg-indigo-500' },
    { level: 6, description: 'Advanced professional or highly specialized work', color: 'bg-violet-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-4 rounded-2xl shadow-xl">
                <GraduationCap className="h-16 w-16 text-white" />
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              BS Information Technology
              <span className="block text-primary-600">PQF Level Classification</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              On-the-Job Training Tasks Classification System for BSIT Students
            </p>
            
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
              An intelligent system that analyzes BSIT student OJT accomplishments to predict 
              Philippine Qualifications Framework (PQF) levels 1-6 using machine learning.
            </p>

            {/* Login Options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/login/student"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                Student Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link
                to="/login/admin"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <Shield className="mr-2 h-5 w-5" />
                Admin Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Register Link */}
            <p className="text-sm text-gray-600">
              New student?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-white" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 37 768 43 864 45C960 47 1056 45 1152 40C1248 35 1344 27 1392 23L1440 20V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">System Features</h2>
          <p className="text-gray-600">Comprehensive tools for PQF level classification and tracking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="bg-gradient-to-br from-primary-100 to-primary-50 p-4 rounded-xl w-fit mb-4">
                <feature.icon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PQF Levels Section - BSIT Program */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-primary-600 mr-2" />
              <h2 className="text-3xl font-bold text-gray-900">BSIT PQF Levels (1-6)</h2>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The BS Information Technology program covers PQF levels 1 through 6, 
              describing progression from basic IT tasks to advanced professional work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pqfLevels.map((item) => (
              <div key={item.level} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-primary-500 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white font-bold text-lg`}>
                    {item.level}
                  </div>
                  <span className="ml-3 font-semibold text-gray-900">Level {item.level}</span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-primary-600 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Upload Model', desc: 'Upload your trained BSIT PQF classification model' },
            { step: '2', title: 'Add BSIT Students', desc: 'Register BSIT students in the system' },
            { step: '3', title: 'Log OJT Data', desc: 'Record IT-related accomplishments and hours' },
            { step: '4', title: 'Get PQF Levels', desc: 'Generate PQF level 1-6 predictions for BSIT' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Track Your BSIT OJT Progress?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Start using the system to analyze your OJT records and predict your 
            PQF level (1-6) as a BSIT student.
          </p>
          <Link
            to="/login/student"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <GraduationCap className="mr-2 h-5 w-5" />
            Student Login
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            Predictive Model for PQF Level Classification of On-the-Job Training Tasks
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2026 PQF Predictor. All rights reserved. Developed by VCW TechSoft PH
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Shield, ArrowRight } from 'lucide-react';

function LoginSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-1">Select your login type</p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          {/* Student Login Option */}
          <Link
            to="/login/student"
            className="block bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Student Login</h2>
                <p className="text-sm text-gray-500">Access your personal dashboard</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          {/* Admin Login Option */}
          <Link
            to="/login/admin"
            className="block bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Admin Login</h2>
                <p className="text-sm text-gray-500">Manage users and system settings</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        </div>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            New student?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create student account
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginSelector;

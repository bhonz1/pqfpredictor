'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GraduationCap, LineChart, Award, ArrowRight, Shield, Zap, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  // Registration form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    fullname: '',
    course: 'BS Information Technology',
    institution: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const scrollToRegister = () => {
    setShowRegisterForm(true);
    // Scroll to registration section after a short delay to allow render
    setTimeout(() => {
      const registerSection = document.getElementById('register-section');
      if (registerSection) {
        registerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    // Validation
    if (!formData.student_id || !formData.fullname || !formData.institution || !formData.password) {
      setSubmitError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setSubmitError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    // Create supabase client
    const supabase = createClient();

    try {
      // Check if student ID already exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('student_id')
        .eq('student_id', formData.student_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingStudent) {
        setSubmitError('Student ID already exists. Please use a different ID or login.');
        setIsSubmitting(false);
        return;
      }

      // Create student account
      const { data, error } = await supabase
        .from('students')
        .insert([{
          student_id: formData.student_id,
          fullname: formData.fullname,
          course: formData.course,
          institution: formData.institution,
          password: formData.password // Note: In production, hash this password
        }])
        .select()
        .single();

      if (error) throw error;

      setSubmitSuccess(true);
      setFormData({
        student_id: '',
        fullname: '',
        course: 'BS Information Technology',
        institution: '',
        password: '',
        confirmPassword: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowRegisterForm(false);
      }, 5000);

    } catch (err) {
      console.error('Registration error:', err);
      setSubmitError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                PQF Predictor
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={scrollToRegister}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-indigo-700">AI-Powered Prediction System</span>
            </div>
            
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-slate-900">
                Predictive Qualification
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Framework System
              </span>
            </h2>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-sm font-medium text-indigo-700">
                BS Information Technology
              </span>
              <span className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm font-medium text-purple-700">
                BS Computer Science
              </span>
              <span className="px-4 py-2 bg-pink-50 border border-pink-200 rounded-full text-sm font-medium text-pink-700">
                BS Information Systems
              </span>
            </div>
            
            <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
              Intelligent qualification management powered by machine learning. 
              Monitor progress, predict levels, and generate certificates seamlessly.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105">
                <GraduationCap className="h-5 w-5" />
                Student Login
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/admin" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-full font-semibold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-sm hover:shadow-md hover:scale-105">
                <Shield className="h-5 w-5" />
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form Section */}
      {showRegisterForm && (
        <div id="register-section" className="py-12 bg-gradient-to-r from-emerald-50 to-teal-50 border-y border-emerald-100">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Create Student Account
                </h3>
                <p className="text-emerald-100 text-sm mt-1">Register to start tracking your OJT accomplishments</p>
              </div>

              <div className="p-6">
                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Account Created Successfully!</h4>
                    <p className="text-slate-600 mb-4">Your student account has been created. You can now login with your Student ID and password.</p>
                    <Link 
                      href="/login" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 transition-all"
                    >
                      Go to Login
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    {submitError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{submitError}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Student ID *</label>
                        <input
                          type="text"
                          name="student_id"
                          value={formData.student_id}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., 2024001"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          name="fullname"
                          value={formData.fullname}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
                        <select
                          name="course"
                          value={formData.course}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        >
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
                          value={formData.institution}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., University of the Philippines"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Min. 6 characters"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Re-enter password"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowRegisterForm(false)}
                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5" />
                            Create Account
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-center text-sm text-slate-500">
                      Already have an account?{' '}
                      <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700">
                        Login here
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-4">Features</h3>
            <h2 className="text-4xl font-bold text-slate-900">Everything you need to manage PQF</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                  <LineChart className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Progress Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Monitor student accomplishments and hours spent on tasks throughout their OJT period with real-time analytics.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Predictions</h3>
                <p className="text-slate-600 leading-relaxed">
                  Machine learning-powered qualification level predictions based on comprehensive student performance data.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/25">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Certificate Generation</h3>
                <p className="text-slate-600 leading-relaxed">
                  Generate official PQF certificates with digital signatures based on predicted qualification levels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PQF Levels Section */}
      <div className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">BS Information Technology</h3>
            <p className="text-slate-500">Also available for BS Computer Science and BS Information Systems</p>
            <p className="text-slate-400 text-sm mt-1">Philippine Qualifications Framework Levels</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { level: 1, title: 'Foundation', desc: 'Basic computer operations and digital literacy' },
              { level: 2, title: 'Intermediate', desc: 'Programming fundamentals and software development basics' },
              { level: 3, title: 'Advanced', desc: 'Database management and web application development' },
              { level: 4, title: 'Professional', desc: 'System analysis and software engineering principles' },
              { level: 5, title: 'Expert', desc: 'Enterprise solutions architecture and IT project management' },
              { level: 6, title: 'Master', desc: 'Advanced IT research, innovation, and strategic leadership' },
            ].map(({ level, title, desc }) => (
              <div key={level} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {level}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Level {level}: {title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-slate-900 font-semibold">PQF Predictor</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 PQF Predictor. All rights reserved. Developed by Von Gabayan Jr.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Shield, Users, Activity, TrendingUp, Clock, MapPin, FileText, Mail, HardDrive, Eye, ChevronRight, Search, Bell, RefreshCw, Home, BarChart3, AlertCircle, Zap, User, CheckCircle, Lock, LogIn, ArrowRight, Cpu, X } from 'lucide-react';

// Stored credentials
// Note: All 50 users (U001-U050) use password 'user123'
// Security admins must update this list when adding new users
const CREDENTIALS = {
  admins: [
    { username: 'admin', password: 'admin123', name: 'Security Admin 1', role: 'admin' },
    { username: 'secadmin', password: 'secure123', name: 'Security Admin 2', role: 'admin' }
  ],
  users: [
    // Demo users (U001-U003) - Real-time monitoring enabled
    { username: 'U001', password: 'user123', name: 'Abhinav P V', role: 'user' },
    { username: 'U002', password: 'user123', name: 'Abhinav Gadde', role: 'user' },
    { username: 'U003', password: 'user123', name: 'Indushree', role: 'user' },
    // Regular users (U004-U050) - Generated data
    // All follow pattern: username = User ID, password = 'user123'
    // Names are fetched from backend database
  ]
};

// Helper function to check if user exists (for U004-U050)
const checkUserExists = async (username) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_URL}/api/users`);
    if (response.ok) {
      const users = await response.json();
      return users.find(u => u.user_id === username);
    }
  } catch (error) {
    console.error('Error checking user:', error);
  }
  return null;
};

// Authentication Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('sentineliq_user');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  const login = async (username, password) => {
    // Check admins
    const admin = CREDENTIALS.admins.find(
      a => a.username === username && a.password === password
    );
    if (admin) {
      const user = { username: admin.username, name: admin.name, role: 'admin', userId: null };
      setCurrentUser(user);
      localStorage.setItem('sentineliq_user', JSON.stringify(user));
      return { success: true, user };
    }

    // Check known users (U001-U003)
    const regularUser = CREDENTIALS.users.find(
      u => u.username === username && u.password === password
    );
    if (regularUser) {
      const user = { username: regularUser.username, name: regularUser.name, role: 'user', userId: regularUser.username };
      setCurrentUser(user);
      localStorage.setItem('sentineliq_user', JSON.stringify(user));
      return { success: true, user };
    }

    // Check if username matches pattern U004-U050 and password is correct
    if (username.match(/^U\d{3}$/) && password === 'user123') {
      const userNum = parseInt(username.substring(1));
      if (userNum >= 4 && userNum <= 50) {
        // Fetch user name from backend
        const userFromDB = await checkUserExists(username);
        if (userFromDB) {
          const user = { 
            username: username, 
            name: userFromDB.name || username, 
            role: 'user', 
            userId: username 
          };
          setCurrentUser(user);
          localStorage.setItem('sentineliq_user', JSON.stringify(user));
          return { success: true, user };
        }
      }
    }

    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sentineliq_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-transparent backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md">
                <img 
                  src="/logo.svg" 
                  alt="SentinelIQ Logo" 
                  className="w-10 h-10"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SentinelIQ</h1>
                <p className="text-xs text-gray-400">Insider Threat Detection</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/signin')}
                className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
              <span className="text-indigo-300 text-sm font-semibold">🚀 AI-Powered Security Platform</span>
            </div>
            
            <h1 className="text-6xl font-bold text-white leading-tight">
              Detect Insider Threats<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Before They Strike
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              Advanced AI/ML-powered platform that identifies suspicious behavior patterns, 
              analyzes user activities, and prevents security breaches in real-time.
            </p>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/signin')}
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition font-semibold text-lg shadow-lg shadow-indigo-500/50"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition font-semibold text-lg border border-white/20">
                Watch Demo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="space-y-1">
                <p className="text-3xl font-bold text-white">94.5%</p>
                <p className="text-sm text-gray-400">Detection Accuracy</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-white">&lt;1s</p>
                <p className="text-sm text-gray-400">Response Time</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-white">10K+</p>
                <p className="text-sm text-gray-400">Users Protected</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 blur-3xl"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Live Threat Detection</h3>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-semibold">Active</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl border border-white/5">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">High Risk Activity</p>
                      <p className="text-sm text-gray-400">Off-hours file access detected</p>
                    </div>
                    <span className="text-red-400 font-bold">ITS: 89</span>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl border border-white/5">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Activity className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Anomaly Detected</p>
                      <p className="text-sm text-gray-400">Unusual email patterns</p>
                    </div>
                    <span className="text-yellow-400 font-bold">ITS: 67</span>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl border border-white/5">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Normal Activity</p>
                      <p className="text-sm text-gray-400">Standard user behavior</p>
                    </div>
                    <span className="text-green-400 font-bold">ITS: 23</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Comprehensive Security Features</h2>
            <p className="text-xl text-gray-400">Everything you need to protect your organization</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Cpu, title: 'AI/ML Detection', description: 'Ensemble ML models with 89.8% accuracy (XGBoost + Random Forest + Isolation Forest)', color: 'indigo' },
              { icon: Activity, title: 'Real-Time Monitoring', description: 'Sub-second threat detection and alerting', color: 'purple' },
              { icon: Users, title: 'User Intelligence', description: 'Comprehensive behavioral analytics and profiling', color: 'blue' },
              { icon: Zap, title: 'Attack Simulation', description: 'Interactive threat scenario testing', color: 'red' }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-indigo-500/50 transition group">
                <div className={`inline-block p-3 bg-${feature.color}-500/20 rounded-xl mb-4 group-hover:scale-110 transition`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-white font-semibold">SentinelIQ</p>
                <p className="text-xs text-gray-400">© 2024 All rights reserved</p>
              </div>
            </div>
            <p className="text-gray-400">Built by Abhinav P V, Abhinav Gadde, Indushree</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Sign In Page Component
const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.svg" 
              alt="SentinelIQ Logo" 
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">SentinelIQ</h1>
              <p className="text-gray-400">Insider Threat Detection</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-white leading-tight">
              Welcome Back!
            </h2>
            <p className="text-xl text-gray-300">
              Sign in to access your security dashboard and monitor threats in real-time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <Cpu className="w-6 h-6 text-indigo-400" />
                <span className="text-2xl font-bold text-white">94.5%</span>
              </div>
              <p className="text-sm text-gray-400">ML Accuracy</p>
            </div>
            <div className="p-4 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-white">&lt;1s</span>
              </div>
              <p className="text-sm text-gray-400">Response Time</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
            <div className="lg:hidden flex items-center space-x-3 mb-8">
              <img 
                src="/logo.svg" 
                alt="SentinelIQ Logo" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">SentinelIQ</h1>
                <p className="text-sm text-gray-400">Insider Threat Detection</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
              <p className="text-gray-400">Access your security dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition font-semibold text-lg shadow-lg shadow-indigo-500/50 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400 text-center">
                Contact your security administrator for login credentials
              </p>
              <button 
                onClick={() => navigate('/')}
                className="mt-6 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Timeline Component with Real-time Updates
const ActivityTimeline = ({ activities }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for real-time "ago" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp) => {
    const activityDate = new Date(timestamp);
    const diffMs = currentTime - activityDate;
    
    // If timestamp is in the future (shouldn't happen, but handle it gracefully)
    if (diffMs < 0) {
      return 'Just now'; // Treat future timestamps as "just now"
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}${diffMins === 1 ? ' minute' : ' minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours}${diffHours === 1 ? ' hour' : ' hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays}${diffDays === 1 ? ' day' : ' days'} ago`;
    } else {
      return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If timestamp is in the future, show current time instead (shouldn't happen, but handle it)
    if (date > now) {
      return now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Format: "Nov 14, 2024, 2:30 PM" (realistic format)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {activities.map((activity, idx) => {
        return (
          <div key={idx} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
            <div className="flex-shrink-0 mt-1">
              {activity.activity_type === 'logon' && <Activity className="w-5 h-5 text-blue-600" />}
              {activity.activity_type === 'logoff' && <Clock className="w-5 h-5 text-gray-600" />}
              {activity.activity_type === 'file_access' && <FileText className="w-5 h-5 text-green-600" />}
              {activity.activity_type === 'email' && <Mail className="w-5 h-5 text-purple-600" />}
              {activity.activity_type === 'device' && <HardDrive className="w-5 h-5 text-orange-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-medium capitalize text-sm">
                  {activity.activity_type.replace('_', ' ')}
                </p>
                <span className="text-xs text-gray-500 font-medium">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
              {activity.details && typeof activity.details === 'object' && (
                <div className="mt-2 space-y-1">
                  {activity.activity_type === 'logon' && (
                    <>
                      {activity.details.ip && <p className="text-xs text-gray-600">IP: {activity.details.ip}</p>}
                      {activity.details.device && <p className="text-xs text-gray-600">Device: {activity.details.device}</p>}
                    </>
                  )}
                  {activity.activity_type === 'file_access' && (
                    <>
                      {activity.details.file_path && <p className="text-xs text-gray-600">File: {activity.details.file_path}</p>}
                      {activity.details.action && <p className="text-xs text-gray-600">Action: {activity.details.action}</p>}
                      {activity.details.sensitivity && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          activity.details.sensitivity === 'high' ? 'bg-red-100 text-red-700' :
                          activity.details.sensitivity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {activity.details.sensitivity} sensitivity
                        </span>
                      )}
                    </>
                  )}
                  {activity.activity_type === 'email' && (
                    <>
                      {activity.details.recipient && <p className="text-xs text-gray-600">To: {activity.details.recipient}</p>}
                      {activity.details.external !== undefined && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          activity.details.external ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {activity.details.external ? 'External' : 'Internal'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper functions for timestamp formatting
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    // Parse timestamp - handle both ISO strings and Date objects
    let date;
    if (typeof timestamp === 'string') {
      // Check if timestamp has timezone info (Z, +, or - after date part)
      const hasTimezone = timestamp.includes('Z') || 
                          timestamp.match(/[+-]\d{2}:\d{2}$/) || 
                          timestamp.match(/[+-]\d{4}$/);
      
      if (!hasTimezone && timestamp.includes('T')) {
        // No timezone specified - parse manually as local time
        // CRITICAL FIX: JavaScript's Date() interprets ISO strings without timezone as UTC
        // We MUST manually parse and create a Date in local timezone to avoid timezone offset issues
        const [datePart, timePart] = timestamp.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        
        // Handle time part - may have milliseconds or timezone info at the end
        let timeStr = timePart;
        let milliseconds = 0;
        
        // Remove any timezone info if present (shouldn't be, but handle it)
        if (timeStr.includes('+') || timeStr.includes('-') || timeStr.includes('Z')) {
          timeStr = timeStr.replace(/[+-]\d{2}:\d{2}$/, '').replace(/Z$/, '');
        }
        
        // Extract milliseconds if present
        if (timeStr.includes('.')) {
          const [timeOnly, msStr] = timeStr.split('.');
          timeStr = timeOnly;
          // Extract milliseconds (may have 3-6 digits, take first 3)
          const msDigits = msStr.replace(/[^0-9]/g, '').substring(0, 3);
          milliseconds = parseInt(msDigits.padEnd(3, '0'), 10);
        }
        
        const [hour, minute, second] = timeStr.split(':').map(Number);
        
        // Create Date object in LOCAL timezone (this is the critical fix)
        // Using Date constructor with individual components creates a date in local timezone
        date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0, milliseconds);
        
        // Debug logging (can be removed in production)
        console.log(`[TIMESTAMP] Parsed "${timestamp}" as local time:`, date.toLocaleString());
      } else {
        // Has timezone info - parse normally
        date = new Date(timestamp);
      }
    } else {
      date = new Date(timestamp);
    }
    
    // Handle invalid dates
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', timestamp);
      return 'Invalid date';
    }
    
    // Format with timezone awareness
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error, 'timestamp:', timestamp);
    return 'Invalid date';
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    // Parse timestamp - handle both ISO strings and Date objects
    let date;
    if (typeof timestamp === 'string') {
      // Check if timestamp has timezone info (Z, +, or - after date part)
      const hasTimezone = timestamp.includes('Z') || 
                          timestamp.match(/[+-]\d{2}:\d{2}$/) || 
                          timestamp.match(/[+-]\d{4}$/);
      
      if (!hasTimezone && timestamp.includes('T')) {
        // No timezone specified - parse manually as local time
        // CRITICAL FIX: JavaScript's Date() interprets ISO strings without timezone as UTC
        // We MUST manually parse and create a Date in local timezone to avoid timezone offset issues
        const [datePart, timePart] = timestamp.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        
        // Handle time part - may have milliseconds or timezone info at the end
        let timeStr = timePart;
        let milliseconds = 0;
        
        // Remove any timezone info if present (shouldn't be, but handle it)
        if (timeStr.includes('+') || timeStr.includes('-') || timeStr.includes('Z')) {
          timeStr = timeStr.replace(/[+-]\d{2}:\d{2}$/, '').replace(/Z$/, '');
        }
        
        // Extract milliseconds if present
        if (timeStr.includes('.')) {
          const [timeOnly, msStr] = timeStr.split('.');
          timeStr = timeOnly;
          // Extract milliseconds (may have 3-6 digits, take first 3)
          const msDigits = msStr.replace(/[^0-9]/g, '').substring(0, 3);
          milliseconds = parseInt(msDigits.padEnd(3, '0'), 10);
        }
        
        const [hour, minute, second] = timeStr.split(':').map(Number);
        
        // Create Date object in LOCAL timezone (this is the critical fix)
        // Using Date constructor with individual components creates a date in local timezone
        date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0, milliseconds);
        
        // Debug logging (can be removed in production)
        console.log(`[TIMESTAMP] Parsed "${timestamp}" as local time:`, date.toLocaleString());
      } else {
        // Has timezone info - parse normally
        date = new Date(timestamp);
      }
      
      // Validate the date was parsed correctly
      if (isNaN(date.getTime())) {
        console.error('Failed to parse timestamp:', timestamp);
        return 'N/A';
      }
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffMs = now - date;
    
    // Handle negative differences (future timestamps) - should not happen but handle gracefully
    if (diffMs < 0) {
      return 'Just now';
    }
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting time ago:', error, 'timestamp:', timestamp);
    return 'Invalid date';
  }
};

// New Incident Form Component
const NewIncidentForm = ({ users, onClose, onSuccess, showNotification, API_URL }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    severity: 'medium',
    description: '',
    explanation: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.description) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formData.user_id,
          severity: formData.severity,
          description: formData.description,
          explanation: formData.explanation || formData.description
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        showNotification(error.detail || 'Failed to create incident', 'error');
      }
    } catch (error) {
      showNotification('Error creating incident', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.user_id}
          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Select a user...</option>
          {users.map(user => (
            <option key={user.user_id} value={user.user_id}>
              {user.name} ({user.user_id}) - {user.risk_level || 'low'} risk
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the incident..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Explanation
        </label>
        <textarea
          value={formData.explanation}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          placeholder="Provide detailed information about the incident..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Incident'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [users, setUsers] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    high_risk_users: 0,
    active_threats: 0,
    average_its: 0,
    alerts_today: 0,
    ensemble_accuracy: null
  });

  // New state for all tabs
  const [incidents, setIncidents] = useState([]);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [itsScoreTrend, setItsScoreTrend] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Wait for AuthProvider to restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sentineliq_user');
    
    if (stored) {
      // User exists in localStorage - AuthProvider will restore it
      // Wait a moment for AuthProvider to restore, then check
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // No stored user - user is logged out
      setIsLoading(false);
    }
  }, []); // Only run on mount

  // Watch for currentUser changes - if it gets restored, stop loading
  useEffect(() => {
    if (currentUser) {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          
          // If user role, filter to show only their data
          if (currentUser?.role === 'user') {
            const userProfile = data.find(u => u.user_id === currentUser.userId);
            setUsers(userProfile ? [userProfile] : []);
          } else {
            setUsers(data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (currentUser) {
      fetchUsers();
      const interval = setInterval(fetchUsers, 5000); // Refresh every 5 seconds for real-time updates
      return () => clearInterval(interval);
    }
  }, [API_URL, currentUser]);

  // Fetch dashboard stats with real-time updates
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`);
        if (response.ok) {
          const data = await response.json();
          
          // If user role, show only their stats
          if (currentUser?.role === 'user') {
            const userProfile = users.find(u => u.user_id === currentUser.userId);
            // Fetch user's alert count
            try {
              const userAlertsResponse = await fetch(`${API_URL}/api/alerts?user_id=${currentUser.userId}&limit=50`);
              let userAlertCount = 0;
              if (userAlertsResponse.ok) {
                const userAlertsData = await userAlertsResponse.json();
                userAlertCount = (userAlertsData || []).filter(a => !a.is_viewed).length;
              }
              
              setDashboardStats({
                total_users: 1,
                high_risk_users: userProfile?.risk_level === 'high' || userProfile?.risk_level === 'critical' ? 1 : 0,
                active_threats: userProfile?.risk_level === 'critical' ? 1 : 0,
                average_its: userProfile?.its_score || 0,
                alerts_today: userAlertCount,
                ensemble_accuracy: null
              });
            } catch (error) {
              console.error('Error fetching user alerts:', error);
              setDashboardStats({
                total_users: 1,
                high_risk_users: userProfile?.risk_level === 'high' || userProfile?.risk_level === 'critical' ? 1 : 0,
                active_threats: userProfile?.risk_level === 'critical' ? 1 : 0,
                average_its: userProfile?.its_score || 0,
                alerts_today: 0,
                ensemble_accuracy: null
              });
            }
          } else {
            setDashboardStats({
              total_users: data.total_users || 0,
              high_risk_users: data.high_risk_users || 0,
              active_threats: data.active_threats || 0,
              average_its: parseFloat(data.average_its || 0).toFixed(1),
              alerts_today: data.alerts_today || 0,
              ensemble_accuracy: data.ensemble_accuracy || null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (currentUser) {
      fetchStats();
      const interval = setInterval(fetchStats, 3000); // Refresh every 3 seconds for real-time updates
      return () => clearInterval(interval);
    }
  }, [API_URL, currentUser, users]);

  // REAL-TIME ALERT POLLING - Fetch alerts every 3 seconds (for both admin and user)
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!currentUser) return;
      
      try {
        // For users, fetch only their alerts; for admin, fetch all
        const url = currentUser.role === 'admin' 
          ? `${API_URL}/api/alerts?limit=50&unread_only=false`
          : `${API_URL}/api/alerts?limit=50&unread_only=false&user_id=${currentUser.userId}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAlerts(data || []);
          
          // Update alerts count in dashboard stats (only for admin)
          if (currentUser.role === 'admin') {
            const unreadCount = (data || []).filter(a => !a.is_viewed).length;
            setDashboardStats(prev => ({
              ...prev,
              alerts_today: unreadCount
            }));
          } else {
            // For users, update their personal alert count
            const userAlertCount = (data || []).filter(a => !a.is_viewed).length;
            setDashboardStats(prev => ({
              ...prev,
              alerts_today: userAlertCount
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    if (currentUser) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [API_URL, currentUser]);

  // REAL-TIME INCIDENT POLLING - Fetch incidents every 5 seconds (admin only)
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        const response = await fetch(`${API_URL}/api/incidents?limit=100`);
        if (response.ok) {
          const data = await response.json();
          // Transform backend format to frontend format with proper numeric ID extraction
          const transformedIncidents = (data || []).map(inc => {
            // Extract numeric ID consistently
            let numericId = null;
            if (inc.incident_id) {
              // If it's a number, use it directly
              if (typeof inc.incident_id === 'number') {
                numericId = inc.incident_id;
              } else {
                // If it's a string, extract number
                const match = String(inc.incident_id).match(/(\d+)/);
                numericId = match ? parseInt(match[1], 10) : null;
              }
            }
            if (!numericId && inc.id) {
              const match = String(inc.id).match(/(\d+)/);
              numericId = match ? parseInt(match[1], 10) : null;
            }
            
            return {
              id: inc.incident_id_formatted || inc.id || `INC${numericId || 0}`,
              incident_id: inc.incident_id_formatted || inc.incident_id || inc.id,
              incident_id_numeric: numericId || (typeof inc.incident_id === 'number' ? inc.incident_id : null),
              alert_id: inc.incident_id || inc.alert_id,
              user_id: inc.user_id,
              user: inc.user_name || inc.user || 'Unknown',
              user_name: inc.user_name || inc.user,
              severity: inc.severity,
              status: inc.status || 'open',
              created: inc.created_at || inc.created || inc.timestamp,
              created_at: inc.created_at || inc.created || inc.timestamp,
              timestamp: inc.timestamp || inc.created_at || inc.created,
              description: inc.description || inc.explanation || '',
              its_score: inc.its_score || 0,
              incident_type: inc.incident_type || 'suspicious_activity',
              assigned_to: inc.assigned_to || 'Security Team',
              resolution_notes: inc.resolution_notes || null,
              resolved_at: inc.resolved_at || null
            };
          });
          setIncidents(transformedIncidents);
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchIncidents();
      const interval = setInterval(fetchIncidents, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [API_URL, currentUser]);

  const fetchUserActivities = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/activities?days=7`);
      if (response.ok) {
        const data = await response.json();
        setUserActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    fetchUserActivities(user.user_id);
    setActiveView('user-detail');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        if (currentUser?.role === 'user') {
          const userProfile = data.find(u => u.user_id === currentUser.userId);
          setUsers(userProfile ? [userProfile] : []);
        } else {
          setUsers(data || []);
        }
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = () => {
    // Show confirmation modal instead of directly logging out
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Actually perform logout after confirmation
    logout();
    setShowLogoutConfirm(false);
    navigate('/signin');
  };

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return '#6b7280';
    switch(riskLevel.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskBadge = (riskLevel) => {
    if (!riskLevel) return 'bg-gray-100 text-gray-800 border-gray-300';
    switch(riskLevel.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRisk === 'all' || user.risk_level === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const riskDistribution = [
    { name: 'Low', value: users.filter(u => u.risk_level === 'low').length, color: '#10b981' },
    { name: 'Medium', value: users.filter(u => u.risk_level === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: users.filter(u => u.risk_level === 'high').length, color: '#ef4444' },
    { name: 'Critical', value: users.filter(u => u.risk_level === 'critical').length, color: '#dc2626' }
  ].filter(item => item.value > 0); // Only show categories with values > 0

  // Fetch historical ITS scores for trend chart
  const fetchHistoricalITS = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/historical-its?days=7`);
      if (response.ok) {
        const data = await response.json();
        if (data.trend && data.trend.length > 0) {
          setItsScoreTrend(data.trend);
        } else {
          // Fallback: use current score for all days if no historical data
          const currentUser = users.find(u => u.user_id === userId) || users[0];
          const currentScore = currentUser?.its_score || 0;
          const fallbackTrend = Array.from({ length: 7 }, (_, i) => ({
            day: `Day ${i + 1}`,
            score: i === 6 ? currentScore : 0, // Only show current score for today
            alerts: i === 6 ? (dashboardStats.alerts_today || 0) : 0
          }));
          setItsScoreTrend(fallbackTrend);
        }
      }
    } catch (error) {
      console.error('Error fetching historical ITS:', error);
      // Fallback on error
      const currentUser = users.find(u => u.user_id === userId) || users[0];
      const currentScore = currentUser?.its_score || 0;
      const fallbackTrend = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        score: i === 6 ? currentScore : 0,
        alerts: i === 6 ? (dashboardStats.alerts_today || 0) : 0
      }));
      setItsScoreTrend(fallbackTrend);
    }
  };

  // Fetch data when tabs are active
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const fetchTabData = async () => {
      try {
        if (activeView === 'incidents') {
          const response = await fetch(`${API_URL}/api/incidents?limit=100`);
          if (response.ok) {
            const data = await response.json();
            // Transform backend format to frontend format
            const transformedIncidents = (data || []).map(inc => {
              // Extract numeric ID from formatted string (e.g., "INC00001" -> 1)
              let numericId = null;
              if (inc.incident_id) {
                // If it's a formatted string like "INC00001", extract the number
                const match = String(inc.incident_id).match(/(\d+)/);
                numericId = match ? parseInt(match[1], 10) : null;
              }
              // Fallback to direct numeric value if available
              if (!numericId && typeof inc.incident_id === 'number') {
                numericId = inc.incident_id;
              }
              // Last resort: try to extract from id field
              if (!numericId && inc.id) {
                const match = String(inc.id).match(/(\d+)/);
                numericId = match ? parseInt(match[1], 10) : null;
              }
              
              return {
                id: inc.incident_id || inc.id || `INC${numericId || 0}`,
                incident_id: inc.incident_id || inc.id,
                incident_id_numeric: numericId, // Store numeric ID for API calls
                alert_id: inc.incident_id || inc.alert_id,
                user_id: inc.user_id,
                user: inc.user_name || inc.user || 'Unknown',
                user_name: inc.user_name || inc.user,
                severity: inc.severity,
                status: inc.status || 'open',
                created: inc.created_at || inc.timestamp || inc.created,
                created_at: inc.created_at || inc.timestamp || inc.created,
                timestamp: inc.timestamp || inc.created_at || inc.created,
                description: inc.description || inc.explanation || '',
                its_score: inc.its_score || 0,
                incident_type: inc.incident_type || 'suspicious_activity',
                assigned_to: inc.assigned_to || 'Security Team',
                resolution_notes: inc.resolution_notes || null,
                resolved_at: inc.resolved_at || null
              };
            });
            setIncidents(transformedIncidents);
          }
        } else if (activeView === 'alerts') {
          // Fetch alerts (user-specific for users, all for admin)
          const alertsUrl = currentUser?.role === 'admin'
            ? `${API_URL}/api/alerts?limit=50&unread_only=false`
            : `${API_URL}/api/alerts?limit=50&unread_only=false&user_id=${currentUser?.userId}`;
          
          const response = await fetch(alertsUrl);
          if (response.ok) {
            const data = await response.json();
            setAlerts(data || []);
            // Mark all alerts as viewed when tab is opened (only for admin)
            if (currentUser?.role === 'admin' && data && data.length > 0) {
              fetch(`${API_URL}/api/alerts/mark-viewed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alert_ids: null }) // null means mark all
              }).then(() => {
                // Refresh dashboard stats to update badge count
                refreshDashboardData();
              });
            }
          }
        } else if (activeView === 'analytics') {
          const response = await fetch(`${API_URL}/api/analytics/models`);
          if (response.ok) {
            const data = await response.json();
            setAnalyticsData(data);
          }
        } else if (activeView === 'intelligence' && selectedUser) {
          const response = await fetch(`${API_URL}/api/intelligence/${selectedUser.user_id}`);
          if (response.ok) {
            const data = await response.json();
            setIntelligenceData(data);
          }
        }
      } catch (error) {
        console.error('Error fetching tab data:', error);
      }
    };

    fetchTabData();
  }, [activeView, API_URL, currentUser, selectedUser]);

  // Fetch historical ITS on mount and when users change
  // MUST be before any early returns (React hooks rule)
  useEffect(() => {
    if (currentUser?.role === 'user' && currentUser?.userId) {
      fetchHistoricalITS(currentUser.userId);
    } else if (currentUser?.role === 'admin' && users.length > 0) {
      // For admin, use first user or calculate average
      const firstUser = users[0];
      if (firstUser) {
        fetchHistoricalITS(firstUser.user_id);
      }
    }
  }, [currentUser, users, API_URL]);

  // Refresh historical ITS data periodically (every 10 seconds) to keep it updated
  useEffect(() => {
    if (!currentUser) return;
    
    const refreshHistoricalITS = () => {
      if (currentUser?.role === 'user' && currentUser?.userId) {
        fetchHistoricalITS(currentUser.userId);
      } else if (currentUser?.role === 'admin' && users.length > 0) {
        const firstUser = users[0];
        if (firstUser) {
          fetchHistoricalITS(firstUser.user_id);
        }
      }
    };
    
    // Refresh every 10 seconds to keep data current
    const interval = setInterval(refreshHistoricalITS, 10000);
    return () => clearInterval(interval);
  }, [currentUser, users, API_URL]);

  // Check authentication status
  const stored = localStorage.getItem('sentineliq_user');
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we have localStorage but no currentUser yet, wait for AuthProvider to restore
  if (!currentUser && stored) {
    // Give AuthProvider more time to restore - don't redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Only redirect if there's no user AND no localStorage (user explicitly logged out)
  if (!currentUser && !stored) {
    // User is truly logged out - redirect to signin
    navigate('/signin');
    return null;
  }

  // Notification component
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Refresh all dashboard data
  const refreshDashboardData = async () => {
    try {
      // Refresh users
      const usersResponse = await fetch(`${API_URL}/api/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (currentUser?.role === 'user') {
          const userProfile = usersData.find(u => u.user_id === currentUser.userId);
          setUsers(userProfile ? [userProfile] : []);
        } else {
          setUsers(usersData || []);
        }
      }

      // Refresh stats
      const statsResponse = await fetch(`${API_URL}/api/dashboard/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (currentUser?.role === 'user') {
          const userProfile = users.find(u => u.user_id === currentUser.userId);
          // Fetch user's alert count
          try {
            const userAlertsResponse = await fetch(`${API_URL}/api/alerts?user_id=${currentUser.userId}&limit=50`);
            let userAlertCount = 0;
            if (userAlertsResponse.ok) {
              const userAlertsData = await userAlertsResponse.json();
              userAlertCount = (userAlertsData || []).filter(a => !a.is_viewed).length;
            }
            
            setDashboardStats({
              total_users: 1,
              high_risk_users: userProfile?.risk_level === 'high' || userProfile?.risk_level === 'critical' ? 1 : 0,
              active_threats: userProfile?.risk_level === 'critical' ? 1 : 0,
              average_its: userProfile?.its_score || 0,
              alerts_today: userAlertCount,
              ensemble_accuracy: null
            });
          } catch (error) {
            console.error('Error fetching user alerts:', error);
            setDashboardStats({
              total_users: 1,
              high_risk_users: userProfile?.risk_level === 'high' || userProfile?.risk_level === 'critical' ? 1 : 0,
              active_threats: userProfile?.risk_level === 'critical' ? 1 : 0,
              average_its: userProfile?.its_score || 0,
              alerts_today: 0,
              ensemble_accuracy: null
            });
          }
        } else {
          setDashboardStats({
            total_users: statsData.total_users || 0,
            high_risk_users: statsData.high_risk_users || 0,
            active_threats: statsData.active_threats || 0,
            average_its: parseFloat(statsData.average_its || 0).toFixed(1),
            alerts_today: statsData.alerts_today || 0,
            ensemble_accuracy: statsData.ensemble_accuracy || null
          });
        }
      }

      // Refresh alerts (user-specific for users, all for admin)
      if (currentUser) {
        const alertsUrl = currentUser.role === 'admin'
          ? `${API_URL}/api/alerts?limit=50&unread_only=false`
          : `${API_URL}/api/alerts?limit=50&unread_only=false&user_id=${currentUser.userId}`;
        const alertsResponse = await fetch(alertsUrl);
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData || []);
        }
      }

      // Refresh incidents
      if (currentUser?.role === 'admin') {
        const incidentsResponse = await fetch(`${API_URL}/api/incidents`);
        if (incidentsResponse.ok) {
          const incidentsData = await incidentsResponse.json();
          setIncidents(incidentsData || []);
        }
      }

      // Refresh activities for:
      // 1. Selected user (if admin viewing user detail)
      // 2. Current user (if regular user viewing their own timeline)
      if (selectedUser) {
        await fetchUserActivities(selectedUser.user_id);
        await fetchHistoricalITS(selectedUser.user_id);
      } else if (currentUser?.role === 'user' && currentUser?.userId) {
        // Regular user viewing their own timeline
        await fetchUserActivities(currentUser.userId);
        await fetchHistoricalITS(currentUser.userId);
      } else if (currentUser?.role === 'admin' && users.length > 0) {
        // Admin: fetch trend for first user or average
        const firstUser = users[0];
        if (firstUser) {
          await fetchHistoricalITS(firstUser.user_id);
        }
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast - Highest z-index to appear above all */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] max-w-md transform transition-all duration-300 ${
          notification ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 
          'bg-blue-500'
        } text-white px-6 py-4 rounded-lg shadow-2xl flex items-start space-x-3 border-l-4 ${
          notification.type === 'success' ? 'border-green-600' : 
          notification.type === 'error' ? 'border-red-600' : 
          'border-blue-600'
        }`} style={{ zIndex: 9999 }}>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {notification.type === 'success' ? '✅ Success' : notification.type === 'error' ? '❌ Error' : 'ℹ️ Info'}
            </p>
            <p className="text-sm mt-1 leading-relaxed">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="text-white hover:text-gray-200 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md">
                <img 
                  src="/logo.svg" 
                  alt="SentinelIQ Logo" 
                  className="w-8 h-8"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>SentinelIQ</span>
                  <span className="text-sm font-normal text-indigo-600">Dashboard</span>
                </h1>
                <p className="text-sm text-gray-500">
                  {currentUser.role === 'admin' ? 'Security Operations Center' : `${currentUser.name} - User Portal`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={handleRefresh} className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-gray-700">Refresh</span>
              </button>
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Active</span>
              </div>
              <button 
                onClick={() => setActiveView('alerts')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {dashboardStats.alerts_today > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {dashboardStats.alerts_today}
                  </span>
                )}
              </button>
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-900 font-medium">{currentUser.name}</p>
                <p className="text-xs text-indigo-600">{currentUser.role === 'admin' ? 'Admin' : 'User'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-gray-700"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">Do you want to logout?</p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-gray-200">
          <div className="px-6 py-3 flex space-x-1 overflow-x-auto">
          {(currentUser.role === 'admin' ? [
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'incidents', label: 'Incidents', icon: AlertCircle },
            { id: 'intelligence', label: 'Intelligence', icon: User },
            { id: 'simulation', label: 'Simulation', icon: Zap }
          ] : [
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'alerts', label: 'My Alerts', icon: AlertTriangle }
          ]).map(view => {
            const IconComponent = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${
                  activeView === view.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeView === 'overview' && (
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {currentUser.role === 'admin' ? 'Total Users' : 'My Profile'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.total_users}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {currentUser.role === 'admin' ? 'Monitored employees' : 'Active user'}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {currentUser.role === 'admin' ? 'High Risk Users' : 'My Risk Level'}
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{dashboardStats.high_risk_users}</p>
                  <p className="text-xs text-red-400 mt-1">
                    {currentUser.role === 'admin' ? 'Require attention' : users[0]?.risk_level?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {currentUser.role === 'admin' ? 'Alerts Today' : 'My Alerts'}
                  </p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{dashboardStats.alerts_today}</p>
                  <p className="text-xs text-orange-400 mt-1">Generated alerts</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {currentUser.role === 'admin' ? 'Average ITS' : 'My ITS Score'}
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{dashboardStats.average_its}</p>
                  <p className="text-xs text-blue-400 mt-1">
                    {currentUser.role === 'admin' ? 'System average' : 'Threat score'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Threats</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{dashboardStats.active_threats}</p>
                  <p className="text-xs text-purple-400 mt-1">Priority users</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold mb-4 text-gray-900">ITS Score Trend (Last 7 Days)</h3>
              {itsScoreTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={itsScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} name="ITS Score" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} name="Alerts" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p>Loading historical data...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold mb-4 text-gray-900">Risk Distribution</h3>
              {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                    <Tooltip formatter={(value) => `${value} users`} />
                    <Legend />
                </PieChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>No risk data available</p>
            </div>
              )}
            </div>
          </div>

          {/* Top Risky Users or User Activities */}
          {currentUser.role === 'admin' ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold mb-4 text-gray-900">Top Risky Users</h3>
              <div className="space-y-3">
                {users.slice(0, 10).sort((a, b) => b.its_score - a.its_score).map((user, idx) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border border-gray-200" onClick={() => selectUser(user)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 font-medium text-sm">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.role} • {user.user_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: getRiskColor(user.risk_level) }}>
                        {user.its_score.toFixed(1)}
                      </p>
                        <p className="text-xs text-gray-500">ITS Score</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadge(user.risk_level)}`}>
                        {user.risk_level ? user.risk_level.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold mb-4 text-gray-900">My Profile & Activities</h3>
              {users.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {users[0].name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{users[0].name}</h4>
                      <p className="text-sm text-gray-600">{users[0].role} • {users[0].department}</p>
                      <p className="text-xs text-gray-500 mt-1">User ID: {users[0].user_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold" style={{ color: getRiskColor(users[0].risk_level) }}>
                        {users[0].its_score.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">ITS Score</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadge(users[0].risk_level)}`}>
                        {users[0].risk_level?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => selectUser(users[0])}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View My Activity Timeline</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeView === 'users' && currentUser.role === 'admin' && (
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">All Monitored Users</h2>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="critical">Critical Risk</option>
                </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITS Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold" style={{ color: getRiskColor(user.risk_level) }}>
                          {user.its_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadge(user.risk_level)}`}>
                          {user.risk_level ? user.risk_level.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.last_updated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => selectUser(user)}
                          className="flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Detail View */}
      {activeView === 'user-detail' && selectedUser && (
        <div className="p-6 space-y-6">
          <button
            onClick={() => setActiveView('overview')}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition font-medium text-sm"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedUser.role} • {selectedUser.department}</p>
                  <p className="text-sm text-gray-500 mt-1">User ID: {selectedUser.user_id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Insider Threat Score</p>
                <p className="text-5xl font-bold" style={{ color: getRiskColor(selectedUser.risk_level) }}>
                  {selectedUser.its_score.toFixed(1)}
                </p>
                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold border ${getRiskBadge(selectedUser.risk_level)}`}>
                  {selectedUser.risk_level.toUpperCase()} RISK
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-4 text-gray-900">Activity Timeline (Last 7 Days)</h3>
            {userActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No activities found for this user</p>
                        </div>
            ) : (
              <ActivityTimeline activities={userActivities} />
                      )}
                        </div>
                        </div>
                      )}

      {/* Incidents Page */}
      {currentUser.role === 'admin' && activeView === 'incidents' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Incident Management</h2>
            <button 
              onClick={() => setShowNewIncidentModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
            >
              <AlertCircle className="w-4 h-4" />
              <span>New Incident</span>
            </button>
                        </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">{incidents.filter(i => i.status === 'open').length}</p>
                      </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{incidents.filter(i => i.status === 'in_progress').length}</p>
          </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
        </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{incidents.filter(i => i.status === 'resolved').length}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Incidents</h3>
                      </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incident</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ITS Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No incidents found. Trigger an anomaly or create a new incident to see them here.
                      </td>
                    </tr>
                  ) : (
                    incidents.map((incident, idx) => {
                      // Extract numeric ID for API calls - handle all formats
                      let incidentIdNum = incident.incident_id_numeric;
                      
                      if (!incidentIdNum && incident.incident_id) {
                        if (typeof incident.incident_id === 'number') {
                          incidentIdNum = incident.incident_id;
                        } else {
                          const match = String(incident.incident_id).match(/(\d+)/);
                          incidentIdNum = match ? parseInt(match[1], 10) : null;
                        }
                      }
                      
                      if (!incidentIdNum && incident.id) {
                        const match = String(incident.id).match(/(\d+)/);
                        incidentIdNum = match ? parseInt(match[1], 10) : null;
                      }
                      
                      if (!incidentIdNum && incident.alert_id) {
                        incidentIdNum = parseInt(String(incident.alert_id).replace(/\D/g, ''), 10);
                      }
                
                return (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <FileText className="h-5 w-5 text-white" />
                        </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{incident.id || incident.incident_id || `INC${incident.alert_id || 0}`}</div>
                              <div className="text-sm text-gray-500">{incident.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.user || incident.user_name || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            incident.severity === 'high' || incident.severity === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                            incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {(incident.severity || 'medium').toUpperCase()}
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            incident.status === 'open' ? 'bg-red-100 text-red-800 border border-red-200' :
                            incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {(incident.status || 'open').replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {incident.created ? new Date(incident.created).toLocaleDateString() : 
                           incident.created_at ? new Date(incident.created_at).toLocaleDateString() :
                           incident.timestamp ? new Date(incident.timestamp).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: getRiskColor(incident.severity) }}>
                          {incident.its_score?.toFixed(1) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            {incident.status !== 'resolved' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedIncident(incident);
                                    setShowResolveModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium flex items-center space-x-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Resolve</span>
                                </button>
                                {incident.status === 'open' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        // Extract numeric ID for API call (must be done here, not in map scope)
                                        const startIncidentIdNum = incident.incident_id_numeric || 
                                                                  (incident.incident_id ? parseInt(String(incident.incident_id).replace(/\D/g, ''), 10) : null) ||
                                                                  (incident.alert_id ? parseInt(String(incident.alert_id).replace(/\D/g, ''), 10) : null) ||
                                                                  (incident.id ? parseInt(String(incident.id).replace(/\D/g, ''), 10) : null);
                                        
                                        if (!startIncidentIdNum) {
                                          console.error('Start button - Incident data:', incident);
                                          showNotification(`Error: Could not determine incident ID. ID: ${incident.id || incident.incident_id || 'undefined'}`, 'error');
                                          return;
                                        }
                                        
                                        const response = await fetch(`${API_URL}/api/incidents/${startIncidentIdNum}/status`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'in_progress' })
                                        });
                                        if (response.ok) {
                                          showNotification('Incident status updated to In Progress', 'success');
                                          // Refresh incidents immediately
                                          const incidentsResponse = await fetch(`${API_URL}/api/incidents?limit=100`);
                                          if (incidentsResponse.ok) {
                                            const incidentsData = await incidentsResponse.json();
                                            const transformedIncidents = (incidentsData || []).map(inc => {
                                              // Extract numeric ID
                                              let numericId = null;
                                              if (inc.incident_id) {
                                                const match = String(inc.incident_id).match(/(\d+)/);
                                                numericId = match ? parseInt(match[1], 10) : null;
                                              }
                                              if (!numericId && typeof inc.incident_id === 'number') {
                                                numericId = inc.incident_id;
                                              }
                                              if (!numericId && inc.id) {
                                                const match = String(inc.id).match(/(\d+)/);
                                                numericId = match ? parseInt(match[1], 10) : null;
                                              }
                                              
                                              return {
                                                id: inc.incident_id || inc.id || `INC${numericId || 0}`,
                                                incident_id: inc.incident_id || inc.id,
                                                incident_id_numeric: numericId,
                                                alert_id: inc.incident_id || inc.alert_id,
                                                user_id: inc.user_id,
                                                user: inc.user_name || inc.user || 'Unknown',
                                                user_name: inc.user_name || inc.user,
                                                severity: inc.severity,
                                                status: inc.status || 'open',
                                                created: inc.created_at || inc.timestamp || inc.created,
                                                created_at: inc.created_at || inc.timestamp || inc.created,
                                                timestamp: inc.timestamp || inc.created_at || inc.created,
                                                description: inc.description || inc.explanation || '',
                                                its_score: inc.its_score || 0,
                                                incident_type: inc.incident_type || 'suspicious_activity',
                                                assigned_to: inc.assigned_to || 'Security Team',
                                                resolution_notes: inc.resolution_notes || null,
                                                resolved_at: inc.resolved_at || null
                                              };
                                            });
                                            setIncidents(transformedIncidents);
                                          }
                                          await refreshDashboardData();
                                        } else {
                                          showNotification('Failed to update incident status', 'error');
                                        }
                                      } catch (error) {
                                        showNotification('Error updating incident', 'error');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-xs font-medium flex items-center space-x-1"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>Start</span>
                                  </button>
                                )}
                              </>
                            )}
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
                        </div>
                      )}

      {/* New Incident Modal */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4" style={{ zIndex: 9998 }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Create New Incident</h3>
                <button
                  onClick={() => setShowNewIncidentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                    </div>
            </div>
            <NewIncidentForm 
              users={users}
              onClose={() => setShowNewIncidentModal(false)}
              onSuccess={async () => {
                showNotification('Incident created successfully', 'success');
                setShowNewIncidentModal(false);
                
                // Immediately refresh incidents list with proper transformation
                try {
                  const incidentsResponse = await fetch(`${API_URL}/api/incidents?limit=100`);
                  if (incidentsResponse.ok) {
                    const incidentsData = await incidentsResponse.json();
                    const transformedIncidents = (incidentsData || []).map(inc => {
                      // Extract numeric ID consistently
                      let numericId = null;
                      if (inc.incident_id) {
                        // If it's a number, use it directly
                        if (typeof inc.incident_id === 'number') {
                          numericId = inc.incident_id;
                        } else {
                          // If it's a string, extract number
                          const match = String(inc.incident_id).match(/(\d+)/);
                          numericId = match ? parseInt(match[1], 10) : null;
                        }
                      }
                      if (!numericId && inc.id) {
                        const match = String(inc.id).match(/(\d+)/);
                        numericId = match ? parseInt(match[1], 10) : null;
                      }
                      
                      return {
                        id: inc.incident_id_formatted || inc.id || `INC${numericId || 0}`,
                        incident_id: inc.incident_id_formatted || inc.incident_id || inc.id,
                        incident_id_numeric: numericId || (typeof inc.incident_id === 'number' ? inc.incident_id : null),
                        alert_id: inc.incident_id || inc.alert_id,
                        user_id: inc.user_id,
                        user: inc.user_name || inc.user || 'Unknown',
                        user_name: inc.user_name || inc.user,
                        severity: inc.severity,
                        status: inc.status || 'open',
                        created: inc.created_at || inc.created || inc.timestamp,
                        created_at: inc.created_at || inc.created || inc.timestamp,
                        timestamp: inc.timestamp || inc.created_at || inc.created,
                        description: inc.description || inc.explanation || '',
                        its_score: inc.its_score || 0,
                        incident_type: inc.incident_type || 'suspicious_activity',
                        assigned_to: inc.assigned_to || 'Security Team',
                        resolution_notes: inc.resolution_notes || null,
                        resolved_at: inc.resolved_at || null
                      };
                    });
                    setIncidents(transformedIncidents);
                    console.log('[NEW INCIDENT] Refreshed incidents list:', transformedIncidents.length, 'incidents');
                  }
                } catch (error) {
                  console.error('Error refreshing incidents after creation:', error);
                }
                
                await refreshDashboardData();
              }}
              showNotification={showNotification}
              API_URL={API_URL}
            />
          </div>
        </div>
      )}

      {/* Resolve Incident Modal */}
      {showResolveModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4" style={{ zIndex: 9998 }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Resolve Incident</h3>
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedIncident(null);
                    setResolveNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                      </div>
                    </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Incident ID</p>
                <p className="font-semibold text-gray-900">{selectedIncident.id}</p>
                  </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">User</p>
                <p className="font-semibold text-gray-900">{selectedIncident.user}</p>
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Enter resolution details, actions taken, and any additional notes..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                    </div>
              <div className="flex items-center space-x-3 pt-4">
                    <button
                  onClick={async () => {
                    if (!resolveNotes.trim()) {
                      showNotification('Please enter resolution notes', 'error');
                      return;
                    }
                    try {
                      // Extract numeric ID for API call - try multiple methods
                      let incidentIdNum = selectedIncident.incident_id_numeric;
                      
                      if (!incidentIdNum && selectedIncident.incident_id) {
                        const match = String(selectedIncident.incident_id).match(/(\d+)/);
                        incidentIdNum = match ? parseInt(match[1], 10) : null;
                      }
                      
                      if (!incidentIdNum && selectedIncident.id) {
                        const match = String(selectedIncident.id).match(/(\d+)/);
                        incidentIdNum = match ? parseInt(match[1], 10) : null;
                      }
                      
                      if (!incidentIdNum && selectedIncident.alert_id) {
                        incidentIdNum = parseInt(String(selectedIncident.alert_id).replace(/\D/g, ''), 10);
                      }
                      
                      if (!incidentIdNum || isNaN(incidentIdNum)) {
                        console.error('Resolve button - Incident data:', selectedIncident);
                        showNotification(`Error: Could not determine incident ID. ID: ${selectedIncident.id || selectedIncident.incident_id || 'undefined'}`, 'error');
                        return;
                      }
                      
                      console.log(`[RESOLVE] Attempting to resolve incident with ID: ${incidentIdNum}`);
                      const response = await fetch(`${API_URL}/api/incidents/${incidentIdNum}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resolution_notes: resolveNotes })
                      });
                      if (response.ok) {
                        showNotification('Incident resolved successfully', 'success');
                        setShowResolveModal(false);
                        setSelectedIncident(null);
                        setResolveNotes('');
                        // Refresh incidents immediately
                        const incidentsResponse = await fetch(`${API_URL}/api/incidents?limit=100`);
                        if (incidentsResponse.ok) {
                          const incidentsData = await incidentsResponse.json();
                          const transformedIncidents = (incidentsData || []).map(inc => {
                            // Extract numeric ID consistently
                            let numericId = null;
                            if (inc.incident_id) {
                              const match = String(inc.incident_id).match(/(\d+)/);
                              numericId = match ? parseInt(match[1], 10) : null;
                            }
                            if (!numericId && typeof inc.incident_id === 'number') {
                              numericId = inc.incident_id;
                            }
                            if (!numericId && inc.id) {
                              const match = String(inc.id).match(/(\d+)/);
                              numericId = match ? parseInt(match[1], 10) : null;
                            }
                            
                            return {
                              id: inc.incident_id || inc.id || `INC${numericId || 0}`,
                              incident_id: inc.incident_id || inc.id,
                              incident_id_numeric: numericId,
                              alert_id: inc.incident_id || inc.alert_id,
                              user_id: inc.user_id,
                              user: inc.user_name || inc.user || 'Unknown',
                              user_name: inc.user_name || inc.user,
                              severity: inc.severity,
                              status: inc.status || 'open',
                              created: inc.created_at || inc.timestamp || inc.created,
                              created_at: inc.created_at || inc.timestamp || inc.created,
                              timestamp: inc.timestamp || inc.created_at || inc.created,
                              description: inc.description || inc.explanation || '',
                              its_score: inc.its_score || 0,
                              incident_type: inc.incident_type || 'suspicious_activity',
                              assigned_to: inc.assigned_to || 'Security Team',
                              resolution_notes: inc.resolution_notes || null,
                              resolved_at: inc.resolved_at || null
                            };
                          });
                          setIncidents(transformedIncidents);
                        }
                        await refreshDashboardData();
                      } else {
                        const error = await response.json();
                        showNotification(error.detail || 'Failed to resolve incident', 'error');
                      }
                    } catch (error) {
                      showNotification('Error resolving incident', 'error');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Resolve Incident
                </button>
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedIncident(null);
                    setResolveNotes('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                    </button>
                  </div>
                </div>
          </div>
        </div>
      )}

      {/* Alerts Page - Both Admin and User */}
      {activeView === 'alerts' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentUser.role === 'admin' ? 'Threat Alerts' : 'My Alerts'}
            </h2>
            {currentUser.role === 'admin' && (
            <button
              onClick={async () => {
                // Mark all alerts as viewed
                try {
                  const response = await fetch(`${API_URL}/api/alerts/mark-viewed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alert_ids: null })
                  });
                  if (response.ok) {
                    showNotification('All alerts marked as viewed', 'success');
                    await refreshDashboardData();
                    // Refresh alerts list
                    const alertsResponse = await fetch(`${API_URL}/api/alerts`);
                    if (alertsResponse.ok) {
                      const alertsData = await alertsResponse.json();
                      setAlerts(alertsData || []);
                    }
                  }
                } catch (error) {
                  showNotification('Error marking alerts as viewed', 'error');
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark All as Viewed</span>
            </button>
            )}
                      </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Alerts</h3>
                <p className="text-gray-500">All systems operating normally</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {alerts.map((alert, idx) => (
                  <div 
                    key={alert.alert_db_id || idx} 
                    className={`p-6 hover:bg-gray-50 transition cursor-pointer ${alert.is_viewed ? 'opacity-60' : 'opacity-100 bg-red-50/30'}`}
                    onClick={async () => {
                      // Mark individual alert as viewed when clicked
                      if (alert.alert_db_id && !alert.is_viewed) {
                        try {
                          const response = await fetch(`${API_URL}/api/alerts/mark-viewed`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ alert_ids: [alert.alert_db_id] })
                          });
                          if (response.ok) {
                            await refreshDashboardData();
                            // Update local state
                            setAlerts(prev => prev.map(a => 
                              a.alert_db_id === alert.alert_db_id 
                                ? { ...a, is_viewed: true } 
                                : a
                            ));
                          }
                        } catch (error) {
                          console.error('Error marking alert as viewed:', error);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900">{alert.alert_id}</p>
                          {!alert.is_viewed && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
                              NEW
                          </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.explanation || 'Anomaly detected'}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <p className="text-xs text-gray-500 font-medium">
                            🕐 {formatTimestamp(alert.timestamp)} ({formatTimeAgo(alert.timestamp)})
                          </p>
                          <p className="text-xs text-gray-500">User: {alert.user_id}</p>
                        </div>
                        {alert.anomalies && alert.anomalies.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {alert.anomalies.slice(0, 3).map((anomaly, aIdx) => (
                              <span key={aIdx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                {anomaly}
                              </span>
              ))}
                      </div>
                        )}
                    </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold" style={{ color: getRiskColor(alert.risk_level) }}>
                          {alert.its_score.toFixed(1)}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadge(alert.risk_level)}`}>
                          {alert.risk_level.toUpperCase()}
                        </span>
                        {alert.is_incident && (
                          <span className="inline-block mt-2 ml-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            INCIDENT
                          </span>
                        )}
                      </div>
                      {currentUser.role === 'admin' && (alert.risk_level === 'high' || alert.risk_level === 'critical') && !alert.is_incident && (
                        <div className="mt-3 flex space-x-2">
                    <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                  const response = await fetch(`${API_URL}/api/alerts/${alert.alert_db_id}/convert-to-incident`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' }
                                  });
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    
                                    if (data.status === 'already_converted') {
                                      showNotification(
                                        `This alert was already converted to incident ${data.incident_id_formatted}`,
                                        'info'
                                      );
                                    } else if (data.status === 'converted') {
                                      showNotification(
                                        `✅ Alert successfully converted to incident ${data.incident_id_formatted}`,
                                        'success'
                                      );
                                      
                                      // Immediately refresh incidents list
                                      const incidentsResponse = await fetch(`${API_URL}/api/incidents?limit=100`);
                                      if (incidentsResponse.ok) {
                                        const incidentsData = await incidentsResponse.json();
                                        const transformedIncidents = (incidentsData || []).map(inc => {
                                          let numericId = null;
                                          if (inc.incident_id) {
                                            if (typeof inc.incident_id === 'number') {
                                              numericId = inc.incident_id;
                                            } else {
                                              const match = String(inc.incident_id).match(/(\d+)/);
                                              numericId = match ? parseInt(match[1], 10) : null;
                                            }
                                          }
                                          if (!numericId && inc.id) {
                                            const match = String(inc.id).match(/(\d+)/);
                                            numericId = match ? parseInt(match[1], 10) : null;
                                          }
                                          
                                          return {
                                            id: inc.incident_id_formatted || inc.id || `INC${numericId || 0}`,
                                            incident_id: inc.incident_id_formatted || inc.incident_id || inc.id,
                                            incident_id_numeric: numericId || (typeof inc.incident_id === 'number' ? inc.incident_id : null),
                                            alert_id: inc.incident_id || inc.alert_id,
                                            user_id: inc.user_id,
                                            user: inc.user_name || inc.user || 'Unknown',
                                            user_name: inc.user_name || inc.user,
                                            severity: inc.severity,
                                            status: inc.status || 'open',
                                            created: inc.created_at || inc.created || inc.timestamp,
                                            created_at: inc.created_at || inc.created || inc.timestamp,
                                            timestamp: inc.timestamp || inc.created_at || inc.created,
                                            description: inc.description || inc.explanation || '',
                                            its_score: inc.its_score || 0,
                                            incident_type: inc.incident_type || 'suspicious_activity',
                                            assigned_to: inc.assigned_to || 'Security Team',
                                            resolution_notes: inc.resolution_notes || null,
                                            resolved_at: inc.resolved_at || null
                                          };
                                        });
                                        setIncidents(transformedIncidents);
                                      }
                                    }
                                    
                                    await refreshDashboardData();
                                    
                                    // Refresh alerts to update status
                                    const alertsResponse = await fetch(`${API_URL}/api/alerts?limit=50&unread_only=false`);
                                    if (alertsResponse.ok) {
                                      const alertsData = await alertsResponse.json();
                                      setAlerts(alertsData || []);
                                    }
                                  } else {
                                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                                    showNotification(`Error: ${errorData.detail || 'Failed to convert alert'}`, 'error');
                                  }
                              } catch (error) {
                                  console.error('Error converting alert:', error);
                                  showNotification(`Error converting alert: ${error.message}`, 'error');
                              }
                            }}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Convert to Incident</span>
                    </button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Page */}
      {currentUser.role === 'admin' && activeView === 'analytics' && analyticsData && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-900">ML Model Analytics</h2>
            {analyticsData.ensemble && (
              <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white px-8 py-4 rounded-xl shadow-2xl border-2 border-indigo-300 transform hover:scale-105 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-90 mb-1">Ensemble Accuracy</p>
                    <p className="text-4xl font-bold">{analyticsData.ensemble.ensemble_accuracy_percentage.toFixed(1)}%</p>
                    <p className="text-xs opacity-75 mt-1">3-Model Ensemble</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Ensemble Explanation Card - Enhanced */}
          {analyticsData.ensemble && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-300 rounded-xl p-8 shadow-lg">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Why Ensemble Learning Despite XGBoost Being Higher?</h3>
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                      {analyticsData.ensemble.ensemble_accuracy_percentage.toFixed(1)}% Ensemble
                    </div>
                  </div>
                  <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">Note:</span> XGBoost achieves <span className="font-bold text-blue-600">91.4%</span> accuracy alone, 
                      while ensemble achieves <span className="font-bold text-indigo-600">89.3%</span>. However, ensemble provides 
                      <span className="font-semibold"> critical security advantages</span> that justify the slight accuracy trade-off.
                    </p>
                  </div>
                  <p className="text-gray-700 text-base mb-6 leading-relaxed">{analyticsData.ensemble.explanation}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {analyticsData.ensemble.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start space-x-3 bg-white rounded-lg p-4 border border-indigo-100 shadow-sm hover:shadow-md transition">
                        <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-800 font-medium">{benefit}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-5 border-2 border-indigo-400 shadow-lg">
                    <p className="text-white font-semibold mb-3 text-base">Ensemble Accuracy Calculation:</p>
                    <p className="text-white text-sm font-mono bg-black/20 rounded p-3 border border-white/20">{analyticsData.ensemble.calculation}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-white/90 text-xs mb-2">Model Contributions (Weighted Average):</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/20 rounded p-2 text-center">
                          <p className="text-white text-xs font-medium">XGBoost</p>
                          <p className="text-white text-lg font-bold">50%</p>
                          <p className="text-white/80 text-xs">91.4% acc</p>
                          <p className="text-white/70 text-xs mt-1">Contribution: 45.7%</p>
                        </div>
                        <div className="bg-white/20 rounded p-2 text-center">
                          <p className="text-white text-xs font-medium">Random Forest</p>
                          <p className="text-white text-lg font-bold">30%</p>
                          <p className="text-white/80 text-xs">89.7% acc</p>
                          <p className="text-white/70 text-xs mt-1">Contribution: 26.9%</p>
                        </div>
                        <div className="bg-white/20 rounded p-2 text-center">
                          <p className="text-white text-xs font-medium">Isolation Forest</p>
                          <p className="text-white text-lg font-bold">20%</p>
                          <p className="text-white/80 text-xs">83.4% acc</p>
                          <p className="text-white/70 text-xs mt-1">Contribution: 16.7%</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/20 text-center">
                        <p className="text-white text-sm font-semibold">
                          Total: 45.7% + 26.9% + 16.7% = <span className="text-yellow-300">89.3%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Model Performance</h3>
              <div className="space-y-4">
                {analyticsData.models.map((model, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900">{model.name}</span>
                      <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${model.color} text-white`}>
                        {model.weight}
                      </span>
                        <div className="group relative">
                          <span className="text-gray-400 hover:text-gray-600 cursor-help">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <p className="font-semibold mb-1">Weight Calculation:</p>
                            <p className="text-gray-300">{model.weight_calculation || 'Based on model performance metrics'}</p>
                            <p className="mt-2 text-gray-400 text-xs">Formula: Weight = (F1 × 0.6) + (AUC × 0.4)</p>
                    </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                        <p className="text-gray-600 text-xs mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-indigo-600">{(model.accuracy * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Model accuracy</p>
                      </div>
                      <div>
                        <p className="text-gray-600">F1-Score</p>
                        <p className="text-lg font-bold text-gray-900">{model.f1.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">AUC-ROC</p>
                        <p className="text-lg font-bold text-gray-900">{model.auc.toFixed(3)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-700 mb-2">
                        <span className="font-semibold text-indigo-600">Accuracy Calculation:</span>
                      </p>
                      <p className="text-xs text-gray-600 font-mono bg-white rounded p-2 border border-gray-200">
                        (F1 × 0.6) + (AUC × 0.4) = {((model.f1 * 0.6) + (model.auc * 0.4)).toFixed(3)} = <span className="font-bold text-indigo-600">{(model.accuracy * 100).toFixed(1)}%</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">System Statistics</h3>
              <div className="space-y-4">
                {analyticsData.ensemble && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">Ensemble Accuracy</p>
                      <Cpu className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-4xl font-bold text-indigo-600 mb-1">{analyticsData.ensemble.ensemble_accuracy_percentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">3-model weighted ensemble</p>
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Model Weights:</p>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded">XGBoost 50%</span>
                        <span className="bg-green-600 text-white px-2 py-1 rounded">RF 30%</span>
                        <span className="bg-purple-600 text-white px-2 py-1 rounded">IF 20%</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Activities Processed</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.system_stats.activities_processed.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">False Positive Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.system_stats.false_positive_rate}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Detection Time</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.system_stats.detection_time_ms}ms</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Feature Importance</h3>
            <div className="space-y-3">
              {analyticsData.feature_importance.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 w-48 font-medium">{feature.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div className="bg-indigo-600 h-6 rounded-full flex items-center justify-end pr-2" style={{width: `${feature.importance * 100}%`}}>
                      <span className="text-xs text-white font-semibold">{(feature.importance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Intelligence Page */}
      {currentUser.role === 'admin' && activeView === 'intelligence' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">User Intelligence</h2>
            <select 
              onChange={(e) => {
                const user = users.find(u => u.user_id === e.target.value);
                if (user) {
                  setSelectedUser(user);
                  setActiveView('intelligence');
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option>Select User</option>
              {users.map(user => (
                <option key={user.user_id} value={user.user_id}>{user.name}</option>
              ))}
            </select>
                    </div>
          {intelligenceData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">User Profile</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {intelligenceData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                      <div>
                        <p className="font-semibold text-gray-900">{intelligenceData.name}</p>
                        <p className="text-sm text-gray-600">Developer • Engineering</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">ITS Score</p>
                        <p className="text-xl font-bold" style={{ color: getRiskColor(intelligenceData.risk_level) }}>
                          {intelligenceData.its_score.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Risk Level</p>
                        <p className="text-sm font-semibold" style={{ color: getRiskColor(intelligenceData.risk_level) }}>
                          {intelligenceData.risk_level.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Behavioral Patterns</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Work Hours Compliance</span>
                        <span>{intelligenceData.behavioral_patterns.work_hours_compliance.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${intelligenceData.behavioral_patterns.work_hours_compliance}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Access Normal</span>
                        <span>{intelligenceData.behavioral_patterns.data_access_normal.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: `${intelligenceData.behavioral_patterns.data_access_normal}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Email Pattern Normal</span>
                        <span>{intelligenceData.behavioral_patterns.email_pattern_normal.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${intelligenceData.behavioral_patterns.email_pattern_normal}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Risk Trend (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={intelligenceData.risk_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#dc2626" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Anomalies</h3>
                    <div className="space-y-3">
                      {intelligenceData.top_anomalies.map((anomaly, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{anomaly.type}</span>
                          <span className="text-sm font-semibold text-red-600">{anomaly.count} times</span>
                </div>
              ))}
            </div>
          </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Feature Importance</h3>
                    <div className="space-y-3">
                      {intelligenceData.feature_importance.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 flex-1">{item.feature}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{width: `${item.importance * 100}%`}}></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{(item.importance * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-500">Select a user from the dropdown to view intelligence data</p>
            </div>
          )}
        </div>
      )}


      {/* Simulation Page */}
      {currentUser.role === 'admin' && activeView === 'simulation' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Attack Simulation</h2>
              <p className="text-sm text-gray-500 mt-1">Trigger anomalies to test the detection system</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Simulation Controls</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedUser?.user_id || ''}
                    onChange={(e) => {
                      const userId = e.target.value;
                      if (userId) {
                        const user = users.find(u => u.user_id === userId);
                        setSelectedUser(user || null);
                      } else {
                        setSelectedUser(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Select User --</option>
                    {users && users.length > 0 ? (
                      users.map(user => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.name} ({user.user_id}) - {user.risk_level || 'low'} risk
                        </option>
                      ))
                    ) : (
                      <option disabled>Loading users...</option>
                    )}
                  </select>
                  {selectedUser && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: <span className="font-medium">{selectedUser.name}</span> - Current ITS: {selectedUser.its_score?.toFixed(1) || 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attack Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="anomalyType" 
                    defaultValue="data_exfiltration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="data_exfiltration">Data Exfiltration - Large file downloads + external emails</option>
                    <option value="off_hours">Off-Hours Activity - Late night logons (22:00-23:59)</option>
                    <option value="sabotage">Insider Sabotage - Multiple file deletions</option>
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!selectedUser) {
                      showNotification('Please select a user first', 'error');
                      return;
                    }
                    const anomalyTypeSelect = document.getElementById('anomalyType');
                    if (!anomalyTypeSelect) {
                      showNotification('Anomaly type selector not found', 'error');
                      return;
                    }
                    const anomalyType = anomalyTypeSelect.value;
                    if (!anomalyType) {
                      showNotification('Please select an anomaly type', 'error');
                      return;
                    }
                    
                    setSimulationRunning(true);
                    showNotification('Triggering anomaly...', 'info');
                    
                    try {
                      const response = await fetch(`${API_URL}/api/trigger/anomaly?user_id=${selectedUser.user_id}&anomaly_type=${anomalyType}`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        }
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        
                        // Show success notification with activity count
                        showNotification(
                          `Anomaly triggered! ${selectedUser.name} - ${data.activities_created || 0} activities created. ITS: ${data.its_score?.toFixed(1) || 'N/A'} (${data.risk_level || 'N/A'})`,
                          'success'
                        );
                        
                        // Small delay to ensure database commit completes
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Refresh all dashboard data in real-time
                        await refreshDashboardData();
                        
                        // Update selected user's data if viewing their detail
                        if (selectedUser) {
                          const updatedUsers = await fetch(`${API_URL}/api/users`).then(r => r.json());
                          const updatedUser = updatedUsers.find(u => u.user_id === selectedUser.user_id);
                          if (updatedUser) {
                            setSelectedUser(updatedUser);
                            // Explicitly refresh activities for the user whose anomaly was triggered
                            // Add another small delay and retry to ensure activities are visible
                            await new Promise(resolve => setTimeout(resolve, 300));
                            await fetchUserActivities(selectedUser.user_id);
                            // One more refresh after a brief moment to catch any delayed commits
                            setTimeout(async () => {
                              await fetchUserActivities(selectedUser.user_id);
                            }, 1000);
                          }
                        }
                        
                        setSimulationRunning(false);
                      } else {
                        const errorText = await response.text();
                        let errorData;
                        try {
                          errorData = JSON.parse(errorText);
                        } catch {
                          errorData = { detail: errorText || 'Unknown server error' };
                        }
                        showNotification(`Failed: ${errorData.detail || 'Server error'}`, 'error');
                        setSimulationRunning(false);
                      }
                    } catch (error) {
                      console.error('Error triggering anomaly:', error);
                      showNotification(`Network Error: ${error.message}`, 'error');
                      setSimulationRunning(false);
                    }
                  }}
                  disabled={simulationRunning || !selectedUser}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {simulationRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Triggering Anomaly...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Trigger Anomaly</span>
                    </>
                  )}
                </button>
                {selectedUser && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> After triggering, all dashboard data will update automatically in real-time. No page refresh needed!
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Instructions</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-indigo-600">1.</span>
                  <p>Select a user from the dropdown above</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-indigo-600">2.</span>
                  <p>Choose an anomaly type to simulate</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-indigo-600">3.</span>
                  <p>Click "Trigger Anomaly" button</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">What happens:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Creates suspicious activities</li>
                    <li>Recalculates ITS score</li>
                    <li>Generates an alert</li>
                    <li>Updates all dashboard metrics</li>
                  </ul>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>💡 Tip:</strong> Check the Alerts and Incidents tabs after triggering to see the generated alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component with Routing
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

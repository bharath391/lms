import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'; // Added RadialBar components
import { 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  List, 
  FileText, 
  Video, 
  Edit, 
  Trash2, 
  Save, 
  Play, 
  ArrowLeft,
  Menu,
  FilePlus,
  TrendingUp,
  Award,
  Book,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Brain,
  Sparkles,
  MessageSquare,
  LogIn,
  UserPlus,
  Rocket, // Added for insights
  TrendingDown, // Added for insights
  Target // Added for insights
} from 'lucide-react';

// --- API Configuration ---

// Create an Axios instance for our API
// We assume the backend is running on http://localhost:5000/api
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// --- App Context ---
const AppContext = createContext();

// --- Auth Provider ---
// This new AuthProvider manages user, token, and API calls to *your* backend.
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // Is auth ready?
  const [darkMode, setDarkMode] = useState(true);

  // This effect runs on app load to check if we have a valid token
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        // Add token to all future API requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Check if token is valid by fetching user details
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          // Token is invalid or expired
          console.error("Auth Error:", err);
          setToken(null);
          localStorage.removeItem('token');
          api.defaults.headers.common['Authorization'] = null;
        }
      }
      setLoading(false);
    };
    validateToken();
  }, [token]);

  // Handle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Login function
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  // Register function
  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    api.defaults.headers.common['Authorization'] = null;
  };

  // Navigation state
  const [navigation, setNavigation] = useState({
    view: 'dashboard',
    id: null,
  });

  const value = {
    user,
    token,
    loading,
    darkMode,
    navigation,
    setNavigation,
    login,
    register,
    logout,
    toggleDarkMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useAppContext = () => useContext(AppContext);

// --- Gemini API Service (Frontend) ---
// This part is the same, as it's a frontend-only service call.
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
const GEMINI_API_KEY = ""; // Provided by environment

const fetchWithBackoff = async (url, options, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithBackoff(url, options, retries - 1, delay * 2);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const generateJsonWithGemini = async (prompt, schema, systemInstruction = null) => {
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
  try {
    const result = await fetchWithBackoff(GEMINI_API_URL + GEMINI_API_KEY, options);
    const candidate = result.candidates?.[0];
    if (candidate && candidate.content?.parts?.[0]?.text) {
      const jsonText = candidate.content.parts[0].text;
      return JSON.parse(jsonText);
    } else {
      console.error("Invalid JSON response structure from Gemini:", result);
      throw new Error("Failed to parse AI JSON response.");
    }
  } catch (error) {
    console.error("Error calling Gemini API for JSON:", error);
    throw new Error("An error occurred while communicating with the AI.");
  }
};

// --- Reusable Components (Mostly Unchanged) ---

const LoadingSpinner = ({ size = 'lg' }) => {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className={`animate-spin rounded-full border-4 border-t-blue-600 border-gray-200 dark:border-gray-700 ${sizeClasses[size]}`}></div>
  );
};

const FullPageLoader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <LoadingSpinner size="lg" />
    <p className="mt-4 text-lg font-medium">{message}</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-gray-900 p-6">
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-200 dark:border-red-700">
      <X className="w-16 h-16 text-red-500 mx-auto" />
      <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-400">An Error Occurred</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{message || "Something went wrong. Please refresh the page."}</p>
    </div>
  </div>
);

const StatCard = ({ title, value, icon, change, changeType }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</span>
      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    {change && (
      <div className="flex items-center mt-2 text-sm">
        <span className={`flex items-center font-semibold ${changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${changeType === 'positive' ? '' : 'rotate-180'}`} />
          {change}
        </span>
        <span className="ml-2 text-gray-500 dark:text-gray-400">from last month</span>
      </div>
    )}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 border border-gray-200 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, ...props }) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-500',
  };
  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

const Input = ({ label, id, ...props }) => (
  <div className="w-full">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600"
      {...props}
    />
  </div>
);

const Textarea = ({ label, id, ...props }) => (
  <div className="w-full">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <textarea
      id={id}
      rows="4"
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600"
      {...props}
    />
  </div>
);


// --- Login/Register Component ---
const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-2">
           <Brain className="w-10 h-10 text-blue-600 dark:text-blue-400" />
           <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            CourseAI
           </h1>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-200">
          {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <Input
              label="Name"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                I am a...
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full" 
            disabled={loading}
            icon={isLogin ? LogIn : UserPlus}
          >
            {loading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Login' : 'Sign Up')}
          </Button>
        </form>
        
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="font-medium text-blue-600 hover:text-blue-500 ml-1"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};


// --- App Layout ---

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const Header = ({ setSidebarOpen }) => {
  const { toggleDarkMode, darkMode, user, logout } = useAppContext();
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="text-gray-500 dark:text-gray-300 focus:outline-none lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2 hidden sm:block">Course Creator</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative group">
          <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
             <img 
               className="w-8 h-8 rounded-full" 
               src={`https://api.dicebear.com/8.x/identicon/svg?seed=${user?.id || 'default'}`} 
               alt="User Avatar" 
             />
             <span className="hidden md:block text-sm font-medium">{user?.name || 'Guest'}</span>
             <ChevronDown className="w-4 h-4 hidden md:block" />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-10 border dark:border-gray-700">
            <button 
              onClick={logout} 
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { navigation, setNavigation, user } = useAppContext();

  const handleNavClick = (view) => {
    setNavigation({ view, id: null });
    setSidebarOpen(false);
  };

  // Define nav items based on user role
  const baseNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard', roles: ['student', 'instructor'] },
    { name: 'My Courses', icon: BookOpen, view: 'courses', roles: ['student', 'instructor'] },
  ];
  
  const instructorNavItems = [
    { name: 'Create Course', icon: FilePlus, view: 'createCourse', roles: ['instructor'] },
    { name: 'Analytics', icon: BarChart2, view: 'analytics', roles: ['instructor'] },
    { name: 'Students', icon: Users, view: 'students', roles: ['instructor'] },
  ];
  
  const studentNavItems = [
    // Add student-specific links here if any
  ];
  
  const commonNavItems = [
    { name: 'Settings', icon: Settings, view: 'settings', roles: ['student', 'instructor'] },
  ];
  
  let navItems = [];
  if (user?.role === 'instructor') {
    navItems = [...baseNavItems, ...instructorNavItems, ...commonNavItems];
  } else {
    navItems = [...baseNavItems, ...studentNavItems, ...commonNavItems];
  }

  return (
    <>
      <div 
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div 
        className={`fixed z-30 inset-y-0 left-0 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out 
                    bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700
                    flex flex-col`}
      >
        <div className="flex items-center justify-center px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
            CourseAI
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.view)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200
                ${navigation.view === item.view 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="ml-3 font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-blue-50 dark:bg-gray-900 rounded-lg text-center">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Logged in as {user?.role}:
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={user?.email}>
              {user?.name}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};


// --- Main Application Pages ---

// --- Dashboard ---
// Updated to fetch from *your* analytics endpoint
const Dashboard = () => {
  const { user, setNavigation, darkMode } = useAppContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState(null); // Add state for enrollments

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null); // Reset error
      try {
        if (user.role === 'student') {
          // Fetch from your student summary endpoint
          const summaryRes = await api.get('/analytics/student/summary');
          setStats(summaryRes.data);
          
          // ALSO fetch enrollments for real progress
          const enrollmentsRes = await api.get('/enrollments/my-courses');
          setEnrollments(enrollmentsRes.data);

        } else if (user.role === 'instructor') {
          // TODO: Fetch from your (to-be-created) instructor summary endpoint
          // Mocking data for instructor for now
          setStats({
            totalCourses: 5,
            totalStudents: 150,
            totalRevenue: 12000,
            avgCompletion: 55,
            revenueData: [
              { name: 'Jan', revenue: 2000 }, { name: 'Feb', revenue: 1500 },
              { name: 'Mar', revenue: 3000 }, { name: 'Apr', revenue: 2800 },
              { name: 'May', revenue: 4000 }, { name: 'Jun', revenue: 3800 },
            ]
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.error || "Failed to load dashboard data.");
      }
      setLoading(false);
    };
    
    fetchDashboardData();
  }, [user.role]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  if (!stats) {
    return <ErrorDisplay message="Could not load dashboard data." />;
  }

  // Render correct dashboard based on role
  return user.role === 'instructor' 
    ? <InstructorDashboard stats={stats} setNavigation={setNavigation} darkMode={darkMode} />
    : <StudentDashboard stats={stats} enrollments={enrollments} setNavigation={setNavigation} darkMode={darkMode} />; // Pass enrollments
};

const InstructorDashboard = ({ stats, setNavigation, darkMode }) => (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
      <Button 
        onClick={() => setNavigation({ view: 'createCourse', id: null })} 
        variant="primary" 
        icon={Plus}
        className="mt-4 sm:mt-0"
      >
        Create New Course
      </Button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Courses" value={stats.totalCourses} icon={<BookOpen className="w-6 h-6" />} />
      <StatCard title="Total Students" value={stats.totalStudents.toLocaleString()} icon={<Users className="w-6 h-6" />} />
      <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<BarChart2 className="w-6 h-6" />} />
      <StatCard title="Avg. Completion" value={`${stats.avgCompletion}%`} icon={<Award className="w-6 h-6" />} />
    </div>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={stats.revenueData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#ffffff', borderColor: darkMode ? '#4b5563' : '#e5e7eb' }} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// --- New Student Insight Components ---

// 1. Component to show list of course progress
const CourseProgressList = ({ enrollments, darkMode }) => {
  if (!enrollments) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">My Course Progress</h3>
        <div className="flex justify-center items-center h-24">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }
  
  const overallProgress = enrollments.length > 0
    ? enrollments.reduce((acc, e) => acc + e.progress_percentage, 0) / enrollments.length
    : 0;
  
  const progressData = [{ name: 'Overall', progress: overallProgress }];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4">My Course Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Progress Chart */}
        <div className="flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="60%" 
              outerRadius="90%" 
              barSize={20} 
              data={progressData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="progress"
                angleAxisId={0}
                fill="#3b82f6"
                cornerRadius={10}
              />
              <Tooltip />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-3xl font-bold fill-gray-900 dark:fill-white"
              >
                {`${overallProgress.toFixed(0)}%`}
              </text>
              <text 
                x="50%" 
                y="65%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-sm font-medium fill-gray-500 dark:fill-gray-400"
              >
                Overall
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Progress List */}
        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
          {enrollments.map(e => (
            <div key={e._id}>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="truncate" title={e.course_id.title}>{e.course_id.title}</span>
                <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">{e.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${e.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 2. Component for Velocity & Predictions
const CompletionPredictor = ({ enrollments }) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enrollments) return;

    const fetchAllProgress = async () => {
      setLoading(true);
      try {
        const progressPromises = enrollments.map(e => 
          api.get(`/enrollments/${e._id}/progress`)
        );
        const results = await Promise.all(progressPromises);
        
        const progressMap = {};
        enrollments.forEach((e, index) => {
          progressMap[e._id] = results[index].data;
        });
        setProgressData(progressMap);
      } catch (err) {
        console.error("Failed to fetch progress data for prediction", err);
      }
      setLoading(false);
    };

    fetchAllProgress();
  }, [enrollments]);

  const calculatePredictions = () => {
    if (!enrollments || !progressData) return [];
    
    const predictions = enrollments.map(e => {
      const progressRecords = progressData[e._id];
      if (!progressRecords || progressRecords.length < 2 || e.progress_percentage === 0 || e.progress_percentage === 100) {
        return { 
          title: e.course_id.title, 
          message: e.progress_percentage === 100 ? "Completed!" : "Keep going to see a prediction." 
        };
      }
      
      const completedCount = progressRecords.length;
      const progressPercent = e.progress_percentage;
      const totalCount = Math.round((completedCount * 100) / progressPercent);
      const remainingCount = totalCount - completedCount;
      
      const sortedProgress = progressRecords.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
      const firstDate = new Date(sortedProgress[0].completedAt);
      const lastDate = new Date(sortedProgress[sortedProgress.length - 1].completedAt);
      
      let daysElapsed = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      if (daysElapsed < 1) daysElapsed = 1; // Avoid division by zero, assume at least 1 day
      
      const velocity = completedCount / daysElapsed; // lessons/day
      if (velocity === 0) {
         return { title: e.course_id.title, message: "Keep going to see a prediction." };
      }
      
      const daysRemaining = remainingCount / velocity;
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + daysRemaining);
      
      return {
        title: e.course_id.title,
        message: `At ${velocity.toFixed(1)} lessons/day, you'll finish by`,
        prediction: predictedDate.toLocaleDateString()
      };
    });
    
    return predictions;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Completion Predictions</h3>
        <div className="flex justify-center items-center h-24">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }
  
  const predictions = calculatePredictions();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Completion Predictions</h3>
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
        {predictions.map((p, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className={`flex-shrink-0 p-2 rounded-full ${p.prediction ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm truncate" title={p.title}>{p.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{p.message}</p>
              {p.prediction && (
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{p.prediction}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Component for Velocity Report
const CourseVelocityReport = ({ enrollments }) => {
  if (!enrollments || enrollments.length === 0) {
    return null; // Don't show if no courses
  }
  
  const sortedByProgress = [...enrollments].sort((a, b) => b.progress_percentage - a.progress_percentage);
  const highest = sortedByProgress[0];
  const lowest = sortedByProgress.length > 1 ? sortedByProgress[sortedByProgress.length - 1] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
        <div className="flex-shrink-0 p-3 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Highest Progress</p>
          <p className="font-semibold truncate" title={highest.course_id.title}>{highest.course_id.title}</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{highest.progress_percentage}%</p>
        </div>
      </div>
      
      {lowest && lowest.progress_percentage < 100 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Needs Focus</p>
            <p className="font-semibold truncate" title={lowest.course_id.title}>{lowest.course_id.title}</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{lowest.progress_percentage}%</p>
          </div>
        </div>
      )}
    </div>
  );
};


const StudentDashboard = ({ stats, enrollments, setNavigation, darkMode }) => (
  <div className="space-y-8">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
    {/* Top Stat Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <StatCard title="Courses Enrolled" value={stats.coursesEnrolled} icon={<BookOpen className="w-6 h-6" />} />
      <StatCard title="Average Quiz Score" value={stats.averageScore ? `${stats.averageScore}%` : 'N/A'} icon={<Award className="w-6 h-6" />} />
    </div>

    {/* New Real-Data Insights Section */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1 & 2: Course Progress List */}
      <CourseProgressList enrollments={enrollments} darkMode={darkMode} />
      
      {/* Column 3: Predictions */}
      <CompletionPredictor enrollments={enrollments} />
    </div>

    {/* New Velocity Report Section */}
    <CourseVelocityReport enrollments={enrollments} />

    {/* Areas for Improvement (from backend) */}
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Areas for Improvement (from Quizzes)</h3>
      {stats.areasForImprovement && stats.areasForImprovement.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {stats.areasForImprovement.map(area => (
            <span key={area} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
              {area}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Keep up the great work! No weak areas detected in your quizzes.</p>
      )}
    </div>
  </div>
);


// --- Courses List ---
// Fetches data based on user role
const CoursesList = () => {
  const { user, setNavigation } = useAppContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (user.role === 'instructor') {
          // Fetch courses created by this instructor
          res = await api.get('/courses/instructor/my-courses');
          setCourses(res.data);
        } else {
          // Fetch courses the student is enrolled in
          res = await api.get('/enrollments/my-courses');
          // Data is shaped as { enrollment, course_id: { ...course_data } }
          // We map it to look like a simple course list
          const enrolledCourses = res.data.map(enrollment => ({
            ...enrollment.course_id, // The populated course object
            enrollment_id: enrollment._id,
            progress: enrollment.progress_percentage
          }));
          setCourses(enrolledCourses);
        }
      } catch (err) {
        console.error("Fetch courses error:", err);
        setError(err.response?.data?.error || "Failed to fetch courses.");
      }
      setLoading(false);
    };

    fetchCourses();
  }, [user.role]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Courses</h1>
        {user.role === 'instructor' && (
          <Button 
            onClick={() => setNavigation({ view: 'createCourse', id: null })} 
            variant="primary" 
            icon={Plus}
            className="mt-4 sm:mt-0"
          >
            Create New Course
          </Button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <Book className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto" />
          <h3 className="mt-4 text-xl font-semibold">
            {user.role === 'instructor' ? "No Courses Yet" : "Not Enrolled in Any Courses"}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {user.role === 'instructor' 
              ? "Get started by creating your first course." 
              : "Browse the course catalog to enroll."
            }
          </p>
          {user.role === 'instructor' && (
            <Button 
              onClick={() => setNavigation({ view: 'createCourse', id: null })} 
              variant="primary" 
              icon={Plus}
              className="mt-6"
            >
              Create Course
            </Button>
          )}
          {/* TODO: Add a "Browse Catalog" button for students */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} role={user.role} />
          ))}
        </div>
      )}
    </div>
  );
};

const CourseCard = ({ course, role }) => {
  const { setNavigation } = useAppContext();
  
  // Use _id from MongoDB
  const courseId = course._id;
  
  const handleViewCourse = () => {
    setNavigation({ view: 'courseDetail', id: courseId });
  };
  
  const handleEditCourse = (e) => {
    e.stopPropagation();
    setNavigation({ view: 'editCourse', id: courseId });
  };
  
  const instructorName = course.instructor_id?.name || 'N/A';
  const placeholderImg = `https://placehold.co/600x400/3b82f6/ffffff?text=${encodeURIComponent(course.title)}&font=inter`;

  return (
    <div 
      onClick={handleViewCourse}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col"
    >
      <img 
        className="w-full h-48 object-cover" 
        src={course.thumbnail || placeholderImg} 
        alt={course.title} 
        onError={(e) => e.currentTarget.src = placeholderImg}
      />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={course.title}>
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          By {instructorName}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mt-3 h-12 overflow-hidden text-ellipsis flex-grow">
          {course.description || 'No description available.'}
        </p>
        
        {role === 'student' && course.progress !== undefined && (
           <div className="mt-4">
             <div className="flex justify-between text-sm font-medium mb-1">
                <span>Progress</span>
                <span className="text-blue-600 dark:text-blue-400">{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
           </div>
        )}
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
             {/* We need to fetch week/content count separately if needed */}
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <List className="w-4 h-4 mr-1.5" />
              View Details
            </span>
          </div>
          {role === 'instructor' && (
            <Button 
              onClick={handleEditCourse} 
              variant="ghost" 
              className="px-2 py-1 !shadow-none"
              title="Edit Course"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Course Detail ---
// This is now much more complex as it fetches from multiple endpoints
const CourseDetail = () => {
  const { user, navigation, setNavigation } = useAppContext();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  
  // For students, we need enrollment and progress data
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(new Set()); // Set of completed content IDs

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!navigation.id) {
        setError("Invalid course ID.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // 1. Fetch main course details
        const courseRes = await api.get(`/courses/${navigation.id}`);
        let courseData = courseRes.data;

        // 2. Fetch weeks for the course
        const weeksRes = await api.get(`/courses/${navigation.id}/weeks`);
        let weeksData = weeksRes.data; // Already sorted by 'order' from backend

        // 3. Fetch content for *each* week
        const contentPromises = weeksData.map(week => 
          api.get(`/weeks/${week._id}/content`)
        );
        const contentResults = await Promise.all(contentPromises);
        
        // 4. Combine all data
        const fullWeeksData = weeksData.map((week, index) => ({
          ...week,
          content: contentResults[index].data, // .data contains the array of content items
        }));
        
        courseData.weeks = fullWeeksData;
        setCourse(courseData);
        
        // 5. If student, fetch enrollment and progress
        if (user.role === 'student') {
          // Find enrollment for this course
          const enrollmentsRes = await api.get('/enrollments/my-courses');
          const currentEnrollment = enrollmentsRes.data.find(e => e.course_id._id === navigation.id);
          
          if (currentEnrollment) {
            setEnrollment(currentEnrollment);
            // Fetch progress records
            const progressRes = await api.get(`/enrollments/${currentEnrollment._id}/progress`);
            const completedIds = new Set(progressRes.data.filter(p => p.completed).map(p => p.content_id));
            setProgress(completedIds);
          } else {
            // Student is not enrolled
            setEnrollment(null); 
          }
        }
        
        // 6. Set initial active content
        if (fullWeeksData.length > 0 && fullWeeksData[0].content.length > 0) {
          setActiveContent(fullWeeksData[0].content[0]);
        }

      } catch (err) {
        console.error("Fetch course detail error:", err);
        setError(err.response?.data?.error || "Failed to fetch course details.");
      }
      setLoading(false);
    };

    fetchCourseData();
  }, [navigation.id, user.role]);

  const handleContentClick = (content) => {
    setActiveContent(content);
  };
  
  const handleMarkComplete = async () => {
    if (user.role !== 'student' || !enrollment || !activeContent) return;

    try {
      // Call your backend endpoint
      await api.post('/progress', {
        enrollment_id: enrollment._id,
        content_id: activeContent._id
        // score is optional, only for quizzes
      });
      // Optimistically update UI
      setProgress(prev => new Set(prev).add(activeContent._id));
    } catch (err) {
      console.error("Failed to mark complete:", err);
      // We could show an error toast here
    }
  };
  
  const handleEnroll = async () => {
    if (user.role !== 'student' || !course) return;
    try {
      const res = await api.post('/enrollments', { course_id: course._id });
      setEnrollment(res.data);
      // Maybe refetch progress? Or just assume it's empty
      setProgress(new Set());
    } catch (err) {
       console.error("Failed to enroll:", err);
       setError(err.response?.data?.error || "Failed to enroll.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  if (!course) {
    return <ErrorDisplay message="Course data is unavailable." />;
  }
  
  // Student not enrolled
  if (user.role === 'student' && !enrollment) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">by {course.instructor_id.name}</p>
          <p className="mt-4 max-w-lg">{course.description}</p>
          <Button variant="primary" icon={Plus} className="mt-8 text-lg px-6 py-3" onClick={handleEnroll}>
            Enroll in Course
          </Button>
        </div>
       </div>
    );
  }

  // Enrolled student or instructor
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:max-h-[calc(100vh-150px)]">
      {/* Main Content */}
      <div className="lg:flex-[3] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto p-6 md:p-8">
        <div className="flex items-center mb-6">
          <Button 
            onClick={() => setNavigation({ view: 'courses', id: null })}
            variant="ghost"
            className="!px-2 mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        </div>

        {activeContent ? (
          <ContentDisplay content={activeContent} />
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto" />
            <h3 className="mt-4 text-xl font-semibold">Welcome to your course!</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Select an item from the sidebar to get started.</p>
          </div>
        )}

        {/* Navigation / Completion */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" icon={ChevronLeft}>Previous</Button>
          {user.role === 'student' && activeContent && (
            <Button 
              variant={progress.has(activeContent._id) ? "secondary" : "primary"}
              icon={Check}
              onClick={handleMarkComplete}
              disabled={progress.has(activeContent._id)}
            >
              {progress.has(activeContent._id) ? "Completed" : "Mark as Complete"}
            </Button>
          )}
          <Button variant="secondary">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </div>

      {/* Sidebar - Course Outline */}
      <div className="lg:flex-[1] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Course Outline</h2>
        <div className="space-y-4">
          {course.weeks && course.weeks.map((week) => (
            <div key={week._id}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {week.title}
              </h3>
              <ul className="space-y-1">
                {week.content && week.content.map((content) => (
                  <li key={content._id}>
                    <button 
                      onClick={() => handleContentClick(content)}
                      className={`w-full text-left flex items-center p-3 rounded-lg transition-colors
                        ${activeContent?._id === content._id 
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {getContentIcon(content.content_type, "w-4 h-4 mr-3 flex-shrink-0")}
                      <span className="text-sm font-medium flex-1 truncate">{content.title}</span>
                      {user.role === 'student' && progress.has(content._id) && (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const getContentIcon = (type, className = "w-5 h-5") => {
  switch (type) {
    case 'video':
      return <Video className={className} />;
    case 'quiz':
      return <Check className={className} />;
    case 'text':
    default:
      return <FileText className={className} />;
  }
};

// Renamed from LessonContent to ContentDisplay
const ContentDisplay = ({ content }) => {
  switch (content.content_type) {
    case 'video':
      // Extract YouTube ID from various URL formats
      const getYouTubeId = (url) => {
        if (!url) return 'dQw4w9WgXcQ'; // Default placeholder
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : 'dQw4w9WgXcQ';
      };
      const videoId = getYouTubeId(content.content); // Video URL is stored in 'content' field
      
      return (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{content.title}</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={content.title}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          {/* Your schema doesn't have a separate description field for videos, so we just show the title */}
        </div>
      );
    case 'quiz':
      return <QuizDisplay content={content} />; // Use a dedicated component for quiz logic
    case 'text':
    default:
      return (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{content.title}</h2>
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content || '<p>No content available.</p>' }} 
          />
        </div>
      );
  }
};

// New Component: QuizDisplay
const QuizDisplay = ({ content }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/content/${content._id}/questions`);
        setQuestions(res.data);
      } catch (err) {
        console.error("Fetch quiz questions error:", err);
        setError(err.response?.data?.error || "Failed to load quiz.");
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [content._id]);

  if (loading) {
    return <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>;
  }
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{content.title}</h2>
      <div 
        className="prose dark:prose-invert max-w-none mb-6"
        dangerouslySetInnerHTML={{ __html: content.content || '<p>Test your knowledge!</p>' }} 
      />
      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="font-semibold mb-2">{index + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                  <input 
                    type="radio" // Assuming multiple choice only for now
                    name={`question-${q._id}`} 
                    className="mr-2"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button variant="primary" className="mt-6">Submit Quiz</Button>
    </div>
  );
};


// --- Course Editor (Edit Existing) ---
const EditCourse = () => {
  const { user, navigation, setNavigation } = useAppContext();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // This editor is for instructors only
  if (user.role !== 'instructor') {
    return <ErrorDisplay message="You do not have permission to edit courses." />;
  }

  useEffect(() => {
    const fetchFullCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch main course details
        const courseRes = await api.get(`/courses/${navigation.id}`);
        let courseData = courseRes.data;

        // 2. Fetch weeks
        const weeksRes = await api.get(`/courses/${navigation.id}/weeks`);
        let weeksData = weeksRes.data;

        // 3. Fetch content for each week
        const contentPromises = weeksData.map(week => 
          api.get(`/weeks/${week._id}/content`)
        );
        const contentResults = await Promise.all(contentPromises);
        
        // 4. Fetch questions for each quiz content item
        const questionPromises = [];
        contentResults.forEach((weekContent, weekIndex) => {
          weekContent.data.forEach((content, contentIndex) => {
            if (content.content_type === 'quiz') {
              // Push a promise to fetch questions
              questionPromises.push(
                api.get(`/content/${content._id}/questions`).then(res => ({
                  weekIndex,
                  contentIndex,
                  questions: res.data
                }))
              );
            }
          });
        });
        
        const questionResults = await Promise.all(questionPromises);
        
        // 5. Combine all data
        const fullWeeksData = weeksData.map((week, weekIndex) => ({
          ...week,
          // Map content for this week
          content: contentResults[weekIndex].data.map((content, contentIndex) => {
            // Find if this content has questions
            const quizData = questionResults.find(
              q => q.weekIndex === weekIndex && q.contentIndex === contentIndex
            );
            return {
              ...content,
              questions: quizData ? quizData.questions : []
            };
          })
        }));
        
        courseData.weeks = fullWeeksData;
        setCourseData(courseData);
      } catch (err) {
        console.error("Fetch full course error:", err);
        setError(err.response?.data?.error || "Failed to load course for editing.");
      }
      setLoading(false);
    };

    fetchFullCourseData();
  }, [navigation.id]);

  const handleSave = async (updatedCourseData) => {
    // This is now extremely complex.
    // We need to diff the old and new state and make granular API calls.
    // For simplicity in this example, we will only support saving *top-level* details.
    // A full implementation would require a much more robust diffing-and-saving logic.
    setSaving(true);
    setError(null);
    
    try {
      const { title, description, thumbnail } = updatedCourseData;
      // Note: This only saves the *course* data, not nested weeks/content.
      await api.put(`/courses/${courseData._id}`, {
        title,
        description,
        thumbnail
      });
      
      // TODO: Implement logic to save changes to weeks, content, and questions.
      // This would involve:
      // 1. Finding new/deleted/updated weeks -> POST, DELETE, PUT /api/courses/:courseId/weeks
      // 2. Finding new/deleted/updated content -> POST, DELETE, PUT /api/weeks/:weekId/content
      // 3. Finding new/deleted/updated questions -> POST, DELETE, PUT /api/content/:contentId/questions
      
      console.warn("WARNING: Only top-level course details (title, description) are saved in this demo.");
      
      setSaving(false);
      setNavigation({ view: 'courseDetail', id: courseData._id });
    } catch (err) {
      console.error("Error saving course:", err);
      setError(err.response?.data?.error || "Failed to save course.");
      setSaving(false);
    }
  };
  
  // TODO: Implement Delete
  const handleDelete = async () => {
    alert("Delete functionality is not yet implemented.");
    // This would require DELETE /api/courses/:id and cascading deletes on the backend.
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  if (!courseData) {
    return <ErrorDisplay message="Course data could not be loaded." />;
  }

  return (
    <CourseEditor
      initialCourseData={courseData}
      onSave={handleSave}
      onCancel={() => setNavigation({ view: 'courseDetail', id: courseData._id })}
      onDelete={handleDelete}
      isSaving={saving}
      isEditing={true}
      errorMessage={error}
    />
  );
};


// --- Course Creator (New Course) ---
// This is also complex due to the chained API calls
const CreateCourse = () => {
  const { user, setNavigation } = useAppContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (user.role !== 'instructor') {
    return <ErrorDisplay message="You do not have permission to create courses." />;
  }

  const handleSave = async (newCourseData) => {
    setSaving(true);
    setError(null);
    
    // This is the complex, chained API logic
    try {
      // 1. Create the Course
      // FIX: Removed duplicate '/api' prefix
      const courseRes = await api.post('/courses', {
        title: newCourseData.title,
        description: newCourseData.description,
        thumbnail: newCourseData.thumbnail,
      });
      const newCourse = courseRes.data;
      const courseId = newCourse._id;

      // 2. Loop through Weeks (formerly modules)
      for (const [weekIndex, week] of newCourseData.weeks.entries()) {
        // FIX: Removed duplicate '/api' prefix
        const weekRes = await api.post(`/courses/${courseId}/weeks`, {
          title: week.title,
          week_number: weekIndex + 1,
          order: weekIndex
        });
        const newWeek = weekRes.data;
        const weekId = newWeek._id;

        // 3. Loop through Content (formerly lessons)
        for (const [contentIndex, content] of week.content.entries()) {
          // FIX: Removed duplicate '/api' prefix
          const contentRes = await api.post(`/weeks/${weekId}/content`, {
            title: content.title,
            content_type: content.content_type,
            content: content.content_type !== 'quiz' ? content.content : null,
            order: contentIndex
          });
          const newContent = contentRes.data;
          const contentId = newContent._id;

          // 4. If it's a quiz, loop through Questions
          if (content.content_type === 'quiz' && content.questions) {
            for (const question of content.questions) {
              // FIX: Removed duplicate '/api' prefix
              await api.post(`/content/${contentId}/questions`, {
                question_text: question.question_text,
                options: question.options,
                correct_answer: question.correct_answer,
                points: question.points
              });
            }
          }
        }
      }
      
      // All done! Navigate to the new course.
      setSaving(false);
      setNavigation({ view: 'courseDetail', id: courseId });

    } catch (err) {
      console.error("Error creating full course:", err);
      setError(err.response?.data?.error || "Failed to create course. An error occurred in the chain.");
      setSaving(false);
      // Note: This could leave partial data on the backend if one call fails.
      // A more robust backend would use transactions.
    }
  };

  return (
    <CourseEditor
      // Provide the shape your backend models expect (weeks, content, questions)
      initialCourseData={{
        title: '',
        description: '',
        thumbnail: '',
        weeks: [], // Renamed from modules
      }}
      onSave={handleSave}
      onCancel={() => setNavigation({ view: 'courses', id: null })}
      isSaving={saving}
      isEditing={false}
      errorMessage={error}
    />
  );
};


// --- AI Course Generation Flow ---
// Updated to save to *your* backend
const AICourseWizard = ({ onCourseGenerated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [outline, setOutline] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Schema for course outline generation (renamed to match your backend)
  const courseOutlineSchema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      description: { type: "STRING" },
      weeks: { // Renamed from modules
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            content: { // Renamed from lessons
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  content_type: { type: "STRING", enum: ["text", "video", "quiz"] }, // Renamed from type
                },
                required: ["title", "content_type"]
              }
            }
          },
          required: ["title", "content"]
        }
      }
    },
    required: ["title", "description", "weeks"]
  };

  // Schema for content generation (renamed to match your backend)
  const lessonContentSchema = {
    type: "OBJECT",
    properties: {
      content: { type: "STRING" }, // HTML for text, or YouTube URL for video
      questions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question_text: { type: "STRING" }, // Renamed
            options: { type: "ARRAY", items: { type: "STRING" } },
            correct_answer: { type: "NUMBER" } // Renamed, index
          },
          required: ["question_text", "options", "correct_answer"]
        }
      }
    }
  };
  
  const systemInstructions = {
    outline: "You are an expert instructional designer. Create a comprehensive course outline broken into weeks and content items. Each content item must have a title and a content_type (text, video, or quiz). Ensure the response strictly follows the provided JSON schema.",
    lesson: "You are a subject matter expert. Based on the course title, week title, and content title provided, generate the content for this specific item. Follow the JSON schema. For 'text' items, provide detailed content as an HTML string. For 'video' items, provide a *full YouTube video URL* in the 'content' field. For 'quiz' items, create an array of 2-3 relevant 'questions' with options and a zero-based 'correct_answer' index.",
  };

  const handleGenerateOutline = async () => {
    if (!prompt) {
      setError("Please enter a topic for your course.");
      return;
    }
    setGenerating(true);
    setError(null);
    
    try {
      const fullPrompt = `Generate a course outline for: "${prompt}"`;
      const generatedOutline = await generateJsonWithGemini(fullPrompt, courseOutlineSchema, systemInstructions.outline);
      setOutline(generatedOutline);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate course outline.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    setGenerating(true);
    setError(null);
    let fullCourseData = { ...outline };

    try {
      // Iterate through weeks and content to generate content
      const contentPromises = fullCourseData.weeks.map(async (week, weekIndex) => {
        const lessonPromises = week.content.map(async (content, contentIndex) => {
          const lessonPrompt = `Course: "${fullCourseData.title}"
Week: "${week.title}"
Content Item: "${content.title}"
Content Type: "${content.content_type}"
Generate the content for this item.`;
          
          try {
            const lessonContent = await generateJsonWithGemini(lessonPrompt, lessonContentSchema, systemInstructions.lesson);
            return {
              ...content,
              content: lessonContent.content || "", // HTML or Video URL
              questions: lessonContent.questions || [],
            };
          } catch (lessonError) {
            console.error(`Failed to generate content for W${weekIndex}-C${contentIndex}: ${content.title}`, lessonError);
            return { ...content, content: "<p>Error generating content.</p>", questions: [] };
          }
        });
        
        const contentWithData = await Promise.all(lessonPromises);
        return { ...week, content: contentWithData };
      });

      fullCourseData.weeks = await Promise.all(contentPromises);
      
      // Pass the fully generated course data back to the editor
      onCourseGenerated(fullCourseData);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate all course content.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {generating && (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">
            {step === 1 ? 'Generating course outline...' : 'Generating all content...'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment.</p>
        </div>
      )}

      {!generating && step === 1 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Generate Course with AI</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Describe the topic you want to teach. The AI will generate a complete course outline for you.
          </p>
          <Textarea
            label="Course Topic"
            id="course-prompt"
            placeholder="e.g., 'An introduction to Python programming for complete beginners'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" icon={Sparkles} onClick={handleGenerateOutline}>
              Generate Outline
            </Button>
          </div>
        </div>
      )}

      {!generating && step === 2 && outline && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Generated Outline</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Review the generated outline. You can edit it later.
          </p>
          
          <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-bold">{outline.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{outline.description}</p>
            <div className="space-y-4">
              {outline.weeks.map((week, index) => ( // Renamed
                <div key={index}>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Week {index + 1}: {week.title}</h4>
                  <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
                    {week.content.map((content, lIndex) => ( // Renamed
                      <li key={lIndex} className="text-sm text-gray-600 dark:text-gray-300">
                        {content.title} ({content.content_type})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 my-4">
            Happy with this outline? The AI will now generate content for all {outline.weeks.reduce((acc, m) => acc + m.content.length, 0)} items.
          </p>
          
          <div className="flex justify-between items-center mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" icon={Sparkles} onClick={handleCreateCourse}>
              Generate All Content & Create Course
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Core Course Editor Component (Used by Create & Edit) ---
// *** Renamed to use your backend's schema: Weeks & Content ***
const CourseEditor = ({ initialCourseData, onSave, onCancel, onDelete, isSaving, isEditing, errorMessage }) => {
  const [course, setCourse] = useState(initialCourseData);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [editingContent, setEditingContent] = useState(null); // { weekIndex, contentIndex, content }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleAiCourseGenerated = (generatedCourse) => {
    setCourse(generatedCourse);
    setShowAiWizard(false);
  };
  
  // --- Week Functions (formerly Module) ---
  const addWeek = () => {
    setCourse(prev => ({
      ...prev,
      weeks: [...prev.weeks, { title: `New Week ${prev.weeks.length + 1}`, content: [] }]
    }));
  };
  
  const updateWeekTitle = (weekIndex, title) => {
    setCourse(prev => {
      const newWeeks = [...prev.weeks];
      newWeeks[weekIndex].title = title;
      return { ...prev, weeks: newWeeks };
    });
  };

  const deleteWeek = (weekIndex) => {
    setCourse(prev => ({
      ...prev,
      weeks: prev.weeks.filter((_, i) => i !== weekIndex)
    }));
  };

  // --- Content Functions (formerly Lesson) ---
  const addContent = (weekIndex) => {
    const newContent = { title: `New Item`, content_type: 'text', content: '', questions: [] };
    setCourse(prev => {
      const newWeeks = [...prev.weeks];
      newWeeks[weekIndex].content.push(newContent);
      return { ...prev, weeks: newWeeks };
    });
    setEditingContent({ weekIndex, contentIndex: course.weeks[weekIndex].content.length, content: newContent });
  };
  
  const deleteContent = (weekIndex, contentIndex) => {
    setCourse(prev => {
      const newWeeks = [...prev.weeks];
      newWeeks[weekIndex].content = newWeeks[weekIndex].content.filter((_, i) => i !== contentIndex);
      return { ...prev, weeks: newWeeks };
    });
  };
  
  const openContentEditor = (weekIndex, contentIndex) => {
    setEditingContent({
      weekIndex,
      contentIndex,
      content: { ...course.weeks[weekIndex].content[contentIndex] } // Edit a copy
    });
  };

  const closeContentEditor = () => {
    setEditingContent(null);
  };
  
  const saveContent = (updatedContent) => {
    setCourse(prev => {
      const newWeeks = [...prev.weeks];
      newWeeks[editingContent.weekIndex].content[editingContent.contentIndex] = updatedContent;
      return { ...prev, weeks: newWeeks };
    });
    closeContentEditor();
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(course);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <div className="flex items-center space-x-2">
              <Button type="button" onClick={onCancel} variant="ghost" className="!px-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Course' : 'Create New Course'}
              </h1>
            </div>
            {!isEditing && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Fill in the details manually or use our AI assistant.
              </p>
            )}
          </div>
          {!isEditing && (
             <Button 
                type="button" 
                onClick={() => setShowAiWizard(true)} 
                variant="primary" 
                icon={Sparkles}
                className="mt-4 sm:mt-0"
              >
                Generate with AI
              </Button>
          )}
        </div>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-semibold">Course Details</h2>
          <Input
            label="Course Title"
            id="title"
            name="title"
            value={course.title}
            onChange={handleInputChange}
            required
          />
          <Textarea
            label="Course Description"
            id="description"
            name="description"
            value={course.description}
            onChange={handleInputChange}
          />
          <Input
            label="Cover Image (Thumbnail) URL"
            id="thumbnail"
            name="thumbnail"
            value={course.thumbnail}
            onChange={handleInputChange}
            placeholder="https://example.com/image.png"
          />
        </div>

        <div className="p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Course Structure</h2>
            <Button type="button" variant="secondary" icon={Plus} onClick={addWeek}>
              Add Week
            </Button>
          </div>
          <div className="space-y-6">
            {course.weeks.map((week, weekIndex) => (
              <WeekEditor
                key={weekIndex}
                week={week}
                weekIndex={weekIndex}
                updateWeekTitle={updateWeekTitle}
                deleteWeek={deleteWeek}
                addContent={addContent}
                deleteContent={deleteContent}
                openContentEditor={openContentEditor}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {isEditing && (
              <Button 
                type="button" 
                variant="danger" 
                icon={Trash2} 
                onClick={onDelete}
                disabled={isSaving}
              >
                Delete Course
              </Button>
            )}
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Save} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>
      </form>

      <Modal 
        isOpen={showAiWizard} 
        onClose={() => setShowAiWizard(false)} 
        title="AI Course Generator"
      >
        <AICourseWizard 
          onCancel={() => setShowAiWizard(false)}
          onCourseGenerated={handleAiCourseGenerated}
        />
      </Modal>

      <Modal 
        isOpen={!!editingContent}
        onClose={closeContentEditor}
        title={editingContent ? `Edit Content: ${editingContent.content.title}` : 'Edit Content'}
      >
        {editingContent && (
          <ContentEditor
            content={editingContent.content}
            onSave={saveContent}
            onCancel={closeContentEditor}
          />
        )}
      </Modal>
    </>
  );
};

// Renamed from ModuleEditor to WeekEditor
const WeekEditor = ({ week, weekIndex, updateWeekTitle, deleteWeek, addContent, deleteContent, openContentEditor }) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={week.title}
          onChange={(e) => updateWeekTitle(weekIndex, e.target.value)}
          placeholder="Week Title"
          className="text-lg font-semibold bg-transparent border-b border-gray-400 dark:border-gray-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 w-full mr-4 text-gray-900 dark:text-white"
        />
        <Button 
          type="button" 
          variant="ghost" 
          className="!px-2 text-red-500 hover:text-red-700" 
          onClick={() => deleteWeek(weekIndex)}
          title="Delete Week"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {week.content.map((content, contentIndex) => (
          <div 
            key={contentIndex} 
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              {getContentIcon(content.content_type, "w-4 h-4 mr-2 text-gray-500 dark:text-gray-400")}
              <span className="font-medium">{content.title}</span>
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({content.content_type})</span>
            </div>
            <div className="space-x-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="!px-2" 
                onClick={() => openContentEditor(weekIndex, contentIndex)}
                title="Edit Content"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="!px-2 text-red-500 hover:text-red-700"
                onClick={() => deleteContent(weekIndex, contentIndex)}
                title="Delete Content"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button 
        type="button" 
        variant="secondary" 
        size="sm" 
        icon={Plus} 
        onClick={() => addContent(weekIndex)}
      >
        Add Content Item
      </Button>
    </div>
  );
};


// Renamed from LessonEditor to ContentEditor
const ContentEditor = ({ content: initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, [name]: value }));
  };
  
  // --- Quiz Question Functions ---
  const addQuestion = () => {
    const newQuestion = { question_text: '', options: ['', ''], correct_answer: 0, points: 10 };
    setContent(prev => ({ ...prev, questions: [...(prev.questions || []), newQuestion] }));
  };
  
  const updateQuestion = (qIndex, field, value) => {
    setContent(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex][field] = value;
      return { ...prev, questions: newQuestions };
    });
  };
  
  const deleteQuestion = (qIndex) => {
    setContent(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIndex)
    }));
  };
  
  const addOption = (qIndex) => {
    setContent(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].options.push('');
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (qIndex, oIndex, value) => {
    setContent(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].options[oIndex] = value;
      return { ...prev, questions: newQuestions };
    });
  };
  
  const deleteOption = (qIndex, oIndex) => {
    setContent(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
      return { ...prev, questions: newQuestions };
    });
  };

  const renderContentEditor = () => {
    switch (content.content_type) {
      case 'text':
        return (
          <Textarea
            label="Lesson Content (HTML)"
            name="content"
            value={content.content}
            onChange={handleChange}
            rows={10}
            placeholder="Write lesson content here... (HTML is supported)"
          />
        );
      case 'video':
        return (
          <Input
            label="Video URL (YouTube)"
            name="content" // Your schema stores the URL in the 'content' field
            value={content.content}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        );
      case 'quiz':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold">Questions</h4>
            {content.questions && content.questions.map((q, qIndex) => (
              <QuizQuestionEditor
                key={qIndex}
                q={q}
                qIndex={qIndex}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                addOption={addOption}
                updateOption={updateOption}
                deleteOption={deleteOption}
              />
            ))}
            <Button type="button" variant="secondary" icon={Plus} onClick={addQuestion}>
              Add Question
            </Button>
          </div>
        );
      default:
        return <p>Invalid content type.</p>;
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <Input
        label="Content Title"
        name="title"
        value={content.title}
        onChange={handleChange}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Content Type
        </label>
        <select
          name="content_type" // Renamed
          value={content.content_type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="text">Text Lesson</option>
          <option value="video">Video Lesson</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>

      <div className="relative pt-4">
        {/* AI Generation button removed for simplicity in this refactor */}
        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          {renderContentEditor()}
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={() => onSave(content)}>
          Save Content
        </Button>
      </div>
    </div>
  );
};

// Sub-component for editing a single quiz question
const QuizQuestionEditor = ({ q, qIndex, updateQuestion, deleteQuestion, addOption, updateOption, deleteOption }) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-medium">Question {qIndex + 1}</p>
        <Button 
          type="button" 
          variant="ghost" 
          className="!px-2 text-red-500 hover:text-red-700"
          onClick={() => deleteQuestion(qIndex)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <Textarea
        label="Question Text"
        value={q.question_text} // Renamed
        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
        rows={2}
      />
      <div className="space-y-2">
        <label className="text-sm font-medium">Options</label>
        {q.options.map((opt, oIndex) => (
          <div key={oIndex} className="flex items-center space-x-2">
            <input
              type="radio"
              name={`correct-q-${qIndex}`}
              className="mt-1"
              checked={q.correct_answer === oIndex}
              onChange={() => updateQuestion(qIndex, 'correct_answer', oIndex)}
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
              placeholder={`Option ${oIndex + 1}`}
            />
            <Button 
              type="button" 
              variant="ghost" 
              className="!px-2 text-red-500"
              onClick={() => deleteOption(qIndex, oIndex)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => addOption(qIndex)}>
          Add Option
        </Button>
      </div>
      <Input
        label="Points"
        type="number"
        value={q.points || 10}
        onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))}
      />
    </div>
  );
};


// --- Other Pages (Placeholder for now) ---

const Analytics = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Analytics</h1>
    <p className="mt-2 text-gray-600 dark:text-gray-400">
      Detailed analytics for your courses will be available here.
    </p>
  </div>
);

const Students = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
    <p className="mt-2 text-gray-600 dark:text-gray-400">
      Student enrollment and progress tracking will be here.
    </p>
  </div>
);

const SettingsPage = () => {
  const { toggleDarkMode } = useAppContext();
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-lg space-y-6">
         <div className="flex justify-between items-center">
          <label className="text-lg font-medium">Dark Mode</label>
          <button 
            onClick={toggleDarkMode}
            className="w-12 h-6 flex items-center bg-gray-300 dark:bg-blue-600 rounded-full p-1 transition-colors"
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform dark:translate-x-6"></div>
          </button>
        </div>
        {/* Other settings can go here */}
      </div>
    </div>
  );
};


// --- Main App Component ---
function App() {
  const { user, loading, navigation } = useAppContext();

  if (loading) {
    return <FullPageLoader message="Loading application..." />;
  }

  // If no user, show Login/Register page
  if (!user) {
    return <LoginRegister />;
  }
  
  // If user is logged in, show the main app
  const renderView = () => {
    switch (navigation.view) {
      case 'dashboard':
        return <Dashboard />;
      case 'courses':
        return <CoursesList />;
      case 'courseDetail':
        return <CourseDetail />;
      case 'createCourse':
        return <CreateCourse />;
      case 'editCourse':
        return <EditCourse />;
      case 'analytics':
        return <Analytics />;
      case 'students':
        return <Students />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout>
      {renderView()}
    </AppLayout>
  );
}

// --- Root Component ---
export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}


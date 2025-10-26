import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    BarChart3,
    Settings,
    Users,
    Shield,
    Briefcase,
    ClipboardList,
    Bell,
    User,
    LogOut,
    Menu,
    ChevronRight,
    CheckCircle2,
    Circle,
    Clock,
    Award,
    Edit,
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle,
    X
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

// API Configuration
const API_URL = 'http://localhost:5000/api';

/**
 * A more robust fetch wrapper for API calls.
 */
const apiFetch = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        // Try parsing JSON first
        let data;
        try {
            data = await res.json();
        } catch (jsonError) {
             // If JSON parsing fails, it might be a text response or empty
            if (!res.ok) {
                 throw new Error(`HTTP error! status: ${res.status}`);
            }
            return null; // Or handle text response if needed
        }

        if (!res.ok) {
            throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
        return data;
    } catch (err) {
        // Handle network errors or errors thrown above
        console.error("API Fetch Error:", err); // Log the actual error
        throw new Error(err.message || 'A network error occurred.');
    }
};


// API Helper Functions
const api = {
    // Auth
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
    },

    register: async (name, email, password) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role: 'student' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        return data;
    },

    // Courses
    getCourses: async (token) => {
        return apiFetch(`${API_URL}/courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getCourseById: async (token, courseId) => {
        return apiFetch(`${API_URL}/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getInstructorCourses: async (token) => {
        return apiFetch(`${API_URL}/courses/instructor/my-courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    createCourse: async (token, courseData) => {
        return apiFetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });
    },

    // Weeks
    getCourseWeeks: async (token, courseId) => {
        return apiFetch(`${API_URL}/courses/${courseId}/weeks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // Content
    getWeekContent: async (token, weekId) => {
        return apiFetch(`${API_URL}/weeks/${weekId}/content`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    updateContent: async (token, contentId, content) => {
        return apiFetch(`${API_URL}/content/${contentId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            // Send the entire object { content: "new text" }
            body: JSON.stringify({ content: content })
        });
    },


    // Quiz
    getQuizQuestions: async (token, contentId) => {
        return apiFetch(`${API_URL}/content/${contentId}/questions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // Enrollments
    getMyEnrollments: async (token) => {
        return apiFetch(`${API_URL}/enrollments/my-courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    enrollInCourse: async (token, courseId) => {
        return apiFetch(`${API_URL}/enrollments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId })
        });
    },

    getCourseEnrollments: async (token, courseId) => {
        return apiFetch(`${API_URL}/courses/${courseId}/enrollments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // Progress
    getEnrollmentProgress: async (token, enrollmentId) => {
        return apiFetch(`${API_URL}/enrollments/${enrollmentId}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    markComplete: async (token, enrollmentId, contentId, score = null) => { // Made score optional
        return apiFetch(`${API_URL}/progress`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollment_id: enrollmentId, content_id: contentId, score })
        });
    },

    // Assignments
    getCourseAssignments: async (token, courseId) => {
        return apiFetch(`${API_URL}/courses/${courseId}/assignments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getMySubmissions: async (token) => {
        return apiFetch(`${API_URL}/submissions/my-submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// --- LOADING & ERROR COMPONENTS ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
        <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
        <div>
            <p className="font-semibold">An Error Occurred</p>
            <p className="text-sm">{message}</p>
        </div>
    </div>
);

// Reusable Notification Component
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;

    const isError = type === 'error';
    const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
    const borderColor = isError ? 'border-red-200' : 'border-green-200';
    const textColor = isError ? 'text-red-700' : 'text-green-700';
    const Icon = isError ? AlertTriangle : CheckCircle;

    return (
        <div className={`p-4 rounded-lg border ${bgColor} ${borderColor} ${textColor} flex items-center justify-between mb-4`}>
            <div className="flex items-center">
                <Icon size={20} className="mr-3" />
                <span className="text-sm font-medium">{message}</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
            </button>
        </div>
    );
};


// --- LOGIN/SIGNUP COMPONENTS ---

const LoginPage = ({ onLogin, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-auto">
            <div className="w-full max-w-md my-8">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="flex items-center justify-center mb-8">
                        <div className="p-3 bg-blue-600 rounded-xl">
                            <Shield size={32} className="text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 ml-3">AI-LMS</span>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-center text-gray-600 mb-8">Sign in to continue your learning journey</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                        >
                            {loading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Don't have an account?{' '}
                            <button
                                onClick={onSwitchToSignup}
                                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                            >
                                Sign up
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SignupPage = ({ onSignup, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const data = await api.register(name, email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onSignup(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-auto">
            <div className="w-full max-w-md my-8">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="flex items-center justify-center mb-8">
                        <div className="p-3 bg-blue-600 rounded-xl">
                            <Shield size={32} className="text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 ml-3">AI-LMS</span>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Create Account</h2>
                    <p className="text-center text-gray-600 mb-8">Join as a student and start learning</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Min. 6 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Re-enter password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                        >
                            {loading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>}
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- QUIZ COMPONENT ---
const QuizTaker = ({ contentId, token, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadQuestions();
    }, [contentId]);

    const loadQuestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getQuizQuestions(token, contentId);
            setQuestions(data);
        } catch (err) {
            console.error('Error loading quiz:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId, answerIndex) => {
        setSelectedAnswers({ ...selectedAnswers, [questionId]: answerIndex });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const calculateScore = () => {
        let correct = 0;
        let total = 0;
        questions.forEach(q => {
            total += (q.points || 1); // Default to 1 point if not specified
            if (selectedAnswers[q._id] === q.correct_answer) {
                correct += (q.points || 1);
            }
        });
        return { correct, total };
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay message={`Failed to load quiz: ${error}`} />;
    }

    if (questions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Questions Available</h3>
                <p className="text-gray-500 mb-6">There are no questions for this quiz yet.</p>
                <button onClick={onComplete} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Back to Course
                </button>
            </div>
        );
    }

    if (showResults) {
        const { correct, total } = calculateScore();
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${percentage >= 70 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <Award size={40} className={percentage >= 70 ? 'text-green-600' : 'text-yellow-600'} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                        <p className="text-xl text-gray-600">Your Score: {correct}/{total} ({percentage}%)</p>
                    </div>

                    <div className="space-y-4 mb-6">
                        {questions.map((q, idx) => {
                            const isCorrect = selectedAnswers[q._id] === q.correct_answer;
                            const selectedOpt = q.options[selectedAnswers[q._id]];
                            return (
                                <div key={q._id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="font-medium text-gray-800 mb-2">{idx + 1}. {q.question_text}</p>
                                    <p className={`text-sm ${isCorrect ? 'text-gray-600' : 'text-red-700'}`}>
                                        Your answer: {selectedOpt !== undefined ? q.options[selectedOpt] : "No answer"}
                                    </p>
                                    {!isCorrect && <p className="text-sm text-green-700 mt-1">Correct answer: {q.options[q.correct_answer]}</p>}
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={onComplete} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Continue Learning
                    </button>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
                        <span className="text-sm font-medium text-blue-600">{question.points || 1} {question.points === 1 ? 'point' : 'points'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-6">{question.question_text}</h3>

                <div className="space-y-3 mb-8">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswerSelect(question._id, idx)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                selectedAnswers[question._id] === idx
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                                    selectedAnswers[question._id] === idx ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                }`}>
                                    {selectedAnswers[question._id] === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className="text-gray-800">{option}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex justify-between">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {currentQuestion === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswers[question._id] === undefined}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Quiz
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={selectedAnswers[question._id] === undefined}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- COURSE VIEWER COMPONENT ---
const CourseViewer = ({ courseId, userId, token, onBack }) => {
    const [course, setCourse] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [weekContents, setWeekContents] = useState({});
    const [enrollment, setEnrollment] = useState(null);
    const [progress, setProgress] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [completeLoading, setCompleteLoading] = useState(false);
    const [completeError, setCompleteError] = useState('');

    const loadCourseData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [courseData, weeksData, enrollments] = await Promise.all([
                api.getCourseById(token, courseId),
                api.getCourseWeeks(token, courseId),
                api.getMyEnrollments(token)
            ]);

            setCourse(courseData);
            setWeeks(weeksData);

            const myEnrollment = enrollments.find(e => e.course_id._id === courseId || e.course_id === courseId);
            setEnrollment(myEnrollment);

            // --- Continuation from previous turn ---
            if (myEnrollment) {
                const progressData = await api.getEnrollmentProgress(token, myEnrollment._id);
                setProgress(progressData);
            }

            const contents = {};
            for (const week of weeksData) {
                const content = await api.getWeekContent(token, week._id);
                contents[week._id] = content;
            }
            setWeekContents(contents);
            // --- End of continuation ---

        } catch (err) {
            console.error('Error loading course:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourseData();
    }, [courseId, token]); // Added token dependency

    const isContentCompleted = (contentId) => {
        return progress.some(p => p.content_id === contentId && p.completed);
    };

    const handleContentClick = (content) => {
        setCompleteError('');
        if (content.is_quiz) {
            setSelectedContent(content);
            setShowQuiz(true);
        } else {
            setSelectedContent(content);
            setShowQuiz(false);
        }
    };

    const handleQuizComplete = () => {
        setShowQuiz(false);
        setSelectedContent(null);
        loadCourseData(); // Reload to update progress
    };

    const handleMarkComplete = async () => {
        if (!selectedContent || !enrollment || selectedContent.is_quiz) return; // Cannot mark quiz complete here

        setCompleteLoading(true);
        setCompleteError('');
        try {
            // Mark complete API call
            const updatedProgress = await api.markComplete(token, enrollment._id, selectedContent._id);
            // Update local progress state immediately for better UX
            setProgress(prevProgress => {
                 // Check if progress for this content already exists
                const existingIndex = prevProgress.findIndex(p => p.content_id === selectedContent._id);
                if (existingIndex > -1) {
                    // Update existing progress
                    const newProgress = [...prevProgress];
                    newProgress[existingIndex] = { ...newProgress[existingIndex], ...updatedProgress, completed: true };
                    return newProgress;
                } else {
                    // Add new progress entry
                    return [...prevProgress, { ...updatedProgress, content_id: selectedContent._id, completed: true }];
                }
            });
            // Optionally reload all course data if needed, e.g., to update overall percentage
            // loadCourseData();
        } catch (err) {
            console.error("Error marking complete:", err);
            setCompleteError(err.message || 'Failed to mark as complete.');
        } finally {
            setCompleteLoading(false);
        }
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay message={`Failed to load course: ${error}`} />;
    }

    // Handle case where enrollment might not exist yet
     const currentProgressPercentage = enrollment ? enrollment.progress_percentage : 0;

    if (showQuiz && selectedContent) {
        return (
            <div className="max-w-7xl mx-auto">
                <button onClick={() => setShowQuiz(false)} className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Course
                </button>
                <QuizTaker contentId={selectedContent._id} token={token} onComplete={handleQuizComplete} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6">
                <ArrowLeft size={20} className="mr-2" />
                Back to Courses
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                         <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-32 object-cover rounded-lg mb-4 bg-gray-200"
                            // Basic placeholder on error
                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/eeeeee/cccccc?text=Image+Error" }}
                        />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
                        {enrollment && ( // Only show progress if enrolled
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${currentProgressPercentage}%` }}></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{currentProgressPercentage}% Complete</p>
                            </div>
                        )}
                         {!enrollment && ( // Show enroll button if not enrolled
                             <button
                                // onClick={handleEnroll} // Add enroll functionality later
                                // disabled={enrollLoading}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 mb-4 transition-colors disabled:opacity-50"
                            >
                                Enroll Now
                            </button>
                         )}

                        <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto"> {/* Adjusted max height */}
                            {weeks.map(week => {
                                const contents = weekContents[week._id] || [];
                                const completedCount = contents.filter(c => isContentCompleted(c._id)).length;

                                return (
                                    <div key={week._id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 p-3 font-semibold text-gray-800 flex justify-between items-center text-sm"> {/* Smaller text */}
                                            <span>Week {week.week_number}: {week.title}</span>
                                            {enrollment && <span className="text-xs text-gray-500">{completedCount}/{contents.length}</span>}
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {contents.map(content => (
                                                <button
                                                    key={content._id}
                                                    onClick={() => handleContentClick(content)}
                                                    disabled={!enrollment} // Disable if not enrolled
                                                    className={`w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                                                        selectedContent?._id === content._id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                                                    } ${!enrollment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <span className="text-sm text-gray-700">{content.title}</span>
                                                    {enrollment && ( // Only show completion status if enrolled
                                                        isContentCompleted(content._id) ? (
                                                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                                                        ) : (
                                                            <Circle size={16} className="text-gray-300 flex-shrink-0" />
                                                        )
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedContent ? (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">{selectedContent.title}</h1>

                            {/* Ensure content is treated as plain text */}
                            <div className="prose max-w-none text-gray-800">
                                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed break-words">
                                    {selectedContent.content || "No content available for this section."}
                                </pre>
                             </div>

                            {!selectedContent.is_quiz && enrollment && ( // Only show complete button for non-quiz content and if enrolled
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    {isContentCompleted(selectedContent._id) ? (
                                        <div className="flex items-center text-green-600 font-medium p-3 bg-green-50 rounded-lg">
                                            <CheckCircle size={20} className="mr-2" />
                                            Completed
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleMarkComplete}
                                            disabled={completeLoading}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {completeLoading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>}
                                            Mark as Complete
                                        </button>
                                    )}
                                    {completeError && <p className="text-red-600 text-sm mt-2">{completeError}</p>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {enrollment ? "Select a section to start learning" : "Enroll to view course content"}
                            </h3>
                             <p className="text-gray-500">
                                {enrollment ? "Choose a section from the left sidebar to view the content" : "Click the 'Enroll Now' button to get started."}
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- STUDENT COMPONENTS (Largely unchanged, ensure error/loading added) ---
const StudentDashboard = ({ user, token, onNavigate }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, [token]); // Added token dependency

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [enrollmentsData, submissionsData] = await Promise.all([
                api.getMyEnrollments(token),
                api.getMySubmissions(token)
            ]);

            setEnrollments(enrollmentsData);

            if (enrollmentsData.length > 0) {
                const allAssignments = [];
                for (const enrollment of enrollmentsData.slice(0, 3)) { // Limit API calls
                    const courseId = enrollment.course_id?._id || enrollment.course_id;
                    if (courseId) { // Check if courseId exists
                        const courseAssignments = await api.getCourseAssignments(token, courseId);
                        allAssignments.push(...courseAssignments);
                    }
                }
                const pendingAssignments = allAssignments.filter(a =>
                    !submissionsData.some(s => (s.assignment_id?._id || s.assignment_id) === a._id)
                );
                setAssignments(pendingAssignments.slice(0, 3));
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load dashboard: ${error}`} />;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                            <ClipboardList className="mr-2 text-blue-600" size={24} />
                            Upcoming Assignments
                        </h2>
                        <ul className="space-y-3">
                            {assignments.length > 0 ? assignments.map(a => (
                                <li key={a._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-800">{a.title}</p>
                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                            <Clock size={14} className="mr-1" />
                                            Due: {new Date(a.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium py-1 px-3 rounded-full bg-yellow-100 text-yellow-700">
                                        Pending
                                    </span>
                                </li>
                            )) : (
                                <p className="text-gray-500 text-center py-4">No pending assignments. You're all caught up!</p>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                        <BookOpen className="mr-2 text-purple-600" size={24} />
                        My Courses
                    </h2>
                    <div className="space-y-4">
                        {enrollments.length > 0 ? enrollments.slice(0, 3).map(enrollment => {
                            const course = enrollment.course_id;
                            if (!course) return null; // Handle potential missing course data
                            return (
                                <div key={enrollment._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                     <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-24 rounded-lg object-cover mb-3 bg-gray-200"
                                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/eeeeee/cccccc?text=Image+Error" }}
                                    />
                                    <h3 className="font-semibold text-gray-800 mb-2">{course.title}</h3>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{enrollment.progress_percentage}% complete</p>
                                    <button
                                        onClick={() => onNavigate('course-view', course._id || course)}
                                        className="w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Continue Learning
                                    </button>
                                </div>
                            );
                        }) : (
                            <p className="text-gray-500 text-center py-4">No courses enrolled yet</p>
                        )}
                         {enrollments.length > 3 && (
                            <button onClick={() => onNavigate('courses')} className="w-full text-center text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                                View All Courses
                            </button>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const StudentCourses = ({ user, token, onNavigate }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCourses();
    }, [token]); // Add token dependency

    const loadCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getMyEnrollments(token);
            setEnrollments(data);
        } catch (err) {
            console.error('Error loading courses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load courses: ${error}`} />;

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Courses</h1>
            {enrollments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">No Courses Found</h3>
                    <p className="text-gray-500">You are not enrolled in any courses yet.</p>
                    {/* Optional: Add a button to browse courses */}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map(enrollment => {
                        const course = enrollment.course_id;
                        if (!course) return null; // Skip if course data is missing
                        return (
                            <div key={enrollment._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-40 object-cover bg-gray-200"
                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/eeeeee/cccccc?text=Image+Error" }}
                                />
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">{course.description}</p> {/* Limit description lines */}
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                                    </div>
                                    <div className="text-right text-sm font-medium text-blue-600 mb-4">
                                        {enrollment.progress_percentage}% Complete
                                    </div>
                                    <button
                                        onClick={() => onNavigate('course-view', course._id || course)}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-auto" // Push button to bottom
                                    >
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


const StudentAnalytics = () => {
    // Dummy data - replace with actual API calls using useEffect and useState
    const studyHours = [
        { name: 'Mon', hours: 4 }, { name: 'Tue', hours: 5 }, { name: 'Wed', hours: 3 },
        { name: 'Thu', hours: 6 }, { name: 'Fri', hours: 4.5 }, { name: 'Sat', hours: 7 },
        { name: 'Sun', hours: 2 }
    ];
    const gradeDistribution = [
        { name: 'A', value: 4 }, { name: 'B', value: 7 }, { name: 'C', value: 2 },
        { name: 'Pending', value: 3 }
    ];

    // TODO: Add useEffect to fetch real data

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Learning Analytics</h1>
             {/* Add Loading/Error states here based on API calls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Weekly Study Hours</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={studyHours} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="hours" fill="#3b82f6" name="Study Hours" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Grade Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={gradeDistribution}
                                cx="50%" cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8" dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {gradeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};


const StudentAssignments = ({ user, token }) => {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState({}); // Use object for faster lookup
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAssignments();
    }, [token]); // Add token dependency

    const loadAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
            const [enrollments, submissionsData] = await Promise.all([
                api.getMyEnrollments(token),
                api.getMySubmissions(token)
            ]);

             // Create a lookup map for submissions
            const subsMap = submissionsData.reduce((acc, sub) => {
                const assignmentId = sub.assignment_id?._id || sub.assignment_id;
                if (assignmentId) {
                    acc[assignmentId] = sub;
                }
                return acc;
            }, {});
            setSubmissions(subsMap);

            const allAssignments = [];
            for (const enrollment of enrollments) {
                 const courseId = enrollment.course_id?._id || enrollment.course_id;
                 if (courseId) {
                     const courseAssignments = await api.getCourseAssignments(token, courseId);
                     // Add course title to assignment for display
                     allAssignments.push(...courseAssignments.map(a => ({ ...a, courseTitle: enrollment.course_id?.title || 'Course' })));
                 }
            }
            // Sort assignments by due date (soonest first)
            allAssignments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            setAssignments(allAssignments);
        } catch (err) {
            console.error('Error loading assignments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const getSubmissionStatus = (assignmentId) => {
        const submission = submissions[assignmentId];
        if (!submission) return { status: 'Pending', grade: null };
        return { status: submission.status || 'Submitted', grade: submission.grade };
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load assignments: ${error}`} />;

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Assignments</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <ul className="space-y-4">
                    {assignments.length > 0 ? assignments.map(a => {
                        const { status, grade } = getSubmissionStatus(a._id);

                        return (
                            <li key={a._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="mb-2 sm:mb-0 flex-1 mr-4">
                                    <p className="font-medium text-gray-800">{a.title}</p>
                                     <p className="text-xs text-gray-500">{a.courseTitle}</p>
                                    <p className="text-sm text-gray-500 flex items-center mt-1">
                                        <Clock size={14} className="mr-1" />
                                        Due: {new Date(a.due_date).toLocaleDateString()}
                                    </p>
                                    {grade !== null && grade !== undefined && ( // Check for null/undefined
                                        <p className="text-sm text-green-700 font-medium mt-1">Grade: {grade}/{a.total_points}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <span className={`text-xs font-semibold py-1 px-3 rounded-full ${
                                        status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                        status === 'Graded' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800' // Default fallback
                                    }`}>
                                        {status}
                                    </span>
                                    {status === 'Pending' && (
                                        <button className="text-sm bg-blue-600 text-white py-1 px-4 rounded-lg font-medium hover:bg-blue-700">
                                            Start
                                        </button>
                                    )}
                                     {status === 'Submitted' && (
                                        <button className="text-sm bg-gray-500 text-white py-1 px-4 rounded-lg font-medium hover:bg-gray-600">
                                            View
                                        </button>
                                    )}
                                     {status === 'Graded' && (
                                        <button className="text-sm bg-green-600 text-white py-1 px-4 rounded-lg font-medium hover:bg-green-700">
                                            Details
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    }) : (
                        <p className="text-gray-500 text-center py-4">No assignments available</p>
                    )}
                </ul>
            </div>
        </div>
    );
};


const ProfileSettings = ({ user, token }) => {
    const [name, setName] = useState(user.name);
    const [email] = useState(user.email); // Email usually not editable
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null); // Use notification state

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (name === user.name) {
             showNotification('error', 'No changes detected.');
             return;
        }
        setLoading(true);
        setNotification(null); // Clear previous notification

        try {
            // Placeholder: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // await api.updateProfile(token, { name }); // Example API call

            // Update user in localStorage IF successful (important!)
            const updatedUser = { ...user, name: name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // NOTE: You might need a way to update the user object globally (e.g., via Context)
            // for the changes to reflect immediately in the Header/Sidebar without a page reload.

            showNotification('success', 'Profile saved successfully!');
            console.log("Saving profile with name:", name);
        } catch (err) {
            console.error("Profile save error:", err);
            showNotification('error', err.message || 'Failed to save profile.');
            setName(user.name); // Revert name on error
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                <Notification
                    message={notification?.message}
                    type={notification?.type}
                    onClose={() => setNotification(null)}
                />
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                     <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                         {/* Ensure initials work even with single names */}
                         {name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                     </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{name}</h2>
                        <p className="text-gray-600">{email}</p>
                         <p className="text-sm text-gray-500 capitalize mt-1">Role: {user.role}</p>
                    </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Cannot be changed)</label>
                        <input
                            type="email"
                            value={email}
                            className="w-full p-3 text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg cursor-not-allowed"
                            readOnly
                        />
                    </div>
                    {/* Optional: Add password change fields here */}
                    <div className="pt-4 flex items-center space-x-4">
                        <button
                            type="submit"
                            disabled={loading || name === user.name} // Disable if no changes or loading
                            className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- INSTRUCTOR COMPONENTS (Largely unchanged, ensure error/loading added) ---

const InstructorDashboard = ({ user, token, onNavigate }) => {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, [token]); // Add token dependency

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const coursesData = await api.getInstructorCourses(token);
            setCourses(coursesData);

            let allEnrollments = [];
            // Use Promise.all for potentially faster loading if many courses
            const enrollmentPromises = coursesData.map(course =>
                api.getCourseEnrollments(token, course._id)
                    .catch(err => {
                        console.warn(`Failed to load enrollments for course ${course._id}:`, err);
                        return []; // Return empty array on error for specific course
                    })
            );
            const enrollmentsArrays = await Promise.all(enrollmentPromises);
            allEnrollments = enrollmentsArrays.flat(); // Flatten the array of arrays

            setEnrollments(allEnrollments);
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError(err.message || 'Failed to load dashboard data.'); // Provide default message
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load dashboard: ${error}`} />;

    // Calculate unique students based on user_id object
    const uniqueStudentIds = new Set(enrollments.map(e => e.user_id?._id || e.user_id).filter(id => id));
    const totalStudents = uniqueStudentIds.size;

    // Calculate unique active students
     const activeStudentIds = new Set(
         enrollments
             .filter(e => e.progress_percentage > 0 && (e.user_id?._id || e.user_id))
             .map(e => e.user_id._id || e.user_id)
     );
    const activeStudents = activeStudentIds.size;


    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Courses Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Briefcase size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">My Courses</p>
                            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                        </div>
                    </div>
                </div>
                 {/* Total Students Card */}
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-green-100 text-green-600"><Users size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                        </div>
                    </div>
                </div>
                 {/* Active Students Card */}
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600"><BarChart3 size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Students</p>
                            <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
                        </div>
                    </div>
                </div>
                 {/* Assignments Card (Placeholder) */}
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><ClipboardList size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Assignments</p>
                            <p className="text-2xl font-bold text-gray-900">0</p> {/* TODO: Fetch assignment count */}
                        </div>
                    </div>
                </div>
            </div>

            {/* My Courses List */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">My Courses</h2>
                {courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">You haven't created any courses yet.</p>
                ) : (
                    <div className="space-y-4">
                        {courses.map(course => {
                            const courseEnrollments = enrollments.filter(e => (e.course_id?._id || e.course_id) === course._id);
                            const avgProgress = courseEnrollments.length > 0
                                ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / courseEnrollments.length)
                                : 0;

                            return (
                                <div key={course._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-4 mb-3 sm:mb-0 flex-grow mr-4">
                                         <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100/eeeeee/cccccc?text=Err" }}
                                        />
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{course.title}</h3>
                                            <p className="text-sm text-gray-500">{courseEnrollments.length} Students • {avgProgress}% Avg Progress</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <button
                                            onClick={() => onNavigate('course-editor', course._id)}
                                            className="text-sm bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onNavigate('course-stats', course._id)}
                                            className="text-sm bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                                        >
                                            Stats
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 )}
            </div>
        </div>
    );
};


const CourseStatistics = ({ courseId, token, onBack }) => {
    const [course, setCourse] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStatistics();
    }, [courseId, token]); // Add token dependency

    const loadStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [courseData, enrollmentsData, weeksData] = await Promise.all([
                api.getCourseById(token, courseId),
                api.getCourseEnrollments(token, courseId),
                api.getCourseWeeks(token, courseId)
            ]);

            setCourse(courseData);
            setEnrollments(enrollmentsData);
            setWeeks(weeksData);
        } catch (err) {
            console.error('Error loading statistics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load statistics: ${error}`} />;
    if (!course) return <ErrorDisplay message="Course data not found." />; // Added check for course

    const avgProgress = enrollments.length > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
        : 0;

    const completionRate = enrollments.length > 0
        ? Math.round((enrollments.filter(e => e.progress_percentage === 100).length / enrollments.length) * 100)
        : 0;

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6">
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">{course.title} - Statistics</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Enrollment Overview</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Enrolled:</span>
                            <span className="font-semibold text-gray-900">{enrollments.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Average Progress:</span>
                            <span className="font-semibold text-gray-900">{avgProgress}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Completion Rate:</span>
                            <span className="font-semibold text-gray-900">{completionRate}%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Course Structure</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Weeks:</span>
                            <span className="font-semibold text-gray-900">{weeks.length}</span>
                        </div>
                         {/* TODO: Add total content items count */}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Student Progress</h2>
                {enrollments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No students enrolled yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-3">Student Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Progress</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {enrollments.map(enrollment => {
                                    const student = enrollment.user_id;
                                    // Handle cases where user might be deleted/missing
                                    if (!student) return (
                                         <tr key={enrollment._id} className="hover:bg-gray-50 text-gray-400 italic">
                                            <td className="p-3" colSpan="4">Enrolled user data missing</td>
                                         </tr>
                                    );

                                    return (
                                        <tr key={enrollment._id} className="hover:bg-gray-50 text-sm text-gray-700">
                                            <td className="p-3 font-medium text-gray-800">{student.name}</td>
                                            <td className="p-3">{student.email}</td>
                                            <td className="p-3">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                                                    </div>
                                                    <span className="font-medium">{enrollment.progress_percentage}%</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                    enrollment.progress_percentage === 100 ? 'bg-green-100 text-green-800' :
                                                    enrollment.progress_percentage > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {enrollment.progress_percentage === 100 ? 'Completed' :
                                                     enrollment.progress_percentage > 0 ? 'In Progress' : 'Not Started'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


const InstructorCourseManagement = ({ user, token, onNavigate }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCourses();
    }, [token]); // Add token dependency

    const loadCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getInstructorCourses(token);
            setCourses(data);
        } catch (err) {
            console.error('Error loading courses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // TODO: Add delete course functionality
    const handleDeleteCourse = async (courseId) => {
        // Confirmation dialog needed here before calling API
        console.warn("Delete functionality not implemented yet for course:", courseId);
         // try {
         //     await api.deleteCourse(token, courseId);
         //     loadCourses(); // Refresh list
         // } catch (err) { console.error("Delete error:", err); }
    };


    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load courses: ${error}`} />;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
                <button
                    // onClick={() => onNavigate('create-course')} // Navigate to create form
                    className="bg-green-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center flex-shrink-0"
                >
                     <CheckCircle size={18} className="mr-2"/> Create New Course
                </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                 {courses.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">You haven't created any courses yet.</p>
                 ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-3">Course Title</th>
                                    <th className="p-3">Students</th> {/* TODO: Fetch student count */}
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {courses.map(course => (
                                    <tr key={course._id} className="hover:bg-gray-50 text-sm text-gray-700">
                                        <td className="p-3 font-medium text-gray-800">{course.title}</td>
                                        <td className="p-3">0</td> {/* Placeholder */}
                                        <td className="p-3">
                                            <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-semibold">Published</span> {/* Placeholder */}
                                        </td>
                                        <td className="p-3 space-x-3 whitespace-nowrap">
                                            <button
                                                onClick={() => onNavigate('course-editor', course._id)}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                             <button
                                                onClick={() => onNavigate('course-stats', course._id)}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                Stats
                                            </button>
                                            <button
                                                 onClick={() => handleDeleteCourse(course._id)}
                                                className="text-red-600 hover:text-red-800 font-medium"
                                             >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
        </div>
    );
};


const CourseEditor = ({ courseId, token, onBack }) => {
    const [course, setCourse] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [weekContents, setWeekContents] = useState({});
    const [selectedContent, setSelectedContent] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editedContentText, setEditedContentText] = useState(''); // State specifically for the textarea
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false); // Loading state for save button

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadCourseData = async () => {
        // Reset state before loading
        setLoading(true);
        setError(null);
        setSelectedContent(null);
        setEditMode(false);
        try {
            const [courseData, weeksData] = await Promise.all([
                api.getCourseById(token, courseId),
                api.getCourseWeeks(token, courseId)
            ]);

            setCourse(courseData);
            // Sort weeks by order before setting state
            weeksData.sort((a, b) => a.order - b.order);
            setWeeks(weeksData);

            const contents = {};
            const contentPromises = weeksData.map(week =>
                api.getWeekContent(token, week._id).then(contentData => {
                    // Sort content by order
                    contentData.sort((a, b) => a.order - b.order);
                    contents[week._id] = contentData;
                }).catch(err => {
                    console.warn(`Failed loading content for week ${week._id}:`, err);
                    contents[week._id] = []; // Ensure key exists even on error
                })
            );
            await Promise.all(contentPromises);
            setWeekContents(contents);
        } catch (err) {
            console.error('Error loading course editor:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId && token) {
            loadCourseData();
        }
    }, [courseId, token]); // Rerun if courseId or token changes

    const handleSelectContent = (content) => {
        setSelectedContent(content);
        setEditedContentText(content.content || ''); // Set text for potential editing
        setEditMode(false); // Always start in view mode
    };

    const handleEditClick = () => {
        if (selectedContent && !selectedContent.is_quiz) {
            setEditMode(true);
        } else if (selectedContent?.is_quiz) {
             showNotification('error', 'Quiz content cannot be edited directly here.');
        }
    };

     const handleCancelEdit = () => {
        setEditedContentText(selectedContent?.content || ''); // Reset textarea
        setEditMode(false);
     };

    const handleSaveContent = async () => {
        if (!selectedContent) return;
        setSaveLoading(true);
        setNotification(null);
        try {
            await api.updateContent(token, selectedContent._id, editedContentText); // Pass the text state
            setEditMode(false);
            showNotification('success', 'Content saved successfully!');
            // Update the content locally for immediate feedback before full reload
            setSelectedContent(prev => ({...prev, content: editedContentText}));
            // Optionally, reload all data if structure might change (less efficient)
            // loadCourseData();
        } catch (err) {
            console.error('Error saving content:', err);
            showNotification('error', err.message || 'Failed to save content.');
        } finally {
             setSaveLoading(false);
        }
    };

    // TODO: Add functions for adding/deleting/reordering weeks and content items

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={`Failed to load course editor: ${error}`} />;
    if (!course) return <ErrorDisplay message="Course data not found." />;

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6">
                <ArrowLeft size={20} className="mr-2" />
                Back to Course Management
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit: {course.title}</h1>

            <Notification
                message={notification?.message}
                type={notification?.type}
                onClose={() => setNotification(null)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course Structure Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Course Structure</h2>
                             {/* Add Week Button */}
                             <button className="text-sm bg-green-500 text-white p-1 rounded hover:bg-green-600">+</button>
                        </div>
                        <div className="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto pr-2"> {/* Added padding-right */}
                            {weeks.map(week => {
                                const contents = weekContents[week._id] || [];
                                return (
                                    <div key={week._id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <div className="bg-gray-100 p-2 flex justify-between items-center border-b">
                                            <span className="font-semibold text-gray-700 text-sm truncate pr-2">
                                                W{week.week_number}: {week.title}
                                            </span>
                                             {/* Week Action Buttons */}
                                             <div className="flex space-x-1">
                                                 <button className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded hover:bg-blue-600">+</button> {/* Add Content */}
                                                 <button className="text-xs text-red-500 hover:text-red-700">✕</button> {/* Delete Week */}
                                             </div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {contents.map(content => (
                                                <button
                                                    key={content._id}
                                                    onClick={() => handleSelectContent(content)}
                                                    className={`w-full text-left p-2 hover:bg-blue-50 transition-colors flex items-center justify-between text-sm ${
                                                        selectedContent?._id === content._id ? 'bg-blue-100 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                                                    }`}
                                                >
                                                    <span className="text-gray-700 truncate pr-2">{content.title}</span>
                                                    <div className="flex items-center flex-shrink-0 space-x-1">
                                                        {content.is_quiz && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Q</span>}
                                                         <button className="text-xs text-red-500 hover:text-red-700 opacity-50 hover:opacity-100">✕</button> {/* Delete Content */}
                                                    </div>
                                                </button>
                                            ))}
                                             {contents.length === 0 && <p className="p-2 text-xs text-gray-400 italic">No content yet</p>}
                                        </div>
                                    </div>
                                );
                            })}
                             {weeks.length === 0 && <p className="text-gray-400 text-center py-4 italic">No weeks added yet.</p>}
                        </div>
                    </div>
                </div>

                {/* Content Editor Area */}
                <div className="lg:col-span-2">
                    {selectedContent ? (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedContent.title}</h2>
                                <div className="flex space-x-2 flex-shrink-0">
                                    {!selectedContent.is_quiz && !editMode && (
                                        <button
                                            onClick={handleEditClick}
                                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                                        >
                                            <Edit size={16} className="mr-1.5" /> Edit
                                        </button>
                                    )}
                                    {editMode && (
                                         <>
                                            <button
                                                onClick={handleSaveContent}
                                                disabled={saveLoading}
                                                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                                            >
                                                 {saveLoading
                                                     ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                                                     : <Save size={16} className="mr-1.5" />
                                                 }
                                                Save
                                            </button>
                                             <button
                                                onClick={handleCancelEdit}
                                                disabled={saveLoading}
                                                className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium disabled:opacity-50"
                                            >
                                                <X size={16} className="mr-1.5" /> Cancel
                                            </button>
                                         </>
                                    )}
                                </div>
                            </div>

                            {selectedContent.is_quiz ? (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                    <p className="text-purple-800 font-medium mb-4">This is a quiz section.</p>
                                    <p className="text-sm text-purple-700">Quiz questions cannot be edited directly here. You might need a separate quiz editor interface.</p>
                                    {/* TODO: Add button to navigate to quiz editor */}
                                </div>
                            ) : editMode ? (
                                <textarea
                                    value={editedContentText}
                                    onChange={(e) => setEditedContentText(e.target.value)}
                                    className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y" // Allow vertical resize
                                    placeholder="Enter course content here..."
                                />
                            ) : (
                                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 min-h-[200px]">
                                     {/* Use a div instead of pre for better prose styling, handle empty state */}
                                    {selectedContent.content ? selectedContent.content : <p className="italic text-gray-500">No content added yet.</p>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-dashed border-gray-300 h-full flex flex-col justify-center items-center">
                            <Edit size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Content Item</h3>
                            <p className="text-gray-500">Choose an item from the course structure sidebar to view or edit its content.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- LAYOUT COMPONENTS ---
const Sidebar = ({ user, currentPage, onPageChange, onLogout, isSidebarOpen, setIsSidebarOpen }) => {
    const navLinks = user.role === 'student'
        ? [
            { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
            { name: 'My Courses', icon: BookOpen, page: 'courses' },
            { name: 'Assignments', icon: ClipboardList, page: 'assignments' },
            { name: 'Analytics', icon: BarChart3, page: 'analytics' },
            { name: 'Profile', icon: Settings, page: 'profile' }
        ]
        : [
            { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
            { name: 'Manage Courses', icon: Briefcase, page: 'manage-courses' }
            // Add other instructor links here (e.g., Students, Settings)
        ];

    return (
        <div className={`fixed inset-y-0 left-0 bg-white w-64 p-4 flex flex-col z-30 shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-gray-200`}>
             {/* Logo */}
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 px-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                    <Shield size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">AI-LMS</span>
            </div>

            {/* Navigation */}
            <nav className="flex-grow mt-6 space-y-1.5 px-2">
                {navLinks.map(link => (
                    <button
                        key={link.name}
                        onClick={() => {
                            onPageChange(link.page);
                            setIsSidebarOpen(false); // Close sidebar on mobile after navigation
                        }}
                        className={`flex items-center w-full space-x-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors duration-150 ${
                            currentPage === link.page
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        aria-current={currentPage === link.page ? 'page' : undefined}
                    >
                        <link.icon size={18} className="flex-shrink-0"/>
                        <span className="truncate">{link.name}</span>
                    </button>
                ))}
            </nav>

             {/* Logout Button */}
            <div className="mt-auto pt-4 border-t border-gray-200 px-2">
                <button
                    onClick={onLogout}
                    className="flex items-center w-full space-x-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                >
                    <LogOut size={18} className="flex-shrink-0"/>
                    <span className="truncate">Logout</span>
                </button>
            </div>
        </div>
    );
};


const Header = ({ user, onToggleSidebar }) => {
    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onToggleSidebar}
                        className="text-gray-500 hover:text-gray-900 lg:hidden p-2 -ml-2" // Added padding and negative margin for better tap target
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={24} />
                    </button>

                     {/* Spacer elements to push user info to the right */}
                    <div className="lg:hidden flex-1"></div> {/* Takes up space on mobile */}
                    <div className="hidden lg:block flex-1"></div> {/* Takes up space on desktop */}

                    {/* Right side icons and user info */}
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 relative" aria-label="Notifications">
                            <Bell size={20} />
                            {/* Optional: Notification badge */}
                            {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span> */}
                        </button>

                        {/* User Avatar and Name */}
                        <div className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-gray-100"> {/* Added hover */}
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ring-blue-200">
                                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};


// --- MAIN ROUTING LOGIC ---
const MainContent = ({ user, token, currentPage, pageData, onNavigate }) => {
    // Student Routes
    if (user.role === 'student') {
        switch (currentPage) {
            case 'dashboard': return <StudentDashboard user={user} token={token} onNavigate={onNavigate} />;
            case 'courses': return <StudentCourses user={user} token={token} onNavigate={onNavigate} />;
            case 'course-view': return <CourseViewer courseId={pageData} userId={user.id} token={token} onBack={() => onNavigate('courses')} />;
            case 'analytics': return <StudentAnalytics />;
            case 'assignments': return <StudentAssignments user={user} token={token} />;
            case 'profile': return <ProfileSettings user={user} token={token} />;
            default: return <StudentDashboard user={user} token={token} onNavigate={onNavigate} />; // Fallback to dashboard
        }
    }

    // Instructor Routes
    if (user.role === 'instructor') {
        switch (currentPage) {
            case 'dashboard': return <InstructorDashboard user={user} token={token} onNavigate={onNavigate} />;
            case 'manage-courses': return <InstructorCourseManagement user={user} token={token} onNavigate={onNavigate} />;
            case 'course-stats': return <CourseStatistics courseId={pageData} token={token} onBack={() => onNavigate('manage-courses')} />; // Back to management
            case 'course-editor': return <CourseEditor courseId={pageData} token={token} onBack={() => onNavigate('manage-courses')} />;
            // Add 'create-course' route/component here later
            default: return <InstructorDashboard user={user} token={token} onNavigate={onNavigate} />; // Fallback to dashboard
        }
    }

    // Fallback for unknown roles (shouldn't happen with proper login/signup)
    return <ErrorDisplay message={`Invalid user role: ${user.role}`} />;
};

// --- APP LAYOUT WRAPPER ---
const AppLayout = ({ user, token, onLogout }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [pageData, setPageData] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleNavigate = (page, data = null) => {
        setCurrentPage(page);
        setPageData(data);
        setIsSidebarOpen(false); // Close sidebar on navigation
        window.scrollTo(0, 0); // Scroll to top on page change
    };

    return (
        <div className="min-h-screen bg-gray-100"> {/* Slightly darker background */}
            <Sidebar
                user={user}
                currentPage={currentPage}
                onPageChange={handleNavigate} // Pass handleNavigate directly
                onLogout={onLogout}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden" // Darker overlay
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* Main Content Area */}
            <div className="lg:ml-64 flex flex-col min-h-screen"> {/* Ensure min height */}
                <Header
                    user={user}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8"> {/* Adjusted padding */}
                    <MainContent
                        user={user}
                        token={token}
                        currentPage={currentPage}
                        pageData={pageData}
                        onNavigate={handleNavigate}
                    />
                </main>
                 {/* Optional Footer */}
                 {/* <footer className="p-4 text-center text-xs text-gray-500 lg:ml-64">
                     © {new Date().getFullYear()} AI-LMS
                 </footer> */}
            </div>
        </div>
    );
};


// --- ROOT APP COMPONENT ---
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [showSignup, setShowSignup] = useState(false);
    const [loading, setLoading] = useState(true); // Initial loading state

    // Effect to check local storage on initial mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                 // Basic validation: Check if user object has expected properties
                if (parsedUser && parsedUser.id && parsedUser.role) {
                    setToken(savedToken);
                    setCurrentUser(parsedUser);
                } else {
                     throw new Error("Invalid user data structure");
                }
            } catch (err) {
                console.error("Failed to parse or validate stored user data:", err);
                // Clear potentially corrupted data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false); // Finished checking storage
    }, []);

    const handleLogin = (user, authToken) => {
        setCurrentUser(user);
        setToken(authToken);
        // localStorage is already set in LoginPage/SignupPage
    };

    const handleSignup = (user, authToken) => {
        setCurrentUser(user);
        setToken(authToken);
        // localStorage is already set in LoginPage/SignupPage
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setToken(null);
        setShowSignup(false); // Reset to login page on logout
    };

    // Show loading spinner while checking auth status
    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
                <LoadingSpinner />
            </div>
        );
    }

    // If not authenticated, show Login or Signup page
    if (!currentUser) {
        return showSignup ? (
            <SignupPage
                onSignup={handleSignup}
                onSwitchToLogin={() => setShowSignup(false)}
            />
        ) : (
            <LoginPage
                onLogin={handleLogin}
                onSwitchToSignup={() => setShowSignup(true)}
            />
        );
    }

    // If authenticated, show the main application layout
    return <AppLayout user={currentUser} token={token} onLogout={handleLogout} />;
}


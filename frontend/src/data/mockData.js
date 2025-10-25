export const DUMMY_DATA = {
    users: [
        { id: 'u1', name: 'Bharath Kumar', role: 'student', email: 'bharath@email.com' },
        { id: 'u2', name: 'Dr. Evelyn Reed', role: 'instructor', email: 'e.reed@email.com' },
        { id: 'u3', name: 'Admin Staff', role: 'admin', email: 'admin@lms.com' }
    ],
    courses: [
        { 
            id: 'c1', 
            title: 'Web Development Bootcamp', 
            instructorId: 'u2',
            enrolledStudentIds: ['u1'],
            thumbnail: 'https://placehold.co/600x400/3498db/ffffff?text=Web+Dev',
            progress: 65,
            description: 'Master HTML, CSS, JavaScript, React, and Node.js from scratch.'
        },
        { 
            id: 'c2', 
            title: 'Data Science Fundamentals', 
            instructorId: 'u2',
            enrolledStudentIds: ['u1'],
            thumbnail: 'https://placehold.co/600x400/2ecc71/ffffff?text=Data+Science',
            progress: 91,
            description: 'Learn Python, Pandas, NumPy, and Matplotlib for data analysis.'
        },
        { 
            id: 'c3', 
            title: 'Machine Learning Basics', 
            instructorId: 'u2',
            enrolledStudentIds: ['u1'],
            thumbnail: 'https://placehold.co/600x400/e74c3c/ffffff?text=ML+Basics',
            progress: 34,
            description: 'Explore fundamental algorithms like regression, classification, and clustering.'
        },
        {
            id: 'c4',
            title: 'Advanced JavaScript',
            instructorId: 'u2',
            enrolledStudentIds: ['u1'],
            thumbnail: 'https://placehold.co/600x400/f39c12/ffffff?text=Advanced+JS',
            progress: 0,
            description: 'Dive deep into closures, prototypes, async/await, and functional programming.'
        }
    ],
    assignments: [
        { id: 'a1', courseId: 'c1', title: 'React Components Quiz', dueDate: '2025-11-10', status: 'Pending' },
        { id: 'a2', courseId: 'c3', title: 'Machine Learning Algorithm Implementation', dueDate: '2025-11-12', status: 'Pending' },
        { id: 'a3', courseId: 'c1', title: 'CSS Grid Layout Project', dueDate: '2025-11-05', status: 'Submitted' },
        { id: 'a4', courseId: 'c2', title: 'Data Cleaning with Pandas', dueDate: '2025-11-08', status: 'Graded (A-)' },
    ],
    recentActivity: [
        { id: 'r1', type: 'complete', text: 'Completed "Fundamentals of HTML" module', courseId: 'c1', time: '2h ago' },
        { id: 'r2', type: 'start', text: 'Started "Algorithmic Python" module', courseId: 'c3', time: '1d ago' },
        { id: 'r3', type: 'submit', text: 'Submitted "CSS Grid Layout Project"', courseId: 'c1', time: '3d ago' },
    ],
    analytics: {
        studyHours: [
            { name: 'Mon', hours: 4 },
            { name: 'Tue', hours: 5 },
            { name: 'Wed', hours: 3 },
            { name: 'Thu', hours: 6 },
            { name: 'Fri', hours: 4.5 },
            { name: 'Sat', hours: 7 },
            { name: 'Sun', hours: 2 },
        ],
        gradeDistribution: [
            { name: 'A', value: 4 },
            { name: 'B', value: 7 },
            { name: 'C', value: 2 },
            { name: 'Pending', value: 3 },
        ],
        courseProgress: [
            { name: 'Web Dev', progress: 65 },
            { name: 'Data Science', progress: 91 },
            { name: 'ML Basics', progress: 34 },
            { name: 'Advanced JS', progress: 0 },
        ],
        adminStats: {
            totalUsers: 1450,
            totalCourses: 78,
            activeStudents: 980,
            instructors: 45,
        }
    }
};

// --- CHART COLORS ---
export const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const MainContent = ({ user, currentPage }) => {
    // Student Pages
    if (user.role === 'student') {
        switch (currentPage) {
            case 'dashboard':
                return <StudentDashboard user={user} />;
            case 'courses':
                return <StudentCourses user={user} />;
            case 'analytics':
                return <StudentAnalytics />;
            case 'assignments':
                return <StudentAssignments />;
            case 'profile':
                return <ProfileSettings user={user} />;
            default:
                return <StudentDashboard user={user} />;
        }
    }
    
    // Instructor Pages
    if (user.role === 'instructor') {
        switch (currentPage) {
            case 'dashboard':
                return <InstructorDashboard user={user} />;
            case 'manage-courses':
                return <InstructorCourseManagement user={user} />;
            default:
                return <InstructorDashboard user={user} />;
        }
    }
    
    // Admin Pages
    if (user.role === 'admin') {
        switch (currentPage) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'user-management':
                return <AdminUserManagement />;
            default:
                return <AdminDashboard />;
        }
    }
    
    return <h1 className="text-red-500">Error: No component for this role.</h1>;
};

export default MainContent;
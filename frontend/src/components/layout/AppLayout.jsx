import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

//--- Student Page Imports ---
import StudentDashboard from '../../pages/student/StudentDashboard';
import StudentCourses from '../../pages/student/studentCourses';
import StudentAnalytics from '../../pages/student/StudentAnalytics';
import StudentAssignments from '../../pages/student/StudentAssignments';
import ProfileSettings from '../../pages/student/ProfileSettings';

//--- Instructor Page Imports ---
import InstructorDashboard from '../../pages/instructor/InstructorDashboard';
import InstructorCourseManagement from '../../pages/instructor/InstructorCourseManagement';

// --- Admin Page Imports ---
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminUserManagement from '../../pages/admin/AdminUserManagement';


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

const AppLayout = ({ user, onLogout }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar 
                user={user} 
                currentPage={currentPage}
                onPageChange={(page) => {
                    setCurrentPage(page);
                    setIsSidebarOpen(false); // Close sidebar on mobile nav click
                }}
                onLogout={onLogout}
                isSidebarOpen={isSidebarOpen}
            />
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-10 bg-black/30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            <div className="lg:ml-64 flex flex-col flex-1">
                <Header 
                    user={user} 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <main className="flex-1 p-6 lg:p-10">
                    <MainContent user={user} currentPage={currentPage} />
                </main>
            </div>
        </div>
    );
};

export default {AppLayout, MainContent};
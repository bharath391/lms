import React from 'react';
import { LayoutDashboard, BookOpen, BarChart3, Settings, Users, Shield, Briefcase, ClipboardList, LogOut } from 'lucide-react';
const Sidebar = ({ user, currentPage, onPageChange, onLogout, isSidebarOpen }) => {
    const getNavLinks = (role) => {
        switch (role) {
            case 'student':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
                    { name: 'My Courses', icon: BookOpen, page: 'courses' },
                    { name: 'Assignments', icon: ClipboardList, page: 'assignments' },
                    { name: 'Analytics', icon: BarChart3, page: 'analytics' },
                    { name: 'Profile', icon: Settings, page: 'profile' },
                ];
            case 'instructor':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
                    { name: 'Manage Courses', icon: Briefcase, page: 'manage-courses' },
                    // { name: 'Student Analytics', icon: BarChart3, page: 'analytics' },
                ];
            case 'admin':
                return [
                    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
                    { name: 'User Management', icon: Users, page: 'user-management' },
                    // { name: 'Course Management', icon: BookOpen, page: 'course-management' },
                    // { name: 'System Config', icon: Settings, page: 'config' },
                ];
            default:
                return [];
        }
    };

    const navLinks = getNavLinks(user.role);

    return (
        <div className={`fixed inset-y-0 left-0 bg-white w-64 p-6 flex flex-col z-20 shadow-lg transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            {/* Logo */}
            <div className="flex items-center space-x-2 pb-6 border-b border-gray-200">
                <div className="p-2 bg-blue-600 rounded-lg">
                    <Shield size={24} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">AI-LMS</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex-grow mt-8 space-y-2">
                {navLinks.map(link => (
                    <button
                        key={link.name}
                        onClick={() => onPageChange(link.page)}
                        className={`flex items-center w-full space-x-3 p-3 rounded-lg text-left font-medium transition-colors ${
                            currentPage === link.page 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        <link.icon size={20} />
                        <span>{link.name}</span>
                    </button>
                ))}
            </nav>
            
            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
                <button
                    onClick={onLogout}
                    className="flex items-center w-full space-x-3 p-3 rounded-lg text-left font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
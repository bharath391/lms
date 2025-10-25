import React from 'react';
import { DUMMY_DATA } from '../data/mockData';
import { Shield, User, Briefcase } from 'lucide-react';
const LoginScreen = ({ onLogin }) => {
    const student = DUMMY_DATA.users.find(u => u.role === 'student');
    const instructor = DUMMY_DATA.users.find(u => u.role === 'instructor');
    const admin = DUMMY_DATA.users.find(u => u.role === 'admin');
    
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center justify-center space-x-3">
                    <div className="p-3 bg-blue-600 rounded-xl">
                        <Shield size={28} className="text-white" />
                    </div>
                    <span className="text-3xl font-bold text-gray-900">AI-LMS Portal</span>
                </div>
                <h2 className="text-center text-xl text-gray-600">Select a role to continue</h2>
                <div className="space-y-4">
                    <button
                        onClick={() => onLogin(student)}
                        className="w-full flex items-center space-x-3 p-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <User size={24} />
                        <span>Login as Student ({student.name})</span>
                    </button>
                    <button
                        onClick={() => onLogin(instructor)}
                        className="w-full flex items-center space-x-3 p-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <Briefcase size={24} />
                        <span>Login as Instructor ({instructor.name})</span>
                    </button>
                    <button
                        onClick={() => onLogin(admin)}
                        className="w-full flex items-center space-x-3 p-4 bg-gray-700 text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <Shield size={24} />
                        <span>Login as Admin ({admin.name})</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
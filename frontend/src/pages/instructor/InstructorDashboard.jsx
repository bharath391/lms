import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
import StatCard from '../../components/common/StatCard';
import { Briefcase, Users, ClipboardList } from 'lucide-react';
const InstructorDashboard = ({ user }) => {
    // TODO: Fetch this data
    const { totalUsers, activeStudents } = DUMMY_DATA.analytics.adminStats; // Re-using admin stats for demo
    const courses = DUMMY_DATA.courses.filter(c => c.instructorId === user.id);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="My Courses" value={courses.length} icon={Briefcase} colorClass="bg-blue-100 text-blue-600" />
                <StatCard title="Total Students" value={totalUsers} icon={Users} colorClass="bg-green-100 text-green-600" />
                <StatCard title="Active Students" value={activeStudents} icon={Users} colorClass="bg-yellow-100 text-yellow-600" />
                <StatCard title="New Submissions" value="14" icon={ClipboardList} colorClass="bg-indigo-100 text-indigo-600" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4">My Courses</h2>
                <div className="space-y-4">
                    {courses.map(course => (
                        <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <img src={course.thumbnail} alt={course.title} className="w-16 h-16 rounded-lg object-cover" />
                                <div>
                                    <h3 className="font-semibold text-gray-800">{course.title}</h3>
                                    <p className="text-sm text-gray-500">{course.enrolledStudentIds.length} Students</p>
                                </div>
                            </div>
                            <div>
                                <button className="text-sm bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700">Manage</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
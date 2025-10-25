import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
import StatCard from '../../components/common/StatCard';
import { Users, Briefcase } from 'lucide-react';
const AdminDashboard = () => {
    // TODO: Fetch this data
    const { totalUsers, totalCourses, activeStudents, instructors } = DUMMY_DATA.analytics.adminStats;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={totalUsers} icon={Users} colorClass="bg-blue-100 text-blue-600" />
                <StatCard title="Total Courses" value={totalCourses} icon={Briefcase} colorClass="bg-green-100 text-green-600" />
                <StatCard title="Active Students" value={activeStudents} icon={Users} colorClass="bg-yellow-100 text-yellow-600" />
                <StatCard title="Instructors" value={instructors} icon={Users} colorClass="bg-indigo-100 text-indigo-600" />
            </div>
            {/* TODO: Add more charts here, e.g., new user signups, course creation trends */}
        </div>
    );
};

export default AdminDashboard;
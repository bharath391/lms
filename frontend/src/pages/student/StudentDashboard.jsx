import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
import { ClipboardList, Briefcase } from 'lucide-react';
export const StudentDashboard = ({ user }) => {
    // TODO: Fetch this data from API
    const assignments = DUMMY_DATA.assignments.filter(a => a.status === 'Pending').slice(0, 3);
    const activities = DUMMY_DATA.recentActivity;
    const courses = DUMMY_DATA.courses.filter(c => c.enrolledStudentIds.includes(user.id)).slice(0, 2);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h1>
            
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Assignments & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upcoming Assignments */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Upcoming Assignments</h2>
                        <ul className="space-y-3">
                            {assignments.map(a => (
                                <li key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-800">{a.title}</p>
                                        <p className="text-sm text-gray-500">Due: {a.dueDate}</p>
                                    </div>
                                    <button className="text-sm bg-blue-100 text-blue-700 py-1 px-3 rounded-full font-medium hover:bg-blue-200">
                                        Start
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                        <ul className="space-y-4">
                            {activities.map(act => (
                                <li key={act.id} className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${act.type === 'complete' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {act.type === 'complete' ? <ClipboardList size={18} /> : <Briefcase size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{act.text}</p>
                                        <p className="text-sm text-gray-500">{act.time}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                {/* Right Column: My Courses Summary */}
                <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-xl font-semibold">My Courses</h2>
                    <div className="space-y-4">
                        {courses.map(course => (
                            <div key={course.id} className="border border-gray-200 rounded-lg p-4 flex items-center space-x-4">
                                <img src={course.thumbnail} alt={course.title} className="w-16 h-16 rounded-lg object-cover" />
                                <div>
                                    <h3 className="font-semibold text-gray-800">{course.title}</h3>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{course.progress}% complete</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full text-center text-blue-600 font-medium hover:underline">
                        View All Courses
                    </button>
                </div>
            </div>
        </div>
    );
};

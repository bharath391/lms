import React from 'react';
import { DUMMY_DATA, PIE_COLORS } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
const StudentAnalytics = () => {
    // TODO: Fetch this data from API
    const { studyHours, gradeDistribution, courseProgress } = DUMMY_DATA.analytics;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Learning Analytics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Study Hours */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Weekly Study Hours</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={studyHours}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="hours" fill="#3498db" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Grade Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Grade Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={gradeDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {gradeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Course Progress Overview */}
                <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Course Progress Overview</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={courseProgress}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Progress %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="progress" stroke="#2ecc71" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
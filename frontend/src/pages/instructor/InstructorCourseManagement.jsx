import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
const InstructorCourseManagement = ({ user }) => {
    // TODO: Fetch this data
    const courses = DUMMY_DATA.courses.filter(c => c.instructorId === user.id);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
                <button className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700">
                    Create New Course
                </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <table className="w-full table-auto">
                    <thead className="text-left text-sm font-semibold text-gray-600 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3">Course Title</th>
                            <th className="p-3">Students</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {courses.map(course => (
                            <tr key={course.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-800">{course.title}</td>
                                <td className="p-3 text-gray-600">{course.enrolledStudentIds.length}</td>
                                <td className="p-3"><span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-medium">Published</span></td>
                                <td className="p-3 space-x-2">
                                    <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                                    <button className="text-red-600 hover:underline text-sm font-medium">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstructorCourseManagement;
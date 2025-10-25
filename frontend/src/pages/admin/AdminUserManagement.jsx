import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
const AdminUserManagement = () => {
    // TODO: Fetch this data
    const users = DUMMY_DATA.users;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <button className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700">
                    Add New User
                </button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <table className="w-full table-auto">
                    <thead className="text-left text-sm font-semibold text-gray-600 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-800">{user.name}</td>
                                <td className="p-3 text-gray-600">{user.email}</td>
                                <td className="p-3">
                                    <span className={`capitalize text-sm font-medium py-1 px-3 rounded-full ${
                                        user.role === 'student' ? 'bg-blue-100 text-blue-700' :
                                        user.role === 'instructor' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
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

export default AdminUserManagement;
import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
const StudentAssignments = () => {
    // TODO: Fetch this data from API
    const assignments = DUMMY_DATA.assignments;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Assignments</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <ul className="space-y-4">
                    {assignments.map(a => (
                        <li key={a.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <div className="mb-2 sm:mb-0">
                                <p className="font-medium text-gray-800">{a.title}</p>
                                <p className="text-sm text-gray-500">Due: {a.dueDate}</p>
                            </div>
                            <span className={`text-sm font-medium py-1 px-3 rounded-full ${
                                a.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                a.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                                {a.status}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default StudentAssignments;
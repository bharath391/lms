import React from 'react'; // (You'd add this in the new file)
import { Users } from 'lucide-react'; // (Example of icon import)
export const StatCard = ({ title, value, icon, colorClass }) => {
    const IconComponent = icon;
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div className={`p-3 rounded-full ${colorClass || 'bg-blue-100 text-blue-600'}`}>
                <IconComponent size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};
import React from 'react';
export const CourseCard = ({ course }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
            <img 
                src={course.thumbnail} 
                alt={`${course.title} thumbnail`} 
                className="w-full h-40 object-cover"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Error'; }}
            />
            <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800 truncate">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3 h-10 overflow-hidden">{course.description}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                    ></div>
                </div>
                <div className="text-right text-sm font-medium text-blue-600">
                    {course.progress}% Complete
                </div>
                
                <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Continue Learning
                </button>
            </div>
        </div>
    );
};
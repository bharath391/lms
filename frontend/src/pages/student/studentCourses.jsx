import React from 'react';
import { DUMMY_DATA } from '../../data/mockData';
import CourseCard from '../../components/common/CourseCard';
export default StudentCourses = ({ user }) => {
    // TODO: Fetch this data from API
    const enrolledCourses = DUMMY_DATA.courses.filter(c => c.enrolledStudentIds.includes(user.id));
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Courses</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
};
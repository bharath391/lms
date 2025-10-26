// ===== SEED.JS =====
// Run this file to populate your database with sample data
// Command: npm run seed

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-lms', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Import models (same as in server.js)
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
}));

const Course = mongoose.model('Course', new mongoose.Schema({
    title: String,
    description: String,
    thumbnail: String,
    instructor_id: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
}));

const CourseWeek = mongoose.model('CourseWeek', new mongoose.Schema({
    course_id: mongoose.Schema.Types.ObjectId,
    week_number: Number,
    title: String,
    order: Number
}));

const CourseContent = mongoose.model('CourseContent', new mongoose.Schema({
    week_id: mongoose.Schema.Types.ObjectId,
    title: String,
    content_type: String,
    content: String,
    order: Number,
    is_quiz: Boolean
}));

const QuizQuestion = mongoose.model('QuizQuestion', new mongoose.Schema({
    content_id: mongoose.Schema.Types.ObjectId,
    question_text: String,
    options: [String],
    correct_answer: Number,
    points: Number
}));

const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    course_id: mongoose.Schema.Types.ObjectId,
    progress_percentage: Number,
    current_week_id: mongoose.Schema.Types.ObjectId,
    current_content_id: mongoose.Schema.Types.ObjectId,
    enrolledAt: { type: Date, default: Date.now }
}));

const Progress = mongoose.model('Progress', new mongoose.Schema({
    enrollment_id: mongoose.Schema.Types.ObjectId,
    content_id: mongoose.Schema.Types.ObjectId,
    completed: Boolean,
    score: Number,
    completedAt: Date
}));

const Assignment = mongoose.model('Assignment', new mongoose.Schema({
    course_id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    due_date: Date,
    total_points: Number
}));

const Submission = mongoose.model('Submission', new mongoose.Schema({
    assignment_id: mongoose.Schema.Types.ObjectId,
    user_id: mongoose.Schema.Types.ObjectId,
    status: String,
    grade: Number,
    feedback: String,
    submittedAt: Date
}));

// Seed function
async function seedDatabase() {
    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await CourseWeek.deleteMany({});
        await CourseContent.deleteMany({});
        await QuizQuestion.deleteMany({});
        await Enrollment.deleteMany({});
        await Progress.deleteMany({});
        await Assignment.deleteMany({});
        await Submission.deleteMany({});

        // Create users
        console.log('👥 Creating users...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const student = await User.create({
            name: 'Bharath Kumar',
            email: 'bharath@email.com',
            password: hashedPassword,
            role: 'student'
        });

        const instructor = await User.create({
            name: 'Dr. Evelyn Reed',
            email: 'evelyn@email.com',
            password: hashedPassword,
            role: 'instructor'
        });

        console.log('✅ Users created');

        // Create courses
        console.log('📚 Creating courses...');
        const course1 = await Course.create({
            title: 'Web Development Bootcamp',
            description: 'Master HTML, CSS, JavaScript, React, and Node.js from scratch.',
            thumbnail: 'https://placehold.co/600x400/3498db/ffffff?text=Web+Dev',
            instructor_id: instructor._id
        });

        const course2 = await Course.create({
            title: 'Data Science Fundamentals',
            description: 'Learn Python, Pandas, NumPy, and Matplotlib for data analysis.',
            thumbnail: 'https://placehold.co/600x400/2ecc71/ffffff?text=Data+Science',
            instructor_id: instructor._id
        });

        const course3 = await Course.create({
            title: 'Machine Learning Basics',
            description: 'Explore fundamental algorithms like regression, classification, and clustering.',
            thumbnail: 'https://placehold.co/600x400/e74c3c/ffffff?text=ML+Basics',
            instructor_id: instructor._id
        });

        console.log('✅ Courses created');

        // Create weeks for Course 1 (Web Dev)
        console.log('📅 Creating course weeks...');
        const week1 = await CourseWeek.create({
            course_id: course1._id,
            week_number: 1,
            title: 'HTML & CSS Basics',
            order: 1
        });

        const week2 = await CourseWeek.create({
            course_id: course1._id,
            week_number: 2,
            title: 'JavaScript Fundamentals',
            order: 2
        });

        const week3 = await CourseWeek.create({
            course_id: course1._id,
            week_number: 3,
            title: 'React Framework',
            order: 3
        });

        // Create weeks for Course 2 (Data Science)
        const week4 = await CourseWeek.create({
            course_id: course2._id,
            week_number: 1,
            title: 'Python Basics',
            order: 1
        });

        const week5 = await CourseWeek.create({
            course_id: course2._id,
            week_number: 2,
            title: 'Data Manipulation',
            order: 2
        });

        console.log('✅ Course weeks created');

        // Create content for Week 1
        console.log('📝 Creating course content...');
        const content1 = await CourseContent.create({
            week_id: week1._id,
            title: 'Introduction to HTML',
            content_type: 'text',
            content: 'HTML (HyperText Markup Language) is the standard markup language for creating web pages. It consists of elements represented by tags.\n\nBasic structure:\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Page Title</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
            order: 1,
            is_quiz: false
        });

        const content2 = await CourseContent.create({
            week_id: week1._id,
            title: 'CSS Styling Basics',
            content_type: 'text',
            content: 'CSS (Cascading Style Sheets) is used to style HTML elements. You can change colors, fonts, spacing, and layout.\n\nExample:\nh1 {\n  color: blue;\n  font-size: 24px;\n}',
            order: 2,
            is_quiz: false
        });

        const content3 = await CourseContent.create({
            week_id: week1._id,
            title: 'Building Your First Page',
            content_type: 'text',
            content: 'Practice creating a simple webpage with headers, paragraphs, and styled elements. Experiment with different HTML tags like <div>, <p>, <a>, and <img>.',
            order: 3,
            is_quiz: false
        });

        const content4 = await CourseContent.create({
            week_id: week1._id,
            title: 'Week 1 Quiz',
            content_type: 'quiz',
            content: null,
            order: 4,
            is_quiz: true
        });

        // Week 2 content
        const content5 = await CourseContent.create({
            week_id: week2._id,
            title: 'JavaScript Variables',
            content_type: 'text',
            content: 'Variables in JavaScript store data values. Use let, const, or var to declare variables.\n\nlet name = "John";\nconst age = 30;\nvar city = "New York";',
            order: 1,
            is_quiz: false
        });

        const content6 = await CourseContent.create({
            week_id: week2._id,
            title: 'Functions and Control Flow',
            content_type: 'text',
            content: 'Functions are reusable blocks of code. Control flow includes if statements, loops, and switch cases.\n\nfunction greet(name) {\n  return "Hello, " + name;\n}',
            order: 2,
            is_quiz: false
        });

        const content7 = await CourseContent.create({
            week_id: week2._id,
            title: 'DOM Manipulation',
            content_type: 'text',
            content: 'The Document Object Model (DOM) allows JavaScript to interact with HTML. You can select, modify, and create elements dynamically.',
            order: 3,
            is_quiz: false
        });

        const content8 = await CourseContent.create({
            week_id: week2._id,
            title: 'Week 2 Quiz',
            content_type: 'quiz',
            content: null,
            order: 4,
            is_quiz: true
        });

        console.log('✅ Course content created');

        // Create quiz questions
        console.log('❓ Creating quiz questions...');
        await QuizQuestion.create([
            {
                content_id: content4._id,
                question_text: 'What does HTML stand for?',
                options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
                correct_answer: 0,
                points: 10
            },
            {
                content_id: content4._id,
                question_text: 'Which CSS property changes text color?',
                options: ['font-color', 'text-color', 'color', 'text-style'],
                correct_answer: 2,
                points: 10
            },
            {
                content_id: content4._id,
                question_text: 'What tag is used for the largest heading?',
                options: ['<heading>', '<h6>', '<h1>', '<head>'],
                correct_answer: 2,
                points: 10
            },
            {
                content_id: content8._id,
                question_text: 'Which keyword declares a constant in JavaScript?',
                options: ['var', 'let', 'const', 'constant'],
                correct_answer: 2,
                points: 10
            },
            {
                content_id: content8._id,
                question_text: 'What method selects an element by ID?',
                options: ['querySelector()', 'getElementById()', 'selectElement()', 'findById()'],
                correct_answer: 1,
                points: 10
            }
        ]);

        console.log('✅ Quiz questions created');

        // Create enrollments
        console.log('📋 Creating enrollments...');
        const enrollment1 = await Enrollment.create({
            user_id: student._id,
            course_id: course1._id,
            progress_percentage: 65,
            current_week_id: week2._id,
            current_content_id: content6._id
        });

        const enrollment2 = await Enrollment.create({
            user_id: student._id,
            course_id: course2._id,
            progress_percentage: 25,
            current_week_id: week4._id,
            current_content_id: content1._id
        });

        const enrollment3 = await Enrollment.create({
            user_id: student._id,
            course_id: course3._id,
            progress_percentage: 10,
            current_week_id: week1._id,
            current_content_id: content1._id
        });

        console.log('✅ Enrollments created');

        // Create progress records
        console.log('📊 Creating progress records...');
        await Progress.create([
            {
                enrollment_id: enrollment1._id,
                content_id: content1._id,
                completed: true,
                completedAt: new Date('2025-01-21T14:30:00Z')
            },
            {
                enrollment_id: enrollment1._id,
                content_id: content2._id,
                completed: true,
                completedAt: new Date('2025-01-22T16:00:00Z')
            },
            {
                enrollment_id: enrollment1._id,
                content_id: content3._id,
                completed: true,
                completedAt: new Date('2025-01-23T11:20:00Z')
            },
            {
                enrollment_id: enrollment1._id,
                content_id: content4._id,
                completed: true,
                score: 27,
                completedAt: new Date('2025-01-23T15:00:00Z')
            },
            {
                enrollment_id: enrollment1._id,
                content_id: content5._id,
                completed: true,
                completedAt: new Date('2025-01-24T10:00:00Z')
            }
        ]);

        console.log('✅ Progress records created');

        // Create assignments
        console.log('📝 Creating assignments...');
        const assignment1 = await Assignment.create({
            course_id: course1._id,
            title: 'Build a Portfolio Page',
            description: 'Create a personal portfolio using HTML and CSS',
            due_date: new Date('2025-11-10'),
            total_points: 100
        });

        const assignment2 = await Assignment.create({
            course_id: course3._id,
            title: 'Linear Regression Project',
            description: 'Implement linear regression from scratch',
            due_date: new Date('2025-11-12'),
            total_points: 100
        });

        const assignment3 = await Assignment.create({
            course_id: course1._id,
            title: 'JavaScript Calculator',
            description: 'Build a functional calculator',
            due_date: new Date('2025-11-05'),
            total_points: 100
        });

        console.log('✅ Assignments created');

        // Create submissions
        console.log('📤 Creating submissions...');
        await Submission.create([
            {
                assignment_id: assignment3._id,
                user_id: student._id,
                status: 'Submitted',
                submittedAt: new Date('2025-11-04T18:30:00Z')
            },
            {
                assignment_id: assignment1._id,
                user_id: student._id,
                status: 'Pending'
            }
        ]);

        console.log('✅ Submissions created');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📧 Login credentials:');
        console.log('Student: bharath@email.com / password123');
        console.log('Instructor: evelyn@email.com / password123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
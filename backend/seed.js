// ===== SEED.JS =====
// Run this file to populate your database with sample data
// Command: node seed.js (or adjust your package.json script)

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

// --- Define Schemas (Simplified for seeding, ensure they match server.js for actual use) ---
const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String, createdAt: { type: Date, default: Date.now } });
const courseSchema = new mongoose.Schema({ title: String, description: String, thumbnail: String, instructor_id: mongoose.Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now } });
const courseWeekSchema = new mongoose.Schema({ course_id: mongoose.Schema.Types.ObjectId, week_number: Number, title: String, order: Number });
const courseContentSchema = new mongoose.Schema({ week_id: mongoose.Schema.Types.ObjectId, title: String, content_type: String, content: String, order: Number, is_quiz: Boolean });
const quizQuestionSchema = new mongoose.Schema({ content_id: mongoose.Schema.Types.ObjectId, question_text: String, options: [String], correct_answer: Number, points: Number });
const enrollmentSchema = new mongoose.Schema({ user_id: mongoose.Schema.Types.ObjectId, course_id: mongoose.Schema.Types.ObjectId, progress_percentage: { type: Number, default: 0 }, current_week_id: mongoose.Schema.Types.ObjectId, current_content_id: mongoose.Schema.Types.ObjectId, enrolledAt: { type: Date, default: Date.now } });
const progressSchema = new mongoose.Schema({ enrollment_id: mongoose.Schema.Types.ObjectId, content_id: mongoose.Schema.Types.ObjectId, completed: Boolean, score: Number, completedAt: Date });
const assignmentSchema = new mongoose.Schema({ course_id: mongoose.Schema.Types.ObjectId, title: String, description: String, due_date: Date, total_points: Number, createdAt: { type: Date, default: Date.now } });
const submissionSchema = new mongoose.Schema({ assignment_id: mongoose.Schema.Types.ObjectId, user_id: mongoose.Schema.Types.ObjectId, status: String, grade: Number, feedback: String, submittedAt: Date });

// --- Get Models (or create if not existing) ---
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
const CourseWeek = mongoose.models.CourseWeek || mongoose.model('CourseWeek', courseWeekSchema);
const CourseContent = mongoose.models.CourseContent || mongoose.model('CourseContent', courseContentSchema);
const QuizQuestion = mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', quizQuestionSchema);
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);


// --- Seed Function ---
async function seedDatabase() {
    try {
        // Clear existing data
        console.log('\n🗑️  Clearing existing data...');
        const collections = [
            User, Course, CourseWeek, CourseContent, QuizQuestion,
            Enrollment, Progress, Assignment, Submission
        ];
        for (const model of collections) {
            await model.deleteMany({});
        }
        console.log('✅ Data cleared');

        // --- Create Users ---
        console.log('\n👥 Creating users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const instructor1 = await User.create({
            name: 'Dr. Evelyn Reed',
            email: 'evelyn@email.com',
            password: hashedPassword,
            role: 'instructor'
        });

        const instructor2 = await User.create({
            name: 'Prof. Kenji Tanaka',
            email: 'kenji@email.com',
            password: hashedPassword,
            role: 'instructor'
        });

        const student1 = await User.create({
            name: 'Bharath Kumar',
            email: 'bharath@email.com',
            password: hashedPassword,
            role: 'student'
        });

        const student2 = await User.create({
            name: 'Aisha Khan',
            email: 'aisha@email.com',
            password: hashedPassword,
            role: 'student'
        });

        const student3 = await User.create({
            name: 'Carlos Gomez',
            email: 'carlos@email.com',
            password: hashedPassword,
            role: 'student'
        });
        console.log('✅ Users created (2 instructors, 3 students)');

        // --- Create Courses ---
        console.log('\n📚 Creating courses...');
        const courseWebDev = await Course.create({
            title: 'Full-Stack Web Development Bootcamp',
            description: 'Master HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB from scratch.',
            thumbnail: 'https://placehold.co/600x400/3498db/ffffff?text=Web+Dev+Pro',
            instructor_id: instructor1._id
        });

        const courseDataSci = await Course.create({
            title: 'Data Science Fundamentals with Python',
            description: 'Learn Python, Pandas, NumPy, Scikit-learn, and Matplotlib for data analysis and basic modeling.',
            thumbnail: 'https://placehold.co/600x400/2ecc71/ffffff?text=Data+Science',
            instructor_id: instructor1._id
        });

        const courseML = await Course.create({
            title: 'Introduction to Machine Learning',
            description: 'Explore fundamental algorithms like regression, classification, clustering, and model evaluation.',
            thumbnail: 'https://placehold.co/600x400/e74c3c/ffffff?text=ML+Intro',
            instructor_id: instructor2._id // Assign to second instructor
        });

         const courseCloud = await Course.create({
            title: 'Cloud Computing Essentials (AWS)',
            description: 'Understand core AWS services like EC2, S3, Lambda, and VPC.',
            thumbnail: 'https://placehold.co/600x400/f39c12/ffffff?text=AWS+Cloud',
            instructor_id: instructor2._id // Assign to second instructor
        });
        console.log('✅ Courses created (4 courses)');

        // --- Create Weeks & Content ---
        console.log('\n📅📝 Creating weeks and content...');

        // --- Course 1: Web Dev ---
        const c1_w1 = await CourseWeek.create({ course_id: courseWebDev._id, week_number: 1, title: 'HTML & CSS Foundations', order: 1 });
        const c1_w1_c1 = await CourseContent.create({ week_id: c1_w1._id, title: 'HTML Structure', content_type: 'text', content: 'HTML basics: tags, attributes, document structure.', order: 1, is_quiz: false });
        const c1_w1_c2 = await CourseContent.create({ week_id: c1_w1._id, title: 'CSS Styling', content_type: 'text', content: 'Selectors, properties, box model, basic layouts.', order: 2, is_quiz: false });
        const c1_w1_c3 = await CourseContent.create({ week_id: c1_w1._id, title: 'Flexbox & Grid', content_type: 'text', content: 'Modern CSS layout techniques.', order: 3, is_quiz: false });
        const c1_w1_c4 = await CourseContent.create({ week_id: c1_w1._id, title: 'Week 1 Quiz', content_type: 'quiz', content: null, order: 4, is_quiz: true });

        const c1_w2 = await CourseWeek.create({ course_id: courseWebDev._id, week_number: 2, title: 'JavaScript Fundamentals', order: 2 });
        const c1_w2_c1 = await CourseContent.create({ week_id: c1_w2._id, title: 'Variables & Data Types', content_type: 'text', content: 'let, const, var, strings, numbers, booleans, arrays, objects.', order: 1, is_quiz: false });
        const c1_w2_c2 = await CourseContent.create({ week_id: c1_w2._id, title: 'Functions & Control Flow', content_type: 'text', content: 'Defining functions, scope, if/else, loops.', order: 2, is_quiz: false });
        const c1_w2_c3 = await CourseContent.create({ week_id: c1_w2._id, title: 'DOM Manipulation', content_type: 'text', content: 'Selecting elements, events, modifying content.', order: 3, is_quiz: false });
        const c1_w2_c4 = await CourseContent.create({ week_id: c1_w2._id, title: 'Week 2 Quiz', content_type: 'quiz', content: null, order: 4, is_quiz: true });

        const c1_w3 = await CourseWeek.create({ course_id: courseWebDev._id, week_number: 3, title: 'React Introduction', order: 3 });
        const c1_w3_c1 = await CourseContent.create({ week_id: c1_w3._id, title: 'Components & JSX', content_type: 'text', content: 'Building UI with React components.', order: 1, is_quiz: false });
        const c1_w3_c2 = await CourseContent.create({ week_id: c1_w3._id, title: 'State & Props', content_type: 'text', content: 'Managing component data.', order: 2, is_quiz: false });

        // --- Course 2: Data Science ---
        const c2_w1 = await CourseWeek.create({ course_id: courseDataSci._id, week_number: 1, title: 'Python for Data Science', order: 1 });
        const c2_w1_c1 = await CourseContent.create({ week_id: c2_w1._id, title: 'Python Basics Refresher', content_type: 'text', content: 'Syntax, data types, loops, functions relevant to DS.', order: 1, is_quiz: false });
        const c2_w1_c2 = await CourseContent.create({ week_id: c2_w1._id, title: 'Intro to NumPy', content_type: 'text', content: 'Numerical computing with arrays.', order: 2, is_quiz: false });
        const c2_w1_c3 = await CourseContent.create({ week_id: c2_w1._id, title: 'Intro to Pandas', content_type: 'text', content: 'DataFrames and Series for manipulation.', order: 3, is_quiz: false });
        const c2_w1_c4 = await CourseContent.create({ week_id: c2_w1._id, title: 'Week 1 Quiz', content_type: 'quiz', content: null, order: 4, is_quiz: true });


        const c2_w2 = await CourseWeek.create({ course_id: courseDataSci._id, week_number: 2, title: 'Data Cleaning & Visualization', order: 2 });
        const c2_w2_c1 = await CourseContent.create({ week_id: c2_w2._id, title: 'Handling Missing Data', content_type: 'text', content: 'Techniques for imputation or removal.', order: 1, is_quiz: false });
        const c2_w2_c2 = await CourseContent.create({ week_id: c2_w2._id, title: 'Matplotlib Basics', content_type: 'text', content: 'Creating static plots.', order: 2, is_quiz: false });

        // --- Course 3: Machine Learning ---
        const c3_w1 = await CourseWeek.create({ course_id: courseML._id, week_number: 1, title: 'ML Concepts & Regression', order: 1 });
        const c3_w1_c1 = await CourseContent.create({ week_id: c3_w1._id, title: 'What is Machine Learning?', content_type: 'text', content: 'Supervised vs Unsupervised, model lifecycle.', order: 1, is_quiz: false });
        const c3_w1_c2 = await CourseContent.create({ week_id: c3_w1._id, title: 'Linear Regression', content_type: 'text', content: 'Understanding the basic regression algorithm.', order: 2, is_quiz: false });
        const c3_w1_c3 = await CourseContent.create({ week_id: c3_w1._id, title: 'Week 1 Quiz', content_type: 'quiz', content: null, order: 3, is_quiz: true });

        // --- Course 4: Cloud ---
        const c4_w1 = await CourseWeek.create({ course_id: courseCloud._id, week_number: 1, title: 'Introduction to Cloud & AWS', order: 1 });
        const c4_w1_c1 = await CourseContent.create({ week_id: c4_w1._id, title: 'Cloud Concepts', content_type: 'text', content: 'IaaS, PaaS, SaaS, benefits of cloud.', order: 1, is_quiz: false });
        const c4_w1_c2 = await CourseContent.create({ week_id: c4_w1._id, title: 'AWS Core Services Overview', content_type: 'text', content: 'EC2, S3, VPC fundamentals.', order: 2, is_quiz: false });
        console.log('✅ Weeks and content created');

        // --- Create Quiz Questions ---
        console.log('\n❓ Creating quiz questions...');
        await QuizQuestion.create([
            // Course 1, Week 1 Quiz
            { content_id: c1_w1_c4._id, question_text: 'What does CSS stand for?', options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'], correct_answer: 1, points: 5 },
            { content_id: c1_w1_c4._id, question_text: 'Which HTML tag defines an unordered list?', options: ['<ol>', '<li>', '<ul>', '<list>'], correct_answer: 2, points: 5 },
            // Course 1, Week 2 Quiz
            { content_id: c1_w2_c4._id, question_text: 'Which is NOT a JavaScript data type?', options: ['String', 'Boolean', 'Number', 'Character'], correct_answer: 3, points: 10 },
            { content_id: c1_w2_c4._id, question_text: 'How do you select an element with id="demo"?', options: ['document.select("#demo")', 'document.getElement("demo")', 'document.getElementById("demo")', '#demo'], correct_answer: 2, points: 10 },
            // Course 2, Week 1 Quiz
            { content_id: c2_w1_c4._id, question_text: 'Which library is primarily used for numerical operations in Python?', options: ['Pandas', 'Matplotlib', 'NumPy', 'SciPy'], correct_answer: 2, points: 10 },
            { content_id: c2_w1_c4._id, question_text: 'What is the primary data structure in Pandas?', options: ['Array', 'List', 'Series', 'DataFrame'], correct_answer: 3, points: 10 },
             // Course 3, Week 1 Quiz
            { content_id: c3_w1_c3._id, question_text: 'Linear Regression is an example of:', options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'], correct_answer: 0, points: 10 },
            { content_id: c3_w1_c3._id, question_text: 'Which task predicts a continuous value?', options: ['Classification', 'Regression', 'Clustering'], correct_answer: 1, points: 10 },
        ]);
        console.log('✅ Quiz questions created');

        // --- Create Enrollments ---
        console.log('\n📋 Creating enrollments...');
        // Student 1 (Bharath)
        const enr_s1_c1 = await Enrollment.create({ user_id: student1._id, course_id: courseWebDev._id }); // Progress calculated later
        const enr_s1_c2 = await Enrollment.create({ user_id: student1._id, course_id: courseDataSci._id });
        const enr_s1_c3 = await Enrollment.create({ user_id: student1._id, course_id: courseML._id });

        // Student 2 (Aisha)
        const enr_s2_c1 = await Enrollment.create({ user_id: student2._id, course_id: courseWebDev._id });
        const enr_s2_c4 = await Enrollment.create({ user_id: student2._id, course_id: courseCloud._id });

        // Student 3 (Carlos)
        const enr_s3_c2 = await Enrollment.create({ user_id: student3._id, course_id: courseDataSci._id });
        const enr_s3_c3 = await Enrollment.create({ user_id: student3._id, course_id: courseML._id });
        console.log('✅ Enrollments created');

        // --- Create Progress Records ---
        console.log('\n📊 Creating progress records...');
        // Student 1, Course 1 (Web Dev) - Completed Week 1 + Quiz + Part of Week 2
        const progress_s1_c1 = [
            { enrollment_id: enr_s1_c1._id, content_id: c1_w1_c1._id, completed: true, completedAt: new Date() },
            { enrollment_id: enr_s1_c1._id, content_id: c1_w1_c2._id, completed: true, completedAt: new Date() },
            { enrollment_id: enr_s1_c1._id, content_id: c1_w1_c3._id, completed: true, completedAt: new Date() },
            { enrollment_id: enr_s1_c1._id, content_id: c1_w1_c4._id, completed: true, score: 8, completedAt: new Date() }, // Score out of 10 (2 questions * 5 points)
            { enrollment_id: enr_s1_c1._id, content_id: c1_w2_c1._id, completed: true, completedAt: new Date() },
            // { enrollment_id: enr_s1_c1._id, content_id: c1_w2_c2._id, completed: false }, // Not completed yet
        ];
        await Progress.insertMany(progress_s1_c1);

        // Student 1, Course 2 (Data Sci) - Completed Python Basics
        await Progress.create({ enrollment_id: enr_s1_c2._id, content_id: c2_w1_c1._id, completed: true, completedAt: new Date() });

         // Student 2, Course 1 (Web Dev) - Completed only HTML Structure
        await Progress.create({ enrollment_id: enr_s2_c1._id, content_id: c1_w1_c1._id, completed: true, completedAt: new Date() });

         // Student 3, Course 3 (ML) - Completed Intro
        await Progress.create({ enrollment_id: enr_s3_c3._id, content_id: c3_w1_c1._id, completed: true, completedAt: new Date() });

        // --- Update Enrollment Progress Percentages ---
        console.log('🔄 Calculating enrollment percentages...');
        const allEnrollments = await Enrollment.find();
        for (const enrollment of allEnrollments) {
            const weeksInCourse = await CourseWeek.find({ course_id: enrollment.course_id });
            const weekIds = weeksInCourse.map(w => w._id);
            const totalContentCount = await CourseContent.countDocuments({ week_id: { $in: weekIds } });
            const completedProgress = await Progress.countDocuments({ enrollment_id: enrollment._id, completed: true });
            enrollment.progress_percentage = totalContentCount > 0 ? Math.round((completedProgress / totalContentCount) * 100) : 0;
            await enrollment.save();
        }
        console.log('✅ Enrollment percentages updated');

        // --- Create Assignments ---
        console.log('\n📝 Creating assignments...');
        const asg_c1_1 = await Assignment.create({ course_id: courseWebDev._id, title: 'HTML Portfolio Page', description: 'Create a single-page portfolio using HTML & CSS.', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), total_points: 50 }); // Due in 7 days
        const asg_c1_2 = await Assignment.create({ course_id: courseWebDev._id, title: 'JavaScript To-Do App', description: 'Build a functional To-Do list application.', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), total_points: 100 }); // Due in 14 days
        const asg_c2_1 = await Assignment.create({ course_id: courseDataSci._id, title: 'Data Cleaning Exercise', description: 'Clean and prepare the provided dataset using Pandas.', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), total_points: 75 }); // Due in 10 days
        const asg_c3_1 = await Assignment.create({ course_id: courseML._id, title: 'Regression Model Report', description: 'Train a linear regression model and report its performance.', due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), total_points: 100 }); // Due in 12 days

        console.log('✅ Assignments created (4 assignments)');

        // --- Create Submissions ---
        console.log('\n📤 Creating submissions...');
        // Student 1 submitted To-Do App, waiting for grade
        await Submission.create({ assignment_id: asg_c1_2._id, user_id: student1._id, status: 'Submitted', submittedAt: new Date() });
        // Student 2 submitted Portfolio, graded
        await Submission.create({ assignment_id: asg_c1_1._id, user_id: student2._id, status: 'Graded', grade: 45, feedback: 'Good structure, needs more styling.', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }); // Submitted 2 days ago
        // Student 3 started Data Cleaning, pending
        // No submission record needed for 'Pending', it's the default state

        console.log('✅ Submissions created (2 submissions)');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📧 Login credentials (password is "password123" for all):');
        console.log(`   Student 1: ${student1.email}`);
        console.log(`   Student 2: ${student2.email}`);
        console.log(`   Student 3: ${student3.email}`);
        console.log(`   Instructor 1: ${instructor1.email}`);
        console.log(`   Instructor 2: ${instructor2.email}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        // Ensure connection is closed even if errors occur
        mongoose.connection.close().catch(err => console.error("Error closing MongoDB connection:", err));
    }
}

seedDatabase();

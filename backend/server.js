// ===== SERVER.JS ===== (FIXED VERSION)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-lms', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ===== MODELS ===== (Same as before, no changes needed)

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'instructor'], required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, default: 'https://placehold.co/600x400/3498db/ffffff?text=Course' },
    instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', courseSchema);

const courseWeekSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    week_number: { type: Number, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true }
});

const CourseWeek = mongoose.model('CourseWeek', courseWeekSchema);

const courseContentSchema = new mongoose.Schema({
    week_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseWeek', required: true },
    title: { type: String, required: true },
    content_type: { type: String, enum: ['text', 'video', 'quiz'], required: true },
    content: { type: String },
    order: { type: Number, required: true },
    is_quiz: { type: Boolean, default: false }
});

const CourseContent = mongoose.model('CourseContent', courseContentSchema);

const quizQuestionSchema = new mongoose.Schema({
    content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseContent', required: true },
    question_text: { type: String, required: true },
    options: [{ type: String }],
    correct_answer: { type: Number, required: true },
    points: { type: Number, default: 10 }
});

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

const enrollmentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progress_percentage: { type: Number, default: 0 },
    current_week_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseWeek' },
    current_content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseContent' },
    enrolledAt: { type: Date, default: Date.now }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

const progressSchema = new mongoose.Schema({
    enrollment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseContent', required: true },
    completed: { type: Boolean, default: false },
    score: { type: Number },
    completedAt: { type: Date }
});

const Progress = mongoose.model('Progress', progressSchema);

const assignmentSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String },
    due_date: { type: Date, required: true },
    total_points: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

const submissionSchema = new mongoose.Schema({
    assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
    grade: { type: Number },
    feedback: { type: String },
    submittedAt: { type: Date }
});

const Submission = mongoose.model('Submission', submissionSchema);

// ===== MIDDLEWARE =====

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===== ROUTES =====

// ========== AUTH ROUTES ==========

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    res.json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    });
});

// ========== COURSE ROUTES ==========

app.get('/api/courses', authMiddleware, async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor_id', 'name email');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/courses/:id', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id).populate('instructor_id', 'name email');
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/courses', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        const { title, description, thumbnail } = req.body;
        
        const course = new Course({
            title,
            description,
            thumbnail,
            instructor_id: req.user._id
        });

        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/courses/:id', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { title, description, thumbnail } = req.body;
        course.title = title || course.title;
        course.description = description || course.description;
        course.thumbnail = thumbnail || course.thumbnail;
        course.updatedAt = Date.now();

        await course.save();
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/courses/instructor/my-courses', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        const courses = await Course.find({ instructor_id: req.user._id });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== COURSE WEEK ROUTES ==========

app.get('/api/courses/:courseId/weeks', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const weeks = await CourseWeek.find({ course_id: req.params.courseId }).sort('order');
        res.json(weeks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/courses/:courseId/weeks', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.courseId);
        
        if (!course || course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { week_number, title, order } = req.body;
        
        const week = new CourseWeek({
            course_id: req.params.courseId,
            week_number,
            title,
            order
        });

        await week.save();
        res.status(201).json(week);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== COURSE CONTENT ROUTES ==========

app.get('/api/weeks/:weekId/content', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.weekId)) {
            return res.status(400).json({ error: 'Invalid week ID' });
        }

        const content = await CourseContent.find({ week_id: req.params.weekId }).sort('order');
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/weeks/:weekId/content', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.weekId)) {
            return res.status(400).json({ error: 'Invalid week ID' });
        }

        const week = await CourseWeek.findById(req.params.weekId);
        if (!week) {
            return res.status(404).json({ error: 'Week not found' });
        }

        const course = await Course.findById(week.course_id);
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { title, content_type, content, order, is_quiz } = req.body;
        
        const courseContent = new CourseContent({
            week_id: req.params.weekId,
            title,
            content_type,
            content,
            order,
            is_quiz
        });

        await courseContent.save();
        res.status(201).json(courseContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// FIX: Updated to accept both title and content
app.put('/api/content/:id', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        const content = await CourseContent.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const week = await CourseWeek.findById(content.week_id);
        const course = await Course.findById(week.course_id);
        
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { title, content: newContent } = req.body;
        if (title !== undefined) content.title = title;
        if (newContent !== undefined) content.content = newContent;

        await content.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== QUIZ ROUTES ==========

app.get('/api/content/:contentId/questions', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.contentId)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        const questions = await QuizQuestion.find({ content_id: req.params.contentId });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Create quiz question (Instructor only)
app.post('/api/content/:contentId/questions', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.contentId)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        const content = await CourseContent.findById(req.params.contentId);
        if (!content || !content.is_quiz) {
            return res.status(400).json({ error: 'Content is not a quiz' });
        }

        const week = await CourseWeek.findById(content.week_id);
        const course = await Course.findById(week.course_id);
        
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { question_text, options, correct_answer, points } = req.body;
        
        const question = new QuizQuestion({
            content_id: req.params.contentId,
            question_text,
            options,
            correct_answer,
            points
        });

        await question.save();
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ENROLLMENT ROUTES ==========

app.get('/api/enrollments/my-courses', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ user_id: req.user._id })
            .populate('course_id')
            .populate('current_week_id')
            .populate('current_content_id');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/enrollments', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!isValidObjectId(course_id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const existing = await Enrollment.findOne({
            user_id: req.user._id,
            course_id
        });

        if (existing) {
            return res.status(400).json({ error: 'Already enrolled' });
        }

        const enrollment = new Enrollment({
            user_id: req.user._id,
            course_id
        });

        await enrollment.save();
        
        // Populate before sending response
        await enrollment.populate('course_id');
        
        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/courses/:courseId/enrollments', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.courseId);
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const enrollments = await Enrollment.find({ course_id: req.params.courseId })
            .populate('user_id', 'name email');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PROGRESS ROUTES ==========

app.get('/api/enrollments/:enrollmentId/progress', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.enrollmentId)) {
            return res.status(400).json({ error: 'Invalid enrollment ID' });
        }

        const progress = await Progress.find({ enrollment_id: req.params.enrollmentId });
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// FIX: Improved progress calculation
app.post('/api/progress', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { enrollment_id, content_id, score } = req.body;

        if (!isValidObjectId(enrollment_id) || !isValidObjectId(content_id)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }

        const enrollment = await Enrollment.findById(enrollment_id);
        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        if (enrollment.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        let progress = await Progress.findOne({ enrollment_id, content_id });

        if (progress) {
            progress.completed = true;
            progress.score = score;
            progress.completedAt = Date.now();
        } else {
            progress = new Progress({
                enrollment_id,
                content_id,
                completed: true,
                score,
                completedAt: Date.now()
            });
        }

        await progress.save();

        // FIX: Proper progress calculation
        // Get all weeks for this course
        const weeks = await CourseWeek.find({ course_id: enrollment.course_id });
        const weekIds = weeks.map(w => w._id);
        
        // Get all content for all weeks
        const totalContent = await CourseContent.countDocuments({ 
            week_id: { $in: weekIds }
        });

        // Get all completed progress for this enrollment
        const allProgress = await Progress.find({ enrollment_id });
        const completedCount = allProgress.filter(p => p.completed).length;

        // Calculate percentage
        enrollment.progress_percentage = totalContent > 0 
            ? Math.round((completedCount / totalContent) * 100) 
            : 0;
        
        await enrollment.save();

        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ASSIGNMENT ROUTES ==========

app.get('/api/courses/:courseId/assignments', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const assignments = await Assignment.find({ course_id: req.params.courseId });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/assignments', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        const { course_id, title, description, due_date, total_points } = req.body;

        if (!isValidObjectId(course_id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await Course.findById(course_id);
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const assignment = new Assignment({
            course_id,
            title,
            description,
            due_date,
            total_points
        });

        await assignment.save();
        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SUBMISSION ROUTES ==========

app.get('/api/submissions/my-submissions', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const submissions = await Submission.find({ user_id: req.user._id })
            .populate('assignment_id');
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/submissions', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { assignment_id } = req.body;

        if (!isValidObjectId(assignment_id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        const submission = new Submission({
            assignment_id,
            user_id: req.user._id,
            status: 'Submitted',
            submittedAt: Date.now()
        });

        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/submissions/:id/grade', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid submission ID' });
        }

        const submission = await Submission.findById(req.params.id).populate('assignment_id');
        
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const assignment = await Assignment.findById(submission.assignment_id);
        const course = await Course.findById(assignment.course_id);

        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { grade, feedback } = req.body;
        submission.grade = grade;
        submission.feedback = feedback;
        submission.status = 'Graded';

        await submission.save();
        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
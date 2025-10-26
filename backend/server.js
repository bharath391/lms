// ===== SERVER.JS =====
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

const app = express();

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// --- MongoDB Connection ---
// Use environment variable or default local connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-lms';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Mongoose Models ---

// User Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true }, // Added index for faster lookups
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'instructor'], required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Course Model
const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, default: 'https://placehold.co/600x400/3498db/ffffff?text=Course' },
    instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Added index
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const Course = mongoose.model('Course', courseSchema);

// Course Week Model
const courseWeekSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true }, // Added index
    week_number: { type: Number, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true } // For ordering weeks within a course
});
// Add compound index for faster lookups within a course, ordered
courseWeekSchema.index({ course_id: 1, order: 1 });
const CourseWeek = mongoose.model('CourseWeek', courseWeekSchema);

// Course Content Model
const courseContentSchema = new mongoose.Schema({
    week_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseWeek', required: true, index: true }, // Added index
    title: { type: String, required: true },
    content_type: { type: String, enum: ['text', 'video', 'quiz'], required: true },
    content: { type: String }, // Can be text content or video URL
    order: { type: Number, required: true }, // For ordering content within a week
    is_quiz: { type: Boolean, default: false }
});
// Add compound index for faster lookups within a week, ordered
courseContentSchema.index({ week_id: 1, order: 1 });
const CourseContent = mongoose.model('CourseContent', courseContentSchema);

// Quiz Question Model
const quizQuestionSchema = new mongoose.Schema({
    content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseContent', required: true, index: true }, // Added index
    question_text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correct_answer: { type: Number, required: true }, // Index of the correct option
    points: { type: Number, default: 10 },
    tags: [{ type: String }] // Tags for analytics
});
const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

// Enrollment Model
const enrollmentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progress_percentage: { type: Number, default: 0 },
    current_week_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseWeek' }, // Optional: Track last accessed week
    current_content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseContent' }, // Optional: Track last accessed content
    enrolledAt: { type: Date, default: Date.now }
});
// Compound index for efficient querying of a user's enrollment in a course
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

// Progress Model
const progressSchema = new mongoose.Schema({
    enrollment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseContent', required: true },
    completed: { type: Boolean, default: false },
    score: { type: Number }, // Score obtained (especially for quizzes)
    completedAt: { type: Date }
});
// Compound index for efficient querying of progress within an enrollment
progressSchema.index({ enrollment_id: 1, content_id: 1 }, { unique: true });
const Progress = mongoose.model('Progress', progressSchema);

// Assignment Model
const assignmentSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true }, // Added index
    title: { type: String, required: true },
    description: { type: String },
    due_date: { type: Date, required: true },
    total_points: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now }
});
const Assignment = mongoose.model('Assignment', assignmentSchema);

// Submission Model
const submissionSchema = new mongoose.Schema({
    assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
    grade: { type: Number },
    feedback: { type: String },
    submittedAt: { type: Date } // Date when student submitted
});
// Compound index for efficient querying of a student's submission for an assignment
submissionSchema.index({ user_id: 1, assignment_id: 1 }, { unique: true });
const Submission = mongoose.model('Submission', submissionSchema);


// --- Middleware ---

// Authentication Middleware: Verifies JWT token
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key'); // Use env variable or fallback
        const user = await User.findById(decoded.userId).select('-password'); // Exclude password hash

        if (!user) {
            return res.status(401).json({ error: 'Authentication failed. User not found.' });
        }

        req.user = user; // Attach user object (without password) to the request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
         if (error instanceof jwt.JsonWebTokenError) {
             return res.status(401).json({ error: 'Invalid token.' });
         }
         console.error("Auth Middleware Error:", error);
         res.status(500).json({ error: 'Internal server error during authentication.' });
    }
};

// Authorization Middleware: Checks if user has the required role(s)
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        // Assumes authMiddleware has run and attached req.user
        if (!req.user || !roles.includes(req.user.role)) {
            // Forbidden access
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next(); // User has the required role, proceed
    };
};

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// --- Routes ---

// ========== AUTH ROUTES ==========

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Basic validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required.' });
        }
        if (!['student', 'instructor'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' } // Token expires in 7 days
        );

        // Respond with user info (excluding password) and token
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
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
             return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // User not found
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Compare provided password with hashed password in database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Password doesn't match
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Respond with user info (excluding password) and token
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
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
});

// Get current user details (requires authentication)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    // req.user is attached by authMiddleware
    res.json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    });
});


// ========== COURSE ROUTES ==========

// Get all courses (requires authentication)
app.get('/api/courses', authMiddleware, async (req, res) => {
    try {
        // Populate instructor details, selecting only name and email
        const courses = await Course.find().populate('instructor_id', 'name email');
        res.json(courses);
    } catch (error) {
        console.error("Get All Courses Error:", error);
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
});

// Get a single course by ID (requires authentication)
app.get('/api/courses/:id', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        const course = await Course.findById(req.params.id).populate('instructor_id', 'name email');
        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        res.json(course);
    } catch (error) {
        console.error("Get Course By ID Error:", error);
        res.status(500).json({ error: 'Failed to fetch course details.' });
    }
});

// Create a new course (instructor only)
app.post('/api/courses', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        const { title, description, thumbnail } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }

        const course = new Course({
            title,
            description,
            thumbnail, // Optional, defaults if not provided
            instructor_id: req.user._id // Assign logged-in instructor
        });

        await course.save();
        res.status(201).json(course); // Respond with created course
    } catch (error) {
        console.error("Create Course Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to create course.' });
    }
});

// Update a course (instructor only, must be owner)
app.put('/api/courses/:id', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        // Authorization check: Ensure the logged-in instructor owns this course
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own this course.' });
        }

        const { title, description, thumbnail } = req.body;

        // Update fields if they are provided in the request body
        if (title) course.title = title;
        if (description) course.description = description;
        if (thumbnail) course.thumbnail = thumbnail;
        course.updatedAt = Date.now(); // Update timestamp

        await course.save();
        res.json(course); // Respond with updated course
    } catch (error) {
        console.error("Update Course Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to update course.' });
    }
});

// Get courses taught by the logged-in instructor
app.get('/api/courses/instructor/my-courses', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        const courses = await Course.find({ instructor_id: req.user._id });
        res.json(courses);
    } catch (error) {
        console.error("Get Instructor Courses Error:", error);
        res.status(500).json({ error: 'Failed to fetch instructor courses.' });
    }
});

// TODO: Add DELETE /api/courses/:id route (handle deleting weeks, content, enrollments etc.)


// ========== COURSE WEEK ROUTES ==========

// Get all weeks for a specific course, sorted by order
app.get('/api/courses/:courseId/weeks', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Verify the course exists (optional, but good practice)
        const courseExists = await Course.findById(req.params.courseId).select('_id');
        if (!courseExists) {
             return res.status(404).json({ error: 'Course not found.' });
        }

        const weeks = await CourseWeek.find({ course_id: req.params.courseId }).sort('order');
        res.json(weeks);
    } catch (error) {
        console.error("Get Course Weeks Error:", error);
        res.status(500).json({ error: 'Failed to fetch course weeks.' });
    }
});

// Create a new week for a course (instructor only, must be owner)
app.post('/api/courses/:courseId/weeks', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        const course = await Course.findById(req.params.courseId).select('instructor_id');

        if (!course) {
             return res.status(404).json({ error: 'Course not found.' });
        }
        // Authorization check
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own this course.' });
        }

        const { week_number, title, order } = req.body;
        if (week_number === undefined || !title || order === undefined) {
            return res.status(400).json({ error: 'Week number, title, and order are required.' });
        }

        const week = new CourseWeek({
            course_id: req.params.courseId,
            week_number,
            title,
            order
        });

        await week.save();
        res.status(201).json(week);
    } catch (error) {
        console.error("Create Course Week Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to create course week.' });
    }
});

// TODO: Add PUT /api/weeks/:id and DELETE /api/weeks/:id routes


// ========== COURSE CONTENT ROUTES ==========

// Get all content items for a specific week, sorted by order
app.get('/api/weeks/:weekId/content', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.weekId)) {
            return res.status(400).json({ error: 'Invalid week ID format.' });
        }

         // Verify the week exists (optional)
        const weekExists = await CourseWeek.findById(req.params.weekId).select('_id');
        if (!weekExists) {
             return res.status(404).json({ error: 'Week not found.' });
        }

        const content = await CourseContent.find({ week_id: req.params.weekId }).sort('order');
        res.json(content);
    } catch (error) {
        console.error("Get Week Content Error:", error);
        res.status(500).json({ error: 'Failed to fetch week content.' });
    }
});

// Create a new content item for a week (instructor only, must own parent course)
app.post('/api/weeks/:weekId/content', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.weekId)) {
            return res.status(400).json({ error: 'Invalid week ID format.' });
        }

        // Find the week and populate its course to check ownership
        const week = await CourseWeek.findById(req.params.weekId).populate('course_id', 'instructor_id');
        if (!week) {
            return res.status(404).json({ error: 'Week not found.' });
        }

        // Authorization check using populated course
        if (week.course_id.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own the course this week belongs to.' });
        }

        const { title, content_type, content, order, is_quiz = false } = req.body; // Default is_quiz to false
        if (!title || !content_type || order === undefined) {
             return res.status(400).json({ error: 'Title, content type, and order are required.' });
        }
        if (content_type === 'quiz' && content) {
             return res.status(400).json({ error: 'Quiz content should not have text in the `content` field.' });
        }
        if (content_type !== 'quiz' && is_quiz) {
             return res.status(400).json({ error: '`is_quiz` can only be true if `content_type` is "quiz".' });
        }


        const courseContent = new CourseContent({
            week_id: req.params.weekId,
            title,
            content_type,
            content: content_type === 'quiz' ? null : content, // Ensure quiz content field is null
            order,
            is_quiz: content_type === 'quiz' // Automatically set is_quiz based on type
        });

        await courseContent.save();
        res.status(201).json(courseContent);
    } catch (error) {
        console.error("Create Content Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to create course content.' });
    }
});

// Update a content item (instructor only, must own parent course)
app.put('/api/content/:id', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid content ID format.' });
        }

        const contentItem = await CourseContent.findById(req.params.id);
        if (!contentItem) {
            return res.status(404).json({ error: 'Content not found.' });
        }

        // Authorization check: Find the course via the week
        const week = await CourseWeek.findById(contentItem.week_id).populate('course_id', 'instructor_id');
        if (!week || week.course_id.instructor_id.toString() !== req.user._id.toString()) {
             // Handles cases where week is deleted or instructor doesn't own course
            return res.status(403).json({ error: 'Forbidden: You do not own the course this content belongs to.' });
        }

        // Update fields: only allow title and content to be updated via this route
        // Order changes should likely be handled by a separate reordering route
        const { title, content } = req.body;

        // Prevent changing content type or quiz status here
        if (contentItem.is_quiz && content !== undefined && content !== null) {
            return res.status(400).json({ error: 'Cannot add text content to a quiz item directly. Use quiz question routes.' });
        }

        if (title !== undefined) contentItem.title = title;
        if (content !== undefined && !contentItem.is_quiz) contentItem.content = content; // Only update if not a quiz

        await contentItem.save();
        res.json(contentItem); // Respond with updated item
    } catch (error) {
        console.error("Update Content Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to update course content.' });
    }
});

// TODO: Add DELETE /api/content/:id route (handle deleting associated quiz questions if it's a quiz)


// ========== QUIZ ROUTES ==========

// Get all questions for a specific quiz content item
app.get('/api/content/:contentId/questions', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.contentId)) {
            return res.status(400).json({ error: 'Invalid content ID format.' });
        }

        // Optional: Verify the content item exists and *is* a quiz
        const contentItem = await CourseContent.findById(req.params.contentId).select('is_quiz');
        if (!contentItem) {
            return res.status(404).json({ error: 'Content item not found.' });
        }
        if (!contentItem.is_quiz) {
            return res.status(400).json({ error: 'This content item is not a quiz.' });
        }

        const questions = await QuizQuestion.find({ content_id: req.params.contentId });
        res.json(questions);
    } catch (error) {
        console.error("Get Quiz Questions Error:", error);
        res.status(500).json({ error: 'Failed to fetch quiz questions.' });
    }
});

// Create a new question for a quiz (instructor only, must own course)
app.post('/api/content/:contentId/questions', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.contentId)) {
            return res.status(400).json({ error: 'Invalid content ID format.' });
        }

        // Verify content exists, is a quiz, and check ownership
        const contentItem = await CourseContent.findById(req.params.contentId);
        if (!contentItem) {
            return res.status(404).json({ error: 'Content item not found.' });
        }
        if (!contentItem.is_quiz) {
            return res.status(400).json({ error: 'Content item is not a quiz.' });
        }

        const week = await CourseWeek.findById(contentItem.week_id).populate('course_id', 'instructor_id');
        if (!week || week.course_id.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own the course this quiz belongs to.' });
        }

        const { question_text, options, correct_answer, points } = req.body;
        // Basic validation
        if (!question_text || !options || !Array.isArray(options) || options.length < 2 || correct_answer === undefined || correct_answer < 0 || correct_answer >= options.length) {
            return res.status(400).json({ error: 'Invalid question data. Requires question_text, options (array >= 2), and valid correct_answer index.' });
        }


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
        console.error("Create Quiz Question Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to create quiz question.' });
    }
});

// TODO: Add PUT /api/questions/:id and DELETE /api/questions/:id routes


// ========== ENROLLMENT ROUTES ==========

// Get courses the logged-in student is enrolled in
app.get('/api/enrollments/my-courses', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ user_id: req.user._id })
            // Populate necessary course details
            .populate({
                 path: 'course_id',
                 select: 'title description thumbnail instructor_id', // Select fields needed by frontend
                 populate: { path: 'instructor_id', select: 'name' } // Populate instructor name within course
             })
             // Optionally populate last accessed content/week if needed
             // .populate('current_week_id', 'title week_number')
             // .populate('current_content_id', 'title')
            .sort({ enrolledAt: -1 }); // Sort by most recent enrollment
        res.json(enrollments);
    } catch (error) {
        console.error("Get My Enrollments Error:", error);
        res.status(500).json({ error: 'Failed to fetch enrolled courses.' });
    }
});

// Enroll the logged-in student in a course
app.post('/api/enrollments', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!isValidObjectId(course_id)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Check if course exists
        const courseExists = await Course.findById(course_id).select('_id');
        if (!courseExists) {
             return res.status(404).json({ error: 'Course not found.' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            user_id: req.user._id,
            course_id
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'You are already enrolled in this course.' });
        }

        const enrollment = new Enrollment({
            user_id: req.user._id,
            course_id
        });

        await enrollment.save();

        // Populate course details before sending response
        await enrollment.populate({
            path: 'course_id',
            select: 'title description thumbnail instructor_id',
            populate: { path: 'instructor_id', select: 'name' }
        });

        res.status(201).json(enrollment);
    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).json({ error: 'Failed to enroll in course.' });
    }
});

// Get all enrollments for a specific course (instructor only, must own course)
app.get('/api/courses/:courseId/enrollments', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Verify course ownership
        const course = await Course.findById(req.params.courseId).select('instructor_id');
        if (!course) {
             return res.status(404).json({ error: 'Course not found.' });
        }
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own this course.' });
        }

        // Find enrollments and populate user details
        const enrollments = await Enrollment.find({ course_id: req.params.courseId })
            .populate('user_id', 'name email'); // Select only name and email of the user
        res.json(enrollments);
    } catch (error) {
        console.error("Get Course Enrollments Error:", error);
        res.status(500).json({ error: 'Failed to fetch course enrollments.' });
    }
});


// ========== PROGRESS ROUTES ==========

// Get all progress records for a specific enrollment
app.get('/api/enrollments/:enrollmentId/progress', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.enrollmentId)) {
            return res.status(400).json({ error: 'Invalid enrollment ID format.' });
        }

        // Verify the enrollment exists and belongs to the user OR user is instructor of the course
        const enrollment = await Enrollment.findById(req.params.enrollmentId)
                                         .populate('course_id', 'instructor_id'); // Need course instructor ID

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found.' });
        }

        // Authorization check: Allow student owner or course instructor
        const isOwner = enrollment.user_id.toString() === req.user._id.toString();
        const isCourseInstructor = req.user.role === 'instructor' && enrollment.course_id.instructor_id.toString() === req.user._id.toString();

        if (!isOwner && !isCourseInstructor) {
            return res.status(403).json({ error: 'Forbidden: You cannot view this progress.' });
        }

        const progressRecords = await Progress.find({ enrollment_id: req.params.enrollmentId });
        res.json(progressRecords);
    } catch (error) {
        console.error("Get Enrollment Progress Error:", error);
        res.status(500).json({ error: 'Failed to fetch progress records.' });
    }
});

// Create or update a progress record (mark content as complete)
app.post('/api/progress', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { enrollment_id, content_id, score } = req.body;

        if (!isValidObjectId(enrollment_id) || !isValidObjectId(content_id)) {
            return res.status(400).json({ error: 'Invalid enrollment or content ID format.' });
        }

        // Verify enrollment exists and belongs to the logged-in student
        const enrollment = await Enrollment.findById(enrollment_id);
        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found.' });
        }
        if (enrollment.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: This is not your enrollment.' });
        }

         // Verify content item exists and belongs to the enrolled course
         const contentItem = await CourseContent.findById(content_id).populate({
            path: 'week_id',
            select: 'course_id'
         });
         if (!contentItem || contentItem.week_id.course_id.toString() !== enrollment.course_id.toString()) {
             return res.status(400).json({ error: 'Content item does not belong to the enrolled course.' });
         }


        // Find existing progress or create new one
        let progress = await Progress.findOne({ enrollment_id, content_id });

        if (progress) {
             // Allow updating score if already completed (e.g., retaking quiz)
            progress.completed = true;
            if (score !== undefined) progress.score = score; // Update score if provided
            progress.completedAt = Date.now();
        } else {
            progress = new Progress({
                enrollment_id,
                content_id,
                completed: true,
                score, // score might be null if not a quiz
                completedAt: Date.now()
            });
        }

        await progress.save();

        // --- Recalculate and update enrollment progress percentage ---
        const weeksInCourse = await CourseWeek.find({ course_id: enrollment.course_id }).select('_id');
        const weekIds = weeksInCourse.map(w => w._id);
        const totalContentCount = await CourseContent.countDocuments({ week_id: { $in: weekIds } });
        const completedProgressCount = await Progress.countDocuments({ enrollment_id: enrollment._id, completed: true });

        enrollment.progress_percentage = totalContentCount > 0
            ? Math.round((completedProgressCount / totalContentCount) * 100)
            : 0;

        // Optionally update current content/week tracker
        enrollment.current_content_id = content_id;
        enrollment.current_week_id = contentItem.week_id._id;

        await enrollment.save();
        // --- End recalculation ---

        res.json(progress); // Respond with the updated/created progress record
    } catch (error) {
        console.error("Mark Complete Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to update progress.' });
    }
});


// ========== ASSIGNMENT ROUTES ==========

// Get all assignments for a specific course
app.get('/api/courses/:courseId/assignments', authMiddleware, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Verify course exists (optional)
        const courseExists = await Course.findById(req.params.courseId).select('_id');
        if (!courseExists) {
             return res.status(404).json({ error: 'Course not found.' });
        }

        const assignments = await Assignment.find({ course_id: req.params.courseId }).sort('due_date'); // Sort by due date
        res.json(assignments);
    } catch (error) {
        console.error("Get Course Assignments Error:", error);
        res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
});

// Create a new assignment for a course (instructor only, must own course)
app.post('/api/assignments', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        const { course_id, title, description, due_date, total_points } = req.body;

        if (!isValidObjectId(course_id)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }
        if (!title || !due_date) {
            return res.status(400).json({ error: 'Course ID, title, and due date are required.' });
        }

        // Verify course ownership
        const course = await Course.findById(course_id).select('instructor_id');
        if (!course) {
             return res.status(404).json({ error: 'Course not found.' });
        }
        if (course.instructor_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own this course.' });
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
        console.error("Create Assignment Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to create assignment.' });
    }
});

// TODO: Add PUT /api/assignments/:id and DELETE /api/assignments/:id routes


// ========== SUBMISSION ROUTES ==========

// Get submissions for the logged-in student
app.get('/api/submissions/my-submissions', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const submissions = await Submission.find({ user_id: req.user._id })
            // Populate assignment details needed by frontend
            .populate({
                path: 'assignment_id',
                select: 'title due_date total_points course_id', // Add course_id
                 populate: { // Populate course title within assignment
                     path: 'course_id',
                     select: 'title'
                 }
            })
            .sort({ submittedAt: -1 }); // Sort by most recent submission
        res.json(submissions);
    } catch (error) {
        console.error("Get My Submissions Error:", error);
        res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
});

// Create a new submission (submit an assignment)
app.post('/api/submissions', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { assignment_id } = req.body; // Assuming file/content handled separately or linked

        if (!isValidObjectId(assignment_id)) {
            return res.status(400).json({ error: 'Invalid assignment ID format.' });
        }

        // Verify assignment exists
        const assignmentExists = await Assignment.findById(assignment_id).select('_id');
        if (!assignmentExists) {
             return res.status(404).json({ error: 'Assignment not found.' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            assignment_id,
            user_id: req.user._id
        });
        if (existingSubmission) {
             // Decide on policy: allow resubmission or forbid? Forbid for now.
             return res.status(400).json({ error: 'You have already submitted this assignment.' });
        }


        // TODO: Handle actual file uploads or content submission here if needed

        const submission = new Submission({
            assignment_id,
            user_id: req.user._id,
            status: 'Submitted', // Mark as submitted immediately
            submittedAt: Date.now()
        });

        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        console.error("Create Submission Error:", error);
        res.status(500).json({ error: 'Failed to submit assignment.' });
    }
});

// Grade a submission (instructor only, must own course)
app.put('/api/submissions/:id/grade', authMiddleware, authorizeRole('instructor'), async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid submission ID format.' });
        }

        // Find submission and populate assignment->course to check ownership
        const submission = await Submission.findById(req.params.id)
            .populate({
                path: 'assignment_id',
                select: 'course_id',
                populate: {
                    path: 'course_id',
                    select: 'instructor_id'
                }
            });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found.' });
        }
        // Safely access nested instructor ID
        const instructorId = submission.assignment_id?.course_id?.instructor_id;
        if (!instructorId || instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden: You do not own the course for this submission.' });
        }

        const { grade, feedback } = req.body;
        // Basic validation for grade
        if (grade === undefined || grade === null || typeof grade !== 'number') {
            return res.status(400).json({ error: 'Valid grade is required.' });
        }

        submission.grade = grade;
        submission.feedback = feedback || ''; // Allow empty feedback
        submission.status = 'Graded';

        await submission.save();
        res.json(submission); // Respond with the graded submission
    } catch (error) {
        console.error("Grade Submission Error:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
         }
        res.status(500).json({ error: 'Failed to grade submission.' });
    }
});


// ========== ANALYTICS ROUTES ==========

app.get('/api/analytics/student/summary', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const studentId = req.user._id;

        // 1. Find all enrollments for the student
        const enrollments = await Enrollment.find({ user_id: studentId }).select('_id course_id');
        const enrollmentIds = enrollments.map(e => e._id);

         // Default response if no enrollments
        const defaultResponse = {
            coursesEnrolled: 0,
            averageScore: null,
            areasForImprovement: [],
            studyHours: [], // Keep dummy data structure
            gradeDistribution: [] // Keep dummy data structure
        };

        if (!enrollments.length) {
            return res.json(defaultResponse);
        }

        // 2. Find all completed quiz progress records
        const quizProgress = await Progress.find({
            enrollment_id: { $in: enrollmentIds },
            completed: true,
            score: { $exists: true } // Score must exist
        }).populate({
            path: 'content_id',
            match: { is_quiz: true }, // Ensure it's a quiz
            select: '_id is_quiz' // Select only necessary fields
        });

        // Filter out items where content_id was null (not a quiz) or didn't populate
        const completedQuizzes = quizProgress.filter(p => p.content_id);

        let averageScore = null;
        const tagFrequency = {};
        let areasForImprovement = [];

        if (completedQuizzes.length > 0) {
            // 3. Calculate Average Score (assuming score is 0-100)
             let totalScore = 0;
             let totalPossiblePoints = 0; // Or calculate based on actual question points if available

             // For simplicity, let's assume score is already a percentage 0-100
             completedQuizzes.forEach(p => { totalScore += p.score });
             averageScore = Math.round(totalScore / completedQuizzes.length);

            // 4. Identify Weak Areas (Simplified: score < 70)
            const lowScoringContentIds = completedQuizzes
                .filter(p => p.score < 70)
                .map(p => p.content_id._id); // Get the _id directly

             if (lowScoringContentIds.length > 0) {
                 // Fetch tags ONLY from questions associated with low-scoring quizzes
                 const lowScoreQuestions = await QuizQuestion.find({
                     content_id: { $in: lowScoringContentIds },
                     tags: { $exists: true, $ne: [] } // Ensure tags exist and are not empty
                 }).select('tags');

                 lowScoreQuestions.forEach(q => {
                     q.tags.forEach(tag => {
                         tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
                     });
                 });

                 // 5. Sort tags by frequency and get top N
                 const sortedTags = Object.entries(tagFrequency)
                     .sort(([, a], [, b]) => b - a) // Sort by count descending
                     .map(([tag]) => tag); // Get only the tag name

                 areasForImprovement = sortedTags.slice(0, 5); // Get top 5 weak areas
             }
        }

        // 6. Prepare response (Keep dummy data for graphs for simplicity now)
        const dummyStudyHours = [
            { name: 'Mon', hours: Math.random() * 8 }, { name: 'Tue', hours: Math.random() * 8 },
            { name: 'Wed', hours: Math.random() * 8 }, { name: 'Thu', hours: Math.random() * 8 },
            { name: 'Fri', hours: Math.random() * 8 }, { name: 'Sat', hours: Math.random() * 8 },
            { name: 'Sun', hours: Math.random() * 8 }
        ].map(d => ({ ...d, hours: parseFloat(d.hours.toFixed(1)) }));

        const dummyGrades = [
             { name: 'A', value: Math.floor(Math.random() * 5) },
             { name: 'B', value: Math.floor(Math.random() * 10) },
             { name: 'C', value: Math.floor(Math.random() * 3) },
             { name: 'Pending', value: Math.floor(Math.random() * 4) }
         ];


        res.json({
            coursesEnrolled: enrollments.length,
            averageScore: averageScore, // Can be null
            areasForImprovement: areasForImprovement,
            studyHours: dummyStudyHours,
            gradeDistribution: dummyGrades
        });

    } catch (error) {
        console.error("Error fetching student analytics:", error);
        res.status(500).json({ error: 'Failed to fetch analytics summary.' });
    }
});


// --- Global Error Handler (Optional but Recommended) ---
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

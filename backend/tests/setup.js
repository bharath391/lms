// ===== tests/setup.js =====
// Test database setup and teardown
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Connect to in-memory database before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

// Clear all test data after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Disconnect and close connection after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// ===== tests/auth.test.js =====
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('./setup');

// Import your app (you'll need to export app from server.js)
// For now, we'll create a minimal test app
const app = express();
app.use(express.json());

// Import models
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String
}));

// Import your routes or create minimal versions
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();
        const token = jwt.sign({ userId: user._id }, 'test-secret', { expiresIn: '7d' });
        res.status(201).json({
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login route
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
        const token = jwt.sign({ userId: user._id }, 'test-secret', { expiresIn: '7d' });
        res.json({
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

describe('Auth API Tests', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new student user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Student',
                    email: 'student@test.com',
                    password: 'password123',
                    role: 'student'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'student@test.com');
            expect(response.body.user).toHaveProperty('role', 'student');
        });

        it('should register a new instructor user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Instructor',
                    email: 'instructor@test.com',
                    password: 'password123',
                    role: 'instructor'
                });

            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('instructor');
        });

        it('should not register duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'duplicate@test.com',
                    password: 'password123',
                    role: 'student'
                });

            // Try to register again with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Another User',
                    email: 'duplicate@test.com',
                    password: 'password456',
                    role: 'student'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user before each login test
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Login Test User',
                    email: 'login@test.com',
                    password: 'password123',
                    role: 'student'
                });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'login@test.com');
        });

        it('should not login with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@test.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
    });
});

// ===== tests/courses.test.js =====
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('./setup');

const app = express();
app.use(express.json());

// Models
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String
}));

const Course = mongoose.model('Course', new mongoose.Schema({
    title: String,
    description: String,
    thumbnail: String,
    instructor_id: mongoose.Schema.Types.ObjectId
}));

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authentication required' });
        
        const decoded = jwt.verify(token, 'test-secret');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'User not found' });
        
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

// Routes
app.get('/api/courses', authMiddleware, async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor_id', 'name email');
        res.json(courses);
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

app.get('/api/courses/:id', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

describe('Course API Tests', () => {
    let studentToken, instructorToken, instructorId, courseId;

    beforeEach(async () => {
        // Create student user
        const studentRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Student',
                email: 'student@test.com',
                password: 'password123',
                role: 'student'
            });
        studentToken = studentRes.body.token;

        // Create instructor user
        const instructorRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Instructor',
                email: 'instructor@test.com',
                password: 'password123',
                role: 'instructor'
            });
        instructorToken = instructorRes.body.token;
        instructorId = instructorRes.body.user.id;
    });

    describe('POST /api/courses', () => {
        it('should create a course as instructor', async () => {
            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Test Course',
                    description: 'Test Description',
                    thumbnail: 'https://test.com/image.jpg'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('title', 'Test Course');
            expect(response.body).toHaveProperty('instructor_id');
            courseId = response.body._id;
        });

        it('should not create course as student', async () => {
            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'Test Course',
                    description: 'Test Description'
                });

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Access denied');
        });

        it('should not create course without authentication', async () => {
            const response = await request(app)
                .post('/api/courses')
                .send({
                    title: 'Test Course',
                    description: 'Test Description'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/courses', () => {
        beforeEach(async () => {
            // Create some test courses
            await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Course 1',
                    description: 'Description 1'
                });

            await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Course 2',
                    description: 'Description 2'
                });
        });

        it('should get all courses as authenticated user', async () => {
            const response = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        it('should not get courses without authentication', async () => {
            const response = await request(app)
                .get('/api/courses');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/courses/:id', () => {
        beforeEach(async () => {
            const courseRes = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Single Course',
                    description: 'Single Description'
                });
            courseId = courseRes.body._id;
        });

        it('should get course by id', async () => {
            const response = await request(app)
                .get(`/api/courses/${courseId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title', 'Single Course');
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/courses/${fakeId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Course not found');
        });
    });
});

// ===== tests/enrollments.test.js =====
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('./setup');

const app = express();
app.use(express.json());

// Models
const User = mongoose.model('User');
const Course = mongoose.model('Course');
const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    course_id: mongoose.Schema.Types.ObjectId,
    progress_percentage: { type: Number, default: 0 }
}));

// Routes
app.post('/api/enrollments', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const { course_id } = req.body;
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
        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/enrollments/my-courses', authMiddleware, authorizeRole('student'), async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ user_id: req.user._id })
            .populate('course_id');
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

describe('Enrollment API Tests', () => {
    let studentToken, instructorToken, courseId;

    beforeEach(async () => {
        // Create users
        const studentRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Student',
                email: 'student@test.com',
                password: 'password123',
                role: 'student'
            });
        studentToken = studentRes.body.token;

        const instructorRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Instructor',
                email: 'instructor@test.com',
                password: 'password123',
                role: 'instructor'
            });
        instructorToken = instructorRes.body.token;

        // Create a course
        const courseRes = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Test Course',
                description: 'Test Description'
            });
        courseId = courseRes.body._id;
    });

    describe('POST /api/enrollments', () => {
        it('should enroll student in course', async () => {
            const response = await request(app)
                .post('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ course_id: courseId });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('course_id', courseId);
            expect(response.body).toHaveProperty('progress_percentage', 0);
        });

        it('should not enroll twice in same course', async () => {
            // First enrollment
            await request(app)
                .post('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ course_id: courseId });

            // Try to enroll again
            const response = await request(app)
                .post('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ course_id: courseId });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Already enrolled');
        });
    });

    describe('GET /api/enrollments/my-courses', () => {
        it('should get student enrollments', async () => {
            // Enroll in course
            await request(app)
                .post('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ course_id: courseId });

            const response = await request(app)
                .get('/api/enrollments/my-courses')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });
    });
});

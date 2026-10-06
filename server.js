const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_management_db';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files (index.html, style.css, script.js)
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully.');
  })
  .catch((err) => {
    console.error(`[MongoDB] Connection error:`, err.message);
  });

// Student Schema & Model
const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    department: {
      type: String,
      required: [true, 'Department/Course is required'],
      trim: true,
    },
    year: {
      type: String,
      default: '1st Year',
    },
    semester: {
      type: String,
      default: 'Semester 1',
    },
    gpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Graduated', 'Suspended'],
      default: 'Active',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

// Course Schema & Model
const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: 1,
      max: 6,
      default: 3,
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },
    semester: {
      type: String,
      default: 'Semester 1',
    },
    schedule: {
      type: String,
      trim: true,
      default: 'Mon, Wed 10:00 AM - 11:30 AM',
    },
    capacity: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ['Active', 'Upcoming', 'Archived'],
      default: 'Active',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

// Attendance Schema & Model
const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
      uppercase: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student Name is required'],
      trim: true,
    },
    studentAvatar: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    courseCode: {
      type: String,
      required: [true, 'Course Code is required'],
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      default: '',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      default: 'Present',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, courseCode: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

const VALID_SORT_FIELDS = new Set(['createdAt', 'fullName', 'studentId', 'gpa', 'department', 'status']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQueryFilters(rawValue, acceptedValues = []) {
  if (typeof rawValue !== 'string') return null;
  const value = rawValue.trim();
  if (!value) return null;
  const normalized = value.toLowerCase();

  if (acceptedValues.includes(value) || acceptedValues.includes(value.toLowerCase())) {
    return value;
  }

  if (normalized === 'all' || normalized === 'all departments' || normalized === 'all statuses') {
    return null;
  }

  return value;
}

// Authentication Demo Users
const AUTH_USERS = [
  {
    id: 'user_admin_001',
    username: 'admin',
    email: 'admin@edupulse.edu',
    password: 'admin123',
    name: 'Dr. alwin',
    role: 'Administrator',
    department: 'Central Administration',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT20GS245KdwsZIatil6jDLTKWXov_N2776oFdEgVl0Uw&s'
  },
  {
    id: 'user_staff_002',
    username: 'staff',
    email: 'staff@edupulse.edu',
    password: 'staff123',
    name: 'Prof. Marcus Chen',
    role: 'Faculty Staff',
    department: 'Academic Affairs',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
];

// API Routes

// 0. Authentication Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  const user = AUTH_USERS.find(
    (u) =>
      (u.username.toLowerCase() === String(username).toLowerCase().trim() ||
       u.email.toLowerCase() === String(username).toLowerCase().trim()) &&
      u.password === String(password)
  );

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials. You can use Admin (admin / admin123) or Staff (staff / staff123).',
    });
  }

  const { password: _, ...safeUser } = user;
  const token = `token_${safeUser.id}_${Date.now()}`;
  res.json({
    message: 'Login successful',
    token,
    user: safeUser,
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const safeUser = { ...AUTH_USERS[0] };
  delete safeUser.password;
  res.json({ user: safeUser });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// 1. Health check & DB status
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({
    status: 'ok',
    database: states[dbState] || 'Unknown',
    uptime: process.uptime(),
  });
});

// 2. Dashboard Statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    const inactiveStudents = await Student.countDocuments({ status: 'Inactive' });
    const graduatedStudents = await Student.countDocuments({ status: 'Graduated' });

    // Distinct departments count
    const departments = await Student.distinct('department');

    // Average GPA
    const gpaAgg = await Student.aggregate([
      { $match: { gpa: { $gt: 0 } } },
      { $group: { _id: null, avgGpa: { $avg: '$gpa' } } },
    ]);
    const avgGpa = gpaAgg.length > 0 ? gpaAgg[0].avgGpa.toFixed(2) : '0.00';

    res.json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      departmentCount: departments.length,
      avgGpa,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get all students with filter, search, sort
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get('/api/students', async (req, res) => {
  try {
    const { search, department, status, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};
    const safeSortBy = typeof sortBy === 'string' && VALID_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    const safeOrder = typeof order === 'string' && VALID_SORT_ORDERS.has(order.toLowerCase()) ? order.toLowerCase() : 'desc';

    if (typeof search === 'string' && search.trim()) {
      const sanitizedSearch = escapeRegExp(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query.$or = [
        { fullName: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const normalizedDepartment = normalizeQueryFilters(department);
    const normalizedStatus = normalizeQueryFilters(status);

    if (normalizedDepartment) {
      query.department = normalizedDepartment;
    }

    if (normalizedStatus) {
      query.status = normalizedStatus;
    }

    const sortOption = {};
    sortOption[safeSortBy] = safeOrder === 'asc' ? 1 : -1;

    const students = await Student.find(query).sort(sortOption);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get single student
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Invalid Student ID or server error' });
  }
});

// 5. Create new student
app.post('/api/students', async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      email,
      phone,
      dob,
      gender,
      department,
      year,
      semester,
      gpa,
      status,
      address,
      avatar,
    } = req.body;

    const normalizedStudentId = normalizeText(studentId);
    const normalizedFullName = normalizeText(fullName);
    const normalizedEmail = normalizeText(email);
    const normalizedPhone = normalizeText(phone);
    const normalizedDepartment = normalizeText(department);

    if (!normalizedStudentId || !normalizedFullName || !normalizedEmail || !normalizedPhone || !normalizedDepartment) {
      return res.status(400).json({
        error: 'Student ID, full name, email, phone, and department are required.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    // Check duplicate studentId or email
    const existingStudent = await Student.findOne({
      $or: [
        { studentId: normalizedStudentId.toUpperCase() },
        { email: normalizedEmail.toLowerCase() },
      ],
    });

    if (existingStudent) {
      if (existingStudent.studentId.toUpperCase() === normalizedStudentId.toUpperCase()) {
        return res.status(400).json({ error: `Student ID "${normalizedStudentId}" is already registered.` });
      }
      if (existingStudent.email.toLowerCase() === normalizedEmail.toLowerCase()) {
        return res.status(400).json({ error: `Email address "${normalizedEmail}" is already in use.` });
      }
    }

    const newStudent = new Student({
      studentId: normalizedStudentId.toUpperCase(),
      fullName: normalizedFullName,
      email: normalizedEmail.toLowerCase(),
      phone: normalizedPhone,
      dob: normalizeText(dob),
      gender,
      department: normalizedDepartment,
      year,
      semester,
      gpa: Number(gpa) || 0,
      status: status || 'Active',
      address: address ? normalizeText(address) : '',
      avatar: avatar ? String(avatar).trim() : '',
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

// 6. Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (typeof updateData.studentId === 'string') {
      updateData.studentId = normalizeText(updateData.studentId).toUpperCase();
      if (!updateData.studentId) {
        return res.status(400).json({ error: 'Student ID cannot be empty.' });
      }
      const duplicateId = await Student.findOne({
        studentId: updateData.studentId,
        _id: { $ne: id },
      });
      if (duplicateId) {
        return res.status(400).json({ error: `Student ID "${updateData.studentId}" is already in use.` });
      }
    }

    if (typeof updateData.email === 'string') {
      updateData.email = normalizeText(updateData.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      const duplicateEmail = await Student.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });
      if (duplicateEmail) {
        return res.status(400).json({ error: `Email "${updateData.email}" is already in use.` });
      }
    }

    if (typeof updateData.fullName === 'string') {
      updateData.fullName = normalizeText(updateData.fullName);
      if (!updateData.fullName) {
        return res.status(400).json({ error: 'Full name cannot be empty.' });
      }
    }

    if (typeof updateData.department === 'string') {
      updateData.department = normalizeText(updateData.department);
      if (!updateData.department) {
        return res.status(400).json({ error: 'Department cannot be empty.' });
      }
    }

    if (typeof updateData.phone === 'string') {
      updateData.phone = normalizeText(updateData.phone);
      if (!updateData.phone) {
        return res.status(400).json({ error: 'Phone number cannot be empty.' });
      }
    }

    if (updateData.gpa !== undefined) {
      updateData.gpa = Number(updateData.gpa) || 0;
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(updatedStudent);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

// 7. Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: `Student ${student.fullName} (${student.studentId}) successfully deleted.` });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting student' });
  }
});

// ============================================================================
// Courses Routes
// ============================================================================
app.get('/api/courses', async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const query = {};

    if (typeof search === 'string' && search.trim()) {
      const reg = new RegExp(escapeRegExp(search.trim()), 'i');
      query.$or = [{ courseCode: reg }, { courseName: reg }, { instructor: reg }];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const courses = await Course.find(query).sort({ courseCode: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Invalid Course ID' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      department,
      credits,
      instructor,
      semester,
      schedule,
      capacity,
      status,
      description,
    } = req.body;

    const normCode = normalizeText(courseCode).toUpperCase();
    const normName = normalizeText(courseName);
    const normDept = normalizeText(department);
    const normInst = normalizeText(instructor);

    if (!normCode || !normName || !normDept || !normInst) {
      return res.status(400).json({ error: 'Course code, name, department, and instructor are required.' });
    }

    const existing = await Course.findOne({ courseCode: normCode });
    if (existing) {
      return res.status(400).json({ error: `Course code "${normCode}" already exists.` });
    }

    const newCourse = new Course({
      courseCode: normCode,
      courseName: normName,
      department: normDept,
      credits: Number(credits) || 3,
      instructor: normInst,
      semester: semester || 'Semester 1',
      schedule: schedule ? normalizeText(schedule) : 'Mon, Wed 10:00 AM - 11:30 AM',
      capacity: Number(capacity) || 60,
      status: status || 'Active',
      description: description ? normalizeText(description) : '',
    });

    const saved = await newCourse.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.courseCode) {
      updateData.courseCode = normalizeText(updateData.courseCode).toUpperCase();
      const duplicate = await Course.findOne({ courseCode: updateData.courseCode, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ error: `Course code "${updateData.courseCode}" is already in use.` });
      }
    }

    if (updateData.credits) updateData.credits = Number(updateData.credits) || 3;
    if (updateData.capacity) updateData.capacity = Number(updateData.capacity) || 60;

    const updated = await Course.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: 'Course not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: `Course ${deleted.courseCode} successfully deleted.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Attendance Routes
// ============================================================================
app.get('/api/attendance', async (req, res) => {
  try {
    const { date, courseCode, department, status, studentId, search } = req.query;
    const query = {};

    if (date) query.date = date;
    if (courseCode && courseCode !== 'All') query.courseCode = courseCode.toUpperCase();
    if (department && department !== 'All') query.department = department;
    if (status && status !== 'All') query.status = status;
    if (studentId) query.studentId = studentId.toUpperCase();

    if (search && search.trim()) {
      const reg = new RegExp(escapeRegExp(search.trim()), 'i');
      query.$or = [{ studentName: reg }, { studentId: reg }, { courseCode: reg }];
    }

    const records = await Attendance.find(query).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const totalRecords = await Attendance.countDocuments();
    const totalPresent = await Attendance.countDocuments({ status: 'Present' });
    const totalAbsent = await Attendance.countDocuments({ status: 'Absent' });
    const totalLate = await Attendance.countDocuments({ status: 'Late' });
    const totalExcused = await Attendance.countDocuments({ status: 'Excused' });

    const attendanceRate = totalRecords > 0
      ? (((totalPresent + totalLate * 0.5) / totalRecords) * 100).toFixed(1)
      : '100.0';

    const todayTotal = await Attendance.countDocuments({ date: today });
    const todayPresent = await Attendance.countDocuments({ date: today, status: 'Present' });
    const todayAbsent = await Attendance.countDocuments({ date: today, status: 'Absent' });
    const todayLate = await Attendance.countDocuments({ date: today, status: 'Late' });
    const todayExcused = await Attendance.countDocuments({ date: today, status: 'Excused' });

    res.json({
      totalRecords,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      attendanceRate,
      today: {
        date: today,
        total: todayTotal,
        present: todayPresent,
        absent: todayAbsent,
        late: todayLate,
        excused: todayExcused,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { studentId, studentName, studentAvatar, department, courseCode, courseName, date, status, remarks } = req.body;

    if (!studentId || !courseCode || !date) {
      return res.status(400).json({ error: 'Student ID, course code, and date are required.' });
    }

    const filter = {
      studentId: studentId.toUpperCase(),
      courseCode: courseCode.toUpperCase(),
      date,
    };

    const update = {
      studentId: studentId.toUpperCase(),
      studentName: studentName || 'Student',
      studentAvatar: studentAvatar || '',
      department: department || '',
      courseCode: courseCode.toUpperCase(),
      courseName: courseName || '',
      date,
      status: status || 'Present',
      remarks: remarks || '',
    };

    const record = await Attendance.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: 'after',
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/batch', async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required.' });
    }

    const savedRecords = [];
    for (const item of records) {
      if (!item.studentId || !item.courseCode || !item.date) continue;
      const filter = {
        studentId: item.studentId.toUpperCase(),
        courseCode: item.courseCode.toUpperCase(),
        date: item.date,
      };
      const update = {
        ...item,
        studentId: item.studentId.toUpperCase(),
        courseCode: item.courseCode.toUpperCase(),
      };
      const saved = await Attendance.findOneAndUpdate(filter, update, {
        upsert: true,
        returnDocument: 'after',
      });
      savedRecords.push(saved);
    }

    res.json({ message: `Successfully saved ${savedRecords.length} attendance records.`, count: savedRecords.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'Attendance record removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Reports & Analytics Route
// ============================================================================
app.get('/api/reports/summary', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    const inactiveStudents = await Student.countDocuments({ status: 'Inactive' });
    const graduatedStudents = await Student.countDocuments({ status: 'Graduated' });
    const suspendedStudents = await Student.countDocuments({ status: 'Suspended' });

    const gpaAgg = await Student.aggregate([
      { $match: { gpa: { $gt: 0 } } },
      { $group: { _id: null, avgGpa: { $avg: '$gpa' } } },
    ]);
    const avgGpa = gpaAgg.length > 0 ? gpaAgg[0].avgGpa.toFixed(2) : '0.00';

    const deansList = await Student.countDocuments({ gpa: { $gte: 3.8 } });
    const goodStanding = await Student.countDocuments({ gpa: { $gte: 3.0, $lt: 3.8 } });
    const averageStanding = await Student.countDocuments({ gpa: { $gte: 2.0, $lt: 3.0 } });
    const atRiskGpa = await Student.countDocuments({ gpa: { $lt: 2.0 } });

    const deptAgg = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          studentCount: { $sum: 1 },
          avgGpa: { $avg: '$gpa' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
          },
        },
      },
      { $sort: { studentCount: -1 } },
    ]);

    const departments = deptAgg.map((d) => ({
      department: d._id || 'Unassigned',
      studentCount: d.studentCount,
      avgGpa: d.avgGpa ? d.avgGpa.toFixed(2) : '0.00',
      activeCount: d.activeCount,
      sharePercentage: totalStudents > 0 ? ((d.studentCount / totalStudents) * 100).toFixed(1) : 0,
    }));

    const totalAttendance = await Attendance.countDocuments();
    const totalPresent = await Attendance.countDocuments({ status: 'Present' });
    const totalAbsent = await Attendance.countDocuments({ status: 'Absent' });
    const totalLate = await Attendance.countDocuments({ status: 'Late' });
    const totalExcused = await Attendance.countDocuments({ status: 'Excused' });
    const attendanceRate = totalAttendance > 0
      ? (((totalPresent + totalLate * 0.5) / totalAttendance) * 100).toFixed(1)
      : '100.0';

    const topPerformers = await Student.find({ gpa: { $gt: 0 } })
      .sort({ gpa: -1 })
      .limit(5)
      .select('studentId fullName department gpa avatar status email');

    const atRiskStudents = await Student.find({ gpa: { $gt: 0, $lt: 2.5 } })
      .sort({ gpa: 1 })
      .limit(6)
      .select('studentId fullName department gpa avatar status email phone');

    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'Active' });
    const distinctInstructors = await Course.distinct('instructor');

    res.json({
      metrics: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        graduatedStudents,
        suspendedStudents,
        avgGpa,
        attendanceRate,
        totalCourses,
        activeCourses,
        totalInstructors: distinctInstructors.length,
      },
      gpaTiers: {
        deansList,
        goodStanding,
        averageStanding,
        atRiskGpa,
      },
      attendanceBreakdown: {
        total: totalAttendance,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
        rate: attendanceRate,
      },
      departments,
      topPerformers,
      atRiskStudents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Seed sample data route (Students, Courses, Attendance)
app.post('/api/seed', async (req, res) => {
  try {
    const sampleStudents = [
      {
        studentId: 'STU-2024-001',
        fullName: 'Alex Johnson',
        email: 'alex.johnson@university.edu',
        phone: '+1 555-019-2834',
        dob: '2003-04-15',
        gender: 'Male',
        department: 'Computer Science',
        year: '3rd Year',
        semester: 'Semester 5',
        gpa: 3.85,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        address: '742 Evergreen Terrace, Springfield',
      },
      {
        studentId: 'STU-2024-002',
        fullName: 'Sophia Martinez',
        email: 'sophia.m@university.edu',
        phone: '+1 555-014-9981',
        dob: '2004-09-21',
        gender: 'Female',
        department: 'Electrical Engineering',
        year: '2nd Year',
        semester: 'Semester 3',
        gpa: 3.92,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        address: '124 Conch Street, Pacific City',
      },
      {
        studentId: 'STU-2024-003',
        fullName: 'Liam Patel',
        email: 'liam.patel@university.edu',
        phone: '+1 555-017-4423',
        dob: '2002-12-05',
        gender: 'Male',
        department: 'Information Technology',
        year: '4th Year',
        semester: 'Semester 7',
        gpa: 3.65,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        address: '42 Wallaby Way, Sydney Park',
      },
      {
        studentId: 'STU-2024-004',
        fullName: 'Emma Watson',
        email: 'emma.watson@university.edu',
        phone: '+1 555-018-7721',
        dob: '2003-01-18',
        gender: 'Female',
        department: 'Business Administration',
        year: '3rd Year',
        semester: 'Semester 6',
        gpa: 3.78,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
        address: '221B Baker St, London Row',
      },
      {
        studentId: 'STU-2024-005',
        fullName: 'Marcus Vance',
        email: 'marcus.v@university.edu',
        phone: '+1 555-013-6612',
        dob: '2001-08-30',
        gender: 'Male',
        department: 'Mechanical Engineering',
        year: '4th Year',
        semester: 'Semester 8',
        gpa: 3.45,
        status: 'Graduated',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        address: '10 Downing Court, Metro City',
      },
      {
        studentId: 'STU-2024-006',
        fullName: 'Chloe Bennett',
        email: 'chloe.b@university.edu',
        phone: '+1 555-012-3345',
        dob: '2005-03-11',
        gender: 'Female',
        department: 'Data Science',
        year: '1st Year',
        semester: 'Semester 2',
        gpa: 3.95,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        address: '350 Fifth Ave, Empire State',
      },
    ];

    for (const item of sampleStudents) {
      await Student.findOneAndUpdate(
        { studentId: item.studentId },
        item,
        { upsert: true, returnDocument: 'after' }
      );
    }

    // Seed Sample Courses
    const sampleCourses = [
      {
        courseCode: 'CS101',
        courseName: 'Data Structures & Algorithms',
        department: 'Computer Science',
        credits: 4,
        instructor: 'Dr. Evelyn Reed',
        semester: 'Semester 1',
        schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
        capacity: 60,
        status: 'Active',
        description: 'Comprehensive study of fundamental data structures, algorithms, and computational complexity analysis.',
      },
      {
        courseCode: 'DS201',
        courseName: 'Machine Learning & Big Data Analytics',
        department: 'Data Science',
        credits: 3,
        instructor: 'Dr. Alistair Vance',
        semester: 'Semester 2',
        schedule: 'Tue, Thu 02:00 PM - 03:30 PM',
        capacity: 50,
        status: 'Active',
        description: 'Supervised and unsupervised models, statistical regression, deep learning foundations, and data pipelines.',
      },
      {
        courseCode: 'EE301',
        courseName: 'Digital Signal Processing & IoT',
        department: 'Electrical Engineering',
        credits: 4,
        instructor: 'Prof. Marcus Chen',
        semester: 'Semester 3',
        schedule: 'Mon, Wed, Fri 09:00 AM - 10:00 AM',
        capacity: 45,
        status: 'Active',
        description: 'Discrete signals, Fourier analysis, digital filter architectures, and embedded microcontroller systems.',
      },
      {
        courseCode: 'IT204',
        courseName: 'Cloud Architecture & Cybersecurity',
        department: 'Information Technology',
        credits: 3,
        instructor: 'Prof. Elena Rostova',
        semester: 'Semester 4',
        schedule: 'Tue, Thu 11:00 AM - 12:30 PM',
        capacity: 55,
        status: 'Active',
        description: 'Virtualization, microservices, cloud deployments, network defense protocols, and incident response.',
      },
      {
        courseCode: 'ME105',
        courseName: 'Robotics & Mechanical Kinematics',
        department: 'Mechanical Engineering',
        credits: 4,
        instructor: 'Dr. Harrison Ford',
        semester: 'Semester 1',
        schedule: 'Wed, Fri 01:00 PM - 02:30 PM',
        capacity: 40,
        status: 'Active',
        description: 'Kinematics of robotic manipulators, actuation systems, sensors, and 3D computer-aided engineering.',
      },
      {
        courseCode: 'BA302',
        courseName: 'Strategic Leadership & Business Analytics',
        department: 'Business Administration',
        credits: 3,
        instructor: 'Dean Patricia Hayes',
        semester: 'Semester 5',
        schedule: 'Mon, Thu 03:30 PM - 05:00 PM',
        capacity: 65,
        status: 'Active',
        description: 'Quantitative decision modeling, competitive strategy, market analytics, and executive leadership.',
      },
    ];

    for (const c of sampleCourses) {
      await Course.findOneAndUpdate(
        { courseCode: c.courseCode },
        c,
        { upsert: true, returnDocument: 'after' }
      );
    }

    // Seed Sample Attendance (today and past dates)
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dayBefore = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);

    const sampleAttendance = [
      { studentId: 'STU-2024-001', studentName: 'Alex Johnson', studentAvatar: sampleStudents[0].avatar, department: 'Computer Science', courseCode: 'CS101', courseName: 'Data Structures & Algorithms', date: today, status: 'Present', remarks: 'On time' },
      { studentId: 'STU-2024-002', studentName: 'Sophia Martinez', studentAvatar: sampleStudents[1].avatar, department: 'Electrical Engineering', courseCode: 'EE301', courseName: 'Digital Signal Processing & IoT', date: today, status: 'Present', remarks: 'Active participation' },
      { studentId: 'STU-2024-003', studentName: 'Liam Patel', studentAvatar: sampleStudents[2].avatar, department: 'Information Technology', courseCode: 'IT204', courseName: 'Cloud Architecture & Cybersecurity', date: today, status: 'Late', remarks: 'Arrived 15 mins late' },
      { studentId: 'STU-2024-004', studentName: 'Emma Watson', studentAvatar: sampleStudents[3].avatar, department: 'Business Administration', courseCode: 'BA302', courseName: 'Strategic Leadership & Business Analytics', date: today, status: 'Present', remarks: 'Team lead' },
      { studentId: 'STU-2024-006', studentName: 'Chloe Bennett', studentAvatar: sampleStudents[5].avatar, department: 'Data Science', courseCode: 'DS201', courseName: 'Machine Learning & Big Data Analytics', date: today, status: 'Absent', remarks: 'Unexcused absence' },

      { studentId: 'STU-2024-001', studentName: 'Alex Johnson', studentAvatar: sampleStudents[0].avatar, department: 'Computer Science', courseCode: 'CS101', courseName: 'Data Structures & Algorithms', date: yesterday, status: 'Present', remarks: '' },
      { studentId: 'STU-2024-002', studentName: 'Sophia Martinez', studentAvatar: sampleStudents[1].avatar, department: 'Electrical Engineering', courseCode: 'EE301', courseName: 'Digital Signal Processing & IoT', date: yesterday, status: 'Present', remarks: '' },
      { studentId: 'STU-2024-003', studentName: 'Liam Patel', studentAvatar: sampleStudents[2].avatar, department: 'Information Technology', courseCode: 'IT204', courseName: 'Cloud Architecture & Cybersecurity', date: yesterday, status: 'Present', remarks: '' },
      { studentId: 'STU-2024-004', studentName: 'Emma Watson', studentAvatar: sampleStudents[3].avatar, department: 'Business Administration', courseCode: 'BA302', courseName: 'Strategic Leadership & Business Analytics', date: yesterday, status: 'Excused', remarks: 'Medical appointment' },
      { studentId: 'STU-2024-006', studentName: 'Chloe Bennett', studentAvatar: sampleStudents[5].avatar, department: 'Data Science', courseCode: 'DS201', courseName: 'Machine Learning & Big Data Analytics', date: yesterday, status: 'Present', remarks: '' },

      { studentId: 'STU-2024-001', studentName: 'Alex Johnson', studentAvatar: sampleStudents[0].avatar, department: 'Computer Science', courseCode: 'CS101', courseName: 'Data Structures & Algorithms', date: dayBefore, status: 'Present', remarks: '' },
      { studentId: 'STU-2024-002', studentName: 'Sophia Martinez', studentAvatar: sampleStudents[1].avatar, department: 'Electrical Engineering', courseCode: 'EE301', courseName: 'Digital Signal Processing & IoT', date: dayBefore, status: 'Present', remarks: '' },
      { studentId: 'STU-2024-003', studentName: 'Liam Patel', studentAvatar: sampleStudents[2].avatar, department: 'Information Technology', courseCode: 'IT204', courseName: 'Cloud Architecture & Cybersecurity', date: dayBefore, status: 'Present', remarks: '' },
    ];

    for (const a of sampleAttendance) {
      await Attendance.findOneAndUpdate(
        { studentId: a.studentId, courseCode: a.courseCode, date: a.date },
        a,
        { upsert: true, returnDocument: 'after' }
      );
    }

    res.json({
      message: 'Sample students, courses, and attendance records seeded successfully',
      studentsCount: sampleStudents.length,
      coursesCount: sampleCourses.length,
      attendanceCount: sampleAttendance.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dedicated Login Page Route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Fallback 404 for unhandled API endpoints (ensures JSON response, never HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Fallback to index.html for single-page experience
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
  res.status(500).send('An unexpected server error occurred.');
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Student Management System Server Running!`);
  console.log(` Access URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});

// SPPS (Study Plan Preparation System) - Full REST API Server
// Production-grade pure Node.js HTTP server (Node v24+)
const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const { db } = require('./db');
const { generateStudyPlan, generateTimetable } = require('./planner');
const { recordQuestionAttempt, getDashboardAnalytics } = require('./analytics');
const { parseTimeSlots, generateHowToStudyBlueprint, getBeginnerTopicGuidance, getIntermediateDiagnosticAnalysis, getRevisionProtocolGuidance } = require('./pedagogyHelper');
const { ensureExamSyllabus } = require('./syllabusGenerator');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf'
};

const PDF_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'pyq_pdfs');
if (!fs.existsSync(PDF_UPLOAD_DIR)) {
  fs.mkdirSync(PDF_UPLOAD_DIR, { recursive: true });
}

function createSamplePdf(title, examId, year) {
  const safeTitle = (title || 'Official Paper').replace(/[()\\]/g, '');
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 320 >>
stream
BT
/F1 18 Tf
50 720 Td
(SPPS - Study Plan Preparation System) Tj
/F1 14 Tf
0 -30 Td
(${safeTitle}) Tj
/F1 11 Tf
0 -25 Td
(Official Examination Paper - Year ${year}) Tj
0 -20 Td
(Target Examination: ${examId}) Tj
0 -30 Td
(Verified by SPPS Official Examination and Question Bank Team) Tj
0 -25 Td
(Authorized for Student Revision and Mock Examination Practice) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000614 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
697
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Helpers for request & response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!token) return null;

  const session = db.prepare('SELECT user_id, expires_at FROM auth_sessions WHERE token = ?').get(token);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return null;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  return user || null;
}

function requireAuth(req, res) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    sendError(res, 401, 'Unauthorized. Please sign in to access this feature.');
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    sendError(res, 403, 'Forbidden. Administrator privileges required.');
    return null;
  }
  return user;
}

// Main HTTP Router
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;
  const query = Object.fromEntries(reqUrl.searchParams.entries());

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    });
    return res.end();
  }

  try {
    // ----------------------------------------------------
    // AUTHENTICATION ROUTES
    // ----------------------------------------------------

    // Register
    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = await parseJsonBody(req);
      const { email, password, full_name, name, education_level, active_exam_id, primary_target_exam_id, target_exam_id, prep_mode, daily_hours, preferred_days } = body;
      const effectiveName = (full_name || name || '').trim();
      const effectiveExam = active_exam_id || primary_target_exam_id || target_exam_id || 'jee-main';

      if (!email || !password || !effectiveName) {
        return sendError(res, 400, 'Name, email, and password are required');
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (existing) {
        return sendError(res, 409, 'An account with this email already exists');
      }

      const userId = 'user-' + crypto.randomUUID().slice(0, 8);
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(password, salt);

      // Parse student's free study time slots
      let registeredSlotsJson = '["07:00-09:00","18:30-21:00"]';
      let computedDailyHours = 4.5;
      if (body.time_slots) {
        const parsed = parseTimeSlots(body.time_slots);
        registeredSlotsJson = JSON.stringify(parsed.slots.map(s => ({ start: s.start, end: s.end, label: s.label, days: s.days })));
        computedDailyHours = parsed.totalDailyHours;
      } else if (daily_hours) {
        computedDailyHours = parseFloat(daily_hours);
      }

      db.prepare(`
        INSERT INTO users (
          id, email, password_hash, salt, full_name, education_level, active_exam_id, prep_mode, daily_hours, time_slots, preferred_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        email.toLowerCase().trim(),
        hash,
        salt,
        effectiveName,
        education_level || 'after_12',
        effectiveExam,
        prep_mode || 'beginner',
        computedDailyHours,
        registeredSlotsJson,
        preferred_days ? JSON.stringify(preferred_days) : '["Mon","Tue","Wed","Thu","Fri","Sat"]'
      );

      // Create session token
      const token = 'spps_tok_' + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);

      // Initialize user streak profile
      db.prepare(`
        INSERT INTO user_streaks (
          user_id, current_streak, longest_streak, last_activity_date, last_streak_date,
          total_questions_solved, target_questions_per_day, consecutive_success_days,
          min_target, max_target, adaptive_target_enabled, last_target_change_reason
        ) VALUES (?, 0, 0, NULL, NULL, 0, 10, 0, 6, 20, 1, 'Starting target set to 10 questions/day')
      `).run(userId);

      // Auto generate study plan and timetable matching the student's free time slots
      const chosenExam = effectiveExam;
      try {
        const plan = generateStudyPlan(userId, chosenExam, {
          prep_mode: prep_mode || 'beginner',
          time_slots: registeredSlotsJson
        });
        generateTimetable(userId, plan.planId);
      } catch (e) {
        console.error('Plan generation failed on register:', e);
      }

      const newUser = db.prepare('SELECT id, email, full_name, education_level, active_exam_id, prep_mode, daily_hours, time_slots FROM users WHERE id = ?').get(userId);
      if (newUser && newUser.time_slots && typeof newUser.time_slots === 'string') {
        try { newUser.time_slots = JSON.parse(newUser.time_slots); } catch (e) {}
      }
      return sendJson(res, 201, { token, user: newUser });
    }

    // Login
    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await parseJsonBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (!user) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const checkHash = hashPassword(password, user.salt);
      if (checkHash !== user.password_hash) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const token = 'spps_tok_' + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

      const safeUser = { ...user };
      delete safeUser.password_hash;
      delete safeUser.salt;

      return sendJson(res, 200, { token, user: safeUser });
    }

    // Instant Demo Login (Student)
    if (method === 'POST' && pathname === '/api/auth/demo') {
      const demoUser = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@spps.edu');
      if (!demoUser) {
        return sendError(res, 500, 'Demo account not initialized');
      }

      const token = 'spps_demo_tok_' + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, demoUser.id, expiresAt);

      const safeUser = { ...demoUser };
      delete safeUser.password_hash;
      delete safeUser.salt;

      return sendJson(res, 200, { token, user: safeUser });
    }

    // Instant Admin Demo Login (Administrator)
    if (method === 'POST' && pathname === '/api/auth/admin-demo') {
      const adminUser = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get('admin@spps.edu', 'admin');
      if (!adminUser) {
        return sendError(res, 500, 'Admin demo account not initialized');
      }

      const token = 'spps_admin_tok_' + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, adminUser.id, expiresAt);

      const safeUser = { ...adminUser };
      delete safeUser.password_hash;
      delete safeUser.salt;

      return sendJson(res, 200, { token, user: safeUser });
    }

    // Get current user session
    if (method === 'GET' && (pathname === '/api/auth/me' || pathname === '/api/auth/profile')) {
      const user = requireAuth(req, res);
      if (!user) return;

      const safeUser = { ...user };
      delete safeUser.password_hash;
      delete safeUser.salt;
      if (safeUser.time_slots && typeof safeUser.time_slots === 'string') {
        try { safeUser.time_slots = JSON.parse(safeUser.time_slots); } catch (e) {}
      }
      if (safeUser.preferred_days && typeof safeUser.preferred_days === 'string') {
        try { safeUser.preferred_days = JSON.parse(safeUser.preferred_days); } catch (e) {}
      }
      if (safeUser.weak_subjects && typeof safeUser.weak_subjects === 'string') {
        try { safeUser.weak_subjects = JSON.parse(safeUser.weak_subjects); } catch (e) {}
      }

      const activeExam = user.active_exam_id ? db.prepare('SELECT * FROM exams WHERE id = ?').get(user.active_exam_id) : null;
      return sendJson(res, 200, { user: safeUser, activeExam });
    }

    // Logout
    if (method === 'POST' && pathname === '/api/auth/logout') {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/, '').trim();
        db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
      }
      return sendJson(res, 200, { message: 'Logged out successfully' });
    }

    // Update Profile & Preferences
    if ((method === 'PUT' || method === 'PATCH') && pathname === '/api/auth/profile') {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseJsonBody(req);
      const { full_name, education_level, prep_mode, daily_hours, preferred_days, time_slots, weak_subjects, target_exam_date, active_exam_id } = body;

      let updatedDailyHours = daily_hours ? parseFloat(daily_hours) : null;
      let updatedSlotsJson = null;
      if (time_slots) {
        const parsed = parseTimeSlots(time_slots);
        updatedSlotsJson = JSON.stringify(parsed.slots.map(s => ({ start: s.start, end: s.end, label: s.label, days: s.days })));
        updatedDailyHours = parsed.totalDailyHours;
      }

      db.prepare(`
        UPDATE users SET
          full_name = COALESCE(?, full_name),
          education_level = COALESCE(?, education_level),
          prep_mode = COALESCE(?, prep_mode),
          daily_hours = COALESCE(?, daily_hours),
          preferred_days = COALESCE(?, preferred_days),
          time_slots = COALESCE(?, time_slots),
          weak_subjects = COALESCE(?, weak_subjects),
          target_exam_date = COALESCE(?, target_exam_date),
          active_exam_id = COALESCE(?, active_exam_id),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        full_name || null,
        education_level || null,
        prep_mode || null,
        updatedDailyHours,
        preferred_days ? (typeof preferred_days === 'string' ? preferred_days : JSON.stringify(preferred_days)) : null,
        updatedSlotsJson,
        weak_subjects ? (typeof weak_subjects === 'string' ? weak_subjects : JSON.stringify(weak_subjects)) : null,
        target_exam_date || null,
        active_exam_id || null,
        user.id
      );

      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      delete updatedUser.password_hash;
      delete updatedUser.salt;
      if (updatedUser.time_slots && typeof updatedUser.time_slots === 'string') {
        try { updatedUser.time_slots = JSON.parse(updatedUser.time_slots); } catch (e) {}
      }
      if (updatedUser.preferred_days && typeof updatedUser.preferred_days === 'string') {
        try { updatedUser.preferred_days = JSON.parse(updatedUser.preferred_days); } catch (e) {}
      }
      if (updatedUser.weak_subjects && typeof updatedUser.weak_subjects === 'string') {
        try { updatedUser.weak_subjects = JSON.parse(updatedUser.weak_subjects); } catch (e) {}
      }

      return sendJson(res, 200, { user: updatedUser });
    }

    // ----------------------------------------------------
    // EXAMINATION DISCOVERY & SYLLABUS ROUTES
    // ----------------------------------------------------

    // Get all exams with search & filter
    if (method === 'GET' && pathname === '/api/exams') {
      const { stage, category, search, conducting_authority } = query;
      let sql = 'SELECT * FROM exams WHERE (is_archived = 0 OR is_archived IS NULL)';
      const params = [];

      if (stage && stage !== 'all') {
        sql += ' AND stage = ?';
        params.push(stage);
      }

      if (category && category !== 'all') {
        sql += ' AND category = ?';
        params.push(category);
      }

      if (conducting_authority) {
        sql += ' AND conducting_authority LIKE ?';
        params.push(`%${conducting_authority}%`);
      }

      if (search) {
        sql += ' AND (name LIKE ? OR short_name LIKE ? OR category LIKE ? OR career_field LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      sql += ' ORDER BY name ASC';
      const exams = db.prepare(sql).all(...params);

      // Attach subject & PYQ counts
      const enriched = exams.map(e => {
        const subCount = db.prepare('SELECT count(*) as c FROM subjects WHERE exam_id = ?').get(e.id).c;
        const pyqCount = db.prepare('SELECT count(*) as c FROM pyq_questions WHERE exam_id = ?').get(e.id).c;
        return {
          ...e,
          subject_count: subCount,
          pyq_count: pyqCount
        };
      });

      return sendJson(res, 200, { exams: enriched });
    }

    // Single exam details
    const examMatch = pathname.match(/^\/api\/exams\/([a-zA-Z0-9_-]+)$/);
    if (method === 'GET' && examMatch) {
      const examId = examMatch[1];
      const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
      if (!exam) return sendError(res, 404, 'Examination not found');

      ensureExamSyllabus(examId, db);

      const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
      const subjectsWithTopics = subjects.map(s => {
        const topics = db.prepare('SELECT * FROM topics WHERE subject_id = ? ORDER BY order_index ASC').all(s.id);
        return { ...s, topics };
      });

      const pyqCount = db.prepare('SELECT count(*) as c FROM pyq_questions WHERE exam_id = ?').get(examId).c;

      return sendJson(res, 200, {
        exam,
        subjects: subjectsWithTopics,
        pyq_count: pyqCount
      });
    }

    // Set Active Exam for Current User
    const selectExamMatch = pathname.match(/^\/api\/exams\/([a-zA-Z0-9_-]+)\/select$/);
    if (method === 'POST' && selectExamMatch) {
      const user = requireAuth(req, res);
      if (!user) return;

      const examId = selectExamMatch[1];
      const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
      if (!exam) return sendError(res, 404, 'Examination not found');

      ensureExamSyllabus(examId, db);

      const body = await parseJsonBody(req);
      const prepMode = body.prep_mode || user.prep_mode || 'beginner';
      const targetDate = body.target_exam_date || user.target_exam_date || null;
      const dailyHours = body.daily_hours ? parseFloat(body.daily_hours) : user.daily_hours;
      const weakSubjects = body.weak_subjects ? body.weak_subjects : [];

      // Generate customized study plan and timetable
      const planResult = generateStudyPlan(user.id, examId, {
        prep_mode: prepMode,
        target_exam_date: targetDate,
        daily_hours: dailyHours,
        weak_subjects: JSON.stringify(weakSubjects)
      });

      generateTimetable(user.id, planResult.planId);

      return sendJson(res, 200, {
        message: `Successfully set ${exam.name} as active preparation!`,
        plan: planResult
      });
    }

    // ----------------------------------------------------
    // STUDY PLAN & STUDY TASKS ROUTES
    // ----------------------------------------------------

    // Get Active Study Plan
    if (method === 'GET' && pathname === '/api/study-plan') {
      const user = requireAuth(req, res);
      if (!user) return;

      const examId = user.active_exam_id || 'jee-main';
      const plan = db.prepare("SELECT * FROM study_plans WHERE user_id = ? AND exam_id = ? AND status = 'active'").get(user.id, examId);

      if (!plan) {
        return sendJson(res, 200, { plan: null, tasks: [] });
      }

      const tasks = db.prepare(`
        SELECT t.*, s.name as subject_name, top.name as topic_name
        FROM study_tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN topics top ON t.topic_id = top.id
        WHERE t.plan_id = ?
        ORDER BY t.phase ASC, t.order_index ASC
      `).all(plan.id);

      const parsedTasks = tasks.map(t => {
        let howToStudy = null;
        try {
          howToStudy = t.how_to_study ? JSON.parse(t.how_to_study) : null;
        } catch (e) {
          howToStudy = null;
        }
        return {
          ...t,
          how_to_study: howToStudy
        };
      });

      const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
      const parsedSlots = parseTimeSlots(user.time_slots);

      return sendJson(res, 200, {
        plan,
        tasks: parsedTasks,
        exam,
        time_slots: parsedSlots.slots,
        daily_hours: user.daily_hours
      });
    }

    // Regenerate Study Plan
    if (method === 'POST' && pathname === '/api/study-plan/generate') {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseJsonBody(req);
      const examId = body.exam_id || user.active_exam_id || 'jee-main';

      const planResult = generateStudyPlan(user.id, examId, body);
      generateTimetable(user.id, planResult.planId);

      return sendJson(res, 200, {
        message: 'Personalized study plan and timetable generated successfully!',
        plan: planResult,
        daily_hours: planResult.dailyHours,
        time_slots: planResult.timeSlots
      });
    }

    // Update Task Status / Notes
    const taskMatch = pathname.match(/^\/api\/study-plan\/tasks\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PATCH' && taskMatch) {
      const user = requireAuth(req, res);
      if (!user) return;

      const taskId = taskMatch[1];
      const existingTask = db.prepare('SELECT * FROM study_tasks WHERE id = ?').get(taskId);
      if (!existingTask) return sendError(res, 404, 'Task not found');
      if (existingTask.user_id !== user.id) return sendError(res, 403, "Forbidden. Cannot modify another student's task");

      const body = await parseJsonBody(req);
      const { status, notes, due_date, priority } = body;

      const completedAt = status === 'completed' ? new Date().toISOString() : null;

      db.prepare(`
        UPDATE study_tasks SET
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          due_date = COALESCE(?, due_date),
          priority = COALESCE(?, priority),
          completed_at = COALESCE(?, completed_at)
        WHERE id = ? AND user_id = ?
      `).run(status || null, notes || null, due_date || null, priority || null, completedAt || null, taskId, user.id);

      const updatedTask = db.prepare('SELECT * FROM study_tasks WHERE id = ?').get(taskId);
      return sendJson(res, 200, { task: updatedTask });
    }

    // ----------------------------------------------------
    // TOPIC MASTERY & CATEGORY PEDAGOGY ROUTES
    // ----------------------------------------------------

    // Get Student's Topic Mastery Diagnostic (Intermediate diagnostic & gap status)
    if (method === 'GET' && pathname === '/api/topic-mastery') {
      const user = requireAuth(req, res);
      if (!user) return;

      const examId = query.exam_id || user.active_exam_id || 'jee-main';
      ensureExamSyllabus(examId, db);

      const topics = db.prepare('SELECT * FROM topics WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
      const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
      const masteryRecords = db.prepare('SELECT * FROM user_topic_mastery WHERE user_id = ? AND exam_id = ?').all(user.id, examId);

      const diagnostic = getIntermediateDiagnosticAnalysis(masteryRecords, topics, subjects);

      return sendJson(res, 200, {
        exam_id: examId,
        diagnostic,
        summary: {
          mastered: diagnostic.mastered_count,
          needs_practice: diagnostic.needs_practice_count,
          unstudied: diagnostic.unstudied_count,
          total: diagnostic.total_topics,
          percent_mastered: diagnostic.percent_mastered,
          readiness_score: diagnostic.readiness_score,
          theory_hours_saved: diagnostic.theory_hours_saved
        }
      });
    }

    // Save Student's Topic Mastery Rating (Single topic or batch ratings)
    if (method === 'POST' && pathname === '/api/topic-mastery') {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseJsonBody(req);
      const examId = body.exam_id || user.active_exam_id || 'jee-main';
      ensureExamSyllabus(examId, db);

      const ratings = Array.isArray(body.ratings)
        ? body.ratings
        : (body.topic_id ? [{ topic_id: body.topic_id, mastery_level: body.mastery_level, notes: body.notes }] : []);

      if (ratings.length === 0) {
        return sendError(res, 400, 'ratings array or topic_id is required');
      }

      const upsert = db.prepare(`
        INSERT INTO user_topic_mastery (id, user_id, topic_id, exam_id, mastery_level, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, topic_id) DO UPDATE SET
          mastery_level = excluded.mastery_level,
          notes = COALESCE(excluded.notes, user_topic_mastery.notes),
          updated_at = datetime('now')
      `);

      for (const r of ratings) {
        if (!r.topic_id) continue;
        const level = ['mastered', 'needs_practice', 'unstudied'].includes(r.mastery_level)
          ? r.mastery_level
          : 'unstudied';
        const id = 'utm-' + crypto.randomUUID().slice(0, 8);
        upsert.run(id, user.id, r.topic_id, examId, level, r.notes || null);
      }

      // Optionally regenerate plan if requested or if prep_mode is intermediate
      let planResult = null;
      if (body.regenerate_plan) {
        const targetMode = body.prep_mode || 'intermediate';
        planResult = generateStudyPlan(user.id, examId, { prep_mode: targetMode });
        generateTimetable(user.id, planResult.planId);
      }

      const topics = db.prepare('SELECT * FROM topics WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
      const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
      const updatedMastery = db.prepare('SELECT * FROM user_topic_mastery WHERE user_id = ? AND exam_id = ?').all(user.id, examId);
      const diagnostic = getIntermediateDiagnosticAnalysis(updatedMastery, topics, subjects);

      return sendJson(res, 200, {
        message: 'Topic mastery diagnostic updated successfully!',
        exam_id: examId,
        diagnostic,
        plan: planResult
      });
    }

    // Get Pedagogical Guidance for Category (Beginner Pathway, Intermediate Gap Analysis, or Revision Protocol)
    if (method === 'GET' && pathname === '/api/prep-guidance') {
      const user = requireAuth(req, res);
      if (!user) return;

      const examId = query.exam_id || user.active_exam_id || 'jee-main';
      const mode = query.mode || user.prep_mode || 'beginner';

      const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
      if (!exam) return sendError(res, 404, 'Examination not found');

      ensureExamSyllabus(examId, db);

      const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
      const topics = db.prepare('SELECT * FROM topics WHERE exam_id = ? ORDER BY order_index ASC').all(examId);

      if (mode === 'beginner') {
        const subjectMap = new Map();
        for (const s of subjects) subjectMap.set(s.id, s);

        const pathway = topics.map(t => {
          return getBeginnerTopicGuidance(t, subjectMap.get(t.subject_id), exam);
        });

        return sendJson(res, 200, {
          mode: 'beginner',
          exam: { id: exam.id, name: exam.name, short_name: exam.short_name },
          title: '🌱 Beginner Preparation Pathway & Topic Blueprints',
          overview: `Step-by-step foundational trajectory for ${exam.name}. Guides you through what to prepare for every syllabus topic, recommended hours allocation (Theory, Notes, Worked Examples, Graded Practice), and textbook pointers.`,
          topics: pathway
        });
      } else if (mode === 'intermediate') {
        const masteryRecords = db.prepare('SELECT * FROM user_topic_mastery WHERE user_id = ? AND exam_id = ?').all(user.id, examId);
        const diagnostic = getIntermediateDiagnosticAnalysis(masteryRecords, topics, subjects);

        return sendJson(res, 200, {
          mode: 'intermediate',
          exam: { id: exam.id, name: exam.name, short_name: exam.short_name },
          title: '🧠 Syllabus Topic Mastery Diagnostic & Gap Engine',
          overview: diagnostic.strategy_summary,
          diagnostic
        });
      } else {
        const protocol = getRevisionProtocolGuidance(exam, subjects, topics);

        return sendJson(res, 200, {
          mode: 'revision',
          exam: { id: exam.id, name: exam.name, short_name: exam.short_name },
          title: '🔥 All-Time Revision Protocol & High-Yield Strategy',
          overview: 'Continuous high-velocity revision engine: High-Yield Priority Matrix, 15-minute daily blind formula recall routines, and mandatory authentic PYQ marathons.',
          protocol
        });
      }
    }

    // ----------------------------------------------------
    // TIMETABLE ROUTES
    // ----------------------------------------------------

    // Get Timetable Sessions
    if (method === 'GET' && pathname === '/api/timetable') {
      const user = requireAuth(req, res);
      if (!user) return;

      const sessions = db.prepare(`
        SELECT ts.*, subj.name as subject_name, top.name as topic_name
        FROM timetable_sessions ts
        LEFT JOIN subjects subj ON ts.subject_id = subj.id
        LEFT JOIN topics top ON ts.topic_id = top.id
        WHERE ts.user_id = ?
        ORDER BY 
          CASE ts.day_of_week
            WHEN 'Mon' THEN 1
            WHEN 'Tue' THEN 2
            WHEN 'Wed' THEN 3
            WHEN 'Thu' THEN 4
            WHEN 'Fri' THEN 5
            WHEN 'Sat' THEN 6
            WHEN 'Sun' THEN 7
          END,
          ts.start_time ASC
      `).all(user.id);

      const parsedSessions = sessions.map(s => {
        let howToStudy = null;
        try {
          howToStudy = s.how_to_study ? JSON.parse(s.how_to_study) : null;
        } catch (e) {
          howToStudy = null;
        }
        return {
          ...s,
          how_to_study: howToStudy
        };
      });

      const parsedSlots = parseTimeSlots(user.time_slots);

      return sendJson(res, 200, {
        sessions: parsedSessions,
        time_slots: parsedSlots.slots,
        daily_hours: user.daily_hours
      });
    }

    // Regenerate Timetable
    if (method === 'POST' && pathname === '/api/timetable/generate') {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseJsonBody(req);
      const activePlan = db.prepare("SELECT id FROM study_plans WHERE user_id = ? AND status = 'active'").get(user.id);

      if (!activePlan) {
        return sendError(res, 400, 'Please generate a study plan first');
      }

      const result = generateTimetable(user.id, activePlan.id, body.time_slots);
      return sendJson(res, 200, { message: 'Timetable generated successfully!', result });
    }

    // Update / Reschedule Timetable Session
    const sessionMatch = pathname.match(/^\/api\/timetable\/sessions\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PATCH' && sessionMatch) {
      const user = requireAuth(req, res);
      if (!user) return;

      const sessionId = sessionMatch[1];
      const existingSession = db.prepare('SELECT * FROM timetable_sessions WHERE id = ?').get(sessionId);
      if (!existingSession) return sendError(res, 404, 'Session not found');
      if (existingSession.user_id !== user.id) return sendError(res, 403, "Forbidden. Cannot modify another student's timetable session");

      const body = await parseJsonBody(req);
      const { status, day_of_week, start_time, end_time, title, notes } = body;

      const completedAt = status === 'completed' ? new Date().toISOString() : null;

      db.prepare(`
        UPDATE timetable_sessions SET
          status = COALESCE(?, status),
          day_of_week = COALESCE(?, day_of_week),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          title = COALESCE(?, title),
          notes = COALESCE(?, notes),
          completed_at = COALESCE(?, completed_at)
        WHERE id = ? AND user_id = ?
      `).run(
        status || null, day_of_week || null, start_time || null, end_time || null,
        title || null, notes || null, completedAt || null, sessionId, user.id
      );

      const updated = db.prepare('SELECT * FROM timetable_sessions WHERE id = ?').get(sessionId);
      return sendJson(res, 200, { session: updated });
    }

    // Add Custom Timetable Session
    if (method === 'POST' && pathname === '/api/timetable/sessions') {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseJsonBody(req);
      const { day_of_week, start_time, end_time, title, activity_type, subject_id } = body;

      if (!day_of_week || !start_time || !end_time || !title) {
        return sendError(res, 400, 'Day, start time, end time, and title are required');
      }

      // 1. Calculate duration from start_time and end_time
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMinutes <= 0) durationMinutes += 24 * 60;
      durationMinutes = Math.max(15, Math.min(480, durationMinutes));

      // 2. Fetch active plan if present
      const activePlan = db.prepare("SELECT id, prep_mode FROM study_plans WHERE user_id = ? AND status = 'active'").get(user.id);
      const planId = activePlan ? activePlan.id : null;
      const prepMode = activePlan ? activePlan.prep_mode : (user.prep_mode || 'beginner');

      // 3. Generate structured execution blueprint
      const howToStudy = generateHowToStudyBlueprint(
        activity_type || 'Practice MCQs',
        durationMinutes,
        prepMode,
        title
      );

      const id = 'sess-' + crypto.randomUUID().slice(0, 8);
      db.prepare(`
        INSERT INTO timetable_sessions (
          id, user_id, plan_id, subject_id, day_of_week, start_time, end_time, title, activity_type, status, how_to_study
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
      `).run(id, user.id, planId, subject_id || null, day_of_week, start_time, end_time, title, activity_type || 'Practice MCQs', JSON.stringify(howToStudy));

      const created = db.prepare('SELECT * FROM timetable_sessions WHERE id = ?').get(id);
      if (created && created.how_to_study) {
        try { created.how_to_study = JSON.parse(created.how_to_study); } catch (e) {}
      }
      return sendJson(res, 201, { session: created });
    }

    // Delete Timetable Session
    if (method === 'DELETE' && sessionMatch) {
      const user = requireAuth(req, res);
      if (!user) return;

      const sessionId = sessionMatch[1];
      const existingSession = db.prepare('SELECT * FROM timetable_sessions WHERE id = ?').get(sessionId);
      if (!existingSession) return sendError(res, 404, 'Session not found');
      if (existingSession.user_id !== user.id) return sendError(res, 403, 'Forbidden');

      db.prepare('DELETE FROM timetable_sessions WHERE id = ? AND user_id = ?').run(sessionId, user.id);
      return sendJson(res, 200, { message: 'Session deleted' });
    }

    // ----------------------------------------------------
    // PREVIOUS-YEAR QUESTIONS (PYQ) ROUTES
    // ----------------------------------------------------

    // Search and filter PYQs
    if (method === 'GET' && pathname === '/api/pyqs') {
      const user = getAuthenticatedUser(req);
      const { exam_id, year, subject_id, topic_id, difficulty, search, bookmarked_only, mistakes_only } = query;

      let sql = `
        SELECT q.*, s.name as subject_name, t.name as topic_name, e.short_name as exam_short_name
        FROM pyq_questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        LEFT JOIN topics t ON q.topic_id = t.id
        LEFT JOIN exams e ON q.exam_id = e.id
        WHERE 1=1
      `;
      const params = [];

      if (exam_id && exam_id !== 'all' && exam_id !== 'active') {
        sql += ' AND q.exam_id = ?';
        params.push(exam_id);
      } else if (exam_id === 'active' || (!exam_id && bookmarked_only !== 'true' && mistakes_only !== 'true' && user && user.active_exam_id)) {
        sql += ' AND q.exam_id = ?';
        params.push(user.active_exam_id);
      }

      if (year && year !== 'all') {
        sql += ' AND q.year = ?';
        params.push(parseInt(year, 10));
      }

      if (subject_id && subject_id !== 'all') {
        sql += ' AND q.subject_id = ?';
        params.push(subject_id);
      }

      if (topic_id && topic_id !== 'all') {
        sql += ' AND q.topic_id = ?';
        params.push(topic_id);
      }

      if (difficulty && difficulty !== 'all') {
        sql += ' AND q.difficulty = ?';
        params.push(difficulty);
      }

      if (search) {
        sql += ' AND (q.question_text LIKE ? OR q.explanation LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (bookmarked_only === 'true' && user) {
        sql += ' AND q.id IN (SELECT question_id FROM bookmarked_questions WHERE user_id = ?)';
        params.push(user.id);
      }

      if (mistakes_only === 'true' && user) {
        sql += ' AND q.id IN (SELECT question_id FROM pyq_attempts WHERE user_id = ? AND is_correct = 0)';
        params.push(user.id);
      }

      sql += ' ORDER BY q.year DESC, q.id ASC';
      const questions = db.prepare(sql).all(...params);

      // Attach bookmark status and previous attempts if user is logged in
      const parsedQuestions = questions.map(q => {
        let isBookmarked = false;
        let lastAttempt = null;

        if (user) {
          const bm = db.prepare('SELECT id FROM bookmarked_questions WHERE user_id = ? AND question_id = ?').get(user.id, q.id);
          isBookmarked = !!bm;

          const att = db.prepare('SELECT selected_answer, is_correct, attempted_at FROM pyq_attempts WHERE user_id = ? AND question_id = ? ORDER BY attempted_at DESC LIMIT 1').get(user.id, q.id);
          lastAttempt = att || null;
        }

        return {
          ...q,
          options: q.options_json ? JSON.parse(q.options_json) : [],
          is_bookmarked: isBookmarked,
          last_attempt: lastAttempt
        };
      });

      return sendJson(res, 200, { questions: parsedQuestions });
    }

    // Get PYQ Summary Statistics (Year-Wise and Topic-Wise)
    if (method === 'GET' && pathname === '/api/pyqs/summary') {
      const user = getAuthenticatedUser(req);
      const targetExamId = query.exam_id || (user && user.active_exam_id) || 'jee-main';

      // Year-wise breakdown with attempt stats
      const years = db.prepare(`
        SELECT q.year, COUNT(q.id) as question_count,
               COUNT(a.id) as attempted_count,
               SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_count
        FROM pyq_questions q
        LEFT JOIN pyq_attempts a ON q.id = a.question_id AND a.user_id = ?
        WHERE q.exam_id = ?
        GROUP BY q.year
        ORDER BY q.year DESC
      `).all(user ? user.id : 'anon', targetExamId);

      // Topic-wise breakdown with attempt stats
      const topics = db.prepare(`
        SELECT t.id as topic_id, t.name as topic_name, t.subject_id, s.name as subject_name,
               t.weightage_tier, t.difficulty,
               COUNT(q.id) as question_count,
               COUNT(a.id) as attempted_count,
               SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_count
        FROM topics t
        JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN pyq_questions q ON q.topic_id = t.id AND q.exam_id = ?
        LEFT JOIN pyq_attempts a ON q.id = a.question_id AND a.user_id = ?
        WHERE s.exam_id = ?
        GROUP BY t.id
        ORDER BY s.order_index ASC, t.order_index ASC
      `).all(targetExamId, user ? user.id : 'anon', targetExamId);

      // Total metrics
      const totalQuestions = db.prepare('SELECT count(*) as c FROM pyq_questions WHERE exam_id = ?').get(targetExamId).c;
      let totalAttempted = 0;
      let totalCorrect = 0;
      if (user) {
        const stats = db.prepare(`
          SELECT COUNT(DISTINCT a.question_id) as att,
                 SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as cor
          FROM pyq_attempts a
          WHERE a.exam_id = ? AND a.user_id = ?
        `).get(targetExamId, user.id);
        totalAttempted = stats.att || 0;
        totalCorrect = stats.cor || 0;
      }

      return sendJson(res, 200, {
        exam_id: targetExamId,
        total_questions: totalQuestions,
        total_attempted: totalAttempted,
        total_correct: totalCorrect,
        years,
        topics
      });
    }

    // Attempt a Question
    const attemptMatch = pathname.match(/^\/api\/pyqs\/([a-zA-Z0-9_-]+)\/attempt$/);
    if (method === 'POST' && attemptMatch) {
      const user = requireAuth(req, res);
      if (!user) return;

      const questionId = attemptMatch[1];
      const body = await parseJsonBody(req);
      const { selected_answer, time_spent_seconds, mode } = body;

      if (!selected_answer) {
        return sendError(res, 400, 'Selected answer is required');
      }

      const result = recordQuestionAttempt(user.id, questionId, selected_answer, time_spent_seconds || 30, mode || 'pyq_browser');
      return sendJson(res, 200, result);
    }

    // Toggle Bookmark
    const bookmarkMatch = pathname.match(/^\/api\/pyqs\/([a-zA-Z0-9_-]+)\/bookmark$/);
    if (method === 'POST' && bookmarkMatch) {
      const user = requireAuth(req, res);
      if (!user) return;

      const questionId = bookmarkMatch[1];
      const existing = db.prepare('SELECT id FROM bookmarked_questions WHERE user_id = ? AND question_id = ?').get(user.id, questionId);

      let bookmarked = false;
      if (existing) {
        db.prepare('DELETE FROM bookmarked_questions WHERE id = ?').run(existing.id);
        bookmarked = false;
      } else {
        const id = 'bm-' + crypto.randomUUID().slice(0, 8);
        db.prepare('INSERT INTO bookmarked_questions (id, user_id, question_id) VALUES (?, ?, ?)').run(id, user.id, questionId);
        bookmarked = true;
      }

      return sendJson(res, 200, { bookmarked });
    }

    // ----------------------------------------------------
    // PREVIOUS-YEAR PDF PAPERS ROUTES
    // ----------------------------------------------------

    // Get PDF Papers list with optional filters
    if (method === 'GET' && pathname === '/api/pyq-pdfs') {
      const { exam_id, year, subject_id, paper_type, search } = query;
      let sql = `
        SELECT p.*, e.name as exam_name, s.name as subject_name
        FROM pyq_pdf_papers p
        LEFT JOIN exams e ON p.exam_id = e.id
        LEFT JOIN subjects s ON p.subject_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (exam_id && exam_id !== 'all') {
        sql += ' AND p.exam_id = ?';
        params.push(exam_id);
      }
      if (year && year !== 'all') {
        sql += ' AND p.year = ?';
        params.push(parseInt(year, 10));
      }
      if (subject_id && subject_id !== 'all') {
        sql += ' AND p.subject_id = ?';
        params.push(subject_id);
      }
      if (paper_type && paper_type !== 'all') {
        sql += ' AND p.paper_type = ?';
        params.push(paper_type);
      }
      if (search) {
        sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.file_name LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      sql += ' ORDER BY p.year DESC, p.created_at DESC';
      const papers = db.prepare(sql).all(...params);
      return sendJson(res, 200, { papers });
    }

    // View PDF paper online (stream inline with proper PDF MIME headers)
    const pdfViewMatch = pathname.match(/^\/api\/pyq-pdfs\/([a-zA-Z0-9_-]+)\/view$/);
    if (method === 'GET' && pdfViewMatch) {
      const paperId = pdfViewMatch[1];
      const paper = db.prepare('SELECT * FROM pyq_pdf_papers WHERE id = ?').get(paperId);
      if (!paper) {
        return sendError(res, 404, 'PDF paper not found');
      }

      const filePath = path.join(PUBLIC_DIR, paper.file_path);
      if (!fs.existsSync(filePath)) {
        return sendError(res, 404, 'PDF physical file not found on server storage');
      }

      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size,
        'Content-Disposition': `inline; filename="${encodeURIComponent(paper.file_name)}"`,
        'Cache-Control': 'public, max-age=3600'
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    // Download PDF paper (increments download counter and triggers download header)
    const pdfDownloadMatch = pathname.match(/^\/api\/pyq-pdfs\/([a-zA-Z0-9_-]+)\/download$/);
    if (method === 'GET' && pdfDownloadMatch) {
      const paperId = pdfDownloadMatch[1];
      const paper = db.prepare('SELECT * FROM pyq_pdf_papers WHERE id = ?').get(paperId);
      if (!paper) {
        return sendError(res, 404, 'PDF paper not found');
      }

      db.prepare('UPDATE pyq_pdf_papers SET download_count = download_count + 1 WHERE id = ?').run(paperId);

      const filePath = path.join(PUBLIC_DIR, paper.file_path);
      if (!fs.existsSync(filePath)) {
        return sendError(res, 404, 'PDF physical file not found on server storage');
      }

      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(paper.file_name)}"`,
        'Cache-Control': 'no-cache'
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    // Admin Upload PDF Paper
    if (method === 'POST' && pathname === '/api/admin/pyq-pdfs') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const body = await parseJsonBody(req);
      const { exam_id, title, year, subject_id, paper_type, description, file_name, file_data } = body;

      if (!exam_id || !title || !year || !file_data) {
        return sendError(res, 400, 'Missing required fields: exam_id, title, year, and file_data are required');
      }

      const exam = db.prepare('SELECT id FROM exams WHERE id = ?').get(exam_id);
      if (!exam) {
        return sendError(res, 404, 'Target examination not found');
      }

      let base64Payload = file_data;
      if (typeof base64Payload === 'string' && base64Payload.includes(';base64,')) {
        base64Payload = base64Payload.split(';base64,')[1];
      }

      const fileBuffer = Buffer.from(base64Payload, 'base64');
      if (fileBuffer.length === 0) {
        return sendError(res, 400, 'Invalid PDF file buffer payload');
      }

      const originalName = (file_name || `${exam_id}_${year}.pdf`).replace(/[^\w.-]/g, '_');
      const safeDiskName = `${exam_id}_${year}_${Date.now()}_${originalName.endsWith('.pdf') ? originalName : originalName + '.pdf'}`;
      const destPath = path.join(PDF_UPLOAD_DIR, safeDiskName);

      fs.writeFileSync(destPath, fileBuffer);

      const paperId = 'pdf-' + crypto.randomUUID().slice(0, 8);
      const relPath = `/uploads/pyq_pdfs/${safeDiskName}`;

      db.prepare(`
        INSERT INTO pyq_pdf_papers (
          id, exam_id, title, year, subject_id, paper_type, file_path, file_name,
          file_size_bytes, description, is_official, download_count, uploaded_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, datetime('now'))
      `).run(
        paperId,
        exam_id,
        title.trim(),
        parseInt(year, 10),
        subject_id || null,
        paper_type || 'Official Question Paper',
        relPath,
        originalName.endsWith('.pdf') ? originalName : originalName + '.pdf',
        fileBuffer.length,
        description ? description.trim() : null,
        admin.id
      );

      const created = db.prepare(`
        SELECT p.*, e.name as exam_name, s.name as subject_name
        FROM pyq_pdf_papers p
        LEFT JOIN exams e ON p.exam_id = e.id
        LEFT JOIN subjects s ON p.subject_id = s.id
        WHERE p.id = ?
      `).get(paperId);

      return sendJson(res, 201, {
        message: 'PDF question paper uploaded successfully and made available to students',
        paper: created
      });
    }

    // Admin Delete PDF Paper
    const adminPdfDeleteMatch = pathname.match(/^\/api\/admin\/pyq-pdfs\/([a-zA-Z0-9_-]+)$/);
    if (method === 'DELETE' && adminPdfDeleteMatch) {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const paperId = adminPdfDeleteMatch[1];
      const paper = db.prepare('SELECT * FROM pyq_pdf_papers WHERE id = ?').get(paperId);
      if (!paper) {
        return sendError(res, 404, 'PDF paper not found');
      }

      try {
        const filePath = path.join(PUBLIC_DIR, paper.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Could not unlink PDF file:', err.message);
      }

      db.prepare('DELETE FROM pyq_pdf_papers WHERE id = ?').run(paperId);
      return sendJson(res, 200, { message: 'PDF question paper removed successfully' });
    }

    // Admin / Teacher PYQ Import (CSV or JSON)
    if (method === 'POST' && pathname === '/api/admin/pyqs/import') {
      const body = await parseJsonBody(req);
      const { format, data, exam_id, default_year, default_subject_id, default_topic_id } = body;

      if (!data) {
        return sendError(res, 400, 'Import data cannot be empty');
      }

      let questionsToImport = [];

      if (format === 'json') {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          questionsToImport = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return sendError(res, 400, 'Invalid JSON format: ' + e.message);
        }
      } else if (format === 'csv') {
        // Parse CSV lines
        const lines = data.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          return sendError(res, 400, 'CSV must contain at least a header and one row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        for (let i = 1; i < lines.length; i++) {
          // Simple CSV splitter respecting quotes
          const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
          const cleanedRow = row.map(cell => cell.replace(/^"(.*)"$/, '$1').trim());

          const qObj = {};
          headers.forEach((h, idx) => {
            qObj[h] = cleanedRow[idx] || '';
          });
          questionsToImport.push(qObj);
        }
      }

      // Validate and Insert questions
      let insertedCount = 0;
      const insertStmt = db.prepare(`
        INSERT INTO pyq_questions (
          id, exam_id, subject_id, topic_id, year, question_text, question_type, options_json, correct_answer, explanation, difficulty, is_official, source_url, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of questionsToImport) {
        const id = 'import-' + crypto.randomUUID().slice(0, 8);
        const examIdToUse = item.exam_id || exam_id || 'jee-main';
        const year = parseInt(item.year || default_year, 10) || 2024;
        const subjectIdToUse = item.subject_id || default_subject_id || null;
        let topicIdToUse = item.topic_id || default_topic_id || null;

        // Auto-resolve topic name if provided
        const topicName = item.topic_name || item.topic;
        if (!topicIdToUse && topicName) {
          const existingTopic = db.prepare('SELECT id FROM topics WHERE exam_id = ? AND LOWER(name) = LOWER(?)').get(examIdToUse, topicName.trim());
          if (existingTopic) {
            topicIdToUse = existingTopic.id;
          } else if (subjectIdToUse) {
            const newTopId = 'top-' + crypto.randomUUID().slice(0, 8);
            db.prepare(`
              INSERT INTO topics (id, subject_id, exam_id, name, difficulty, estimated_hours, order_index, weightage_tier, key_concepts)
              VALUES (?, ?, ?, ?, 'Medium', 10, 99, 'Core', ?)
            `).run(newTopId, subjectIdToUse, examIdToUse, topicName.trim(), topicName.trim());
            topicIdToUse = newTopId;
          }
        }

        const qText = item.question_text || item.question || item.text;
        const correctAns = item.correct_answer || item.answer;
        const explanation = item.explanation || 'Step-by-step solution verified by educator.';
        const difficulty = item.difficulty || 'Medium';

        let options = [];
        if (item.options_json) {
          options = typeof item.options_json === 'string' ? item.options_json : JSON.stringify(item.options_json);
        } else if (item.option_a && item.option_b) {
          options = JSON.stringify([item.option_a, item.option_b, item.option_c || '', item.option_d || '']);
        } else {
          options = JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']);
        }

        if (qText && correctAns) {
          insertStmt.run(
            id,
            examIdToUse,
            subjectIdToUse,
            topicIdToUse,
            year,
            qText,
            item.question_type || 'mcq',
            options,
            correctAns,
            explanation,
            difficulty,
            item.is_official !== undefined ? parseInt(item.is_official, 10) : 1,
            item.source_url || 'Teacher / Admin Upload',
            item.verification_status || 'Verified Question'
          );
          insertedCount++;
        }
      }

      return sendJson(res, 200, {
        message: `Successfully imported ${insertedCount} questions into the question bank!`,
        imported_count: insertedCount
      });
    }

    // ----------------------------------------------------
    // ADMINISTRATION PANEL REST ROUTES
    // ----------------------------------------------------

    // Get Admin Platform Statistics
    if (method === 'GET' && pathname === '/api/admin/stats') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const totalStudents = db.prepare("SELECT count(*) as c FROM users WHERE role = 'student'").get().c;
      const totalExams = db.prepare("SELECT count(*) as c FROM exams WHERE is_archived = 0").get().c;
      const totalSubjects = db.prepare("SELECT count(*) as c FROM subjects").get().c;
      const totalTopics = db.prepare("SELECT count(*) as c FROM topics").get().c;
      const totalPyqs = db.prepare("SELECT count(*) as c FROM pyq_questions").get().c;
      const totalPdfPapers = db.prepare("SELECT count(*) as c FROM pyq_pdf_papers").get().c;
      const totalAttempts = db.prepare("SELECT count(*) as c FROM pyq_attempts").get().c;
      const totalTasksCompleted = db.prepare("SELECT count(*) as c FROM study_tasks WHERE status = 'completed'").get().c;

      const recentUsers = db.prepare("SELECT id, full_name, email, education_level, active_exam_id, prep_mode, created_at FROM users ORDER BY created_at DESC LIMIT 8").all();
      const recentAttempts = db.prepare(`
        SELECT a.id, a.selected_answer, a.is_correct, a.attempted_at, q.question_text, u.full_name as student_name
        FROM pyq_attempts a
        JOIN pyq_questions q ON a.question_id = q.id
        JOIN users u ON a.user_id = u.id
        ORDER BY a.attempted_at DESC LIMIT 8
      `).all();

      return sendJson(res, 200, {
        stats: {
          totalStudents,
          totalExams,
          totalSubjects,
          totalTopics,
          totalPyqs,
          totalPdfPapers,
          totalAttempts,
          totalTasksCompleted
        },
        recentUsers,
        recentAttempts
      });
    }

    // Admin Add New Exam
    if (method === 'POST' && pathname === '/api/admin/exams') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const body = await parseJsonBody(req);
      const {
        id, name, short_name, stage, category, conducting_authority, career_field, exam_type,
        overview, purpose, who_can_apply, qualification, age_limit, important_eligibility,
        schedule_status, official_schedule, schedule_verified_date, source_url, official_url,
        pattern_marking, selection_process, prep_strategy, recommended_resources, benefits
      } = body;

      if (!name || !short_name || !stage || !category) {
        return sendError(res, 400, 'Name, short name, stage, and category are required');
      }

      const examId = id ? id.toLowerCase().replace(/[^a-z0-9_-]/g, '-') : 'exam-' + crypto.randomUUID().slice(0, 8);

      db.prepare(`
        INSERT INTO exams (
          id, name, short_name, stage, category, conducting_authority, career_field, exam_type,
          overview, purpose, who_can_apply, qualification, age_limit, important_eligibility,
          schedule_status, official_schedule, schedule_verified_date, source_url, official_url,
          pattern_marking, selection_process, prep_strategy, recommended_resources, benefits, is_archived
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, 0
        )
      `).run(
        examId, name, short_name, stage, category, conducting_authority || 'Exam Conducting Body', career_field || 'Professional Careers', exam_type || 'National Entrance',
        overview || 'Overview of the examination.', purpose || 'Purpose of examination.', who_can_apply || 'Eligible students.', qualification || 'Educational qualifications.',
        age_limit || 'Age criteria.', important_eligibility || 'Important eligibility details.', schedule_status || 'Official', official_schedule || 'Schedule announced on official portal.',
        schedule_verified_date || new Date().toISOString().split('T')[0], source_url || 'https://example.gov.in', official_url || 'https://example.gov.in',
        pattern_marking || 'Standard examination pattern.', selection_process || 'Written CBT followed by counselling.', prep_strategy || 'Syllabus mastery and PYQ practice.',
        recommended_resources || 'Standard textbooks and mock tests.', benefits || 'Career growth and accredited qualifications.'
      );

      const created = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
      return sendJson(res, 201, { exam: created, message: 'Examination created successfully' });
    }

    // Admin Update Exam
    const adminExamMatch = pathname.match(/^\/api\/admin\/exams\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PUT' && adminExamMatch) {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const examId = adminExamMatch[1];
      const existing = db.prepare('SELECT id FROM exams WHERE id = ?').get(examId);
      if (!existing) return sendError(res, 404, 'Examination not found');

      const body = await parseJsonBody(req);
      db.prepare(`
        UPDATE exams SET
          name = COALESCE(?, name),
          short_name = COALESCE(?, short_name),
          stage = COALESCE(?, stage),
          category = COALESCE(?, category),
          conducting_authority = COALESCE(?, conducting_authority),
          career_field = COALESCE(?, career_field),
          exam_type = COALESCE(?, exam_type),
          overview = COALESCE(?, overview),
          purpose = COALESCE(?, purpose),
          who_can_apply = COALESCE(?, who_can_apply),
          qualification = COALESCE(?, qualification),
          age_limit = COALESCE(?, age_limit),
          important_eligibility = COALESCE(?, important_eligibility),
          schedule_status = COALESCE(?, schedule_status),
          official_schedule = COALESCE(?, official_schedule),
          schedule_verified_date = COALESCE(?, schedule_verified_date),
          source_url = COALESCE(?, source_url),
          official_url = COALESCE(?, official_url),
          pattern_marking = COALESCE(?, pattern_marking),
          selection_process = COALESCE(?, selection_process),
          prep_strategy = COALESCE(?, prep_strategy),
          recommended_resources = COALESCE(?, recommended_resources),
          benefits = COALESCE(?, benefits)
        WHERE id = ?
      `).run(
        body.name, body.short_name, body.stage, body.category, body.conducting_authority, body.career_field, body.exam_type,
        body.overview, body.purpose, body.who_can_apply, body.qualification, body.age_limit, body.important_eligibility,
        body.schedule_status, body.official_schedule, body.schedule_verified_date, body.source_url, body.official_url,
        body.pattern_marking, body.selection_process, body.prep_strategy, body.recommended_resources, body.benefits,
        examId
      );

      const updated = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
      return sendJson(res, 200, { exam: updated, message: 'Examination updated successfully' });
    }

    // Admin Archive Exam
    if (method === 'DELETE' && adminExamMatch) {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const examId = adminExamMatch[1];
      db.prepare('UPDATE exams SET is_archived = 1 WHERE id = ?').run(examId);
      return sendJson(res, 200, { message: 'Examination archived successfully' });
    }

    // Admin Create Single Question
    if (method === 'POST' && pathname === '/api/admin/pyqs') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const body = await parseJsonBody(req);
      const {
        exam_id, subject_id, topic_id, year, question_text, question_type,
        options, correct_answer, explanation, difficulty, is_official, source_url, verification_status
      } = body;

      if (!exam_id || !question_text || !correct_answer) {
        return sendError(res, 400, 'Exam ID, question text, and correct answer are required');
      }

      const qId = 'pyq-' + crypto.randomUUID().slice(0, 8);
      const optionsJson = Array.isArray(options) ? JSON.stringify(options) : (typeof options === 'string' ? options : JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']));

      db.prepare(`
        INSERT INTO pyq_questions (
          id, exam_id, subject_id, topic_id, year, question_text, question_type,
          options_json, correct_answer, explanation, difficulty, is_official, source_url, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        qId, exam_id, subject_id || null, topic_id || null, parseInt(year, 10) || new Date().getFullYear(),
        question_text.trim(), question_type || 'mcq', optionsJson, correct_answer.trim(),
        explanation || 'Explanation provided by educator.', difficulty || 'Medium',
        is_official !== undefined ? parseInt(is_official, 10) : 1,
        source_url || 'Official Exam Portal', verification_status || (is_official ? 'Verified Official PYQ' : 'Practice Question — Not an Official PYQ')
      );

      const createdQ = db.prepare('SELECT * FROM pyq_questions WHERE id = ?').get(qId);
      return sendJson(res, 201, { question: createdQ, message: 'Question added successfully' });
    }

    // Admin Update Single Question
    const adminQMatch = pathname.match(/^\/api\/admin\/pyqs\/([a-zA-Z0-9_-]+)$/);
    if (method === 'PUT' && adminQMatch) {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const qId = adminQMatch[1];
      const existing = db.prepare('SELECT id FROM pyq_questions WHERE id = ?').get(qId);
      if (!existing) return sendError(res, 404, 'Question not found');

      const body = await parseJsonBody(req);
      const optionsJson = body.options ? JSON.stringify(body.options) : null;

      db.prepare(`
        UPDATE pyq_questions SET
          question_text = COALESCE(?, question_text),
          options_json = COALESCE(?, options_json),
          correct_answer = COALESCE(?, correct_answer),
          explanation = COALESCE(?, explanation),
          difficulty = COALESCE(?, difficulty),
          is_official = COALESCE(?, is_official),
          verification_status = COALESCE(?, verification_status),
          source_url = COALESCE(?, source_url),
          year = COALESCE(?, year),
          subject_id = COALESCE(?, subject_id),
          topic_id = COALESCE(?, topic_id)
        WHERE id = ?
      `).run(
        body.question_text || null, optionsJson || null, body.correct_answer || null, body.explanation || null,
        body.difficulty || null, body.is_official !== undefined ? body.is_official : null,
        body.verification_status || null, body.source_url || null, body.year || null,
        body.subject_id || null, body.topic_id || null,
        qId
      );

      const updated = db.prepare('SELECT * FROM pyq_questions WHERE id = ?').get(qId);
      return sendJson(res, 200, { question: updated, message: 'Question updated successfully' });
    }

    // Admin Delete Question
    if (method === 'DELETE' && adminQMatch) {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const qId = adminQMatch[1];
      db.prepare('DELETE FROM pyq_questions WHERE id = ?').run(qId);
      return sendJson(res, 200, { message: 'Question deleted successfully' });
    }

    // ----------------------------------------------------
    // DAILY PRACTICE & STREAKS ROUTES
    // ----------------------------------------------------

    if (method === 'GET' && pathname === '/api/daily-practice') {
      const user = requireAuth(req, res);
      if (!user) return;

      const activeExamId = user.active_exam_id || 'jee-main';
      const streak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(user.id) || {
        current_streak: 0,
        longest_streak: 0,
        target_questions_per_day: 10
      };

      const todayStr = new Date().toISOString().split('T')[0];
      const todayLog = db.prepare('SELECT * FROM daily_practice_logs WHERE user_id = ? AND practice_date = ?').get(user.id, todayStr) || {
        completed_count: 0,
        correct_count: 0,
        target_count: streak.target_questions_per_day,
        is_target_met: 0
      };

      // Retrieve questions for today's practice set
      const questions = db.prepare(`
        SELECT q.*, s.name as subject_name
        FROM pyq_questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.exam_id = ?
        ORDER BY RANDOM()
        LIMIT ?
      `).all(activeExamId, streak.target_questions_per_day);

      const parsedQuestions = questions.map(q => ({
        ...q,
        options: q.options_json ? JSON.parse(q.options_json) : []
      }));

      return sendJson(res, 200, {
        target: todayLog.target_count || streak.target_questions_per_day,
        completed: todayLog.completed_count,
        correct: todayLog.correct_count,
        isTargetMet: todayLog.is_target_met === 1,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        questions: parsedQuestions
      });
    }

    // ----------------------------------------------------
    // ANALYTICS & DASHBOARD METRICS
    // ----------------------------------------------------

    if (method === 'GET' && pathname === '/api/analytics/dashboard') {
      const user = requireAuth(req, res);
      if (!user) return;

      const metrics = getDashboardAnalytics(user.id);
      return sendJson(res, 200, metrics);
    }

    // ----------------------------------------------------
    // STATIC FILE SERVING (SPA)
    // ----------------------------------------------------

    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      return sendError(res, 403, 'Forbidden');
    }

    // Fallback to index.html for client-side routing
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return sendError(res, 404, 'Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

  } catch (err) {
    console.error('[SPPS Server Error]', err);
    return sendError(res, 500, err.message || 'Internal Server Error');
  }
});

function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[SPPS] Server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  server,
  startServer
};

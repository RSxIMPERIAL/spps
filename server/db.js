// SPPS (Study Plan Preparation System) - Database Engine
// Powered by Node.js built-in SQLite (DatabaseSync)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const defaultDbPath = process.env.VERCEL
  ? path.join('/tmp', 'spps.sqlite')
  : path.join(__dirname, '..', 'data', 'spps.sqlite');

const DB_PATH = process.env.DB_PATH || defaultDbPath;

// If running in Vercel serverless environment, copy seeded database to /tmp if not yet present
if (process.env.VERCEL) {
  const seedDb = path.join(__dirname, '..', 'data', 'spps.sqlite');
  if (!fs.existsSync(DB_PATH) && fs.existsSync(seedDb)) {
    try {
      fs.copyFileSync(seedDb, DB_PATH);
    } catch (e) {
      console.warn('[Vercel DB] Fallback to empty SQLite in /tmp:', e.message);
    }
  }
}

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability and concurrency
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student', -- 'student', 'admin'
      education_level TEXT NOT NULL DEFAULT 'after_12', -- 'after_10', 'after_12', 'after_grad'
      active_exam_id TEXT,
      prep_mode TEXT NOT NULL DEFAULT 'beginner', -- 'beginner', 'intermediate', 'revision'
      daily_hours REAL NOT NULL DEFAULT 4.0,
      preferred_days TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]', -- JSON array
      time_slots TEXT NOT NULL DEFAULT '["09:00-11:00","15:00-17:00"]', -- JSON array of slots
      session_duration_minutes INTEGER NOT NULL DEFAULT 60,
      break_duration_minutes INTEGER NOT NULL DEFAULT 15,
      weak_subjects TEXT NOT NULL DEFAULT '[]', -- JSON array of subject IDs/names
      target_exam_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Examinations table
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      stage TEXT NOT NULL, -- 'after_10', 'after_12', 'after_grad'
      category TEXT NOT NULL, -- 'Engineering', 'Medical', 'Civil Services', 'Defence', 'Law', 'Polytechnic', 'Banking', 'Management', etc.
      conducting_authority TEXT NOT NULL,
      career_field TEXT NOT NULL,
      exam_type TEXT NOT NULL, -- 'National Level Entrance', 'State Level Entrance', 'Government Recruitment', etc.
      overview TEXT NOT NULL,
      purpose TEXT NOT NULL,
      who_can_apply TEXT NOT NULL,
      qualification TEXT NOT NULL,
      age_limit TEXT NOT NULL,
      important_eligibility TEXT NOT NULL,
      schedule_status TEXT NOT NULL, -- 'Official', 'Tentative', 'Upcoming'
      official_schedule TEXT NOT NULL,
      schedule_verified_date TEXT NOT NULL,
      source_url TEXT NOT NULL,
      official_url TEXT NOT NULL,
      pattern_marking TEXT NOT NULL,
      selection_process TEXT NOT NULL,
      prep_strategy TEXT NOT NULL,
      recommended_resources TEXT NOT NULL,
      benefits TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Subjects table
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      weightage_percent REAL NOT NULL DEFAULT 25.0,
      description TEXT,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- Topics table
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      name TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
      estimated_hours REAL NOT NULL DEFAULT 8.0,
      order_index INTEGER NOT NULL DEFAULT 0,
      key_concepts TEXT,
      weightage_tier TEXT NOT NULL DEFAULT 'Core', -- 'Fundamental', 'Core', 'High-Yield'
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- Study Plans table
    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      prep_mode TEXT NOT NULL,
      target_date TEXT,
      total_estimated_hours REAL NOT NULL,
      daily_hours REAL NOT NULL,
      buffer_days INTEGER NOT NULL DEFAULT 7,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
      plan_overview TEXT,
      warning_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- Study Tasks table
    CREATE TABLE IF NOT EXISTS study_tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      activity_type TEXT NOT NULL, -- 'Concept Reading', 'Note Making', 'Practice MCQs', 'PYQ Review', 'Formula Revision', 'Mock Test'
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      priority TEXT NOT NULL DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
      phase TEXT NOT NULL DEFAULT 'Phase 1: Foundation', -- 'Phase 1: Foundation', 'Phase 2: In-Depth Mastery', 'Phase 3: Revision & Practice'
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
      notes TEXT,
      how_to_study TEXT,
      completed_at TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    -- Timetable Sessions table
    CREATE TABLE IF NOT EXISTS timetable_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT,
      task_id TEXT,
      subject_id TEXT,
      topic_id TEXT,
      day_of_week TEXT NOT NULL, -- 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
      start_time TEXT NOT NULL, -- '09:00'
      end_time TEXT NOT NULL,   -- '10:30'
      session_date TEXT,       -- 'YYYY-MM-DD'
      title TEXT NOT NULL,
      activity_type TEXT NOT NULL DEFAULT 'Concept Reading',
      status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'skipped', 'rescheduled'
      notes TEXT,
      how_to_study TEXT,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES study_tasks(id) ON DELETE SET NULL
    );

    -- Previous-Year Questions (PYQ) table
    CREATE TABLE IF NOT EXISTS pyq_questions (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      subject_id TEXT,
      topic_id TEXT,
      year INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL DEFAULT 'mcq', -- 'mcq', 'numerical', 'descriptive'
      options_json TEXT, -- JSON array of string options
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
      is_official INTEGER NOT NULL DEFAULT 1, -- 1 for Official PYQ, 0 for Practice Question
      source_url TEXT,
      verification_status TEXT NOT NULL DEFAULT 'Verified Official PYQ',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- Question Attempts table
    CREATE TABLE IF NOT EXISTS pyq_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      selected_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'pyq_browser', -- 'pyq_browser', 'daily_practice', 'mock_test'
      attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES pyq_questions(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- Bookmarks table
    CREATE TABLE IF NOT EXISTS bookmarked_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES pyq_questions(id) ON DELETE CASCADE
    );

    -- Daily Practice Logs & Streaks table
    CREATE TABLE IF NOT EXISTS daily_practice_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      practice_date TEXT NOT NULL, -- 'YYYY-MM-DD'
      target_count INTEGER NOT NULL DEFAULT 10,
      completed_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      streak_count INTEGER NOT NULL DEFAULT 0,
      is_target_met INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, practice_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User Streaks summary table
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_activity_date TEXT,
      last_streak_date TEXT,
      total_questions_solved INTEGER NOT NULL DEFAULT 0,
      target_questions_per_day INTEGER NOT NULL DEFAULT 10,
      consecutive_success_days INTEGER NOT NULL DEFAULT 0,
      min_target INTEGER NOT NULL DEFAULT 6,
      max_target INTEGER NOT NULL DEFAULT 20,
      adaptive_target_enabled INTEGER NOT NULL DEFAULT 1,
      last_target_change_reason TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User Sessions table for persistent token auth
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User Topic Mastery (Intermediate Diagnostic & Gap Tracking)
    CREATE TABLE IF NOT EXISTS user_topic_mastery (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      mastery_level TEXT NOT NULL DEFAULT 'unstudied', -- 'mastered', 'needs_practice', 'unstudied'
      confidence_score INTEGER DEFAULT 50, -- 0 to 100
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, topic_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- Previous-Year PDF Question Papers & Booklets
    CREATE TABLE IF NOT EXISTS pyq_pdf_papers (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      subject_id TEXT,
      paper_type TEXT NOT NULL DEFAULT 'Question Paper',
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      is_official INTEGER NOT NULL DEFAULT 1,
      download_count INTEGER NOT NULL DEFAULT 0,
      uploaded_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    -- Indexes for fast querying
    CREATE INDEX IF NOT EXISTS idx_exams_stage ON exams(stage);
    CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category);
    CREATE INDEX IF NOT EXISTS idx_subjects_exam ON subjects(exam_id);
    CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_plan ON study_tasks(user_id, plan_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_user ON timetable_sessions(user_id, day_of_week);
    CREATE INDEX IF NOT EXISTS idx_pyq_exam_year ON pyq_questions(exam_id, year);
    CREATE INDEX IF NOT EXISTS idx_pyq_exam_topic ON pyq_questions(exam_id, topic_id);
    CREATE INDEX IF NOT EXISTS idx_pyq_subject ON pyq_questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_pyq_pdf_exam ON pyq_pdf_papers(exam_id);
    CREATE INDEX IF NOT EXISTS idx_pyq_pdf_year ON pyq_pdf_papers(year);
    CREATE INDEX IF NOT EXISTS idx_attempts_user_exam ON pyq_attempts(user_id, exam_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarked_questions(user_id);
    CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON user_topic_mastery(user_id, exam_id);
    CREATE INDEX IF NOT EXISTS idx_topic_mastery_level ON user_topic_mastery(mastery_level);
  `);

  // Safe schema migrations for existing databases
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_topic_mastery (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        exam_id TEXT NOT NULL,
        mastery_level TEXT NOT NULL DEFAULT 'unstudied',
        confidence_score INTEGER DEFAULT 50,
        notes TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, topic_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON user_topic_mastery(user_id, exam_id);
    `);
    const userCols = db.prepare("PRAGMA table_info(users)").all();
    if (!userCols.some(c => c.name === 'role')) {
      db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';");
    }

    const examCols = db.prepare("PRAGMA table_info(exams)").all();
    if (!examCols.some(c => c.name === 'is_archived')) {
      db.exec("ALTER TABLE exams ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;");
    }

    const streakCols = db.prepare("PRAGMA table_info(user_streaks)").all();
    if (!streakCols.some(c => c.name === 'last_streak_date')) {
      db.exec("ALTER TABLE user_streaks ADD COLUMN last_streak_date TEXT;");
    }
    if (!streakCols.some(c => c.name === 'consecutive_success_days')) {
      db.exec("ALTER TABLE user_streaks ADD COLUMN consecutive_success_days INTEGER NOT NULL DEFAULT 0;");
    }
    if (!streakCols.some(c => c.name === 'min_target')) {
      db.exec("ALTER TABLE user_streaks ADD COLUMN min_target INTEGER NOT NULL DEFAULT 6;");
    }
    if (!streakCols.some(c => c.name === 'max_target')) {
      db.exec("ALTER TABLE user_streaks ADD COLUMN max_target INTEGER NOT NULL DEFAULT 20;");
    }
    if (!streakCols.some(c => c.name === 'last_target_change_reason')) {
      db.exec("ALTER TABLE user_streaks ADD COLUMN last_target_change_reason TEXT;");
    }

    // Auto-create or migrate pyq_pdf_papers
    db.exec(`
      CREATE TABLE IF NOT EXISTS pyq_pdf_papers (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        title TEXT NOT NULL,
        year INTEGER NOT NULL,
        subject_id TEXT,
        paper_type TEXT NOT NULL DEFAULT 'Question Paper',
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        is_official INTEGER NOT NULL DEFAULT 1,
        download_count INTEGER NOT NULL DEFAULT 0,
        uploaded_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pyq_pdf_exam ON pyq_pdf_papers(exam_id);
      CREATE INDEX IF NOT EXISTS idx_pyq_pdf_year ON pyq_pdf_papers(year);
    `);

    const pdfCols = db.prepare("PRAGMA table_info(pyq_pdf_papers)").all();
    if (!pdfCols.some(c => c.name === 'uploaded_by')) {
      db.exec("ALTER TABLE pyq_pdf_papers ADD COLUMN uploaded_by TEXT;");
    }

    const taskCols = db.prepare("PRAGMA table_info(study_tasks)").all();
    if (!taskCols.some(c => c.name === 'how_to_study')) {
      db.exec("ALTER TABLE study_tasks ADD COLUMN how_to_study TEXT;");
    }

    const sessCols = db.prepare("PRAGMA table_info(timetable_sessions)").all();
    if (!sessCols.some(c => c.name === 'how_to_study')) {
      db.exec("ALTER TABLE timetable_sessions ADD COLUMN how_to_study TEXT;");
    }
  } catch (migErr) {
    console.warn('[DB Migration Warning]', migErr.message);
  }
}

initSchema();

try {
  const { ensureAllExamsHaveSyllabus } = require('./syllabusGenerator');
  ensureAllExamsHaveSyllabus(db);
} catch (e) {
  // Silent fallback if syllabusGenerator is loading
}

module.exports = {
  db,
  initSchema
};

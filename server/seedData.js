// SPPS Comprehensive Seed Data Generator
// Populates 40+ Examinations across India, official syllabi, and Year-Wise/Topic-Wise PYQs.

const { db } = require('./db');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { examsData } = require('./data/examsData');
const { subjectsData, topicsData } = require('./data/syllabiData');
const { pyqQuestions } = require('./data/pyqData');
const { createSamplePdf } = require('./pdfHelper');
const { generateHowToStudyBlueprint } = require('./pedagogyHelper');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function runSeed() {
  console.log('[Seed] Seeding SPPS database with Indian Examinations, Syllabi, and PYQ Question Bank...');

  // 1. Seed Examinations
  const insertExam = db.prepare(`
    INSERT OR REPLACE INTO exams (
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
  `);

  for (const exam of examsData) {
    insertExam.run(
      exam.id, exam.name, exam.short_name, exam.stage, exam.category, exam.conducting_authority, exam.career_field, exam.exam_type,
      exam.overview, exam.purpose, exam.who_can_apply, exam.qualification, exam.age_limit, exam.important_eligibility,
      exam.schedule_status, exam.official_schedule, exam.schedule_verified_date, exam.source_url, exam.official_url,
      exam.pattern_marking, exam.selection_process, exam.prep_strategy, exam.recommended_resources, exam.benefits
    );
  }
  console.log(`[Seed] Seeded ${examsData.length} Indian Examinations.`);

  // 2. Seed Subjects
  const insertSubject = db.prepare(`
    INSERT OR REPLACE INTO subjects (id, exam_id, name, order_index, weightage_percent, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const subj of subjectsData) {
    insertSubject.run(subj.id, subj.exam_id, subj.name, subj.order_index, subj.weightage_percent, subj.description);
  }
  console.log(`[Seed] Seeded ${subjectsData.length} Examination Subjects.`);

  // 3. Seed Detailed Topics
  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO topics (id, subject_id, exam_id, name, difficulty, estimated_hours, order_index, weightage_tier, key_concepts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const top of topicsData) {
    insertTopic.run(top.id, top.subject_id, top.exam_id, top.name, top.difficulty, top.estimated_hours, top.order_index, top.weightage_tier, top.key_concepts);
  }
  console.log(`[Seed] Seeded ${topicsData.length} Syllabus Topics.`);

  // 4. Seed Year-Wise & Topic-Wise PYQs
  const insertPyq = db.prepare(`
    INSERT OR REPLACE INTO pyq_questions (
      id, exam_id, subject_id, topic_id, year, question_text, question_type,
      options_json, correct_answer, explanation, difficulty, is_official, source_url, verification_status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const q of pyqQuestions) {
    insertPyq.run(
      q.id, q.exam_id, q.subject_id || null, q.topic_id || null, q.year, q.question_text, q.question_type || 'mcq',
      q.options_json, q.correct_answer, q.explanation, q.difficulty, q.is_official, q.source_url, q.verification_status
    );
  }
  console.log(`[Seed] Seeded ${pyqQuestions.length} Verified Previous-Year Questions.`);

  // 5. Seed Demo Accounts
  const demoUserId = 'demo-student-01';
  const demoSalt = 'spps_secure_salt_2025';
  const demoPasswordHash = hashPassword('Demo@12345', demoSalt);

  const adminUserId = 'admin-user-01';
  const adminSalt = 'spps_admin_salt_2025';
  const adminPasswordHash = hashPassword('Admin@12345', adminSalt);

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, salt, full_name, role, education_level, active_exam_id,
      prep_mode, daily_hours, preferred_days, time_slots, session_duration_minutes,
      break_duration_minutes, weak_subjects, target_exam_date
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  // Student Account
  insertUser.run(
    demoUserId,
    'demo@spps.edu',
    demoPasswordHash,
    demoSalt,
    'Aarav Sharma',
    'student',
    'after_12',
    'jee-main',
    'beginner',
    4.5,
    JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    JSON.stringify(['08:00-10:00', '16:00-18:30']),
    60,
    15,
    JSON.stringify(['jee-math', 'jee-phys']),
    '2025-04-01'
  );

  // Administrator Account
  insertUser.run(
    adminUserId,
    'admin@spps.edu',
    adminPasswordHash,
    adminSalt,
    'Dr. Vikram Malhotra (Administrator)',
    'admin',
    'after_grad',
    'jee-main',
    'intermediate',
    4.0,
    JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    JSON.stringify(['09:00-12:00', '14:00-17:00']),
    60,
    15,
    JSON.stringify([]),
    '2025-06-01'
  );

  // Initialize Demo User Streak
  const insertStreak = db.prepare(`
    INSERT OR REPLACE INTO user_streaks (
      user_id, current_streak, longest_streak, last_activity_date, last_streak_date,
      total_questions_solved, target_questions_per_day, consecutive_success_days,
      min_target, max_target, adaptive_target_enabled, last_target_change_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  insertStreak.run(
    demoUserId, 5, 12, todayStr, yesterdayStr, 48, 10, 5, 6, 20, 1,
    'Starting target set to 10 questions/day'
  );

  // Create an active Study Plan for the demo student
  const demoPlanId = 'plan-demo-jee';
  const insertPlan = db.prepare(`
    INSERT OR REPLACE INTO study_plans (
      id, user_id, exam_id, prep_mode, target_date, total_estimated_hours, daily_hours, buffer_days, status, plan_overview
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlan.run(
    demoPlanId,
    demoUserId,
    'jee-main',
    'beginner',
    '2025-04-01',
    180.0,
    4.5,
    7,
    'active',
    'Customized Beginner Roadmap for JEE Main: Comprehensive coverage of Physics, Chemistry, and Mathematics with prioritized focus on weak subjects and high-weightage topics.'
  );

  // Seed initial study tasks
  const sampleTasks = [
    { id: 'task-1', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-phys', topic_id: 'jee-phys-1', title: 'Kinematics Fundamentals: Vector Components & 1D Motion', activity: 'Concept Reading', duration: 90, priority: 'High', phase: 'Phase 1: Foundation', status: 'completed', date: '2025-02-10' },
    { id: 'task-2', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-phys', topic_id: 'jee-phys-1', title: 'Solve 25 Level-1 Problems on Projectile Motion', activity: 'Practice MCQs', duration: 60, priority: 'High', phase: 'Phase 1: Foundation', status: 'completed', date: '2025-02-11' },
    { id: 'task-3', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-chem', topic_id: 'jee-chem-1', title: 'VSEPR Theory & Molecular Geometry Notes', activity: 'Note Making', duration: 60, priority: 'Medium', phase: 'Phase 1: Foundation', status: 'completed', date: '2025-02-12' },
    { id: 'task-4', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-math', topic_id: 'jee-math-1', title: 'Matrices & Determinants: Cramer Rule & Properties', activity: 'Concept Reading', duration: 90, priority: 'High', phase: 'Phase 1: Foundation', status: 'in_progress', date: todayStr },
    { id: 'task-5', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-math', topic_id: 'jee-math-1', title: 'JEE Main 2022-2024 PYQ Solving: Matrices', activity: 'PYQ Review', duration: 75, priority: 'High', phase: 'Phase 1: Foundation', status: 'pending', date: todayStr },
    { id: 'task-6', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-phys', topic_id: 'jee-phys-7', title: 'Modern Physics: Photoelectric Effect Formula Revision', activity: 'Formula Revision', duration: 45, priority: 'Medium', phase: 'Phase 2: In-Depth Mastery', status: 'pending', date: '2025-02-20' },
    { id: 'task-7', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-chem', topic_id: 'jee-chem-4', title: 'General Organic Chemistry: Inductive & Resonance Mechanisms', activity: 'Concept Reading', duration: 90, priority: 'High', phase: 'Phase 2: In-Depth Mastery', status: 'pending', date: '2025-02-22' },
    { id: 'task-8', plan_id: demoPlanId, user_id: demoUserId, subject_id: 'jee-math', topic_id: 'jee-math-2', title: 'Vectors & 3D Lines: Standard Dot/Cross Applications', activity: 'Practice MCQs', duration: 90, priority: 'High', phase: 'Phase 2: In-Depth Mastery', status: 'pending', date: '2025-02-25' }
  ];

  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO study_tasks (
      id, plan_id, user_id, subject_id, topic_id, title, activity_type, duration_minutes, priority, phase, due_date, status, order_index, how_to_study
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleTasks.forEach((t, idx) => {
    const howToStudyObj = generateHowToStudyBlueprint(t.activity, t.duration, 'beginner', t.title, 'Key core concepts & exam patterns');
    insertTask.run(t.id, t.plan_id, t.user_id, t.subject_id, t.topic_id, t.title, t.activity, t.duration, t.priority, t.phase, t.date, t.status, idx, JSON.stringify(howToStudyObj));
  });

  // Seed sample timetable sessions for current week
  const insertSession = db.prepare(`
    INSERT OR REPLACE INTO timetable_sessions (
      id, user_id, plan_id, task_id, subject_id, day_of_week, start_time, end_time, session_date, title, activity_type, status, how_to_study
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleSessions = [
    { id: 'sess-1', day: 'Mon', start: '08:00', end: '09:30', subj: 'jee-phys', title: 'Physics: Kinematics Problem Solving', act: 'Practice MCQs', status: 'completed' },
    { id: 'sess-2', day: 'Mon', start: '16:00', end: '17:30', subj: 'jee-chem', title: 'Chemistry: VSEPR Structures', act: 'Concept Reading', status: 'completed' },
    { id: 'sess-3', day: 'Tue', start: '08:00', end: '09:30', subj: 'jee-math', title: 'Math: Matrices & Determinants', act: 'Concept Reading', status: 'completed' },
    { id: 'sess-4', day: 'Tue', start: '16:00', end: '17:30', subj: 'jee-phys', title: 'Physics: Newton Laws Review', act: 'Formula Revision', status: 'completed' },
    { id: 'sess-5', day: 'Wed', start: '08:00', end: '09:30', subj: 'jee-chem', title: 'Chemistry: Chemical Bonding', act: 'Practice MCQs', status: 'completed' },
    { id: 'sess-6', day: 'Wed', start: '16:00', end: '17:30', subj: 'jee-math', title: 'Math: Cramer Rule & Systems', act: 'PYQ Review', status: 'scheduled' },
    { id: 'sess-7', day: 'Thu', start: '08:00', end: '09:30', subj: 'jee-phys', title: 'Physics: Work Energy Power', act: 'Concept Reading', status: 'scheduled' },
    { id: 'sess-8', day: 'Thu', start: '16:00', end: '17:30', subj: 'jee-chem', title: 'Chemistry: Periodic Trends', act: 'Note Making', status: 'scheduled' },
    { id: 'sess-9', day: 'Fri', start: '08:00', end: '09:30', subj: 'jee-math', title: 'Math: Determinant Properties Drill', act: 'Practice MCQs', status: 'scheduled' },
    { id: 'sess-10', day: 'Fri', start: '16:00', end: '17:30', subj: 'jee-phys', title: 'Physics: Circular Motion Dynamics', act: 'Concept Reading', status: 'scheduled' },
    { id: 'sess-11', day: 'Sat', start: '08:00', end: '10:00', subj: 'jee-math', title: 'Weekly Consolidation & Weak Topic Drill', act: 'Mock Test', status: 'scheduled' },
    { id: 'sess-12', day: 'Sat', start: '16:00', end: '17:30', subj: 'jee-phys', title: 'Weekend Mistakes Notebook Analysis', act: 'PYQ Review', status: 'scheduled' }
  ];

  sampleSessions.forEach(s => {
    const sessionBlueprint = generateHowToStudyBlueprint(s.act, 90, 'beginner', s.title, 'Timetable session mastery');
    insertSession.run(s.id, demoUserId, demoPlanId, null, s.subj, s.day, s.start, s.end, null, s.title, s.act, s.status, JSON.stringify(sessionBlueprint));
  });

  // Seed sample practice logs for streak history
  const insertLog = db.prepare(`
    INSERT OR REPLACE INTO daily_practice_logs (
      id, user_id, exam_id, practice_date, target_count, completed_count, correct_count, streak_count, is_target_met
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    insertLog.run(`log-${demoUserId}-${dateStr}`, demoUserId, 'jee-main', dateStr, 10, 10, 8 + (i % 3), 5 - i, 1);
  }

  // 6. Seed Official PDF Question Papers and Booklets
  const pdfUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'pyq_pdfs');
  if (!fs.existsSync(pdfUploadDir)) {
    fs.mkdirSync(pdfUploadDir, { recursive: true });
  }

  const samplePdfPapers = [
    {
      id: 'pdf-jee-main-2024-s1',
      exam_id: 'jee-main',
      title: 'JEE Main 2024 Session 1 (27 Jan Shift 1) Official Question Paper & Key',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'JEE_Main_2024_Session1_Shift1.pdf',
      description: 'Official NTA question paper including Physics, Chemistry, and Mathematics with answer key and section-wise weightage breakdown.',
      is_official: 1,
      download_count: 142
    },
    {
      id: 'pdf-jee-main-2023-s2',
      exam_id: 'jee-main',
      title: 'JEE Main 2023 Session 2 Official Paper with Answer Key',
      year: 2023,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'JEE_Main_2023_Session2_Official.pdf',
      description: 'Complete April session question paper with official question IDs, correct option keys, and marking scheme references.',
      is_official: 1,
      download_count: 98
    },
    {
      id: 'pdf-jee-adv-2024-p1',
      exam_id: 'jee-adv',
      title: 'JEE Advanced 2024 Paper 1 (Physics, Chemistry & Math)',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'JEE_Advanced_2024_Paper1.pdf',
      description: 'Official IIT Madras question paper featuring single correct, multi-correct, and numerical value questions.',
      is_official: 1,
      download_count: 115
    },
    {
      id: 'pdf-neet-2024',
      exam_id: 'neet-ug',
      title: 'NEET UG 2024 Official Question Booklet (Code Q1) & Solutions',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'NEET_UG_2024_Code_Q1.pdf',
      description: 'Complete 200-question booklet covering Physics, Chemistry, Botany, and Zoology with NTA official key.',
      is_official: 1,
      download_count: 230
    },
    {
      id: 'pdf-neet-2023',
      exam_id: 'neet-ug',
      title: 'NEET UG 2023 National Entrance Examination Paper',
      year: 2023,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'NEET_UG_2023_Official_Paper.pdf',
      description: 'Official question paper with verified NCERT chapter citations and high-yield question classifications.',
      is_official: 1,
      download_count: 185
    },
    {
      id: 'pdf-upsc-pre-2024-gs',
      exam_id: 'upsc-cse',
      title: 'UPSC Civil Services Prelims 2024 General Studies Paper I',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'UPSC_CSE_Prelims_2024_GS1.pdf',
      description: '100 questions covering Indian Polity, Economy, Modern History, Geography, Environment, and Science & Tech.',
      is_official: 1,
      download_count: 310
    },
    {
      id: 'pdf-upsc-pre-2024-csat',
      exam_id: 'upsc-cse',
      title: 'UPSC Civil Services Prelims 2024 CSAT Paper II (Aptitude)',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'UPSC_CSE_Prelims_2024_CSAT2.pdf',
      description: 'Official UPSC CSAT 80 questions with Reading Comprehension, Quantitative Aptitude, and Logical Reasoning.',
      is_official: 1,
      download_count: 264
    },
    {
      id: 'pdf-ssc-cgl-2024-t1',
      exam_id: 'ssc-cgl',
      title: 'SSC CGL Tier 1 2024 Official Shift 1 Question Paper',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'SSC_CGL_2024_Tier1_Shift1.pdf',
      description: 'Official Staff Selection Commission 100 questions covering Reasoning, General Awareness, Quant, and English.',
      is_official: 1,
      download_count: 177
    },
    {
      id: 'pdf-gate-cs-2024',
      exam_id: 'gate',
      title: 'GATE 2024 Computer Science & IT (CS) Official Question Booklet',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'GATE_2024_CS_Paper.pdf',
      description: '65 questions including Engineering Mathematics, General Aptitude, Algorithms, Data Structures, and OS.',
      is_official: 1,
      download_count: 154
    },
    {
      id: 'pdf-nda-2024-math',
      exam_id: 'nda',
      title: 'NDA & NA (I) 2024 Mathematics Official Question Paper',
      year: 2024,
      subject_id: null,
      paper_type: 'Official Question Paper',
      file_name: 'NDA_2024_Mathematics_Paper.pdf',
      description: '120 questions for 300 marks covering Trigonometry, Calculus, Vectors, Statistics, and Coordinate Geometry.',
      is_official: 1,
      download_count: 89
    },
    {
      id: 'pdf-cuet-ug-2024',
      exam_id: 'cuet-ug',
      title: 'CUET UG 2024 Section II Domain Subjects Official Model Paper',
      year: 2024,
      subject_id: null,
      paper_type: 'Model Paper',
      file_name: 'CUET_UG_2024_Domain_Model.pdf',
      description: 'Domain subject practice papers aligned strictly to NCERT Class 12 syllabus with marking scheme.',
      is_official: 1,
      download_count: 73
    }
  ];

  const insertPdf = db.prepare(`
    INSERT OR REPLACE INTO pyq_pdf_papers (
      id, exam_id, title, year, subject_id, paper_type, file_path, file_name,
      file_size_bytes, description, is_official, download_count, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  samplePdfPapers.forEach(p => {
    // Generate actual PDF file on disk
    const destFilePath = path.join(pdfUploadDir, p.file_name);
    const pdfBuffer = createSamplePdf(p.title, p.exam_id, p.year, p.paper_type);
    fs.writeFileSync(destFilePath, pdfBuffer);

    insertPdf.run(
      p.id,
      p.exam_id,
      p.title,
      p.year,
      p.subject_id,
      p.paper_type,
      `/uploads/pyq_pdfs/${p.file_name}`,
      p.file_name,
      pdfBuffer.length,
      p.description,
      p.is_official,
      p.download_count,
      adminUserId
    );
  });

  console.log('[Seed] Database successfully seeded with all Examinations, Syllabi, PYQs, and Demo Accounts!');
}

if (require.main === module) {
  runSeed();
}

module.exports = {
  runSeed
};

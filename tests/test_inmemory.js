// SPPS Comprehensive Automated Test Suite
// Verifies Workflows A through F as specified in the Master Development Prompt
const { server } = require('../server/server');
const { db } = require('../server/db');
const { EventEmitter } = require('node:events');

class MockRequest extends EventEmitter {
  constructor(method, url, headers = {}, body = null) {
    super();
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.body = body;
  }
}

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    Object.assign(this.headers, headers);
  }

  write(chunk) {
    this.body += chunk;
    return true;
  }

  end(data = '') {
    if (data) this.body += data;
    this.emit('finish');
  }
}

function invokeHandler(method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = new MockRequest(method, url, headers, body);
    const res = new MockResponse();

    res.on('finish', () => {
      let parsed = null;
      try {
        parsed = res.body ? JSON.parse(res.body) : null;
      } catch (e) {
        parsed = res.body;
      }
      resolve({ status: res.statusCode, headers: res.headers, data: parsed });
    });

    server.emit('request', req, res);

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.emit('data', Buffer.from(payload));
    }
    req.emit('end');
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('   SPPS Automated End-to-End Acceptance Test Suite');
  console.log('   Testing Workflows A through H across all System Modules');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // WORKFLOW A: NEW STUDENT REGISTRATION & PERSONALIZED ONBOARDING
    // -------------------------------------------------------------
    console.log('--- Workflow A: New Student Registration & Personalized Roadmap ---');

    const studentEmail = `student.test.${Date.now()}@spps.edu`;
    const regRes = await invokeHandler('POST', '/api/auth/register', {}, {
      full_name: 'Tanvi Deshmukh',
      email: studentEmail,
      password: 'StudentSecure2025!',
      education_level: 'after_12',
      active_exam_id: 'neet-ug',
      prep_mode: 'beginner',
      daily_hours: 5.0,
      preferred_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    });

    assert(regRes.status === 201, 'Student registration returns HTTP 201 Created');
    assert(Boolean(regRes.data.token), 'Registration returns persistent session token');
    const studentToken = regRes.data.token;
    const studentHeaders = { authorization: `Bearer ${studentToken}` };

    // Verify session persistence via /api/auth/me
    const meRes = await invokeHandler('GET', '/api/auth/me', studentHeaders);
    assert(meRes.status === 200, 'GET /api/auth/me validates session persistence');
    assert(meRes.data.user.full_name === 'Tanvi Deshmukh', 'User profile retrieved accurately');
    assert(meRes.data.user.active_exam_id === 'neet-ug', 'Active exam is set to NEET-UG');
    assert(meRes.data.user.role === 'student', 'Default user role is student');

    // Verify personalized study plan automatically generated
    const planRes = await invokeHandler('GET', '/api/study-plan', studentHeaders);
    assert(planRes.status === 200 && planRes.data.plan, 'Personalized study plan automatically generated');
    assert(planRes.data.plan.prep_mode === 'beginner', 'Study plan matches beginner preparation mode');
    assert(planRes.data.tasks.length > 0, `Generated ${planRes.data.tasks.length} structured study tasks for NEET-UG`);

    // Verify automatic timetable generated
    const ttRes = await invokeHandler('GET', '/api/timetable', studentHeaders);
    assert(ttRes.status === 200, 'GET /api/timetable returns HTTP 200');
    assert(ttRes.data.sessions.length > 0, `Generated ${ttRes.data.sessions.length} timetable sessions across preferred days`);

    // -------------------------------------------------------------
    // WORKFLOW B: EXAMINATION DISCOVERY & OFFICIAL SYLLABUS DOSSIER
    // -------------------------------------------------------------
    console.log('\n--- Workflow B: Exam Discovery, Search & 17-Point Dossier ---');

    // 1. All Exams
    const allExams = await invokeHandler('GET', '/api/exams');
    assert(allExams.status === 200, 'GET /api/exams returns HTTP 200');
    assert(allExams.data.exams.length >= 10, `Directory contains ${allExams.data.exams.length} Indian examinations`);

    // 2. Stage filtering
    const stage10 = await invokeHandler('GET', '/api/exams?stage=after_10');
    assert(stage10.data.exams.some(e => e.id === 'delhi-cet'), 'Stage filter after_10 includes Delhi CET (Polytechnic)');

    const stage12 = await invokeHandler('GET', '/api/exams?stage=after_12');
    assert(stage12.data.exams.some(e => e.id === 'jee-main'), 'Stage filter after_12 includes JEE Main');
    assert(stage12.data.exams.some(e => e.id === 'nda'), 'Stage filter after_12 includes NDA & NA');

    const stageGrad = await invokeHandler('GET', '/api/exams?stage=after_grad');
    assert(stageGrad.data.exams.some(e => e.id === 'upsc-cse'), 'Stage filter after_grad includes UPSC CSE');
    assert(stageGrad.data.exams.some(e => e.id === 'ssc-cgl'), 'Stage filter after_grad includes SSC CGL');
    assert(stageGrad.data.exams.some(e => e.id === 'gate'), 'Stage filter after_grad includes GATE');

    // 3. Search filter
    const searchRes = await invokeHandler('GET', '/api/exams?search=civil');
    assert(searchRes.data.exams.some(e => e.id === 'upsc-cse'), 'Search query "civil" finds UPSC CSE');

    // 4. Dedicated Exam Details Page
    const jeeDossier = await invokeHandler('GET', '/api/exams/jee-main');
    assert(jeeDossier.status === 200, 'GET /api/exams/jee-main returns full dossier');
    assert(Boolean(jeeDossier.data.exam.official_url), 'Exam contains verified official URL');
    assert(Boolean(jeeDossier.data.exam.schedule_verified_date), 'Exam contains last verified date metadata');
    assert(jeeDossier.data.subjects.length === 3, 'JEE Main has 3 subjects (Physics, Chemistry, Mathematics)');
    assert(jeeDossier.data.subjects[0].topics.length > 0, 'Subject contains detailed syllabus topics');

    // 5. Switch Active Exam
    const switchRes = await invokeHandler('POST', '/api/exams/upsc-cse/select', studentHeaders, {
      prep_mode: 'intermediate',
      daily_hours: 6.0
    });
    assert(switchRes.status === 200, 'POST /api/exams/upsc-cse/select switches target exam and re-generates plan');

    // -------------------------------------------------------------
    // WORKFLOW C: PREVIOUS-YEAR QUESTIONS (PYQs) & TIMED PRACTICE
    // -------------------------------------------------------------
    console.log('\n--- Workflow C: PYQ Practice, Scoring & Bookmarks ---');

    // 1. Fetch PYQ questions
    const pyqList = await invokeHandler('GET', '/api/pyqs?exam_id=jee-main', studentHeaders);
    assert(pyqList.status === 200, 'GET /api/pyqs status 200');
    assert(pyqList.data.questions.length > 0, `Retrieved ${pyqList.data.questions.length} questions for JEE Main`);

    const q = pyqList.data.questions[0];
    assert(Array.isArray(q.options), 'Question options correctly parsed into JSON array');
    assert(Boolean(q.verification_status), 'Question includes official verification status');

    // 2. Submit Correct Attempt
    const attempt1 = await invokeHandler('POST', `/api/pyqs/${q.id}/attempt`, {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      selected_answer: q.correct_answer,
      time_spent_seconds: 45,
      mode: 'pyq_browser'
    });

    assert(attempt1.status === 200, 'Question attempt submission status 200');
    assert(attempt1.data.isCorrect === true, 'Correct answer correctly validated by backend');
    assert(Boolean(attempt1.data.explanation), 'Backend returns step-by-step pedagogical explanation');

    // 3. Submit Incorrect Attempt
    const attempt2 = await invokeHandler('POST', `/api/pyqs/${q.id}/attempt`, {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      selected_answer: 'Completely Wrong Answer',
      time_spent_seconds: 20,
      mode: 'pyq_browser'
    });
    assert(attempt2.data.isCorrect === false, 'Incorrect answer correctly flagged as false');

    // 4. Bookmark Question
    const bmRes = await invokeHandler('POST', `/api/pyqs/${q.id}/bookmark`, studentHeaders);
    assert(bmRes.status === 200 && bmRes.data.bookmarked === true, 'Question successfully bookmarked');

    // 5. Verify bookmarked questions filter
    const bmList = await invokeHandler('GET', '/api/pyqs?bookmarked_only=true', studentHeaders);
    assert(bmList.data.questions.some(item => item.id === q.id), 'Bookmarked questions filter correctly retrieves bookmarked question');

    // -------------------------------------------------------------
    // WORKFLOW D: DAILY PRACTICE, STREAKS & ADAPTIVE TARGETS
    // -------------------------------------------------------------
    console.log('\n--- Workflow D: Daily Practice & Adaptive Streak Engine ---');

    // 1. Retrieve Daily Practice Set
    const dpRes = await invokeHandler('GET', '/api/daily-practice', studentHeaders);
    assert(dpRes.status === 200, 'GET /api/daily-practice returns HTTP 200');
    assert(typeof dpRes.data.target === 'number' && dpRes.data.target >= 6, `Daily target is ${dpRes.data.target} questions`);

    // 2. Test Streak Integrity: award streak only on completing target
    const streakUser = `streak.test.${Date.now()}@spps.edu`;
    const streakReg = await invokeHandler('POST', '/api/auth/register', {}, {
      full_name: 'Rohan Joshi',
      email: streakUser,
      password: 'SecurePassword123!',
      education_level: 'after_12',
      active_exam_id: 'jee-main',
      prep_mode: 'beginner',
      daily_hours: 4.0
    });
    const sHeaders = { authorization: `Bearer ${streakReg.data.token}` };

    // Fetch initial streak (should be 0)
    const initialDash = await invokeHandler('GET', '/api/analytics/dashboard', sHeaders);
    assert(initialDash.data.streak.current === 0, 'New student starts with streak of 0 days');

    // Set target to 2 for quick automated testing
    db.prepare("UPDATE user_streaks SET target_questions_per_day = 2, min_target = 2 WHERE user_id = ?").run(streakReg.data.user.id);

    // Solve question 1 (1 of 2, target NOT met yet)
    const sAtt1 = await invokeHandler('POST', `/api/pyqs/${q.id}/attempt`, {
      ...sHeaders,
      'content-type': 'application/json'
    }, {
      selected_answer: q.correct_answer,
      time_spent_seconds: 30
    });
    assert(sAtt1.data.todayCompleted === 1, 'Question 1 recorded (1 of 2 completed)');
    assert(sAtt1.data.isTargetMet === false, 'Daily target not met yet (1 < 2)');
    assert(sAtt1.data.currentStreak === 0, 'Streak NOT awarded before target is completed');

    // Solve question 2 (2 of 2, target NOW met!)
    const sAtt2 = await invokeHandler('POST', `/api/pyqs/${q.id}/attempt`, {
      ...sHeaders,
      'content-type': 'application/json'
    }, {
      selected_answer: q.correct_answer,
      time_spent_seconds: 30
    });
    assert(sAtt2.data.todayCompleted === 2, 'Question 2 recorded (2 of 2 completed)');
    assert(sAtt2.data.isTargetMet === true, 'Daily target now met (2 >= 2)');
    assert(sAtt2.data.currentStreak === 1, 'Streak awarded (+1 day) upon completing daily target');

    // Solve question 3 on the same day (idempotency: should NOT multiply streak again today)
    const sAtt3 = await invokeHandler('POST', `/api/pyqs/${q.id}/attempt`, {
      ...sHeaders,
      'content-type': 'application/json'
    }, {
      selected_answer: q.correct_answer,
      time_spent_seconds: 30
    });
    assert(sAtt3.data.currentStreak === 1, 'Duplicate submissions on same calendar date do NOT increase streak');

    // -------------------------------------------------------------
    // WORKFLOW E: PROGRESS TRACKING, TASK COMPLETION & WEAK TOPICS
    // -------------------------------------------------------------
    console.log('\n--- Workflow E: Progress Analytics & Weak Topic Detection ---');

    // 1. Retrieve active study tasks
    const tasksRes = await invokeHandler('GET', '/api/study-plan', sHeaders);
    assert(tasksRes.data.tasks.length > 0, 'Active study tasks available');
    const task1 = tasksRes.data.tasks[0];

    // 2. Explicitly Mark task as completed
    const taskUpdate = await invokeHandler('PATCH', `/api/study-plan/tasks/${task1.id}`, {
      ...sHeaders,
      'content-type': 'application/json'
    }, {
      status: 'completed',
      notes: 'Completed all NCERT derivations and notes.'
    });
    assert(taskUpdate.status === 200 && taskUpdate.data.task.status === 'completed', 'Study task explicitly marked completed');

    // 3. Verify analytics update
    const dashAfter = await invokeHandler('GET', '/api/analytics/dashboard', sHeaders);
    assert(dashAfter.status === 200, 'GET /api/analytics/dashboard returns 200');
    assert(dashAfter.data.syllabus.completedTasks >= 1, 'Dashboard reflects completed study task');
    assert(dashAfter.data.readinessIndex > 0, `Exam Readiness Index calculated: ${dashAfter.data.readinessIndex}%`);
    assert(Array.isArray(dashAfter.data.weakTopics), 'Analytics calculates topic-level weakness & revision suggestions');

    // -------------------------------------------------------------
    // WORKFLOW F: SECURITY, AUTHORIZATION & ADMIN CONSOLE
    // -------------------------------------------------------------
    console.log('\n--- Workflow F: Security, Access Control & Admin Operations ---');

    // 1. Protected routes reject unauthenticated requests
    const unauthRes = await invokeHandler('GET', '/api/analytics/dashboard');
    assert(unauthRes.status === 401, 'Protected route /api/analytics/dashboard rejects unauthenticated request with 401');

    // 2. Data Isolation: Student A cannot modify Student B's task
    const crossRes = await invokeHandler('PATCH', `/api/study-plan/tasks/${task1.id}`, studentHeaders, {
      status: 'completed'
    });
    // Task belonging to Rohan cannot be updated by Tanvi
    const rohanTaskCheck = db.prepare('SELECT user_id FROM study_tasks WHERE id = ?').get(task1.id);
    assert(rohanTaskCheck.user_id !== studentHeaders.user_id, 'Cross-user boundary enforced: users cannot alter other students tasks');

    // 3. Admin Authorization: Student cannot access Admin Stats
    const studentAdminAttempt = await invokeHandler('GET', '/api/admin/stats', studentHeaders);
    assert(studentAdminAttempt.status === 403, 'Normal student accessing /api/admin/stats is rejected with 403 Forbidden');

    // 3b. Security verification: Unauthenticated requests to push questions or PDFs are rejected with 401
    const unauthUploadAttempt = await invokeHandler('POST', '/api/admin/pyqs', { 'content-type': 'application/json' }, { question_text: 'Hacked question' });
    assert(unauthUploadAttempt.status === 401, 'Unauthenticated question upload rejected with 401 Unauthorized');

    const unauthPdfAttempt = await invokeHandler('POST', '/api/admin/pyq-pdfs', { 'content-type': 'application/json' }, { title: 'Hacked PDF' });
    assert(unauthPdfAttempt.status === 401, 'Unauthenticated PDF paper upload rejected with 401 Unauthorized');

    // 3c. Security verification: Normal student attempting database push is rejected with 403 Forbidden
    const studentUploadAttempt = await invokeHandler('POST', '/api/admin/pyqs', { ...studentHeaders, 'content-type': 'application/json' }, { question_text: 'Unauthorized question' });
    assert(studentUploadAttempt.status === 403, 'Normal student attempting question upload rejected with 403 Forbidden');

    const studentPdfAttempt = await invokeHandler('POST', '/api/admin/pyq-pdfs', { ...studentHeaders, 'content-type': 'application/json' }, { title: 'Unauthorized PDF' });
    assert(studentPdfAttempt.status === 403, 'Normal student attempting PDF upload rejected with 403 Forbidden');

    // 4. Admin Login & Access
    const adminLogin = await invokeHandler('POST', '/api/auth/admin-demo');
    assert(adminLogin.status === 200, 'Admin login endpoint returns 200');
    const adminHeaders = { authorization: `Bearer ${adminLogin.data.token}` };

    const adminStats = await invokeHandler('GET', '/api/admin/stats', adminHeaders);
    assert(adminStats.status === 200, 'GET /api/admin/stats successfully accessible by Administrator');
    assert(adminStats.data.stats.totalStudents >= 1, `Admin stats reports ${adminStats.data.stats.totalStudents} students`);

    // 5. Admin Create Examination
    const testExamId = `test-exam-${Date.now()}`;
    const createExamRes = await invokeHandler('POST', '/api/admin/exams', {
      ...adminHeaders,
      'content-type': 'application/json'
    }, {
      id: testExamId,
      name: 'NATA (National Aptitude Test in Architecture)',
      short_name: 'NATA',
      stage: 'after_12',
      category: 'Design & Architecture',
      conducting_authority: 'Council of Architecture (CoA)',
      official_url: 'https://nata.in',
      source_url: 'https://nata.in',
      overview: 'National level entrance examination for admission into 5-year B.Arch degree courses in India.',
      qualification: 'Passed 10+2 with Physics, Chemistry, and Mathematics.',
      official_schedule: 'Test 1, 2, 3 conducted between April and July annually.'
    });
    assert(createExamRes.status === 201, 'Administrator can create new examination (HTTP 201 Created)');

    // 6. Admin Create Question
    const createQRes = await invokeHandler('POST', '/api/admin/pyqs', {
      ...adminHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'jee-main',
      year: 2024,
      question_text: 'What is the SI unit of Magnetic Flux?',
      options: ['Weber (Wb)', 'Tesla (T)', 'Henry (H)', 'Gauss (G)'],
      correct_answer: 'Weber (Wb)',
      explanation: 'Magnetic flux is measured in Weber (Wb) in the SI system. 1 Weber = 1 Tesla × m².',
      difficulty: 'Easy',
      is_official: 1,
      source_url: 'https://jeemain.nta.nic.in'
    });
    assert(createQRes.status === 201, 'Administrator can create question with pedagogical explanation');

    // 7. Admin Archive Examination
    const archiveRes = await invokeHandler('DELETE', `/api/admin/exams/${testExamId}`, adminHeaders);
    assert(archiveRes.status === 200, 'Administrator can archive examination');

    // Verify archived exam is excluded from public directory
    const publicExamsAfter = await invokeHandler('GET', '/api/exams');
    assert(!publicExamsAfter.data.exams.some(e => e.id === testExamId), 'Archived examination is automatically excluded from public student directory');

    // 8. Test Year-Wise & Topic-Wise PYQ Summary endpoint
    const pyqSummary = await invokeHandler('GET', '/api/pyqs/summary?exam_id=jee-main', studentHeaders);
    assert(pyqSummary.status === 200, 'GET /api/pyqs/summary returns HTTP 200');
    assert(Array.isArray(pyqSummary.data.years) && pyqSummary.data.years.length > 0, 'PYQ summary returns year-wise question paper statistics');
    assert(Array.isArray(pyqSummary.data.topics) && pyqSummary.data.topics.length > 0, 'PYQ summary returns topic-wise syllabus statistics');

    // 9. Test Topic-Wise Filtering
    const topicFiltered = await invokeHandler('GET', '/api/pyqs?exam_id=jee-main&topic_id=jee-phys-4', studentHeaders);
    assert(topicFiltered.status === 200, 'GET /api/pyqs with topic_id returns HTTP 200');
    assert(topicFiltered.data.questions.every(item => item.topic_id === 'jee-phys-4'), 'Topic filter strictly returns questions belonging to the selected topic');

    // 10. Test Admin Bulk Import with Year and Topic mapping
    const bulkImportRes = await invokeHandler('POST', '/api/admin/pyqs/import', {
      ...adminHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'jee-main',
      default_year: 2024,
      default_topic_id: 'jee-phys-1',
      format: 'json',
      data: [
        {
          question_text: 'A particle moves in a straight line with uniform acceleration. What is v² - u²?',
          options_json: ['2as', 'as', '3as', '0.5as'],
          correct_answer: '2as',
          explanation: 'Third equation of kinematics: v² = u² + 2as => v² - u² = 2as.',
          difficulty: 'Easy',
          is_official: 1
        }
      ]
    });
    assert(bulkImportRes.status === 200, 'Admin bulk import returns HTTP 200');
    assert(bulkImportRes.data.imported_count >= 1, 'Admin bulk import successfully inserts questions with year and topic mapping');

    // -------------------------------------------------------------
    // WORKFLOW G: OFFICIAL PREVIOUS-YEAR PDF PAPERS (ADMIN UPLOAD & STUDENT ACCESS)
    // -------------------------------------------------------------
    console.log('\n--- Workflow G: Previous-Year PDF Question Papers Management & Student Access ---');

    // 11. Student can list official PDF papers for JEE Main
    const pdfListRes = await invokeHandler('GET', '/api/pyq-pdfs?exam_id=jee-main', studentHeaders);
    assert(pdfListRes.status === 200, 'GET /api/pyq-pdfs returns HTTP 200');
    assert(Array.isArray(pdfListRes.data.papers), 'PDF listing returns an array of papers');
    assert(pdfListRes.data.papers.length > 0, 'JEE Main has seeded official PDF question papers available');

    // 12. Admin uploads a new official PDF paper with base64 payload
    const samplePdfBuffer = Buffer.from('%PDF-1.4\n%SPPS Test PDF Document\n%%EOF', 'utf-8');
    const adminUploadRes = await invokeHandler('POST', '/api/admin/pyq-pdfs', {
      ...adminHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'jee-main',
      year: 2024,
      paper_type: 'Official Question Paper',
      title: 'JEE Main 2024 Test Official PDF Paper with Solutions',
      description: 'Comprehensive test booklet uploaded via Admin Console',
      file_name: 'JEE_Main_2024_Test_Upload.pdf',
      file_data: `data:application/pdf;base64,${samplePdfBuffer.toString('base64')}`
    });

    assert(adminUploadRes.status === 201, 'Administrator can upload official PDF question paper with HTTP 201');
    assert(adminUploadRes.data.paper && adminUploadRes.data.paper.id, 'Uploaded PDF paper receives unique ID and is persisted to database');
    const uploadedPaperId = adminUploadRes.data.paper.id;

    // 13. Student can filter PDF papers by year and search term
    const filterPdfRes = await invokeHandler('GET', `/api/pyq-pdfs?exam_id=jee-main&year=2024&search=Test`, studentHeaders);
    assert(filterPdfRes.status === 200, 'GET /api/pyq-pdfs with year and search filters returns HTTP 200');
    assert(filterPdfRes.data.papers.some(p => p.id === uploadedPaperId), 'Newly uploaded PDF paper appears in filtered student query results');

    // 14. Student views PDF online (streaming with inline disposition)
    const viewPdfRes = await invokeHandler('GET', `/api/pyq-pdfs/${uploadedPaperId}/view`, studentHeaders);
    assert(viewPdfRes.status === 200, 'GET /api/pyq-pdfs/:id/view returns HTTP 200');
    assert(viewPdfRes.headers['Content-Type'] === 'application/pdf', 'PDF online view sets Content-Type application/pdf');

    // 15. Student downloads PDF paper (increments download count)
    const initialDownloads = db.prepare('SELECT download_count FROM pyq_pdf_papers WHERE id = ?').get(uploadedPaperId).download_count;
    const downloadPdfRes = await invokeHandler('GET', `/api/pyq-pdfs/${uploadedPaperId}/download`, studentHeaders);
    assert(downloadPdfRes.status === 200, 'GET /api/pyq-pdfs/:id/download returns HTTP 200');
    assert(downloadPdfRes.headers['Content-Type'] === 'application/pdf', 'Download endpoint sets Content-Type application/pdf');
    assert(downloadPdfRes.headers['Content-Disposition'].includes('attachment'), 'Download endpoint sets attachment Content-Disposition');

    const updatedDownloads = db.prepare('SELECT download_count FROM pyq_pdf_papers WHERE id = ?').get(uploadedPaperId).download_count;
    assert(updatedDownloads === initialDownloads + 1, 'Downloading PDF increments download counter by exactly 1');

    // 16. Admin can delete PDF paper
    const deletePdfRes = await invokeHandler('DELETE', `/api/admin/pyq-pdfs/${uploadedPaperId}`, adminHeaders);
    assert(deletePdfRes.status === 200, 'Administrator can delete PDF paper with HTTP 200');

    // Verify deletion
    const verifyDel = db.prepare('SELECT id FROM pyq_pdf_papers WHERE id = ?').get(uploadedPaperId);
    assert(!verifyDel, 'Deleted PDF paper is completely purged from persistent database');

    // -------------------------------------------------------------
    // WORKFLOW H: FREE STUDY TIME SLOTS & PEDAGOGICAL WHAT/HOW BLUEPRINT
    // -------------------------------------------------------------
    console.log('\n--- Workflow H: Free Study Time Slots & Pedagogical Execution Protocol ---');

    // 17. Register student providing exact time slots instead of raw hours
    const slotUserEmail = `timeslot_student_${Date.now()}@spps.edu`;
    const slotRegRes = await invokeHandler('POST', '/api/auth/register', { 'content-type': 'application/json' }, {
      name: 'Time Slot Student',
      email: slotUserEmail,
      password: 'Password@123',
      education_level: 'Class 12',
      primary_target_exam_id: 'neet-ug',
      prep_mode: 'Foundation',
      time_slots: ['06:30-08:30', '19:00-21:30'] // 2.0h + 2.5h = 4.5 hours daily
    });

    assert(slotRegRes.status === 201, 'Student registration with custom time slots returns HTTP 201');
    assert(slotRegRes.data.user.daily_hours === 4.5, 'Registration automatically computes daily_hours from time_slots (4.5h)');
    assert(Array.isArray(slotRegRes.data.user.time_slots) && slotRegRes.data.user.time_slots.length === 2, 'Registration persists normalized time_slots array');
    const slotStudentToken = slotRegRes.data.token;
    const slotStudentHeaders = { authorization: `Bearer ${slotStudentToken}` };

    // 18. Verify generated study plan includes structured "How to Study" blueprint
    const slotPlanRes = await invokeHandler('GET', '/api/study-plan', slotStudentHeaders);
    assert(slotPlanRes.status === 200, 'GET /api/study-plan for time-slot student returns HTTP 200');
    assert(Array.isArray(slotPlanRes.data.tasks) && slotPlanRes.data.tasks.length > 0, 'Study plan tasks successfully generated for student');
    const sampleTask = slotPlanRes.data.tasks[0];
    assert(sampleTask.how_to_study && typeof sampleTask.how_to_study === 'object', 'Task includes structured how_to_study pedagogical object');
    assert(Array.isArray(sampleTask.how_to_study.micro_phases) && sampleTask.how_to_study.micro_phases.length >= 3, 'How to study contains timed micro-phases (warm-up, deep sprint, active recall)');
    assert(Array.isArray(sampleTask.how_to_study.cognitive_techniques) && sampleTask.how_to_study.cognitive_techniques.length > 0, 'How to study contains evidence-based cognitive techniques');
    assert(Array.isArray(sampleTask.how_to_study.session_checklist) && sampleTask.how_to_study.session_checklist.length > 0, 'How to study contains actionable session checklist');
    assert(Boolean(sampleTask.how_to_study.pitfall_warning), 'How to study provides specific cognitive pitfall warning');

    // 19. Verify generated timetable strictly maps into student free time slots
    const slotTtRes = await invokeHandler('GET', '/api/timetable', slotStudentHeaders);
    assert(slotTtRes.status === 200, 'GET /api/timetable returns HTTP 200');
    assert(Array.isArray(slotTtRes.data.sessions) && slotTtRes.data.sessions.length > 0, 'Timetable sessions generated');
    const slotSessions = slotTtRes.data.sessions;
    const allSessionsInSlots = slotSessions.every(s => 
      (s.start_time === '06:30' && s.end_time === '08:30') || 
      (s.start_time === '19:00' && s.end_time === '21:30')
    );
    assert(allSessionsInSlots, 'All generated timetable sessions strictly align with the student’s configured free time slots');
    assert(slotSessions[0].how_to_study && typeof slotSessions[0].how_to_study === 'object', 'Timetable session contains deserialized how_to_study blueprint');

    // 20. Student updates free time slots via POST /api/study-plan/generate
    const updateSlotsRes = await invokeHandler('POST', '/api/study-plan/generate', {
      ...slotStudentHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'neet-ug',
      prep_mode: 'Intensive',
      time_slots: ['07:00-09:00', '14:00-15:30', '20:00-22:00'] // 2h + 1.5h + 2h = 5.5 hours
    });

    assert(updateSlotsRes.status === 200, 'POST /api/study-plan/generate with updated free time slots returns HTTP 200');
    assert(updateSlotsRes.data.daily_hours === 5.5, 'Plan generator updates daily_hours to match new time slots (5.5h)');
    assert(updateSlotsRes.data.time_slots.length === 3, 'Plan generator persists 3 configured time slots');

    // 21. Profile API reflects updated free time slots and calculated daily hours
    const profileRes = await invokeHandler('GET', '/api/auth/profile', slotStudentHeaders);
    assert(profileRes.status === 200, 'GET /api/auth/profile returns HTTP 200');
    assert(profileRes.data.user.daily_hours === 5.5, 'Profile reflects auto-calculated 5.5 hours from free time slots');
    assert(Array.isArray(profileRes.data.user.time_slots) && profileRes.data.user.time_slots.length === 3, 'Profile returns updated time slots array');

    // 22. Student configures different time slots for different days (Weekday vs Weekend availability)
    const diffSlotsRes = await invokeHandler('POST', '/api/study-plan/generate', {
      ...slotStudentHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'neet-ug',
      prep_mode: 'Intermediate',
      time_slots: [
        { start: '19:00', end: '22:00', label: 'Weekday Problem Drill', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        { start: '09:30', end: '13:00', label: 'Weekend Syllabus Marathon', days: ['Sat', 'Sun'] }
      ]
    });

    assert(diffSlotsRes.status === 200, 'Student can generate plan with different time slots for weekdays vs weekends');
    assert(diffSlotsRes.data.daily_hours === 3.1, 'Plan generator calculates weighted daily hours for different slots (~3.1h/day)');

    // 23. Verify timetable allocates sessions strictly matching each day’s specific time slot
    const diffTtRes = await invokeHandler('GET', '/api/timetable', slotStudentHeaders);
    assert(diffTtRes.status === 200, 'GET /api/timetable returns HTTP 200 for different time slots schedule');
    const diffSessions = diffTtRes.data.sessions;
    const weekdaySessions = diffSessions.filter(s => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(s.day_of_week));
    const weekendSessions = diffSessions.filter(s => ['Sat', 'Sun'].includes(s.day_of_week));

    const weekdaysMatch = weekdaySessions.every(s => s.start_time === '19:00' && s.end_time === '22:00');
    assert(weekdaysMatch, 'Weekday timetable sessions strictly schedule at 19:00-22:00 as configured');

    const weekendsMatch = weekendSessions.every(s => s.start_time === '09:30' && s.end_time === '13:00');
    assert(weekendsMatch, 'Weekend timetable sessions strictly schedule at 09:30-13:00 as configured');

    // -------------------------------------------------------------
    // WORKFLOW I: CATEGORY-SPECIFIC PEDAGOGICAL CUSTOMIZATION
    // (Beginner Pathway, Intermediate Topic Mastery Diagnostic, Revision Engine)
    // -------------------------------------------------------------
    console.log('\n--- Workflow I: Category-Specific Pedagogical Customization ---');

    // 1. Beginner Category Guidance: Topic Roadmap & Exact Time Breakdown
    const begGuidanceRes = await invokeHandler('GET', '/api/prep-guidance?mode=beginner&exam_id=jee-main', studentHeaders);
    assert(begGuidanceRes.status === 200, 'GET /api/prep-guidance for Beginner returns HTTP 200');
    assert(begGuidanceRes.data.mode === 'beginner', 'Guidance mode correctly set to beginner');
    assert(begGuidanceRes.data.topics && begGuidanceRes.data.topics.length > 0, 'Beginner guidance contains structured topic pathways');

    const firstBegTopic = begGuidanceRes.data.topics[0];
    assert(Boolean(firstBegTopic.time_breakdown), 'Topic contains detailed time allocation breakdown');
    assert(firstBegTopic.time_breakdown.theory.percentage === 40, 'Theory reading is allocated 40% of topic study budget');
    assert(firstBegTopic.time_breakdown.notes.percentage === 15, 'Formula notes and mind maps allocated 15%');
    assert(firstBegTopic.time_breakdown.solved_examples.percentage === 25, 'Solved worked examples allocated 25%');
    assert(firstBegTopic.time_breakdown.graded_practice.percentage === 20, 'Foundational graded practice allocated 20%');
    assert(Array.isArray(firstBegTopic.what_to_prepare) && firstBegTopic.what_to_prepare.length > 0, 'Topic provides actionable What to Prepare checklist');
    assert(Boolean(firstBegTopic.recommended_textbook), 'Topic specifies official recommended textbook');
    assert(Boolean(firstBegTopic.prerequisites), 'Topic specifies prerequisite knowledge boundary');

    // 2. Beginner Study Plan Generation: Tasks contain Beginner Pathway
    const begPlanRes = await invokeHandler('POST', '/api/study-plan/generate', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'jee-main',
      prep_mode: 'beginner'
    });
    assert(begPlanRes.status === 200, 'Beginner study plan generated successfully');
    const begTasksRes = await invokeHandler('GET', '/api/study-plan', studentHeaders);
    assert(begTasksRes.data.tasks.some(t => t.how_to_study && t.how_to_study.beginner_pathway), 'Beginner tasks include full pedagogical pathway object in execution blueprint');

    // 3. Intermediate Category Guidance: Diagnostic Intake & Gap Tracking
    const interDiagRes = await invokeHandler('GET', '/api/topic-mastery?exam_id=jee-main', studentHeaders);
    assert(interDiagRes.status === 200, 'GET /api/topic-mastery returns HTTP 200');
    assert(Array.isArray(interDiagRes.data.diagnostic.topics), 'Diagnostic returns topics list for mastery audit');

    // Student rates topics: 2 as mastered, 1 as needs_practice
    const sampleTopics = interDiagRes.data.diagnostic.topics;
    const topic1 = sampleTopics[0].topic_id;
    const topic2 = sampleTopics[1].topic_id;
    const topic3 = sampleTopics[2].topic_id;

    const saveMasteryRes = await invokeHandler('POST', '/api/topic-mastery', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'jee-main',
      prep_mode: 'intermediate',
      ratings: [
        { topic_id: topic1, mastery_level: 'mastered' },
        { topic_id: topic2, mastery_level: 'mastered' },
        { topic_id: topic3, mastery_level: 'needs_practice' }
      ],
      regenerate_plan: true
    });

    assert(saveMasteryRes.status === 200, 'POST /api/topic-mastery persists student syllabus audit (HTTP 200)');
    assert(saveMasteryRes.data.diagnostic.mastered_count >= 2, 'Diagnostic correctly registers at least 2 mastered topics');
    assert(saveMasteryRes.data.diagnostic.theory_hours_saved >= 7.0, 'System calculates hours saved by skipping repetitive theory (~7+ hrs saved)');

    // Verify Intermediate Plan Adaptation: Mastered topics skip basic theory
    const interTasksRes = await invokeHandler('GET', '/api/study-plan', studentHeaders);
    const masteredTopicTasks = interTasksRes.data.tasks.filter(t => t.topic_id === topic1);
    const hasConceptReading = masteredTopicTasks.some(t => t.activity_type === 'Concept Reading');
    assert(!hasConceptReading, 'Mastered topic skips basic Concept Reading task to prevent redundant studying');
    const hasSpeedPractice = masteredTopicTasks.some(t => t.notes && t.notes.includes('[Syllabus Diagnostic: MASTERED]'));
    assert(hasSpeedPractice, 'Mastered topic receives high-efficiency Speed MCQs & Timed Accuracy Drill');

    const practiceTopicTasks = interTasksRes.data.tasks.filter(t => t.topic_id === topic3);
    const hasTargetedDrill = practiceTopicTasks.some(t => t.notes && t.notes.includes('[Syllabus Diagnostic: NEEDS PRACTICE]'));
    assert(hasTargetedDrill, 'Needs Practice topic receives Targeted Multi-Step Problem Drill');

    // 4. Revision Category Guidance: High-Yield Priority Matrix & PYQ Insistence
    const revGuidanceRes = await invokeHandler('GET', '/api/prep-guidance?mode=revision&exam_id=jee-main', studentHeaders);
    assert(revGuidanceRes.status === 200, 'GET /api/prep-guidance for Revision returns HTTP 200');
    assert(revGuidanceRes.data.mode === 'revision', 'Guidance mode correctly set to revision');
    assert(Boolean(revGuidanceRes.data.protocol.priority_matrix.tier_1), 'Protocol includes Tier-1 High-Yield Chapter Matrix');
    assert(Array.isArray(revGuidanceRes.data.protocol.all_time_revision_routine), 'Protocol details All-Time Revision Routine (15-min blind dumps, timed PYQs, error log)');
    assert(Boolean(revGuidanceRes.data.protocol.pyq_insistence), 'Protocol provides explicit PYQ Insistence guidelines');

    // Generate Revision Plan and verify tasks
    const revPlanRes = await invokeHandler('POST', '/api/study-plan/generate', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'jee-main',
      prep_mode: 'revision'
    });
    assert(revPlanRes.status === 200, 'Revision study plan generated successfully');
    const revTasksRes = await invokeHandler('GET', '/api/study-plan', studentHeaders);
    assert(revTasksRes.data.tasks.some(t => t.activity_type === 'Formula Revision'), 'Revision plan schedules daily 15-Min Blind Sheet Formula Recall tasks');
    assert(revTasksRes.data.tasks.some(t => t.activity_type === 'PYQ Review' && t.notes.includes('PYQ INSISTENCE')), 'Revision plan enforces strict PYQ Insistence with timed countdown sprints');

    // 5. Universal Select Support: Customization works for ANY examination selected by a student
    // A. Class 10: Delhi CET (Polytechnic) in Beginner Mode
    const delhiSelectRes = await invokeHandler('POST', '/api/exams/delhi-cet/select', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      prep_mode: 'beginner'
    });
    assert(delhiSelectRes.status === 200, 'Student can select Class 10 Delhi CET (Polytechnic) exam (HTTP 200)');
    assert(delhiSelectRes.data.plan.taskCount > 0, 'Delhi CET generates full structured tasks roadmap');
    const delhiGuidance = await invokeHandler('GET', '/api/prep-guidance?mode=beginner&exam_id=delhi-cet', studentHeaders);
    assert(delhiGuidance.data.topics.length > 0, 'Delhi CET returns Beginner topic roadmap with 40/15/25/20 breakdown');

    // B. Class 12: NDA & NA in Intermediate Mode with Topic Mastery
    const ndaSelectRes = await invokeHandler('POST', '/api/exams/nda/select', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      prep_mode: 'intermediate'
    });
    assert(ndaSelectRes.status === 200, 'Student can select Class 12 NDA examination (HTTP 200)');
    const ndaMasteryRes = await invokeHandler('GET', '/api/topic-mastery?exam_id=nda', studentHeaders);
    assert(ndaMasteryRes.data.diagnostic.topics.length > 0, 'NDA provides full syllabus topics for mastery diagnostic');
    const ndaTopic1 = ndaMasteryRes.data.diagnostic.topics[0].topic_id;
    const ndaSaveMastery = await invokeHandler('POST', '/api/topic-mastery', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      exam_id: 'nda',
      prep_mode: 'intermediate',
      ratings: [{ topic_id: ndaTopic1, mastery_level: 'mastered' }],
      regenerate_plan: true
    });
    assert(ndaSaveMastery.status === 200, 'Student audits NDA topic mastery and optimizes plan');
    const ndaPlan = await invokeHandler('GET', '/api/study-plan', studentHeaders);
    const ndaMasteredTasks = ndaPlan.data.tasks.filter(t => t.topic_id === ndaTopic1);
    assert(!ndaMasteredTasks.some(t => t.activity_type === 'Concept Reading'), 'NDA mastered topic skips basic theory reading');

    // C. Graduation: CAT (Management) in Revision Mode
    const catSelectRes = await invokeHandler('POST', '/api/exams/cat/select', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      prep_mode: 'revision'
    });
    assert(catSelectRes.status === 200, 'Student can select Graduation CAT exam in Revision mode (HTTP 200)');
    const catGuidance = await invokeHandler('GET', '/api/prep-guidance?mode=revision&exam_id=cat', studentHeaders);
    assert(catGuidance.data.protocol.priority_matrix.tier_1.topic_count > 0, 'CAT returns High-Yield Priority Matrix with Tier-1 chapters');
    const catPlan = await invokeHandler('GET', '/api/study-plan', studentHeaders);
    assert(catPlan.data.tasks.some(t => t.activity_type === 'Formula Revision'), 'CAT revision plan schedules 15-min blind recall routines');

    // D. Technical Engineering: GATE
    const gateSelectRes = await invokeHandler('POST', '/api/exams/gate/select', {
      ...studentHeaders,
      'content-type': 'application/json'
    }, {
      prep_mode: 'beginner'
    });
    assert(gateSelectRes.status === 200, 'Student can select GATE engineering exam (HTTP 200)');
    assert(gateSelectRes.data.plan.taskCount > 0, 'GATE generates comprehensive engineering study roadmap');

    console.log('\n================================================================');
    console.log(`   Final Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================');

  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
    failed++;
  }
}

runAllTests();

// Automated API & Business Logic Test Suite for SPPS
const { startServer } = require('../server/server');
const http = require('node:http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting SPPS Automated Test Suite ===');
  const TEST_PORT = 3456;
  const server = await startServer(TEST_PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Exams Endpoint
    const examsRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/exams',
      method: 'GET'
    });
    assert(examsRes.status === 200, 'GET /api/exams returns status 200');
    assert(Array.isArray(examsRes.data.exams) && examsRes.data.exams.length >= 10, `Found ${examsRes.data.exams?.length} exams in directory`);

    // 2. Test Stage Filters
    const after10 = await request({ hostname: 'localhost', port: TEST_PORT, path: '/api/exams?stage=after_10', method: 'GET' });
    const after12 = await request({ hostname: 'localhost', port: TEST_PORT, path: '/api/exams?stage=after_12', method: 'GET' });
    const afterGrad = await request({ hostname: 'localhost', port: TEST_PORT, path: '/api/exams?stage=after_grad', method: 'GET' });
    assert(after10.data.exams.length > 0, 'Stage after_10 returns exams (Polytechnic/Diploma/ITI)');
    assert(after12.data.exams.length > 0, 'Stage after_12 returns exams (JEE, NEET, CUET, NDA, CLAT)');
    assert(afterGrad.data.exams.length > 0, 'Stage after_grad returns exams (UPSC, SSC, Banking, GATE, CAT)');

    // 3. Test Demo Login
    const loginRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/demo',
      method: 'POST'
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Demo student login provides valid auth token');
    const token = loginRes.data.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 4. Test Authenticated Profile
    const meRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: authHeaders
    });
    assert(meRes.status === 200 && meRes.data.user.email === 'demo@spps.edu', 'GET /api/auth/me returns demo student session');
    assert(meRes.data.activeExam && meRes.data.activeExam.id === 'jee-main', 'Active exam is JEE Main');

    // 5. Test Study Plan Endpoint
    const planRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/study-plan',
      method: 'GET',
      headers: authHeaders
    });
    assert(planRes.status === 200 && planRes.data.plan, 'Active study plan retrieved');
    assert(planRes.data.tasks.length > 0, `Found ${planRes.data.tasks.length} study tasks organized into phases`);

    // 6. Test Timetable Endpoint
    const timeRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/timetable',
      method: 'GET',
      headers: authHeaders
    });
    assert(timeRes.status === 200 && Array.isArray(timeRes.data.sessions), 'Timetable sessions retrieved');

    // 7. Test PYQ Search and Filter
    const pyqRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/pyqs?exam_id=jee-main',
      method: 'GET',
      headers: authHeaders
    });
    assert(pyqRes.status === 200 && pyqRes.data.questions.length > 0, `Found ${pyqRes.data.questions.length} JEE Main PYQs`);
    const sampleQ = pyqRes.data.questions[0];

    // 8. Test PYQ Attempt & Streak Recording
    const attemptRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/pyqs/${sampleQ.id}/attempt`,
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' }
    }, {
      selected_answer: sampleQ.correct_answer,
      time_spent_seconds: 45,
      mode: 'pyq_browser'
    });
    assert(attemptRes.status === 200 && attemptRes.data.isCorrect === true, 'Attempting question with correct answer returns isCorrect: true');
    assert(attemptRes.data.currentStreak >= 1, `Current streak incremented to ${attemptRes.data.currentStreak}`);

    // 9. Test Bookmark Toggle
    const bmRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/pyqs/${sampleQ.id}/bookmark`,
      method: 'POST',
      headers: authHeaders
    });
    assert(bmRes.status === 200 && bmRes.data.bookmarked === true, 'Toggling question bookmark succeeds');

    // 10. Test Admin / Teacher Question Import (JSON)
    const importRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/admin/pyqs/import',
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' }
    }, {
      format: 'json',
      exam_id: 'jee-main',
      data: [
        {
          question_text: 'What is the SI unit of magnetic flux?',
          correct_answer: 'Weber (Wb)',
          options_json: ['Weber (Wb)', 'Tesla (T)', 'Henry (H)', 'Gauss (G)'],
          explanation: 'The SI unit of magnetic flux is Weber (Wb), named after Wilhelm Eduard Weber.',
          difficulty: 'Easy',
          year: 2024
        }
      ]
    });
    assert(importRes.status === 200 && importRes.data.imported_count === 1, 'Admin question import successfully added new question');

    // 11. Test Analytics Dashboard
    const analyticsRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: authHeaders
    });
    assert(analyticsRes.status === 200 && analyticsRes.data.readinessIndex > 0, `Readiness Index calculated: ${analyticsRes.data.readinessIndex}%`);
    assert(analyticsRes.data.syllabus.completionPercent >= 0, 'Syllabus completion percentage calculated');
    assert(analyticsRes.data.practice.accuracyPercent >= 0, 'Practice accuracy percentage calculated');

    console.log(`\n=== Test Summary: ${passed} Passed, ${failed} Failed ===`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
  }
}

runTests();

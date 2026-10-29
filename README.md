# SPPS — Study Plan Preparation System

**SPPS (Study Plan Preparation System)** is a modern, responsive, database-driven web platform designed to help students in India discover competitive and entrance examinations, understand career pathways, and prepare systematically through personalized study plans, conflict-free timetable generation, verified previous-year questions (PYQs), daily practice question sets, consistency streak tracking, and an administrative content console.

---

## 🌟 Key Features & Functional Modules

### 1. Comprehensive Examination Discovery System
- Searchable, filterable directory of Indian competitive and entrance examinations covering:
  - **After Class 10:** Polytechnic entrances (Delhi CET, JEECUP, AP POLYCET), ITI Craftsman Training (AITT), technical diploma routes.
  - **After Class 12:** Engineering (JEE Main), Medical (NEET-UG), Central Universities (CUET-UG), Defence (NDA & NA), Law (CLAT), Government jobs (SSC CHSL).
  - **After Graduation:** Civil Services (UPSC CSE), Central Ministries (SSC CGL), Banking (IBPS PO), Engineering / PSUs (GATE), Management (CAT), Lectureship & Research (UGC NET).
- Multi-filtering by stage (Class 10, Class 12, Graduation), category, conducting authority, and live autocomplete search.
- **Dedicated 17-Point Examination Information Page** containing:
  1. Examination name and conducting authority
  2. Overview and purpose
  3. Why the examination is conducted
  4. Who can apply
  5. Educational qualification and age requirements
  6. Important eligibility conditions
  7. Expected or officially announced examination schedule
  8. Application process and official website
  9. Exam pattern and marking scheme
  10. Detailed syllabus, divided into subjects and topics
  11. Benefits of qualifying
  12. Career paths and opportunities
  13. Selection process
  14. Preparation strategy
  15. Recommended preparation resources
  16. Available previous-year questions count
  17. One-click "Start Preparation" button

### 2. Connected Personalization Architecture
- Selecting an examination instantly connects your syllabus, roadmap, timetable, PYQs, and dashboard metrics.
- Three tailored preparation modes:
  - **Beginner:** Emphasizes fundamentals, conceptual clarity, and foundational practice.
  - **Intermediate:** Focuses on balanced topic coverage, weak areas, and timed drills.
  - **Revision:** High-speed roadmap focusing on formula sheets, high-yield topics, and intensive PYQ solving.

### 3. Transparent Study Plan Generator
- Calculates total preparation workload from actual topic difficulties and weightages.
- Factors in student daily hours, weekly study days, and weak subjects (multiplying weak subject time by 1.35x and tagging them as High Priority).
- Distributes topics across three pedagogical phases:
  - **Phase 1: Foundation & Core Concepts**
  - **Phase 2: In-Depth Mastery & Advanced Practice**
  - **Phase 3: High-Yield Revision, PYQs & Full-Length Mocks**
- Realistic Workload Warning: Alerts students transparently if the syllabus cannot fit into the available days before the exam date.
- Full task tracking: mark tasks in progress or completed, record notes, and view phase deadlines.

### 4. Automatic Conflict-Free Timetable Generator
- Converts study plan tasks into daily and weekly schedule blocks.
- Respects student available intervals (e.g. `08:00-10:00`, `16:00-18:00`), session length, and rest breaks.
- Alternates subjects across slots to prevent cognitive fatigue.
- One-click completion toggles, custom session addition, and interactive rescheduling.

### 5. Verified Previous-Year Questions (PYQ) Module
- Genuine question bank with real answer options, verified answer keys, and step-by-step explanations.
- Filters by Exam, Year (2024, 2023, 2022, 2021), Subject, and Difficulty.
- Bookmarking questions for later review.
- **Mistakes Notebook:** Filter and review questions previously answered incorrectly.
- Timed practice mode with active countdown timer or relaxed study mode.
- Official PYQ verification badges and official portal citations.

### 6. Daily Practice & Adaptive Streak System
- Generates a customized daily set prioritizing pending topics and weak subjects.
- **Strict Streak Integrity:** Streak day is awarded *only* when the daily question target is actually completed on that calendar date.
- **Adaptive Daily Target:** Automatically increments daily question target (+2, up to max 20) after 3 consecutive successful days; modestly reduces target (-2, down to min 6) on missed days to help rebuild momentum.
- Idempotency: Duplicate submissions or page refreshes on the same calendar day never multiply streaks.
- Live flame streak indicator, celebratory milestones, and 30-day activity heatmap grid.

### 7. Performance & Readiness Analytics
- **Readiness Score Index (0–100%):** Calculated transparently:
  $$\text{Readiness Index} = (\text{Syllabus Covered } \% \times 0.45) + (\text{PYQ Accuracy } \% \times 0.35) + (\text{Consistency Factor} \times 0.20)$$
- **Weak Topic Detection:** Dynamically detects topics with accuracy < 60% and suggests focused revision sessions.
- Subject-wise progress bars, planned vs actual weekly hours charts, and full attempt history.

### 8. Protected Administration Panel
- Role-based authorization (`admin` vs `student`).
- View platform usage statistics: Total registered students, active exams, PYQs in repository, total student attempts, and tasks completed.
- Examination manager: Add new exams with official sources, edit dates, and archive exams.
- Question manager: Add verified official PYQs or practice questions, edit answer keys and explanations, and delete questions.
- Bulk CSV and JSON question importer with live schema validation.

---

## 🛠️ Technology Stack & Architecture

- **Runtime:** Node.js (Node v24+ with native `node:sqlite`, `node:http`, `node:crypto`)
- **Database:** Persistent relational database using SQLite with foreign keys, indexes, and full relational schema:
  - `users`: User authentication, profile, education level, role (`student` or `admin`), study preferences.
  - `exams`: Detailed examination dossier, official schedules, verification status, official source URLs, archived status.
  - `subjects`: Examination subjects, weightage percentages, order indices.
  - `topics`: Syllabus topics, difficulty ratings, estimated hours, weightage tiers, key concepts.
  - `study_plans`: Generated preparation roadmaps, total workload hours, buffer days, workload warnings.
  - `study_tasks`: Structured study tasks, phases, activity types, priorities, due dates, completion timestamps, notes.
  - `timetable_sessions`: Scheduled study slots, day of week, start/end time, subject alternation, completion status.
  - `pyq_questions`: Verified PYQs and practice questions, options JSON, answer key, explanation, difficulty, official status, source URL.
  - `pyq_attempts`: Recorded question attempts, student answers, correctness, response time, mode.
  - `bookmarked_questions`: Student bookmarked questions.
  - `daily_practice_logs`: Daily practice records, target count, completed count, correct count, date, target met status.
  - `user_streaks`: Active streak, longest streak, last streak date, total questions solved, adaptive target, consecutive successes.
  - `auth_sessions`: Bearer token sessions with expiration timestamps.
- **Backend Architecture:** Pure RESTful API with token authentication, PBKDF2 password hashing, and clean separation of concerns (`planner.js`, `analytics.js`, `db.js`, `server.js`).
- **Frontend:** Responsive Single-Page Application (SPA) with modern educational design:
  - Light background with deep navy (`#0f172a`) and indigo (`#4f46e5`) primary palette.
  - Crisp Lucide-grade SVG icons.
  - Interactive SVG charts (Readiness Gauge, Subject Mastery, 30-Day Activity Heatmap).
  - Client-side router with URL hash navigation and auth state guards.

---

## 🚀 Getting Started

### 1. Launch the Application
Run the start script for Windows:
```cmd
start.bat
```
Or with PowerShell:
```powershell
.\start.ps1
```
Or directly with Node:
```bash
node server/server.js
```
The server will start at `http://localhost:3000`.

### 2. Demo Accounts (Instant 1-Click Access)

#### A. Student Account
- Click **"Student Demo (Aarav - JEE Main)"** on the landing page or login modal.
- **Email:** `demo@spps.edu`
- **Password:** `Demo@12345`
- Pre-populated with active JEE Main roadmap, timetable, 5-day streak, and practice history.

#### B. Administrator Account
- Click **"Admin Console Demo"** on the landing page or login modal.
- **Email:** `admin@spps.edu`
- **Password:** `Admin@12345`
- Full administrative access to the Admin Console, platform stats, exam management, and question bank editor.

### 3. Creating Additional Administrator Accounts
To create an administrator account securely via Node / REPL:
```javascript
const { db } = require('./server/db');
const crypto = require('node:crypto');

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync('YourAdminPassword', salt, 10000, 64, 'sha512').toString('hex');
const adminId = 'admin-' + crypto.randomUUID().slice(0, 8);

db.prepare(`
  INSERT INTO users (id, email, password_hash, salt, full_name, role, education_level)
  VALUES (?, ?, ?, ?, ?, 'admin', 'after_grad')
`).run(adminId, 'admin.new@spps.edu', hash, salt, 'Administrator Name');
```

---

## 🧪 Automated Test Suite

SPPS includes a comprehensive automated test suite verifying all 6 acceptance workflows:
- **Workflow A:** New Student Registration & Personalized Roadmap Generation
- **Workflow B:** Exam Discovery, Autocomplete Search, Multi-Stage Filtering & Dedicated Dossier
- **Workflow C:** Previous-Year Questions (PYQs), Timed Mode, Scoring, Explanations & Bookmarking
- **Workflow D:** Daily Practice, Streak System, Missed-Day Reset, Adaptive Target Progression & Idempotency
- **Workflow E:** Syllabus Progress Tracking, Explicit Task Completion & Weak-Topic Detection
- **Workflow F:** Security, Role-Based Access Control, Cross-User Data Isolation & Admin CRUD

Run the test suite:
```bash
node tests/test_inmemory.js
```
All 62 tests execute with 100% pass rate.

---

## 📖 API Documentation

### Authentication & Profile
- `POST /api/auth/register` — Register a new student and automatically generate study plan & timetable.
- `POST /api/auth/login` — Sign in with email and password.
- `POST /api/auth/demo` — Instant demo student login (Aarav Sharma).
- `POST /api/auth/admin-demo` — Instant administrator demo login (Dr. Vikram Malhotra).
- `GET /api/auth/me` — Retrieve authenticated user profile and active exam details.
- `PUT /api/auth/profile` — Update student profile, study hours, and weak subjects.
- `POST /api/auth/logout` — Terminate session.

### Examinations Directory
- `GET /api/exams` — List all examinations with stage, category, and keyword search filters.
- `GET /api/exams/:id` — Retrieve full 17-point dossier and complete syllabus tree.
- `POST /api/exams/:id/select` — Set active preparation target and regenerate plan.

### Study Planner & Timetable
- `GET /api/study-plan` — Retrieve active roadmap, phases, and structured study tasks.
- `POST /api/study-plan/generate` — Regenerate personalized study plan.
- `PATCH /api/study-plan/tasks/:id` — Mark task status (`completed`, `in_progress`, `pending`) and update notes.
- `GET /api/timetable` — Retrieve weekly scheduled study sessions.
- `POST /api/timetable/generate` — Regenerate conflict-free weekly timetable.
- `POST /api/timetable/sessions` — Add custom study session.
- `PATCH /api/timetable/sessions/:id` — Reschedule session or toggle completion.
- `DELETE /api/timetable/sessions/:id` — Delete timetable session.

### Question Bank & Daily Practice
- `GET /api/pyqs` — Query questions by exam, year, subject, difficulty, bookmarks, or mistakes.
- `POST /api/pyqs/:id/attempt` — Submit answer, receive instant scoring, step-by-step explanation, and streak update.
- `POST /api/pyqs/:id/bookmark` — Toggle question bookmark.
- `GET /api/daily-practice` — Retrieve today's adaptive practice question set.

### Analytics & Progress
- `GET /api/analytics/dashboard` — Retrieve readiness index, syllabus completion percentage, accuracy, streaks, and weak topic recommendations.

### Administration Console (Admin Role Required)
- `GET /api/admin/stats` — Platform usage statistics and recent activity stream.
- `POST /api/admin/exams` — Create new examination entry with official schedule and source URLs.
- `PUT /api/admin/exams/:id` — Update examination information and verified dates.
- `DELETE /api/admin/exams/:id` — Archive examination.
- `POST /api/admin/pyqs` — Create question with answer key and pedagogical explanation.
- `PUT /api/admin/pyqs/:id` — Edit question details and update verification status.
- `DELETE /api/admin/pyqs/:id` — Delete question.
- `POST /api/admin/pyqs/import` — Bulk import questions via CSV or JSON.

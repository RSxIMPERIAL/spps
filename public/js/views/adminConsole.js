// SPPS Administrator Panel View
// Features a dedicated Year-Wise & Topic-Wise PYQ Upload Studio, Examination Management, and Platform Analytics.

const adminConsoleView = {
  activeTab: 'pyq-studio', // Default to PYQ Studio as requested
  statsCache: null,
  examsCache: [],
  selectedExamId: 'jee-main',
  selectedYear: 'all',
  selectedSubjectId: 'all',
  selectedTopicId: 'all',
  searchQuery: '',
  questionsCache: [],
  pdfPapersCache: [],
  summaryCache: null,

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    const user = window.state.get('user');
    if (!user || user.role !== 'admin') {
      container.innerHTML = `
        <div class="spps-card" style="padding: 3rem; text-align: center; max-width: 600px; margin: 3rem auto;">
          <div style="color: #ef4444; font-size: 2.5rem; margin-bottom: 1rem;">🔒</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Administrator Access Required</h2>
          <p style="color: #64748b; margin-bottom: 1.5rem;">The Administrator Console requires verified administrator privileges to manage examinations and upload question banks.</p>
          <button class="btn btn-primary" onclick="authModal.loginAdminDemo()">Sign In As Administrator (Demo)</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading Administrator Console and PYQ Upload Studio...
      </div>
    `;

    try {
      const statsRes = await window.api.getAdminStats();
      this.statsCache = statsRes;
      const examsRes = await window.api.getExams();
      this.examsCache = examsRes.exams || [];

      if (!this.selectedExamId && this.examsCache.length > 0) {
        this.selectedExamId = this.examsCache[0].id;
      }

      await this.loadQuestionsForStudio();
      this.renderFullConsole();
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">Error: ${err.message}</div>`;
    }
  },

  async loadQuestionsForStudio() {
    try {
      const filters = {
        exam_id: this.selectedExamId,
        year: this.selectedYear,
        subject_id: this.selectedSubjectId,
        topic_id: this.selectedTopicId,
        search: this.searchQuery
      };
      const res = await window.api.getPyqs(filters);
      this.questionsCache = res.questions || [];

      // Also fetch summary stats
      const summaryRes = await window.api.getPyqSummary(this.selectedExamId);
      this.summaryCache = summaryRes;

      // Also fetch official PDF question papers
      try {
        const pdfRes = await window.api.getPyqPdfs({ exam_id: this.selectedExamId });
        this.pdfPapersCache = pdfRes.papers || [];
      } catch (pdfErr) {
        console.warn('Failed to load PDF papers for studio:', pdfErr.message);
        this.pdfPapersCache = [];
      }
    } catch (e) {
      console.warn('Failed to load studio questions:', e.message);
      this.questionsCache = [];
      this.summaryCache = null;
    }
  },

  renderFullConsole() {
    const container = document.getElementById('view-container');
    if (!container) return;

    const stats = this.statsCache?.stats || {};

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1350px; margin: 0 auto;">
        <!-- Header Banner -->
        <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                <span class="badge badge-emerald" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4);">Admin Privileges Active</span>
                <span class="badge badge-indigo">Role: System Administrator</span>
              </div>
              <h1 style="font-size: 1.85rem; font-weight: 800;">Administration & PYQ Content Studio</h1>
              <p style="font-size: 0.875rem; color: #c7d2fe; margin-top: 4px;">
                Upload and organize previous-year questions (year-wise & topic-wise) for all Indian examinations, and manage official syllabi.
              </p>
            </div>

            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-accent btn-sm" onclick="adminConsoleView.openAddQuestionModal()">
                ${window.icons.plus || '+'} Upload Single PYQ
              </button>
              <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.25);" onclick="adminConsoleView.openPdfUploadModal()">
                📄 Upload PDF Paper
              </button>
              <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.25);" onclick="adminImport.openModal(adminConsoleView.selectedExamId)">
                ${window.icons.upload || '↑'} Bulk Upload (CSV / JSON)
              </button>
              <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.25);" onclick="adminConsoleView.openAddExamModal()">
                ${window.icons.plus || '+'} Add Examination
              </button>
            </div>
          </div>

          <!-- Platform Statistics Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.15);">
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Active Students</div>
              <div style="font-size: 1.5rem; font-weight: 800;">${stats.totalStudents || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Indian Exams</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #38bdf8;">${stats.totalExams || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Syllabus Topics</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #a78bfa;">${stats.totalTopics || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Question Bank (PYQs)</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #34d399;">${stats.totalPyqs || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Official PDF Papers</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #f472b6;">${stats.totalPdfPapers || (this.pdfPapersCache ? this.pdfPapersCache.length : 0)}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Student Attempts</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">${stats.totalAttempts || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Tasks Completed</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #818cf8;">${stats.totalTasksCompleted || 0}</div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="spps-card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-sm ${this.activeTab === 'pyq-studio' ? 'btn-primary' : 'btn-secondary'}" onclick="adminConsoleView.switchTab('pyq-studio')">
              ${window.icons.helpCircle || '?'} PYQ Upload Studio (Year & Topic Wise)
            </button>
            <button class="btn btn-sm ${this.activeTab === 'pdf-papers' ? 'btn-primary' : 'btn-secondary'}" onclick="adminConsoleView.switchTab('pdf-papers')">
              📄 Official PDF Papers (${this.pdfPapersCache ? this.pdfPapersCache.length : 0})
            </button>
            <button class="btn btn-sm ${this.activeTab === 'exams' ? 'btn-primary' : 'btn-secondary'}" onclick="adminConsoleView.switchTab('exams')">
              ${window.icons.compass || '🧭'} Manage Examinations (${this.examsCache.length})
            </button>
            <button class="btn btn-sm ${this.activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}" onclick="adminConsoleView.switchTab('overview')">
              ${window.icons.dashboard || '📊'} Overview & Audit Logs
            </button>
          </div>
        </div>

        <!-- Dynamic Content Area -->
        <div id="admin-tab-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    const tabEl = document.getElementById('admin-tab-content');
    if (tabEl) {
      tabEl.innerHTML = this.renderTabContent();
    }
  },

  renderTabContent() {
    if (this.activeTab === 'exams') {
      return this.renderExamsTab();
    } else if (this.activeTab === 'overview') {
      return this.renderOverviewTab();
    } else if (this.activeTab === 'pdf-papers') {
      return this.renderPdfPapersTab();
    } else {
      return this.renderPyqStudioTab();
    }
  },

  // ------------------------------------------------------------------------
  // DEDICATED SECTION: PYQ UPLOAD STUDIO (YEAR-WISE & TOPIC-WISE)
  // ------------------------------------------------------------------------
  renderPyqStudioTab() {
    const summary = this.summaryCache || {};
    const years = summary.years || [];
    const topics = summary.topics || [];
    const selectedExam = this.examsCache.find(e => e.id === this.selectedExamId);

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Control & Filter Studio Bar -->
        <div class="spps-card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span>Upload PYQs (Year-Wise & Topic-Wise)</span>
                <span class="badge badge-indigo">${selectedExam?.short_name || 'Select Exam'}</span>
              </h3>
              <p style="font-size: 0.8125rem; color: #64748b; margin-top: 4px;">
                Select target examination, filter by year/topic, or upload single/bulk question sets with verified explanations.
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="adminConsoleView.openAddQuestionModal()">
                ${window.icons.plus || '+'} Upload Single Question
              </button>
              <button class="btn btn-secondary btn-sm" onclick="adminImport.openModal('${this.selectedExamId}')">
                ${window.icons.upload || '↑'} Bulk CSV/JSON Import
              </button>
            </div>
          </div>

          <!-- Selectors Grid: Exam, Year, Subject, Topic, Search -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.25rem;">
            <!-- Exam Selector -->
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: #475569;">1. Target Exam</label>
              <select class="form-select" onchange="adminConsoleView.handleStudioExamChange(this.value)">
                ${this.examsCache.map(e => `
                  <option value="${e.id}" ${e.id === this.selectedExamId ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- Year Selector -->
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: #475569;">2. Exam Year</label>
              <select class="form-select" onchange="adminConsoleView.handleStudioYearChange(this.value)">
                <option value="all" ${this.selectedYear === 'all' ? 'selected' : ''}>All Years (${summary.total_questions || 0} questions)</option>
                ${years.map(y => `
                  <option value="${y.year}" ${String(this.selectedYear) === String(y.year) ? 'selected' : ''}>${y.year} (${y.question_count} questions)</option>
                `).join('')}
                <option value="2025" ${String(this.selectedYear) === '2025' ? 'selected' : ''}>2025</option>
                <option value="2024" ${String(this.selectedYear) === '2024' ? 'selected' : ''}>2024</option>
                <option value="2023" ${String(this.selectedYear) === '2023' ? 'selected' : ''}>2023</option>
                <option value="2022" ${String(this.selectedYear) === '2022' ? 'selected' : ''}>2022</option>
                <option value="2021" ${String(this.selectedYear) === '2021' ? 'selected' : ''}>2021</option>
                <option value="2020" ${String(this.selectedYear) === '2020' ? 'selected' : ''}>2020</option>
              </select>
            </div>

            <!-- Topic Selector -->
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: #475569;">3. Syllabus Topic</label>
              <select class="form-select" onchange="adminConsoleView.handleStudioTopicChange(this.value)">
                <option value="all">All Topics (${topics.length} topics)</option>
                ${topics.map(t => `
                  <option value="${t.topic_id}" ${this.selectedTopicId === t.topic_id ? 'selected' : ''}>${t.subject_name}: ${t.topic_name} (${t.question_count} Qs)</option>
                `).join('')}
              </select>
            </div>

            <!-- Search Field -->
            <div>
              <label class="form-label" style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: #475569;">4. Search Question</label>
              <input 
                type="text" 
                class="form-input" 
                placeholder="Search text or formula..." 
                value="${this.searchQuery}"
                oninput="adminConsoleView.handleStudioSearch(this.value)"
              />
            </div>
          </div>

          <!-- Summary Metric Pills (Year-Wise & Topic-Wise Breakdown) -->
          <div style="margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: #334155;">Available Years:</span>
              ${years.length > 0 ? years.map(y => `
                <button class="badge ${String(this.selectedYear) === String(y.year) ? 'badge-indigo' : 'badge-slate'}" 
                        style="cursor: pointer; font-size: 0.75rem; padding: 4px 10px;"
                        onclick="adminConsoleView.handleStudioYearChange('${y.year}')">
                  ${y.year} • <strong>${y.question_count} Questions</strong>
                </button>
              `).join('') : '<span style="font-size: 0.75rem; color: #94a3b8;">No PYQs recorded yet for this examination. Click Upload to add.</span>'}
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: #334155;">High-Yield Topics:</span>
              ${topics.slice(0, 6).map(t => `
                <button class="badge ${this.selectedTopicId === t.topic_id ? 'badge-teal' : 'badge-slate'}" 
                        style="cursor: pointer; font-size: 0.75rem; padding: 4px 10px;"
                        onclick="adminConsoleView.handleStudioTopicChange('${t.topic_id}')">
                  ${t.topic_name} • <strong>${t.question_count} Qs</strong>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Uploaded PYQ Repository Table -->
        <div class="spps-card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">
                Uploaded Questions Repository (${this.questionsCache.length} displayed)
              </h4>
              <p style="font-size: 0.75rem; color: #64748b;">
                Showing questions for <strong>${selectedExam?.name || 'Selected Exam'}</strong>. Click Edit or Delete to manage.
              </p>
            </div>

            <div>
              <button class="btn btn-secondary btn-sm" onclick="adminImport.downloadTemplate('csv')">
                ${window.icons.download || ''} Download CSV Template
              </button>
            </div>
          </div>

          ${this.questionsCache.length === 0 ? `
            <div style="text-align: center; padding: 3rem; background: #f8fafc; border-radius: 0.75rem; border: 1px dashed #cbd5e1;">
              <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.5rem;">📝</div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #334155;">No questions match this filter</h4>
              <p style="font-size: 0.8125rem; color: #64748b; max-width: 500px; margin: 0.5rem auto 1.25rem;">
                No questions have been uploaded for ${selectedExam?.name || 'this exam'} matching the selected year and topic.
              </p>
              <button class="btn btn-primary btn-sm" onclick="adminConsoleView.openAddQuestionModal()">
                + Upload First Question For This Exam
              </button>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table class="spps-table" style="width: 100%; font-size: 0.8125rem;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 10px; text-align: left; width: 80px;">Year</th>
                    <th style="padding: 10px; text-align: left; width: 180px;">Subject & Topic</th>
                    <th style="padding: 10px; text-align: left;">Question & Solution Formulation</th>
                    <th style="padding: 10px; text-align: left; width: 140px;">Correct Answer</th>
                    <th style="padding: 10px; text-align: left; width: 90px;">Difficulty</th>
                    <th style="padding: 10px; text-align: center; width: 120px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.questionsCache.map(q => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px; vertical-align: top;">
                        <span class="badge badge-indigo" style="font-weight: 700;">${q.year}</span>
                      </td>
                      <td style="padding: 10px; vertical-align: top;">
                        <div style="font-weight: 700; color: #0f172a;">${q.subject_name || 'General'}</div>
                        <div style="font-size: 0.75rem; color: #0d9488; margin-top: 2px;">
                          ${q.topic_name || 'General Topic'}
                        </div>
                        <div style="margin-top: 4px;">
                          <span class="badge ${q.is_official ? 'badge-emerald' : 'badge-slate'}" style="font-size: 0.65rem;">
                            ${q.is_official ? 'Official PYQ' : 'Practice'}
                          </span>
                        </div>
                      </td>
                      <td style="padding: 10px; vertical-align: top;">
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 6px; line-height: 1.4;">
                          ${q.question_text}
                        </div>
                        <!-- Options preview -->
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                          ${(q.options || []).map((opt, i) => `
                            <span style="font-size: 0.75rem; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; ${opt === q.correct_answer ? 'border: 1px solid #10b981; background: #ecfdf5; color: #065f46; font-weight: 600;' : 'color: #475569;'}">
                              ${String.fromCharCode(65 + i)}: ${opt}
                            </span>
                          `).join('')}
                        </div>
                        <!-- Explanation snippet -->
                        <div style="font-size: 0.75rem; color: #64748b; font-style: italic; background: #f8fafc; padding: 6px 10px; border-left: 2px solid #6366f1; border-radius: 0 4px 4px 0;">
                          ${q.explanation ? (q.explanation.length > 150 ? q.explanation.slice(0, 150) + '...' : q.explanation) : 'No explanation provided.'}
                        </div>
                      </td>
                      <td style="padding: 10px; vertical-align: top;">
                        <span class="badge badge-emerald" style="font-weight: 700; font-size: 0.75rem; word-break: break-all;">
                          ✓ ${q.correct_answer}
                        </span>
                      </td>
                      <td style="padding: 10px; vertical-align: top;">
                        <span class="badge ${q.difficulty === 'Easy' ? 'badge-emerald' : (q.difficulty === 'Hard' ? 'badge-rose' : 'badge-amber')}">
                          ${q.difficulty}
                        </span>
                      </td>
                      <td style="padding: 10px; vertical-align: top; text-align: center;">
                        <div style="display: inline-flex; gap: 4px;">
                          <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminConsoleView.openEditQuestionModal('${q.id}')">
                            Edit
                          </button>
                          <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminConsoleView.handleDeleteQuestion('${q.id}')">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  },

  async handleStudioExamChange(examId) {
    this.selectedExamId = examId;
    this.selectedSubjectId = 'all';
    this.selectedTopicId = 'all';
    await this.loadQuestionsForStudio();
    const tabEl = document.getElementById('admin-tab-content');
    if (tabEl) tabEl.innerHTML = this.renderTabContent();
  },

  async handleStudioYearChange(year) {
    this.selectedYear = year;
    await this.loadQuestionsForStudio();
    const tabEl = document.getElementById('admin-tab-content');
    if (tabEl) tabEl.innerHTML = this.renderTabContent();
  },

  async handleStudioTopicChange(topicId) {
    this.selectedTopicId = topicId;
    await this.loadQuestionsForStudio();
    const tabEl = document.getElementById('admin-tab-content');
    if (tabEl) tabEl.innerHTML = this.renderTabContent();
  },

  handleStudioSearch(text) {
    this.searchQuery = text;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(async () => {
      await this.loadQuestionsForStudio();
      const tabEl = document.getElementById('admin-tab-content');
      if (tabEl) tabEl.innerHTML = this.renderTabContent();
    }, 300);
  },

  // ------------------------------------------------------------------------
  // SINGLE QUESTION UPLOAD MODAL (YEAR-WISE & TOPIC-WISE CASCADE)
  // ------------------------------------------------------------------------
  async openAddQuestionModal() {
    const examOptions = this.examsCache.map(e => 
      `<option value="${e.id}" ${e.id === this.selectedExamId ? 'selected' : ''}>${e.name}</option>`
    ).join('');

    let subjects = [];
    let topics = [];
    try {
      const details = await window.api.getExamDetails(this.selectedExamId);
      subjects = details.subjects || [];
      subjects.forEach(s => {
        if (s.topics) topics.push(...s.topics);
      });
    } catch (e) {}

    const subjectOptions = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const topicOptions = topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    const content = `
      <form onsubmit="adminConsoleView.handleAddQuestionSubmit(event)">
        <p style="font-size: 0.8125rem; color: #64748b; margin-bottom: 1rem;">
          Add a verified previous-year question or high-yield practice problem with topic mapping and step-by-step solution.
        </p>

        <!-- Exam & Year Row -->
        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Target Examination</label>
            <select id="q-exam" class="form-select" onchange="adminConsoleView.handleModalExamChange(this.value)">
              ${examOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Examination Year</label>
            <input type="number" id="q-year" class="form-input" value="${this.selectedYear !== 'all' ? this.selectedYear : 2024}" min="2000" max="2026" required />
          </div>
        </div>

        <!-- Subject & Topic Cascade -->
        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Subject</label>
            <select id="q-subject" class="form-select" onchange="adminConsoleView.handleModalSubjectChange(this.value)">
              <option value="">-- Select Subject --</option>
              ${subjectOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Topic</label>
            <select id="q-topic" class="form-select">
              <option value="">-- Select Topic (Optional) --</option>
              ${topicOptions}
            </select>
          </div>
        </div>

        <!-- Question Formulation -->
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" style="font-weight: 700;">Question Text Formulation</label>
          <textarea id="q-text" class="form-textarea" rows="3" placeholder="Enter clear question statement, problem data, and conditions..." required></textarea>
        </div>

        <!-- 4 Options (A, B, C, D) with Radio Selection for Correct Answer -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
          <label class="form-label" style="font-weight: 700; margin-bottom: 0.5rem;">Options & Correct Answer Selection</label>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="radio" name="correct_radio" value="0" id="rad-a" checked onchange="adminConsoleView.syncCorrectRadio()" />
              <label for="rad-a" style="width: 25px; font-weight: 700; margin: 0;">A:</label>
              <input type="text" id="q-opt-a" class="form-input" placeholder="Option A text..." required oninput="adminConsoleView.syncCorrectRadio()" />
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="radio" name="correct_radio" value="1" id="rad-b" onchange="adminConsoleView.syncCorrectRadio()" />
              <label for="rad-b" style="width: 25px; font-weight: 700; margin: 0;">B:</label>
              <input type="text" id="q-opt-b" class="form-input" placeholder="Option B text..." required oninput="adminConsoleView.syncCorrectRadio()" />
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="radio" name="correct_radio" value="2" id="rad-c" onchange="adminConsoleView.syncCorrectRadio()" />
              <label for="rad-c" style="width: 25px; font-weight: 700; margin: 0;">C:</label>
              <input type="text" id="q-opt-c" class="form-input" placeholder="Option C text..." required oninput="adminConsoleView.syncCorrectRadio()" />
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="radio" name="correct_radio" value="3" id="rad-d" onchange="adminConsoleView.syncCorrectRadio()" />
              <label for="rad-d" style="width: 25px; font-weight: 700; margin: 0;">D:</label>
              <input type="text" id="q-opt-d" class="form-input" placeholder="Option D text..." required oninput="adminConsoleView.syncCorrectRadio()" />
            </div>
          </div>
          <input type="hidden" id="q-answer" value="" />
        </div>

        <!-- Difficulty & Verification Status -->
        <div class="grid-cols-3" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Difficulty Level</label>
            <select id="q-diff" class="form-select">
              <option value="Easy">Easy</option>
              <option value="Medium" selected>Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Classification</label>
            <select id="q-is-official" class="form-select">
              <option value="1">Official Verified PYQ</option>
              <option value="0">Practice Question — Not an Official PYQ</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Paper / Source Citation</label>
            <input type="text" id="q-source" class="form-input" placeholder="e.g. Shift 1 Paper Q.34" />
          </div>
        </div>

        <!-- Step-by-Step Pedagogical Explanation -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" style="font-weight: 700;">Step-by-Step Verified Solution & Explanation</label>
          <textarea id="q-explanation" class="form-textarea" rows="4" placeholder="Detail formulas used, derivation steps, rationale for correct option, and common misconceptions..." required></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save & Publish to PYQ Bank</button>
        </div>
      </form>
    `;

    modal.open('Upload Previous-Year Question (Year & Topic Wise)', content, 'modal-content-lg');
    this.syncCorrectRadio();
  },

  syncCorrectRadio() {
    const radios = document.getElementsByName('correct_radio');
    let selectedIdx = 0;
    for (const r of radios) {
      if (r.checked) {
        selectedIdx = parseInt(r.value, 10);
        break;
      }
    }
    const optIds = ['q-opt-a', 'q-opt-b', 'q-opt-c', 'q-opt-d'];
    const optEl = document.getElementById(optIds[selectedIdx]);
    const answerHidden = document.getElementById('q-answer');
    if (optEl && answerHidden) {
      answerHidden.value = optEl.value.trim();
    }
  },

  async handleModalExamChange(examId) {
    try {
      const details = await window.api.getExamDetails(examId);
      const subSelect = document.getElementById('q-subject');
      const topSelect = document.getElementById('q-topic');
      if (subSelect) {
        subSelect.innerHTML = `<option value="">-- Select Subject --</option>` +
          (details.subjects || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      }
      if (topSelect) {
        topSelect.innerHTML = `<option value="">-- Select Topic (Optional) --</option>`;
      }
    } catch (e) {}
  },

  async handleModalSubjectChange(subjectId) {
    const examId = document.getElementById('q-exam').value;
    const topSelect = document.getElementById('q-topic');
    if (!topSelect) return;

    try {
      const details = await window.api.getExamDetails(examId);
      const sub = (details.subjects || []).find(s => s.id === subjectId);
      if (sub && sub.topics) {
        topSelect.innerHTML = `<option value="">-- Select Topic (Optional) --</option>` +
          sub.topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      } else {
        topSelect.innerHTML = `<option value="">-- Select Topic (Optional) --</option>`;
      }
    } catch (e) {}
  },

  async handleAddQuestionSubmit(e) {
    e.preventDefault();
    this.syncCorrectRadio();

    const exam_id = document.getElementById('q-exam').value;
    const year = parseInt(document.getElementById('q-year').value, 10);
    const subject_id = document.getElementById('q-subject').value || null;
    const topic_id = document.getElementById('q-topic').value || null;
    const difficulty = document.getElementById('q-diff').value;
    const question_text = document.getElementById('q-text').value;
    const options = [
      document.getElementById('q-opt-a').value.trim(),
      document.getElementById('q-opt-b').value.trim(),
      document.getElementById('q-opt-c').value.trim(),
      document.getElementById('q-opt-d').value.trim()
    ];
    const correct_answer = document.getElementById('q-answer').value || options[0];
    const is_official = parseInt(document.getElementById('q-is-official').value, 10);
    const source_url = document.getElementById('q-source').value || 'Official Exam Portal';
    const explanation = document.getElementById('q-explanation').value;

    if (!correct_answer) {
      toast.warning('Please specify the correct option.');
      return;
    }

    try {
      await window.api.adminAddQuestion({
        exam_id, year, subject_id, topic_id, difficulty, question_text,
        options, correct_answer, is_official, source_url, explanation,
        verification_status: is_official === 1 ? `Official ${year} PYQ` : 'Practice Question'
      });

      modal.close();
      toast.success('Question successfully saved into the question bank!');
      this.selectedExamId = exam_id;
      await this.loadQuestionsForStudio();
      this.render();
    } catch (err) {
      toast.error('Question upload failed: ' + err.message);
    }
  },

  // ------------------------------------------------------------------------
  // EDIT QUESTION MODAL
  // ------------------------------------------------------------------------
  async openEditQuestionModal(questionId) {
    const q = this.questionsCache.find(item => item.id === questionId);
    if (!q) return;

    let subjects = [];
    let topics = [];
    try {
      const details = await window.api.getExamDetails(q.exam_id);
      subjects = details.subjects || [];
      subjects.forEach(s => {
        if (s.topics) topics.push(...s.topics);
      });
    } catch (e) {}

    const subjectOptions = `<option value="">-- None --</option>` +
      subjects.map(s => `<option value="${s.id}" ${s.id === q.subject_id ? 'selected' : ''}>${s.name}</option>`).join('');

    const topicOptions = `<option value="">-- None --</option>` +
      topics.map(t => `<option value="${t.id}" ${t.id === q.topic_id ? 'selected' : ''}>${t.name}</option>`).join('');

    const options = q.options || ['Option A', 'Option B', 'Option C', 'Option D'];

    const content = `
      <form onsubmit="adminConsoleView.handleEditQuestionSubmit(event, '${q.id}')">
        <div class="grid-cols-3" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Year</label>
            <input type="number" id="edit-q-year" class="form-input" value="${q.year}" required />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Subject</label>
            <select id="edit-q-subject" class="form-select">
              ${subjectOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Topic</label>
            <select id="edit-q-topic" class="form-select">
              ${topicOptions}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" style="font-weight: 700;">Question Text</label>
          <textarea id="edit-q-text" class="form-textarea" rows="3" required>${q.question_text}</textarea>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Option A</label>
            <input type="text" id="edit-opt-a" class="form-input" value="${options[0] || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Option B</label>
            <input type="text" id="edit-opt-b" class="form-input" value="${options[1] || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Option C</label>
            <input type="text" id="edit-opt-c" class="form-input" value="${options[2] || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Option D</label>
            <input type="text" id="edit-opt-d" class="form-input" value="${options[3] || ''}" required />
          </div>
        </div>

        <div class="grid-cols-3" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Correct Answer</label>
            <input type="text" id="edit-q-answer" class="form-input" value="${q.correct_answer}" required />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Difficulty</label>
            <select id="edit-q-diff" class="form-select">
              <option value="Easy" ${q.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
              <option value="Medium" ${q.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Hard" ${q.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700;">Classification</label>
            <select id="edit-q-official" class="form-select">
              <option value="1" ${q.is_official ? 'selected' : ''}>Official Verified PYQ</option>
              <option value="0" ${!q.is_official ? 'selected' : ''}>Practice Question</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" style="font-weight: 700;">Step-by-Step Explanation</label>
          <textarea id="edit-q-explanation" class="form-textarea" rows="3" required>${q.explanation || ''}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    modal.open('Edit Question Formulation', content, 'modal-content-lg');
  },

  async handleEditQuestionSubmit(e, questionId) {
    e.preventDefault();

    const year = parseInt(document.getElementById('edit-q-year').value, 10);
    const subject_id = document.getElementById('edit-q-subject').value || null;
    const topic_id = document.getElementById('edit-q-topic').value || null;
    const question_text = document.getElementById('edit-q-text').value;
    const options = [
      document.getElementById('edit-opt-a').value.trim(),
      document.getElementById('edit-opt-b').value.trim(),
      document.getElementById('edit-opt-c').value.trim(),
      document.getElementById('edit-opt-d').value.trim()
    ];
    const correct_answer = document.getElementById('edit-q-answer').value.trim();
    const difficulty = document.getElementById('edit-q-diff').value;
    const is_official = parseInt(document.getElementById('edit-q-official').value, 10);
    const explanation = document.getElementById('edit-q-explanation').value;

    try {
      await window.api.adminUpdateQuestion(questionId, {
        year, subject_id, topic_id, question_text, options, correct_answer,
        difficulty, is_official, explanation,
        verification_status: is_official === 1 ? `Official ${year} PYQ` : 'Practice Question'
      });

      modal.close();
      toast.success('Question updated successfully!');
      await this.loadQuestionsForStudio();
      const tabEl = document.getElementById('admin-tab-content');
      if (tabEl) tabEl.innerHTML = this.renderTabContent();
    } catch (err) {
      toast.error('Update failed: ' + err.message);
    }
  },

  async handleDeleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question? This action will remove it permanently from the repository.')) {
      return;
    }

    try {
      await window.api.adminDeleteQuestion(questionId);
      toast.info('Question deleted from repository.');
      await this.loadQuestionsForStudio();
      const tabEl = document.getElementById('admin-tab-content');
      if (tabEl) tabEl.innerHTML = this.renderTabContent();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  },

  // ------------------------------------------------------------------------
  // EXAMS MANAGEMENT TAB
  // ------------------------------------------------------------------------
  renderExamsTab() {
    return `
      <div class="spps-card" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">Official Indian Examinations Directory (${this.examsCache.length})</h3>
            <p style="font-size: 0.8125rem; color: #64748b;">Add, edit, and maintain official dates, eligibility, and syllabi across all stages.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="adminConsoleView.openAddExamModal()">
            ${window.icons.plus || '+'} Add New Examination
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table class="spps-table" style="width: 100%; font-size: 0.8125rem;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 10px; text-align: left;">Exam Name</th>
                <th style="padding: 10px; text-align: left;">Stage</th>
                <th style="padding: 10px; text-align: left;">Category</th>
                <th style="padding: 10px; text-align: left;">Conducting Body</th>
                <th style="padding: 10px; text-align: left;">Schedule Status</th>
                <th style="padding: 10px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.examsCache.map(e => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; font-weight: 700; color: #0f172a;">
                    ${e.name}<br/>
                    <a href="${e.official_url}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: #4f46e5; font-weight: 400; text-decoration: underline;">${e.source_url || 'Official URL'}</a>
                  </td>
                  <td style="padding: 10px;"><span class="badge badge-teal">${e.stage.replace('_', ' ')}</span></td>
                  <td style="padding: 10px;"><span class="badge badge-indigo">${e.category}</span></td>
                  <td style="padding: 10px; color: #475569; font-size: 0.75rem;">${e.conducting_authority}</td>
                  <td style="padding: 10px;"><span class="badge badge-emerald">${e.schedule_status || 'Official'}</span></td>
                  <td style="padding: 10px; text-align: center;">
                    <div style="display: inline-flex; gap: 4px;">
                      <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminConsoleView.openEditExamModal('${e.id}')">
                        Edit
                      </button>
                      <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminConsoleView.handleArchiveExam('${e.id}')">
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ------------------------------------------------------------------------
  // OVERVIEW TAB
  // ------------------------------------------------------------------------
  renderOverviewTab() {
    const recentUsers = this.statsCache?.recentUsers || [];
    const recentAttempts = this.statsCache?.recentAttempts || [];

    return `
      <div class="grid-cols-2">
        <div class="spps-card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">Recent Student Registrations</h3>
            <span class="badge badge-slate">${recentUsers.length} Students</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="spps-table" style="width: 100%; font-size: 0.8125rem;">
              <thead>
                <tr>
                  <th style="padding: 8px 10px; text-align: left;">Student</th>
                  <th style="padding: 8px 10px; text-align: left;">Target Exam</th>
                  <th style="padding: 8px 10px; text-align: left;">Mode</th>
                  <th style="padding: 8px 10px; text-align: left;">Joined</th>
                </tr>
              </thead>
              <tbody>
                ${recentUsers.map(u => `
                  <tr>
                    <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">${u.full_name}<br/><span style="font-weight: 400; color: #64748b; font-size: 0.75rem;">${u.email}</span></td>
                    <td style="padding: 8px 10px;"><span class="badge badge-indigo">${u.active_exam_id || 'None'}</span></td>
                    <td style="padding: 8px 10px;"><span class="badge badge-teal">${u.prep_mode || 'beginner'}</span></td>
                    <td style="padding: 8px 10px; color: #64748b; font-size: 0.75rem;">${u.created_at?.split(' ')[0] || 'Recent'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="spps-card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">Live Practice Stream</h3>
            <span class="badge badge-amber">Recent Activity</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${recentAttempts.map(a => `
              <div style="padding: 0.75rem; border-radius: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; min-width: 0; padding-right: 1rem;">
                  <div style="font-size: 0.8125rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${a.question_text}
                  </div>
                  <div style="font-size: 0.75rem; color: #64748b;">
                    By <strong>${a.student_name}</strong> • Selected: "${a.selected_answer}"
                  </div>
                </div>
                <span class="badge ${a.is_correct ? 'badge-emerald' : 'badge-rose'}">
                  ${a.is_correct ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  openAddExamModal() {
    const content = `
      <form onsubmit="adminConsoleView.handleAddExamSubmit(event)">
        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Exam ID (Slug)</label>
            <input type="text" id="admin-exam-id" class="form-input" placeholder="e.g. sbi-po" required />
          </div>
          <div class="form-group">
            <label class="form-label">Full Examination Name</label>
            <input type="text" id="admin-exam-name" class="form-input" placeholder="e.g. SBI PO (Probationary Officers)" required />
          </div>
        </div>

        <div class="grid-cols-3" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Short Name</label>
            <input type="text" id="admin-exam-short" class="form-input" placeholder="e.g. SBI PO" required />
          </div>
          <div class="form-group">
            <label class="form-label">Eligibility Stage</label>
            <select id="admin-exam-stage" class="form-select">
              <option value="after_10">After Class 10</option>
              <option value="after_12">After Class 12</option>
              <option value="after_grad" selected>After Graduation</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" id="admin-exam-cat" class="form-input" placeholder="e.g. Banking / Engineering" required />
          </div>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Conducting Authority</label>
            <input type="text" id="admin-exam-auth" class="form-input" placeholder="e.g. State Bank of India (SBI)" required />
          </div>
          <div class="form-group">
            <label class="form-label">Official Portal URL</label>
            <input type="url" id="admin-exam-url" class="form-input" placeholder="https://sbi.co.in/careers" required />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Overview & Purpose</label>
          <textarea id="admin-exam-overview" class="form-textarea" rows="2" placeholder="Brief overview of examination..." required></textarea>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Eligibility Criteria</label>
            <input type="text" id="admin-exam-who" class="form-input" placeholder="e.g. Graduates in any discipline" required />
          </div>
          <div class="form-group">
            <label class="form-label">Age Limit</label>
            <input type="text" id="admin-exam-age" class="form-input" placeholder="e.g. 21 to 30 years" required />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Exam Pattern & Marking</label>
          <input type="text" id="admin-exam-pattern" class="form-input" placeholder="e.g. 100 MCQs, 60 minutes, -0.25 negative" required />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Examination</button>
        </div>
      </form>
    `;

    modal.open('Add New Examination', content, 'modal-content-lg');
  },

  async handleAddExamSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('admin-exam-id').value.trim();
    const name = document.getElementById('admin-exam-name').value.trim();
    const short_name = document.getElementById('admin-exam-short').value.trim();
    const stage = document.getElementById('admin-exam-stage').value;
    const category = document.getElementById('admin-exam-cat').value.trim();
    const conducting_authority = document.getElementById('admin-exam-auth').value.trim();
    const official_url = document.getElementById('admin-exam-url').value.trim();
    const overview = document.getElementById('admin-exam-overview').value.trim();
    const who_can_apply = document.getElementById('admin-exam-who').value.trim();
    const age_limit = document.getElementById('admin-exam-age').value.trim();
    const pattern_marking = document.getElementById('admin-exam-pattern').value.trim();

    try {
      await window.api.adminAddExam({
        id, name, short_name, stage, category, conducting_authority,
        official_url, source_url: official_url, overview, who_can_apply,
        age_limit, pattern_marking
      });

      modal.close();
      toast.success('Examination created and added to directory!');
      this.render();
    } catch (err) {
      toast.error('Creation failed: ' + err.message);
    }
  },

  openEditExamModal(examId) {
    const exam = this.examsCache.find(e => e.id === examId);
    if (!exam) return;

    const content = `
      <form onsubmit="adminConsoleView.handleEditExamSubmit(event, '${exam.id}')">
        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="edit-exam-name" class="form-input" value="${exam.name}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Short Name</label>
            <input type="text" id="edit-exam-short" class="form-input" value="${exam.short_name}" required />
          </div>
        </div>

        <div class="grid-cols-3" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Stage</label>
            <select id="edit-exam-stage" class="form-select">
              <option value="after_10" ${exam.stage === 'after_10' ? 'selected' : ''}>After Class 10</option>
              <option value="after_12" ${exam.stage === 'after_12' ? 'selected' : ''}>After Class 12</option>
              <option value="after_grad" ${exam.stage === 'after_grad' ? 'selected' : ''}>After Graduation</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" id="edit-exam-cat" class="form-input" value="${exam.category}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Schedule Status</label>
            <input type="text" id="edit-exam-status" class="form-input" value="${exam.schedule_status || 'Official'}" required />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Official Schedule Details</label>
          <input type="text" id="edit-exam-schedule" class="form-input" value="${exam.official_schedule || ''}" required />
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Overview</label>
          <textarea id="edit-exam-overview" class="form-textarea" rows="2" required>${exam.overview}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    modal.open('Edit Examination Details', content, 'modal-content-lg');
  },

  async handleEditExamSubmit(e, examId) {
    e.preventDefault();
    const name = document.getElementById('edit-exam-name').value.trim();
    const short_name = document.getElementById('edit-exam-short').value.trim();
    const stage = document.getElementById('edit-exam-stage').value;
    const category = document.getElementById('edit-exam-cat').value.trim();
    const schedule_status = document.getElementById('edit-exam-status').value.trim();
    const official_schedule = document.getElementById('edit-exam-schedule').value.trim();
    const overview = document.getElementById('edit-exam-overview').value.trim();

    try {
      await window.api.adminUpdateExam(examId, {
        name, short_name, stage, category, schedule_status, official_schedule, overview
      });

      modal.close();
      toast.success('Examination updated successfully!');
      this.render();
    } catch (err) {
      toast.error('Update failed: ' + err.message);
    }
  },

  async handleArchiveExam(examId) {
    if (!confirm('Are you sure you want to archive this examination? It will be hidden from the active directory.')) return;

    try {
      await window.api.adminArchiveExam(examId);
      toast.info('Examination archived.');
      this.render();
    } catch (err) {
      toast.error('Archive failed: ' + err.message);
    }
  },

  // ------------------------------------------------------------------------
  // DEDICATED SECTION: OFFICIAL PDF PAPERS REPOSITORY & MANAGEMENT
  // ------------------------------------------------------------------------
  renderPdfPapersTab() {
    const papers = this.pdfPapersCache || [];
    const currentExam = this.examsCache.find(e => e.id === this.selectedExamId) || {};

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Header Bar -->
        <div class="spps-card" style="padding: 1.5rem; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border-left: 4px solid #3b82f6;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-indigo">Official Document Studio</span>
                <span class="badge badge-emerald">Verified PDFs</span>
              </div>
              <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 0.35rem;">
                Official PDF Question Papers & Booklets
              </h2>
              <p style="font-size: 0.875rem; color: #475569; margin-top: 0.25rem;">
                Upload authentic PDF question booklets, official answer keys, and model papers. Uploaded PDFs are instantly available for students to read online or download.
              </p>
            </div>

            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="adminConsoleView.openPdfUploadModal()" style="display: inline-flex; align-items: center; gap: 6px;">
                <span>📄</span> Upload PDF Paper
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: #475569;">Target Exam:</span>
              <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem; font-weight: 700;" onchange="adminConsoleView.handlePdfExamChange(this.value)">
                ${this.examsCache.map(e => `
                  <option value="${e.id}" ${e.id === this.selectedExamId ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </select>
            </div>
            <div style="font-size: 0.8125rem; color: #64748b;">
              Showing <strong>${papers.length}</strong> official PDF documents for <em>${currentExam.name || this.selectedExamId}</em>.
            </div>
          </div>
        </div>

        <!-- PDF Papers Table -->
        <div class="spps-card" style="padding: 0; overflow: hidden;">
          ${papers.length === 0 ? `
            <div style="padding: 3.5rem; text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 0.75rem;">📄</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">No PDF Papers Uploaded For This Examination</h3>
              <p style="color: #64748b; max-width: 500px; margin: 0 auto 1.5rem;">
                There are currently no official PDF question papers in the archive for ${currentExam.name || this.selectedExamId}. Upload one now to make it available to students.
              </p>
              <button class="btn btn-primary btn-sm" onclick="adminConsoleView.openPdfUploadModal()">
                + Upload First PDF Paper
              </button>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 700;">
                    <th style="padding: 0.85rem 1.25rem;">Document Title & Details</th>
                    <th style="padding: 0.85rem 1.25rem;">Type</th>
                    <th style="padding: 0.85rem 1.25rem;">Year</th>
                    <th style="padding: 0.85rem 1.25rem;">File Size</th>
                    <th style="padding: 0.85rem 1.25rem;">Downloads</th>
                    <th style="padding: 0.85rem 1.25rem; text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${papers.map(p => {
                    const sizeKb = (p.file_size_bytes / 1024).toFixed(1);
                    const typeBadge = p.paper_type === 'Official Question Paper' ? 'badge-indigo'
                      : p.paper_type === 'Answer Key & Solution' ? 'badge-emerald'
                      : 'badge-amber';
                    const safeTitle = (p.title || '').replace(/'/g, "\\'");

                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 1rem 1.25rem; max-width: 420px;">
                          <div style="font-weight: 700; color: #0f172a; line-height: 1.4;">${p.title}</div>
                          <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${p.description || 'Official verified question paper'}
                          </div>
                          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                            📁 ${p.file_name}
                          </div>
                        </td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge ${typeBadge}">${p.paper_type}</span>
                        </td>
                        <td style="padding: 1rem 1.25rem; font-weight: 700; color: #334155;">
                          ${p.year}
                        </td>
                        <td style="padding: 1rem 1.25rem; color: #64748b;">
                          ${sizeKb} KB
                        </td>
                        <td style="padding: 1rem 1.25rem; color: #334155; font-weight: 600;">
                          ⬇ ${p.download_count}
                        </td>
                        <td style="padding: 1rem 1.25rem; text-align: right;">
                          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm" onclick="pyqView.openPdfViewer('${p.id}', '${safeTitle}')" title="Preview Online">
                              👁 View
                            </button>
                            <a href="/api/pyq-pdfs/${p.id}/download" download="${p.file_name}" class="btn btn-secondary btn-sm" title="Download File">
                              ⬇
                            </a>
                            <button class="btn btn-sm btn-outline-danger" onclick="adminConsoleView.handleDeletePdfPaper('${p.id}')" title="Delete Paper">
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  },

  async handlePdfExamChange(examId) {
    this.selectedExamId = examId;
    try {
      const pdfRes = await window.api.getPyqPdfs({ exam_id: this.selectedExamId });
      this.pdfPapersCache = pdfRes.papers || [];
      const tabEl = document.getElementById('admin-tab-content');
      if (tabEl) {
        tabEl.innerHTML = this.renderTabContent();
      }
    } catch (e) {
      console.warn('Failed to switch PDF exam:', e.message);
    }
  },

  openPdfUploadModal() {
    const content = `
      <form id="admin-pdf-form" onsubmit="adminConsoleView.handlePdfUploadSubmit(event)">
        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Target Examination *</label>
            <select id="admin-pdf-exam" class="form-select" required>
              ${this.examsCache.map(e => `
                <option value="${e.id}" ${e.id === this.selectedExamId ? 'selected' : ''}>${e.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Examination Year *</label>
            <input type="number" id="admin-pdf-year" class="form-input" min="2000" max="2030" value="2024" required />
          </div>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Document Type *</label>
            <select id="admin-pdf-type" class="form-select" required>
              <option value="Official Question Paper">Official Question Paper</option>
              <option value="Answer Key & Solution">Answer Key & Solution</option>
              <option value="Model Paper">Model Paper</option>
              <option value="Sample Paper">Sample Paper</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Paper Title *</label>
            <input type="text" id="admin-pdf-title" class="form-input" placeholder="e.g. JEE Main 2024 Shift 1 Question Paper" required />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Description / Special Instructions</label>
          <textarea id="admin-pdf-desc" class="form-textarea" rows="2" placeholder="e.g. Official question paper booklet released by the conducting authority with section-wise scoring rules."></textarea>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">Select PDF Document (.pdf) *</label>
          <div style="border: 2px dashed #cbd5e1; border-radius: 0.5rem; padding: 1.5rem; text-align: center; background: #f8fafc; cursor: pointer;" onclick="document.getElementById('admin-pdf-file-input').click()">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
            <div style="font-size: 0.875rem; font-weight: 700; color: #334155;" id="admin-pdf-file-label">Click to select PDF or drag and drop</div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Standard PDF document (.pdf) up to 25 MB</div>
            <input type="file" id="admin-pdf-file-input" accept=".pdf,application/pdf" style="display: none;" onchange="adminConsoleView.handlePdfFileSelected(this)" required />
          </div>
        </div>

        <div id="admin-pdf-upload-status" style="display: none; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.8125rem; margin-bottom: 1rem;"></div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" id="admin-pdf-submit-btn" class="btn btn-primary">Upload & Publish PDF Paper</button>
        </div>
      </form>
    `;

    modal.open('Upload Official PDF Question Paper', content, 'modal-content-lg');
  },

  handlePdfFileSelected(input) {
    const file = input.files && input.files[0];
    const label = document.getElementById('admin-pdf-file-label');
    if (file && label) {
      label.innerHTML = `Selected: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
    }
  },

  async handlePdfUploadSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('admin-pdf-submit-btn');
    const statusDiv = document.getElementById('admin-pdf-upload-status');
    const fileInput = document.getElementById('admin-pdf-file-input');
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      toast.error('Please choose a valid PDF file.');
      return;
    }

    const exam_id = document.getElementById('admin-pdf-exam').value;
    const year = parseInt(document.getElementById('admin-pdf-year').value, 10);
    const paper_type = document.getElementById('admin-pdf-type').value;
    const title = document.getElementById('admin-pdf-title').value.trim();
    const description = document.getElementById('admin-pdf-desc').value.trim();

    submitBtn.disabled = true;
    submitBtn.innerText = 'Uploading...';
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.style.background = '#e0f2fe';
      statusDiv.style.color = '#0369a1';
      statusDiv.innerText = 'Encoding PDF binary and saving to official question paper repository...';
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = {
          exam_id,
          year,
          paper_type,
          title,
          description,
          file_name: file.name,
          file_data: reader.result
        };

        await window.api.adminUploadPyqPdf(payload);
        modal.close();
        toast.success('Official PDF question paper published successfully!');
        this.selectedExamId = exam_id;
        this.activeTab = 'pdf-papers';
        await this.loadQuestionsForStudio();
        this.render();
      } catch (err) {
        if (statusDiv) {
          statusDiv.style.background = '#fee2e2';
          statusDiv.style.color = '#b91c1c';
          statusDiv.innerText = 'Upload failed: ' + err.message;
        }
        submitBtn.disabled = false;
        submitBtn.innerText = 'Upload & Publish PDF Paper';
        toast.error('Upload failed: ' + err.message);
      }
    };
    reader.onerror = () => {
      toast.error('Could not read local PDF file.');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Upload & Publish PDF Paper';
    };
    reader.readAsDataURL(file);
  },

  async handleDeletePdfPaper(id) {
    if (!confirm('Are you sure you want to permanently delete this official PDF question paper?')) return;

    try {
      await window.api.adminDeletePyqPdf(id);
      toast.info('Official PDF paper removed.');
      const pdfRes = await window.api.getPyqPdfs({ exam_id: this.selectedExamId });
      this.pdfPapersCache = pdfRes.papers || [];
      const tabEl = document.getElementById('admin-tab-content');
      if (tabEl) {
        tabEl.innerHTML = this.renderTabContent();
      }
    } catch (err) {
      toast.error('Deletion failed: ' + err.message);
    }
  }
};

window.adminConsoleView = adminConsoleView;

// SPPS Previous-Year Questions (PYQ) Module
// Features Year-Wise Papers Archive, Topic-Wise Syllabus Mastery, and Interactive Question Solver.

const pyqView = {
  activeTab: 'year-wise', // 'year-wise', 'topic-wise', 'all-questions', 'pdf-papers'
  currentFilters: {
    exam_id: 'active',
    year: 'all',
    subject_id: 'all',
    topic_id: 'all',
    difficulty: 'all',
    search: '',
    bookmarked_only: false,
    mistakes_only: false
  },
  pdfFilters: {
    year: 'all',
    paper_type: 'all',
    search: ''
  },
  isTimedMode: false,
  timerSeconds: 0,
  timerInterval: null,
  questionsCache: [],
  pdfPapersCache: [],
  summaryCache: null,
  allExamsCache: [],
  subjectsCache: [],
  topicsCache: [],
  currentExamDetails: null,

  async render(paramExamId = null) {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (paramExamId) {
      this.currentFilters.exam_id = paramExamId;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading verified previous-year question bank & syllabus archive...
      </div>
    `;

    try {
      const allExamsRes = await window.api.getExams();
      this.allExamsCache = allExamsRes.exams || [];
      const user = window.state.get('user');

      const activeExamId = this.currentFilters.exam_id === 'active'
        ? (user?.active_exam_id || 'jee-main')
        : this.currentFilters.exam_id;

      // Fetch exam details + syllabus tree
      this.currentExamDetails = await window.api.getExamDetails(activeExamId);
      this.subjectsCache = this.currentExamDetails.subjects || [];
      this.topicsCache = [];
      this.subjectsCache.forEach(s => {
        if (s.topics) this.topicsCache.push(...s.topics);
      });

      // Fetch summary metrics (Year-Wise and Topic-Wise)
      this.summaryCache = await window.api.getPyqSummary(activeExamId);

      // Fetch filtered questions
      const res = await window.api.getPyqs({
        ...this.currentFilters,
        exam_id: activeExamId
      });
      this.questionsCache = res.questions || [];

      // Fetch official PDF question papers
      try {
        const pdfRes = await window.api.getPyqPdfs({
          exam_id: activeExamId,
          year: this.pdfFilters.year,
          paper_type: this.pdfFilters.paper_type,
          search: this.pdfFilters.search
        });
        this.pdfPapersCache = pdfRes.papers || [];
      } catch (pdfErr) {
        console.warn('Failed to fetch PDF papers:', pdfErr.message);
        this.pdfPapersCache = [];
      }

      this.renderFullView(activeExamId);

      if (this.isTimedMode && !this.timerInterval) {
        this.startTimer();
      }
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">Error: ${err.message}</div>`;
    }
  },

  renderFullView(activeExamId) {
    const container = document.getElementById('view-container');
    if (!container) return;

    const exam = this.currentExamDetails?.exam || {};
    const summary = this.summaryCache || {};

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1300px; margin: 0 auto;">
        <!-- Header Banner -->
        <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                <span class="badge badge-teal">${exam.short_name || 'Official Exam'}</span>
                <span class="badge badge-emerald">Verified Question Archive</span>
                <span class="badge badge-indigo">${summary.total_questions || 0} Questions Available</span>
              </div>
              <h1 style="font-size: 1.85rem; font-weight: 800;">Previous-Year Questions (PYQ) Bank</h1>
              <p style="font-size: 0.875rem; color: #c7d2fe; margin-top: 4px;">
                Master real questions from official exams with step-by-step verified explanations, year-wise papers, and topic-wise drills.
              </p>
            </div>

            <!-- Mode Controls & Admin Import Link -->
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
              <button class="btn btn-sm ${this.isTimedMode ? 'btn-accent' : 'btn-secondary'}" 
                      style="${!this.isTimedMode ? 'background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.25);' : ''}" 
                      onclick="pyqView.toggleTimerMode()">
                ${window.icons.clock || '⏱'} ${this.isTimedMode ? 'Timed Exam Mode Active' : 'Enable Timed Practice'}
              </button>

              <button class="btn btn-secondary btn-sm" 
                      style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" 
                      onclick="pyqView.printStudySheet()">
                ${window.icons.download || '⎙'} Print Study Sheet
              </button>

              <button class="btn btn-secondary btn-sm" 
                      style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" 
                      onclick="adminImport.openModal('${activeExamId}')">
                ${window.icons.upload || '↑'} Upload PYQs (CSV/JSON)
              </button>
            </div>
          </div>

          ${this.isTimedMode ? `
            <div style="margin-top: 1.25rem; padding: 0.75rem 1.25rem; background: rgba(0,0,0,0.35); border-radius: 0.5rem; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.15);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="color: #34d399; font-size: 1.25rem;">●</div>
                <div>
                  <div style="font-size: 0.8125rem; font-weight: 700;">Simulated Examination Session Running</div>
                  <div style="font-size: 0.75rem; color: #cbd5e1;">Test your speed and mental endurance under real time constraints.</div>
                </div>
              </div>
              <div id="pyq-timer-display" style="font-size: 1.5rem; font-family: monospace; font-weight: 800; color: #34d399; letter-spacing: 0.05em;">00:00</div>
            </div>
          ` : ''}

          <!-- Overall Student Accuracy & Attempt Progress -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.15);">
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Total Questions</div>
              <div style="font-size: 1.4rem; font-weight: 800;">${summary.total_questions || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">You Attempted</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8;">${summary.total_attempted || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Correct Answers</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #34d399;">${summary.total_correct || 0}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Overall Accuracy</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #fbbf24;">
                ${summary.total_attempted > 0 ? Math.round((summary.total_correct / summary.total_attempted) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        <!-- Section Navigation Tabs: Year-Wise Papers, Topic-Wise Mastery, All Questions, PDF Papers -->
        <div class="spps-card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.activeTab === 'year-wise' ? 'btn-primary' : 'btn-secondary'}" onclick="pyqView.switchTab('year-wise')">
                📅 Year-Wise Papers (${(summary.years || []).length} Years)
              </button>
              <button class="btn btn-sm ${this.activeTab === 'topic-wise' ? 'btn-primary' : 'btn-secondary'}" onclick="pyqView.switchTab('topic-wise')">
                🎯 Topic-Wise Mastery (${(summary.topics || []).length} Topics)
              </button>
              <button class="btn btn-sm ${this.activeTab === 'all-questions' ? 'btn-primary' : 'btn-secondary'}" onclick="pyqView.switchTab('all-questions')">
                🔍 Filterable Question Bank (${this.questionsCache.length} Questions)
              </button>
              <button class="btn btn-sm ${this.activeTab === 'pdf-papers' ? 'btn-primary' : 'btn-secondary'}" onclick="pyqView.switchTab('pdf-papers')">
                📄 Official PDF Papers (${this.pdfPapersCache.length})
              </button>
            </div>

            <!-- Target Exam Dropdown Switcher -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b;">Target Exam:</span>
              <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem; font-weight: 700;" onchange="pyqView.setExam(this.value)">
                ${this.allExamsCache.map(e => `
                  <option value="${e.id}" ${e.id === activeExamId ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Dynamic Content Body -->
        <div id="pyq-tab-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    const tabEl = document.getElementById('pyq-tab-content');
    if (tabEl) {
      tabEl.innerHTML = this.renderTabContent();
    }
  },

  renderTabContent() {
    if (this.activeTab === 'year-wise') {
      return this.renderYearWiseTab();
    } else if (this.activeTab === 'topic-wise') {
      return this.renderTopicWiseTab();
    } else if (this.activeTab === 'pdf-papers') {
      return this.renderPdfPapersTab();
    } else {
      return this.renderAllQuestionsTab();
    }
  },

  // ------------------------------------------------------------------------
  // TAB 1: YEAR-WISE PAPERS ARCHIVE
  // ------------------------------------------------------------------------
  renderYearWiseTab() {
    const summary = this.summaryCache || {};
    const years = summary.years || [];
    const exam = this.currentExamDetails?.exam || {};

    if (!years.length) {
      return `
        <div class="spps-card" style="padding: 3rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📅</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">No Year Papers Uploaded Yet</h3>
          <p style="font-size: 0.875rem; color: #64748b; max-width: 500px; margin: 0.5rem auto 1.5rem;">
            There are currently no year-specific question papers recorded for ${exam.name}. Admin/teachers can upload papers via the bulk import tool.
          </p>
          <button class="btn btn-primary" onclick="adminImport.openModal('${exam.id}')">
            Upload ${exam.short_name} Questions Now
          </button>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">
              ${exam.short_name} Year-Wise Question Papers
            </h3>
            <p style="font-size: 0.875rem; color: #64748b;">
              Practice questions organized paper-by-paper by year, or simulate real examination sittings.
            </p>
          </div>
        </div>

        <!-- Year Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
          ${years.map(y => {
            const attempted = y.attempted_count || 0;
            const total = y.question_count || 0;
            const correct = y.correct_count || 0;
            const pctSolved = total > 0 ? Math.round((attempted / total) * 100) : 0;
            const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

            return `
              <div class="spps-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #4f46e5;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                      <span class="badge badge-indigo" style="font-size: 0.9375rem; font-weight: 800; padding: 4px 10px;">
                        Year ${y.year}
                      </span>
                    </div>
                    <span class="badge badge-emerald">Verified Official Paper</span>
                  </div>

                  <h4 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">
                    ${exam.short_name} ${y.year} Official Paper
                  </h4>
                  <p style="font-size: 0.8125rem; color: #64748b; margin-bottom: 1.25rem;">
                    Includes official questions, verified keys, and detailed pedagogical solutions.
                  </p>

                  <!-- Progress Metrics -->
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.875rem; margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
                      <span>Paper Completion</span>
                      <span>${attempted} / ${total} Solved (${pctSolved}%)</span>
                    </div>
                    <div class="progress-bar-container" style="height: 6px; margin-bottom: 6px;">
                      <div class="progress-bar-fill" style="width: ${pctSolved}%; background: #4f46e5;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b;">
                      <span>Accuracy: <strong>${accuracy}%</strong></span>
                      <span>${correct} Correct Answers</span>
                    </div>
                  </div>
                </div>

                <!-- Launch Buttons -->
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-primary" style="flex: 1; font-size: 0.8125rem;" onclick="pyqView.solveYearPaper('${y.year}', false)">
                    Solve ${y.year} Paper →
                  </button>
                  <button class="btn btn-secondary btn-sm" title="Take Timed Exam Simulation" onclick="pyqView.solveYearPaper('${y.year}', true)">
                    ⏱ Timed
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  solveYearPaper(year, timed = false) {
    this.currentFilters.year = year;
    this.currentFilters.subject_id = 'all';
    this.currentFilters.topic_id = 'all';
    this.currentFilters.search = '';
    this.currentFilters.bookmarked_only = false;
    this.currentFilters.mistakes_only = false;
    this.activeTab = 'all-questions';

    if (timed) {
      this.isTimedMode = true;
      this.startTimer();
    }

    this.render();
  },

  // ------------------------------------------------------------------------
  // TAB 2: TOPIC-WISE SYLLABUS MASTERY
  // ------------------------------------------------------------------------
  renderTopicWiseTab() {
    const summary = this.summaryCache || {};
    const topics = summary.topics || [];
    const subjects = this.subjectsCache || [];
    const exam = this.currentExamDetails?.exam || {};

    if (!subjects.length && !topics.length) {
      return `
        <div class="spps-card" style="padding: 3rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎯</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">No Topics Configured</h3>
          <p style="font-size: 0.875rem; color: #64748b; margin-top: 4px;">Syllabus topics for this exam are being populated.</p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">
            Topic-Wise PYQ Mastery & Syllabus Tree
          </h3>
          <p style="font-size: 0.875rem; color: #64748b;">
            Isolate high-yield syllabus areas and practice all previous-year questions from that specific topic across all years.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${subjects.map(subj => {
            const subjTopics = topics.filter(t => t.subject_id === subj.id);
            const totalSubjQs = subjTopics.reduce((acc, t) => acc + (t.question_count || 0), 0);

            return `
              <div class="spps-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
                  <div>
                    <h4 style="font-size: 1.2rem; font-weight: 800; color: #0f172a;">
                      ${subj.name}
                    </h4>
                    <p style="font-size: 0.8125rem; color: #64748b; margin-top: 2px;">
                      ${subj.description || 'Core syllabus branch'}
                    </p>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-teal">${subj.weightage_percent}% Weightage</span>
                    <span class="badge badge-indigo">${totalSubjQs} PYQs Available</span>
                  </div>
                </div>

                <!-- Topics Grid -->
                ${subjTopics.length === 0 ? `
                  <div style="font-size: 0.8125rem; color: #94a3b8; font-style: italic; padding: 1rem 0;">
                    No specific topic questions indexed yet for this subject.
                  </div>
                ` : `
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    ${subjTopics.map(t => {
                      const qCount = t.question_count || 0;
                      const attCount = t.attempted_count || 0;
                      const corCount = t.correct_count || 0;
                      const acc = attCount > 0 ? Math.round((corCount / attCount) * 100) : 0;

                      return `
                        <div style="padding: 1rem; border-radius: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between;">
                          <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                              <span class="badge ${t.weightage_tier === 'High-Yield' ? 'badge-rose' : (t.weightage_tier === 'Core' ? 'badge-indigo' : 'badge-slate')}" style="font-size: 0.65rem;">
                                ${t.weightage_tier || 'Core'}
                              </span>
                              <span class="badge ${t.difficulty === 'Hard' ? 'badge-amber' : 'badge-teal'}" style="font-size: 0.65rem;">
                                ${t.difficulty || 'Medium'}
                              </span>
                            </div>

                            <div style="font-weight: 700; font-size: 0.9375rem; color: #0f172a; margin-bottom: 0.5rem;">
                              ${t.topic_name}
                            </div>

                            <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem;">
                              ${qCount} Questions Available Across Years
                            </div>

                            ${attCount > 0 ? `
                              <div style="font-size: 0.75rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
                                <span style="color: #475569;">Solved: ${attCount}/${qCount}</span>
                                <span style="font-weight: 700; color: ${acc >= 75 ? '#059669' : '#dc2626'};">Accuracy: ${acc}%</span>
                              </div>
                            ` : ''}
                          </div>

                          <button class="btn btn-primary btn-sm" style="width: 100%; font-size: 0.75rem;" onclick="pyqView.practiceTopic('${t.topic_id}')">
                            Practice This Topic (${qCount} Qs) →
                          </button>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  practiceTopic(topicId) {
    this.currentFilters.topic_id = topicId;
    this.currentFilters.year = 'all';
    this.currentFilters.search = '';
    this.currentFilters.bookmarked_only = false;
    this.currentFilters.mistakes_only = false;
    this.activeTab = 'all-questions';
    this.render();
  },

  // ------------------------------------------------------------------------
  // TAB 3: ALL QUESTIONS & FILTERABLE ARCHIVE (SOLVER ENGINE)
  // ------------------------------------------------------------------------
  renderAllQuestionsTab() {
    const summary = this.summaryCache || {};
    const years = summary.years || [];
    const subjects = this.subjectsCache || [];
    const topics = this.topicsCache || [];

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Multi-Criteria Filter Bar -->
        <div class="spps-card" style="padding: 1.25rem 1.5rem;">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <!-- Year Selector -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b;">Year:</span>
                <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem; font-weight: 600;" onchange="pyqView.setYear(this.value)">
                  <option value="all">All Years</option>
                  ${years.map(y => `
                    <option value="${y.year}" ${String(this.currentFilters.year) === String(y.year) ? 'selected' : ''}>${y.year} (${y.question_count} Qs)</option>
                  `).join('')}
                </select>
              </div>

              <!-- Subject Selector -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b;">Subject:</span>
                <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem;" onchange="pyqView.setSubject(this.value)">
                  <option value="all">All Subjects</option>
                  ${subjects.map(s => `
                    <option value="${s.id}" ${this.currentFilters.subject_id === s.id ? 'selected' : ''}>${s.name}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Topic Selector -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b;">Topic:</span>
                <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem;" onchange="pyqView.setTopic(this.value)">
                  <option value="all">All Topics</option>
                  ${topics.map(t => `
                    <option value="${t.id}" ${this.currentFilters.topic_id === t.id ? 'selected' : ''}>${t.name}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Difficulty Selector -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b;">Difficulty:</span>
                <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem;" onchange="pyqView.setDifficulty(this.value)">
                  <option value="all">All Difficulties</option>
                  <option value="Easy" ${this.currentFilters.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                  <option value="Medium" ${this.currentFilters.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="Hard" ${this.currentFilters.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                </select>
              </div>
            </div>

            <!-- Second Row: Search and Special Toggles -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-top: 1px solid #e2e8f0; padding-top: 0.75rem;">
              <div style="flex: 1; min-width: 260px; max-width: 450px;">
                <input 
                  type="text" 
                  class="form-input" 
                  placeholder="Search questions by formula, concept, or term..." 
                  value="${this.currentFilters.search}"
                  oninput="pyqView.handleSearchInput(this.value)"
                  style="font-size: 0.8125rem;"
                />
              </div>

              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-sm ${this.currentFilters.bookmarked_only ? 'btn-primary' : 'btn-secondary'}" onclick="pyqView.toggleBookmarkedOnly()">
                  ★ Bookmarked Only
                </button>
                <button class="btn btn-sm ${this.currentFilters.mistakes_only ? 'btn-primary' : 'btn-secondary'}" onclick="pyqView.toggleMistakesOnly()">
                  ⚠ My Mistakes Only
                </button>
                <button class="btn btn-secondary btn-sm" onclick="pyqView.resetFilters()">
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Cards Stack -->
        <div id="pyq-questions-stack" style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${this.renderQuestionsList()}
        </div>
      </div>
    `;
  },

  renderQuestionsList() {
    if (this.questionsCache.length === 0) {
      return `
        <div class="spps-card" style="padding: 3rem; text-align: center;">
          <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.75rem;">🔍</div>
          <h4 style="font-size: 1.15rem; font-weight: 700; color: #334155;">No Questions Match Filter Criteria</h4>
          <p style="font-size: 0.8125rem; color: #64748b; margin-top: 4px; margin-bottom: 1.25rem;">
            Try clearing filters or switching years to explore available questions.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="pyqView.resetFilters()">
            Clear All Filters
          </button>
        </div>
      `;
    }

    return this.questionsCache.map((q, idx) => {
      const hasAttempted = !!q.last_attempt;
      const isCorrect = hasAttempted && q.last_attempt.is_correct === 1;

      return `
        <div class="spps-card" id="q-card-${q.id}" style="padding: 1.75rem; border-left: 4px solid ${hasAttempted ? (isCorrect ? '#10b981' : '#f43f5e') : '#6366f1'};">
          <!-- Question Header Badges -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span class="badge badge-indigo" style="font-weight: 800;">${q.year}</span>
              <span class="badge badge-teal">${q.subject_name || 'General'}</span>
              ${q.topic_name ? `<span class="badge badge-slate" style="font-weight: 600;">${q.topic_name}</span>` : ''}
              <span class="badge ${q.difficulty === 'Easy' ? 'badge-emerald' : (q.difficulty === 'Hard' ? 'badge-rose' : 'badge-amber')}">
                ${q.difficulty}
              </span>
              <span class="badge ${q.is_official ? 'badge-emerald' : 'badge-slate'}">
                ${q.verification_status || (q.is_official ? 'Verified Official PYQ' : 'Practice Question')}
              </span>
            </div>

            <!-- Bookmark Action -->
            <button class="btn btn-secondary btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="pyqView.toggleBookmark('${q.id}')">
              ${q.is_bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>
          </div>

          <!-- Question Statement -->
          <div style="font-size: 1.05rem; font-weight: 600; color: #0f172a; margin-bottom: 1.25rem; line-height: 1.6;">
            <span style="color: #6366f1; margin-right: 4px;">Q${idx + 1}.</span> ${q.question_text}
          </div>

          <!-- Multiple Choice Options -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem;">
            ${(q.options || []).map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isSelected = hasAttempted && q.last_attempt.selected_answer === opt;
              const isCorrectOpt = opt === q.correct_answer;

              let optBg = '#ffffff';
              let optBorder = 'var(--border-subtle)';
              let textColor = '#0f172a';

              if (hasAttempted) {
                if (isCorrectOpt) {
                  optBg = '#ecfdf5';
                  optBorder = '#10b981';
                  textColor = '#065f46';
                } else if (isSelected && !isCorrect) {
                  optBg = '#fff1f2';
                  optBorder = '#f43f5e';
                  textColor = '#881337';
                }
              }

              return `
                <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1.5px solid ${optBorder}; background: ${optBg}; color: ${textColor}; cursor: pointer; transition: all 0.15s ease;">
                  <input type="radio" name="opt-${q.id}" value="${opt}" ${isSelected ? 'checked' : ''} style="cursor: pointer;" />
                  <span style="font-weight: 800; font-size: 0.875rem; width: 22px;">${letter}.</span>
                  <span style="font-size: 0.9375rem; flex: 1;">${opt}</span>
                  ${hasAttempted && isCorrectOpt ? `<span class="badge badge-emerald" style="font-weight: 700;">✓ Correct Key</span>` : ''}
                </label>
              `;
            }).join('')}
          </div>

          <!-- Action Buttons & Explanation Accordion -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-primary btn-sm" onclick="pyqView.submitAttempt('${q.id}')">
                Submit & Verify Answer
              </button>
              <button class="btn btn-secondary btn-sm" onclick="pyqView.toggleExplanation('${q.id}')">
                View Step-by-Step Solution
              </button>
            </div>

            ${q.source_url ? `
              <a href="${q.source_url}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: #4f46e5; text-decoration: underline;">
                ${q.source_url.startsWith('http') ? 'Official Source Portal' : q.source_url}
              </a>
            ` : ''}
          </div>

          <!-- Step-by-Step Pedagogical Explanation -->
          <div id="expl-${q.id}" style="display: ${hasAttempted ? 'block' : 'none'}; margin-top: 1rem; padding: 1rem 1.25rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #4f46e5;">
            <div style="font-weight: 800; font-size: 0.875rem; color: #1e1b4b; margin-bottom: 0.35rem;">
              Step-by-Step Pedagogical Solution:
            </div>
            <div style="font-size: 0.875rem; color: #334155; line-height: 1.6; white-space: pre-wrap;">${q.explanation}</div>
            <div style="font-size: 0.8125rem; font-weight: 700; color: #0d9488; margin-top: 0.5rem;">
              Official Answer: <strong>${q.correct_answer}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async submitAttempt(questionId) {
    const user = window.state.get('user');
    if (!user) {
      toast.info('Please sign in or register to record your attempts and streak!');
      authModal.open('register');
      return;
    }

    const selectedRadio = document.querySelector(`input[name="opt-${questionId}"]:checked`);
    if (!selectedRadio) {
      toast.warning('Please select an option before submitting!');
      return;
    }

    const selectedVal = selectedRadio.value;

    try {
      const res = await window.api.attemptQuestion(questionId, selectedVal, 30, 'pyq_browser');

      if (res.isCorrect) {
        toast.success(`Correct Answer! Current Streak: ${res.currentStreak} Days 🔥`);
      } else {
        toast.error(`Incorrect. Added to your Mistakes Review Notebook.`);
      }

      // Automatically show explanation
      const expl = document.getElementById(`expl-${questionId}`);
      if (expl) expl.style.display = 'block';

      // Update question cache item
      const q = this.questionsCache.find(x => x.id === questionId);
      if (q) {
        q.last_attempt = { selected_answer: selectedVal, is_correct: res.isCorrect ? 1 : 0 };
      }

      // Re-render
      this.render();
    } catch (err) {
      toast.error('Failed to submit attempt: ' + err.message);
    }
  },

  toggleExplanation(questionId) {
    const expl = document.getElementById(`expl-${questionId}`);
    if (expl) {
      expl.style.display = (expl.style.display === 'none' || !expl.style.display) ? 'block' : 'none';
    }
  },

  async toggleBookmark(questionId) {
    const user = window.state.get('user');
    if (!user) {
      toast.info('Please sign in or register to bookmark questions for quick revision!');
      authModal.open('register');
      return;
    }

    try {
      const res = await window.api.toggleBookmark(questionId);
      const q = this.questionsCache.find(x => x.id === questionId);
      if (q) q.is_bookmarked = res.bookmarked;
      toast.info(res.bookmarked ? 'Question bookmarked for quick revision!' : 'Bookmark removed.');
      this.render();
    } catch (e) {
      toast.error('Bookmark toggle failed');
    }
  },

  toggleTimerMode() {
    this.isTimedMode = !this.isTimedMode;
    if (!this.isTimedMode && this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.render();
  },

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
      const secs = String(this.timerSeconds % 60).padStart(2, '0');
      const display = document.getElementById('pyq-timer-display');
      if (display) display.textContent = `${mins}:${secs}`;
    }, 1000);
  },

  printStudySheet() {
    const exam = this.currentExamDetails?.exam || {};
    const win = window.open('', '_blank');
    if (!win) {
      toast.warning('Please allow popups to open print sheet.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${exam.short_name} PYQ Study Sheet — SPPS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; color: #0f172a; }
          h1 { margin-bottom: 0.25rem; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 2rem; }
          .q-block { margin-bottom: 2rem; page-break-inside: avoid; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem; }
          .q-title { font-weight: bold; margin-bottom: 0.75rem; font-size: 1.05rem; }
          .options { margin-left: 1rem; margin-bottom: 0.75rem; }
          .opt { margin-bottom: 0.35rem; }
          .solution { background: #f8fafc; padding: 0.75rem 1rem; border-left: 3px solid #4f46e5; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${exam.name}</h1>
          <div>Previous-Year Questions Study Sheet • Total Questions: ${this.questionsCache.length}</div>
          <div style="font-size: 0.85rem; color: #64748b;">Generated from SPPS (Study Plan Preparation System)</div>
        </div>

        ${this.questionsCache.map((q, i) => `
          <div class="q-block">
            <div class="q-title">Q${i + 1}. [${q.year} - ${q.subject_name || 'General'}] ${q.question_text}</div>
            <div class="options">
              ${(q.options || []).map((o, idx) => `
                <div class="opt">(${String.fromCharCode(65 + idx)}) ${o}</div>
              `).join('')}
            </div>
            <div class="solution">
              <strong>Answer:</strong> ${q.correct_answer}<br/>
              <strong>Step-by-Step Explanation:</strong> ${q.explanation}
            </div>
          </div>
        `).join('')}

        <script>
          window.print();
        </script>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  },

  setExam(examId) {
    this.currentFilters.exam_id = examId;
    this.currentFilters.subject_id = 'all';
    this.currentFilters.topic_id = 'all';
    this.currentFilters.year = 'all';
    this.render();
  },

  setYear(year) {
    this.currentFilters.year = year;
    this.render();
  },

  setSubject(subjId) {
    this.currentFilters.subject_id = subjId;
    this.render();
  },

  setTopic(topicId) {
    this.currentFilters.topic_id = topicId;
    this.render();
  },

  setDifficulty(diff) {
    this.currentFilters.difficulty = diff;
    this.render();
  },

  handleSearchInput(text) {
    this.currentFilters.search = text;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.render();
    }, 300);
  },

  toggleBookmarkedOnly() {
    this.currentFilters.bookmarked_only = !this.currentFilters.bookmarked_only;
    this.currentFilters.mistakes_only = false;
    this.render();
  },

  toggleMistakesOnly() {
    this.currentFilters.mistakes_only = !this.currentFilters.mistakes_only;
    this.currentFilters.bookmarked_only = false;
    this.render();
  },

  resetFilters() {
    this.currentFilters = {
      exam_id: this.currentFilters.exam_id,
      year: 'all',
      subject_id: 'all',
      topic_id: 'all',
      difficulty: 'all',
      search: '',
      bookmarked_only: false,
      mistakes_only: false
    };
    this.render();
  },

  // ------------------------------------------------------------------------
  // TAB 4: OFFICIAL PDF QUESTION PAPERS & SOLUTIONS ARCHIVE
  // ------------------------------------------------------------------------
  renderPdfPapersTab() {
    const user = window.state.get('user');
    const isAdmin = user && user.role === 'admin';
    const papers = this.pdfPapersCache || [];
    const exam = this.currentExamDetails?.exam || {};

    const availableYears = Array.from(new Set(papers.map(p => p.year))).sort((a, b) => b - a);

    return `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Header Card -->
        <div class="spps-card" style="padding: 1.5rem; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border-left: 4px solid #4f46e5;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-indigo">Official Document Repository</span>
                <span class="badge badge-emerald">Verified PDFs</span>
                <span class="badge badge-slate">${papers.length} Papers Available</span>
              </div>
              <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 0.35rem;">
                Official PDF Question Papers & Answer Keys
              </h2>
              <p style="font-size: 0.875rem; color: #475569; margin-top: 0.25rem; max-width: 750px;">
                Access authentic question paper booklets and official answer keys. You can read them directly inside your browser or download them for offline practice and mock test printing.
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${isAdmin ? `
                <button class="btn btn-primary btn-sm" onclick="pyqView.openUploadModal()" style="display: inline-flex; align-items: center; gap: 6px;">
                  <span>📄</span> Upload Official PDF Paper (Admin)
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="pyqView.openUploadModal()" style="display: inline-flex; align-items: center; gap: 6px;" title="Upload PDF question paper">
                  <span>📄</span> Upload PDF Paper
                </button>
              `}
              <button class="btn btn-secondary btn-sm" onclick="pyqView.resetPdfFilters()">
                ↻ Reset Filters
              </button>
            </div>
          </div>

          <!-- PDF Search and Filter Toolbar -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block;">Search Question Papers</label>
              <input type="text" class="form-input" style="padding: 0.45rem 0.75rem; font-size: 0.8125rem;" 
                     placeholder="Search by title, year or code..." 
                     value="${this.pdfFilters.search || ''}" 
                     oninput="pyqView.handlePdfSearch(this.value)" />
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block;">Filter by Year</label>
              <select class="form-select" style="padding: 0.45rem 0.75rem; font-size: 0.8125rem;" onchange="pyqView.setPdfYear(this.value)">
                <option value="all" ${this.pdfFilters.year === 'all' ? 'selected' : ''}>All Years (${availableYears.length || 'All'})</option>
                ${[2024, 2023, 2022, 2021, 2020].map(y => `
                  <option value="${y}" ${this.pdfFilters.year == y ? 'selected' : ''}>Year ${y}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block;">Paper Type</label>
              <select class="form-select" style="padding: 0.45rem 0.75rem; font-size: 0.8125rem;" onchange="pyqView.setPdfType(this.value)">
                <option value="all" ${this.pdfFilters.paper_type === 'all' ? 'selected' : ''}>All Document Types</option>
                <option value="Official Question Paper" ${this.pdfFilters.paper_type === 'Official Question Paper' ? 'selected' : ''}>Official Question Paper</option>
                <option value="Answer Key & Solution" ${this.pdfFilters.paper_type === 'Answer Key & Solution' ? 'selected' : ''}>Answer Key & Solution</option>
                <option value="Model Paper" ${this.pdfFilters.paper_type === 'Model Paper' ? 'selected' : ''}>Model Paper</option>
                <option value="Sample Paper" ${this.pdfFilters.paper_type === 'Sample Paper' ? 'selected' : ''}>Sample Paper</option>
              </select>
            </div>
          </div>
        </div>

        <!-- PDF Papers Grid -->
        ${papers.length === 0 ? `
          <div class="spps-card" style="padding: 3.5rem; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">No PDF Question Papers Found</h3>
            <p style="color: #64748b; max-width: 500px; margin: 0 auto 1.5rem;">
              No PDF documents match your current filter selections for ${exam.name || 'this examination'}.
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button class="btn btn-secondary btn-sm" onclick="pyqView.resetPdfFilters()">Clear All Filters</button>
              <button class="btn btn-primary btn-sm" onclick="pyqView.openUploadModal()">+ Upload PDF for this Exam</button>
            </div>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem;">
            ${papers.map(p => {
              const sizeKb = (p.file_size_bytes / 1024).toFixed(1);
              const typeColor = p.paper_type === 'Official Question Paper' ? 'badge-indigo'
                : p.paper_type === 'Answer Key & Solution' ? 'badge-emerald'
                : 'badge-amber';
              const escapedTitle = (p.title || '').replace(/'/g, "\\'");

              return `
                <div class="spps-card hover-lift" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.25rem; border: 1px solid #e2e8f0; border-radius: 0.75rem;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem;">
                      <span class="badge ${typeColor}" style="font-size: 0.75rem;">${p.paper_type}</span>
                      <span class="badge badge-slate" style="font-weight: 700;">📅 ${p.year}</span>
                    </div>

                    <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.4; margin-bottom: 0.5rem;">
                      ${p.title}
                    </h3>

                    <p style="font-size: 0.8125rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem;">
                      ${p.description || 'Verified official previous-year question paper document.'}
                    </p>

                    <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.75rem; color: #94a3b8; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px dashed #e2e8f0; flex-wrap: wrap;">
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">📁 ${p.file_name}</span>
                      <span>⚖ ${sizeKb} KB</span>
                      <span>⬇ ${p.download_count} Downloads</span>
                    </div>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.5rem;">
                      <button class="btn btn-secondary btn-sm" onclick="pyqView.openPdfViewer('${p.id}', '${escapedTitle}')" style="display: inline-flex; align-items: center; gap: 4px;">
                        👁 Read Online
                      </button>
                      <a href="/api/pyq-pdfs/${p.id}/download" download="${p.file_name}" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
                        ⬇ Download PDF
                      </a>
                    </div>

                    ${isAdmin ? `
                      <button class="btn btn-sm btn-outline-danger" onclick="pyqView.deletePdf('${p.id}')" title="Delete Paper (Admin)">
                        🗑
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  openPdfViewer(paperId, title) {
    const existing = document.getElementById('pdf-viewer-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pdf-viewer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    `;

    modal.innerHTML = `
      <div style="background: #ffffff; width: 100%; max-width: 1100px; height: 92vh; border-radius: 0.75rem; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <!-- Modal Top Bar -->
        <div style="padding: 0.85rem 1.25rem; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
            <span style="font-size: 1.25rem;">📄</span>
            <div style="font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 600px;">
              ${title || 'Official PDF Question Paper'}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="/api/pyq-pdfs/${paperId}/download" class="btn btn-primary btn-sm" style="font-size: 0.8125rem; padding: 0.35rem 0.75rem;">
              ⬇ Download
            </a>
            <button class="btn btn-secondary btn-sm" onclick="pyqView.closePdfViewer()" style="font-size: 0.8125rem; padding: 0.35rem 0.75rem; background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.25);">
              ✕ Close
            </button>
          </div>
        </div>

        <!-- Embedded PDF Frame -->
        <div style="flex: 1; background: #525659; position: relative;">
          <iframe src="/api/pyq-pdfs/${paperId}/view" style="width: 100%; height: 100%; border: none;" title="${title}"></iframe>
        </div>

        <!-- Modal Footer Hint -->
        <div style="padding: 0.5rem 1rem; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
          <span>💡 Built-in PDF controls let you Zoom, Search text (Ctrl+F), Rotate pages, and Print directly.</span>
          <span>Press <strong>Esc</strong> to close</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const escListener = (e) => {
      if (e.key === 'Escape') {
        pyqView.closePdfViewer();
        window.removeEventListener('keydown', escListener);
      }
    };
    window.addEventListener('keydown', escListener);
  },

  closePdfViewer() {
    const el = document.getElementById('pdf-viewer-modal');
    if (el) el.remove();
  },

  openUploadModal() {
    const existing = document.getElementById('pdf-upload-modal');
    if (existing) existing.remove();

    const activeExamId = this.currentFilters.exam_id === 'active'
      ? (window.state.get('user')?.active_exam_id || 'jee-main')
      : this.currentFilters.exam_id;

    const modal = document.createElement('div');
    modal.id = 'pdf-upload-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    `;

    modal.innerHTML = `
      <div class="spps-card" style="width: 100%; max-width: 620px; background: #ffffff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <span class="badge badge-indigo">Question Archive</span>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 4px;">Upload Official PDF Question Paper</h3>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pdf-upload-modal').remove()">✕</button>
        </div>

        <form id="admin-pdf-upload-form" onsubmit="pyqView.handlePdfUploadSubmit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Target Examination *</label>
            <select name="exam_id" class="form-select" required>
              ${this.allExamsCache.map(e => `
                <option value="${e.id}" ${e.id === activeExamId ? 'selected' : ''}>${e.name}</option>
              `).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Examination Year *</label>
              <input type="number" name="year" class="form-input" min="2000" max="2030" value="2024" required />
            </div>

            <div>
              <label style="font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Document Type *</label>
              <select name="paper_type" class="form-select" required>
                <option value="Official Question Paper">Official Question Paper</option>
                <option value="Answer Key & Solution">Answer Key & Solution</option>
                <option value="Model Paper">Model Paper</option>
                <option value="Sample Paper">Sample Paper</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Paper Title *</label>
            <input type="text" name="title" class="form-input" placeholder="e.g. JEE Main 2024 Session 1 (Shift 1) Official Paper" required />
          </div>

          <div>
            <label style="font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Description / Notes</label>
            <textarea name="description" class="form-textarea" rows="2" placeholder="e.g. Official question paper released by NTA with answer key and section markings."></textarea>
          </div>

          <div>
            <label style="font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Select PDF File *</label>
            <div style="border: 2px dashed #cbd5e1; border-radius: 0.5rem; padding: 1.5rem; text-align: center; background: #f8fafc; cursor: pointer;" onclick="document.getElementById('pdf-file-input').click()">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
              <div style="font-size: 0.875rem; font-weight: 700; color: #334155;" id="pdf-file-label">Click to select PDF or drag and drop</div>
              <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Standard PDF document (.pdf) up to 25 MB</div>
              <input type="file" id="pdf-file-input" name="pdf_file" accept=".pdf,application/pdf" style="display: none;" onchange="pyqView.handlePdfFileSelected(this)" required />
            </div>
          </div>

          <div id="pdf-upload-status" style="display: none; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.8125rem;"></div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('pdf-upload-modal').remove()">Cancel</button>
            <button type="submit" id="pdf-upload-submit-btn" class="btn btn-primary">Upload & Publish PDF</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
  },

  handlePdfFileSelected(input) {
    const file = input.files && input.files[0];
    const label = document.getElementById('pdf-file-label');
    if (file && label) {
      label.innerHTML = `Selected: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
    }
  },

  async handlePdfUploadSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('pdf-upload-submit-btn');
    const statusDiv = document.getElementById('pdf-upload-status');

    const fileInput = document.getElementById('pdf-file-input');
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      alert('Please select a PDF file to upload.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = 'Reading & Uploading...';
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#e0f2fe';
    statusDiv.style.color = '#0369a1';
    statusDiv.innerText = 'Encoding PDF file and uploading to SPPS Question Archive...';

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const formData = new FormData(form);

        const payload = {
          exam_id: formData.get('exam_id'),
          year: parseInt(formData.get('year'), 10),
          paper_type: formData.get('paper_type'),
          title: formData.get('title'),
          description: formData.get('description'),
          file_name: file.name,
          file_data: base64Data
        };

        const res = await window.api.adminUploadPyqPdf(payload);
        statusDiv.style.background = '#dcfce7';
        statusDiv.style.color = '#15803d';
        statusDiv.innerText = '✓ PDF uploaded successfully!';

        setTimeout(() => {
          document.getElementById('pdf-upload-modal')?.remove();
          pyqView.activeTab = 'pdf-papers';
          pyqView.render(payload.exam_id);
        }, 800);
      } catch (err) {
        statusDiv.style.background = '#fee2e2';
        statusDiv.style.color = '#b91c1c';
        statusDiv.innerText = 'Error: ' + err.message;
        submitBtn.disabled = false;
        submitBtn.innerText = 'Upload & Publish PDF';
      }
    };
    reader.onerror = () => {
      statusDiv.style.background = '#fee2e2';
      statusDiv.style.color = '#b91c1c';
      statusDiv.innerText = 'Failed to read local PDF file.';
      submitBtn.disabled = false;
      submitBtn.innerText = 'Upload & Publish PDF';
    };
    reader.readAsDataURL(file);
  },

  async deletePdf(id) {
    if (!confirm('Are you sure you want to permanently delete this PDF paper?')) return;
    try {
      await window.api.adminDeletePyqPdf(id);
      this.render();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  },

  setPdfYear(year) {
    this.pdfFilters.year = year;
    this.render();
  },

  setPdfType(type) {
    this.pdfFilters.paper_type = type;
    this.render();
  },

  handlePdfSearch(text) {
    this.pdfFilters.search = text;
    clearTimeout(this._pdfSearchTimer);
    this._pdfSearchTimer = setTimeout(() => {
      this.render();
    }, 300);
  },

  resetPdfFilters() {
    this.pdfFilters = {
      year: 'all',
      paper_type: 'all',
      search: ''
    };
    this.render();
  }
};

window.pyqView = pyqView;

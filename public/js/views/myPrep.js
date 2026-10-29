// SPPS My Preparation Hub View
// Comprehensive personalized preparation profile, mode selection, category-specific pedagogical engines:
// - Beginner: Topic-by-topic roadmap, time allocation breakdown, what to prepare, prerequisites, and textbooks.
// - Intermediate: Syllabus topic mastery diagnostic intake (Mastered, Needs Practice, Weak), gap analysis, and theory skip optimization.
// - Revision: High-Yield Priority Matrix, all-time revision protocol, daily 15-min blind formula recall, and PYQ insistence.

const myPrepView = {
  _user: null,
  _activeExam: null,
  _examDetails: null,
  _allExams: [],
  _selectedMode: 'beginner',
  _weakSubjects: [],
  _preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  _timeSlots: [],
  _guidanceData: null,
  _topicMasteryData: null,
  _localMasteryRatings: {},

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        <span class="spinner" style="border-color: #6366f1; border-top-color: transparent; width: 28px; height: 28px;"></span>
        <div style="margin-top: 1rem; font-weight: 600;">Loading your personalized preparation hub & pedagogical diagnostic...</div>
      </div>
    `;

    try {
      const me = await window.api.getMe();
      this._user = me.user;
      this._activeExam = me.activeExam;

      const examId = this._user.active_exam_id || 'jee-main';
      this._selectedMode = this._user.prep_mode || 'beginner';

      const [allExamsRes, examDetails, guidanceRes, topicMasteryRes] = await Promise.all([
        window.api.getExams(),
        window.api.getExamDetails(examId),
        window.api.getPrepGuidance(examId, this._selectedMode).catch(() => null),
        window.api.getTopicMastery(examId).catch(() => null)
      ]);

      this._allExams = allExamsRes.exams || [];
      this._examDetails = examDetails;
      this._guidanceData = guidanceRes;
      this._topicMasteryData = topicMasteryRes;

      // Populate local topic mastery ratings
      this._localMasteryRatings = {};
      if (topicMasteryRes?.diagnostic?.topics) {
        for (const t of topicMasteryRes.diagnostic.topics) {
          this._localMasteryRatings[t.topic_id] = t.mastery_level || 'unstudied';
        }
      }

      // Parse preferred days
      if (Array.isArray(this._user.preferred_days)) {
        this._preferredDays = this._user.preferred_days;
      } else if (typeof this._user.preferred_days === 'string') {
        try { this._preferredDays = JSON.parse(this._user.preferred_days); } catch (e) { this._preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; }
      }

      // Parse weak subjects
      if (Array.isArray(this._user.weak_subjects)) {
        this._weakSubjects = this._user.weak_subjects;
      } else if (typeof this._user.weak_subjects === 'string') {
        try { this._weakSubjects = JSON.parse(this._user.weak_subjects); } catch (e) { this._weakSubjects = []; }
      }

      // Parse time slots
      if (Array.isArray(this._user.time_slots)) {
        this._timeSlots = this._user.time_slots;
      } else if (typeof this._user.time_slots === 'string') {
        try { this._timeSlots = JSON.parse(this._user.time_slots); } catch (e) { this._timeSlots = []; }
      }

      this.renderFullView(container);
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: #dc2626;">Failed to load preparation profile: ${err.message}</div>`;
    }
  },

  renderFullView(container) {
    const user = this._user;
    const activeExam = this._activeExam;
    const subjects = this._examDetails?.subjects || [];

    // Target exam date countdown
    let countdownDisplay = 'Self-Paced (No Deadline)';
    let daysRemaining = null;
    if (user.target_exam_date) {
      const diff = Math.ceil((new Date(user.target_exam_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        daysRemaining = diff;
        countdownDisplay = `🎯 ${diff} Days Remaining until Target Date`;
      } else {
        countdownDisplay = `Target date was on ${user.target_exam_date}`;
      }
    }

    // Format active slots display
    const slotsFormatted = (this._timeSlots && this._timeSlots.length > 0)
      ? this._timeSlots.map(s => {
          if (typeof s === 'object' && s !== null) {
            const daysTag = s.daysDisplay || (s.days ? (Array.isArray(s.days) ? (s.days.includes('All') ? 'Daily' : s.days.join(',')) : s.days) : 'Daily');
            return `${s.start}-${s.end} (${daysTag})`;
          }
          return typeof s === 'string' ? s : `${s.start}-${s.end}`;
        }).join(' • ')
      : 'Morning & Evening (07:00-09:00 & 18:30-21:00)';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1040px; margin: 0 auto;">
        
        <!-- Personalized Header Banner -->
        <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <span class="badge badge-teal">${activeExam?.short_name || 'Exam'}</span>
                <span id="badge-active-mode" class="badge badge-indigo">${this._selectedMode.toUpperCase()} MODE</span>
                <span class="badge badge-emerald">⏰ ${user.daily_hours || 4.5} hrs/day capacity</span>
                ${daysRemaining !== null ? `<span class="badge badge-slate" style="background: rgba(255,255,255,0.18); color: #ffffff;">${countdownDisplay}</span>` : ''}
              </div>
              <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.25rem;">
                ${user.full_name}'s Preparation Profile
              </h1>
              <p style="font-size: 0.875rem; color: #c7d2fe; line-height: 1.5;">
                Deeply personalized by category: Beginner roadmap with topic time allocations, Intermediate syllabus mastery diagnostics, and Revision high-yield protocols.
              </p>
            </div>

            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-accent btn-sm" onclick="router.navigate('planner')">
                ${window.icons?.calendar || '📅'} View Current Roadmap
              </button>
            </div>
          </div>
        </div>

        <!-- Main Configuration Form Card -->
        <div class="spps-card" style="padding: 2rem;">
          <form id="prep-settings-form" onsubmit="myPrepView.handleSavePreferences(event)">
            
            <!-- 1. Target Examination -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label" style="font-size: 0.9375rem; font-weight: 700; color: #0f172a;">
                🎯 Target Examination
              </label>
              <select id="prep-exam-select" class="form-select" onchange="myPrepView.handleExamChange(this.value)" style="font-size: 1rem; font-weight: 600; padding: 0.65rem 0.85rem;">
                ${this._allExams.map(e => `
                  <option value="${e.id}" ${e.id === (activeExam?.id || user.active_exam_id) ? 'selected' : ''}>
                    ${e.name} (${e.stage.replace('_', ' ')})
                  </option>
                `).join('')}
              </select>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                Selecting a different exam will fetch its official syllabus topics, category pathways, and previous-year papers.
              </div>
            </div>

            <!-- 2. Preparation Mode Selection (Interactive Cards) -->
            <div class="form-group" style="margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.6rem;">
                <label class="form-label" style="font-size: 0.9375rem; font-weight: 700; color: #0f172a; margin: 0;">
                  ⚡ Preparation Mode Selection
                </label>
                <span style="font-size: 0.75rem; color: #6366f1; font-weight: 600;">Click a category to view its dedicated engine below</span>
              </div>

              <div class="grid-cols-3" style="gap: 1rem;">
                <!-- Beginner Card -->
                <div id="mode-card-beginner" 
                     class="mode-card"
                     onclick="myPrepView.selectMode('beginner')"
                     style="border: 2px solid ${this._selectedMode === 'beginner' ? '#4f46e5' : '#e2e8f0'}; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer; background: ${this._selectedMode === 'beginner' ? '#eef2ff' : '#ffffff'}; transition: all 0.2s ease; position: relative;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span style="font-weight: 800; font-size: 1rem; color: ${this._selectedMode === 'beginner' ? '#4338ca' : '#0f172a'};">
                      🌱 Beginner
                    </span>
                    <input type="radio" name="prep_mode" value="beginner" ${this._selectedMode === 'beginner' ? 'checked' : ''} style="accent-color: #4f46e5;" />
                  </div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: #4f46e5; margin-bottom: 0.4rem;">
                    Foundations & Step-by-Step Path
                  </div>
                  <p style="font-size: 0.75rem; color: #64748b; line-height: 1.45; margin: 0;">
                    Clear path for every topic: what to prepare, how much time to spend, NCERT reading, and worked examples before hard MCQs.
                  </p>
                </div>

                <!-- Intermediate Card -->
                <div id="mode-card-intermediate" 
                     class="mode-card"
                     onclick="myPrepView.selectMode('intermediate')"
                     style="border: 2px solid ${this._selectedMode === 'intermediate' ? '#4f46e5' : '#e2e8f0'}; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer; background: ${this._selectedMode === 'intermediate' ? '#eef2ff' : '#ffffff'}; transition: all 0.2s ease; position: relative;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span style="font-weight: 800; font-size: 1rem; color: ${this._selectedMode === 'intermediate' ? '#4338ca' : '#0f172a'};">
                      ⚡ Intermediate
                    </span>
                    <input type="radio" name="prep_mode" value="intermediate" ${this._selectedMode === 'intermediate' ? 'checked' : ''} style="accent-color: #4f46e5;" />
                  </div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: #4f46e5; margin-bottom: 0.4rem;">
                    Syllabus Diagnostic & Gap Analysis
                  </div>
                  <p style="font-size: 0.75rem; color: #64748b; line-height: 1.45; margin: 0;">
                    Audits what you already understand. Skips repetitive theory on mastered topics and directs your time to gap areas & speed drills.
                  </p>
                </div>

                <!-- Revision Card -->
                <div id="mode-card-revision" 
                     class="mode-card"
                     onclick="myPrepView.selectMode('revision')"
                     style="border: 2px solid ${this._selectedMode === 'revision' ? '#4f46e5' : '#e2e8f0'}; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer; background: ${this._selectedMode === 'revision' ? '#eef2ff' : '#ffffff'}; transition: all 0.2s ease; position: relative;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span style="font-weight: 800; font-size: 1rem; color: ${this._selectedMode === 'revision' ? '#4338ca' : '#0f172a'};">
                      🔥 Revision
                    </span>
                    <input type="radio" name="prep_mode" value="revision" ${this._selectedMode === 'revision' ? 'checked' : ''} style="accent-color: #4f46e5;" />
                  </div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: #4f46e5; margin-bottom: 0.4rem;">
                    High-Yield Matrix & PYQ Insistence
                  </div>
                  <p style="font-size: 0.75rem; color: #64748b; line-height: 1.45; margin: 0;">
                    All-time continuous revision protocol: daily 15-min blind formula recall sheets, Tier-1 chapter prioritization, and authentic PYQ marathons.
                  </p>
                </div>
              </div>

              <!-- Live Strategy Preview Callout -->
              <div id="mode-strategy-callout" style="margin-top: 0.85rem; padding: 1rem 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 0.5rem; font-size: 0.8125rem; color: #334155; line-height: 1.5;">
                ${this.getModeDescription(this._selectedMode)}
              </div>
            </div>

            <!-- DEDICATED CATEGORY-SPECIFIC PEDAGOGICAL ENGINE (DYNAMICALLY RENDERED) -->
            <div id="category-engine-container" style="margin-bottom: 2rem;">
              ${this.renderCategoryEngine()}
            </div>

            <!-- 3. Personal Weak Subject Prioritization -->
            <div class="form-group" style="margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
                <label class="form-label" style="font-size: 0.9375rem; font-weight: 700; color: #0f172a; margin: 0;">
                  🧠 Focus Priorities: Mark Your Weak Subjects
                </label>
                <span style="font-size: 0.75rem; color: #64748b;">
                  Selected subjects receive <strong>+30% study time allocation</strong> and higher timetable priority
                </span>
              </div>

              <div id="prep-subjects-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem;">
                ${subjects.map(subj => {
                  const isWeak = this._weakSubjects.includes(subj.id);
                  return `
                    <div id="subj-card-${subj.id}" 
                         onclick="myPrepView.toggleWeakSubject('${subj.id}')"
                         style="border: 1.5px solid ${isWeak ? '#f59e0b' : '#e2e8f0'}; background: ${isWeak ? '#fffbeb' : '#ffffff'}; border-radius: 0.625rem; padding: 0.85rem 1rem; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: flex-start; gap: 0.75rem;">
                      <input type="checkbox" id="chk-${subj.id}" class="custom-checkbox" ${isWeak ? 'checked' : ''} onclick="event.stopPropagation(); myPrepView.toggleWeakSubject('${subj.id}')" style="margin-top: 2px;" />
                      <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="font-weight: 700; color: #0f172a; font-size: 0.875rem;">${subj.name}</span>
                          <span class="badge ${isWeak ? 'badge-amber' : 'badge-slate'}" style="font-size: 0.7rem;">
                            ${isWeak ? 'Priority Weak Focus' : `${subj.weightage_percent || 33}% Weight`}
                          </span>
                        </div>
                        <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                          ${subj.description ? subj.description.slice(0, 75) + '...' : 'Core syllabus domain'}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 4. Study Schedule & Free Time Slots Integration -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 1.25rem; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <label class="form-label" style="font-size: 0.9375rem; font-weight: 800; color: #0f172a; margin: 0;">
                    ⏰ Your Free Study Time Slots
                  </label>
                  <div style="font-size: 0.75rem; color: #64748b;">
                    Timetable sessions and daily syllabus quotas align directly to these available blocks.
                  </div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="studyPlannerView.openRegenerateModal()" style="font-weight: 600;">
                  ${window.icons?.edit || '✏️'} Customize Time Slots
                </button>
              </div>

              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.1rem;">📅</span>
                  <span style="font-size: 0.8125rem; font-weight: 600; color: #334155;">
                    ${slotsFormatted}
                  </span>
                </div>
                <span class="badge badge-emerald" style="font-weight: 700;">
                  ~${user.daily_hours || 4.5} hrs/day capacity
                </span>
              </div>
            </div>

            <!-- 5. Constraints: Target Date & Study Days -->
            <div class="grid-cols-2" style="gap: 1.25rem; margin-bottom: 1.5rem;">
              <div>
                <label class="form-label" style="font-weight: 700; color: #0f172a;">Target Examination Date</label>
                <input type="date" id="prep-target-date" class="form-input" value="${user.target_exam_date || ''}" />
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Leave blank for a relaxed self-paced roadmap.</div>
              </div>

              <div>
                <label class="form-label" style="font-weight: 700; color: #0f172a;">Daily Available Study Hours</label>
                <input type="number" id="prep-daily-hours" class="form-input" min="1" max="16" step="0.5" value="${user.daily_hours || 4.5}" required />
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Derived from your configured free time slots.</div>
              </div>
            </div>

            <!-- 6. Study Days of Week -->
            <div class="form-group" style="margin-bottom: 1.75rem;">
              <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Study Days of Week</label>
              <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const isChecked = this._preferredDays.includes(day);
                  return `
                    <label style="display: flex; align-items: center; gap: 6px; padding: 0.45rem 0.85rem; border: 1.5px solid ${isChecked ? '#4f46e5' : '#e2e8f0'}; border-radius: 0.5rem; background: ${isChecked ? '#eef2ff' : '#ffffff'}; cursor: pointer; font-size: 0.875rem; transition: all 0.15s ease;">
                      <input type="checkbox" class="custom-checkbox prep-day-checkbox" value="${day}" ${isChecked ? 'checked' : ''} onchange="this.parentElement.style.borderColor = this.checked ? '#4f46e5' : '#e2e8f0'; this.parentElement.style.background = this.checked ? '#eef2ff' : '#ffffff';" />
                      <span style="font-weight: 600; color: ${isChecked ? '#4338ca' : '#0f172a'};">${day}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Submit Button Bar -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="font-size: 0.8125rem; color: #64748b;">
                Saving will instantly regenerate your personalized roadmap and weekly timetable matching your selected category.
              </div>
              <button type="submit" id="prep-submit-btn" class="btn btn-primary btn-lg" style="min-width: 280px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
                Save & Regenerate Customized Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // RENDER DEDICATED CATEGORY-SPECIFIC PEDAGOGICAL ENGINE
  // -------------------------------------------------------------
  renderCategoryEngine() {
    if (this._selectedMode === 'beginner') {
      return this.renderBeginnerPathwayUI();
    } else if (this._selectedMode === 'intermediate') {
      return this.renderIntermediateDiagnosticUI();
    } else {
      return this.renderRevisionProtocolUI();
    }
  },

  // A. BEGINNER ENGINE: Topic Roadmap, What to Prepare & Exact Time Breakdown
  renderBeginnerPathwayUI() {
    const subjects = this._examDetails?.subjects || [];
    let allTopics = [];
    subjects.forEach(s => {
      if (s.topics) {
        s.topics.forEach(t => allTopics.push({ ...t, subjectName: s.name }));
      }
    });

    return `
      <div style="background: #f8fafc; border: 1.5px solid #c7d2fe; border-radius: 0.75rem; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">🌱</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin: 0;">
                Beginner Roadmap: Topic-by-Topic Preparation Path
              </h3>
            </div>
            <p style="font-size: 0.8125rem; color: #475569; margin: 0.35rem 0 0 0; line-height: 1.45;">
              As a beginner, never jump directly to difficult questions without building intuition first. Here is the structured pathway for each topic and exactly how much time to spend across reading, notes, worked examples, and foundational practice.
            </p>
          </div>
          <span class="badge badge-indigo" style="font-size: 0.75rem;">Standard 40/15/25/20 Formula</span>
        </div>

        <!-- 4-Phase Time Allocation Guide Legend -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.03em;">
            Standard Time Allocation Formula per Topic:
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.65rem;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; border-radius: 3px; background: #4f46e5; display: inline-block;"></span>
              <span style="font-size: 0.75rem; color: #334155;"><strong>40%</strong> Concept & NCERT Reading</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; border-radius: 3px; background: #059669; display: inline-block;"></span>
              <span style="font-size: 0.75rem; color: #334155;"><strong>15%</strong> Formula Sheet & Derivations</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; border-radius: 3px; background: #d97706; display: inline-block;"></span>
              <span style="font-size: 0.75rem; color: #334155;"><strong>25%</strong> Solved Examples Deconstruction</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; border-radius: 3px; background: #0284c7; display: inline-block;"></span>
              <span style="font-size: 0.75rem; color: #334155;"><strong>20%</strong> Graded Level-1 Practice</span>
            </div>
          </div>
        </div>

        <!-- Topics Accordion List -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 480px; overflow-y: auto; padding-right: 4px;">
          ${allTopics.slice(0, 8).map(topic => {
            const dur = topic.estimated_hours || 8.0;
            const theoryH = (dur * 0.4).toFixed(1);
            const notesH = (dur * 0.15).toFixed(1);
            const examplesH = (dur * 0.25).toFixed(1);
            const practiceH = (dur * 0.20).toFixed(1);

            return `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-slate" style="font-size: 0.7rem;">${topic.subjectName}</span>
                    <span style="font-weight: 800; font-size: 0.9375rem; color: #0f172a;">${topic.name}</span>
                    <span class="badge ${topic.difficulty === 'Hard' ? 'badge-amber' : 'badge-emerald'}" style="font-size: 0.65rem;">
                      ${topic.difficulty || 'Medium'}
                    </span>
                  </div>
                  <span class="badge badge-indigo" style="font-weight: 700; font-size: 0.75rem;">
                    ⏰ ${dur} Hours Total Budget
                  </span>
                </div>

                <!-- Visual Multi-Color Time Bar -->
                <div style="margin-bottom: 0.75rem;">
                  <div style="display: flex; height: 7px; border-radius: 9999px; overflow: hidden; margin-bottom: 4px;">
                    <div style="width: 40%; background: #4f46e5;" title="Theory: ${theoryH} hrs"></div>
                    <div style="width: 15%; background: #059669;" title="Formula Notes: ${notesH} hrs"></div>
                    <div style="width: 25%; background: #d97706;" title="Worked Examples: ${examplesH} hrs"></div>
                    <div style="width: 20%; background: #0284c7;" title="Level-1 Practice: ${practiceH} hrs"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: #64748b;">
                    <span>Theory (${theoryH}h)</span>
                    <span>Notes (${notesH}h)</span>
                    <span>Worked Examples (${examplesH}h)</span>
                    <span>Practice (${practiceH}h)</span>
                  </div>
                </div>

                <!-- What to Prepare Details -->
                <div style="background: #f8fafc; border-radius: 0.375rem; padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #334155; line-height: 1.45;">
                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 3px;">📋 What you need to prepare:</div>
                  <ul style="margin: 0; padding-left: 1.15rem;">
                    <li>Read NCERT / official textbook chapter; extract core mechanisms: <em>${topic.key_concepts || 'Definitions, principles and laws'}</em></li>
                    <li>Deconstruct 10-15 worked textbook examples before solving questions independently</li>
                    <li>Derive all primary formulas on a 1-page summary sheet without looking</li>
                    <li>Solve 20 fundamental MCQs with zero time stress until you hit >= 75% accuracy</li>
                  </ul>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ${allTopics.length > 8 ? `
          <div style="text-align: center; margin-top: 0.75rem; font-size: 0.75rem; color: #64748b;">
            Showing first 8 of ${allTopics.length} syllabus topics. All topics are mapped into your active study plan.
          </div>
        ` : ''}
      </div>
    `;
  },

  // B. INTERMEDIATE ENGINE: Syllabus Topic Mastery Diagnostic & Gap Engine
  renderIntermediateDiagnosticUI() {
    const subjects = this._examDetails?.subjects || [];
    let allTopics = [];
    subjects.forEach(s => {
      if (s.topics) {
        s.topics.forEach(t => allTopics.push({ ...t, subjectName: s.name }));
      }
    });

    // Compute live metrics from _localMasteryRatings
    let masteredCount = 0;
    let needsPracticeCount = 0;
    let unstudiedCount = 0;

    allTopics.forEach(t => {
      const level = this._localMasteryRatings[t.id] || 'unstudied';
      if (level === 'mastered') masteredCount++;
      else if (level === 'needs_practice') needsPracticeCount++;
      else unstudiedCount++;
    });

    const total = allTopics.length || 1;
    const readinessScore = Math.round(((masteredCount * 1.0 + needsPracticeCount * 0.5) / total) * 100);
    const theoryHoursSaved = (masteredCount * 3.5).toFixed(1);

    return `
      <div style="background: #f8fafc; border: 1.5px solid #a5b4fc; border-radius: 0.75rem; padding: 1.5rem;">
        
        <!-- Diagnostic Header Strip -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">🧠</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin: 0;">
                Syllabus Topic Mastery Diagnostic & Gap Engine
              </h3>
            </div>
            <p style="font-size: 0.8125rem; color: #475569; margin: 0.35rem 0 0 0; line-height: 1.45;">
              Select which syllabus topics you already have <strong>Full Understanding</strong> of. For Mastered topics, our AI planner <strong>skips repetitive basic theory</strong>, saving study time and redirecting focus toward timed problem sprints and gap remediation.
            </p>
          </div>

          <button type="button" class="btn btn-primary btn-sm" onclick="myPrepView.saveMasteryAndRegenerate()" id="btn-save-mastery" style="font-weight: 700;">
            💾 Save Mastery & Optimize Plan
          </button>
        </div>

        <!-- Live Scoreboard Strip -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="background: #ffffff; border: 1.5px solid #10b981; border-radius: 0.5rem; padding: 0.75rem 1rem;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #059669; text-transform: uppercase;">🟢 Mastered Topics</div>
            <div id="stat-mastered" style="font-size: 1.4rem; font-weight: 800; color: #047857;">${masteredCount}</div>
            <div style="font-size: 0.7rem; color: #64748b;">Basic theory skipped</div>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #f59e0b; border-radius: 0.5rem; padding: 0.75rem 1rem;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #d97706; text-transform: uppercase;">🟡 Needs Practice</div>
            <div id="stat-practice" style="font-size: 1.4rem; font-weight: 800; color: #b45309;">${needsPracticeCount}</div>
            <div style="font-size: 0.7rem; color: #64748b;">Multi-step problem drills</div>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #ef4444; border-radius: 0.5rem; padding: 0.75rem 1rem;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #dc2626; text-transform: uppercase;">🔴 Weak / Unstudied</div>
            <div id="stat-weak" style="font-size: 1.4rem; font-weight: 800; color: #b91c1c;">${unstudiedCount}</div>
            <div style="font-size: 0.7rem; color: #64748b;">Remedial foundation</div>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #6366f1; border-radius: 0.5rem; padding: 0.75rem 1rem;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #4f46e5; text-transform: uppercase;">⚡ Theory Saved</div>
            <div id="stat-saved" style="font-size: 1.4rem; font-weight: 800; color: #4338ca;">~${theoryHoursSaved} hrs</div>
            <div style="font-size: 0.7rem; color: #64748b;">Reallocated to solving</div>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #0284c7; border-radius: 0.5rem; padding: 0.75rem 1rem;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #0284c7; text-transform: uppercase;">📊 Syllabus Readiness</div>
            <div id="stat-readiness" style="font-size: 1.4rem; font-weight: 800; color: #0369a1;">${readinessScore}%</div>
            <div style="font-size: 0.7rem; color: #64748b;">Overall confidence index</div>
          </div>
        </div>

        <!-- Interactive Topic Ratings List -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 440px; overflow-y: auto; padding-right: 4px;">
          ${allTopics.map(topic => {
            const currentLevel = this._localMasteryRatings[topic.id] || 'unstudied';
            return `
              <div id="topic-row-${topic.id}" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div style="flex: 1; min-width: 220px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="badge badge-slate" style="font-size: 0.65rem;">${topic.subjectName}</span>
                    <span style="font-weight: 700; font-size: 0.875rem; color: #0f172a;">${topic.name}</span>
                  </div>
                  <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
                    ${topic.key_concepts || 'Core principles and problem types'}
                  </div>
                </div>

                <!-- 3-Choice Pill Toggle Group -->
                <div style="display: flex; gap: 0.35rem; align-items: center;">
                  <button type="button" 
                          onclick="myPrepView.setLocalMastery('${topic.id}', 'mastered')"
                          id="btn-${topic.id}-mastered"
                          class="btn btn-sm"
                          style="font-size: 0.75rem; padding: 0.3rem 0.65rem; border-radius: 9999px; ${currentLevel === 'mastered' ? 'background: #10b981; color: #ffffff; border-color: #10b981; font-weight: 700;' : 'background: #ffffff; color: #475569; border: 1px solid #cbd5e1;'}">
                    🟢 Mastered
                  </button>

                  <button type="button" 
                          onclick="myPrepView.setLocalMastery('${topic.id}', 'needs_practice')"
                          id="btn-${topic.id}-needs_practice"
                          class="btn btn-sm"
                          style="font-size: 0.75rem; padding: 0.3rem 0.65rem; border-radius: 9999px; ${currentLevel === 'needs_practice' ? 'background: #f59e0b; color: #ffffff; border-color: #f59e0b; font-weight: 700;' : 'background: #ffffff; color: #475569; border: 1px solid #cbd5e1;'}">
                    🟡 Needs Practice
                  </button>

                  <button type="button" 
                          onclick="myPrepView.setLocalMastery('${topic.id}', 'unstudied')"
                          id="btn-${topic.id}-unstudied"
                          class="btn btn-sm"
                          style="font-size: 0.75rem; padding: 0.3rem 0.65rem; border-radius: 9999px; ${currentLevel === 'unstudied' ? 'background: #ef4444; color: #ffffff; border-color: #ef4444; font-weight: 700;' : 'background: #ffffff; color: #475569; border: 1px solid #cbd5e1;'}">
                    🔴 Weak / Gaps
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // C. REVISION ENGINE: High-Yield Priority Matrix & All-Time Revision Protocol
  renderRevisionProtocolUI() {
    const subjects = this._examDetails?.subjects || [];
    let allTopics = [];
    subjects.forEach(s => {
      if (s.topics) {
        s.topics.forEach(t => allTopics.push({ ...t, subjectName: s.name }));
      }
    });

    const tier1 = allTopics.filter(t => t.weightage_tier === 'High-Yield' || t.difficulty === 'Hard');
    const tier2 = allTopics.filter(t => t.weightage_tier === 'Core');
    const tier3 = allTopics.filter(t => t.weightage_tier !== 'High-Yield' && t.difficulty !== 'Hard' && t.weightage_tier !== 'Core');

    return `
      <div style="background: #f8fafc; border: 1.5px solid #fbcfe8; border-radius: 0.75rem; padding: 1.5rem;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">🔥</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #831843; margin: 0;">
                All-Time Revision Engine & PYQ Command Center
              </h3>
            </div>
            <p style="font-size: 0.8125rem; color: #475569; margin: 0.35rem 0 0 0; line-height: 1.45;">
              Revision is not passive re-reading. Continuous retention requires a strict daily recall routine, prioritizing High-Yield Tier-1 chapters, and aggressive PYQ drills under timed exam pressure.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="router.navigate('pyq')" style="font-weight: 700;">
              🚀 Launch PYQ Practice
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="router.navigate('pyq-pdfs')" style="font-weight: 600;">
              📥 Official PDF Papers
            </button>
          </div>
        </div>

        <!-- All-Time Revision Protocol Strip (How to Revise All Time) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem;">
          
          <!-- Protocol 1 -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #db2777; border-radius: 0.5rem; padding: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #be185d; text-transform: uppercase;">Step 1: Daily Morning Routine</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 0.9375rem; margin: 2px 0 4px 0;">15-Min Blind Sheet Formula Recall</div>
            <p style="font-size: 0.75rem; color: #475569; line-height: 1.45; margin: 0;">
              Empty sheet formula dump purely from memory before opening books. Cross-check in red ink to cement visual memory contrast.
            </p>
          </div>

          <!-- Protocol 2 -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 0.5rem; padding: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #4338ca; text-transform: uppercase;">Step 2: Timed PYQ Sprint</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 0.9375rem; margin: 2px 0 4px 0;">30 Authentic PYQs in 45 Mins</div>
            <p style="font-size: 0.75rem; color: #475569; line-height: 1.45; margin: 0;">
              Strict countdown conditions (1.5 min/Q) with negative marking simulation. Never look at solutions until the set is finished.
            </p>
          </div>

          <!-- Protocol 3 -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 0.5rem; padding: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #047857; text-transform: uppercase;">Step 3: Trap Diagnostic</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 0.9375rem; margin: 2px 0 4px 0;">Mistakes Diary Categorization</div>
            <p style="font-size: 0.75rem; color: #475569; line-height: 1.45; margin: 0;">
              Log wrong answers by root cause: (1) Conceptual Gap, (2) Calculation Slip, or (3) Distractor Trap. Re-test weekly.
            </p>
          </div>
        </div>

        <!-- High-Yield Chapter Priority Matrix -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.625rem; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="font-weight: 800; font-size: 0.9375rem; color: #0f172a;">
              🎯 High-Yield Chapter Priority Matrix: What to Prioritize
            </div>
            <span style="font-size: 0.75rem; color: #64748b;">Sorted by marks return per hour invested</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Tier 1 -->
            <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 0.5rem; padding: 0.75rem 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span style="font-weight: 800; font-size: 0.8125rem; color: #9d174d;">
                  🔥 Tier 1: High-Yield Chapters (~55-65% Exam Marks)
                </span>
                <span class="badge badge-pink" style="font-size: 0.68rem;">Top Timetable Priority</span>
              </div>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                ${(tier1.length > 0 ? tier1 : allTopics.slice(0, 4)).map(t => `
                  <span class="badge" style="background: #ffffff; color: #831843; border: 1px solid #f472b6; font-size: 0.72rem;">
                    ${t.name} (${t.subjectName})
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Tier 2 -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.75rem 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span style="font-weight: 800; font-size: 0.8125rem; color: #166534;">
                  ⚡ Tier 2: Core Syllabus Topics (~25-30% Exam Marks)
                </span>
                <span class="badge badge-emerald" style="font-size: 0.68rem;">Steady Practice</span>
              </div>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                ${(tier2.length > 0 ? tier2 : allTopics.slice(4, 8)).map(t => `
                  <span class="badge" style="background: #ffffff; color: #15803d; border: 1px solid #86efac; font-size: 0.72rem;">
                    ${t.name} (${t.subjectName})
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Tier 3 -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span style="font-weight: 700; font-size: 0.8125rem; color: #475569;">
                  🎯 Tier 3: Peripheral Topics (~10-15% Marks)
                </span>
                <span class="badge badge-slate" style="font-size: 0.68rem;">Quick Sweeps</span>
              </div>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                ${(tier3.length > 0 ? tier3 : allTopics.slice(8, 12)).map(t => `
                  <span class="badge" style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; font-size: 0.72rem;">
                    ${t.name}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // INTERACTIVE CONTROLS & EVENT HANDLERS
  // -------------------------------------------------------------
  selectMode(mode) {
    this._selectedMode = mode;

    // Update Radio buttons
    const radios = document.querySelectorAll('input[name="prep_mode"]');
    radios.forEach(r => {
      r.checked = (r.value === mode);
    });

    // Update Card styles
    ['beginner', 'intermediate', 'revision'].forEach(m => {
      const card = document.getElementById(`mode-card-${m}`);
      if (card) {
        if (m === mode) {
          card.style.border = '2px solid #4f46e5';
          card.style.background = '#eef2ff';
        } else {
          card.style.border = '2px solid #e2e8f0';
          card.style.background = '#ffffff';
        }
      }
    });

    // Update badge in banner
    const badge = document.getElementById('badge-active-mode');
    if (badge) {
      badge.innerText = `${mode.toUpperCase()} MODE`;
    }

    // Update live strategy preview
    const callout = document.getElementById('mode-strategy-callout');
    if (callout) {
      callout.innerHTML = this.getModeDescription(mode);
    }

    // Re-render the dedicated category engine container dynamically
    const categoryEngineEl = document.getElementById('category-engine-container');
    if (categoryEngineEl) {
      categoryEngineEl.innerHTML = this.renderCategoryEngine();
    }
  },

  setLocalMastery(topicId, level) {
    this._localMasteryRatings[topicId] = level;

    // Update button visual styles in place
    ['mastered', 'needs_practice', 'unstudied'].forEach(l => {
      const btn = document.getElementById(`btn-${topicId}-${l}`);
      if (btn) {
        if (l === level) {
          if (l === 'mastered') {
            btn.style.background = '#10b981';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#10b981';
            btn.style.fontWeight = '700';
          } else if (l === 'needs_practice') {
            btn.style.background = '#f59e0b';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#f59e0b';
            btn.style.fontWeight = '700';
          } else {
            btn.style.background = '#ef4444';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#ef4444';
            btn.style.fontWeight = '700';
          }
        } else {
          btn.style.background = '#ffffff';
          btn.style.color = '#475569';
          btn.style.border = '1px solid #cbd5e1';
          btn.style.fontWeight = 'normal';
        }
      }
    });

    // Recompute live scoreboard
    const subjects = this._examDetails?.subjects || [];
    let allTopics = [];
    subjects.forEach(s => {
      if (s.topics) s.topics.forEach(t => allTopics.push(t));
    });

    let mastered = 0;
    let practice = 0;
    let weak = 0;
    allTopics.forEach(t => {
      const lvl = this._localMasteryRatings[t.id] || 'unstudied';
      if (lvl === 'mastered') mastered++;
      else if (lvl === 'needs_practice') practice++;
      else weak++;
    });

    const total = allTopics.length || 1;
    const readiness = Math.round(((mastered * 1.0 + practice * 0.5) / total) * 100);
    const saved = (mastered * 3.5).toFixed(1);

    const mEl = document.getElementById('stat-mastered');
    const pEl = document.getElementById('stat-practice');
    const wEl = document.getElementById('stat-weak');
    const sEl = document.getElementById('stat-saved');
    const rEl = document.getElementById('stat-readiness');

    if (mEl) mEl.innerText = mastered;
    if (pEl) pEl.innerText = practice;
    if (wEl) wEl.innerText = weak;
    if (sEl) sEl.innerText = `~${saved} hrs`;
    if (rEl) rEl.innerText = `${readiness}%`;
  },

  async saveMasteryAndRegenerate() {
    const btn = document.getElementById('btn-save-mastery');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Saving & Optimizing...`;
    }

    try {
      const examSelect = document.getElementById('prep-exam-select');
      const examId = examSelect ? examSelect.value : (this._user.active_exam_id || 'jee-main');

      const ratings = Object.entries(this._localMasteryRatings).map(([topic_id, mastery_level]) => ({
        topic_id,
        mastery_level
      }));

      await window.api.saveTopicMastery({
        exam_id: examId,
        ratings,
        regenerate_plan: true
      });

      // Update active user profile mode to intermediate if not already
      if (this._selectedMode !== 'intermediate') {
        this.selectMode('intermediate');
      }
      await window.api.updateProfile({ prep_mode: 'intermediate' });

      toast.success('🎉 Syllabus Mastery Diagnostic saved! Plan optimized to skip theory on mastered topics.');
      router.navigate('planner');
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `💾 Save Mastery & Optimize Plan`;
      }
      toast.error('Failed to save mastery diagnostic: ' + err.message);
    }
  },

  getModeDescription(mode) {
    if (mode === 'beginner') {
      return `<strong>🌱 Personalized AI Strategy (Beginner):</strong> Focuses on building first-principles intuition. Follows the 40/15/25/20 pathway: 40% NCERT reading, 15% formula notes, 25% worked example deconstruction, and 20% graded Level-1 practice before attempting tricky questions.`;
    }
    if (mode === 'intermediate') {
      return `<strong>⚡ Personalized AI Strategy (Intermediate):</strong> Uses your Syllabus Topic Mastery diagnostic above. Topics marked Mastered skip basic theory (saving ~3.5h each), redirecting your daily slots to speed MCQs (<1.5 min/Q) and remediating your weak gap topics.`;
    }
    return `<strong>🔥 Personalized AI Strategy (Revision):</strong> High-velocity exam sprint. Employs the All-Time Revision Protocol: daily 15-minute blind sheet formula recall sheets, Tier-1 chapter prioritization, and authentic PYQ marathons under negative marking simulation.`;
  },

  toggleWeakSubject(subjId) {
    const idx = this._weakSubjects.indexOf(subjId);
    if (idx > -1) {
      this._weakSubjects.splice(idx, 1);
    } else {
      this._weakSubjects.push(subjId);
    }

    // Update Card UI
    const card = document.getElementById(`subj-card-${subjId}`);
    const chk = document.getElementById(`chk-${subjId}`);
    const isWeak = this._weakSubjects.includes(subjId);

    if (chk) chk.checked = isWeak;
    if (card) {
      card.style.borderColor = isWeak ? '#f59e0b' : '#e2e8f0';
      card.style.background = isWeak ? '#fffbeb' : '#ffffff';
      const badge = card.querySelector('.badge');
      if (badge) {
        badge.className = `badge ${isWeak ? 'badge-amber' : 'badge-slate'}`;
        badge.innerText = isWeak ? 'Priority Weak Focus' : 'Standard Focus';
      }
    }
  },

  async handleExamChange(newExamId) {
    try {
      this._examDetails = await window.api.getExamDetails(newExamId);
      this._weakSubjects = []; // reset weak subjects for new exam
      const topicMasteryRes = await window.api.getTopicMastery(newExamId).catch(() => null);
      this._localMasteryRatings = {};
      if (topicMasteryRes?.diagnostic?.topics) {
        for (const t of topicMasteryRes.diagnostic.topics) {
          this._localMasteryRatings[t.topic_id] = t.mastery_level || 'unstudied';
        }
      }
      const container = document.getElementById('view-container');
      if (container) this.renderFullView(container);
    } catch (e) {
      toast.error('Failed to load exam details: ' + e.message);
    }
  },

  async handleSavePreferences(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('prep-submit-btn');
    const examSelect = document.getElementById('prep-exam-select');
    const examId = examSelect ? examSelect.value : (this._user.active_exam_id || 'jee-main');
    const targetDate = document.getElementById('prep-target-date')?.value || null;
    const dailyHours = parseFloat(document.getElementById('prep-daily-hours')?.value) || (this._user.daily_hours || 4.5);

    const checkedDays = Array.from(document.querySelectorAll('.prep-day-checkbox:checked')).map(cb => cb.value);
    const effectiveDays = checkedDays.length > 0 ? checkedDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Regenerating Customized Plan...`;
    }

    try {
      // 1. If intermediate, persist any local topic mastery ratings
      if (this._selectedMode === 'intermediate' && Object.keys(this._localMasteryRatings).length > 0) {
        const ratings = Object.entries(this._localMasteryRatings).map(([topic_id, mastery_level]) => ({
          topic_id,
          mastery_level
        }));
        await window.api.saveTopicMastery({ exam_id: examId, ratings }).catch(() => {});
      }

      // 2. Update Profile Preferences
      await window.api.updateProfile({
        active_exam_id: examId,
        prep_mode: this._selectedMode,
        target_exam_date: targetDate,
        daily_hours: dailyHours,
        preferred_days: effectiveDays,
        weak_subjects: this._weakSubjects
      });

      // 3. Regenerate Study Plan and Timetable
      await window.api.generateStudyPlan({
        exam_id: examId,
        prep_mode: this._selectedMode,
        target_exam_date: targetDate,
        daily_hours: dailyHours,
        preferred_days: effectiveDays,
        weak_subjects: this._weakSubjects,
        time_slots: this._timeSlots
      });

      // 4. Update active session user state
      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);

      const examName = me.activeExam?.name || 'Examination';
      toast.success(`🎉 Personalized roadmap regenerated for ${examName} (${this._selectedMode.toUpperCase()} mode)!`);

      // 5. Navigate immediately to the personalized planner view
      router.navigate('planner');
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Save & Regenerate Customized Plan`;
      }
      toast.error('Failed to regenerate plan: ' + err.message);
    }
  }
};

window.myPrepView = myPrepView;

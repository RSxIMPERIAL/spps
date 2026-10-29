// SPPS Dedicated 17-Point Examination Information Page
const examDetailsView = {
  async render(examId) {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (!examId) {
      router.navigate('explore');
      return;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading detailed examination dossier and official syllabus...
      </div>
    `;

    try {
      const data = await window.api.getExamDetails(examId);
      const exam = data.exam;
      const subjects = data.subjects || [];
      const user = window.state.get('user');
      const isAlreadyActive = user && user.active_exam_id === exam.id;

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1200px; margin: 0 auto;">
          <!-- Top Back button -->
          <div>
            <button class="btn btn-secondary btn-sm" onclick="router.navigate('explore')">
              ${window.icons.arrowLeft} Back to Examinations Directory
            </button>
          </div>

          <!-- Hero Dossier Header -->
          <div class="spps-card" style="padding: 2rem 2.25rem; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.25rem;">
              <div style="max-width: 800px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.75rem;">
                  <span class="badge badge-teal">${exam.stage.replace('_', ' ')}</span>
                  <span class="badge badge-indigo">${exam.category}</span>
                  <span class="badge badge-slate" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.2);">${exam.exam_type}</span>
                </div>

                <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.5rem;">
                  ${exam.name}
                </h1>
                <div style="font-size: 1rem; color: #a5b4fc; font-weight: 600; margin-bottom: 1rem;">
                  Conducting Body: ${exam.conducting_authority}
                </div>
                <p style="font-size: 0.9375rem; color: #cbd5e1; line-height: 1.6;">
                  ${exam.overview}
                </p>
              </div>

              <!-- Start Prep CTA Box -->
              <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 1rem; padding: 1.5rem; min-width: 260px; text-align: center;">
                <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem;">
                  Ready to Prepare?
                </div>
                <div style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem;">
                  ${isAlreadyActive ? 'Currently Active Target' : 'Personalized Plan Ready'}
                </div>
                <button class="btn btn-accent btn-lg" style="width: 100%;" onclick="examDetailsView.startPreparation('${exam.id}', '${exam.name}')">
                  ${isAlreadyActive ? 'Open Study Roadmap' : 'Start Preparation Now'}
                </button>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.6rem;">
                  Auto-generates timetable & PYQs
                </div>
              </div>
            </div>
          </div>

          <!-- 17-Point Structured Information Grid -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;" class="grid-split-responsive">
            <!-- Left Primary Column -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              <!-- 1. Purpose & Why Conducted -->
              <div class="spps-card" style="padding: 1.5rem;">
                <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.85rem;">
                  1. Purpose & Career Impact
                </h2>
                <div style="font-size: 0.9375rem; color: #334155; line-height: 1.6; margin-bottom: 1rem;">
                  ${exam.purpose}
                </div>
                <div style="background: #f8fafc; border-radius: 0.5rem; padding: 1rem; border-left: 4px solid #4f46e5;">
                  <div style="font-weight: 700; font-size: 0.875rem; color: #0f172a; margin-bottom: 4px;">Career Opportunities & Pathways:</div>
                  <p style="font-size: 0.875rem; color: #475569;">${exam.career_field}</p>
                </div>
              </div>

              <!-- 2. Detailed Syllabus Tree -->
              <div class="spps-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <div>
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">2. Official Syllabus Breakdown</h2>
                    <div style="font-size: 0.8125rem; color: #64748b;">Divided into subjects, core topics, and difficulty ratings</div>
                  </div>
                  <span class="badge badge-indigo">${subjects.length} Subjects</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  ${subjects.map((s, idx) => `
                    <div style="border: 1px solid var(--border-subtle); border-radius: 0.625rem; padding: 1rem; background: #ffffff;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                        <span style="font-weight: 700; font-size: 1rem; color: #0f172a;">${idx + 1}. ${s.name}</span>
                        <span class="badge badge-teal">${s.weightage_percent}% Weightage</span>
                      </div>
                      <p style="font-size: 0.8125rem; color: #64748b; margin-bottom: 0.85rem;">${s.description || 'Core syllabus section'}</p>

                      <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${(s.topics || []).map(t => `
                          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 0.35rem; font-size: 0.8125rem;">
                            <span style="font-weight: 500; color: #1e293b;">• ${t.name}</span>
                            <div style="display: flex; gap: 6px;">
                              <span class="badge ${t.difficulty === 'Hard' ? 'badge-rose' : (t.difficulty === 'Medium' ? 'badge-amber' : 'badge-emerald')}" style="font-size: 0.65rem;">${t.difficulty}</span>
                              <span class="badge badge-slate" style="font-size: 0.65rem;">~${t.estimated_hours} hrs</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 3. Exam Pattern & Marking Scheme -->
              <div class="spps-card" style="padding: 1.5rem;">
                <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.85rem;">
                  3. Exam Pattern & Marking Scheme
                </h2>
                <div style="font-size: 0.9375rem; color: #334155; line-height: 1.6; background: #f8fafc; padding: 1.15rem; border-radius: 0.625rem; border: 1px solid #e2e8f0;">
                  ${exam.pattern_marking}
                </div>
              </div>

              <!-- 4. Preparation Strategy & Recommended Resources -->
              <div class="spps-card" style="padding: 1.5rem;">
                <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.85rem;">
                  4. Recommended Strategy & Study Books
                </h2>
                <div style="margin-bottom: 1rem;">
                  <h3 style="font-size: 0.9375rem; font-weight: 700; color: #1e293b; margin-bottom: 0.35rem;">Strategic Guidance:</h3>
                  <p style="font-size: 0.875rem; color: #475569; line-height: 1.5;">${exam.prep_strategy}</p>
                </div>
                <div style="background: #eef2ff; border-radius: 0.5rem; padding: 1rem; border: 1px solid #c7d2fe;">
                  <h3 style="font-size: 0.875rem; font-weight: 700; color: #312e81; margin-bottom: 0.35rem;">Recommended Textbooks & Question Banks:</h3>
                  <p style="font-size: 0.85rem; color: #4338ca;">${exam.recommended_resources}</p>
                </div>
              </div>
            </div>

            <!-- Right Fact-Sheet Column -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              <!-- Official Schedule & Verification Status -->
              <div class="spps-card" style="padding: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                  <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b;">Schedule Status</span>
                  <span class="badge ${exam.schedule_status === 'Official' ? 'badge-emerald' : 'badge-amber'}">${exam.schedule_status}</span>
                </div>
                <div style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
                  ${exam.official_schedule}
                </div>
                <div style="font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.75rem;">
                  <div>Last verified: <strong>${exam.schedule_verified_date}</strong></div>
                  <div style="margin-top: 4px;">
                    <a href="${exam.official_url}" target="_blank" rel="noopener" style="color: #4f46e5; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
                      Official Portal ${window.icons.externalLink}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Eligibility Criteria -->
              <div class="spps-card" style="padding: 1.5rem;">
                <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 0.85rem;">Eligibility Criteria</h3>
                
                <div style="margin-bottom: 0.85rem;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Who Can Apply:</span>
                  <div style="font-size: 0.875rem; color: #1e293b; margin-top: 2px;">${exam.who_can_apply}</div>
                </div>

                <div style="margin-bottom: 0.85rem;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Educational Qualification:</span>
                  <div style="font-size: 0.875rem; color: #1e293b; margin-top: 2px;">${exam.qualification}</div>
                </div>

                <div style="margin-bottom: 0.85rem;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Age Limit:</span>
                  <div style="font-size: 0.875rem; color: #1e293b; margin-top: 2px;">${exam.age_limit}</div>
                </div>

                <div>
                  <span style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Important Conditions:</span>
                  <div style="font-size: 0.85rem; color: #475569; margin-top: 2px;">${exam.important_eligibility}</div>
                </div>
              </div>

              <!-- Selection Process -->
              <div class="spps-card" style="padding: 1.5rem;">
                <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 0.85rem;">Selection Stages</h3>
                <div style="font-size: 0.875rem; color: #334155; line-height: 1.5;">
                  ${exam.selection_process}
                </div>
              </div>

              <!-- Previous-Year Questions (PYQs) Shortcut -->
              <div class="spps-card" style="padding: 1.5rem; background: #f0fdfa; border-color: #99f6e4;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #0f766e; margin-bottom: 0.5rem;">
                  ${window.icons.helpCircle} Available PYQ Bank
                </div>
                <p style="font-size: 0.8125rem; color: #115e59; margin-bottom: 1rem;">
                  Solve verified previous-year questions for ${exam.short_name} with answer keys, step-by-step solutions, and bookmarking.
                </p>
                <button class="btn btn-accent btn-sm" style="width: 100%;" onclick="router.navigate('pyq', '${exam.id}')">
                  Browse ${exam.short_name} PYQs
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="spps-card" style="padding: 2.5rem; text-align: center;">
          <h2 style="color: #e11d48; margin-bottom: 1rem;">Failed to load examination</h2>
          <p style="color: #64748b;">${err.message}</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="router.navigate('explore')">Return to Directory</button>
        </div>
      `;
    }
  },

  async startPreparation(examId, examName) {
    const user = window.state.get('user');
    if (!user) {
      authModal.open('register');
      return;
    }

    try {
      await window.api.selectExam(examId);
      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      toast.success(`Preparation roadmap initialized for ${examName}!`);
      router.navigate('planner');
    } catch (e) {
      toast.error('Could not start preparation: ' + e.message);
    }
  }
};

window.examDetailsView = examDetailsView;

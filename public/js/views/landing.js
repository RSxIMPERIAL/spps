// SPPS Landing Page View
const landingView = {
  selectedStage: 'all',

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    // Fetch initial exams for preview
    let exams = [];
    try {
      const res = await window.api.getExams();
      exams = res.exams || [];
    } catch (e) {
      console.error('Failed to fetch preview exams', e);
    }

    container.innerHTML = `
      <div>
        <!-- Hero Section -->
        <section style="background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); border-bottom: 1px solid var(--border-subtle); padding: 4.5rem 1.5rem 3.5rem; text-align: center;">
          <div style="max-width: 900px; margin: 0 auto;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.5rem;">
              <span>🇮🇳 Built specifically for Indian Competitive & Entrance Examinations</span>
            </div>

            <h1 style="font-size: 3.25rem; font-weight: 800; color: #0f172a; line-height: 1.15; letter-spacing: -0.025em; margin-bottom: 1.25rem;">
              Your Goals. Your Study Plan.<br/><span style="color: #4f46e5;">Your Future.</span>
            </h1>

            <p style="font-size: 1.2rem; color: #475569; max-width: 720px; margin: 0 auto 2.25rem; line-height: 1.6;">
              Discover the right examinations, build a personalized timetable, practice previous-year questions, and prepare consistently with SPPS.
            </p>

            <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-lg" onclick="authModal.open('register')">
                Get Started Free ${window.icons.arrowRight}
              </button>
              <button class="btn btn-secondary btn-lg" onclick="authModal.loginDemo()">
                ⚡ Student Demo (Aarav - JEE Main)
              </button>
              <button class="btn btn-secondary btn-lg" style="border-color: #a7f3d0; color: #065f46; background: #ecfdf5;" onclick="authModal.loginAdminDemo()">
                🛡️ Admin Console Demo
              </button>
              <button class="btn btn-secondary btn-lg" onclick="router.navigate('explore')">
                ${window.icons.compass} Explore Examinations
              </button>
            </div>

            <!-- Trust Bar / Key Stats -->
            <div style="display: flex; justify-content: space-between; max-width: 780px; margin: 3.5rem auto 0; padding-top: 2rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 1.5rem;">
              <div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #0f172a;">64+</div>
                <div style="font-size: 0.8125rem; color: #64748b; font-weight: 500;">National & State Exams</div>
              </div>
              <div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #0f172a;">3 Stages</div>
                <div style="font-size: 0.8125rem; color: #64748b; font-weight: 500;">Class 10, 12 & Graduation</div>
              </div>
              <div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #0f172a;">100% Verified</div>
                <div style="font-size: 0.8125rem; color: #64748b; font-weight: 500;">Official PYQs & Answers</div>
              </div>
              <div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #0f172a;">Deterministic</div>
                <div style="font-size: 0.8125rem; color: #64748b; font-weight: 500;">Transparent Timetable Engine</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Core Problems & SPPS Integrated Solutions -->
        <section style="padding: 4rem 1.5rem; max-width: 1200px; margin: 0 auto;">
          <div style="text-align: center; max-width: 700px; margin: 0 auto 3rem;">
            <h2 style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem;">
              Everything Connected In One Single Platform
            </h2>
            <p style="color: #64748b; font-size: 1rem;">
              When you pick an examination, SPPS automatically synchronizes your syllabus, roadmap, daily schedule, and question practice.
            </p>
          </div>

          <div class="grid-cols-4">
            <div class="spps-card" style="padding: 1.5rem;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                ${window.icons.compass}
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Exam Discovery</h3>
              <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">
                Clear eligibility criteria, verified official schedules, exam patterns, and career opportunities after 10th, 12th, or graduation.
              </p>
            </div>

            <div class="spps-card" style="padding: 1.5rem;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #f0fdfa; color: #0d9488; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                ${window.icons.clipboardList}
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Personalized Roadmap</h3>
              <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">
                Generates 3 distinct preparation phases tailored to your mode (Beginner, Intermediate, Revision) and gives extra time to weak topics.
              </p>
            </div>

            <div class="spps-card" style="padding: 1.5rem;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                ${window.icons.calendar}
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Automatic Timetable</h3>
              <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">
                Converts your study tasks into conflict-free daily time blocks, automatically alternates subjects, and provides rest intervals.
              </p>
            </div>

            <div class="spps-card" style="padding: 1.5rem;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #fdf2f8; color: #db2777; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                ${window.icons.target}
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Official PYQs & Streaks</h3>
              <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">
                Practice authentic previous-year questions with verified solutions, track daily practice streaks, and maintain consistency.
              </p>
            </div>
          </div>
        </section>

        <!-- Live Examination Catalog Preview -->
        <section style="background: #ffffff; border-top: 1px solid var(--border-subtle); padding: 4rem 1.5rem;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span class="badge badge-indigo" style="margin-bottom: 0.5rem;">Directory Preview</span>
                <h2 style="font-size: 1.85rem; font-weight: 800; color: #0f172a;">Discover Indian Examinations</h2>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="landingView.filterStage('all')">All</button>
                <button class="btn btn-secondary btn-sm" onclick="landingView.filterStage('after_10')">After 10th</button>
                <button class="btn btn-secondary btn-sm" onclick="landingView.filterStage('after_12')">After 12th</button>
                <button class="btn btn-secondary btn-sm" onclick="landingView.filterStage('after_grad')">After Graduation</button>
              </div>
            </div>

            <div id="landing-exam-grid" class="grid-cols-3">
              ${this.renderExamCards(exams.slice(0, 6))}
            </div>

            <div style="text-align: center; margin-top: 2.5rem;">
              <button class="btn btn-secondary btn-lg" onclick="router.navigate('explore')">
                View All ${exams.length} Examinations with Syllabi & Schedules ${window.icons.arrowRight}
              </button>
            </div>
          </div>
        </section>

        <!-- CTA Banner -->
        <section style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 4.5rem 1.5rem; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem;">
              Ready to take control of your preparation?
            </h2>
            <p style="font-size: 1.1rem; color: #c7d2fe; margin-bottom: 2rem;">
              No more guessing syllabi or struggling to organize study hours. Get your personalized plan in under 60 seconds.
            </p>
            <button class="btn btn-accent btn-lg" onclick="authModal.open('register')">
              Build Your Personalized Study Plan
            </button>
          </div>
        </section>
      </div>
    `;
  },

  renderExamCards(exams) {
    if (!exams.length) {
      return `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No exams found.</div>`;
    }

    return exams.map(e => {
      let stageBadge = 'After Class 12';
      let badgeClass = 'badge-indigo';
      if (e.stage === 'after_10') { stageBadge = 'After Class 10'; badgeClass = 'badge-amber'; }
      if (e.stage === 'after_grad') { stageBadge = 'After Graduation'; badgeClass = 'badge-emerald'; }

      return `
        <div class="spps-card spps-card-hover" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span class="badge ${badgeClass}">${stageBadge}</span>
              <span style="font-size: 0.75rem; font-weight: 600; color: #64748b;">${e.category}</span>
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">${e.name}</h3>
            <div style="font-size: 0.8125rem; color: #4f46e5; font-weight: 600; margin-bottom: 0.75rem;">
              ${e.conducting_authority}
            </div>
            <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem;">
              ${e.overview.slice(0, 130)}...
            </p>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.75rem; color: #64748b;">
              <span style="font-weight: 600; color: #0f172a;">${e.subject_count || 3}</span> Subjects • <span style="font-weight: 600; color: #0f172a;">${e.pyq_count || 10}+</span> PYQs
            </div>
            <button class="btn btn-secondary btn-sm" onclick="router.navigate('exam-details', '${e.id}')">
              Details ${window.icons.arrowRight}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async filterStage(stage) {
    this.selectedStage = stage;
    try {
      const res = await window.api.getExams({ stage: stage === 'all' ? undefined : stage });
      const grid = document.getElementById('landing-exam-grid');
      if (grid) {
        grid.innerHTML = this.renderExamCards(res.exams.slice(0, 6));
      }
    } catch (e) {
      console.error(e);
    }
  }
};

window.landingView = landingView;

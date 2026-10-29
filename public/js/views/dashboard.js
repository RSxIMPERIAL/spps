// SPPS Student Dashboard View
const dashboardView = {
  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <div style="color: #64748b; font-weight: 500;">Loading your personalized preparation dashboard...</div>
      </div>
    `;

    try {
      const data = await window.api.getDashboardAnalytics();
      const user = window.state.get('user');

      const readinessScore = data.readinessIndex || 65;
      const examName = data.exam?.name || 'Selected Examination';
      const examShort = data.exam?.short_name || 'Exam';
      const streakCount = data.streak?.current || 0;
      const todaySessions = data.todaySessions || [];
      const subjectProgress = data.syllabus?.subjectProgress || [];

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <!-- Welcome & Status Banner -->
          <div class="spps-card" style="padding: 1.5rem 1.75rem; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-left: 5px solid #4f46e5;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a;">Welcome back, ${user?.full_name || 'Student'}!</h1>
                  <span class="badge badge-indigo">${user?.prep_mode || 'beginner'} mode</span>
                </div>
                <p style="font-size: 0.875rem; color: #64748b;">
                  Your preparation target is locked to <strong style="color: #1e293b;">${examName}</strong>. 
                  ${data.targetDate ? `Exam target date: <strong>${data.targetDate}</strong>.` : 'Flexible schedule mode active.'}
                </p>
              </div>

              <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-secondary btn-sm" onclick="router.navigate('my-prep')">
                  ${window.icons.settings} Preparation Settings
                </button>
                <button class="btn btn-primary btn-sm" onclick="router.navigate('daily-practice')">
                  ${window.icons.target} Start Daily Practice
                </button>
              </div>
            </div>
          </div>

          <!-- Top Metric Cards -->
          <div class="grid-cols-4">
            <!-- Readiness Gauge Card -->
            <div class="spps-card" style="padding: 1.25rem; display: flex; flex-direction: column; align-items: center; text-align: center;">
              <div style="font-size: 0.8125rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.75rem;">
                Exam Readiness Index
              </div>
              ${window.charts.renderGauge(readinessScore, 'Readiness Index', 125)}
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
                Based on syllabus covered, question accuracy & consistency.
              </div>
            </div>

            <!-- Daily Practice Card -->
            <div class="spps-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Today's Practice Target</span>
                  <span class="badge badge-amber">${data.practice.todayCompleted}/${data.practice.todayTarget} Qs</span>
                </div>
                <div style="font-size: 1.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
                  ${data.practice.todayCompleted} <span style="font-size: 1rem; color: #64748b; font-weight: 500;">/ ${data.practice.todayTarget} questions</span>
                </div>
                <div style="height: 6px; width: 100%; background: #f1f5f9; border-radius: 9999px; overflow: hidden; margin-bottom: 0.5rem;">
                  <div style="width: ${Math.min(100, (data.practice.todayCompleted / (data.practice.todayTarget || 10)) * 100)}%; height: 100%; background: #f59e0b; border-radius: 9999px;"></div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="router.navigate('daily-practice')">
                ${data.practice.todayTargetMet ? 'Daily Goal Achieved! Bonus Practice' : 'Continue Today\'s Target'}
              </button>
            </div>

            <!-- Streak Tracker Card -->
            <div class="spps-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Consistency Streak</span>
                  <div class="flame-active">${window.icons.flame}</div>
                </div>
                <div style="font-size: 1.85rem; font-weight: 800; color: #b45309; margin-bottom: 0.25rem;">
                  ${streakCount} Days
                </div>
                <div style="font-size: 0.8125rem; color: #64748b;">
                  Longest record: <strong style="color: #0f172a;">${data.streak.longest || streakCount} days</strong>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="router.navigate('streaks')">
                View Activity Heatmap
              </button>
            </div>

            <!-- Syllabus Progress Card -->
            <div class="spps-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Syllabus Covered</span>
                  <span class="badge badge-teal">${data.syllabus.completionPercent}%</span>
                </div>
                <div style="font-size: 1.85rem; font-weight: 800; color: #0d9488; margin-bottom: 0.25rem;">
                  ${data.syllabus.completedTasks} <span style="font-size: 1rem; color: #64748b; font-weight: 500;">/ ${data.syllabus.totalTasks} tasks</span>
                </div>
                <div style="font-size: 0.8125rem; color: #64748b;">
                  ${data.syllabus.pendingTasks} tasks remaining in roadmap
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="router.navigate('planner')">
                Open Study Planner
              </button>
            </div>
          </div>

          <!-- Main Dashboard Split: Today's Schedule & Subject Mastery -->
          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem;" class="grid-split-responsive">
            <!-- Left Column: Today's Timetable Sessions -->
            <div class="spps-card" style="padding: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <div>
                  <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">Today's Scheduled Sessions</h2>
                  <div style="font-size: 0.8125rem; color: #64748b;">Automatic conflict-free timetable allocation</div>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="router.navigate('timetable')">
                  Full Timetable ${window.icons.arrowRight}
                </button>
              </div>

              ${todaySessions.length === 0 ? `
                <div style="text-align: center; padding: 2.5rem 1rem; background: #f8fafc; border-radius: 0.5rem; border: 1px dashed #cbd5e1;">
                  <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 0.75rem;">No study sessions scheduled for today.</p>
                  <button class="btn btn-primary btn-sm" onclick="router.navigate('timetable')">
                    ${window.icons.calendar} Generate Timetable
                  </button>
                </div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${todaySessions.map(s => {
                    const isCompleted = s.status === 'completed';
                    return `
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border-radius: 0.625rem; border: 1px solid ${isCompleted ? '#a7f3d0' : '#e2e8f0'}; background: ${isCompleted ? '#f0fdf4' : '#ffffff'};">
                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                          <input type="checkbox" class="custom-checkbox" ${isCompleted ? 'checked' : ''} onchange="dashboardView.toggleSessionStatus('${s.id}', this.checked)" title="Mark completed" />
                          <div>
                            <div style="font-weight: 600; font-size: 0.9375rem; color: #0f172a; text-decoration: ${isCompleted ? 'line-through' : 'none'};">
                              ${s.title}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                              <span style="font-weight: 600; color: #4f46e5;">${s.subject_name || 'General'}</span>
                              <span>•</span>
                              <span>${s.start_time} - ${s.end_time}</span>
                              <span>•</span>
                              <span class="badge badge-slate" style="font-size: 0.65rem;">${s.activity_type}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          ${isCompleted ? `
                            <span class="badge badge-emerald">Done</span>
                          ` : `
                            <span class="badge badge-indigo">Scheduled</span>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Right Column: Subject Mastery & Weekly Hours -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              <!-- Subject Progress Card -->
              <div class="spps-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                  <div>
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">Subject Mastery</h2>
                    <div style="font-size: 0.8125rem; color: #64748b;">Syllabus completion per subject</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="router.navigate('planner')">
                    Roadmap
                  </button>
                </div>
                ${window.charts.renderSubjectMastery(subjectProgress)}
              </div>

              <!-- Weekly Hours Bar Chart -->
              <div class="spps-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <div>
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">Weekly Study Hours</h2>
                    <div style="font-size: 0.8125rem; color: #64748b;">Planned vs Actual hours</div>
                  </div>
                </div>
                ${window.charts.renderWeeklyHoursChart()}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="spps-card" style="padding: 2rem; text-align: center;">
          <div style="color: #e11d48; margin-bottom: 1rem;">${window.icons.alertTriangle}</div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Unable to load dashboard</h2>
          <p style="color: #64748b; margin-bottom: 1rem;">${err.message}</p>
          <button class="btn btn-primary" onclick="dashboardView.render()">Try Again</button>
        </div>
      `;
    }
  },

  async toggleSessionStatus(sessionId, isChecked) {
    try {
      await window.api.updateTimetableSession(sessionId, {
        status: isChecked ? 'completed' : 'scheduled'
      });
      toast.success(isChecked ? 'Session marked as completed!' : 'Session reset to scheduled.');
      this.render();
    } catch (e) {
      toast.error('Failed to update session');
    }
  }
};

window.dashboardView = dashboardView;

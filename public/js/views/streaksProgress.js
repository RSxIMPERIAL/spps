// SPPS Streaks and Progress Analytics Hub View
const streaksProgressView = {
  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading comprehensive preparation analytics & streak heatmap...
      </div>
    `;

    try {
      const data = await window.api.getDashboardAnalytics();
      const streak = data.streak || {};
      const practice = data.practice || {};
      const syllabus = data.syllabus || {};
      const recentLogs = data.recentLogs || [];

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1200px; margin: 0 auto;">
          <!-- Header Banner -->
          <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span class="badge badge-amber" style="margin-bottom: 0.5rem;">Consistency Engine</span>
                <h1 style="font-size: 1.75rem; font-weight: 800;">Streaks, Accuracy & Progress</h1>
                <p style="font-size: 0.875rem; color: #c7d2fe; margin-top: 4px;">
                  Real-time metrics measuring your readiness index, consistency heatmap, and question accuracy.
                </p>
              </div>

              <!-- Streak Flame Pill -->
              <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 0.75rem 1.25rem; border-radius: 1rem;">
                <div class="flame-active" style="font-size: 1.5rem; display: flex; align-items: center;">${window.icons.flame}</div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24; line-height: 1;">${streak.current || 0} Days</div>
                  <div style="font-size: 0.75rem; color: #c7d2fe;">Current Streak</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Analytics Cards -->
          <div class="grid-cols-3">
            <!-- Readiness Index -->
            <div class="spps-card" style="padding: 1.5rem; text-align: center;">
              <h3 style="font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem;">
                Exam Readiness Score
              </h3>
              ${window.charts.renderGauge(data.readinessIndex || 60, 'Readiness Index', 140)}
              <div style="font-size: 0.8125rem; color: #475569; margin-top: 1rem; line-height: 1.4;">
                Combines syllabus completion (45%), question accuracy (35%), and streak consistency (20%).
              </div>
            </div>

            <!-- Question Accuracy -->
            <div class="spps-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem;">
                  Overall PYQ Accuracy
                </h3>
                <div style="font-size: 2.5rem; font-weight: 800; color: #0d9488; margin-bottom: 0.25rem;">
                  ${practice.accuracyPercent || 0}%
                </div>
                <div style="font-size: 0.875rem; color: #64748b;">
                  ${practice.correctAttempts || 0} correct out of ${practice.totalAttempts || 0} total attempts
                </div>
              </div>
              <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1rem;">
                <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="router.navigate('pyq')">
                  Practice Questions Now
                </button>
              </div>
            </div>

            <!-- Streak Milestones -->
            <div class="spps-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem;">
                  Streak Record & Volume
                </h3>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.75rem;">
                  <span style="font-size: 0.875rem; color: #64748b;">Longest Streak:</span>
                  <span style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">${streak.longest || streak.current || 0} days</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.75rem;">
                  <span style="font-size: 0.875rem; color: #64748b;">Questions Solved:</span>
                  <span style="font-size: 1.25rem; font-weight: 800; color: #4f46e5;">${streak.totalSolved || 0} Qs</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-size: 0.875rem; color: #64748b;">Adaptive Daily Target:</span>
                  <span class="badge badge-teal">${streak.adaptiveTarget || 10} Qs/day</span>
                </div>
              </div>
              <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1rem;">
                <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="router.navigate('daily-practice')">
                  Daily Practice Challenge
                </button>
              </div>
            </div>
          </div>

          <!-- 30-Day Activity Heatmap Card -->
          <div class="spps-card" style="padding: 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">30-Day Consistency Heatmap</h2>
                <div style="font-size: 0.8125rem; color: #64748b;">Daily question practice activity and target completions</div>
              </div>
            </div>
            ${window.charts.renderStreakHeatmap(recentLogs, streak.current)}
          </div>

          <!-- Subject Progress & Weekly Hours Grid -->
          <div class="grid-cols-2">
            <!-- Subject Breakdown -->
            <div class="spps-card" style="padding: 1.75rem;">
              <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem;">
                Subject-Wise Syllabus Coverage
              </h2>
              ${window.charts.renderSubjectMastery(syllabus.subjectProgress || [])}
            </div>

            <!-- Weekly Hours -->
            <div class="spps-card" style="padding: 1.75rem;">
              <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem;">
                Weekly Study Hours: Planned vs Actual
              </h2>
              ${window.charts.renderWeeklyHoursChart()}
            </div>
          </div>

          <!-- Recent Activity Log Table -->
          <div class="spps-card" style="padding: 1.75rem;">
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">
              Recent Daily Practice Sessions
            </h2>

            ${!recentLogs.length ? `
              <div style="color: #64748b; font-size: 0.875rem; text-align: center; padding: 2rem;">No practice activity logged yet.</div>
            ` : `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="border-bottom: 2px solid var(--border-subtle); color: #64748b;">
                      <th style="padding: 0.75rem 1rem;">Date</th>
                      <th style="padding: 0.75rem 1rem;">Target</th>
                      <th style="padding: 0.75rem 1rem;">Completed</th>
                      <th style="padding: 0.75rem 1rem;">Correct</th>
                      <th style="padding: 0.75rem 1rem;">Accuracy</th>
                      <th style="padding: 0.75rem 1rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentLogs.map(l => {
                      const acc = l.completed_count > 0 ? Math.round((l.correct_count / l.completed_count) * 100) : 0;
                      return `
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                          <td style="padding: 0.75rem 1rem; font-weight: 600; color: #0f172a;">${l.practice_date}</td>
                          <td style="padding: 0.75rem 1rem; color: #64748b;">${l.target_count} Qs</td>
                          <td style="padding: 0.75rem 1rem; font-weight: 700; color: #1e293b;">${l.completed_count} Qs</td>
                          <td style="padding: 0.75rem 1rem; color: #059669; font-weight: 700;">${l.correct_count}</td>
                          <td style="padding: 0.75rem 1rem; font-weight: 600;">${acc}%</td>
                          <td style="padding: 0.75rem 1rem;">
                            <span class="badge ${l.is_target_met ? 'badge-emerald' : 'badge-amber'}">
                              ${l.is_target_met ? 'Target Met' : 'Partial'}
                            </span>
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
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">${err.message}</div>`;
    }
  }
};

window.streaksProgressView = streaksProgressView;

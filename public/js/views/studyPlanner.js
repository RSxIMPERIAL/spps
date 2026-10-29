// SPPS Personalized Study Planner View
// Formats exact "What to Study" and "How to Study" execution protocols matching the student's free study time slots.

const studyPlannerView = {
  currentPhaseFilter: 'all',
  currentStatusFilter: 'all',
  tasksCache: [],
  planCache: null,
  examCache: null,
  timeSlotsCache: [],
  expandedTaskIds: new Set(),

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading your personalized study plan, free time slots, and execution protocols...
      </div>
    `;

    try {
      const data = await window.api.getStudyPlan();
      const plan = data.plan;
      const tasks = data.tasks || [];
      const exam = data.exam;
      this.tasksCache = tasks;
      this.planCache = plan;
      this.examCache = exam;
      this.timeSlotsCache = data.time_slots || [];

      if (!plan) {
        container.innerHTML = `
          <div class="spps-card" style="padding: 3rem; text-align: center; max-width: 650px; margin: 2rem auto;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🧭</div>
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem;">No Active Study Plan Found</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem;">Select an examination to generate a personalized roadmap based on your free study time slots.</p>
            <button class="btn btn-primary" onclick="router.navigate('explore')">Explore Examinations</button>
          </div>
        `;
        return;
      }

      const completedCount = tasks.filter(t => t.status === 'completed').length;
      const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
      const completionPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

      const formattedSlots = this.timeSlotsCache.map(s => {
        if (typeof s === 'object' && s !== null) {
          const daysStr = s.daysDisplay || (s.days ? (Array.isArray(s.days) ? (s.days.includes('All') ? 'Daily' : s.days.join(',')) : s.days) : 'Daily');
          return `${s.start}-${s.end} (${daysStr})`;
        }
        return typeof s === 'string' ? s : `${s.start} - ${s.end}`;
      }).join(' • ');

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1250px; margin: 0 auto;">
          <!-- Warning banner if workload exceeds capacity -->
          ${plan.warning_message ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; border-radius: 0.75rem; padding: 1.15rem 1.5rem; display: flex; align-items: flex-start; gap: 1rem;">
              <div style="color: #d97706; margin-top: 2px;">${window.icons.alertTriangle || '⚠️'}</div>
              <div>
                <div style="font-weight: 700; color: #92400e; font-size: 0.9375rem; margin-bottom: 2px;">Workload Capacity Warning</div>
                <div style="font-size: 0.85rem; color: #b45309; line-height: 1.5;">${plan.warning_message}</div>
              </div>
            </div>
          ` : ''}

          <!-- Plan Overview Header Banner -->
          <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
              <div style="max-width: 780px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; flex-wrap: wrap;">
                  <span class="badge badge-teal">${exam?.short_name || 'Exam'}</span>
                  <span class="badge badge-indigo">${plan.prep_mode.toUpperCase()} MODE</span>
                  <span class="badge badge-emerald">⏰ Free Slots: ${formattedSlots || 'Configured'}</span>
                  <span class="badge badge-slate" style="background: rgba(255,255,255,0.15); color: #ffffff;">~${plan.daily_hours} hrs/day capacity</span>
                </div>
                <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 0.35rem;">
                  Personalized Preparation Roadmap & Study Format
                </h1>
                <p style="font-size: 0.875rem; color: #c7d2fe; line-height: 1.5;">
                  ${plan.plan_overview}
                </p>
              </div>

              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                ${plan.prep_mode === 'beginner' ? `
                  <button class="btn btn-secondary btn-sm" style="background: rgba(16, 185, 129, 0.25); color: #ffffff; border-color: rgba(16, 185, 129, 0.4); font-weight: 700;" onclick="studyPlannerView.openBeginnerModal()">
                    🌱 Beginner Topic Pathway
                  </button>
                ` : plan.prep_mode === 'intermediate' ? `
                  <button class="btn btn-secondary btn-sm" style="background: rgba(99, 102, 241, 0.25); color: #ffffff; border-color: rgba(99, 102, 241, 0.4); font-weight: 700;" onclick="studyPlannerView.openMasteryAuditModal()">
                    🧠 Audit Topic Mastery
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-sm" style="background: rgba(244, 63, 94, 0.25); color: #ffffff; border-color: rgba(244, 63, 94, 0.4); font-weight: 700;" onclick="studyPlannerView.openRevisionMatrixModal()">
                    🔥 High-Yield Priority Matrix
                  </button>
                `}
                <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" onclick="studyPlannerView.openRegenerateModal()">
                  ${window.icons.refreshCw || '↻'} Configure Free Slots & Re-Generate
                </button>
                <button class="btn btn-accent btn-sm" onclick="router.navigate('timetable')">
                  ${window.icons.calendar || '📅'} View Daily Timetable
                </button>
              </div>
            </div>

            <!-- Milestone Progress Strip -->
            <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.25rem;">
              <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                <div>
                  <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Total Tasks</div>
                  <div style="font-size: 1.35rem; font-weight: 800;">${tasks.length}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Completed</div>
                  <div style="font-size: 1.35rem; font-weight: 800; color: #34d399;">${completedCount}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">In Progress</div>
                  <div style="font-size: 1.35rem; font-weight: 800; color: #fbbf24;">${inProgressCount}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Total Workload</div>
                  <div style="font-size: 1.35rem; font-weight: 800;">~${Math.round(plan.total_estimated_hours)} hrs</div>
                </div>
              </div>

              <!-- Progress bar -->
              <div style="min-width: 220px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #c7d2fe; margin-bottom: 4px;">
                  <span>Syllabus Coverage</span>
                  <span style="font-weight: 700;">${completionPercent}%</span>
                </div>
                <div style="height: 8px; width: 100%; background: rgba(255,255,255,0.2); border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${completionPercent}%; height: 100%; background: #34d399; border-radius: 9999px; transition: width 0.5s ease;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Free Time Slots Card: What & How Format Overview -->
          <div class="spps-card" style="padding: 1.25rem 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                  <span>⏰</span> Your Active Free Study Time Slots:
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 6px;">
                  ${this.timeSlotsCache.map((s, idx) => {
                    const label = typeof s === 'object' ? s.label : `Slot ${idx + 1}`;
                    const time = typeof s === 'object' ? `${s.start} - ${s.end}` : s;
                    return `
                      <span class="badge badge-indigo" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
                        <strong>${label}:</strong> ${time}
                      </span>
                    `;
                  }).join('')}
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 0.8125rem; color: #64748b;">
                  Need to change when you are free?
                </span>
                <button class="btn btn-secondary btn-sm" onclick="studyPlannerView.openRegenerateModal()">
                  Adjust Free Slots
                </button>
              </div>
            </div>
          </div>

          <!-- Phase Navigation & Filters -->
          <div class="spps-card" style="padding: 1rem 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <!-- Phase Selector Pills -->
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-sm ${this.currentPhaseFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="studyPlannerView.filterPhase('all')">
                  All Roadmap Tasks (${tasks.length})
                </button>
                <button class="btn btn-sm ${this.currentPhaseFilter === 'Phase 1: Foundation' ? 'btn-primary' : 'btn-secondary'}" onclick="studyPlannerView.filterPhase('Phase 1: Foundation')">
                  Phase 1: Foundation
                </button>
                <button class="btn btn-sm ${this.currentPhaseFilter === 'Phase 2: In-Depth Mastery' ? 'btn-primary' : 'btn-secondary'}" onclick="studyPlannerView.filterPhase('Phase 2: In-Depth Mastery')">
                  Phase 2: In-Depth Mastery
                </button>
                <button class="btn btn-sm ${this.currentPhaseFilter === 'Phase 3: Revision & Practice' ? 'btn-primary' : 'btn-secondary'}" onclick="studyPlannerView.filterPhase('Phase 3: Revision & Practice')">
                  Phase 3: Revision & Practice
                </button>
              </div>

              <!-- Status Dropdown -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8125rem; font-weight: 600; color: #64748b;">Status:</span>
                <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem;" onchange="studyPlannerView.filterStatus(this.value)">
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tasks List Container (with "What to Study" & "How to Study" blueprint expanders) -->
          <div id="planner-tasks-container" style="display: flex; flex-direction: column; gap: 1rem;">
            ${this.renderTaskList()}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">${err.message}</div>`;
    }
  },

  renderTaskList() {
    let filtered = this.tasksCache;

    if (this.currentPhaseFilter !== 'all') {
      filtered = filtered.filter(t => t.phase === this.currentPhaseFilter);
    }

    if (this.currentStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === this.currentStatusFilter);
    }

    if (!filtered.length) {
      return `
        <div class="spps-card" style="padding: 3rem; text-align: center; color: #64748b;">
          No study tasks match the current filter selection.
        </div>
      `;
    }

    return filtered.map((task) => {
      const isDone = task.status === 'completed';
      const isInProgress = task.status === 'in_progress';
      const isExpanded = this.expandedTaskIds.has(task.id);

      let priorityBadgeClass = 'badge-slate';
      if (task.priority === 'High') priorityBadgeClass = 'badge-rose';
      else if (task.priority === 'Medium') priorityBadgeClass = 'badge-amber';

      let activityBadgeClass = 'badge-indigo';
      if (task.activity_type === 'Practice MCQs') activityBadgeClass = 'badge-teal';
      else if (task.activity_type === 'PYQ Review') activityBadgeClass = 'badge-emerald';

      const how = task.how_to_study || {};
      const microPhases = how.micro_phases || [];
      const techniques = how.cognitive_techniques || [];
      const checklist = how.checklist || [];

      return `
        <div class="spps-card hover-lift" style="padding: 1.25rem 1.5rem; border-left: 4px solid ${isDone ? '#10b981' : (isInProgress ? '#f59e0b' : '#6366f1')}; background: ${isDone ? '#fcfdfd' : '#ffffff'};">
          <!-- Top Row: Checkbox, Title, Details -->
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; align-items: flex-start; gap: 1rem; flex: 1;">
              <input type="checkbox" class="custom-checkbox" style="margin-top: 4px;" ${isDone ? 'checked' : ''} onchange="studyPlannerView.toggleTaskDone('${task.id}', this.checked)" title="Mark task completed" />

              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                  <span class="badge ${activityBadgeClass}" style="font-size: 0.7rem;">${task.activity_type}</span>
                  <span class="badge ${priorityBadgeClass}" style="font-size: 0.7rem;">${task.priority} Priority</span>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">${task.phase}</span>
                  ${task.notes?.includes('[Syllabus Diagnostic: MASTERED]') ? '<span class="badge badge-emerald" style="font-size: 0.7rem; font-weight: 700;">🟢 MASTERED (Theory Skipped)</span>' : ''}
                  ${task.notes?.includes('[Syllabus Diagnostic: NEEDS PRACTICE]') ? '<span class="badge badge-amber" style="font-size: 0.7rem; font-weight: 700;">🟡 NEEDS PRACTICE</span>' : ''}
                  ${task.notes?.includes('[Syllabus Diagnostic: UNSTUDIED / GAP]') ? '<span class="badge badge-rose" style="font-size: 0.7rem; font-weight: 700;">🔴 REMEDIAL GAP</span>' : ''}
                  ${task.notes?.includes('[TIER-1 HIGH YIELD]') ? '<span class="badge badge-rose" style="font-size: 0.7rem; font-weight: 700;">🔥 TIER-1 HIGH YIELD</span>' : ''}
                  ${task.notes?.includes('[TIER-2 CORE]') ? '<span class="badge badge-indigo" style="font-size: 0.7rem; font-weight: 700;">⚡ TIER-2 CORE</span>' : ''}
                  ${task.notes?.includes('Beginners:') ? '<span class="badge badge-teal" style="font-size: 0.7rem; font-weight: 700;">🌱 BEGINNER PATH</span>' : ''}
                </div>

                <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; text-decoration: ${isDone ? 'line-through' : 'none'};">
                  ${task.title}
                </h3>

                <div style="display: flex; align-items: center; gap: 14px; font-size: 0.8125rem; color: #64748b; margin-top: 4px; flex-wrap: wrap;">
                  <span>Subject: <strong style="color: #1e293b;">${task.subject_name || 'General'}</strong></span>
                  <span>•</span>
                  <span>Est: <strong style="color: #1e293b;">${task.duration_minutes} mins</strong></span>
                  ${task.due_date ? `
                    <span>•</span>
                    <span>Target Due: <strong style="color: #4f46e5;">${task.due_date}</strong></span>
                  ` : ''}
                </div>

                <!-- Syllabus Objective / What to study -->
                ${task.notes ? `
                  <div style="margin-top: 8px; font-size: 0.8125rem; color: #334155; background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: 0.35rem; border-left: 3px solid #3b82f6;">
                    <strong>🎯 What to Study:</strong> ${task.notes}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Action Buttons: Status selector & How-to-study toggle -->
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
              <select class="form-select" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; width: auto;" onchange="studyPlannerView.updateTaskStatus('${task.id}', this.value)">
                <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>

              <button class="btn ${isExpanded ? 'btn-primary' : 'btn-secondary'} btn-sm" style="font-size: 0.75rem; padding: 0.3rem 0.65rem; display: inline-flex; align-items: center; gap: 4px;" onclick="studyPlannerView.toggleExpandTask('${task.id}')">
                <span>🧠</span> ${isExpanded ? 'Hide Study Format' : 'How to Study This'}
              </button>

              ${task.activity_type === 'PYQ Review' ? `
                <button class="btn btn-accent btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; font-weight: 700; width: 100%; justify-content: center;" onclick="router.navigate('pyq')">
                  🚀 Solve PYQs Now
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Expandable "How to Study" Execution Blueprint -->
          ${isExpanded ? `
            <div style="margin-top: 1.25rem; padding: 1.25rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid #e2e8f0; animation: fadeIn 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                <div>
                  <span class="badge badge-emerald" style="font-size: 0.7rem;">Pedagogical Study Protocol</span>
                  <h4 style="font-size: 1rem; font-weight: 800; color: #0f172a; margin-top: 4px;">
                    ${how.method_title || 'Active Concept Deconstruction & Problem Solving'}
                  </h4>
                  <p style="font-size: 0.8125rem; color: #475569; margin-top: 2px;">
                    ${how.overview || 'Follow this step-by-step timed execution protocol for maximum concept retention.'}
                  </p>
                </div>
              </div>

              <!-- Micro-Phases Timed Breakdown -->
              ${microPhases.length > 0 ? `
                <div style="margin-top: 1rem;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">
                    ⏱ Timed Session Breakdown (${task.duration_minutes} Minutes):
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${microPhases.map(mp => `
                      <div style="display: flex; align-items: flex-start; gap: 0.75rem; background: #ffffff; padding: 0.6rem 0.85rem; border-radius: 0.375rem; border: 1px solid #e2e8f0;">
                        <span class="badge badge-indigo" style="font-weight: 700; white-space: nowrap; font-size: 0.72rem;">${mp.minutes} min</span>
                        <div>
                          <strong style="font-size: 0.8125rem; color: #0f172a;">${mp.phase}</strong>
                          <div style="font-size: 0.78125rem; color: #475569; margin-top: 2px; line-height: 1.4;">${mp.action}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Cognitive Techniques & Checklist Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1;">
                <!-- Cognitive Techniques -->
                ${techniques.length > 0 ? `
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.4rem;">
                      🧠 Cognitive Techniques To Apply:
                    </div>
                    <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                      ${techniques.map(t => `<span class="badge badge-teal" style="font-size: 0.7rem;">${t}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Action Checklist -->
                ${checklist.length > 0 ? `
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.4rem;">
                      📋 Session Action Checklist:
                    </div>
                    <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.78125rem; color: #334155; line-height: 1.5;">
                      ${checklist.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>

              <!-- Beginner Specific Pathway Breakdown -->
              ${how.beginner_pathway ? `
                <div style="margin-top: 1rem; background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 0.5rem; padding: 0.85rem 1rem;">
                  <div style="font-size: 0.8125rem; font-weight: 800; color: #3730a3; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>🌱</span> Beginner Topic Roadmap & Time Distribution
                  </div>
                  <div style="font-size: 0.75rem; color: #4338ca; line-height: 1.5; margin-bottom: 0.5rem;">
                    Recommended Allocation: <strong>40%</strong> Theory & NCERT • <strong>15%</strong> Formula Notes • <strong>25%</strong> Worked Examples • <strong>20%</strong> Level-1 Practice
                  </div>
                  <div style="font-size: 0.75rem; color: #334155; margin-bottom: 3px;">
                    <strong>📚 Recommended Book:</strong> ${how.beginner_pathway.recommended_textbook || 'NCERT Official Textbook'}
                  </div>
                  <div style="font-size: 0.75rem; color: #334155; margin-bottom: 0.5rem;">
                    <strong>🔑 Prerequisite:</strong> ${how.beginner_pathway.prerequisites || 'Basic arithmetic and dimensional units'}
                  </div>
                  <div style="font-size: 0.75rem; color: #0f172a; font-weight: 700; margin-bottom: 2px;">What to prepare:</div>
                  <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.75rem; color: #334155; line-height: 1.45;">
                    ${(how.beginner_pathway.what_to_prepare || []).map(p => `<li>${p}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <!-- Mistake Advice -->
              ${how.mistakes_advice ? `
                <div style="margin-top: 0.85rem; padding: 0.5rem 0.75rem; background: #fff1f2; border-radius: 0.375rem; border-left: 3px solid #f43f5e; font-size: 0.78125rem; color: #9f1239;">
                  <strong>⚠️ Pitfall Warning:</strong> ${how.mistakes_advice}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  toggleExpandTask(taskId) {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    } else {
      this.expandedTaskIds.add(taskId);
    }
    const container = document.getElementById('planner-tasks-container');
    if (container) container.innerHTML = this.renderTaskList();
  },

  filterPhase(phase) {
    this.currentPhaseFilter = phase;
    this.render();
  },

  filterStatus(status) {
    this.currentStatusFilter = status;
    const container = document.getElementById('planner-tasks-container');
    if (container) container.innerHTML = this.renderTaskList();
  },

  async toggleTaskDone(taskId, isChecked) {
    try {
      await window.api.updateStudyTask(taskId, {
        status: isChecked ? 'completed' : 'pending'
      });
      toast.success(isChecked ? 'Task marked complete! Great progress.' : 'Task marked as pending.');
      this.render();
    } catch (e) {
      toast.error('Could not update task');
    }
  },

  async updateTaskStatus(taskId, newStatus) {
    try {
      await window.api.updateStudyTask(taskId, { status: newStatus });
      toast.success(`Task status changed to ${newStatus.replace('_', ' ')}`);
      this.render();
    } catch (e) {
      toast.error('Failed to update task status');
    }
  },

  // ------------------------------------------------------------------------
  // FREE TIME SLOTS & REGENERATE MODAL
  // ------------------------------------------------------------------------
  openRegenerateModal() {
    const user = window.state.get('user');

    // Parse existing slots or defaults
    let currentSlots = [
      { start: '07:00', end: '09:00', label: 'Morning Deep Work', days: ['All'] },
      { start: '18:30', end: '21:00', label: 'Evening Practice & PYQs', days: ['All'] }
    ];

    try {
      let raw = this.timeSlotsCache || (window.state?.user?.time_slots);
      if (typeof raw === 'string') raw = JSON.parse(raw);
      if (Array.isArray(raw) && raw.length > 0) {
        currentSlots = raw.map(s => {
          if (typeof s === 'string') {
            const [start, end] = s.split('-');
            return { start: start.trim(), end: end.trim(), label: 'Study Slot', days: ['All'] };
          }
          return {
            start: s.start || '08:00',
            end: s.end || '10:00',
            label: s.label || 'Study Slot',
            days: s.days || ['All']
          };
        });
      }
    } catch (e) {
      // Keep default
    }

    this._modalSlots = JSON.parse(JSON.stringify(currentSlots));

    const content = `
      <form onsubmit="studyPlannerView.handleRegenerateSubmit(event)">
        <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem;">
          Provide the <strong>exact time slots when you are free for studying</strong>. You can configure <em>different time slots for different days</em> (e.g. Weekday evenings vs Weekend marathons). The system will tailor your study plan and timetable to your exact availability.
        </p>

        <!-- Preparation Mode -->
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Preparation Mode</label>
          <select id="regen-mode" class="form-select">
            <option value="beginner" ${user?.prep_mode === 'beginner' ? 'selected' : ''}>Beginner (Fundamentals & Concepts)</option>
            <option value="intermediate" ${user?.prep_mode === 'intermediate' ? 'selected' : ''}>Intermediate (Practice & Weak Areas)</option>
            <option value="revision" ${user?.prep_mode === 'revision' ? 'selected' : ''}>Revision (High-Yield & Heavy PYQs)</option>
          </select>
        </div>

        <!-- Free Study Time Slots Section -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <label class="form-label" style="margin: 0; font-weight: 800; color: #0f172a;">⏰ Free Study Time Slots Builder</label>
              <div style="font-size: 0.75rem; color: #64748b;">Add and configure different study windows across your week.</div>
            </div>
            <div id="modal-total-hours-badge" class="badge badge-emerald" style="font-size: 0.8125rem; font-weight: 700;">
              Total: Calculating...
            </div>
          </div>

          <!-- Quick Presets -->
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.35rem;">Pick a Popular Schedule Pattern:</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="studyPlannerView.applyPreset('college_split')">
                📅 Weekday + Weekend Split (~4.1h/day)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="studyPlannerView.applyPreset('early_bird')">
                🌅 Early Bird Daily (5.0h)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="studyPlannerView.applyPreset('full_time')">
                ⚡ Full-Time 3-Shift (8.5h)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="studyPlannerView.applyPreset('tuition')">
                🌓 Alternate Tuition (4.0h)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="studyPlannerView.applyPreset('night_owl')">
                🌙 Night Owl (5.5h)
              </button>
            </div>
          </div>

          <!-- Dynamic Slots Builder -->
          <div id="modal-slots-list" style="display: flex; flex-direction: column; gap: 0.65rem;">
            <!-- Rendered by renderModalSlots() -->
          </div>

          <!-- Different Time Slot Action Buttons -->
          <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <button type="button" class="btn btn-primary btn-sm" onclick="studyPlannerView.addModalSlot('different')" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 700;">
              <span style="font-size: 1.1rem; line-height: 1;">+</span> Add Different Time Slot
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="studyPlannerView.addModalSlot('weekend')" style="font-size: 0.75rem;">
              📅 + Weekend Marathon Slot
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="studyPlannerView.addModalSlot('weekday_evening')" style="font-size: 0.75rem;">
              🌆 + Weekday Evening Slot
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="studyPlannerView.addModalSlot('morning')" style="font-size: 0.75rem;">
              🌅 + Morning Theory Slot
            </button>
          </div>
        </div>

        <!-- Target Date -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">Target Examination Date (Optional)</label>
          <input type="date" id="regen-date" class="form-input" value="${user?.target_exam_date || ''}" />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Generate Roadmap & Schedule</button>
        </div>
      </form>
    `;

    modal.open('Configure Free Study Time Slots', content, 'modal-content-lg');
    this.renderModalSlots();
  },

  renderModalSlots() {
    const listEl = document.getElementById('modal-slots-list');
    const badgeEl = document.getElementById('modal-total-hours-badge');
    if (!listEl) return;

    let weeklyMinutes = 0;

    listEl.innerHTML = this._modalSlots.map((slot, idx) => {
      const [sh, sm] = (slot.start || '08:00').split(':').map(Number);
      const [eh, em] = (slot.end || '10:00').split(':').map(Number);
      let dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur <= 0) dur += 24 * 60;
      dur = Math.max(15, Math.min(480, dur));

      let daysVal = 'All';
      let daysCount = 7;
      const days = slot.days;
      if (Array.isArray(days)) {
        if (days.includes('All') || days.includes('Daily') || days.length === 0) {
          daysVal = 'All';
          daysCount = 7;
        } else if (days.length === 5 && ['Mon','Tue','Wed','Thu','Fri'].every(d => days.includes(d))) {
          daysVal = 'Weekdays';
          daysCount = 5;
        } else if (days.length === 2 && ['Sat','Sun'].every(d => days.includes(d))) {
          daysVal = 'Weekends';
          daysCount = 2;
        } else {
          daysVal = days.join(',');
          daysCount = days.length;
        }
      } else if (typeof days === 'string') {
        daysVal = days;
        if (days === 'Weekdays') daysCount = 5;
        else if (days === 'Weekends') daysCount = 2;
        else if (days.includes(',')) daysCount = days.split(',').length;
      }

      weeklyMinutes += (dur * daysCount);
      const hrs = (dur / 60).toFixed(1);

      return `
        <div style="display: grid; grid-template-columns: 120px 120px 165px 1fr auto; gap: 0.5rem; align-items: center; background: #ffffff; padding: 0.65rem 0.85rem; border-radius: 0.375rem; border: 1px solid #e2e8f0;">
          <div>
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Start Time</label>
            <input type="time" class="form-input" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" value="${slot.start}" onchange="studyPlannerView.updateModalSlot(${idx}, 'start', this.value)" required />
          </div>

          <div>
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">End Time</label>
            <input type="time" class="form-input" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" value="${slot.end}" onchange="studyPlannerView.updateModalSlot(${idx}, 'end', this.value)" required />
          </div>

          <div>
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Active Days</label>
            <select class="form-select" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" onchange="studyPlannerView.updateModalSlotDays(${idx}, this.value)">
              <option value="All" ${daysVal === 'All' ? 'selected' : ''}>Daily (All Days)</option>
              <option value="Weekdays" ${daysVal === 'Weekdays' ? 'selected' : ''}>Weekdays (Mon-Fri)</option>
              <option value="Weekends" ${daysVal === 'Weekends' ? 'selected' : ''}>Weekends (Sat-Sun)</option>
              <option value="Mon,Wed,Fri" ${daysVal === 'Mon,Wed,Fri' ? 'selected' : ''}>Mon, Wed, Fri</option>
              <option value="Tue,Thu,Sat" ${daysVal === 'Tue,Thu,Sat' ? 'selected' : ''}>Tue, Thu, Sat</option>
              <option value="Sat" ${daysVal === 'Sat' ? 'selected' : ''}>Saturdays Only</option>
              <option value="Sun" ${daysVal === 'Sun' ? 'selected' : ''}>Sundays Only</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Slot Focus (${hrs} hrs • ${daysCount === 7 ? 'Daily' : daysCount + 'd/wk'})</label>
            <input type="text" class="form-input" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" value="${slot.label || 'Study Slot'}" onchange="studyPlannerView.updateModalSlot(${idx}, 'label', this.value)" placeholder="e.g. Morning Theory / Weekend Mock" />
          </div>

          <div style="padding-top: 14px;">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="studyPlannerView.removeModalSlot(${idx})" ${this._modalSlots.length <= 1 ? 'disabled title="Keep at least 1 slot"' : ''}>
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    const dailyHours = (weeklyMinutes / 7 / 60).toFixed(1);
    const weeklyHours = (weeklyMinutes / 60).toFixed(1);
    if (badgeEl) {
      badgeEl.innerText = `Total Capacity: ~${dailyHours} hrs/day (${weeklyHours} hrs/wk across ${this._modalSlots.length} slots)`;
    }
  },

  updateModalSlot(index, field, value) {
    if (this._modalSlots[index]) {
      this._modalSlots[index][field] = value;
      this.renderModalSlots();
    }
  },

  updateModalSlotDays(index, value) {
    if (this._modalSlots[index]) {
      if (value === 'All') this._modalSlots[index].days = ['All'];
      else if (value === 'Weekdays') this._modalSlots[index].days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      else if (value === 'Weekends') this._modalSlots[index].days = ['Sat', 'Sun'];
      else this._modalSlots[index].days = value.split(',').map(s => s.trim());
      this.renderModalSlots();
    }
  },

  addModalSlot(type = 'custom') {
    if (type === 'weekend') {
      this._modalSlots.push({
        start: '09:30',
        end: '13:00',
        label: 'Weekend Syllabus Marathon',
        days: ['Sat', 'Sun']
      });
    } else if (type === 'weekday_evening') {
      this._modalSlots.push({
        start: '19:00',
        end: '22:00',
        label: 'Weekday Evening Problem Solving',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      });
    } else if (type === 'morning') {
      this._modalSlots.push({
        start: '06:30',
        end: '08:30',
        label: 'Morning High-Focus Theory',
        days: ['All']
      });
    } else {
      // Smart addition for a different slot based on existing
      const hasWeekend = this._modalSlots.some(s => {
        const d = Array.isArray(s.days) ? s.days : [s.days];
        return d.includes('Sat') || d.includes('Sun') || d.includes('Weekends');
      });
      if (!hasWeekend) {
        this._modalSlots.push({
          start: '10:00',
          end: '13:00',
          label: 'Weekend Deep Work Marathon',
          days: ['Sat', 'Sun']
        });
      } else {
        this._modalSlots.push({
          start: '21:00',
          end: '23:00',
          label: 'Night Revision & Error Log',
          days: ['All']
        });
      }
    }
    this.renderModalSlots();
  },

  removeModalSlot(index) {
    if (this._modalSlots.length > 1) {
      this._modalSlots.splice(index, 1);
      this.renderModalSlots();
    }
  },

  applyPreset(presetKey) {
    if (presetKey === 'early_bird') {
      this._modalSlots = [
        { start: '06:00', end: '08:30', label: 'Morning Theory & Retrieval', days: ['All'] },
        { start: '19:00', end: '21:30', label: 'Evening PYQ Practice', days: ['All'] }
      ];
    } else if (presetKey === 'college' || presetKey === 'college_split') {
      this._modalSlots = [
        { start: '19:00', end: '22:00', label: 'Weekday Evening Problem Solving', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        { start: '09:30', end: '13:00', label: 'Weekend Syllabus Marathon', days: ['Sat', 'Sun'] },
        { start: '16:00', end: '19:00', label: 'Weekend PYQs & Mock Tests', days: ['Sat', 'Sun'] }
      ];
    } else if (presetKey === 'full_time') {
      this._modalSlots = [
        { start: '08:00', end: '11:00', label: 'Shift 1: Core Subject Theory', days: ['All'] },
        { start: '14:00', end: '16:30', label: 'Shift 2: Problem Solving Marathon', days: ['All'] },
        { start: '19:30', end: '22:30', label: 'Shift 3: PYQ Trap Analysis & Mocks', days: ['All'] }
      ];
    } else if (presetKey === 'tuition') {
      this._modalSlots = [
        { start: '06:30', end: '08:30', label: 'Morning Retrieval Drill', days: ['Mon', 'Wed', 'Fri'] },
        { start: '16:00', end: '19:00', label: 'Self Study & Practice', days: ['Mon', 'Wed', 'Fri'] },
        { start: '19:30', end: '22:30', label: 'Evening Revision & PYQs', days: ['Tue', 'Thu', 'Sat'] }
      ];
    } else if (presetKey === 'night_owl') {
      this._modalSlots = [
        { start: '14:00', end: '16:00', label: 'Afternoon Practice Drill', days: ['All'] },
        { start: '21:30', end: '01:00', label: 'Late Night High-Focus Drill', days: ['All'] }
      ];
    }
    this.renderModalSlots();
  },

  async handleRegenerateSubmit(e) {
    e.preventDefault();
    const mode = document.getElementById('regen-mode').value;
    const date = document.getElementById('regen-date').value || null;

    if (!this._modalSlots || this._modalSlots.length === 0) {
      toast.error('Please configure at least one free study time slot.');
      return;
    }

    try {
      await window.api.generateStudyPlan({
        prep_mode: mode,
        time_slots: this._modalSlots,
        target_exam_date: date
      });

      modal.close();
      toast.success('Roadmap and timetable regenerated based on your free time slots!');
      this.render();
    } catch (err) {
      toast.error('Regeneration failed: ' + err.message);
    }
  },

  // -------------------------------------------------------------
  // CATEGORY MODALS: BEGINNER, INTERMEDIATE & REVISION
  // -------------------------------------------------------------
  async openBeginnerModal() {
    try {
      const guidance = await window.api.getPrepGuidance(this.examCache?.id, 'beginner');
      const topics = guidance.topics || [];

      modal.open({
        title: '🌱 Beginner Topic Pathway & Study Hours Distribution',
        content: `
          <div style="max-height: 75vh; overflow-y: auto; padding-right: 4px;">
            <div style="background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 0.625rem; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #312e81; margin: 0 0 0.35rem 0;">
                The Evidence-Based 4-Phase Beginner Formula
              </h4>
              <p style="font-size: 0.8125rem; color: #4338ca; line-height: 1.5; margin: 0;">
                As a beginner, do not attempt tricky MCQs blindly. Master each topic systematically: 
                <strong>40%</strong> Theory & NCERT Concept Reading • <strong>15%</strong> Formula Notes • <strong>25%</strong> Worked Examples • <strong>20%</strong> Level-1 Graded Practice.
              </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${topics.map(t => `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                      <span class="badge badge-slate" style="font-size: 0.7rem;">${t.subject_name}</span>
                      <strong style="font-size: 0.95rem; color: #0f172a; margin-left: 6px;">${t.topic_name}</strong>
                    </div>
                    <span class="badge badge-indigo">⏰ ${t.total_recommended_hours} hrs budget</span>
                  </div>

                  <!-- 4-part visual bar -->
                  <div style="display: flex; height: 6px; border-radius: 9999px; overflow: hidden; margin-bottom: 4px;">
                    <div style="width: 40%; background: #4f46e5;" title="Theory: ${t.time_breakdown.theory.hours}h"></div>
                    <div style="width: 15%; background: #059669;" title="Notes: ${t.time_breakdown.notes.hours}h"></div>
                    <div style="width: 25%; background: #d97706;" title="Worked Examples: ${t.time_breakdown.solved_examples.hours}h"></div>
                    <div style="width: 20%; background: #0284c7;" title="Level-1 Practice: ${t.time_breakdown.graded_practice.hours}h"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: #64748b; margin-bottom: 0.65rem;">
                    <span>Theory (${t.time_breakdown.theory.hours}h)</span>
                    <span>Notes (${t.time_breakdown.notes.hours}h)</span>
                    <span>Worked Examples (${t.time_breakdown.solved_examples.hours}h)</span>
                    <span>Practice (${t.time_breakdown.graded_practice.hours}h)</span>
                  </div>

                  <div style="background: #f8fafc; border-radius: 0.375rem; padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #334155; line-height: 1.45;">
                    <div style="margin-bottom: 3px;"><strong>📚 Recommended Book:</strong> ${t.recommended_textbook}</div>
                    <div style="margin-bottom: 5px;"><strong>🔑 Prerequisites:</strong> ${t.prerequisites}</div>
                    <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">What to prepare:</div>
                    <ul style="margin: 0; padding-left: 1.15rem;">
                      ${t.what_to_prepare.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `
      });
    } catch (err) {
      toast.error('Failed to load beginner guidance: ' + err.message);
    }
  },

  async openMasteryAuditModal() {
    try {
      const data = await window.api.getTopicMastery(this.examCache?.id);
      const topics = data.diagnostic?.topics || [];
      const localRatings = {};
      topics.forEach(t => { localRatings[t.topic_id] = t.mastery_level || 'unstudied'; });

      modal.open({
        title: '🧠 Syllabus Topic Mastery Diagnostic Audit',
        content: `
          <div style="max-height: 75vh; overflow-y: auto; padding-right: 4px;">
            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 0.625rem; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #166534; margin: 0 0 0.35rem 0;">
                Audit Your Syllabus Mastery & Skip Redundant Theory
              </h4>
              <p style="font-size: 0.8125rem; color: #15803d; line-height: 1.5; margin: 0;">
                For topics you mark <strong>Mastered</strong>, our AI planner eliminates repetitive concept reading, saving study time and reallocating your daily slots toward speed drills (<1.5 min/Q) and your gap areas.
              </p>
            </div>

            <!-- Interactive topics list -->
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
              ${topics.map(t => {
                const cur = localRatings[t.topic_id];
                return `
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                      <span class="badge badge-slate" style="font-size: 0.65rem;">${t.subject_name}</span>
                      <strong style="font-size: 0.875rem; color: #0f172a; margin-left: 4px;">${t.topic_name}</strong>
                    </div>

                    <div style="display: flex; gap: 4px;">
                      <button type="button" 
                              onclick="studyPlannerView.setModalTopicMastery('${t.topic_id}', 'mastered')" 
                              id="modal-btn-${t.topic_id}-mastered" 
                              class="btn btn-sm" 
                              style="font-size: 0.72rem; padding: 0.25rem 0.55rem; border-radius: 9999px; ${cur === 'mastered' ? 'background: #10b981; color: #ffffff; font-weight: 700;' : 'background: #f1f5f9; color: #475569;'}">
                        🟢 Mastered
                      </button>
                      <button type="button" 
                              onclick="studyPlannerView.setModalTopicMastery('${t.topic_id}', 'needs_practice')" 
                              id="modal-btn-${t.topic_id}-needs_practice" 
                              class="btn btn-sm" 
                              style="font-size: 0.72rem; padding: 0.25rem 0.55rem; border-radius: 9999px; ${cur === 'needs_practice' ? 'background: #f59e0b; color: #ffffff; font-weight: 700;' : 'background: #f1f5f9; color: #475569;'}">
                        🟡 Practice
                      </button>
                      <button type="button" 
                              onclick="studyPlannerView.setModalTopicMastery('${t.topic_id}', 'unstudied')" 
                              id="modal-btn-${t.topic_id}-unstudied" 
                              class="btn btn-sm" 
                              style="font-size: 0.72rem; padding: 0.25rem 0.55rem; border-radius: 9999px; ${cur === 'unstudied' ? 'background: #ef4444; color: #ffffff; font-weight: 700;' : 'background: #f1f5f9; color: #475569;'}">
                        🔴 Gap
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button class="btn btn-secondary" onclick="modal.close()">Cancel</button>
              <button class="btn btn-primary" onclick="studyPlannerView.saveModalMasteryAndRegenerate()" id="btn-modal-save-mastery" style="font-weight: 700;">
                💾 Save & Re-Optimize Roadmap
              </button>
            </div>
          </div>
        `
      });

      this._modalLocalRatings = localRatings;
    } catch (err) {
      toast.error('Failed to load topic mastery audit: ' + err.message);
    }
  },

  setModalTopicMastery(topicId, level) {
    if (!this._modalLocalRatings) this._modalLocalRatings = {};
    this._modalLocalRatings[topicId] = level;

    ['mastered', 'needs_practice', 'unstudied'].forEach(l => {
      const btn = document.getElementById(`modal-btn-${topicId}-${l}`);
      if (btn) {
        if (l === level) {
          if (l === 'mastered') {
            btn.style.background = '#10b981';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
          } else if (l === 'needs_practice') {
            btn.style.background = '#f59e0b';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
          } else {
            btn.style.background = '#ef4444';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
          }
        } else {
          btn.style.background = '#f1f5f9';
          btn.style.color = '#475569';
          btn.style.fontWeight = 'normal';
        }
      }
    });
  },

  async saveModalMasteryAndRegenerate() {
    const btn = document.getElementById('btn-modal-save-mastery');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Optimizing...`;
    }

    try {
      const ratings = Object.entries(this._modalLocalRatings || {}).map(([topic_id, mastery_level]) => ({
        topic_id,
        mastery_level
      }));

      await window.api.saveTopicMastery({
        exam_id: this.examCache?.id,
        ratings,
        regenerate_plan: true
      });

      modal.close();
      toast.success('🎉 Roadmap re-optimized to match your updated syllabus mastery!');
      this.render();
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `💾 Save & Re-Optimize Roadmap`;
      }
      toast.error('Failed to save mastery: ' + err.message);
    }
  },

  async openRevisionMatrixModal() {
    try {
      const guidance = await window.api.getPrepGuidance(this.examCache?.id, 'revision');
      const matrix = guidance.protocol?.priority_matrix || {};
      const routine = guidance.protocol?.all_time_revision_routine || [];

      modal.open({
        title: '🔥 High-Yield Priority Matrix & Revision Protocol',
        content: `
          <div style="max-height: 75vh; overflow-y: auto; padding-right: 4px;">
            
            <!-- Protocol Routine -->
            <div style="background: #fdf2f8; border: 1.5px solid #fbcfe8; border-radius: 0.625rem; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
              <h4 style="font-size: 0.95rem; font-weight: 800; color: #831843; margin: 0 0 0.35rem 0;">
                The All-Time Continuous Revision Protocol
              </h4>
              <p style="font-size: 0.8125rem; color: #9d174d; line-height: 1.5; margin: 0 0 0.75rem 0;">
                Follow this daily cadence to build exam stamina, prevent forgetting curves, and master authentic question formats.
              </p>

              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${routine.map(r => `
                  <div style="background: #ffffff; border-radius: 0.375rem; padding: 0.65rem 0.85rem; border-left: 3px solid #db2777;">
                    <div style="font-weight: 800; font-size: 0.8125rem; color: #0f172a;">${r.time}: ${r.title}</div>
                    <div style="font-size: 0.75rem; color: #475569; margin-top: 2px;">${r.action}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Priority Matrix -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem;">
              <!-- Tier 1 -->
              <div style="background: #ffffff; border: 1.5px solid #f472b6; border-radius: 0.5rem; padding: 1rem;">
                <div style="font-weight: 800; color: #9d174d; font-size: 0.875rem; margin-bottom: 4px;">
                  🔥 Tier 1: High-Yield Chapters (~55-65% Exam Marks)
                </div>
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">Top timetable priority. Revise these weekly with full-length PYQ sprints.</div>
                <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                  ${(matrix.tier_1?.topics || []).map(t => `<span class="badge badge-pink" style="font-size: 0.72rem;">${t.topic_name}</span>`).join('')}
                </div>
              </div>

              <!-- Tier 2 -->
              <div style="background: #ffffff; border: 1.5px solid #86efac; border-radius: 0.5rem; padding: 1rem;">
                <div style="font-weight: 800; color: #15803d; font-size: 0.875rem; margin-bottom: 4px;">
                  ⚡ Tier 2: Core Syllabus Topics (~25-30% Exam Marks)
                </div>
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">Fast-track with formula sheets and targeted problem batches.</div>
                <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                  ${(matrix.tier_2?.topics || []).map(t => `<span class="badge badge-emerald" style="font-size: 0.72rem;">${t.topic_name}</span>`).join('')}
                </div>
              </div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
              <span style="font-size: 0.75rem; color: #64748b;">Solving official PYQs yields 3.4x higher retention than generic questions.</span>
              <button class="btn btn-primary" onclick="modal.close(); router.navigate('pyq');" style="font-weight: 700;">
                🚀 Launch Timed PYQ Practice
              </button>
            </div>
          </div>
        `
      });
    } catch (err) {
      toast.error('Failed to load revision matrix: ' + err.message);
    }
  }
};

window.studyPlannerView = studyPlannerView;

// SPPS Automatic Timetable View
// Formats balanced study sessions matching the student's exact free time slots, with "What to Study" & "How to Study" execution guidance.

const timetableView = {
  activeDay: 'All',
  sessionsCache: [],
  timeSlotsCache: [],
  _modalSlots: [],
  _stopwatchInterval: null,
  _stopwatchSeconds: 0,
  _isStopwatchRunning: false,

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading your weekly study timetable and free time slots...
      </div>
    `;

    try {
      const res = await window.api.getTimetable();
      const sessions = res.sessions || [];
      this.sessionsCache = sessions;
      this.timeSlotsCache = res.time_slots || [];

      const totalScheduledMinutes = sessions.reduce((acc, s) => {
        const [sh, sm] = s.start_time.split(':').map(Number);
        const [eh, em] = s.end_time.split(':').map(Number);
        let dur = (eh * 60 + em) - (sh * 60 + sm);
        if (dur <= 0) dur += 24 * 60;
        return acc + dur;
      }, 0);

      const completedSessions = sessions.filter(s => s.status === 'completed');
      const totalHours = (totalScheduledMinutes / 60).toFixed(1);

      const formattedSlots = this.timeSlotsCache.map(s => {
        if (typeof s === 'object' && s !== null) {
          const daysStr = s.daysDisplay || (s.days ? (Array.isArray(s.days) ? (s.days.includes('All') ? 'Daily' : s.days.join(',')) : s.days) : 'Daily');
          return `${s.start}-${s.end} (${daysStr})`;
        }
        return typeof s === 'string' ? s : `${s.start}-${s.end}`;
      }).join(' • ');

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1250px; margin: 0 auto;">
          <!-- Header Banner -->
          <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; flex-wrap: wrap;">
                  <span class="badge badge-teal">Conflict-Free Scheduling</span>
                  <span class="badge badge-emerald">⏰ Free Slots: ${formattedSlots || 'Configured'}</span>
                </div>
                <h1 style="font-size: 1.75rem; font-weight: 800;">Weekly Study Timetable</h1>
                <p style="font-size: 0.875rem; color: #c7d2fe; margin-top: 4px;">
                  Automatic session allocation strictly fitted to your defined free study intervals with balanced subject rotation.
                </p>
              </div>

              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" onclick="timetableView.openConfigureSlotsModal()">
                  ⏰ Configure Free Time Slots
                </button>
                <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" onclick="timetableView.openAddSessionModal()">
                  ${window.icons.plus || '+'} Add Custom Session
                </button>
                <button class="btn btn-accent btn-sm" onclick="timetableView.handleRegenerate()">
                  ${window.icons.refreshCw || '↻'} Auto-Regenerate
                </button>
              </div>
            </div>

            <!-- Stats Bar -->
            <div style="display: flex; gap: 2.5rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.15); flex-wrap: wrap;">
              <div>
                <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Total Scheduled</div>
                <div style="font-size: 1.35rem; font-weight: 800;">${totalHours} hrs / week</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Sessions</div>
                <div style="font-size: 1.35rem; font-weight: 800;">${sessions.length} sessions</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #c7d2fe; text-transform: uppercase; font-weight: 600;">Completed</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: #34d399;">${completedSessions.length} done</div>
              </div>
            </div>
          </div>

          <!-- Day Filter Buttons -->
          <div class="spps-card" style="padding: 0.85rem 1.25rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: #64748b; margin-right: 0.5rem;">View Day:</span>
              ${['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
                <button class="btn btn-sm ${this.activeDay === day ? 'btn-primary' : 'btn-secondary'}" onclick="timetableView.filterDay('${day}')">
                  ${day}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Timetable Grid -->
          <div id="timetable-sessions-grid" class="grid-cols-auto-fit">
            ${this.renderSessions()}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">${err.message}</div>`;
    }
  },

  renderSessions() {
    let filtered = this.sessionsCache;
    if (this.activeDay !== 'All') {
      filtered = filtered.filter(s => s.day_of_week === this.activeDay);
    }

    if (!filtered.length) {
      return `
        <div class="spps-card" style="grid-column: 1/-1; padding: 3rem; text-align: center; color: #64748b;">
          No sessions scheduled for ${this.activeDay}. Click "Auto-Regenerate" to build schedule matching your free time slots.
        </div>
      `;
    }

    return filtered.map(s => {
      const isCompleted = s.status === 'completed';
      return `
        <div class="spps-card hover-lift" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid ${isCompleted ? '#10b981' : '#4f46e5'}; background: ${isCompleted ? '#f0fdf4' : '#ffffff'};">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-indigo">${s.day_of_week}</span>
              <span style="font-size: 0.78125rem; font-weight: 800; color: #4338ca; background: #e0e7ff; padding: 2px 8px; border-radius: 4px;">
                ⏰ ${s.start_time} - ${s.end_time}
              </span>
            </div>

            <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; line-height: 1.4; text-decoration: ${isCompleted ? 'line-through' : 'none'};">
              ${s.title}
            </h3>

            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem; flex-wrap: wrap;">
              <span style="font-weight: 700; color: #1e293b;">${s.subject_name || 'General Subject'}</span>
              <span>•</span>
              <span class="badge badge-slate" style="font-size: 0.65rem;">${s.activity_type}</span>
            </div>

            ${s.notes ? `
              <div style="font-size: 0.75rem; color: #475569; background: #f8fafc; padding: 0.4rem 0.6rem; border-radius: 0.35rem; margin-bottom: 0.75rem; border: 1px solid #f1f5f9;">
                🎯 <strong>Goal:</strong> ${s.notes}
              </div>
            ` : ''}
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer;">
                <input type="checkbox" class="custom-checkbox" ${isCompleted ? 'checked' : ''} onchange="timetableView.toggleSessionComplete('${s.id}', this.checked)" />
                <span style="color: ${isCompleted ? '#059669' : '#475569'};">${isCompleted ? 'Completed' : 'Mark Done'}</span>
              </label>

              <button class="btn btn-primary btn-sm" style="padding: 3px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;" onclick="timetableView.openSessionProtocolModal('${s.id}')">
                <span>🧠</span> Study Format
              </button>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 0.7rem; color: #64748b;" onclick="timetableView.openRescheduleModal('${s.id}')">
                Reschedule
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openSessionProtocolModal(sessionId) {
    const session = this.sessionsCache.find(s => s.id === sessionId);
    if (!session) return;

    let how = session.how_to_study || {};
    if (typeof how === 'string') {
      try { how = JSON.parse(how); } catch (e) { how = {}; }
    }
    const microPhases = how.micro_phases || [];
    const techniques = how.cognitive_techniques || [];
    const checklist = how.checklist || [];

    const content = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Header Strip -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 1.25rem 1.5rem; border-radius: 0.65rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
            <div>
              <span class="badge badge-emerald" style="margin-bottom: 4px;">${session.day_of_week} • ${session.start_time} to ${session.end_time}</span>
              <h3 style="font-size: 1.2rem; font-weight: 800; margin-top: 4px;">${session.title}</h3>
              <p style="font-size: 0.8125rem; color: #c7d2fe; margin-top: 2px;">
                Subject: <strong>${session.subject_name || 'General'}</strong> • Activity: <strong>${session.activity_type}</strong>
              </p>
            </div>
          </div>
        </div>

        <!-- Section 1: WHAT TO STUDY -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem 1.25rem; border-left: 4px solid #3b82f6;">
          <h4 style="font-size: 0.9375rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
            <span>🎯</span> WHAT TO STUDY IN THIS SLOT
          </h4>
          <div style="font-size: 0.8125rem; color: #334155; margin-top: 6px; line-height: 1.5;">
            ${session.notes || `Focus thoroughly on the primary concepts, formulas, and high-frequency problem types for ${session.title}.`}
          </div>
        </div>

        <!-- Section 2: HOW TO STUDY -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem 1.25rem; border-left: 4px solid #10b981;">
          <h4 style="font-size: 0.9375rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
            <span>🧠</span> HOW TO STUDY (EXECUTION PROTOCOL)
          </h4>
          <div style="font-weight: 700; color: #4338ca; font-size: 0.875rem; margin-top: 4px;">
            ${how.method_title || 'Active Concept Deconstruction & Problem Solving'}
          </div>
          <p style="font-size: 0.8125rem; color: #475569; margin-top: 2px; line-height: 1.4;">
            ${how.overview || 'Follow this timed sequence for peak concentration and retention.'}
          </p>

          <!-- Micro-Phases -->
          ${microPhases.length > 0 ? `
            <div style="margin-top: 1rem;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">
                ⏱ Step-by-Step Timed Protocol:
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${microPhases.map(mp => `
                  <div style="display: flex; align-items: flex-start; gap: 0.75rem; background: #ffffff; padding: 0.5rem 0.75rem; border-radius: 0.35rem; border: 1px solid #e2e8f0;">
                    <span class="badge badge-indigo" style="font-weight: 700; white-space: nowrap; font-size: 0.7rem;">${mp.minutes} min</span>
                    <div>
                      <strong style="font-size: 0.8125rem; color: #0f172a;">${mp.phase}</strong>
                      <div style="font-size: 0.75rem; color: #475569; margin-top: 2px; line-height: 1.4;">${mp.action}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Cognitive Techniques & Checklist -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1;">
            ${techniques.length > 0 ? `
              <div>
                <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
                  🧠 Cognitive Techniques:
                </div>
                <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                  ${techniques.map(t => `<span class="badge badge-teal" style="font-size: 0.68rem;">${t}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            ${checklist.length > 0 ? `
              <div>
                <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
                  📋 Action Checklist:
                </div>
                <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.75rem; color: #334155; line-height: 1.4;">
                  ${checklist.map(c => `<li>${c}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          ${how.mistakes_advice ? `
            <div style="margin-top: 0.75rem; padding: 0.45rem 0.65rem; background: #fff1f2; border-radius: 0.35rem; border-left: 3px solid #f43f5e; font-size: 0.75rem; color: #9f1239;">
              <strong>⚠️ Common Trap:</strong> ${how.mistakes_advice}
            </div>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer;">
            <input type="checkbox" class="custom-checkbox" ${session.status === 'completed' ? 'checked' : ''} onchange="timetableView.toggleSessionComplete('${session.id}', this.checked); modal.close();" />
            <span>Mark Session Complete</span>
          </label>

          <button type="button" class="btn btn-primary btn-sm" onclick="modal.close()">
            Close Study Protocol
          </button>
        </div>
      </div>
    `;

    modal.open(`Study Protocol: ${session.title}`, content, 'modal-content-lg');
  },

  filterDay(day) {
    this.activeDay = day;
    this.render();
  },

  async toggleSessionComplete(sessionId, isChecked) {
    try {
      await window.api.updateTimetableSession(sessionId, {
        status: isChecked ? 'completed' : 'scheduled'
      });
      toast.success(isChecked ? 'Study session completed!' : 'Session rescheduled.');
      this.render();
    } catch (e) {
      toast.error('Failed to update session');
    }
  },

  async handleRegenerate() {
    try {
      await window.api.generateTimetable();
      toast.success('Timetable regenerated with balanced subject rotation!');
      this.render();
    } catch (err) {
      toast.error('Regeneration failed: ' + err.message);
    }
  },

  // ------------------------------------------------------------------------
  // FREE TIME SLOTS CONFIGURATION MODAL
  // ------------------------------------------------------------------------
  openConfigureSlotsModal() {
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
      <form onsubmit="timetableView.handleSaveSlotsSubmit(event)">
        <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem;">
          Configure your <strong>free study time slots</strong>. You can configure <em>different time slots for different days</em> (e.g. Weekday evenings vs Weekend marathons). The timetable will allocate sessions strictly into your available windows for each day!
        </p>

        <!-- Presets -->
        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.35rem;">Quick Schedule Presets:</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="timetableView.applyPreset('college_split')">
              📅 Weekday + Weekend Split (~4.1h/day)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="timetableView.applyPreset('early_bird')">
              🌅 Early Bird Daily (5.0h)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="timetableView.applyPreset('full_time')">
              ⚡ Full-Time 3-Shift (8.5h)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="timetableView.applyPreset('tuition')">
              🌓 Alternate Tuition (4.0h)
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="timetableView.applyPreset('night_owl')">
              🌙 Night Owl (5.5h)
            </button>
          </div>
        </div>

        <!-- Dynamic Slots List -->
        <div id="tt-slots-list" style="display: flex; flex-direction: column; gap: 0.65rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem;">
          <!-- Populated by renderModalSlots() -->
        </div>

        <!-- Different Time Slot Action Buttons -->
        <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="timetableView.addModalSlot('different')" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 700;">
              <span style="font-size: 1.1rem; line-height: 1;">+</span> Add Different Time Slot
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="timetableView.addModalSlot('weekend')" style="font-size: 0.75rem;">
              📅 + Weekend Marathon Slot
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="timetableView.addModalSlot('weekday_evening')" style="font-size: 0.75rem;">
              🌆 + Weekday Evening Slot
            </button>
          </div>
          <div id="tt-modal-total-badge" class="badge badge-emerald" style="font-size: 0.8125rem;">
            Total: Calculating...
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1.25rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Free Slots & Update Timetable</button>
        </div>
      </form>
    `;

    modal.open('Configure Free Study Time Slots', content, 'modal-content-lg');
    this.renderModalSlots();
  },

  renderModalSlots() {
    const listEl = document.getElementById('tt-slots-list');
    const badgeEl = document.getElementById('tt-modal-total-badge');
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
            <input type="time" class="form-input" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" value="${slot.start}" onchange="timetableView.updateModalSlot(${idx}, 'start', this.value)" required />
          </div>

          <div>
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">End Time</label>
            <input type="time" class="form-input" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" value="${slot.end}" onchange="timetableView.updateModalSlot(${idx}, 'end', this.value)" required />
          </div>

          <div>
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Active Days</label>
            <select class="form-select" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" onchange="timetableView.updateModalSlotDays(${idx}, this.value)">
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
            <label style="font-size: 0.7rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Slot Label (${hrs} hrs • ${daysCount === 7 ? 'Daily' : daysCount + 'd/wk'})</label>
            <input type="text" class="form-input" style="padding: 0.3rem 0.5rem; font-size: 0.8125rem;" value="${slot.label || 'Study Slot'}" onchange="timetableView.updateModalSlot(${idx}, 'label', this.value)" placeholder="e.g. Morning Focus / Weekend Mock" />
          </div>

          <div style="padding-top: 14px;">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="timetableView.removeModalSlot(${idx})" ${this._modalSlots.length <= 1 ? 'disabled title="Keep at least 1 slot"' : ''}>
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
    this.renderModalSlots();
  },

  async handleSaveSlotsSubmit(e) {
    e.preventDefault();
    if (!this._modalSlots || this._modalSlots.length === 0) {
      toast.error('Please configure at least one free time slot.');
      return;
    }

    try {
      await window.api.generateTimetable(this._modalSlots);
      modal.close();
      toast.success('Timetable regenerated matching your free study time slots!');
      this.render();
    } catch (err) {
      toast.error('Failed to update timetable: ' + err.message);
    }
  },

  openAddSessionModal() {
    const content = `
      <form onsubmit="timetableView.handleAddSessionSubmit(event)">
        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Day of Week</label>
            <select id="add-sess-day" class="form-select">
              ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Activity Type</label>
            <select id="add-sess-type" class="form-select">
              <option value="Concept Reading">Concept Reading</option>
              <option value="Practice MCQs">Practice MCQs</option>
              <option value="PYQ Review">PYQ Review</option>
              <option value="Formula Revision">Formula Revision</option>
              <option value="Mock Test">Mock Test</option>
            </select>
          </div>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Start Time</label>
            <input type="time" id="add-sess-start" class="form-input" value="09:00" required />
          </div>
          <div class="form-group">
            <label class="form-label">End Time</label>
            <input type="time" id="add-sess-end" class="form-input" value="10:30" required />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">Session Title</label>
          <input type="text" id="add-sess-title" class="form-input" placeholder="e.g. Physics: Rotational Motion Drill" required />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Session</button>
        </div>
      </form>
    `;
    modal.open('Add Custom Study Session', content);
  },

  async handleAddSessionSubmit(e) {
    e.preventDefault();
    const day = document.getElementById('add-sess-day').value;
    const type = document.getElementById('add-sess-type').value;
    const start = document.getElementById('add-sess-start').value;
    const end = document.getElementById('add-sess-end').value;
    const title = document.getElementById('add-sess-title').value.trim();

    try {
      await window.api.addTimetableSession({
        day_of_week: day,
        activity_type: type,
        start_time: start,
        end_time: end,
        title
      });
      modal.close();
      toast.success('Custom session added!');
      this.render();
    } catch (err) {
      toast.error('Failed to add session: ' + err.message);
    }
  },

  openRescheduleModal(sessionId) {
    const session = this.sessionsCache.find(s => s.id === sessionId);
    if (!session) return;

    const content = `
      <form onsubmit="timetableView.handleRescheduleSubmit(event, '${sessionId}')">
        <div class="form-group">
          <label class="form-label">Day of Week</label>
          <select id="resched-day" class="form-select">
            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `
              <option value="${d}" ${d === session.day_of_week ? 'selected' : ''}>${d}</option>
            `).join('')}
          </select>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1.25rem;">
          <div>
            <label class="form-label">Start Time</label>
            <input type="time" id="resched-start" class="form-input" value="${session.start_time}" required />
          </div>
          <div>
            <label class="form-label">End Time</label>
            <input type="time" id="resched-end" class="form-input" value="${session.end_time}" required />
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
          <button type="button" class="btn btn-danger btn-sm" onclick="timetableView.handleDeleteSession('${sessionId}')">
            Delete Session
          </button>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </form>
    `;

    modal.open(`Reschedule: ${session.title}`, content);
  },

  async handleRescheduleSubmit(e, sessionId) {
    e.preventDefault();
    const day = document.getElementById('resched-day').value;
    const start = document.getElementById('resched-start').value;
    const end = document.getElementById('resched-end').value;

    try {
      await window.api.updateTimetableSession(sessionId, {
        day_of_week: day,
        start_time: start,
        end_time: end
      });
      modal.close();
      toast.success('Session rescheduled!');
      this.render();
    } catch (err) {
      toast.error('Reschedule failed: ' + err.message);
    }
  },

  async handleDeleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this study session?')) return;
    try {
      await window.api.deleteTimetableSession(sessionId);
      modal.close();
      toast.info('Session removed.');
      this.render();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  }
};

window.timetableView = timetableView;

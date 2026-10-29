// SPPS Profile & Settings View
// Allows updating student details, education level, session preferences, and free study time slots.

const profileSettingsView = {
  _slots: [],

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Loading profile and study settings...
      </div>
    `;

    try {
      const me = await window.api.getMe();
      const user = me.user;
      const activeExam = me.activeExam;

      // Parse user's time slots
      let rawSlots = [
        { start: '07:00', end: '09:00', label: 'Morning Deep Work', days: ['All'] },
        { start: '18:30', end: '21:00', label: 'Evening Practice & PYQs', days: ['All'] }
      ];

      try {
        let parsed = user.time_slots;
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawSlots = parsed.map((s, idx) => {
            if (typeof s === 'string') {
              const [start, end] = s.split('-');
              return { start: start.trim(), end: end.trim(), label: `Study Slot ${idx + 1}`, days: ['All'] };
            }
            return {
              start: s.start || '08:00',
              end: s.end || '10:00',
              label: s.label || `Study Slot ${idx + 1}`,
              days: s.days || ['All']
            };
          });
        }
      } catch (e) {
        // Keep default
      }

      this._slots = JSON.parse(JSON.stringify(rawSlots));

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 900px; margin: 0 auto;">
          <!-- Banner -->
          <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
            <div style="display: flex; align-items: center; gap: 1.25rem;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;">
                ${user.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h1 style="font-size: 1.75rem; font-weight: 800;">${user.full_name}</h1>
                <p style="font-size: 0.875rem; color: #c7d2fe;">${user.email} • Preparing for <strong>${activeExam?.name || 'Competitive Examination'}</strong></p>
              </div>
            </div>
          </div>

          <!-- Profile Form -->
          <div class="spps-card" style="padding: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem;">Student Profile Information</h2>

            <form onsubmit="profileSettingsView.handleSave(event)">
              <div class="grid-cols-2" style="margin-bottom: 1.25rem;">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" id="prof-name" class="form-input" value="${user.full_name}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-input" value="${user.email}" disabled style="background: #f1f5f9; cursor: not-allowed;" />
                </div>
              </div>

              <div class="grid-cols-2" style="margin-bottom: 1.25rem;">
                <div class="form-group">
                  <label class="form-label">Education Stage</label>
                  <select id="prof-stage" class="form-select">
                    <option value="after_10" ${user.education_level === 'after_10' ? 'selected' : ''}>After Class 10 (Polytechnic / ITI)</option>
                    <option value="after_12" ${user.education_level === 'after_12' ? 'selected' : ''}>After Class 12 (JEE, NEET, CUET, NDA, CLAT)</option>
                    <option value="after_grad" ${user.education_level === 'after_grad' ? 'selected' : ''}>After Graduation (UPSC, SSC, Banking, GATE, CAT)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Preferred Session Length (Minutes)</label>
                  <select id="prof-duration" class="form-select">
                    <option value="45" ${user.session_duration_minutes === 45 ? 'selected' : ''}>45 Minutes (Pomodoro)</option>
                    <option value="60" ${user.session_duration_minutes === 60 ? 'selected' : ''}>60 Minutes (Standard)</option>
                    <option value="90" ${user.session_duration_minutes === 90 ? 'selected' : ''}>90 Minutes (Deep Focus)</option>
                    <option value="120" ${user.session_duration_minutes === 120 ? 'selected' : ''}>120 Minutes (Full Exam Simulation)</option>
                  </select>
                </div>
              </div>

              <!-- Free Study Time Slots Section -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <div>
                    <label class="form-label" style="margin: 0; font-weight: 800; color: #0f172a;">⏰ When Are You Free for Studying?</label>
                    <div style="font-size: 0.75rem; color: #64748b;">The timetable and roadmap will allocate study sessions into these exact intervals.</div>
                  </div>
                  <div id="prof-total-badge" class="badge badge-emerald" style="font-size: 0.8125rem;">
                    Daily: ${user.daily_hours || 4.5} hrs/day
                  </div>
                </div>

                <!-- Presets -->
                <div style="margin-bottom: 0.75rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.35rem;">Quick Schedule Presets:</div>
                  <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;" onclick="profileSettingsView.applyPreset('college_split')">
                      📅 Weekday + Weekend Split (~4.1h/day)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;" onclick="profileSettingsView.applyPreset('early_bird')">
                      🌅 Early Bird Daily (5.0h)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;" onclick="profileSettingsView.applyPreset('full_time')">
                      ⚡ Full-Time 3-Shift (8.5h)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;" onclick="profileSettingsView.applyPreset('tuition')">
                      🌓 Alternate Tuition (4.0h)
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;" onclick="profileSettingsView.applyPreset('night_owl')">
                      🌙 Night Owl (5.5h)
                    </button>
                  </div>
                </div>

                <div id="prof-slots-list" style="display: flex; flex-direction: column; gap: 0.6rem;">
                  <!-- Rendered by renderSlots() -->
                </div>

                <!-- Action Buttons to Add Different Time Slots -->
                <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                  <button type="button" class="btn btn-primary btn-sm" onclick="profileSettingsView.addSlot('different')" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 700;">
                    <span style="font-size: 1.1rem; line-height: 1;">+</span> Add Different Time Slot
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" onclick="profileSettingsView.addSlot('weekend')" style="font-size: 0.72rem;">
                    📅 + Weekend Marathon Slot
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" onclick="profileSettingsView.addSlot('weekday_evening')" style="font-size: 0.72rem;">
                    🌆 + Weekday Evening Slot
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" onclick="profileSettingsView.addSlot('morning')" style="font-size: 0.72rem;">
                    🌅 + Morning Theory Slot
                  </button>
                </div>
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="submit" class="btn btn-primary">Save Profile & Free Time Slots</button>
              </div>
            </form>
          </div>

          <!-- Account Security & Sign Out -->
          <div class="spps-card" style="padding: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Account Actions</h2>
            <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem;">
              Sign out from your active session on this device.
            </p>
            <button class="btn btn-danger" onclick="authModal.logout()">
              ${window.icons.logOut || '🚪'} Sign Out of SPPS
            </button>
          </div>
        </div>
      `;

      this.renderSlots();
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">${err.message}</div>`;
    }
  },

  renderSlots() {
    const listEl = document.getElementById('prof-slots-list');
    const badgeEl = document.getElementById('prof-total-badge');
    if (!listEl) return;

    let weeklyMinutes = 0;

    listEl.innerHTML = this._slots.map((slot, idx) => {
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
        <div style="display: grid; grid-template-columns: 120px 120px 165px 1fr auto; gap: 0.5rem; align-items: center; background: #ffffff; padding: 0.65rem 0.85rem; border-radius: 0.35rem; border: 1px solid #e2e8f0;">
          <div>
            <label style="font-size: 0.68rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Start Time</label>
            <input type="time" class="form-input" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;" value="${slot.start}" onchange="profileSettingsView.updateSlot(${idx}, 'start', this.value)" required />
          </div>

          <div>
            <label style="font-size: 0.68rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">End Time</label>
            <input type="time" class="form-input" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;" value="${slot.end}" onchange="profileSettingsView.updateSlot(${idx}, 'end', this.value)" required />
          </div>

          <div>
            <label style="font-size: 0.68rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Active Days</label>
            <select class="form-select" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;" onchange="profileSettingsView.updateSlotDays(${idx}, this.value)">
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
            <label style="font-size: 0.68rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">Slot Label (${hrs} hrs • ${daysCount === 7 ? 'Daily' : daysCount + 'd/wk'})</label>
            <input type="text" class="form-input" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;" value="${slot.label || 'Study Slot'}" onchange="profileSettingsView.updateSlot(${idx}, 'label', this.value)" placeholder="e.g. Morning Focus / Weekend Mock" />
          </div>

          <div style="padding-top: 14px;">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="profileSettingsView.removeSlot(${idx})" ${this._slots.length <= 1 ? 'disabled title="Keep at least 1 slot"' : ''}>
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    const dailyHours = (weeklyMinutes / 7 / 60).toFixed(1);
    const weeklyHours = (weeklyMinutes / 60).toFixed(1);
    if (badgeEl) {
      badgeEl.innerText = `Total Capacity: ~${dailyHours} hrs/day (${weeklyHours} hrs/wk across ${this._slots.length} slots)`;
    }
  },

  updateSlot(index, field, value) {
    if (this._slots[index]) {
      this._slots[index][field] = value;
      this.renderSlots();
    }
  },

  updateSlotDays(index, value) {
    if (this._slots[index]) {
      if (value === 'All') this._slots[index].days = ['All'];
      else if (value === 'Weekdays') this._slots[index].days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      else if (value === 'Weekends') this._slots[index].days = ['Sat', 'Sun'];
      else this._slots[index].days = value.split(',').map(s => s.trim());
      this.renderSlots();
    }
  },

  addSlot(type = 'custom') {
    if (type === 'weekend') {
      this._slots.push({
        start: '09:30',
        end: '13:00',
        label: 'Weekend Syllabus Marathon',
        days: ['Sat', 'Sun']
      });
    } else if (type === 'weekday_evening') {
      this._slots.push({
        start: '19:00',
        end: '22:00',
        label: 'Weekday Evening Problem Drill',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      });
    } else if (type === 'morning') {
      this._slots.push({
        start: '06:30',
        end: '08:30',
        label: 'Morning High-Focus Theory',
        days: ['All']
      });
    } else {
      const hasWeekend = this._slots.some(s => {
        const d = Array.isArray(s.days) ? s.days : [s.days];
        return d.includes('Sat') || d.includes('Sun') || d.includes('Weekends');
      });
      if (!hasWeekend) {
        this._slots.push({
          start: '10:00',
          end: '13:00',
          label: 'Weekend Deep Work Marathon',
          days: ['Sat', 'Sun']
        });
      } else {
        this._slots.push({
          start: '21:00',
          end: '23:00',
          label: 'Night Revision & Error Log',
          days: ['All']
        });
      }
    }
    this.renderSlots();
  },

  removeSlot(index) {
    if (this._slots.length > 1) {
      this._slots.splice(index, 1);
      this.renderSlots();
    }
  },

  applyPreset(presetKey) {
    if (presetKey === 'early_bird') {
      this._slots = [
        { start: '06:00', end: '08:30', label: 'Morning Concept Focus', days: ['All'] },
        { start: '19:00', end: '21:30', label: 'Evening PYQ Practice', days: ['All'] }
      ];
    } else if (presetKey === 'college' || presetKey === 'college_split') {
      this._slots = [
        { start: '19:00', end: '22:00', label: 'Weekday Evening Problem Drill', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        { start: '09:30', end: '13:00', label: 'Weekend Syllabus Marathon', days: ['Sat', 'Sun'] },
        { start: '16:00', end: '19:00', label: 'Weekend PYQs & Mock Tests', days: ['Sat', 'Sun'] }
      ];
    } else if (presetKey === 'full_time') {
      this._slots = [
        { start: '08:00', end: '11:00', label: 'Shift 1: Core Subject Deep Work', days: ['All'] },
        { start: '14:00', end: '16:30', label: 'Shift 2: Problem Solving Marathon', days: ['All'] },
        { start: '19:30', end: '22:30', label: 'Shift 3: PYQ Trap Analysis & Mocks', days: ['All'] }
      ];
    } else if (presetKey === 'tuition') {
      this._slots = [
        { start: '06:30', end: '08:30', label: 'Morning Retrieval Drill', days: ['Mon', 'Wed', 'Fri'] },
        { start: '16:00', end: '19:00', label: 'Self Study & Practice', days: ['Mon', 'Wed', 'Fri'] },
        { start: '19:30', end: '22:30', label: 'Evening Revision & PYQs', days: ['Tue', 'Thu', 'Sat'] }
      ];
    } else if (presetKey === 'night_owl') {
      this._slots = [
        { start: '14:00', end: '16:00', label: 'Afternoon Practice Drill', days: ['All'] },
        { start: '21:30', end: '01:00', label: 'Late Night High-Focus Drill', days: ['All'] }
      ];
    }
    this.renderSlots();
  },

  async handleSave(e) {
    e.preventDefault();
    const name = document.getElementById('prof-name').value;
    const stage = document.getElementById('prof-stage').value;
    const duration = parseInt(document.getElementById('prof-duration').value, 10);

    try {
      await window.api.updateProfile({
        full_name: name,
        education_level: stage,
        session_duration_minutes: duration,
        time_slots: this._slots
      });

      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      toast.success('Profile preferences and free study time slots saved!');
      this.render();
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    }
  }
};

window.profileSettingsView = profileSettingsView;

// SPPS Authentication Views & Modals
const authModal = {
  currentTab: 'login',

  open(tab = 'login') {
    this.currentTab = tab;
    this.render();
  },

  render() {
    const isLogin = this.currentTab === 'login';
    const title = isLogin ? 'Sign In to SPPS' : 'Create Student Account';

    const contentHtml = `
      <div>
        <div style="display: flex; border-bottom: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
          <button style="flex: 1; padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.9375rem; background: none; border: none; cursor: pointer; border-bottom: 2px solid ${isLogin ? 'var(--indigo-600)' : 'transparent'}; color: ${isLogin ? 'var(--indigo-600)' : 'var(--text-muted)'};" onclick="authModal.switchTab('login')">
            Sign In
          </button>
          <button style="flex: 1; padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.9375rem; background: none; border: none; cursor: pointer; border-bottom: 2px solid ${!isLogin ? 'var(--indigo-600)' : 'transparent'}; color: ${!isLogin ? 'var(--indigo-600)' : 'var(--text-muted)'};" onclick="authModal.switchTab('register')">
            Create Account
          </button>
        </div>

        ${isLogin ? this.renderLoginForm() : this.renderRegisterForm()}
      </div>
    `;

    modal.open(title, contentHtml, 'modal-content');
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  renderLoginForm() {
    return `
      <form id="login-form" onsubmit="authModal.handleLogin(event)">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="login-email" class="form-input" placeholder="student@example.com" required value="demo@spps.edu" />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="login-password" class="form-input" placeholder="••••••••" required value="Demo@12345" />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
          Sign In
        </button>

        <div style="display: flex; align-items: center; margin: 1.25rem 0; gap: 0.75rem;">
          <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Or Quick Access</span>
          <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary" style="width: 100%; border-color: #c7d2fe; color: #4338ca; background: #eef2ff;" onclick="authModal.loginDemo()">
            ⚡ Quick Tour: Demo Student (Aarav - JEE Main)
          </button>
          <button type="button" class="btn btn-secondary" style="width: 100%; border-color: #a7f3d0; color: #065f46; background: #ecfdf5;" onclick="authModal.loginAdminDemo()">
            🛡️ Quick Access: Administrator (Dr. Vikram Malhotra)
          </button>
        </div>
      </form>
    `;
  },

  renderRegisterForm() {
    return `
      <form id="register-form" onsubmit="authModal.handleRegister(event)">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="reg-name" class="form-input" placeholder="e.g. Priya Sharma" required />
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="reg-email" class="form-input" placeholder="priya@example.com" required />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="reg-password" class="form-input" placeholder="At least 6 characters" minlength="6" required />
        </div>

        <div class="grid-cols-2" style="margin-bottom: 1.15rem;">
          <div>
            <label class="form-label">Education Stage</label>
            <select id="reg-stage" class="form-select" onchange="authModal.updateExamOptions(this.value)">
              <option value="after_12">After Class 12</option>
              <option value="after_10">After Class 10</option>
              <option value="after_grad">After Graduation</option>
            </select>
          </div>
          <div>
            <label class="form-label">Target Examination</label>
            <select id="reg-exam" class="form-select">
              <option value="jee-main">JEE Main (Engineering)</option>
              <option value="neet-ug">NEET-UG (Medical)</option>
              <option value="cuet-ug">CUET-UG (Universities)</option>
              <option value="nda">NDA & NA (Defence)</option>
              <option value="clat">CLAT (Law)</option>
              <option value="ssc-chsl">SSC CHSL</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.15rem;">
          <label class="form-label">Preparation Mode</label>
          <select id="reg-mode" class="form-select">
            <option value="beginner">Beginner (Fundamentals & Concepts)</option>
            <option value="intermediate">Intermediate (Practice & Weak Areas)</option>
            <option value="revision">Revision (Rapid High-Yield & PYQs)</option>
          </select>
        </div>

        <!-- Free Study Time Slots: When the student is free -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <label class="form-label" style="margin: 0; font-weight: 700; color: #0f172a;">⏰ When Are You Free to Study?</label>
            <span id="reg-slots-hint" class="badge badge-emerald">4.5 hrs/day</span>
          </div>
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.65rem;">
            Select the daily intervals when you can dedicate uninterrupted study time:
          </div>
          <select id="reg-slots-preset" class="form-select" onchange="authModal.handleSlotPresetChange(this.value)" style="margin-bottom: 0.5rem; font-size: 0.8125rem;">
            <option value="morning_evening">🌅 Morning & Evening Daily (07:00-09:00 & 18:30-21:00) — 4.5 hrs</option>
            <option value="college_split">📅 Weekday Evenings + Weekend Marathons — ~4.1 hrs/day</option>
            <option value="college">🎓 School / College 3-Split (06:30-08:00, 17:30-19:30, 21:00-22:30) — 5.0 hrs</option>
            <option value="full_time">⚡ Full-Time Aspirant 3-Shift (08:00-11:00, 14:00-16:30, 19:30-22:30) — 8.5 hrs</option>
            <option value="night_owl">🌙 Afternoon & Late Night (14:00-16:00 & 21:30-01:00) — 5.5 hrs</option>
            <option value="custom">🛠 Custom Free Slots (Configure Specific Times & Days)</option>
          </select>

          <div id="reg-custom-slots-container" style="display: none; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
            <div id="reg-custom-slots-list" style="display: flex; flex-direction: column; gap: 0.4rem;">
              <!-- Dynamic custom slots list -->
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="authModal.addCustomSlot()" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; align-self: flex-start;">
              <span>+</span> Add Different Time Slot
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
          Create Student Account & Generate Plan
        </button>
      </form>
    `;
  },

  updateExamOptions(stage) {
    const examSelect = document.getElementById('reg-exam');
    if (!examSelect) return;

    if (stage === 'after_10') {
      examSelect.innerHTML = `
        <option value="delhi-cet">Delhi CET (Polytechnic)</option>
        <option value="jeecup">JEECUP (UP Polytechnic)</option>
        <option value="ap-polycet">AP POLYCET</option>
        <option value="iti-aitt">ITI Admissions (NCVT)</option>
      `;
    } else if (stage === 'after_12') {
      examSelect.innerHTML = `
        <option value="jee-main">JEE Main (Engineering)</option>
        <option value="neet-ug">NEET-UG (Medical)</option>
        <option value="cuet-ug">CUET-UG (Universities)</option>
        <option value="nda">NDA & NA (Defence)</option>
        <option value="clat">CLAT (Law)</option>
        <option value="ssc-chsl">SSC CHSL</option>
      `;
    } else {
      examSelect.innerHTML = `
        <option value="upsc-cse">UPSC CSE (Civil Services)</option>
        <option value="ssc-cgl">SSC CGL (Group B/C)</option>
        <option value="ibps-po">IBPS PO (Banking)</option>
        <option value="gate">GATE (M.Tech / PSUs)</option>
        <option value="cat">CAT (IIMs / MBA)</option>
        <option value="ugc-net">UGC NET (Lectureship)</option>
      `;
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await window.api.login(email, password);
      modal.close();
      toast.success(`Welcome back, ${res.user.full_name}!`);
      
      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      router.navigate('dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    }
  },

  handleSlotPresetChange(preset) {
    const hint = document.getElementById('reg-slots-hint');
    const customContainer = document.getElementById('reg-custom-slots-container');

    if (preset === 'custom') {
      if (customContainer) customContainer.style.display = 'flex';
      if (!this._regSlots || this._regSlots.length === 0) {
        this._regSlots = [
          { start: '19:00', end: '22:00', days: 'Weekdays', label: 'Weekday Evening' },
          { start: '09:30', end: '13:00', days: 'Weekends', label: 'Weekend Deep Work' }
        ];
      }
      this.renderCustomSlots();
      if (hint) hint.innerText = 'Custom Schedule';
    } else {
      if (customContainer) customContainer.style.display = 'none';
      if (hint) {
        if (preset === 'full_time') hint.innerText = '8.5 hrs/day';
        else if (preset === 'morning_evening') hint.innerText = '4.5 hrs/day';
        else if (preset === 'college_split') hint.innerText = '~4.1 hrs/day';
        else if (preset === 'college') hint.innerText = '5.0 hrs/day';
        else hint.innerText = '5.5 hrs/day';
      }
    }
  },

  renderCustomSlots() {
    const listEl = document.getElementById('reg-custom-slots-list');
    if (!listEl) return;
    listEl.innerHTML = this._regSlots.map((slot, idx) => `
      <div style="display: grid; grid-template-columns: 85px 85px 115px 1fr auto; gap: 4px; align-items: center; background: #ffffff; padding: 0.35rem 0.5rem; border-radius: 0.25rem; border: 1px solid #e2e8f0;">
        <input type="time" class="form-input" style="padding: 0.2rem 0.35rem; font-size: 0.75rem;" value="${slot.start}" onchange="authModal.updateCustomSlot(${idx}, 'start', this.value)" />
        <input type="time" class="form-input" style="padding: 0.2rem 0.35rem; font-size: 0.75rem;" value="${slot.end}" onchange="authModal.updateCustomSlot(${idx}, 'end', this.value)" />
        <select class="form-select" style="padding: 0.2rem 0.35rem; font-size: 0.75rem;" onchange="authModal.updateCustomSlot(${idx}, 'days', this.value)">
          <option value="All" ${slot.days === 'All' ? 'selected' : ''}>Daily</option>
          <option value="Weekdays" ${slot.days === 'Weekdays' ? 'selected' : ''}>Weekdays</option>
          <option value="Weekends" ${slot.days === 'Weekends' ? 'selected' : ''}>Weekends</option>
          <option value="Mon,Wed,Fri" ${slot.days === 'Mon,Wed,Fri' ? 'selected' : ''}>Mon,Wed,Fri</option>
          <option value="Tue,Thu,Sat" ${slot.days === 'Tue,Thu,Sat' ? 'selected' : ''}>Tue,Thu,Sat</option>
        </select>
        <input type="text" class="form-input" style="padding: 0.2rem 0.35rem; font-size: 0.75rem;" value="${slot.label || ''}" placeholder="Slot Focus" onchange="authModal.updateCustomSlot(${idx}, 'label', this.value)" />
        <button type="button" class="btn btn-outline-danger btn-sm" style="padding: 0.15rem 0.4rem; font-size: 0.7rem;" onclick="authModal.removeCustomSlot(${idx})" ${this._regSlots.length <= 1 ? 'disabled' : ''}>✕</button>
      </div>
    `).join('');
  },

  updateCustomSlot(idx, field, val) {
    if (this._regSlots[idx]) {
      this._regSlots[idx][field] = val;
    }
  },

  addCustomSlot() {
    if (!this._regSlots) this._regSlots = [];
    const hasWeekend = this._regSlots.some(s => s.days === 'Weekends');
    this._regSlots.push({
      start: hasWeekend ? '15:00' : '10:00',
      end: hasWeekend ? '18:00' : '13:00',
      days: 'Weekends',
      label: 'Weekend Practice'
    });
    this.renderCustomSlots();
  },

  removeCustomSlot(idx) {
    if (this._regSlots.length > 1) {
      this._regSlots.splice(idx, 1);
      this.renderCustomSlots();
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const full_name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const education_level = document.getElementById('reg-stage').value;
    const active_exam_id = document.getElementById('reg-exam').value;
    const prep_mode = document.getElementById('reg-mode').value;

    const preset = document.getElementById('reg-slots-preset')?.value || 'morning_evening';
    let time_slots = ["07:00-09:00", "18:30-21:00"];

    if (preset === 'college_split') {
      time_slots = [
        { start: '19:00', end: '22:00', label: 'Weekday Problem Drill', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        { start: '09:30', end: '13:00', label: 'Weekend Syllabus Marathon', days: ['Sat', 'Sun'] },
        { start: '16:00', end: '19:00', label: 'Weekend PYQs & Mocks', days: ['Sat', 'Sun'] }
      ];
    } else if (preset === 'college') {
      time_slots = ["06:30-08:00", "17:30-19:30", "21:00-22:30"];
    } else if (preset === 'full_time') {
      time_slots = ["08:00-11:00", "14:00-16:30", "19:30-22:30"];
    } else if (preset === 'night_owl') {
      time_slots = ["14:00-16:00", "21:30-01:00"];
    } else if (preset === 'custom') {
      time_slots = (this._regSlots && this._regSlots.length > 0) ? this._regSlots : ["08:00-12:00"];
    }

    try {
      const res = await window.api.register({
        full_name,
        email,
        password,
        education_level,
        active_exam_id,
        prep_mode,
        time_slots
      });

      modal.close();
      toast.success(`Account created successfully! Your personalized study roadmap is ready.`);

      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      router.navigate('dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    }
  },

  async loginDemo() {
    try {
      const res = await window.api.demoLogin();
      modal.close();
      toast.success('Logged in as Demo Student Aarav Sharma!');

      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      router.navigate('dashboard');
    } catch (err) {
      toast.error('Demo login failed: ' + err.message);
    }
  },

  async loginAdminDemo() {
    try {
      const res = await window.api.adminDemoLogin();
      modal.close();
      toast.success('Logged in as Administrator (Dr. Vikram Malhotra)!');

      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      router.navigate('admin');
    } catch (err) {
      toast.error('Admin login failed: ' + err.message);
    }
  },

  async logout() {
    try {
      await window.api.logout();
      window.state.clearUser();
      toast.info('Logged out successfully.');
      router.navigate('landing');
    } catch (e) {
      window.state.clearUser();
      router.navigate('landing');
    }
  }
};

window.authModal = authModal;

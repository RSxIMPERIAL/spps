// SPPS Top Navigation Bar
function renderNavbar() {
  const user = window.state.get('user');
  const activeExam = window.state.get('activeExam');
  const streak = window.state.get('streak') || 0;

  const header = document.getElementById('app-navbar');
  if (!header) return;

  if (!user) {
    // Public landing navbar
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1440px; margin: 0 auto; padding: 0.85rem 2rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;" onclick="router.navigate('landing')">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.15rem; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
            S
          </div>
          <div>
            <div style="font-weight: 800; font-size: 1.15rem; color: #0f172a; line-height: 1.1;">SPPS</div>
            <div style="font-size: 0.7rem; color: #64748b; font-weight: 500;">Study Plan Preparation System</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="btn btn-secondary btn-sm" onclick="router.navigate('explore')">
            ${window.icons.compass} Explore Exams
          </button>
          <button class="btn btn-primary btn-sm" onclick="authModal.open('login')">
            ${window.icons.user} Sign In
          </button>
          <button class="btn btn-accent btn-sm" onclick="authModal.loginDemo()">
            Instant Demo Tour
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Authenticated Student Dashboard Navbar
  const examName = activeExam ? (activeExam.short_name || activeExam.name) : 'Select Exam';

  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1440px; margin: 0 auto; padding: 0.85rem 2rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button id="mobile-menu-btn" class="btn btn-secondary btn-sm" style="display: none; padding: 6px;" onclick="sidebar.toggle()">
          ${window.icons.menu}
        </button>

        <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;" onclick="router.navigate('dashboard')">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.1rem;">
            S
          </div>
          <div class="hidden-on-mobile">
            <span style="font-weight: 800; font-size: 1.1rem; color: #0f172a;">SPPS</span>
          </div>
        </div>

        <!-- Active Exam Switcher / Badge -->
        <div style="display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.35rem 0.85rem; border-radius: 9999px; border: 1px solid #e2e8f0; cursor: pointer;" onclick="router.navigate('my-prep')" title="Active Preparation Target (Click to manage)">
          <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Active Target:</span>
          <span style="font-size: 0.8125rem; font-weight: 700; color: #4f46e5;">${examName}</span>
          <span class="badge badge-indigo" style="font-size: 0.65rem; padding: 1px 6px;">${user.prep_mode || 'beginner'}</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <!-- Streak Counter -->
        <div style="display: flex; align-items: center; gap: 0.4rem; background: #fffbeb; border: 1px solid #fde68a; padding: 0.35rem 0.85rem; border-radius: 9999px; cursor: pointer;" onclick="router.navigate('streaks')" title="Your Daily Practice Streak">
          <div class="flame-active" style="display: flex; align-items: center;">${window.icons.flame}</div>
          <span style="font-size: 0.85rem; font-weight: 800; color: #b45309;">${streak} <span style="font-size: 0.75rem; font-weight: 600;">Day Streak</span></span>
        </div>

        <!-- User Profile Dropdown -->
        <div style="display: flex; align-items: center; gap: 0.75rem; position: relative;">
          <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" onclick="router.navigate('profile')">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; border: 1px solid #c7d2fe;">
              ${user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="hidden-on-mobile" style="text-align: left;">
              <div style="font-size: 0.875rem; font-weight: 600; color: #0f172a; line-height: 1.2;">${user.full_name}</div>
              <div style="font-size: 0.7rem; color: #64748b; text-transform: capitalize;">${user.education_level?.replace('_', ' ') || 'Student'}</div>
            </div>
          </div>

          <button class="btn btn-secondary btn-sm" title="Log Out" style="padding: 6px 10px;" onclick="authModal.logout()">
            ${window.icons.logOut}
          </button>
        </div>
      </div>
    </div>
  `;
}

window.renderNavbar = renderNavbar;

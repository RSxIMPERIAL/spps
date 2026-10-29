// SPPS Sidebar Navigation Component
const sidebar = {
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'explore', label: 'Explore Exams', icon: 'compass' },
    { id: 'my-prep', label: 'My Preparation', icon: 'bookOpen' },
    { id: 'planner', label: 'Study Planner', icon: 'clipboardList' },
    { id: 'timetable', label: 'Timetable', icon: 'calendar' },
    { id: 'pyq', label: 'Previous-Year Questions', icon: 'helpCircle' },
    { id: 'daily-practice', label: 'Daily Practice', icon: 'target' },
    { id: 'streaks', label: 'Streaks & Progress', icon: 'trendingUp' },
    { id: 'profile', label: 'Profile & Settings', icon: 'settings' }
  ],

  isOpen: false,

  toggle() {
    this.isOpen = !this.isOpen;
    this.render();
  },

  close() {
    this.isOpen = false;
    this.render();
  },

  render() {
    const sidebarEl = document.getElementById('app-sidebar');
    if (!sidebarEl) return;

    const currentRoute = window.state.get('currentRoute') || 'dashboard';
    const user = window.state.get('user');

    if (!user) {
      sidebarEl.style.display = 'none';
      return;
    }

    sidebarEl.style.display = 'block';

    const itemsToRender = [...this.items];
    if (user.role === 'admin') {
      itemsToRender.push({ id: 'admin', label: 'Admin Console', icon: 'shield' });
    }

    const navLinks = itemsToRender.map(item => {
      const isActive = currentRoute === item.id;
      const activeStyle = isActive
        ? `background-color: var(--indigo-50); color: var(--indigo-600); font-weight: 600; border-right: 3px solid var(--indigo-600);`
        : `color: var(--primary-700); font-weight: 500;`;

      return `
        <a href="#/${item.id}" class="sidebar-nav-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; font-size: 0.875rem; text-decoration: none; transition: all 0.15s ease; ${activeStyle}">
          <span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;">
            ${window.icons[item.icon] || ''}
          </span>
          <span>${item.label}</span>
          ${item.id === 'admin' ? '<span class="badge badge-emerald" style="font-size: 0.65rem; margin-left: auto; padding: 1px 5px;">Admin</span>' : ''}
        </a>
      `;
    }).join('');

    sidebarEl.innerHTML = `
      <aside class="sidebar-wrapper ${this.isOpen ? 'sidebar-mobile-open' : ''}" style="width: 260px; background: #ffffff; border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; height: calc(100vh - 65px); position: sticky; top: 65px; z-index: 40;">
        <div style="flex: 1; padding: 1rem 0; overflow-y: auto;">
          <div style="padding: 0 1.25rem 0.5rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">
            Preparation Suite
          </div>
          <nav style="display: flex; flex-direction: column; gap: 2px;">
            ${navLinks}
          </nav>
        </div>

        <div style="padding: 1.25rem; border-top: 1px solid var(--border-subtle); background: #f8fafc;">
          ${user.role === 'admin' ? `
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 1rem; border-radius: 0.75rem; font-size: 0.8125rem;">
              <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 4px;">
                <span>Administrator Tools</span>
              </div>
              <p style="color: #c7d2fe; font-size: 0.75rem; margin-bottom: 8px;">Upload PYQs (year & topic wise) for all Indian examinations.</p>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-primary btn-sm" style="flex: 1; font-size: 0.75rem; padding: 4px 6px;" onclick="router.navigate('admin')">
                  PYQ Studio
                </button>
                <button class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.75rem; padding: 4px 6px; background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" onclick="adminImport.openModal()">
                  Bulk Upload
                </button>
              </div>
            </div>
          ` : `
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 1rem; border-radius: 0.75rem; font-size: 0.8125rem;">
              <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 4px;">
                <span>PYQ Archive & Papers</span>
              </div>
              <p style="color: #c7d2fe; font-size: 0.75rem; margin-bottom: 8px;">Access real questions year-wise and topic-wise with verified solutions.</p>
              <button class="btn btn-secondary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 4px 8px; background: rgba(255,255,255,0.15); color: #ffffff; border-color: rgba(255,255,255,0.25);" onclick="router.navigate('pyq')">
                Browse PYQ Papers →
              </button>
            </div>
          `}
        </div>
      </aside>
    `;
  }
};

window.sidebar = sidebar;

// SPPS Application Core Router & Bootstrapper
class AppRouter {
  constructor() {
    this.routes = {
      'landing': () => window.landingView.render(),
      'dashboard': () => window.dashboardView.render(),
      'explore': () => window.exploreExamsView.render(),
      'exam-details': (param) => window.examDetailsView.render(param),
      'my-prep': () => window.myPrepView.render(),
      'planner': () => window.studyPlannerView.render(),
      'timetable': () => window.timetableView.render(),
      'pyq': (param) => window.pyqView.render(param),
      'pyqs': (param) => window.pyqView.render(param),
      'pyq-pdfs': (param) => { if (window.pyqView) window.pyqView.activeTab = 'pdf-papers'; window.pyqView.render(param); },
      'daily-practice': () => window.dailyPracticeView.render(),
      'streaks': () => window.streaksProgressView.render(),
      'profile': () => window.profileSettingsView.render(),
      'admin': () => window.adminConsoleView.render()
    };

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  navigate(route, param = null) {
    const hash = param ? `#/${route}/${param}` : `#/${route}`;
    if (window.location.hash === hash) {
      this.handleHashChange();
    } else {
      window.location.hash = hash;
    }
  }

  async handleHashChange() {
    const rawHash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const parts = rawHash.split('/');
    const route = parts[0] || 'dashboard';
    const param = parts[1] || null;

    const user = window.state.get('user');

    // Authentication Guard
    const protectedRoutes = ['dashboard', 'my-prep', 'planner', 'timetable', 'daily-practice', 'streaks', 'profile', 'admin'];
    if (protectedRoutes.includes(route) && !user) {
      window.state.set({ currentRoute: 'landing', routeParam: null });
      this.navigate('landing');
      return;
    }

    // Role Guard: Admin Console strictly restricted to admin role
    if (route === 'admin' && (!user || user.role !== 'admin')) {
      if (window.toast) window.toast.error('Access restricted: Administrator privileges required.');
      this.navigate(user ? 'dashboard' : 'landing');
      return;
    }

    // Default route for authenticated users navigating to landing
    if (route === 'landing' && user) {
      this.navigate('dashboard');
      return;
    }

    window.state.set({ currentRoute: route, routeParam: param });

    // Render components
    window.renderNavbar();
    window.sidebar.render();

    // Scroll to top
    window.scrollTo(0, 0);

    const handler = this.routes[route];
    if (handler) {
      handler(param);
    } else {
      window.landingView.render();
    }
  }

  async init() {
    console.log('[SPPS] Initializing client application...');

    // Check existing auth token
    const token = localStorage.getItem('spps_auth_token');
    if (token) {
      try {
        const me = await window.api.getMe();
        window.state.setUser(me.user, me.activeExam);
      } catch (e) {
        console.warn('Session expired or invalid, clearing token');
        window.api.setToken(null);
      }
    }

    // Initial route resolution
    const currentHash = window.location.hash;
    if (!currentHash || currentHash === '#/') {
      const user = window.state.get('user');
      this.navigate(user ? 'dashboard' : 'landing');
    } else {
      this.handleHashChange();
    }
  }
}

window.router = new AppRouter();

// Auto boot on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.router.init();
});

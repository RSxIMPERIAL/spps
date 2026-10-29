// SPPS Reactive State Store
class StateStore {
  constructor() {
    this.state = {
      user: null,
      activeExam: null,
      currentRoute: 'landing',
      routeParam: null,
      streak: 0,
      readiness: 0,
      sidebarOpen: false
    };
    this.listeners = [];
  }

  get(key) {
    return this.state[key];
  }

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  setUser(user, activeExam = null) {
    this.set({
      user,
      activeExam,
      streak: user?.current_streak || this.state.streak
    });
  }

  clearUser() {
    this.set({
      user: null,
      activeExam: null,
      currentRoute: 'landing',
      routeParam: null,
      streak: 0
    });
  }
}

window.state = new StateStore();

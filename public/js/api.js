// SPPS Unified API Client
class ApiService {
  constructor() {
    this.baseUrl = window.location.origin;
    this.token = localStorage.getItem('spps_auth_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('spps_auth_token', token);
    } else {
      localStorage.removeItem('spps_auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Auth API
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  async register(userData) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setToken(res.token);
    return res;
  }

  async demoLogin() {
    const res = await this.request('/api/auth/demo', { method: 'POST' });
    this.setToken(res.token);
    return res;
  }

  async adminDemoLogin() {
    const res = await this.request('/api/auth/admin-demo', { method: 'POST' });
    this.setToken(res.token);
    return res;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Examinations API
  async getExams(filters = {}) {
    const params = new URLSearchParams();
    if (filters.stage && filters.stage !== 'all') params.set('stage', filters.stage);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/exams${qs}`);
  }

  async getExamDetails(examId) {
    return this.request(`/api/exams/${examId}`);
  }

  async selectExam(examId, preferences = {}) {
    return this.request(`/api/exams/${examId}/select`, {
      method: 'POST',
      body: JSON.stringify(preferences)
    });
  }

  // Study Plan API
  async getStudyPlan() {
    return this.request('/api/study-plan');
  }

  async generateStudyPlan(options = {}) {
    return this.request('/api/study-plan/generate', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async updateStudyTask(taskId, updates) {
    return this.request(`/api/study-plan/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Timetable API
  async getTimetable() {
    return this.request('/api/timetable');
  }

  async generateTimetable(timeSlots = null) {
    return this.request('/api/timetable/generate', {
      method: 'POST',
      body: JSON.stringify({ time_slots: timeSlots })
    });
  }

  async updateTimetableSession(sessionId, updates) {
    return this.request(`/api/timetable/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async addTimetableSession(sessionData) {
    return this.request('/api/timetable/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  async deleteTimetableSession(sessionId) {
    return this.request(`/api/timetable/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  // Previous-Year Questions (PYQ) API
  async getPyqs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.exam_id) params.set('exam_id', filters.exam_id);
    if (filters.year && filters.year !== 'all') params.set('year', filters.year);
    if (filters.subject_id && filters.subject_id !== 'all') params.set('subject_id', filters.subject_id);
    if (filters.topic_id && filters.topic_id !== 'all') params.set('topic_id', filters.topic_id);
    if (filters.difficulty && filters.difficulty !== 'all') params.set('difficulty', filters.difficulty);
    if (filters.search) params.set('search', filters.search);
    if (filters.bookmarked_only) params.set('bookmarked_only', 'true');
    if (filters.mistakes_only) params.set('mistakes_only', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/pyqs${qs}`);
  }

  async getPyqSummary(examId) {
    const qs = examId ? `?exam_id=${encodeURIComponent(examId)}` : '';
    return this.request(`/api/pyqs/summary${qs}`);
  }

  async attemptQuestion(questionId, selectedAnswer, timeSpentSeconds = 30, mode = 'pyq_browser') {
    return this.request(`/api/pyqs/${questionId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({
        selected_answer: selectedAnswer,
        time_spent_seconds: timeSpentSeconds,
        mode
      })
    });
  }

  async toggleBookmark(questionId) {
    return this.request(`/api/pyqs/${questionId}/bookmark`, {
      method: 'POST'
    });
  }

  async importPyqs(importPayload) {
    return this.request('/api/admin/pyqs/import', {
      method: 'POST',
      body: JSON.stringify(importPayload)
    });
  }

  // Daily Practice & Streaks API
  async getDailyPractice() {
    return this.request('/api/daily-practice');
  }

  // Analytics & Dashboard API
  async getDashboardAnalytics() {
    return this.request('/api/analytics/dashboard');
  }

  // Admin Operations API
  async getAdminStats() {
    return this.request('/api/admin/stats');
  }

  async adminAddExam(examData) {
    return this.request('/api/admin/exams', {
      method: 'POST',
      body: JSON.stringify(examData)
    });
  }

  async adminUpdateExam(examId, examData) {
    return this.request(`/api/admin/exams/${examId}`, {
      method: 'PUT',
      body: JSON.stringify(examData)
    });
  }

  async adminArchiveExam(examId) {
    return this.request(`/api/admin/exams/${examId}`, {
      method: 'DELETE'
    });
  }

  async adminAddQuestion(questionData) {
    return this.request('/api/admin/pyqs', {
      method: 'POST',
      body: JSON.stringify(questionData)
    });
  }

  async adminUpdateQuestion(questionId, questionData) {
    return this.request(`/api/admin/pyqs/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData)
    });
  }

  async adminDeleteQuestion(questionId) {
    return this.request(`/api/admin/pyqs/${questionId}`, {
      method: 'DELETE'
    });
  }

  // Previous-Year PDF Question Papers API
  async getPyqPdfs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.exam_id && filters.exam_id !== 'all') params.set('exam_id', filters.exam_id);
    if (filters.year && filters.year !== 'all') params.set('year', filters.year);
    if (filters.subject_id && filters.subject_id !== 'all') params.set('subject_id', filters.subject_id);
    if (filters.paper_type && filters.paper_type !== 'all') params.set('paper_type', filters.paper_type);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/pyq-pdfs${qs}`);
  }

  async adminUploadPyqPdf(payload) {
    return this.request('/api/admin/pyq-pdfs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async adminDeletePyqPdf(id) {
    return this.request(`/api/admin/pyq-pdfs/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }

  // Category Pedagogy & Topic Mastery API
  async getTopicMastery(examId = null) {
    const qs = examId ? `?exam_id=${encodeURIComponent(examId)}` : '';
    return this.request(`/api/topic-mastery${qs}`);
  }

  async saveTopicMastery(payload) {
    return this.request('/api/topic-mastery', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getPrepGuidance(examId = null, mode = null) {
    const params = new URLSearchParams();
    if (examId) params.set('exam_id', examId);
    if (mode) params.set('mode', mode);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/prep-guidance${qs}`);
  }
}

window.api = new ApiService();

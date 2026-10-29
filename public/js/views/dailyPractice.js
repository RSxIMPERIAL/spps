// SPPS Daily Practice & Streak System View
const dailyPracticeView = {
  currentQuestionIndex: 0,
  questions: [],
  sessionStats: {
    target: 10,
    completed: 0,
    correct: 0,
    streak: 0
  },

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: #64748b;">
        Generating your adaptive daily practice set...
      </div>
    `;

    try {
      const data = await window.api.getDailyPractice();
      this.questions = data.questions || [];
      this.sessionStats = {
        target: data.target || 10,
        completed: data.completed || 0,
        correct: data.correct || 0,
        streak: data.currentStreak || 0
      };
      this.currentQuestionIndex = 0;

      this.renderQuestionCard();
    } catch (err) {
      container.innerHTML = `<div class="spps-card" style="padding: 2rem; color: red;">${err.message}</div>`;
    }
  },

  renderQuestionCard() {
    const container = document.getElementById('view-container');
    if (!container) return;

    if (!this.questions.length) {
      container.innerHTML = `
        <div class="spps-card" style="padding: 3rem; text-align: center; max-width: 650px; margin: 2rem auto;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Daily Practice Goal Completed!</h2>
          <p style="color: #64748b; margin-bottom: 1.5rem;">You have solved all questions in today's set. Keep your streak alive tomorrow!</p>
          <div style="display: flex; justify-content: center; gap: 1rem;">
            <button class="btn btn-primary" onclick="router.navigate('pyq')">Browse All PYQs</button>
            <button class="btn btn-secondary" onclick="router.navigate('dashboard')">Back to Dashboard</button>
          </div>
        </div>
      `;
      return;
    }

    const q = this.questions[this.currentQuestionIndex] || this.questions[0];
    const options = q.options || [];
    const totalSet = this.questions.length;
    const progressPercent = Math.round(((this.currentQuestionIndex + 1) / totalSet) * 100);

    container.innerHTML = `
      <div style="max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Daily Progress Bar Strip -->
        <div class="spps-card" style="padding: 1.25rem 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="flame-active" style="display: flex; align-items: center;">${window.icons.flame}</div>
              <span style="font-weight: 800; font-size: 1rem; color: #b45309;">${this.sessionStats.streak} Day Practice Streak</span>
            </div>

            <div style="font-size: 0.8125rem; font-weight: 600; color: #64748b;">
              Question <strong style="color: #0f172a;">${this.currentQuestionIndex + 1}</strong> of <strong style="color: #0f172a;">${totalSet}</strong>
              (${this.sessionStats.completed}/${this.sessionStats.target} daily target)
            </div>
          </div>

          <div style="height: 8px; width: 100%; background: #f1f5f9; border-radius: 9999px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="width: ${progressPercent}%; height: 100%; background: #4f46e5; border-radius: 9999px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="spps-card" style="padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div style="display: flex; gap: 8px;">
              <span class="badge badge-indigo">${q.subject_name || 'Subject'}</span>
              <span class="badge badge-slate">${q.year}</span>
              <span class="badge ${q.difficulty === 'Hard' ? 'badge-rose' : (q.difficulty === 'Medium' ? 'badge-amber' : 'badge-emerald')}">${q.difficulty}</span>
              <span class="badge badge-teal">Adaptive Practice</span>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="dailyPracticeView.skipQuestion()">
              Skip Question ${window.icons.arrowRight}
            </button>
          </div>

          <!-- Question Text -->
          <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a; line-height: 1.6; margin-bottom: 1.75rem;">
            ${q.question_text}
          </div>

          <!-- Options -->
          <form id="daily-practice-form" onsubmit="dailyPracticeView.handleAnswerSubmit(event, '${q.id}')">
            <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.75rem;">
              ${options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `
                  <label id="daily-opt-label-${idx}" style="display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.25rem; border-radius: 0.625rem; border: 1.5px solid var(--border-subtle); background: #ffffff; cursor: pointer; transition: all 0.15s ease;"
                         onclick="dailyPracticeView.selectOptionStyle(${idx})">
                    <input type="radio" name="daily_option" value="${opt}" required style="cursor: pointer;" />
                    <span style="font-weight: 700; font-size: 0.9375rem; width: 22px;">${letter}.</span>
                    <span style="font-size: 1rem; color: #1e293b; flex: 1;">${opt}</span>
                  </label>
                `;
              }).join('')}
            </div>

            <!-- Solution feedback box (initially hidden) -->
            <div id="daily-solution-box" style="display: none; padding: 1.25rem; border-radius: 0.625rem; margin-bottom: 1.5rem;"></div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 0.8125rem; color: #64748b;">
                ${this.sessionStats.correct} Correct today
              </div>

              <div style="display: flex; gap: 0.75rem;">
                <button type="submit" id="daily-submit-btn" class="btn btn-primary btn-lg">
                  Submit Answer
                </button>
                <button type="button" id="daily-next-btn" class="btn btn-accent btn-lg" style="display: none;" onclick="dailyPracticeView.nextQuestion()">
                  Next Question ${window.icons.arrowRight}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  selectOptionStyle(idx) {
    document.querySelectorAll('[id^="daily-opt-label-"]').forEach(el => {
      el.style.borderColor = 'var(--border-subtle)';
      el.style.background = '#ffffff';
    });
    const selected = document.getElementById(`daily-opt-label-${idx}`);
    if (selected) {
      selected.style.borderColor = '#4f46e5';
      selected.style.background = '#eef2ff';
    }
  },

  async handleAnswerSubmit(e, questionId) {
    e.preventDefault();
    const selectedRadio = document.querySelector('input[name="daily_option"]:checked');
    if (!selectedRadio) return;

    const selectedVal = selectedRadio.value;
    const submitBtn = document.getElementById('daily-submit-btn');
    const nextBtn = document.getElementById('daily-next-btn');
    const solutionBox = document.getElementById('daily-solution-box');

    try {
      submitBtn.disabled = true;
      const res = await window.api.attemptQuestion(questionId, selectedVal, 30, 'daily_practice');

      this.sessionStats.completed += 1;
      if (res.isCorrect) this.sessionStats.correct += 1;
      this.sessionStats.streak = res.currentStreak;

      // Show solution box
      solutionBox.style.display = 'block';
      if (res.isCorrect) {
        solutionBox.style.background = '#ecfdf5';
        solutionBox.style.border = '1px solid #10b981';
        solutionBox.innerHTML = `
          <div style="font-weight: 800; font-size: 1rem; color: #065f46; margin-bottom: 4px;">🎉 Correct Answer!</div>
          <div style="font-size: 0.875rem; color: #047857; line-height: 1.5;">${res.explanation}</div>
        `;
        toast.success(`Correct! Daily streak: ${res.currentStreak} 🔥`);
      } else {
        solutionBox.style.background = '#fff1f2';
        solutionBox.style.border = '1px solid #e11d48';
        solutionBox.innerHTML = `
          <div style="font-weight: 800; font-size: 1rem; color: #9f1239; margin-bottom: 4px;">Incorrect</div>
          <div style="font-size: 0.85rem; color: #be123c; margin-bottom: 6px;">Correct key: <strong>${res.correctAnswer}</strong></div>
          <div style="font-size: 0.875rem; color: #334155; line-height: 1.5;">${res.explanation}</div>
        `;
        toast.error('Incorrect. Keep practicing!');
      }

      submitBtn.style.display = 'none';
      nextBtn.style.display = 'inline-flex';
    } catch (err) {
      toast.error('Submission failed: ' + err.message);
      submitBtn.disabled = false;
    }
  },

  nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.showSessionCompleteCelebration();
    } else {
      this.renderQuestionCard();
    }
  },

  skipQuestion() {
    this.nextQuestion();
  },

  showSessionCompleteCelebration() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="spps-card" style="padding: 3.5rem 2rem; text-align: center; max-width: 650px; margin: 2rem auto;">
        <div style="width: 70px; height: 70px; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 2.25rem; margin: 0 auto 1.5rem;">
          🏆
        </div>

        <h1 style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">
          Daily Practice Completed!
        </h1>

        <p style="font-size: 1rem; color: #64748b; margin-bottom: 2rem;">
          You scored <strong style="color: #059669;">${this.sessionStats.correct}</strong> out of <strong style="color: #0f172a;">${this.sessionStats.completed}</strong> today.
          Your consistency streak is extended to <strong style="color: #b45309;">${this.sessionStats.streak} Days 🔥</strong>!
        </p>

        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button class="btn btn-primary btn-lg" onclick="router.navigate('dashboard')">
            Return to Dashboard
          </button>
          <button class="btn btn-secondary btn-lg" onclick="router.navigate('streaks')">
            View Progress & Heatmap
          </button>
        </div>
      </div>
    `;
  }
};

window.dailyPracticeView = dailyPracticeView;

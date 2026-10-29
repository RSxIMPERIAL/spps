// SPPS Analytics, Streak & Performance Calculation Engine
const { db } = require('./db');
const crypto = require('node:crypto');

function recordQuestionAttempt(userId, questionId, selectedAnswer, timeSpentSeconds = 30, mode = 'daily_practice') {
  const question = db.prepare('SELECT * FROM pyq_questions WHERE id = ?').get(questionId);
  if (!question) throw new Error('Question not found');

  const isCorrect = (selectedAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()) ? 1 : 0;
  const attemptId = 'att-' + crypto.randomUUID().slice(0, 8);

  // 1. Insert attempt
  db.prepare(`
    INSERT INTO pyq_attempts (id, user_id, question_id, exam_id, selected_answer, is_correct, time_spent_seconds, mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(attemptId, userId, questionId, question.exam_id, selectedAnswer, isCorrect, timeSpentSeconds, mode);

  // 2. Retrieve or initialize User Streak profile
  let userStreak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);
  if (!userStreak) {
    db.prepare(`
      INSERT INTO user_streaks (
        user_id, current_streak, longest_streak, last_activity_date, last_streak_date,
        total_questions_solved, target_questions_per_day, consecutive_success_days,
        min_target, max_target, adaptive_target_enabled, last_target_change_reason
      ) VALUES (?, 0, 0, NULL, NULL, 0, 10, 0, 6, 20, 1, 'Starting target set to 10 questions/day')
    `).run(userId);
    userStreak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);
  }

  // 3. Update Daily Practice Log for today
  const todayStr = new Date().toISOString().split('T')[0];
  let dailyLog = db.prepare('SELECT * FROM daily_practice_logs WHERE user_id = ? AND practice_date = ?').get(userId, todayStr);

  const targetCount = userStreak.target_questions_per_day || 10;
  const wasTargetMet = dailyLog ? (dailyLog.is_target_met === 1) : false;

  let newCompleted = 1;
  let newCorrect = isCorrect;
  let nowTargetMet = false;

  if (!dailyLog) {
    nowTargetMet = (1 >= targetCount);
    const logId = 'log-' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO daily_practice_logs (id, user_id, exam_id, practice_date, target_count, completed_count, correct_count, streak_count, is_target_met)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(logId, userId, question.exam_id, todayStr, targetCount, isCorrect, userStreak.current_streak, (nowTargetMet ? 1 : 0));
  } else {
    newCompleted = dailyLog.completed_count + 1;
    newCorrect = dailyLog.correct_count + isCorrect;
    nowTargetMet = (newCompleted >= targetCount);

    db.prepare(`
      UPDATE daily_practice_logs
      SET completed_count = ?, correct_count = ?, is_target_met = ?, target_count = ?
      WHERE id = ?
    `).run(newCompleted, newCorrect, nowTargetMet ? 1 : 0, targetCount, dailyLog.id);
  }

  // 4. Calculate Streak & Adaptive Progression
  // Rules:
  // - A streak day is ONLY awarded when the daily question target is actually completed
  // - Prevent repeated requests / refreshes from falsely multiplying the streak
  // - If yesterday was missed, reset consecutive day count
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = userStreak.current_streak;
  let longestStreak = userStreak.longest_streak;
  let consecutiveSuccess = userStreak.consecutive_success_days || 0;
  let targetQuestions = userStreak.target_questions_per_day || 10;
  let targetChangeReason = userStreak.last_target_change_reason || null;
  const minTarget = userStreak.min_target || 6;
  const maxTarget = userStreak.max_target || 20;

  const justAchievedTarget = (!wasTargetMet && nowTargetMet);

  if (justAchievedTarget) {
    // Student just completed today's target!
    if (userStreak.last_streak_date === yesterdayStr) {
      currentStreak += 1;
      consecutiveSuccess += 1;
    } else if (userStreak.last_streak_date === todayStr) {
      // Already awarded today, do not double count
    } else {
      // First day or streak broken due to missed yesterday
      currentStreak = 1;
      consecutiveSuccess = 1;
    }

    // Adaptive increment: After 3 consecutive successful days, increase target by 2
    if (userStreak.adaptive_target_enabled && consecutiveSuccess >= 3 && targetQuestions < maxTarget) {
      targetQuestions = Math.min(maxTarget, targetQuestions + 2);
      targetChangeReason = `Target increased to ${targetQuestions} Qs/day (+2) after ${consecutiveSuccess} consecutive days of meeting your daily goal.`;
    }
  } else if (!nowTargetMet) {
    // If target not met yet today, check if yesterday was missed:
    if (userStreak.last_streak_date && userStreak.last_streak_date !== yesterdayStr && userStreak.last_streak_date !== todayStr) {
      // Missed day detected
      if (currentStreak > 0) {
        currentStreak = 0;
        consecutiveSuccess = 0;
        // Modest adaptive reduction to rebuild momentum
        if (userStreak.adaptive_target_enabled && targetQuestions > minTarget) {
          targetQuestions = Math.max(minTarget, targetQuestions - 2);
          targetChangeReason = `Target reduced to ${targetQuestions} Qs/day (-2) to help you rebuild momentum after missing a study day.`;
        }
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);
  const totalSolved = userStreak.total_questions_solved + 1;

  db.prepare(`
    UPDATE user_streaks
    SET current_streak = ?, longest_streak = ?, last_activity_date = ?, last_streak_date = ?,
        total_questions_solved = ?, target_questions_per_day = ?, consecutive_success_days = ?,
        last_target_change_reason = ?
    WHERE user_id = ?
  `).run(
    currentStreak,
    longestStreak,
    todayStr,
    nowTargetMet ? todayStr : userStreak.last_streak_date,
    totalSolved,
    targetQuestions,
    consecutiveSuccess,
    targetChangeReason,
    userId
  );

  return {
    isCorrect: isCorrect === 1,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    currentStreak,
    totalSolved,
    todayCompleted: newCompleted,
    todayTarget: targetCount,
    isTargetMet: nowTargetMet,
    justAchievedTarget,
    targetChangeReason
  };
}

function getDashboardAnalytics(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');

  const activeExamId = user.active_exam_id || 'jee-main';
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(activeExamId);

  // 1. Study Plan & Task completion
  const plan = db.prepare("SELECT * FROM study_plans WHERE user_id = ? AND exam_id = ? AND status = 'active'").get(userId, activeExamId);

  let totalTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let inProgressTasks = 0;
  let syllabusCompletionPercent = 0;

  if (plan) {
    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM study_tasks WHERE plan_id = ?
    `).get(plan.id);

    totalTasks = taskStats.total || 0;
    completedTasks = taskStats.completed || 0;
    inProgressTasks = taskStats.in_progress || 0;
    pendingTasks = taskStats.pending || 0;
    syllabusCompletionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  // 2. Subject-wise Progress
  const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ? ORDER BY order_index ASC').all(activeExamId);
  const subjectProgress = subjects.map(subj => {
    let subjTasks = 0;
    let subjDone = 0;

    if (plan) {
      const stats = db.prepare(`
        SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as done
        FROM study_tasks WHERE plan_id = ? AND subject_id = ?
      `).get(plan.id, subj.id);
      subjTasks = stats.total || 0;
      subjDone = stats.done || 0;
    }

    const percent = subjTasks > 0 ? Math.round((subjDone / subjTasks) * 100) : 0;
    return {
      id: subj.id,
      name: subj.name,
      totalTasks: subjTasks,
      completedTasks: subjDone,
      percent,
      weightage: subj.weightage_percent
    };
  });

  // 3. Question Accuracy & Attempts
  const attemptStats = db.prepare(`
    SELECT 
      COUNT(*) as total_attempts,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
    FROM pyq_attempts WHERE user_id = ? AND exam_id = ?
  `).get(userId, activeExamId);

  const totalAttempts = attemptStats.total_attempts || 0;
  const correctAttempts = attemptStats.correct_attempts || 0;
  const accuracyPercent = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // 4. Streak & Daily Goal
  const streak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId) || {
    current_streak: 0,
    longest_streak: 0,
    target_questions_per_day: 10,
    total_questions_solved: 0
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = db.prepare('SELECT * FROM daily_practice_logs WHERE user_id = ? AND practice_date = ?').get(userId, todayStr) || {
    completed_count: 0,
    correct_count: 0,
    target_count: streak.target_questions_per_day,
    is_target_met: 0
  };

  // 5. Recent 7-Day Activity History
  const recentLogs = db.prepare(`
    SELECT practice_date, target_count, completed_count, correct_count, is_target_met
    FROM daily_practice_logs
    WHERE user_id = ?
    ORDER BY practice_date DESC LIMIT 14
  `).all(userId);

  // 6. Timetable Sessions for Today
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayName = dayNames[new Date().getDay()];
  const todaySessions = db.prepare(`
    SELECT s.*, subj.name as subject_name
    FROM timetable_sessions s
    LEFT JOIN subjects subj ON s.subject_id = subj.id
    WHERE s.user_id = ? AND s.day_of_week = ?
    ORDER BY s.start_time ASC
  `).all(userId, currentDayName);

  // 7. Exam Readiness Score Formula
  // Readiness = (Syllabus% * 0.45) + (Accuracy% * 0.35) + (Streak Consistency * 0.20)
  const streakFactor = Math.min(100, (streak.current_streak / 10) * 100);
  const readinessIndex = Math.min(99, Math.round(
    (syllabusCompletionPercent * 0.45) +
    (accuracyPercent * 0.35) +
    (streakFactor * 0.20)
  ));

  // 8. Topic-Level Performance & Weak Topics Identification
  const topicStats = db.prepare(`
    SELECT 
      q.topic_id,
      t.name as topic_name,
      s.name as subject_name,
      COUNT(a.id) as attempts,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct,
      SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as mistakes
    FROM pyq_attempts a
    JOIN pyq_questions q ON a.question_id = q.id
    LEFT JOIN topics t ON q.topic_id = t.id
    LEFT JOIN subjects s ON q.subject_id = s.id
    WHERE a.user_id = ? AND a.exam_id = ?
    GROUP BY q.topic_id, t.name, s.name
    HAVING attempts > 0
  `).all(userId, activeExamId);

  const weakTopics = topicStats
    .filter(ts => (ts.correct / ts.attempts) < 0.6 || ts.mistakes >= 2)
    .map(ts => ({
      topicId: ts.topic_id,
      topicName: ts.topic_name || 'General Concepts',
      subjectName: ts.subject_name || 'General',
      attempts: ts.attempts,
      correct: ts.correct,
      mistakes: ts.mistakes,
      accuracy: Math.round((ts.correct / ts.attempts) * 100),
      recommendation: `Recommended Revision: ${ts.subjectName} - ${ts.topic_name || 'Topic'}. Accuracy is ${Math.round((ts.correct / ts.attempts) * 100)}% with ${ts.mistakes} mistakes.`
    }));

  // Also include topics from user's configured weak subjects
  let userWeakSubjects = [];
  if (Array.isArray(user.weak_subjects)) {
    userWeakSubjects = user.weak_subjects;
  } else if (typeof user.weak_subjects === 'string') {
    try {
      userWeakSubjects = JSON.parse(user.weak_subjects);
    } catch (e) {
      userWeakSubjects = user.weak_subjects.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  const weakSubjectNames = subjects.filter(s => userWeakSubjects.includes(s.id)).map(s => s.name);

  // 9. Total Study Time Completed
  const completedTaskMinutes = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_mins
    FROM study_tasks
    WHERE user_id = ? AND status = 'completed'
  `).get(userId).total_mins || 0;
  const completedStudyHours = (completedTaskMinutes / 60).toFixed(1);

  return {
    exam: exam || { name: 'Competitive Exam', short_name: 'Exam' },
    userRole: user.role || 'student',
    prepMode: user.prep_mode,
    dailyHours: user.daily_hours,
    targetDate: user.target_exam_date,
    readinessIndex: Math.max(5, readinessIndex),
    completedStudyHours,
    syllabus: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionPercent: syllabusCompletionPercent,
      subjectProgress
    },
    practice: {
      totalAttempts,
      correctAttempts,
      accuracyPercent,
      todayTarget: todayLog.target_count || streak.target_questions_per_day,
      todayCompleted: todayLog.completed_count,
      todayCorrect: todayLog.correct_count,
      todayTargetMet: todayLog.is_target_met === 1
    },
    streak: {
      current: streak.current_streak,
      longest: streak.longest_streak,
      totalSolved: streak.total_questions_solved,
      adaptiveTarget: streak.target_questions_per_day,
      targetChangeReason: streak.last_target_change_reason
    },
    weakTopics,
    weakSubjectNames,
    recentLogs,
    todaySessions
  };
}

module.exports = {
  recordQuestionAttempt,
  getDashboardAnalytics
};

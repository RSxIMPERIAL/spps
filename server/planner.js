// SPPS Study Plan & Timetable Generation Engine
// Transparent, deterministic, pedagogical algorithms with personalized free time slots and "How to Study" execution blueprints.
const { db } = require('./db');
const crypto = require('node:crypto');
const { parseTimeSlots, generateHowToStudyBlueprint, getBeginnerTopicGuidance } = require('./pedagogyHelper');

function generateStudyPlan(userId, examId, customSettings = {}) {
  // 1. Fetch User details and preferences
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) throw new Error('Exam not found');

  const prepMode = customSettings.prep_mode || user.prep_mode || 'beginner';
  const targetDateStr = customSettings.target_exam_date || user.target_exam_date || null;

  let preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rawDays = customSettings.preferred_days || user.preferred_days;
  if (Array.isArray(rawDays)) {
    preferredDays = rawDays;
  } else if (typeof rawDays === 'string') {
    try { preferredDays = JSON.parse(rawDays); } catch (e) { preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; }
  }

  let weakSubjects = [];
  const rawWeak = customSettings.weak_subjects || user.weak_subjects;
  if (Array.isArray(rawWeak)) {
    weakSubjects = rawWeak;
  } else if (typeof rawWeak === 'string') {
    try { weakSubjects = JSON.parse(rawWeak); } catch (e) { weakSubjects = []; }
  }

  // Free Study Time Slots: user gives exact time intervals when they are free
  const slotsInput = customSettings.time_slots || user.time_slots || null;
  const parsedSlotsInfo = parseTimeSlots(slotsInput);
  const dailyHours = customSettings.daily_hours ? parseFloat(customSettings.daily_hours) : parsedSlotsInfo.totalDailyHours;
  const storedSlotsJson = JSON.stringify(parsedSlotsInfo.slots.map(s => ({ start: s.start, end: s.end, label: s.label, days: s.days })));

  // 2. Fetch Subjects and Topics (Ensure syllabus exists for all exams)
  const { ensureExamSyllabus } = require('./syllabusGenerator');
  ensureExamSyllabus(examId, db);

  const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ? ORDER BY order_index ASC').all(examId);
  const topics = db.prepare('SELECT * FROM topics WHERE exam_id = ? ORDER BY order_index ASC').all(examId);

  // 3. Calculate time horizon
  const today = new Date();
  let daysAvailable = 90; // Default 3 months if not specified
  if (targetDateStr) {
    const targetDate = new Date(targetDateStr);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      daysAvailable = diffDays;
    }
  }

  const studyDaysFraction = preferredDays.length / 7.0;
  const effectiveStudyDays = Math.max(1, Math.floor(daysAvailable * studyDaysFraction));

  // 4. Calculate required workload adjusted for mode and weak subjects
  let totalWorkloadHours = 0;
  const topicPlans = [];

  for (const topic of topics) {
    const isWeakSubject = weakSubjects.includes(topic.subject_id);
    let durationMultiplier = 1.0;

    if (prepMode === 'beginner') {
      durationMultiplier = isWeakSubject ? 1.4 : 1.2;
    } else if (prepMode === 'intermediate') {
      durationMultiplier = isWeakSubject ? 1.25 : 1.0;
    } else if (prepMode === 'revision') {
      durationMultiplier = isWeakSubject ? 0.9 : 0.65;
    }

    const topicDuration = Math.round((topic.estimated_hours * durationMultiplier) * 10) / 10;
    totalWorkloadHours += topicDuration;

    topicPlans.push({
      topic,
      duration: topicDuration,
      isWeak: isWeakSubject
    });
  }

  // 5. Check realism & generate warning if needed
  let warningMessage = null;
  const bufferDays = Math.max(3, Math.round(daysAvailable * 0.1)); // 10% buffer
  const requiredDailyHours = Math.round((totalWorkloadHours / effectiveStudyDays) * 10) / 10;

  if (requiredDailyHours > dailyHours * 1.25) {
    warningMessage = `High Workload Alert: To thoroughly master all ${topics.length} topics before ${targetDateStr || 'target date'}, you require approximately ${requiredDailyHours} hours/day based on your ${parsedSlotsInfo.slots.length} free time slot(s) totaling ${dailyHours} hrs/day. Consider allocating an additional study slot or extending your target date.`;
  }

  // 6. Delete previous active plan for this user and exam if regenerating
  const existingPlan = db.prepare("SELECT id FROM study_plans WHERE user_id = ? AND exam_id = ? AND status = 'active'").get(userId, examId);
  if (existingPlan) {
    db.prepare('DELETE FROM study_tasks WHERE plan_id = ?').run(existingPlan.id);
    db.prepare('DELETE FROM timetable_sessions WHERE plan_id = ?').run(existingPlan.id);
    db.prepare('DELETE FROM study_plans WHERE id = ?').run(existingPlan.id);
  }

  // 7. Insert new study plan
  const planId = 'plan-' + crypto.randomUUID().slice(0, 8);
  const slotsSummary = parsedSlotsInfo.slots.map(s => s.fullSlotDisplay || s.formattedSlot).join(', ');
  const planOverview = `${prepMode.toUpperCase()} roadmap for ${exam.name}: Structured syllabus distribution over ${daysAvailable} days across ${preferredDays.length} study days/week matching your free study time slots (${slotsSummary} ~ ${dailyHours} hrs/day).`;

  db.prepare(`
    INSERT INTO study_plans (
      id, user_id, exam_id, prep_mode, target_date, total_estimated_hours, daily_hours, buffer_days, status, plan_overview, warning_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    planId,
    userId,
    examId,
    prepMode,
    targetDateStr,
    totalWorkloadHours,
    dailyHours,
    bufferDays,
    'active',
    planOverview,
    warningMessage
  );

  // For Revision mode, prioritize Tier-1 High-Yield topics first
  if (prepMode === 'revision') {
    topicPlans.sort((a, b) => {
      const aTier = (a.topic.weightage_tier === 'High-Yield' || a.topic.difficulty === 'Hard') ? 1 : (a.topic.weightage_tier === 'Core' ? 2 : 3);
      const bTier = (b.topic.weightage_tier === 'High-Yield' || b.topic.difficulty === 'Hard') ? 1 : (b.topic.weightage_tier === 'Core' ? 2 : 3);
      return aTier - bTier;
    });
  }

  // Load topic mastery ratings (for Intermediate diagnostic customization)
  const masteryMap = new Map();
  try {
    const mRows = db.prepare('SELECT topic_id, mastery_level FROM user_topic_mastery WHERE user_id = ? AND exam_id = ?').all(userId, examId);
    for (const r of mRows) {
      masteryMap.set(r.topic_id, r.mastery_level);
    }
  } catch (e) {}

  // 8. Generate Phase-wise Tasks with Concrete "How to Study" Execution Blueprints
  const tasks = [];
  let dayOffset = 1;

  for (let i = 0; i < topicPlans.length; i++) {
    const { topic, duration, isWeak } = topicPlans[i];
    const subj = subjects.find(s => s.id === topic.subject_id);
    const subjName = subj ? subj.name : 'General';

    const d1 = new Date();
    d1.setDate(today.getDate() + dayOffset);
    const dueDate1 = d1.toISOString().split('T')[0];

    const d2 = new Date();
    d2.setDate(today.getDate() + dayOffset + 3);
    const dueDate2 = d2.toISOString().split('T')[0];

    const d3 = new Date();
    d3.setDate(today.getDate() + dayOffset + 7);
    const dueDate3 = d3.toISOString().split('T')[0];

    let priority = 'Medium';
    if (isWeak || topic.weightage_tier === 'High-Yield' || topic.difficulty === 'Hard') {
      priority = 'High';
    }

    if (prepMode === 'beginner') {
      const beginnerGuidance = getBeginnerTopicGuidance(topic, subj, exam);
      const task1Minutes = Math.min(120, Math.round(duration * 30));

      tasks.push({
        id: 'task-' + crypto.randomUUID().slice(0, 8),
        plan_id: planId,
        user_id: userId,
        subject_id: topic.subject_id,
        topic_id: topic.id,
        title: `${subjName}: Fundamental Theory & Derivations: ${topic.name}`,
        activity_type: 'Concept Reading',
        duration_minutes: task1Minutes,
        priority,
        phase: 'Phase 1: Foundation',
        due_date: dueDate1,
        notes: `Step 1/3 for Beginners: Core definitions & formulas from ${beginnerGuidance.recommended_textbook}. Prerequisites: ${beginnerGuidance.prerequisites}`,
        how_to_study: JSON.stringify({
          ...generateHowToStudyBlueprint('Concept Reading', task1Minutes, 'beginner', topic.name, topic.key_concepts),
          beginner_pathway: beginnerGuidance
        })
      });

      tasks.push({
        id: 'task-' + crypto.randomUUID().slice(0, 8),
        plan_id: planId,
        user_id: userId,
        subject_id: topic.subject_id,
        topic_id: topic.id,
        title: `${subjName}: Solved Examples & Graded Practice: ${topic.name}`,
        activity_type: 'Practice MCQs',
        duration_minutes: 60,
        priority,
        phase: 'Phase 2: In-Depth Mastery',
        due_date: dueDate2,
        notes: `Step 2/3 for Beginners: Analyze 10-15 worked examples step-by-step before attempting 20 foundational MCQs.`,
        how_to_study: JSON.stringify({
          ...generateHowToStudyBlueprint('Practice MCQs', 60, 'beginner', topic.name, topic.key_concepts),
          beginner_pathway: beginnerGuidance
        })
      });

      tasks.push({
        id: 'task-' + crypto.randomUUID().slice(0, 8),
        plan_id: planId,
        user_id: userId,
        subject_id: topic.subject_id,
        topic_id: topic.id,
        title: `${subjName}: Guided Previous-Year Questions (PYQs): ${topic.name}`,
        activity_type: 'PYQ Review',
        duration_minutes: 60,
        priority: 'High',
        phase: 'Phase 3: Revision & Practice',
        due_date: dueDate3,
        notes: `Step 3/3 for Beginners: Solve last 5 years official questions with detailed pedagogical explanations.`,
        how_to_study: JSON.stringify({
          ...generateHowToStudyBlueprint('PYQ Review', 60, 'beginner', topic.name, topic.key_concepts),
          beginner_pathway: beginnerGuidance
        })
      });

    } else if (prepMode === 'intermediate') {
      const mastery = masteryMap.get(topic.id) || 'unstudied';

      if (mastery === 'mastered') {
        // Mastered topic: Basic theory skipped! Save time and jump directly into speed practice and PYQs.
        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Speed MCQs & Timed Accuracy Drill: ${topic.name}`,
          activity_type: 'Practice MCQs',
          duration_minutes: 50,
          priority: isWeak ? 'High' : 'Medium',
          phase: 'Phase 1: Foundation',
          due_date: dueDate1,
          notes: `[Syllabus Diagnostic: MASTERED] Redundant basic theory skipped to save study time. Jump straight into 30 timed problem sprints focusing on speed (<1.5 min/Q) and edge cases.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('Practice MCQs', 50, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'mastered',
            theory_skipped: true
          })
        });

        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Official PYQ Trap Mastery: ${topic.name}`,
          activity_type: 'PYQ Review',
          duration_minutes: 60,
          priority: 'High',
          phase: 'Phase 2: In-Depth Mastery',
          due_date: dueDate2,
          notes: `Analyze recurring past paper examiner traps, tricky distractor options, and negative-marking risk factors.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('PYQ Review', 60, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'mastered'
          })
        });

      } else if (mastery === 'needs_practice') {
        // Needs practice: Focused problem drill & error analysis
        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Targeted Multi-Step Problem Drill: ${topic.name}`,
          activity_type: 'Practice MCQs',
          duration_minutes: 75,
          priority: 'High',
          phase: 'Phase 1: Foundation',
          due_date: dueDate1,
          notes: `[Syllabus Diagnostic: NEEDS PRACTICE] Focus on multi-step problems, eliminating careless calculation slips, and converting partial understanding into 100% accuracy.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('Practice MCQs', 75, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'needs_practice'
          })
        });

        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Official PYQ In-Depth Mastery: ${topic.name}`,
          activity_type: 'PYQ Review',
          duration_minutes: 60,
          priority: 'High',
          phase: 'Phase 2: In-Depth Mastery',
          due_date: dueDate2,
          notes: `Solve all available 2020-2024 PYQs under timed countdown. Review every missed concept.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('PYQ Review', 60, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'needs_practice'
          })
        });

      } else {
        // Unstudied or weak gap topic: Full remediation
        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Remedial Concept Review & Notes: ${topic.name}`,
          activity_type: 'Note Making',
          duration_minutes: 45,
          priority: 'High',
          phase: 'Phase 1: Foundation',
          due_date: dueDate1,
          notes: `[Syllabus Diagnostic: UNSTUDIED / GAP] Remediate foundational gap. Formulate a 1-page condensed formula sheet and mind-map before attempting problems.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('Note Making', 45, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'unstudied'
          })
        });

        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Advanced MCQs & Speed Drill: ${topic.name}`,
          activity_type: 'Practice MCQs',
          duration_minutes: 75,
          priority: 'High',
          phase: 'Phase 2: In-Depth Mastery',
          due_date: dueDate2,
          notes: `Practice medium-to-hard problems focusing on accuracy and time management.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('Practice MCQs', 75, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'unstudied'
          })
        });

        tasks.push({
          id: 'task-' + crypto.randomUUID().slice(0, 8),
          plan_id: planId,
          user_id: userId,
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title: `${subjName}: Official PYQ Mastery: ${topic.name}`,
          activity_type: 'PYQ Review',
          duration_minutes: 60,
          priority: 'High',
          phase: 'Phase 3: Revision & Practice',
          due_date: dueDate3,
          notes: `Analyze recurring question traps and high-frequency problem patterns.`,
          how_to_study: JSON.stringify({
            ...generateHowToStudyBlueprint('PYQ Review', 60, 'intermediate', topic.name, topic.key_concepts),
            mastery_level: 'unstudied'
          })
        });
      }

    } else {
      // Revision mode: High-Yield Priority Matrix & Heavy Authentic PYQ Insistence
      const isHighYield = topic.weightage_tier === 'High-Yield' || topic.difficulty === 'Hard';
      const yieldTag = isHighYield ? '[TIER-1 HIGH YIELD]' : '[TIER-2 CORE]';

      tasks.push({
        id: 'task-' + crypto.randomUUID().slice(0, 8),
        plan_id: planId,
        user_id: userId,
        subject_id: topic.subject_id,
        topic_id: topic.id,
        title: `${subjName}: 15-Min Blind Sheet Formula Recall: ${topic.name}`,
        activity_type: 'Formula Revision',
        duration_minutes: 25,
        priority: isHighYield ? 'High' : 'Medium',
        phase: 'Phase 1: Foundation',
        due_date: dueDate1,
        notes: `${yieldTag} Daily 15-min blind recall protocol: Empty sheet formula dump purely from memory. Verify against syllabus notes in red ink.`,
        how_to_study: JSON.stringify({
          ...generateHowToStudyBlueprint('Formula Revision', 25, 'revision', topic.name, topic.key_concepts),
          is_high_yield: isHighYield,
          revision_protocol: '15-min blind dump'
        })
      });

      tasks.push({
        id: 'task-' + crypto.randomUUID().slice(0, 8),
        plan_id: planId,
        user_id: userId,
        subject_id: topic.subject_id,
        topic_id: topic.id,
        title: `${subjName}: Intensive PYQ Marathon on ${topic.name}`,
        activity_type: 'PYQ Review',
        duration_minutes: 85,
        priority: 'High',
        phase: 'Phase 2: In-Depth Mastery',
        due_date: dueDate2,
        notes: `${yieldTag} PYQ INSISTENCE: Solve all available 2019-2024 official previous-year questions under strict 1.5 min timer. Log mistakes into Conceptual / Slip / Distractor Trap.`,
        how_to_study: JSON.stringify({
          ...generateHowToStudyBlueprint('PYQ Review', 85, 'revision', topic.name, topic.key_concepts),
          is_high_yield: isHighYield,
          pyq_insistence: true
        })
      });
    }

    dayOffset += 2;
  }

  // Insert all tasks in batch with how_to_study blueprint
  const insertTask = db.prepare(`
    INSERT INTO study_tasks (
      id, plan_id, user_id, subject_id, topic_id, title, activity_type, duration_minutes, priority, phase, due_date, status, notes, how_to_study, order_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `);

  tasks.forEach((t, index) => {
    insertTask.run(t.id, t.plan_id, t.user_id, t.subject_id, t.topic_id, t.title, t.activity_type, t.duration_minutes, t.priority, t.phase, t.due_date, t.notes, t.how_to_study, index);
  });

  // Update active exam, prep mode, time slots, and calculated daily hours in user record
  const storedPreferredDays = Array.isArray(preferredDays) ? JSON.stringify(preferredDays) : preferredDays;
  const storedWeakSubjects = Array.isArray(weakSubjects) ? JSON.stringify(weakSubjects) : weakSubjects;

  db.prepare("UPDATE users SET active_exam_id = ?, prep_mode = ?, daily_hours = ?, time_slots = ?, preferred_days = ?, weak_subjects = ?, target_exam_date = ?, updated_at = datetime('now') WHERE id = ?")
    .run(examId, prepMode, dailyHours, storedSlotsJson, storedPreferredDays, storedWeakSubjects, targetDateStr, userId);

  return {
    planId,
    examId,
    prepMode,
    totalEstimatedHours: totalWorkloadHours,
    dailyHours,
    daily_hours: dailyHours,
    timeSlots: parsedSlotsInfo.slots,
    time_slots: parsedSlotsInfo.slots,
    taskCount: tasks.length,
    warningMessage,
    planOverview
  };
}

function generateTimetable(userId, planId, customSlots = null) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');

  const plan = db.prepare('SELECT * FROM study_plans WHERE id = ?').get(planId);
  if (!plan) throw new Error('Study plan not found');

  let preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (Array.isArray(user.preferred_days)) {
    preferredDays = user.preferred_days;
  } else if (typeof user.preferred_days === 'string') {
    try { preferredDays = JSON.parse(user.preferred_days); } catch (e) { preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; }
  }

  // Parse student's free study time slots
  const slotsInput = customSlots || user.time_slots || null;
  const parsedSlotsInfo = parseTimeSlots(slotsInput);
  const activeSlots = parsedSlotsInfo.slots;

  // If custom slots were provided, persist them to user record and active study plan
  if (customSlots) {
    const storedSlotsJson = JSON.stringify(parsedSlotsInfo.slots.map(s => ({ start: s.start, end: s.end, label: s.label, days: s.days })));
    db.prepare("UPDATE users SET time_slots = ?, daily_hours = ?, updated_at = datetime('now') WHERE id = ?").run(storedSlotsJson, parsedSlotsInfo.totalDailyHours, userId);
    db.prepare("UPDATE study_plans SET daily_hours = ? WHERE id = ?").run(parsedSlotsInfo.totalDailyHours, planId);
  }

  // Clear existing scheduled sessions for this user & plan
  db.prepare('DELETE FROM timetable_sessions WHERE user_id = ? AND plan_id = ?').run(userId, planId);

  // Fetch pending tasks
  const tasks = db.prepare("SELECT * FROM study_tasks WHERE plan_id = ? AND status != 'completed' ORDER BY order_index ASC").all(planId);

  // Fetch subjects to alternate properly
  const subjects = db.prepare('SELECT * FROM subjects WHERE exam_id = ?').all(plan.exam_id);

  const insertSession = db.prepare(`
    INSERT INTO timetable_sessions (
      id, user_id, plan_id, task_id, subject_id, topic_id, day_of_week, start_time, end_time, title, activity_type, status, notes, how_to_study
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
  `);

  let taskPointer = 0;
  const generatedSessions = [];

  for (const day of preferredDays) {
    let lastSubjectId = null;

    // Filter slots that are active on this specific day (handles different time slots per day/weekday/weekend)
    const daySlots = activeSlots.filter(s => {
      if (!s.days || s.days.length === 0) return true;
      if (s.days.includes('All') || s.days.includes('Daily')) return true;
      return s.days.includes(day);
    });

    if (daySlots.length === 0) continue;

    for (let slotIndex = 0; slotIndex < daySlots.length; slotIndex++) {
      const slot = daySlots[slotIndex];
      const slotStart = slot.start;
      const slotEnd = slot.end;
      const slotDuration = slot.durationMinutes;

      // Select an appropriate task, preferring subject alternation
      let assignedTask = null;
      if (taskPointer < tasks.length) {
        let foundIndex = -1;
        for (let i = taskPointer; i < Math.min(taskPointer + 5, tasks.length); i++) {
          if (tasks[i].subject_id !== lastSubjectId) {
            foundIndex = i;
            break;
          }
        }

        if (foundIndex !== -1) {
          assignedTask = tasks[foundIndex];
          const temp = tasks[taskPointer];
          tasks[taskPointer] = tasks[foundIndex];
          tasks[foundIndex] = temp;
        } else {
          assignedTask = tasks[taskPointer];
        }
        taskPointer++;
      }

      let title = assignedTask ? assignedTask.title : `${slot.label}: Subject Revision & Practice`;
      let activityType = assignedTask ? assignedTask.activity_type : (slotIndex % 2 === 0 ? 'Concept Reading' : 'Practice MCQs');
      let subjectId = assignedTask ? assignedTask.subject_id : (subjects[slotIndex % subjects.length]?.id || null);
      let topicId = assignedTask ? assignedTask.topic_id : null;
      let taskId = assignedTask ? assignedTask.id : null;

      lastSubjectId = subjectId;

      // Generate precise "How to Study" execution blueprint matching this free slot's duration
      const howToStudy = generateHowToStudyBlueprint(
        activityType,
        slotDuration,
        plan.prep_mode,
        title,
        assignedTask?.notes || ''
      );

      const sessionId = 'sess-' + crypto.randomUUID().slice(0, 8);
      insertSession.run(
        sessionId,
        userId,
        planId,
        taskId,
        subjectId,
        topicId,
        day,
        slotStart,
        slotEnd,
        title,
        activityType,
        assignedTask?.notes || null,
        JSON.stringify(howToStudy)
      );

      generatedSessions.push({
        id: sessionId,
        day_of_week: day,
        start_time: slotStart,
        end_time: slotEnd,
        duration_minutes: slotDuration,
        slot_label: slot.label,
        title,
        activity_type: activityType,
        subject_id: subjectId,
        how_to_study: howToStudy
      });
    }
  }

  // Update stored slots in user record if customSlots were provided
  if (customSlots) {
    db.prepare("UPDATE users SET time_slots = ?, daily_hours = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(activeSlots.map(s => `${s.start}-${s.end}`)), parsedSlotsInfo.totalDailyHours, userId);
  }

  return {
    success: true,
    sessionsCount: generatedSessions.length,
    timeSlots: activeSlots,
    totalDailyHours: parsedSlotsInfo.totalDailyHours,
    sessions: generatedSessions
  };
}

module.exports = {
  generateStudyPlan,
  generateTimetable
};

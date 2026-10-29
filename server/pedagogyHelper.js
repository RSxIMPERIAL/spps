// SPPS Pedagogical Methodology Engine
// Generates concrete "How to Study" execution blueprints and manages student free time slots.

/**
 * Normalizes day selections for time slots (e.g. ['Mon', 'Tue'], 'Weekdays', 'All').
 */
function normalizeSlotDays(daysInput) {
  if (!daysInput) return ['All'];
  if (Array.isArray(daysInput)) {
    if (daysInput.length === 0 || daysInput.includes('All') || daysInput.includes('Daily')) return ['All'];
    return daysInput;
  }
  if (typeof daysInput === 'string') {
    const s = daysInput.trim();
    if (s.toLowerCase() === 'all' || s.toLowerCase() === 'daily') return ['All'];
    if (s.toLowerCase() === 'weekdays') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    if (s.toLowerCase() === 'weekends') return ['Sat', 'Sun'];
    return s.split(',').map(d => d.trim()).filter(Boolean);
  }
  return ['All'];
}

function formatDaysDisplay(days) {
  if (!days || days.length === 0 || days.includes('All') || days.includes('Daily')) return 'Daily';
  const allWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const allWeekends = ['Sat', 'Sun'];
  if (days.length === 5 && allWeekdays.every(d => days.includes(d))) return 'Weekdays (Mon-Fri)';
  if (days.length === 2 && allWeekends.every(d => days.includes(d))) return 'Weekends (Sat-Sun)';
  return days.join(', ');
}

/**
 * Standardizes time slots array (strings or objects) into parsed slot objects.
 * Computes duration in minutes and hours for each slot, taking day availability into account.
 */
function parseTimeSlots(timeSlots) {
  let rawSlots = [];
  if (typeof timeSlots === 'string') {
    try {
      rawSlots = JSON.parse(timeSlots);
    } catch (e) {
      rawSlots = [];
    }
  } else if (Array.isArray(timeSlots)) {
    rawSlots = timeSlots;
  }

  if (!rawSlots || rawSlots.length === 0) {
    // Default standard student free time slots: Morning Focus & Evening Practice
    rawSlots = [
      { start: '07:00', end: '09:00', label: 'Morning Deep Work', days: ['All'] },
      { start: '18:30', end: '21:00', label: 'Evening Practice & PYQs', days: ['All'] }
    ];
  }

  const parsed = [];
  let totalDailyStandardMinutes = 0;
  let totalWeeklyMinutes = 0;

  for (const s of rawSlots) {
    let start = '08:00';
    let end = '10:00';
    let label = 'Study Session';
    let days = ['All'];

    if (typeof s === 'string') {
      let slotStr = s;
      if (slotStr.includes('@')) {
        const atParts = slotStr.split('@');
        slotStr = atParts[0].trim();
        days = normalizeSlotDays(atParts[1]);
      }
      const parts = slotStr.split('-');
      if (parts.length === 2) {
        start = parts[0].trim();
        end = parts[1].trim();
      }
    } else if (typeof s === 'object' && s !== null) {
      start = s.start || s.start_time || '08:00';
      end = s.end || s.end_time || '10:00';
      label = s.label || 'Study Session';
      days = normalizeSlotDays(s.days);
    }

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (durationMinutes <= 0) {
      // Handles overnight slot (e.g. 23:00 to 01:00)
      durationMinutes += 24 * 60;
    }

    // Sanity check duration (15 min min, 8 hours max)
    durationMinutes = Math.max(15, Math.min(480, durationMinutes));

    // Dynamic slot label based on start hour if default
    if (label === 'Study Session') {
      if (sh >= 5 && sh < 12) label = 'Morning Focus Slot';
      else if (sh >= 12 && sh < 17) label = 'Afternoon Practice Slot';
      else if (sh >= 17 && sh < 21) label = 'Evening Deep Work Slot';
      else label = 'Night Consolidation Slot';
    }

    const activeDaysCount = (days.includes('All') || days.includes('Daily')) ? 7 : Math.min(7, Math.max(1, days.length));
    const weeklySlotMinutes = durationMinutes * activeDaysCount;

    totalWeeklyMinutes += weeklySlotMinutes;
    totalDailyStandardMinutes += durationMinutes;

    parsed.push({
      start,
      end,
      label,
      days,
      daysDisplay: formatDaysDisplay(days),
      durationMinutes,
      durationHours: Math.round((durationMinutes / 60) * 10) / 10,
      formattedSlot: `${start} - ${end}`,
      fullSlotDisplay: `${start} - ${end} (${formatDaysDisplay(days)})`
    });
  }

  const computedDailyHours = Math.max(0.5, Math.round((totalWeeklyMinutes / 7 / 60) * 10) / 10);
  const computedWeeklyHours = Math.max(1.0, Math.round((totalWeeklyMinutes / 60) * 10) / 10);

  return {
    slots: parsed,
    totalMinutes: totalDailyStandardMinutes,
    totalWeeklyMinutes,
    totalWeeklyHours: computedWeeklyHours,
    totalDailyHours: computedDailyHours
  };
}

/**
 * Generates a comprehensive pedagogical "How to Study" blueprint for a topic and slot.
 */
function generateHowToStudyBlueprint(activityType, durationMinutes = 60, prepMode = 'beginner', topicName = 'Syllabus Topic', keyConcepts = '') {
  const dur = Math.max(30, durationMinutes);
  let methodTitle = '';
  let methodologyOverview = '';
  let microPhases = [];
  let cognitiveTechniques = [];
  let checklist = [];
  let mistakesAdvice = '';

  const safeTopic = topicName || 'Target Topic';
  const conceptsHint = keyConcepts ? `Key areas: ${keyConcepts}.` : '';

  switch (activityType) {
    case 'Concept Reading':
    case 'Note Making':
      methodTitle = 'Active Concept Deconstruction (Feynman & SQ3R Protocol)';
      methodologyOverview = `Do not read passively like a novel. Engage in active interrogation of ${safeTopic}: build a 1-page structured mental model, derive principles, and test comprehension immediately without looking at notes.`;
      
      const p1 = Math.round(dur * 0.15); // Pre-test & survey
      const p2 = Math.round(dur * 0.50); // Deep concept sprint
      const p3 = Math.round(dur * 0.20); // Closed-book active recall
      const p4 = dur - p1 - p2 - p3;     // Synthesis & doubt logging

      microPhases = [
        {
          phase: 'Phase 1: Syllabus Boundary & Prior Knowledge Scan',
          minutes: p1,
          action: `Survey syllabus sub-headings for ${safeTopic}. Write down any formulas, keywords, or diagrams you already remember before opening the textbook. ${conceptsHint}`
        },
        {
          phase: 'Phase 2: Deep Comprehension Sprint (Distraction-Free)',
          minutes: p2,
          action: `Read core theory from official textbook / NCERT. For each subsection, pause and articulate the concept in simple words as if teaching someone else (Feynman Technique). Record concise formulas and diagrams.`
        },
        {
          phase: 'Phase 3: Closed-Book Active Recall Matrix',
          minutes: p3,
          action: `Close the reference material completely. On a blank sheet, write out all definitions, derivations, exceptions, and interconnected rules from memory.`
        },
        {
          phase: 'Phase 4: Synthesis, Doubts & Conceptual Checkpoints',
          minutes: Math.max(5, p4),
          action: `Compare your memory sheet against the book. Circle missing nuances in red. Formulate 2 high-yield questions for self-testing tomorrow.`
        }
      ];

      cognitiveTechniques = [
        'Feynman Explanation Technique',
        'Closed-Book Active Recall',
        'SQ3R (Survey, Question, Read, Recite, Review)',
        'Dual Coding (Visual Diagrams + Text)'
      ];

      checklist = [
        `Survey syllabus scope for ${safeTopic}`,
        'Complete deep focus reading without phone/social media interruptions',
        'Write out formulas and core mechanisms from memory',
        'Identify at least 1 tricky edge case or exception'
      ];

      mistakesAdvice = 'Common Trap: Highlighting text gives an illusion of competence. Only what you can reproduce on a blank sheet is truly retained.';
      break;

    case 'Practice MCQs':
      methodTitle = 'Timed Interleaved Problem Drill & Error Categorization';
      methodologyOverview = `Simulate examination pressure. Solve graded multiple-choice questions on ${safeTopic} under strict countdown conditions without peaking at solutions.`;

      const q1 = Math.round(dur * 0.10); // Formula check
      const q2 = Math.round(dur * 0.60); // Timed sprint
      const q3 = Math.round(dur * 0.25); // Error notebook
      const q4 = dur - q1 - q2 - q3;

      microPhases = [
        {
          phase: 'Phase 1: Rapid Formula & Rule Retrieval (Warm-up)',
          minutes: Math.max(5, q1),
          action: `Spend 5 minutes listing all relevant formulas, units, sign conventions, and shortcut ratios for ${safeTopic} before beginning.`
        },
        {
          phase: 'Phase 2: Strict Timed Question Sprint',
          minutes: q2,
          action: `Solve a target batch of MCQs with a countdown timer (aim for 1.5 to 2.0 min/question). Absolutely NO looking at answer keys until the entire sprint is complete.`
        },
        {
          phase: 'Phase 3: Deep Error Log Diagnostic',
          minutes: Math.max(10, q3),
          action: `Review wrong answers and unattempted questions. Categorize each error: (1) Conceptual Gap, (2) Calculation Mistake, (3) Question Misinterpretation, or (4) Speed Rush.`
        },
        {
          phase: 'Phase 4: Concept Reinforcement for Missed Items',
          minutes: Math.max(5, q4),
          action: `Re-solve missed questions correctly from first principles. Write the single critical insight in your Mistakes Diary.`
        }
      ];

      cognitiveTechniques = [
        'Timed Stress Inoculation',
        'Interleaved Practice (Mixing Easy, Medium & Hard)',
        'Three-Color Error Categorization (Red/Yellow/Blue)',
        'Immediate Corrective Feedback Loop'
      ];

      checklist = [
        `Write down formula cheat-sheet for ${safeTopic}`,
        'Complete timed question batch without consulting answer keys',
        'Score your performance (+marks for correct, -marks for negative)',
        'Log every error root cause in the SPPS Mistake Notebook'
      ];

      mistakesAdvice = 'Common Trap: Reading the solution and thinking "Oh, I knew that." If you did not solve it yourself under the timer, it counts as an error to review.';
      break;

    case 'PYQ Review':
      methodTitle = 'Official PYQ Reverse-Engineering & Trap Analysis';
      methodologyOverview = `Analyze real previous-year examination questions on ${safeTopic} from the past 5-10 years. Decipher recurring patterns, examiner traps, and official marking criteria.`;

      const r1 = Math.round(dur * 0.10);
      const r2 = Math.round(dur * 0.65);
      const r3 = dur - r1 - r2;

      microPhases = [
        {
          phase: 'Phase 1: Frequency & Weightage Pattern Scan',
          minutes: Math.max(5, r1),
          action: `Scan PYQ question bank for ${safeTopic}. Identify which specific sub-topics appear repeatedly in recent years (2020-2024).`
        },
        {
          phase: 'Phase 2: Official PYQ Exam Simulation',
          minutes: r2,
          action: `Attempt authentic previous-year questions under exact exam timing and negative marking constraints. Flag questions where distractor options look tempting.`
        },
        {
          phase: 'Phase 3: Examiner Traps & Solution Optimization',
          minutes: Math.max(10, r3),
          action: `Compare your approach with the official pedagogical solution. Notice shortcut methods, alternative substitutions, and boundary value checks.`
        }
      ];

      cognitiveTechniques = [
        'Pattern Recognition of Recurring Traps',
        'Official Marking Scheme Calibration',
        'Distractor Option Elimination Analysis',
        'Past-Paper Spaced Retrieval'
      ];

      checklist = [
        `Attempt all target PYQs on ${safeTopic}`,
        'Track time taken per question with stopwatch',
        'Note distractor option tricks used by official examiners',
        'Bookmark tricky questions for final pre-exam revision'
      ];

      mistakesAdvice = 'Examiners repeat concepts, not exact questions. Focus on the core pattern and underlying trick rather than memorizing the answer.';
      break;

    case 'Solved Examples Walkthrough':
      methodTitle = 'Line-by-Line Worked Example Deconstruction';
      methodologyOverview = `Do not attempt questions blindly without seeing how experts think. Deconstruct 10-15 standard solved textbook problems on ${safeTopic} to internalize problem architectures.`;

      microPhases = [
        {
          phase: 'Phase 1: Question Dissection & Variable Identification',
          minutes: Math.round(dur * 0.20),
          action: `Read the problem statement. Circle given parameters, units, and what is specifically being asked before looking at the author's solution.`
        },
        {
          phase: 'Phase 2: Underlying Principle & Logic Tree Analysis',
          minutes: Math.round(dur * 0.40),
          action: `Analyze why a particular formula or theorem was invoked. Note which assumptions (e.g. frictionless surface, ideal gas) made the formula valid.`
        },
        {
          phase: 'Phase 3: Hidden Traps & Alternative Solution Pathways',
          minutes: Math.round(dur * 0.20),
          action: `Identify common pitfalls where students make sign errors or dimensional mistakes. Can this problem be solved with a shortcut ratio?`
        },
        {
          phase: 'Phase 4: Closed-Book Reproduction',
          minutes: Math.round(dur * 0.20),
          action: `Cover the solution with paper. Re-solve the worked example on your own completely from start to finish.`
        }
      ];

      cognitiveTechniques = [
        'Worked Example Effect (Cognitive Load Reduction)',
        'Self-Explanation Protocol',
        'Constraint Identification',
        'Closed-Book Reproduction'
      ];

      checklist = [
        `Deconstruct 10-15 standard solved examples for ${safeTopic}`,
        'Write down the underlying principle for each example',
        'Identify at least 2 common calculation traps',
        'Re-solve at least 3 solved examples with the solution covered'
      ];

      mistakesAdvice = 'Beginner Trap: Reading solved examples like a storybook. If your hand is not holding a pen and writing equations, no real learning occurs.';
      break;

    case 'Formula Revision':
    default:
      methodTitle = 'Blind Sheet Formula & High-Speed Recall Marathon';
      methodologyOverview = `Strengthen neural pathways for instant formula recall under exam stress without hesitation or formula confusion.`;

      microPhases = [
        {
          phase: 'Phase 1: Blank Sheet Formula Dump',
          minutes: Math.round(dur * 0.40),
          action: `Take an empty paper. Write every single formula, constant value, unit, sign convention, and graphical representation for ${safeTopic} purely from memory.`
        },
        {
          phase: 'Phase 2: Red Ink Verification & Gap Rectification',
          minutes: Math.round(dur * 0.35),
          action: `Open the syllabus reference. Check every single formula. Write any missed details or corrected signs in red ink to create visual memory contrast.`
        },
        {
          phase: 'Phase 3: High-Speed Direct Application Drills',
          minutes: Math.round(dur * 0.25),
          action: `Perform rapid-fire numerical mental substitutions for 5 typical standard question types to confirm calculation speed.`
        }
      ];

      cognitiveTechniques = [
        'Blind Memory Dumping',
        'Visual Color Contrast (Red Ink Gap Highlighting)',
        'Mental Calculation Sprints',
        'Formula Flashcard Iteration'
      ];

      checklist = [
        `Write formulas for ${safeTopic} from memory`,
        'Check all dimensional units and signs',
        'Highlight missed exceptions in red ink',
        'Review the 1-page formula sheet right before bed'
      ];

      mistakesAdvice = 'Memory decays exponentially. A 15-minute formula recall today prevents hours of re-studying next month.';
      break;
  }

  return {
    method_title: methodTitle,
    overview: methodologyOverview,
    micro_phases: microPhases,
    cognitive_techniques: cognitiveTechniques,
    checklist,
    session_checklist: checklist,
    mistakes_advice: mistakesAdvice,
    pitfall_warning: mistakesAdvice,
    prep_mode_tip: prepMode === 'beginner' 
      ? 'Beginner Focus: Prioritize clarity of fundamentals and diagrams over solving speed.'
      : prepMode === 'intermediate'
      ? 'Intermediate Focus: Eliminate calculation slips and focus on medium-to-hard multi-step questions.'
      : 'Revision Focus: Maximize high-speed PYQ drills and blind-sheet formula recall.'
  };
}

/**
 * Generates Beginner Pathway guidance for each topic in the syllabus.
 * Provides exact time breakdown (Theory, Notes, Solved Examples, Graded Practice),
 * textbook recommendations, prerequisites, and milestone checklists.
 */
function getBeginnerTopicGuidance(topic, subject, exam) {
  const dur = topic.estimated_hours || 8.0;
  
  // Specific prerequisites heuristic
  let prerequisites = 'Basic arithmetic, algebraic simplification, and standard dimensional units.';
  const tLower = (topic.name + ' ' + (topic.key_concepts || '')).toLowerCase();
  if (tLower.includes('kinematics') || tLower.includes('motion') || tLower.includes('newton')) {
    prerequisites = 'Vectors (Resolving components, Dot/Cross products) & Basic Differentiation/Integration.';
  } else if (tLower.includes('thermodynamics') || tLower.includes('heat')) {
    prerequisites = 'Work-Energy Theorem, Kinetic Energy, & Gas Laws (PV=nRT).';
  } else if (tLower.includes('organic') || tLower.includes('reaction')) {
    prerequisites = 'Hybridization (sp3, sp2, sp), Electronegativity, Inductive & Resonance Effects.';
  } else if (tLower.includes('calculus') || tLower.includes('integral') || tLower.includes('derivative')) {
    prerequisites = 'Functions (Domain/Range), Graphs of Elementary Functions, & Trigonometric Identities.';
  } else if (tLower.includes('polity') || tLower.includes('constitution')) {
    prerequisites = 'Constitutional History of India (1947-1950) & Preamble Fundamentals.';
  } else if (tLower.includes('economy') || tLower.includes('fiscal')) {
    prerequisites = 'Basic Economic Terms: GDP, Inflation, Fiscal Deficit, Monetary Policy Basics.';
  }

  // Recommended textbook based on exam
  let textbook = 'Official NCERT Textbook & Exemplar Problems';
  if (exam && exam.recommended_resources) {
    const lines = exam.recommended_resources.split('\n');
    if (lines.length > 0 && lines[0].trim()) {
      textbook = lines[0].replace(/^[0-9.-]+\s*/, '').trim();
    }
  }

  const theoryHours = Math.round(dur * 0.40 * 10) / 10;
  const notesHours = Math.round(dur * 0.15 * 10) / 10;
  const solvedExamplesHours = Math.round(dur * 0.25 * 10) / 10;
  const practiceHours = Math.round(dur * 0.20 * 10) / 10;

  return {
    topic_id: topic.id,
    topic_name: topic.name,
    subject_id: topic.subject_id,
    subject_name: subject ? subject.name : 'General',
    difficulty: topic.difficulty,
    weightage_tier: topic.weightage_tier,
    key_concepts: topic.key_concepts,
    total_recommended_hours: dur,
    time_breakdown: {
      theory: {
        hours: theoryHours,
        percentage: 40,
        label: '1. Theory & Core Concept Reading',
        description: 'Read the official textbook chapter word-for-word. Do not skip definitions, assumptions, or diagrams.'
      },
      notes: {
        hours: notesHours,
        percentage: 15,
        label: '2. Formula Sheet & Mind Map Formulation',
        description: 'Derive key formulas on a single blank summary sheet. Highlight units, sign conventions, and exceptions.'
      },
      solved_examples: {
        hours: solvedExamplesHours,
        percentage: 25,
        label: '3. Solved Examples Deconstruction',
        description: 'Analyze 10-15 standard worked textbook examples step-by-step. Re-solve them with the solution covered.'
      },
      graded_practice: {
        hours: practiceHours,
        percentage: 20,
        label: '4. Level-1 Graded MCQ Practice',
        description: 'Solve 20 fundamental questions without time pressure to verify concept retention (target >= 75% accuracy).'
      }
    },
    what_to_prepare: [
      `Thoroughly read Chapter covering ${topic.name} from ${textbook}`,
      `Deconstruct core mechanisms: ${topic.key_concepts || 'Fundamental definitions and mathematical relations'}`,
      `Derive all primary formulas on a 1-page cheatsheet without glancing at reference notes`,
      `Work through 10-15 textbook solved examples step-by-step before touching unsolved questions`,
      `Solve 20 basic-to-medium practice questions to cement concept clarity`
    ],
    prerequisites,
    recommended_textbook: textbook,
    pitfalls: 'Beginner Trap: Jumping into hard problems or PYQs before understanding standard derivations. Build your base first.',
    milestones: [
      { id: 'm1', label: 'Theory & Assumptions Understood', completed: false },
      { id: 'm2', label: '1-Page Formula Summary Written', completed: false },
      { id: 'm3', label: '12+ Solved Examples Analyzed', completed: false },
      { id: 'm4', label: '20 Graded MCQs Solved (>75% Accuracy)', completed: false }
    ]
  };
}

/**
 * Generates Intermediate Syllabus Mastery Diagnostic & Gap Analysis.
 * Audits student mastery ('mastered', 'needs_practice', 'unstudied'),
 * computes hours saved from skipping redundant basic theory, and creates a targeted action plan.
 */
function getIntermediateDiagnosticAnalysis(masteryRecords = [], allTopics = [], allSubjects = []) {
  const masteryMap = new Map();
  for (const r of masteryRecords) {
    masteryMap.set(r.topic_id, r.mastery_level);
  }

  const subjectMap = new Map();
  for (const s of allSubjects) {
    subjectMap.set(s.id, s.name);
  }

  let masteredCount = 0;
  let needsPracticeCount = 0;
  let unstudiedCount = 0;

  const topicBreakdown = allTopics.map(t => {
    const level = masteryMap.get(t.id) || 'unstudied';
    if (level === 'mastered') masteredCount++;
    else if (level === 'needs_practice') needsPracticeCount++;
    else unstudiedCount++;

    return {
      topic_id: t.id,
      topic_name: t.name,
      subject_id: t.subject_id,
      subject_name: subjectMap.get(t.subject_id) || 'Subject',
      difficulty: t.difficulty,
      weightage_tier: t.weightage_tier,
      estimated_hours: t.estimated_hours,
      mastery_level: level,
      tailored_action: level === 'mastered'
        ? 'Skip Basic Theory -> Take 45m Speed MCQ Drills + Spaced Repetition'
        : level === 'needs_practice'
        ? 'Focus on Level-2 Multi-Step Numericals & Error Analysis'
        : 'Remedial Concept Study + Graded Practice'
    };
  });

  const total = allTopics.length || 1;
  const percentMastered = Math.round((masteredCount / total) * 100);
  const readinessScore = Math.round(((masteredCount * 1.0 + needsPracticeCount * 0.5) / total) * 100);
  const theoryHoursSaved = Math.round(masteredCount * 3.5 * 10) / 10;

  return {
    total_topics: total,
    mastered_count: masteredCount,
    needs_practice_count: needsPracticeCount,
    unstudied_count: unstudiedCount,
    percent_mastered: percentMastered,
    readiness_score: readinessScore,
    theory_hours_saved: theoryHoursSaved,
    strategy_summary: `By diagnosing your syllabus, ${masteredCount} topics are tagged as Mastered. Your customized AI plan skips ${theoryHoursSaved} hours of repetitive basic theory reading, directly reinvesting that time into high-velocity problem sprints and remediating your ${needsPracticeCount + unstudiedCount} gap topics.`,
    topics: topicBreakdown
  };
}

/**
 * Generates Revision Protocol & High-Yield Strategy.
 * Establishes Tier-1 High Yield prioritization, daily 15-minute formula recall routines,
 * spaced repetition intervals, and PYQ insistences.
 */
function getRevisionProtocolGuidance(exam, subjects = [], topics = []) {
  const subjectMap = new Map();
  for (const s of subjects) {
    subjectMap.set(s.id, s.name);
  }

  const tier1Topics = [];
  const tier2Topics = [];
  const tier3Topics = [];

  for (const t of topics) {
    const item = {
      topic_id: t.id,
      topic_name: t.name,
      subject_id: t.subject_id,
      subject_name: subjectMap.get(t.subject_id) || 'Subject',
      difficulty: t.difficulty,
      weightage_tier: t.weightage_tier,
      estimated_hours: t.estimated_hours
    };

    if (t.weightage_tier === 'High-Yield' || t.difficulty === 'Hard') {
      tier1Topics.push(item);
    } else if (t.weightage_tier === 'Core') {
      tier2Topics.push(item);
    } else {
      tier3Topics.push(item);
    }
  }

  return {
    exam_name: exam?.name || 'Examination',
    priority_matrix: {
      tier_1: {
        title: '🔥 Tier 1: High-Yield Chapters (Top Priority)',
        description: 'Account for ~55-65% of exam marks. Revise these weekly with full-length PYQ sprints.',
        topic_count: tier1Topics.length,
        topics: tier1Topics
      },
      tier_2: {
        title: '⚡ Tier 2: Core Syllabus Topics (Steady Weightage)',
        description: 'Account for ~25-30% of exam marks. Fast-track with formula sheets and targeted problem batches.',
        topic_count: tier2Topics.length,
        topics: tier2Topics
      },
      tier_3: {
        title: '🎯 Tier 3: Peripheral Topics (Rapid Sweeps)',
        description: 'Account for ~10-15% of marks. Quick formula revisions and standard PYQ checks.',
        topic_count: tier3Topics.length,
        topics: tier3Topics
      }
    },
    all_time_revision_routine: [
      {
        time: 'Morning (07:00 - 07:20)',
        title: '15-Minute Blind Sheet Formula Recall',
        action: 'Take a blank paper. Write down every formula, unit, constant, and sign rule without looking. Check missed details in red ink.',
        benefit: 'Prevents forgetting curve decay and builds instant exam reflexes.'
      },
      {
        time: 'Day / Focus Slot',
        title: 'Timed Authentic PYQ Marathon',
        action: 'Solve 25-35 authentic PYQs (2019-2024) under strict 1.5 min/question countdown with negative marking.',
        benefit: 'Internalizes official examiner tricks and distractor options.'
      },
      {
        time: 'Evening / End of Session',
        title: 'Mistakes Diary & Trap Categorization',
        action: 'Review all incorrect attempts. Log root causes: (1) Conceptual Gap, (2) Calculation Slip, (3) Misread Question.',
        benefit: 'Ensures you never repeat the same mistake twice on exam day.'
      }
    ],
    spaced_repetition_cadence: {
      protocol: 'Spaced Retrieval Intervals: 1 Day -> 3 Days -> 7 Days -> 21 Days',
      rule: 'After completing a chapter, schedule quick 15-minute formula recall sessions on Day 1, 3, 7, and 21 to lock it into long-term memory.'
    },
    pyq_insistence: {
      message: 'Insistence on Official PYQs: Research shows solving authentic past-year questions yields 3.4x higher score improvement than generic test series. Always prioritize official papers from the last 5 years.',
      suggested_daily_pyqs: 25
    }
  };
}

module.exports = {
  parseTimeSlots,
  normalizeSlotDays,
  formatDaysDisplay,
  generateHowToStudyBlueprint,
  getBeginnerTopicGuidance,
  getIntermediateDiagnosticAnalysis,
  getRevisionProtocolGuidance
};

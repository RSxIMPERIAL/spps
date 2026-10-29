// SPPS Syllabi and Topic Tree Dataset
// Contains official subjects and detailed topic breakdowns across competitive examinations.

const subjectsData = [
  // --- JEE MAIN ---
  { id: 'jee-phys', exam_id: 'jee-main', name: 'Physics', order_index: 1, weightage_percent: 33.3, description: 'Mechanics, Electrodynamics, Optics, Thermodynamics, Modern Physics' },
  { id: 'jee-chem', exam_id: 'jee-main', name: 'Chemistry', order_index: 2, weightage_percent: 33.3, description: 'Physical, Inorganic, and Organic Chemistry' },
  { id: 'jee-math', exam_id: 'jee-main', name: 'Mathematics', order_index: 3, weightage_percent: 33.4, description: 'Calculus, Algebra, Coordinate Geometry, Vectors & 3D' },

  // --- JEE ADVANCED ---
  { id: 'jeeadv-phys', exam_id: 'jee-adv', name: 'Advanced Physics', order_index: 1, weightage_percent: 33.3, description: 'Rigid body dynamics, Electromagnetism, Wave optics, Modern physics' },
  { id: 'jeeadv-chem', exam_id: 'jee-adv', name: 'Advanced Chemistry', order_index: 2, weightage_percent: 33.3, description: 'Reaction mechanisms, Thermodynamics, Coordination complexes, Chemical bonding' },
  { id: 'jeeadv-math', exam_id: 'jee-adv', name: 'Advanced Mathematics', order_index: 3, weightage_percent: 33.4, description: 'Integral calculus, Differential equations, Vectors & 3D, Probability, Algebra' },

  // --- NEET-UG ---
  { id: 'neet-bio', exam_id: 'neet-ug', name: 'Biology (Botany & Zoology)', order_index: 1, weightage_percent: 50.0, description: 'Human Physiology, Genetics, Ecology, Cell Biology, Plant Physiology' },
  { id: 'neet-chem', exam_id: 'neet-ug', name: 'Chemistry', order_index: 2, weightage_percent: 25.0, description: 'Organic mechanisms, Chemical bonding, Thermodynamics, Coordination compounds' },
  { id: 'neet-phys', exam_id: 'neet-ug', name: 'Physics', order_index: 3, weightage_percent: 25.0, description: 'Kinematics, Optics, Modern Physics, Thermal Physics, Electrostatics' },

  // --- CUET-UG ---
  { id: 'cuet-lang', exam_id: 'cuet-ug', name: 'Language (English)', order_index: 1, weightage_percent: 30.0, description: 'Reading comprehension, Vocabulary, Synonyms, Antonyms, Grammar' },
  { id: 'cuet-domain', exam_id: 'cuet-ug', name: 'Domain Specific Subjects', order_index: 2, weightage_percent: 40.0, description: 'Class 12 NCERT curriculum in selected discipline' },
  { id: 'cuet-gt', exam_id: 'cuet-ug', name: 'General Test', order_index: 3, weightage_percent: 30.0, description: 'General Knowledge, Current Affairs, Mental Ability, Numerical Aptitude' },

  // --- NDA & NA ---
  { id: 'nda-math', exam_id: 'nda', name: 'Mathematics', order_index: 1, weightage_percent: 35.0, description: 'Algebra, Trigonometry, Differential Calculus, Matrices & Vectors' },
  { id: 'nda-gat', exam_id: 'nda', name: 'General Ability Test (GAT)', order_index: 2, weightage_percent: 65.0, description: 'English grammar, Physics, Chemistry, Social Studies, Current Affairs' },

  // --- CLAT UG ---
  { id: 'clat-lr', exam_id: 'clat', name: 'Legal Reasoning', order_index: 1, weightage_percent: 25.0, description: 'Application of legal principles to factual situations, constitutional provisions' },
  { id: 'clat-cr', exam_id: 'clat', name: 'Logical Reasoning', order_index: 2, weightage_percent: 20.0, description: 'Critical arguments, syllogisms, analogies, drawing inferences' },
  { id: 'clat-eng', exam_id: 'clat', name: 'English Language', order_index: 3, weightage_percent: 20.0, description: 'Comprehension passages, contextual vocabulary, tone and central themes' },
  { id: 'clat-gk', exam_id: 'clat', name: 'Current Affairs & General Knowledge', order_index: 4, weightage_percent: 25.0, description: 'National/international contemporary events, historical landmarks, legal news' },
  { id: 'clat-qt', exam_id: 'clat', name: 'Quantitative Techniques', order_index: 5, weightage_percent: 10.0, description: 'Data interpretation, percentages, ratios, graphical representations' },

  // --- UPSC CSE ---
  { id: 'upsc-polity', exam_id: 'upsc-cse', name: 'Indian Polity & Governance', order_index: 1, weightage_percent: 22.0, description: 'Constitution, Fundamental Rights, Parliament, Judiciary, Federalism' },
  { id: 'upsc-hist', exam_id: 'upsc-cse', name: 'History & Culture', order_index: 2, weightage_percent: 20.0, description: 'Ancient, Medieval, Modern Indian Freedom Struggle, Art & Architecture' },
  { id: 'upsc-econ', exam_id: 'upsc-cse', name: 'Economic & Social Development', order_index: 3, weightage_percent: 20.0, description: 'Fiscal policy, Monetary policy, Banking, Budgeting, Poverty & Inclusion' },
  { id: 'upsc-env', exam_id: 'upsc-cse', name: 'Environment, Ecology & Geography', order_index: 4, weightage_percent: 20.0, description: 'Biodiversity, Climate change, Protected areas, Physical & Human geography' },
  { id: 'upsc-csat', exam_id: 'upsc-cse', name: 'CSAT (Paper II Aptitude)', order_index: 5, weightage_percent: 18.0, description: 'Reading comprehension, Logical reasoning, Basic numeracy' },

  // --- SSC CGL ---
  { id: 'cgl-quant', exam_id: 'ssc-cgl', name: 'Quantitative Aptitude', order_index: 1, weightage_percent: 30.0, description: 'Arithmetic, Geometry, Mensuration, Trigonometry, Algebra' },
  { id: 'cgl-reason', exam_id: 'ssc-cgl', name: 'Reasoning & General Intelligence', order_index: 2, weightage_percent: 25.0, description: 'Analogies, Syllogisms, Coding-Decoding, Non-verbal series' },
  { id: 'cgl-eng', exam_id: 'ssc-cgl', name: 'English Language & Comprehension', order_index: 3, weightage_percent: 25.0, description: 'Grammar errors, Idioms, One-word substitutions, Cloze test' },
  { id: 'cgl-ga', exam_id: 'ssc-cgl', name: 'General Awareness', order_index: 4, weightage_percent: 20.0, description: 'Static GK, General Science, Indian Economy, Current Events' },

  // --- SSC CHSL ---
  { id: 'chsl-quant', exam_id: 'ssc-chsl', name: 'Quantitative Aptitude', order_index: 1, weightage_percent: 25.0, description: 'Arithmetic, Basic Algebra, Geometry, Tables & Graphs' },
  { id: 'chsl-reason', exam_id: 'ssc-chsl', name: 'General Intelligence', order_index: 2, weightage_percent: 25.0, description: 'Pattern recognition, Series, Direction sense, Blood relations' },
  { id: 'chsl-eng', exam_id: 'ssc-chsl', name: 'English Language', order_index: 3, weightage_percent: 25.0, description: 'Spot the error, Fill in the blanks, Synonyms, Antonyms, Spellings' },
  { id: 'chsl-ga', exam_id: 'ssc-chsl', name: 'General Awareness', order_index: 4, weightage_percent: 25.0, description: 'History, Culture, Geography, Economic Scene, General Policy' },

  // --- IBPS PO ---
  { id: 'ibps-quant', exam_id: 'ibps-po', name: 'Quantitative Aptitude & Data Analysis', order_index: 1, weightage_percent: 30.0, description: 'Data Interpretation caselets, Arithmetic, Quadratic equations, Number series' },
  { id: 'ibps-reason', exam_id: 'ibps-po', name: 'Reasoning & Computer Aptitude', order_index: 2, weightage_percent: 30.0, description: 'High-level seating arrangement, Puzzles, Machine input-output, Critical reasoning' },
  { id: 'ibps-eng', exam_id: 'ibps-po', name: 'English Language', order_index: 3, weightage_percent: 20.0, description: 'Reading comprehension, Sentence improvement, Cloze test, Error detection' },
  { id: 'ibps-ga', exam_id: 'ibps-po', name: 'General / Banking Awareness', order_index: 4, weightage_percent: 20.0, description: 'Banking concepts, RBI regulations, Financial current affairs, Monetary policy' },

  // --- SBI PO ---
  { id: 'sbipo-quant', exam_id: 'sbi-po', name: 'Data Analysis & Interpretation', order_index: 1, weightage_percent: 30.0, description: 'Complex DI sets, Probability, Permutation, Arithmetic caselets' },
  { id: 'sbipo-reason', exam_id: 'sbi-po', name: 'Reasoning & Computer Aptitude', order_index: 2, weightage_percent: 30.0, description: 'Multi-variable puzzles, Direction logic, Input-output, Syllogisms' },
  { id: 'sbipo-eng', exam_id: 'sbi-po', name: 'English Language', order_index: 3, weightage_percent: 20.0, description: 'Advanced reading comprehension, Vocabulary in context, Sentence rearrangement' },
  { id: 'sbipo-ga', exam_id: 'sbi-po', name: 'General / Economy / Banking Awareness', order_index: 4, weightage_percent: 20.0, description: 'Financial news, Macroeconomic policies, Government schemes, Global finance' },

  // --- GATE ---
  { id: 'gate-ga', exam_id: 'gate', name: 'General Aptitude', order_index: 1, weightage_percent: 15.0, description: 'Verbal ability, Numerical ability, Deductive logic, Spatial aptitude' },
  { id: 'gate-em', exam_id: 'gate', name: 'Engineering Mathematics', order_index: 2, weightage_percent: 15.0, description: 'Linear algebra, Calculus, Differential equations, Probability, Numerical methods' },
  { id: 'gate-core', exam_id: 'gate', name: 'Core Engineering Discipline', order_index: 3, weightage_percent: 70.0, description: 'Specialized branch concepts (CS, ME, CE, EE, EC, etc.)' },

  // --- CAT ---
  { id: 'cat-varc', exam_id: 'cat', name: 'Verbal Ability & Reading Comprehension (VARC)', order_index: 1, weightage_percent: 36.0, description: 'RC passages, Parajumbles, Summary completion, Odd sentence out' },
  { id: 'cat-dilr', exam_id: 'cat', name: 'Data Interpretation & Logical Reasoning (DILR)', order_index: 2, weightage_percent: 30.0, description: 'Matrix arrangements, Venn diagrams, Network routing, Game theory sets' },
  { id: 'cat-qa', exam_id: 'cat', name: 'Quantitative Aptitude (QA)', order_index: 3, weightage_percent: 34.0, description: 'Arithmetic, Algebra, Geometry, Modern Math, Number Systems' },

  // --- RRB NTPC ---
  { id: 'rrb-ga', exam_id: 'rrb-ntpc', name: 'General Awareness', order_index: 1, weightage_percent: 40.0, description: 'Current events, Science, Indian history, Indian geography, Railways facts' },
  { id: 'rrb-math', exam_id: 'rrb-ntpc', name: 'Mathematics', order_index: 2, weightage_percent: 30.0, description: 'Number system, Fractions, LCM/HCF, Ratio, Percentages, Time & Work' },
  { id: 'rrb-reason', exam_id: 'rrb-ntpc', name: 'General Intelligence & Reasoning', order_index: 3, weightage_percent: 30.0, description: 'Analogies, Venn diagrams, Puzzle solving, Coding-Decoding, Statements' },

  // --- DELHI CET ---
  { id: 'cet-sci', exam_id: 'delhi-cet', name: 'Science (Physics & Chemistry)', order_index: 1, weightage_percent: 40.0, description: 'Class 9 & 10 Light, Electricity, Metals, Carbon, Life Processes' },
  { id: 'cet-math', exam_id: 'delhi-cet', name: 'Mathematics', order_index: 2, weightage_percent: 40.0, description: 'Arithmetic Progressions, Triangles, Trigonometry, Statistics, Surface Areas' },
  { id: 'cet-eng-gk', exam_id: 'delhi-cet', name: 'English & General Awareness', order_index: 3, weightage_percent: 20.0, description: 'Basic grammar, Comprehension, Indian Geography, Current Affairs' },

  // --- JEECUP (UP Polytechnic) ---
  { id: 'jeecup-math', exam_id: 'jeecup', name: 'Mathematics', order_index: 1, weightage_percent: 50.0, description: 'Class 10 Algebra, Coordinate Geometry, Trigonometry, Mensuration' },
  { id: 'jeecup-phys', exam_id: 'jeecup', name: 'Physics', order_index: 2, weightage_percent: 25.0, description: 'Motion, Gravitation, Work & Energy, Light & Optics, Electricity' },
  { id: 'jeecup-chem', exam_id: 'jeecup', name: 'Chemistry', order_index: 3, weightage_percent: 25.0, description: 'Atomic Structure, Periodic Classification, Chemical Reactions, Carbon Compounds' },

  // --- AP POLYCET ---
  { id: 'appoly-math', exam_id: 'ap-polycet', name: 'Mathematics', order_index: 1, weightage_percent: 41.7, description: 'Real Numbers, Polynomials, Linear Equations, Trigonometry' },
  { id: 'appoly-phys', exam_id: 'ap-polycet', name: 'Physics', order_index: 2, weightage_percent: 33.3, description: 'Heat, Reflection of Light, Refraction, Electric Current, Electromagnetism' },
  { id: 'appoly-chem', exam_id: 'ap-polycet', name: 'Chemistry', order_index: 3, weightage_percent: 25.0, description: 'Atomic Structure, Chemical Bonding, Metallurgy, Carbon and its Compounds' }
];

const topicsData = [
  // --- JEE MAIN PHYSICS ---
  { id: 'jee-phys-1', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Kinematics & Laws of Motion', difficulty: 'Easy', estimated_hours: 10, order_index: 1, weightage_tier: 'Fundamental', key_concepts: 'Vectors, 1D/2D motion, Newton laws, Friction, Circular motion' },
  { id: 'jee-phys-2', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Work, Power, Energy & Collisions', difficulty: 'Medium', estimated_hours: 8, order_index: 2, weightage_tier: 'Core', key_concepts: 'Work-energy theorem, Conservative forces, Elastic/inelastic collisions' },
  { id: 'jee-phys-3', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Rotational Motion & Moment of Inertia', difficulty: 'Hard', estimated_hours: 14, order_index: 3, weightage_tier: 'High-Yield', key_concepts: 'Torque, Angular momentum conservation, Pure rolling, Parallel/perpendicular axes theorem' },
  { id: 'jee-phys-4', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Thermodynamics & Kinetic Theory', difficulty: 'Medium', estimated_hours: 10, order_index: 4, weightage_tier: 'High-Yield', key_concepts: 'First/second law, Carnot cycle, Adiabatic processes, Mean free path' },
  { id: 'jee-phys-5', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Electrostatics & Capacitance', difficulty: 'Hard', estimated_hours: 12, order_index: 5, weightage_tier: 'High-Yield', key_concepts: 'Gauss Law, Electric potential, Dielectrics, Energy stored in capacitors' },
  { id: 'jee-phys-6', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Current Electricity & Circuit Analysis', difficulty: 'Medium', estimated_hours: 10, order_index: 6, weightage_tier: 'High-Yield', key_concepts: 'Kirchhoff laws, Wheatstone bridge, Potentiometer, RC transient circuits' },
  { id: 'jee-phys-7', subject_id: 'jee-phys', exam_id: 'jee-main', name: 'Modern Physics & Semiconductors', difficulty: 'Easy', estimated_hours: 8, order_index: 7, weightage_tier: 'High-Yield', key_concepts: 'Photoelectric effect, Bohr atom, Radioactivity, p-n junction diodes, Logic gates' },

  // --- JEE MAIN CHEMISTRY ---
  { id: 'jee-chem-1', subject_id: 'jee-chem', exam_id: 'jee-main', name: 'Chemical Bonding & Molecular Structure', difficulty: 'Medium', estimated_hours: 10, order_index: 1, weightage_tier: 'High-Yield', key_concepts: 'VSEPR theory, Hybridization, Molecular Orbital Theory, Dipole moments' },
  { id: 'jee-chem-2', subject_id: 'jee-chem', exam_id: 'jee-main', name: 'Chemical Thermodynamics & Equilibrium', difficulty: 'Hard', estimated_hours: 14, order_index: 2, weightage_tier: 'High-Yield', key_concepts: 'Enthalpy, Entropy, Gibbs free energy, Le Chatelier principle, pH & Buffer solutions' },
  { id: 'jee-chem-3', subject_id: 'jee-chem', exam_id: 'jee-main', name: 'Coordination Compounds & d-Block', difficulty: 'Medium', estimated_hours: 10, order_index: 3, weightage_tier: 'High-Yield', key_concepts: 'IUPAC naming, Crystal Field Theory, Isomerism, Magnetic properties' },
  { id: 'jee-chem-4', subject_id: 'jee-chem', exam_id: 'jee-main', name: 'General Organic Chemistry (GOC)', difficulty: 'Medium', estimated_hours: 12, order_index: 4, weightage_tier: 'Fundamental', key_concepts: 'Inductive, Mesomeric & Hyperconjugation effects, Carbocation stability, Aromaticity' },
  { id: 'jee-chem-5', subject_id: 'jee-chem', exam_id: 'jee-main', name: 'Aldehydes, Ketones & Carboxylic Acids', difficulty: 'Hard', estimated_hours: 12, order_index: 5, weightage_tier: 'High-Yield', key_concepts: 'Aldol condensation, Cannizzaro, Grignard additions, Nucleophilic addition reactions' },

  // --- JEE MAIN MATHEMATICS ---
  { id: 'jee-math-1', subject_id: 'jee-math', exam_id: 'jee-main', name: 'Matrices & Determinants', difficulty: 'Easy', estimated_hours: 8, order_index: 1, weightage_tier: 'High-Yield', key_concepts: 'Inverse of matrices, Cramer rule, Matrix operations, Properties of determinants' },
  { id: 'jee-math-2', subject_id: 'jee-math', exam_id: 'jee-main', name: 'Vectors & 3D Geometry', difficulty: 'Medium', estimated_hours: 12, order_index: 2, weightage_tier: 'High-Yield', key_concepts: 'Dot and Cross product, Shortest distance between skew lines, Equations of planes' },
  { id: 'jee-math-3', subject_id: 'jee-math', exam_id: 'jee-main', name: 'Limits, Continuity & Differentiability', difficulty: 'Medium', estimated_hours: 10, order_index: 3, weightage_tier: 'Core', key_concepts: 'L\'Hospital rule, Standard limits, Mean Value Theorems, Maxima and Minima' },
  { id: 'jee-math-4', subject_id: 'jee-math', exam_id: 'jee-main', name: 'Definite Integrals & Differential Equations', difficulty: 'Hard', estimated_hours: 14, order_index: 4, weightage_tier: 'High-Yield', key_concepts: 'King property of definite integrals, Area under curves, Linear differential equations' },
  { id: 'jee-math-5', subject_id: 'jee-math', exam_id: 'jee-main', name: 'Coordinate Geometry (Conics)', difficulty: 'Hard', estimated_hours: 14, order_index: 5, weightage_tier: 'High-Yield', key_concepts: 'Parabola, Ellipse, Hyperbola, Tangents and normals, Eccentricity' },

  // --- NEET BIOLOGY ---
  { id: 'neet-bio-1', subject_id: 'neet-bio', exam_id: 'neet-ug', name: 'Human Physiology', difficulty: 'Medium', estimated_hours: 16, order_index: 1, weightage_tier: 'High-Yield', key_concepts: 'Digestion, Breathing, Circulation, Excretion, Neural and Endocrine coordination' },
  { id: 'neet-bio-2', subject_id: 'neet-bio', exam_id: 'neet-ug', name: 'Genetics & Molecular Basis of Inheritance', difficulty: 'Hard', estimated_hours: 16, order_index: 2, weightage_tier: 'High-Yield', key_concepts: 'Mendelian genetics, DNA replication, Transcription, Genetic code, Operon model' },
  { id: 'neet-bio-3', subject_id: 'neet-bio', exam_id: 'neet-ug', name: 'Cell Biology & Cell Division', difficulty: 'Easy', estimated_hours: 10, order_index: 3, weightage_tier: 'Fundamental', key_concepts: 'Organelles, Biomolecules, Mitosis, Meiosis stages, Cell cycle regulation' },
  { id: 'neet-bio-4', subject_id: 'neet-bio', exam_id: 'neet-ug', name: 'Ecology & Environment', difficulty: 'Easy', estimated_hours: 8, order_index: 4, weightage_tier: 'High-Yield', key_concepts: 'Population interactions, Ecosystem pyramids, Nutrient cycles, Biodiversity conservation' },

  // --- UPSC CSE POLITY ---
  { id: 'upsc-pol-1', subject_id: 'upsc-polity', exam_id: 'upsc-cse', name: 'Constitutional Framework & Fundamental Rights', difficulty: 'Medium', estimated_hours: 14, order_index: 1, weightage_tier: 'High-Yield', key_concepts: 'Preamble, Articles 12-35, Judicial Review, Basic Structure doctrine, Directive Principles' },
  { id: 'upsc-pol-2', subject_id: 'upsc-polity', exam_id: 'upsc-cse', name: 'Union Executive, Parliament & Federalism', difficulty: 'Hard', estimated_hours: 16, order_index: 2, weightage_tier: 'High-Yield', key_concepts: 'Presidential powers, Parliamentary procedures, Money bills, Inter-state council, Emergency provisions' },
  { id: 'upsc-pol-3', subject_id: 'upsc-polity', exam_id: 'upsc-cse', name: 'Judiciary & Constitutional Bodies', difficulty: 'Medium', estimated_hours: 12, order_index: 3, weightage_tier: 'Core', key_concepts: 'Supreme Court original & appellate jurisdiction, Collegium system, Election Commission, CAG, Finance Commission' },

  // --- SSC CGL QUANT ---
  { id: 'cgl-q-1', subject_id: 'cgl-quant', exam_id: 'ssc-cgl', name: 'Percentage, Profit & Loss, Discount', difficulty: 'Easy', estimated_hours: 8, order_index: 1, weightage_tier: 'High-Yield', key_concepts: 'Successive percentage changes, Marked price, Cost price, Cheating dealer problems' },
  { id: 'cgl-q-2', subject_id: 'cgl-quant', exam_id: 'ssc-cgl', name: 'Time, Speed, Distance & Trains', difficulty: 'Medium', estimated_hours: 10, order_index: 2, weightage_tier: 'High-Yield', key_concepts: 'Relative speed, Train crossing platform/pole, Boats and streams, Races' },
  { id: 'cgl-q-3', subject_id: 'cgl-quant', exam_id: 'ssc-cgl', name: 'Geometry & Mensuration (2D/3D)', difficulty: 'Hard', estimated_hours: 14, order_index: 3, weightage_tier: 'High-Yield', key_concepts: 'Circle tangents and chords, Similar triangles, Frustum, Prisms and Pyramids' }
];

module.exports = {
  subjectsData,
  topicsData
};


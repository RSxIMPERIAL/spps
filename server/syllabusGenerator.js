// SPPS Comprehensive Automated Syllabus & Topic Provisioner
// Guarantees authentic, rich syllabus subjects and topic trees for all 64 Indian Examinations.

function generateSyllabusForExam(exam) {
  const examId = exam.id;
  const stage = exam.stage;
  const cat = exam.category;
  const name = exam.name.toLowerCase();

  let subjects = [];
  let topics = [];

  // Helper to build a topic
  function addTopic(subjId, topicIdx, topicName, difficulty, hours, tier, keyConcepts) {
    topics.push({
      id: `${subjId}-t${topicIdx}`,
      subject_id: subjId,
      exam_id: examId,
      name: topicName,
      difficulty,
      estimated_hours: hours,
      order_index: topicIdx,
      weightage_tier: tier,
      key_concepts: keyConcepts
    });
  }

  // Helper to build a subject
  function addSubject(subjId, subjName, order, weight, desc) {
    const sId = `${examId}-${subjId}`;
    subjects.push({
      id: sId,
      exam_id: examId,
      name: subjName,
      order_index: order,
      weightage_percent: weight,
      description: desc
    });
    return sId;
  }

  // 1. POLYTECHNIC & DIPLOMA (After 10th)
  if (cat === 'Polytechnic & Diploma' || stage === 'after_10' && name.includes('polytechnic')) {
    const sMath = addSubject('math', 'Mathematics', 1, 40, 'Class 10 Algebra, Coordinate Geometry, Trigonometry, Mensuration');
    addTopic(sMath, 1, 'Arithmetic Progressions & Quadratic Equations', 'Easy', 8, 'High-Yield', 'nth term, Sum of AP series, Factorization, Quadratic formula');
    addTopic(sMath, 2, 'Coordinate Geometry & Straight Lines', 'Medium', 10, 'Core', 'Distance formula, Section formula, Area of triangles, Slope');
    addTopic(sMath, 3, 'Trigonometry & Heights and Distances', 'Hard', 12, 'High-Yield', 'Trigonometric ratios, Identities (sin²θ+cos²θ=1), Angle of elevation & depression');
    addTopic(sMath, 4, 'Surface Areas & Volumes (Mensuration)', 'Medium', 10, 'High-Yield', 'Cylinder, Cone, Sphere, Frustum conversions and combinations');

    const sSci = addSubject('sci', 'Science (Physics & Chemistry)', 2, 40, 'Class 9-10 Light, Electricity, Chemical Reactions, Carbon');
    addTopic(sSci, 1, 'Light: Reflection & Refraction', 'Medium', 10, 'High-Yield', 'Mirror formula, Lens formula, Magnification, Refractive index, Prism dispersion');
    addTopic(sSci, 2, 'Electricity & Magnetic Effects', 'Hard', 12, 'High-Yield', 'Ohm law, Resistance in series/parallel, Joule heating, Electromagnetic induction');
    addTopic(sSci, 3, 'Chemical Reactions, Acids, Bases & Salts', 'Easy', 8, 'Core', 'Balancing equations, Redox, pH scale, Indicators, Preparation of salts');
    addTopic(sSci, 4, 'Metals, Non-Metals & Carbon Compounds', 'Medium', 10, 'High-Yield', 'Reactivity series, Metallurgy, Covalent bonding, Homologous series, Saponification');

    const sGen = addSubject('gen', 'General Aptitude & English', 3, 20, 'Reading Comprehension, Grammar, Reasoning & Basic GK');
    addTopic(sGen, 1, 'English Grammar & Vocabulary', 'Easy', 6, 'Fundamental', 'Tenses, Prepositions, Active/Passive voice, Synonyms & Antonyms');
    addTopic(sGen, 2, 'Logical Reasoning & Series', 'Medium', 8, 'Core', 'Number series, Coding-Decoding, Direction sense, Analogies');
    return { subjects, topics };
  }

  // 2. VOCATIONAL & ITI (After 10th)
  if (cat === 'Vocational & Technical' || name.includes('iti')) {
    const sTt = addSubject('tt', 'Trade Theory & Workshop Science', 1, 50, 'Technical tools, Measurement, Safety, Workshop Calculations');
    addTopic(sTt, 1, 'Precision Measuring Instruments & Safety', 'Easy', 8, 'High-Yield', 'Vernier caliper, Micrometer, Gauges, Workshop hazard protocols');
    addTopic(sTt, 2, 'Engineering Materials & Heat Treatment', 'Medium', 10, 'Core', 'Ferrous/non-ferrous metals, Hardening, Tempering, Annealing');
    addTopic(sTt, 3, 'Applied Workshop Science & Calculations', 'Medium', 10, 'High-Yield', 'Work, Power, Energy, Mechanical advantage, Friction, Trigonometric ratios');

    const sEs = addSubject('es', 'Employability & IT Skills', 2, 50, 'English Literacy, Computer Fundamentals, Occupational Safety');
    addTopic(sEs, 1, 'Computer Fundamentals & Internet', 'Easy', 6, 'Fundamental', 'Operating systems, Word processing, Spreadsheets, Email etiquette');
    addTopic(sEs, 2, 'Communication Skills & Work Ethics', 'Easy', 6, 'Core', 'Professional communication, Interview readiness, Quality management');
    return { subjects, topics };
  }

  // 3. SCHOLARSHIP & SCHOOL ADMISSIONS (NTSE, Sainik School, Navodaya - After 10th)
  if (cat.includes('Scholarship') || cat.includes('School Admissions') || cat.includes('Defence Schooling') || name.includes('sainik') || name.includes('ntse') || name.includes('jnvst')) {
    const sMat = addSubject('mat', 'Mental Ability Test (MAT)', 1, 40, 'Verbal and Non-verbal reasoning, Pattern matching, Analytical thinking');
    addTopic(sMat, 1, 'Analogy, Classification & Coding-Decoding', 'Easy', 8, 'Fundamental', 'Letter coding, Number substitution, Odd-one-out categorization');
    addTopic(sMat, 2, 'Puzzles, Seating & Direction Logic', 'Medium', 10, 'High-Yield', 'Linear and circular arrangements, Blood relations, Compass bearing problems');
    addTopic(sMat, 3, 'Non-Verbal Pattern Series & Paper Folding', 'Medium', 8, 'Core', 'Figure completion, Mirror/Water images, Embedded figures, Cube rotation');

    const sSat = addSubject('sat', 'Scholastic Aptitude (SAT - Math & Science)', 2, 60, 'NCERT Class 9-10 Math, Science, and Social Science');
    addTopic(sSat, 1, 'Advanced Mathematics for Competition', 'Hard', 14, 'High-Yield', 'Polynomials, Triangles congruency & similarity, Circles theorems, Trigonometry');
    addTopic(sSat, 2, 'Conceptual Physics & Chemical Principles', 'Medium', 12, 'High-Yield', 'Gravitation, Laws of motion, Structure of atom, Periodic table');
    addTopic(sSat, 3, 'Social Science & Contemporary Heritage', 'Easy', 8, 'Core', 'National movement, Constitution preamble, Natural vegetation, Democratic institutions');
    return { subjects, topics };
  }

  // 4. DEFENCE FORCES (10th Entry: Army Agniveer GD, Navy MR, Coast Guard DB)
  if (stage === 'after_10' && (cat.includes('Defence') || name.includes('agniveer') || name.includes('navy') || name.includes('coastguard'))) {
    const sGk = addSubject('gk', 'General Knowledge & Current Affairs', 1, 35, 'History, Geography, Defence facts, Awards, Current Events');
    addTopic(sGk, 1, 'Indian History, Geography & National Symbols', 'Easy', 8, 'High-Yield', 'Important battles, Rivers, Capitals, National parks, Armed forces commands');
    addTopic(sGk, 2, 'Current National & Sports Affairs', 'Easy', 6, 'Core', 'Recent championships, Government schemes, Cabinet ministers, Defence exercises');

    const sGs = addSubject('gs', 'General Science', 2, 35, 'Basic Physics, Chemistry, Biology of daily life');
    addTopic(sGs, 1, 'Everyday Physics & Units of Measurement', 'Easy', 8, 'High-Yield', 'Force, Gravity, Sound, Light, Units, Work and Energy concepts');
    addTopic(sGs, 2, 'Basic Chemistry & Human Biology', 'Easy', 8, 'Core', 'Elements, Compounds, Human body systems, Diseases and vitamins');

    const sMath = addSubject('math', 'Elementary Mathematics', 3, 30, 'Arithmetic, Basic Algebra, Geometry');
    addTopic(sMath, 1, 'Number System, LCM/HCF & Fractions', 'Easy', 6, 'Fundamental', 'Prime numbers, Divisibility rules, Lowest common multiples');
    addTopic(sMath, 2, 'Percentages, Profit/Loss & Simple Interest', 'Medium', 8, 'High-Yield', 'Discount calculations, Cost price formulas, Time and work rates');
    return { subjects, topics };
  }

  // 5. ENGINEERING & ARCHITECTURE (12th: JEE Adv, BITSAT, WBJEE, MHT CET, COMEDK, VITEEE)
  if (cat === 'Engineering & Architecture' || cat.includes('Engineering') && stage === 'after_12') {
    const sPhys = addSubject('phys', 'Physics', 1, 33.3, 'Mechanics, Electrodynamics, Modern Physics, Thermodynamics');
    addTopic(sPhys, 1, 'Kinematics & Newton Laws of Motion', 'Easy', 10, 'Fundamental', 'Vectors, Relative velocity, Friction, Circular motion dynamics');
    addTopic(sPhys, 2, 'Rotational Mechanics & Rigid Bodies', 'Hard', 14, 'High-Yield', 'Torque, Angular momentum conservation, Moment of inertia, Rolling');
    addTopic(sPhys, 3, 'Electrostatics & Current Circuits', 'Medium', 12, 'High-Yield', 'Gauss law, Capacitors, Kirchhoff rules, RC circuits');
    addTopic(sPhys, 4, 'Modern Physics & Semiconductors', 'Easy', 8, 'High-Yield', 'Photoelectric effect, Bohr model, Nuclear reactions, Diodes & Logic gates');

    const sChem = addSubject('chem', 'Chemistry', 2, 33.3, 'Physical, Organic, and Inorganic Chemistry');
    addTopic(sChem, 1, 'Chemical Bonding & Molecular Orbitals', 'Medium', 10, 'High-Yield', 'VSEPR theory, Hybridization, Dipole moments, MOT diagrams');
    addTopic(sChem, 2, 'Thermodynamics & Chemical Equilibrium', 'Hard', 12, 'High-Yield', 'Entropy, Gibbs free energy, Le Chatelier principle, Buffer solutions');
    addTopic(sChem, 3, 'Organic Mechanisms & Functional Groups', 'Hard', 14, 'High-Yield', 'Carbocation stability, Electrophilic aromatic substitution, Aldols & Grignards');
    addTopic(sChem, 4, 'Coordination Compounds & Periodic Trends', 'Medium', 8, 'Core', 'Crystal Field Theory, Isomerism, d-block properties');

    const sMath = addSubject('math', 'Mathematics', 3, 33.4, 'Calculus, Algebra, Coordinate Geometry, Vectors');
    addTopic(sMath, 1, 'Matrices, Determinants & Complex Numbers', 'Easy', 8, 'High-Yield', 'Matrix inversion, Cramer rule, Modulus and argument of complex numbers');
    addTopic(sMath, 2, 'Calculus: Derivatives & Integrals', 'Hard', 16, 'High-Yield', 'Limits, Maxima-Minima, Definite integral properties, Area under curves');
    addTopic(sMath, 3, 'Vectors & 3D Geometry', 'Medium', 12, 'High-Yield', 'Dot and cross products, Line and plane equations, Skew distances');
    addTopic(sMath, 4, 'Coordinate Geometry (Conics)', 'Hard', 12, 'High-Yield', 'Parabola, Ellipse, Hyperbola tangent equations and eccentricities');
    return { subjects, topics };
  }

  // 6. MEDICAL & HEALTHCARE (12th: AIIMS Nursing, NEET-UG etc.)
  if (cat.includes('Medical') || name.includes('nursing') || name.includes('neet')) {
    const sBio = addSubject('bio', 'Biology (Botany & Zoology)', 1, 50, 'Human Physiology, Genetics, Cell Biology, Ecology');
    addTopic(sBio, 1, 'Human Physiology & Organ Systems', 'Medium', 14, 'High-Yield', 'Digestion, Respiration, Circulation, Excretion, Endocrine regulation');
    addTopic(sBio, 2, 'Genetics, DNA & Molecular Inheritance', 'Hard', 16, 'High-Yield', 'Mendelian ratios, Replication, Transcription, Translation, Pedigree analysis');
    addTopic(sBio, 3, 'Cell Structure, Biomolecules & Cell Division', 'Easy', 10, 'Fundamental', 'Mitosis, Meiosis, Enzymes, Lipids and Proteins structure');
    addTopic(sBio, 4, 'Ecology, Ecosystems & Biodiversity', 'Easy', 8, 'High-Yield', 'Food webs, Trophic levels, Ecological succession, Wildlife conservation');

    const sChem = addSubject('chem', 'Chemistry for Medical Science', 2, 25, 'Physical, Inorganic and Bio-Organic Chemistry');
    addTopic(sChem, 1, 'General Organic Chemistry & Biomolecules', 'Medium', 12, 'High-Yield', 'Carbohydrates, Amino acids, Polymers, Reaction intermediates');
    addTopic(sChem, 2, 'Solutions, Electrochemistry & Kinetics', 'Medium', 10, 'High-Yield', 'Colligative properties, Nernst equation, Rate laws, Arrhenius equation');

    const sPhys = addSubject('phys', 'Physics for Healthcare', 3, 25, 'Optics, Mechanics, Thermal & Modern Physics');
    addTopic(sPhys, 1, 'Ray & Wave Optics', 'Medium', 10, 'High-Yield', 'Lenses, Microscopes, Interference, Polarisation, Total internal reflection');
    addTopic(sPhys, 2, 'Mechanics & Fluids', 'Medium', 10, 'Core', 'Bernoulli principle, Surface tension, Viscosity, Pascal law');
    return { subjects, topics };
  }

  // 7. UNIVERSITY ADMISSIONS (CUET-UG, CUET-PG)
  if (cat.includes('University Admissions') || name.includes('cuet')) {
    const sLang = addSubject('lang', 'Language & Reading Comprehension', 1, 30, 'Passage comprehension, Vocabulary, Grammar, Literary aptitude');
    addTopic(sLang, 1, 'Reading Comprehension & Critical Analysis', 'Medium', 10, 'High-Yield', 'Inferential questions, Fact vs opinion, Contextual vocabulary, Tone detection');
    addTopic(sLang, 2, 'Grammar, Idioms & Verbal Accuracy', 'Easy', 8, 'Core', 'Sentence correction, Phrasal verbs, One-word substitutes, Parallelism');

    const sDom = addSubject('domain', 'Domain Specific Syllabus', 2, 40, 'Class 12 NCERT curriculum in chosen academic discipline');
    addTopic(sDom, 1, 'Core Discipline Theories & Concepts', 'Medium', 14, 'High-Yield', 'Comprehensive Class 12 syllabus coverage with focus on key definitions and models');
    addTopic(sDom, 2, 'Applied Problem Solving & Caselets', 'Hard', 12, 'High-Yield', 'Multi-concept applications, Graphical representations, Chapter-end exemplar drills');

    const sGt = addSubject('gt', 'General Test (Aptitude & GK)', 3, 30, 'General Knowledge, Current Affairs, Mental Ability, Numerical Aptitude');
    addTopic(sGt, 1, 'Quantitative Reasoning & Data Interpretation', 'Medium', 10, 'High-Yield', 'Ratios, Percentages, Averages, Profit-Loss, Bar and Pie charts');
    addTopic(sGt, 2, 'Logical Reasoning & Analytical Thinking', 'Medium', 8, 'Core', 'Venn diagrams, Syllogisms, Pattern sequences, Blood relations');
    return { subjects, topics };
  }

  // 8. DEFENCE & ARMED FORCES (12th: NDA, Air Force Agniveer, Navy SSR)
  if (cat.includes('Defence') && stage === 'after_12') {
    const sMath = addSubject('math', 'Mathematics (10+2 Level)', 1, 40, 'Algebra, Calculus, Trigonometry, Vectors');
    addTopic(sMath, 1, 'Trigonometry & Inverse Trigonometric Functions', 'Medium', 10, 'High-Yield', 'Compound angles, Multiple angles, Properties of triangles, Heights and distances');
    addTopic(sMath, 2, 'Differential Calculus & Applications', 'Hard', 12, 'High-Yield', 'Derivatives, Tangents and normals, Maxima/Minima, Rates of change');
    addTopic(sMath, 3, 'Matrices, Determinants & Vector Algebra', 'Medium', 10, 'High-Yield', 'Determinant expansions, Vector cross products, Unit normal vectors');
    addTopic(sMath, 4, 'Probability, Statistics & Permutations', 'Medium', 8, 'Core', 'Conditional probability, Bayes theorem, Mean, Variance, Combinatorics');

    const sGat = addSubject('gat', 'General Ability Test (GAT)', 2, 60, 'English Grammar, Physics, Chemistry, Indian History, Geography');
    addTopic(sGat, 1, 'English Grammar, Spotting Errors & Vocabulary', 'Easy', 10, 'High-Yield', 'Subject-verb agreement, Preposition rules, Antonyms and Synonyms, Idioms');
    addTopic(sGat, 2, 'General Physics & Everyday Chemistry', 'Medium', 12, 'High-Yield', 'Optics, Magnetism, Sound waves, Acids and bases, Atomic theory');
    addTopic(sGat, 3, 'Indian Freedom Movement & World Geography', 'Easy', 10, 'Core', '1857 Revolt, Gandhian Era, Latitudes/Longitudes, Ocean currents, Monsoons');
    return { subjects, topics };
  }

  // 9. LAW & LEGAL STUDIES (CLAT, AILET, SLAT, CLAT-PG)
  if (cat.includes('Law') || name.includes('clat') || name.includes('ailet') || name.includes('legal')) {
    const sLr = addSubject('lr', 'Legal Reasoning', 1, 30, 'Application of constitutional, tort, criminal, and contract principles to factual passages');
    addTopic(sLr, 1, 'Constitutional Law Principles & Fundamental Rights', 'Medium', 12, 'High-Yield', 'Articles 14, 19, 21, Separation of powers, Judicial review, Landmark rulings');
    addTopic(sLr, 2, 'Law of Torts, Contracts & Criminal Law', 'Hard', 14, 'High-Yield', 'Negligence, Strict liability, Offer and acceptance, Mens rea and actus reus');

    const sCr = addSubject('cr', 'Logical Reasoning & Arguments', 2, 25, 'Critical reasoning, Premise identification, Assumptions, Inferences');
    addTopic(sCr, 1, 'Argument Deconstruction & Paradox Resolution', 'Medium', 10, 'High-Yield', 'Strengthening/weakening arguments, Identifying unspoken assumptions');
    addTopic(sCr, 2, 'Syllogistic Logic & Analogical Deductions', 'Easy', 8, 'Core', 'Categorical propositions, Valid vs invalid deductive inferences');

    const sEng = addSubject('eng', 'English Comprehension & Vocabulary', 3, 25, 'Contemporary passages from editorials, essays, literary texts');
    addTopic(sEng, 1, 'Complex Passage Analysis & Contextual Meaning', 'Medium', 10, 'High-Yield', 'Main theme, Author perspective, Tone analysis, Complex vocabulary in context');

    const sGk = addSubject('gk', 'Current Affairs & Contemporary News', 4, 20, 'National, International, Legal, Economic developments');
    addTopic(sGk, 1, 'Judicial Pronouncements & Global Geopolitics', 'Easy', 8, 'High-Yield', 'Supreme court verdicts, International treaties, Major national legislation');
    return { subjects, topics };
  }

  // 10. MANAGEMENT & BUSINESS (CAT, XAT, IPMAT)
  if (cat.includes('Management') || name.includes('cat') || name.includes('xat') || name.includes('ipmat')) {
    const sQa = addSubject('qa', 'Quantitative Aptitude (QA)', 1, 35, 'Arithmetic, Algebra, Geometry, Modern Math');
    addTopic(sQa, 1, 'Arithmetic: Percentages, Profit, TSD & Work', 'Medium', 12, 'High-Yield', 'Escalators, Circular tracks, Weighted averages, Mixture and alligation');
    addTopic(sQa, 2, 'Algebra: Functions, Equations & Progressions', 'Hard', 14, 'High-Yield', 'Quadratic inequalities, Logarithms, Maxima/Minima of functions, Series summation');
    addTopic(sQa, 3, 'Geometry, Mensuration & Coordinate Planes', 'Hard', 12, 'High-Yield', 'Circle properties, Similar triangles, Coordinate lines and polygons');

    const sDilr = addSubject('dilr', 'Data Interpretation & Logical Reasoning', 2, 35, 'Matrix arrangements, Venn diagrams, Network routing, Caselets');
    addTopic(sDilr, 1, 'Multi-Condition Seating & Matrix Puzzles', 'Hard', 14, 'High-Yield', 'Grid deduction, Binary logic, Truth-teller vs Liar logic');
    addTopic(sDilr, 2, 'Charts, Graphs, Caselets & Optimization', 'Hard', 14, 'High-Yield', 'Spider charts, Bubble diagrams, Missing data tables, Games and tournaments');

    const sVarc = addSubject('varc', 'Verbal Ability & Reading Comprehension', 3, 30, 'Advanced RC passages, Parajumbles, Summary, Critical reasoning');
    addTopic(sVarc, 1, 'Philosophical & Socio-Economic RC Passages', 'Hard', 12, 'High-Yield', 'Abstract passage analysis, Author stance, Tone discernment, Structural inference');
    addTopic(sVarc, 2, 'Parajumbles, Sentence Elimination & Summaries', 'Medium', 8, 'Core', 'Cohesive link detection, Pronoun tracing, Precise central summary identification');
    return { subjects, topics };
  }

  // 11. FINANCE & ACCOUNTING (CA Foundation)
  if (cat.includes('Finance') || name.includes('ca-foundation') || name.includes('accounting')) {
    const sAcc = addSubject('acc', 'Principles of Accounting', 1, 35, 'Accounting standards, Ledger, Final accounts, Partnership, Company accounts');
    addTopic(sAcc, 1, 'Accounting Process, BRS & Depreciation', 'Medium', 12, 'High-Yield', 'Double-entry mechanics, Bank Reconciliation Statement, WDV and SLM depreciation');
    addTopic(sAcc, 2, 'Partnership Accounts & Financial Statements', 'Hard', 14, 'High-Yield', 'Admission/Retirement/Death adjustments, Good will valuation, Balance sheet preparation');

    const sLaw = addSubject('law', 'Business Laws', 2, 25, 'Indian Contract Act, Sale of Goods Act, Partnership Act, Companies Act');
    addTopic(sLaw, 1, 'Indian Contract Act, 1872', 'Medium', 12, 'High-Yield', 'Essentials of valid contract, Free consent, Legality of object, Breach and remedies');
    addTopic(sLaw, 2, 'Sale of Goods & Company Law Basics', 'Medium', 10, 'Core', 'Conditions and warranties, Unpaid seller rights, Corporate veil, MOA/AOA');

    const sQa = addSubject('qa', 'Business Mathematics & Statistics', 3, 40, 'Ratio, Time Value of Money, Measures of Dispersion, Probability');
    addTopic(sQa, 1, 'Time Value of Money (Compound Interest & Annuities)', 'Hard', 12, 'High-Yield', 'Effective rate of interest, Present/future value of annuities, Sinking fund');
    addTopic(sQa, 2, 'Statistical Measures & Index Numbers', 'Easy', 10, 'Core', 'Standard deviation, Coefficient of variation, Correlation and regression');
    return { subjects, topics };
  }

  // 12. DESIGN & FASHION (UCEED, NIFT, NATA)
  if (cat.includes('Design') || name.includes('nata') || name.includes('nift') || name.includes('uceed')) {
    const sVis = addSubject('vis', 'Visual Perception & Drawing Aptitude', 1, 50, 'Perspective drawing, Spatial visualization, Color harmony, Aesthetics');
    addTopic(sVis, 1, '1-Point, 2-Point & 3-Point Perspective Drawing', 'Medium', 12, 'High-Yield', 'Vanishing points, Human proportions, Light, Shadow casting, Textures');
    addTopic(sVis, 2, 'Spatial Visualization & 2D/3D Transformations', 'Hard', 12, 'High-Yield', 'Orthographic projections, Mental rotation of solids, Surface unfoldings');
    addTopic(sVis, 3, 'Color Psychology, Aesthetics & Elements of Design', 'Easy', 8, 'Core', 'Color wheel, Balance, Rhythm, Contrast, Gestalt principles');

    const sDesApt = addSubject('desapt', 'Analytical & Creative Aptitude', 2, 50, 'Design history, Materials, Creative problem solving, Logical reasoning');
    addTopic(sDesApt, 1, 'Iconic Architecture, Designers & World Monuments', 'Easy', 8, 'High-Yield', 'Famous architects, Design movements (Bauhaus, Art Deco), Building materials');
    addTopic(sDesApt, 2, 'Design Problem Solving & Lateral Thinking', 'Medium', 10, 'Core', 'Ergonomics, Everyday product analysis, Environmental design solutions');
    return { subjects, topics };
  }

  // 13. HOSPITALITY (NCHMCT JEE)
  if (cat.includes('Hospitality') || name.includes('nchmct')) {
    const sServ = addSubject('serv', 'Service Sector Aptitude', 1, 30, 'Interpersonal relations, Hospitality ethics, Customer care scenarios');
    addTopic(sServ, 1, 'Client Care Scenarios & Situation Judgement', 'Easy', 8, 'High-Yield', 'Guest complaint handling, Professional etiquette, Empathy in customer relations');

    const sEng = addSubject('eng', 'English Language', 2, 35, 'Comprehension, Grammar, Vocabulary, Conversational English');
    addTopic(sEng, 1, 'Reading Comprehension & Functional Grammar', 'Medium', 10, 'High-Yield', 'Error correction, Idioms, Antonyms and Synonyms, Vocabulary in hospitality');

    const sApt = addSubject('apt', 'Numerical & Reasoning Aptitude', 3, 35, 'Arithmetic, Reasoning, General Awareness of Tourism');
    addTopic(sApt, 1, 'Basic Commercial Mathematics', 'Easy', 8, 'Core', 'Percentages, Profit/Loss, Averages, Ratio and Proportion');
    addTopic(sApt, 2, 'Indian Tourism, Culture & World Geography', 'Easy', 8, 'High-Yield', 'Airports, Airlines, Famous cuisines, Heritage monuments, Tourist capitals');
    return { subjects, topics };
  }

  // 14. CIVIL SERVICES & STATE PSC (UPSC CSE, UPPSC, BPSC, MPSC, etc.)
  if (cat.includes('Civil Services') || name.includes('psc') || name.includes('cse')) {
    const sPol = addSubject('polity', 'Indian Polity & Constitution', 1, 25, 'Constitution, Rights, Parliament, Judiciary, Federalism');
    addTopic(sPol, 1, 'Constitutional Framework & Fundamental Rights', 'Medium', 14, 'High-Yield', 'Preamble, Articles 12-35, Basic Structure, Judicial review, Directive principles');
    addTopic(sPol, 2, 'Union Executive, Parliament & State Legislatures', 'Hard', 16, 'High-Yield', 'Presidential powers, Money bills, Parliamentary committees, Governor roles');

    const sHist = addSubject('hist', 'Indian History & Culture', 2, 25, 'Ancient, Medieval, Modern National Movement, Art & Architecture');
    addTopic(sHist, 1, 'Modern Indian Freedom Struggle (1857-1947)', 'Medium', 14, 'High-Yield', 'Socio-religious reform, Gandhian movements, Revolutionary activism, Partition');
    addTopic(sHist, 2, 'Indian Art, Architecture & Ancient Civilization', 'Easy', 10, 'Core', 'Indus Valley, Mauryan/Gupta art, Temple architecture, Bhakti/Sufi traditions');

    const sEcon = addSubject('econ', 'Indian Economy & Social Development', 3, 25, 'Fiscal policy, Monetary policy, Agriculture, Infrastructure, Budget');
    addTopic(sEcon, 1, 'Macroeconomic Concepts, Fiscal & Monetary Framework', 'Hard', 14, 'High-Yield', 'GDP calculation, Inflation indices, RBI repo mechanisms, Budget deficits');
    addTopic(sEcon, 2, 'Inclusive Growth, Poverty & Government Schemes', 'Easy', 10, 'Core', 'Flagship social schemes, Sustainable development goals, Financial inclusion');

    const sEnv = addSubject('env', 'Geography, Environment & Ecology', 4, 25, 'Physical Geography, Biodiversity, Climate change, Protected areas');
    addTopic(sEnv, 1, 'Physical & Climatological Geography', 'Medium', 12, 'High-Yield', 'Plate tectonics, Monsoons of India, Soil types, River drainage systems');
    addTopic(sEnv, 2, 'Ecology, Protected Areas & Climate Treaties', 'Medium', 12, 'High-Yield', 'National parks, Ramsar wetlands, COP climate summits, Carbon emissions');
    return { subjects, topics };
  }

  // 15. GOVERNMENT RECRUITMENT (SSC CGL, SSC CHSL, SSC CPO, SSC GD)
  if (cat.includes('Government Recruitment') || cat.includes('Police & Paramilitary') || name.includes('ssc')) {
    const sQuant = addSubject('quant', 'Quantitative Aptitude', 1, 30, 'Arithmetic, Geometry, Mensuration, Algebra, Trigonometry');
    addTopic(sQuant, 1, 'Percentage, Profit & Loss, Discount & Interest', 'Easy', 10, 'High-Yield', 'Successive discounts, Cost price formulas, SI and CI difference');
    addTopic(sQuant, 2, 'Time, Speed, Distance, Trains & Work', 'Medium', 12, 'High-Yield', 'Relative speed, Circular races, Pipes and cisterns, Work and wages');
    addTopic(sQuant, 3, 'Geometry & Mensuration (2D & 3D)', 'Hard', 14, 'High-Yield', 'Circle theorems, Similar triangles, Prisms, Pyramids, Solid sphere areas');

    const sReas = addSubject('reas', 'General Intelligence & Reasoning', 2, 25, 'Analogies, Syllogisms, Coding-Decoding, Non-verbal series');
    addTopic(sReas, 1, 'Syllogisms, Venn Diagrams & Statement Inferences', 'Medium', 10, 'High-Yield', 'Venn deduction, Assumption verification, Cause and effect');
    addTopic(sReas, 2, 'Analogy, Coding-Decoding & Matrix Number Puzzles', 'Easy', 8, 'Core', 'Alphabet position logic, Mathematical operation substitution, Series');

    const sEng = addSubject('eng', 'English Language & Comprehension', 3, 25, 'Grammar errors, Idioms, One-word substitutes, Cloze test');
    addTopic(sEng, 1, 'Error Spotting, Sentence Improvement & Active/Passive', 'Medium', 10, 'High-Yield', 'Subject-verb concord, Tenses, Modifiers, Direct and indirect speech');
    addTopic(sEng, 2, 'Idioms, Synonyms, Antonyms & Cloze Tests', 'Easy', 8, 'High-Yield', 'High-frequency root words, Phrasal verbs, Contextual sentence completion');

    const sGa = addSubject('ga', 'General Awareness', 4, 20, 'Static GK, General Science, Indian Economy, Current Events');
    addTopic(sGa, 1, 'Indian Constitution, History & Geography Essentials', 'Easy', 8, 'High-Yield', 'Articles of constitution, Dynasties, Important dams and minerals');
    addTopic(sGa, 2, 'Everyday Science & Current National Highlights', 'Easy', 6, 'Core', 'Vitamins, Chemical formulas, Sports awards, Government summits');
    return { subjects, topics };
  }

  // 16. BANKING & INSURANCE (IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, LIC AAO)
  if (cat.includes('Banking') || cat.includes('Insurance') || name.includes('ibps') || name.includes('sbi') || name.includes('rbi') || name.includes('lic')) {
    const sDi = addSubject('di', 'Data Analysis & Quantitative Aptitude', 1, 35, 'High-Level Data Interpretation, Arithmetic Caselets, Quadratic Equations');
    addTopic(sDi, 1, 'Complex Data Interpretation (Pie, Bar, Radar & Caselets)', 'Hard', 16, 'High-Yield', 'Missing table DI, Percentage-based pie charts, Profit-loss caselet logic');
    addTopic(sDi, 2, 'Arithmetic Word Problems & Quadratic Approximations', 'Medium', 12, 'High-Yield', 'Root comparison, Approximations, Mixture-alligation, Partnership');

    const sReas = addSubject('reas', 'Reasoning & Computer Aptitude', 2, 35, 'Seating Arrangements, Complex Floor Puzzles, Machine Input-Output');
    addTopic(sReas, 1, 'High-Level Seating Arrangements & Multivariable Puzzles', 'Hard', 16, 'High-Yield', 'Circular inside/outside facing, Floor-flat puzzles, Day-month-year scheduling');
    addTopic(sReas, 2, 'Machine Input-Output & Coded Direction/Inequalities', 'Medium', 10, 'High-Yield', 'Step rearrangement rules, Coded inequalities, Blood relation trees');

    const sEng = addSubject('eng', 'English Language', 3, 15, 'Financial Reading Comprehension, Sentence Rearrangement, Error Detection');
    addTopic(sEng, 1, 'Economic & Banking Editorial Reading Comprehension', 'Hard', 10, 'High-Yield', 'Central idea extraction, Vocabulary in financial context, Inference analysis');

    const sBa = addSubject('ba', 'Banking & Financial Awareness', 4, 15, 'RBI monetary policy, Banking history, Current financial news');
    addTopic(sBa, 1, 'RBI Regulations, Monetary Tools & Financial Inclusions', 'Easy', 8, 'High-Yield', 'Repo rate, Reverse repo, CRR, SLR, NPA norms, Basel III guidelines');
    return { subjects, topics };
  }

  // 17. ENGINEERING GRADUATE & PSU (GATE, UPSC ESE, RRB JE)
  if (cat.includes('PSU Recruitment') || cat.includes('Technical Services') || name.includes('gate') || name.includes('ese')) {
    const sCore = addSubject('core', 'Core Engineering Discipline', 1, 70, 'Specialized technical domain principles, derivations, and numerical design');
    addTopic(sCore, 1, 'Fundamental Technical Theories & Governing Laws', 'Hard', 18, 'High-Yield', 'Core laws, System modeling, Governing differential formulations');
    addTopic(sCore, 2, 'Applied Engineering Design & Numerical Solutions', 'Hard', 18, 'High-Yield', 'Multi-step numerical problem solving, Efficiency calculations, System tolerances');

    const sEm = addSubject('em', 'Engineering Mathematics', 2, 15, 'Linear Algebra, Calculus, Differential Equations, Probability');
    addTopic(sEm, 1, 'Linear Algebra & Eigenvalue Systems', 'Medium', 10, 'High-Yield', 'Matrix rank, Cayley-Hamilton theorem, Eigenvectors, System of linear equations');
    addTopic(sEm, 2, 'Differential Equations & Vector Calculus', 'Hard', 12, 'High-Yield', 'First order ODEs, Higher order linear ODEs, Gradient, Divergence, Curl, Stokes theorem');

    const sGa = addSubject('ga', 'General Aptitude', 3, 15, 'Verbal Ability and Numerical Reasoning');
    addTopic(sGa, 1, 'Numerical & Spatial Reasoning', 'Medium', 8, 'High-Yield', 'Data interpretation, Deductive logic, Spatial rotation, Numerical estimation');
    return { subjects, topics };
  }

  // 18. RAILWAYS (RRB NTPC, RRB Group D)
  if (cat.includes('Railway') || name.includes('rrb')) {
    const sMath = addSubject('math', 'Mathematics', 1, 35, 'Arithmetic, Elementary Algebra, Geometry, Trigonometry');
    addTopic(sMath, 1, 'Number System, Fractions & LCM/HCF', 'Easy', 8, 'High-Yield', 'BODMAS rules, Decimals, Recurring fractions, Divisibility tests');
    addTopic(sMath, 2, 'Commercial Math: Percentages, Profit, Ratio & Time', 'Medium', 10, 'High-Yield', 'Time and work, Speed-time-distance, Train problems, Simple/Compound interest');

    const sReas = addSubject('reas', 'General Intelligence & Reasoning', 2, 35, 'Analogies, Venn diagrams, Puzzles, Coding-Decoding');
    addTopic(sReas, 1, 'Venn Diagrams, Syllogisms & Logical Sequences', 'Medium', 10, 'High-Yield', 'Set logic, Diagrammatic reasoning, Statement-conclusion evaluation');
    addTopic(sReas, 2, 'Coding-Decoding, Direction Sense & Series', 'Easy', 8, 'Core', 'Alphabet/Number coding, Compass routes, Mathematical operator replacement');

    const sGa = addSubject('ga', 'General Awareness & Science', 3, 30, 'General Science, Indian Railways Facts, Current Affairs');
    addTopic(sGa, 1, 'Class 10 Physics, Chemistry & Biology', 'Easy', 8, 'High-Yield', 'Newton laws, Periodic table, Human diseases, Light and electricity');
    addTopic(sGa, 2, 'Indian Railways History & Static General Knowledge', 'Easy', 6, 'Core', 'Railway zones, Historical landmarks, Constitution essentials, Sports');
    return { subjects, topics };
  }

  // 19. TEACHING & HIGHER EDUCATION (CTET, UGC NET, CSIR NET)
  if (cat.includes('Teaching') || name.includes('tet') || name.includes('net')) {
    const sCdp = addSubject('cdp', 'Child Development, Pedagogy & Research Aptitude', 1, 40, 'Learning theories, Inclusive education, Teaching methods, Evaluation');
    addTopic(sCdp, 1, 'Theories of Learning & Cognitive Development', 'Medium', 12, 'High-Yield', 'Piaget, Vygotsky, Kohlberg moral development, Bloom taxonomy of objectives');
    addTopic(sCdp, 2, 'Inclusive Education & Differentiated Classroom Strategies', 'Easy', 8, 'High-Yield', 'Children with special needs, Multiple intelligences, Formative assessment');

    const sSub = addSubject('subj', 'Subject Domain & Pedagogical Content', 2, 60, 'In-depth subject syllabus and subject-specific teaching methodology');
    addTopic(sSub, 1, 'Subject Knowledge & Conceptual Formulations', 'Hard', 16, 'High-Yield', 'Deep academic mastery of core curriculum topics, Definitions and proofs');
    addTopic(sSub, 2, 'Pedagogical Issues & Diagnostic Evaluation in the Discipline', 'Medium', 10, 'High-Yield', 'Error analysis, Remedial teaching strategies, Laboratory & project design');
    return { subjects, topics };
  }

  // 20. PURE SCIENCES & RESEARCH (IISER IAT, NEST, IIT JAM)
  if (cat.includes('Pure Sciences') || name.includes('iiser') || name.includes('nest') || name.includes('jam')) {
    const sPhys = addSubject('phys', 'Physics', 1, 25, 'Mechanics, Electromagnetism, Quantum & Thermal Physics');
    addTopic(sPhys, 1, 'Classical Mechanics & Wave Phenomena', 'Hard', 14, 'High-Yield', 'Harmonic oscillators, Waves on string, Central force motion, Sound waves');
    addTopic(sPhys, 2, 'Electromagnetism & Optics', 'Hard', 14, 'High-Yield', 'Maxwell equations, Wave optics, Diffraction, Polarisation');

    const sChem = addSubject('chem', 'Chemistry', 2, 25, 'Physical, Inorganic, and Organic Chemistry');
    addTopic(sChem, 1, 'Physical Chemistry & Quantum Basics', 'Hard', 14, 'High-Yield', 'Thermodynamic cycles, Chemical kinetics, Quantum wave mechanics, Solid state');
    addTopic(sChem, 2, 'Synthetic Organic & Coordination Compounds', 'Hard', 14, 'High-Yield', 'Reaction mechanisms, Stereochemistry, Organometallics, Crystal field theory');

    const sMath = addSubject('math', 'Mathematics', 3, 25, 'Calculus, Linear Algebra, Real Analysis');
    addTopic(sMath, 1, 'Multivariable Calculus & Differential Equations', 'Hard', 14, 'High-Yield', 'Partial derivatives, Line/surface integrals, Linear ODE solutions');

    const sBio = addSubject('bio', 'Biological Sciences', 4, 25, 'Cell Biology, Genetics, Molecular Biology');
    addTopic(sBio, 1, 'Molecular Biology & Biochemistry', 'Medium', 12, 'High-Yield', 'Enzymology, Metabolic pathways, Gene regulation, Recombinant DNA');
    return { subjects, topics };
  }

  // DEFAULT FALLBACK FOR ANY CUSTOM OR NEW EXAMINATION
  const sCore = addSubject('core', 'Core Subject Discipline', 1, 50, 'Primary academic syllabus and technical requirements');
  addTopic(sCore, 1, 'Fundamental Principles & Conceptual Framework', 'Medium', 12, 'High-Yield', 'Core principles, Definitions, Governing equations, Historical background');
  addTopic(sCore, 2, 'Applied Problem Solving & Advanced Variations', 'Hard', 14, 'High-Yield', 'Comprehensive multi-concept applications, Practical calculations, Edge cases');

  const sApt = addSubject('apt', 'Aptitude, Reasoning & Language', 2, 50, 'Logical reasoning, Analytical aptitude, and Comprehension');
  addTopic(sApt, 1, 'Quantitative Reasoning & Analytical Thinking', 'Medium', 10, 'High-Yield', 'Data interpretation, Arithmetic problem solving, Pattern recognition');
  addTopic(sApt, 2, 'Language Comprehension & Communication Accuracy', 'Easy', 8, 'Core', 'Reading comprehension passages, Vocabulary in context, Error correction');

  return { subjects, topics };
}

/**
 * Ensures that a specific examination has subjects and topics in the SQLite database.
 * If subjects or topics are missing, automatically provisions them!
 */
function ensureExamSyllabus(examId, db) {
  const existingSubjs = db.prepare('SELECT count(*) as c FROM subjects WHERE exam_id = ?').get(examId).c;
  const existingTopics = db.prepare('SELECT count(*) as c FROM topics WHERE exam_id = ?').get(examId).c;

  if (existingSubjs > 0 && existingTopics > 0) {
    return false; // Already has full syllabus
  }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return false;

  const { subjects, topics } = generateSyllabusForExam(exam);

  const insertSubject = db.prepare(`
    INSERT OR REPLACE INTO subjects (id, exam_id, name, order_index, weightage_percent, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const s of subjects) {
    insertSubject.run(s.id, s.exam_id, s.name, s.order_index, s.weightage_percent, s.description);
  }

  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO topics (id, subject_id, exam_id, name, difficulty, estimated_hours, order_index, weightage_tier, key_concepts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of topics) {
    insertTopic.run(t.id, t.subject_id, t.exam_id, t.name, t.difficulty, t.estimated_hours, t.order_index, t.weightage_tier, t.key_concepts);
  }

  return true;
}

/**
 * Ensures that EVERY examination in the database has full subjects and topics.
 */
function ensureAllExamsHaveSyllabus(db) {
  const exams = db.prepare('SELECT * FROM exams').all();
  let provisionedCount = 0;

  for (const exam of exams) {
    const wasProvisioned = ensureExamSyllabus(exam.id, db);
    if (wasProvisioned) provisionedCount++;
  }

  return provisionedCount;
}

module.exports = {
  generateSyllabusForExam,
  ensureExamSyllabus,
  ensureAllExamsHaveSyllabus
};


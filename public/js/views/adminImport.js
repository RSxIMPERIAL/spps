// SPPS Admin / Teacher Question Import Module
// Supports Year-Wise & Topic-Wise bulk question imports via CSV or JSON, with downloadable templates and file upload.

const adminImport = {
  currentFormat: 'json',
  currentExamId: 'jee-main',
  allExamsCache: [],
  subjectsCache: [],
  topicsCache: [],

  async openModal(defaultExamId = 'jee-main') {
    const user = window.state.get('user');
    if (!user || user.role !== 'admin') {
      toast.error('Access restricted: Only verified administrators can import question papers.');
      return;
    }

    this.currentExamId = defaultExamId;

    // Fetch exams list
    try {
      const examsRes = await window.api.getExams();
      this.allExamsCache = examsRes.exams || [];
    } catch (e) {
      this.allExamsCache = [];
    }

    // Fetch subjects and topics for this exam
    await this.loadSubjectsAndTopics(this.currentExamId);

    const sampleJson = this.getSampleJson();

    const examOptions = this.allExamsCache.map(e => 
      `<option value="${e.id}" ${e.id === this.currentExamId ? 'selected' : ''}>${e.name}</option>`
    ).join('');

    const subjectOptions = `<option value="">-- Apply to All Subjects (or specify per row) --</option>` +
      this.subjectsCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    const contentHtml = `
      <form onsubmit="adminImport.handleSubmit(event)">
        <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem; line-height: 1.5;">
          Upload Previous-Year Questions (PYQs) or curated questions in bulk organized <strong>Year-Wise</strong> and <strong>Topic-Wise</strong>. 
          You can specify Year, Subject, and Topic individually per question or set defaults below.
        </p>

        <!-- Configuration Bar -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.25rem;">
          <div class="grid-cols-2" style="margin-bottom: 1rem;">
            <div>
              <label class="form-label" style="font-weight: 700;">Target Examination</label>
              <select id="import-exam-id" class="form-select" onchange="adminImport.handleExamChange(this.value)">
                ${examOptions}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-weight: 700;">Default Year of Exam</label>
              <select id="import-year" class="form-select">
                <option value="2025">2025</option>
                <option value="2024" selected>2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
                <option value="2018">2018</option>
              </select>
            </div>
          </div>

          <div class="grid-cols-2">
            <div>
              <label class="form-label" style="font-weight: 700;">Default Subject (Optional)</label>
              <select id="import-subject-id" class="form-select" onchange="adminImport.handleSubjectChange(this.value)">
                ${subjectOptions}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-weight: 700;">Default Topic (Optional)</label>
              <select id="import-topic-id" class="form-select">
                <option value="">-- Apply to All Topics (or specify per row) --</option>
                ${this.topicsCache.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Format & Template Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <label class="form-label" style="margin: 0; font-weight: 700;">Data Format:</label>
            <select id="import-format" class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem;" onchange="adminImport.switchFormat(this.value)">
              <option value="json" selected>JSON Format</option>
              <option value="csv">CSV (Comma-Separated)</option>
            </select>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="adminImport.downloadTemplate('csv')">
              ${window.icons.download || ''} Download CSV Template
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="adminImport.downloadTemplate('json')">
              ${window.icons.download || ''} Download JSON Template
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="adminImport.loadSample()">
              Load Sample Data
            </button>
          </div>
        </div>

        <!-- File Upload or Paste Box -->
        <div class="form-group" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="margin-bottom: 0;">Upload File or Paste Data</label>
            <input type="file" id="import-file-input" accept=".csv,.json" style="font-size: 0.75rem;" onchange="adminImport.handleFileUpload(event)" />
          </div>
          <textarea id="import-data-text" class="form-textarea" rows="9" style="font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem;" placeholder="Paste JSON array or CSV text here...">${sampleJson}</textarea>
        </div>

        <div style="background: #f1f5f9; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.75rem; color: #475569; display: flex; align-items: center; gap: 8px;">
          <span style="color: #4f46e5; font-size: 1rem;">ℹ</span>
          <span>
            <strong>Pro Tip:</strong> CSV headers supported: <code>question_text, year, subject, topic, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation, is_official</code>.
          </span>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Validate & Import Questions Bank</button>
        </div>
      </form>
    `;

    modal.open('Upload Previous-Year Questions (Year & Topic Wise)', contentHtml, 'modal-content-lg');
  },

  async loadSubjectsAndTopics(examId) {
    try {
      const details = await window.api.getExamDetails(examId);
      this.subjectsCache = details.subjects || [];
      this.topicsCache = [];
      this.subjectsCache.forEach(s => {
        if (s.topics) {
          this.topicsCache.push(...s.topics);
        }
      });
    } catch (e) {
      this.subjectsCache = [];
      this.topicsCache = [];
    }
  },

  async handleExamChange(examId) {
    this.currentExamId = examId;
    await this.loadSubjectsAndTopics(examId);

    const subSelect = document.getElementById('import-subject-id');
    const topSelect = document.getElementById('import-topic-id');
    if (subSelect) {
      subSelect.innerHTML = `<option value="">-- Apply to All Subjects (or specify per row) --</option>` +
        this.subjectsCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
    if (topSelect) {
      topSelect.innerHTML = `<option value="">-- Apply to All Topics (or specify per row) --</option>` +
        this.topicsCache.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
  },

  handleSubjectChange(subjectId) {
    const topSelect = document.getElementById('import-topic-id');
    if (!topSelect) return;

    if (!subjectId) {
      topSelect.innerHTML = `<option value="">-- Apply to All Topics (or specify per row) --</option>` +
        this.topicsCache.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      return;
    }

    const filteredTopics = this.topicsCache.filter(t => t.subject_id === subjectId);
    topSelect.innerHTML = `<option value="">-- Apply to All Topics in Subject --</option>` +
      filteredTopics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  },

  switchFormat(format) {
    this.currentFormat = format;
    this.loadSample();
  },

  getSampleJson() {
    return JSON.stringify([
      {
        question_text: "What is the dimensional formula of universal gravitational constant G?",
        year: 2024,
        topic: "Kinematics & Laws of Motion",
        difficulty: "Easy",
        options_json: ["[M⁻¹ L³ T⁻²]", "[M L² T⁻²]", "[M⁻¹ L² T⁻¹]", "[M L³ T⁻²]"],
        correct_answer: "[M⁻¹ L³ T⁻²]",
        explanation: "F = G m₁m₂ / r² => G = F r² / (m₁m₂) = [M L T⁻²][L²] / [M²] = [M⁻¹ L³ T⁻²].",
        is_official: 1,
        source_url: "Official Paper",
        verification_status: "Verified Official PYQ"
      },
      {
        question_text: "Which of the following compounds has a square planar molecular geometry?",
        year: 2024,
        topic: "Chemical Bonding & Molecular Structure",
        difficulty: "Easy",
        options_json: ["XeF4", "SF4", "BF4⁻", "NH4⁺"],
        correct_answer: "XeF4",
        explanation: "Xe has 8 valence electrons. With 4 bond pairs and 2 axial lone pairs, the shape is square planar.",
        is_official: 1,
        source_url: "Official Paper",
        verification_status: "Verified Official PYQ"
      }
    ], null, 2);
  },

  getSampleCsv() {
    return `question_text,year,topic,difficulty,option_a,option_b,option_c,option_d,correct_answer,explanation,is_official
"What is the SI unit of electric capacitance?",2024,"Current Electricity & Circuit Analysis",Easy,"Farad (F)","Henry (H)","Tesla (T)","Weber (Wb)","Farad (F)","Capacitance C = Q / V, measured in Coulomb/Volt which is defined as Farad.",1
"Which hormone prevents diuresis by promoting water reabsorption in the distal tubules?",2023,"Human Physiology",Easy,"ADH (Vasopressin)","Oxytocin","Glucagon","ANF","ADH (Vasopressin)","Vasopressin concentrates urine by stimulating water reabsorption.",1`;
  },

  loadSample() {
    const format = document.getElementById('import-format').value;
    const textarea = document.getElementById('import-data-text');
    if (!textarea) return;

    if (format === 'json') {
      textarea.value = this.getSampleJson();
    } else {
      textarea.value = this.getSampleCsv();
    }
  },

  downloadTemplate(format) {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      content = `question_text,year,subject,topic,difficulty,option_a,option_b,option_c,option_d,correct_answer,explanation,is_official\n"Sample Question Formulation?",2024,"Physics","Thermodynamics",Medium,"Option A","Option B","Option C","Option D","Option A","Step-by-step solution here...",1`;
      filename = `SPPS_PYQ_Template_${this.currentExamId}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else {
      content = JSON.stringify([
        {
          question_text: "Sample question formulation?",
          year: 2024,
          subject: "Physics",
          topic: "Thermodynamics",
          difficulty: "Medium",
          options_json: ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: "Option A",
          explanation: "Step-by-step verified explanation...",
          is_official: 1
        }
      ], null, 2);
      filename = `SPPS_PYQ_Template_${this.currentExamId}.json`;
      mimeType = 'application/json;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Template ${filename} downloaded!`);
  },

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const textarea = document.getElementById('import-data-text');
      const formatSelect = document.getElementById('import-format');

      if (textarea) {
        textarea.value = content;
      }

      if (file.name.endsWith('.csv') && formatSelect) {
        formatSelect.value = 'csv';
      } else if (file.name.endsWith('.json') && formatSelect) {
        formatSelect.value = 'json';
      }

      toast.info(`Loaded ${file.name} into import editor.`);
    };

    reader.readAsText(file);
  },

  async handleSubmit(e) {
    e.preventDefault();
    const user = window.state.get('user');
    if (!user || user.role !== 'admin') {
      toast.error('Access restricted: Only verified administrators can import questions.');
      return;
    }

    const examId = document.getElementById('import-exam-id').value;
    const defaultYear = document.getElementById('import-year').value;
    const defaultSubjectId = document.getElementById('import-subject-id').value || null;
    const defaultTopicId = document.getElementById('import-topic-id').value || null;
    const format = document.getElementById('import-format').value;
    const rawData = document.getElementById('import-data-text').value;

    if (!rawData.trim()) {
      toast.warning('Please provide question data to import');
      return;
    }

    try {
      const res = await window.api.importPyqs({
        exam_id: examId,
        default_year: defaultYear,
        default_subject_id: defaultSubjectId,
        default_topic_id: defaultTopicId,
        format,
        data: rawData
      });

      modal.close();
      toast.success(res.message);

      // Refresh current views if relevant
      if (window.state.get('currentRoute') === 'admin') {
        window.adminConsoleView.render();
      } else if (window.state.get('currentRoute') === 'pyq') {
        window.pyqView.render(examId);
      }
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    }
  }
};

window.adminImport = adminImport;

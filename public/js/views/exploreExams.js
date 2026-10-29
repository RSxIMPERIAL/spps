// SPPS Examination Discovery System View
const exploreExamsView = {
  currentFilters: {
    stage: 'all',
    category: 'all',
    search: ''
  },
  allExamsCache: [],

  async render() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Header Banner -->
        <div class="spps-card" style="padding: 1.75rem 2rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff;">
          <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem;">Examination Directory of India</h1>
          <p style="font-size: 0.9375rem; color: #c7d2fe; max-width: 800px; line-height: 1.5;">
            Explore national and state level entrance, recruitment, and admission examinations across Class 10, Class 12, and Graduation pathways.
          </p>

          <!-- Autocomplete Search Bar -->
          <div style="position: relative; margin-top: 1.25rem; max-width: 650px;">
            <div style="position: absolute; left: 14px; top: 12px; color: #94a3b8; pointer-events: none;">
              ${window.icons.search}
            </div>
            <input 
              type="text" 
              id="exam-search-input" 
              class="form-input" 
              style="padding-left: 42px; padding-right: 14px; height: 46px; border-radius: 9999px; background: #ffffff; color: #0f172a; font-size: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" 
              placeholder="Search by exam name (e.g. JEE Main, UPSC, NEET, Polytechnic, CLAT)..."
              value="${this.currentFilters.search}"
              oninput="exploreExamsView.handleSearchInput(this.value)"
            />
            <div id="search-autocomplete-list" style="position: absolute; top: 52px; left: 0; right: 0; background: #ffffff; border-radius: 0.75rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 50; max-height: 250px; overflow-y: auto; display: none;"></div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="spps-card" style="padding: 1rem 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <!-- Stage Tabs -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentFilters.stage === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="exploreExamsView.setStage('all')">
                All Stages
              </button>
              <button class="btn btn-sm ${this.currentFilters.stage === 'after_10' ? 'btn-primary' : 'btn-secondary'}" onclick="exploreExamsView.setStage('after_10')">
                After Class 10
              </button>
              <button class="btn btn-sm ${this.currentFilters.stage === 'after_12' ? 'btn-primary' : 'btn-secondary'}" onclick="exploreExamsView.setStage('after_12')">
                After Class 12
              </button>
              <button class="btn btn-sm ${this.currentFilters.stage === 'after_grad' ? 'btn-primary' : 'btn-secondary'}" onclick="exploreExamsView.setStage('after_grad')">
                After Graduation
              </button>
            </div>

            <!-- Category Dropdown -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8125rem; font-weight: 600; color: #64748b;">Category:</span>
              <select class="form-select" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8125rem;" onchange="exploreExamsView.setCategory(this.value)">
                <option value="all">All Categories</option>
                <option value="Engineering" ${this.currentFilters.category === 'Engineering' ? 'selected' : ''}>Engineering & Architecture</option>
                <option value="Medical" ${this.currentFilters.category === 'Medical' ? 'selected' : ''}>Medical & Healthcare</option>
                <option value="Civil Services" ${this.currentFilters.category === 'Civil Services' ? 'selected' : ''}>Civil Services & Administration</option>
                <option value="Defence" ${this.currentFilters.category === 'Defence' ? 'selected' : ''}>Defence & Paramilitary</option>
                <option value="Banking" ${this.currentFilters.category === 'Banking' ? 'selected' : ''}>Banking & Finance</option>
                <option value="Government Recruitment" ${this.currentFilters.category === 'Government Recruitment' ? 'selected' : ''}>Government Jobs (SSC / Staff Selection)</option>
                <option value="Railway" ${this.currentFilters.category === 'Railway' ? 'selected' : ''}>Railways (RRB)</option>
                <option value="Law" ${this.currentFilters.category === 'Law' ? 'selected' : ''}>Law & Legal Studies</option>
                <option value="Management" ${this.currentFilters.category === 'Management' ? 'selected' : ''}>Management (MBA)</option>
                <option value="Teaching" ${this.currentFilters.category === 'Teaching' ? 'selected' : ''}>Teaching & Eligibility</option>
                <option value="Polytechnic" ${this.currentFilters.category === 'Polytechnic' ? 'selected' : ''}>Polytechnic & Diploma</option>
                <option value="Design" ${this.currentFilters.category === 'Design' ? 'selected' : ''}>Design & Fashion</option>
                <option value="Pure Sciences" ${this.currentFilters.category === 'Pure Sciences' ? 'selected' : ''}>Pure Sciences & Research</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Examination Cards Grid -->
        <div id="exams-catalog-grid" class="grid-cols-3">
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">
            Loading examinations directory...
          </div>
        </div>
      </div>
    `;

    this.fetchAndRenderGrid();
  },

  async fetchAndRenderGrid() {
    try {
      const res = await window.api.getExams(this.currentFilters);
      this.allExamsCache = res.exams || [];
      const grid = document.getElementById('exams-catalog-grid');
      if (!grid) return;

      if (!this.allExamsCache.length) {
        grid.innerHTML = `
          <div class="spps-card" style="grid-column: 1/-1; padding: 3rem; text-align: center;">
            <p style="font-size: 1rem; color: #64748b; margin-bottom: 1rem;">No examinations found matching your filter criteria.</p>
            <button class="btn btn-secondary" onclick="exploreExamsView.resetFilters()">Clear Filters</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = this.allExamsCache.map(e => {
        let stageBadge = 'After Class 12';
        let badgeClass = 'badge-indigo';
        if (e.stage === 'after_10') { stageBadge = 'After Class 10'; badgeClass = 'badge-amber'; }
        if (e.stage === 'after_grad') { stageBadge = 'After Graduation'; badgeClass = 'badge-emerald'; }

        return `
          <div class="spps-card spps-card-hover" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <span class="badge ${badgeClass}">${stageBadge}</span>
                <span style="font-size: 0.75rem; font-weight: 600; color: #64748b;">${e.category}</span>
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">${e.name}</h3>
              <div style="font-size: 0.8125rem; color: #4f46e5; font-weight: 600; margin-bottom: 0.75rem;">
                ${e.conducting_authority}
              </div>
              <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem;">
                ${e.overview.slice(0, 140)}...
              </p>
            </div>

            <div>
              <div style="background: #f8fafc; border-radius: 0.5rem; padding: 0.65rem 0.85rem; margin-bottom: 1rem; font-size: 0.75rem; color: #475569;">
                <div style="font-weight: 600; color: #0f172a; margin-bottom: 2px;">Official Schedule:</div>
                <div style="color: #64748b;">${e.official_schedule.slice(0, 75)}...</div>
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;" onclick="router.navigate('exam-details', '${e.id}')">
                  Dossier ${window.icons.arrowRight}
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;" onclick="router.navigate('pyq', '${e.id}')" title="Access Year-Wise and Topic-Wise PYQs">
                  ${window.icons.helpCircle || '📝'} PYQs
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;" onclick="exploreExamsView.startPrepDirect('${e.id}', '${e.short_name}')" title="Set as active preparation">
                  Start Prep
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
    }
  },

  handleSearchInput(val) {
    this.currentFilters.search = val.trim();
    const dropdown = document.getElementById('search-autocomplete-list');

    if (!val || val.length < 2) {
      if (dropdown) dropdown.style.display = 'none';
      this.fetchAndRenderGrid();
      return;
    }

    const matches = this.allExamsCache.filter(e =>
      e.name.toLowerCase().includes(val.toLowerCase()) ||
      e.short_name.toLowerCase().includes(val.toLowerCase()) ||
      e.category.toLowerCase().includes(val.toLowerCase())
    );

    if (dropdown && matches.length) {
      dropdown.style.display = 'block';
      dropdown.innerHTML = matches.slice(0, 5).map(m => `
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" 
             onclick="router.navigate('exam-details', '${m.id}')"
             onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
          <div>
            <span style="font-weight: 600; color: #0f172a; font-size: 0.875rem;">${m.name}</span>
            <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px;">(${m.category})</span>
          </div>
          <span class="badge badge-indigo" style="font-size: 0.65rem;">View</span>
        </div>
      `).join('');
    } else if (dropdown) {
      dropdown.style.display = 'none';
    }

    this.fetchAndRenderGrid();
  },

  setStage(stage) {
    this.currentFilters.stage = stage;
    this.render();
  },

  setCategory(category) {
    this.currentFilters.category = category;
    this.fetchAndRenderGrid();
  },

  resetFilters() {
    this.currentFilters = { stage: 'all', category: 'all', search: '' };
    this.render();
  },

  async startPrepDirect(examId, examShortName) {
    const user = window.state.get('user');
    if (!user) {
      authModal.open('register');
      return;
    }

    try {
      await window.api.selectExam(examId);
      const me = await window.api.getMe();
      window.state.setUser(me.user, me.activeExam);
      toast.success(`Preparation plan generated for ${examShortName}!`);
      router.navigate('planner');
    } catch (e) {
      toast.error('Failed to set exam: ' + e.message);
    }
  }
};

window.exploreExamsView = exploreExamsView;

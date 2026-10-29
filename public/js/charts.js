// SPPS Interactive SVG Chart Components
const charts = {
  // 1. Donut Readiness / Progress Ring
  renderGauge(percent, label = 'Readiness Index', size = 150) {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPercent = Math.min(100, Math.max(0, percent));
    const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

    let color = '#4f46e5'; // Indigo
    if (clampedPercent >= 75) color = '#0d9488'; // Teal
    else if (clampedPercent < 40) color = '#f59e0b'; // Amber

    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
        <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
          <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="#e2e8f0" stroke-width="${strokeWidth}" />
          <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="${color}" stroke-width="${strokeWidth}"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round"
                  style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);" />
        </svg>
        <div style="position: absolute; text-align: center;">
          <div style="font-size: 1.85rem; font-weight: 800; color: #0f172a; line-height: 1;">${clampedPercent}%</div>
          <div style="font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #64748b; margin-top: 4px; letter-spacing: 0.05em;">${label}</div>
        </div>
      </div>
    `;
  },

  // 2. Weekly Hours Bar Chart (Planned vs Actual)
  renderWeeklyHoursChart(data = []) {
    // Default 7 days data
    const days = data.length ? data : [
      { day: 'Mon', planned: 4.5, actual: 4.5 },
      { day: 'Tue', planned: 4.5, actual: 4.0 },
      { day: 'Wed', planned: 4.5, actual: 5.0 },
      { day: 'Thu', planned: 4.5, actual: 3.5 },
      { day: 'Fri', planned: 4.5, actual: 4.5 },
      { day: 'Sat', planned: 5.0, actual: 5.5 },
      { day: 'Sun', planned: 2.0, actual: 2.0 }
    ];

    const maxHeight = 120;
    const maxVal = Math.max(6, ...days.map(d => Math.max(d.planned, d.actual)));

    const barsHtml = days.map(d => {
      const plannedH = Math.round((d.planned / maxVal) * maxHeight);
      const actualH = Math.round((d.actual / maxVal) * maxHeight);
      return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1;">
          <div style="display: flex; align-items: flex-end; gap: 4px; height: ${maxHeight}px; width: 100%; justify-content: center;">
            <div title="Planned: ${d.planned} hrs" style="width: 14px; height: ${plannedH}px; background-color: #cbd5e1; border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
            <div title="Actual: ${d.actual} hrs" style="width: 14px; height: ${actualH}px; background-color: #4f46e5; border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
          </div>
          <span style="font-size: 0.75rem; font-weight: 500; color: #64748b;">${d.day}</span>
        </div>
      `;
    }).join('');

    return `
      <div style="width: 100%;">
        <div style="display: flex; justify-content: flex-end; gap: 14px; margin-bottom: 12px; font-size: 0.75rem; font-weight: 500;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="width: 10px; height: 10px; background-color: #cbd5e1; border-radius: 2px;"></span>
            <span style="color: #64748b;">Planned</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="width: 10px; height: 10px; background-color: #4f46e5; border-radius: 2px;"></span>
            <span style="color: #4f46e5; font-weight: 600;">Actual</span>
          </div>
        </div>
        <div style="display: flex; align-items: flex-end; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          ${barsHtml}
        </div>
      </div>
    `;
  },

  // 3. Subject Mastery Progress Bars
  renderSubjectMastery(subjects = []) {
    if (!subjects.length) {
      return `<div style="color: #64748b; font-size: 0.875rem;">No subjects registered yet.</div>`;
    }

    return subjects.map(s => {
      const percent = s.percent || 0;
      let colorClass = '#4f46e5';
      if (percent >= 75) colorClass = '#0d9488';
      else if (percent < 35) colorClass = '#f59e0b';

      return `
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 0.875rem;">
            <span style="font-weight: 600; color: #1e293b;">${s.name}</span>
            <span style="font-weight: 700; color: ${colorClass}; font-size: 0.8125rem;">${s.completedTasks || 0}/${s.totalTasks || 0} tasks (${percent}%)</span>
          </div>
          <div style="height: 8px; width: 100%; background-color: #f1f5f9; border-radius: 9999px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="width: ${percent}%; height: 100%; background-color: ${colorClass}; border-radius: 9999px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 4. 30-Day Activity Heatmap Grid
  renderStreakHeatmap(logs = [], currentStreak = 0) {
    const today = new Date();
    const cells = [];
    const logMap = {};

    logs.forEach(l => {
      logMap[l.practice_date] = l;
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logMap[dateStr];

      let level = 0; // 0 = none, 1 = some, 2 = target met
      if (log) {
        if (log.is_target_met) level = 2;
        else if (log.completed_count > 0) level = 1;
      }

      let bg = '#f1f5f9';
      let border = '#e2e8f0';
      if (level === 1) { bg = '#c7d2fe'; border = '#818cf8'; }
      if (level === 2) { bg = '#10b981'; border = '#059669'; }

      const dateDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const tooltip = log ? `${dateDisplay}: ${log.completed_count}/${log.target_count} questions solved` : `${dateDisplay}: No practice logged`;

      cells.push(`
        <div title="${tooltip}" style="width: 18px; height: 18px; background-color: ${bg}; border: 1px solid ${border}; border-radius: 4px; cursor: pointer; transition: transform 0.1s ease;"></div>
      `);
    }

    return `
      <div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
          ${cells.join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.75rem; color: #64748b;">
          <span>30 Days Ago</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>Less</span>
            <span style="width: 12px; height: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 2px;"></span>
            <span style="width: 12px; height: 12px; background: #c7d2fe; border: 1px solid #818cf8; border-radius: 2px;"></span>
            <span style="width: 12px; height: 12px; background: #10b981; border: 1px solid #059669; border-radius: 2px;"></span>
            <span>Target Met</span>
          </div>
          <span>Today</span>
        </div>
      </div>
    `;
  }
};

window.charts = charts;

// SPPS Modal Engine
const modal = {
  open(title, contentHtml, sizeClass = '') {
    // Support options object signature: modal.open({ title, content, sizeClass })
    if (typeof title === 'object' && title !== null) {
      const opts = title;
      title = opts.title || '';
      contentHtml = opts.content || opts.contentHtml || '';
      sizeClass = opts.sizeClass || sizeClass || 'modal-content-lg';
    }

    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content ${sizeClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary-900);">${title}</h3>
          <button style="background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 4px;" onclick="modal.close()">
            ${window.icons.x}
          </button>
        </div>
        <div style="padding: 1.5rem;">
          ${contentHtml}
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) modal.close();
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Escape listener
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  close() {
    const existing = document.getElementById('active-modal-overlay');
    if (existing) {
      existing.remove();
      document.body.style.overflow = '';
    }
  }
};

window.modal = modal;

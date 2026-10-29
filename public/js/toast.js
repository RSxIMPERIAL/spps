// SPPS Toast Notification System
const toast = {
  show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    let iconSvg = window.icons.check;
    if (type === 'error') iconSvg = window.icons.alertTriangle;
    if (type === 'warning') iconSvg = window.icons.alertTriangle;

    toastEl.innerHTML = `
      <div style="flex-shrink: 0;">${iconSvg}</div>
      <div style="flex: 1; font-weight: 500;">${message}</div>
      <button style="background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px;" onclick="this.parentElement.remove()">
        ${window.icons.x}
      </button>
    `;

    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(50px)';
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); },
  warning(msg) { this.show(msg, 'warning'); }
};

window.toast = toast;

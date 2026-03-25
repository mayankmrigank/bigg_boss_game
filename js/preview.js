// ============================================================
// AI BIGG BOSS - TASK PREVIEW MODAL CONTROLLER
// Shows a full-screen task preview with image, description,
// algorithm info, and a 5-second countdown before each task.
// ============================================================

const TaskPreview = {
  _resolve: null,
  _countdownTimer: null,
  _secondsLeft: 2,
  COUNTDOWN_FROM: 2,

  // Show the preview for a task; returns a Promise that resolves
  // when either the countdown hits 0 or the user clicks "Start Now"
  show(task) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._populate(task);
      this._startCountdown();

      const overlay = document.getElementById('task-preview-overlay');
      overlay.style.display = 'flex';
      // Force re-animation by removing and re-adding the class
      const modal = overlay.querySelector('.task-preview-modal');
      modal.style.animation = 'none';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modal.style.animation = '';
        });
      });
    });
  },

  hide() {
    clearInterval(this._countdownTimer);
    const overlay = document.getElementById('task-preview-overlay');
    overlay.style.display = 'none';
    if (this._resolve) { this._resolve(); this._resolve = null; }
  },

  _populate(task) {
    // Header
    document.getElementById('tpm-task-num').textContent   = `TASK ${task.id} OF ${TASKS.length}`;
    document.getElementById('tpm-algo-badge').textContent = task.algorithm;
    document.getElementById('tpm-algo-badge').style.background = task.color;
    document.getElementById('tpm-algo-badge').style.boxShadow  = `0 0 14px ${task.color}88`;

    // Image
    const img = document.getElementById('tpm-image');
    img.src = task.image;
    img.alt = task.name;

    // Icon overlay
    document.getElementById('tpm-icon-overlay').textContent = task.icon;

    // Tinted top border
    const modal = document.querySelector('.task-preview-modal');
    modal.style.setProperty('--tpm-accent', task.color);
    modal.style.borderTopColor = task.color;
    modal.style.borderTopWidth = '3px';

    // Body text
    document.getElementById('tpm-name').textContent      = task.name;
    document.getElementById('tpm-desc').textContent      = task.description;
    document.getElementById('tpm-long-desc').textContent = task.longDescription || '';
  },

  _startCountdown() {
    this._secondsLeft = this.COUNTDOWN_FROM;
    this._updateRing(this._secondsLeft);
    document.getElementById('tpm-countdown').textContent = this._secondsLeft;

    clearInterval(this._countdownTimer);
    this._countdownTimer = setInterval(() => {
      this._secondsLeft--;
      document.getElementById('tpm-countdown').textContent = this._secondsLeft;
      this._updateRing(this._secondsLeft);

      if (this._secondsLeft <= 0) {
        clearInterval(this._countdownTimer);
        this.hide();
      }
    }, 1000);
  },

  // Update the SVG ring stroke-dashoffset based on seconds remaining
  _updateRing(secondsLeft) {
    const circle = document.getElementById('tpm-ring-circle');
    if (!circle) return;
    const total  = 175.93; // circumference = 2π × 28
    const offset = total * (1 - secondsLeft / this.COUNTDOWN_FROM);
    circle.style.transition = 'stroke-dashoffset 0.9s linear';
    circle.setAttribute('stroke-dashoffset', offset);
    // colour shifts red as time runs out
    const hue = Math.round((secondsLeft / this.COUNTDOWN_FROM) * 50); // 50=gold → 0=red
    circle.setAttribute('stroke', `hsl(${hue},100%,55%)`);
  }
};

// Wire up the "Start Now" button
document.getElementById('tpm-start-now-btn').addEventListener('click', () => {
  TaskPreview.hide();
});

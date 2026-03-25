// ============================================================
// AI BIGG BOSS - VOTING BREAK CONTROLLER
// Shows after every 3 tasks. User votes for 2–4 contestants
// who receive a Comeback Boost to their total score.
// ============================================================

const VotingBreak = {
  BREAK_AFTER_TASKS: [3, 6],      // Show voting after task index 3 and 6
  MIN_VOTES: 2,
  MAX_VOTES: 4,
  BOOST_AMOUNTS: [30, 22, 16, 10], // Boost for 1st, 2nd, 3rd, 4th voted contestant
  BOOST_LABEL: 'Fan Vote Boost',

  _selected: new Set(),
  _resolve: null,
  _contestants: [],

  // Returns true if a voting break should occur after the given task index (1-based)
  shouldBreakAfter(taskIndex) {
    return this.BREAK_AFTER_TASKS.includes(taskIndex);
  },

  // Show the voting modal; resolves when user submits votes
  show(contestants, breakNumber) {
    return new Promise((resolve) => {
      this._resolve  = resolve;
      this._selected = new Set();
      this._contestants = contestants;

      this._buildModal(contestants, breakNumber);
      document.getElementById('voting-overlay').style.display = 'flex';
      this._updateSubmitBtn();
    });
  },

  _buildModal(contestants, breakNumber) {
    // Header info
    document.getElementById('vb-break-num').textContent =
      `MID-SEASON BREAK ${breakNumber}`;
    document.getElementById('vb-subtitle').textContent =
      `Tasks ${breakNumber * 3 - 2}–${breakNumber * 3} complete. Vote to give ${this.MIN_VOTES}–${this.MAX_VOTES} contestants a Comeback Boost!`;

    // Boost preview pills
    const pillsEl = document.getElementById('vb-boost-pills');
    pillsEl.innerHTML = this.BOOST_AMOUNTS.map((b, i) =>
      `<span class="vb-boost-pill">Vote ${i+1}: <strong>+${b} pts</strong></span>`
    ).join('');

    // Build contestant grid
    const grid = document.getElementById('vb-contestant-grid');
    grid.innerHTML = '';

    // Sort by rank for display
    const sorted = [...contestants].sort((a, b) => a.rank - b.rank);
    sorted.forEach(c => {
      const card = document.createElement('div');
      card.className = 'vb-card';
      card.id = `vb-card-${c.id}`;
      card.dataset.id = c.id;

      // Show last 3 task scores
      const recentScores = c.taskHistory.slice(-3).map(t => t.score);
      const trend = recentScores.length >= 2
        ? recentScores[recentScores.length-1] - recentScores[recentScores.length-2]
        : 0;
      const trendEl = trend > 0 ? `<span class="vb-trend up">▲${Math.abs(trend)}</span>`
                   : trend < 0 ? `<span class="vb-trend down">▼${Math.abs(trend)}</span>`
                   :             `<span class="vb-trend flat">—</span>`;

      card.innerHTML = `
        <div class="vb-card-rank">#${c.rank}</div>
        <div class="vb-avatar" style="background:${c.palette.bg};color:${c.palette.text}">${c.initials}</div>
        <div class="vb-name">${c.name}</div>
        <div class="vb-score">${c.totalScore} pts ${trendEl}</div>
        <div class="vb-recent">
          ${recentScores.map(s => `<span class="vb-task-pip" style="width:${s}%"></span>`).join('')}
        </div>
        <div class="vb-vote-badge" id="vb-badge-${c.id}"></div>
        <div class="vb-select-ring"></div>
      `;

      card.addEventListener('click', () => this._toggleVote(c.id));
      grid.appendChild(card);
    });
  },

  _toggleVote(contestantId) {
    if (this._selected.has(contestantId)) {
      this._selected.delete(contestantId);
    } else {
      if (this._selected.size >= this.MAX_VOTES) {
        this._shakeCard(contestantId);
        return;
      }
      this._selected.add(contestantId);
    }
    this._refreshCards();
    this._updateSubmitBtn();
  },

  _refreshCards() {
    const orderedSelected = [...this._selected];
    this._contestants.forEach(c => {
      const card  = document.getElementById(`vb-card-${c.id}`);
      const badge = document.getElementById(`vb-badge-${c.id}`);
      if (!card) return;

      const voteIdx = orderedSelected.indexOf(c.id);
      const isSelected = voteIdx !== -1;

      card.classList.toggle('vb-selected', isSelected);
      if (isSelected) {
        const boost = this.BOOST_AMOUNTS[voteIdx] || 0;
        badge.textContent  = `Vote #${voteIdx + 1}  +${boost} pts`;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
        badge.textContent   = '';
      }
    });
  },

  _updateSubmitBtn() {
    const btn   = document.getElementById('vb-submit-btn');
    const count = this._selected.size;
    const valid = count >= this.MIN_VOTES && count <= this.MAX_VOTES;
    btn.disabled = !valid;
    btn.textContent = valid
      ? `🗳️ Confirm ${count} Vote${count > 1 ? 's' : ''} & Apply Boosts`
      : `Select ${this.MIN_VOTES}–${this.MAX_VOTES} contestants (${count} chosen)`;
  },

  _shakeCard(id) {
    const card = document.getElementById(`vb-card-${id}`);
    if (!card) return;
    card.classList.add('vb-shake');
    setTimeout(() => card.classList.remove('vb-shake'), 500);
  },

  _applyBoosts() {
    const orderedSelected = [...this._selected];
    const boosted = [];

    orderedSelected.forEach((contestantId, i) => {
      const contestant = this._contestants.find(c => c.id === contestantId);
      if (!contestant) return;
      const amount = this.BOOST_AMOUNTS[i] || 0;
      contestant.totalScore += amount;
      contestant.taskHistory.push({
        taskId: `vote-${Date.now()}`,
        taskName: this.BOOST_LABEL,
        score: amount,
        log: [`Fan voted boost: +${amount} points`],
        isBoost: true
      });
      boosted.push({ contestant, amount });
    });

    return boosted;
  },

  submit() {
    const boosted = this._applyBoosts();
    document.getElementById('voting-overlay').style.display = 'none';
    if (this._resolve) { this._resolve(boosted); this._resolve = null; }
  }
};

// Wire submit button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('vb-submit-btn');
  if (btn) btn.addEventListener('click', () => VotingBreak.submit());
});

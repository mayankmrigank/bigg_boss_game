// ============================================================
// AI BIGG BOSS - UI MODULE
// ============================================================

const UI = {
  // ─── SCREENS ───
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  // ─── SETUP SCREEN ───
  buildSetupScreen() {
    const slider = document.getElementById('contestant-count');
    const display = document.getElementById('count-display');
    if (slider && display) {
      slider.addEventListener('input', () => { display.textContent = slider.value; });
    }
  },

  // ─── HOUSE SCREEN ───
  renderHouse(contestants) {
    const grid = document.getElementById('house-grid');
    grid.innerHTML = '';
    contestants.forEach(c => {
      const card = document.createElement('div');
      card.className = 'contestant-card';
      card.id = `card-${c.id}`;
      card.innerHTML = `
        <div class="bitmoji-wrap" id="bitmoji-${c.id}">
          ${c.avatarHTML(68)}
        </div>
        <div class="c-name">${c.name}</div>
        <div class="c-score">Score: <span id="score-${c.id}">0</span></div>
        <div class="c-rank" id="rank-${c.id}">—</div>
        <div class="c-bar-wrap"><div class="c-bar" id="bar-${c.id}" style="width:0%;background:${c.palette.bg}"></div></div>
      `;
      grid.appendChild(card);
    });
  },

  updateContestantCard(contestant, maxScore) {
    const scoreEl = document.getElementById(`score-${contestant.id}`);
    const rankEl  = document.getElementById(`rank-${contestant.id}`);
    const barEl   = document.getElementById(`bar-${contestant.id}`);
    const cardEl  = document.getElementById(`card-${contestant.id}`);
    if (scoreEl) scoreEl.textContent = contestant.totalScore;
    if (rankEl) {
      rankEl.textContent = `#${contestant.rank}`;
      rankEl.className = `c-rank ${contestant.rank === 1 ? 'rank-gold' : contestant.rank === 2 ? 'rank-silver' : contestant.rank === 3 ? 'rank-bronze' : ''}`;
    }
    if (barEl) barEl.style.width = `${Math.min(100, (contestant.totalScore / maxScore) * 100)}%`;
    if (cardEl) cardEl.classList.toggle('rank-1-card', contestant.rank === 1);
  },

  // ─── TASK INFO BANNER ───
  showTaskBanner(task) {
    document.getElementById('task-icon').textContent    = task.icon;
    document.getElementById('task-name').textContent    = task.name;
    document.getElementById('task-algo').textContent    = task.algorithm;
    document.getElementById('task-desc').textContent    = task.description;
    document.getElementById('task-num').textContent     = `Task ${task.id} of ${TASKS.length}`;
    document.getElementById('task-banner').style.borderColor = task.color;
    document.getElementById('task-algo-badge').textContent   = task.algorithm;
    document.getElementById('task-algo-badge').style.background = task.color;

    // ── In-task visual image ──
    const taskImg = document.getElementById('task-running-img');
    if (taskImg && task.image) {
      taskImg.src   = task.image;
      taskImg.style.display = 'block';
      taskImg.style.borderColor = task.color;
    }
  },

  // ─── LIVE RESULTS PANEL ───
  renderLiveResults(results, task) {
    const container = document.getElementById('live-results');
    container.innerHTML = '';
    results.forEach((r, i) => {
      const isElim = r.contestant.eliminated;
      const rowClass = `result-row ${i === 0 && !isElim ? 'result-winner' : ''} ${isElim ? 'eliminated-row' : ''}`;
      const rankHtml = isElim ? '❌' : (i === 0 ? '🏆' : `#${i+1}`);
      const nameClass = isElim ? 'eliminated-text' : 'res-name';
      const scoreClass = isElim ? 'eliminated-score' : 'res-score';
      
      const row = document.createElement('div');
      row.className = rowClass;
      row.innerHTML = `
        <div class="res-rank">${rankHtml}</div>
        <div class="res-bitmoji">${r.contestant.avatarHTML(34, 'res-bitmoji-img')}</div>
        <div class="res-info">
          <div class="${nameClass}">${r.contestant.name}</div>
          <div class="res-log">${isElim ? 'Eliminated - Did not participate' : r.log[1]}</div>
        </div>
        <div class="${scoreClass}" style="color:${isElim ? '' : task.color}">${isElim ? '-' : r.score}</div>
      `;
      container.appendChild(row);
    });
  },

  // ─── LEADERBOARD ───
  renderLeaderboard(leaderboard) {
    const el = document.getElementById('leaderboard-body');
    el.innerHTML = '';
    
    // Sort logic inside engine already puts eliminated at the bottom, so here we just display them
    leaderboard.forEach((c, i) => {
      const isElim = c.eliminated;
      let medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
      if (isElim) medal = '❌';
      
      let rowClass = '';
      if (!isElim) {
        rowClass = i === 0 ? 'lb-gold' : i === 1 ? 'lb-silver' : i === 2 ? 'lb-bronze' : '';
      } else {
        rowClass = 'eliminated-row';
      }

      const row = document.createElement('tr');
      row.className = rowClass;
      row.innerHTML = `
        <td>${medal}</td>
        <td style="display:flex;align-items:center;gap:0.45rem;padding:0.45rem 0.4rem;">
          <span class="lb-bitmoji">${c.avatarHTML(26, 'lb-bitmoji-img')}</span>
          <span class="${isElim ? 'eliminated-text' : ''}">${c.name}</span>
        </td>
        <td class="${isElim ? 'eliminated-score' : ''}">${c.totalScore}</td>
        <td class="${isElim ? 'eliminated-score' : ''}">${c.averageScore.toFixed(1)}</td>
        <td>${isElim ? '-' : c.wins}</td>
        <td>${c.taskHistory.map(t => `<span class="task-score-pill ${t.isBoost ? 'boost-pill' : ''}">${t.isBoost ? '⚡' : ''}${t.score}</span>`).join('')}</td>
      `;
      el.appendChild(row);
    });
  },

  // ─── TASK PROGRESS INDICATORS ───
  renderTaskProgress(currentTaskIndex) {
    const container = document.getElementById('task-dots');
    container.innerHTML = '';
    TASKS.forEach((t, i) => {
      const dot = document.createElement('div');
      dot.className = `task-dot ${i < currentTaskIndex ? 'done' : i === currentTaskIndex ? 'active' : 'pending'}`;
      dot.title = t.name;
      dot.textContent = t.icon;
      dot.style.borderColor = t.color;
      if (i < currentTaskIndex) dot.style.background = t.color;
      container.appendChild(dot);
    });
  },

  // ─── ALGORITHM LOG CONSOLE ───
  showAlgorithmLog(contestant, result) {
    const logEl = document.getElementById('algo-log');
    if (!logEl) return;
    logEl.innerHTML = `<div class="log-header">[${contestant.name}] Output:</div>` +
      result.log.map(l => `<div class="log-line">▶ ${l}</div>`).join('');
    logEl.scrollTop = logEl.scrollHeight;
  },

  // ─── PROCESSING OVERLAY ───
  showProcessing(contestantName) {
    const el = document.getElementById('processing-label');
    if (el) el.textContent = `⚡ Running algorithm for ${contestantName}...`;
  },

  // ─── WINNER SCREEN ───
  showWinner(winner, allContestants) {
    this.showScreen('winner-screen');

    // Bitmoji avatar on winner screen
    const avatarWrap = document.getElementById('winner-avatar-wrap');
    if (avatarWrap) avatarWrap.innerHTML = winner.avatarHTML(120, 'winner-bitmoji');

    document.getElementById('winner-name').textContent    = winner.name;
    document.getElementById('winner-score').textContent   = winner.totalScore;
    document.getElementById('winner-avg').textContent     = winner.averageScore.toFixed(1);
    document.getElementById('winner-wins').textContent    = winner.wins;

    // Final podium
    const podium = document.getElementById('final-podium');
    const top3 = rankContestants(allContestants).slice(0, 3);
    podium.innerHTML = top3.map((c, i) => `
      <div class="podium-card p-${i+1}">
        <div class="podium-bitmoji">${c.avatarHTML(54, 'podium-bitmoji-img')}</div>
        <div class="podium-name">${c.name}</div>
        <div class="podium-score">${c.totalScore} pts</div>
        <div class="podium-position">${['🥇','🥈','🥉'][i]}</div>
      </div>
    `).join('');

    this.launchConfetti();
  },

  // ─── CONFETTI ───
  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 4,
      color: ['#ffd700','#ff4db8','#00cfff','#7c3aed','#10b981','#ff6b35'][Math.floor(Math.random()*6)],
      speed: Math.random() * 4 + 2,
      drift: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2
    }));

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.speed; p.x += p.drift; p.rot += p.rotSpeed;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
        ctx.restore();
      });
      frame++;
      if (frame < 360) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
  }
};

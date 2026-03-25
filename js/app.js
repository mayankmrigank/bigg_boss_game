// ============================================================
// AI BIGG BOSS - APP CONTROLLER (app.js)
// Wires together UI, Game Engine, and Contestants
// ============================================================

const engine = new GameEngine();
let contestants = [];
let autoRunning = false;
let seasonComplete = false;
let breakCount = 0;

// ─── SETUP SCREEN ───────────────────────────────────────────
const countSlider  = document.getElementById('contestant-count');
const countDisplay = document.getElementById('count-display');
const namesGrid    = document.getElementById('names-grid');
const enterBtn     = document.getElementById('enter-house-btn');

function buildNameInputs(n) {
  namesGrid.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'name-input';
    inp.placeholder = `Contestant ${i + 1}`;
    inp.id = `name-${i}`;
    namesGrid.appendChild(inp);
  }
}

countSlider.addEventListener('input', () => {
  const n = parseInt(countSlider.value);
  countDisplay.textContent = n;
  buildNameInputs(n);
});

buildNameInputs(parseInt(countSlider.value));

enterBtn.addEventListener('click', () => {
  const n = parseInt(countSlider.value);
  const names = [];
  for (let i = 0; i < n; i++) {
    const el = document.getElementById(`name-${i}`);
    names.push(el ? el.value.trim() : '');
  }
  contestants = createContestants(n, names);
  engine.init(contestants);

  UI.showScreen('game-screen');
  UI.renderHouse(contestants);
  UI.renderTaskProgress(0);
  showTaskPreview(0);
  updateLeaderboard();
  setStatus('Season ready! Run Task 1 to begin.');
});

// ─── HELPERS ─────────────────────────────────────────────────
function showTaskPreview(idx) {
  if (idx < TASKS.length) UI.showTaskBanner(TASKS[idx]);
}

function setStatus(msg) {
  const el = document.getElementById('status-text');
  if (el) el.textContent = msg;
}

function updateLeaderboard() {
  UI.renderLeaderboard(engine.getLeaderboard());
}

// ─── BUTTONS ──────────────────────────────────────────────────
const runTaskBtn = document.getElementById('run-task-btn');
const runAllBtn  = document.getElementById('run-all-btn');

runTaskBtn.addEventListener('click', () => {
  if (autoRunning) return;
  if (seasonComplete) { showWinnerScreen(); return; }
  runNextTask();
});

runAllBtn.addEventListener('click', async () => {
  if (autoRunning) return;
  autoRunning = true;
  runAllBtn.disabled = true;
  runTaskBtn.disabled = true;
  runAllBtn.textContent = '⏳ Running…';

  while (!engine.isFinished()) {
    await runNextTask();
    await sleep(100);
  }

  autoRunning = false;
  runAllBtn.disabled = false;
  runTaskBtn.disabled = false;
  runAllBtn.textContent = '⚡ Auto-Run Season';
});

// ─── MAIN TASK RUNNER ────────────────────────────────────────
async function runNextTask() {
  if (engine.isFinished()) { showWinnerScreen(); return; }

  const taskIdx = engine.currentTaskIndex;
  UI.renderTaskProgress(taskIdx);
  showTaskPreview(taskIdx);
  runTaskBtn.disabled = true;
  runAllBtn.disabled  = true;
  setStatus(`🎬 Previewing: ${TASKS[taskIdx].name}…`);

  // Full-screen task preview with countdown
  await TaskPreview.show(TASKS[taskIdx]);

  setStatus(`⚡ Running: ${TASKS[taskIdx].name}…`);

  const taskResult = await engine.runNextTask(async ({ task, contestant, result }) => {
    UI.showProcessing(contestant.name);
    UI.showAlgorithmLog(contestant, result);
  });

  if (!taskResult) return;

  // Update UI
  const maxPossible = engine.currentTaskIndex * 100;
  contestants.forEach(c => UI.updateContestantCard(c, maxPossible));
  UI.renderLiveResults(taskResult.results, taskResult.task);
  updateLeaderboard();
  UI.renderTaskProgress(engine.currentTaskIndex);

  const nextName = TASKS[engine.currentTaskIndex]?.name;
  setStatus(`✅ ${taskResult.task.name} done. ${engine.isFinished() ? 'Season complete! 🎉' : 'Next: ' + nextName}`);

  // ── VOTING BREAK: after tasks 3 and 6 ────────────────────
  if (VotingBreak.shouldBreakAfter(engine.currentTaskIndex) && !engine.isFinished()) {
    runTaskBtn.disabled = true;
    runAllBtn.disabled  = true;
    breakCount++;
    setStatus('🗳️ FAN VOTE! Give a Comeback Boost to your favourites!');

    await VotingBreak.show(
      contestants.filter(c => !c.eliminated),
      breakCount
    );

    // Re-render after boosts applied
    contestants.forEach(c => UI.updateContestantCard(c, engine.currentTaskIndex * 100));
    updateLeaderboard();
    setStatus('⚡ Boosts applied! Ready for the next task.');

    runTaskBtn.disabled = false;
    runAllBtn.disabled = autoRunning ? true : false;
  }



  // ── SEASON COMPLETE ───────────────────────────────────────
  if (engine.isFinished()) {
    seasonComplete = true;
    runTaskBtn.textContent = '🏆 Reveal Winner';
  } else {
    showTaskPreview(engine.currentTaskIndex);
    runTaskBtn.disabled = false;
    runAllBtn.disabled = autoRunning ? true : false;
  }
}

// ─── WINNER SCREEN ───────────────────────────────────────────
function showWinnerScreen() {
  UI.showWinner(engine.getWinner(), contestants);
}

document.getElementById('new-season-btn').addEventListener('click', () => {
  autoRunning    = false;
  seasonComplete = false;
  breakCount     = 0;
  runTaskBtn.disabled    = false;
  runAllBtn.disabled     = false;
  runTaskBtn.textContent = '▶ Run Next Task';
  UI.showScreen('setup-screen');
});

document.getElementById('view-full-lb-btn').addEventListener('click', () => {
  UI.showScreen('game-screen');
  updateLeaderboard();
  document.getElementById('leaderboard-section').scrollIntoView({ behavior: 'smooth' });
});

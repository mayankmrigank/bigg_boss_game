// ============================================================
// AI BIGG BOSS - GAME ENGINE
// ============================================================

class GameEngine {
  constructor() {
    this.contestants = [];
    this.currentTaskIndex = 0;
    this.phase = 'setup'; // setup | running | taskDone | finished
    this.taskResults = []; // { task, results: [{contestant, score, log}] }
    this.onTaskComplete = null; // callback
    this.onGameComplete = null;
  }

  init(contestants) {
    this.contestants = contestants;
    this.currentTaskIndex = 0;
    this.phase = 'setup';
    this.taskResults = [];

  }

  async runNextTask(onStepCallback) {
    if (this.currentTaskIndex >= TASKS.length) {
      this.phase = 'finished';
      if (this.onGameComplete) this.onGameComplete(this.getWinner());
      return null;
    }

    const task = TASKS[this.currentTaskIndex];
    this.phase = 'running';
    const results = [];

    for (let i = 0; i < this.contestants.length; i++) {
      const contestant = this.contestants[i];
      if (contestant.eliminated) continue; // Skip eliminated players

      // Each contestant gets a unique seed based on their id + task id + random salt
      const seed = (contestant.id * 9973 + task.id * 1009 + Math.floor(Math.random() * 1000)) | 0;
      const result = task.run(seed);
      let finalScore = result.score;

      contestant.addTaskResult(task.id, task.name, finalScore, result.log);
      results.push({ contestant, score: finalScore, log: result.log, details: result.details, steps: result.steps });

      if (onStepCallback) {
        await onStepCallback({ task, contestant, result, progress: (i + 1) / this.contestants.length });
        await sleep(40); // Fast iteration
      }
    }

    // Rank within this task
    const sorted = [...results].sort((a, b) => b.score - a.score);
    sorted.forEach((r, i) => {
      r.taskRank = i + 1;
      if (i === 0) {
        r.contestant.wins++;
      }
    });



    this.taskResults.push({ task, results: sorted });
    rankContestants(this.contestants);

    this.currentTaskIndex++;
    this.phase = this.currentTaskIndex >= TASKS.length ? 'finished' : 'taskDone';

    return { task, results: sorted };
  }

  getWinner() {
    const ranked = rankContestants(this.contestants);
    return ranked[0];
  }

  getLeaderboard() {
    return rankContestants(this.contestants);
  }

  isFinished() {
    return this.currentTaskIndex >= TASKS.length;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// AI BIGG BOSS - EVICTION SYSTEM
// ============================================================

const EvictionSystem = {
  // Eviction happens after these task indices (1-indexed)
  EVICTION_TASKS: [2, 4, 6],

  shouldEvictAfter(taskIndex) {
    // taskIndex is 1-indexed here (e.g., 2 means after Task 2 completes)
    return this.EVICTION_TASKS.includes(taskIndex);
  },

  async triggerEviction(contestants, currentCaptainId) {
    return new Promise((resolve) => {
      // 1. Find eligible nominees (not eliminated, not captain)
      const eligible = contestants.filter(c => !c.eliminated && c.id !== currentCaptainId);
      
      // 2. Sort by total score ascending (lowest first)
      eligible.sort((a, b) => a.totalScore - b.totalScore);
      
      // 3. Take the bottom 2 as nominees
      if (eligible.length < 2) {
        // Fallback: not enough people to evict (shouldn't happen early on)
        resolve(null);
        return;
      }
      
      const nominees = [eligible[0], eligible[1]];
      
      // 4. Show the UI and wait for user to click Save
      this.showModal(nominees, (savedContestantId) => {
        const eliminatedId = nominees.find(n => n.id !== savedContestantId).id;
        
        // Find the actual contestant and mark as eliminated
        const eliminatedContestant = contestants.find(c => c.id === eliminatedId);
        if (eliminatedContestant) {
          eliminatedContestant.eliminated = true;
          // Drop their score so they stay at the bottom of leaderboards
          eliminatedContestant.totalScore = -9999;
        }
        
        resolve(eliminatedContestant);
      });
    });
  },

  showModal(nominees, onSaveCallback) {
    const overlay = document.getElementById('eviction-overlay');
    const cardsWrap = document.getElementById('eviction-cards-wrap');
    
    if (!overlay || !cardsWrap) return;

    cardsWrap.innerHTML = '';
    
    nominees.forEach(n => {
      const card = document.createElement('div');
      card.className = 'eviction-card';
      card.innerHTML = `
        <div style="margin-bottom:1rem">${n.avatarHTML(80)}</div>
        <h3 style="font-size:1.5rem; margin:0">${n.name}</h3>
        <div class="ev-score">${n.totalScore} pts</div>
        <button class="btn-save" id="save-btn-${n.id}">✅ VOTE TO SAVE</button>
      `;
      cardsWrap.appendChild(card);
      
      // Add event listener to the save button
      setTimeout(() => {
        const btn = document.getElementById(`save-btn-${n.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            // Hide modal and trigger callback
            overlay.style.display = 'none';
            onSaveCallback(n.id);
          });
        }
      }, 50);
    });

    overlay.style.display = 'flex';
  }
};

// ============================================================
// AI BIGG BOSS - CONTESTANT MODULE
// ============================================================

const CONTESTANT_NAMES = [
  'Aria', 'Blaze', 'Cipher', 'Dash', 'Echo',
  'Flux', 'Ghost', 'Halo', 'Ion', 'Jinx',
  'Kova', 'Luna', 'Maxis', 'Nova', 'Orion',
  'Pixel', 'Qubit', 'Rex', 'Surge', 'Titan'
];

// Bitmoji image paths — null = use emoji fallback
const AVATAR_IMAGES = [
  'images/avatar_0.png',  // 0 Aria
  'images/avatar_1.png',  // 1 Blaze
  'images/avatar_2.png',  // 2 Cipher
  'images/avatar_3.png',  // 3 Dash
  'images/avatar_4.png',  // 4 Echo
  'images/avatar_5.png',  // 5 Flux
  'images/avatar_6.png',  // 6 Ghost
  null, null, null, null, null  // 7-11 use emoji fallback
];

// Emoji fallbacks for contestants without a generated avatar
const AVATAR_EMOJIS = ['👼','⚡','🌀','🦁','🌙','🔮','🎭','🦊','🌺','🐉','🦋','🌊'];

const AVATAR_PALETTES = [
  { bg: '#7c3aed', text: '#f5f3ff' },
  { bg: '#0891b2', text: '#e0f2fe' },
  { bg: '#b45309', text: '#fef3c7' },
  { bg: '#059669', text: '#d1fae5' },
  { bg: '#d97706', text: '#fffbeb' },
  { bg: '#dc2626', text: '#fee2e2' },
  { bg: '#be185d', text: '#fce7f3' },
  { bg: '#1d4ed8', text: '#dbeafe' },
  { bg: '#7c2d12', text: '#ffedd5' },
  { bg: '#166534', text: '#dcfce7' },
  { bg: '#581c87', text: '#f3e8ff' },
  { bg: '#0f766e', text: '#ccfbf1' },
];

class Contestant {
  constructor(id, name) {
    this.id = id;
    this.name = name || CONTESTANT_NAMES[id % CONTESTANT_NAMES.length];
    this.palette = AVATAR_PALETTES[id % AVATAR_PALETTES.length];
    this.avatarImg  = AVATAR_IMAGES[id % AVATAR_IMAGES.length] || null;
    this.avatarEmoji = AVATAR_EMOJIS[id % AVATAR_EMOJIS.length];
    this.totalScore = 0;
    this.taskHistory = [];
    this.rank = 0;
    this.eliminated = false;
    this.wins = 0;
  }

  addTaskResult(taskId, taskName, score, log) {
    this.taskHistory.push({ taskId, taskName, score, log });
    this.totalScore += score;
  }

  get averageScore() {
    if (this.taskHistory.length === 0) return 0;
    return this.totalScore / this.taskHistory.length;
  }

  get initials() {
    return this.name.slice(0, 2).toUpperCase();
  }

  // Returns HTML for the avatar (photo or emoji fallback)
  avatarHTML(size = 64, extraClass = '') {
    const opacity = this.eliminated ? '0.4' : '1';
    const filter = this.eliminated ? 'grayscale(100%)' : 'none';
    
    let imgHTML = '';
    if (this.avatarImg) {
      imgHTML = `<img src="${this.avatarImg}" class="bitmoji-img"
        style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;
        border:2px solid ${this.palette.bg};box-shadow:0 0 12px ${this.palette.bg}88;"
        alt="${this.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="bitmoji-fallback" style="display:none;width:${size}px;height:${size}px;
        border-radius:50%;background:${this.palette.bg};color:${this.palette.text};
        font-size:${Math.round(size*0.45)}px;align-items:center;justify-content:center;font-weight:800;">
        ${this.initials}</span>`;
    } else {
      imgHTML = `<div class="bitmoji-emoji" style="width:${size}px;height:${size}px;
        border-radius:50%;background:${this.palette.bg};
        display:flex;align-items:center;justify-content:center;
        font-size:${Math.round(size*0.46)}px;border:2px solid ${this.palette.bg};
        box-shadow:0 0 12px ${this.palette.bg}88;">${this.avatarEmoji}</div>`;
    }

    return `<div class="avatar-wrapper ${extraClass}" style="position:relative; display:inline-block; opacity:${opacity}; filter:${filter}; transition:all 0.3s;">
      ${imgHTML}
    </div>`;
  }
}

function createContestants(n, names = []) {
  const usedNames = new Set();
  const contestants = [];
  for (let i = 0; i < n; i++) {
    let name = names[i] || CONTESTANT_NAMES[i % CONTESTANT_NAMES.length];
    if (usedNames.has(name)) name += `_${i}`;
    usedNames.add(name);
    contestants.push(new Contestant(i, name));
  }
  return contestants;
}

function rankContestants(contestants) {
  const sorted = [...contestants].sort((a, b) => {
    // Eliminated contestants always go to the bottom
    if (a.eliminated && !b.eliminated) return 1;
    if (!a.eliminated && b.eliminated) return -1;
    return b.totalScore - a.totalScore;
  });
  sorted.forEach((c, i) => { c.rank = i + 1; });
  return sorted;
}

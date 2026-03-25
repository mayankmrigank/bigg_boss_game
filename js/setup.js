// ============================================================
// AI BIGG BOSS - SETUP SCREEN EXTRAS
// Handles: welcome audio play/pause/upload + house photo upload
// ============================================================

(function () {
  const audio     = document.getElementById('welcome-audio');
  const toggleBtn = document.getElementById('audio-toggle-btn');
  const audioUp   = document.getElementById('audio-upload');
  const statusEl  = document.getElementById('audio-status');
  const houseInput = document.getElementById('house-photo-input');
  const housePreviewImg = document.getElementById('house-preview-img');
  const hostInput = document.getElementById('host-photo-input');
  const hostPreviewImg = document.getElementById('welcome-host-img');
  const startJourneyBtn = document.getElementById('start-journey-btn');

  // ─── WELCOME -> SETUP TRANSITION ───────────────────────────
  startJourneyBtn?.addEventListener('click', () => {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('setup-screen').classList.add('active');
    // If audio is paused, try starting it on this user interaction
    if (audio && audio.paused) {
      audio.volume = 0.55;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  });

  // ─── AUDIO TOGGLE ──────────────────────────────────────────
  function setPlaying(isPlaying) {
    if (isPlaying) {
      toggleBtn.textContent = '⏸ Pause Theme';
      toggleBtn.classList.add('playing');
    } else {
      toggleBtn.textContent = '🔊 Play Theme';
      toggleBtn.classList.remove('playing');
    }
  }

  toggleBtn?.addEventListener('click', () => {
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(e => {
        // Autoplay blocked or no file — just note it
        statusEl.textContent = 'Put theme.mp3 in the audio/ folder, or upload below';
      });
    } else {
      audio.pause();
      setPlaying(false);
    }
  });

  // Auto-try playing when page loads (may be blocked by browser)
  window.addEventListener('load', () => {
    if (!audio) return;
    audio.volume = 0.55;
    audio.play().then(() => {
      setPlaying(true);
      statusEl.textContent = '♪ Playing welcome theme…';
    }).catch(() => {
      // Silently ignored — browser blocks autoplay until first click
    });
  });

  audio?.addEventListener('ended', () => setPlaying(false));
  audio?.addEventListener('pause', () => {
    if (audio.ended) setPlaying(false);
  });

  // ─── AUDIO FILE UPLOAD ─────────────────────────────────────
  audioUp?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audio.pause();
    audio.src = url;
    audio.load();
    audio.play().then(() => {
      setPlaying(true);
      statusEl.textContent = `♪ ${file.name}`;
    }).catch(err => {
      statusEl.textContent = 'Could not play — try another format';
    });
  });

  // ─── HOUSE PHOTO UPLOAD ────────────────────────────────────
  // Also store the chosen data URL globally so game screen uses it
  window._customHousePhoto = null;

  houseInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target.result;
      window._customHousePhoto = url;

      // Update preview on setup screen
      if (housePreviewImg) {
        housePreviewImg.src = url;
        housePreviewImg.style.opacity = '1';
      }

      // Also update the game screen house photo in real time
      const gameHouseImg = document.querySelector('.house-photo');
      if (gameHouseImg) gameHouseImg.src = url;
    };
    reader.readAsDataURL(file);
  });

  // ─── HOST PHOTO UPLOAD (WELCOME SCREEN) ────────────────────
  hostInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (hostPreviewImg) {
        hostPreviewImg.src = evt.target.result;
        hostPreviewImg.style.display = 'block';
        if (hostPreviewImg.nextElementSibling) {
          hostPreviewImg.nextElementSibling.style.display = 'none';
        }
      }
    };
    reader.readAsDataURL(file);
  });

  // ─── EYE PUPIL TRACKING ────────────────────────────────────
  // Make the SVG eye pupil follow the mouse gently
  const eyes = document.querySelectorAll('.bb-eye-svg');
  if (eyes.length > 0) {
    document.addEventListener('mousemove', (e) => {
      eyes.forEach(eyeSvg => {
        // Find the pupil inside this specific eye
        const pupil = eyeSvg.querySelector('circle[fill="#09090f"]:nth-of-type(2)');
        if (!pupil) return;
        
        const rect = eyeSvg.getBoundingClientRect();
        // Only track if visible
        if (rect.width === 0) return;
        
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxMove = 8;
        const scale = Math.min(1, maxMove / (dist || 1));
        const px = 100 + dx * scale * 0.35;
        const py =  60 + dy * scale * 0.25;
        pupil.setAttribute('cx', px.toFixed(1));
        pupil.setAttribute('cy', py.toFixed(1));
      });
    });
  }

})();

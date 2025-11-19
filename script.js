/* Refined JS: countdown + fullscreen + theme + poster + confetti
   Keep script external for GitHub Pages compatibility.
*/

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

function nextJan6() {
  const now = new Date();
  let year = now.getFullYear();
  let t = new Date(year, 0, 6, 0, 0, 0, 0);
  if (now > t) t = new Date(year + 1, 0, 6, 0, 0, 0, 0);
  return t;
}

/* ---------- Elements ---------- */
const daysEl = $('days');
const hoursEl = $('hours');
const minutesEl = $('minutes');
const secondsEl = $('seconds');

const fsBtn = $('fsBtn');
const themeToggle = $('themeToggle');
const posterBtn = $('posterBtn');
const appRoot = document.documentElement;
const card = $('card');
const status = $('status');
const confettiRoot = $('confetti');

let target = nextJan6();

/* ---------- Countdown logic ---------- */
function updateCountdown() {
  const now = new Date();
  let diff = target - now;
  if (diff <= 0) {
    // celebrate then retarget
    celebrate();
    target = nextJan6();
    diff = target - now;
  }

  const total = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  daysEl.textContent = String(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
}

/* Align tick to real second */
function startTicker() {
  updateCountdown();
  const msToNext = 1000 - (performance.now() % 1000);
  setTimeout(() => {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }, msToNext);
}
startTicker();

/* ---------- Fullscreen (robust) ---------- */
async function enterFullscreen() {
  try {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  } catch (e) {
    console.warn('Failed to enter fullscreen', e);
  }
}
async function exitFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    else if (document.msExitFullscreen) await document.msExitFullscreen();
  } catch (e) {
    console.warn('Failed to exit fullscreen', e);
  }
}

fsBtn.addEventListener('click', async () => {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  if (!isFS) await enterFullscreen();
  else await exitFullscreen();
});

function updateFsUI() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  fsBtn.textContent = isFS ? '⤫ Exit Full' : '⛶ Full';
  fsBtn.setAttribute('aria-pressed', String(isFS));
  // When fullscreen, optionally enable poster-mode UI by default
  if (isFS && card.classList.contains('poster-mode')) {
    // poster-mode already applied
  }
}
document.addEventListener('fullscreenchange', updateFsUI);
document.addEventListener('webkitfullscreenchange', updateFsUI);
document.addEventListener('msfullscreenchange', updateFsUI);

/* ---------- Poster mode (hide header/footer) ---------- */
posterBtn.addEventListener('click', () => {
  const isPoster = card.classList.toggle('poster-mode');
  posterBtn.textContent = isPoster ? '🖼️ Poster On' : '🖼 Poster';
});

/* ---------- Theme toggle (dark default) ---------- */
function applyTheme(name) {
  if (name === 'light') {
    appRoot.setAttribute('data-theme', 'light');
    themeToggle.textContent = '🌙 Dark';
    themeToggle.setAttribute('aria-pressed', 'true');
    status.textContent = 'Light mode — saved';
  } else {
    appRoot.removeAttribute('data-theme'); // dark default
    themeToggle.textContent = '🌤 Light';
    themeToggle.setAttribute('aria-pressed', 'false');
    status.textContent = 'Dark mode — saved';
  }
  try { localStorage.setItem('countdown-theme', name); } catch (e) {}
}

// init theme (dark default unless user chose light)
(function initTheme() {
  const saved = localStorage.getItem('countdown-theme');
  if (saved === 'light') applyTheme('light');
  else applyTheme('dark');
})();

themeToggle.addEventListener('click', () => {
  const isLight = appRoot.getAttribute('data-theme') === 'light';
  applyTheme(isLight ? 'dark' : 'light');
});

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') fsBtn.click();
  if (e.key === 'd' || e.key === 'D') themeToggle.click();
  if (e.key === 'p' || e.key === 'P') posterBtn.click();
});

/* ---------- Confetti (lightweight) ---------- */
function makePiece() {
  const el = document.createElement('div');
  el.className = 'confetti-piece';
  // random size and style
  const size = Math.floor(Math.random() * 10) + 6;
  el.style.width = `${size}px`;
  el.style.height = `${Math.floor(size * 0.6)}px`;
  el.style.background = ['#ff6b6b','#ffd166','#60a5fa','#34d399','#f472b6'][Math.floor(Math.random()*5)];
  el.style.position = 'absolute';
  el.style.left = `${Math.random() * 100}%`;
  el.style.top = '-10%';
  el.style.opacity = '0.95';
  el.style.borderRadius = '2px';
  el.style.willChange = 'transform, opacity';
  return el;
}

function celebrate() {
  // don't spam if user prefers reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const count = 40;
  const frag = document.createDocumentFragment();
  const pieces = [];
  for (let i=0;i<count;i++){
    const p = makePiece();
    frag.appendChild(p);
    pieces.push(p);
  }
  confettiRoot.appendChild(frag);

  // animate pieces
  pieces.forEach((p, i) => {
    const delay = i * 10;
    const duration = 1600 + Math.random()*800;
    const dx = (Math.random() - 0.5) * 1200; // horizontal travel
    const rotate = (Math.random() - 0.5) * 720;
    p.animate([
      { transform: `translate3d(0,0,0) rotate(0deg)`, opacity:1 },
      { transform: `translate3d(${dx}px, ${window.innerHeight + 200}px,0) rotate(${rotate}deg)`, opacity:0.6 }
    ], {
      duration,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      delay
    });

    // cleanup
    setTimeout(()=> {
      if (p && p.parentNode) p.parentNode.removeChild(p);
    }, duration + delay + 60);
  });
}

/* ---------- Ensure accurate time after tab inactive ---------- */
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // recompute target if system time changed
    if (new Date() > target) target = nextJan6();
    updateCountdown();
  }
});

/* ---------- Resize handling to avoid visual overflow ---------- */
window.addEventListener('resize', () => {
  // force small reflow to avoid overflow in some browsers
  card.style.transform = 'translateZ(0)';
  requestAnimationFrame(() => card.style.transform = '');
});

/* ---------- Accessibility: announce when reaching zero ---------- */
const announce = (message) => {
  try {
    const live = document.createElement('div');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.style.position = 'absolute';
    live.style.left = '-9999px';
    live.textContent = message;
    document.body.appendChild(live);
    setTimeout(() => document.body.removeChild(live), 3000);
  } catch (e) {}
}

/* trigger celebrate + announce */
function celebrateAndAnnounce() {
  celebrate();
  announce('Countdown reached 6 January. Happy!'); // screen reader
}

/* Override celebrate to also announce */
function celebrate() {
  celebrateAndAnnounceOriginal();
}

/* Save original celebrate function and redefine to include announce */
const celebrateAndAnnounceOriginal = (function() {
  // closure: return original logic (copied here to keep single function definition)
  return function() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const count = 40;
    const frag = document.createDocumentFragment();
    const pieces = [];
    for (let i=0;i<count;i++){
      const p = (function(){
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        const size = Math.floor(Math.random() * 10) + 6;
        el.style.width = `${size}px`;
        el.style.height = `${Math.floor(size * 0.6)}px`;
        el.style.background = ['#ff6b6b','#ffd166','#60a5fa','#34d399','#f472b6'][Math.floor(Math.random()*5)];
        el.style.position = 'absolute';
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = '-10%';
        el.style.opacity = '0.95';
        el.style.borderRadius = '2px';
        el.style.willChange = 'transform, opacity';
        return el;
      })();
      frag.appendChild(p);
      pieces.push(p);
    }
    confettiRoot.appendChild(frag);

    pieces.forEach((p, i) => {
      const delay = i * 10;
      const duration = 1600 + Math.random()*800;
      const dx = (Math.random() - 0.5) * 1200;
      const rotate = (Math.random() - 0.5) * 720;
      p.animate([
        { transform: `translate3d(0,0,0) rotate(0deg)`, opacity:1 },
        { transform: `translate3d(${dx}px, ${window.innerHeight + 200}px,0) rotate(${rotate}deg)`, opacity:0.6 }
      ], {
        duration,
        easing: 'cubic-bezier(.2,.8,.2,1)',
        delay
      });
      setTimeout(()=> { if (p && p.parentNode) p.parentNode.removeChild(p); }, duration + delay + 60);
    });

    // screen reader announce
    try {
      const live = document.createElement('div');
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      live.style.position = 'absolute';
      live.style.left = '-9999px';
      live.textContent = 'Countdown reached 6 January.';
      document.body.appendChild(live);
      setTimeout(() => document.body.removeChild(live), 3000);
    } catch (e) {}
  };
})();

/* Expose celebrate to module functions above */
window.celebrate = celebrateAndAnnounceOriginal;

/* ---------- small safety: re-evaluate target on focus ---------- */
window.addEventListener('focus', () => {
  if (new Date() > target) target = nextJan6();
  updateCountdown();
});

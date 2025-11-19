/* Update: confetti container now inside the card; fullscreen-safe logic; body scroll inside card */

/* Helpers */
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');

function nextJan6() {
  const now = new Date();
  let year = now.getFullYear();
  let t = new Date(year, 0, 6, 0, 0, 0, 0);
  if (now > t) t = new Date(year + 1, 0, 6, 0, 0, 0, 0);
  return t;
}

/* Elements */
const daysEl = $('days'), hoursEl = $('hours'), minutesEl = $('minutes'), secondsEl = $('seconds');
const fsBtn = $('fsBtn'), themeToggle = $('themeToggle'), posterBtn = $('posterBtn');
const card = $('card'), confettiRoot = $('confetti'), status = $('status');
const appRoot = document.documentElement;

let target = nextJan6();

/* Countdown */
function updateCountdown() {
  const now = new Date();
  let diff = target - now;
  if (diff <= 0) {
    // celebrate, retarget and continue
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

/* Tick aligned to seconds */
function startTicker(){
  updateCountdown();
  const ms = 1000 - (performance.now() % 1000);
  setTimeout(() => {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }, ms);
}
startTicker();

/* Fullscreen: fix card to viewport */
async function enterFS() {
  try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
    else if (document.documentElement.msRequestFullscreen) await document.documentElement.msRequestFullscreen();
  } catch (e) { console.warn('enterFS', e); }
}
async function exitFS() {
  try { if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    else if (document.msExitFullscreen) await document.msExitFullscreen();
  } catch (e) { console.warn('exitFS', e); }
}

fsBtn.addEventListener('click', async () => {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  if (!isFS) await enterFS();
  else await exitFS();
});

function updateFsUI() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  fsBtn.textContent = isFS ? '⤫ Exit Full' : '⛶ Full';
  fsBtn.setAttribute('aria-pressed', String(isFS));
}
document.addEventListener('fullscreenchange', updateFsUI);
document.addEventListener('webkitfullscreenchange', updateFsUI);
document.addEventListener('msfullscreenchange', updateFsUI);

/* Poster mode toggles header/footer */
posterBtn.addEventListener('click', () => {
  const on = card.classList.toggle('poster-mode');
  posterBtn.textContent = on ? '🖼️ Poster On' : '🖼 Poster';
});

/* Theme toggle (dark default) */
function applyTheme(name) {
  if (name === 'light') {
    appRoot.setAttribute('data-theme','light');
    themeToggle.textContent = '🌙 Dark';
    status.textContent = 'Light mode — saved';
  } else {
    appRoot.removeAttribute('data-theme');
    themeToggle.textContent = '🌤 Light';
    status.textContent = 'Dark mode — saved';
  }
  try { localStorage.setItem('countdown-theme', name); } catch(e) {}
}
(function initTheme(){
  const saved = localStorage.getItem('countdown-theme');
  if (saved === 'light') applyTheme('light'); else applyTheme('dark');
})();
themeToggle.addEventListener('click', () => {
  const isLight = appRoot.getAttribute('data-theme') === 'light';
  applyTheme(isLight ? 'dark' : 'light');
});

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') fsBtn.click();
  if (e.key === 'd' || e.key === 'D') themeToggle.click();
  if (e.key === 'p' || e.key === 'P') posterBtn.click();
});

/* Confetti inside card - constrained to card bounds */
function makePiece() {
  const el = document.createElement('div');
  el.className = 'confetti-piece';
  const w = 6 + Math.floor(Math.random()*10);
  el.style.width = `${w}px`;
  el.style.height = `${Math.max(4, Math.floor(w*0.6))}px`;
  el.style.background = ['#ff6b6b','#ffd166','#60a5fa','#34d399','#f472b6'][Math.floor(Math.random()*5)];
  el.style.position = 'absolute';
  // place relative to card width
  el.style.left = `${Math.random() * (card.clientWidth - 20)}px`;
  el.style.top = `-20px`;
  el.style.opacity = '0.95';
  el.style.borderRadius = '2px';
  el.style.willChange = 'transform, opacity';
  return el;
}

function celebrate() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = 30;
  const pieces = [];
  const frag = document.createDocumentFragment();
  for (let i=0;i<count;i++){
    const p = makePiece();
    frag.appendChild(p);
    pieces.push(p);
  }
  confettiRoot.appendChild(frag);

  pieces.forEach((p,i) => {
    const delay = i * 12;
    const duration = 1200 + Math.random()*900;
    const dx = (Math.random() - 0.5) * (card.clientWidth * 0.8);
    const dy = card.clientHeight + 100 + Math.random()*200;
    const rotate = (Math.random() - 0.5) * 720;
    p.animate([
      { transform: `translate3d(0,0,0) rotate(0deg)`, opacity:1 },
      { transform: `translate3d(${dx}px, ${dy}px,0) rotate(${rotate}deg)`, opacity:0.6 }
    ], {
      duration,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      delay
    });
    setTimeout(()=> { if (p && p.parentNode) p.parentNode.removeChild(p); }, duration + delay + 80);
  });

  // announce to SR
  try {
    const live = document.createElement('div');
    live.setAttribute('role','status');
    live.setAttribute('aria-live','polite');
    live.style.position = 'absolute';
    live.style.left = '-9999px';
    live.textContent = 'Countdown reached 6 January.';
    document.body.appendChild(live);
    setTimeout(()=> document.body.removeChild(live), 3000);
  } catch(e){}
}

/* keep accurate after tab hidden */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    if (new Date() > target) target = nextJan6();
    updateCountdown();
  }
});

/* resize: adjust confetti positioning safe */
window.addEventListener('resize', () => {
  // nothing heavy; keep card layout stable
  card.style.transform = 'translateZ(0)';
  requestAnimationFrame(()=> card.style.transform = '');
});

/* final: ensure initial layout/readiness */
window.addEventListener('load', () => {
  // ensure card has correct min-height
  updateCountdown();
});

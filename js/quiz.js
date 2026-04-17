"use strict";

// ============================
// QUIZ LOGIC & UI
// ============================

// ---- Persisted state ----
let script     = localStorage.getItem('km_script') || 'hiragana';
let stats      = loadStats();
let limit      = loadLimit();
let celebrated = loadCelebrated();
let srsCards   = loadSRSCards();

/** @type {{answer:string, romaji:string, choices:string[], item:object} | null} */
let current = null;

// ---- DOM refs (populated in init, after DOM is ready) ----
let $tabH, $tabK, $prompt, $choices, $next, $speak;
let $acc, $streak, $due, $reset, $lesson, $less5, $more5, $all;
let $celebrate, $celebrateClose;
let $toast50, $toast50Yes, $toast50No, $toast75, $toast75Close;
let $grid, $dueCount, $newCount;

// ---- Init ----
function init() {
  // Resolve DOM refs now that the document is ready
  $tabH          = document.getElementById('tab-hira');
  $tabK          = document.getElementById('tab-kata');
  $prompt        = document.getElementById('prompt');
  $choices       = document.getElementById('choices');
  $next          = document.getElementById('next');
  $speak         = document.getElementById('speak');
  $acc           = document.getElementById('acc');
  $streak        = document.getElementById('streak');
  $due           = document.getElementById('due');
  $reset         = document.getElementById('reset');
  $lesson        = document.getElementById('lesson');
  $less5         = document.getElementById('less5');
  $more5         = document.getElementById('more5');
  $all           = document.getElementById('all');
  $celebrate      = document.getElementById('celebrate');
  $celebrateClose = document.getElementById('celebrate-close');
  $toast50        = document.getElementById('toast-50');
  $toast50Yes     = document.getElementById('toast-50-yes');
  $toast50No      = document.getElementById('toast-50-no');
  $toast75        = document.getElementById('toast-75');
  $toast75Close   = document.getElementById('toast-75-close');
  $grid          = document.getElementById('kana-grid');
  $dueCount      = document.getElementById('due-count');
  $newCount      = document.getElementById('new-count');

  bindEvents();
  updateSeg();
  updateStatsUI();
  updateLessonUI();
  renderGrid();
  updateDueUI();
  newQuestion();
}

// ---- Events ----
function bindEvents() {
  $tabH.addEventListener('click', () => { script = 'hiragana'; saveScript(); updateSeg(); renderGrid(); newQuestion(); });
  $tabK.addEventListener('click', () => { script = 'katakana'; saveScript(); updateSeg(); renderGrid(); newQuestion(); });

  $next.addEventListener('click', () => newQuestion());

  $reset.addEventListener('click', () => {
    stats = { correct: 0, total: 0, streak: 0 };
    saveStats(stats);
    srsCards = resetSRSCards();
    updateStatsUI();
    updateDueUI();
    renderGrid();
    newQuestion();
  });

  $speak.addEventListener('click', speak);

  $more5.addEventListener('click', () => { limit = Math.min(ITEMS.length, limit + 5); saveLimit(); updateLessonUI(); updateDueUI(); renderGrid(); newQuestion(); });
  $less5.addEventListener('click', () => { limit = Math.max(5, limit - 5); saveLimit(); updateLessonUI(); updateDueUI(); renderGrid(); newQuestion(); });
  $all  .addEventListener('click', () => { limit = ITEMS.length; saveLimit(); updateLessonUI(); updateDueUI(); renderGrid(); newQuestion(); });

  $celebrateClose.addEventListener('click', hideCelebrate);

  // Toast 50 — ask user
  $toast50Yes.addEventListener('click', () => {
    hideToast($toast50);
    expandDeck();
  });
  $toast50No.addEventListener('click', () => hideToast($toast50));

  // Toast 75 — already auto-expanded, just dismiss
  $toast75Close.addEventListener('click', () => hideToast($toast75));

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); newQuestion(); return; }
    if (e.key === 'h' || e.key === 'H') { script = 'hiragana'; saveScript(); updateSeg(); renderGrid(); newQuestion(); return; }
    if (e.key === 'k' || e.key === 'K') { script = 'katakana'; saveScript(); updateSeg(); renderGrid(); newQuestion(); return; }
    if (['1','2','3','4'].includes(e.key)) {
      const btn = $choices.querySelectorAll('button')[Number(e.key) - 1];
      if (btn) btn.click();
    }
  });
}

// ---- UI helpers ----
function updateSeg() {
  $tabH.setAttribute('aria-pressed', String(script === 'hiragana'));
  $tabH.setAttribute('aria-selected', String(script === 'hiragana'));
  $tabK.setAttribute('aria-pressed', String(script === 'katakana'));
  $tabK.setAttribute('aria-selected', String(script === 'katakana'));
}

// Arc circumference for r=30: 2πr ≈ 188.5, but we use a 270° partial arc
// Track dasharray = 188.5 * 0.75 = 141 visible, rest gap
// Fill: pct of 141
const ARC_TOTAL = 141; // 270° of circumference (r=30)

function setArc(arcEl, pct) {
  if (!arcEl) return;
  const filled = pct === null ? 0 : Math.round((pct / 100) * ARC_TOTAL);
  arcEl.style.strokeDasharray = filled + ' 188';
}

function updateStatsUI() {
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
  // Accuracy arc
  const accVal = document.getElementById('acc-value');
  const accArc = document.getElementById('acc-arc');
  if (accVal) accVal.textContent = pct !== null ? `${pct}%` : '—';
  setArc(accArc, pct);
  // Streak chip
  const streakVal = $streak.querySelector('.stat-chip__value');
  if (streakVal) streakVal.textContent = String(stats.streak || 0);
}

function updateLessonUI() {
  // Lesson arc
  const lessonVal = document.getElementById('lesson-value');
  const lessonArc = document.getElementById('lesson-arc');
  if (lessonVal) lessonVal.innerHTML = `${limit}<span class="arc-sub">/${ITEMS.length}</span>`;
  setArc(lessonArc, Math.round((limit / ITEMS.length) * 100));
}

function updateDueUI() {
  const deck = ITEMS.slice(0, limit);
  const due  = countDue(srsCards, deck);
  const nw   = countNew(srsCards, deck);
  $dueCount.textContent = String(due);
  $newCount.textContent = String(nw);
  $due.className = 'stat-chip stat-chip--blue' + (due > 0 ? ' stat-chip--urgent' : '');
}

// ---- Core quiz logic ----
function newQuestion() {
  $choices.innerHTML = '';
  const deck = ITEMS.slice(0, limit);

  // SRS: pick the best next card
  const ans = pickNextCard(srsCards, deck);
  const correctKana = script === 'hiragana' ? ans.hira : ans.kata;

  // Build wrong choices from rest of deck
  const pool = shuffle(deck.filter(it => it.romaji !== ans.romaji)).slice(0, 16);
  const wrong = [];
  for (const it of pool) {
    const ch = script === 'hiragana' ? it.hira : it.kata;
    if (ch !== correctKana && !wrong.includes(ch)) wrong.push(ch);
    if (wrong.length === 3) break;
  }
  const choices = shuffle([correctKana, ...wrong]);

  current = { answer: correctKana, romaji: ans.romaji, choices, item: ans };

  $prompt.textContent = ans.romaji;
  choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.textContent = ch;
    btn.setAttribute('aria-label', `Choice ${i + 1}`);
    btn.addEventListener('click', () => handleAnswer(btn, ch));
    $choices.appendChild(btn);
  });
}

function handleAnswer(btn, choice) {
  if (!current) return;
  const correct = choice === current.answer;

  // Highlight correct / wrong
  for (const b of $choices.querySelectorAll('button')) {
    b.disabled = true;
    if (b.textContent === current.answer) b.classList.add('correct');
  }
  if (!correct) btn.classList.add('wrong');

  // Update quiz stats
  stats.total += 1;
  if (correct) { stats.correct += 1; stats.streak = (stats.streak || 0) + 1; }
  else { stats.streak = 0; }
  saveStats(stats);
  updateStatsUI();

  // Update SRS card
  const card = getCard(srsCards, current.romaji);
  reviewCard(card, correct ? 1 : 0);
  saveSRSCards(srsCards);

  updateDueUI();
  renderGrid();
  maybeMilestone();
}

function speakText(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speak() { if (!current) return; speakText(current.answer); }

// ---- Deck expansion (keeps streak) ----
function expandDeck() {
  if (limit >= ITEMS.length) return;
  limit = Math.min(ITEMS.length, limit + 5);
  saveLimit();
  updateLessonUI();
  updateDueUI();
  renderGrid();
  newQuestion();
}

// ---- Toast helpers ----
let _toastTimer = null;
function showToast(el, autoDismissMs) {
  if (!el) return;
  el.classList.add('show');
  if (autoDismissMs) {
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => hideToast(el), autoDismissMs);
  }
}
function hideToast(el) { if (el) el.classList.remove('show'); }

// ---- Milestones ----
// Track which milestones have fired per deck size
function loadMilestones()  { try { return JSON.parse(localStorage.getItem('km_milestones') || '{}'); } catch { return {}; } }
function saveMilestones(m) { try { localStorage.setItem('km_milestones', JSON.stringify(m)); } catch {} }
let milestones = loadMilestones();

function maybeMilestone() {
  const s = stats.streak;
  const key50 = `${limit}_50`, key75 = `${limit}_75`, key100 = `${limit}_100`;

  // 100 streak — auto expand + celebrate
  if (s >= 100 && !milestones[key100]) {
    milestones[key100] = true; saveMilestones(milestones);
    expandDeck();
    showCelebrate();
    return;
  }
  // 75 streak — auto expand + notify toast
  if (s >= 75 && !milestones[key75] && !milestones[key100]) {
    milestones[key75] = true; saveMilestones(milestones);
    expandDeck();
    showToast($toast75, 6000);
    return;
  }
  // 50 streak — ask toast
  if (s >= 50 && !milestones[key50] && !milestones[key75] && !milestones[key100]) {
    milestones[key50] = true; saveMilestones(milestones);
    showToast($toast50, 0); // no auto-dismiss — user must respond
    return;
  }
}

// ---- Celebration (100 streak modal) ----
function showCelebrate() { $celebrate.classList.add('show'); }
function hideCelebrate()  { $celebrate.classList.remove('show'); }

// ---- Progress grid ----
function renderGrid() {
  $grid.innerHTML = '';
  const deck = new Set(ITEMS.slice(0, limit).map(x => x.romaji));

  for (const it of ITEMS) {
    const ch   = script === 'hiragana' ? it.hira : it.kata;
    const card = srsCards[it.romaji];
    const level = srsLevel(card);
    const inDeck = deck.has(it.romaji);

    const cell = document.createElement('div');
    cell.className = `kana-cell srs-${level}${inDeck ? '' : ' not-in-deck'}`;
    cell.textContent = ch;
    cell.title = `${it.romaji} — ${level}${card && card.dueDate ? ' (due: ' + card.dueDate + ')' : ''}`;
    $grid.appendChild(cell);
  }
}

// ---- Utilities ----
function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

// ---- Storage helpers ----
function loadStats()     { try { const s = JSON.parse(localStorage.getItem('km_stats') || 'null'); return s || { correct: 0, total: 0, streak: 0 }; } catch { return { correct: 0, total: 0, streak: 0 }; } }
function saveStats(s)    { try { localStorage.setItem('km_stats', JSON.stringify(s)); } catch {} }

function loadLimit()     { try { const n = parseInt(localStorage.getItem('km_limit') || '5', 10); if (Number.isNaN(n)) return 5; return Math.min(ITEMS.length, Math.max(5, n)); } catch { return 5; } }
function saveLimit()     { try { localStorage.setItem('km_limit', String(limit)); } catch {} }

function loadCelebrated(){ try { const arr = JSON.parse(localStorage.getItem('km_celebrated') || '[]'); return Array.isArray(arr) ? arr : []; } catch { return []; } }
function saveCelebrated(){ try { localStorage.setItem('km_celebrated', JSON.stringify(celebrated)); } catch {} }

function saveScript()    { try { localStorage.setItem('km_script', script); } catch {} }

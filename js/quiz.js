"use strict";

// ============================
// QUIZ LOGIC & UI
// ============================

// ---- localStorage key constants ----
const KEYS = {
  script:     'km_script',
  stats:      'km_stats',
  limit:      'km_limit',
  srs:        'km_srs_cards',
  theme:      'km_theme',
  milestones: 'km_milestones'
};

// ---- Persisted state ----
let script   = localStorage.getItem(KEYS.script) || 'hiragana';
let stats    = loadStats();
let limit    = loadLimit();
let srsCards = loadSRSCards();

/** @type {{answer:string, romaji:string, choices:string[], item:object} | null} */
let current     = null;
let lastAnswer  = null; // persists after current is nulled, for Play button

// ---- Timers ----
let _toastTimer  = null;
let _expandTimer = null;

// ---- Milestones ----
let milestones = loadMilestones();

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
    milestones = {};
    saveMilestones(milestones);
    limit = 5;
    saveLimit();
    current = null;
    lastAnswer = null;
    // Clear all milestone UI and pending timers
    clearTimeout(_toastTimer); _toastTimer = null;
    clearTimeout(_expandTimer); _expandTimer = null;
    hideToast($toast50);
    hideToast($toast75);
    hideCelebrate();
    updateStatsUI();
    updateLessonUI();
    updateDueUI();
    renderGrid();
    newQuestion();
  });

  $speak.addEventListener('click', speak);

  $more5.addEventListener('click', () => { limit = Math.min(ITEMS.length, limit + 5); saveLimit(); updateLessonUI(); updateDueUI(); renderGrid(); });
  $less5.addEventListener('click', () => { limit = Math.max(5, limit - 5); saveLimit(); updateLessonUI(); updateDueUI(); renderGrid(); });
  $all  .addEventListener('click', () => { limit = ITEMS.length; saveLimit(); updateLessonUI(); updateDueUI(); renderGrid(); });

  $celebrateClose.addEventListener('click', hideCelebrate);

  // Toast 50 — ask user
  $toast50Yes.addEventListener('click', () => {
    hideToast($toast50);
    expandDeck();
  });
  $toast50No.addEventListener('click', () => hideToast($toast50));

  // Toast 75 — already auto-expanded, just dismiss
  $toast75Close.addEventListener('click', () => hideToast($toast75));

}

// ---- UI helpers ----
function updateSeg() {
  $tabH.setAttribute('aria-pressed', String(script === 'hiragana'));
  $tabK.setAttribute('aria-pressed', String(script === 'katakana'));
}

// Arc circumference for r=30: 2πr ≈ 188.5, showing 270° = 75% of arc
const ARC_CIRCUMF   = Math.round(2 * Math.PI * 30 * 10) / 10; // 188.5
const ARC_TRACK_LEN = Math.round(ARC_CIRCUMF * 0.75);          // 141

function setArc(arcEl, pct) {
  if (!arcEl) return;
  const filled = pct === null ? 0 : Math.round((pct / 100) * ARC_TRACK_LEN);
  arcEl.style.strokeDasharray = `${filled} ${ARC_CIRCUMF}`;
}

function updateStatsUI() {
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
  // Accuracy arc
  const accVal = document.getElementById('acc-value');
  const accArc = document.getElementById('acc-arc');
  if (accVal) accVal.textContent = pct !== null ? `${pct}%` : '—';
  setArc(accArc, pct);
  // Streak chip
  const streakVal = $streak ? $streak.querySelector('.stat-chip__value') : null;
  if (streakVal) streakVal.textContent = String(stats.streak || 0);
}

function updateLessonUI() {
  // Lesson arc
  const lessonVal = document.getElementById('lesson-value');
  const lessonArc = document.getElementById('lesson-arc');
  if (lessonVal) lessonVal.innerHTML = `${limit}<span class="arc-sub">/${ITEMS.length}</span>`;
  setArc(lessonArc, Math.round((limit / ITEMS.length) * 100));

  // Disable controls contextually
  if ($less5) $less5.disabled = limit <= 5;
  if ($more5) $more5.disabled = limit >= ITEMS.length;
  if ($all)   $all.disabled   = limit >= ITEMS.length;
}

function updateDueUI() {
  const deck = ITEMS.slice(0, limit);
  const due  = countDue(srsCards, deck);
  const nw   = countNew(srsCards, deck);
  if ($dueCount) $dueCount.textContent = String(due);
  if ($newCount) $newCount.textContent = String(nw);
  if ($due) $due.className = 'stat-chip stat-chip--blue' + (due > 0 ? ' stat-chip--urgent' : '');
}

// ---- Core quiz logic ----
function newQuestion() {
  // Cancel any pending expandDeck auto-advance
  if (_expandTimer) { clearTimeout(_expandTimer); _expandTimer = null; }
  $choices.innerHTML = '';
  const deck = ITEMS.slice(0, limit);
  if (!deck.length) return; // safety guard — should never happen with limit >= 5

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
  lastAnswer = current;

  // Disable Next until user answers
  if ($next) $next.disabled = true;

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
  const { answer, romaji } = current;
  current = null; // guard against double-click
  const correct = choice === answer;

  // Highlight correct / wrong
  for (const b of $choices.querySelectorAll('button')) {
    b.disabled = true;
    if (b.textContent === answer) b.classList.add('correct');
  }
  if (!correct) btn.classList.add('wrong');

  // Update quiz stats
  stats.total += 1;
  if (correct) { stats.correct += 1; stats.streak = (stats.streak || 0) + 1; }
  else { stats.streak = 0; }
  saveStats(stats);
  updateStatsUI();

  // Update SRS card
  const card = getCard(srsCards, romaji);
  reviewCard(card, correct ? 1 : 0);
  saveSRSCards(srsCards);

  // Re-enable Next after answering
  if ($next) $next.disabled = false;

  updateDueUI();
  renderGrid();
  maybeMilestone();
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speak() { if (!lastAnswer) return; speakText(lastAnswer.answer); }

// ---- Deck expansion (keeps streak) ----
// Delay newQuestion so user sees the answer feedback first
function expandDeck() {
  if (limit >= ITEMS.length) return;
  limit = Math.min(ITEMS.length, limit + 5);
  saveLimit();
  updateLessonUI();
  updateDueUI();
  renderGrid();
  _expandTimer = setTimeout(() => { _expandTimer = null; newQuestion(); }, 800);
}

// ---- Toast helpers ----
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
function loadMilestones()  { try { return JSON.parse(localStorage.getItem(KEYS.milestones) || '{}'); } catch { return {}; } }
function saveMilestones(m) { try { localStorage.setItem(KEYS.milestones, JSON.stringify(m)); } catch {} }

function maybeMilestone() {
  const s = stats.streak;
  const key50 = `${limit}_50`, key75 = `${limit}_75`, key100 = `${limit}_100`;
  const atMax = limit >= ITEMS.length;

  // 50 streak — ask toast (only if room to expand)
  if (s >= 50 && s < 75 && !milestones[key50]) {
    milestones[key50] = true; saveMilestones(milestones);
    if (!atMax) showToast($toast50, 0);
    return;
  }
  // 75 streak — auto expand + notify (only if room to expand)
  if (s >= 75 && s < 100 && !milestones[key75]) {
    milestones[key75] = true; saveMilestones(milestones);
    if (!atMax) { expandDeck(); showToast($toast75, 6000); }
    return;
  }
  // 100 streak — auto expand + celebrate (only if room to expand)
  if (s >= 100 && !milestones[key100]) {
    milestones[key100] = true; saveMilestones(milestones);
    if (!atMax) { expandDeck(); showCelebrate(); }
    return;
  }
}

// ---- Celebration (100 streak modal) ----
function showCelebrate() { $celebrate.classList.add('show'); }
function hideCelebrate()  { $celebrate.classList.remove('show'); }

// ---- Progress grid ----
function renderGrid() {
  const deck = new Set(ITEMS.slice(0, limit).map(x => x.romaji));
  const existing = $grid.querySelectorAll('.kana-cell');

  // Full rebuild only if cell count doesn't match (first render uses .kana-cell=0, or script switch)
  if (existing.length !== ITEMS.length) {
    $grid.innerHTML = '';
    for (const it of ITEMS) {
      const cell = document.createElement('div');
      cell.dataset.romaji = it.romaji;
      $grid.appendChild(cell);
    }
  }

  // Update each cell in place (no DOM thrash)
  const cells = $grid.querySelectorAll('.kana-cell, [data-romaji]');
  ITEMS.forEach((it, i) => {
    const cell  = cells[i];
    if (!cell) return;
    const ch     = script === 'hiragana' ? it.hira : it.kata;
    const card   = srsCards[it.romaji];
    const level  = srsLevel(card);
    const inDeck = deck.has(it.romaji);
    const safeDate = card && card.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(card.dueDate) ? card.dueDate : '';

    cell.className = `kana-cell srs-${level}${inDeck ? '' : ' not-in-deck'}`;
    cell.textContent = ch;
    cell.title = `${it.romaji} — ${level}${safeDate ? ' (due: ' + safeDate + ')' : ''}`;
    cell.dataset.romaji = it.romaji;
  });
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
function loadStats()  { try { const s = JSON.parse(localStorage.getItem(KEYS.stats) || 'null'); return s || { correct: 0, total: 0, streak: 0 }; } catch { return { correct: 0, total: 0, streak: 0 }; } }
function saveStats(s) { try { localStorage.setItem(KEYS.stats, JSON.stringify(s)); } catch {} }

function loadLimit()  { try { const n = parseInt(localStorage.getItem(KEYS.limit) || '5', 10); if (Number.isNaN(n)) return 5; return Math.min(ITEMS.length, Math.max(5, n)); } catch { return 5; } }
function saveLimit()  { try { localStorage.setItem(KEYS.limit, String(limit)); } catch {} }

function saveScript() { try { localStorage.setItem(KEYS.script, script); } catch {} }

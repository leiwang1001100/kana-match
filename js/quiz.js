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

// ---- DOM refs ----
const $tabH          = document.getElementById('tab-hira');
const $tabK          = document.getElementById('tab-kata');
const $prompt        = document.getElementById('prompt');
const $choices       = document.getElementById('choices');
const $next          = document.getElementById('next');
const $skip          = document.getElementById('skip');
const $speak         = document.getElementById('speak');
const $acc           = document.getElementById('acc');
const $streak        = document.getElementById('streak');
const $due           = document.getElementById('due');
const $reset         = document.getElementById('reset');
const $lesson        = document.getElementById('lesson');
const $less5         = document.getElementById('less5');
const $more5         = document.getElementById('more5');
const $all           = document.getElementById('all');
const $celebrate     = document.getElementById('celebrate');
const $celebrateAdd  = document.getElementById('celebrate-add');
const $celebrateClose= document.getElementById('celebrate-close');
const $grid          = document.getElementById('kana-grid');
const $deckSize      = document.getElementById('deck-size');
const $dueCount      = document.getElementById('due-count');
const $newCount      = document.getElementById('new-count');

// ---- Init ----
function init() {
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
  $skip.addEventListener('click', () => newQuestion());

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

  $celebrateAdd.addEventListener('click', () => {
    limit = Math.min(ITEMS.length, limit + 5);
    saveLimit();
    stats = { correct: 0, total: 0, streak: 0 };
    saveStats(stats);
    updateStatsUI();
    updateLessonUI();
    updateDueUI();
    hideCelebrate();
    renderGrid();
    newQuestion();
  });
  $celebrateClose.addEventListener('click', hideCelebrate);

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

function updateStatsUI() {
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : '—';
  $acc.textContent    = `Accuracy — ${pct}${stats.total ? '%' : ''}`;
  $streak.textContent = `Streak — ${stats.streak || 0}`;
}

function updateLessonUI() {
  $lesson.textContent  = `Lesson — ${limit} / ${ITEMS.length}`;
  $deckSize.textContent = String(limit);
}

function updateDueUI() {
  const deck = ITEMS.slice(0, limit);
  const due  = countDue(srsCards, deck);
  const nw   = countNew(srsCards, deck);
  $dueCount.textContent = String(due);
  $newCount.textContent = String(nw);
  $due.className = 'pill' + (due > 0 ? ' due' : '');
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
  maybeCelebrate();
}

function speakText(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speak() { if (!current) return; speakText(current.answer); }

// ---- Celebration ----
function shouldCelebrate() {
  return stats.streak >= 100 && stats.total > 0 && stats.correct === stats.total && !celebrated.includes(limit);
}
function maybeCelebrate() { if (!shouldCelebrate()) return; celebrated.push(limit); saveCelebrated(); showCelebrate(); }
function showCelebrate() { $celebrate.classList.add('show'); }
function hideCelebrate() { $celebrate.classList.remove('show'); }

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
    cell.addEventListener('click', () => speakText(ch));
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

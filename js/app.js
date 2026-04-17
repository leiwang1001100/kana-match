"use strict";

// ============================
// ENTRY POINT
// ============================
// Wires everything together and runs self-tests on load.

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  init();       // bindEvents() is called inside init() after DOM refs are resolved
  runSelfTests();
});

// ============================
// DARK THEME (mirrors epub app)
// ============================
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem(KEYS.theme);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  applyTheme(isDark);

  toggle.addEventListener('click', () => {
    const nowDark = toggle.getAttribute('aria-checked') !== 'true';
    applyTheme(nowDark);
    localStorage.setItem(KEYS.theme, nowDark ? 'dark' : 'light');
  });


  // Listen for system theme changes (with Safari < 14 fallback)
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const mqHandler = e => { if (!localStorage.getItem(KEYS.theme)) applyTheme(e.matches); };
  try { mq.addEventListener('change', mqHandler); }
  catch { try { mq.addListener(mqHandler); } catch {} }
}

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-checked', String(dark));
  }
}

// ============================
// SELF-TESTS (console only)
// ============================
function runSelfTests() {
  const group = (name, fn) => {
    console.groupCollapsed(`TEST: ${name}`);
    try { fn(); console.log('✅ passed'); }
    catch (e) { console.error('❌ failed:', e.message); }
    console.groupEnd();
  };
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  group('ITEMS length == 46', () => {
    assert(Array.isArray(ITEMS), 'ITEMS not array');
    assert(ITEMS.length === 46, `expected 46, got ${ITEMS.length}`);
  });

  group('Key mappings exist', () => {
    const map = Object.fromEntries(ITEMS.map(x => [x.romaji, x]));
    assert(map['a']?.hira === 'あ'   && map['a']?.kata === 'ア',   'a → あ/ア');
    assert(map['shi']?.hira === 'し' && map['shi']?.kata === 'シ', 'shi → し/シ');
    assert(map['tsu']?.hira === 'つ' && map['tsu']?.kata === 'ツ', 'tsu → つ/ツ');
    assert(map['wo']?.hira === 'を'  && map['wo']?.kata === 'ヲ',  'wo → を/ヲ');
    assert(map['n']?.hira === 'ん'   && map['n']?.kata === 'ン',   'n → ん/ン');
  });

  group('shuffle keeps elements', () => {
    const sample = ['あ','い','う','え','お'];
    const out = shuffle(sample);
    assert(out.length === sample.length, 'length changed');
    assert(sample.every(v => out.includes(v)), 'elements changed');
  });

  group('SRS — reviewCard correct increases interval', () => {
    const card = { romaji:'a', interval:0, easeFactor:2.5, dueDate:null, lapses:0 };
    reviewCard(card, 1);
    assert(card.interval === 1, `interval after 1st correct should be 1, got ${card.interval}`);
    reviewCard(card, 1);
    assert(card.interval === 3, `interval after 2nd correct should be 3, got ${card.interval}`);
    reviewCard(card, 1);
    assert(card.interval > 3, `interval after 3rd correct should grow, got ${card.interval}`);
  });

  group('SRS — reviewCard wrong resets interval', () => {
    const card = { romaji:'i', interval:10, easeFactor:2.5, dueDate:'2026-01-01', lapses:0 };
    reviewCard(card, 0);
    assert(card.interval === 0, `interval after wrong should be 0, got ${card.interval}`);
    assert(card.lapses === 1, `lapses should be 1, got ${card.lapses}`);
  });

  group('SRS — srsLevel returns correct levels', () => {
    assert(srsLevel(null) === 'new', 'null card should be new');
    assert(srsLevel({ dueDate: null, interval: 0 }) === 'new', 'unseen card should be new');
    assert(srsLevel({ dueDate: '2026-01-01', interval: 1 }) === 'learning', 'interval 1 should be learning');
    assert(srsLevel({ dueDate: '2026-01-01', interval: 5 }) === 'young', 'interval 5 should be young');
    assert(srsLevel({ dueDate: '2026-01-01', interval: 21 }) === 'mature', 'interval 21 should be mature');
  });

  group('SRS — pickNextCard prefers due cards', () => {
    const deck = ITEMS.slice(0, 5);
    const cards = {};
    // Make first card due yesterday
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    cards[deck[0].romaji] = { romaji: deck[0].romaji, interval: 1, easeFactor: 2.5, dueDate: yesterday.toISOString().slice(0,10), lapses: 0 };
    const picked = pickNextCard(cards, deck);
    assert(picked.romaji === deck[0].romaji, `should pick due card, got ${picked.romaji}`);
  });

  group('celebrate condition logic (pure)', () => {
    const pure = (st, lim, cel) => st.streak >= 100 && st.total > 0 && st.correct === st.total && !cel.includes(lim);
    const st1 = { correct: 100, total: 100, streak: 100 };
    const st2 = { correct: 99,  total: 100, streak: 100 };
    assert(pure(st1, 5, [])  === true,  'should celebrate on perfect 100');
    assert(pure(st2, 5, [])  === false, 'should not celebrate at <100%');
    assert(pure(st1, 5, [5]) === false, 'should not repeat same limit');
  });

  group('milestone cascade — 50/75/100 fire in correct windows', () => {
    const check = (streak, ms, lim) => {
      const key50 = `${lim}_50`, key75 = `${lim}_75`, key100 = `${lim}_100`;
      if (streak >= 50 && streak < 75 && !ms[key50])  return 50;
      if (streak >= 75 && streak < 100 && !ms[key75]) return 75;
      if (streak >= 100 && !ms[key100])               return 100;
      return null;
    };
    assert(check(50,  {}, 5) === 50,  '50 streak should fire 50 milestone');
    assert(check(74,  {}, 5) === 50,  '74 streak should still fire 50 milestone');
    assert(check(75,  {}, 5) === 75,  '75 streak should fire 75 milestone');
    assert(check(99,  {}, 5) === 75,  '99 streak should still fire 75 milestone');
    assert(check(100, {}, 5) === 100, '100 streak should fire 100 milestone');
    assert(check(50,  {'5_50': true}, 5) === null, 'already-fired 50 should not repeat');
    assert(check(75,  {'5_75': true}, 5) === null, 'already-fired 75 should not repeat');
  });

  group('SRS — pickNextCard falls back to future cards when none due', () => {
    const deck = ITEMS.slice(0, 3);
    const cards = {};
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0,10);
    // All cards are future (due tomorrow)
    deck.forEach(it => {
      cards[it.romaji] = { romaji: it.romaji, interval: 1, easeFactor: 2.5, dueDate: tomorrowStr, lapses: 0 };
    });
    const picked = pickNextCard(cards, deck);
    assert(deck.some(it => it.romaji === picked.romaji), 'should pick a card from the deck');
  });

  console.info('%cSelf-tests complete.', 'color:#16a34a;font-weight:600');
}

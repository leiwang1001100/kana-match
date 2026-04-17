"use strict";

// ============================
// SRS ENGINE (SM-2 algorithm)
// ============================
// Each card stores:
// {
//   romaji:     string   — unique key
//   interval:   number   — days until next review (0 = new/relearning)
//   easeFactor: number   — multiplier for interval growth (min 1.3)
//   dueDate:    string   — ISO date string "YYYY-MM-DD" (null = new, never seen)
//   lapses:     number   — times answered wrong after being learnt
// }

const SRS_STORE_KEY = 'km_srs_cards';
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

// Returns today as "YYYY-MM-DD"
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Returns a date string N days from today
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Load all SRS card data from localStorage
function loadSRSCards() {
  try {
    const raw = localStorage.getItem(SRS_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// Save all SRS card data to localStorage
function saveSRSCards(cards) {
  try { localStorage.setItem(SRS_STORE_KEY, JSON.stringify(cards)); } catch {}
}

// Get or create a card record for a given romaji
function getCard(cards, romaji) {
  if (!cards[romaji]) {
    cards[romaji] = {
      romaji,
      interval: 0,
      easeFactor: DEFAULT_EASE,
      dueDate: null,   // null = brand new, never seen
      lapses: 0
    };
  }
  return cards[romaji];
}

// SM-2 update after an answer
// quality: 1 = correct, 0 = wrong
function reviewCard(card, quality) {
  const t = today();

  if (quality === 1) {
    // Correct answer
    if (card.interval === 0) {
      card.interval = 1;           // first correct: 1 day
    } else if (card.interval === 1) {
      card.interval = 3;           // second correct: 3 days
    } else {
      card.interval = Math.round(card.interval * card.easeFactor);
    }
    card.easeFactor = Math.max(MIN_EASE, card.easeFactor + 0.1);
    card.dueDate = addDays(t, card.interval);
  } else {
    // Wrong answer — reset to relearning
    card.lapses += 1;
    card.easeFactor = Math.max(MIN_EASE, card.easeFactor - 0.2);
    card.interval = 0;
    card.dueDate = t; // due again immediately (today)
  }

  return card;
}

// SRS level label for a card (used for grid colouring)
// "new"      — never seen
// "learning" — interval 0–1 (relearning / just started)
// "young"    — interval 2–20
// "mature"   — interval > 20
function srsLevel(card) {
  if (!card || card.dueDate === null) return 'new';
  if (card.interval <= 1)  return 'learning';
  if (card.interval <= 20) return 'young';
  return 'mature';
}

// Is this card due today or overdue?
function isDue(card) {
  if (!card || card.dueDate === null) return false; // new cards handled separately
  return card.dueDate <= today();
}

// Pick the next card to show from the deck (first N ITEMS)
// Priority: 1) due cards (overdue first)  2) new cards  3) earliest due future card
function pickNextCard(cards, deck) {
  const t = today();

  // 1) Due / overdue cards — pick most overdue first
  const due = deck.filter(it => {
    const c = cards[it.romaji];
    return c && c.dueDate !== null && c.dueDate <= t;
  });
  if (due.length > 0) {
    due.sort((a, b) => cards[a.romaji].dueDate.localeCompare(cards[b.romaji].dueDate));
    // Pick randomly among the top overdue (within same date) to add variety
    const topDate = cards[due[0].romaji].dueDate;
    const sameDate = due.filter(it => cards[it.romaji].dueDate === topDate);
    return sameDate[Math.floor(Math.random() * sameDate.length)];
  }

  // 2) New cards (never seen)
  const newCards = deck.filter(it => !cards[it.romaji] || cards[it.romaji].dueDate === null);
  if (newCards.length > 0) {
    return newCards[Math.floor(Math.random() * newCards.length)];
  }

  // 3) All cards are future — pick the soonest due one
  const future = deck.slice().sort((a, b) =>
    cards[a.romaji].dueDate.localeCompare(cards[b.romaji].dueDate)
  );
  return future[0];
}

// Count how many cards in the deck are due today
function countDue(cards, deck) {
  const t = today();
  return deck.filter(it => {
    const c = cards[it.romaji];
    return c && c.dueDate !== null && c.dueDate <= t;
  }).length;
}

// Count new (never seen) cards in the deck
function countNew(cards, deck) {
  return deck.filter(it => !cards[it.romaji] || cards[it.romaji].dueDate === null).length;
}

// Reset all SRS data
function resetSRSCards() {
  localStorage.removeItem(SRS_STORE_KEY);
  return {};
}

"use strict";

// ============================
// MILESTONE & TOAST LOGIC
// ============================
// Depends on: ITEMS (data.js), KEYS/stats/limit/saveLimit/updateLessonUI/updateDueUI/renderGrid/newQuestion/showCelebrate/hideCelebrate (quiz.js)
// Load order: data.js → srs.js → quiz.js → milestones.js → app.js

// ---- Timers ----
var _toastTimer  = null;
var _expandTimer = null;

// ---- Milestone state ----
var milestones = loadMilestones();

// ---- Toast DOM refs (set by initMilestones) ----
var $toast50, $toast50Yes, $toast50No, $toast75, $toast75Close;

// ---- Init ----
function initMilestones() {
  $toast50      = document.getElementById('toast-50');
  $toast50Yes   = document.getElementById('toast-50-yes');
  $toast50No    = document.getElementById('toast-50-no');
  $toast75      = document.getElementById('toast-75');
  $toast75Close = document.getElementById('toast-75-close');

  if ($toast50Yes)   $toast50Yes.addEventListener('click', () => { hideToast($toast50); expandDeck(); });
  if ($toast50No)    $toast50No.addEventListener('click',  () => hideToast($toast50));
  if ($toast75Close) $toast75Close.addEventListener('click', () => hideToast($toast75));
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

// ---- Deck expansion ----
// Delays newQuestion so user sees answer feedback first
function expandDeck() {
  if (limit >= ITEMS.length) return;
  limit = Math.min(ITEMS.length, limit + 5);
  saveLimit();
  updateLessonUI();
  updateDueUI();
  renderGrid();
  _expandTimer = setTimeout(() => { _expandTimer = null; newQuestion(); }, 800);
}

// ---- Milestone checks ----
// Use literal key string — KEYS may not be defined when this file first loads
const MILESTONE_KEY = 'km_milestones';
function loadMilestones()  { try { return JSON.parse(localStorage.getItem(MILESTONE_KEY) || '{}'); } catch { return {}; } }
function saveMilestones(m) { try { localStorage.setItem(MILESTONE_KEY, JSON.stringify(m)); } catch {} }

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

// ---- Reset milestone state ----
function resetMilestones() {
  clearTimeout(_toastTimer); _toastTimer = null;
  clearTimeout(_expandTimer); _expandTimer = null;
  hideToast($toast50);
  hideToast($toast75);
  milestones = {};
  saveMilestones(milestones);
}

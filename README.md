# Kana Match 🎌

![Version](https://img.shields.io/badge/version-v0.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A lightweight, offline-capable Japanese kana quiz app — no server, no dependencies, just open `index.html`.

**[▶ Play it live](https://leiwang1001100.github.io/kana-match/)**

---

## What is it?

Kana Match drills you on the **46 base kana** (hiragana and katakana) using a simple flashcard-style quiz:

> A random **romaji** is shown → pick the matching **kana** from 4 choices.

All progress is saved locally in your browser via `localStorage` — no account needed.

---

## Features

- 🔤 **Hiragana & Katakana** — toggle between scripts anytime
- 📚 **Lesson limiter** — start with just 5 kana, expand by +5 as you improve
- 📊 **Accuracy & streak tracking** — live stats with localStorage persistence
- 🟩 **Progress grid** — see which kana you've practised at a glance
- 🔊 **Audio playback** — hear the kana spoken using your browser's Japanese voice
- 🎉 **Celebration modal** — triggered at 100-answer streak with 100% accuracy
- ⌨️ **Keyboard shortcuts**:
  - `1`–`4` → answer choices
  - `Space` → next question
  - `H` → switch to Hiragana
  - `K` → switch to Katakana

---

## How to use

### Online
Visit **https://leiwang1001100.github.io/kana-match/**

### Offline
1. Clone or download the repo
2. Open `index.html` in any modern browser — no install needed

```bash
git clone https://github.com/leiwang1001100/kana-match.git
cd kana-match
open index.html
```

---

## Kana covered

All 46 base kana across 11 rows:

| Row | Romaji |
|-----|--------|
| a | a, i, u, e, o |
| k | ka, ki, ku, ke, ko |
| s | sa, shi, su, se, so |
| t | ta, chi, tsu, te, to |
| n | na, ni, nu, ne, no |
| h | ha, hi, fu, he, ho |
| m | ma, mi, mu, me, mo |
| y | ya, yu, yo |
| r | ra, ri, ru, re, ro |
| w | wa, wo |
| n | n |

---

## Tech stack

- **Pure HTML + CSS + Vanilla JS** — zero dependencies, zero build step
- **localStorage** — persists stats, lesson size, reviewed progress
- **Web Speech API** — browser-native Japanese TTS

---

## Roadmap

- [ ] Dakuten & handakuten kana (が、ざ、ば、ぱ…)
- [ ] Compound kana / youon (きゃ、しゅ、ちょ…)
- [ ] Reverse mode: Kana → Romaji
- [ ] Typing mode
- [ ] Vocabulary module
- [ ] Dark mode

---

## Changelog

### v0.2.0 — 2026-04-17
- ♻️ Refactored into modular files (`styles.css`, `js/data.js`, `js/srs.js`, `js/quiz.js`, `js/app.js`)
- 🧠 Added **Spaced Repetition System (SM-2 algorithm)** — cards you miss come back sooner
- 🟩 Progress grid now shows 4 SRS levels: New / Learning / Young / Mature
- 📊 Stats bar now shows **Due** and **New** card counts
- ✅ Expanded self-tests to cover SRS logic

### v0.1.0 — 2026-04-17
- 🎌 Initial release — 46 base kana quiz (Hiragana & Katakana)
- Lesson limiter (+5 / −5 / All)
- Accuracy & streak tracking with localStorage persistence
- Progress grid, audio playback, celebration modal
- Keyboard shortcuts (1–4, Space, H, K)

---

## License

MIT

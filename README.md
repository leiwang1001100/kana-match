# Kana Match 🎌

![Version](https://img.shields.io/badge/version-v0.4.1-blue)
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
- 🧠 **Spaced Repetition (SM-2)** — cards you miss come back sooner; cards you know are scheduled further out
- 📊 **Arc progress rings** — Accuracy and Lesson shown as animated partial arc rings
- 🟩 **Kana progress grid** — colour-coded by SRS level (New / Learning / Young / Mature)
- 🔥 **Streak milestones** — toasts at 50 streak, auto-expand at 75 and 100
- 📚 **Lesson limiter** — start with 5 kana, grows automatically as you improve
- 🔊 **Audio playback** — hear the kana via your browser's Japanese voice
- 🌙 **Dark mode** — toggle with the ◑ button, respects system preference
- 🎨 **Glassmorphism UI** — animated gradient background, frosted glass cards and buttons
- 📱 **Mobile friendly** — responsive layout, works great on phone and tablet
- ⌨️ **Keyboard shortcuts** (desktop):
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

## Releases & Changelog

See the [Releases page](https://github.com/leiwang1001100/kana-match/releases) for full release notes and changelogs.

Each release includes a downloadable **zip** and **tar.gz** of the full source — just extract and open `index.html` offline.

---

## License

MIT

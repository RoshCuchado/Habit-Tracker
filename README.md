# Habit Tracker

A minimal, dark-themed habit tracker that runs entirely in the browser. No accounts, no server, no dependencies. Just HTML, CSS, and vanilla JS backed by `localStorage`.

---

**[→ Live Demo](https://habitylytrackerer.netlify.app/)**

## Features

- **Multiple habits** — create as many tabs as you want, each with its own name, calendar, and streak
- **Monthly calendar** — click any day to mark it; click again to unmark. Browse past and future months freely
- **Streak tracking** — counts consecutive days backward from today. Breaks the moment you miss a day, no grace period
- **Streak tiers** — seven progression tiers (Ember → Eternal Flame) with unique characters, particle effects, and flavor text that unlock as your streak grows
- **Milestone overlays** — animated full-screen popups fire at days 3, 10, 20, 30, 50, 75, 100, and beyond. Back-filling old months queues them sequentially
- **Month complete overlay** — marks the moment you fill an entire month with a seal and particle burst
- **Progress bar** — shows days completed vs total for the current view month
- **Custom dialogs** — all prompts and confirms use styled in-app modals instead of browser defaults
- **Mobile-friendly** — 44px tap targets, no 300ms delay, responsive layout down to 320px

---

## Getting Started

No build step required. Just clone and open.

```bash
git clone https://github.com/your-username/habit-tracker.git
cd habit-tracker
open index.html
```

Or drop the four files onto any static host (GitHub Pages, Netlify, Vercel, etc.).

---

## File Structure

```
├── index.html   # markup and overlay shells
├── style.css    # all styling, including overlays, tabs, modals, responsive rules
├── data.js      # storage helpers, streak logic, tiers, particle system, SVG builders
└── app.js       # UI wiring — calendar render, tab management, modal system, event handlers
```

`data.js` must load before `app.js`. Everything else is self-contained.

---

## Storage

All data lives in `localStorage`, namespaced by habit ID:

| Key pattern | Contains |
|---|---|
| `ht_habits` | Array of `{ id, name }` objects |
| `ht_active` | ID of the currently selected habit |
| `ht_<id>_<year>_<month>` | Marked days for that month `{ day: true }` |
| `ht_<id>_md_<year>_<month>` | Whether the month-complete overlay has fired |
| `ht_<id>_sk_<n>` | Whether streak milestone `n` has been shown |

Clearing `localStorage` resets everything. There's no export/import — this is intentional to keep the project scope minimal.

---

## Streak Tiers

| Days | Tier |
|---|---|
| 3–9 | The Ember |
| 10–19 | Kindled |
| 20–29 | The Burning One |
| 30–49 | Iron Discipline |
| 50–74 | Storm Forged |
| 75–99 | The Undying |
| 100+ | Eternal Flame |

---

## Browser Support

Anything modern. Requires `localStorage`, `Canvas API`, and `SVG`. Tested on Chrome, Firefox, Safari (iOS and desktop), and Samsung Internet.


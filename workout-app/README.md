# Workout Tracker PWA

A minimalist, progressive bodyweight workout tracker built as a Progressive Web App. Designed for tablet use during workout sessions with large touch targets and at-a-glance readability.

## Features

- **Weekly schedule**: Full-body strength (Mon/Thu/Sat), HIIT (Tue), Steady-state cardio (Fri), Rest (Wed/Sun)
- **Progressive overload**: Level selector per movement pattern (Beginner → Intermediate → Advanced)
- **Per-set logging**: Checkboxes, reps/hold-time, RPE tracking
- **Rest timer**: Auto-starts after completing a set, with skip/extend controls and audio alerts
- **HIIT timer**: Work/rest intervals with round tracking
- **Post-session summary**: Volume table, RPE analysis, progressive overload prompts
- **Offline support**: Service worker caches all files for use without internet
- **Screen wake lock**: Keeps tablet screen on during workouts
- **Dark/light mode**: Respects system preference

## Tech Stack

- Pure HTML, CSS, and JavaScript (ES modules)
- No build step, no Node.js, no bundler
- PWA with service worker for offline capability
- Web Audio API for timer alerts (no audio files)

## Deploying to GitHub Pages

1. Push this entire `workout-app/` folder to a GitHub repository.
2. Go to **Settings → Pages → Source** → select `main` branch, `/ (root)`.
3. GitHub Pages will serve the app at `https://<username>.github.io/<repo-name>/`.
4. Update `"start_url"` in `manifest.json` to match:
   `"start_url": "/<repo-name>/"` (if not deploying to a custom domain).
5. Open the URL on your tablet — your browser will offer **"Add to Home Screen."**
   Accept it. The app will launch in full-screen standalone mode with no browser UI.

## Offline Support

The service worker caches all files on first load. After that, the app works with no internet connection. To update the app after making changes, increment the cache version string in `sw.js` (e.g., `CACHE_NAME = 'workout-v2'`).

## Icons

Replace `icons/icon-192.png` and `icons/icon-512.png` with your own PNG icons. A minimal SVG favicon is included inline in `index.html`.

## Project Structure

```
workout-app/
├── index.html              # App shell
├── css/
│   └── styles.css          # All styles and animations
├── js/
│   ├── data.js             # Workout data and progression tables
│   ├── timer.js            # Rest timer, stopwatch, HIIT timer, audio
│   ├── session.js          # State management and localStorage
│   ├── ui.js               # DOM rendering and event handling
│   └── summary.js          # Post-session summary and clipboard export
├── sw.js                   # Service worker for offline caching
├── manifest.json           # PWA manifest
└── README.md               # This file
```

## Evidence Basis

Training parameters are based on the ACSM 2026 Position Stand and Schoenfeld volume meta-analyses. See `evidence-based-training-synthesis.md` for the full research synthesis.

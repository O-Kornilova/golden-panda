# Selida — Landing Page with Interactive Quiz

A responsive landing page with a multi-step quiz funnel, reliable time-on-page tracking, and a Node.js/Express backend that saves all user data.

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | HTML5, CSS3 (custom properties + Grid/Flex), Vanilla JS (ES2020) |
| Backend  | Node.js + Express |
| Storage  | JSON file (atomic write pattern — no data corruption) |
| Fonts    | Lora (display) + Source Sans 3 (body) via Google Fonts |

---

## Features

### 1. Responsive Landing Page
- Pixel-close recreation of the provided screenshot
- Fully responsive: Mobile / Tablet / Desktop
- Sticky header, smooth scroll anchors
- CSS custom properties for consistent theming

### 2. Multi-Step Quiz (6 steps)
| Step | Type | Question |
|------|------|----------|
| 1 | Button selection | How old are you? |
| 2 | Button selection | What is your biological sex? |
| 3 | Button selection | Activity level |
| 4 | **Number input** | Current weight (validated: 30–300 kg) |
| 5 | **Number input** | Target weight (must be **< current weight**) |
| 6 | **Multi-select** | Joint discomfort areas |

Animated step transitions, progress bar, and a personalised result screen at the end.

### 3. Time Tracking
- Tracks *active* time (pauses when the tab is hidden via `visibilitychange` API)
- Displayed to the user on the result screen

### 4. Data Storage (Backend)
- `POST /api/submit` — saves the complete quiz result
- `POST /api/heartbeat` — periodic partial saves (every 30s) + on page unload via `sendBeacon`
- Upsert by `sessionId` — handles retries and duplicate sends gracefully
- **Atomic writes** (write → temp file → rename) prevent JSON corruption on server crash
- All data stored in `data/submissions.json`

---

## Running Locally

```bash
npm install
npm start
# → http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

View saved submissions:
```
GET http://localhost:3000/api/submissions
```

---

## Deployment (Railway / Render / Fly.io)

1. Push this repo to GitHub
2. Connect to [Railway](https://railway.app) or [Render](https://render.com)
3. Set start command: `node server.js`
4. Set PORT environment variable (Railway sets it automatically)
5. Deploy ✓

For **persistent storage on serverless platforms**, replace the JSON file with a hosted DB (e.g., PlanetScale, Supabase, or MongoDB Atlas) — the `readSubmissions` / `writeSubmissions` functions are isolated for easy swapping.

---

## Project Structure

```
golden-panda/
├── public/
│   ├── index.html      ← Landing page markup
│   ├── style.css       ← All styles (responsive)
│   └── app.js          ← Quiz logic + tracking + API calls
├── data/
│   └── submissions.json ← User data (auto-created)
├── server.js           ← Express API
├── package.json
└── README.md
```

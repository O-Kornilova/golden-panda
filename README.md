# Selida — Landing Page with Interactive Quiz

A responsive landing page with a multi-step quiz funnel, reliable time-on-page tracking, and a Node.js/Express backend that saves all user data.

> ⚠️ **Note:** The app is hosted on Render's free tier. If the service hasn't been used recently, the first request may take **30–60 seconds** to wake up. Please wait and refresh if the page doesn't load immediately.

🔗 **Live demo:** https://golden-panda.onrender.com  
📁 **Repository:** https://github.com/O-Kornilova/golden-panda

---

## Tech Stack

| Layer    | Technology                                                       |
| -------- | ---------------------------------------------------------------- |
| Frontend | HTML5, CSS3 (custom properties + Grid/Flex), Vanilla JS (ES2020) |
| Backend  | Node.js + Express                                                |
| Storage  | JSON file (atomic write pattern — no data corruption)            |
| Fonts    | Lora (display) + Source Sans 3 (body) via Google Fonts           |

---

## Features

### 1. Responsive Landing Page

- Pixel-close recreation of the provided screenshot
- Fully responsive: Mobile / Tablet / Desktop
- Sticky header, smooth scroll anchors
- CSS custom properties for consistent theming

### 2. Multi-Step Quiz (6 steps)

| Step | Type             | Question                                     |
| ---- | ---------------- | -------------------------------------------- |
| 1    | Button selection | How old are you?                             |
| 2    | Button selection | What is your biological sex?                 |
| 3    | Button selection | Activity level                               |
| 4    | **Number input** | Current weight (validated: 30–300 kg)        |
| 5    | **Number input** | Target weight (must be **< current weight**) |
| 6    | **Multi-select** | Joint discomfort areas                       |

Animated step transitions and a personalised result screen at the end.

### 3. Time Tracking

- Tracks _active_ time (pauses when the tab is hidden via `visibilitychange` API)
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

## Viewing User Data

All quiz submissions are saved to `data/submissions.json` on the server.

To view collected data (time on page + all quiz answers) visit:

```
GET https://golden-panda.onrender.com/api/submissions
```

Each record contains:

- `sessionId` — unique user session
- `answers` — all quiz responses
- `timeSpentSeconds` — active time on page
- `completedAt` — submission timestamp
- `isPartial` — true if user left before finishing the quiz

## Deployment

Deployed on [Render](https://render.com):

1. Push this repo to GitHub
2. New Web Service → connect `golden-panda` repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Deploy ✓

> **Note on storage:** Render's free tier resets the filesystem on each redeploy, so `submissions.json` is cleared on new deployments. For production, replace with a hosted DB (e.g., MongoDB Atlas, Supabase) — the `readSubmissions` / `writeSubmissions` functions in `server.js` are isolated for easy swapping.

---

## Project Structure

```
golden-panda/
├── public/
│   ├── index.html      ← Landing page markup
│   ├── style.css       ← All styles (responsive)
│   ├── app.js          ← Quiz logic + tracking + API calls
│   └── img/            ← Images and logo
├── data/
│   └── submissions.json ← User data (auto-created)
├── server.js           ← Express API
├── package.json
└── README.md
```

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers ---
function readSubmissions() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeSubmissions(data) {
  // Atomic write: write to a temp file, then rename — prevents corruption
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// --- Routes ---

// POST /api/submit — save complete quiz result
app.post('/api/submit', (req, res) => {
  try {
    const { sessionId, answers, timeSpentSeconds, completedAt } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const submissions = readSubmissions();

    // Upsert by sessionId — handles retries / duplicate sends gracefully
    const existingIndex = submissions.findIndex(s => s.sessionId === sessionId);
    const record = {
      sessionId,
      answers,
      timeSpentSeconds: timeSpentSeconds || 0,
      completedAt: completedAt || new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      submissions[existingIndex] = record;
    } else {
      submissions.push(record);
    }

    writeSubmissions(submissions);
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// POST /api/heartbeat — periodic save of time + partial progress (prevents data loss)
app.post('/api/heartbeat', (req, res) => {
  try {
    const { sessionId, timeSpentSeconds, partialAnswers } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const submissions = readSubmissions();
    const existingIndex = submissions.findIndex(s => s.sessionId === sessionId);

    const record = {
      sessionId,
      answers: partialAnswers || {},
      timeSpentSeconds: timeSpentSeconds || 0,
      isPartial: true,
      lastSeen: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      // Preserve completed submissions — never overwrite with partial
      if (!submissions[existingIndex].completedAt) {
        submissions[existingIndex] = record;
      }
    } else {
      submissions.push(record);
    }

    writeSubmissions(submissions);
    res.json({ success: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// GET /api/submissions — view all saved data (dev/admin)
app.get('/api/submissions', (req, res) => {
  const submissions = readSubmissions();
  res.json({ count: submissions.length, submissions });
});

// Catch-all → serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Submissions saved to: ${DATA_FILE}`);
});

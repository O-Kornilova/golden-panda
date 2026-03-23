/**
 * Selida Landing Page — App Logic
 * Features:
 *  - Multi-step quiz with validation
 *  - Reliable time-on-page tracking (survives tab switches)
 *  - Periodic heartbeat saves (every 30s)
 *  - Final submission with retry logic
 *  - Session ID (persisted in sessionStorage for reconnects)
 */

// ──────────────────────────────────────────────
//  CONFIG
// ──────────────────────────────────────────────
const API_BASE = '' // empty = same origin; set to 'http://localhost:3000' for local dev
const HEARTBEAT_INTERVAL = 30_000 // ms

// ──────────────────────────────────────────────
//  SESSION / TIME TRACKING
// ──────────────────────────────────────────────
const SESSION_KEY = 'gp_session_id'

function generateId () {
  return 'sess_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now()
}

function getSessionId () {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateId()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

const sessionId = getSessionId()

// Time tracking — uses a dedicated accumulator so tab-hide pauses correctly
let accumulatedSeconds = 0
let sessionStart = Date.now()
let isHidden = false

function getTimeSpent () {
  const extra = isHidden ? 0 : (Date.now() - sessionStart) / 1000
  return Math.round(accumulatedSeconds + extra)
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    accumulatedSeconds += (Date.now() - sessionStart) / 1000
    isHidden = true
  } else {
    sessionStart = Date.now()
    isHidden = false
  }
})

function formatTime (seconds) {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

// ──────────────────────────────────────────────
//  QUIZ STATE
// ──────────────────────────────────────────────
const TOTAL_STEPS = 6

const answers = {
  age: null,
  gender: null,
  activity: null,
  currentWeight: null,
  targetWeight: null,
  jointAreas: []
}

let currentStep = 1

// DOM refs
const progressFill = document.getElementById('progressFill')

function setProgress (step) {
  if (!progressFill) return
  const pct = ((step - 1) / TOTAL_STEPS) * 100
  progressFill.style.width = pct + '%'
  const label = document.getElementById('stepLabel')
  if (label) label.textContent = `Step ${step} of ${TOTAL_STEPS}`
}

function showStep (n) {
  document.querySelectorAll('.quiz-step').forEach(el => el.classList.remove('active'))
  const next = document.getElementById(
    n === 'result' ? 'step-result' : n === 'loading' ? 'step-loading' : `step-${n}`
  )
  if (next) next.classList.add('active')
  currentStep = n

  const label = document.getElementById('stepLabel')
  const bar = document.querySelector('.quiz-progress-bar')

  if (n === 'result' || n === 'loading') {
    if (label) label.style.display = 'none'
    if (bar) bar.style.display = 'none'
  } else {
    if (label) label.style.display = 'block'
    if (bar) bar.style.display = 'block'
    setProgress(n)
  }
}

function advanceToStep (n) {
  showStep(n)
  // Scroll quiz into view on mobile
  document.getElementById('quiz').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// ──────────────────────────────────────────────
//  STEP 1 — Age (button selection)
// ──────────────────────────────────────────────
document.querySelectorAll('[data-step="1"]').forEach(btn => {
  btn.addEventListener('click', () => {
    answers.age = btn.dataset.value
    advanceToStep(2)
  })
})

// ──────────────────────────────────────────────
//  STEP 2 — Gender
// ──────────────────────────────────────────────
document.querySelectorAll('[data-step="2"]').forEach(btn => {
  btn.addEventListener('click', () => {
    answers.gender = btn.dataset.value
    advanceToStep(3)
  })
})

// ──────────────────────────────────────────────
//  STEP 3 — Activity Level
// ──────────────────────────────────────────────
document.querySelectorAll('[data-step="3"]').forEach(btn => {
  btn.addEventListener('click', () => {
    answers.activity = btn.dataset.value
    advanceToStep(4)
  })
})

// ──────────────────────────────────────────────
//  STEP 4 — Current Weight (validated input)
// ──────────────────────────────────────────────
const currentWeightInput = document.getElementById('currentWeight')
const weightError = document.getElementById('weightError')
const nextStep4Btn = document.getElementById('nextStep4')

nextStep4Btn.addEventListener('click', () => {
  const val = parseFloat(currentWeightInput.value)
  if (!val || val < 30 || val > 300) {
    weightError.classList.remove('hidden')
    currentWeightInput.classList.add('invalid')
    currentWeightInput.focus()
    return
  }
  weightError.classList.add('hidden')
  currentWeightInput.classList.remove('invalid')
  answers.currentWeight = val

  // Pre-fill display for next step
  document.getElementById('currentWeightDisplay').textContent = val
  advanceToStep(5)
})
currentWeightInput.addEventListener('input', () => {
  weightError.classList.add('hidden')
  currentWeightInput.classList.remove('invalid')
})

currentWeightInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') nextStep4Btn.click()
})

// ──────────────────────────────────────────────
//  STEP 5 — Target Weight (must be < current)
// ──────────────────────────────────────────────
const targetWeightInput = document.getElementById('targetWeight')
const targetError = document.getElementById('targetError')
const nextStep5Btn = document.getElementById('nextStep5')

nextStep5Btn.addEventListener('click', () => {
  const val = parseFloat(targetWeightInput.value)
  const current = answers.currentWeight

  if (!val || val < 30 || val >= current) {
    targetError.classList.remove('hidden')
    targetWeightInput.classList.add('invalid')
    targetWeightInput.focus()
    return
  }
  targetError.classList.add('hidden')
  targetWeightInput.classList.remove('invalid')
  answers.targetWeight = val
  advanceToStep(6)
})

targetWeightInput.addEventListener('input', () => {
  targetError.classList.add('hidden')
  targetWeightInput.classList.remove('invalid')
})
targetWeightInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') nextStep5Btn.click()
})
// ──────────────────────────────────────────────
//  STEP 6 — Joint Areas (multi-select)
// ──────────────────────────────────────────────
const nextStep6Btn = document.getElementById('nextStep6')

document.querySelectorAll('[data-step="6"]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('selected')
    const val = btn.dataset.value
    if (btn.classList.contains('selected')) {
      if (!answers.jointAreas.includes(val)) answers.jointAreas.push(val)
    } else {
      answers.jointAreas = answers.jointAreas.filter(v => v !== val)
    }
    nextStep6Btn.disabled = answers.jointAreas.length === 0
  })
})

nextStep6Btn.addEventListener('click', () => {
  showStep('loading')
  document.getElementById('quiz').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  setTimeout(() => {
    showResultScreen()
  }, 1800)
})

// ──────────────────────────────────────────────
//  RESULT SCREEN
// ──────────────────────────────────────────────
function showResultScreen () {
  // Build summary table
  const summary = document.getElementById('resultSummary')
  const items = [
    { label: 'Age range', value: answers.age },
    { label: 'Gender', value: answers.gender },
    { label: 'Activity level', value: answers.activity },
    { label: 'Current weight', value: answers.currentWeight + ' kg' },
    { label: 'Target weight', value: answers.targetWeight + ' kg' },
    { label: 'Joint areas', value: answers.jointAreas.join(', ') }
  ]
  summary.innerHTML = items
    .map(
      i =>
        `<div class="result-summary-item">
       <span class="label">${i.label}</span>
       <span class="value">${i.value || '—'}</span>
     </div>`
    )
    .join('')

  // Update time display
  const timeEl = document.getElementById('resultTime')
  timeEl.textContent = formatTime(getTimeSpent())

  // Update progress bar to 100%
  progressFill.style.width = '100%'

  showStep('result')

  // Submit to server
  submitData()
}

// ──────────────────────────────────────────────
//  DATA SUBMISSION (with retry)
// ──────────────────────────────────────────────
async function postJSON (url, body) {
  const res = await fetch(API_BASE + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true // works in beforeunload
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function submitData (retries = 3) {
  const statusEl = document.getElementById('saveStatus')
  const payload = {
    sessionId,
    answers,
    timeSpentSeconds: getTimeSpent(),
    completedAt: new Date().toISOString()
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await postJSON('/api/submit', payload)
      statusEl.textContent = '✓ Your answers have been saved.'
      statusEl.classList.add('saved')
      return
    } catch (err) {
      console.warn(`Submit attempt ${attempt} failed:`, err)
      if (attempt < retries) await sleep(1000 * attempt) // backoff
    }
  }
  statusEl.textContent = '⚠ Could not save results. Please try refreshing.'
  statusEl.classList.add('error')
}

// ──────────────────────────────────────────────
//  HEARTBEAT — periodic partial saves
// ──────────────────────────────────────────────
async function sendHeartbeat () {
  if (currentStep === 'result') return // already fully submitted
  try {
    await postJSON('/api/heartbeat', {
      sessionId,
      timeSpentSeconds: getTimeSpent(),
      partialAnswers: answers
    })
  } catch {
    // silent — heartbeat failures are non-critical
  }
}

const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

// ──────────────────────────────────────────────
//  PAGE UNLOAD — fire-and-forget final beacon
// ──────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (currentStep === 'result') return
  // Use sendBeacon for guaranteed delivery on tab close
  const payload = JSON.stringify({
    sessionId,
    timeSpentSeconds: getTimeSpent(),
    partialAnswers: answers
  })
  navigator.sendBeacon(
    API_BASE + '/api/heartbeat',
    new Blob([payload], { type: 'application/json' })
  )
})

// ──────────────────────────────────────────────
//  UTILS
// ──────────────────────────────────────────────
function sleep (ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ──────────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────────
setProgress(1)
showStep(1)

// First heartbeat after 10s (captures bounces too)
setTimeout(sendHeartbeat, 10_000)

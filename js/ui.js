import { PROGRESSION_TABLE, MOVEMENT_PATTERNS, LEVEL_NAMES, WEEKLY_SCHEDULE, HIIT_EXERCISES, HIIT_CONFIG, NEAT_TIPS } from './data.js';
import {
  initSession, getSession, saveSession, getLevels, setLevel, checkSet, uncheckSet,
  updateSetData, recordRestTimerResult, isSessionComplete, getProgress, getSessionDuration,
  resetSession, updateHIITProgress, updateCardioProgress, getDayOfWeek, getTodaySchedule,
  requestWakeLock, releaseWakeLock, setupWakeLockReacquire
} from './session.js';
import {
  startRestTimer, stopRestTimer, skipRest, addRestTime, isRestActive, formatTime,
  playSetComplete, playBeep, startStopwatch, stopStopwatch, resetStopwatch,
  getStopwatchElapsed, isStopwatchRunning, startHIIT, stopHIIT, resumeHIIT, resetHIIT, getHIITState
} from './timer.js';
import { showSummary, hideSummary } from './summary.js';

// --- State ---
let currentDayIndex = getDayOfWeek();
let currentSession = null;
let currentLevels = null;
let sessionStarted = false;

// --- DOM References ---
const app = document.getElementById('app-content');
const daySelector = document.getElementById('day-selector');
const progressContainer = document.getElementById('progress-section');
const restTimerOverlay = document.getElementById('rest-timer-overlay');

// --- Init ---
export function initApp() {
  const { session, levels, schedule } = initSession();
  currentSession = session;
  currentLevels = levels;
  currentDayIndex = getDayOfWeek();

  setupWakeLockReacquire();
  renderDaySelector();
  renderCurrentDay();
}

// --- Day Selector ---
function renderDaySelector() {
  daySelector.innerHTML = '';
  const todayIndex = getDayOfWeek();
  const abbrevs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const typeAbbrevs = ['💪', '⚡', '🌿', '💪', '🏃', '💪', '🌿'];

  WEEKLY_SCHEDULE.forEach((sched, i) => {
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    if (i === currentDayIndex) btn.classList.add('active');
    if (i === todayIndex) btn.classList.add('today');
    btn.innerHTML = `<span class="day-abbr">${abbrevs[i]}</span><span class="day-type">${typeAbbrevs[i]}</span>`;
    btn.addEventListener('click', () => {
      currentDayIndex = i;
      renderDaySelector();
      renderCurrentDay();
    });
    daySelector.appendChild(btn);
  });
}

// --- Main Render ---
function renderCurrentDay() {
  const schedule = WEEKLY_SCHEDULE[currentDayIndex];
  currentSession = getSession();
  currentLevels = getLevels();

  app.innerHTML = '';

  // Session header
  const header = document.createElement('div');
  header.className = 'session-header';
  header.innerHTML = `
    <h1 class="session-title">${schedule.day} — ${schedule.label}</h1>
    <p class="session-subtitle">${schedule.duration}</p>
  `;
  app.appendChild(header);

  // Only render full session for today
  const isToday = currentDayIndex === getDayOfWeek();

  if (schedule.type === 'strength') {
    if (isToday) {
      renderStrengthProgress();
      renderStrengthSession();
    } else {
      renderPreviewMessage(schedule);
    }
  } else if (schedule.type === 'hiit') {
    if (isToday) {
      renderHIITSession();
    } else {
      renderPreviewMessage(schedule);
    }
  } else if (schedule.type === 'cardio') {
    if (isToday) {
      renderCardioSession();
    } else {
      renderPreviewMessage(schedule);
    }
  } else if (schedule.type === 'rest') {
    renderRestDay();
  }
}

function renderPreviewMessage(schedule) {
  const div = document.createElement('div');
  div.className = 'rest-day-container';
  div.innerHTML = `
    <div class="rest-day-icon">📅</div>
    <h2 class="rest-day-title">${schedule.label}</h2>
    <p class="rest-day-tip mt-md">This session is available on ${schedule.day}. Switch to today's date to start your workout.</p>
  `;
  app.appendChild(div);
}

// --- Progress Bar ---
function renderStrengthProgress() {
  const { completed, total } = getProgress(currentLevels);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  progressContainer.innerHTML = `
    <div class="progress-text">${completed} / ${total} sets done</div>
    <div class="progress-container">
      <div class="progress-bar" style="width: ${pct}%"></div>
    </div>
  `;
  progressContainer.classList.remove('hidden');
}

function updateProgress() {
  renderStrengthProgress();
}

// --- Strength Session ---
function renderStrengthSession() {
  const exerciseContainer = document.createElement('div');
  exerciseContainer.id = 'exercise-cards';

  for (const pattern of MOVEMENT_PATTERNS) {
    const card = createExerciseCard(pattern);
    exerciseContainer.appendChild(card);
  }

  app.appendChild(exerciseContainer);

  // Reset button
  const resetArea = document.createElement('div');
  resetArea.className = 'reset-area';
  resetArea.innerHTML = `
    <button class="btn btn-outline btn-sm" id="reset-btn">Reset Today's Session</button>
    <div class="reset-confirm mt-sm" id="reset-confirm">
      <p class="text-muted" style="margin-bottom: var(--spacing-sm)">Are you sure? This clears all checked sets and logged data for today.</p>
      <button class="btn btn-danger btn-sm" id="reset-confirm-btn">Yes, Reset</button>
      <button class="btn btn-secondary btn-sm" id="reset-cancel-btn">Cancel</button>
    </div>
  `;
  app.appendChild(resetArea);

  document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('reset-btn').classList.add('hidden');
    document.getElementById('reset-confirm').style.display = 'block';
  });
  document.getElementById('reset-confirm-btn').addEventListener('click', () => {
    currentSession = resetSession();
    renderCurrentDay();
  });
  document.getElementById('reset-cancel-btn').addEventListener('click', () => {
    document.getElementById('reset-btn').classList.remove('hidden');
    document.getElementById('reset-confirm').style.display = 'none';
  });

  // Check if session was already completed and summary was shown
  if (currentSession.summaryShown && isSessionComplete(currentLevels)) {
    // Session already completed — no auto-show
  }
}

function createExerciseCard(pattern) {
  const levelIndex = currentLevels[pattern] || 0;
  const exerciseData = PROGRESSION_TABLE[pattern][levelIndex];
  const patternLabel = pattern.charAt(0).toUpperCase() + pattern.slice(1);

  // Check if all sets for this pattern are completed
  let allSetsChecked = true;
  for (let i = 0; i < exerciseData.sets; i++) {
    if (!currentSession.sets[`${pattern}-${i}`]?.checked) {
      allSetsChecked = false;
      break;
    }
  }

  const card = document.createElement('div');
  card.className = `exercise-card${allSetsChecked ? ' collapsed' : ''}`;
  card.id = `card-${pattern}`;

  // Header with pattern name and level selector (always visible)
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';

  const leftHeader = document.createElement('div');
  leftHeader.innerHTML = `
    <div class="pattern-name">${patternLabel}</div>
    <div class="exercise-name">${exerciseData.exercise}</div>
  `;

  const levelSelector = createLevelSelector(pattern, levelIndex);

  cardHeader.appendChild(leftHeader);
  cardHeader.appendChild(levelSelector);
  card.appendChild(cardHeader);

  if (allSetsChecked) {
    // Collapsed view
    const collapsed = document.createElement('div');
    collapsed.className = 'collapsed-summary';
    collapsed.innerHTML = `
      <span class="collapsed-checkmark">✓</span>
      <span class="text-muted">${exerciseData.sets} sets completed</span>
    `;
    collapsed.style.cursor = 'pointer';
    collapsed.addEventListener('click', () => {
      card.classList.remove('collapsed');
      collapsed.remove();
      card.appendChild(createCardBody(pattern, exerciseData));
    });
    card.appendChild(collapsed);
  } else {
    card.appendChild(createCardBody(pattern, exerciseData));
  }

  return card;
}

function createCardBody(pattern, exerciseData) {
  const body = document.createElement('div');
  body.className = 'card-body';

  // Cue & Video
  const cueContainer = document.createElement('div');
  cueContainer.style.marginBottom = 'var(--spacing-md)';

  const cue = document.createElement('p');
  cue.className = 'exercise-cue';
  cue.style.marginBottom = '4px';
  cue.textContent = exerciseData.cue;
  cueContainer.appendChild(cue);

  if (exerciseData.videoUrl) {
    const videoLink = document.createElement('a');
    videoLink.href = exerciseData.videoUrl;
    videoLink.target = '_blank';
    videoLink.rel = 'noopener noreferrer';
    videoLink.style.display = 'inline-flex';
    videoLink.style.alignItems = 'center';
    videoLink.style.fontSize = 'var(--font-size-sm)';
    videoLink.style.color = 'var(--in-progress)';
    videoLink.style.textDecoration = 'none';
    videoLink.style.fontWeight = '600';
    videoLink.innerHTML = '📺 Watch Demo';
    cueContainer.appendChild(videoLink);
  }

  body.appendChild(cueContainer);

  // Prescription
  const prescription = document.createElement('div');
  prescription.className = 'exercise-prescription';
  prescription.innerHTML = `
    <span class="prescription-item">📐 ${exerciseData.sets} sets × ${exerciseData.reps}</span>
    <span class="prescription-item">⏱ ${exerciseData.rest}s rest</span>
  `;
  body.appendChild(prescription);

  // Next progression hint
  if (exerciseData.next) {
    const next = document.createElement('p');
    next.className = 'next-progression';
    next.textContent = `Next: ${exerciseData.next}`;
    body.appendChild(next);
  } else {
    const next = document.createElement('p');
    next.className = 'next-progression';
    next.textContent = '✦ Pattern mastered';
    body.appendChild(next);
  }

  // Set rows
  const setsContainer = document.createElement('div');
  setsContainer.className = 'mt-md';
  for (let i = 0; i < exerciseData.sets; i++) {
    setsContainer.appendChild(createSetRow(pattern, i, exerciseData));
  }
  body.appendChild(setsContainer);

  return body;
}

function createSetRow(pattern, setIndex, exerciseData) {
  const setKey = `${pattern}-${setIndex}`;
  const setData = currentSession.sets[setKey] || { checked: false, reps: null, secs: null, rpe: null };

  const row = document.createElement('div');
  row.className = `set-row${setData.checked ? ' checked' : ''}`;
  row.id = `set-${setKey}`;

  // Checkbox
  const checkbox = document.createElement('button');
  checkbox.className = `set-checkbox${setData.checked ? ' checked' : ''}`;
  checkbox.innerHTML = '<span class="check-icon">✓</span>';
  checkbox.setAttribute('aria-label', `Set ${setIndex + 1}`);
  checkbox.addEventListener('click', () => handleSetToggle(pattern, setIndex, exerciseData));
  row.appendChild(checkbox);

  // Label
  const label = document.createElement('span');
  label.className = 'set-label';
  label.textContent = `Set ${setIndex + 1}`;
  row.appendChild(label);

  // Reps or Secs input
  if (exerciseData.isTimedHold) {
    const group = document.createElement('div');
    group.className = 'input-group';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'set-input';
    input.placeholder = 's';
    input.min = '0';
    input.max = '300';
    input.value = setData.secs || '';
    input.setAttribute('aria-label', `Seconds for set ${setIndex + 1}`);
    input.addEventListener('change', (e) => {
      const val = parseInt(e.target.value) || null;
      updateSetData(pattern, setIndex, 'secs', val);
      currentSession = getSession();
    });
    group.appendChild(input);
    const inputLabel = document.createElement('span');
    inputLabel.className = 'input-label';
    inputLabel.textContent = 'sec';
    group.appendChild(inputLabel);
    row.appendChild(group);
  } else {
    const group = document.createElement('div');
    group.className = 'input-group';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'set-input';
    input.placeholder = 'reps';
    input.min = '0';
    input.max = '100';
    input.value = setData.reps || '';
    input.setAttribute('aria-label', `Reps for set ${setIndex + 1}`);
    input.addEventListener('change', (e) => {
      const val = parseInt(e.target.value) || null;
      updateSetData(pattern, setIndex, 'reps', val);
      currentSession = getSession();
    });
    group.appendChild(input);
    const inputLabel = document.createElement('span');
    inputLabel.className = 'input-label';
    inputLabel.textContent = 'reps';
    group.appendChild(inputLabel);
    row.appendChild(group);
  }

  // RPE Stepper
  const rpeContainer = document.createElement('div');
  rpeContainer.className = 'input-group';
  const rpeLabel = document.createElement('span');
  rpeLabel.className = 'rpe-label';
  rpeLabel.textContent = 'RPE';
  rpeContainer.appendChild(rpeLabel);

  const rpeStepper = document.createElement('div');
  rpeStepper.className = 'rpe-stepper';
  [6, 7, 8, 9].forEach(val => {
    const btn = document.createElement('button');
    btn.className = `rpe-btn${setData.rpe === val ? ' active' : ''}`;
    btn.textContent = val;
    btn.setAttribute('aria-label', `RPE ${val}`);
    btn.addEventListener('click', () => {
      updateSetData(pattern, setIndex, 'rpe', val);
      currentSession = getSession();
      rpeStepper.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    rpeStepper.appendChild(btn);
  });
  rpeContainer.appendChild(rpeStepper);
  row.appendChild(rpeContainer);

  return row;
}

// --- Set Toggle Handler ---
function handleSetToggle(pattern, setIndex, exerciseData) {
  const setKey = `${pattern}-${setIndex}`;
  const setData = currentSession.sets[setKey];

  if (setData.checked) {
    // Uncheck
    currentSession = uncheckSet(pattern, setIndex);
    const row = document.getElementById(`set-${setKey}`);
    if (row) {
      row.classList.remove('checked');
      row.querySelector('.set-checkbox').classList.remove('checked');
    }
    // Uncollapse card
    const card = document.getElementById(`card-${pattern}`);
    if (card) card.classList.remove('collapsed');
  } else {
    // Check
    currentSession = checkSet(pattern, setIndex);
    playSetComplete();

    if (!sessionStarted) {
      sessionStarted = true;
      requestWakeLock();
    }

    const row = document.getElementById(`set-${setKey}`);
    if (row) {
      row.classList.add('checked');
      const cb = row.querySelector('.set-checkbox');
      cb.classList.add('checked', 'animate');
      setTimeout(() => cb.classList.remove('animate'), 300);
    }

    // Start rest timer
    const nextSet = getNextSetInfo(pattern, setIndex);
    showRestTimer(exerciseData.rest, nextSet);

    // Record rest timer as pending
    recordRestTimerResult(false);

    // Check if pattern is complete — collapse card
    let patternComplete = true;
    for (let i = 0; i < exerciseData.sets; i++) {
      if (!currentSession.sets[`${pattern}-${i}`]?.checked) {
        patternComplete = false;
        break;
      }
    }
    if (patternComplete) {
      setTimeout(() => {
        const card = document.getElementById(`card-${pattern}`);
        if (card && !card.classList.contains('collapsed')) {
          card.classList.add('collapsed');
          // Hide card body
          const body = card.querySelector('.card-body');
          if (body) body.style.display = 'none';
          // Add collapsed summary if not present
          if (!card.querySelector('.collapsed-summary')) {
            const collapsed = document.createElement('div');
            collapsed.className = 'collapsed-summary';
            collapsed.innerHTML = `<span class="collapsed-checkmark">✓</span><span class="text-muted">${exerciseData.sets} sets completed</span>`;
            collapsed.style.cursor = 'pointer';
            collapsed.addEventListener('click', () => {
              card.classList.remove('collapsed');
              collapsed.remove();
              if (body) body.style.display = '';
            });
            card.appendChild(collapsed);
          }
        }
      }, 500);
    }

    // Check if entire session is complete
    setTimeout(() => {
      if (isSessionComplete(currentLevels) && !currentSession.summaryShown) {
        releaseWakeLock();
        showSummary('strength', () => {
          renderCurrentDay();
        });
      }
    }, 800);
  }

  updateProgress();
}

function getNextSetInfo(pattern, setIndex) {
  const exerciseData = PROGRESSION_TABLE[pattern][currentLevels[pattern] || 0];

  // Next set in same exercise
  if (setIndex + 1 < exerciseData.sets) {
    return `Next: ${exerciseData.exercise} — Set ${setIndex + 2}`;
  }

  // Next pattern
  const patternIndex = MOVEMENT_PATTERNS.indexOf(pattern);
  if (patternIndex < MOVEMENT_PATTERNS.length - 1) {
    const nextPattern = MOVEMENT_PATTERNS[patternIndex + 1];
    const nextData = PROGRESSION_TABLE[nextPattern][currentLevels[nextPattern] || 0];
    return `Next: ${nextData.exercise} — Set 1`;
  }

  return 'Last set of the session!';
}

// --- Level Selector ---
function createLevelSelector(pattern, currentLevel) {
  const container = document.createElement('div');
  container.className = 'level-selector';

  LEVEL_NAMES.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = `level-option${i === currentLevel ? ' active' : ''}`;
    btn.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    btn.addEventListener('click', () => {
      if (i === currentLevel) return;
      currentLevels = setLevel(pattern, i);
      btn.classList.add('animate');
      setTimeout(() => btn.classList.remove('animate'), 250);

      // Re-render the card
      const oldCard = document.getElementById(`card-${pattern}`);
      if (oldCard) {
        const newCard = createExerciseCard(pattern);
        oldCard.replaceWith(newCard);
      }
      updateProgress();
    });
    container.appendChild(btn);
  });

  return container;
}

// --- Rest Timer UI ---
function showRestTimer(durationSeconds, nextSetLabel) {
  if (!restTimerOverlay) return;

  restTimerOverlay.querySelector('.rest-timer-label').textContent = 'Rest';
  restTimerOverlay.querySelector('.rest-timer-next').textContent = nextSetLabel || '';
  restTimerOverlay.querySelector('.rest-timer-time').textContent = formatTime(durationSeconds);
  restTimerOverlay.classList.add('visible');

  startRestTimer(durationSeconds,
    (remaining) => {
      // onTick
      restTimerOverlay.querySelector('.rest-timer-time').textContent = formatTime(remaining);
    },
    () => {
      // onComplete
      restTimerOverlay.classList.add('flash');
      // Update the stat: was NOT skipped → undo the skipped, record completed
      const sess = getSession();
      if (sess.restTimerStats.skipped > 0) {
        sess.restTimerStats.skipped--;
        sess.restTimerStats.completed++;
        saveSession(sess);
      }
      setTimeout(() => {
        restTimerOverlay.classList.remove('visible', 'flash');
      }, 2000);
    }
  );
}

function handleSkipRest() {
  skipRest();
  restTimerOverlay.classList.remove('visible', 'flash');
  // skipped stat is already recorded when set was checked
}

function handleAddRestTime(seconds) {
  addRestTime(seconds);
}

// --- HIIT Session ---
function renderHIITSession() {
  const session = getSession();

  const container = document.createElement('div');
  container.className = 'hiit-container';
  container.id = 'hiit-view';

  if (session.hiit.completed) {
    container.innerHTML = `
      <div style="padding: var(--spacing-xl) 0;">
        <div style="font-size: 64px; margin-bottom: var(--spacing-md);">🎉</div>
        <h2>HIIT Complete!</h2>
        <p class="text-muted mt-sm">${session.hiit.roundsCompleted} rounds completed</p>
        <button class="btn btn-primary mt-md" id="hiit-summary-btn">View Summary</button>
      </div>
    `;
    app.appendChild(container);
    document.getElementById('hiit-summary-btn')?.addEventListener('click', () => {
      showSummary('hiit', () => renderCurrentDay());
    });
    return;
  }

  const hiitState = getHIITState();
  const isRunning = hiitState.phase === 'work' || hiitState.phase === 'rest';

  container.innerHTML = `
    <div class="hiit-phase ${isRunning ? hiitState.phase : 'work'}" id="hiit-phase-badge">
      ${isRunning ? hiitState.phase.toUpperCase() : 'READY'}
    </div>
    <div class="hiit-exercise-name" id="hiit-exercise-name">
      ${HIIT_EXERCISES[0].name}
    </div>
    <div class="hiit-exercise-cue" id="hiit-exercise-cue">
      ${HIIT_EXERCISES[0].cue}
    </div>
    <div id="hiit-video-link-container" style="margin-bottom: var(--spacing-md);">
      <a id="hiit-video-link" href="${HIIT_EXERCISES[0].videoUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; font-size: var(--font-size-sm); color: var(--in-progress); text-decoration: none; font-weight: 600;">📺 Watch Demo</a>
    </div>
    <div class="hiit-timer" id="hiit-timer-display">
      ${formatTime(HIIT_CONFIG.workSeconds)}
    </div>
    <div class="hiit-rounds mt-md" id="hiit-rounds">
      Round 1 / ${HIIT_CONFIG.rounds}
    </div>
    <div class="hiit-controls">
      <button class="btn btn-primary" id="hiit-start-btn">${isRunning ? 'Pause' : 'Start'}</button>
      <button class="btn btn-secondary" id="hiit-reset-btn">Reset</button>
    </div>
  `;

  app.appendChild(container);

  const startBtn = document.getElementById('hiit-start-btn');
  const resetBtn = document.getElementById('hiit-reset-btn');

  startBtn.addEventListener('click', () => {
    const state = getHIITState();
    if (state.phase === 'idle' || state.phase === 'complete') {
      requestWakeLock();
      startHIIT(HIIT_CONFIG, HIIT_EXERCISES, onHIITTick, onHIITPhaseChange, onHIITComplete);
      startBtn.textContent = 'Pause';
    } else if (state.phase === 'work' || state.phase === 'rest') {
      stopHIIT();
      startBtn.textContent = 'Resume';
    }
  });

  resetBtn.addEventListener('click', () => {
    resetHIIT();
    releaseWakeLock();
    renderCurrentDay();
  });
}

function onHIITTick(remaining, phase, round, exerciseIndex) {
  const display = document.getElementById('hiit-timer-display');
  const rounds = document.getElementById('hiit-rounds');
  if (display) display.textContent = formatTime(remaining);
  if (rounds) rounds.textContent = `Round ${round} / ${HIIT_CONFIG.rounds}`;

  updateHIITProgress(round, false);
}

function onHIITPhaseChange(phase, round, exerciseIndex) {
  const badge = document.getElementById('hiit-phase-badge');
  const name = document.getElementById('hiit-exercise-name');
  const cue = document.getElementById('hiit-exercise-cue');

  if (badge) {
    badge.textContent = phase.toUpperCase();
    badge.className = `hiit-phase ${phase}`;
  }

  if (phase === 'work' && HIIT_EXERCISES[exerciseIndex]) {
    if (name) name.textContent = HIIT_EXERCISES[exerciseIndex].name;
    if (cue) cue.textContent = HIIT_EXERCISES[exerciseIndex].cue;
    const videoLink = document.getElementById('hiit-video-link');
    if (videoLink) videoLink.href = HIIT_EXERCISES[exerciseIndex].videoUrl;
  }
}

function onHIITComplete() {
  updateHIITProgress(HIIT_CONFIG.rounds, true);
  releaseWakeLock();
  setTimeout(() => {
    showSummary('hiit', () => renderCurrentDay());
  }, 500);
}

// --- Cardio Session ---
function renderCardioSession() {
  const session = getSession();

  const container = document.createElement('div');
  container.className = 'cardio-container';
  container.id = 'cardio-view';

  if (session.cardio.completed) {
    container.innerHTML = `
      <div style="font-size: 64px; margin-bottom: var(--spacing-md);">🎉</div>
      <h2>Cardio Complete!</h2>
      <p class="text-muted mt-sm">${formatTime(session.cardio.elapsedSeconds)} elapsed</p>
      <button class="btn btn-primary mt-md" id="cardio-summary-btn">View Summary</button>
    `;
    app.appendChild(container);
    document.getElementById('cardio-summary-btn')?.addEventListener('click', () => {
      showSummary('cardio', () => renderCurrentDay());
    });
    return;
  }

  container.innerHTML = `
    <h2 class="mb-md">Steady-State Cardio</h2>
    <p class="text-muted mb-md">30–40 min brisk walk, jog, or bike</p>
    <div class="cardio-timer" id="cardio-timer">${formatTime(session.cardio.elapsedSeconds || 0)}</div>
    <div class="hiit-controls mt-md">
      <button class="btn btn-primary" id="cardio-toggle-btn">${isStopwatchRunning() ? 'Pause' : 'Start'}</button>
      <button class="btn btn-secondary" id="cardio-reset-btn">Reset</button>
    </div>
    <div class="mt-md">
      <button class="btn btn-primary" id="cardio-complete-btn">✓ Mark Complete</button>
    </div>
  `;

  app.appendChild(container);

  const toggleBtn = document.getElementById('cardio-toggle-btn');
  const resetBtn = document.getElementById('cardio-reset-btn');
  const completeBtn = document.getElementById('cardio-complete-btn');
  const timerDisplay = document.getElementById('cardio-timer');

  toggleBtn.addEventListener('click', () => {
    if (isStopwatchRunning()) {
      const elapsed = stopStopwatch();
      updateCardioProgress(elapsed, false);
      toggleBtn.textContent = 'Start';
    } else {
      requestWakeLock();
      startStopwatch((elapsed) => {
        timerDisplay.textContent = formatTime(elapsed);
        if (elapsed % 30 === 0) {
          updateCardioProgress(elapsed, false);
        }
      });
      toggleBtn.textContent = 'Pause';
    }
  });

  resetBtn.addEventListener('click', () => {
    stopStopwatch();
    resetStopwatch();
    updateCardioProgress(0, false);
    timerDisplay.textContent = formatTime(0);
    toggleBtn.textContent = 'Start';
    releaseWakeLock();
  });

  completeBtn.addEventListener('click', () => {
    const elapsed = stopStopwatch();
    updateCardioProgress(elapsed || getSession().cardio.elapsedSeconds, true);
    releaseWakeLock();
    showSummary('cardio', () => renderCurrentDay());
  });
}

// --- Rest Day ---
function renderRestDay() {
  const session = getSession();
  const tip = NEAT_TIPS[new Date().getDay() % NEAT_TIPS.length];

  const container = document.createElement('div');
  container.className = 'rest-day-container';
  container.innerHTML = `
    <div class="rest-day-icon">🌿</div>
    <h2 class="rest-day-title">Rest & Recovery</h2>
    <p class="rest-day-tip mt-md">${tip}</p>
    <div class="mt-md" style="border-top: 1px solid var(--border); padding-top: var(--spacing-lg);">
      <h3 style="margin-bottom: var(--spacing-md);">Log a Light Walk</h3>
      <div class="cardio-timer" id="walk-timer">${formatTime(0)}</div>
      <div class="hiit-controls mt-md">
        <button class="btn btn-outline" id="walk-toggle-btn">Start</button>
        <button class="btn btn-secondary btn-sm" id="walk-reset-btn">Reset</button>
      </div>
    </div>
  `;

  app.appendChild(container);

  const toggleBtn = document.getElementById('walk-toggle-btn');
  const resetBtn = document.getElementById('walk-reset-btn');
  const timerDisplay = document.getElementById('walk-timer');

  toggleBtn.addEventListener('click', () => {
    if (isStopwatchRunning()) {
      stopStopwatch();
      toggleBtn.textContent = 'Start';
    } else {
      startStopwatch((elapsed) => {
        timerDisplay.textContent = formatTime(elapsed);
      });
      toggleBtn.textContent = 'Pause';
    }
  });

  resetBtn.addEventListener('click', () => {
    stopStopwatch();
    resetStopwatch();
    timerDisplay.textContent = formatTime(0);
    toggleBtn.textContent = 'Start';
  });
}

// --- Rest Timer Controls (bound in index.html) ---
export function setupRestTimerControls() {
  document.getElementById('rest-skip-btn')?.addEventListener('click', handleSkipRest);
  document.getElementById('rest-add-15-btn')?.addEventListener('click', () => handleAddRestTime(15));
  document.getElementById('rest-add-30-btn')?.addEventListener('click', () => handleAddRestTime(30));
}

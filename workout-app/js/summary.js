import { PROGRESSION_TABLE, MOVEMENT_PATTERNS, LEVEL_NAMES, RPE_LABELS, NEAT_TIPS, WEEKLY_SCHEDULE } from './data.js';
import { getSession, getLevels, getSessionDuration, getTodaySchedule, markSummaryShown, getDayOfWeek } from './session.js';
import { formatTime } from './timer.js';

// --- Helpers ---

function formatDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDurationMinutes(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

function parseMaxReps(repString) {
  if (!repString) return Infinity;
  const nums = repString.match(/\d+/g);
  if (!nums || nums.length === 0) return Infinity;
  return Math.max(...nums.map(n => parseInt(n, 10)));
}

function parseMaxHoldSeconds(repString) {
  if (!repString) return Infinity;
  const match = repString.match(/(\d+)s/);
  if (match) return parseInt(match[1], 10);
  const nums = repString.match(/\d+/g);
  if (!nums) return Infinity;
  return Math.max(...nums.map(n => parseInt(n, 10)));
}

function getNeatTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return NEAT_TIPS[dayOfYear % NEAT_TIPS.length];
}

// --- Summary Generators ---

export function generateStrengthSummary() {
  const session = getSession();
  const levels = getLevels();
  const schedule = getTodaySchedule();
  const duration = getSessionDuration();

  const header = {
    dayLabel: `${schedule.day} — ${schedule.label}`,
    date: formatDate(),
    duration: formatDurationMinutes(duration)
  };

  const volumeTable = [];
  const progressiveOverloadPrompts = [];
  let totalRpe = 0;
  let rpeCount = 0;

  for (const pattern of MOVEMENT_PATTERNS) {
    const levelIndex = levels[pattern] || 0;
    const exerciseData = PROGRESSION_TABLE[pattern][levelIndex];
    const patternLabel = pattern.charAt(0).toUpperCase() + pattern.slice(1);

    let setsCompleted = 0;
    let totalValue = 0;
    let patternRpeSum = 0;
    let patternRpeCount = 0;
    let allHitTopRange = true;
    const maxTarget = exerciseData.isTimedHold
      ? parseMaxHoldSeconds(exerciseData.reps)
      : parseMaxReps(exerciseData.reps);

    for (let i = 0; i < exerciseData.sets; i++) {
      const setData = session.sets[`${pattern}-${i}`];
      if (setData?.checked) {
        setsCompleted++;
        const value = exerciseData.isTimedHold ? (setData.secs || 0) : (setData.reps || 0);
        totalValue += value;

        if (value < maxTarget) {
          allHitTopRange = false;
        }

        if (setData.rpe !== null && setData.rpe !== undefined) {
          patternRpeSum += setData.rpe;
          patternRpeCount++;
          totalRpe += setData.rpe;
          rpeCount++;
        }
      } else {
        allHitTopRange = false;
      }
    }

    const avgRpe = patternRpeCount > 0 ? patternRpeSum / patternRpeCount : null;

    volumeTable.push({
      pattern: patternLabel,
      exercise: exerciseData.exercise,
      level: LEVEL_NAMES[levelIndex].charAt(0).toUpperCase() + LEVEL_NAMES[levelIndex].slice(1),
      setsCompleted,
      totalSets: exerciseData.sets,
      totalValue,
      avgRpe: avgRpe !== null ? avgRpe.toFixed(1) : '—',
      isTimedHold: exerciseData.isTimedHold
    });

    if (allHitTopRange && setsCompleted === exerciseData.sets && exerciseData.next) {
      progressiveOverloadPrompts.push({
        pattern: patternLabel,
        exercise: exerciseData.exercise,
        nextExercise: exerciseData.next,
        message: `You hit the top of the rep range on ${patternLabel} — ${exerciseData.exercise}. Ready to level up? Tap the level selector next session to advance to: ${exerciseData.next}.`
      });
    }
  }

  const avgSessionRpe = rpeCount > 0 ? totalRpe / rpeCount : 0;
  const roundedRpe = Math.round(avgSessionRpe);
  let interpretation;
  if (avgSessionRpe === 0) {
    interpretation = 'No RPE data recorded';
  } else if (roundedRpe < 6) {
    interpretation = 'Very light — you may not be challenging yourself enough';
  } else if (roundedRpe > 9) {
    interpretation = 'Extremely hard — scale back to avoid overtraining';
  } else {
    interpretation = RPE_LABELS[roundedRpe] || 'Moderate effort';
  }

  const { completed: restCompleted, skipped: restSkipped } = session.restTimerStats;
  const totalRest = restCompleted + restSkipped;
  const restPercentage = totalRest > 0 ? Math.round((restCompleted / totalRest) * 100) : 100;
  const restWarning = totalRest > 0 && restPercentage < 70
    ? 'You cut most rests short — either extend your rest target or push yourself to complete it before reducing it'
    : null;

  return {
    header,
    volumeTable,
    effortSnapshot: {
      avgRpe: avgSessionRpe > 0 ? avgSessionRpe.toFixed(1) : '—',
      interpretation
    },
    progressiveOverloadPrompts,
    restCompliance: { completed: restCompleted, skipped: restSkipped, percentage: restPercentage, warning: restWarning },
    neatTip: getNeatTip()
  };
}

export function generateHIITSummary() {
  const session = getSession();
  const schedule = getTodaySchedule();
  const duration = getSessionDuration();

  return {
    header: {
      dayLabel: `${schedule.day} — ${schedule.label}`,
      date: formatDate(),
      duration: formatDurationMinutes(duration)
    },
    roundsCompleted: session.hiit.roundsCompleted,
    totalRounds: 10,
    neatTip: getNeatTip()
  };
}

export function generateCardioSummary() {
  const session = getSession();
  const schedule = getTodaySchedule();
  const elapsed = session.cardio.elapsedSeconds || 0;

  return {
    header: {
      dayLabel: `${schedule.day} — ${schedule.label}`,
      date: formatDate(),
      duration: formatTime(elapsed)
    },
    elapsedTime: formatTime(elapsed),
    neatTip: getNeatTip()
  };
}

// --- DOM Rendering ---

export function renderSummary(summaryData, sessionType) {
  const overlay = document.createElement('div');
  overlay.className = 'summary-overlay';
  overlay.id = 'session-summary-overlay';

  const container = document.createElement('div');
  container.className = 'summary-container';

  // Header
  container.innerHTML = `
    <div class="summary-header">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <h1 class="summary-title">Workout Complete</h1>
      <p class="summary-subtitle">${summaryData.header.dayLabel}</p>
      <p class="summary-subtitle">${summaryData.header.date} · ${summaryData.header.duration}</p>
    </div>
  `;

  if (sessionType === 'strength') {
    // Volume Table
    const volumeSection = document.createElement('div');
    volumeSection.className = 'summary-section';
    let volumeHtml = `<h2 class="summary-section-title">Volume</h2>
      <table class="volume-table">
        <thead><tr>
          <th>Pattern</th><th>Exercise</th><th>Sets</th><th>Total</th><th>RPE</th>
        </tr></thead><tbody>`;
    for (const row of summaryData.volumeTable) {
      const totalLabel = row.isTimedHold ? `${row.totalValue}s` : `${row.totalValue} reps`;
      volumeHtml += `<tr>
        <td><strong>${row.pattern}</strong></td>
        <td>${row.exercise}<br><span class="text-muted" style="font-size:var(--font-size-xs)">${row.level}</span></td>
        <td>${row.setsCompleted}/${row.totalSets}</td>
        <td>${totalLabel}</td>
        <td>${row.avgRpe}</td>
      </tr>`;
    }
    volumeHtml += '</tbody></table>';
    volumeSection.innerHTML = volumeHtml;
    container.appendChild(volumeSection);

    // Effort Snapshot
    const effortSection = document.createElement('div');
    effortSection.className = 'summary-section';
    effortSection.innerHTML = `
      <h2 class="summary-section-title">Effort Snapshot</h2>
      <div class="rpe-summary">
        <div class="rpe-score">${summaryData.effortSnapshot.avgRpe}</div>
        <div style="font-size: var(--font-size-xs); color: var(--fg-muted);">Average RPE</div>
        <p class="rpe-interpretation">${summaryData.effortSnapshot.interpretation}</p>
      </div>
    `;
    container.appendChild(effortSection);

    // Progressive Overload Prompts
    if (summaryData.progressiveOverloadPrompts.length > 0) {
      const overloadSection = document.createElement('div');
      overloadSection.className = 'summary-section';
      let promptsHtml = '<h2 class="summary-section-title">Progressive Overload</h2>';
      for (const prompt of summaryData.progressiveOverloadPrompts) {
        promptsHtml += `
          <div class="callout">
            <div class="callout-title">▲ ${prompt.pattern} — Ready to Level Up</div>
            <p>${prompt.message}</p>
          </div>
        `;
      }
      overloadSection.innerHTML = promptsHtml;
      container.appendChild(overloadSection);
    }

    // Rest Compliance
    const restSection = document.createElement('div');
    restSection.className = 'summary-section';
    const total = summaryData.restCompliance.completed + summaryData.restCompliance.skipped;
    let restHtml = `
      <h2 class="summary-section-title">Rest Compliance</h2>
      <p>${summaryData.restCompliance.percentage}% of rest timers completed (${summaryData.restCompliance.completed}/${total})</p>
    `;
    if (summaryData.restCompliance.warning) {
      restHtml += `<div class="callout callout-warning"><p>${summaryData.restCompliance.warning}</p></div>`;
    }
    restSection.innerHTML = restHtml;
    container.appendChild(restSection);

  } else if (sessionType === 'hiit') {
    const section = document.createElement('div');
    section.className = 'summary-section text-center';
    section.innerHTML = `
      <h2 class="summary-section-title">Rounds Completed</h2>
      <div class="rpe-summary">
        <div class="rpe-score">${summaryData.roundsCompleted} / ${summaryData.totalRounds}</div>
      </div>
    `;
    container.appendChild(section);

  } else if (sessionType === 'cardio') {
    const section = document.createElement('div');
    section.className = 'summary-section text-center';
    section.innerHTML = `
      <h2 class="summary-section-title">Session Time</h2>
      <div class="rpe-summary">
        <div class="rpe-score">${summaryData.elapsedTime}</div>
      </div>
    `;
    container.appendChild(section);
  }

  // NEAT Tip
  const neatSection = document.createElement('div');
  neatSection.className = 'summary-section';
  neatSection.innerHTML = `
    <div class="neat-tip">
      <div class="neat-tip-icon">🚶</div>
      <p class="neat-tip-text">${summaryData.neatTip}</p>
    </div>
  `;
  container.appendChild(neatSection);

  // Buttons
  const btnSection = document.createElement('div');
  btnSection.className = 'summary-section text-center';
  btnSection.innerHTML = `
    <button id="summary-copy-btn" class="btn btn-primary" style="width: 100%; margin-bottom: var(--spacing-sm);">📋 Copy Summary</button>
    <button id="summary-close-btn" class="btn btn-secondary" style="width: 100%;">Back to Session</button>
  `;
  container.appendChild(btnSection);

  overlay.appendChild(container);
  return overlay;
}

// --- Text Format for Clipboard ---

export function formatSummaryAsText(summaryData, sessionType) {
  let text = `═══ WORKOUT COMPLETE ═══\n`;
  text += `${summaryData.header.dayLabel}\n`;
  text += `${summaryData.header.date} | Duration: ${summaryData.header.duration}\n\n`;

  if (sessionType === 'strength') {
    text += `─── VOLUME ───\n`;
    for (const row of summaryData.volumeTable) {
      const total = row.isTimedHold ? `${row.totalValue}s` : `${row.totalValue} reps`;
      text += `${row.pattern} | ${row.exercise} (${row.level}) | ${row.setsCompleted} sets | ${total} | RPE ${row.avgRpe}\n`;
    }
    text += `\n─── EFFORT ───\n`;
    text += `Average RPE: ${summaryData.effortSnapshot.avgRpe}\n`;
    text += `${summaryData.effortSnapshot.interpretation}\n\n`;

    if (summaryData.progressiveOverloadPrompts.length > 0) {
      text += `─── PROGRESSIVE OVERLOAD ───\n`;
      for (const prompt of summaryData.progressiveOverloadPrompts) {
        text += `▲ ${prompt.pattern}: Ready to advance to ${prompt.nextExercise}\n`;
      }
      text += '\n';
    }

    const total = summaryData.restCompliance.completed + summaryData.restCompliance.skipped;
    text += `─── REST COMPLIANCE ───\n`;
    text += `${summaryData.restCompliance.percentage}% of rest timers completed (${summaryData.restCompliance.completed}/${total})\n`;
    if (summaryData.restCompliance.warning) {
      text += `⚠ ${summaryData.restCompliance.warning}\n`;
    }
    text += '\n';

  } else if (sessionType === 'hiit') {
    text += `─── COMPLETION ───\n`;
    text += `${summaryData.roundsCompleted} / ${summaryData.totalRounds} Rounds Completed\n\n`;

  } else if (sessionType === 'cardio') {
    text += `─── COMPLETION ───\n`;
    text += `Elapsed Time: ${summaryData.elapsedTime}\n\n`;
  }

  text += `─── NEAT TIP ───\n`;
  text += `${summaryData.neatTip}\n`;

  return text;
}

// --- Clipboard ---

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) { /* fall through */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (err) {
    return false;
  }
}

// --- Show / Hide ---

export function showSummary(sessionType, onClose) {
  let summaryData;
  if (sessionType === 'strength') {
    summaryData = generateStrengthSummary();
  } else if (sessionType === 'hiit') {
    summaryData = generateHIITSummary();
  } else if (sessionType === 'cardio') {
    summaryData = generateCardioSummary();
  } else {
    return;
  }

  markSummaryShown();

  const overlay = renderSummary(summaryData, sessionType);
  document.body.appendChild(overlay);

  // Copy button
  const copyBtn = overlay.querySelector('#summary-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = formatSummaryAsText(summaryData, sessionType);
      const success = await copyToClipboard(text);
      if (success) {
        const orig = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = orig; }, 2000);
      }
    });
  }

  // Close button
  const closeBtn = overlay.querySelector('#summary-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideSummary();
      if (onClose) onClose();
    });
  }
}

export function hideSummary() {
  const overlay = document.getElementById('session-summary-overlay');
  if (overlay) overlay.remove();
}

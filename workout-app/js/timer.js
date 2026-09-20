// 1. Audio Functions (Web Audio API)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playBeep(frequency = 880, duration = 0.15, type = 'sine') {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export function playSetComplete() {
  playBeep(440, 0.12, 'sine');
}

export function playRestEnd() {
  playBeep(880, 0.15, 'sine');
  setTimeout(() => {
    playBeep(880, 0.15, 'sine');
  }, 200);
}


// 2. Rest Timer
let restTimerInterval = null;
let restTimeRemaining = 0;
let restTimerCallback = null;
let restTimerTickCallback = null;
let isRestTimerRunning = false;

export function startRestTimer(durationSeconds, onTick, onComplete) {
  stopRestTimer();
  restTimerCallback = onComplete;
  restTimerTickCallback = onTick;
  restTimeRemaining = durationSeconds;
  isRestTimerRunning = true;

  // Initial tick
  if (restTimerTickCallback) {
    restTimerTickCallback(restTimeRemaining);
  }

  restTimerInterval = setInterval(() => {
    restTimeRemaining--;
    if (restTimerTickCallback) {
      restTimerTickCallback(restTimeRemaining);
    }

    if (restTimeRemaining <= 0) {
      stopRestTimer();
      playRestEnd();
      if (restTimerCallback) {
        restTimerCallback();
      }
    }
  }, 1000);
}

export function stopRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  isRestTimerRunning = false;
  return restTimeRemaining;
}

export function skipRest() {
  stopRestTimer();
  restTimeRemaining = 0;
  if (restTimerCallback) {
    restTimerCallback();
  }
}

export function addRestTime(seconds) {
  restTimeRemaining += seconds;
  if (restTimerTickCallback && isRestTimerRunning) {
    restTimerTickCallback(restTimeRemaining);
  }
}

export function getRestTimeRemaining() {
  return restTimeRemaining;
}

export function isRestActive() {
  return isRestTimerRunning;
}


// 3. Stopwatch
let stopwatchInterval = null;
let stopwatchElapsed = 0;
let stopwatchRunning = false;
let stopwatchTickCallback = null;

export function startStopwatch(onTick) {
  if (stopwatchRunning) return;
  stopwatchTickCallback = onTick;
  stopwatchRunning = true;

  stopwatchInterval = setInterval(() => {
    stopwatchElapsed++;
    if (stopwatchTickCallback) {
      stopwatchTickCallback(stopwatchElapsed);
    }
  }, 1000);
}

export function stopStopwatch() {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }
  stopwatchRunning = false;
  return stopwatchElapsed;
}

export function resetStopwatch() {
  stopStopwatch();
  stopwatchElapsed = 0;
}

export function getStopwatchElapsed() {
  return stopwatchElapsed;
}

export function isStopwatchRunning() {
  return stopwatchRunning;
}


// 4. HIIT Timer
let hiitInterval = null;
let hiitPhase = 'idle'; // 'work' | 'rest' | 'idle' | 'complete'
let hiitTimeRemaining = 0;
let hiitCurrentRound = 1;
let hiitCurrentExerciseIndex = 0;
let hiitConfig = { rounds: 0, workSeconds: 0, restSeconds: 0 };
let hiitExercises = [];
let hiitTickCb = null;
let hiitPhaseChangeCb = null;
let hiitCompleteCb = null;

export function startHIIT(config, exercises, onTick, onPhaseChange, onComplete) {
  resetHIIT();
  hiitConfig = config;
  hiitExercises = exercises || [];
  hiitTickCb = onTick;
  hiitPhaseChangeCb = onPhaseChange;
  hiitCompleteCb = onComplete;

  hiitCurrentRound = 1;
  hiitCurrentExerciseIndex = 0;
  hiitPhase = 'work';
  hiitTimeRemaining = hiitConfig.workSeconds;

  resumeHIIT();
}

export function stopHIIT() {
  if (hiitInterval) {
    clearInterval(hiitInterval);
    hiitInterval = null;
  }
}

export function resumeHIIT() {
  if (hiitInterval) return;
  if (hiitPhase === 'idle' || hiitPhase === 'complete') return;

  // Initial tick
  if (hiitTickCb) {
    hiitTickCb(hiitTimeRemaining, hiitPhase, hiitCurrentRound, hiitCurrentExerciseIndex);
  }

  hiitInterval = setInterval(() => {
    hiitTimeRemaining--;

    // Countdown warnings
    if (hiitTimeRemaining > 0 && hiitTimeRemaining <= 3) {
      playBeep(660, 0.1, 'sine');
    }

    if (hiitTickCb) {
      hiitTickCb(hiitTimeRemaining, hiitPhase, hiitCurrentRound, hiitCurrentExerciseIndex);
    }

    if (hiitTimeRemaining <= 0) {
      if (hiitPhase === 'work') {
        playRestEnd();
        
        hiitPhase = 'rest';
        hiitTimeRemaining = hiitConfig.restSeconds;
        
        if (hiitPhaseChangeCb) {
          hiitPhaseChangeCb(hiitPhase, hiitCurrentRound, hiitCurrentExerciseIndex);
        }
        
        // If there's no rest time, transition immediately
        if (hiitTimeRemaining <= 0) {
           _handleHIITRestEnd();
        }
      } else if (hiitPhase === 'rest') {
        _handleHIITRestEnd();
      }
    }
  }, 1000);
}

function _handleHIITRestEnd() {
  hiitCurrentRound++;
  
  if (hiitExercises.length > 0) {
    hiitCurrentExerciseIndex = (hiitCurrentExerciseIndex + 1) % hiitExercises.length;
  }
  
  if (hiitCurrentRound > hiitConfig.rounds) {
    hiitPhase = 'complete';
    stopHIIT();
    if (hiitCompleteCb) {
      hiitCompleteCb();
    }
  } else {
    hiitPhase = 'work';
    hiitTimeRemaining = hiitConfig.workSeconds;
    if (hiitPhaseChangeCb) {
      hiitPhaseChangeCb(hiitPhase, hiitCurrentRound, hiitCurrentExerciseIndex);
    }
  }
}

export function resetHIIT() {
  stopHIIT();
  hiitPhase = 'idle';
  hiitTimeRemaining = 0;
  hiitCurrentRound = 1;
  hiitCurrentExerciseIndex = 0;
  hiitConfig = { rounds: 0, workSeconds: 0, restSeconds: 0 };
  hiitExercises = [];
}

export function getHIITState() {
  return {
    phase: hiitPhase,
    timeRemaining: hiitTimeRemaining,
    currentRound: hiitCurrentRound,
    currentExerciseIndex: hiitCurrentExerciseIndex,
    totalRounds: hiitConfig.rounds
  };
}


// 5. Utility
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

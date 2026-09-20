import { WEEKLY_SCHEDULE, MOVEMENT_PATTERNS } from './data.js';

// --- 1. Date Helpers ---

export function getTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getDayOfWeek() {
    const jsDay = new Date().getDay(); // 0 is Sunday
    return (jsDay + 6) % 7; // Monday=0, Sunday=6
}

export function getTodaySchedule() {
    return WEEKLY_SCHEDULE[getDayOfWeek()];
}

// --- 2. Level Management ---

const LEVELS_KEY = 'workout-levels';

export function getLevels() {
    const stored = localStorage.getItem(LEVELS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing levels', e);
        }
    }
    return { squat: 0, push: 0, pull: 0, hinge: 0, core: 0 };
}

export function setLevel(pattern, levelIndex) {
    const levels = getLevels();
    levels[pattern] = levelIndex;
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
    return levels;
}

export function getLevelForPattern(pattern) {
    return getLevels()[pattern];
}

// --- 3. Session State ---

function createEmptySets() {
    const sets = {};
    const patterns = ['squat', 'push', 'pull', 'hinge', 'core'];
    
    for (const p of patterns) {
        for (let i = 0; i < 3; i++) {
            sets[`${p}-${i}`] = { checked: false, reps: null, secs: null, rpe: null };
        }
    }
    return sets;
}

function createFreshSession(date) {
    return {
        date: date,
        startTime: null,
        sets: createEmptySets(),
        hiit: { completed: false, roundsCompleted: 0 },
        cardio: { completed: false, elapsedSeconds: 0 },
        restTimerStats: { completed: 0, skipped: 0 },
        summaryShown: false
    };
}

export function getSession() {
    const today = getTodayKey();
    const sessionKey = `workout-session-${today}`;
    const stored = localStorage.getItem(sessionKey);
    
    if (stored) {
        try {
            const session = JSON.parse(stored);
            if (session.date === today) {
                return session;
            }
        } catch (e) {
            console.error('Error parsing session', e);
        }
    }
    
    // Clear out old sessions
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('workout-session-') && key !== sessionKey) {
            localStorage.removeItem(key);
        }
    }
    
    return createFreshSession(today);
}

export function saveSession(session) {
    const sessionKey = `workout-session-${session.date}`;
    localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function initSession() {
    const session = getSession();
    const levels = getLevels();
    const schedule = getTodaySchedule();
    return { session, levels, schedule };
}

export function checkSet(pattern, setIndex) {
    const session = getSession();
    const key = `${pattern}-${setIndex}`;
    
    if (session.sets[key]) {
        session.sets[key].checked = true;
        
        if (!session.startTime) {
            session.startTime = Date.now();
        }
        
        saveSession(session);
    }
    return session;
}

export function uncheckSet(pattern, setIndex) {
    const session = getSession();
    const key = `${pattern}-${setIndex}`;
    
    if (session.sets[key]) {
        session.sets[key].checked = false;
        saveSession(session);
    }
    return session;
}

export function updateSetData(pattern, setIndex, field, value) {
    const session = getSession();
    const key = `${pattern}-${setIndex}`;
    
    if (session.sets[key] && ['reps', 'secs', 'rpe'].includes(field)) {
        session.sets[key][field] = value;
        saveSession(session);
    }
    return session;
}

export function recordRestTimerResult(completed) {
    const session = getSession();
    if (completed) {
        session.restTimerStats.completed += 1;
    } else {
        session.restTimerStats.skipped += 1;
    }
    saveSession(session);
}

export function isSessionComplete(levels) {
    const session = getSession();
    const schedule = getTodaySchedule();
    
    if (schedule.type !== 'strength') {
        if (schedule.type === 'hiit') {
            return session.hiit.completed;
        } else if (schedule.type === 'cardio') {
            return session.cardio.completed;
        }
        return false;
    }

    const { total, completed } = getProgress(levels);
    return total > 0 && total === completed;
}

export function getProgress(levels) {
    const session = getSession();
    const schedule = getTodaySchedule();
    let total = 0;
    let completed = 0;
    
    if (schedule.type === 'strength') {
        for (const pattern of MOVEMENT_PATTERNS) {
            const setsCount = 3;
            total += setsCount;
            
            for (let i = 0; i < setsCount; i++) {
                if (session.sets[`${pattern}-${i}`]?.checked) {
                    completed++;
                }
            }
        }
    }
    
    return { completed, total };
}

export function getSessionDuration() {
    const session = getSession();
    if (!session.startTime) return 0;
    return Math.floor((Date.now() - session.startTime) / 1000);
}

export function resetSession() {
    const today = getTodayKey();
    const session = createFreshSession(today);
    saveSession(session);
    return session;
}

export function updateHIITProgress(roundsCompleted, completed) {
    const session = getSession();
    session.hiit.roundsCompleted = roundsCompleted;
    session.hiit.completed = completed;
    if (!session.startTime) {
        session.startTime = Date.now();
    }
    saveSession(session);
    return session;
}

export function updateCardioProgress(elapsedSeconds, completed) {
    const session = getSession();
    session.cardio.elapsedSeconds = elapsedSeconds;
    session.cardio.completed = completed;
    if (!session.startTime) {
        session.startTime = Date.now();
    }
    saveSession(session);
    return session;
}

export function markSummaryShown() {
    const session = getSession();
    session.summaryShown = true;
    saveSession(session);
}

// --- 4. Wake Lock ---

let wakeLock = null;

export async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.error('Wake lock request failed:', err);
        }
    }
}

export async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
        } catch (err) {
            console.error('Wake lock release failed:', err);
        }
    }
}

export function setupWakeLockReacquire() {
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });
}

export const PROGRESSION_TABLE = {
  squat: [
    { level: 'beginner', exercise: 'Bodyweight Squat', cue: 'Feet shoulder-width, chest tall, knees track over toes, full depth', sets: 3, reps: '12–15', rest: 90, next: 'Bulgarian Split Squat', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=bodyweight+squat+form' },
    { level: 'intermediate', exercise: 'Bulgarian Split Squat', cue: 'Rear foot on chair, drop back knee toward floor, front shin vertical', sets: 3, reps: '10 per leg', rest: 90, next: 'Pistol Squat Progressions', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=bulgarian+split+squat+form' },
    { level: 'advanced', exercise: 'Pistol Squat Progressions', cue: 'Use chair or band for balance assist, full single-leg depth, controlled descent', sets: 3, reps: '5–8 per leg', rest: 90, next: null, isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=pistol+squat+progression' }
  ],
  push: [
    { level: 'beginner', exercise: 'Incline / Knee Push-Up', cue: 'Straight line from knees to head, elbows 45° from torso, chest touches surface', sets: 3, reps: '10–15', rest: 90, next: 'Standard Push-Up', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=incline+knee+push+up+form' },
    { level: 'intermediate', exercise: 'Standard Push-Up', cue: 'Full plank, elbows 45°, lower to 2 cm from floor, explode up', sets: 3, reps: '10–15', rest: 90, next: 'Decline / Archer Push-Up', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=standard+push+up+form' },
    { level: 'advanced', exercise: 'Decline / Archer Push-Up', cue: 'Feet elevated on chair or wide-arm archer variation; last set AMRAP', sets: 3, reps: '10–15', rest: 90, next: null, isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=decline+archer+push+up+form' }
  ],
  pull: [
    { level: 'beginner', exercise: 'Table / Inverted Row', cue: 'Body rigid, pull chest to table edge, squeeze shoulder blades at top', sets: 3, reps: '10–12', rest: 90, next: 'Feet-Elevated Inverted Row', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=inverted+table+row+form' },
    { level: 'intermediate', exercise: 'Feet-Elevated Inverted Row', cue: 'Heels on chair, body straight, pull until chest touches table, slow lower (3 sec)', sets: 3, reps: '10–12', rest: 90, next: 'Single-Arm Row Variations', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=feet+elevated+inverted+row' },
    { level: 'advanced', exercise: 'Single-Arm Row Variations', cue: 'Towel around door handle, single arm pulls while body stays rigid', sets: 3, reps: '10–12 per arm', rest: 90, next: null, isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=door+towel+single+arm+row' }
  ],
  hinge: [
    { level: 'beginner', exercise: 'Glute Bridge', cue: 'Shoulders on floor, drive hips up through heels, squeeze glutes at top for 1 sec', sets: 3, reps: '15', rest: 60, next: 'Single-Leg Glute Bridge', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=glute+bridge+form' },
    { level: 'intermediate', exercise: 'Single-Leg Glute Bridge', cue: 'Non-working leg extended, drive through heel, hips level throughout', sets: 3, reps: '12 per leg', rest: 60, next: 'Nordic Curl Progressions', isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=single+leg+glute+bridge' },
    { level: 'advanced', exercise: 'Nordic Curl Progressions', cue: 'Partner or anchor holds ankles, lower torso slowly to floor under control', sets: 3, reps: '3–6', rest: 90, next: null, isTimedHold: false, videoUrl: 'https://www.youtube.com/results?search_query=nordic+curl+progression' }
  ],
  core: [
    { level: 'beginner', exercise: 'Dead Bug / Plank', cue: 'Lower back pressed flat, extend opposite arm & leg slowly, exhale on descent / or standard plank hold', sets: 3, reps: '8 per side or 30s hold', rest: 60, next: 'Side Plank / Plank (60s)', isTimedHold: true, videoUrl: 'https://www.youtube.com/results?search_query=dead+bug+plank+form' },
    { level: 'intermediate', exercise: 'Side Plank / Plank (60s)', cue: 'Hip stacked, body one straight line, don\'t let hip sag', sets: 3, reps: '60s or 30s per side', rest: 45, next: 'Copenhagen Plank / Ab Wheel', isTimedHold: true, videoUrl: 'https://www.youtube.com/results?search_query=side+plank+form' },
    { level: 'advanced', exercise: 'Copenhagen Plank / Ab Wheel', cue: 'Top foot on chair, bottom leg unsupported (Copenhagen) / or full ab wheel rollout from knees', sets: 3, reps: '15–30s or 8–10 reps', rest: 60, next: null, isTimedHold: true, videoUrl: 'https://www.youtube.com/results?search_query=copenhagen+plank+form' }
  ]
};

export const HIIT_EXERCISES = [
  { name: 'Squat Jumps', cue: 'Land soft, full squat depth', videoUrl: 'https://www.youtube.com/results?search_query=squat+jumps+form' },
  { name: 'Mountain Climbers', cue: 'Drive knee to chest fast, hips low', videoUrl: 'https://www.youtube.com/results?search_query=mountain+climbers+form' },
  { name: 'Burpee Step-Out', cue: 'Beginner-friendly: step feet out/in instead of jumping', videoUrl: 'https://www.youtube.com/results?search_query=beginner+burpee+step+out' },
  { name: 'High Knees', cue: 'Drive arms, lift knees to hip height', videoUrl: 'https://www.youtube.com/results?search_query=high+knees+form' }
];

export const HIIT_CONFIG = {
  rounds: 10,
  workSeconds: 30,
  restSeconds: 30
};

export const WEEKLY_SCHEDULE = [
  { day: 'Monday', type: 'strength', label: 'Full-Body Strength', duration: '45–50 min' },
  { day: 'Tuesday', type: 'hiit', label: 'HIIT Circuit', duration: '25–35 min' },
  { day: 'Wednesday', type: 'rest', label: 'Rest / Active Recovery', duration: '—' },
  { day: 'Thursday', type: 'strength', label: 'Full-Body Strength', duration: '45–50 min' },
  { day: 'Friday', type: 'cardio', label: 'Steady-State Cardio', duration: '30–40 min' },
  { day: 'Saturday', type: 'strength', label: 'Full-Body Strength', duration: '45–50 min' },
  { day: 'Sunday', type: 'rest', label: 'Rest / Active Recovery', duration: '—' }
];

export const MOVEMENT_PATTERNS = ['squat', 'push', 'pull', 'hinge', 'core'];

export const LEVEL_NAMES = ['beginner', 'intermediate', 'advanced'];

export const RPE_LABELS = {
  6: 'Comfortable — consider pushing slightly harder next session',
  7: 'Good working effort — you left reps in reserve, which is exactly right',
  8: 'Strong effort — right at the upper edge of the target zone',
  9: 'Very hard — you may be underrecovering or approaching failure too closely'
};

export const NEAT_TIPS = [
  'Aim for 8,000–8,500 steps today. NEAT accounts for up to 15–30% of daily energy expenditure and is your easiest fat-loss lever outside the gym.',
  'Take a 10-minute walk after your largest meal. Post-meal walking improves glucose clearance by up to 30%.',
  'Stand during phone calls. Simply standing vs. sitting burns roughly 0.15 kcal/min more — it adds up over a full workday.',
  'Park farther away or get off one stop early. These micro-decisions compound into hundreds of extra calories per week.',
  'Fidgeting matters: studies show habitual fidgeters burn 350+ kcal/day more than still sitters.',
  'Use a bathroom on a different floor. Small movement snacks throughout the day prevent the metabolic drag of prolonged sitting.',
  'Walk while brainstorming. Stanford research shows walking boosts creative output by up to 60%.',
  'Every hour, stand and move for 2–3 minutes. Breaking up sitting time improves insulin sensitivity and reduces fatigue.'
];

const MONTHS = [
  'January', 'February', 'March',    'April',
  'May',     'June',     'July',     'August',
  'September','October', 'November', 'December',
];

// Frozen to midnight so streak math stays consistent for the whole session.
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);


// -- Habit tabs --
// Each habit gets a timestamp-based id. All storage keys are prefixed with
// that id so habits never bleed into each other.

const HABITS_KEY  = 'ht_habits';
const ACTIVE_KEY  = 'ht_active';

function loadHabits() {
  try {
    const raw = JSON.parse(localStorage.getItem(HABITS_KEY));
    if (Array.isArray(raw) && raw.length) return raw;
  } catch {}
  // First run — seed a default habit so there's always at least one.
  const def = { id: 'default', name: 'Daily Ritual' };
  saveHabits([def]);
  return [def];
}

function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

function getActiveHabitId() {
  return localStorage.getItem(ACTIVE_KEY) || loadHabits()[0].id;
}

function setActiveHabitId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

function createHabit(name) {
  const habits = loadHabits();
  const id = 'h_' + Date.now();
  habits.push({ id, name });
  saveHabits(habits);
  return id;
}

function renameHabit(id, name) {
  const habits = loadHabits();
  const h = habits.find(h => h.id === id);
  if (h) { h.name = name; saveHabits(habits); }
}

function deleteHabit(id) {
  let habits = loadHabits();
  habits = habits.filter(h => h.id !== id);
  saveHabits(habits);
  // Nuke all localStorage keys belonging to this habit.
  Object.keys(localStorage)
    .filter(k => k.startsWith(`ht_${id}_`))
    .forEach(k => localStorage.removeItem(k));
  return habits;
}

// Resolved before app.js runs so K{} below closes over the right id.
let activeHabitId = getActiveHabitId();

// All keys in one place — easier to audit and rename later.
const K = {
  marked:      (y, m) => `ht_${activeHabitId}_${y}_${String(m).padStart(2, '0')}`,
  monthDone:   (y, m) => `ht_${activeHabitId}_md_${y}_${String(m).padStart(2, '0')}`,
  streakShown: (n)    => `ht_${activeHabitId}_sk_${n}`,
};

function loadMarked(y, m) {
  try { return JSON.parse(localStorage.getItem(K.marked(y, m))) || {}; }
  catch { return {}; }
}

function saveMarked(y, m, data) {
  localStorage.setItem(K.marked(y, m), JSON.stringify(data));
}

function isMonthDone(y, m)   { return !!localStorage.getItem(K.monthDone(y, m)); }
function setMonthDone(y, m)  { localStorage.setItem(K.monthDone(y, m), '1'); }
function clearMonthDone(y, m){ localStorage.removeItem(K.monthDone(y, m)); }

function isStreakShown(n)  { return !!localStorage.getItem(K.streakShown(n)); }
function setStreakShown(n) { localStorage.setItem(K.streakShown(n), '1'); }

// When the streak breaks, wipe the "shown" flags so milestones
// can fire again on the next streak.
function clearAllStreakShown() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(`ht_${activeHabitId}_sk_`))
    .forEach(k => localStorage.removeItem(k));
}


// -- Streak tiers --
// Seven tiers mapped to day ranges. Each one drives the badge colour,
// overlay character, particles, and flavor text.
const TIERS = [
  {
    min: 3,   max: 9,
    name: 'The Ember',
    flavor: 'a spark that refuses to die',
    color: '#e07b3a', glow: 'rgba(224,123,58,0.7)', textColor: '#e07b3a',
    aura: 'radial-gradient(circle, rgba(224,123,58,0.4), transparent 70%)',
    particles: { colors: ['#e07b3a','#f4a55a','#fff8e0'], count: 18, speed: 1.2 },
  },
  {
    min: 10,  max: 19,
    name: 'Kindled',
    flavor: 'something stirs within the smoke',
    color: '#e8a030', glow: 'rgba(232,160,48,0.75)', textColor: '#e8a030',
    aura: 'radial-gradient(circle, rgba(232,160,48,0.45), transparent 70%)',
    particles: { colors: ['#e8a030','#ffce55','#ffe9a0'], count: 24, speed: 1.5 },
  },
  {
    min: 20,  max: 29,
    name: 'The Burning One',
    flavor: 'the heat grows undeniable',
    color: '#d4451a', glow: 'rgba(212,69,26,0.8)', textColor: '#e05a30',
    aura: 'radial-gradient(circle, rgba(212,69,26,0.5), transparent 70%)',
    particles: { colors: ['#d4451a','#ff7040','#ffb080'], count: 30, speed: 1.8 },
  },
  {
    min: 30,  max: 49,
    name: 'Iron Discipline',
    flavor: 'will forged in the fire',
    color: '#7ab3d4', glow: 'rgba(122,179,212,0.8)', textColor: '#7ab3d4',
    aura: 'radial-gradient(circle, rgba(122,179,212,0.5), rgba(212,69,26,0.2), transparent 70%)',
    particles: { colors: ['#7ab3d4','#aad4f0','#e0f4ff','#d4451a'], count: 36, speed: 2 },
  },
  {
    min: 50,  max: 74,
    name: 'Storm Forged',
    flavor: 'lightning in the marrow',
    color: '#b06ee0', glow: 'rgba(176,110,224,0.85)', textColor: '#c490f0',
    aura: 'radial-gradient(circle, rgba(176,110,224,0.55), rgba(70,30,120,0.3), transparent 70%)',
    particles: { colors: ['#b06ee0','#d0a0ff','#7040b0','#fff'], count: 42, speed: 2.4 },
  },
  {
    min: 75,  max: 99,
    name: 'The Undying',
    flavor: 'beyond pain. beyond doubt.',
    color: '#3dba6f', glow: 'rgba(61,186,111,0.9)', textColor: '#5de090',
    aura: 'radial-gradient(circle, rgba(61,186,111,0.6), rgba(10,60,30,0.4), transparent 70%)',
    particles: { colors: ['#3dba6f','#7fffc0','#c9a84c','#fff'], count: 50, speed: 2.8 },
  },
  {
    min: 100, max: Infinity,
    name: 'Eternal Flame',
    flavor: 'you have become the ritual.',
    color: '#c9a84c', glow: 'rgba(255,220,80,1)', textColor: '#ffe44a',
    aura: 'radial-gradient(circle, rgba(255,220,80,0.7), rgba(200,80,20,0.4), rgba(100,20,80,0.2), transparent 70%)',
    particles: { colors: ['#c9a84c','#fff8a0','#ff9a30','#3dba6f','#fff'], count: 60, speed: 3.2 },
  },
];

function getTier(n) {
  return TIERS.find(t => n >= t.min && n <= t.max) || null;
}

// Milestones: day 3, then every 10 through 99, then every 25.
// Everything in between just updates the badge silently.
function isMilestone(n) {
  if (n === 3)   return true;
  if (n < 10)    return false;
  if (n < 100)   return n % 10 === 0;
  return n % 25 === 0;
}


// -- Streak calc --
// Walks backward from today. Bails the moment it hits an unmarked day.
// Returns 0 if today itself isn't marked — no grace period.
function computeStreak() {
  const todayMarked = loadMarked(TODAY.getFullYear(), TODAY.getMonth());
  if (!todayMarked[TODAY.getDate()]) return 0;

  let count = 0;
  const probe = new Date(TODAY);

  for (let i = 0; i < 3000; i++) {
    const y = probe.getFullYear();
    const m = probe.getMonth();
    const d = probe.getDate();

    if (loadMarked(y, m)[d]) {
      count++;
      probe.setDate(probe.getDate() - 1);
    } else {
      break;
    }
  }

  return count;
}


// -- Milestone queue --
// Back-filling old months can unlock multiple milestones at once. The queue
// serialises them so overlays show one at a time instead of stacking.
// "shown" flags live in localStorage so each milestone only fires once.
let milestoneQueue = [];
let queueRunning   = false;

function enqueuePendingMilestones(streak) {
  for (let n = 3; n <= streak; n++) {
    if (isMilestone(n) && !isStreakShown(n)) {
      setStreakShown(n);
      milestoneQueue.push(n);
    }
  }
  if (!queueRunning) drainQueue();
}

// Called on first enqueue and again after each overlay is dismissed.
function drainQueue() {
  if (milestoneQueue.length === 0) { queueRunning = false; return; }
  queueRunning = true;
  const n = milestoneQueue.shift();
  const tier = getTier(n);
  if (!tier) { drainQueue(); return; }
  showStreakOverlay(n, tier);
}


// -- Character SVG builder --
// Procedurally draws a figure into svgEl using only SVG primitives.
// Complexity scales with tier index — tier 0 is a squat blob,
// tier 6 is a winged godform with crown spires. No external assets.
function buildCharacter(tier, svgEl) {
  const t = TIERS.indexOf(tier);
  const c = tier.color;
  svgEl.innerHTML = '';

  const ns = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    (parent || svgEl).appendChild(e);
    return e;
  }

  // Two blur filters: tight for body fill, wider for accents and fire edges.
  const defs = el('defs', {});
  const f1 = el('filter', { id: 'glow',  x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  el('feGaussianBlur', { stdDeviation: 2 + t * 1.5, result: 'blur' }, f1);
  const m1 = el('feMerge', {}, f1);
  el('feMergeNode', { in: 'blur' }, m1);
  el('feMergeNode', { in: 'SourceGraphic' }, m1);

  const f2 = el('filter', { id: 'glow2', x: '-80%', y: '-80%', width: '260%', height: '260%' }, defs);
  el('feGaussianBlur', { stdDeviation: 4 + t * 2, result: 'blur2' }, f2);
  const m2 = el('feMerge', {}, f2);
  el('feMergeNode', { in: 'blur2' }, m2);
  el('feMergeNode', { in: 'SourceGraphic' }, m2);

  // Subtle drop shadow at the feet — same on every tier.
  el('ellipse', { cx: 50, cy: 126, rx: 22, ry: 4, fill: c, opacity: '0.18' });

  if (t === 0) {
    // Tier 0 — ember: squat body, minimal detail
    el('ellipse', { cx: 50, cy: 95, rx: 12, ry: 8, fill: c, opacity: '0.6' });
    el('rect',    { x: 42, y: 80, width: 16, height: 18, rx: 4, fill: c, filter: 'url(#glow)' });
    el('circle',  { cx: 50, cy: 70, r: 10, fill: c, filter: 'url(#glow)' });
    el('circle',  { cx: 46, cy: 68, r: 2, fill: '#fff' });
    el('circle',  { cx: 54, cy: 68, r: 2, fill: '#fff' });
    el('path',    { d: 'M44 62 Q50 50 56 62', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });

  } else if (t === 1) {
    // Tier 1 — kindled: standing figure with flame hair
    el('line',   { x1: 46, y1: 108, x2: 44, y2: 120, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
    el('line',   { x1: 54, y1: 108, x2: 56, y2: 120, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
    el('rect',   { x: 40, y: 82, width: 20, height: 28, rx: 6, fill: c, filter: 'url(#glow)' });
    el('line',   { x1: 40, y1: 90, x2: 28, y2: 100, stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' });
    el('line',   { x1: 60, y1: 90, x2: 72, y2: 100, stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' });
    el('circle', { cx: 50, cy: 72, r: 12, fill: c, filter: 'url(#glow)' });
    el('circle', { cx: 45, cy: 70, r: 2.5, fill: '#fff' });
    el('circle', { cx: 55, cy: 70, r: 2.5, fill: '#fff' });
    el('path',   { d: 'M40 64 Q44 50 50 58 Q56 50 60 64', stroke: c, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });

  } else if (t === 2) {
    // Tier 2 — the burning one: armoured torso, fists, fire crown
    el('line',   { x1: 46, y1: 108, x2: 43, y2: 122, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
    el('line',   { x1: 54, y1: 108, x2: 57, y2: 122, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
    el('path',   { d: 'M36 82 Q36 74 50 72 Q64 74 64 82 L62 110 Q50 114 38 110 Z', fill: c, filter: 'url(#glow)' });
    el('line',   { x1: 46, y1: 86, x2: 54, y2: 86, stroke: 'rgba(255,255,255,0.5)', 'stroke-width': 2 });
    el('line',   { x1: 50, y1: 83, x2: 50, y2: 89, stroke: 'rgba(255,255,255,0.5)', 'stroke-width': 2 });
    el('line',   { x1: 38, y1: 86, x2: 24, y2: 96, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
    el('circle', { cx: 22, cy: 98, r: 4, fill: c, filter: 'url(#glow)' });
    el('line',   { x1: 62, y1: 86, x2: 76, y2: 96, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
    el('circle', { cx: 78, cy: 98, r: 4, fill: c, filter: 'url(#glow)' });
    el('circle', { cx: 50, cy: 68, r: 13, fill: c, filter: 'url(#glow)' });
    el('circle', { cx: 44, cy: 66, r: 3, fill: '#fff' });
    el('circle', { cx: 56, cy: 66, r: 3, fill: '#fff' });
    el('line',   { x1: 41, y1: 63, x2: 47, y2: 65, stroke: 'rgba(0,0,0,0.5)', 'stroke-width': 2, 'stroke-linecap': 'round' });
    el('line',   { x1: 59, y1: 63, x2: 53, y2: 65, stroke: 'rgba(0,0,0,0.5)', 'stroke-width': 2, 'stroke-linecap': 'round' });
    el('path',   { d: 'M37 60 Q40 44 46 55 Q50 40 54 55 Q60 44 63 60', stroke: c, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });

  } else if (t === 3) {
    // Tier 3 — iron discipline: full plate armour, plumed helm
    el('rect',    { x: 40, y: 106, width: 8, height: 16, rx: 3, fill: c, opacity: '0.8' });
    el('rect',    { x: 52, y: 106, width: 8, height: 16, rx: 3, fill: c, opacity: '0.8' });
    el('path',    { d: 'M32 78 Q32 68 50 65 Q68 68 68 78 L66 108 Q50 114 34 108 Z', fill: c, filter: 'url(#glow)' });
    el('ellipse', { cx: 30, cy: 82, rx: 9, ry: 6, fill: c, filter: 'url(#glow)', transform: 'rotate(-20 30 82)' });
    el('ellipse', { cx: 70, cy: 82, rx: 9, ry: 6, fill: c, filter: 'url(#glow)', transform: 'rotate(20 70 82)' });
    el('line',    { x1: 32, y1: 84, x2: 18, y2: 98, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
    el('rect',    { x: 12, y: 94, width: 10, height: 10, rx: 2, fill: c, filter: 'url(#glow)' });
    el('line',    { x1: 68, y1: 84, x2: 82, y2: 98, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
    el('rect',    { x: 78, y: 94, width: 10, height: 10, rx: 2, fill: c, filter: 'url(#glow)' });
    el('line',    { x1: 44, y1: 82, x2: 56, y2: 82, stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 2.5 });
    el('line',    { x1: 50, y1: 77, x2: 50, y2: 87, stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 2.5 });
    el('path',    { d: 'M34 68 Q34 50 50 48 Q66 50 66 68 L64 72 Q50 76 36 72 Z', fill: c, filter: 'url(#glow)' });
    el('rect',    { x: 40, y: 60, width: 20, height: 4, rx: 2, fill: 'rgba(255,255,255,0.25)' });
    el('path',    { d: 'M44 48 Q46 34 50 28 Q54 34 56 48', stroke: c, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });
    el('path',    { d: 'M40 46 Q42 36 46 30', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)', opacity: '0.6' });
    el('path',    { d: 'M60 46 Q58 36 54 30', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)', opacity: '0.6' });

  } else if (t === 4) {
    // Tier 4 — storm forged: arcane robe, glowing staff, horned hood
    el('ellipse', { cx: 50, cy: 88, rx: 35, ry: 10, stroke: c, 'stroke-width': 1.5, fill: 'none', opacity: '0.4', filter: 'url(#glow2)' });
    el('line',    { x1: 46, y1: 108, x2: 42, y2: 122, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
    el('line',    { x1: 54, y1: 108, x2: 58, y2: 122, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
    el('path',    { d: 'M30 80 Q34 68 50 64 Q66 68 70 80 L68 114 Q50 120 32 114 Z', fill: c, filter: 'url(#glow)', opacity: '0.9' });
    el('path',    { d: 'M42 80 Q42 76 50 74 Q58 76 58 80 L56 110 Q50 112 44 110 Z', fill: 'rgba(255,255,255,0.1)' });
    el('line',    { x1: 72, y1: 70, x2: 88, y2: 116, stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round', filter: 'url(#glow)' });
    el('circle',  { cx: 72, cy: 68, r: 8, fill: c, filter: 'url(#glow2)' });
    el('circle',  { cx: 72, cy: 68, r: 4, fill: 'rgba(255,255,255,0.7)' });
    el('line',    { x1: 32, y1: 80, x2: 20, y2: 90, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
    el('circle',  { cx: 18, cy: 92, r: 5, fill: c, filter: 'url(#glow)' });
    el('line',    { x1: 68, y1: 80, x2: 76, y2: 72, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
    el('path',    { d: 'M32 64 Q32 48 50 44 Q68 48 68 64 L64 70 Q50 74 36 70 Z', fill: c, filter: 'url(#glow)' });
    el('ellipse', { cx: 44, cy: 61, rx: 4, ry: 2.5, fill: 'rgba(255,255,255,0.85)', filter: 'url(#glow2)' });
    el('ellipse', { cx: 56, cy: 61, rx: 4, ry: 2.5, fill: 'rgba(255,255,255,0.85)', filter: 'url(#glow2)' });
    el('path',    { d: 'M36 50 Q30 32 38 26 Q40 38 44 46', fill: c, filter: 'url(#glow2)' });
    el('path',    { d: 'M64 50 Q70 32 62 26 Q60 38 56 46', fill: c, filter: 'url(#glow2)' });
    el('path',    { d: 'M46 46 Q50 28 54 46', fill: c, filter: 'url(#glow2)', opacity: '0.8' });

  } else if (t === 5) {
    // Tier 5 — the undying: nature sovereign, antler crown, raised power orbs
    el('path',    { d: 'M40 124 Q35 130 28 128', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: '0.5' });
    el('path',    { d: 'M52 124 Q55 132 62 128', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: '0.5' });
    el('line',    { x1: 45, y1: 108, x2: 41, y2: 122, stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round' });
    el('line',    { x1: 55, y1: 108, x2: 59, y2: 122, stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round' });
    el('path',    { d: 'M28 76 Q28 62 50 58 Q72 62 72 76 L70 112 Q50 118 30 112 Z', fill: c, filter: 'url(#glow)' });
    el('path',    { d: 'M44 78 Q50 72 56 78 Q50 86 44 78', stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 2, fill: 'none' });
    el('ellipse', { cx: 26, cy: 80, rx: 10, ry: 7, fill: c, filter: 'url(#glow)', transform: 'rotate(-25 26 80)' });
    el('ellipse', { cx: 74, cy: 80, rx: 10, ry: 7, fill: c, filter: 'url(#glow)', transform: 'rotate(25 74 80)' });
    el('line',    { x1: 30, y1: 76, x2: 12, y2: 60, stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round' });
    el('circle',  { cx: 10, cy: 57, r: 7, fill: c, filter: 'url(#glow2)' });
    el('circle',  { cx: 10, cy: 57, r: 4, fill: 'rgba(255,255,255,0.6)' });
    el('line',    { x1: 70, y1: 76, x2: 88, y2: 60, stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round' });
    el('circle',  { cx: 90, cy: 57, r: 7, fill: c, filter: 'url(#glow2)' });
    el('circle',  { cx: 90, cy: 57, r: 4, fill: 'rgba(255,255,255,0.6)' });
    el('circle',  { cx: 50, cy: 62, r: 15, fill: c, filter: 'url(#glow)' });
    el('circle',  { cx: 44, cy: 60, r: 3.5, fill: 'rgba(255,255,255,0.9)', filter: 'url(#glow2)' });
    el('circle',  { cx: 56, cy: 60, r: 3.5, fill: 'rgba(255,255,255,0.9)', filter: 'url(#glow2)' });
    el('path',    { d: 'M44 48 Q38 32 30 24 Q32 36 36 44', stroke: c, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });
    el('path',    { d: 'M36 40 Q28 34 24 28', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)', opacity: '0.7' });
    el('path',    { d: 'M56 48 Q62 32 70 24 Q68 36 64 44', stroke: c, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });
    el('path',    { d: 'M64 40 Q72 34 76 28', stroke: c, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)', opacity: '0.7' });
    el('circle',  { cx: 50, cy: 55, r: 3, fill: 'rgba(255,255,255,0.9)', filter: 'url(#glow2)' });

  } else {
    // Tier 6 — eternal flame: winged godform, crown spires, third-eye gem
    el('circle',  { cx: 50, cy: 65, r: 48, stroke: c, 'stroke-width': 1.5, fill: 'none', opacity: '0.3', filter: 'url(#glow2)' });
    el('circle',  { cx: 50, cy: 65, r: 42, stroke: c, 'stroke-width': 0.8, fill: 'none', opacity: '0.2' });
    el('path',    { d: 'M30 78 Q10 55 4 30 Q14 40 22 52 Q16 36 22 18 Q28 42 32 70', fill: c, filter: 'url(#glow)', opacity: '0.55' });
    el('path',    { d: 'M70 78 Q90 55 96 30 Q86 40 78 52 Q84 36 78 18 Q72 42 68 70', fill: c, filter: 'url(#glow)', opacity: '0.55' });
    el('line',    { x1: 45, y1: 110, x2: 41, y2: 124, stroke: c, 'stroke-width': 8, 'stroke-linecap': 'round' });
    el('line',    { x1: 55, y1: 110, x2: 59, y2: 124, stroke: c, 'stroke-width': 8, 'stroke-linecap': 'round' });
    el('path',    { d: 'M26 74 Q26 58 50 54 Q74 58 74 74 L72 114 Q50 120 28 114 Z', fill: c, filter: 'url(#glow)' });
    el('path',    { d: 'M38 74 Q38 66 50 64 Q62 66 62 74 L60 112 Q50 114 40 112 Z', fill: 'rgba(255,255,255,0.12)' });
    el('path',    { d: 'M44 78 L50 72 L56 78 L50 84 Z', stroke: 'rgba(255,255,255,0.5)', 'stroke-width': 1.5, fill: 'rgba(255,255,255,0.08)' });
    el('ellipse', { cx: 24, cy: 78, rx: 12, ry: 8, fill: c, filter: 'url(#glow)', transform: 'rotate(-30 24 78)' });
    el('ellipse', { cx: 76, cy: 78, rx: 12, ry: 8, fill: c, filter: 'url(#glow)', transform: 'rotate(30 76 78)' });
    el('line',    { x1: 28, y1: 74, x2: 10, y2: 60, stroke: c, 'stroke-width': 8, 'stroke-linecap': 'round' });
    el('circle',  { cx: 7,  cy: 57, r: 9, fill: c, filter: 'url(#glow2)' });
    el('circle',  { cx: 7,  cy: 57, r: 5, fill: 'rgba(255,255,255,0.8)' });
    el('line',    { x1: 72, y1: 74, x2: 90, y2: 60, stroke: c, 'stroke-width': 8, 'stroke-linecap': 'round' });
    el('circle',  { cx: 93, cy: 57, r: 9, fill: c, filter: 'url(#glow2)' });
    el('circle',  { cx: 93, cy: 57, r: 5, fill: 'rgba(255,255,255,0.8)' });
    el('circle',  { cx: 50, cy: 60, r: 17, fill: c, filter: 'url(#glow)' });
    el('ellipse', { cx: 43, cy: 58, rx: 4, ry: 3, fill: 'rgba(255,255,255,0.95)', filter: 'url(#glow2)' });
    el('ellipse', { cx: 57, cy: 58, rx: 4, ry: 3, fill: 'rgba(255,255,255,0.95)', filter: 'url(#glow2)' });
    [[50,22,4],[43,26,3],[57,26,3],[36,32,2.5],[64,32,2.5]].forEach(([x, y, r]) => {
      el('path',   { d: `M50 44 Q${x} ${y + 4} ${x} ${y}`, stroke: c, 'stroke-width': r, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#glow2)' });
      el('circle', { cx: x, cy: y, r: r, fill: 'rgba(255,255,255,0.9)', filter: 'url(#glow2)' });
    });
    el('circle', { cx: 50, cy: 53, r: 3.5, fill: 'rgba(255,255,255,1)', filter: 'url(#glow2)' });
  }
}


// -- Particle system --
// Returns a { start, stop } handle. Particles drift upward from the lower
// portion of the canvas with a mild gravity pullback. Mix of circles and
// 5-point stars. Spawns a few per frame rather than all at once.
function makeParticleSystem(canvas, opts) {
  const ctx = canvas.getContext('2d');
  let raf = null;
  const P = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn() {
    const w = canvas.width, h = canvas.height;
    P.push({
      x:     w * 0.2 + Math.random() * w * 0.6,
      y:     h * (0.55 + Math.random() * 0.4),
      vx:    (Math.random() - 0.5) * opts.speed * 0.9,
      vy:    -(opts.speed * 0.8 + Math.random() * opts.speed * 1.6),
      life:  1,
      decay: 0.007 + Math.random() * 0.013,
      size:  3 + Math.random() * 9,
      color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
      star:  Math.random() > 0.55,
    });
  }

  function drawStar(x, y, r, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const b = ((i * 4 + 2) * Math.PI / 5) - Math.PI / 2;
      i === 0
        ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
        : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(b) * r * 0.4, Math.sin(b) * r * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    resize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < Math.ceil(opts.count / 25); i++) spawn();

    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.035;
      p.vx   += (Math.random() - 0.5) * 0.12;
      p.life -= p.decay;

      if (p.life <= 0) { P.splice(i, 1); continue; }

      if (p.star) {
        drawStar(p.x, p.y, p.size * p.life, p.color, p.life * 0.9);
      } else {
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    raf = requestAnimationFrame(animate);
  }

  return {
    start() { resize(); P.length = 0; animate(); },
    stop()  { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); P.length = 0; },
  };
}


// -- Month-complete seal --
// Concentric rings + tick marks + checkmark, drawn fresh each time the
// overlay opens. Pure SVG, no images.
function buildSeal(svgEl) {
  svgEl.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    (parent || svgEl).appendChild(e);
    return e;
  }

  const defs = el('defs', {});
  const f = el('filter', { id: 'sg', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
  el('feGaussianBlur', { stdDeviation: '3', result: 'blur' }, f);
  const m = el('feMerge', {}, f);
  el('feMergeNode', { in: 'blur' }, m);
  el('feMergeNode', { in: 'SourceGraphic' }, m);

  el('circle', { cx: 60, cy: 60, r: 55, stroke: '#3dba6f', 'stroke-width': 2, fill: 'none', opacity: '0.5', filter: 'url(#sg)' });
  el('circle', { cx: 60, cy: 60, r: 48, stroke: '#3dba6f', 'stroke-width': 1, fill: 'none', opacity: '0.3' });
  el('circle', { cx: 60, cy: 60, r: 44, fill: 'rgba(61,186,111,0.08)' });

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    el('line', {
      x1: 60 + 44 * Math.cos(a), y1: 60 + 44 * Math.sin(a),
      x2: 60 + 50 * Math.cos(a), y2: 60 + 50 * Math.sin(a),
      stroke: '#3dba6f',
      'stroke-width': i % 3 === 0 ? 2 : 1,
      opacity: i % 3 === 0 ? '0.7' : '0.35',
    });
  }

  el('path', {
    d: 'M38 62 L52 76 L82 44',
    stroke: '#3dba6f', 'stroke-width': 6,
    fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    filter: 'url(#sg)',
  });
}

// -- Custom modals --
// showPrompt / showConfirm return Promises so callers can just await them.
// Replaces browser prompt() and confirm() with on-brand dialogs.
// Both resolve to null / false on cancel so callers can early-return cleanly.

const modalBackdrop = document.getElementById('customModal');
const modalIcon     = document.getElementById('modalIcon');
const modalTitle    = document.getElementById('modalTitle');
const modalSub      = document.getElementById('modalSub');
const modalInput    = document.getElementById('modalInput');
const modalActions  = document.getElementById('modalActions');

function _openModal() {
  modalBackdrop.classList.add('show');
}

function _closeModal() {
  modalBackdrop.classList.remove('show');
}

// Prevent backdrop tap from accidentally closing (user must use buttons)
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) _closeModal();
});

function showPrompt({ icon = '', title, sub = '', placeholder = '', defaultValue = '' } = {}) {
  return new Promise(resolve => {
    modalIcon.textContent  = icon;
    modalTitle.textContent = title;
    modalSub.textContent   = sub;
    modalInput.value       = defaultValue;
    modalInput.placeholder = placeholder;
    modalInput.classList.add('show');
    modalActions.innerHTML = '';

    const cancel = document.createElement('button');
    cancel.className   = 'modal-btn';
    cancel.textContent = 'Cancel';

    const confirm = document.createElement('button');
    confirm.className   = 'modal-btn primary';
    confirm.textContent = 'Save';

    function done(val) {
      _closeModal();
      setTimeout(() => { modalInput.classList.remove('show'); }, 250);
      resolve(val);
    }

    cancel.addEventListener('click',  () => done(null));
    confirm.addEventListener('click', () => {
      const val = modalInput.value.trim();
      if (!val) { modalInput.focus(); return; }
      done(val);
    });

    // Enter to confirm, Escape to cancel
    function onKey(e) {
      if (e.key === 'Enter')  { e.preventDefault(); confirm.click(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel.click();  }
    }
    modalInput.addEventListener('keydown', onKey, { once: false });

    modalActions.appendChild(confirm);
    modalActions.appendChild(cancel);
    _openModal();

    // Delay focus so the animation doesn't jank on mobile
    setTimeout(() => modalInput.focus(), 80);

    // Clean up key listener when modal closes
    const observer = new MutationObserver(() => {
      if (!modalBackdrop.classList.contains('show')) {
        modalInput.removeEventListener('keydown', onKey);
        observer.disconnect();
      }
    });
    observer.observe(modalBackdrop, { attributes: true, attributeFilter: ['class'] });
  });
}

function showConfirm({ icon = '', title, sub = '', confirmLabel = 'Confirm', danger = false } = {}) {
  return new Promise(resolve => {
    modalIcon.textContent  = icon;
    modalTitle.textContent = title;
    modalSub.textContent   = sub;
    modalInput.classList.remove('show');
    modalActions.innerHTML = '';

    const cancel = document.createElement('button');
    cancel.className   = 'modal-btn';
    cancel.textContent = 'Cancel';

    const ok = document.createElement('button');
    ok.className   = 'modal-btn ' + (danger ? 'danger' : 'primary');
    ok.textContent = confirmLabel;

    function done(val) { _closeModal(); resolve(val); }
    cancel.addEventListener('click', () => done(false));
    ok.addEventListener('click',     () => done(true));

    function onKey(e) {
      if (e.key === 'Enter')  { e.preventDefault(); ok.click();     }
      if (e.key === 'Escape') { e.preventDefault(); cancel.click(); }
    }
    document.addEventListener('keydown', onKey, { once: true });

    modalActions.appendChild(ok);
    modalActions.appendChild(cancel);
    _openModal();
  });
}


// -- Tab management --

function renderTabs() {
  const habits = loadHabits();
  const scroll = document.getElementById('tabsScroll');
  const addBtn = document.getElementById('tabAddBtn');

  // Remove all tabs (but keep the add button)
  scroll.querySelectorAll('.tab').forEach(t => t.remove());

  habits.forEach(habit => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (habit.id === activeHabitId ? ' tab-active' : '');
    tab.dataset.id = habit.id;

    const nameEl = document.createElement('span');
    nameEl.className = 'tab-name';
    nameEl.textContent = habit.name;
    tab.appendChild(nameEl);

    // Only show actions on the active tab
    if (habit.id === activeHabitId) {
      const actions = document.createElement('span');
      actions.className = 'tab-actions';

      const renameBtn = document.createElement('button');
      renameBtn.className = 'tab-action-btn';
      renameBtn.title = 'Rename';
      renameBtn.innerHTML = '✎';
      renameBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const newName = await showPrompt({
          icon: '✎',
          title: 'Rename habit',
          placeholder: 'e.g. Morning Run',
          defaultValue: habit.name,
        });
        if (newName) {
          renameHabit(habit.id, newName);
          renderTabs();
          document.getElementById('habitLabel').textContent = newName;
        }
      });

      actions.appendChild(renameBtn);

      if (habits.length > 1) {
        const delBtn = document.createElement('button');
        delBtn.className = 'tab-action-btn tab-delete-btn';
        delBtn.title = 'Delete habit';
        delBtn.innerHTML = '✕';
        delBtn.addEventListener('click', async e => {
          e.stopPropagation();
          const ok = await showConfirm({
            icon: '⚠',
            title: 'Delete habit?',
            sub: `"${habit.name}" and all its tracked data will be permanently removed.`,
            confirmLabel: 'Delete',
            danger: true,
          });
          if (!ok) return;
          const remaining = deleteHabit(habit.id);
          activeHabitId = remaining[0].id;
          setActiveHabitId(activeHabitId);
          milestoneQueue = [];
          queueRunning = false;
          viewYear  = TODAY.getFullYear();
          viewMonth = TODAY.getMonth();
          renderTabs();
          updateHabitHeader();
          render();
        });
        actions.appendChild(delBtn);
      }

      tab.appendChild(actions);
    }

    tab.addEventListener('click', () => {
      if (habit.id === activeHabitId) return;
      activeHabitId = habit.id;
      setActiveHabitId(activeHabitId);
      milestoneQueue = [];
      queueRunning = false;
      viewYear  = TODAY.getFullYear();
      viewMonth = TODAY.getMonth();
      renderTabs();
      updateHabitHeader();
      render();
    });

    scroll.insertBefore(tab, addBtn);
  });

  // Scroll active tab into view
  const activeTab = scroll.querySelector('.tab-active');
  if (activeTab) activeTab.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function updateHabitHeader() {
  const habits = loadHabits();
  const habit = habits.find(h => h.id === activeHabitId) || habits[0];
  document.getElementById('habitLabel').textContent = habit ? habit.name : 'Daily Ritual';
}

document.getElementById('tabAddBtn').addEventListener('click', async () => {
  const name = await showPrompt({
    icon: '✦',
    title: 'New habit',
    sub: 'Give your habit a name to start tracking.',
    placeholder: 'e.g. Exercise, Reading…',
  });
  if (!name) return;
  const id = createHabit(name);
  activeHabitId = id;
  setActiveHabitId(id);
  milestoneQueue = [];
  queueRunning = false;
  viewYear  = TODAY.getFullYear();
  viewMonth = TODAY.getMonth();
  renderTabs();
  updateHabitHeader();
  render();
});


// viewYear/viewMonth track what the calendar is showing — independent of
// TODAY so the user can browse history without breaking streak logic.
let viewYear  = TODAY.getFullYear();
let viewMonth = TODAY.getMonth();

// Hold refs so we can stop the canvas loops when overlays close.
let streakPS = null;
let monthPS  = null;


// -- Streak milestone overlay --

const streakOvEl = document.getElementById('streakOverlay');

function showStreakOverlay(n, tier) {
  buildCharacter(tier, document.getElementById('charSvg'));

  document.getElementById('charAura').style.background = tier.aura;
  document.getElementById('charSvg').style.setProperty('--char-glow', tier.glow);
  document.getElementById('streakName').textContent    = tier.name;
  document.getElementById('streakName').style.color    = tier.textColor;
  document.getElementById('streakFlavor').textContent  = tier.flavor;
  document.getElementById('streakFlavor').style.color  = tier.textColor;
  document.getElementById('streakDismiss').style.color = tier.textColor + '80';
  document.getElementById('streakDaysLabel').innerHTML =
    `<span style="color:${tier.textColor}">${n}</span>` +
    `<em style="color:rgba(255,255,255,0.45)">day streak</em>`;

  // Pull the opacity down on the glow color so the radial backdrop is subtle.
  streakOvEl.style.background =
    `radial-gradient(ellipse at 50% 65%, ${tier.glow.replace(/[\d.]+\)$/, '0.13)')} 0%, rgba(0,0,0,0.92) 70%)`;

  if (streakPS) streakPS.stop();
  streakPS = makeParticleSystem(document.getElementById('streakCanvas'), tier.particles);
  streakPS.start();

  streakOvEl.classList.add('show');
}

function hideStreakOverlay() {
  streakOvEl.classList.remove('show');
  if (streakPS) { streakPS.stop(); streakPS = null; }
  // Small delay so the close animation finishes before the next popup starts.
  setTimeout(drainQueue, 300);
}

streakOvEl.addEventListener('click', hideStreakOverlay);


// -- Month complete overlay --

const monthOvEl = document.getElementById('monthOverlay');

function showMonthOverlay(y, m, total) {
  buildSeal(document.getElementById('sealSvg'));
  document.getElementById('monthCompleteSub').textContent =
    `${MONTHS[m]} ${y} — all ${total} days marked`;

  monthOvEl.style.background =
    'radial-gradient(ellipse at 50% 50%, rgba(61,186,111,0.12) 0%, rgba(0,0,0,0.94) 70%)';

  if (monthPS) monthPS.stop();
  monthPS = makeParticleSystem(document.getElementById('monthCanvas'), {
    colors: ['#3dba6f','#7fffc0','#c9a84c','#fff8a0','#fff'],
    count: 40,
    speed: 2,
  });
  monthPS.start();

  monthOvEl.classList.add('show');
}

function hideMonthOverlay() {
  monthOvEl.classList.remove('show');
  if (monthPS) { monthPS.stop(); monthPS = null; }
}

monthOvEl.addEventListener('click', hideMonthOverlay);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideStreakOverlay(); hideMonthOverlay(); }
});


// -- Calendar --
// Full rebuild on every state change — simple enough that diffing isn't worth it.

function render() {
  const marked      = loadMarked(viewYear, viewMonth);
  const grid        = document.getElementById('daysGrid');
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const isThisMonth = viewYear === TODAY.getFullYear() && viewMonth === TODAY.getMonth();

  document.getElementById('monthLabel').textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div');
    cell.className = 'day empty';
    grid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isMarked = !!marked[d];
    const isToday  = isThisMonth && d === TODAY.getDate();

    const cell = document.createElement('div');
    cell.className = ['day', isMarked && 'marked', isToday && 'today']
      .filter(Boolean).join(' ');

    const cross = document.createElement('div');
    cross.className = 'cross';
    cross.innerHTML = `<svg viewBox="0 0 24 24" fill="none">
      <line x1="5" y1="5" x2="19" y2="19"/>
      <line x1="19" y1="5" x2="5" y2="19"/>
    </svg>`;

    const num = document.createElement('div');
    num.className   = 'day-num';
    num.textContent = d;

    cell.appendChild(cross);
    cell.appendChild(num);
    cell.addEventListener('click', () => toggle(d));
    grid.appendChild(cell);
  }

  updateBar(marked, daysInMonth);
  updateStreakBadge();
  checkMonthComplete(viewYear, viewMonth, marked, daysInMonth);
}

function toggle(day) {
  const marked = loadMarked(viewYear, viewMonth);
  if (marked[day]) delete marked[day]; else marked[day] = true;
  saveMarked(viewYear, viewMonth, marked);
  render();
}


// -- Progress bar --

function updateBar(marked, daysInMonth) {
  const count = Object.keys(marked).length;
  const pct   = Math.round((count / daysInMonth) * 100);

  document.getElementById('stats').innerHTML =
    `<span>${count}</span> of <span>${daysInMonth}</span> days completed`;
  document.getElementById('barFill').style.width  = pct + '%';
  document.getElementById('barPct').textContent   = pct + '%';
}


// -- Month-complete check --
// Fires for any month the moment all days are marked. A localStorage flag
// prevents it from showing twice unless the month is cleared and re-filled.

function checkMonthComplete(y, m, marked, daysInMonth) {
  if (Object.keys(marked).length === daysInMonth && !isMonthDone(y, m)) {
    setMonthDone(y, m);
    setTimeout(() => showMonthOverlay(y, m, daysInMonth), 400);
  }
}


// -- Streak badge --
// Hidden until today is marked. Once visible, shows the count + tier name
// and queues any milestone overlays that haven't fired yet.

function updateStreakBadge() {
  const dispEl = document.getElementById('streakDisplay');
  const streak = computeStreak();

  if (streak < 1) {
    dispEl.classList.remove('visible');
    dispEl.innerHTML = '';
    return;
  }

  const tier = getTier(streak);
  dispEl.classList.add('visible');

  if (tier) {
    dispEl.innerHTML =
      `<span style="color:${tier.textColor}">✦</span>` +
      `<span class="streak-count" style="color:${tier.textColor}">${streak}-day streak</span>` +
      `<span style="opacity:0.35">·</span>` +
      `<span style="color:${tier.textColor};opacity:0.7;font-size:0.9em">${tier.name}</span>`;
  } else {
    dispEl.innerHTML =
      `<span style="color:var(--muted)">✦</span>` +
      `<span class="streak-count" style="color:var(--muted)">${streak}-day streak</span>`;
  }

  enqueuePendingMilestones(streak);
}


// -- Month navigation --

document.getElementById('prevBtn').addEventListener('click', () => {
  if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
  render();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
  render();
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  const ok = await showConfirm({
    icon: '🗓',
    title: 'Clear this month?',
    sub: `All marked days in ${MONTHS[viewMonth]} ${viewYear} will be removed.`,
    confirmLabel: 'Clear',
    danger: true,
  });
  if (!ok) return;

  saveMarked(viewYear, viewMonth, {});
  clearMonthDone(viewYear, viewMonth);

  // If wiping this month snaps the current streak, reset milestone flags
  // so they can re-fire when the streak is rebuilt.
  if (computeStreak() === 0) clearAllStreakShown();

  render();
});


// -- Init --

renderTabs();
updateHabitHeader();
render();

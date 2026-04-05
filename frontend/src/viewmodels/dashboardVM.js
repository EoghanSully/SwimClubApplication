import { AppState } from '../app.js';
import { formatDateLong } from '../utils/date.js';
import * as eventModel from '../models/eventsModel.js';

// LOAD DASHBOARD EVENT DATA INTO GLOBAL APP STATE.
export async function loadDashboardData() {
  try {
    const events = await eventModel.getAllEvents();
    AppState.events = events;
  } catch (e) {
    console.warn('Could not load data:', e.message);
  }
}

// FIND THE NEXT UPCOMING TRAINING SESSION VISIBLE TO THE CURRENT USER ROLE.
async function getNextSession(user, role) {
  const events = AppState.events.length ? AppState.events : await eventModel.getAllEvents();
  const now = new Date();

  return events
    .filter(e => {
      if (e.type !== 'TRAINING') return false;
      if (new Date(`${e.date}T${e.startTime}`) <= now) return false;
      if (role === 'MEMBER') return user.teamIds.includes(e.teamId || '');
      return true;
    })
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`))[0] || null;
}

  // BUILD ROLE-BASED QUICK ACTION TILES FOR THE DASHBOARD.
function getQuickActionTiles(role) {
  const shared = [
    { id: 'schedule', label: 'View Schedule', icon: '📅' },
    { id: 'teams', label: role === 'MEMBER' ? 'My Team' : 'Teams & Members', icon: '👥' }
  ];

  if (role === 'ADMIN' || role === 'COACH') {
    return [...shared,
      { id: 'attendance', label: 'Attendance', icon: '◉' },
      { id: 'sessions', label: 'Session Plans', icon: '📋' }
    ];
  }
  return [...shared, { id: 'profile', label: 'My Profile', icon: '👤' }];
}

// INITIALISE HERO CONTENT AND QUICK ACTIONS FOR DASHBOARD.
export async function initDashboard() {
  const user = AppState?.currentUser || { teamIds: [], name: 'User', role: 'MEMBER' };
  const role = user.role || 'MEMBER';

  await loadDashboardData();

  // RENDER HERO SECTION WITH NEXT SESSION OR WELCOME FALLBACK.
  const heroContent = document.getElementById('hero-content');
  if (heroContent) {
    const nextSession = await getNextSession(user, role);
    if (nextSession) {
      heroContent.innerHTML = `
        <div class="hero-next-session">
          <div class="hero-info">
            <div class="hero-icon">📅</div>
            <div>
              <h2 class="hero-title">Next Training Session</h2>
              <p class="hero-subtitle">${formatDateLong(nextSession.date)} · ${nextSession.startTime}</p>
            </div>
          </div>
          <a href="#schedule" class="hero-btn">View In Schedule</a>
        </div>`;
    } else {
      heroContent.innerHTML = `
        <div class="hero-welcome">
          <div class="hero-info">
            <div class="hero-icon">📅</div>
            <div>
              <h1 class="hero-welcome-title">Welcome, ${user.name || 'Swimmer'}</h1>
              <p class="hero-welcome-subtitle">No upcoming training sessions scheduled</p>
            </div>
          </div>
          <a href="#schedule" class="hero-btn">View In Schedule</a>
        </div>`;
    }
  }

  // RENDER QUICK ACTION TILE GRID FOR CURRENT USER ROLE.
  const grid = document.getElementById('quick-actions-grid');
  if (grid) {
    grid.innerHTML = getQuickActionTiles(role).map(a => `
      <a href="#${a.id}" class="quick-action-tile">
        <div class="tile-icon">${a.icon}</div>
        <div class="tile-label">${a.label}</div>
      </a>
    `).join('');
  }
}
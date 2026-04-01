// ============================================
// DASHBOARD VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import { formatDateLong } from '../utils/date.js';
import * as eventModel from '../models/eventsModel.js';
import * as announcementModel from '../models/announcementModel.js';
import { loadComponent, renderTemplate } from '../utils/components.js';

let eventsList = [];
let announcementsList = [];

// ============================================
// MODAL FUNCTIONS (Global)
// ============================================
/**
 * Load all dashboard data from backend
 */
export async function loadDashboardData() {
  try {
    eventsList = await eventModel.getAllEvents();
    announcementsList = await announcementModel.getAllAnnouncements();
  } catch (e) {
    console.warn('Could not load data:', e.message);
    eventsList = AppState.events.length ? AppState.events : [];
    announcementsList = AppState.announcements.length ? AppState.announcements : [];
  }
  return { events: eventsList, announcements: announcementsList };
}

/**
 * Get next upcoming training session
 */
export async function getNextSession(user, role) {
  try {
    const events = eventsList.length ? eventsList : (await eventModel.getAllEvents());
    const now = new Date();
    
    return events
      .filter(e => {
        if (e.type !== 'TRAINING') return false;
        const eventDateTime = new Date(`${e.date}T${e.startTime}`);
        if (eventDateTime <= now) return false;
        
        if (role === 'MEMBER') {
          return user.teamIds.includes(e.teamId || '');
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      })[0] || null;
  } catch (error) {
    console.error('Error getting next session:', error.stack);
    return null;
  }
}

/**
 * Get quick action tiles based on role
 */
export function getQuickActionTiles(role) {
  const adminTiles = [
    { id: 'schedule', label: 'View Schedule', icon: '📅' },
    { id: 'attendance', label: 'Attendance', icon: '◉' },
    { id: 'teams', label: 'Teams & Members', icon: '👥' },
    { id: 'sessions', label: 'Session Plans', icon: '📋' }
  ];
  
  const coachTiles = [
    { id: 'schedule', label: 'View Schedule', icon: '📅' },
    { id: 'attendance', label: 'Attendance', icon: '◉' },
    { id: 'teams', label: 'Teams & Members', icon: '👥' },
    { id: 'sessions', label: 'Session Plans', icon: '📋' }
  ];
  
  const memberTiles = [
    { id: 'schedule', label: 'View Schedule', icon: '📅' },
    { id: 'dashboard', label: 'Latest Updates', icon: '📢' },
    { id: 'teams', label: 'My Team', icon: '👥' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];
  
  switch(role) {
    case 'ADMIN': return adminTiles;
    case 'COACH': return coachTiles;
    case 'MEMBER': return memberTiles;
    default: return [];
  }
}

/**
 * Get filtered announcements for dashboard
 */
export async function getDashboardAnnouncements(user, role, limit = 5) {
  try {
    const announcements = announcementsList.length ? announcementsList : (await announcementModel.getAllAnnouncements());
    
    return announcements
      .filter(a => {
        if (a.audience === 'club') return true;
        if (a.audience === 'coach' && (role === 'ADMIN' || role === 'COACH')) return true;
        if (a.team_id && user.teamIds && user.teamIds.includes(a.team_id)) return true;
        return role === 'ADMIN';
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting dashboard announcements:', error.stack);
    return [];
  }
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(user, role, daysAhead = 7) {
  try {
    const events = eventsList.length ? eventsList : (await eventModel.getAllEvents());
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return events
      .filter(e => {
        const eventDate = new Date(`${e.date}T${e.startTime}`);
        if (eventDate < now || eventDate > futureDate) return false;
        
        if (role === 'MEMBER') {
          return user.teamIds.includes(e.teamId || '') || e.teamId === 'CLUB';
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      });
  } catch (error) {
    console.error('Error getting upcoming events:', error.stack);
    return [];
  }
}

// ====================
// UI ENTRY POINT
// ====================

export async function initDashboard() {
  console.log('📊 Initializing Dashboard...');
  const user = AppState?.currentUser || { teamIds: [], name: 'User', role: 'MEMBER' };
  const role = user.role || 'MEMBER';

  try {
    await loadDashboardData();

    renderHero(user, role);
    renderQuickActions(role);
    await renderAnnouncements(user, role);
  } catch (error) {
    console.error('Dashboard init failed:', error);
  }
}

function renderHero(user, role) {
  const heroContent = document.getElementById('hero-content');
  if (!heroContent) return;

  getNextSession(user, role).then(nextSession => {
    if (nextSession) {
      heroContent.innerHTML = `
        <div class="hero-next-session">
          <div class="hero-info">
            <div class="hero-icon">📅</div>
            <div>
              <h2 class="hero-title">Next Training Session</h2>
              <p class="hero-subtitle">
                ${formatDateLong(nextSession.date)} · ${nextSession.startTime}
              </p>
            </div>
          </div>
          <a href="#schedule" class="hero-btn">View In Schedule</a>
        </div>
      `;
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
        </div>
      `;
    }
  });
}

function renderQuickActions(role) {
  const grid = document.getElementById('quick-actions-grid');
  if (!grid) return;

  const actions = getQuickActionTiles(role).map((tile) => ({
    ...tile,
    link: `#${tile.id}`
  }));

  grid.innerHTML = actions.map(action => `
    <a href="${action.link}" class="quick-action-tile">
      <div class="tile-icon">${action.icon}</div>
      <div class="tile-label">${action.label}</div>
    </a>
  `).join('');
}

async function renderAnnouncements(user, role) {
  const container = document.getElementById('dashboard-announcements-list');
  if (!container) return;

  const announcements = await getDashboardAnnouncements(user, role);
  if (announcements.length === 0) {
    container.innerHTML = '<div class="announcements-sidebar-empty">No announcements</div>';
    return;
  }

  const categoryColors = {
    GENERAL: '#6B7280',
    TRAINING: '#2563EB',
    COMPETITION: '#DC2626',
    SOCIAL: '#9333EA',
    FUNDRAISER: '#F59E0B',
    SOCIETY: '#EC4899'
  };

  const cardTemplate = await loadComponent('announcement-card');
  container.innerHTML = announcements.map((announcement, index) => renderTemplate(cardTemplate, {
    index,
    categoryColor: categoryColors[announcement.category] || '#6B7280',
    category: announcement.category || 'GENERAL',
    date: announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    title: announcement.title,
    author: announcement.author_name || 'Admin'
  })).join('');

  container.querySelectorAll('[data-announcement-index]').forEach((card) => {
    card.addEventListener('click', () => {
      const index = Number(card.getAttribute('data-announcement-index'));
      window.openAnnouncementModal(announcements[index]);
    });
  });
}
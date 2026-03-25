// ============================================
// DASHBOARD VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import { formatDateShort } from '../utils/date.js';
import * as eventModel from '../models/eventsModel.js';
import * as announcementModel from '../models/announcementModel.js';
import * as userModel from '../models/userModel.js';

let eventsList = [];
let announcementsList = [];
let selectedCategory = 'ALL';

/**
 * Load all dashboard data from backend
 */
export async function loadDashboardData() {
  try {
    eventsList = await eventModel.getAllEvents();
    announcementsList = await announcementModel.getAllAnnouncements();
    return { events: eventsList, announcements: announcementsList };
  } catch (error) {
    console.error('Error loading dashboard data:', error.stack);
    throw error;
  }
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
    { id: 'events', label: 'View Schedule', icon: 'calendar' },
    { id: 'attendance', label: 'Mark Attendance', icon: 'check-circle' },
    { id: 'teams', label: 'Manage Teams', icon: 'users' },
    { id: 'announcements', label: 'Post Announcement', icon: 'message-square' }
  ];
  
  const coachTiles = [
    { id: 'events', label: 'View Schedule', icon: 'calendar' },
    { id: 'sessionPlans', label: 'Session Plans', icon: 'clipboard-list' },
    { id: 'attendance', label: 'Mark Attendance', icon: 'check-circle' },
    { id: 'announcements', label: 'Post Announcement', icon: 'message-square' }
  ];
  
  const memberTiles = [
    { id: 'events', label: 'View Schedule', icon: 'calendar' },
    { id: 'profile', label: 'My Profile', icon: 'user-circle' }
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
export async function getDashboardAnnouncements(user, role, limit = 10) {
  try {
    const announcements = announcementsList.length ? announcementsList : (await announcementModel.getAllAnnouncements());
    
    return announcements
      .filter(a => {
        if (a.target === 'ALL') return true;
        if (a.target === 'COACHES' && (role === 'ADMIN' || role === 'COACH')) return true;
        if (user.teamIds && user.teamIds.includes(a.target)) return true;
        return role === 'ADMIN';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
    await renderAnnouncementsSection(user, role);
  } catch (error) {
    console.error('Dashboard init failed:', error);
  }
}

function renderHero(user, role) {
  const heroBanner = document.getElementById('hero-banner');
  if (!heroBanner) return;

  const nextSessionPromise = getNextSession(user, role);

  nextSessionPromise.then(nextSession => {
    if (nextSession) {
      heroBanner.innerHTML = `
        <div class="hero-content">
          <h1 class="hero-title">Next Training Session</h1>
          <p class="hero-subtitle">{{nextSession.startTime}}</p>
          <p class="hero-subtitle">${nextSession.title || ''}</p>
          <a href="#schedule" class="hero-btn">View Schedule</a>
        </div>
      `;
    } else {
      heroBanner.innerHTML = `
        <div class="hero-content">
          <h1 class="hero-title">Welcome back, ${user.name?.split(' ')[0] || 'Swimmer'}!</h1>
          <p class="hero-subtitle">University of Galway Swim Club</p>
        </div>
      `;
    }
  });
}

function renderQuickActions(role) {
  const grid = document.getElementById('tiles-container');
  if (!grid) return;

  const tiles = getQuickActionTiles(role);

  grid.innerHTML = tiles.map(tile => `
    <a href="#${tile.id}" class="quick-action-tile">
      <div class="tile-icon">${tile.icon}</div>
      <h4 class="tile-label">${tile.label}</h4>
    </a>
  `).join('');
}

async function renderAnnouncementsSection(user, role) {
  const filters = document.getElementById('announcement-filters');
  const feed = document.getElementById('announcements-feed');
  if (!feed || !filters) return;

  const categories = AnnouncementsVM.getCategories();

  filters.innerHTML = categories.map(cat => `
    <button class="filter-btn ${selectedCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>
  `).join('');

  filters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      selectedCategory = e.target.dataset.category;
      await renderAnnouncementsSection(user, role);
    });
  });

  let announcements = await getDashboardAnnouncements(user, role, 6);
  if (selectedCategory !== 'ALL') {
    announcements = announcements.filter(a => a.category === selectedCategory);
  }

  if (announcements.length === 0) {
    feed.innerHTML = '<div class="no-announcements">No announcements to display</div>';
    return;
  }

  const announcementsWithLabel = await Promise.all(announcements.map(async ann => ({
    ...ann,
    targetLabel: await AnnouncementsVM.getTargetLabel(ann.target)
  })));

  feed.innerHTML = announcementsWithLabel.map(ann => `
    <div class="announcement-card">
      <div class="announcement-header">
        <span class="announcement-badge ${AnnouncementsVM.getCategoryColor(ann.category)}">${ann.category}</span>
        <span class="announcement-target">${ann.targetLabel}</span>
      </div>
      <div class="announcement-body">
        <h3 class="announcement-title">${ann.title}</h3>
        <p class="announcement-content">${ann.content}</p>
      </div>
      <div class="announcement-footer">
        <div class="announcement-author">👤 ${ann.author || 'Admin'}</div>
        <span class="announcement-date">${formatDateShort(ann.date)}</span>
      </div>
      ${ann.eventId ? `<a href="#schedule" class="announcement-event-link">View Related Event →</a>` : ''}
    </div>
  `).join('');
}


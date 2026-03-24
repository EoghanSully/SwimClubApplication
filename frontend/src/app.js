/**
 * Main Application Orchestrator
 * Handles routing, authentication, state management, and navigation
 */

import { apiGet } from './utils/api.js';

// ====================
// GLOBAL STATE
// ====================
export const AppState = {
  currentUser: null,
  isAuthenticated: false,
  users: [],
  teams: [],
  events: [],
  announcements: [],
  sessionPlans: [],
  
  setCurrentUser(user) {
    this.currentUser = user;
    this.isAuthenticated = !!user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  },
  
  clearAuth() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }
};

window.AppState = AppState;

// ====================
// INITIALIZATION
// ====================
async function initApp() {
  console.log('🚀 Initializing Swim Club Application...');
  
  // Check if user is already logged in
  const storedUser = localStorage.getItem('currentUser');
  
  if (!storedUser) {
    console.log('No authenticated session found, redirecting to login...');
    router('login');
    return;
  }
  
  try {
    AppState.setCurrentUser(JSON.parse(storedUser));
    console.log(`✅ Restored session for: ${AppState.currentUser.name}`);
    
    // Try to load initial data
    await loadAppData();
    
    // Route to dashboard
    const hash = window.location.hash.slice(1) || 'dashboard';
    router(hash);
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    AppState.clearAuth();
    router('login');
  }
}

async function loadAppData() {
  try {
    // Fetch teams, events, announcements, session plans
    const [teamsRes, eventsRes, announcementsRes, plansRes] = await Promise.all([
      apiGet('/teams'),
      apiGet('/events'),
      apiGet('/announcements'),
      apiGet('/plans')
    ]).catch(() => [[], [], [], []]);
    
    AppState.teams = teamsRes || [];
    AppState.events = eventsRes || [];
    AppState.announcements = announcementsRes || [];
    AppState.sessionPlans = plansRes || [];
    
    console.log('✅ App data loaded');
  } catch (error) {
    console.warn('⚠️ Could not pre-fetch app data:', error);
  }
}

// ====================
// ROUTER
// ====================
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1) || 'dashboard';
  router(hash);
});

async function router(page) {
  console.log(`📍 Routing to: ${page}`);
  
  const mainContent = document.getElementById('main-content');
  
  // Check authentication for protected routes
  const protectedRoutes = ['dashboard', 'schedule', 'announcements', 'teams', 'attendance', 'sessions', 'profile'];
  if (protectedRoutes.includes(page) && !AppState.isAuthenticated) {
    console.warn('🔒 Protected route accessed without authentication');
    window.location.hash = 'login';
    return;
  }
  
  try {
    // Load view HTML
    const viewHTML = await fetch(`src/views/${page}.html`).then(r => r.text());
    mainContent.innerHTML = viewHTML;
    
    // Initialize the appropriate ViewModel
    switch (page) {
      case 'login':
        const { initLogin } = await import('./viewmodels/authVM.js');
        await initLogin();
        break;
      
      case 'dashboard':
        const { initDashboard } = await import('./viewmodels/dashboardVM.js');
        await initDashboard();
        break;
      
      case 'schedule':
        const { initSchedule } = await import('./viewmodels/scheduleVM.js');
        await initSchedule();
        break;
      
      case 'announcements':
        const { initAnnouncements } = await import('./viewmodels/announcementsVM.js');
        await initAnnouncements();
        break;
      
      case 'teams':
        const { initTeams } = await import('./viewmodels/teamsVM.js');
        await initTeams();
        break;
      
      case 'attendance':
        const { initAttendance } = await import('./viewmodels/attendanceVM.js');
        await initAttendance();
        break;
      
      case 'sessions':
        const { initSessions } = await import('./viewmodels/sessionPlansVM.js');
        await initSessions();
        break;
      
      case 'profile':
        const { initProfile } = await import('./viewmodels/profileVM.js');
        await initProfile();
        break;
      
      default:
        mainContent.innerHTML = '<p>Page not found</p>';
    }
  } catch (error) {
    console.error('❌ Router error:', error);
    mainContent.innerHTML = `<div class="container"><div class="error-message">Error loading page: ${error.message}</div></div>`;
  }
}

// ====================
// NAVIGATION RENDERING
// ====================
function renderNav() {
  const navContainer = document.getElementById('nav-container');
  if (!navContainer) return;
  
  // Define menu items with role requirements
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'schedule', label: 'Schedule', icon: '📅', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'announcements', label: 'Announcements', icon: '📢', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'teams', label: 'Teams', icon: '👥', roles: ['ADMIN', 'COACH'] },
    { id: 'attendance', label: 'Attendance', icon: '✅', roles: ['ADMIN', 'COACH'] },
    { id: 'sessions', label: 'Session Plans', icon: '📋', roles: ['ADMIN', 'COACH'] },
    { id: 'profile', label: 'My Profile', icon: '👤', roles: ['ADMIN', 'COACH', 'MEMBER'] }
  ];
  
  // Filter by role
  const userRole = AppState.currentUser?.role || 'MEMBER';
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));
  
  // Get current active tab from hash
  const currentHash = window.location.hash.slice(1) || 'dashboard';
  
  const navHTML = `
    <div class="nav-bar">
      <div class="nav-logo">
        <div class="nav-logo-box">UG</div>
        <div class="nav-logo-text">SWIM CLUB</div>
      </div>
      
      <div class="nav-menu">
        ${menuItems.map(item => `
          <button class="nav-btn ${currentHash === item.id ? 'active' : ''}" 
                  onclick="window.location.hash='${item.id}'">
            <span style="font-size: 1rem;">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `).join('')}
      </div>
      
      <div style="display: flex; align-items: center; gap: 1.5rem;">
        <div class="nav-user">
          <div class="nav-user-name">${AppState.currentUser?.name || 'User'}</div>
          <div class="nav-user-role">${AppState.currentUser?.role || 'MEMBER'}</div>
        </div>
        <button class="nav-logout-btn" onclick="logoutUser()">Logout</button>
      </div>
    </div>
  `;
  
  navContainer.innerHTML = navHTML;
}

export function logoutUser() {
  if (confirm('Are you sure you want to logout?')) {
    AppState.clearAuth();
    window.location.hash = 'login';
    window.location.reload();
  }
}

// Make it global for onclick handlers
window.logoutUser = logoutUser;

// ====================
// APP START
// ====================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Re-render nav when hash changes
window.addEventListener('hashchange', () => {
  renderNav();
});

// Initial nav render
window.addEventListener('load', () => {
  setTimeout(() => {
    if (AppState.isAuthenticated) {
      renderNav();
    }
  }, 100);
});

// ====================
// GLOBAL UTILITIES
// ====================
window.goToPage = function(page) {
  window.location.hash = page;
};
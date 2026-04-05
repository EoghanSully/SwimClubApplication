/**
 * Main Application Orchestrator
 * Slim entrypoint: wires state, router, nav, and shared layout.
 */

import { apiGet, apiPost } from './utils/api.js';
import { adaptAnnouncementRow, adaptEventRow, adaptPlanRow, adaptTeamRows } from './utils/adapters.js';
import { loadComponent, renderTemplate } from './utils/components.js';
import { AppState } from './core/state.js';
import { renderNav } from './core/nav.js';
import { createLayoutController } from './core/layout.js';

// Expose shared state for legacy/global handlers used across viewmodels.
window.AppState = AppState;

// Layout controller centralizes shared sidebar + modal behavior across routes.
const layout = createLayoutController({
  AppState,
  apiGet,
  apiPost,
  adaptAnnouncementRow,
  adaptTeamRows,
  loadComponent,
  renderTemplate,
  reroute: (page) => router(page)
});

async function loadAppData() {
  try {
    const [teamsResult, eventsResult, announcementsResult, plansResult] = await Promise.allSettled([
      apiGet('/teams'),
      apiGet('/events'),
      apiGet('/announcements'),
      apiGet('/plans')
    ]);

    AppState.teams = teamsResult.status === 'fulfilled' ? adaptTeamRows(teamsResult.value?.data || []) : [];
    AppState.events = eventsResult.status === 'fulfilled' ? (eventsResult.value?.data || []).map(adaptEventRow) : [];
    AppState.announcements = announcementsResult.status === 'fulfilled' ? (announcementsResult.value?.data || []).map(adaptAnnouncementRow) : [];
    AppState.sessionPlans = plansResult.status === 'fulfilled' ? (plansResult.value?.data || []).map(adaptPlanRow) : [];

    console.log('App data loaded');
  } catch (error) {
    console.warn('Could not pre-fetch app data:', error);
  }
}

export function logoutUser() {
  if (confirm('Are you sure you want to logout?')) {
    AppState.clearAuth();
    window.location.hash = 'login';
    window.location.reload();
  }
}
window.logoutUser = logoutUser;

// Router owns: guard checks -> view load -> viewmodel init -> shared layout hooks.
async function router(page) {
  const routeAliases = {
    events: 'schedule',
    announcements: 'dashboard'
  };
  const normalizedPage = routeAliases[page] || page;

  const routeAccess = {
    dashboard: ['ADMIN', 'COACH', 'MEMBER'],
    schedule: ['ADMIN', 'COACH', 'MEMBER'],
    attendance: ['ADMIN', 'COACH'],
    teams: ['ADMIN', 'COACH', 'MEMBER'],
    sessions: ['ADMIN', 'COACH'],
    profile: ['ADMIN', 'COACH', 'MEMBER']
  };

  const mainContent = document.getElementById('main-content');
  const topNav = document.getElementById('top-nav');

  const protectedRoutes = ['dashboard', 'schedule', 'teams', 'attendance', 'sessions', 'profile'];
  if (protectedRoutes.includes(normalizedPage) && !AppState.isAuthenticated) {
    window.location.hash = 'login';
    return;
  }

  const allowedRoles = routeAccess[normalizedPage] || [];
  const userRole = AppState.currentUser?.role || 'MEMBER';
  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    window.location.hash = 'dashboard';
    return;
  }

  try {
    const viewResponse = await fetch(`src/views/${normalizedPage}.html`, { cache: 'no-store' });
    if (!viewResponse.ok) {
      throw new Error(`Failed to load view "${normalizedPage}" (HTTP ${viewResponse.status})`);
    }

    const viewHTML = await viewResponse.text();
    const shouldWrapWithSidebar = layout.shouldInjectSidebarWrapper(normalizedPage);
    mainContent.innerHTML = shouldWrapWithSidebar
      ? layout.wrapPageWithPersistentSidebar(viewHTML, normalizedPage)
      : viewHTML;

    switch (normalizedPage) {
      case 'login': {
        if (topNav) topNav.innerHTML = '';
        const { initLogin } = await import('./viewmodels/authVM.js');
        await initLogin();
        break;
      }
      case 'dashboard': {
        const { initDashboard } = await import('./viewmodels/dashboardVM.js');
        await initDashboard();
        break;
      }
      case 'schedule': {
        const { initSchedule } = await import('./viewmodels/scheduleVM.js');
        await initSchedule();
        break;
      }
      case 'teams': {
        const { initTeams } = await import('./viewmodels/teamsVM.js');
        await initTeams();
        break;
      }
      case 'attendance': {
        const { initAttendance } = await import('./viewmodels/attendanceVM.js');
        await initAttendance();
        break;
      }
      case 'sessions': {
        const { initSessions } = await import('./viewmodels/sessionPlansVM.js');
        await initSessions();
        break;
      }
      case 'profile': {
        const { initProfile } = await import('./viewmodels/profileVM.js');
        await initProfile();
        break;
      }
      default:
        mainContent.innerHTML = '<p>Page not found</p>';
    }

    // Failsafe: ensure eligible routes always end up with the shared sidebar wrapper.
    if (layout.shouldInjectSidebarWrapper(normalizedPage) && !document.getElementById('persistent-announcements-list')) {
      mainContent.innerHTML = layout.wrapPageWithPersistentSidebar(mainContent.innerHTML, normalizedPage);
    }

    if (normalizedPage !== 'login' && AppState.isAuthenticated) {
      renderNav(AppState);
    }

    layout.bindSidebarCreateAnnouncementButtons();
    if (layout.shouldUsePersistentSidebar(normalizedPage)) {
      await layout.renderPersistentAnnouncementsSidebar();
    }
  } catch (error) {
    console.error('❌ Router error:', error);
    mainContent.innerHTML = `<div class="container"><div class="error-message">Error loading page: ${error.message}</div></div>`;
  }
}

// App startup flow: inject shared components -> restore auth -> preload data -> route.
async function initApp() {
  console.log('Initializing Swim Club Application...');

  await layout.injectSharedComponents();

  const storedUser = localStorage.getItem('currentUser');
  const token = localStorage.getItem('token');

  if (!storedUser || !token) {
    router('login');
    return;
  }

  try {
    AppState.setCurrentUser(JSON.parse(storedUser));
    await loadAppData();
    const hash = window.location.hash.slice(1) || 'dashboard';
    router(hash);
  } catch (error) {
    AppState.clearAuth();
    router('login');
  }
}

// Bootstrap app once DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Hash changes are treated as route changes in this SPA.
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1) || 'dashboard';
  router(hash);
  renderNav(AppState);
});

// Initial nav render after load when an authenticated session exists.
window.addEventListener('load', () => {
  setTimeout(() => {
    if (AppState.isAuthenticated) {
      renderNav(AppState);
    }
  }, 100);
});

// Lightweight helper for onclick-based navigation in static view templates.
window.goToPage = function(page) {
  window.location.hash = page;
};

export { AppState };

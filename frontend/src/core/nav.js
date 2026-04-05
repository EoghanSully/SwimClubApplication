// THIS FILE BUILDS THE TOP NAVIGATION BAR.

// RENDER NAV BASED ON CURRENT USER ROLE AND ACTIVE PAGE.
export function renderNav(AppState) {
  // FIND THE TOP NAV CONTAINER IN THE PAGE.
  const navContainer = document.getElementById('top-nav');
  // STOP IF THE CONTAINER IS NOT ON THIS VIEW.
  if (!navContainer) return;

  // READ CURRENT USER FROM SHARED STATE.
  const user = AppState.currentUser || {};

  // DEFINE ALL POSSIBLE MENU ITEMS AND ALLOWED ROLES.
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'schedule', label: 'Schedule', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'teams', label: 'Teams', memberLabel: 'My Teams', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'attendance', label: 'Attendance', roles: ['ADMIN', 'COACH'] },
    { id: 'sessions', label: 'Session Plans', roles: ['ADMIN', 'COACH'] },
    { id: 'profile', label: 'My Profile', roles: ['ADMIN', 'COACH', 'MEMBER'] }
  ];

  // KEEP ONLY MENU ITEMS THIS ROLE CAN OPEN.
  const userRole = user.role || 'MEMBER';
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));
  // TRACK THE ACTIVE HASH TO HIGHLIGHT CURRENT PAGE.
  const currentHash = window.location.hash.slice(1) || 'dashboard';

  // BUILD NAV HTML AND INJECT INTO THE CONTAINER.
  navContainer.innerHTML = `
    <nav class="top-nav">
      <div class="nav-container">
        <div class="nav-logo">
          <div class="logo-box" onclick="window.location.hash='dashboard'">UG</div>
          <div class="logo-text">
            <div class="logo-brand">Swim Club</div>
            <div class="logo-subtitle">University of Galway</div>
          </div>
        </div>

        <div class="nav-items">
          ${menuItems.map((item) => `
            <a href="#${item.id}" class="nav-item ${currentHash === item.id ? 'active' : ''}">
              <span class="nav-label">${userRole === 'MEMBER' && item.memberLabel ? item.memberLabel : item.label}</span>
            </a>
          `).join('')}
        </div>

        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div class="nav-user">
            <p class="user-name">${user.name || user.email || 'User'}</p>
            <p class="user-role">${userRole}</p>
          </div>
          <button class="logout-btn" onclick="logoutUser()">Logout</button>
        </div>
      </div>
    </nav>
  `;
}

// Top navigation rendering.

export function renderNav(AppState) {
  const navContainer = document.getElementById('top-nav');
  if (!navContainer) return;

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'schedule', label: 'Schedule', roles: ['ADMIN', 'COACH', 'MEMBER'] },
    { id: 'teams', label: 'Teams', roles: ['ADMIN', 'COACH'] },
    { id: 'attendance', label: 'Attendance', roles: ['ADMIN', 'COACH'] },
    { id: 'sessions', label: 'Session Plans', roles: ['ADMIN', 'COACH'] },
    { id: 'profile', label: 'My Profile', roles: ['ADMIN', 'COACH', 'MEMBER'] }
  ];

  // Show only routes the current role can access.
  const userRole = AppState.currentUser?.role || 'MEMBER';
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));
  const currentHash = window.location.hash.slice(1) || 'dashboard';

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
              <span class="nav-label">${item.label}</span>
            </a>
          `).join('')}
        </div>

        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div class="nav-user">
            <p class="user-name">${AppState.currentUser?.name || 'User'}</p>
            <p class="user-role">${AppState.currentUser?.role || 'MEMBER'}</p>
          </div>
          <button class="logout-btn" onclick="logoutUser()">Logout</button>
        </div>
      </div>
    </nav>
  `;
}

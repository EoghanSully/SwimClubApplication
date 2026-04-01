// Core app state and normalization helpers.

// Keep role values consistent across backend/frontend variants.
export function normalizeRole(role) {
  return typeof role === 'string' ? role.toUpperCase() : 'MEMBER';
}

export function normalizeUser(user) {
  if (!user) return null;

  const normalizedTeamIds = Array.isArray(user.teamIds)
    ? user.teamIds
    : user.teamId !== undefined && user.teamId !== null
      ? [user.teamId]
      : [];

  return {
    ...user,
    role: normalizeRole(user.role),
    teamIds: normalizedTeamIds
  };
}

// Single shared frontend state object used by app.js + viewmodels.
export const AppState = {
  currentUser: null,
  isAuthenticated: false,
  users: [],
  teams: [],
  events: [],
  announcements: [],
  sessionPlans: [],

  // Called on login/session restore.
  setCurrentUser(user) {
    const normalizedUser = normalizeUser(user);
    this.currentUser = normalizedUser;
    this.isAuthenticated = !!normalizedUser;
    localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
  },

  // Called on logout/unauthorized responses.
  clearAuth() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }
};

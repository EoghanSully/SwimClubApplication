// THIS FILE HOLDS GLOBAL APP STATE AND CLEANUP HELPERS.

// FORCE ROLE VALUES INTO A CONSISTENT UPPERCASE FORMAT.
export function normalizeRole(role) {
  return typeof role === 'string' ? role.toUpperCase() : 'MEMBER';
}

// NORMALISE USER SHAPE SO THE UI ALWAYS GETS THE SAME FIELDS.
export function normalizeUser(user) {
  // RETURN NULL FAST IF NO USER OBJECT EXISTS.
  if (!user) return null;

  // ACCEPT TEAM IDS FROM DIFFERENT POSSIBLE FIELD NAMES.
  const normalizedTeamIds = Array.isArray(user.teamIds)
    ? user.teamIds
    : user.teamId !== undefined && user.teamId !== null
      ? [user.teamId]
      : user.team_id !== undefined && user.team_id !== null
        ? [user.team_id]
      : [];

  // BUILD A FULL NAME WHEN FIRST/LAST NAME ARE AVAILABLE.
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  // RETURN ONE STANDARD USER OBJECT USED BY THE FRONTEND.
  return {
    id: user.id ?? user.user_id ?? null,
    name: user.name || fullName || user.email || 'User',
    email: user.email || '',
    role: normalizeRole(user.role ?? user.user_role),
    teamIds: normalizedTeamIds
  };
}

// SHARED APP STATE USED BY APP, LAYOUT, AND VIEWMODELS.
export const AppState = {
  currentUser: null,
  isAuthenticated: false,
  users: [],
  teams: [],
  events: [],
  announcements: [],
  sessionPlans: [],

  // SAVE A NORMALIZED USER INTO STATE AND LOCAL STORAGE.
  setCurrentUser(user) {
    const normalizedUser = normalizeUser(user);
    this.currentUser = normalizedUser;
    this.isAuthenticated = !!normalizedUser;
    localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
  },

  // CLEAR AUTH STATE AND REMOVE SAVED SESSION DATA.
  clearAuth() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }
};

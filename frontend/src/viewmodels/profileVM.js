import { AppState } from '../app.js';
import { formatDateLong } from '../utils/date.js';

// GET USER PROFILE DATA FROM CURRENT APP STATE.
export async function getProfile(userId) {
  try {
    const user = AppState.currentUser && AppState.currentUser.id === userId ? AppState.currentUser : null;
    if (!user) return null;

    const teams = (user.teamIds || []).map((teamId) => {
      const matchedTeam = (AppState.teams || []).find((team) => team.id === teamId);
      return {
        id: teamId,
        name: matchedTeam?.name || `Team ${teamId}`
      };
    });
    
    return {
      ...user,
      teams
    };
  } catch (error) {
    console.error('Error getting profile:', error.stack);
    return null;
  }
}

// FORMAT JOINED DATE INTO MONTH/YEAR WITH A SAFE DEFAULT.
function formatJoinedDate(joinedDate) {
  if (!joinedDate) return 'January 2023';

  const parsed = new Date(joinedDate);
  if (Number.isNaN(parsed.getTime())) return 'January 2023';

  return parsed.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
}

// BUILD AVATAR INITIAL FROM DISPLAY NAME.
function getAvatarText(name = 'User') {
  const trimmed = String(name).trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
}

// BUILD A SHORT TEAM BADGE TOKEN FROM TEAM NAME WORD INITIALS.
function getTeamBadge(teamName = '') {
  return teamName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'SQ';
}

// INITIALISE PROFILE HEADER, BASICS, AND TEAM/SQUAD DISPLAY.
export async function initProfile() {
  console.log('👤 Initializing Profile...');
  const user = AppState.currentUser;
  if (!user) return;

  const profile = await getProfile(user.id);
  if (!profile) return;

  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-header-name');
  const profileRole = document.getElementById('profile-header-role');
  const basicInfo = document.getElementById('profile-basic-info');
  const squadsContainer = document.getElementById('profile-squads');

  if (profileAvatar) profileAvatar.textContent = getAvatarText(profile.name);
  if (profileName) profileName.textContent = profile.name;
  if (profileRole) profileRole.textContent = profile.role;

  if (basicInfo) {
    basicInfo.innerHTML = `
      <div class="profile-basic-row">
        <span class="profile-basic-label">Email Address</span>
        <div class="profile-basic-value">${profile.email || 'N/A'}</div>
      </div>
      <div class="profile-basic-row">
        <span class="profile-basic-label">Phone Number</span>
        <div class="profile-basic-value">${profile.phone || 'N/A'}</div>
      </div>
      <div class="profile-basic-row">
        <span class="profile-basic-label">Account Role</span>
        <div class="profile-basic-value">${profile.role}</div>
      </div>
      <div class="profile-basic-row">
        <span class="profile-basic-label">Member Since</span>
        <div class="profile-basic-value">${formatJoinedDate(profile.joinedDate)}</div>
      </div>
    `;
  }

  if (squadsContainer) {
    if (profile.teams.length > 0) {
      squadsContainer.innerHTML = profile.teams.map((team) => `
        <div class="profile-squad-card">
          <div class="profile-squad-icon">${getTeamBadge(team.name)}</div>
          <div>
            <div class="profile-squad-name">${team.name}</div>
            <div class="profile-squad-status">Active Member</div>
          </div>
        </div>
      `).join('');
    } else {
      squadsContainer.innerHTML = '<p class="profile-empty-state">No squads assigned</p>';
    }
  }
}

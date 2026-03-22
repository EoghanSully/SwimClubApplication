// ============================================
// TEAMS VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import * as teamModel from '../models/teamModel.js';
import * as userModel from '../models/userModel.js';

let teamsList = [];
let usersList = [];
let attendanceList = [];
let currentMembers = [];

/**
 * Load all teams from backend
 */
export async function loadTeams() {
  try {
    teamsList = await teamModel.getAllTeams();
    usersList = await userModel.getAllUsers();
    console.log("Teams loaded in view model:", teamsList);
    if(teamsList.length === 0) {
      console.warn("No teams found. Check backend API and database.");
    }
    return teamsList;
  } catch (error) {
    console.error('Error loading teams:', error.stack);
    throw error;
  }
}

/**
 * Get teams user can access
 */
export async function getAccessibleTeams(user, role) {
  try {
    const teams = teamsList.length ? teamsList : (await loadTeams());
    
    if (role === 'ADMIN') {
      return teams;
    } else if (role === 'COACH') {
      return teams.filter(t => t.coachIds && t.coachIds.includes(user.id));
    }
    return [];
  } catch (error) {
    console.error('Error getting accessible teams:', error.stack);
    return [];
  }
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId) {
  try {
    const users = usersList.length ? usersList : (await userModel.getAllUsers());
    return users.filter(u => u.teamIds && u.teamIds.includes(teamId));
  } catch (error) {
    console.error('Error getting team members:', error.stack);
    return [];
  }
}

/**
 * Get team coaches
 */
export async function getTeamCoaches(teamId) {
  try {
    const teams = teamsList.length ? teamsList : (await loadTeams());
    const users = usersList.length ? usersList : (await userModel.getAllUsers());
    const team = teams.find(t => t.id === teamId);
    
    if (!team || !team.coachIds) return [];
    return users.filter(u => team.coachIds.includes(u.id));
  } catch (error) {
    console.error('Error getting team coaches:', error.stack);
    return [];
  }
}

/**
 * Get team details with members and coaches
 */
export async function getTeamDetails(teamId) {
  try {
    const teams = teamsList.length ? teamsList : (await loadTeams());
    const team = teams.find(t => t.id === teamId);
    
    if (!team) return null;
    
    return {
      ...team,
      members: await getTeamMembers(teamId),
      coaches: await getTeamCoaches(teamId)
    };
  } catch (error) {
    console.error('Error getting team details:', error.stack);
    return null;
  }
}

/**
 * Filter members by search term
 */
export function filterMembers(members, searchTerm, roleFilter = 'ALL') {
  return members.filter(member => {
    // Search filter
    if (searchTerm && !member.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Role filter
    if (roleFilter !== 'ALL' && member.role !== roleFilter) {
      return false;
    }
    
    return true;
  });
}

function renderMemberList(members) {
  const membersContainer = document.getElementById('members-list');
  if (!membersContainer) return;

  if (!members.length) {
    membersContainer.innerHTML = '<div class="no-members">No members found</div>';
    return;
  }

  membersContainer.innerHTML = members.map(member => `
    <div class="member-card" onclick="viewMemberProfile('${member.id}')">
      <div class="member-avatar">${member.name.charAt(0)}</div>
      <div class="member-info">
        <h4 class="member-name">${member.name}</h4>
        <p class="member-email">${member.email}</p>
      </div>
      <div class="member-meta">
        <span class="member-role-badge ${member.role.toLowerCase()}">${member.role}</span>
      </div>
      <div class="member-action">→</div>
    </div>
  `).join('');
}

window.filterMembers = function () {
  const searchTerm = document.getElementById('member-search')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('role-filter')?.value || 'ALL';

  const filtered = filterMembers(currentMembers, searchTerm, roleFilter);
  renderMemberList(filtered);
};

window.viewMemberProfile = async function (memberId) {
  const member = usersList.find(u => u.id === memberId);
  if (!member) return;

  const stats = await getMemberStats(memberId);

  document.getElementById('profile-member-name').textContent = member.name;
  document.getElementById('profile-member-role').textContent = member.role;

  const profileContent = document.getElementById('profile-content');
  if (!profileContent) return;

  profileContent.innerHTML = `
    <div class="profile-grid">
      <div class="profile-section">
        <h3 class="profile-section-title">Personal Information</h3>
        <div class="profile-info-grid">
          <div class="profile-info-item"><span class="info-label">Full Name</span><span class="info-value">${member.name}</span></div>
          <div class="profile-info-item"><span class="info-label">Email</span><span class="info-value">${member.email}</span></div>
          <div class="profile-info-item"><span class="info-label">Phone</span><span class="info-value">${member.phone || 'N/A'}</span></div>
          <div class="profile-info-item"><span class="info-label">Joined Date</span><span class="info-value">${formatDate(member.joinedDate)}</span></div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Teams</h3>
        <div class="profile-teams-list">
          ${(stats.teams.length > 0 ? stats.teams.map(t => `<div class="profile-team-badge">${t}</div>`).join('') : '<p class="no-data">Not assigned to any teams</p>')}
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Attendance Stats</h3>
        <div class="attendance-stats-grid">
          <div class="stat-card"><div class="stat-card-value">${stats.attended}</div><div class="stat-card-label">Sessions Attended</div></div>
          <div class="stat-card"><div class="stat-card-value">${stats.absent}</div><div class="stat-card-label">Sessions Missed</div></div>
          <div class="stat-card"><div class="stat-card-value">${stats.attendanceRate}%</div><div class="stat-card-label">Attendance Rate</div></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('member-profile-modal').style.display = 'flex';
};

window.closeMemberProfileModal = function () {
  const modal = document.getElementById('member-profile-modal');
  if (modal) modal.style.display = 'none';
};

/**
 * Get member stats (placeholder - would need attendance data)
 */
export async function getMemberStats(userId) {
  // Mock implementation - would require attendance model
  return {
    attended: 0,
    absent: 0,
    teams: [],
    attendanceRate: 0
  };
}

export async function initTeams() {
  console.log('👥 Initializing Teams...');
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';

  const select = document.getElementById('team-select');
  if (!select) return;

  const teams = await getAccessibleTeams(user, role);

  select.innerHTML = '<option value="">Choose a team...</option>' + teams.map(team => `
    <option value="${team.id}">${team.name}</option>
  `).join('');

  select.addEventListener('change', async () => {
    const selectedTeamId = select.value;
    if (!selectedTeamId) {
      document.getElementById('team-details-section').style.display = 'none';
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    const details = await getTeamDetails(selectedTeamId);

    if (!details) return;

    document.getElementById('team-details-section').style.display = 'block';
    document.getElementById('empty-state').style.display = 'none';

    document.getElementById('team-name').textContent = details.name;
    document.getElementById('team-coaches').innerHTML = details.coaches.length > 0
      ? details.coaches.map(c => `<span class="coach-badge">${c.name}</span>`).join('')
      : '<span class="no-coaches">No coaches assigned</span>';
    document.getElementById('team-member-count').textContent = details.members.length;

    window.currentMembers = details.members;
    filterMembers();
  });
}


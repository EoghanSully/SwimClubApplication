// ============================================
// PROFILE VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import { formatDate } from '../utils/date.js';
import * as userModel from '../models/userModel.js';
import * as teamModel from '../models/teamModel.js';
import * as eventModel from '../models/eventsModel.js';

let usersList = [];
let teamsList = [];
let eventsList = [];

/**
 * Get user profile data
 */
export async function getProfile(userId) {
  try {
    usersList = usersList.length ? usersList : (await userModel.getAllUsers());
    teamsList = teamsList.length ? teamsList : (await teamModel.getAllTeams());
    
    const user = usersList.find(u => u.id === userId);
    if (!user) return null;
    
    // Get user's teams
    const teams = user.teamIds 
      ? teamsList.filter(t => user.teamIds.includes(t.id))
      : [];
    
    // Get attendance stats (placeholder - would require attendance model)
    const stats = {
      attended: 0,
      absent: 0,
      total: 0,
      attendanceRate: 0
    };
    
    return {
      ...user,
      teams,
      stats
    };
  } catch (error) {
    console.error('Error getting profile:', error.stack);
    return null;
  }
}

/**
 * Get user's upcoming events
 */
export async function getUserUpcomingEvents(userId) {
  try {
    usersList = usersList.length ? usersList : (await userModel.getAllUsers());
    eventsList = eventsList.length ? eventsList : (await eventModel.getAllEvents());
    
    const user = usersList.find(u => u.id === userId);
    if (!user) return [];
    
    const now = new Date();
    
    return eventsList
      .filter(e => {
        const eventDate = new Date(`${e.date}T${e.startTime}`);
        if (eventDate < now) return false;
        
        return (user.teamIds && user.teamIds.includes(e.teamId)) || e.teamId === 'CLUB';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  } catch (error) {
    console.error('Error getting user upcoming events:', error.stack);
    return [];
  }
}

/**
 * Get student/club ID (mock)
 */
export function getStudentId(userId) {
  return userId.replace('u', '');
}

export async function initProfile() {
  console.log('👤 Initializing Profile...');
  const user = AppState.currentUser;
  if (!user) return;

  const profile = await getProfile(user.id);
  const upcomingEvents = await getUserUpcomingEvents(user.id);

  // Header
  const profileAvatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-header-name');
  const profileRole = document.getElementById('profile-header-role');
  const profileJoined = document.getElementById('profile-header-joined');

  if (profileAvatar) profileAvatar.textContent = profile.name?.charAt(0) || 'U';
  if (profileName) profileName.textContent = profile.name;
  if (profileRole) profileRole.textContent = profile.role;
  if (profileJoined) profileJoined.textContent = `Member since ${formatDate(profile.joinedDate)}`;

  // Info sections
  const personalInfo = document.getElementById('personal-info');
  const contactInfo = document.getElementById('contact-info');
  const teamsContainer = document.getElementById('profile-teams');
  const statsContainer = document.getElementById('profile-stats');
  const eventsContainer = document.getElementById('profile-events');

  if (personalInfo) {
    personalInfo.innerHTML = `
      <div class="profile-info-row"><span class="profile-info-label">Full Name</span><span class="profile-info-value">${profile.name}</span></div>
      <div class="profile-info-row"><span class="profile-info-label">Student ID</span><span class="profile-info-value">#${getStudentId(profile.id)}</span></div>
      <div class="profile-info-row"><span class="profile-info-label">Portal Role</span><span class="profile-info-value">${profile.role}</span></div>
      <div class="profile-info-row"><span class="profile-info-label">Member Since</span><span class="profile-info-value">${formatDateLong(profile.joinedDate)}</span></div>
    `;
  }

  if (contactInfo) {
    contactInfo.innerHTML = `
      <div class="profile-info-row"><span class="profile-info-label">Email Address</span><span class="profile-info-value">${profile.email}</span></div>
      <div class="profile-info-row"><span class="profile-info-label">Phone Number</span><span class="profile-info-value">${profile.phone || 'N/A'}</span></div>
      <div class="profile-info-row"><span class="profile-info-label">University</span><span class="profile-info-value">University of Galway</span></div>
    `;
  }

  if (teamsContainer) {
    if (profile.teams.length > 0) {
      teamsContainer.innerHTML = profile.teams.map(team => `
        <div class="profile-team-card"><div class="profile-team-icon">${team.name.charAt(0)}</div><div class="profile-team-name">${team.name}</div></div>
      `).join('');
    } else {
      teamsContainer.innerHTML = '<p class="no-data">Not assigned to any teams</p>';
    }
  }

  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="profile-stat-card"><div class="profile-stat-value">${profile.stats.attended}</div><div class="profile-stat-label">Sessions Attended</div></div>
      <div class="profile-stat-card"><div class="profile-stat-value">${profile.stats.absent}</div><div class="profile-stat-label">Sessions Missed</div></div>
      <div class="profile-stat-card"><div class="profile-stat-value">${profile.stats.total}</div><div class="profile-stat-label">Total Sessions</div></div>
      <div class="profile-stat-card highlight"><div class="profile-stat-value">${profile.stats.attendanceRate}%</div><div class="profile-stat-label">Attendance Rate</div></div>
    `;
  }

  if (eventsContainer) {
    if (upcomingEvents.length > 0) {
      eventsContainer.innerHTML = upcomingEvents.map(event => `
        <div class="profile-event-card">
          <div class="profile-event-date"><div class="profile-event-month">${new Date(event.date).toLocaleString('en-IE', { month: 'short'})}</div><div class="profile-event-day">${new Date(event.date).getDate()}</div></div>
          <div class="profile-event-info"><h4 class="profile-event-title">${event.title}</h4><p class="profile-event-time">⏰ ${event.startTime} - ${event.endTime}</p><p class="profile-event-location">📍 ${event.location}</p></div>
          <span class="profile-event-type ${event.type.toLowerCase()}">${event.type}</span>
        </div>
      `).join('');
    } else {
      eventsContainer.innerHTML = '<p class="no-data">No upcoming events</p>';
    }
  }
}

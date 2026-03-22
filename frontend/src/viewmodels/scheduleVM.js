/**
 * Schedule ViewModel  
 * Manages calendar view, event filtering, and event modal
 */

import { AppState } from '../app.js';
import { apiGet } from '../utils/api.js';
import { getCalendarDays, isSameDay, formatDate, formatTime, isSessionPast, eventTypeLabel, eventTypeToColor } from '../utils/date.js';

let currentDate = new Date();
let selectedDay = null;
let selectedEvent = null;
let filterTeamId = null;
let filterEventType = 'ALL';

export async function initSchedule() {
  console.log('📅 Initializing Schedule...');
  
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';
  
  try {
    const events = AppState.events.length ? AppState.events : (await apiGet('/events') || []);
    const teams = AppState.teams.length ? AppState.teams : (await apiGet('/teams') || []);
    
    // Render calendar
    renderCalendar(events, user, role);
    
    // Render team filter
    renderTeamFilter(teams, user, role);
    
    // Attach listeners
    attachScheduleListeners(events, user, role);
    
  } catch (error) {
    console.error('❌ Schedule error:', error);
  }
}

function getFilteredEvents(allEvents, user, role) {
  return allEvents.filter(event => {
    // Role-based visibility
    if (role === 'MEMBER') {
      if (!event.teamId || event.teamId === 'CLUB') return true;
      return user.teamIds?.includes(event.teamId);
    }
    
    if (role === 'COACH') {
      if (!event.teamId || event.teamId === 'CLUB') return true;
      const team = AppState.teams.find(t => t.id === event.teamId);
      return team?.coachIds?.includes(user.id);
    }
    
    return true; // Admin sees all
  }).filter(event => {
    // Apply team filter
    if (filterTeamId && event.teamId !== filterTeamId) return false;
    
    // Apply event type filter
    if (filterEventType !== 'ALL' && event.type !== filterEventType) return false;
    
    return true;
  });
}

function renderCalendar(allEvents, user, role) {
  const calendarContainer = document.getElementById('calendar-grid');
  if (!calendarContainer) return;
  
  const filteredEvents = getFilteredEvents(allEvents, user, role);
  const days = getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  
  // Render month/year header
  const monthYearDiv = document.getElementById('calendar-month-year');
  if (monthYearDiv) {
    monthYearDiv.textContent = currentDate.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
  }
  
  // Render calendar grid
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = dayLabels.map(label => `<div class="calendar-day-label">${label}</div>`).join('');
  
  html += days.map(day => {
    if (!day) return '<div class="calendar-empty"></div>';
    
    const dayEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return isSameDay(eventDate, day);
    });
    
    const isToday = isSameDay(day, today);
    const isSelected = selectedDay && isSameDay(day, selectedDay);
    
    const indicators = dayEvents.slice(0, 3).map(e => `
      <div class="event-indicator" style="background-color: ${eventTypeToColor(e.type)}"></div>
    `).join('');
    
    return `
      <button class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
              onclick="selectDay(new Date('${day.toISOString()}'), ${dayEvents.length} events)">
        <div class="calendar-day-num">${day.getDate()}</div>
        <div class="calendar-indicators">${indicators}</div>
      </button>
    `;
  }).join('');
  
  calendarContainer.innerHTML = html;
}

function renderTeamFilter(teams, user, role) {
  const filterContainer = document.getElementById('schedule-filters');
  if (!filterContainer) return;
  
  const availableTeams = role === 'ADMIN' ? teams : 
    teams.filter(t => user.teamIds?.includes(t.id) || 
                     (role === 'COACH' && t.coachIds?.includes(user.id)));
  
  filterContainer.innerHTML = `
    <div class="filter-row">
      <select id="team-filter" class="form-input" style="width: auto; padding: 0.5rem 1rem;">
        <option value="">All Teams</option>
        ${availableTeams.map(team => `
          <option value="${team.id}">${team.name}</option>
        `).join('')}
      </select>
      
      <div class="filter-buttons">
        <button class="filter-btn active" data-type="ALL">All</button>
        <button class="filter-btn" data-type="TRAINING">Training</button>
        <button class="filter-btn" data-type="COMPETITION">Competition</button>
        <button class="filter-btn" data-type="SOCIAL">Social</button>
        <button class="filter-btn" data-type="SOCIETY">Society</button>
      </div>
    </div>
  `;
}

function renderDayEvents(events) {
  const dayEventsContainer = document.getElementById('day-events');
  if (!dayEventsContainer) return;
  
  if (events.length === 0) {
    dayEventsContainer.innerHTML = '<div class="empty-state"><p>No events on this day</p></div>';
    return;
  }
  
  dayEventsContainer.innerHTML = events.map(e => `
    <button class="event-list-item" onclick="openEventModal(${JSON.stringify(e).replace(/"/g, '&quot;')})">
      <div class="event-item-header">
        <span class="event-type-badge" style="background-color: ${eventTypeToColor(e.type)}">
          ${e.type}
        </span>
        <h4>${e.title}</h4>
      </div>
      <p class="event-item-time">🕐 ${e.startTime} - ${e.endTime}</p>
      <p class="event-item-location">📍 ${e.location}</p>
      ${e.teamId ? `<p class="event-item-team">👥 Team</p>` : ''}
    </button>
  `).join('');
}

function renderEventModal(event) {
  const modal = document.getElementById('event-modal');
  if (!modal) return;
  
  const isPast = isSessionPast(event.date, event.startTime);
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header" style="background-color: ${eventTypeToColor(event.type)}">
        <div>
          <p style="color: white; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.5rem;">
            ${formatDate(event.date)}
          </p>
          <h2 style="color: white;">${event.title}</h2>
        </div>
        <button class="modal-close-btn" onclick="closeEventModal()">×</button>
      </div>
      
      <div class="modal-body">
        <div class="event-detail-section">
          <div class="detail-icon">📅</div>
          <div>
            <p class="detail-label">Date & Time</p>
            <p>${formatDate(event.date)}</p>
            <p>${event.startTime} - ${event.endTime}</p>
          </div>
        </div>
        
        <div class="event-detail-section">
          <div class="detail-icon">📍</div>
          <div>
            <p class="detail-label">Location</p>
            <p>${event.location}</p>
          </div>
        </div>
        
        ${event.teamId ? `
          <div class="event-detail-section">
            <div class="detail-icon">👥</div>
            <div>
              <p class="detail-label">Team</p>
              <p>${AppState.teams.find(t => t.id === event.teamId)?.name || 'Team'}</p>
            </div>
          </div>
        ` : ''}
        
        <div class="event-detail-section">
          <div class="detail-icon">ℹ️</div>
          <div>
            <p class="detail-label">Description</p>
            <p>${event.description || 'No description'}</p>
          </div>
        </div>
        
        ${event.type === 'TRAINING' && (AppState.currentUser.role === 'ADMIN' || AppState.currentUser.role === 'COACH') 
          ? `
            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
              <button class="btn btn-success" onclick="goToPage('sessions')">
                📋 View Session Plan
              </button>
              <button class="btn btn-primary" onclick="goToPage('attendance')">
                ✅ Mark Attendance
              </button>
            </div>
          ` : ''}
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

function attachScheduleListeners(allEvents, user, role) {
  // Prev/Next month buttons
  const prevBtn = document.getElementById('calendar-prev');
  const nextBtn = document.getElementById('calendar-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(allEvents, user, role);
      attachScheduleListeners(allEvents, user, role);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(allEvents, user, role);
      attachScheduleListeners(allEvents, user, role);
    });
  }
  
  // Team filter
  const teamFilter = document.getElementById('team-filter');
  if (teamFilter) {
    teamFilter.addEventListener('change', (e) => {
      filterTeamId = e.target.value || null;
      renderCalendar(allEvents, user, role);
      if (selectedDay) {
        const dayEvents = getFilteredEvents(allEvents, user, role).filter(e => {
          const eventDate = new Date(e.date);
          return isSameDay(eventDate, selectedDay);
        });
        renderDayEvents(dayEvents);
      }
      attachScheduleListeners(allEvents, user, role);
    });
  }
  
  // Event type filters
  const typeFilterBtns = document.querySelectorAll('.filter-btn[data-type]');
  typeFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      typeFilterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filterEventType = e.target.dataset.type;
      renderCalendar(allEvents, user, role);
      if (selectedDay) {
        const dayEvents = getFilteredEvents(allEvents, user, role).filter(e => {
          const eventDate = new Date(e.date);
          return isSameDay(eventDate, selectedDay);
        });
        renderDayEvents(dayEvents);
      }
      attachScheduleListeners(allEvents, user, role);
    });
  });
}

// Global functions for onclick handlers
window.selectDay = function(day, count) {
  selectedDay = day;
  const filteredEvents = getFilteredEvents(AppState.events, AppState.currentUser, AppState.currentUser.role);
  const dayEvents = filteredEvents.filter(e => {
    const eventDate = new Date(e.date);
    return isSameDay(eventDate, day);
  });
  renderDayEvents(dayEvents);
  renderCalendar(AppState.events, AppState.currentUser, AppState.currentUser.role);
};

window.openEventModal = function(event) {
  renderEventModal(event);
};

window.closeEventModal = function() {
  const modal = document.getElementById('event-modal');
  if (modal) modal.classList.add('hidden');
};

window.goToPage = function(page) {
  closeEventModal();
  window.location.hash = page;
};

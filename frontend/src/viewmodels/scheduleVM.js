/**
 * Schedule ViewModel  
 * Manages calendar view, event filtering, and event modal
 */

import { AppState } from '../app.js';
import * as eventModel from '../models/eventsModel.js';
import * as teamModel from '../models/teamModel.js';
import { getCalendarDays, isSameDay, formatDateLong, formatTime, eventTypeLabel, eventTypeToColor } from '../utils/date.js';
import { loadComponent, renderTemplate } from '../utils/components.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getEventAudienceLabel(event) {
  if (event.teamId) {
    return AppState.teams.find((team) => Number(team.id) === Number(event.teamId))?.name || 'Team Event';
  }

  if (event.audience === 'coach') return 'Coaches';
  if (event.audience === 'team') return 'Team Event';
  return 'All Club';
}

// ============================================
// MODAL FUNCTIONS (Global)
// ============================================
window.openCreateEventModal = function () {
  const modal = document.getElementById('create-event-modal');
  if (modal) {
    modal.style.setProperty('display', 'flex', 'important');
  }
};

window.closeCreateEventModal = function () {
  const modal = document.getElementById('create-event-modal');
  const form = document.getElementById('create-event-form');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
    if (form) form.reset();
  }
};

let currentDate = new Date();
let selectedDay = null;
let filterTeamId = null;
let filterEventType = 'ALL';

export async function initSchedule() {
  console.log('📅 Initializing Schedule...');
  
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';
  
  try {
  let events = AppState.events;
  if (!events.length) {
    try {
      events = await eventModel.getAllEvents();
      AppState.events = events;
    } catch (e) {
      console.warn('Could not load events for schedule:', e.message);
      events = [];
    }
  }

  let teams = AppState.teams.length ? AppState.teams : [];
  if (!teams.length) {
    try {
      teams = await teamModel.getAllTeams();
      AppState.teams = teams;
    } catch (e) {
      console.warn('Could not load teams for schedule:', e.message);
      teams = [];
    }
  }

  // Always render the calendar grid (even if empty)
  renderCalendar(events, user, role);
  renderTeamFilter(teams, user, role);
  attachScheduleListeners(events, user, role);
  setupCreateEvent(events, teams, user, role);
  } catch (err) {
    console.error('Schedule init error:', err);
  }
}

function setupCreateEvent(events, teams, user, role) {
  const createBtn = document.getElementById('create-event-btn');
  const emptyCreateBtn = document.getElementById('create-event-empty-btn');
  const modal = document.getElementById('create-event-modal');
  const form = document.getElementById('create-event-form');
  const audienceSelect = document.getElementById('event-audience');
  const teamGroup = document.getElementById('event-team-group');
  const teamSelect = document.getElementById('event-team-select');

  if (!createBtn || !modal || !form || !audienceSelect || !teamGroup || !teamSelect) return;

  if (role !== 'ADMIN' && role !== 'COACH') {
    createBtn.style.display = 'none';
    if (emptyCreateBtn) emptyCreateBtn.style.display = 'none';
    return;
  }

  createBtn.style.setProperty('display', 'inline-flex', 'important');
  if (emptyCreateBtn) {
    emptyCreateBtn.style.setProperty('display', 'inline-flex', 'important');
  }

  const scopedTeams = role === 'ADMIN'
    ? teams
    : teams.filter((team) => team.coachIds?.includes(user.id) || user.coachTeamIds?.includes(team.id));

  teamSelect.innerHTML = '<option value="">Select team</option>' + scopedTeams.map((team) => `
    <option value="${team.id}">${team.name}</option>
  `).join('');

  if (role === 'COACH') {
    audienceSelect.innerHTML = '<option value="team">Specific Team</option>';
    audienceSelect.value = 'team';
    if (scopedTeams.length === 1) {
      teamSelect.value = String(scopedTeams[0].id);
    }
  }

  const toggleTeamGroup = () => {
    const show = audienceSelect.value === 'team';
    teamGroup.style.display = show ? 'block' : 'none';

    if (show && !teamSelect.value && scopedTeams.length === 1) {
      teamSelect.value = String(scopedTeams[0].id);
    }
  };

  audienceSelect.addEventListener('change', toggleTeamGroup);
  toggleTeamGroup();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const eventDate = formData.get('eventDate');
    const startTime = formData.get('startTime');
    const durationMinutes = Number(formData.get('durationMinutes') || 60);
    const audience = role === 'COACH' ? 'team' : formData.get('audience');
    const rawTeamId = formData.get('teamId');
    const parsedTeamId = rawTeamId !== null && String(rawTeamId).trim() !== ''
      ? Number(rawTeamId)
      : null;

    if (audience === 'team' && (!parsedTeamId || Number.isNaN(parsedTeamId))) {
      alert('Please select a team for a team-specific event.');
      return;
    }

    const payload = {
      category: formData.get('category'),
      title: formData.get('title'),
      venue: formData.get('venue'),
      description: formData.get('description') || '',
      duration: minutesToInterval(durationMinutes),
      event_date: `${eventDate}T${startTime}:00.000Z`,
      status: 'scheduled',
      audience,
      team_id: parsedTeamId
    };

    try {
      await eventModel.createNewEvent(payload);
      const updatedEvents = await eventModel.getAllEvents();
      AppState.events = updatedEvents;
      renderCalendar(updatedEvents, user, role);
      if (selectedDay) {
        const dayEvents = getFilteredEvents(updatedEvents, user, role).filter((event) => {
          const eventDate = new Date(event.date);
          return isSameDay(eventDate, selectedDay);
        });
        renderDayEvents(dayEvents);
      }
      window.closeCreateEventModal();
    } catch (err) {
      console.error('Create event failed:', err);
      alert(err.message || 'Unable to create event');
    }
  });
}

function minutesToInterval(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
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
              onclick="selectDay(new Date('${day.toISOString()}'))">
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
      <select id="team-filter" class="form-input schedule-team-select">
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

async function renderDayEvents(events) {
  const dayEventsContainer = document.getElementById('day-events');
  const canCreate = ['ADMIN', 'COACH'].includes(AppState.currentUser?.role);
  if (!dayEventsContainer) return;
  
  if (events.length === 0) {
    dayEventsContainer.innerHTML = `
      <div class="empty-state">
        <p>No events on this day</p>
        ${canCreate ? '<button class="btn btn-primary create-event-empty-btn" onclick="window.openCreateEventModal()">+ Create Event</button>' : ''}
      </div>
    `;
    return;
  }
  
  const cardTemplate = await loadComponent('event-card');
  dayEventsContainer.innerHTML = events.map(e => renderTemplate(cardTemplate, {
    eventJson: JSON.stringify(e).replace(/"/g, '&quot;'),
    typeColor: eventTypeToColor(e.type),
    type: e.type,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    location: e.location,
    teamBadge: e.teamId ? '<p class="event-item-team">👥 Team</p>' : ''
  })).join('');
}

function renderEventModal(event) {
  const modal = document.getElementById('event-modal');
  const title = document.getElementById('event-modal-title');
  const meta = document.getElementById('event-modal-meta');
  const content = document.getElementById('event-modal-content');
  if (!modal || !title || !meta || !content) return;

  const eventType = eventTypeLabel(event.type || event.category || 'EVENT');
  const audienceLabel = getEventAudienceLabel(event);
  const safeDescription = escapeHtml(event.description || 'No description provided.').replace(/\n/g, '<br>');

  title.textContent = event.title || 'Event Details';
  meta.textContent = `${eventType} • ${audienceLabel}`;
  content.innerHTML = `
    <div class="event-modal-meta-card">
      <div class="event-modal-meta-item">
        <span class="event-modal-meta-icon">📅</span>
        <div>
          <div class="event-modal-meta-label">Date</div>
          <div class="event-modal-meta-value">${escapeHtml(formatDateLong(event.date))}</div>
        </div>
      </div>
      <div class="event-modal-meta-item">
        <span class="event-modal-meta-icon">🕐</span>
        <div>
          <div class="event-modal-meta-label">Time</div>
          <div class="event-modal-meta-value">${escapeHtml(formatTime(event.startTime))} - ${escapeHtml(formatTime(event.endTime))}</div>
        </div>
      </div>
      <div class="event-modal-meta-item">
        <span class="event-modal-meta-icon">📍</span>
        <div>
          <div class="event-modal-meta-label">Location</div>
          <div class="event-modal-meta-value">${escapeHtml(event.location || 'TBC')}</div>
        </div>
      </div>
      <div class="event-modal-meta-item">
        <span class="event-modal-meta-icon">👥</span>
        <div>
          <div class="event-modal-meta-label">Audience</div>
          <div class="event-modal-meta-value">${escapeHtml(audienceLabel)}</div>
        </div>
      </div>
    </div>
    <div class="event-modal-type-badge" style="background: ${eventTypeToColor(event.type)};">${escapeHtml(event.type || 'EVENT')}</div>
    <div class="event-modal-section-title">${escapeHtml(event.title || 'Event')}</div>
    <div class="event-modal-description">
      ${safeDescription}
    </div>
  `;

  modal.style.setProperty('display', 'flex', 'important');
}

function attachScheduleListeners(allEvents, user, role) {
  // Prev/Next month buttons
  const prevBtn = document.getElementById('calendar-prev');
  const nextBtn = document.getElementById('calendar-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(allEvents, user, role);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(allEvents, user, role);
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
    });
  });
}

// Global functions for onclick handlers
window.selectDay = function(day) {
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
  if (modal) modal.style.setProperty('display', 'none', 'important');
};

window.goToPage = function(page) {
  closeEventModal();
  window.location.hash = page;
};

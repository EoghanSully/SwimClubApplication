import { AppState } from '../app.js';
import { apiGet, apiPost } from '../utils/api.js';
import { adaptEventRow } from '../utils/adapters.js';
import { loadComponent, renderTemplate } from '../utils/components.js';

let allEvents = [];
let filteredEvents = [];
let selectedEvent = null;
let currentAttendees = [];
const pendingChanges = new Map();
const eventAttendanceStats = new Map();

function toAttendanceStats(attendees) {
  let present = 0;
  let absent = 0;

  (attendees || []).forEach((attendee) => {
    if (attendee?.present) present += 1;
    else absent += 1;
  });

  return { present, absent };
}

async function preloadAttendanceStats(events) {
  const requests = events.map(async (event) => {
    try {
      const response = await apiGet(`/events/${event.id}/attendance`);
      const attendees = Array.isArray(response?.data) ? response.data : [];
      eventAttendanceStats.set(Number(event.id), toAttendanceStats(attendees));
    } catch (error) {
      console.warn(`Could not preload attendance stats for event ${event.id}:`, error.message);
      eventAttendanceStats.set(Number(event.id), { present: 0, absent: 0 });
    }
  });

  await Promise.allSettled(requests);
}

function formatDisplayDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unknown Date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

function formatDisplayTimeRange(event) {
  if (!event?.startTime || !event?.endTime) return 'Time TBC';
  return `${event.startTime} - ${event.endTime}`;
}

function resolveTeamName(teamId) {
  if (!teamId) return 'Club Session';
  return AppState.teams.find((team) => Number(team.id) === Number(teamId))?.name || 'Team Session';
}

function getCoachTeamScope(user) {
  if (Array.isArray(user?.coachTeamIds) && user.coachTeamIds.length) {
    return user.coachTeamIds.map(Number);
  }
  if (Array.isArray(user?.teamIds) && user.teamIds.length) {
    return user.teamIds.map(Number);
  }
  return [];
}

function getAccessiblePastEvents(events, user, role) {
  const now = new Date();
  const pastEvents = events.filter((event) => new Date(event.date) < now);

  if (role === 'ADMIN') return pastEvents;

  const scopedTeamIds = getCoachTeamScope(user);
  return pastEvents.filter((event) => {
    if (!event.teamId) return true;
    return scopedTeamIds.includes(Number(event.teamId));
  });
}

function applyTeamFilter(teamFilterValue) {
  if (teamFilterValue === 'ALL') {
    filteredEvents = [...allEvents];
    return;
  }
  filteredEvents = allEvents.filter((event) => Number(event.teamId || 0) === Number(teamFilterValue));
}

function renderTeamFilterOptions(user, role) {
  const teamFilter = document.getElementById('attendance-team-filter');
  if (!teamFilter) return;

  let availableTeams = AppState.teams;
  if (role === 'COACH') {
    const scoped = getCoachTeamScope(user);
    availableTeams = AppState.teams.filter((team) => scoped.includes(Number(team.id)));
  }

  teamFilter.innerHTML = '<option value="ALL">All Teams</option>' + availableTeams.map((team) => `
    <option value="${team.id}">${team.name}</option>
  `).join('');

  teamFilter.addEventListener('change', async (event) => {
    applyTeamFilter(event.target.value);
    renderSessionList();

    if (selectedEvent && !filteredEvents.some((item) => Number(item.id) === Number(selectedEvent.id))) {
      selectedEvent = null;
      currentAttendees = [];
      pendingChanges.clear();
      renderRosterPanel();
    }
  });
}

function getEventAttendanceStats(eventId) {
  const fallbackStats = eventAttendanceStats.get(Number(eventId)) || { present: 0, absent: 0 };

  if (!selectedEvent || Number(selectedEvent.id) !== Number(eventId)) {
    return fallbackStats;
  }

  let present = 0;
  let absent = 0;
  currentAttendees.forEach((attendee) => {
    const pending = pendingChanges.get(Number(attendee.id));
    const value = pending !== undefined ? pending : !!attendee.present;
    if (value) present += 1;
    else absent += 1;
  });

  return { present, absent };
}

async function renderSessionList() {
  const list = document.getElementById('attendance-session-list');
  const count = document.getElementById('attendance-session-count');
  if (!list || !count) return;

  count.textContent = String(filteredEvents.length);

  if (!filteredEvents.length) {
    list.innerHTML = '<div class="attendance-empty-state">No previous sessions found.</div>';
    return;
  }

  const cardTemplate = await loadComponent('attendance-session-card');
  list.innerHTML = filteredEvents.map((event) => {
    const isActive = selectedEvent && Number(selectedEvent.id) === Number(event.id);
    const stats = getEventAttendanceStats(event.id);

    return renderTemplate(cardTemplate, {
      eventId: event.id,
      activeClass: isActive ? 'active' : '',
      teamName: resolveTeamName(event.teamId),
      displayDate: formatDisplayDate(event.date),
      timeRange: formatDisplayTimeRange(event),
      presentCount: stats.present,
      absentCount: stats.absent
    });
  }).join('');

  list.querySelectorAll('[data-event-id]').forEach((card) => {
    card.addEventListener('click', async () => {
      const eventId = Number(card.getAttribute('data-event-id'));
      await selectEvent(eventId);
    });
  });
}

function updateSaveButtonState() {
  const saveBtn = document.getElementById('attendance-save-btn');
  if (!saveBtn) return;
  saveBtn.disabled = !selectedEvent || pendingChanges.size === 0;
}

async function renderRosterPanel() {
  const title = document.getElementById('attendance-roster-title');
  const subtitle = document.getElementById('attendance-roster-subtitle');
  const rosterList = document.getElementById('attendance-roster-list');
  if (!title || !subtitle || !rosterList) return;

  if (!selectedEvent) {
    title.textContent = 'Session Roster Details';
    subtitle.textContent = 'Select a session to begin';
    rosterList.innerHTML = '<div class="attendance-empty-state">Select a training session to manage attendance.</div>';
    updateSaveButtonState();
    return;
  }

  title.textContent = 'Session Roster Details';
  subtitle.textContent = `${resolveTeamName(selectedEvent.teamId)} • ${currentAttendees.length} members`;

  if (!currentAttendees.length) {
    rosterList.innerHTML = '<div class="attendance-empty-state">No members available for this session.</div>';
    updateSaveButtonState();
    return;
  }

  const rowTemplate = await loadComponent('attendance-roster-row');
  rosterList.innerHTML = currentAttendees.map((attendee) => {
    const pending = pendingChanges.get(Number(attendee.id));
    const isPresent = pending !== undefined ? pending : !!attendee.present;
    const nameClass = isPresent ? 'present' : 'absent';

    return renderTemplate(rowTemplate, {
      userId: attendee.id,
      nameClass,
      name: attendee.name,
      presentClass: isPresent ? 'active present' : '',
      absentClass: !isPresent ? 'active absent' : ''
    });
  });

  rosterList.querySelectorAll('[data-set-status]').forEach((button) => {
    button.addEventListener('click', () => {
      const userId = Number(button.getAttribute('data-user-id'));
      const makePresent = button.getAttribute('data-set-status') === 'present';
      const original = !!currentAttendees.find((item) => Number(item.id) === userId)?.present;

      if (makePresent === original) {
        pendingChanges.delete(userId);
      } else {
        pendingChanges.set(userId, makePresent);
      }

      renderRosterPanel();
      renderSessionList();
    });
  });

  updateSaveButtonState();
}

async function selectEvent(eventId) {
  const event = filteredEvents.find((item) => Number(item.id) === Number(eventId));
  if (!event) return;

  selectedEvent = event;
  pendingChanges.clear();

  try {
    const response = await apiGet(`/events/${eventId}/attendance`);
    currentAttendees = Array.isArray(response?.data) ? response.data : [];
    eventAttendanceStats.set(Number(eventId), toAttendanceStats(currentAttendees));
  } catch (error) {
    console.error('Error loading attendance:', error);
    currentAttendees = [];
    eventAttendanceStats.set(Number(eventId), { present: 0, absent: 0 });
  }

  await renderSessionList();
  await renderRosterPanel();
}

async function saveAttendanceChanges() {
  if (!selectedEvent || pendingChanges.size === 0) return;

  const saveBtn = document.getElementById('attendance-save-btn');
  const originalLabel = saveBtn ? saveBtn.textContent : 'SAVE CHANGES';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
  }

  try {
    const updates = Array.from(pendingChanges.entries()).map(([userId, present]) =>
      apiPost(`/events/${selectedEvent.id}/attendance`, { userId, present })
    );

    await Promise.all(updates);

    currentAttendees = currentAttendees.map((attendee) => {
      const pending = pendingChanges.get(Number(attendee.id));
      if (pending === undefined) return attendee;
      return { ...attendee, present: pending };
    });
    eventAttendanceStats.set(Number(selectedEvent.id), toAttendanceStats(currentAttendees));
    pendingChanges.clear();

    await renderRosterPanel();
    await renderSessionList();
  } catch (error) {
    console.error('Error saving attendance updates:', error);
    alert('Unable to save attendance changes. Please try again.');
  } finally {
    if (saveBtn) {
      saveBtn.textContent = originalLabel;
    }
    updateSaveButtonState();
  }
}

export async function initAttendance() {
  console.log('✅ Initializing Attendance...');
  
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';
  
  if (role !== 'COACH' && role !== 'ADMIN') {
    document.getElementById('attendance-container').innerHTML =
      '<div class="empty-state"><p>Only coaches and admins can mark attendance</p></div>';
    return;
  }
  
  try {
    const events = AppState.events.length
      ? AppState.events
      : (((await apiGet('/events'))?.data || []).map(adaptEventRow));

    allEvents = getAccessiblePastEvents(events, user, role);
    filteredEvents = [...allEvents];
    selectedEvent = null;
    currentAttendees = [];
    pendingChanges.clear();
    eventAttendanceStats.clear();

    await preloadAttendanceStats(allEvents);

    renderTeamFilterOptions(user, role);
    await renderSessionList();
    await renderRosterPanel();

    const saveBtn = document.getElementById('attendance-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveAttendanceChanges);
    }

    const historyBtn = document.getElementById('attendance-history-btn');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        const sessionSection = document.getElementById('attendance-session-list');
        if (sessionSection) {
          sessionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  } catch (error) {
    console.error('❌ Attendance error:', error);
  }
}

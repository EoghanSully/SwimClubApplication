import { AppState } from '../app.js';
import * as attendanceModel from '../models/attendanceModel.js';
import { loadComponent, renderTemplate } from '../utils/components.js';

// LOCAL VIEW STATE FOR ATTENDANCE PAGE DATA, FILTERS, AND SELECTIONS.
let allEvents = [];
let filteredEvents = [];
let selectedEvent = null;
let currentAttendees = [];
let attendanceTeams = [];

// TRACK UNSAVED TOGGLE CHANGES AND SAVED PRESENCE VALUES BY EVENT/USER KEY.
const pendingChanges = new Map();
const savedAttendance = new Map();

// BUILD A STABLE MAP KEY FOR ONE EVENT/MEMBER ATTENDANCE ENTRY.
function attendanceKey(eventId, userId) {
  return `${Number(eventId)}:${Number(userId)}`;
}

// COUNT PRESENT VERSUS ABSENT VALUES FROM AN ATTENDEE ARRAY.
function toAttendanceStats(attendees) {
  let present = 0;
  let absent = 0;

  (attendees || []).forEach((attendee) => {
    if (attendee?.present) present += 1;
    else absent += 1;
  });

  return { present, absent };
}

// FIND A TEAM OBJECT BY ID FROM THE LOADED ATTENDANCE TEAMS LIST.
function findTeam(teamId) {
  return attendanceTeams.find((team) => Number(team.id) === Number(teamId));
}

// FORMAT ISO DATE TEXT FOR CARD DISPLAY.
function formatDisplayDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unknown Date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

// FORMAT SESSION START/END INTO A SINGLE TIME RANGE LABEL.
function formatDisplayTimeRange(event) {
  if (!event?.startTime || !event?.endTime) return 'Time TBC';
  return `${event.startTime} - ${event.endTime}`;
}

// RESOLVE TEAM NAME FOR A SESSION, WITH SAFE FALLBACK LABELS.
function resolveTeamName(teamId) {
  if (!teamId) return 'Club Session';
  return findTeam(teamId)?.name || 'Team Session';
}

// KEEP ONLY PAST EVENTS FOR ATTENDANCE MARKING HISTORY.
function getPastEvents(events) {
  const now = new Date();
  return events.filter((event) => new Date(event.date) < now);
}

// APPLY TEAM FILTER TO THE EVENTS LIST USED BY THE LEFT PANEL.
function applyTeamFilter(teamFilterValue) {
  if (teamFilterValue === 'ALL') {
    filteredEvents = [...allEvents];
    return;
  }
  filteredEvents = allEvents.filter((event) => Number(event.teamId || 0) === Number(teamFilterValue));
}

// RENDER TEAM FILTER OPTIONS AND WIRE CHANGE HANDLER.
function renderTeamFilterOptions() {
  const teamFilter = document.getElementById('attendance-team-filter');
  if (!teamFilter) return;

  const availableTeams = attendanceTeams;

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

// CALCULATE PRESENT/ABSENT COUNTS FOR ONE SESSION CARD.
function getEventAttendanceStats(eventId) {
  const event = filteredEvents.find((item) => Number(item.id) === Number(eventId));
  const members = Array.isArray(findTeam(event?.teamId)?.members) ? findTeam(event.teamId).members : [];
  if (!selectedEvent || Number(selectedEvent.id) !== Number(eventId)) {
    let present = 0;
    let absent = 0;

    members.forEach((member) => {
      const value = savedAttendance.get(attendanceKey(eventId, member.id)) || false;
      if (value) present += 1;
      else absent += 1;
    });

    return { present, absent };
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

// RENDER THE LEFT-HAND SESSION CARD LIST.
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

// ENABLE SAVE ONLY WHEN A SESSION IS SELECTED AND THERE ARE PENDING CHANGES.
function updateSaveButtonState() {
  const saveBtn = document.getElementById('attendance-save-btn');
  if (!saveBtn) return;
  saveBtn.disabled = !selectedEvent || pendingChanges.size === 0;
}

// RENDER THE RIGHT-HAND ROSTER PANEL FOR THE SELECTED SESSION.
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

// SELECT A SESSION, LOAD MEMBERS, AND APPLY SAVED PRESENCE VALUES.
async function selectEvent(eventId) {
  const event = filteredEvents.find((item) => Number(item.id) === Number(eventId));
  if (!event) return;

  selectedEvent = event;
  pendingChanges.clear();

  const team = findTeam(event.teamId);
  const members = Array.isArray(team?.members) ? team.members : [];
  currentAttendees = members.map((member) => ({
    ...member,
    present: savedAttendance.get(attendanceKey(event.id, member.id)) || false
  }));

  await renderSessionList();
  await renderRosterPanel();
}

// SAVE ONLY CHANGED ATTENDANCE VALUES, THEN REFRESH UI STATE.
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
      attendanceModel.saveAttendance(selectedEvent.id, userId, present)
    );

    await Promise.all(updates);

    for (const [userId, present] of pendingChanges.entries()) {
      savedAttendance.set(attendanceKey(selectedEvent.id, userId), present);
    }

    currentAttendees = currentAttendees.map((attendee) => {
      const pending = pendingChanges.get(Number(attendee.id));
      if (pending === undefined) return attendee;
      return { ...attendee, present: pending };
    });
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

// INITIALISE ATTENDANCE PAGE FOR COACH/ADMIN USERS.
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
    attendanceTeams = await attendanceModel.getAttendanceTeams();
    const events = AppState.events.length ? AppState.events : await attendanceModel.getEvents();

    allEvents = getPastEvents(events);
    filteredEvents = [...allEvents];
    selectedEvent = null;
    currentAttendees = [];
    pendingChanges.clear();
    savedAttendance.clear();

    renderTeamFilterOptions();
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

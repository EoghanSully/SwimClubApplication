import { AppState } from '../app.js';
import { apiGet, apiPost } from '../utils/api.js';

let selectedEvent = null;
let attendanceList = [];

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
    const events = AppState.events.length ? AppState.events : (await apiGet('/events') || []);
    const pastEvents = events.filter(e => new Date(e.date) < new Date());
    renderAttendanceEvents(pastEvents, user, role);
  } catch (error) {
    console.error('❌ Attendance error:', error);
  }
}

function renderAttendanceEvents(events, user, role) {
  const container = document.getElementById('attendance-container');
  if (!container) return;
  
  const accessibleEvents = role === 'ADMIN' ? events :
    events.filter(e => e.coachIds?.includes(user.id));
  
  container.innerHTML = `
    <div>
      <div style="margin-bottom: 1rem;">
        <h2>Mark Attendance</h2>
        <p>Select an event to mark member attendance</p>
      </div>
      <div id="events-list">
        ${accessibleEvents.length ? accessibleEvents.map(event => `
          <div class="card" style="margin-bottom: 1rem; cursor: pointer;" onclick="window.selectEvent(${event.id})">
            <div class="card-header">
              <h3>${event.name}</h3>
              <small>${new Date(event.date).toLocaleDateString()}</small>
            </div>
          </div>
        `).join('') : '<div class="empty-state"><p>No past events found</p></div>'}
      </div>
    </div>
    <div id="attendance-form" style="display: none;"></div>
  `;
  
  window.selectEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    selectedEvent = event;
    try {
      const attendees = await apiGet(`/events/${eventId}/attendance`) || [];
      renderAttendanceForm(event, attendees);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };
}

function renderAttendanceForm(event, attendees) {
  const container = document.getElementById('attendance-form');
  if (!container) return;
  
  container.style.display = 'block';
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Attendance: ${event.name}</h3>
        <button class="btn-secondary" onclick="document.getElementById('attendance-form').style.display='none'">Close</button>
      </div>
      <div class="card-content">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd;">
              <th style="padding: 0.5rem; text-align: left;">Name</th>
              <th style="padding: 0.5rem; text-align: center;">Present</th>
            </tr>
          </thead>
          <tbody>
            ${attendees.map(attendee => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 0.5rem;">${attendee.name}</td>
                <td style="padding: 0.5rem; text-align: center;">
                  <input type="checkbox" ${attendee.present ? 'checked' : ''} 
                         onchange="window.updateAttendance(${attendee.id}, this.checked)">
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  window.updateAttendance = async (userId, present) => {
    try {
      await apiPost(`/events/${selectedEvent.id}/attendance`, {
        userId, present
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };
}
x
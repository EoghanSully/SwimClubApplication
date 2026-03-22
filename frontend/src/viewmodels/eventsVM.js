// ============================================
// EVENTS/SCHEDULE VIEW MODEL
// University of Galway Swim Club
// ============================================

import * as eventsModel from '../models/eventsModel.js';
import * as teamModel from '../models/teamModel.js';

let eventList = [];

/**
 * Load all events from backend
 */
export async function loadEvents() {
  try {
    eventList = await eventsModel.getAllEvents();
    console.log("Events loaded in view model:", eventList);
    if(eventList.length === 0) {
      console.warn("No events found. Check backend API and database.");
    }
    return eventList;
  } catch (error) {
    console.error('Error loading events:', error.stack);
    throw error;
  }
}

/**
 * Filter events by role, team, and type
 */
export async function getFilteredEvents(user, role, filters = {}) {
  try {
    const events = eventList.length ? eventList : (await loadEvents());
    const { teamId, eventType, dateRange } = filters;
    
    return events.filter(e => {
      // Role-based filtering
      if (role === 'MEMBER') {
        if (!user.teamIds.includes(e.teamId || '') && e.teamId !== 'CLUB') {
          return false;
        }
      } else if (role === 'COACH') {
        if (teamId && e.teamId !== teamId) return false;
      }
      
      // Team filter
      if (teamId && e.teamId !== teamId) return false;
      
      // Event type filter
      if (eventType && e.type !== eventType) return false;
      
      // Date range filter
      if (dateRange) {
        const eventDate = new Date(e.date);
        if (eventDate < dateRange.start || eventDate > dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error filtering events:', error.stack);
    throw error;
  }
}

/**
 * Get events for specific day
 */
export async function getEventsForDay(date) {
  try {
    const events = eventList.length ? eventList : (await loadEvents());
    const targetDate = new Date(date).toDateString();
    return events.filter(e => {
      return new Date(e.date).toDateString() === targetDate;
    });
  } catch (error) {
    console.error('Error getting events for day:', error.stack);
    return [];
  }
}

/**
 * Get event type color
 */
export function getEventTypeColor(type) {
  const colors = {
    'TRAINING': '#2563eb',
    'COMPETITION': '#dc2626',
    'SOCIAL': '#16a34a',
    'SOCIETY': '#d97706'
  };
  return colors[type] || '#6b7280';
}

/**
 * Get event type label
 */
export function getEventTypeLabel(type) {
  const labels = {
    'TRAINING': 'Training Session',
    'COMPETITION': 'Competition Event',
    'SOCIAL': 'Social Event',
    'SOCIETY': 'Society Event'
  };
  return labels[type] || type;
}

/**
 * Generate calendar data for a month
 */
export async function generateCalendar(year, month) {
  try {
    const events = eventList.length ? eventList : (await loadEvents());
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = await getEventsForDay(date);
      
      currentWeek.push({
        date: date,
        day: day,
        events: dayEvents,
        isToday: isToday(date)
      });
      
      // Start new week on Sunday
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill remaining cells
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  } catch (error) {
    console.error('Error generating calendar:', error.stack);
    return [];
  }
}

/**
 * Check if date is today
 */
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Create new event
 */
export async function createEvent(formData) {
  try {
    const newEvent = await eventsModel.createNewEvent(formData);
    eventList.push(newEvent);
    console.log("Event created and added to list:", newEvent);
    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error.stack);
    throw error;
  }
}

/**
 * Update existing event
 */
export async function updateEvent(eventData) {
  try {
    const updatedEvent = await eventsModel.updateEvent(eventData);
    const index = eventList.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      eventList[index] = updatedEvent;
    }
    console.log("Event updated:", updatedEvent);
    return updatedEvent;
  } catch (error) {
    console.error('Error updating event:', error.stack);
    throw error;
  }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId) {
  try {
    await eventsModel.deleteEvent(eventId);
    eventList = eventList.filter(e => e.id !== eventId);
    console.log("Event deleted with ID:", eventId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error.stack);
    throw error;
  }
}

/**
 * Get team name from ID
 */
export async function getTeamName(teamId) {
  try {
    if (teamId === 'CLUB') return 'All Club';
    const teams = await teamModel.getAllTeams();
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  } catch (error) {
    console.error('Error getting team name:', error.stack);
    return 'Unknown';
  }
}

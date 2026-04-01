/**
 * Date Utilities for Swim Club Application
 * Handles date formatting, comparisons, and calendar logic
 */

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IE', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  return `${formatDate(dateStr)} at ${timeStr}`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
}

export function isSessionUpcoming(dateStr, timeStr) {
  const now = new Date();
  const eventDateTime = new Date(`${dateStr}T${timeStr}`);
  return eventDateTime > now;
}

export function isSessionPast(dateStr, timeStr) {
  const now = new Date();
  const eventDateTime = new Date(`${dateStr}T${timeStr}`);
  return eventDateTime <= now;
}

export function getNextUpcomingSession(events) {
  if (!events || events.length === 0) return null;
  
  const now = new Date();
  const upcomingSessions = events.filter(e => {
    if (e.type !== 'TRAINING') return false;
    const eventDateTime = new Date(`${e.date}T${e.startTime}`);
    return eventDateTime > now;
  });
  
  if (upcomingSessions.length === 0) return null;
  
  upcomingSessions.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA - dateB;
  });
  
  return upcomingSessions[0];
}

export function daysUntilSession(dateStr, timeStr) {
  const now = new Date();
  const eventDateTime = new Date(`${dateStr}T${timeStr}`);
  const diffTime = eventDateTime - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
}

export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function eventTypeToColor(type) {
  const colors = {
    'TRAINING': 'rgb(37, 99, 235)',      // Blue
    'COMPETITION': 'rgb(220, 38, 38)',    // Red
    'SOCIAL': 'rgb(22, 163, 74)',         // Green
    'SOCIETY': 'rgb(217, 119, 6)'         // Amber
  };
  return colors[type] || '#6b7280';
}

export function eventTypeLabel(type) {
  const labels = {
    'TRAINING': 'Training Session',
    'COMPETITION': 'Competition Event',
    'SOCIAL': 'Social Event',
    'SOCIETY': 'Society Event'
  };
  return labels[type] || type;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isFuture(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export function announcementCategoryColor(category) {
  const colors = {
    'TRAINING': 'blue',
    'COMPETITION': 'red',
    'SOCIAL': 'green',
    'SOCIETY': 'amber',
    'FUNDRAISER': 'purple',
    'GENERAL': 'gray'
  };
  return colors[category] || 'gray';
}

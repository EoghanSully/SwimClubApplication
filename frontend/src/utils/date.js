/**
 * DATE UTILITIES FOR SWIM CLUB APPLICATION
 * HANDLES DATE FORMATTING, COMPARISONS, AND CALENDAR LOGIC
 */

// FORMAT A DATE STRING INTO A SHORT HUMAN-READABLE FORM.
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IE', { month: 'short', day: 'numeric', year: 'numeric' });
}

// FORMAT A DATE STRING INTO A LONG HUMAN-READABLE FORM.
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

// COMBINE A DATE AND TIME STRING INTO ONE DISPLAY STRING.
export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  return `${formatDate(dateStr)} at ${timeStr}`;
}

// NORMALISE TIME STRING DISPLAY TO HH:MM.
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
}

// CHECK WHETHER A SESSION IS STILL IN THE FUTURE.
export function isSessionUpcoming(dateStr, timeStr) {
  const now = new Date();
  const eventDateTime = new Date(`${dateStr}T${timeStr}`);
  return eventDateTime > now;
}

// CHECK WHETHER A SESSION HAS ALREADY PASSED.
export function isSessionPast(dateStr, timeStr) {
  const now = new Date();
  const eventDateTime = new Date(`${dateStr}T${timeStr}`);
  return eventDateTime <= now;
}

// FIND THE NEXT UPCOMING TRAINING SESSION FROM AN EVENTS LIST.
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

// RETURN HOW MANY DAYS REMAIN UNTIL A SESSION STARTS.
export function daysUntilSession(dateStr, timeStr) {
  const now = new Date();
  const eventDateTime = new Date(`${dateStr}T${timeStr}`);
  const diffTime = eventDateTime - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// BUILD A CALENDAR GRID ARRAY (NULLS + DATE OBJECTS) FOR A MONTH VIEW.
export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // ADD EMPTY CELLS FOR DAYS BEFORE MONTH STARTS
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // ADD DAYS OF THE MONTH
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
}

// CHECK IF TWO DATE OBJECTS FALL ON THE EXACT SAME CALENDAR DAY.
export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// MAP EVENT TYPE TO ITS DISPLAY COLOUR VALUE.
export function eventTypeToColor(type) {
  const colors = {
    'TRAINING': 'rgb(37, 99, 235)',      // BLUE
    'COMPETITION': 'rgb(220, 38, 38)',    // RED
    'SOCIAL': 'rgb(22, 163, 74)',         // GREEN
    'SOCIETY': 'rgb(217, 119, 6)'         // AMBER
  };
  return colors[type] || '#6b7280';
}

// MAP EVENT TYPE TO A HUMAN-READABLE LABEL.
export function eventTypeLabel(type) {
  const labels = {
    'TRAINING': 'Training Session',
    'COMPETITION': 'Competition Event',
    'SOCIAL': 'Social Event',
    'SOCIETY': 'Society Event'
  };
  return labels[type] || type;
}

// GET THE NUMBER OF DAYS IN A GIVEN MONTH.
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// GET WEEKDAY INDEX OF THE FIRST DAY IN A GIVEN MONTH.
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// CHECK IF A DATE STRING MATCHES TODAY'S DATE.
export function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// CHECK IF A DATE STRING IS TODAY OR IN THE FUTURE.
export function isFuture(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// MAP ANNOUNCEMENT CATEGORY TO ITS BADGE COLOUR NAME.
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

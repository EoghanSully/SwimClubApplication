// THIS FILE ADAPTS RAW BACKEND ROWS INTO FRONTEND-FRIENDLY OBJECT SHAPES.

// PAD SINGLE-DIGIT TIME/DATE PARTS WITH A LEADING ZERO.
function padTime(value) {
  return String(value).padStart(2, '0');
}

// FORMAT A JAVASCRIPT DATE INTO YYYY-MM-DD.
function formatIsoDate(date) {
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;
}

// FORMAT A JAVASCRIPT DATE INTO HH:MM.
function formatClockTime(date) {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

// NORMALISE DIFFERENT INTERVAL FORMATS INTO TOTAL MINUTES.
function parseIntervalMinutes(intervalValue) {
  if (!intervalValue) return 0;

  if (typeof intervalValue === 'number' && Number.isFinite(intervalValue)) {
    return intervalValue;
  }

  // SOME DRIVERS RETURN INTERVAL AS AN OBJECT (HOURS/MINUTES/SECONDS).
  if (typeof intervalValue === 'object') {
    const hours = Number(intervalValue.hours || 0);
    const minutes = Number(intervalValue.minutes || 0);
    const seconds = Number(intervalValue.seconds || 0);
    return (hours * 60) + minutes + Math.floor(seconds / 60);
  }

  const match = String(intervalValue).match(/(?:(\d+):)?(\d{1,2}):(\d{1,2})/);
  if (match) {
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    return (hours * 60) + minutes;
  }

  // FALLBACK FOR TEXTUAL INTERVALS LIKE "1 HOUR" OR "45 MINS".
  const text = String(intervalValue).toLowerCase();
  const hourMatch = text.match(/(\d+)\s*h/);
  const minMatch = text.match(/(\d+)\s*m/);
  const hours = Number(hourMatch?.[1] || 0);
  const minutes = Number(minMatch?.[1] || 0);
  return (hours * 60) + minutes;
}

// CONVERT ONE EVENTS TABLE ROW INTO THE APP EVENT MODEL.
export function adaptEventRow(row) {
  const startDate = row?.event_date ? new Date(row.event_date) : null;
  const endDate = startDate ? new Date(startDate.getTime() + (parseIntervalMinutes(row.duration) * 60 * 1000)) : null;

  return {
    id: row.event_id,
    eventId: row.event_id,
    title: row.title,
    description: row.description || '',
    type: (row.category || 'GENERAL').toUpperCase(),
    category: (row.category || 'GENERAL').toUpperCase(),
    location: row.venue || 'TBC',
    venue: row.venue || 'TBC',
    date: startDate ? formatIsoDate(startDate) : '',
    startTime: startDate ? formatClockTime(startDate) : '',
    endTime: endDate ? formatClockTime(endDate) : '',
    status: row.status,
    audience: row.audience,
    teamId: row.team_id,
    team_id: row.team_id,
    raw: row
  };
}

// CONVERT ONE ANNOUNCEMENTS TABLE ROW INTO THE APP ANNOUNCEMENT MODEL.
export function adaptAnnouncementRow(row) {
  let target = 'ALL';
  if (row.team_id !== null && row.team_id !== undefined) {
    target = row.team_id;
  } else if (row.audience === 'coach') { 
    target = 'COACHES';
  }

  return {
    id: row.announcement_id,
    announcementId: row.announcement_id,
    admin_id: row.admin_id,
    adminId: row.admin_id,
    title: row.title,
    content: row.description || '',
    description: row.description || '',
    category: (row.category || 'GENERAL').toUpperCase(),
    audience: row.audience || 'club',
    target,
    team_id: row.team_id,
    teamId: row.team_id,
    created_at: row.created_at || null,
    author: row.admin_id ? `Admin ${row.admin_id}` : 'Admin',
    date: row.created_at || new Date().toISOString(),
    eventId: null,
    raw: row
  };
}

// CONVERT ONE SESSION PLAN ROW INTO THE APP PLAN MODEL.
export function adaptPlanRow(row) {
  return {
    id: row.plan_id,
    planId: row.plan_id,
    title: row.title,
    description: row.description || '',
    teamId: row.team_id,
    creatorId: row.created_by,
    date: row.created_at,
    warmUp: row.warm_up || '',
    session: row.main_set || '',
    coolDown: row.cool_down || '',
    extraInfo: row.coach_note || '',
    raw: row
  };
}

// CONVERT ONE USER ROW INTO THE APP USER MODEL.
export function adaptUserRow(row) {
  const firstName = row.first_name || '';
  const lastName = row.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: row.user_id,
    firstName,
    lastName,
    name: fullName || row.email || 'User',
    email: row.email,
    phone: row.phone || '',
    role: typeof row.user_role === 'string' ? row.user_role.toUpperCase() : 'MEMBER',
    joinedDate: row.joined_date || row.created_at || null,
    teamIds: row.team_id !== undefined && row.team_id !== null ? [row.team_id] : []
  };
}

// GROUP TEAM JOIN ROWS INTO A TEAM LIST WITH MEMBERS ATTACHED.
export function adaptTeamRows(rows) {
  const teamsById = new Map();

  (rows || []).forEach((row) => {
    if (!teamsById.has(row.team_id)) {
      const coachId = row.coach_id !== null && row.coach_id !== undefined ? Number(row.coach_id) : null;
      teamsById.set(row.team_id, {
        id: row.team_id,
        name: row.team_name || row.name || `Team ${row.team_id}`,
        teamName: row.team_name || row.name || `Team ${row.team_id}`,
        coachIds: coachId ? [coachId] : [],
        members: []
      });
    }

    const team = teamsById.get(row.team_id);
    if (row.user_id) {
      const role = typeof row.user_role === 'string'
        ? row.user_role.toUpperCase()
        : 'MEMBER';

      team.members.push({
        id: row.user_id,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.name || 'Member',
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        email: row.email || '',
        role,
        joinedDate: null
      });
    }
  });

  return Array.from(teamsById.values());
}

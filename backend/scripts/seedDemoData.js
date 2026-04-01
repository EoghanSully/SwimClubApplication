import argon2 from 'argon2';
import pool from '../config/db.js';

async function ensureUser({ firstName, lastName, email, phone, role, password }) {
  const existing = await pool.query(
    'SELECT user_id, first_name, last_name, email, user_role FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const passwordHash = await argon2.hash(password);
  const inserted = await pool.query(
    `INSERT INTO users (first_name, last_name, email, phone, password_hash, user_role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, first_name, last_name, email, user_role`,
    [firstName, lastName, email, phone, passwordHash, role]
  );

  return inserted.rows[0];
}

async function ensureTeam(teamName, coachId) {
  const existing = await pool.query(
    'SELECT team_id, team_name, coach_id FROM teams WHERE team_name = $1',
    [teamName]
  );

  if (existing.rows[0]) {
    if (Number(existing.rows[0].coach_id) !== Number(coachId)) {
      const updated = await pool.query(
        'UPDATE teams SET coach_id = $1 WHERE team_id = $2 RETURNING team_id, team_name, coach_id',
        [coachId, existing.rows[0].team_id]
      );
      return updated.rows[0];
    }

    return existing.rows[0];
  }

  const inserted = await pool.query(
    'INSERT INTO teams (team_name, coach_id) VALUES ($1, $2) RETURNING team_id, team_name, coach_id',
    [teamName, coachId]
  );

  return inserted.rows[0];
}

async function ensureTeamMember(teamId, userId) {
  await pool.query(
    `INSERT INTO team_members (team_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (team_id, user_id) DO NOTHING`,
    [teamId, userId]
  );
}

async function ensureAnnouncement({ category, title, description, audience, adminId, teamId = null }) {
  const existing = await pool.query(
    'SELECT announcement_id FROM announcements WHERE title = $1 AND admin_id = $2',
    [title, adminId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const inserted = await pool.query(
    `INSERT INTO announcements (category, title, description, audience, admin_id, team_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING announcement_id`,
    [category, title, description, audience, adminId, teamId]
  );

  return inserted.rows[0];
}

async function ensureEvent({ category, title, venue, description, duration, eventDate, status, audience, teamId = null }) {
  const existing = await pool.query(
    'SELECT event_id FROM events WHERE title = $1 AND event_date = $2',
    [title, eventDate]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const inserted = await pool.query(
    `INSERT INTO events (category, title, venue, description, duration, event_date, status, audience, team_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING event_id`,
    [category, title, venue, description, duration, eventDate, status, audience, teamId]
  );

  return inserted.rows[0];
}

async function ensureSessionPlan({ title, description, teamId, warmUp, mainSet, coolDown, coachNote, createdBy }) {
  const existing = await pool.query(
    'SELECT plan_id FROM session_plans WHERE title = $1 AND team_id = $2',
    [title, teamId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const inserted = await pool.query(
    `INSERT INTO session_plans (title, description, team_id, warm_up, main_set, cool_down, coach_note, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING plan_id`,
    [title, description, teamId, warmUp, mainSet, coolDown, coachNote, createdBy]
  );

  return inserted.rows[0];
}

function futureIso(daysAhead, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function main() {
  console.log('Seeding demo data...');

  const admin = await ensureUser({
    firstName: 'Ava',
    lastName: 'Admin',
    email: 'admin@swimclub.local',
    phone: '0850000001',
    role: 'admin',
    password: 'password123'
  });

  const coach = await ensureUser({
    firstName: 'Conor',
    lastName: 'Coach',
    email: 'coach@swimclub.local',
    phone: '0850000002',
    role: 'coach',
    password: 'password123'
  });

  const member = await ensureUser({
    firstName: 'Mia',
    lastName: 'Member',
    email: 'member@swimclub.local',
    phone: '0850000003',
    role: 'member',
    password: 'password123'
  });

  const performanceTeam = await ensureTeam('Performance Squad', coach.user_id);
  const developmentTeam = await ensureTeam('Development Squad', coach.user_id);

  await ensureTeamMember(performanceTeam.team_id, member.user_id);
  await ensureTeamMember(developmentTeam.team_id, member.user_id);

  await ensureAnnouncement({
    category: 'GENERAL',
    title: 'Welcome to the new club portal',
    description: 'This is a club-wide announcement so members can see that the announcements page is working.',
    audience: 'club',
    adminId: admin.user_id
  });

  await ensureAnnouncement({
    category: 'TRAINING',
    title: 'Performance Squad session update',
    description: 'Wednesday training starts 15 minutes earlier this week. Please arrive poolside by 18:15.',
    audience: 'team',
    adminId: coach.user_id,
    teamId: performanceTeam.team_id
  });

  await ensureEvent({
    category: 'SOCIAL',
    title: 'Club Coffee Morning',
    venue: 'Campus Cafe',
    description: 'A casual meet-up for all members after Saturday training.',
    duration: '01:30:00',
    eventDate: futureIso(4, 10, 0),
    status: 'scheduled',
    audience: 'club'
  });

  await ensureEvent({
    category: 'TRAINING',
    title: 'Performance Threshold Set',
    venue: 'Main Pool',
    description: 'Threshold work focused on pacing, turns, and race discipline.',
    duration: '01:15:00',
    eventDate: futureIso(2, 18, 30),
    status: 'scheduled',
    audience: 'team',
    teamId: performanceTeam.team_id
  });

  await ensureSessionPlan({
    title: 'Threshold Tuesday',
    description: 'Aerobic threshold session for Performance Squad.',
    teamId: performanceTeam.team_id,
    warmUp: '400 swim, 200 pull, 4 x 50 build',
    mainSet: '8 x 100 threshold on 1:40, 6 x 50 kick, 4 x 200 pull paddles',
    coolDown: '200 easy mixed stroke',
    coachNote: 'Hold technique together when fatigue builds. Focus on turns and underwater work.',
    createdBy: coach.user_id
  });

  const counts = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM users'),
    pool.query('SELECT COUNT(*)::int AS count FROM teams'),
    pool.query('SELECT COUNT(*)::int AS count FROM team_members'),
    pool.query('SELECT COUNT(*)::int AS count FROM announcements'),
    pool.query('SELECT COUNT(*)::int AS count FROM events'),
    pool.query('SELECT COUNT(*)::int AS count FROM session_plans')
  ]);

  console.log('Demo data ready.');
  console.log(`users: ${counts[0].rows[0].count}`);
  console.log(`teams: ${counts[1].rows[0].count}`);
  console.log(`team_members: ${counts[2].rows[0].count}`);
  console.log(`announcements: ${counts[3].rows[0].count}`);
  console.log(`events: ${counts[4].rows[0].count}`);
  console.log(`session_plans: ${counts[5].rows[0].count}`);
  console.log('Demo logins:');
  console.log('  admin@swimclub.local / password123');
  console.log('  coach@swimclub.local / password123');
  console.log('  member@swimclub.local / password123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
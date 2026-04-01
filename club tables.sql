

-- Events
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
	category VARCHAR(50), 
    title VARCHAR(100) NOT NULL,
    venue VARCHAR(100) DEFAULT 'to be decided',
	description TEXT,
	duration INTERVAL CHECK (duration > '0 minutes'::INTERVAL), 
    event_date TIMESTAMPTZ NOT NULL,
    -- check is necessary in application functionality
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'cancelled', 'completed')),
	audience VARCHAR(20) DEFAULT 'club' NOT NULL CHECK (audience IN ('club', 'team', 'coach')),
	team_id INTEGER ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Teams
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    coach_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members (Users N:M Teams)
CREATE TABLE team_members (
    team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    joined_date DATE DEFAULT now()::DATE,
    PRIMARY KEY (team_id, user_id)
);

-- storing announcement information, one to many relationshup with User
CREATE TABLE announcements(
    announcement_id SERIAL PRIMARY KEY,
	category VARCHAR(30),
    title VARCHAR(60), --test if character limit should be increased
    description TEXT,
    audience VARCHAR(20) NOT NULL CHECK(audience IN ('club', 'team','coach')) DEFAULT 'club',
    -- potentially add option for just comittee/admins
    admin_id INTEGER REFERENCES users(user_id),
    team_id INTEGER REFERENCES teams(team_id) ON DELETE SET NULL
    --check if index for role is accessed when query is run
);

-- Event Attendance (Users N:M Events)
CREATE TABLE event_attendance (
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false, 
    status VARCHAR(30) CHECK (status IN ('attending', 'absent', 'unavailable')),
	description TEXT,
    PRIMARY KEY (event_id, user_id)
);

-- Plans (linked to Teams)
CREATE TABLE session_plans (
    plan_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    team_id INTEGER REFERENCES teams(team_id) ON DELETE SET NULL,
    warm_up TEXT,
	main_set TEXT,
	cool_down TEXT, 
	coach_note TEXT,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ADD CONSTRAINT fk_events_team 
    FOREIGN KEY (team_id) REFERENCES teams(team_id);

-- Performance Indexes
-- Potentially add an index for event audience (test applications first add later)
-- Potentially index for user_id (events attending) if history of event attendence will be in application
CREATE INDEX idx_users_role ON users(user_role);
CREATE INDEX idx_users_id ON users(user_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
Create INDEX idx_event_team_id ON events(team_id);
CREATE INDEX idx_events_audience ON events(audience);
--create index for scanning table for specific team events more efficently, 
--applicbaility with coaches with multiple teams to be tested
CREATE INDEX idx_announcement_audience ON announcements(audience); -- check if most effecitve/necessary
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_session_plans ON session_plans(team_id);
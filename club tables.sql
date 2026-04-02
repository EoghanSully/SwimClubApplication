
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    user_role VARCHAR(10) DEFAULT 'member',
    joined TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    coach_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE team_members (
    team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    joined_date DATE DEFAULT now()::DATE,
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    title VARCHAR(100) NOT NULL,
    venue VARCHAR(100) DEFAULT 'to be decided',
    description TEXT,
    duration INTERVAL CHECK (duration > '0 minutes'::INTERVAL),
    event_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'cancelled', 'completed')),
    audience VARCHAR(20) DEFAULT 'club' NOT NULL CHECK (audience IN ('club', 'team', 'coach')),
    team_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ADD CONSTRAINT fk_events_team
    FOREIGN KEY (team_id) REFERENCES teams(team_id);

CREATE TABLE event_attendance (
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    status VARCHAR(30) CHECK (status IN ('attending', 'absent', 'unavailable')),
    description TEXT,
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE announcements (
    announcement_id SERIAL PRIMARY KEY,
    category VARCHAR(30),
    title VARCHAR(60),
    description TEXT,
    audience VARCHAR(20) NOT NULL CHECK (audience IN ('club', 'team', 'coach')) DEFAULT 'club',
    admin_id INTEGER REFERENCES users(user_id)
);


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


CREATE INDEX idx_users_role ON users(user_role);
CREATE INDEX idx_users_id ON users(user_id);

CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_team_id ON events(team_id);
CREATE INDEX idx_events_audience ON events(audience);

CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);

CREATE INDEX idx_announcement_audience ON announcements(audience);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);

CREATE INDEX idx_team_session_plans ON session_plans(team_id);

-- ==============================================================================
-- PUNE FLOODGUARD AI: FROZEN SUPABASE SCHEMA (SECTION 7 SPECIFICATION)
-- ==============================================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trust NUMERIC(3, 2) DEFAULT 1.00 CHECK (trust >= 0.5 AND trust <= 1.5),
    geohash6 VARCHAR(6),
    phone VARCHAR(20),
    push_subscription JSONB,
    saved_routes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reports table
DO $$ BEGIN
    CREATE TYPE report_depth AS ENUM ('ankle', 'knee', 'waist', 'vehicle_stalls');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('unverified', 'confirmed', 'severe', 'cleared');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_uuid UUID UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    gps_accuracy NUMERIC(6, 2),
    depth report_depth NOT NULL,
    photo_url TEXT,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    confirms INT DEFAULT 0,
    clears INT DEFAULT 0,
    road_passable BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'user_app',
    status report_status DEFAULT 'unverified',
    is_demo BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_reports_status_expires ON reports(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON reports(lat, lng);

-- 3. Report Votes table
DO $$ BEGIN
    CREATE TYPE vote_type AS ENUM ('still_flooded', 'cleared');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS report_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vote vote_type NOT NULL,
    weight NUMERIC(4, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- 4. Grid Cells table
CREATE TABLE IF NOT EXISTS grid_cells (
    id VARCHAR(32) PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    elevation NUMERIC(6, 2),
    slope NUMERIC(5, 2),
    hand NUMERIC(6, 2),
    acc_norm NUMERIC(4, 3),
    underpass SMALLINT DEFAULT 0 CHECK (underpass IN (0, 1)),
    hotspot SMALLINT DEFAULT 0 CHECK (hotspot IN (0, 1)),
    downstream_cell_id VARCHAR(32),
    s NUMERIC(4, 3) NOT NULL CHECK (s >= 0 AND s <= 1)
);

-- 5. Cell Risk table
DO $$ BEGIN
    CREATE TYPE risk_band AS ENUM ('none', 'possible', 'likely_affected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS cell_risk (
    cell_id VARCHAR(32) PRIMARY KEY REFERENCES grid_cells(id) ON DELETE CASCADE,
    risk NUMERIC(4, 3) NOT NULL CHECK (risk >= 0 AND risk <= 1),
    band risk_band NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    inputs JSONB NOT NULL
);

-- 6. Alerts table
DO $$ BEGIN
    CREATE TYPE alert_kind AS ENUM ('alert', 'clear', 'report_unverified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    cell VARCHAR(32) NOT NULL,
    severity SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 4),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    ttl_min INT DEFAULT 60,
    signature TEXT NOT NULL,
    kind alert_kind DEFAULT 'alert'
);

-- 7. Alert Deliveries table
DO $$ BEGIN
    CREATE TYPE delivery_channel AS ENUM ('push', 'sms');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'acknowledged', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS alert_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel delivery_channel NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    acked_at TIMESTAMPTZ,
    status delivery_status DEFAULT 'pending',
    UNIQUE(alert_id, user_id, channel)
);

-- 8. Safe Places table
DO $$ BEGIN
    CREATE TYPE shelter_verification AS ENUM ('official_shelter', 'listed', 'unverified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS safe_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    source VARCHAR(100) DEFAULT 'PMC listed',
    verification shelter_verification DEFAULT 'listed',
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    is_demo BOOLEAN DEFAULT FALSE
);

-- 9. SOS Records table
CREATE TABLE IF NOT EXISTS sos_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    incident_type VARCHAR(100) NOT NULL,
    photo_url TEXT,
    contact VARCHAR(20)
);

-- 10. Authority Log table
CREATE TABLE IF NOT EXISTS authority_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    confirmed_by VARCHAR(100) NOT NULL,
    recipients JSONB NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    message TEXT NOT NULL
);

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE cell_risk;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

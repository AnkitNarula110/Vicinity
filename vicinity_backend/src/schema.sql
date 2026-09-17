-- schema.sql
-- ----------
-- The complete Vicinity database. Source of truth for the schema.
--
-- Usage:
--   psql "$DATABASE_URL" -f schema.sql
--
-- This file is idempotent: safe to re-run. It uses IF NOT EXISTS
-- and ON CONFLICT everywhere. It does NOT drop anything.
--
-- Apply this ONCE against a fresh DB. After that, any schema change
-- is a new ALTER statement appended here + `cargo sqlx prepare` to
-- regenerate the offline cache.

-- ════════════════════════════════════════════════════════════════════
-- Extensions
-- ════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ════════════════════════════════════════════════════════════════════
-- Existing tables (from your Vicinity_DB dump)
-- These already exist — the IF NOT EXISTS clauses make this file safe
-- to run against your current DB.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
    userid        UUID         DEFAULT gen_random_uuid() NOT NULL,
    username      TEXT,
    email         TEXT,
    dob           DATE,
    password      TEXT,
    aadharnumber  TEXT,
    address       TEXT,
    isactive      BOOLEAN,
    createddate   TIMESTAMP,
    phone         TEXT,
    CONSTRAINT users_pkey PRIMARY KEY (userid),
    CONSTRAINT users_phone_key UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS public.profilepictures (
    userid          UUID NOT NULL,
    profilepicture  BYTEA,
    content         VARCHAR(225),
    CONSTRAINT profilepictures_pkey PRIMARY KEY (userid)
);

CREATE TABLE IF NOT EXISTS public.rentableusers (
    registrationid          UUID            NOT NULL,
    userid                  UUID            NOT NULL,
    hourlyprice             NUMERIC(10,2)   NOT NULL,
    description             TEXT,
    skills                  TEXT[],
    isavailable             BOOLEAN,
    isverified              BOOLEAN,
    rating                  NUMERIC(3,2),
    location                VARCHAR(255),
    latitude                NUMERIC(10,8),
    longitude               NUMERIC(11,8),
    languages               TEXT[],
    createdat               TIMESTAMP,
    aadhaarfrontimage       BYTEA,
    aadhaarbackimage        BYTEA,
    aadhaarfrontcontenttype VARCHAR(100),
    aadhaarbackcontenttype  VARCHAR(100),
    CONSTRAINT rentableusers_pkey PRIMARY KEY (registrationid),
    CONSTRAINT rentableusers_userid_key UNIQUE (userid)
);

CREATE TABLE IF NOT EXISTS public.personrentals (
    rentalid        UUID            NOT NULL,
    renterid        UUID            NOT NULL,
    customerid      UUID            NOT NULL,
    amountperhour   NUMERIC(10,2)   NOT NULL,
    hoursrented     NUMERIC(5,2)    NOT NULL,
    rentaldate      DATE            NOT NULL,
    totalamount     NUMERIC(10,2)   GENERATED ALWAYS AS (amountperhour * hoursrented) STORED,
    status          INTEGER,
    paymentstatus   INTEGER,
    notes           TEXT,
    createdat       TIMESTAMP,
    CONSTRAINT personrentals_pkey PRIMARY KEY (rentalid),
    CONSTRAINT different_people  CHECK (renterid <> customerid),
    CONSTRAINT positive_amount   CHECK (amountperhour > 0),
    CONSTRAINT positive_hours    CHECK (hoursrented > 0)
);

CREATE TABLE IF NOT EXISTS public.passwordresetotp (
    id           UUID        NOT NULL,
    userid       UUID        NOT NULL,
    phone        TEXT        NOT NULL,
    otp_hash     TEXT        NOT NULL,
    expires_at   TIMESTAMP   NOT NULL,
    is_verified  BOOLEAN     DEFAULT false,
    attempts     INTEGER     DEFAULT 0,
    createddate  TIMESTAMP,
    CONSTRAINT passwordresetotp_pkey PRIMARY KEY (id)
);

-- ════════════════════════════════════════════════════════════════════
-- Vicinity columns on `users` (additive, nullable)
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS bio          TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
    ADD COLUMN IF NOT EXISTS fcm_token    TEXT,
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.users
SET display_name = username
WHERE display_name IS NULL AND username IS NOT NULL;

-- Length checks (guarded by NOT EXISTS to be idempotent).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_users_display_name_len'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT chk_users_display_name_len
            CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 60);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_users_bio_len'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT chk_users_bio_len
            CHECK (bio IS NULL OR length(bio) <= 500);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_email_ci
    ON public.users (lower(email::text))
    WHERE email IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════
-- Vicinity tables
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.interests (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    tag        TEXT         NOT NULL CHECK (length(tag) BETWEEN 1 AND 40),
    weight     NUMERIC(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_interests_user_tag
    ON public.interests (user_id, tag);

CREATE TABLE IF NOT EXISTS public.photos (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    url        TEXT        NOT NULL,
    position   INTEGER     NOT NULL CHECK (position BETWEEN 0 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_photos_avatar
    ON public.photos (user_id) WHERE position = 0;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_photos_user_pos
    ON public.photos (user_id, position);

-- Enums (guarded — CREATE TYPE has no IF NOT EXISTS in older PG).
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nudge_status') THEN
        CREATE TYPE public.nudge_status AS ENUM
            ('pending','mutual','declined','expired','notified');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_category') THEN
        CREATE TYPE public.report_category AS ENUM
            ('harassment','fake_profile','inappropriate_photo',
             'safety_concern','spam','other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM
            ('open','reviewing','actioned','dismissed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_kind') THEN
        CREATE TYPE public.notification_kind AS ENUM
            ('match_incoming','nudge_mutual','meet_confirmed',
             'meet_expired','safe_word_alert','system');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.nudges (
    id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID                REFERENCES public.users(userid) ON DELETE CASCADE,
    to_user_id   UUID                REFERENCES public.users(userid) ON DELETE CASCADE,
    status       public.nudge_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ         NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_nudges_directed
    ON public.nudges (from_user_id, to_user_id)
    WHERE from_user_id IS NOT NULL AND to_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.meets (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id           UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    user_b_id           UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    nudge_id            UUID        NOT NULL REFERENCES public.nudges(id) ON DELETE CASCADE,
    confirmed_at        TIMESTAMPTZ,
    location_expires_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_a_id < user_b_id)
);

CREATE TABLE IF NOT EXISTS public.matches (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id    UUID         NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    user_b_id    UUID         NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    score        NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    venue_id     TEXT         NOT NULL,
    gates_passed JSONB        NOT NULL DEFAULT '{}'::jsonb,
    fcm_sent_a   BOOLEAN      NOT NULL DEFAULT FALSE,
    fcm_sent_b   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (user_a_id < user_b_id)
);

CREATE TABLE IF NOT EXISTS public.safe_word_flags (
    id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    meet_id         UUID             NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
    triggered_by    UUID             NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    note            TEXT,
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    device_meta     JSONB            NOT NULL DEFAULT '{}'::jsonb,
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID             REFERENCES public.users(userid) ON DELETE SET NULL,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.devices (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    device_id    TEXT        NOT NULL,
    platform     TEXT        NOT NULL CHECK (platform IN ('ios','android')),
    label        TEXT,
    fcm_token    TEXT,
    app_version  TEXT,
    os_version   TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_devices_user_device
    ON public.devices (user_id, device_id);

CREATE TABLE IF NOT EXISTS public.blocks (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    blocked_id UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    reason     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (blocker_id <> blocked_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_blocks_pair
    ON public.blocks (blocker_id, blocked_id);

CREATE TABLE IF NOT EXISTS public.reports (
    id              UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID                   NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    reported_id     UUID                   NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    meet_id         UUID                   REFERENCES public.meets(id) ON DELETE SET NULL,
    nudge_id        UUID                   REFERENCES public.nudges(id) ON DELETE SET NULL,
    category        public.report_category NOT NULL,
    details         TEXT,
    status          public.report_status   NOT NULL DEFAULT 'open',
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID                   REFERENCES public.users(userid) ON DELETE SET NULL,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ            NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ            NOT NULL DEFAULT now(),
    CHECK (reporter_id <> reported_id)
);

CREATE TABLE IF NOT EXISTS public.venue_hints (
    venue_id          TEXT             PRIMARY KEY,
    lat               DOUBLE PRECISION NOT NULL,
    lng               DOUBLE PRECISION NOT NULL,
    label             TEXT,
    category          TEXT,
    observation_count BIGINT           NOT NULL DEFAULT 1,
    first_seen_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
    last_seen_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_log (
    id             UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID                     NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    device_id      UUID                     REFERENCES public.devices(id) ON DELETE SET NULL,
    kind           public.notification_kind NOT NULL,
    payload        JSONB                    NOT NULL DEFAULT '{}'::jsonb,
    fcm_message_id TEXT,
    error          TEXT,
    created_at     TIMESTAMPTZ              NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interest_tags_catalog (
    slug       TEXT        PRIMARY KEY,
    label      TEXT        NOT NULL,
    category   TEXT        NOT NULL,
    icon       TEXT,
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order INTEGER     NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meet_messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nudge_id   UUID        NOT NULL REFERENCES public.nudges(id) ON DELETE CASCADE,
    meet_id    UUID        REFERENCES public.meets(id) ON DELETE SET NULL,
    sender_id  UUID        NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
    body       TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
-- Indexes
-- ════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_createddate       ON public.users (createddate DESC);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm     ON public.users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_interests_tag           ON public.interests (tag);
CREATE INDEX IF NOT EXISTS idx_photos_avatar           ON public.photos (user_id) WHERE position = 0;
CREATE INDEX IF NOT EXISTS idx_nudges_pending          ON public.nudges (from_user_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_nudges_mutual           ON public.nudges (status, updated_at DESC) WHERE status = 'mutual';
CREATE INDEX IF NOT EXISTS idx_meets_history_a         ON public.meets (user_a_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meets_history_b         ON public.meets (user_b_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meets_expires_a         ON public.meets (user_a_id, location_expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_meets_expires_b         ON public.meets (user_b_id, location_expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user_a          ON public.matches (user_a_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user_b          ON public.matches (user_b_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_venue           ON public.matches (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safe_word_open          ON public.safe_word_flags (created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_safe_word_meet          ON public.safe_word_flags (meet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_user_active     ON public.devices (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blocks_blocker          ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked          ON public.blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_open            ON public.reports (created_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_reports_reported        ON public.reports (reported_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_hints_label       ON public.venue_hints (label) WHERE label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_hints_recent      ON public.venue_hints (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_user   ON public.notification_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_errors ON public.notification_log (created_at DESC) WHERE error IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON public.notification_log (created_at);
CREATE INDEX IF NOT EXISTS idx_interest_catalog_cat    ON public.interest_tags_catalog (category, sort_order) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_meet_messages_nudge     ON public.meet_messages (nudge_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meet_messages_unread    ON public.meet_messages (sender_id, read_at) WHERE read_at IS NULL;

-- ════════════════════════════════════════════════════════════════════
-- Triggers
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at   ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_nudges_updated_at  ON public.nudges;
CREATE TRIGGER trg_nudges_updated_at
    BEFORE UPDATE ON public.nudges
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_devices_updated_at ON public.devices;
CREATE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_venue_hint()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at      = now();
    NEW.observation_count = OLD.observation_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_venue_hints_touch ON public.venue_hints;
CREATE TRIGGER trg_venue_hints_touch
    BEFORE UPDATE ON public.venue_hints
    FOR EACH ROW EXECUTE FUNCTION public.touch_venue_hint();

-- ════════════════════════════════════════════════════════════════════
-- Views
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.v_active_users AS
SELECT
    u.userid                             AS id,
    COALESCE(u.display_name, u.username) AS display_name,
    u.username, u.email, u.phone,
    p.url                                AS avatar_url,
    (SELECT count(*) FROM public.interests i WHERE i.user_id = u.userid) AS interest_count,
    u.createddate, u.isactive
FROM public.users u
LEFT JOIN public.photos p ON p.user_id = u.userid AND p.position = 0
WHERE u.isactive IS TRUE;

CREATE OR REPLACE VIEW public.v_open_safety_alerts AS
SELECT f.id AS flag_id, f.meet_id, f.triggered_by, f.note, f.lat, f.lng,
       f.created_at, m.user_a_id, m.user_b_id
FROM public.safe_word_flags f
JOIN public.meets m ON m.id = f.meet_id
WHERE f.resolved_at IS NULL;

CREATE OR REPLACE VIEW public.v_match_feed AS
SELECT mt.id, mt.score, mt.venue_id, mt.created_at,
       COALESCE(ua.display_name, ua.username) AS user_a_name,
       COALESCE(ub.display_name, ub.username) AS user_b_name
FROM public.matches mt
JOIN public.users ua ON ua.userid = mt.user_a_id
JOIN public.users ub ON ub.userid = mt.user_b_id;

-- ════════════════════════════════════════════════════════════════════
-- Seed data — reference rows (idempotent)
-- ════════════════════════════════════════════════════════════════════
INSERT INTO public.interest_tags_catalog (slug, label, category, sort_order) VALUES
    ('music','Music','Arts',10),
    ('live_music','Live music','Arts',20),
    ('film','Film','Arts',30),
    ('reading','Reading','Arts',40),
    ('photography','Photography','Arts',50),
    ('startups','Startups','Work',10),
    ('design','Design','Work',20),
    ('engineering','Engineering','Work',30),
    ('running','Running','Sports',10),
    ('cycling','Cycling','Sports',20),
    ('yoga','Yoga','Sports',30),
    ('climbing','Climbing','Sports',40),
    ('coffee','Coffee','Food',10),
    ('cooking','Cooking','Food',20),
    ('wine','Wine','Food',30),
    ('travel','Travel','Life',10),
    ('pets','Pets','Life',20),
    ('board_games','Board games','Life',30)
ON CONFLICT (slug) DO NOTHING;
const db = require('./index');

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT    NOT NULL DEFAULT 'default',
    date            TEXT    NOT NULL,
    itch            INTEGER,
    redness         INTEGER,
    dryness         INTEGER,
    swelling        INTEGER,
    outcome         TEXT,
    stress          INTEGER,
    weather         TEXT,
    food            TEXT,
    other_triggers  TEXT,
    cream           TEXT,
    antihistamine   INTEGER,
    care            INTEGER,
    sleep           REAL,
    general_feel    INTEGER,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS poem (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           TEXT    NOT NULL DEFAULT 'default',
    week_start        TEXT    NOT NULL,
    itching           INTEGER NOT NULL,
    sleep_disturbance INTEGER NOT NULL,
    bleeding          INTEGER NOT NULL,
    weeping           INTEGER NOT NULL,
    cracking          INTEGER NOT NULL,
    peeling           INTEGER NOT NULL,
    dryness           INTEGER NOT NULL,
    total_score       INTEGER NOT NULL,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, week_start)
  );
`);

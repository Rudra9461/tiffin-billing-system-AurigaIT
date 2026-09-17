const Database = require('better-sqlite3');
const db = new Database('tiffin.db');

db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  plan_name TEXT NOT NULL,
  plan_price REAL NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS pauses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- T6: ownership history so billing can be split by who was actually served
CREATE TABLE IF NOT EXISTS subscription_owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- T1: simulated "today" the grader controls via POST /clock
CREATE TABLE IF NOT EXISTS clock_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_date TEXT NOT NULL
);

-- T1: log of notifications "sent" to the Notification Service (simulated)
CREATE TABLE IF NOT EXISTS notifications_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  subscription_id INTEGER NOT NULL,
  delivery_date TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(subscription_id, delivery_date)
);
`);

// Seed clock_state with today's date if empty
const clockRow = db.prepare('SELECT * FROM clock_state WHERE id = 1').get();
if (!clockRow) {
  db.prepare('INSERT INTO clock_state (id, current_date) VALUES (1, ?)')
    .run(new Date().toISOString().slice(0, 10));
}

// Backfill: any subscription created before T6 existed needs an initial ownership segment
const subsWithoutSegment = db.prepare(`
  SELECT s.id, s.customer_id, s.start_date
  FROM subscriptions s
  WHERE NOT EXISTS (SELECT 1 FROM subscription_owners so WHERE so.subscription_id = s.id)
`).all();

const backfillSeg = db.prepare(
  'INSERT INTO subscription_owners (subscription_id, customer_id, start_date, end_date) VALUES (?, ?, ?, NULL)'
);
for (const sub of subsWithoutSegment) {
  backfillSeg.run(sub.id, sub.customer_id, sub.start_date);
}

module.exports = db;
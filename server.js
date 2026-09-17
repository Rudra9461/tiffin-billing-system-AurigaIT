require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateToken, authMiddleware } = require('./auth');
const { calculateBill, calculateBillSplit, isPausedOnDate, isWeekday, addDays } = require('./billing');
const { processImportRows } = require('./import');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== AUTH ====================

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name, email, password_hash);

  const user = { id: result.lastInsertRowid, name, email };
  const token = generateToken(user);
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = generateToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

// ==================== CUSTOMERS ====================

const STATUS_SUBQUERY = `
  (SELECT CASE
     WHEN EXISTS (
       SELECT 1 FROM pauses p
       WHERE p.subscription_id = (SELECT id FROM subscriptions s2 WHERE s2.customer_id = c.id ORDER BY s2.id DESC LIMIT 1)
       AND p.end_date IS NULL
     ) THEN 'paused'
     WHEN (SELECT id FROM subscriptions s2 WHERE s2.customer_id = c.id ORDER BY s2.id DESC LIMIT 1) IS NOT NULL THEN 'active'
     ELSE NULL
   END) as status
`;

app.post('/api/customers', authMiddleware, (req, res) => {
  const { name, phone, address } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone);
  if (existing) return res.status(409).json({ error: 'Phone number already exists' });

  const result = db.prepare(
    'INSERT INTO customers (owner_id, name, phone, address) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, name, phone, address || '');

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(customer);
});

app.get('/api/customers', authMiddleware, (req, res) => {
  const { search = '', page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;

  const allowedSort = ['name', 'phone', 'created_at'];
  const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const whereClause = search ? `WHERE c.owner_id = ? AND (c.phone LIKE ? OR c.name LIKE ?)` : `WHERE c.owner_id = ?`;
  const params = search ? [req.user.id, `%${search}%`, `%${search}%`] : [req.user.id];

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM customers c ${whereClause}`
  ).get(...params).count;

  const customers = db.prepare(`
    SELECT c.*, ${STATUS_SUBQUERY}
    FROM customers c
    ${whereClause}
    ORDER BY c.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ customers, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
});

app.get('/api/customers/:id', authMiddleware, (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ? ORDER BY id DESC')
    .all(customer.id);

  res.json({ ...customer, subscriptions });
});

app.get('/api/customers-status/summary', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.phone, ${STATUS_SUBQUERY}
    FROM customers c
    WHERE c.owner_id = ?
  `).all(req.user.id);

  const active = rows.filter(r => r.status === 'active');
  const paused = rows.filter(r => r.status === 'paused');
  const noSub = rows.filter(r => !r.status);

  res.json({ active, paused, noSubscription: noSub, counts: { active: active.length, paused: paused.length, noSubscription: noSub.length } });
});

// T4: bulk import
app.post('/api/customers/import', authMiddleware, (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows must be a non-empty array' });
  }

  const existingRows = db.prepare('SELECT phone FROM customers WHERE owner_id = ?').all(req.user.id);
  const existingPhones = new Set(existingRows.map(r => r.phone));

  const { imported, deduped, rejected } = processImportRows(rows, existingPhones);

  const insertCustomer = db.prepare('INSERT INTO customers (owner_id, name, phone, address) VALUES (?, ?, ?, ?)');
  const insertSub = db.prepare('INSERT INTO subscriptions (customer_id, plan_name, plan_price, start_date, status) VALUES (?, ?, ?, ?, ?)');
  const insertOwnerSeg = db.prepare('INSERT INTO subscription_owners (subscription_id, customer_id, start_date, end_date) VALUES (?, ?, ?, NULL)');
  const today = new Date().toISOString().slice(0, 10);

  const createdCustomers = [];

  const tx = db.transaction((items) => {
    for (const item of items) {
      const custResult = insertCustomer.run(req.user.id, item.name, item.phone, item.address || '');
      const customerId = custResult.lastInsertRowid;
      let subscriptionId = null;

      if (item.plan_name && item.plan_price) {
        const subStart = item.start_date || today;
        const subResult = insertSub.run(customerId, item.plan_name, item.plan_price, subStart, 'active');
        subscriptionId = subResult.lastInsertRowid;
        insertOwnerSeg.run(subscriptionId, customerId, subStart);
      }

      createdCustomers.push({ customer_id: customerId, subscription_id: subscriptionId, name: item.name, phone: item.phone });
    }
  });
  tx(imported);

  res.json({
    summary: { importedCount: createdCustomers.length, dedupedCount: deduped.length, rejectedCount: rejected.length },
    imported: createdCustomers,
    deduped,
    rejected
  });
});

// ==================== SUBSCRIPTIONS / PAUSE / RESUME / BILL / TRANSFER ====================

app.post('/api/subscriptions', authMiddleware, (req, res) => {
  const { customer_id, plan_name, plan_price, start_date } = req.body;
  if (!customer_id || !plan_name || !plan_price || !start_date) {
    return res.status(400).json({ error: 'customer_id, plan_name, plan_price, start_date are required' });
  }
  if (isNaN(Date.parse(start_date))) {
    return res.status(400).json({ error: 'Invalid start_date' });
  }
  if (plan_price <= 0) {
    return res.status(400).json({ error: 'plan_price must be positive' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND owner_id = ?')
    .get(customer_id, req.user.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const result = db.prepare(
    'INSERT INTO subscriptions (customer_id, plan_name, plan_price, start_date, status) VALUES (?, ?, ?, ?, ?)'
  ).run(customer_id, plan_name, plan_price, start_date, 'active');

  const subId = result.lastInsertRowid;

  // T6: seed the initial ownership segment
  db.prepare(
    'INSERT INTO subscription_owners (subscription_id, customer_id, start_date, end_date) VALUES (?, ?, ?, NULL)'
  ).run(subId, customer_id, start_date);

  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subId);
  res.status(201).json(subscription);
});

app.post('/api/subscriptions/:id/pause', authMiddleware, (req, res) => {
  const { start_date, end_date } = req.body;
  if (!start_date) return res.status(400).json({ error: 'start_date is required' });
  if (isNaN(Date.parse(start_date))) return res.status(400).json({ error: 'Invalid start_date' });
  if (end_date && isNaN(Date.parse(end_date))) return res.status(400).json({ error: 'Invalid end_date' });
  if (end_date && end_date < start_date) return res.status(400).json({ error: 'end_date cannot be before start_date' });

  const sub = db.prepare(`
    SELECT s.* FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.id = ? AND c.owner_id = ?
  `).get(req.params.id, req.user.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const openPause = db.prepare(
    'SELECT * FROM pauses WHERE subscription_id = ? AND end_date IS NULL'
  ).get(sub.id);
  if (openPause) {
    return res.status(409).json({ error: 'Subscription already paused. Resume before pausing again.', openPause });
  }

  const result = db.prepare(
    'INSERT INTO pauses (subscription_id, start_date, end_date) VALUES (?, ?, ?)'
  ).run(sub.id, start_date, end_date || null);

  if (!end_date) {
    db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run('paused', sub.id);
  }

  const pause = db.prepare('SELECT * FROM pauses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(pause);
});

app.post('/api/subscriptions/:id/resume', authMiddleware, (req, res) => {
  const { end_date } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const resumeDate = end_date || today;

  if (isNaN(Date.parse(resumeDate))) return res.status(400).json({ error: 'Invalid end_date' });

  const sub = db.prepare(`
    SELECT s.* FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.id = ? AND c.owner_id = ?
  `).get(req.params.id, req.user.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const openPause = db.prepare(
    'SELECT * FROM pauses WHERE subscription_id = ? AND end_date IS NULL'
  ).get(sub.id);
  if (!openPause) {
    return res.status(400).json({ error: 'No active pause to resume from' });
  }
  if (resumeDate < openPause.start_date) {
    return res.status(400).json({ error: 'end_date cannot be before the pause start_date' });
  }

  db.prepare('UPDATE pauses SET end_date = ? WHERE id = ?').run(resumeDate, openPause.id);
  db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run('active', sub.id);

  const pause = db.prepare('SELECT * FROM pauses WHERE id = ?').get(openPause.id);
  res.json(pause);
});

// T6: transfer subscription to a new customer mid-cycle
app.post('/api/subscriptions/:id/transfer', authMiddleware, (req, res) => {
  const { new_customer_id, transfer_date } = req.body;
  if (!new_customer_id || !transfer_date) {
    return res.status(400).json({ error: 'new_customer_id and transfer_date are required' });
  }
  if (isNaN(Date.parse(transfer_date))) {
    return res.status(400).json({ error: 'Invalid transfer_date' });
  }

  const sub = db.prepare(`
    SELECT s.* FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.id = ? AND c.owner_id = ?
  `).get(req.params.id, req.user.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ? AND owner_id = ?')
    .get(new_customer_id, req.user.id);
  if (!newCustomer) return res.status(404).json({ error: 'New customer not found' });

  if (Number(new_customer_id) === sub.customer_id) {
    return res.status(400).json({ error: 'Cannot transfer subscription to its current customer' });
  }
  if (transfer_date < sub.start_date) {
    return res.status(400).json({ error: 'transfer_date cannot be before the subscription start date' });
  }

  let currentSegment = db.prepare(
    'SELECT * FROM subscription_owners WHERE subscription_id = ? AND end_date IS NULL'
  ).get(sub.id);

  // Self-heal: if no open segment exists (legacy data), create one before transferring
  if (!currentSegment) {
    db.prepare(
      'INSERT INTO subscription_owners (subscription_id, customer_id, start_date, end_date) VALUES (?, ?, ?, NULL)'
    ).run(sub.id, sub.customer_id, sub.start_date);
    currentSegment = db.prepare(
      'SELECT * FROM subscription_owners WHERE subscription_id = ? AND end_date IS NULL'
    ).get(sub.id);
  }

  if (transfer_date <= currentSegment.start_date) {
    return res.status(400).json({ error: 'transfer_date must be after the current owner\'s start date' });
  }

  const closeDate = addDays(transfer_date, -1);

  const tx = db.transaction(() => {
    db.prepare('UPDATE subscription_owners SET end_date = ? WHERE id = ?').run(closeDate, currentSegment.id);
    db.prepare(
      'INSERT INTO subscription_owners (subscription_id, customer_id, start_date, end_date) VALUES (?, ?, ?, NULL)'
    ).run(sub.id, new_customer_id, transfer_date);
    db.prepare('UPDATE subscriptions SET customer_id = ? WHERE id = ?').run(new_customer_id, sub.id);
  });
  tx();

  const segments = db.prepare(
    'SELECT * FROM subscription_owners WHERE subscription_id = ? ORDER BY start_date ASC'
  ).all(sub.id);

  res.json({ subscription_id: sub.id, transferred_to: new_customer_id, transfer_date, segments });
});

// BILL — now includes per-customer split (backward compatible: same fields as before, plus splitByCustomer)
app.get('/api/subscriptions/:id/bill', authMiddleware, (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month must be in YYYY-MM format' });

  const sub = db.prepare(`
    SELECT s.* FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.id = ? AND c.owner_id = ?
  `).get(req.params.id, req.user.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const pauses = db.prepare('SELECT start_date, end_date FROM pauses WHERE subscription_id = ?').all(sub.id);
  const ownerSegments = db.prepare(
    'SELECT * FROM subscription_owners WHERE subscription_id = ? ORDER BY start_date ASC'
  ).all(sub.id);

  const result = calculateBillSplit(sub, pauses, ownerSegments, month);
  res.json({ subscription_id: sub.id, plan_price: sub.plan_price, ...result });
});

// ==================== T1: CLOCK + NOTIFICATION OUTBOX ====================
// No auth — simulates an external scheduler / grader calling the system directly.

app.post('/api/clock', (req, res) => {
  const { date } = req.body;
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
  }

  db.prepare('UPDATE clock_state SET current_date = ? WHERE id = 1').run(date);

  const weekday = isWeekday(date);
  const notified = [];
  let dueCount = 0;

  if (weekday) {
    const subs = db.prepare('SELECT * FROM subscriptions WHERE start_date <= ?').all(date);
    const insertNotif = db.prepare(`
      INSERT OR IGNORE INTO notifications_outbox (customer_id, subscription_id, delivery_date, message)
      VALUES (?, ?, ?, ?)
    `);

    for (const sub of subs) {
      const pauses = db.prepare('SELECT start_date, end_date FROM pauses WHERE subscription_id = ?').all(sub.id);
      if (isPausedOnDate(pauses, date)) continue;

      dueCount++;

      const segments = db.prepare(
        'SELECT * FROM subscription_owners WHERE subscription_id = ? ORDER BY start_date ASC'
      ).all(sub.id);
      const activeSeg = segments.find(s => date >= s.start_date && (!s.end_date || date <= s.end_date));
      const ownerCustomerId = activeSeg ? activeSeg.customer_id : sub.customer_id;

      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(ownerCustomerId);
      if (!customer) continue;

      const message = `Hi ${customer.name}, your tiffin is scheduled for delivery today (${date}).`;
      const result = insertNotif.run(ownerCustomerId, sub.id, date, message);
      if (result.changes > 0) {
        notified.push({ customer_id: ownerCustomerId, subscription_id: sub.id, delivery_date: date, message });
      }
    }
  }

  res.json({ date, isWeekday: weekday, dueToday: dueCount, notifiedCount: notified.length, notified });
});

app.get('/api/outbox', (req, res) => {
  const { date } = req.query;
  const rows = date
    ? db.prepare(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone
        FROM notifications_outbox o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.delivery_date = ?
        ORDER BY o.id DESC
      `).all(date)
    : db.prepare(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone
        FROM notifications_outbox o
        JOIN customers c ON c.id = o.customer_id
        ORDER BY o.id DESC
      `).all();

  res.json({ count: rows.length, outbox: rows });
});

// ==================== HEALTH ====================

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Tiffin Billing API running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateToken, authMiddleware } = require('./auth');
const { calculateBill } = require('./billing');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== AUTH ====================

// REGISTER
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

// LOGIN
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

// STATUS SUBQUERY (derived live from open pauses, not a stored column)
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

// CREATE CUSTOMER
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

// LIST CUSTOMERS (search + pagination + sorting)
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
    SELECT c.*,
      ${STATUS_SUBQUERY}
    FROM customers c
    ${whereClause}
    ORDER BY c.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    customers,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  });
});

// GET SINGLE CUSTOMER
app.get('/api/customers/:id', authMiddleware, (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ? ORDER BY id DESC')
    .all(customer.id);

  res.json({ ...customer, subscriptions });
});

// ACTIVE VS PAUSED SUMMARY
app.get('/api/customers-status/summary', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.phone,
      ${STATUS_SUBQUERY}
    FROM customers c
    WHERE c.owner_id = ?
  `).all(req.user.id);

  const active = rows.filter(r => r.status === 'active');
  const paused = rows.filter(r => r.status === 'paused');
  const noSub = rows.filter(r => !r.status);

  res.json({ active, paused, noSubscription: noSub, counts: { active: active.length, paused: paused.length, noSubscription: noSub.length } });
});

// ==================== SUBSCRIPTIONS / PAUSE / RESUME / BILL ====================

// SUBSCRIBE
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

  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(subscription);
});

// PAUSE
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

  // Duplicate pause check: an open pause (still ongoing) already exists
  const openPause = db.prepare(
    'SELECT * FROM pauses WHERE subscription_id = ? AND end_date IS NULL'
  ).get(sub.id);
  if (openPause) {
    return res.status(409).json({ error: 'Subscription already paused. Resume before pausing again.', openPause });
  }

  const result = db.prepare(
    'INSERT INTO pauses (subscription_id, start_date, end_date) VALUES (?, ?, ?)'
  ).run(sub.id, start_date, end_date || null);

  // Only mark subscription as currently "paused" if this pause is OPEN (no end_date yet).
  // A pause logged with both start and end date already known is a historical/planned
  // record and doesn't mean the customer is paused right now.
  if (!end_date) {
    db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run('paused', sub.id);
  }

  const pause = db.prepare('SELECT * FROM pauses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(pause);
});

// RESUME
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

// BILL
app.get('/api/subscriptions/:id/bill', authMiddleware, (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month must be in YYYY-MM format' });

  const sub = db.prepare(`
    SELECT s.* FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.id = ? AND c.owner_id = ?
  `).get(req.params.id, req.user.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  const pauses = db.prepare('SELECT start_date, end_date FROM pauses WHERE subscription_id = ?').all(sub.id);

  const result = calculateBill(sub, pauses, month);
  res.json({ subscription_id: sub.id, plan_price: sub.plan_price, ...result });
});

// ==================== HEALTH ====================

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Tiffin Billing API running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateToken, authMiddleware } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
      (SELECT status FROM subscriptions s WHERE s.customer_id = c.id ORDER BY s.id DESC LIMIT 1) as status
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
      (SELECT status FROM subscriptions s WHERE s.customer_id = c.id ORDER BY s.id DESC LIMIT 1) as status
    FROM customers c
    WHERE c.owner_id = ?
  `).all(req.user.id);

  const active = rows.filter(r => r.status === 'active');
  const paused = rows.filter(r => r.status === 'paused');
  const noSub = rows.filter(r => !r.status);

  res.json({ active, paused, noSubscription: noSub, counts: { active: active.length, paused: paused.length, noSubscription: noSub.length } });
});


app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Tiffin Billing API running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
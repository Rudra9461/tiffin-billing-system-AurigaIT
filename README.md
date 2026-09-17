# 🍱 Tiffin Billing System

A full-stack subscription and pro-rated billing manager for home-style tiffin (lunch delivery) services. Customers are billed only for the weekdays they were actually served — paused days are never charged.

## Product Overview
Tiffin owners subscribe customers to a monthly plan. Customers are served on weekdays. When a customer pauses service (travel, festivals, etc.), those weekdays are excluded from billing. At month-end, the owner gets an accurate, verifiable, pro-rated bill per customer.

## Features
- Owner registration & login (JWT auth)
- Add / manage customers
- Subscribe customer to a monthly plan
- Pause / resume service with date ranges
- Pro-rated bill calculation (weekday-based)
- Search customers by name/phone
- Active vs Paused vs No-subscription dashboard view
- Paginated, sortable customer list
- Landing page

## Technology Stack
- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3`) — file-based, persistent, zero external setup
- **Auth:** JWT (`jsonwebtoken`) + bcrypt password hashing
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework, no build step)

## Database Schema
- `users` — id, name, email (unique), password_hash, created_at
- `customers` — id, owner_id, name, phone (unique), address, created_at
- `subscriptions` — id, customer_id, plan_name, plan_price, start_date, status, created_at
- `pauses` — id, subscription_id, start_date, end_date (NULL = currently paused/open), created_at

Status (active/paused) is **derived live** from whether an open pause (`end_date IS NULL`) exists on the customer's latest subscription — not stored as a separate mutable flag, to avoid drift.

## Environment Variables
Create a `.env` file in the project root:


## Installation & Setup
```bash
npm install
```

## Running the Project
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start        # plain node
```
Server runs at `http://localhost:3000`. In GitHub Codespaces, use the forwarded URL from the **Ports** tab.

- Landing page: `/`
- Login/Register: `/login.html`
- Dashboard: `/dashboard.html`

## Debugging / Common Issues
- **Blank page in Codespaces:** don't use `localhost` directly — use the forwarded URL from the Ports tab (right-click port 3000 → Open in Browser).
- **`ReferenceError` in server.js:** usually means the file has stray text pasted in (e.g. shell command accidentally saved into the file). Re-check `head -5 server.js` and `tail -5 server.js`.
- **401 Unauthorized on API calls:** token missing/expired — log in again via `/login.html`, it's stored in `localStorage`.
- **SQLite DB not updating:** delete `tiffin.db` and restart server to get a fresh schema (⚠️ wipes data).

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new owner |
| POST | `/api/auth/login` | Login, returns JWT |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/customers` | Create customer |
| GET | `/api/customers?search=&page=&limit=&sort=&order=` | List customers (search/paginate/sort) |
| GET | `/api/customers/:id` | Get single customer + subscriptions |
| GET | `/api/customers-status/summary` | Active vs Paused vs No-subscription counts |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/subscriptions` | Subscribe customer to a plan |
| POST | `/api/subscriptions/:id/pause` | Pause service (`start_date`, optional `end_date`) |
| POST | `/api/subscriptions/:id/resume` | Resume service (`end_date`, defaults to today) |
| GET | `/api/subscriptions/:id/bill?month=YYYY-MM` | Get pro-rated bill for a month |

## Example API Requests

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Owner","email":"owner@test.com","password":"pass123"}'
```

**Subscribe**
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"customer_id":1,"plan_name":"Standard Lunch","plan_price":3000,"start_date":"2026-09-01"}'
```

**Get Bill**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/subscriptions/1/bill?month=2026-09"
```
Response:
```json
{
  "subscription_id": 1,
  "plan_price": 3000,
  "month": "2026-09",
  "eligibleWeekdays": 22,
  "pausedWeekdays": 3,
  "servedWeekdays": 19,
  "dailyRate": 136.36,
  "bill": 2590.91
}
```

## Billing Logic (Business Rule)
- Only **weekdays (Mon–Fri)** are eligible/billable days.
- `daily_rate = plan_price / eligible_weekdays_in_month`
- `served_weekdays = eligible_weekdays - paused_weekdays`
- `bill = daily_rate × served_weekdays`
- Weekend pauses have no billing effect (weekends were never billed).
- Pauses are capped to the subscription's active window within the billed month (handles pause-before-subscription, pause-covering-rest-of-month, etc.). See `REASONING.md` for full edge case handling.
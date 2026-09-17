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

### Subscription Transfer (T6)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/subscriptions/:id/transfer` | Transfer subscription to a new customer mid-cycle. Billing for that month splits between old and new customer based on who was served each day. |

### Notifications (T1)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/clock` | Advance simulated "today" (`{date: YYYY-MM-DD}`). Notifies all active, non-paused customers due for delivery that day (weekdays only). Idempotent — repeat calls for the same date don't re-notify. |
| GET | `/api/outbox?date=YYYY-MM-DD` | View notifications sent (optionally filtered by date). |

### Bulk Import (T4)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/customers/import` | Bulk import customers from messy data (`{rows: [...]}`). Handles duplicate phones, mixed date formats (`YYYY-MM-DD`, `DD/MM/YYYY`), and missing fields. Returns `{ summary, imported, deduped, rejected }` with reasons for every skipped row. |

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
## Twist Features Implemented
1. **T1 (Notification):** `/api/clock` simulates the passage of a day; on each call, active/non-paused/weekday-due customers get a notification logged to `/api/outbox`. Duplicate calls for the same date are idempotent (DB unique constraint on `subscription_id + delivery_date`).
2. **T6 (Lifecycle):** `/api/subscriptions/:id/transfer` moves a subscription to a new customer mid-cycle without resetting the plan or start date. Billing is tracked via an ownership-segment table and split day-by-day between old and new customer in the bill response (`splitByCustomer`).
3. **T4 (Messy Data):** `/api/customers/import` accepts raw rows, normalizes phone numbers and dates (`YYYY-MM-DD` or `DD/MM/YYYY`), rejects invalid/incomplete rows with explicit reasons, and dedupes both within the batch and against existing customers.
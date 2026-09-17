# Reasoning

## Problem Interpretation
[e.g. Billing must be based on actual weekdays served, not calendar days. Weekends are never billed regardless of pause status. Ambiguity resolved by treating weekday count as the sole denominator/numerator basis.]

## Requirements Identified
[List: auth, customer CRUD, subscription, pause/resume, pro-rated billing, search, pagination, sorting, active/paused dashboard, landing page]

## Architecture Decisions
- Monolith: Express serving both REST API and static frontend files — fastest to build/debug within 2.5hrs, no CORS/deployment complexity.
- SQLite over Postgres/MySQL: zero setup, file-based, persists across restarts, sufficient for MVP scale.
- Vanilla JS frontend over React: no build tooling needed, faster to wire up given time constraint.

## Database Design Decisions
- Separate `pauses` table (not a single "paused_until" field on subscription) to support multiple pause/resume cycles per subscription and keep full history for bill verification.
- `end_date IS NULL` on a pause = currently open/ongoing pause — used to derive live active/paused status instead of a separate mutable status column.

## Billing Logic
[Explain the formula, and specifically: how you handled pause-before-subscription, weekend pauses, multi-period pauses, open-ended pauses capped to month-end, etc. — reference the calculateBill function in billing.js]

## Assumptions
- Only Mon-Fri counted as billable/eligible days.
- Partial month subscriptions bill from start_date, not the 1st.
- [add any other assumption you made]

## How I Tested
[Be honest: list the curl commands you ran, what UI flows you clicked through, what edge cases you actually verified]

## Bugs Encountered & Fixes
1. [e.g. server.js heredoc paste corrupted the file — fixed by editing directly in VS Code editor instead of terminal heredoc]
2. [e.g. subscription status column went stale after a closed pause was logged — fixed by deriving status live from open pauses via SQL subquery instead of trusting a stored column]
3. [any other real issue you hit]

## Trade-offs
- No refresh token / token expiry handling — 7-day JWT expiry chosen for simplicity, acceptable for MVP.
- No delete/edit customer endpoints — out of scope for 2.5hr MVP, listed as future work.
- [any other trade-off you made under time pressure]


## Twist Features — Design Decisions

### T1 — Notification (Level 1)
- `POST /api/clock` simulates the passage of a day since we can't wait for real mornings during grading. It accepts a date, stores it as the simulated "today," and immediately evaluates which customers are due.
- A customer is "due" if: their subscription started on/before this date, today is a weekday, and they are not paused on this date (checked via `isPausedOnDate`).
- Notifications are logged to `notifications_outbox` instead of actually calling an external service — this simulates integration without needing real credentials/API.
- **Idempotency:** a `UNIQUE(subscription_id, delivery_date)` constraint plus `INSERT OR IGNORE` ensures calling `/clock` twice for the same date never double-notifies. Verified by testing.
- Transferred subscriptions notify whoever the **current owner** is on that date (uses `subscription_owners` segments), not the original customer.

### T6 — Subscription Transfer (Level 2)
- Added a `subscription_owners` table instead of just overwriting `customer_id` on the subscription — this preserves full ownership history, which is required to split a bill correctly when a transfer happens mid-month.
- Transfer closes the current owner's segment the day before `transfer_date` and opens a new segment for the new customer starting exactly on `transfer_date`.
- Billing (`calculateBillSplit`) walks day-by-day through the billing window and attributes each served weekday to whichever owner segment was active that day, then computes each customer's share of the bill from their served-day count. Chose a day-by-day walk over date-range math because it's simpler to reason about correctly with multiple transfers in one month, and the dataset size (weekdays in a month) is small enough that performance isn't a concern.
- Old billing behavior (`calculateBill`) was kept in `billing.js` for reference; the live `/bill` endpoint now always uses the split version, which is backward-compatible — a subscription with only one ownership segment just returns a `splitByCustomer` array with a single entry equal to the full bill.

### T4 — Messy Data Import (Level 3)
- `normalizePhone` strips all non-digits and keeps the last 10, handling `+91` prefixes and formatting differences; phones under 10 digits are rejected as invalid rather than guessed.
- `normalizeDate` accepts `YYYY-MM-DD` and `DD/MM/YYYY` (or `DD-MM-YYYY`) explicitly. Any other format is rejected rather than guessed — an incorrectly-guessed date is worse than an explicit rejection with a reason, since it would silently create a wrong subscription start date.
- Deduplication happens at two levels: within the same import batch (same phone appearing twice in one upload) and against existing customers already in the database — each gets a distinct reason string so the report is actionable.
- Every skipped row (deduped or rejected) includes a specific, human-readable reason — no silent drops, per the requirement that the report must be an `{imported, deduped, rejected}` breakdown.
- Import runs inside a single DB transaction so a partial failure can't leave the database in an inconsistent state.

## Testing (Twists)
["Tested T1 by calling /clock for a known weekday and weekend, confirmed dueToday counts and idempotency on repeat calls. Tested T6 by transferring a subscription mid-month and confirming the bill split summed to the same total as before transfer. Tested T4 with a mixed batch of 5 rows covering duplicate phone, missing name, invalid phone, and bad date format, confirmed each was categorized correctly with the right reason."] 
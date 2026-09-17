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
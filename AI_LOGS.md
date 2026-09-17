# AI Conversation Log

Tool used: Claude (Anthropic)

---
I am currently participating in an Auriga IT Round 2 "Builder" placement assessment.

I have STRICTLY 2.5 HOURS to build and submit a working full-stack product in GitHub Codespaces.

## ASSESSMENT RULES

AI tools are explicitly allowed.
I can use any AI assistant/tool.
I can use any programming language/framework I am comfortable with.
Development must be done in GitHub Codespaces using my college email account.
Final submission must be a PUBLIC GitHub repository.
The 2.5-hour deadline is strict.
I need to prioritize a working MVP over unnecessary complexity.
## MY PROBLEM STATEMENT

### Storyline

A home-style tiffin (lunch delivery) service.

Customers subscribe to a monthly plan and get lunch delivered every weekday.

Life happens — customers may pause their service for a few days because of travel, festivals, etc., and they should NOT be charged for paused days.

At month-end, the owner needs each customer's bill.

The plan price should be pro-rated based on the days the customer was actually delivered/served.

Customers are looked up by phone number.

The owner wants to see which customers are currently active versus paused.

### Main requirement

Build a product for ANY tiffin service where every customer is billed only for the days they were actually served.

The priority is:

Subscribe
Pause
Resume
Correct pro-rated billing
Customer lookup/search
Active vs paused customer visibility
Do not over-engineer the solution.

---

# MANDATORY REQUIREMENTS

The final solution MUST include ALL of the following:

### 1. Database

Use a real persistent database with a sensible schema.

Do NOT use only in-memory arrays/local variables for the final implementation.

The database should support the core concepts such as:

User/owner
Customer
Subscription/plan
Pause/resume or service history
Billing information where appropriate
Choose a database that is practical to implement quickly.

### 2. REST APIs

The application must expose REST APIs for the core operations.

At minimum, APIs should support:

User registration
User login
Customer creation/management
Subscription
Pause service
Resume service
Bill calculation
Customer search by phone
Active/paused customer information
I must list all implemented API endpoints in README.md.

### 3. Usable UI

There must be a usable frontend UI over the REST APIs.

The UI should allow the owner to perform the important operations without manually calling APIs.

At minimum, provide:

Login/Register
Dashboard
Customer list
Add customer
Subscribe customer
Pause/resume service
Search by phone
View customer billing
Active/paused status
Keep the UI simple and functional. Do not spend excessive time on visual design.

### 4. User Registration and Login

Implement owner/user registration and login.

Use a simple appropriate authentication mechanism such as JWT if practical.

Do not spend excessive time on advanced authentication features unless necessary.

### 5. Search

Customers must be searchable by phone number.

### 6. Pagination

The customer list should support pagination.

### 7. Sorting

The customer list should support sorting, for example:

Name
Phone
Status
Subscription date
Use a simple implementation.

### 8. Landing Page

Create a one-page landing page explaining:

What the product is
Key features
Target audience
How the product helps
Three features that could be built next
The landing page should be simple but complete.

---

# CORE BUSINESS LOGIC

The MOST IMPORTANT part of this assignment is the billing logic.

A customer has a monthly plan.

The customer is normally served on weekdays.

If the customer pauses service for certain weekdays, those paused days must NOT be charged.

At the end of the month:

served weekdays = eligible weekdays - paused weekdays

Then calculate the customer's bill based on the days actually served.

For example, if:

Monthly plan = ₹3000
Eligible weekdays in month = 22
Paused weekdays = 3

Then:

Served days = 22 - 3 = 19

Daily rate = 3000 / 22

Bill = 19 × daily rate

However, carefully inspect the exact problem statement/twist I provide. If there is an additional twist or ambiguity about billing, do NOT silently assume the formula. Explain the interpretation and implement the safest reasonable business rule.

The system should make the service/pause history explicit enough that the bill can be verified.

Important edge cases to consider:

Pause before subscription
Pause on a weekend
Pause for multiple days
Resume after a pause
Multiple pause/resume periods in one month
Pause covering the entire remaining month
Resume without an active pause
Invalid dates
Duplicate pause/resume operations
Customer with no subscription
Invalid customer ID
Customer not found
Searching for a nonexistent phone number
Current active vs paused status
Month with different numbers of weekdays
---

# DEVELOPMENT STRATEGY

Because I only have 2.5 HOURS, guide me using this priority:

## Priority 1 — MUST WORK

Database
Authentication
Customer creation
Subscription
Pause/resume
Billing calculation
REST APIs
Basic working UI
## Priority 2

Search by phone
Active/paused dashboard
Pagination
Sorting
## Priority 3

Landing page
UI polish
README improvements
Additional validation/features
Never allow me to spend too much time on optional features while core billing functionality is incomplete.

---

# HOW I WANT YOU TO GUIDE ME

Act as my senior software engineer and pair programmer.

DO NOT blindly generate a huge project all at once.

Guide me incrementally:

PROBLEM
→ REQUIREMENTS
→ ARCHITECTURE
→ DATABASE SCHEMA
→ API DESIGN
→ PROJECT SETUP
→ CORE IMPLEMENTATION
→ TESTING
→ DEBUGGING
→ UI
→ FINAL REVIEW
→ DOCUMENTATION
→ GIT COMMIT/PUSH

For each step:

Tell me what we are doing.
Give me the exact code/commands I need when coding is required.
Keep the implementation simple.
Tell me exactly which file to create/edit.
After implementation, tell me how to test it.
Do not unnecessarily rewrite working code.
If there is an error, diagnose the root cause before changing unrelated code.
Keep track of the original requirements so we don't forget mandatory features.
I prefer simple, understandable code rather than complicated enterprise architecture.

---

# AI USAGE

I am allowed to use AI freely during this assessment.

Use AI effectively for:

Requirement analysis
Architecture
Database design
Boilerplate
Coding
Debugging
Test case generation
Code review
Documentation
But always explain important implementation decisions briefly so I understand what is being built.

When generating code, avoid unnecessary libraries and dependencies.

If there are multiple possible approaches, choose the one that is fastest and safest to implement within 2.5 hours.

---

# TECHNOLOGY SELECTION

Before coding, recommend ONE practical tech stack that can realistically be completed within 2.5 hours.

Prefer a stack that is:

Fast to set up
Familiar
Easy to debug
Suitable for REST APIs
Suitable for a simple frontend
Has easy database integration
Works well inside GitHub Codespaces
Do not give me 10 alternatives.

Recommend one stack and proceed with it unless there is a strong reason to change.

---

# TESTING

After implementing the core functionality, generate and execute a test checklist covering:

### Authentication

Successful registration
Duplicate registration
Successful login
Invalid credentials
### Customers

Create customer
Get customers
Get customer
Invalid customer
Search by phone
### Subscription

Successful subscription
Invalid plan data
Customer without subscription
### Pause/Resume

Valid pause
Valid resume
Multiple pause/resume cycles
Weekend pause
Invalid dates
Duplicate pause
Resume without pause
### Billing

No pause
One paused period
Multiple paused periods
Full remaining month paused
Different month lengths
Weekend handling
Correct pro-rating
Customer not subscribed
### UI

Login
Dashboard
Customer search
Customer status
Subscribe
Pause
Resume
Billing display
---

# FINAL CODE REVIEW

Before submission, review the entire solution against the original requirements.

Check:

Correctness
Billing logic
Database persistence
API correctness
Authentication
Search
Pagination
Sorting
UI functionality
Error handling
Edge cases
Security basics
Unnecessary complexity
Broken imports
Console errors
Environment variables/secrets
README
REASONING.md
AI_LOGS.md
Do NOT rewrite the whole project during the final review.

Only fix important issues.

---

# REQUIRED SUBMISSION FILES

The PUBLIC GitHub repository MUST contain these files in the ROOT:

## README.md

Must include:

Product overview
Features
Technology stack
Database setup
Environment variables
Installation/setup instructions
How to run the project
How to debug/common issues
API endpoint list
Example API requests/responses if useful
## REASONING.md

Document my development reasoning, including:

How I interpreted the problem
Requirements identified
Architecture decisions
Database design decisions
Billing logic
Important assumptions
How I tested the application
Bugs/errors encountered
How I fixed them
Important trade-offs
IMPORTANT:
Write this based on what actually happened during development. Do not invent testing or reasoning that I did not perform.

## AI_LOGS.md

This MUST contain the COMPLETE AI CONVERSATION pasted AS-IS.

Do NOT modify, summarize, clean up, paraphrase, or rewrite the AI conversation.

Do NOT fabricate previous messages.

I will maintain the AI conversation log throughout the assessment and put the complete conversation into AI_LOGS.md before submission.

---

# GIT/GITHUB WORKFLOW

All development is happening in GitHub Codespaces.

Before starting, help me verify:

GitHub login
Codespace access
Repository access
Terminal
Git
Runtime
Package manager
During development, remind me to make commits at sensible milestones.

Example:

git status
git add .
git commit -m "Implement customer management"
git push

At the end:

Run final tests.
Check git status.
Commit final changes.
Push to GitHub.
Verify the public repository.
Verify README.md exists.
Verify REASONING.md exists.
Verify AI_LOGS.md exists.
Verify all code is pushed.
Give me the repository URL format I should submit through the assessment form.
---

# IMPORTANT TIME MANAGEMENT

I have ONLY 2.5 HOURS.

Keep track of time mentally and continuously prioritize.

If we are running short on time:

STOP optional features first.

Never sacrifice:

Database
Core APIs
Subscribe
Pause/resume
Billing
Basic UI
Authentication
Required documentation
GitHub submission
Prefer:

WORKING SIMPLE PRODUCT

over:

PARTIALLY COMPLETE ADVANCED PRODUCT.

---

# HOW TO RESPOND

Keep explanations concise and practical because this is a timed assessment.

When I say "NEXT", move directly to the next implementation step.

When I give you an error:

Identify the likely root cause.
Tell me exactly where to fix it.
Give the corrected code.
Tell me how to test it.
When I give you a new requirement:

Check whether it conflicts with existing implementation.
Make the smallest safe change.
Do not unnecessarily rewrite working features.
When we reach the final stage, help me verify every mandatory requirement before submission.

## START NOW

First, do NOT generate the entire application.

Start by giving me:

A concise interpretation of the problem
The recommended tech stack
A simple architecture
Database schema
REST API endpoint list
Frontend pages/components
The exact implementation order for the 2.5-hour assessment
The first thing I should do inside GitHub Codespaces
Then wait for me to say "NEXT".
in short points not too much theoritical help me to implement from scratch what to do first by creating repo as

STEP 8 — README.md
Replace the content of README.md with this (edit env values/URLs as needed):

markdown
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
PORT=3000
JWT_SECRET=your_secret_key_here


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
Test
Open README.md in preview and check formatting renders correctly.

Commit
bash
git add .
git commit -m "docs: complete README with setup, API list, examples"
git push
STEP 9 — REASONING.md
Important: write this yourself based on what actually happened — I'll give you a skeleton, you fill in specifics (bugs you hit, what you tested). Paste this structure into REASONING.md and fill in the [...] parts honestly:

markdown
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
Fill this in with your actual experience (5-10 min), then:

bash
git add .
git commit -m "docs: add REASONING.md"
git push
STEP 10 — AI_LOGS.md reminder
Make sure AI_LOGS.md has the entire conversation, unedited, pasted in before final submission. Do this now if you haven't been updating it continuously — don't leave it for the last 2 minutes.

bash
git add .
git commit -m "docs: add AI conversation log"
git push
Once README, REASONING, and AI_LOGS are done, say NEXT and we'll run the final mandatory-requirements checklist before you submit.




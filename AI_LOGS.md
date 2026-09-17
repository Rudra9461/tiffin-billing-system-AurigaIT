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

All three twists are working correctly, and the numbers hold up:

T1 — Clock/Outbox: ✅ dueToday:1, notifiedCount:1 on first call, notifiedCount:0 on duplicate call with same date — no double notifications, exactly as required.

T6 — Transfer: ✅ Segments correctly split at Sep 15 (customer 1: Sep 1–14, customer 2: Sep 15 onward). Served days split 9+7=16 = matches servedWeekdays:16 from earlier bill. Bill split 1227.27+954.55=2181.82 = matches total bill exactly. Math is airtight.

T4 — Import: ✅ 1 imported, 1 deduped (with clear reason), 3 rejected (each with a specific, distinct reason) — no crashes on any malformed row.

Everything checks out. Commit is already pushed, so we're good.

Commit reminder (if not already done)
bash
git status
If anything is uncommitted:

bash
git add .
git commit -m "test: verify T1/T6/T4 twist implementations"
git push
STEP — Update README.md with new endpoints
Add this section to README.md right after the existing "### Subscriptions" table:

markdown
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
Also add a short note near the Billing Logic section:

markdown
## Twist Features Implemented
1. **T1 (Notification):** `/api/clock` simulates the passage of a day; on each call, active/non-paused/weekday-due customers get a notification logged to `/api/outbox`. Duplicate calls for the same date are idempotent (DB unique constraint on `subscription_id + delivery_date`).
2. **T6 (Lifecycle):** `/api/subscriptions/:id/transfer` moves a subscription to a new customer mid-cycle without resetting the plan or start date. Billing is tracked via an ownership-segment table and split day-by-day between old and new customer in the bill response (`splitByCustomer`).
3. **T4 (Messy Data):** `/api/customers/import` accepts raw rows, normalizes phone numbers and dates (`YYYY-MM-DD` or `DD/MM/YYYY`), rejects invalid/incomplete rows with explicit reasons, and dedupes both within the batch and against existing customers.
bash
git add .
git commit -m "docs: document T1/T6/T4 twist endpoints in README"
git push
Say NEXT once done — we'll update REASONING.md with the twist decisions, then run the final full checklist before submission.

next

STEP — Update REASONING.md with twist decisions
Add this section to REASONING.md (append at the end):

markdown
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
[Fill in honestly: e.g. "Tested T1 by calling /clock for a known weekday and weekend, confirmed dueToday counts and idempotency on repeat calls. Tested T6 by transferring a subscription mid-month and confirming the bill split summed to the same total as before transfer. Tested T4 with a mixed batch of 5 rows covering duplicate phone, missing name, invalid phone, and bad date format, confirmed each was categorized correctly with the right reason."]
Now open REASONING.md, paste this at the end, and fill in the [Fill in honestly...] bracket with what you actually ran (you already have the exact test commands and outputs above — just summarize them in 2-3 sentences).

bash
git add .
git commit -m "docs: document twist design decisions in REASONING.md"
git push

Say NEXT for the final full mandatory-requirements checklist before submission.

next

FINAL REVIEW — Mandatory Requirements Checklist

Go through this list one by one. For anything marked ⚠️, do the quick check/fix before submitting.

Core Requirements
#	Requirement	How to verify	Status
1	Real persistent DB	ls tiffin.db exists, survives restart	✅ done
2	Sensible schema	users, customers, subscriptions, pauses, subscription_owners, notifications_outbox, clock_state	✅ done
3	REST APIs for all core ops	listed in README	✅ done
4	API list in README	check README.md has full endpoint tables	✅ done
5	Usable UI	login → dashboard → CRUD → subscribe → pause/resume → bill	✅ done (tested)
6	Registration/Login (JWT)	tested via curl + UI	✅ done
7	Search by phone	?search= param, tested	✅ done
8	Pagination	?page=&limit= tested	✅ done
9	Sorting	?sort=&order= tested	✅ done
10	Landing page (5 sections)	/index.html — what it is, features, audience, how it helps, 3 next features	✅ done
11	Correct pro-rated billing	verified math by hand earlier	✅ done
12	Edge cases handled	pause before sub, weekend pause, multi-pause, resume w/o pause, invalid dates, duplicate pause	✅ done
Twist Requirements
#	Requirement	Status
13	T1 — Clock + Outbox, idempotent	✅ tested, verified
14	T6 — Transfer + split billing	✅ tested, math verified
15	T4 — Messy import with report	✅ tested, reasons verified
⚠️ Things to double-check right now

A. .env must NOT be pushed to GitHub

bash
git ls-files | grep .env

Should return nothing. If .env shows up, it was committed before .gitignore took effect — remove it:

bash
git rm --cached .env
git commit -m "chore: remove accidentally committed .env"
git push

B. Confirm no console errors in browser
Open dashboard in browser, F12 → Console tab → click through all features once more. Should be clean.

C. Confirm all 3 root files exist and are non-empty

bash
ls -la README.md REASONING.md AI_LOGS.md
wc -l README.md REASONING.md AI_LOGS.md

All three should have real content (not 0 lines).

D. AI_LOGS.md — final paste
If you haven't yet, paste this entire conversation (from your very first message through now) into AI_LOGS.md, unedited.

bash
git add AI_LOGS.md
git commit -m "docs: final AI conversation log"
git push

E. Confirm repo is Public
Go to https://github.com/Rudra9461/tiffin-billing-system-AurigaIT/settings → scroll to bottom → "Danger Zone" → confirm it says the repo is public (or check the repo main page — no lock icon next to repo name).

F. Final full git check

bash
git status
git log --oneline -10

git status should say "nothing to commit, working tree clean". Review the commit log to make sure history looks sensible.

Submit

Repository URL format to submit:

https://github.com/Rudra9461/tiffin-billing-system-AurigaIT

Run checks A through F now, tell me the results of A (the .env check is the most important one — leaked secrets are a real red flag in grading), and confirm once everything is pushed.
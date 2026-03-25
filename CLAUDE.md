# Golf Charity Subscription Platform

## Project Name
Golf Charity Subscription Platform

## Tech Stack
- Node.js
- Express
- Supabase (PostgreSQL)
- JWT (jsonwebtoken)
- bcryptjs

## Folder Structure And Purpose
- server/: Backend root for the Express API.
- server/index.js: Server bootstrap, middleware setup, route registration.
- server/config/: Shared configuration modules.
- server/config/supabase.js: Supabase client initialization and export.
- server/middleware/: Cross-cutting middleware (auth, validation, security).
- server/routes/: Endpoint definitions by module.
- server/controllers/: Request-response handlers.
- server/services/: Business rules and data access logic.
- server/.env.example: Environment variable template.

## Naming Conventions
Use camelCase for file names and function names.

## Environment Variables
- PORT: Express server port, default 5000.
- SUPABASE_URL: Supabase project URL.
- SUPABASE_SERVICE_KEY: Service role key for secure backend DB operations.
- JWT_SECRET: Secret for signing and verifying JWT tokens.
- JWT_EXPIRES_IN: JWT expiration time, for example 7d.

## API Base URL
/api

## Authentication Method
Use Bearer JWT in Authorization header.

Example:
Authorization: Bearer <jwt_token>

## Role Types
- user
- admin

## Subscription Logic
Subscription activation is dummy and has no Stripe integration.

## Score Rules
- Score must be an integer from 1 to 45.
- Maximum 5 scores per user.
- Scores are ordered latest first.

## Score Management System
- POST /api/scores adds a new score for the authenticated user.
- GET /api/scores returns the authenticated user's latest scores.
- The system enforces rolling storage of at most 5 scores per user.

## Scores Table Schema
- Database table: scores
- Fields:
	- id (primary key)
	- user_id (foreign key -> users.id)
	- score (integer, 1-45)
	- date (date of play)
	- created_at (timestamp)
- SQL setup file: server/config/scoresTable.sql

## Rolling 5-Score Logic
- When a new score is added, it is inserted first.
- Scores are sorted by date (latest first), then by created_at (latest first).
- If total scores become greater than 5, the oldest score(s) are deleted.
- Returned score lists are always limited to latest 5.

## Score Subscription Requirement
- Only users with active subscriptions can add scores.
- Active means is_subscribed is true and current time is before subscription_end.
- If subscription is missing or expired, score entry is rejected.

## Draw Rules
- Each draw generates 5 random numbers from 1 to 45.
- Match types: 3, 4, and 5.

## Draw System
- Monthly draw execution is available through admin-only endpoint POST /api/draw/run.
- Each draw stores exactly 5 random unique numbers between 1 and 45.
- Only one draw is allowed per month and year.

## Draw Number Generation Logic
- The system generates random integers in the inclusive range 1 to 45.
- Numbers are unique within a draw.
- A completed draw always stores exactly 5 values.

## Winner Evaluation Logic
- Winner evaluation compares draw numbers with each eligible user's 5 scores.
- Eligible users must be subscribed and have exactly 5 stored scores.
- Match count is calculated by intersection of draw numbers and user score values.
- Winners are stored when match_count is 3, 4, or 5.

## Draw Eligibility And Admin Rules
- Only users with role = admin can run a draw.
- Only subscribed users are eligible in evaluation.
- Subscription must be active (is_subscribed true and subscription_end in the future).

## Winner Tiers
- Tier 3: 3 matches
- Tier 4: 4 matches
- Tier 5: 5 matches

## Draw Tables Schema
- Draws table: id, numbers, month, year, created_at.
- Winners table: id, user_id, draw_id, match_count, prize_amount, status, created_at.
- SQL setup file: server/config/drawTables.sql.

## Winner Management System
- Winners are created during draw evaluation when match_count is 3, 4, or 5.
- Admin can review winners by draw and verify status transitions.
- Users can only view their own winnings through personal endpoint.

## Winner Status Lifecycle
- pending: initial state after draw winner evaluation.
- approved: admin-verified winner.
- paid: payout completed.
- Allowed transition path is strictly pending -> approved -> paid.

## Prize Distribution Logic
- Prize pool is calculated as active_subscribers * 100.
- Tier allocation:
	- 5 matches: 40%
	- 4 matches: 35%
	- 3 matches: 25%
- Tier amount is split equally among winners of that tier.
- Empty tiers are skipped for MVP.
- Duplicate distribution runs are blocked once prize_amount is set for the draw.

## Winner Access And Admin Rules
- Only users with role = admin can verify winners and distribute prizes.
- Users can only access their own winnings via /api/winners/me.

## Charity System
- Public users can browse all charities and view charity details.
- Authenticated users can select a single charity and set their contribution percentage.
- Admin users manage charity listings through create, update, and delete endpoints.

## Charity Selection Logic
- Users select charities using POST /api/charities/select.
- Selection stores charity_id and contribution_percentage on the user profile.
- Users may update their charity selection later by calling the same endpoint.

## Contribution Percentage Rules
- contribution_percentage must be a number.
- Minimum contribution_percentage is 10.
- charityId must exist before selection is saved.

## Charity Tables Schema
- Charities table: id, name, description, image_url, created_at.
- Users table extensions: charity_id, contribution_percentage.
- SQL setup file: server/config/charityTables.sql.

## Auth Flow
- Signup validates input, hashes password, stores user, and returns JWT.
- Login validates credentials and returns JWT.
- JWT payload contains { userId, role }.
- Protected routes require authMiddleware and Bearer token.

## User Profile Flow
- GET /api/users/me returns the authenticated user's profile.
- PUT /api/users/me updates allowed profile fields for authenticated user.
- Restricted fields (role and subscription fields) are blocked from updates.

## Subscription Activation Logic
- POST /api/users/subscribe activates a dummy subscription for the authenticated user.
- Activation sets is_subscribed = true.
- subscription_start is set to current timestamp.
- subscription_end is set to current timestamp + 30 days.

## Subscription Validation Concept
- Future features such as scores and draws must check active subscription status.
- A valid subscription means is_subscribed is true and subscription_end is in the future.

## API Endpoints Added
- GET /api/users/me
- PUT /api/users/me
- POST /api/users/subscribe
- POST /api/scores
- GET /api/scores
- POST /api/draw/run
- GET /api/draw/current
- GET /api/winners/draw/:drawId
- GET /api/winners/me
- PATCH /api/winners/:id/verify
- POST /api/winners/distribute/:drawId
- GET /api/charities
- GET /api/charities/:id
- POST /api/charities
- PUT /api/charities/:id
- DELETE /api/charities/:id
- POST /api/charities/select

## Ongoing Maintenance Requirement
As we build more parts, this file must be updated each time.

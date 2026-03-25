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

## Draw Rules
- Each draw generates 5 random numbers from 1 to 45.
- Match types: 3, 4, and 5.

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

## Ongoing Maintenance Requirement
As we build more parts, this file must be updated each time.

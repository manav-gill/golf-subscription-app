# Golf Charity Subscription Platform

## Project Name
Golf Charity Subscription Platform

## Tech Stack
- Node.js
- Express
- Supabase (PostgreSQL)
- JWT (jsonwebtoken)
- bcryptjs

## Backend Folder Structure
- `server/`: Backend application root and runtime entry.
- `server/index.js`: Express server bootstrap, middleware setup, and health check route.
- `server/.env.example`: Environment variable template for local and production setup.
- `server/config/`: Shared configuration modules.
- `server/config/supabase.js`: Supabase client initialization.
- `server/middleware/`: Express middleware (authentication, authorization, validation, error handling).
- `server/routes/`: API route definitions mounted under the API base path.
- `server/controllers/`: Route handler/controller logic.
- `server/services/`: Business logic and integration services.

## Naming Conventions
Use camelCase for file names and function names.

## Environment Variables
- `PORT`: Port used by the Express server. Defaults to `5000`.
- `SUPABASE_URL`: Supabase project URL used to initialize the client.
- `SUPABASE_SERVICE_KEY`: Supabase service role key for secure server-side operations.
- `JWT_SECRET`: Secret key used to sign and verify JWT tokens.
- `JWT_EXPIRES_IN`: JWT expiration window (example: `7d`).

## API Base URL
`/api`

## Authentication Method
Use Bearer JWT tokens in the `Authorization` header.

Example:
`Authorization: Bearer <token>`

## Role Types
- `user`
- `admin`

## Subscription Logic
Subscription activation is dummy-only for now. No Stripe or payment gateway integration is included.

## Score Rules
- Score value must be an integer from 1 to 45.
- Each user can store a maximum of 5 scores.
- Scores should be returned in latest-first order.

## Draw Rules
- Each draw generates 5 random numbers from 1 to 45.
- Match types are 3, 4, and 5 matching numbers.

## Maintenance Rule
As we build more parts, this file must be updated each time.

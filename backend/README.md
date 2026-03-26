# Golf Charity Subscription Platform (Backend)

## 1. Project Overview
Golf Charity Subscription Platform backend is an Express + Supabase API that handles user authentication, subscriptions, score management, monthly draws, winner processing, and charity selection.

## 2. Features
- JWT authentication and role-based authorization (`user`, `admin`)
- User profile and subscription activation
- Score submission with rolling 5-score limit
- Monthly draw execution and winner evaluation
- Winner verification and prize distribution
- Charity browsing, selection, and admin CRUD
- Centralized validation and error handling middleware

## 3. Tech Stack
- Node.js
- Express
- Supabase (PostgreSQL)
- JSON Web Token (`jsonwebtoken`)
- bcryptjs
- express-validator
- helmet, cors, morgan, dotenv

## 4. Folder Structure
```text
backend/
  index.js
  package.json
  .env
  .env.example
  .gitignore
  server/
    index.js
    config/
    middleware/
    routes/
    controllers/
    services/
```

## 5. API Endpoints

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| Health | GET | `/health` | Health check | No |
| Auth | POST | `/api/auth/signup` | Register user | No |
| Auth | POST | `/api/auth/login` | Login and get JWT | No |
| Users | GET | `/api/users/me` | Get current profile | Yes |
| Users | PUT | `/api/users/me` | Update profile | Yes |
| Users | POST | `/api/users/subscribe` | Activate subscription | Yes |
| Scores | POST | `/api/scores` | Add score | Yes |
| Scores | GET | `/api/scores` | Get latest 5 scores | Yes |
| Draw | POST | `/api/draw/run` | Run monthly draw (admin) | Yes |
| Draw | GET | `/api/draw/current` | Get latest draw | Yes |
| Winners | GET | `/api/winners/me` | Get current user winnings | Yes |
| Winners | GET | `/api/winners/draw/:drawId` | Get winners by draw (admin) | Yes |
| Winners | PATCH | `/api/winners/:id/verify` | Verify winner status (admin) | Yes |
| Winners | POST | `/api/winners/distribute/:drawId` | Distribute prizes (admin) | Yes |
| Charities | GET | `/api/charities` | List charities | No |
| Charities | GET | `/api/charities/:id` | Get charity details | No |
| Charities | POST | `/api/charities/select` | Select user charity | Yes |
| Charities | POST | `/api/charities` | Create charity (admin) | Yes |
| Charities | PUT | `/api/charities/:id` | Update charity (admin) | Yes |
| Charities | DELETE | `/api/charities/:id` | Delete charity (admin) | Yes |

### Sample Request/Response

#### Auth
`POST /api/auth/login`
```json
{ "email": "user@example.com", "password": "password123" }
```
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "email": "user@example.com", "role": "user" }
  }
}
```

#### Users
`GET /api/users/me`
Header: `Authorization: Bearer <jwt>`
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": { "id": "...", "email": "user@example.com" }
}
```

#### Scores
`POST /api/scores`
```json
{ "score": 27, "date": "2026-03-26" }
```
```json
{
  "success": true,
  "message": "Score added successfully",
  "data": []
}
```

#### Draw
`POST /api/draw/run` (admin)
```json
{
  "success": true,
  "message": "Draw executed successfully",
  "data": { "draw": {}, "summary": {} }
}
```

#### Winners
`PATCH /api/winners/:id/verify` (admin)
```json
{ "status": "approved" }
```
```json
{
  "success": true,
  "message": "Winner status updated successfully",
  "data": { "id": "...", "status": "approved" }
}
```

#### Charities
`POST /api/charities/select`
```json
{ "charityId": "<uuid>", "contributionPercentage": 20 }
```
```json
{
  "success": true,
  "message": "Charity selection saved successfully",
  "data": { "id": "...", "charity_id": "<uuid>", "contribution_percentage": 20 }
}
```

## 6. Setup Instructions (Local)
1. Install dependencies:
```bash
cd backend
npm install
```
2. Create env file:
```bash
cp .env.example .env
```
3. Add required values in `.env`.
4. Run SQL setup files in Supabase SQL Editor:
- `server/config/usersTable.sql`
- `server/config/scoresTable.sql`
- `server/config/drawTables.sql`
- `server/config/charityTables.sql`
5. Start backend:
```bash
npm start
```
6. Validate health:
```bash
curl http://localhost:5000/health
```

## 7. Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Express server port (default `5000`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `JWT_SECRET` | Secret used for signing/verifying JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry window (example: `7d`) |

## 8. Deployment Instructions

### Option 1: Render (recommended)
1. Push code to GitHub.
2. Create a Render Web Service and connect repo.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add env variables (`PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `JWT_EXPIRES_IN`).
6. Deploy and verify `/health`.

### Option 2: Vercel
- Serverless adaptation is optional. If deploying current Express server directly, prefer Render for always-on backend process.
- If using Vercel, adapt to serverless entrypoint and configure env vars in project settings.

## 9. Testing Guide (Postman)
- Import collection: `backend/Golf-Charity-Subscription-Platform.postman_collection.json`
- Set collection variables:
  - `baseUrl` = `http://localhost:5000`
  - `authToken` = JWT token from login response
- Execute flow:
  1. Signup
  2. Login
  3. Protected routes (`/users/me`, `/scores`, `/draw`, `/winners`, `/charities/select`)
  4. Admin-only routes with admin token

## 10. Future Improvements
- Stripe-based real subscription billing
- Scheduled monthly draw job (cron/queue)
- Automated tests (integration + contract tests)
- API rate limiting and API key strategy
- OpenAPI/Swagger auto-generated docs

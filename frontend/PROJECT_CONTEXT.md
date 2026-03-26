# Golf Charity Platform (Frontend)

## Project Name
Golf Charity Platform (Frontend)

## Tech Stack
- React (Vite)
- Tailwind CSS
- Axios

## Backend Summary
- JWT Auth for authenticated API access
- Subscription system for membership state and feature access
- Score system with rolling limit of max 5 scores
- Draw system controlled by admin roles
- Charity system tied to authenticated user profile

## API Usage Rules
- Always use the API base URL from environment variables (VITE_API_BASE_URL).
- Always attach Bearer token for protected endpoints.
- Never guess endpoints, payloads, or response fields.
- If API behavior is unclear, add a TODO comment and wait for backend confirmation.
- Never hardcode secrets, URLs, or tokens in source files.

## UI Direction
- Soft premium visual style inspired by Ko-fi aesthetics
- Minimal, rounded, and clean component language
- Focus on rewards visibility and charity impact

## AI Coding Guardrails
- The AI must always read this PROJECT_CONTEXT.md before generating or editing frontend code.
- Do not hallucinate endpoints or data.

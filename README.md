# Hack2Hire — AI Interview Coach

Practice technical interviews with an AI interviewer that reads your **resume** and **job description**, asks adaptive questions, scores answers in real time, and generates a readiness report.

## Live project

| App | URL |
|-----|-----|
| **Frontend (Vercel)** | [https://hack2-hire-woad.vercel.app/](https://hack2-hire-woad.vercel.app/) |
| **Backend API (Railway)** | [https://hack2hire-backend-production.up.railway.app/health](https://hack2hire-backend-production.up.railway.app/health) |

## Features

- **Resume PDF upload** — ATS score, keyword match/miss, interview readiness verdict
- **Tech quiz** — Random MCQ questions from your skillset
- **LeetCode practice** — Random coding problems by skill & difficulty
- **Voice questions** — AI questions read aloud (browser text-to-speech) plus voice answers (speech-to-text)
- Timed questions (120s per question), live scoring, session history, PDF report
- Interview modes: behavioral, technical, system design, mixed
- Dark / light theme

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query, shadcn/ui |
| Backend | Node.js, Express, Drizzle ORM, PostgreSQL (Neon) |
| AI | OpenAI API |
| Deploy | Vercel (frontend), Railway (backend) |

## Repository structure

```
Hack2Hire-FinalGit/
├── frontend/          # React SPA (deploy to Vercel)
├── backend/           # Express API (deploy to Railway)
├── config/
│   └── backend-url.txt
├── scripts/
│   └── prepare-deploy.mjs
├── api/               # Optional Vercel serverless proxy
├── vercel.json        # Vercel build & API rewrites
└── README.md
```

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL connection string (e.g. [Neon](https://neon.tech))
- OpenAI API key

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY, etc.
npm install
npm run db:push
npm run dev
```

API runs at `http://localhost:5000` — check `http://localhost:5000/health`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173` (proxies `/api` to the backend).

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `CORS_ORIGIN` | Frontend URL(s), comma-separated |
| `PORT` | `5000` locally (Railway sets this in production) |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL in production (optional if using Vercel `/api` rewrite) |

Production backend URL is also in `config/backend-url.txt`.

## Deployment

### Frontend — Vercel

1. Import this repo on [Vercel](https://vercel.com).
2. Use root `vercel.json` (builds `frontend/`, serves `frontend/dist`).
3. Ensure `config/backend-url.txt` has your Railway URL, or set `VITE_API_URL`.

### Backend — Railway

1. Deploy the `backend/` folder (or use repo `aashvigoyal060/Hack2Hire-Backend`).
2. Set variables from the table above.
3. **Networking → Generate Domain** for a public URL.
4. Set `CORS_ORIGIN` to `https://hack2-hire-woad.vercel.app`.

## API health check

- `GET /health`
- `GET /api/health`

Root `/` returns 404 — that is expected; use `/health` to verify the API.

## License

MIT

## Author

[Aashvi Goyal](https://github.com/aashvigoyal060)

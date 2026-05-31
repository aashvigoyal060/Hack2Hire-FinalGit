# Hack2Hire Backend

Express API for the Hack2Hire AI interview platform. Deploy on [Railway](https://railway.app).

## Railway setup

1. Connect this repo: `aashvigoyal060/Hack2Hire-Backend`
2. **Variables** (required):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://...@neon.tech/neondb?sslmode=require` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | `sk-...` |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |

3. Railway sets `PORT` automatically — do not override it.
4. Redeploy after adding variables.

## Health check

- `GET /health`
- `GET /api/health`

## Local dev

```bash
cp .env.example .env
npm install
npm run db:push
npm run dev
```

## Production build (same as Railway)

```bash
npm install
npm run build
npm start
```

# Lernwerk – German Learning AI (React + FastAPI)

Full-stack German course (A1 to C2) with an AI tutor, speaking practice, quizzes, vocabulary, flashcards and progress saved in the database.

```
german-learning-ai/
├── backend/   FastAPI · SQLAlchemy · PostgreSQL · JWT · OpenAI
└── frontend/  React (Vite) · Tailwind · React Router · Axios
```

## How it works
- **Curriculum**: A1–C2 (about 90 lesson days) is seeded on first start. A1 Days 1–3 ship with hand-written content. Every other lesson is **generated once by the LLM** the first time anyone opens it, then cached in PostgreSQL. This needs `OPENAI_API_KEY`; without it those lessons return a clear 503 message.
- **Free day selection**: any lesson can be opened at any time. Status (not started / in progress / completed), bookmarks, resume position and study time are stored per user in PostgreSQL. The dashboard recommends the day after your last completed one.
- **Quizzes** are built from each lesson’s vocabulary and sentences (MCQ, translation, fill in the blank). Revision/assessment days quiz more words. Scoring ≥ 70% completes the lesson. `quiz_id` in the API equals the lesson id.
- **Speaking**: browser records audio → `/api/speech/transcribe` (Whisper) → `/api/ai/speaking-feedback` → `/api/speech/synthesize` (TTS). Feedback judges the *transcript* (grammar, words); it does not score pronunciation.
- If server TTS fails, the browser’s built-in German voice is used instead.

## Run locally

### 1. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # then edit .env
```
Set in `.env`: `OPENAI_API_KEY`, a long random `SECRET_KEY`, and `DATABASE_URL`.

PostgreSQL: `createdb german_ai` (or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=german_ai postgres:16`).
For a quick try without PostgreSQL set `DATABASE_URL=sqlite:///./german.db`.

```bash
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs · Health: http://localhost:8000/api/health

Tables are created and the curriculum seeded on startup (`AUTO_CREATE_TABLES=true`).
For managed migrations in production: set `AUTO_CREATE_TABLES=false`, then
`alembic revision --autogenerate -m "init" && alembic upgrade head` (run once; start the app afterwards to seed lessons).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxies /api to :8000)
```

### 3. Tests
```bash
cd backend && pytest
```
Covers auth, seeded lessons, progress persistence across logins, quizzes, and AI endpoints (with a fake provider, so no API cost).

## Deploy
- **Backend**: any host that runs Python (Render, Railway, Fly.io, a VPS): `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set the env vars from `.env.example`, a managed PostgreSQL `DATABASE_URL`, and `CORS_ORIGINS` to your frontend URL.
- **Frontend**: `npm run build` and host `dist/` on Netlify/Vercel/static hosting. Set `VITE_API_URL=https://your-api.example.com/api` at build time and add an SPA fallback rewrite to `index.html`.
- Microphone access requires HTTPS in production.
- Rate limiting is in-memory per process; use Redis if you run multiple workers.

## Security notes
Passwords are bcrypt-hashed, JWTs are signed with `SECRET_KEY`, every learning record is filtered by the authenticated user, and the OpenAI key exists only in the backend. AI endpoints are rate limited and capped by `AI_MAX_TOKENS` and `AI_TIMEOUT_SECONDS`.

## Free AI option (Groq)
Any OpenAI-compatible provider works. For a free key: create an account at console.groq.com → API Keys → Create. In `backend/.env` set
```
OPENAI_API_KEY=gsk_your_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
OPENAI_STT_MODEL=whisper-large-v3-turbo
AI_TTS_ENABLED=false
```
Restart uvicorn. Chat, lessons, corrections and speech-to-text then use Groq; spoken German uses your browser's voice. Free tiers have daily limits and may change.

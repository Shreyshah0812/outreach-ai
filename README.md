# OutReach AI — Cold Email Agent

An end-to-end AI cold email agent that auto-researches recipients, generates personalized outreach emails from your resume & job description, and sends them via Gmail SMTP.

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI + Python 3.11+
- **AI**: Groq (LLaMA 3) + Perplexity Sonar (web research)
- **Storage**: SQLite (via SQLAlchemy)
- **Email**: Gmail SMTP
- **PDF Parsing**: PyMuPDF

---

## Project Structure

```
outreach-ai/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
├── backend/           # FastAPI app
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── models/
│   └── requirements.txt
├── .env.example
└── docker-compose.yml
```

---

## Quick Start

### 1. Clone & setup env

```bash
git clone https://github.com/yourusername/outreach-ai.git
cd outreach-ai
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. (Optional) Docker

```bash
docker-compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Get from https://console.groq.com |
| `PERPLEXITY_API_KEY` | Get from https://www.perplexity.ai/settings/api |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your main password) |
| `FRONTEND_URL` | Usually `http://localhost:5173` |

### Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Create a new app password for "Mail"
4. Use that 16-character password as `GMAIL_APP_PASSWORD`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/campaigns` | Create a new campaign |
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/recipients` | Add recipient to campaign |
| `POST` | `/api/research/{id}` | Run Perplexity research on recipient |
| `POST` | `/api/generate/{id}` | Generate personalized email via Groq |
| `POST` | `/api/send/{id}` | Send email via Gmail SMTP |
| `POST` | `/api/upload-resume` | Upload & parse PDF resume |

---

## Features

- **PDF Resume Parsing** — extracts skills, experience, and projects from your resume
- **AI Research** — Perplexity Sonar queries each recipient's public profile, company news, and tech stack
- **Personalized Generation** — Groq (LLaMA 3.3 70B) writes tailored emails using resume + JD + research context
- **Preview & Edit** — review every email before sending, with a personalization score
- **Gmail SMTP Delivery** — sends directly from your Gmail with configurable delays
- **Campaign History** — SQLite tracks all campaigns, recipients, and send status

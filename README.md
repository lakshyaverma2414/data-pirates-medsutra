# MedSutra

MedSutra is a hospital and emergency coordination platform.

It brings together a public-facing emergency flow, a hospital dashboard, a backend API, and an AI service for triage and analysis. The goal is to help hospitals handle emergencies, transfers, blood stock, doctors, and daily operations from one system.

## What this project includes

- Public pages for emergency requests, ambulance tracking, blood donation, and user services
- Hospital registration and login
- Hospital dashboard for emergencies, patient transfers, blood transfers, doctors, and operations
- Backend API built with Express and Prisma
- Separate AI service built with FastAPI

## Project folders

- `frontend` - React and Vite app
- `backend` - Express API and Prisma database layer
- `ai` - FastAPI service for triage and AI-based responses

## Tech stack

- Frontend: React, Vite, React Router, Tailwind
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- AI service: Python, FastAPI, Ollama

## Before you start

You should have these installed:

- Node.js
- npm
- Python 3
- PostgreSQL
- Ollama if you want the AI service to work fully

## Environment files

Create these files before running the project.

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/medsutra
AI_EMERGENCY_API_URL=http://localhost:8000/triage
NODE_ENV=development
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
```

### `ai/.env`

```env
SERVICE_NAME=ai-triage-service
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2
OLLAMA_TEMPERATURE=0.2
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/medsutra
DB_USER=postgres
DB_PASSWORD=your_password
REQUEST_TIMEOUT_SECONDS=8
MAX_CANDIDATE_DISTANCE_KM=150
```

## How to run the project

### 1. Start the backend

```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

### 2. Start the AI service

This part is recommended if you want triage and AI features to work properly.

```powershell
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend in your browser after Vite starts.

## Suggested start order

1. Start PostgreSQL
2. Start the backend
3. Start the AI service
4. Start the frontend

## Demo login after seeding

After you run `npx prisma db seed`, the backend creates sample hospitals.

You can log in with:

- Email: `myhospital@mp.gov.in`
- Password: `pass123`

You can also use other hospital emails from `backend/prisma/hospitals.json` with the same password.

## Main routes

- `/` - public landing page
- `/emergency` - emergency flow
- `/hospital/login` - hospital login
- `/hospital/register` - hospital registration
- `/hospital/dashboard` - hospital dashboard

## Notes

- The frontend should use `VITE_API_BASE_URL=http://localhost:3000` for local development.
- Some emergency features can still fall back to a basic flow if the AI service is not available, but the full experience needs the AI service running.

## Status

The README is now part of the local project. It has not been pushed by this step.

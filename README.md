# VIBE Wellness

VIBE Wellness has a Next.js frontend and a FastAPI backend. Run both services while developing: the frontend runs at `http://localhost:3000` and calls the backend at `http://127.0.0.1:8000` by default.

## Requirements

- Node.js and npm
- Python 3.10 or newer

## First-time setup

Run these commands from the repository root in PowerShell.

### 1. Set up the backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m app.seed
```

The seed command creates demo users and wellness data in the local SQLite database (`backend/vibe.db`). It is safe to run again; it reports that demo data already exists if it has already been added.

If PowerShell prevents virtual environment activation, allow it for the current PowerShell window and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 2. Set up the frontend

Open a second PowerShell window, return to the repository root, and run:

```powershell
cd frontend
npm ci
```

## Run the application

Start the backend in one PowerShell window:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Start the frontend in a second PowerShell window:

```powershell
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend health check is available at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health), and its interactive API docs are at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Account authentication

Create an account from the **Sign up** page, then log in with the same email and password. The backend stores a bcrypt password hash and issues an HTTP-only session cookie after login. The raw session token is not stored in the database; only its SHA-256 digest is stored. Protected pages and API endpoints require a valid session. Sessions expire after seven days by default.

For local development, the session cookie is configured for HTTP. In HTTPS deployments, set `SESSION_COOKIE_SECURE=true` in `backend/.env`.

Keep both terminal windows running while using the app. Stop a service with **Ctrl+C** in its terminal.

## Troubleshooting

- **Dashboard fetch fails:** Make sure the backend is running and `http://127.0.0.1:8000/health` returns `{"status":"healthy"}`. The frontend defaults to this backend URL. To use another URL, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` and restart the frontend.
- **Dashboard API returns 404 with “No biometric data found”:** Run `python -m app.seed` from the `backend` directory, then refresh the page. The dashboard needs seeded biometric records.
- **`ModuleNotFoundError` when starting the backend:** Activate the backend virtual environment and run `python -m pip install -r requirements.txt` from `backend`.
- **`pip install -r requirements.txt` reports an invalid requirement:** Confirm the dependency is spelled `python-dotenv` in `backend/requirements.txt`.

## Useful commands

From `frontend`:

```powershell
npm run lint
npm run build
```

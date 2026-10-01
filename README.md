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

## Firebase authentication setup

Create a Firebase project, enable **Authentication → Email/Password**, and register a web app. Add the web app configuration to `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
```

Set the same Firebase project ID for the backend in `backend/.env`:

```dotenv
FIREBASE_PROJECT_ID=
```

The backend uses Firebase Admin credentials to verify ID tokens. It uses Application Default Credentials (ADC) by default, so developers do not need to add a machine-specific key-file path to the project configuration. For local work, each developer can configure their own ADC credentials with the Google Cloud CLI. Firebase Auth has an additional requirement for local end-user ADC credentials: use a Desktop OAuth client ID when running `gcloud auth application-default login --client-id-file=...`. Teams can also configure ADC with service-account impersonation instead of distributing a service-account key. In Google Cloud deployments, use the runtime's attached service identity. The optional `FIREBASE_CREDENTIALS_PATH` setting is only a local fallback for a developer who already has a private key file; keep that file outside source control and never put Admin credentials in the frontend.

The backend stores the Firebase UID and account profile in its existing SQLAlchemy database (SQLite by default). Each authenticated API request verifies its Firebase ID token and resolves the matching user record, so existing wellness records remain scoped by the authenticated account. Existing local demo records are left in place and are not assigned to new accounts.

After adding or changing frontend Firebase variables, restart the Next.js development server. Protected pages and API endpoints require Firebase authentication.

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

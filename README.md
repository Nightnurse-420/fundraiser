# Karma

Karma is a fundraising platform for Kenya. **For the people.**

This repository contains two projects:

- `karma-backend` — Node.js, Express, PostgreSQL, and Prisma; run with Docker Compose.
- `karma-frontend` — plain HTML, CSS, and JavaScript. The frontend is still being built.

## Quick start

### Backend

In PowerShell, from the repository root:

```powershell
Set-Location .\karma-backend
Copy-Item .env.example .env
```

Edit `.env` and replace the example secrets before running the services:

```powershell
docker compose up --build
```

The API listens on <http://localhost:4000>.

### Frontend

In a second PowerShell window, from the repository root:

```powershell
Set-Location .\karma-frontend
python -m http.server 3000
```

Open <http://localhost:3000>.

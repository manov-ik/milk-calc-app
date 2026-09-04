# 🥛 Milk Calc App

A full-stack milk delivery tracking application. Log daily milk quantities (AN/FN), set monthly prices, and view consolidated summaries with totals and frequency breakdowns.

## Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Recharts, React Router |
| Backend  | FastAPI, SQLAlchemy, Pydantic, Uvicorn               |
| Database | PostgreSQL (Neon serverless)                         |
| Deploy   | Netlify (frontend) · Vercel (backend)                |

## Project Structure

```
milk-calc-app/
├── src/                        # React frontend
│   ├── components/
│   │   └── dailyInput.jsx
│   ├── pages/
│   │   ├── EntryPage.jsx       # Daily milk entry grid
│   │   ├── Consolidate.jsx     # Monthly summary & charts
│   │   └── LoginPage.jsx       # Auth (login / register)
│   ├── App.jsx                 # Routes & nav
│   └── main.jsx                # Entry point
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # App init, CORS, routers
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models.py           # User, MilkEntry, MilkPrice
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── auth.py         # POST /api/auth/login & /register
│   │   │   └── milk.py         # CRUD /api/milk/month & /consolidate
│   │   └── .env                # DATABASE_URL (not committed)
│   ├── requirements.txt
│   └── vercel.json
├── .env                        # VITE_API_URL (not committed)
├── package.json
├── vite.config.js
└── index.html
```

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **PostgreSQL** database (or a [Neon](https://neon.tech) serverless instance)

## Setup & Run

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/milk-calc-app.git
cd milk-calc-app
```

### 2. Backend

```bash
# Create & activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Create the backend env file
cat > backend/app/.env << 'EOF'
DATABASE_URL = "postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
EOF
# ↑ Replace with your actual PostgreSQL connection string

# Run the backend dev server
cd backend
uvicorn app.main:app --reload
# → API running at http://127.0.0.1:8000
```

> [!IMPORTANT]
> You **must** activate the virtual environment before running `pip install` or `uvicorn`, otherwise you'll get `ModuleNotFoundError: No module named 'sqlalchemy'` (or similar).

### 3. Frontend

Open a **new terminal** (keep the backend running):

```bash
cd milk-calc-app

# Install dependencies
npm install

# Create the frontend env file
echo 'VITE_API_URL=http://127.0.0.1:8000' > .env

# Start the dev server
npm run dev
# → App running at http://localhost:5173
```

### 4. Open in browser

Visit **http://localhost:5173** — register a new account and start logging milk entries.

## API Endpoints

| Method  | Path                  | Description                      |
| ------- | --------------------- | -------------------------------- |
| POST    | `/api/auth/register`  | Create a new user                |
| POST    | `/api/auth/login`     | Authenticate & get user ID       |
| POST    | `/api/milk/month`     | Save/replace a full month        |
| PATCH   | `/api/milk/month`     | Upsert individual daily entries  |
| GET     | `/api/milk/month`     | Fetch a month's entries          |
| GET     | `/api/milk/consolidate` | Monthly totals & frequency data |

## Environment Variables

| File               | Variable       | Description                              |
| ------------------ | -------------- | ---------------------------------------- |
| `.env`             | `VITE_API_URL` | Backend URL used by the React frontend   |
| `backend/app/.env` | `DATABASE_URL` | PostgreSQL connection string for the API |

> [!NOTE]
> Both `.env` files are git-ignored. You need to create them manually.

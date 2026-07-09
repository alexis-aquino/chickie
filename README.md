# Chickie 🍗

Supply chain + customer relations dashboard for a fried-chicken kitchen.
React (Vite + Tailwind + shadcn/ui) frontend, FastAPI backend, Supabase
(Postgres + Auth) database.

## Prerequisites

- Git
- Node.js 18+
- Python 3.11+ (3.14 tested)

## Setup

### 1. Clone

```sh
git clone -b Final-Version https://github.com/alexis-aquino/chickie.git
cd chickie
```

### 2. Frontend env — create `.env.local` in the repo root

```ini
VITE_SUPABASE_URL=https://assguodmmoishsicndzl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_S7cseB57XCCY3QPtSS5F8Q_E1WKzZeR
VITE_API_BASE_URL=http://localhost:8000
```

(The publishable key is public by design — safe to commit here.)

### 3. Backend env — create `server/.env`

```ini
# Supabase dashboard -> Connect -> Direct connection string (Session pooler).
# URL-encode special characters in the password (@ -> %40, etc.)
DATABASE_URL=postgresql+psycopg://postgres.assguodmmoishsicndzl:[DB-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

SUPABASE_URL=https://assguodmmoishsicndzl.supabase.co
CORS_ORIGIN=http://localhost:5173
```

Replace `[DB-PASSWORD]` with the project's database password (ask the
project owner, or reset it in Supabase → Project Settings). No JWT secret
is needed — the backend verifies tokens via Supabase's public JWKS keys.

### 4. Run — two terminals

**Terminal 1 — frontend:**

```sh
npm install
npm run dev
```

**Terminal 2 — backend:**

```sh
python -m venv .venv
.venv\Scripts\activate        # Mac/Linux: source .venv/bin/activate
pip install -r server/requirements.txt
cd server
python -m uvicorn app.main:app --port 8000
```

### 5. Open the app

Go to <http://localhost:5173> and sign in with the email/password form.

Demo accounts (all share the "Chickie Main Branch" organization, password
`chicken123`):

| Email | Role |
|---|---|
| `owner@chickie.com` | Owner — full dashboard, orders, payments, History, Analytics, CRM |
| `staff@chickie.com` | Staff — SCM without owner-only tabs or cost data |
| `supplier@chickie.com` | Supplier — Purchases + Deliveries portal, confirms deliveries |

> Google sign-in redirects to the production Site URL unless
> `http://localhost:5173` is added to Supabase → Authentication →
> URL Configuration → Redirect URLs. Email/password login works locally
> without any changes.

## Notes

- New signups can pick Owner, Staff, or Supplier and optionally seed a
  fresh demo organization.
- Placing an order goes through a payment step (GCash / Card / QR Ph /
  Cash on Delivery — simulated, no real charge).
- Inventory quantities only increase when a delivery is **marked as
  delivered**, not when the order is placed.
- Both machines/environments talk to the same Supabase database, so data
  stays in sync everywhere.

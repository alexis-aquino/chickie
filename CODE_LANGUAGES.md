# Where Python fits in this codebase

## Where is Python

Entirely under `server/` — the backend. Nothing outside `server/` is Python.

| File | Purpose |
|---|---|
| `server/app/main.py` | Creates the FastAPI app, wires CORS, mounts the routers. |
| `server/app/config.py` | Loads settings from environment (`DATABASE_URL`, `AUTH_SECRET`, `CORS_ORIGIN`). |
| `server/app/db.py` | SQLAlchemy engine/session setup for the MySQL connection. |
| `server/app/auth.py` | Password hashing (bcrypt), JWT issuance/verification, resolving a request's bearer token to a `Principal` (user id + organization id). |
| `server/app/models.py` | SQLAlchemy ORM models for every table (organizations, users, suppliers, inventory, purchases, customers, orders, feedback, promotions). |
| `server/app/schemas.py` | Pydantic request/response schemas for the API. |
| `server/app/seed.py` | Generates sample data for a newly-registered organization. |
| `server/app/routers/auth.py` | Register / login / profile / change-password endpoints. |
| `server/app/routers/store.py` | CRUD for business data, every query scoped by `organization_id`. |
| `server/app/routers/analytics.py` | Aggregates inventory value by category and renders it as a chart image with matplotlib. |
| `server/requirements.txt` | fastapi, sqlalchemy, pymysql, bcrypt, pyjwt, matplotlib, pydantic-settings. |
| `server/schema.sql` | MySQL DDL — creates every table. |

Everything else — the entire UI (`src/pages/`, `src/sections/`, `src/components/`), routing, state management (`src/lib/`, `src/hooks/`), and build config — is TypeScript/React, built with Vite. That's the majority of the codebase by file count and line count.

## What Python's purpose is

The backend is the **only** thing allowed to touch the database or know a password. Concretely, it's the sole place that:

- hashes and verifies passwords, and issues/verifies this app's JWTs (`auth.py`),
- resolves which organization a logged-in user belongs to,
- scopes every single database query to that `organization_id`, so one business's suppliers/customers/inventory can never leak into another's, and
- runs the analytics chart aggregation and rendering.

The frontend never talks to MySQL directly and never sees a password hash or a JWT secret — it only ever calls this API with a bearer token. If the backend is down, nothing works: not just data, but login itself.

## Why we didn't code the whole thing in Python

Because the two halves of this app do fundamentally different jobs, and each language fits its job better:

- **The frontend is a UI.** It renders screens, manages form/dialog state, and reacts to clicks — that's what React/TypeScript is for. Writing a dashboard's worth of interactive components (tables, dialogs, tabs, live-updating stat cards) in Python would mean fighting the language for something it's not built for (there's no mainstream way to ship a Python UI to a browser without compiling it to JS anyway, e.g. Pyodide/Brython — that would be strictly worse than just writing TypeScript).
- **The backend is a trust boundary.** It needs to run somewhere the client can't tamper with, own the database credentials, and enforce authorization server-side. That's a natural fit for a small typed API service — FastAPI/Python was already the team's choice for this from the earlier `euhan1` branch, so this rewrite kept that rather than introducing a third language.
- Splitting them also means the browser only ever gets what it needs to render — no database driver, no password hashes, no MySQL connection string shipped to the client. A single-language app that also touches the database from the browser process would have to either expose credentials client-side or reinvent this same client/server split anyway.

So it's not that Python "lost" to TypeScript for the UI — they're doing different jobs, and using both means each side is doing the job it's actually good at.

## Where is MySQL

Running **locally** via XAMPP (`C:\xampp\mysql`), not hosted anywhere. The Python backend connects with SQLAlchemy using a `mysql+pymysql://` URL (`server/db.py`, `server/.env`). Setup:

```
mysql -u root -e "CREATE DATABASE IF NOT EXISTS chickie"
mysql -u root chickie < server/schema.sql
```

(`start.bat` does both of these automatically.) `server/schema.sql` defines `organizations`, `users`, `suppliers`, `inventory_items`, `purchase_records`, `customers`, `customer_orders`, `feedback_records`, and `promotions`. All primary/foreign keys are `CHAR(36)` UUID strings (MySQL has no native UUID type), and array-like fields (categories, tags, order line items, etc.) are MySQL `JSON` columns.

## The analytics chart

The SCM dashboard's Analytics tab used to be a client-side Recharts bar chart. It's now `server/app/routers/analytics.py`: the backend aggregates inventory value by category itself and renders the chart with `matplotlib`, returning a PNG. `src/sections/scm/CategoryChart.tsx` just fetches that image (with its auth header) and displays it in an `<img>`. Recharts is no longer a dependency at all.

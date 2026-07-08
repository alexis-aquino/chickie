# The Python Backend — Purpose, File Guide, and How It Fits the Rest of the System

This document explains every Python file in the project (`server/`), what it does, and how it connects to the MySQL database and the TypeScript/React frontend. Written for walking a panel through the implementation.

## 1. System architecture in one paragraph

Chickie is a three-tier application: a **React/TypeScript single-page app** (`src/`) that runs in the browser and renders the UI; a **Python/FastAPI backend** (`server/`) that is the only thing allowed to talk to the database, and that owns authentication; and a **local MySQL database** that stores all persistent data. The frontend never queries the database directly — every read or write goes through an HTTP request to the backend, authenticated with a JSON Web Token (JWT). This is a standard three-tier separation: presentation layer, application/business-logic layer, data layer.

```
Browser (React/TS)  --HTTP + JWT-->  FastAPI (Python)  --SQL-->  MySQL
```

## 2. Why the backend exists at all (its purpose)

Three responsibilities are concentrated in the Python backend, and deliberately nowhere else:

1. **Authentication** — proving a user is who they claim to be. The backend hashes and checks passwords, and issues/verifies the JWTs that represent a logged-in session.
2. **Authorization / multi-tenancy** — this app serves multiple businesses ("organizations") from one database. Every single query is scoped to `organization_id` so Business A can never see Business B's suppliers, customers, or inventory. That scoping logic lives in one place (the backend) instead of being re-implemented, and possibly forgotten, in every screen of the frontend.
3. **Data access and business rules** — e.g., when a purchase order is recorded, the backend is the one place that updates the corresponding inventory item's on-hand quantity, unit cost, and supplier in the same database transaction, so that operation can't be left half-done.

Keeping this in a separate backend process (rather than letting the browser talk to MySQL directly) means the database credentials and the JWT signing secret never leave the server — a browser can only ever hold a short-lived access token, never a password hash or a connection string.

## 3. File-by-file guide

### `server/app/main.py` — application entrypoint
Creates the single `FastAPI()` application object, attaches CORS middleware (so the browser, running on a different port, is allowed to call this API — see `CORS_ORIGIN` below), and mounts the three router modules (`auth`, `store`, `analytics`) onto it. Also defines `GET /health`, a trivial liveness check. This is the file `uvicorn app.main:app` points at to actually run the server.

### `server/app/config.py` — configuration
A `pydantic-settings` `Settings` class that reads environment variables (from a `.env` file locally) into typed fields:
- `database_url` — the MySQL connection string.
- `auth_secret` — the symmetric key used to sign and verify JWTs. If this leaks, an attacker could forge login tokens, so it's generated randomly per install and never committed to version control.
- `cors_origin` — which frontend origin is allowed to call the API (defaults to the Vite dev server, `http://localhost:5173`).
- `access_token_expire_minutes` — how long a login session is valid before the user must sign in again.

Centralizing configuration here means no file reaches into `os.environ` directly — everything imports `settings` from this one module, which is a single, typed, validated source of truth.

### `server/app/db.py` — database connection
Creates one SQLAlchemy `engine` bound to `settings.database_url`, and a `SessionLocal` factory for opening database sessions. `pool_pre_ping=True` makes SQLAlchemy test a connection before reusing it from the pool, so a MySQL restart doesn't surface as a mysterious query failure later. `get_db()` is a FastAPI dependency — a generator that yields one session per request and always closes it afterward (via `try`/`finally`), even if the request raised an exception. Every route that needs the database declares `db: Session = Depends(get_db)` and FastAPI wires this up automatically per-request.

### `server/app/models.py` — ORM schema (SQLAlchemy)
Defines one Python class per database table (`Organization`, `User`, `Supplier`, `InventoryItem`, `PurchaseRecord`, `Customer`, `CustomerOrder`, `FeedbackRecord`, `Promotion`), using SQLAlchemy's typed `Mapped[...]` declarative style. Each class maps 1:1 to a `CREATE TABLE` in `server/schema.sql`. A few implementation notes worth being able to explain:
- **Primary/foreign keys are `CHAR(36)` strings holding UUIDs**, generated in Python with `uuid.uuid4()`, rather than MySQL auto-increment integers. This avoids ever exposing a guessable sequential ID (`/api/inventory-items/1`, `/2`, `/3`...) and makes IDs safe to generate client-side or across services without collision.
- **List-like fields use MySQL's `JSON` column type** (e.g. `Supplier.categories`, `Customer.tags`, `CustomerOrder.items`) because MySQL has no native array type. SQLAlchemy transparently serializes/deserializes these to Python lists/dicts.
- **Every business table has an `organization_id` foreign key and an index on it** — that column is what every query filters on to enforce multi-tenancy (see `auth.py` and `routers/store.py` below).

### `server/app/schemas.py` — API contracts (Pydantic)
Defines the shape of every HTTP request body and response — completely separate from the database models in `models.py`. This separation matters: `models.py` describes what's *stored*, `schemas.py` describes what's *sent over the wire*, and they're allowed to differ (e.g. a `User` row has a `password_hash` column that must never appear in any API response — `UserProfile` in this file simply doesn't include it). All schemas inherit from a shared `CamelModel` base that auto-converts between Python's `snake_case` convention and JavaScript's `camelCase` convention (`organization_id` ⇄ `organizationId`), so neither side of the stack has to compromise on its own naming style.

### `server/app/auth.py` — password hashing, JWTs, and the auth dependency
The security core of the backend:
- `hash_password()` / `verify_password()` wrap the `bcrypt` library. Passwords are never stored or compared in plaintext — bcrypt produces a salted, one-way hash, so even if the database were leaked, raw passwords aren't recoverable from it.
- `create_access_token(user_id)` builds a signed JWT (HS256) containing the user's ID and an expiry timestamp, signed with `settings.auth_secret`.
- `get_current_principal()` is a FastAPI dependency used by nearly every protected route. It reads the `Authorization: Bearer <token>` header, verifies the JWT's signature and expiry, looks up the corresponding `User` row, and returns a small `Principal(user_id, organization_id)` object. If the token is missing, invalid, or expired, it raises `401 Unauthorized` *before* the route handler's own code ever runs — so authorization is enforced structurally, not by remembering to check it in every function.

### `server/app/seed.py` — demo data generation
When a new account signs up with "populate with sample data" checked, `seed_demo_data()` runs and inserts a small but realistic dataset (three suppliers, six inventory items across categories, a couple of purchase records, two customers with an order and feedback, and a promotion) scoped to that brand-new organization. This exists purely so a first-time user (or a thesis panel) sees a populated dashboard instead of an empty one immediately after registering.

### `server/app/routers/auth.py` — identity endpoints
Implements the backend acting as its own identity provider:
- `POST /api/auth/register` — creates a new `Organization` and its first `User` (the owner) in one database transaction, hashes the supplied password, optionally calls `seed_demo_data()`, and returns a ready-to-use access token plus the new profile.
- `POST /api/auth/login` — looks up the user by email, verifies the password with `verify_password()`, and returns a fresh token.
- `GET /api/auth/me` / `PATCH /api/auth/me` — fetch or update the logged-in user's own profile (name, phone, bio, avatar, theme, accent color).
- `POST /api/auth/change-password` — requires the *current* password before accepting a new one, so a stolen but still-logged-in browser session can't silently take over the account.

### `server/app/routers/store.py` — business-data CRUD
The largest router — every endpoint here is `Depends(get_current_principal)`, so every query is filtered by `principal.organization_id`. Highlights:
- `GET /api/store` returns one consolidated `StoreSnapshot` (all suppliers, inventory, purchase history, customers with their nested orders/feedback, and promotions for the caller's organization) in a single request, which is what the frontend loads once on login rather than firing off half a dozen separate calls.
- `POST /api/purchase-records` demonstrates a small business rule enforced server-side: submitting a batch of purchase-order line items doesn't just insert rows — it also aggregates quantity-per-item across the batch and bumps the matching `InventoryItem`'s on-hand quantity, unit cost, and supplier, all inside the same transaction (`db.commit()` at the end), so the two writes can't end up inconsistent with each other.
- The delete/patch endpoints (`delete_inventory_item`, `mark_delivered`, `activate_promotion`) all follow the same shape: look the row up by ID, verify its `organization_id` matches the caller's *before* touching it (so a valid token from Organization A can never modify Organization B's row even if it somehow guessed a real ID), then mutate and commit.

### `server/app/routers/analytics.py` — chart generation
`GET /api/analytics/inventory-by-category.png` — the backend queries the current organization's inventory, aggregates on-hand value (`quantity × unit_cost`) grouped by category in plain Python, and renders a bar chart with `matplotlib` (using the non-interactive `Agg` backend, since this is a headless server with no display) directly to a PNG in memory (`io.BytesIO`), which is returned as the HTTP response body with `media_type="image/png"`. The frontend just displays this in an `<img>` tag — there is no client-side charting library involved for this view; the image itself *is* the chart, generated fresh on every request from live data.

### `server/requirements.txt` — dependencies
Pins the exact library versions the backend needs: `fastapi` (the web framework), `uvicorn` (the ASGI server that actually runs it), `sqlalchemy` + `pymysql` (ORM and MySQL driver), `bcrypt` + `pyjwt` (the auth primitives described above), `pydantic-settings` (typed config), and `matplotlib` (chart rendering).

### `server/schema.sql` — the database schema itself
Plain MySQL DDL, one `CREATE TABLE IF NOT EXISTS` per table, mirroring `models.py` column-for-column. This is the file actually executed against MySQL to create the schema (`mysql -u root chickie < server/schema.sql`); `models.py` is Python's typed *view* of these same tables for use with the ORM.

## 4. How this connects to "the implementation of the others"

- **Frontend (TypeScript/React, `src/`).** The frontend never imports anything from `server/` and has no MySQL driver — it only knows how to speak HTTP. `src/lib/api-client.ts` is the single module responsible for calling the backend: it attaches the JWT (read from `localStorage`) to every request as an `Authorization` header, and every other frontend module (`src/lib/auth-context.tsx`, `src/lib/store-context.tsx`) goes through it rather than calling `fetch` directly. This means the entire frontend/backend contract is defined in two places that must agree: `server/app/schemas.py` on the Python side and the hand-written TypeScript interfaces in `src/types/` on the other — the shared `camelCase` convention (via `CamelModel`) is what keeps a request built in TypeScript and parsed in Python speaking the same shape without a code generator.
- **Database (MySQL).** The backend is the *only* component with MySQL credentials. `server/schema.sql` is applied once to create the tables; after that, all reads and writes happen exclusively through SQLAlchemy sessions opened by `get_db()` inside route handlers — never raw, unparameterized SQL, which is also what protects the app from SQL injection (SQLAlchemy parameterizes every query it builds).
- **Local orchestration (`start.bat`).** Ties all three pieces together for a single-command local run: starts MySQL (XAMPP), applies `schema.sql` if needed, creates the Python virtual environment and installs `requirements.txt`, installs the frontend's `node_modules`, then launches `uvicorn` (backend) and `vite` (frontend) as separate processes that talk to each other purely over HTTP on `localhost`.

## 5. Anticipated questions

**Q: Why not let the frontend talk to MySQL directly (e.g. with a Node MySQL driver)?**
Because that would mean shipping database credentials to the browser, and every user would need direct query access to enforce their own authorization — there'd be nothing stopping a modified client from querying another organization's data. Centralizing data access in a backend process is what makes the `organization_id` scoping enforceable at all.

**Q: Why FastAPI specifically, and not Flask/Django?**
FastAPI gives request/response validation "for free" via Pydantic (`schemas.py`) — a malformed request body is rejected automatically with a 422 before the route's own code ever runs — and its dependency-injection system (`Depends(...)`) is what makes `get_current_principal` and `get_db` reusable across every route with one line each, rather than repeated boilerplate.

**Q: Why hash passwords with bcrypt instead of storing them plainly or with a fast hash like MD5/SHA-256?**
Bcrypt is deliberately slow and includes a random salt per password, which makes both brute-force guessing and precomputed rainbow-table attacks impractical even if the `users` table were ever exposed. A fast general-purpose hash like SHA-256 is the wrong tool here precisely because it's fast — that speed helps an attacker as much as it helps you.

**Q: What stops one organization from reading another's data?**
Two layers: every table has an `organization_id` column, and every single query in `routers/store.py` filters on `principal.organization_id`, which itself comes only from a verified JWT (`get_current_principal`) — never from a client-supplied parameter. There is no code path where a request can specify *which* organization's data it wants; it's always whichever organization the authenticated token belongs to.

**Q: Why is the chart a server-rendered image instead of raw data the frontend graphs?**
This was a deliberate implementation choice to demonstrate the backend producing a finished visual artifact (via `matplotlib`) rather than just JSON — the aggregation, styling, and rendering all happen in Python, and the frontend's job is reduced to displaying an image it's given, the same way it would display a photo.
